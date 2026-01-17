import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TicketGateway } from '../ticket/ticket.gateway';
import { SeatUpdateEvent, SeatUpdateEventType } from '../ticket/events/seat-update.event';

@Injectable()
export class PaymentService {
  private readonly useIyzico: boolean;
  private readonly iyzicoApiKey: string;
  private readonly iyzicoSecretKey: string;
  private readonly iyzicoBaseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ticketGateway: TicketGateway,
  ) {
    // Check if iyzico is configured
    this.iyzicoApiKey = this.configService.get<string>('IYZICO_API_KEY') || '';
    this.iyzicoSecretKey = this.configService.get<string>('IYZICO_SECRET_KEY') || '';
    this.iyzicoBaseUrl = this.configService.get<string>('IYZICO_BASE_URL') || 
      'https://sandbox-api.iyzipay.com';
    
    // Use mock if iyzico credentials are not configured
    this.useIyzico = !!(this.iyzicoApiKey && this.iyzicoSecretKey);

    if (!this.useIyzico) {
      console.warn('⚠️  iyzico credentials not found. Using MOCK payment service.');
    }
  }

  async processPayment(createPaymentDto: CreatePaymentDto, userId: string) {
    // 1. Validate ticket exists and belongs to user
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createPaymentDto.ticketId },
      include: {
        route: {
          include: {
            bus: true,
          },
        },
        user: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with ID ${createPaymentDto.ticketId} not found`,
      );
    }

    if (ticket.userId !== userId) {
      throw new BadRequestException('You can only pay for your own tickets');
    }

    if (ticket.status === 'CONFIRMED') {
      throw new BadRequestException('Ticket is already confirmed and paid');
    }

    if (ticket.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for cancelled tickets');
    }

    if (ticket.status === 'SUSPENDED') {
      throw new BadRequestException('Cannot pay for suspended tickets');
    }

    // 2. Process payment based on configuration
    let paymentResult;
    if (this.useIyzico) {
      paymentResult = await this.processIyzicoPayment(createPaymentDto, ticket);
    } else {
      paymentResult = await this.processMockPayment(createPaymentDto, ticket);
    }

    // 3. If payment successful, confirm ticket and save payment record
    if (paymentResult.status === 'success') {
      const [updatedTicket, payment] = await this.prisma.$transaction([
        this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        }),
        this.prisma.payment.create({
          data: {
            ticketId: ticket.id,
            transactionId: paymentResult.transactionId,
            amount: ticket.price,
            currency: 'TRY',
            provider: this.useIyzico ? 'iyzico' : 'mock',
            status: 'PAID',
            rawResponse: JSON.stringify(paymentResult),
          },
        }),
      ]);

      // Emit WebSocket event for payment confirmation
      this.ticketGateway.emitSeatConfirmed(
        new SeatUpdateEvent({
          routeId: ticket.routeId,
          seatNumber: ticket.seatNumber,
          eventType: SeatUpdateEventType.SEAT_CONFIRMED,
          ticketId: ticket.id,
          pnrNumber: ticket.pnrNumber,
          timestamp: new Date(),
          metadata: {
            fromCity: ticket.fromCity,
            toCity: ticket.toCity,
            price: ticket.price,
          },
        }),
      );

      return {
        success: true,
        message: 'Payment processed successfully',
        ticket: {
          id: ticket.id,
          pnrNumber: ticket.pnrNumber,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
        payment: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          status: payment.status,
        },
      };
    } else {
      // Payment failed
      return {
        success: false,
        message: paymentResult.errorMessage || 'Payment failed',
        errorCode: paymentResult.errorCode,
      };
    }
  }

  private async processIyzicoPayment(paymentDto: CreatePaymentDto, ticket: any) {
    try {
      const request = {
        locale: 'tr',
        conversationId: ticket.id,
        price: ticket.price.toFixed(2),
        paidPrice: ticket.price.toFixed(2),
        currency: 'TRY',
        installment: '1',
        basketId: ticket.id,
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        paymentCard: {
          cardHolderName: paymentDto.cardHolderName,
          cardNumber: paymentDto.cardNumber.replace(/\s/g, ''),
          expireMonth: paymentDto.expireMonth,
          expireYear: paymentDto.expireYear,
          cvc: paymentDto.cvc,
          registerCard: '0',
        },
        buyer: {
          id: ticket.userId,
          name: ticket.user.firstName || 'Customer',
          surname: ticket.user.lastName || 'Customer',
          gsmNumber: ticket.userPhoneNumber,
          email: paymentDto.email || ticket.user.email,
          identityNumber: paymentDto.identityNumber || '11111111111',
          registrationAddress: paymentDto.billingAddress || 'Address',
          ip: '85.34.78.112',
          city: paymentDto.billingCity || 'Istanbul',
          country: paymentDto.billingCountry || 'Turkey',
        },
        shippingAddress: {
          contactName: ticket.passengerName,
          city: ticket.toCity,
          country: 'Turkey',
          address: 'Bus Station',
        },
        billingAddress: {
          contactName: paymentDto.cardHolderName,
          city: paymentDto.billingCity || 'Istanbul',
          country: paymentDto.billingCountry || 'Turkey',
          address: paymentDto.billingAddress || 'Address',
        },
        basketItems: [
          {
            id: ticket.id,
            name: `Bus Ticket - ${ticket.fromCity} to ${ticket.toCity}`,
            category1: 'Travel',
            category2: 'Bus Ticket',
            itemType: 'VIRTUAL',
            price: ticket.price.toFixed(2),
          },
        ],
      };

      const response = await this.callIyzicoAPI('/payment/auth', request);

      if (response.status === 'success') {
        return {
          status: 'success',
          transactionId: response.paymentId || this.generateTransactionId(),
        };
      } else {
        return {
          status: 'failure',
          errorMessage: response.errorMessage || 'Payment failed',
          errorCode: response.errorCode,
        };
      }
    } catch (error) {
      console.error('iyzico payment error:', error);
      throw new InternalServerErrorException(
        'Payment processing failed. Please try again.',
      );
    }
  }

  private async processMockPayment(paymentDto: CreatePaymentDto, ticket: any) {
    // Mock payment logic for testing
    console.log('🔄 Processing MOCK payment...');

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation: Card number ending with specific digits for testing
    const cardNumber = paymentDto.cardNumber.replace(/\s/g, '');
    const lastFourDigits = cardNumber.slice(-4);

    // Test cards:
    // - Ending with 0000: Success
    // - Ending with 1111: Failure (insufficient funds)
    // - Ending with 2222: Failure (invalid card)
    // - Others: Success

    if (lastFourDigits === '1111') {
      return {
        status: 'failure',
        errorMessage: 'Insufficient funds',
        errorCode: 'INSUFFICIENT_FUNDS',
      };
    }

    if (lastFourDigits === '2222') {
      return {
        status: 'failure',
        errorMessage: 'Invalid card number',
        errorCode: 'INVALID_CARD',
      };
    }

    // Mock successful payment
    console.log('✅ MOCK payment successful');
    return {
      status: 'success',
      transactionId: this.generateTransactionId(),
    };
  }

  private async callIyzicoAPI(endpoint: string, request: any) {
    const url = `${this.iyzicoBaseUrl}${endpoint}`;
    const randomString = this.generateRandomString();
    const requestString = JSON.stringify(request);
    
    const pki = `[${randomString}]${requestString}`;
    const signature = this.generateSignature(pki);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `IYZWS ${this.iyzicoApiKey}:${signature}`,
      'x-iyzi-rnd': randomString,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestString,
      });

      return await response.json();
    } catch (error) {
      console.error('iyzico API call failed:', error);
      throw error;
    }
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.iyzicoSecretKey)
      .update(data)
      .digest('base64');
  }

  private generateRandomString(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async getPaymentHistory(userId: string, userRole: string) {
    // Get all confirmed/paid tickets as payment history
    const where: any = {};

    if (userRole !== 'ADMIN' && userRole !== 'AGENT') {
      where.userId = userId;
    }

    where.paymentStatus = 'PAID';

    const payments = await this.prisma.ticket.findMany({
      where,
      include: {
        route: {
          include: {
            bus: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return payments.map((ticket) => ({
      ticketId: ticket.id,
      pnrNumber: ticket.pnrNumber,
      amount: ticket.price,
      currency: 'TRY',
      status: ticket.paymentStatus,
      paidAt: ticket.updatedAt,
      route: {
        from: ticket.fromCity,
        to: ticket.toCity,
        departureTime: ticket.route.departureTime,
      },
      passenger: {
        name: ticket.passengerName,
        phone: ticket.userPhoneNumber,
      },
    }));
  }

  async refundPayment(ticketId: string, userId: string, userRole: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        route: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    if (ticket.userId !== userId && userRole !== 'ADMIN') {
      throw new BadRequestException('You can only refund your own tickets');
    }

    if (ticket.status === 'CANCELLED' && ticket.paymentStatus === 'REFUNDED') {
      throw new BadRequestException('Ticket is already refunded');
    }

    if (ticket.paymentStatus !== 'PAID') {
      throw new BadRequestException('Can only refund paid tickets');
    }

    // Check if route has departed
    if (new Date(ticket.route.departureTime) < new Date()) {
      throw new BadRequestException('Cannot refund tickets for departed routes');
    }

    // Process refund (mock for now)
    console.log(`💰 Processing refund for ticket ${ticket.pnrNumber}...`);

    // Update ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        cancelledAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Refund processed successfully',
      ticketId: ticket.id,
      pnrNumber: ticket.pnrNumber,
      refundAmount: ticket.price,
      refundStatus: 'REFUNDED',
    };
  }
}
