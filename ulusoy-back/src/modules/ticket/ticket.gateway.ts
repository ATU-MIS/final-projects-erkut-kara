import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SeatUpdateEvent, SeatUpdatePayload } from './events/seat-update.event';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your frontend URL in production
  },
  namespace: '/seats',
})
export class TicketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('TicketGateway');
  private connectedClients = new Map<string, Set<string>>(); // routeId -> Set of socket IDs

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all route rooms
    this.connectedClients.forEach((clients, routeId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.connectedClients.delete(routeId);
        }
      }
    });
  }

  /**
   * Subscribe to seat updates for a specific route
   */
  @SubscribeMessage('subscribe_route')
  handleSubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ) {
    const { routeId } = data;

    if (!routeId) {
      client.emit('error', { message: 'Route ID is required' });
      return;
    }

    // Join the route room
    client.join(`route:${routeId}`);

    // Track the connection
    if (!this.connectedClients.has(routeId)) {
      this.connectedClients.set(routeId, new Set());
    }
    this.connectedClients.get(routeId).add(client.id);

    this.logger.log(`Client ${client.id} subscribed to route ${routeId}`);

    client.emit('subscribed', {
      routeId,
      message: `Successfully subscribed to route ${routeId}`,
    });
  }

  /**
   * Unsubscribe from seat updates for a specific route
   */
  @SubscribeMessage('unsubscribe_route')
  handleUnsubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ) {
    const { routeId } = data;

    if (!routeId) {
      client.emit('error', { message: 'Route ID is required' });
      return;
    }

    // Leave the route room
    client.leave(`route:${routeId}`);

    // Remove from tracking
    const clients = this.connectedClients.get(routeId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(routeId);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from route ${routeId}`);

    client.emit('unsubscribed', {
      routeId,
      message: `Successfully unsubscribed from route ${routeId}`,
    });
  }

  /**
   * Request current seat availability for a route
   */
  @SubscribeMessage('get_seat_availability')
  handleGetSeatAvailability(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: string },
  ) {
    const { routeId } = data;

    if (!routeId) {
      client.emit('error', { message: 'Route ID is required' });
      return;
    }

    // This will be handled by the service to fetch current seat availability
    // For now, just acknowledge the request
    client.emit('availability_request_received', { routeId });
  }

  /**
   * Emit seat update to all subscribers of a route
   */
  emitSeatUpdate(payload: SeatUpdatePayload) {
    const room = `route:${payload.routeId}`;
    
    this.logger.log(
      `Emitting ${payload.eventType} for seat ${payload.seatNumber} on route ${payload.routeId}`,
    );

    this.server.to(room).emit('seat_update', payload);
  }

  /**
   * Emit seat reserved event
   */
  emitSeatReserved(event: SeatUpdateEvent) {
    this.emitSeatUpdate(event.payload);
  }

  /**
   * Emit seat confirmed event
   */
  emitSeatConfirmed(event: SeatUpdateEvent) {
    this.emitSeatUpdate(event.payload);
  }

  /**
   * Emit seat suspended event
   */
  emitSeatSuspended(event: SeatUpdateEvent) {
    this.emitSeatUpdate(event.payload);
  }

  /**
   * Emit seat cancelled event
   */
  emitSeatCancelled(event: SeatUpdateEvent) {
    this.emitSeatUpdate(event.payload);
  }

  /**
   * Emit seat available event
   */
  emitSeatAvailable(event: SeatUpdateEvent) {
    this.emitSeatUpdate(event.payload);
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Get statistics about connected clients
   */
  getConnectionStats() {
    const stats = {
      totalRoutes: this.connectedClients.size,
      routeDetails: Array.from(this.connectedClients.entries()).map(
        ([routeId, clients]) => ({
          routeId,
          subscriberCount: clients.size,
        }),
      ),
    };

    return stats;
  }
}
