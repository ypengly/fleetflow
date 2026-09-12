import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const BUFFER_KEY_PREFIX = 'location-buffer:';

interface LocationPoint {
  driverId: string;
  companyId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  ts: string;
}

/**
 * Buffers GPS points in a Redis list per driver instead of writing
 * each one to Postgres. A scheduled BullMQ job (location-persist
 * queue, see architecture doc §12) flushes each driver's buffer on an
 * interval, doing one batched INSERT per driver rather than one
 * transaction per ping — this is the scaling strategy discussed in
 * §8/§11 of the architecture doc.
 */
@Injectable()
export class LocationBufferService implements OnModuleDestroy {
  private readonly redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  async push(point: LocationPoint) {
    await this.redis.rpush(`${BUFFER_KEY_PREFIX}${point.driverId}`, JSON.stringify(point));
  }

  async publish(channel: string, point: LocationPoint) {
    await this.redis.publish(channel, JSON.stringify(point));
  }

  /** Called by the location-persist worker (apps/api/src/jobs). */
  async drain(driverId: string): Promise<LocationPoint[]> {
    const key = `${BUFFER_KEY_PREFIX}${driverId}`;
    const raw = await this.redis.lrange(key, 0, -1);
    await this.redis.del(key);
    return raw.map((r) => JSON.parse(r));
  }

  async listBufferedDriverIds(): Promise<string[]> {
    const keys = await this.redis.keys(`${BUFFER_KEY_PREFIX}*`);
    return keys.map((k) => k.replace(BUFFER_KEY_PREFIX, ''));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
