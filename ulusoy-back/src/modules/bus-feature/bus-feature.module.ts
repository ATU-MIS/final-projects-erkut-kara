import { Module } from '@nestjs/common';
import { BusFeatureService } from './bus-feature.service';
import { BusFeatureController } from './bus-feature.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusFeatureController],
  providers: [BusFeatureService],
})
export class BusFeatureModule {}
