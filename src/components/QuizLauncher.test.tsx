// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QuizLauncher } from './QuizLauncher';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), connected: true }));
vi.mock('@/utils/http', () => ({ default: api }));
vi.mock('@/contexts/SocketContext', () => ({ useSocket: () => ({ isConnected: api.connected }) }));
let container: HTMLDivElement; let root: ReturnType<typeof createRoot>;
const attempt = { scheduleId: 's', title: 'Quiz', description: '', iconUrl: '', durationSeconds: 60, revealSeconds: 10, startedAt: '2026-01-01T00:00:00Z', deadline: '2026-01-01T00:01:00Z', serverNow: '2026-01-01T00:00:00Z', status: 'playing', questions: [{ text: 'Q?', options: ['A', 'B'] }, { text: 'Q2?', options: ['C', 'D'] }] };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-01T00:00:00Z')); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container); root = createRoot(container); api.get.mockReset(); api.post.mockReset(); api.connected = true; });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });
async function click(text: string) { const button = [...container.querySelectorAll('button')].find(b => b.textContent?.includes(text) || b.getAttribute('aria-label') === text); expect(button).toBeTruthy(); await act(async () => { button!.click(); }); }
it('hides the floating game button when the close control is pressed without starting a game', async () => {
  api.get.mockResolvedValue({ data: { available: true, campaign: { title: 'Quiz', description: '', iconUrl: '', questionCount: 2, durationSeconds: 60, revealSeconds: 10 }, attempt: null } });
  await act(async () => root.render(<QuizLauncher roomId="1" />));
  await click('Ẩn mini game');
  expect(container.querySelector('[aria-label="Quiz"]')).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});
