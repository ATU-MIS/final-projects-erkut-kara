# 🚀 Quick Start Guide

## Step 1: Install Dependencies (In Progress)

```bash
npm install
```

**Status:** Running... (wait for it to complete)

---

## Step 2: Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
# Name it: "initial_complete_system"
```

---

## Step 3: Start the Server

```bash
npm run start:dev
```

**Expected Output:**
```
Application is running on: http://localhost:3000
```

---

## Step 4: Run Automated Tests

```bash
# Run PowerShell test script
.\test-api.ps1
```

This will automatically test all endpoints and show you the results!

---

## Step 5: Test WebSocket Real-Time

1. **Open `websocket-test.html` in your browser**
2. Click "**Connect**" button
3. Enter the **Route ID** from the test script output
4. Click "**Subscribe to Route**"
5. Book another ticket via REST API
6. **Watch the event appear in real-time!** 🎉

---

## 🎯 Manual Testing

### Test Authentication
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phone\":\"+90 555 111 2233\",\"role\":\"ADMIN\"}"
```

### Test Bus Creation
```bash
curl -X POST http://localhost:3000/buses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"plate\":\"34ABC123\",\"model\":\"Mercedes Travego\",\"seatCount\":45,\"layoutType\":\"TWO_PLUS_ONE\"}"
```

---

## 📚 Full Documentation

For complete API documentation, see:
- [`COMPLETE_TESTING_GUIDE.md`](./COMPLETE_TESTING_GUIDE.md) - Complete step-by-step testing
- [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) - All API endpoints
- [`WEBSOCKET_DOCUMENTATION.md`](./WEBSOCKET_DOCUMENTATION.md) - WebSocket guide

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Database migrations run (`npm run prisma:migrate`)
- [ ] Server started (`npm run start:dev`)
- [ ] Can register user
- [ ] Can create bus
- [ ] Can create route
- [ ] Can book ticket
- [ ] Can pay for ticket
- [ ] WebSocket events work in real-time

---

## 🐛 Troubleshooting

### npm install is slow
- It's normal! Installing all dependencies takes time
- Wait for it to complete (you'll see "added X packages")

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Database connection error
- Make sure PostgreSQL is running
- Check your `.env` file has correct database credentials

---

## 🎉 What's Next?

1. ✅ Test all endpoints with the PowerShell script
2. ✅ Test WebSocket real-time updates
3. ✅ Review the complete documentation
4. 🚀 Connect your frontend
5. 🚀 Deploy to production

**Happy Testing! 🎊**
