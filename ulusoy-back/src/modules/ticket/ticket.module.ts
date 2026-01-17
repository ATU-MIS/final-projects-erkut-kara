import { Module, forwardRef } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TicketGateway } from './ticket.gateway';

@Module({
  controllers: [TicketController],
  providers: [TicketService, TicketGateway],
  exports: [TicketService, TicketGateway],
})
export class TicketModule {}
