import type { QuizClock } from "./QuizPanel";

export function remainingSeconds(deadlineMs: number, clock: QuizClock, clientNowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - (clock.serverNowMs + clientNowMs - clock.observedAtClientMs)) / 1000));
}
