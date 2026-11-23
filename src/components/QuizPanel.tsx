import { useEffect, useRef, useState } from "react";
import { remainingSeconds } from "./quizTime";
import { QuizPrizeImages } from "./QuizPrizeImages";

/** Clock sample supplied by the integration when it receives authoritative server time. */
export type QuizClock = { serverNowMs: number; observedAtClientMs: number };
export type QuizQuestion = { id: string; text: string; options: { id: string; text: string }[] };
type Progress = { question: QuizQuestion; number: number; total: number };
export type QuizState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | ({ kind: "question"; deadlineMs: number; clock: QuizClock; submitting?: boolean } & Progress)
  | ({ kind: "feedback"; selectedOptionId: string; correctOptionId: string; advanceAtMs: number; clock: QuizClock } & Progress)
  | { kind: "finished"; prize: string | null; prizeItems?: { name: string; quantity: number; imageUrl?: string }[]; score?: number; total?: number; delivered?: boolean };
export type QuizPanelProps = {
  state: QuizState;
  onAnswer: (optionId: string) => void;
  onNext: () => void;
  onRetry: () => void;
  onClose: () => void;
};

/** Controlled, transport-free display. The host owns retries, authoritative results and session lifecycle. */
export function QuizPanel({ state, onAnswer, onNext, onRetry, onClose }: QuizPanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  const action = useRef({ key: "", used: false });
  const key = state.kind === "feedback" ? `feedback:${state.question.id}:${state.advanceAtMs}` : state.kind === "question" ? `question:${state.question.id}` : state.kind;
  if (action.current.key !== key) action.current = { key, used: false };
  const advance = () => { if (!action.current.used) { action.current.used = true; nextRef.current(); } };

  const clock = state.kind === "question" || state.kind === "feedback" ? state.clock : undefined;
  const deadline = state.kind === "question" ? state.deadlineMs : state.kind === "feedback" ? state.advanceAtMs : undefined;
  const serverNowMs = clock?.serverNowMs;
  const observedAtClientMs = clock?.observedAtClientMs;
  const feedback = state.kind === "feedback";
  useEffect(() => {
    setNow(Date.now());
    if (deadline === undefined || serverNowMs === undefined || observedAtClientMs === undefined) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline, serverNowMs, observedAtClientMs]);
  useEffect(() => {
    if (!feedback || deadline === undefined || serverNowMs === undefined || observedAtClientMs === undefined) return;
    const delay = Math.max(0, deadline - (serverNowMs + Date.now() - observedAtClientMs));
    const timer = window.setTimeout(() => { if (!action.current.used) { action.current.used = true; nextRef.current(); } }, delay);
    return () => window.clearTimeout(timer);
  }, [key, feedback, deadline, serverNowMs, observedAtClientMs]);

  const seconds = deadline !== undefined && clock ? remainingSeconds(deadline, clock, now) : 0;
  const button = "rounded-xl px-4 py-3 font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-300";
  const answerColors = ["bg-rose-700", "bg-blue-700", "bg-amber-700", "bg-violet-700"];
  return <section aria-label="Trò chơi câu hỏi" className="overflow-hidden rounded-3xl bg-[#fffaf0] p-4 text-slate-900 shadow-2xl sm:p-7">
    <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-rose-600">Jozo Quiz</p><h2 className="text-xl font-black sm:text-2xl">Vui chơi cùng khách iu!</h2></div><button type="button" onClick={onClose} className={`${button} shrink-0 bg-white text-slate-700 shadow-sm`}>Đóng</button></div>
    {state.kind === "loading" && <p role="status">Đang tải…</p>}
    {state.kind === "error" && <div role="alert"><p>{state.message}</p><button type="button" onClick={onRetry} className={`${button} mt-3 bg-slate-800 text-white`}>Thử lại</button></div>}
    {state.kind === "finished" && <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-rose-50 to-violet-100 px-4 py-6 text-center sm:px-8 sm:py-8"><p className="text-5xl" aria-hidden="true">🎉</p><p className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Hoàn thành!</p>{state.score !== undefined && <p className="mx-auto mt-3 w-fit rounded-full bg-white px-5 py-2 text-lg font-black text-violet-800 shadow-sm">Điểm: {state.score}/{state.total}</p>}{state.prize !== null && <div className="mx-auto mt-5 max-w-xl rounded-3xl bg-white/80 p-4 shadow-sm sm:p-6"><p className="text-xl font-black text-rose-700">Phần quà: {state.prize}</p><QuizPrizeImages items={state.prizeItems} large /><p className="mt-4 font-semibold text-slate-700">{state.delivered ? "Đã nhận quà" : "Nhân viên sẽ phục vụ phần quà cho bạn."}</p></div>}{state.prize !== null && <p className="mt-5 text-sm text-slate-700">Nếu thấy trò chơi hay và bổ ích, khách iu có thể dành cho Jozo 5 sao trên Google Maps nhé! ⭐</p>}</div>}
    {(state.kind === "question" || state.kind === "feedback") && <div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-800">Câu {state.number}/{state.total}</p>
      {state.kind === "question" && <p role="timer" className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{seconds > 0 ? `Thời gian còn lại: ${seconds} giây` : "Hết thời gian"}</p>}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100" aria-hidden="true"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, state.number / Math.max(1, state.total) * 100))}%` }} /></div>
      <h3 className="my-5 text-xl font-black leading-snug sm:text-2xl">{state.question.text}</h3>
      {state.kind === "feedback" && <p role="status" className={`mb-3 font-black ${state.selectedOptionId === state.correctOptionId ? "text-green-700" : "text-red-700"}`}>{state.selectedOptionId === state.correctOptionId ? "Chính xác ✓" : "Chưa đúng ✕"}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{state.question.options.map((option, index) => {
        const correct = state.kind === "feedback" && option.id === state.correctOptionId;
        const incorrect = state.kind === "feedback" && option.id === state.selectedOptionId && !correct;
        const style = correct ? "bg-green-700 ring-4 ring-green-300" : incorrect ? "bg-red-700 ring-4 ring-red-300" : state.kind === "feedback" ? "bg-slate-500" : answerColors[index % answerColors.length];
        return <button key={option.id} type="button" disabled={state.kind !== "question" || state.submitting || seconds === 0} onClick={() => { if (state.kind === "question" && !action.current.used && remainingSeconds(state.deadlineMs, state.clock, Date.now()) > 0) { action.current.used = true; onAnswer(option.id); } }} className={`${button} ${style} flex min-h-[76px] items-center gap-3 text-left text-white shadow-md disabled:opacity-100`}>
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/20 text-lg font-black">{String.fromCharCode(65 + index)}</span><span>{option.text}{correct && " — Đáp án đúng"}{incorrect && " — Đáp án đã chọn (chưa đúng)"}</span>
        </button>;
      })}</div>
      <button type="button" disabled={state.kind !== "feedback"} onClick={advance} className={`${button} mt-5 w-full bg-slate-900 text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600`}>Tiếp theo</button>
    </div>}
  </section>;
}
