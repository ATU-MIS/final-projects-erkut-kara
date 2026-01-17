import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Controller('buses')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Get()
  findAll(@Query() params: any) {
    return this.busService.findAll(params);
  }

  @Get('stats')
  getStats() {
      return this.busService.getStats();
  }

  @Get('plate/:plate')
  findByPlate(@Param('plate') plate: string) {
      return this.busService.findByPlate(plate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busService.remove(id);
  }
}