import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRouteDto } from './dto/search-route.dto';
import { Route, Prisma } from '@prisma/client';

@Injectable()
export class RouteService {
  constructor(private prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    console.log('Create Route Payload Prices:', createRouteDto.prices?.length); 

    const bus = await this.prisma.bus.findUnique({
      where: { id: createRouteDto.busId },
    });

    if (!bus) {
      throw new NotFoundException(`Bus with ID ${createRouteDto.busId} not found`);
    }

    const departureTime = new Date(createRouteDto.departureTime);
    const arrivalTime = new Date(createRouteDto.arrivalTime);

    if (arrivalTime <= departureTime) {
      throw new BadRequestException('Arrival time must be after departure time');
    }

    const routeStationsData = createRouteDto.stations?.map((s, index) => ({
        station: s.station,
        time: new Date(s.time),
        order: index
    })) || [];

    const route = await this.prisma.route.create({
      data: {
        fromCity: createRouteDto.fromCity,
        toCity: createRouteDto.toCity,
        routeStations: {
            create: routeStationsData
        },
        departureTime,
        arrivalTime,
        price: createRouteDto.price,
        type: createRouteDto.type || 'STANDARD',
        busId: createRouteDto.busId,
        captainName: createRouteDto.captainName,
        firstDriverName: createRouteDto.firstDriverName,
        secondDriverName: createRouteDto.secondDriverName,
        assistantName: createRouteDto.assistantName,
        restStops: createRouteDto.restStops || [],
        prices: {
          create: createRouteDto.prices || [],
        },
      },
      include: {
        bus: {
          include: {
            specs: true,
          },
        },
        routeStations: true, 
        prices: true,
      },
    });

    return route;
  }

