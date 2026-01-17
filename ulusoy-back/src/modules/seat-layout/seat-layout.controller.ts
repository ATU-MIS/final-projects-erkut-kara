import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SeatLayoutService } from './seat-layout.service';

@Controller('seat-layouts')
export class SeatLayoutController {
  constructor(private readonly seatLayoutService: SeatLayoutService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.seatLayoutService.create(createDto);
  }

  @Get()
  findAll() {
    return this.seatLayoutService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seatLayoutService.findOne(id);
  }
}
