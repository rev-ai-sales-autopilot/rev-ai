<<<<<<< HEAD
/**
 * Extensible Internal Event Architecture
 */

export type SystemEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "MESSAGE_RECEIVED"
  | "LEAD_BECAME_HOT"
  | "FOLLOWUP_DUE"
  | "MEETING_BOOKED";

export interface SystemEvent<T = Record<string, unknown>> {
  id: string;
  eventType: SystemEventType;
  organizationId: string;
  payload: T;
  timestamp: string;
}

export interface EventHandler {
  (event: SystemEvent): Promise<void>;
}

class EventBus {
  private handlers: Map<SystemEventType, EventHandler[]> = new Map();

  subscribe(eventType: SystemEventType, handler: EventHandler): void {
=======
import { SystemEventPayload, SystemEventType } from '@/types/automation';

export type EventHandler<T = unknown> = (event: SystemEventPayload<T>) => Promise<void> | void;

export class EventDispatcher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<SystemEventType, EventHandler<any>[]> = new Map();

  subscribe<T = unknown>(eventType: SystemEventType, handler: EventHandler<T>): void {
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

<<<<<<< HEAD
  async dispatch(event: SystemEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map((fn) => fn(event)));
  }
}

export const globalEventBus = new EventBus();
=======
  async dispatch<T = unknown>(
    eventType: SystemEventType,
    organizationId: string,
    data: T
  ): Promise<SystemEventPayload<T>> {
    const event: SystemEventPayload<T> = {
      eventId: crypto.randomUUID(),
      eventType,
      organizationId,
      timestamp: new Date().toISOString(),
      data,
    };

    const registeredHandlers = this.handlers.get(eventType) || [];
    
    await Promise.allSettled(
      registeredHandlers.map(handler => Promise.resolve(handler(event)))
    );

    return event;
  }
}

export const eventDispatcher = new EventDispatcher();
>>>>>>> faa4a56 (feat: initialize Day 1 project architecture, documentation, and Next.js foundation)
