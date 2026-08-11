import { SystemEventPayload, SystemEventType } from '@/types/automation';

export type EventHandler<T = unknown> = (event: SystemEventPayload<T>) => Promise<void> | void;

export class EventDispatcher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<SystemEventType, EventHandler<any>[]> = new Map();

  subscribe<T = unknown>(eventType: SystemEventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

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
