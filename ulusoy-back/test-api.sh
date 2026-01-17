#!/bin/bash
# Coolify Terminal Test Script (Bash/Curl)

# --- Configuration ---
# !!! DEPLOY ETTİĞİN ADRESİ BURAYA YAZ !!!
API_URL="https://aou.devosuit.com"

# Rastgele kullanıcılar oluşturmak için anlık zamanı kullan
TIMESTAMP=$(date +%s)
ADMIN_EMAIL="admin-$TIMESTAMP@test.com"
CUSTOMER_EMAIL="customer-$TIMESTAMP@test.com"
PASSWORD="password123"

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}--- Test Başlatılıyor: $API_URL ---
${NC}"


# --- Adım 1: Veritabanı Migration ---
echo -e "\n${CYAN}--- Adım 1: Veritabanı tabloları oluşturuluyor... ---
${NC}"
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}Veritabanı migration hatası! Test durduruldu.${NC}"
    exit 1
fi
echo -e "${GREEN}Veritabanı hazır.${NC}"


# --- Adım 2: Kullanıcıları Oluştur ---
echo -e "\n${CYAN}--- Adım 2: Admin ve Müşteri kullanıcıları oluşturuluyor... ---
${NC}"
# Admin
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$PASSWORD'",
    "role": "ADMIN",
    "firstName": "CoolifyAdmin"
  }' > /dev/null
echo "Admin ($ADMIN_EMAIL) oluşturuldu."

# Müşteri
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$CUSTOMER_EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "CoolifyCustomer"
  }' > /dev/null
echo "Müşteri ($CUSTOMER_EMAIL) oluşturuldu."


# --- Adım 3: Admin Girişi ---
echo -e "\n${CYAN}--- Adım 3: Admin olarak giriş yapılıyor... ---
${NC}"
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "'$ADMIN_EMAIL'", "password": "'$PASSWORD'"}' | jq -r .token)

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Admin girişi başarısız! Token alınamadı. Test durduruldu.${NC}"
    exit 1
fi
echo -e "${GREEN}Admin girişi başarılı.${NC}"


# --- Adım 4: Otobüs Oluştur ---
echo -e "\n${CYAN}--- Adım 4: Yeni bir otobüs oluşturuluyor... ---
${NC}"
BUS_PLATE="34COOL$(shuf -i 100-999 -n 1)"
BUS_RESPONSE=$(curl -s -X POST "$API_URL/buses" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plate": "'$BUS_PLATE'", "model": "Testliner", "seatCount": 20, "layoutType": "LAYOUT_2_1"}')

BUS_ID=$(echo $BUS_RESPONSE | jq -r .id)

if [ "$BUS_ID" == "null" ] || [ -z "$BUS_ID" ]; then
    echo -e "${RED}Otobüs oluşturulamadı! Test durduruldu.${NC}"
    echo "Hata: $BUS_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Otobüs oluşturuldu (ID: $BUS_ID, Plaka: $BUS_PLATE).${NC}"


# --- Adım 5: Sefer Oluştur ---
echo -e "\n${CYAN}--- Adım 5: Istanbul -> Ankara seferi oluşturuluyor... ---
${NC}"
DEPARTURE_TIME=$(date -d "tomorrow" -u +"%Y-%m-%dT%H:%M:%SZ")
ARRIVAL_TIME=$(date -d "tomorrow +5 hours" -u +"%Y-%m-%dT%H:%M:%SZ")
ROUTE_RESPONSE=$(curl -s -X POST "$API_URL/routes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCity": "Istanbul", "toCity": "Ankara", "stations": ["Izmit", "Bolu"],
    "departureTime": "'$DEPARTURE_TIME'", "arrivalTime": "'$ARRIVAL_TIME'",
    "price": 500, "busId": "'$BUS_ID'",
    "prices": [
      {"fromCity": "Istanbul", "toCity": "Izmit", "price": 100, "isSold": true},
      {"fromCity": "Izmit", "toCity": "Bolu", "price": 150, "isSold": true}
    ]
  }')

ROUTE_ID=$(echo $ROUTE_RESPONSE | jq -r .id)

if [ "$ROUTE_ID" == "null" ] || [ -z "$ROUTE_ID" ]; then
    echo -e "${RED}Sefer oluşturulamadı! Test durduruldu.${NC}"
    echo "Hata: $ROUTE_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Sefer oluşturuldu (ID: $ROUTE_ID).${NC}"


# --- Adım 6: Müşteri Girişi ---
echo -e "\n${CYAN}--- Adım 6: Müşteri olarak giriş yapılıyor... ---
${NC}"
CUSTOMER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "'$CUSTOMER_EMAIL'", "password": "'$PASSWORD'"}' | jq -r .token)

if [ "$CUSTOMER_TOKEN" == "null" ] || [ -z "$CUSTOMER_TOKEN" ]; then
    echo -e "${RED}Müşteri girişi başarısız! Token alınamadı. Test durduruldu.${NC}"
    exit 1
fi
echo -e "${GREEN}Müşteri girişi başarılı.${NC}"


# --- Adım 7: Bilet Al (Izmit -> Bolu) ---
echo -e "\n${CYAN}--- Adım 7: Müşteri, Izmit -> Bolu arası koltuk 7 için bilet alıyor... ---
${NC}"
TICKET_RESPONSE=$(curl -s -X POST "$API_URL/tickets" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "'$ROUTE_ID'", "fromCity": "Izmit", "toCity": "Bolu",
    "seatNumber": 7, "gender": "MALE", "passengerName": "Terminal Yolcusu",
    "userPhoneNumber": "5550001122"
  }')

TICKET_ID=$(echo $TICKET_RESPONSE | jq -r .id)
TICKET_PNR=$(echo $TICKET_RESPONSE | jq -r .pnrNumber)

if [ "$TICKET_ID" == "null" ] || [ -z "$TICKET_ID" ]; then
    echo -e "${RED}Bilet alınamadı! Test durduruldu.${NC}"
    echo "Hata: $TICKET_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Bilet rezerve edildi (PNR: $TICKET_PNR).${NC}"


# --- Adım 8: Ödeme Yap ---
echo -e "\n${CYAN}--- Adım 8: Bilet için ödeme yapılıyor... ---
${NC}"
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payments" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "'$TICKET_ID'", "cardHolderName": "Test Customer",
    "cardNumber": "4111111111110000", "expireMonth": "12",
    "expireYear": "2030", "cvc": "123"
  }')

PAYMENT_SUCCESS=$(echo $PAYMENT_RESPONSE | jq -r .success)

if [ "$PAYMENT_SUCCESS" != "true" ]; then
    echo -e "${RED}Ödeme başarısız! Test durduruldu.${NC}"
    echo "Hata: $PAYMENT_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Ödeme başarılı.${NC}"


# --- Adım 9: Bilet Durumunu Kontrol Et ---
echo -e "\n${CYAN}--- Adım 9: Biletin son durumu kontrol ediliyor... ---
${NC}"
FINAL_TICKET_STATUS=$(curl -s -X GET "$API_URL/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq -r .status)

if [ "$FINAL_TICKET_STATUS" == "CONFIRMED" ]; then
    echo -e "${GREEN}>>> BAŞARILI! Bilet durumu 'CONFIRMED' olarak güncellendi. Sistem çalışıyor! <<<
${NC}"
else
    echo -e "${RED}>>> HATA! Bilet durumu 'CONFIRMED' olmalıydı ama '$FINAL_TICKET_STATUS' olarak bulundu. <<<
${NC}"
fi

echo -e "\n${CYAN}--- Test Senaryosu Tamamlandı ---
${NC}"