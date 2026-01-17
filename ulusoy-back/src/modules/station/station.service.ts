import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.station.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async search(query: string) {
    return this.prisma.station.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 20,
    });
  }

  async create(data: any) {
      return this.prisma.station.create({ data });
  }

  async update(id: string, data: any) {
      return this.prisma.station.update({
          where: { id },
          data
      });
  }

  async remove(id: string) {
      return this.prisma.station.delete({ where: { id } });
  }
}