  async findAll(params?: {
    isActive?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.type) {
      where.type = params.type as any;
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        include: {
          bus: {
            include: {
              specs: true,
            },
          },
          routeStations: {
              orderBy: { order: 'asc' }
          },
          prices: true,
          _count: {
            select: { tickets: true },
          },
        },
        orderBy: {
          departureTime: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.route.count({ where }),
    ]);

    const mappedRoutes = routes.map(route => ({
        ...route,
        stations: route.routeStations.map(s => s.station)
    }));

    return {
      data: mappedRoutes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(searchDto: SearchRouteDto) {
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};

    if (searchDto.fromCity && searchDto.toCity) {
      where.AND = [
        {
          OR: [
            { fromCity: { contains: searchDto.fromCity, mode: 'insensitive' } },
            { routeStations: { some: { station: { contains: searchDto.fromCity, mode: 'insensitive' } } } },
          ]
        },
        {
          OR: [
            { toCity: { contains: searchDto.toCity, mode: 'insensitive' } },
            { routeStations: { some: { station: { contains: searchDto.toCity, mode: 'insensitive' } } } },
          ]
        }
      ];
    } else {
      if (searchDto.fromCity) {
        where.OR = [
          { fromCity: { contains: searchDto.fromCity, mode: 'insensitive' } },
          { routeStations: { some: { station: { contains: searchDto.fromCity, mode: 'insensitive' } } } },
        ];
      }
      if (searchDto.toCity) {
        where.OR = [
          { toCity: { contains: searchDto.toCity, mode: 'insensitive' } },
          { routeStations: { some: { station: { contains: searchDto.toCity, mode: 'insensitive' } } } },
        ];
      }
    }

    if (searchDto.date) {
      const searchDate = new Date(searchDto.date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      
      // If Admin (ignoreTimeCheck), do NOT expand backwards. Only show selected day + night buffer.
      // If Customer, expand backwards to catch previous day's buses arriving today.
      const isCustomer = searchDto.ignoreTimeCheck !== 'true';
      
      const queryStart = isCustomer 
          ? new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000) // Previous Day
          : startOfDay; // Selected Day

      const endOfWindow = new Date(startOfDay.getTime() + 27 * 60 * 60 * 1000);

      where.departureTime = {
        gte: queryStart,
        lte: endOfWindow,
      };
    }

    if (searchDto.type) {
      where.type = searchDto.type;
    }

    if (searchDto.busId) {
      where.busId = searchDto.busId;
    }

    if (searchDto.isActive !== undefined) {
      where.isActive = searchDto.isActive === 'true';
    } else {
        if (searchDto.ignoreTimeCheck !== 'true') {
            where.isActive = true;
        }
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        include: {
          bus: {
            include: {
              specs: true,
              layout: true,
              features: true // Add this to return dynamic features
            },
          },
          routeStations: {
              orderBy: { order: 'asc' }
          },
          prices: true,
          tickets: {
            where: {
              status: {
                in: ['RESERVED', 'CONFIRMED'],
              },
            },
            select: {
              seatNumber: true,
              fromStopIndex: true,
              toStopIndex: true,
            },
          },
        },
        orderBy: [
          { departureTime: 'asc' },
          { price: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.route.count({ where }),
    ]);

    const filteredRoutes = routes.filter(route => {
      let checkTime = route.departureTime;
      if (searchDto.fromCity && searchDto.fromCity.trim().toLowerCase() !== route.fromCity.trim().toLowerCase()) {
          const station = route.routeStations.find(s => s.station.toLowerCase().includes(searchDto.fromCity!.toLowerCase()));
          if (station) checkTime = station.time;
      }

      const now = new Date();
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
      
      if (searchDto.date && searchDto.ignoreTimeCheck !== 'true') {
          const searchStart = new Date(searchDto.date);
          searchStart.setHours(0,0,0,0);
          const searchEnd = new Date(searchStart.getTime() + 27 * 60 * 60 * 1000); 
          
          if (checkTime < searchStart || checkTime > searchEnd) {
              return false;
          }
      }

      if (searchDto.ignoreTimeCheck !== 'true') {
          if (checkTime < fifteenMinutesLater) return false;
      }

      if (!searchDto.fromCity || !searchDto.toCity) return true;

      const segmentPrice = route.prices.find(
        p => p.fromCity.toLowerCase().includes(searchDto.fromCity!.toLowerCase()) && 
             p.toCity.toLowerCase().includes(searchDto.toCity!.toLowerCase())
      );

      if (segmentPrice && segmentPrice.isSold) {
        return true;
      }
      
      const isFullRoute = 
        route.fromCity.toLowerCase().includes(searchDto.fromCity!.toLowerCase()) &&
        route.toCity.toLowerCase().includes(searchDto.toCity!.toLowerCase());
        
      if (isFullRoute && !segmentPrice) {
        return true;
      }

      return false;
    });

    const validRoutes = filteredRoutes;

    const routesWithDetails = validRoutes.map((route) => {
      let displayPrice = route.price;
      
      let searchFromIndex = 0;
      let searchToIndex = route.routeStations.length + 1;

      const fullStops = [route.fromCity, ...route.routeStations.map(s => s.station), route.toCity].map(s => s.trim().toLocaleLowerCase('tr-TR'));

      if (searchDto.fromCity && searchDto.toCity) {
        searchFromIndex = fullStops.indexOf(searchDto.fromCity.trim().toLocaleLowerCase('tr-TR'));
        searchToIndex = fullStops.indexOf(searchDto.toCity.trim().toLocaleLowerCase('tr-TR'));

        if (searchFromIndex === -1) searchFromIndex = 0;
        if (searchToIndex === -1) searchToIndex = fullStops.length - 1;

        const segmentPrice = route.prices.find(
          p => p.fromCity.toLowerCase().includes(searchDto.fromCity!.toLowerCase()) && 
               p.toCity.toLowerCase().includes(searchDto.toCity!.toLowerCase())
        );

        if (segmentPrice) {
          displayPrice = segmentPrice.price;
        }
      }

      const occupiedSeatCount = new Set(
        route.tickets
          .filter(ticket => {
            if (!searchDto.fromCity || !searchDto.toCity) return true;
            return (ticket.fromStopIndex < searchToIndex) && (ticket.toStopIndex > searchFromIndex);
          })
          .map(t => t.seatNumber)
      ).size;
      
      const { tickets, ...routeData } = route;

      // Determine user departure time
      let userDepartureTime = route.departureTime;
      if (searchDto.fromCity) {
          const station = route.routeStations.find(s => s.station.toLocaleLowerCase('tr-TR').includes(searchDto.fromCity!.toLocaleLowerCase('tr-TR')));
          if (station) userDepartureTime = station.time;
      }

      // Determine user arrival time
      let userArrivalTime = route.arrivalTime;
      if (searchDto.toCity) {
          const station = route.routeStations.find(s => s.station.toLocaleLowerCase('tr-TR').includes(searchDto.toCity!.toLocaleLowerCase('tr-TR')));
          if (station) userArrivalTime = station.time;
      }

      let dateInfo = '';
      const departureHour = userDepartureTime.getHours();
      if (departureHour >= 0 && departureHour <= 3) {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const currentDayIndex = userDepartureTime.getDay();
        const prevDayIndex = (currentDayIndex === 0) ? 6 : currentDayIndex - 1;
        const prevDayName = days[prevDayIndex];
        const currentDayName = days[currentDayIndex];
        dateInfo = `${prevDayName}'ı ${currentDayName}'a bağlayan gece`;
      }

      return {
        ...routeData,
        mainDepartureTime: route.departureTime,
        departureTime: userDepartureTime, 
        arrivalTime: userArrivalTime, // Override with user's arrival time
        price: displayPrice,
        availableSeats: route.bus.seatCount - occupiedSeatCount,
        duration: this.calculateDuration(userDepartureTime, userArrivalTime), // Recalculate duration
        dateInfo,
        stations: route.routeStations.map(s => s.station),
        routeStations: route.routeStations 
      };
    });

    routesWithDetails.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    return {
      data: routesWithDetails,
      meta: {
        total: validRoutes.length,
        page,
        limit,
        totalPages: Math.ceil(validRoutes.length / limit),
      },
    };
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        bus: {
          include: {
            specs: true,
            layout: true 
          },
        },
        routeStations: { orderBy: { order: 'asc' } },
        tickets: {
          select: {
            id: true,
            seatNumber: true,
            status: true,
          },
        },
        prices: true,
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    console.log('Update Route Payload Prices:', updateRouteDto.prices?.length); 

    const existingRoute = await this.prisma.route.findUnique({
      where: { id },
      include: {
        tickets: {
          where: {
            status: {
              in: ['RESERVED', 'CONFIRMED'],
            },
          },
        },
      },
    });

    if (!existingRoute) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    const { stations, prices, ...scalarData } = updateRouteDto;
    
    if (stations) {
        await this.prisma.routeStation.deleteMany({ where: { routeId: id } });
        const routeStationsData = stations.map((s, index) => ({
            routeId: id,
            station: s.station,
            time: new Date(s.time),
            order: index
        }));
        await this.prisma.routeStation.createMany({ data: routeStationsData });
    }

    if (prices) {
        await this.prisma.routePrice.deleteMany({ where: { routeId: id } });
        const routePricesData = prices.map(p => ({
            routeId: id,
            fromCity: p.fromCity,
            toCity: p.toCity,
            price: p.price,
            isSold: p.isSold
        }));
        await this.prisma.routePrice.createMany({ data: routePricesData });
    }

    return this.prisma.route.update({
        where: { id },
        data: scalarData,
        include: { routeStations: true, prices: true }
    });
  }

  async remove(id: string): Promise<Route> {
    await this.findOne(id);
    return this.prisma.route.delete({ where: { id } });
  }

  async getUpcomingRoutes(fromCity?: string, toCity?: string, days: number = 7) {
      return []; 
  }

  async getPopularRoutes(limit: number = 10) {
      return []; 
  }

  async getRouteStats() {
      return { total: 0, active: 0, inactive: 0, byType: {} }; 
  }

  async getDestinations(fromCity: string) {
    const routes = await this.prisma.route.findMany({
      where: {
        isActive: true,
        OR: [
          { fromCity: { equals: fromCity, mode: 'insensitive' } },
          { routeStations: { some: { station: { equals: fromCity, mode: 'insensitive' } } } }
        ]
      },
      include: {
        routeStations: { orderBy: { order: 'asc' } }
      }
    });

    const destinations = new Set<string>();

    routes.forEach(route => {
      const fullStops = [route.fromCity, ...route.routeStations.map(s => s.station), route.toCity];
      const fromIndex = fullStops.findIndex(s => s.trim().toLocaleLowerCase('tr-TR') === fromCity.trim().toLocaleLowerCase('tr-TR'));

      if (fromIndex !== -1) {
        for (let i = fromIndex + 1; i < fullStops.length; i++) {
          destinations.add(fullStops[i]);
        }
      }
    });

    return Array.from(destinations).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  async getStationsList() {
      return { id: 'stations', results: [] }; 
  }

  private calculateDuration(departureTime: Date, arrivalTime: Date): string {
    const diff = arrivalTime.getTime() - departureTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}
