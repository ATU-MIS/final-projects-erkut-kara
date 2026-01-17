# Changes Summary

## 15.12.2025 - Bus Tax Info & Stations List

### Features Added
- **Bus Tax Info**: Added `taxOffice`, `taxNumber`, and `owner` fields to Bus model.
- **Stations Endpoint**: Added `GET /routes/stations` to return unique stations list in a specific JSON format matching frontend requirements (slugified IDs).
- **Backend Fixes**: Fixed configuration module imports and type errors to ensure successful build.

### Database Schema Changes
- **Table**: `buses`
  - Added `taxOffice` (String, nullable)
  - Added `taxNumber` (String, nullable)
  - Added `owner` (String, nullable)

## What Was Changed

The Bus module has been updated to use a simplified structure with separate specifications table.

### Database Schema Changes

#### Bus Table - Simplified
**Before:**
- id
- plate
- brand ❌ (removed)
- model
- seatCount
- layoutType
- isActive ❌ (removed)
- createdAt ❌ (removed)
- updatedAt ❌ (removed)

**After:**
- id ✅
- plate ✅
- model ✅
- seatCount ✅
- layoutType ✅

#### New Table: BusSpecs
**Added:**
- id
- busId (FK to Bus, unique)
- brand (moved from Bus)
- year
- engineType
- fuelType
- hasAC
- hasWifi
- hasToilet
- hasTV
- features (array)
- createdAt
- updatedAt

### DTOs Updated

#### CreateBusDto
```typescript
// New structure
{
  plate: string;
  model: string;
  seatCount: number;
  layoutType: LayoutType;
  specs?: {
    brand?: string;
    year?: number;
    engineType?: string;
    fuelType?: string;
    hasAC?: boolean;
    hasWifi?: boolean;
    hasToilet?: boolean;
    hasTV?: boolean;
    features?: string[];
  }
}
```

#### UpdateBusDto
- Same optional structure as CreateBusDto
- Can update bus and specs independently or together

### Service Methods Changed

#### Updated Methods:
- `create()` - Now handles nested specs creation
- `findAll()` - Includes specs in response, filters by brand through specs
- `findOne()` - Includes specs in response
- `findByPlate()` - Includes specs in response
- `update()` - Uses upsert for specs (create or update)
- `getStats()` - Removed active/inactive stats

#### Removed Methods:
- ❌ `activate()`
- ❌ `deactivate()`

### Controller Endpoints Changed

#### Removed Endpoints:
- ❌ `PATCH /buses/:id/activate`
- ❌ `PATCH /buses/:id/deactivate`

#### Updated Endpoints:
- `GET /buses` - Removed isActive filter, brand filter now searches specs

### API Response Changes

#### Before:
```json
{
  "id": "uuid",
  "plate": "34ABC123",
  "brand": "Mercedes",
  "model": "Travego",
  "seatCount": 48,
  "layoutType": "LAYOUT_2_1",
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### After:
```json
{
  "id": "uuid",
  "plate": "34ABC123",
  "model": "Travego 17 SHD",
  "seatCount": 48,
  "layoutType": "LAYOUT_2_1",
  "specs": {
    "id": "uuid",
    "busId": "uuid",
    "brand": "Mercedes-Benz",
    "year": 2023,
    "engineType": "Euro 6",
    "fuelType": "Diesel",
    "hasAC": true,
    "hasWifi": true,
    "hasToilet": true,
    "hasTV": true,
    "features": ["Leather seats", "USB charging"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Files Modified

### Core Files:
1. ✏️ `prisma/schema.prisma` - Updated Bus model, added BusSpecs model
2. ✏️ `src/modules/bus/dto/create-bus.dto.ts` - Added BusSpecsDto, updated fields
3. ✏️ `src/modules/bus/dto/update-bus.dto.ts` - Added BusSpecsDto, updated fields
4. ✏️ `src/modules/bus/bus.service.ts` - Updated all methods to handle specs
5. ✏️ `src/modules/bus/bus.controller.ts` - Removed activate/deactivate endpoints

### Documentation Files:
6. ✏️ `API_DOCUMENTATION.md` - Updated field descriptions and endpoints
7. ✏️ `API_EXAMPLES.md` - Updated all examples with new structure
8. ✏️ `README.md` - Comprehensive update with project info
9. ➕ `BUS_MODULE_SUMMARY.md` - New detailed bus module documentation
10. ➕ `DATABASE_STRUCTURE.md` - New database schema documentation
11. ➕ `INSTALLATION.md` - New complete installation guide

## Migration Steps Required

After pulling these changes, run:

```bash
# 1. Install/update dependencies
npm install

# 2. Generate Prisma Client with new schema
npm run prisma:generate

# 3. Create and run migration
npm run prisma:migrate
# Name it: "update_bus_model_add_specs"

# 4. Start the server
npm run start:dev
```

## Breaking Changes

⚠️ **Frontend Updates Required:**

1. **Request Structure**: When creating/updating buses, specs must be nested:
   ```javascript
   // Old
   { plate: "...", brand: "..." }
   
   // New
   { plate: "...", specs: { brand: "..." } }
   ```

2. **Response Structure**: Bus responses now include nested specs object

3. **Filtering**: 
   - Removed: `?isActive=true` filter
   - Brand filter still works but searches specs table

4. **Endpoints Removed**:
   - `PATCH /buses/:id/activate`
   - `PATCH /buses/:id/deactivate`

5. **Statistics Response**:
   ```javascript
   // Old
   { total: 10, active: 8, inactive: 2, byLayout: {...} }
   
   // New
   { total: 10, byLayout: {...} }
   ```

## Benefits of New Structure

✅ **Cleaner Separation**: Core bus info vs detailed specs
✅ **More Flexible**: Specs are optional and can be added later
✅ **Extensible**: Easy to add new spec fields without changing Bus table
✅ **Better Organization**: Related spec data grouped together
✅ **Dynamic Features**: Features array allows unlimited custom features

## TypeScript Errors Note

The TypeScript errors you see are expected because npm packages haven't been installed yet. They will disappear after running `npm install` and `npm run prisma:generate`.

## Testing the Changes

After installation, test with:

```bash
# 1. Create a bus with specs
curl -X POST http://localhost:3000/buses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plate": "34TEST001",
    "model": "Test Model",
    "seatCount": 48,
    "layoutType": "LAYOUT_2_1",
    "specs": {
      "brand": "Test Brand",
      "year": 2023,
      "hasAC": true
    }
  }'

# 2. Get all buses (should include specs)
curl http://localhost:3000/buses

# 3. Update bus specs
curl -X PATCH http://localhost:3000/buses/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "specs": {
      "hasWifi": true,
      "features": ["USB charging", "Reading lights"]
    }
  }'
```

## Rollback Instructions

If you need to rollback to the previous structure:

```bash
# 1. Revert Prisma schema to old version
git checkout HEAD~1 prisma/schema.prisma

# 2. Generate client
npm run prisma:generate

# 3. Run migration
npm run prisma:migrate

# 4. Revert other files
git checkout HEAD~1 src/modules/bus/
```

## Support

For questions or issues:
1. Check [INSTALLATION.md](INSTALLATION.md) for setup help
2. Review [BUS_MODULE_SUMMARY.md](BUS_MODULE_SUMMARY.md) for usage details
3. See [API_EXAMPLES.md](API_EXAMPLES.md) for request examples
