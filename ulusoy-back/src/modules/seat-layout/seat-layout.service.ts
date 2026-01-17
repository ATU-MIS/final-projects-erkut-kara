import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SeatLayoutService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.seatLayout.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.seatLayout.findMany();
  }

  async findOne(id: string) {
    return this.prisma.seatLayout.findUnique({
      where: { id },
    });
  }
}
