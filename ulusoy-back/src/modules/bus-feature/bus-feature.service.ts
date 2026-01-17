import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusFeatureService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.busFeature.create({ data });
  }

  async findAll() {
    return this.prisma.busFeature.findMany();
  }

  async update(id: string, data: any) {
    return this.prisma.busFeature.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.busFeature.delete({
      where: { id },
    });
  }
}
