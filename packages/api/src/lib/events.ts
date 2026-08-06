import { EventEmitter } from "eventemitter3";

export type ValidEventTypes = string | symbol | object;
export type DefaultEventMap = Record<string, any[]>;
export type EventMap<T = any> = Record<string, any>;
export type EventNames<T extends ValidEventTypes> = T extends string | symbol
  ? T
  : keyof T;
export type ArgumentMap<T extends object> = {
  [K in keyof T]: T[K] extends (...args: any[]) => void
    ? Parameters<T[K]>
    : T[K] extends any[]
      ? T[K]
      : any[];
};

export type EventListener<
  T extends ValidEventTypes,
  K extends EventNames<T>,
> = T extends string | symbol
  ? (...args: any[]) => void
  : (
      ...args: ArgumentMap<Exclude<T, string | symbol>>[Extract<K, keyof T>]
    ) => void;

export type EventArgs<
  T extends ValidEventTypes,
  K extends EventNames<T>,
> = Parameters<EventListener<T, K>>;

export type EventRef<
  T extends ValidEventTypes,
  K extends EventNames<T>,
  Context = any,
> = {
  eventName: K;
  callback: EventListener<T, K>;
  dispatcher: EventDispatcher<T>;
  context?: Context;
};

export class EventDispatcher<
  EventTypes extends ValidEventTypes = string | symbol,
  Context = any,
> {
  private emitter = new EventEmitter<any, Context>();

  on<T extends EventNames<EventTypes>>(
    eventName: T,
    listener: EventListener<EventTypes, T>,
    context?: Context,
  ) {
    this.emitter.on(eventName, listener, context);
    const event: EventRef<EventTypes, T, Context> = {
      eventName,
      callback: listener,
      dispatcher: this,
      context,
    };
    return event;
  }

  once<T extends EventNames<EventTypes>>(
    eventName: T,
    listener: EventListener<EventTypes, T>,
    context?: Context,
  ) {
    this.emitter.once(eventName, listener, context);
    const event: EventRef<EventTypes, T, Context> = {
      eventName,
      callback: listener,
      dispatcher: this,
      context,
    };
    return event;
  }

  off<T extends EventNames<EventTypes>>(
    eventName: T,
    listener: EventListener<EventTypes, T>,
    context?: Context,
    once?: boolean,
  ) {
    this.emitter.off(eventName, listener, context, once);
  }

  offref<T extends EventNames<EventTypes>>(ref: EventRef<EventTypes, T>): void {
    this.emitter.off(ref.eventName, ref.callback);
  }

  trigger<T extends EventNames<EventTypes>>(
    eventName: T,
    ...args: EventArgs<EventTypes, T>
  ): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  emit<T extends EventNames<EventTypes>>(
    eventName: T,
    ...args: EventArgs<EventTypes, T>
  ): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  dispatch<T extends EventNames<EventTypes>>(
    eventName: T,
    ...args: EventArgs<EventTypes, T>
  ): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  tryTrigger<T extends EventNames<EventTypes>>(
    evt: EventRef<EventTypes, T>,
    ...args: EventArgs<EventTypes, T>
  ): void {
    try {
      this.trigger(evt.eventName, ...args);
    } catch (e) {
      console.warn(`Error triggerring event: ${String(evt.eventName)}`, e);
    }
  }
}

export class Events<
  EventTypes extends ValidEventTypes = DefaultEventMap,
  Context = any,
> extends EventDispatcher<EventTypes, Context> {}
