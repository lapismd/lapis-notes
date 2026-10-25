import type { TurnCommand, TurnValue } from "./native-turn-protocol";
export type * from "./native-turn-protocol";

/** A transport already admitted to one vault. Calls never own accepted work. */
export interface NativeTurnService {
  call(command: TurnCommand): Promise<TurnValue>;
}
