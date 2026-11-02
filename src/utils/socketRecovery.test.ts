import { EventEmitter } from "node:events";
import type io from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attachSocketRecovery } from "./socketRecovery";

function fixture() {
  const events = new EventEmitter();
  const manager = new EventEmitter();
  const socket = Object.assign(events, {
    connected: false,
    active: true,
    io: manager,
    connect: vi.fn(),
  });
  const callbacks = {
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onLongDisconnect: vi.fn(),
  };
  const recovery = attachSocketRecovery(
    socket as unknown as ReturnType<typeof io>, callbacks,
  );
  return { socket, manager, callbacks, recovery };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("socket recovery", () => {
  it("exposes prolonged initial connection failure at exactly ten seconds", () => {
    const { callbacks } = fixture();
    vi.advanceTimersByTime(9999);
    expect(callbacks.onLongDisconnect).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callbacks.onLongDisconnect).toHaveBeenCalledOnce();
  });

  it("does not restart outage timing on repeated connection errors", () => {
    const { socket, callbacks } = fixture();
    vi.advanceTimersByTime(9000);
    socket.emit("connect_error", new Error("network unavailable"));
    vi.advanceTimersByTime(1000);
    expect(callbacks.onLongDisconnect).toHaveBeenCalledOnce();
  });

  it("clears the outage timer and refreshes on each Socket connect, not Manager reconnect", () => {
    const { socket, manager, callbacks } = fixture();
    socket.connected = true;
    socket.emit("connect");
    manager.emit("reconnect", 1);
    vi.advanceTimersByTime(10000);
    expect(callbacks.onLongDisconnect).not.toHaveBeenCalled();
    expect(callbacks.onConnected).toHaveBeenCalledOnce();
    socket.connected = false;
    socket.emit("disconnect", "transport close");
    vi.advanceTimersByTime(5000);
    socket.connected = true;
    socket.emit("connect");
    vi.advanceTimersByTime(10000);
    expect(callbacks.onLongDisconnect).not.toHaveBeenCalled();
    expect(callbacks.onConnected).toHaveBeenCalledTimes(2);
  });

  it("retries when the server disconnects and built-in recovery becomes inactive", () => {
    const { socket, callbacks } = fixture();
    socket.emit("connect");
    socket.active = false;
    socket.emit("disconnect", "io server disconnect");
    vi.advanceTimersByTime(1000);
    expect(socket.connect).toHaveBeenCalledOnce();
    expect(callbacks.onDisconnected).toHaveBeenCalled();
  });

  it("leaves transport backoff to the Socket.IO manager", () => {
    const { socket } = fixture();
    socket.emit("disconnect", "transport close");
    vi.advanceTimersByTime(9000);
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("does not retry an intentional client disconnect", () => {
    const { socket } = fixture();
    socket.active = false;
    socket.emit("disconnect", "io client disconnect");
    vi.advanceTimersByTime(9000);
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("allows a manual retry without emitting or replaying mutations", () => {
    const { socket, recovery } = fixture();
    recovery.reconnect();
    expect(socket.connect).toHaveBeenCalledOnce();
    socket.connected = true;
    recovery.reconnect();
    expect(socket.connect).toHaveBeenCalledOnce();
  });

  it("removes its listeners and timers on disposal without removing consumer listeners", () => {
    const { socket, callbacks, recovery } = fixture();
    const consumer = vi.fn();
    socket.on("connect", consumer);
    recovery.dispose();
    socket.emit("connect");
    vi.advanceTimersByTime(10000);
    expect(consumer).toHaveBeenCalledOnce();
    expect(callbacks.onConnected).not.toHaveBeenCalled();
    expect(callbacks.onLongDisconnect).not.toHaveBeenCalled();
    expect(socket.listenerCount("disconnect")).toBe(0);
    expect(socket.listenerCount("connect_error")).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
