import BellAlertIcon from "@/assets/icons/BellAlertIcon";
import HomeIcon from "@/assets/icons/HomeIcon";
import ListIcon from "@/assets/icons/ListIcon";
import { logo } from "@/assets/images";
import useRoom from "@/hooks/useRoom";
import { useSongName } from "@/hooks/useSongName";
import { getRoomDisplayNumber } from "@/utils/roomDisplayNumber";
import { ROOM_PIN_ENABLED } from "@/utils/roomPin";
import { useQueryClient } from "@tanstack/react-query";
import BillSummary from "./BillSummary";
import RoomPinModal from "./RoomPinModal";
import RoomSelectModal from "./RoomSelectModal";
import debounce from "lodash/debounce";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Switch from "./Switch";
import { toast } from "./ToastContainer";
import BookingCodeModal from "./BookingCodeModal";

// Icon component for F&B
const FoodIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
    />
  </svg>
);

/** Fullscreen API — đóng bàn phím ảo lúc này hay flash đen (Chromium/WebKit). */
const isDocumentFullscreen = () => {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
};

const Header: React.FC = () => {
  // Gộp trạng thái tìm kiếm vào một object
  const [searchState, setSearchState] = useState({
    term: "",
    debouncedTerm: "",
    showSuggestions: false,
  });

  // Dùng một ref để theo dõi các khoảng trắng
  const inputValueRef = useRef<string>("");

  const [isKaraoke, setIsKaraoke] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const blurCloseTimeoutRef = useRef<number | null>(null);
  const inputFocusedAtRef = useRef(0);

  /** Tablet: tap control trong vùng search không được blur input (tránh bàn phím giật). */
  const keepSearchInputFocus = (e: React.PointerEvent) => {
    e.preventDefault();
  };

  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const roomDisplayNumber = roomId ? getRoomDisplayNumber(roomId) : null;
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isRoomSelectModalOpen, setIsRoomSelectModalOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const queryClient = useQueryClient();
  const { mutate: sendNotification } = useRoom();

  // Tính toán các biến thường dùng
  const isSearchPage = location.pathname.includes("/search");
  const isHomePage = location.pathname === "/" || location.pathname === "";

  const showRoomSelectModal = () => {
    setIsRoomSelectModalOpen(true);
  };

  const openPinModal = () => {
    setIsPinModalOpen(true);
  };

  const handleRoomButtonClick = () => {
    if (ROOM_PIN_ENABLED) {
      openPinModal();
      return;
    }
    showRoomSelectModal();
  };

  const handlePinVerified = () => {
    setIsPinModalOpen(false);
    showRoomSelectModal();
  };

  const ensureRoomSelected = () => {
    if (!roomId) {
      showRoomSelectModal();
      return false;
    }
    return true;
  };

  const handleHeaderTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;

    if (startX === null || endX === null) return;

    const deltaX = endX - startX;
    const startedAtEdge = startX < 60; // gần mép trái mới kích hoạt
    const isRightSwipe = deltaX > 80;

    if (startedAtEdge && isRightSwipe) {
      if (ROOM_PIN_ENABLED) {
        openPinModal();
      } else {
        showRoomSelectModal();
      }
    }
  };

  // Đồng bộ URL params với state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query") || "";
    const karaoke = params.get("karaoke") || "true";

    // Chỉ cập nhật khi giá trị thay đổi và không phải từ việc clear
    if (query !== inputValueRef.current) {
      setSearchState((prev) => ({
        ...prev,
        term: query,
        debouncedTerm: query,
      }));
      // Cập nhật giá trị trong inputValueRef
      inputValueRef.current = query;
    }

    setIsKaraoke(karaoke === "true");
  }, [location.search]); // Sử dụng inputValueRef.current thay vì searchState.term

  // Một debounce cho URL navigate + gợi ý autocomplete (tránh 2 timer 600ms/800ms chạy song song)
  const debouncedNavigate = useMemo(
    () =>
      debounce((query: string) => {
        setSearchState((prev) =>
          prev.debouncedTerm === query
            ? prev
            : { ...prev, debouncedTerm: query },
        );

        const baseUrl = `/search?roomId=${roomId}&karaoke=${isKaraoke}`;

        if (query.trim().length > 0) {
          navigate(`${baseUrl}&query=${encodeURIComponent(query)}`);
        } else if (isSearchPage) {
          navigate(baseUrl);
        } else if (!isHomePage) {
          navigate(baseUrl);
        }
      }, 500),
    [roomId, isKaraoke, isSearchPage, isHomePage, navigate],
  );

  const closeSuggestions = useCallback(() => {
    if (blurCloseTimeoutRef.current !== null) {
      window.clearTimeout(blurCloseTimeoutRef.current);
      blurCloseTimeoutRef.current = null;
    }
    setSearchState((prev) =>
      prev.showSuggestions ? { ...prev, showSuggestions: false } : prev,
    );
  }, []);

  const blurSearchInput = useCallback(() => {
    const input = inputRef.current;
    if (input && input === document.activeElement) {
      input.blur();
    }
  }, []);

  const dismissSearchKeyboard = useCallback(() => {
    closeSuggestions();
    blurSearchInput();
  }, [blurSearchInput, closeSuggestions]);

  /** Sau submit / chọn gợi ý: đóng gợi ý + blur input để ẩn bàn phím. */
  const dismissSearchAfterCommit = useCallback(() => {
    closeSuggestions();
    // Fullscreen: blur sau paint để tránh flash đen khi bàn phím đóng cùng navigate.
    if (isDocumentFullscreen()) {
      window.setTimeout(() => blurSearchInput(), 0);
      return;
    }
    blurSearchInput();
  }, [blurSearchInput, closeSuggestions]);

  // Click/touch outside: đóng gợi ý + blur input (tablet hay giữ focus khiến tap không ăn)
  useEffect(() => {
    const handlePointerOutside = (event: Event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        dismissSearchKeyboard();
      }
    };

    document.addEventListener("mousedown", handlePointerOutside, true);
    document.addEventListener("touchstart", handlePointerOutside, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("mousedown", handlePointerOutside, true);
      document.removeEventListener("touchstart", handlePointerOutside, true);
    };
  }, [dismissSearchKeyboard]);

  // Chỉ ẩn bàn phím khi cuộn danh sách kết quả — không blur khi cuộn gợi ý / layout shift lúc mở keyboard
  useEffect(() => {
    const mainScrollEl = document.querySelector("[data-main-scroll]");
    if (!mainScrollEl) return;

    let scrollCloseTimer: number | null = null;
    const handleScroll = () => {
      if (Date.now() - inputFocusedAtRef.current < 400) return;
      if (scrollCloseTimer !== null) return;
      scrollCloseTimer = window.setTimeout(() => {
        scrollCloseTimer = null;
        dismissSearchKeyboard();
      }, 80);
    };

    mainScrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      mainScrollEl.removeEventListener("scroll", handleScroll);
      if (scrollCloseTimer !== null) {
        window.clearTimeout(scrollCloseTimer);
      }
    };
  }, [dismissSearchKeyboard]);

  // Đóng gợi ý khi chuyển trang
  useEffect(() => {
    closeSuggestions();
  }, [location.pathname, closeSuggestions]);

  const searchTermRef = useRef(searchState.term);
  searchTermRef.current = searchState.term;

  // Chỉ cập nhật URL khi toggle karaoke — không navigate mỗi lần gõ phím
  useEffect(() => {
    if (!roomId || !isSearchPage || !searchTermRef.current) return;
    const baseUrl = `/search?roomId=${roomId}`;
    navigate(
      `${baseUrl}&query=${encodeURIComponent(
        searchTermRef.current,
      )}&karaoke=${isKaraoke}`,
    );
  }, [isKaraoke, roomId, isSearchPage, navigate]);

  // Handle input change với cách tiếp cận tối ưu hơn
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lấy giá trị trực tiếp từ input để đảm bảo khoảng trắng được giữ nguyên
    const value = e.target.value;

    // Lưu giá trị thực tế vào ref
    inputValueRef.current = value;

    setSearchState((prev) => ({
      ...prev,
      term: value,
      showSuggestions: true,
    }));

    // Trigger navigation with debounce - không làm thay đổi giá trị hiển thị
    debouncedNavigate(value);
  };

  // Query cho auto complete suggestions
  const { data: songNameSuggestions } = useSongName(searchState.debouncedTerm, {
    enabled:
      !!roomId &&
      searchState.showSuggestions &&
      searchState.debouncedTerm.length >= 2,
  });

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ensureRoomSelected()) return;

    debouncedNavigate.cancel();
    const query = inputValueRef.current;

    setSearchState((prev) => ({
      ...prev,
      debouncedTerm: query,
      showSuggestions: false,
    }));

    const baseUrl = `/search?roomId=${roomId}&karaoke=${isKaraoke}`;
    if (query.trim().length > 0) {
      navigate(`${baseUrl}&query=${encodeURIComponent(query)}`);
    }

    dismissSearchAfterCommit();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (!ensureRoomSelected()) return;
    debouncedNavigate.cancel();

    setSearchState({
      term: suggestion,
      debouncedTerm: suggestion,
      showSuggestions: false,
    });

    // Cập nhật giá trị trong inputValueRef
    inputValueRef.current = suggestion;

    // Navigate immediately for suggestion selection (no debounce)
    // Đối với suggestion, sử dụng trim() là phù hợp vì đây là text từ gợi ý
    navigate(
      `/search?roomId=${roomId}&query=${encodeURIComponent(
        suggestion,
      )}&karaoke=${isKaraoke}`,
    );

    dismissSearchAfterCommit();
  };

  const handleClearSearch = () => {
    debouncedNavigate.cancel();

    setSearchState({
      term: "",
      debouncedTerm: "",
      showSuggestions: false,
    });

    // Cập nhật giá trị trong inputValueRef
    inputValueRef.current = "";

    queryClient.removeQueries({ queryKey: ["songName"] });

    if (isSearchPage && roomId) {
      navigate(`/search?roomId=${roomId}&karaoke=${isKaraoke}`);
    }

    const input = inputRef.current;
    if (input && document.activeElement !== input) {
      input.focus();
    }
  };

  const handleHomeNavigation = () => {
    if (!ensureRoomSelected()) return;
    navigate(`/?roomId=${roomId}&karaoke=${isKaraoke}`);
  };

  /** Logo: chỉ về home, không mở PIN / chọn phòng */
  const handleLogoClick = () => {
    navigate(`/?roomId=${roomId}&karaoke=${isKaraoke}`);
  };

  const handleFnbNavigation = () => {
    if (!ensureRoomSelected()) return;
    navigate(`/fnb?roomId=${roomId}`);
  };

  // State để track việc đã gửi notification gần đây
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // State để mở/đóng modal booking code
  const [isBookingCodeModalOpen, setIsBookingCodeModalOpen] = useState(false);

  // State để mở/đóng modal xác nhận gọi nhân viên
  const [isConfirmSupportModalOpen, setIsConfirmSupportModalOpen] =
    useState(false);

  const handleNotification = () => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;

    if (!ensureRoomSelected()) return;
    // Nếu chưa gửi notification nào hoặc đã qua 2 giây từ lần cuối
    if (lastNotificationTime === 0 || timeSinceLastNotification >= 2000) {
      // Gửi ngay lập tức
      sendNotification(
        { roomId, message: "Yêu cầu hỗ trợ" },
        {
          onSuccess: () => {
            toast.success("Đã yêu cầu nhân viên hỗ trợ");
          },
          onError: () => {
            toast.error("Gặp lỗi khi yêu cầu nhân viên hỗ trợ");
          },
        },
      );
      setLastNotificationTime(now);
    } else {
      // Nếu spam quá nhanh, hiển thị thông báo
      toast.warning("Vui lòng đợi một chút trước khi gửi yêu cầu tiếp theo");
    }
  };

  // Hủy debounce khi component unmount
  useEffect(() => {
    return () => {
      debouncedNavigate.cancel();
      if (blurCloseTimeoutRef.current !== null) {
        window.clearTimeout(blurCloseTimeoutRef.current);
      }
      queryClient.cancelQueries({ queryKey: ["songName"] });
    };
  }, [debouncedNavigate, queryClient]);

  return (
    <header
      className="relative z-50 flex items-center justify-between border-b border-primary/35 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 px-3 py-2 text-white shadow-[0_3px_18px_-4px_rgba(0,0,0,0.4)]"
      onTouchStart={handleHeaderTouchStart}
      onTouchEnd={handleHeaderTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-95"
        aria-hidden
      />

      {/* Logo */}
      <img
        src={logo}
        alt="Jozo"
        className="h-9 w-20 shrink-0 cursor-pointer object-cover animate-breathing sm:h-10 sm:w-24"
        onClick={handleLogoClick}
      />

      {/* Search Input */}
      <div
        className="relative flex w-1/2 min-w-0 items-center gap-x-2"
        ref={searchContainerRef}
      >
        <form className="relative w-full" onSubmit={handleSearchSubmit}>
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
            value={searchState.term}
            onChange={handleInputChange}
            onFocus={() => {
              inputFocusedAtRef.current = Date.now();
              if (blurCloseTimeoutRef.current !== null) {
                window.clearTimeout(blurCloseTimeoutRef.current);
                blurCloseTimeoutRef.current = null;
              }
              if (!roomId) {
                showRoomSelectModal();
                return;
              }
              setSearchState((prev) => ({ ...prev, showSuggestions: true }));
              if (!isSearchPage) {
                navigate(`/search?roomId=${roomId}&karaoke=${isKaraoke}`);
              }
            }}
            onBlur={() => {
              // Delay nhỏ để tap chọn gợi ý kịp fire trước khi đóng
              blurCloseTimeoutRef.current = window.setTimeout(() => {
                blurCloseTimeoutRef.current = null;
                closeSuggestions();
              }, 150);
            }}
            className="w-full rounded-lg border border-white/10 bg-black/25 py-2 pl-2.5 pr-8 text-sm text-white shadow-inner backdrop-blur-sm placeholder:text-white/45 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-[border-color,box-shadow]"
          />
          {searchState.term && (
            <button
              type="button"
              onClick={handleClearSearch}
              onPointerDown={keepSearchInputFocus}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Xóa tìm kiếm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </form>

        {/* Auto Complete Suggestions */}
        {searchState.showSuggestions &&
          songNameSuggestions &&
          songNameSuggestions.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-[min(50vh,320px)] w-full overflow-y-auto rounded-lg border border-primary/25 bg-brand-950/92 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-primary/20 bg-primary/10">
                <div className="p-1.5 text-xs font-medium text-white">
                  Gợi ý
                </div>
                <button
                  type="button"
                  className="p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={closeSuggestions}
                  onPointerDown={keepSearchInputFocus}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {songNameSuggestions?.map((suggestion, index) => (
                <div
                  key={index}
                  className="cursor-pointer border-b border-white/5 p-2 text-xs text-white/90 last:border-b-0 hover:bg-primary/15 hover:text-white"
                  onPointerDown={keepSearchInputFocus}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

        <div
          className="flex items-center gap-x-1.5 rounded-full border border-white/10 bg-black/20 px-2 py-1 backdrop-blur-sm"
          onPointerDown={keepSearchInputFocus}
        >
          <span className="whitespace-nowrap text-xs text-white/85">
            Lời nhạc
          </span>
          <div className="origin-right scale-90">
            <Switch
              isChecked={isKaraoke}
              onChange={() => {
                if (!ensureRoomSelected()) return;
                setIsKaraoke(!isKaraoke);
                if (isSearchPage) {
                  navigate(
                    `/search?query=${encodeURIComponent(
                      searchState.term,
                    )}&karaoke=${!isKaraoke}&roomId=${roomId}`,
                  );
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Right: Contact with server */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 [&_svg]:size-5">
        <button
          className={
            !isHomePage
              ? "opacity-100 rounded-lg px-1.5 py-0.5 text-white/80 transition-colors hover:bg-primary/15 hover:text-brand-200"
              : "opacity-0"
          }
          onClick={handleHomeNavigation}
          title="Trang chủ"
        >
          <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight text-inherit sm:text-xs">
            <HomeIcon />
            <span>Trang chủ</span>
          </div>
        </button>

        <button
          onClick={() => setIsBookingCodeModalOpen(true)}
          className="rounded-lg px-1.5 py-0.5 text-white/80 transition-colors hover:bg-primary/15 hover:text-brand-200"
          title="Nhập mã đặt box"
        >
          <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight text-inherit sm:text-xs">
            <ListIcon />
            <span>Mã đặt chỗ</span>
          </div>
        </button>

        <button
          onClick={handleFnbNavigation}
          className="rounded-lg px-1.5 py-0.5 text-white/80 transition-colors hover:bg-primary/15 hover:text-brand-200"
          title="Đặt đồ ăn & thức uống"
        >
          <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight text-inherit sm:text-xs">
            <FoodIcon />
            <span>Order</span>
          </div>
        </button>

        <button
          onClick={() => setIsBillModalOpen(true)}
          className="rounded-lg px-1.5 py-0.5 text-white/80 transition-colors hover:bg-primary/15 hover:text-brand-200"
          title="Thông tin"
        >
          <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight text-inherit sm:text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 7.5h6M9 12h6m-6 4.5h3M7.5 3.75h9A1.5 1.5 0 0118 5.25v13.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"
              />
            </svg>
            <span>Thông tin</span>
          </div>
        </button>

        <button
          onClick={() => setIsConfirmSupportModalOpen(true)}
          className="rounded-lg px-1.5 py-0.5 text-white/80 transition-colors hover:bg-primary/15 hover:text-brand-200"
          title="Gọi nhân viên hỗ trợ"
        >
          <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight text-inherit sm:text-xs">
            <BellAlertIcon />
            <span>Hỗ trợ</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleRoomButtonClick}
          className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-0.5 transition-colors ${
            roomId
              ? "border-primary/40 bg-primary/20 hover:bg-primary/30"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
          title={ROOM_PIN_ENABLED ? "Nhập mã PIN" : "Chọn phòng"}
          aria-label={
            roomId ? `Phòng ${roomDisplayNumber ?? roomId}` : "Chọn phòng"
          }
        >
          <span className="text-[10px] leading-tight text-white/70">Phòng</span>
          <span className="text-sm font-bold leading-none tracking-wider text-primary-foreground sm:text-base">
            {roomDisplayNumber ?? "?"}
          </span>
        </button>
      </div>

      {/* Confirm Support Modal */}
      {isConfirmSupportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl border border-gray-700 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <BellAlertIcon />
                </div>
                <h2 className="text-xl font-bold text-white">Gọi nhân viên</h2>
              </div>
              <button
                onClick={() => setIsConfirmSupportModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-300 text-center mb-8">
              Bạn có muốn yêu cầu nhân viên hỗ trợ không?
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmSupportModalOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setIsConfirmSupportModalOpen(false);
                  handleNotification();
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-primary-deep hover:from-primary-hover hover:to-primary-deeper text-primary-foreground font-bold rounded-xl transition-all shadow-brand-glow"
              >
                Gọi nhân viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Code Modal */}
      <BookingCodeModal
        isOpen={isBookingCodeModalOpen}
        onClose={() => setIsBookingCodeModalOpen(false)}
        roomId={roomId}
      />

      {/* Bill Modal (chỉ fetch khi mở) */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130]">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-[90%] max-w-xl shadow-2xl border border-gray-700 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Thông tin phòng {roomDisplayNumber ?? "?"}
              </h2>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10"
                aria-label="Đóng bill"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <BillSummary autoFetch onClose={() => setIsBillModalOpen(false)} />
          </div>
        </div>
      )}

      {isPinModalOpen && (
        <RoomPinModal
          roomId={roomId || undefined}
          fixed
          onClose={() => setIsPinModalOpen(false)}
          onVerified={handlePinVerified}
        />
      )}

      <RoomSelectModal
        isOpen={isRoomSelectModalOpen}
        onClose={() => setIsRoomSelectModalOpen(false)}
      />
    </header>
  );
};

export default Header;
