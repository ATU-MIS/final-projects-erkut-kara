# 🚌 Ulusoy Turizm - Bus Ticketing & Fleet Management System

A comprehensive, **Full-Stack** web application designed to handle the digital operations of a modern bus company, including Ticket Sales, Route Management, Real-time Vehicle Tracking, and an advanced Admin Dashboard.

## 🚀 Project Overview

The system consists of 3 main modules:
1.  **Frontend (Client Panel):** A modern, responsive interface for customers to search for trips, select seats, and purchase tickets.
2.  **Admin Panel:** A powerful dashboard for company staff to manage routes, buses, pricing matrices, and agents.
3.  **Backend (API):** A robust RESTful API service built with NestJS and PostgreSQL to manage data flow and business logic.

---

## 🛠️ Technology Stack

### Frontend & Admin Panel
*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **UI Libraries:** Tailwind CSS, Shadcn/UI, Material UI (Admin)
*   **State Management:** TanStack Query (React Query)
*   **Maps:** React Leaflet (integrated with OpenStreetMap & Google Maps Tiles)
*   **Icons:** Lucide React

### Backend
*   **Framework:** NestJS
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Validation:** Class-validator & Class-transformer
*   **Security:** JWT Authentication, BCrypt Hashing

---

## 🌟 Key Features

### 1. 🖥️ Client Panel (Frontend)
*   **Advanced Search:** Trip search based on origin, destination, and date with dynamic destination filtering.
*   **Interactive Seat Selection:** Visual bus layout with Gender-based seat reservation (Male/Female selection logic).
*   **Trip Details:** Comprehensive view of the route, rest stops, and bus amenities (Wifi, TV, etc.).
*   **Live Tracking (Where is my Bus?):** Real-time tracking of active buses on a map, showing current location and speed.
*   **PNR Inquiry:** View and manage ticket details using PNR codes or phone numbers.
*   **Modern UI:** Features Glassmorphism effects, smooth animations, and a fully responsive design.

### 2. 🛡️ Admin Dashboard
*   **Route Management:**
    *   Recurring trip creation (e.g., Every day at 09:00).
    *   **Smart Pricing Engine:** Automatic calculation of segment prices based on distance and duration.
    *   **Delay Management:** Update trip times individually or in bulk with live updates to the tracking system.
*   **Fleet Management:**
    *   Dynamic bus feature management (Icon-based).
    *   Custom Seat Layout designer (2+1, 2+2 configurations).
    *   Manual GPS override for live tracking simulation.
*   **Agency Terminal:**
    *   Rapid ticket issuance interface for physical sales points.
    *   Bulk passenger entry and instant confirmation.
*   **Station & Amenity Management:** Centralized control over cities, rest facilities, and bus hardware.

### 3. ⚙️ Backend Logic
*   **Segment-Based Inventory:** Intelligent algorithm allowing a single seat to be sold multiple times on different segments (e.g., seat sold for A-B becomes available again for B-C).
*   **Dynamic Pricing:** Ability to define specific prices for every stop-to-stop segment.
*   **Simulation Engine:** Interpolates bus location based on trip schedule to provide live tracking data without actual GPS hardware.

---

## 📦 Installation & Setup

To run this project locally, follow these steps:

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL

### 1. Backend Setup
```bash
cd ulusoy-back
npm install
# Create a .env file and add your database connection
# DATABASE_URL="postgresql://user:password@localhost:5432/ulusoy_db"
npx prisma migrate dev
npm run start:dev
```
The API will be available at `http://localhost:3000`.

### 2. Admin Panel Setup
```bash
cd ulusoy-admin
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3002`.
**Default Credentials:** `admin@ulusoy.com` / `admin123`

### 3. Frontend Setup
```bash
cd ulusoy-front
npm install
npm run dev
```
The client panel will be available at `http://localhost:3001`.

---

## 👨‍💻 Developer Notes

This project was developed following **Software Engineering** best practices, focusing on modularity, scalability, and maintainability. It demonstrates a high-level integration of real-time data tracking, complex business rules (segment ticketing), and modern UI/UX design patterns.