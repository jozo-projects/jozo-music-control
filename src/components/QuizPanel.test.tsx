// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuizPanel, type QuizPanelProps } from "./QuizPanel";
import { remainingSeconds } from "./quizTime";

let root: Root;
let container: HTMLDivElement;
const question = { id: "q1", text: "Câu hỏi?", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] };
const base = (): QuizPanelProps => ({ state: { kind: "question", question, number: 1, total: 2, deadlineMs: 15000, clock: { serverNowMs: 10000, observedAtClientMs: 1000 } }, onAnswer: vi.fn(), onNext: vi.fn(), onRetry: vi.fn(), onClose: vi.fn() });
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1000); (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });
const render = (props: QuizPanelProps) => act(() => root.render(<QuizPanel {...props} />));
const click = (text: string) => { const button = [...container.querySelectorAll("button")].find(b => b.textContent?.includes(text)); expect(button).toBeTruthy(); act(() => button!.click()); };

describe("QuizPanel", () => {
  it("calculates a clamped server-relative deadline", () => { expect(remainingSeconds(15000, { serverNowMs: 10000, observedAtClientMs: 1000 }, 3200)).toBe(3); expect(remainingSeconds(15000, { serverNowMs: 10000, observedAtClientMs: 1000 }, 7000)).toBe(0); });
  it("submits one option and locks at the deadline", () => { const p = base(); render(p); click("A"); expect(p.onAnswer).toHaveBeenCalledWith("a"); act(() => vi.advanceTimersByTime(5000)); expect(container.textContent).toContain("Hết thời gian"); expect([...container.querySelectorAll("button")].find(b => b.textContent === "AA")?.disabled).toBe(true); });
  it("keeps Tiếp theo visible and disabled before answering, then enables it for feedback", () => { const p = base(); render(p); const next = [...container.querySelectorAll("button")].find(b => b.textContent === "Tiếp theo"); expect(next?.disabled).toBe(true); act(() => next!.click()); expect(p.onNext).not.toHaveBeenCalled(); p.state = { kind: "feedback", question, number: 1, total: 2, selectedOptionId: "a", correctOptionId: "b", advanceAtMs: 13000, clock: { serverNowMs: 10000, observedAtClientMs: 1000 } }; render(p); const ready = [...container.querySelectorAll("button")].find(b => b.textContent === "Tiếp theo"); expect(ready?.disabled).toBe(false); act(() => ready!.click()); expect(p.onNext).toHaveBeenCalledTimes(1); });
  it("shows textual correct and incorrect feedback and advances once immediately", () => { const p = base(); p.state = { kind: "feedback", question, number: 1, total: 2, selectedOptionId: "a", correctOptionId: "b", advanceAtMs: 13000, clock: { serverNowMs: 10000, observedAtClientMs: 1000 } }; render(p); expect(container.textContent).toContain("Chưa đúng"); expect(container.textContent).toContain("Đáp án đúng"); click("Tiếp theo"); act(() => vi.advanceTimersByTime(4000)); expect(p.onNext).toHaveBeenCalledTimes(1); });
  it("automatically advances resumed feedback at its server-relative time", () => { const p = base(); p.state = { kind: "feedback", question, number: 1, total: 2, selectedOptionId: "b", correctOptionId: "b", advanceAtMs: 12000, clock: { serverNowMs: 10000, observedAtClientMs: 1000 } }; render(p); act(() => vi.advanceTimersByTime(2000)); expect(p.onNext).toHaveBeenCalledTimes(1); });
  it("renders loading, error and authoritative non-additive prize", () => { const p = base(); p.state = { kind: "loading" }; render(p); expect(container.textContent).toContain("Đang tải"); p.state = { kind: "error", message: "Mất kết nối" }; render(p); click("Thử lại"); expect(p.onRetry).toHaveBeenCalledTimes(1); p.state = { kind: "finished", prize: "Một phần quà" }; render(p); expect(container.textContent).toContain("Một phần quà"); expect(container.textContent).not.toContain("không cộng dồn"); expect(container.textContent).toContain("Nhân viên"); });
  it("shows only valid prize images", () => { const p = base(); p.state = { kind: "finished", prize: "Trà × 1", prizeItems: [{name: "Trà", quantity: 1, imageUrl: "https://res.cloudinary.com/demo/image/upload/tea.jpg"}, {name: "Khác", quantity: 1, imageUrl: "http://example.com/item.jpg"}] }; render(p); expect(container.querySelectorAll("img")).toHaveLength(1); expect(container.querySelector("img")?.alt).toBe("Trà"); });
  it("says staff will serve an awarded prize, but preserves delivered and no-prize states", () => {
    const p = base(); p.state = { kind: "finished", prize: "Trà × 2", delivered: false }; render(p);
    expect(container.textContent).toContain("Nhân viên sẽ phục vụ phần quà cho bạn.");
    expect(container.textContent).not.toContain("liên hệ nhân viên");
    p.state = { kind: "finished", prize: "Trà × 2", delivered: true }; render(p);
    expect(container.textContent).toContain("Đã nhận quà"); expect(container.textContent).not.toContain("sẽ phục vụ");
    p.state = { kind: "finished", prize: null }; render(p); expect(container.textContent).not.toContain("sẽ phục vụ");
  });
});
