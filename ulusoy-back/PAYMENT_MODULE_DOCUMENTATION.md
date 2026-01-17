# Payment Module - Complete Documentation

## Overview

The Payment module integrates iyzico payment gateway with automatic fallback to mock payment for testing. It handles ticket payment processing and automatic ticket confirmation after successful payment.

## Features

- ✅ **iyzico Integration** - Real payment gateway integration
- ✅ **Mock Fallback** - Automatic mock service when iyzico not configured
- ✅ **Auto Confirmation** - Tickets automatically confirmed after payment
- ✅ **Refund Support** - Process refunds for cancelled tickets
- ✅ **Payment History** - Track all payment transactions
- ✅ **Secure Processing** - HMAC signature validation
- ✅ **Test Cards** - Mock payment with test card numbers

## Configuration

### Environment Variables

Add to `.env` file:

```env
# iyzico Payment Gateway (Test Environment)
IYZICO_API_KEY="your-iyzico-api-key"
IYZICO_SECRET_KEY="your-iyzico-secret-key"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"
```

### Mock Mode

Leave iyzico credentials empty to use mock payment:

```env
# IYZICO_API_KEY=
# IYZICO_SECRET_KEY=
```

System will automatically detect and use mock service.

## API Endpoints

### Process Payment
```http
POST /payments
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "ticketId": "uuid",
  "cardHolderName": "John Doe",
  "cardNumber": "5528790000000008",
  "expireMonth": "12",
  "expireYear": "2030",
  "cvc": "123",
  "email": "customer@example.com",
  "billingAddress": "Nidakule Göztepe, Merdivenköy Mah.",
  "billingCity": "Istanbul",
  "billingCountry": "Turkey",
  "identityNumber": "74300864791"
}
```

**Successful Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "ticket": {
    "id": "uuid",
    "pnrNumber": "ABC123",
    "status": "CONFIRMED",
    "paymentStatus": "PAID"
  },
  "payment": {
    "transactionId": "TXN-1697123456789-A1B2C3D4",
    "amount": 150.00,
    "currency": "TRY",
    "provider": "iyzico"
  }
}
```

**Failed Response:**
```json
{
  "success": false,
  "message": "Insufficient funds",
  "errorCode": "INSUFFICIENT_FUNDS"
}
```

### Get Payment History
```http
GET /payments/history
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "ticketId": "uuid",
    "pnrNumber": "ABC123",
    "amount": 150.00,
    "currency": "TRY",
    "status": "PAID",
    "paidAt": "2025-10-14T10:30:00.000Z",
    "route": {
      "from": "Istanbul",
      "to": "Ankara",
      "departureTime": "2025-10-15T08:00:00.000Z"
    },
    "passenger": {
      "name": "John Doe",
      "phone": "+90 555 123 4567"
    }
  }
]
```

### Refund Payment
```http
POST /payments/refund/:ticketId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "ticketId": "uuid",
  "pnrNumber": "ABC123",
  "refundAmount": 150.00,
  "refundStatus": "REFUNDED"
}
```

## Payment Flow

### 1. Customer Books Ticket
```
POST /tickets → Status: RESERVED, Payment: PENDING
```

### 2. Customer Pays
```
POST /payments → Process payment
```

### 3. Auto Confirmation & Record Creation
```
If payment successful:
  - Ticket status: RESERVED → CONFIRMED
  - Payment status: PENDING → PAID
  - Create Payment record in 'payments' table
```

### 4. Flow Diagram
```
┌─────────────┐
│ Book Ticket │
└──────┬──────┘
       │ RESERVED
       ▼
┌─────────────┐
│Pay for Ticket│
└──────┬──────┘
       │
    ┌──┴──┐
    │ Pay │
    └──┬──┘
       │
   ┌───┴────┐
   │Success?│
   └───┬────┘
       │
   ┌───┴──────────────┬────────┐
   │                  │        │
   ▼                  ▼        ▼
SUCCESS             FAIL     ERROR
   │
   ├─ Create Payment Record
   ├─ Update Ticket Status
   ▼
