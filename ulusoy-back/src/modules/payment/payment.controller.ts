import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  processPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.processPayment(createPaymentDto, user.id);
  }

  @Get('history')
  getPaymentHistory(@CurrentUser() user: any) {
    return this.paymentService.getPaymentHistory(user.id, user.role);
  }

  @Post('refund/:ticketId')
  @HttpCode(HttpStatus.OK)
  refundPayment(@Param('ticketId') ticketId: string, @CurrentUser() user: any) {
    return this.paymentService.refundPayment(ticketId, user.id, user.role);
  }
}
