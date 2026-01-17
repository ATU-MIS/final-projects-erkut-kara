import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SearchTicketDto } from './dto/search-ticket.dto';
import { Ticket, TicketStatus, Prisma, PaymentStatus } from '@prisma/client';
import { TicketGateway } from './ticket.gateway';
import { SeatUpdateEvent, SeatUpdateEventType } from './events/seat-update.event';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TicketGateway))
    private ticketGateway: TicketGateway,
  ) {}

  async create(createTicketDto: CreateTicketDto, userId: string, userRole: string): Promise<Ticket> {
    // Determine Ticket Owner (userId) and Issuer (issuedById)
    let ticketOwnerId: string | null = null;
    const issuerId = userId; 

    if (userRole === 'CUSTOMER') {
      ticketOwnerId = userId;
    } else {
      ticketOwnerId = null; 
    }

    // Validate route exists
    const route = await this.prisma.route.findUnique({
      where: { id: createTicketDto.routeId },
      include: {
        bus: true,
        prices: true,
        routeStations: { orderBy: { order: 'asc' } }
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${createTicketDto.routeId} not found`);
    }

    if (!route.isActive) {
      throw new BadRequestException('Cannot book tickets for inactive routes');
    }

    if (userRole === 'CUSTOMER' && new Date(route.departureTime) < new Date()) {
       throw new BadRequestException('Cannot book tickets for a route that has already departed');
    }

    if (createTicketDto.seatNumber > route.bus.seatCount) {
      throw new BadRequestException(
        `Invalid seat number. Bus has only ${route.bus.seatCount} seats`,
      );
    }

    // --- Segmented Booking Logic Update ---
    const fullStops = [route.fromCity, ...route.routeStations.map(s => s.station), route.toCity].map(s => s.trim().toLowerCase());
    
    const fromIndex = fullStops.indexOf(createTicketDto.fromCity.trim().toLowerCase());
    const toIndex = fullStops.indexOf(createTicketDto.toCity.trim().toLowerCase());

    if (fromIndex === -1 || toIndex === -1) {
      throw new BadRequestException('Invalid departure or arrival city for this route');
    }

    if (fromIndex >= toIndex) {
      throw new BadRequestException('Arrival stop must be after departure stop');
    }

    // --- 15-minute Cutoff Logic ---
    let checkTime = route.departureTime;
    if (fromIndex > 0) {
        const station = route.routeStations[fromIndex - 1]; 
        if (station) checkTime = station.time;
    }

    if (userRole === 'CUSTOMER') {
      const now = new Date();
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
      if (checkTime < fifteenMinutesLater) {
        throw new BadRequestException('Ticket sales for this route segment close 15 minutes before departure.');
      }
    }

    // 3. Check Availability for Segment
    const conflictingTicket = await this.prisma.ticket.findFirst({
      where: {
        routeId: createTicketDto.routeId,
        seatNumber: createTicketDto.seatNumber,
        status: {
          in: [TicketStatus.RESERVED, TicketStatus.CONFIRMED],
        },
        AND: [
          { fromStopIndex: { lt: toIndex } },
          { toStopIndex: { gt: fromIndex } },
        ],
      },
    });

    if (conflictingTicket) {
      throw new ConflictException(
        `Seat ${createTicketDto.seatNumber} is already booked for the selected segment`,
      );
    }

    // 4. Determine Price
    let price = route.price;
    const segmentPrice = route.prices.find(
      p => p.fromCity.toLowerCase() === createTicketDto.fromCity.toLowerCase() && 
           p.toCity.toLowerCase() === createTicketDto.toCity.toLowerCase()
    );

    if (segmentPrice) {
      if (!segmentPrice.isSold) {
        throw new BadRequestException('Tickets are not sold for this specific route segment');
      }
      price = segmentPrice.price;
    }

    const pnrNumber = await this.generatePNR();

    const isAgentSale = userRole === 'AGENT' || userRole === 'ADMIN';
    const initialStatus = isAgentSale ? TicketStatus.CONFIRMED : TicketStatus.RESERVED;
    const initialPaymentStatus = isAgentSale ? PaymentStatus.PAID : PaymentStatus.PENDING;

    const ticket = await this.prisma.ticket.create({
      data: {
        pnrNumber,
        routeId: createTicketDto.routeId,
        userId: ticketOwnerId,
        issuedById: issuerId,
        fromCity: createTicketDto.fromCity,
        toCity: createTicketDto.toCity,
        fromStopIndex: fromIndex,
        toStopIndex: toIndex,
        seatNumber: createTicketDto.seatNumber,
        gender: createTicketDto.gender,
        price,
        tcKimlikNo: createTicketDto.tcKimlikNo,
        userPhoneNumber: createTicketDto.userPhoneNumber,
        passengerName: createTicketDto.passengerName,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
      },
      include: {
        route: {
          include: {
            bus: {
              include: {
                specs: true,
              },
            },
          },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        issuedBy: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    // Emit event based on status
    if (isAgentSale) {
        this.ticketGateway.emitSeatConfirmed(
            new SeatUpdateEvent({
                routeId: ticket.routeId,
                seatNumber: ticket.seatNumber,
                eventType: SeatUpdateEventType.SEAT_CONFIRMED,
                ticketId: ticket.id,
                pnrNumber: ticket.pnrNumber,
                fromStopIndex: ticket.fromStopIndex,
                toStopIndex: ticket.toStopIndex,
                timestamp: new Date(),
                metadata: {
                    fromCity: ticket.fromCity,
                    toCity: ticket.toCity,
                    price: ticket.price,
                },
            })
        );
    } else {
        this.ticketGateway.emitSeatReserved(
            new SeatUpdateEvent({
                routeId: ticket.routeId,
                seatNumber: ticket.seatNumber,
                eventType: SeatUpdateEventType.SEAT_RESERVED,
                ticketId: ticket.id,
                pnrNumber: ticket.pnrNumber,
                fromStopIndex: ticket.fromStopIndex,
                toStopIndex: ticket.toStopIndex,
                timestamp: new Date(),
                metadata: {
                    fromCity: ticket.fromCity,
                    toCity: ticket.toCity,
                    price: ticket.price,
                    gender: ticket.gender,
                },
            })
        );
    }

    return ticket;
  }

  async getAvailableSeats(routeId: string, fromCity?: string, toCity?: string): Promise<number[]> {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        bus: true,
        routeStations: { orderBy: { order: 'asc' } },
        tickets: {
          where: {
            status: { in: [TicketStatus.RESERVED, TicketStatus.CONFIRMED] },
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${routeId} not found`);
    }

    const fullStops = [route.fromCity, ...route.routeStations.map(s => s.station), route.toCity].map(s => s.trim().toLocaleLowerCase('tr-TR'));
    
    let checkFromIndex = 0;
    let checkToIndex = fullStops.length - 1;

    if (fromCity && toCity) {
      checkFromIndex = fullStops.indexOf(fromCity.trim().toLocaleLowerCase('tr-TR'));
      checkToIndex = fullStops.indexOf(toCity.trim().toLocaleLowerCase('tr-TR'));

      if (checkFromIndex === -1 || checkToIndex === -1) {
        checkFromIndex = 0;
        checkToIndex = fullStops.length - 1;
      }
    }

    const conflictingSeats = route.tickets
      .filter(ticket => {
        return (ticket.fromStopIndex < checkToIndex) && (ticket.toStopIndex > checkFromIndex);
      })
      .map(ticket => ticket.seatNumber);

    const allSeats = Array.from({ length: route.bus.seatCount }, (_, i) => i + 1);
    return allSeats.filter((seat) => !conflictingSeats.includes(seat));
  }

  async findAll(params?: { status?: TicketStatus; paymentStatus?: string; userId?: string; issuedById?: string; }) {
    const where: Prisma.TicketWhereInput = {};
    if (params?.status) where.status = params.status;
    if (params?.paymentStatus) where.paymentStatus = params.paymentStatus as PaymentStatus;
    if (params?.userId) where.userId = params.userId;
    if (params?.issuedById) where.issuedById = params.issuedById;

    return this.prisma.ticket.findMany({
      where,
      include: {
        route: { include: { bus: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(searchDto: SearchTicketDto) {
    const where: Prisma.TicketWhereInput = {};

    if (searchDto.pnrNumber) {
        where.pnrNumber = { contains: searchDto.pnrNumber, mode: 'insensitive' };
    }
    // Add support for phone and TC search via generic query if DTO supports it or use existing fields
    // Assuming DTO has userPhoneNumber and tcKimlikNo as optional
    if (searchDto.userPhoneNumber) {
        where.userPhoneNumber = { contains: searchDto.userPhoneNumber };
    }
    if (searchDto.tcKimlikNo) {
        where.tcKimlikNo = { contains: searchDto.tcKimlikNo };
    }
    
    return this.prisma.ticket.findMany({
        where,
        include: { 
            route: { include: { bus: true } },
            user: true
        },
        orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        route: { include: { bus: { include: { specs: true } }, routeStations: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket with ID ${id} not found`);
    return ticket;
  }

  async findByPNR(pnrNumber: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { pnrNumber },
      include: {
        route: { include: { bus: { include: { specs: true } }, routeStations: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket with PNR ${pnrNumber} not found`);
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (ticket.userId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Only owner or admin can update');
    
    return this.prisma.ticket.update({
      where: { id },
      data: {
        seatNumber: updateTicketDto.seatNumber,
        passengerName: updateTicketDto.passengerName,
        userPhoneNumber: updateTicketDto.userPhoneNumber,
        gender: updateTicketDto.gender
      },
      include: { route: { include: { bus: true } } }
    });
  }

  async confirm(id: string, userId: string, userRole: string): Promise<Ticket> {
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID },
      include: { route: true }
    });
    return updatedTicket;
  }

  async suspend(id: string, userRole: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.SUSPENDED, suspendedAt: new Date() },
      include: { route: true }
    });
  }

  async cancel(id: string, userId: string, userRole: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.CANCELLED, cancelledAt: new Date() },
      include: { route: true }
    });
  }

  async getUserTickets(userId: string, status?: TicketStatus) {
    return this.prisma.ticket.findMany({
      where: { userId, status },
      include: { route: { include: { bus: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStats() {
    return { total: await this.prisma.ticket.count() };
  }

  private async generatePNR(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr: string;
    let exists = true;

    while (exists) {
      // Format: VV00 + 5 Random Chars (Total 9)
      let randomPart = '';
      for (let i = 0; i < 5; i++) {
        randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      pnr = `VV00${randomPart}`;

      const existing = await this.prisma.ticket.findUnique({
        where: { pnrNumber: pnr },
      });

      exists = !!existing;
    }

    return pnr;
  }
}