CONFIRMED
 & PAID
```

## iyzico Integration

### Test Cards

Use these cards in **sandbox environment**:

| Card Number | Expiry | CVC | Result |
|-------------|--------|-----|--------|
| 5528790000000008 | 12/30 | 123 | Success |
| 5528790000000016 | 12/30 | 123 | Success (3D) |
| 4157920000000002 | 12/30 | 123 | Insufficient Funds |
| 4766620000000001 | 12/30 | 123 | Do Not Honor |

### Request Structure

```javascript
{
  locale: 'tr',
  conversationId: ticketId,
  price: '150.00',
  paidPrice: '150.00',
  currency: 'TRY',
  installment: '1',
  basketId: ticketId,
  paymentChannel: 'WEB',
  paymentGroup: 'PRODUCT',
  paymentCard: {
    cardHolderName: 'John Doe',
    cardNumber: '5528790000000008',
    expireMonth: '12',
    expireYear: '2030',
    cvc: '123',
    registerCard: '0'
  },
  buyer: { ... },
  shippingAddress: { ... },
  billingAddress: { ... },
  basketItems: [ ... ]
}
```

### Authentication

iyzico uses HMAC-SHA256 signature:

```typescript
const pki = `[randomString]${JSON.stringify(request)}`;
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(pki)
  .digest('base64');

headers: {
  'Authorization': `IYZWS ${apiKey}:${signature}`,
  'x-iyzi-rnd': randomString
}
```

## Mock Payment Service

### Test Card Numbers

When using mock mode:

| Last 4 Digits | Result |
|---------------|--------|
| 0000 | ✅ Success |
| 1111 | ❌ Insufficient Funds |
| 2222 | ❌ Invalid Card |
| Others | ✅ Success |

### Examples

```bash
# Success
"cardNumber": "4111111111110000"  # Success

# Failure - Insufficient Funds
"cardNumber": "4111111111111111"  # Insufficient funds

# Failure - Invalid Card
"cardNumber": "4111111111112222"  # Invalid card
```

### Mock Response

```javascript
{
  status: 'success',
  transactionId: 'TXN-1697123456789-A1B2C3D4'
}
```

## Validation Rules

### Payment DTO
- `ticketId` - Required, valid UUID
- `cardHolderName` - Required, string
- `cardNumber` - Required, string (will be cleaned)
- `expireMonth` - Required, string (MM)
- `expireYear` - Required, string (YYYY)
- `cvc` - Required, string (3-4 digits)
- `email` - Optional, valid email
- `billingAddress` - Optional, string
- `billingCity` - Optional, string
- `billingCountry` - Optional, string
- `identityNumber` - Optional, string (11 digits for Turkey)

### Business Rules

1. **Ticket Validation**
   - Ticket must exist
   - User must own the ticket
   - Ticket must be RESERVED status
   - Cannot pay for CONFIRMED tickets
   - Cannot pay for CANCELLED tickets
   - Cannot pay for SUSPENDED tickets

2. **Payment Processing**
   - Amount fetched from ticket.price
   - Currency: TRY (Turkish Lira)
   - Single installment only
   - No stored cards (registerCard: '0')

3. **Auto Confirmation**
   - Only on successful payment
   - Atomic update (status + paymentStatus)
   - Transaction-safe

4. **Refund Rules**
   - Only paid tickets can be refunded
   - Cannot refund after route departure
   - Only owner or admin can refund
   - Auto cancels ticket on refund

## Error Handling

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Ticket is already confirmed and paid",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Ticket with ID {id} not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Payment processing failed. Please try again.",
  "error": "Internal Server Error"
}
```

## Security Features

- ✅ JWT authentication required
- ✅ Ownership validation
- ✅ HMAC signature for iyzico
- ✅ Secure credential storage (env variables)
- ✅ PCI compliance (no card storage)
- ✅ Transaction validation
- ✅ Amount verification

## Integration with Ticket Module

### Before Payment
```javascript
Ticket: {
  status: 'RESERVED',
  paymentStatus: 'PENDING'
}
```

