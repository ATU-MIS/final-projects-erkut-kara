import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { StationService } from './station.service';

@Controller('stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  create(@Body() data: any) {
      return this.stationService.create(data);
  }

  @Get()
  findAll(@Query('q') query?: string) {
    if (query) {
      return this.stationService.search(query);
    }
    return this.stationService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
      return this.stationService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.stationService.remove(id);
  }
}
