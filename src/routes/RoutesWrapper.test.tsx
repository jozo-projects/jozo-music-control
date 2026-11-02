import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RoomSelectModal from "@/components/RoomSelectModal";
import RoutesWrapper from "./RoutesWrapper";

const state = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("@/hooks/useRoomIdGuard", () => ({ useRoomIdGuard: vi.fn() }));
vi.mock("@/routes/routes", () => ({ default: [] }));
vi.mock("@/components/ToastContainer", () => ({ toast: { error: vi.fn() } }));
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [state.params],
  useLocation: () => ({ pathname: "/", hash: "" }),
  useRoutes: () => <button>ADD_SONG_CONTROL</button>,
}));
vi.mock("react-dom", () => ({
  default: { createPortal: (children: ReactNode) => children },
}));

beforeEach(() => {
  state.params = new URLSearchParams();
  vi.stubGlobal("document", { body: {} });
});
afterEach(() => vi.unstubAllGlobals());

describe("required room selection", () => {
  it.each(["", "roomId=", "roomId=%20%20"])(
    "does not render any operational route before selecting a room: %s",
    (query) => {
      state.params = new URLSearchParams(query);
      const html = renderToStaticMarkup(<RoutesWrapper />);
      expect(html).not.toContain("ADD_SONG_CONTROL");
      expect(html).toContain("Chọn phòng để tiếp tục");
      expect(html).not.toContain("Đóng chọn phòng");
    },
  );

  it("renders controls once a room is selected", () => {
    state.params.set("roomId", "1");
    const html = renderToStaticMarkup(<RoutesWrapper />);
    expect(html).toContain("ADD_SONG_CONTROL");
    expect(html).not.toContain("Chọn phòng để tiếp tục");
  });

  it("does not offer dismissal of the picker without a room", () => {
    const html = renderToStaticMarkup(
      <RoomSelectModal isOpen onClose={vi.fn()} />,
    );
    expect(html).toContain("Chọn phòng để tiếp tục");
    expect(html).not.toContain("Đóng chọn phòng");
  });

  it("still allows closing the room switcher when a room is selected", () => {
    state.params.set("roomId", "1");
    const html = renderToStaticMarkup(
      <RoomSelectModal isOpen onClose={vi.fn()} />,
    );
    expect(html).toContain("Đóng chọn phòng");
  });
});