### After Successful Payment
```javascript
Ticket: {
  status: 'CONFIRMED',
  paymentStatus: 'PAID'
}
```

### Automatic Update
```typescript
await this.prisma.ticket.update({
  where: { id: ticket.id },
  data: {
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
  },
});
```

## Complete User Flow

```bash
# 1. User books ticket
POST /tickets
{
  "routeId": "route-uuid",
  "seatNumber": 15,
  ...
}
# Response: PNR "ABC123", Status: RESERVED

# 2. User pays for ticket
POST /payments
{
  "ticketId": "ticket-uuid",
  "cardHolderName": "John Doe",
  "cardNumber": "5528790000000008",
  "expireMonth": "12",
  "expireYear": "2030",
  "cvc": "123"
}
# Response: Payment successful, Ticket CONFIRMED

# 3. User checks ticket
GET /tickets/pnr/ABC123
# Response: Status: CONFIRMED, Payment: PAID

# 4. If needed, user requests refund
POST /payments/refund/ticket-uuid
# Response: Refund processed, Status: CANCELLED, Payment: REFUNDED
```

## Testing

### Test with Mock Payment

```bash
# 1. Ensure iyzico credentials are empty
# .env file:
# IYZICO_API_KEY=
# IYZICO_SECRET_KEY=

# 2. Book ticket
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# 3. Pay with success card
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ticketId": "uuid",
    "cardHolderName": "John Doe",
    "cardNumber": "4111111111110000",
    "expireMonth": "12",
    "expireYear": "2030",
    "cvc": "123"
  }'

# Expected: Payment successful, ticket confirmed

# 4. Try with failure card
curl -X POST http://localhost:3000/payments \
  -d '{
    ...
    "cardNumber": "4111111111111111"
  }'

# Expected: Payment failed - Insufficient funds
```

### Test with iyzico Sandbox

```bash
# 1. Configure iyzico in .env
IYZICO_API_KEY="your-sandbox-key"
IYZICO_SECRET_KEY="your-sandbox-secret"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"

# 2. Use iyzico test cards
curl -X POST http://localhost:3000/payments \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ticketId": "uuid",
    "cardHolderName": "John Doe",
    "cardNumber": "5528790000000008",
    "expireMonth": "12",
    "expireYear": "2030",
    "cvc": "123",
    "email": "test@example.com",
    "identityNumber": "11111111111",
    "billingAddress": "Test Address",
    "billingCity": "Istanbul",
    "billingCountry": "Turkey"
  }'
```

## Production Checklist

- [ ] Obtain production iyzico credentials
- [ ] Update IYZICO_BASE_URL to production endpoint
- [ ] Implement 3D Secure authentication
- [ ] Add payment logging
- [ ] Set up payment failure notifications
- [ ] Implement webhook for payment status updates
- [ ] Add fraud detection
- [ ] Configure SSL/TLS
- [ ] Set up monitoring and alerts
- [ ] Test refund workflow
- [ ] Document payment reconciliation process

## Best Practices

### For Developers
1. Always validate ticket before payment
2. Use atomic updates for status changes
3. Log all payment attempts
4. Handle iyzico API failures gracefully
5. Test with both mock and real gateway

### For Users
1. Verify ticket details before payment
2. Use valid card information
3. Complete payment promptly
4. Save transaction ID
5. Request refund before departure

## Troubleshooting

### Payment Not Processing
- Check iyzico credentials
- Verify network connectivity
- Check card details
- Review iyzico logs

### Auto Confirmation Failed
- Check database transaction
- Verify ticket status
- Review application logs

### Mock Not Working
- Ensure iyzico credentials are empty
- Check console for mock message
- Verify card number format

## Future Enhancements

- [ ] 3D Secure integration
- [ ] Installment payments
- [ ] Saved cards (tokenization)
- [ ] Multiple payment methods
- [ ] Payment webhooks
- [ ] Partial refunds
- [ ] Currency conversion
- [ ] Payment analytics
- [ ] Fraud detection
- [ ] Payment reminders
