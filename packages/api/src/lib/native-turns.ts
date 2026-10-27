import type { TurnCommand, TurnValue } from "./native-turn-protocol";
export type * from "./native-turn-protocol";

/** A transport already admitted to one vault. Calls never own accepted work. */
export interface NativeTurnService {
  call(command: TurnCommand): Promise<TurnValue>;
}

import type { QueueCommand, QueueValue } from "./native-queue-protocol";
export type * from "./native-queue-protocol";
export {
  QUEUE_REQUEST_LIMIT,
  QUEUE_RECORD_LIMIT,
} from "./native-queue-protocol";

/**
 * An admitted source-only queue transport; never retries uncertain acceptance.
 * Native work outlives calls. Read retained state after a lost reply; cold
 * resume requires the explicit current predecessor and never replays started
 * entries.
 */
export interface NativeQueueService {
  call(command: QueueCommand): Promise<QueueValue>;
}

import type {
  ParticipantCommand,
  ParticipantValue,
} from "./native-participant-protocol";
export type * from "./native-participant-protocol";
export {
  PARTICIPANT_REQUEST_LIMIT,
  PARTICIPANT_RECORD_LIMIT,
} from "./native-participant-protocol";

/**
 * An admitted participant port. Captured logical attribution never selects an
 * installed runtime. A lost reply is observed by acceptance ID without replay;
 * Stop/cancel request native cancellation without inventing terminal outcomes.
 */
export interface NativeParticipantService {
  call(command: ParticipantCommand): Promise<ParticipantValue>;
}
