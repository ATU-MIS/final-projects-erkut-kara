import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusModule } from './modules/bus/bus.module';
import { RouteModule } from './modules/route/route.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { SeatLayoutModule } from './modules/seat-layout/seat-layout.module';
import { StationModule } from './modules/station/station.module';
import { BusFeatureModule } from './modules/bus-feature/bus-feature.module';
import { TrackingModule } from './modules/tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BusModule,
    RouteModule,
    TicketModule,
    SeatLayoutModule,
    StationModule,
    BusFeatureModule,
    TrackingModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}