import { Module } from '@nestjs/common';
import { SeatLayoutService } from './seat-layout.service';
import { SeatLayoutController } from './seat-layout.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SeatLayoutController],
  providers: [SeatLayoutService],
  exports: [SeatLayoutService],
})
export class SeatLayoutModule {}
