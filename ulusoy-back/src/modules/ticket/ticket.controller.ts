import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SearchTicketDto } from './dto/search-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, TicketStatus } from '@prisma/client';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: any) {
    return this.ticketService.create(createTicketDto, user.id, user.role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findAll(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('userId') userId?: string,
    @Query('issuedById') issuedById?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = {};

    if (status) {
      params.status = status as TicketStatus;
    }

    if (paymentStatus) {
      params.paymentStatus = paymentStatus;
    }

    if (userId) {
      params.userId = userId;
    }

    if (issuedById) {
      params.issuedById = issuedById;
    }

    // Security: Agents can only view tickets they issued themselves
    if (user.role === UserRole.AGENT) {
      params.issuedById = user.id;
    }

    return this.ticketService.findAll(params);
  }

  @Get('search')
  search(@Query() searchDto: SearchTicketDto) {
    return this.ticketService.search(searchDto);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  getMyTickets(@CurrentUser() user: any, @Query('status') status?: string) {
    const ticketStatus = status ? (status as TicketStatus) : undefined;
    return this.ticketService.getUserTickets(user.id, ticketStatus);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  getStats() {
    return this.ticketService.getStats();
  }

  @Get('available-seats/:routeId')
  getAvailableSeats(
    @Param('routeId') routeId: string,
    @Query('fromCity') fromCity?: string,
    @Query('toCity') toCity?: string,
  ) {
    return this.ticketService.getAvailableSeats(routeId, fromCity, toCity);
  }

  @Get('pnr/:pnrNumber')
  findByPNR(@Param('pnrNumber') pnrNumber: string) {
    return this.ticketService.findByPNR(pnrNumber);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.update(id, updateTicketDto, user.id, user.role);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard)
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.confirm(id, user.id, user.role);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  suspend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.suspend(id, user.role);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.cancel(id, user.id, user.role);
  }
}
