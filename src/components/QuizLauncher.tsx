import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import http from '@/utils/http';
import { QuizPanel, type QuizClock, type QuizState } from './QuizPanel';
import quizGameImage from '@/assets/quiz-game.jpg';
import { QuizPrizeImages } from './QuizPrizeImages';

type Campaign = { title: string; description: string; iconUrl: string; questionCount: number; durationSeconds: number; revealSeconds: number };
type Question = { text: string; options: string[]; answer?: { optionIndex: number; answeredAt: string }; correctIndex?: number };
type Tier = { minScore: number; items: { name: string; quantity: number; imageUrl?: string }[] };
type Attempt = { scheduleId: string; title: string; description: string; iconUrl: string; durationSeconds: number; revealSeconds: number; deadline: string; serverNow: string; status: 'playing' | 'finished'; questions: Question[]; rewardTiers?: Tier[]; score?: number; reward?: { items: { name: string; quantity: number; imageUrl?: string }[] } | null; delivered?: boolean };
type Snapshot = { available?: boolean; campaign?: Campaign; attempt: Attempt | null };
const config = { skipErrorToast: true } as never;

export function QuizLauncher({ roomId }: { roomId: string }) {
  return roomId.trim() ? <RoomQuiz key={roomId} roomId={roomId} /> : null;
}
function RoomQuiz({ roomId }: { roomId: string }) {
  const { isConnected } = useSocket();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [clock, setClock] = useState<QuizClock>({ serverNowMs: 0, observedAtClientMs: 0 });
  const [open, setOpen] = useState(false);
  const [launcherHidden, setLauncherHidden] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [dismissed, setDismissed] = useState(-1);
  const [milestone, setMilestone] = useState<Tier | null>(null);
  const progress = useRef<{ scheduleId: string; score: number } | null>(null);
  const alive = useRef(true); const serial = useRef(0); const busy = useRef(false); const schedule = useRef<string | null>(null);
  const base = `/quiz/rooms/${encodeURIComponent(roomId)}`;
  const apply = useCallback((data: Snapshot) => {
    const nextSchedule = data.attempt?.scheduleId ?? null;
    if (schedule.current !== nextSchedule) { schedule.current = nextSchedule; setDismissed(-1); setMilestone(null); progress.current = null; }
    const next = data.attempt;
    if (next) {
      const score = next.questions.reduce((n, q) => n + (q.answer && q.correctIndex !== undefined && q.answer.optionIndex === q.correctIndex ? 1 : 0), 0);
      const previous = progress.current;
      if (previous?.scheduleId === next.scheduleId && next.status === 'playing' && next.questions.some(q => !q.answer) && score > previous.score) {
        const tier = (next.rewardTiers ?? []).filter(t => t.minScore > previous.score && t.minScore <= score).sort((a, b) => b.minScore - a.minScore)[0];
        if (tier) setMilestone(tier);
      }
      progress.current = { scheduleId: next.scheduleId, score: Math.max(previous?.scheduleId === next.scheduleId ? previous.score : 0, score) };
      if (next.status === 'finished') setMilestone(null);
    }
    setSnapshot(data);
    if (data.attempt) setClock({ serverNowMs: Date.parse(data.attempt.serverNow), observedAtClientMs: Date.now() });
    setError(false);
  }, []);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    const request = ++serial.current;
    try {
      const { data } = await http.get<Snapshot>(`${base}/current`, config);
      if (alive.current && request === serial.current) apply(data);
    } catch { if (alive.current && request === serial.current) setError(true); }
  }, [base, apply]);
  useEffect(() => {
    alive.current = true; void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => { alive.current = false; serial.current++; window.clearInterval(timer); };
  }, [refresh]);
  const connected = useRef(isConnected);
  useEffect(() => { if (isConnected && !connected.current) void refresh(); connected.current = isConnected; }, [isConnected, refresh]);
  const mutate = async (action: 'start' | 'answer', body?: { questionIndex: number; optionIndex: number }) => {
    if (busy.current) return;
    busy.current = true; serial.current++; setPending(true); setError(false);
    try {
      const { data } = await http.post<{ attempt: Attempt }>(`${base}/${action}`, body, config);
      if (alive.current) apply({ available: true, attempt: data.attempt });
    } catch { if (alive.current) setError(true); }
    finally { busy.current = false; if (alive.current) setPending(false); }
  };
  const attempt = snapshot?.attempt;
  useEffect(() => {
    if (!attempt || attempt.status !== 'playing') return;
    const delay = Date.parse(attempt.deadline) - (clock.serverNowMs + Date.now() - clock.observedAtClientMs);
    if (!Number.isFinite(delay) || delay <= 0) return;
    const timer = window.setTimeout(() => void refresh(), delay + 100);
    return () => window.clearTimeout(timer);
  }, [attempt?.deadline, attempt?.status, clock, refresh]);
  const answered = attempt?.questions.reduce((n, q) => n + (q.answer ? 1 : 0), 0) ?? 0;
  const last = answered - 1;
  const lastQuestion = attempt?.questions[last];
  const revealUntil = lastQuestion?.answer ? Date.parse(lastQuestion.answer.answeredAt) + (attempt?.revealSeconds ?? 0) * 1000 : 0;
  const showFeedback = !!attempt && last > dismissed && !!lastQuestion?.answer && lastQuestion.correctIndex !== undefined && revealUntil > clock.serverNowMs + Date.now() - clock.observedAtClientMs;
  let panel: QuizState = { kind: 'loading' };
  if (error) panel = { kind: 'error', message: 'Không thể đồng bộ trò chơi. Hãy thử lại để khôi phục trạng thái.' };
  else if (attempt && showFeedback && lastQuestion?.answer && lastQuestion.correctIndex !== undefined) {
    panel = { kind: 'feedback', question: { id: `${attempt.scheduleId}:${last}`, text: lastQuestion.text, options: lastQuestion.options.map((text, i) => ({ id: String(i), text })) }, number: last + 1, total: attempt.questions.length, selectedOptionId: String(lastQuestion.answer.optionIndex), correctOptionId: String(lastQuestion.correctIndex), advanceAtMs: revealUntil, clock };
  } else if (attempt?.status === 'finished') {
    panel = { kind: 'finished', prize: attempt.reward?.items.map(item => `${item.name} × ${item.quantity}`).join(', ') || null, prizeItems: attempt.reward?.items, score: attempt.score, total: attempt.questions.length, delivered: attempt.delivered };
  } else if (attempt && attempt.questions[answered]) {
    const q = attempt.questions[answered];
    panel = { kind: 'question', question: { id: `${attempt.scheduleId}:${answered}`, text: q.text, options: q.options.map((text, i) => ({ id: String(i), text })) }, number: answered + 1, total: attempt.questions.length, deadlineMs: Date.parse(attempt.deadline), clock, submitting: pending };
  }
  const visible = !!attempt || snapshot?.available === true;
  if (!visible) return null;
  const campaign = snapshot?.campaign;
  let icon = '';
  try { const url = new URL((attempt?.iconUrl || campaign?.iconUrl) ?? ''); if (url.protocol === 'https:' && !url.username && !url.password) icon = url.href; } catch { /* Invalid image URL is not displayed. */ }
  return <>
    {!launcherHidden && !open && attempt?.status !== 'finished' && <div className="fixed bottom-[calc(12rem+env(safe-area-inset-bottom))] right-16 z-40">
      <button type="button" aria-label="Quiz" title="Chơi mini game" onClick={() => { setOpen(true); void refresh(); }} className="block h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-rose-700 shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-rose-400"><img src={quizGameImage} alt="" className="h-full w-full object-cover" /></button>
      <button type="button" aria-label="Ẩn mini game" title="Ẩn mini game" onClick={() => setLauncherHidden(true)} className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-800 text-lg font-bold leading-none text-white shadow">×</button>
    </div>}
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Quiz"><div className="max-h-full w-full max-w-3xl overflow-y-auto">
      {milestone && !error && attempt?.status === 'playing' && <div role="status" className="mb-3 rounded-2xl bg-amber-100 p-4 text-slate-900"><p className="font-black">🎉 Chúc mừng bạn đã đạt mốc {milestone.minScore} câu đúng!</p><p>Phần quà hiện tại: {milestone.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}. Tiếp tục chơi nhé!</p><QuizPrizeImages items={milestone.items} /><p className="text-sm">Nhân viên sẽ phục vụ quà sau khi hoàn thành.</p><button type="button" className="mt-2 font-bold underline" onClick={() => setMilestone(null)}>Đã hiểu</button></div>}
      {!attempt && !error && campaign ? <section className="rounded-3xl bg-[#fffaf0] p-6 text-slate-900 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-rose-600">Jozo Quiz</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{campaign.title}</h2></div><button type="button" className="rounded-xl bg-white px-4 py-3 font-bold shadow-sm" onClick={() => setOpen(false)}>Đóng</button></div>{icon && <img src={icon} alt="" referrerPolicy="no-referrer" className="mt-4 h-16 w-16 rounded-xl object-contain" />}<p className="mt-4 text-lg font-bold text-rose-700">Chơi quiz nhận quà!</p><p className="mt-2 text-lg text-slate-700">{campaign.description}</p><div className="mt-5 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-violet-100 px-4 py-2 text-violet-800">{campaign.questionCount} câu hỏi</span><span className="rounded-full bg-amber-100 px-4 py-2 text-amber-900">{campaign.durationSeconds} giây</span></div><button type="button" disabled={pending} className="mt-6 w-full rounded-xl bg-rose-700 px-5 py-4 text-lg font-black text-white shadow-md disabled:opacity-50" onClick={() => void mutate('start')}>Bắt đầu chơi!</button></section> : <QuizPanel state={panel} onClose={() => setOpen(false)} onRetry={() => void refresh()} onNext={() => { setMilestone(null); setDismissed(last); }} onAnswer={id => void mutate('answer', { questionIndex: answered, optionIndex: Number(id) })} />}
    </div></div>}
  </>;
}
