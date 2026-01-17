import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusFeatureService } from './bus-feature.service';

@Controller('bus-features')
export class BusFeatureController {
  constructor(private readonly busFeatureService: BusFeatureService) {}

  @Post()
  create(@Body() data: any) {
    return this.busFeatureService.create(data);
  }

  @Get('icons')
  getIcons() {
      const fs = require('fs');
      const path = require('path');
      // Use process.cwd() to get project root
      const directoryPath = path.join(process.cwd(), 'public', 'features');
      try {
          if (!fs.existsSync(directoryPath)) {
              console.log('Features directory not found:', directoryPath);
              return [];
          }
          const files = fs.readdirSync(directoryPath);
          return files.map(file => `/features/${file}`);
      } catch (err) {
          console.error('Error reading icons:', err);
          return [];
      }
  }

  @Get()
  findAll() {
    return this.busFeatureService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.busFeatureService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busFeatureService.remove(id);
  }
}
