import { Controller, Get, Query, Param } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('search')
  search(@Query('from') from: string, @Query('to') to: string) {
    return this.trackingService.searchRoutes(from, to);
  }

  @Get('location/:routeId')
  getLocation(@Param('routeId') routeId: string) {
    return this.trackingService.getBusLocation(routeId);
  }
}
