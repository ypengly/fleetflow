import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { LocationBufferService } from './location-buffer.service';

interface LocationUpdatePayload {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

/**
 * Two logical namespaces sharing one gateway, distinguished by the
 * room a socket joins at connect time:
 *  - dispatchers join `company:{companyId}` and receive every driver's
 *    position for their company.
 *  - drivers join `driver:{driverId}` (their own room only) and are
 *    the only ones allowed to publish `location:update` for that ID.
 *
 * Uses the Socket.IO Redis adapter so rooms/broadcasts work correctly
 * across multiple API instances (architecture doc §9).
 */
@WebSocketGateway({ namespace: '/ws', cors: { origin: process.env.WEB_ORIGIN ?? '*' } })
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly buffer: LocationBufferService,
  ) {}

  async afterInit() {
    const pubClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
    const subClient = pubClient.duplicate();
    this.server.adapter(createAdapter(pubClient, subClient));

    // Fan out location updates published by any instance to the
    // relevant company's dispatcher room.
    await subClient.subscribe('driver-location-broadcast');
    subClient.on('message', (_channel, message) => {
      const { companyId, ...point } = JSON.parse(message);
      this.server.to(`company:${companyId}`).emit('driver:location', point);
    });
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string; companyId: string; roleName: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      client.data.userId = payload.sub;
      client.data.companyId = payload.companyId;
      client.data.roleName = payload.roleName;

      if (payload.roleName === 'DRIVER') {
        client.join(`driver:${payload.sub}`);
      } else {
        client.join(`company:${payload.companyId}`);
      }
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('location:update')
  async onLocationUpdate(@ConnectedSocket() client: Socket, @MessageBody() body: LocationUpdatePayload) {
    if (client.data.roleName !== 'DRIVER') return; // only drivers publish positions

    const driverId = client.data.userId as string;
    const companyId = client.data.companyId as string;
    const point = { driverId, companyId, ...body, ts: new Date().toISOString() };

    // Hot path: publish for real-time fan-out, buffer for batched
    // persistence. Never write raw pings to Postgres synchronously
    // here — see LocationBufferService / architecture doc §11.
    await this.buffer.push(point);
    await this.buffer.publish('driver-location-broadcast', point);
  }
}
