// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

const transport = vi.hoisted(() => ({ base: '' }));
vi.mock('@/utils/http', () => {
  const call = async (method: string, path: string, body?: unknown, params?: Record<string, string>) => {
    const url = new URL(transport.base + path);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(data)}`);
    return { data };
  };
  return { default: { get: (p: string, c?: any) => call('GET', p, undefined, c?.params), put: (p: string, b: unknown) => call('PUT', p, b), post: (p: string, b?: unknown) => call('POST', p, b) } };
});
vi.mock('@/contexts/SocketContext', () => ({ useSocket: () => ({ isConnected: true }) }));
import { QuizLauncher } from './QuizLauncher';
import { quizApis, toCampaign, toDraft } from '../../../jozo-admin/src/apis/quiz.apis';

let child: ChildProcess;
beforeAll(async () => {
  child = spawn('./node_modules/.bin/ts-node', ['-r', 'tsconfig-paths/register', 'src/routes/quiz.integration.fixture.ts'], { cwd: '../be-ezinn', stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; child.stderr!.on('data', b => { stderr += b; });
  const info: any = await new Promise((resolve, reject) => {
    let data = ''; const timeout = setTimeout(() => reject(new Error(`fixture timeout: ${stderr}`)), 30000);
    child.once('exit', code => reject(new Error(`fixture exited ${code}: ${stderr}`)));
    child.stdout!.on('data', chunk => { data += chunk; const line = data.split('\n').find(s => s.startsWith('{"port"')); if (line) { clearTimeout(timeout); resolve(JSON.parse(line)); } });
  });
  transport.base = `http://127.0.0.1:${info.port}`;
}, 40000);
afterAll(async () => { if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); } }, 15000);

it('uses the real route and disposable Mongo across admin adapter and mounted tablet UI', async () => {
  const now = Date.now();
  const original = { title: 'Quiz tích hợp', description: 'Thông tin', iconUrl: 'https://example.com/a.gif', enabled: true, startsAt: new Date(now - 60000).toISOString(), endsAt: new Date(now + 600000).toISOString(), questionCount: 2, durationSeconds: 60, revealSeconds: 10, questions: [{ text: 'Câu thật?', options: ['Sai', 'Đúng'], correctIndex: 1 }, { text: 'Câu tiếp?', options: ['Đúng tiếp', 'Sai tiếp'], correctIndex: 0 }], rewardTiers: [{ minScore: 1, items: [{ menuItemId: '507f1f77bcf86cd799439011', name: 'Trà', quantity: 2 }] }] };
  const draft = toDraft(original);
  expect(await quizApis.saveCampaign(toCampaign(draft))).toEqual(original);
  expect(await quizApis.getCampaign()).toEqual(original);
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const waitFor = async (text: string) => { for (let i = 0; i < 100; i++) { if (container.textContent?.includes(text)) return; await act(async () => { await new Promise(r => setTimeout(r, 25)); }); } throw new Error(`Missing ${text}: ${container.textContent}`); };
  const click = async (text: string) => { const b = [...container.querySelectorAll('button')].find(x => x.textContent?.includes(text)); if (!b) throw new Error(`Missing button ${text}`); await act(async () => { b.click(); }); };
  try {
    await act(async () => root.render(<QuizLauncher roomId="1" />));
    await waitFor('Quiz'); await click('Quiz'); await waitFor('Thông tin'); await click('Bắt đầu'); await waitFor('Câu thật?'); await click('Đúng'); await waitFor('Chúc mừng');
    expect(container.textContent).toContain('Trà × 2'); expect(container.textContent).toContain('không cộng dồn');
    const snapshot = await (await fetch(`${transport.base}/quiz/rooms/1/current`)).json();
    expect(snapshot.attempt.rewardTiers).toEqual([{ minScore: 1, items: [{ name: 'Trà', quantity: 2 }] }]);
    expect(snapshot.attempt.questions[0].correctIndex).toBe(1); expect(snapshot.attempt.questions[1]).not.toHaveProperty('correctIndex');
    await click('Tiếp theo'); await waitFor('Câu tiếp?'); await click('Đúng tiếp'); await waitFor('Chính xác'); await click('Tiếp theo'); await waitFor('Điểm: 2/2');
    const results = await quizApis.getResults(); expect(results.attempts).toHaveLength(1); expect(results.attempts[0]).toMatchObject({ roomName: 'Phòng thử', score: 2, delivered: false });
    expect((await quizApis.claim(results.attempts[0].scheduleId)).delivered).toBe(true);
    expect((await quizApis.getResults()).attempts[0].delivered).toBe(true);
  } finally { act(() => root.unmount()); container.remove(); }
}, 30000);