it('hides the launcher for every finished attempt and keeps it for a new room', async () => {
  const won = { ...attempt, status: 'finished', reward: { items: [{ name: 'Trà', quantity: 1 }] } };
  api.get.mockResolvedValue({ data: { available: true, attempt: won } });
  await act(async () => root.render(<QuizLauncher roomId="1" />));
  expect(container.querySelector('button[aria-label="Quiz"]')).toBeNull();
  api.get.mockResolvedValue({ data: { available: true, attempt: { ...won, reward: null } } });
  await act(async () => root.render(<QuizLauncher roomId="2" />));
  expect(container.querySelector('button[aria-label="Quiz"]')).toBeNull();
  api.get.mockResolvedValue({ data: { available: true, attempt } });
  await act(async () => root.render(<QuizLauncher roomId="3" />));
  expect(container.querySelector('button[aria-label="Quiz"]')).not.toBeNull();
});
it('loads availability without starting, then sends ordered answer and shows feedback', async () => {
  api.get.mockResolvedValue({ data: { available: true, campaign: { title: 'Quiz', description: 'Info', iconUrl: '', questionCount: 2, durationSeconds: 60, revealSeconds: 10 }, attempt: null } });
  api.post.mockResolvedValueOnce({ data: { attempt } }).mockResolvedValueOnce({ data: { attempt: { ...attempt, questions: [{ ...attempt.questions[0], answer: { optionIndex: 0, answeredAt: attempt.serverNow }, correctIndex: 1 }, attempt.questions[1]] } } });
  await act(async () => root.render(<QuizLauncher roomId="1" />));
  expect(api.post).not.toHaveBeenCalled(); await click('Quiz'); expect(container.textContent).toContain('Info'); await click('Bắt đầu'); await click('A');
  expect(api.post).toHaveBeenLastCalledWith('/quiz/rooms/1/answer', { questionIndex: 0, optionIndex: 0 }, expect.anything()); expect(container.textContent).toContain('Chưa đúng'); await click('Tiếp theo'); expect(container.textContent).toContain('Q2?');
});
it('recovers an uncertain answer from the server and displays the finished reward', async () => {
  const finished = { ...attempt, status: 'finished', score: 1, reward: { minScore: 1, items: [{ name: 'Trà', quantity: 2 }] }, delivered: false, questions: [{ ...attempt.questions[0], answer: { optionIndex: 0, answeredAt: attempt.serverNow }, correctIndex: 0 }, { ...attempt.questions[1], answer: { optionIndex: 1, answeredAt: attempt.serverNow }, correctIndex: 1 }] };
  api.get.mockResolvedValueOnce({ data: { attempt, available: true } }).mockResolvedValueOnce({ data: { attempt, available: true } }).mockResolvedValueOnce({ data: { attempt: finished, available: true } });
  api.post.mockRejectedValueOnce(new Error('network'));
  await act(async () => root.render(<QuizLauncher roomId="1" />)); await click('Quiz'); await click('A'); expect(container.textContent).toContain('đồng bộ'); await click('Thử lại');
  expect(container.textContent).toContain('Chính xác'); await click('Tiếp theo'); expect(container.textContent).toContain('Điểm: 1/2'); expect(container.textContent).toContain('Trà × 2'); expect(api.post).toHaveBeenCalledTimes(1);
});
it('fails closed when availability is absent and discards old room responses', async () => {
  let resolveOld!: (v: unknown) => void; api.get.mockImplementationOnce(() => new Promise(r => { resolveOld = r; })).mockResolvedValueOnce({ data: { attempt: null } });
  await act(async () => root.render(<QuizLauncher roomId="1" />)); await act(async () => root.render(<QuizLauncher roomId="2" />));
  await act(async () => resolveOld({ data: { available: true, campaign: { title: 'Old' }, attempt: null } }));
  expect(container.textContent).not.toContain('Old'); expect(container.querySelector('button')).toBeNull();
});
it('announces only newly confirmed intermediate tiers, not repeats or final rewards', async () => {
  const base = { ...attempt, questions: [...attempt.questions, { text: 'Q3?', options: ['E', 'F'] }], rewardTiers: [{ minScore: 1, items: [{ name: 'Trà', quantity: 2 }] }, { minScore: 2, items: [{ name: 'Bánh', quantity: 1 }] }] };
  const one = { ...base, questions: [{ ...base.questions[0], answer: { optionIndex: 0, answeredAt: base.serverNow }, correctIndex: 0 }, base.questions[1], base.questions[2]] };
  const two = { ...one, questions: [one.questions[0], { ...base.questions[1], answer: { optionIndex: 0, answeredAt: base.serverNow }, correctIndex: 0 }, base.questions[2]] };
  api.get.mockResolvedValue({ data: { attempt: base, available: true } });
  api.post.mockResolvedValueOnce({ data: { attempt: one } }).mockResolvedValueOnce({ data: { attempt: two } });
  await act(async () => root.render(<QuizLauncher roomId="1" />)); await click('Quiz'); await click('A');
  expect(container.textContent).toContain('Chúc mừng'); expect(container.textContent).toContain('Trà × 2'); expect(container.textContent).not.toContain('không cộng dồn');
  await click('Tiếp theo'); expect(container.textContent).not.toContain('Chúc mừng'); await click('C');
  expect(container.textContent).toContain('Bánh × 1'); expect(container.textContent).not.toContain('Trà × 2');
  await click('Tiếp theo'); api.get.mockResolvedValue({ data: { attempt: two, available: true } });
  api.connected = false; await act(async () => root.render(<QuizLauncher roomId="1" />));
  api.connected = true; await act(async () => root.render(<QuizLauncher roomId="1" />)); expect(container.textContent).not.toContain('Chúc mừng');
});
it('does not congratulate without a tier or on the final answer', async () => {
  const noTier = { ...attempt, rewardTiers: [] };
  const first = { ...noTier, questions: [{ ...attempt.questions[0], answer: { optionIndex: 0, answeredAt: attempt.serverNow }, correctIndex: 0 }, attempt.questions[1]] };
  const finished = { ...first, status: 'finished', score: 2, reward: { items: [{ name: 'Trà', quantity: 2 }] }, rewardTiers: [{ minScore: 2, items: [{ name: 'Trà', quantity: 2 }] }], questions: [first.questions[0], { ...attempt.questions[1], answer: { optionIndex: 0, answeredAt: attempt.serverNow }, correctIndex: 0 }] };
  api.get.mockResolvedValue({ data: { attempt: noTier, available: true } }); api.post.mockResolvedValueOnce({ data: { attempt: first } }).mockResolvedValueOnce({ data: { attempt: finished } });
  await act(async () => root.render(<QuizLauncher roomId="1" />)); await click('Quiz'); await click('A'); expect(container.textContent).not.toContain('Chúc mừng');
  await click('Tiếp theo'); await click('C'); expect(container.textContent).not.toContain('Chúc mừng'); await click('Tiếp theo'); expect(container.textContent).toContain('Phần quà: Trà × 2');
});
