# User Requirement Analysis for Bus Ticketing Platform

## 1. Project Overview

### 1.1 Project Name
Bus Ticketing Platform - Backend API

### 1.2 Project Description
A comprehensive backend system for a bus ticketing and management platform that provides functionality for bus management, route planning, ticket booking, payment processing, and real-time seat availability updates. The system supports multiple user roles including administrators, agents, and customers with appropriate access controls.

### 1.3 Project Objectives
- Provide a complete backend solution for bus ticketing operations
- Enable efficient management of buses, routes, and tickets
- Implement secure authentication and role-based access control
- Support real-time seat availability updates through WebSocket
- Integrate with payment gateways for secure transactions
- Ensure data consistency and prevent double booking
- Provide comprehensive APIs for frontend integration

## 2. Stakeholder Analysis

### 2.1 Primary Stakeholders
- **Administrators**: System administrators with full access to all features including bus, route, and ticket management
- **Agents**: Booking agents who can create routes, manage bookings, and view statistics
- **Customers**: End users who register, search routes, and book/manage their tickets

### 2.2 Secondary Stakeholders
- **Bus Operators**: Entities that provide buses for routes
- **Payment Providers**: Third-party payment gateway providers (iyzico)
- **System Maintainers**: Technical staff responsible for system maintenance and monitoring

## 3. Functional Requirements

### 3.1 User Management
- User registration with email and password
- User login with JWT authentication
- Role-based access control (Admin, Agent, Customer)
- User profile management
- Password security with proper hashing

### 3.2 Bus Management
- Create, read, update, and delete bus information
- Manage bus specifications (brand, model, year, features)
- Define seat layout configurations (2+1, 2+2, 1+2)
- Track bus capacity and seat count
- Maintain contact information for buses (busPhone field)
- Bus statistics and reporting

### 3.3 Route Management
- Create and manage bus routes with departure/arrival details
- Define intermediate stations for routes
- Set pricing for routes
- Assign buses to routes
- Categorize routes (Standard, Express, VIP, Luxury)
- Search and filter routes
- Activate/deactivate routes
- Popular and upcoming routes functionality
- Route statistics and reporting

### 3.4 Ticket Management
- Reserve seats on specific routes
- Confirm bookings with payment processing
- Cancel or suspend tickets
- Search tickets by various criteria (PNR, route, user)
- View available seats for routes
- Generate unique PNR numbers for bookings
- User-specific ticket management
- Ticket status management (Reserved, Confirmed, Cancelled, Suspended)

### 3.5 Payment Processing
- Integrate with iyzico payment gateway
- Support mock payment processing for testing
- Handle payment confirmation and ticket validation
- Process refunds for cancelled tickets
- Maintain payment history
- Payment status tracking

### 3.6 Real-time Updates
- WebSocket support for real-time seat availability
- Subscribe to route updates
- Receive notifications for seat status changes
- Broadcast seat updates to connected clients
- Real-time available seats information

### 3.7 Reporting and Analytics
- View bus statistics
- View route statistics
- View ticket statistics
- Generate reports on bookings and revenue
- Popular routes tracking
- Upcoming routes information

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- Response time for API requests: < 2 seconds
- Support concurrent users during peak booking times
- Real-time WebSocket updates with minimal latency
- Efficient database queries with proper indexing

### 4.2 Security Requirements
- Secure JWT-based authentication
- Role-based access control
- Protection against double booking
- Secure payment processing
- Data encryption for sensitive information
- Input validation and sanitization

### 4.3 Reliability Requirements
- 99.9% uptime for core services
- Automatic error recovery
- Data backup and recovery procedures
- Transaction integrity for bookings and payments
- Graceful error handling

### 4.4 Usability Requirements
- RESTful API design
- Clear error messages and status codes
- Comprehensive API documentation
- Consistent data formats
- Intuitive endpoint organization

### 4.5 Scalability Requirements
- Support for horizontal scaling
- Database optimization for large datasets
- Caching mechanisms for frequently accessed data
- Load balancing support

## 5. User Stories

### 5.1 Administrator User Stories
- As an admin, I want to manage buses so that I can maintain the fleet information
- As an admin, I want to create routes so that customers can book tickets
- As an admin, I want to view statistics so that I can monitor system performance
- As an admin, I want to suspend tickets so that I can handle fraudulent bookings
- As an admin, I want to manage all system entities

### 5.2 Agent User Stories
- As an agent, I want to create routes so that I can manage schedules
- As an agent, I want to view ticket statistics so that I can track sales
- As an agent, I want to search tickets so that I can assist customers

### 5.3 Customer User Stories
- As a customer, I want to register so that I can book tickets
- As a customer, I want to search routes so that I can find available journeys
- As a customer, I want to book tickets so that I can travel
- As a customer, I want to view my tickets so that I can manage my bookings
- As a customer, I want to cancel tickets so that I can modify my plans

## 6. Use Case Diagram

[This section would typically contain a visual diagram showing the relationships between actors (Admin, Agent, Customer) and system functions]

## 7. System Architecture Requirements

### 7.1 Technology Stack
- Framework: NestJS
- Language: TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Authentication: JWT with Passport
- Real-time: WebSocket
- Validation: class-validator
- Documentation: Swagger/OpenAPI

### 7.2 Database Design
- Normalized database schema
- Proper indexing for performance
- Relationships between entities (User, Bus, Route, Ticket)
- Constraints to prevent data inconsistency
- Support for complex queries and reporting

### 7.3 API Design
- RESTful endpoints
- Consistent request/response formats
- Proper HTTP status codes
- Error handling and validation
- Pagination for large datasets
- Filtering and sorting capabilities

## 8. Integration Requirements

### 8.1 Payment Gateway Integration
- iyzico payment gateway integration
- Fallback to mock payment system
- Secure transaction processing
- Refund processing capabilities
- Payment status synchronization

### 8.2 Real-time Communication
- WebSocket implementation for seat updates
- Subscription management for route updates
- Broadcasting mechanisms for status changes
- Connection management and error handling

## 9. Constraints and Assumptions

### 9.1 Technical Constraints
- System must be built with NestJS and TypeScript
- PostgreSQL database must be used
- JWT must be used for authentication
- Real-time updates must be implemented with WebSocket
- All APIs must follow RESTful principles

### 9.2 Business Constraints
- Ticket prices are set by route
- Seat numbers are constrained by bus capacity
- Double booking must be prevented
- Payment must be processed before ticket confirmation
- Route assignments must consider bus availability

### 9.3 Assumptions
- Users will have reliable internet connection
- Payment gateways will be available
- Buses will have accurate capacity information
- Routes will have valid departure and arrival times
- Users will provide accurate personal information

## 10. Acceptance Criteria

### 10.1 Functional Acceptance Criteria
- Users can successfully register and login
- Administrators can manage all system entities
- Customers can search and book tickets
- Payments are processed securely
- Real-time seat updates are delivered correctly
- All role-based access controls work as expected

### 10.2 Non-Functional Acceptance Criteria
- System response time meets performance requirements
- Security measures prevent unauthorized access
- Data integrity is maintained during concurrent operations
- System recovers gracefully from errors
- APIs are properly documented and accessible

## 11. Glossary

- **PNR**: Passenger Name Record - Unique identifier for bookings
- **JWT**: JSON Web Token - Authentication mechanism
- **WebSocket**: Protocol for real-time communication
- **REST**: Representational State Transfer - API design pattern
- **ORM**: Object-Relational Mapping - Database abstraction layer
- **DTO**: Data Transfer Object - Data structure for API communication