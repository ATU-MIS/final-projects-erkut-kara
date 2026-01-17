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
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRouteDto } from './dto/search-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get('destinations')
  getDestinations(@Query('fromCity') fromCity: string) {
    return this.routeService.getDestinations(fromCity);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params: any = {};

    if (isActive !== undefined) {
      params.isActive = isActive === 'true';
    }

    if (type) {
      params.type = type;
    }

    if (page) {
      params.page = parseInt(page, 10);
    }

    if (limit) {
      params.limit = parseInt(limit, 10);
    }

    return this.routeService.findAll(params);
  }

  @Get('search')
  search(@Query() searchDto: SearchRouteDto) {
    return this.routeService.search(searchDto);
  }

  @Get('stations')
  getStations() {
    return this.routeService.getStationsList();
  }

  @Get('upcoming')
  getUpcoming(
    @Query('fromCity') fromCity?: string,
    @Query('toCity') toCity?: string,
    @Query('days') days?: string,
  ) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.routeService.getUpcomingRoutes(fromCity, toCity, daysNumber);
  }

  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.routeService.getPopularRoutes(limitNumber);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  getStats() {
    return this.routeService.getRouteStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.routeService.remove(id);
  }
}
