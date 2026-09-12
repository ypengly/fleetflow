import { OrderStatus } from '@prisma/client';

/**
 * Pure function: given a current status and a requested next status,
 * returns whether the transition is allowed. Kept free of any DB/HTTP
 * concerns so it can be unit-tested exhaustively (see order-state-machine.spec.ts)
 * and reused anywhere (API, background jobs, imports) without duplicating rules.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['OUT_FOR_DELIVERY', 'RETURNED'], // redelivery attempt, or give up
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

export class InvalidOrderTransitionError extends Error {
  readonly code = 'ORDER_INVALID_TRANSITION';

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot move order from ${from} to ${to}`);
  }
}

export function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidOrderTransitionError(from, to);
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
