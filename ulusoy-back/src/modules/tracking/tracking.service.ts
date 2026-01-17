import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async searchRoutes(fromCity: string, toCity: string) {
    const now = new Date();
    // Look back 24 hours to fetch potentially active routes from DB
    const dbQueryStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); 
    
    const routes = await this.prisma.route.findMany({
      where: {
        isActive: true,
        OR: [
            { fromCity: { equals: fromCity, mode: 'insensitive' } },
            { routeStations: { some: { station: { equals: fromCity, mode: 'insensitive' } } } }
        ],
        departureTime: {
            gte: dbQueryStart
        }
      },
      include: {
        bus: true,
        routeStations: { orderBy: { order: 'asc' } }
      },
      orderBy: { departureTime: 'asc' }
    });

    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const futureLimit = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Limit to next 3 hours only

    const results = routes.filter(route => {
        // 1. Calculate User Departure Time (From City)
        let userDepartureTime = route.departureTime;
        if (route.fromCity.toLowerCase() !== fromCity.toLowerCase()) {
            const station = route.routeStations.find(s => s.station.toLowerCase() === fromCity.toLowerCase());
            if (station) userDepartureTime = station.time;
            else return false; 
        }

        // 2. Calculate User Arrival Time (To City)
        let userArrivalTime = route.arrivalTime;
        if (route.toCity.toLowerCase() !== toCity.toLowerCase()) {
            const station = route.routeStations.find(s => s.station.toLowerCase() === toCity.toLowerCase());
            if (station) userArrivalTime = station.time;
        }

        // 3. Apply Filters
        // A. Not too old (Departed within last 3 hours or future)
        if (userDepartureTime < threeHoursAgo) return false;

        // B. Not too far in future (Limit to 48h)
        if (userDepartureTime > futureLimit) return false;

        // C. Arrival has NOT happened yet
        if (userArrivalTime < now) return false;

        return true;
    }).map(route => {
        let userDepartureTime = route.departureTime;
        if (route.fromCity.toLowerCase() !== fromCity.toLowerCase()) {
            const station = route.routeStations.find(s => s.station.toLowerCase() === fromCity.toLowerCase());
            if (station) userDepartureTime = station.time;
        }

        // Status Logic
        const nowUTC = new Date();
        const departureUTC = new Date(route.departureTime);
        
        let status = "Henüz Başlamadı";
        
        if (departureUTC <= nowUTC) {
            // Bus has started from main station
            status = "Yolda";
            
            // Check if passed the user's station
            if (userDepartureTime < nowUTC) {
                status = "Durağı Geçti"; // Or "Yolda"
            }
        }
        
        // Explicitly set if future
        if (departureUTC > nowUTC) {
            status = "Henüz Başlamadı";
        } 
        
        const timeStr = userDepartureTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        const dateStr = userDepartureTime.toLocaleDateString('tr-TR', {day: 'numeric', month: 'long'});
        const plate = route.bus.plate;
        
        const label = `${timeStr} - ${plate} (${dateStr}) (${status})`;

        return {
            id: route.id,
            label,
            status,
            routeDetails: route
        };
    });

    return results;
  }

  async getBusLocation(routeId: string) {
      const route = await this.prisma.route.findUnique({
          where: { id: routeId },
          include: { 
              routeStations: { orderBy: { order: 'asc' } },
              bus: true 
          }
      });

      if (!route) return null;

      // Use Test Location if available
      if (route.bus.testLat && route.bus.testLng) {
          return {
              lat: route.bus.testLat,
              lng: route.bus.testLng,
              plate: route.bus.plate,
              status: 'Canlı Konum',
              speed: 90, // Mock speed or add field
              nextStation: 'Bilinmiyor',
              estimatedArrival: '...'
          };
      }

      const now = new Date();
      const start = new Date(route.departureTime);
      const end = new Date(route.arrivalTime);

      if (now < start) {
          return { lat: 41.0082, lng: 28.9784, plate: route.bus.plate, status: 'Henüz Başlamadı', speed: 0 };
      }
      if (now > end) {
          return { lat: 39.9334, lng: 32.8597, plate: route.bus.plate, status: 'Varış Yaptı', speed: 0 };
      }

      // Linear Interpolation
      const totalMs = end.getTime() - start.getTime();
      const elapsedMs = now.getTime() - start.getTime();
      const progress = elapsedMs / totalMs;

      // Mock Coordinates (Straight line Ist-Ank for demo)
      // In real app, we need coordinates for each station to make it realistic.
      const startLat = 41.0082, startLng = 28.9784;
      const endLat = 39.9334, endLng = 32.8597;

      const currentLat = startLat + (endLat - startLat) * progress;
      const currentLng = startLng + (endLng - startLng) * progress;

      return {
          lat: currentLat,
          lng: currentLng,
          plate: route.bus.plate,
          status: 'Yolda',
          speed: 85 + Math.floor(Math.random() * 10), 
          nextStation: 'Bilinmiyor', 
          estimatedArrival: '...'
      };
  }
}