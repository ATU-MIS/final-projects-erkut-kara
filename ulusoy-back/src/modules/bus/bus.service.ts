import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Injectable()
export class BusService {
  constructor(private prisma: PrismaService) {}

  async create(createBusDto: CreateBusDto) {
    const { specs, layoutId, features, testLat, testLng, ...busData } = createBusDto;

    return this.prisma.bus.create({
      data: {
        ...busData,
        testLat,
        testLng,
        layout: layoutId ? { connect: { id: layoutId } } : undefined,
        specs: specs ? { create: specs } : undefined,
        features: features ? {
            connect: features.map(id => ({ id }))
        } : undefined
      },
      include: {
        specs: true,
        layout: true,
        features: true
      },
    });
  }

  async findAll(params?: any) {
    return this.prisma.bus.findMany({
      include: {
        specs: true,
        layout: true,
        features: true
      },
    });
  }

  async findOne(id: string) {
    const bus = await this.prisma.bus.findUnique({
      where: { id },
      include: {
        specs: true,
        layout: true,
        features: true
      },
    });
    if (!bus) {
      throw new NotFoundException(`Bus with ID ${id} not found`);
    }
    return bus;
  }

  async findByPlate(plate: string) {
    const bus = await this.prisma.bus.findUnique({
        where: { plate },
        include: {
            specs: true,
            layout: true,
            features: true
        }
    });
    if (!bus) throw new NotFoundException(`Bus with plate ${plate} not found`);
    return bus;
  }

  async update(id: string, updateBusDto: UpdateBusDto) {
    const { specs, layoutId, features, testLat, testLng, ...busData } = updateBusDto;

    return this.prisma.bus.update({
      where: { id },
      data: {
        ...busData,
        testLat,
        testLng,
        layout: layoutId ? { connect: { id: layoutId } } : undefined,
        specs: specs ? { update: specs } : undefined,
        features: features ? {
            set: features.map(id => ({ id })) // Replace all features
        } : undefined
      },
      include: {
        specs: true,
        layout: true,
        features: true
      },
    });
  }

  async remove(id: string) {
    return this.prisma.bus.delete({
      where: { id },
    });
  }

  async getStats() {
      const total = await this.prisma.bus.count();
      return { total };
  }
}