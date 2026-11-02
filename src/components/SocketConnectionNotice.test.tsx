import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SocketConnectionNotice from "./SocketConnectionNotice";

describe("control connection notice", () => {
  it("shows automatic recovery before the long-outage threshold", () => {
    const html = renderToStaticMarkup(
      <SocketConnectionNotice isConnected={false} isDisconnectedTooLong={false} reconnect={vi.fn()} />,
    );
    expect(html).toContain("đang kết nối lại");
    expect(html).not.toContain("<button");
  });

  it("offers a manual connection button for a prolonged outage", () => {
    const html = renderToStaticMarkup(
      <SocketConnectionNotice isConnected={false} isDisconnectedTooLong reconnect={vi.fn()} />,
    );
    expect(html).toContain("Kết nối lại");
    expect(html).toContain("<button");
  });

  it("removes the notice after recovery", () => {
    expect(renderToStaticMarkup(
      <SocketConnectionNotice isConnected isDisconnectedTooLong={false} reconnect={vi.fn()} />,
    )).toBe("");
  });
});
