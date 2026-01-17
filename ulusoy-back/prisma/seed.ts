import { PrismaClient, UserRole, LayoutType, RouteType, TicketStatus, StationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper
function slugify(text: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o'
  };
  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Stations
  const jsonPath = path.join(__dirname, '../json_samples/stations_list_option.json');
  if (fs.existsSync(jsonPath)) {
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const stationData = JSON.parse(rawData);
    for (const station of stationData.results) {
        let type: StationType = StationType.CITY;
        const nameUpper = station.text.toUpperCase();
        if (nameUpper.includes(' DT') || nameUpper.includes('TESİS') || nameUpper.includes('PARK')) {
            type = StationType.REST_FACILITY;
        }
        
        const slug = slugify(station.text);

        await prisma.station.upsert({
            where: { name: station.text },
            update: { slug }, // Ensure slug is updated if exists
            create: { name: station.text, slug, type: type }
        });
    }
  }

  // 2. Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ulusoy.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@ulusoy.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      phone: '5551112233',
    },
  });

  // 3. Buses
  const bus1 = await prisma.bus.upsert({
    where: { plate: '34 UL 100' },
    update: {},
    create: {
      plate: '34 UL 100',
      model: 'Mercedes-Benz Travego',
      seatCount: 40,
      // layoutType: LayoutType.LAYOUT_2_1, // Optional
      specs: { create: { brand: 'Mercedes', hasAC: true, hasWifi: true } }
    },
  });

  // 4. Routes
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); 
  const arrival1 = new Date(tomorrow);
  arrival1.setHours(15, 0, 0, 0);

  // RouteStations Data
  // Izmit: +1.5h, Bolu: +3h
  const izmitTime = new Date(tomorrow.getTime() + 1.5 * 60 * 60 * 1000);
  const boluTime = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);

  const route1 = await prisma.route.create({
    data: {
      fromCity: 'İSTANBUL (ESENLER)',
      toCity: 'ANKARA (AŞTİ)',
      departureTime: tomorrow,
      arrivalTime: arrival1,
      price: 500,
      type: RouteType.VIP,
      busId: bus1.id,
      restStops: ['ALİ OSMAN ULUSOY BOLU DAĞI DT'],
      routeStations: {
          create: [
              { station: 'İZMİT', time: izmitTime, order: 0 },
              { station: 'BOLU', time: boluTime, order: 1 }
          ]
      },
      prices: {
        create: [
          { fromCity: 'İSTANBUL (ESENLER)', toCity: 'İZMİT', price: 200 },
          { fromCity: 'İZMİT', toCity: 'ANKARA (AŞTİ)', price: 400 },
        ]
      }
    },
  });

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
