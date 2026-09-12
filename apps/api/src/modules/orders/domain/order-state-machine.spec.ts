import { OrderStatus } from '@prisma/client';
import { assertValidTransition, canTransition, InvalidOrderTransitionError } from './order-state-machine';

const ALL_STATUSES: OrderStatus[] = [
  'CREATED',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
  'RETURNED',
];

describe('order state machine', () => {
  it('allows the standard happy-path sequence', () => {
    const happyPath: OrderStatus[] = [
      'CREATED',
      'CONFIRMED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it('allows a failed delivery to be redelivered or returned', () => {
    expect(canTransition('FAILED', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransition('FAILED', 'RETURNED')).toBe(true);
  });

  it('allows cancellation only before pickup', () => {
    expect(canTransition('CREATED', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    expect(canTransition('PICKED_UP', 'CANCELLED')).toBe(false);
  });

  it('treats terminal statuses as having no outgoing transitions', () => {
    for (const terminal of ['DELIVERED', 'CANCELLED', 'RETURNED'] as OrderStatus[]) {
      for (const target of ALL_STATUSES) {
        expect(canTransition(terminal, target)).toBe(false);
      }
    }
  });

  it('rejects skipping states (e.g. CREATED straight to DELIVERED)', () => {
    expect(canTransition('CREATED', 'DELIVERED')).toBe(false);
    expect(canTransition('CREATED', 'IN_TRANSIT')).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(canTransition('IN_TRANSIT', 'PICKED_UP')).toBe(false);
    expect(canTransition('OUT_FOR_DELIVERY', 'CONFIRMED')).toBe(false);
  });

  it('assertValidTransition throws InvalidOrderTransitionError with the right code on an illegal move', () => {
    expect(() => assertValidTransition('DELIVERED', 'PICKED_UP')).toThrow(InvalidOrderTransitionError);
    try {
      assertValidTransition('DELIVERED', 'PICKED_UP');
    } catch (e) {
      expect((e as InvalidOrderTransitionError).code).toBe('ORDER_INVALID_TRANSITION');
    }
  });

  it('every status pair is decidable (no undefined behaviour)', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        expect(typeof canTransition(from, to)).toBe('boolean');
      }
    }
  });
});
