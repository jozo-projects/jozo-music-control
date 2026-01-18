import BellAlertIcon from "@/assets/icons/BellAlertIcon";
import HomeIcon from "@/assets/icons/HomeIcon";
import ListIcon from "@/assets/icons/ListIcon";
import { logo } from "@/assets/images";
import useRoom from "@/hooks/useRoom";
import { useSongName } from "@/hooks/useSongName";
import { useQueryClient } from "@tanstack/react-query";
import BillSummary from "./BillSummary";
import debounce from "lodash/debounce";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
    />
  </svg>
);

const ROOM_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

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

  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const [isRoomScreenOpen, setIsRoomScreenOpen] = useState(!roomId);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const queryClient = useQueryClient();
  const { mutate: sendNotification } = useRoom();

  // Tính toán các biến thường dùng
  const isSearchPage = location.pathname.includes("/search");
  const isHomePage = location.pathname === "/" || location.pathname === "";

  const ensureRoomSelected = () => {
    if (!roomId) {
      setIsRoomScreenOpen(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    setIsRoomScreenOpen(!roomId);
  }, [roomId]);

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
      setIsRoomScreenOpen(true);
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

  // Xử lý debounce cho việc cập nhật debouncedTerm
  const debouncedSetTerm = useMemo(
    () =>
      debounce((term: string) => {
        setSearchState((prev) => ({
          ...prev,
          debouncedTerm: term,
        }));
      }, 800),
    []
  );

  // Cập nhật debounced term khi term thay đổi
  useEffect(() => {
    debouncedSetTerm(searchState.term);
    return () => debouncedSetTerm.cancel();
  }, [searchState.term, debouncedSetTerm]);

  // Tối ưu hóa hàm debounce navigation
  const debouncedNavigate = useMemo(
    () =>
      debounce((query: string) => {
        // KHÔNG sử dụng trim() để giữ lại khoảng trắng ở cuối
        const baseUrl = `/search?roomId=${roomId}&karaoke=${isKaraoke}`;

        if (query.trim().length > 0) {
          // Chỉ kiểm tra nếu query có ký tự khác khoảng trắng
          // Giữ lại khoảng trắng ở cuối bằng cách dùng trực tiếp query mà không trim()
          navigate(`${baseUrl}&query=${encodeURIComponent(query)}`);
        } else if (isSearchPage) {
          navigate(baseUrl);
        } else if (!isHomePage) {
          navigate(baseUrl);
        }
      }, 5000),
    [roomId, isKaraoke, isSearchPage, isHomePage, navigate]
  );

  // Click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchState((prev) => ({
          ...prev,
          showSuggestions: false,
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to trigger navigation when isKaraoke changes
  useEffect(() => {
    if (!roomId) return;
    if (isSearchPage && searchState.term) {
      const baseUrl = `/search?roomId=${roomId}`;
      // Giữ lại khoảng trắng ở cuối bằng cách dùng trực tiếp searchState.term mà không trim()
      navigate(
        `${baseUrl}&query=${encodeURIComponent(
          searchState.term
        )}&karaoke=${isKaraoke}`
      );
    }
  }, [isKaraoke, roomId, isSearchPage, searchState.term, navigate]);

  // Handle input change với cách tiếp cận tối ưu hơn
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureRoomSelected()) return;
    // Lấy giá trị trực tiếp từ input để đảm bảo khoảng trắng được giữ nguyên
    const value = e.target.value;

    // Log giá trị để debug
    console.log(`Input value: "${value}", length: ${value.length}`);

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
        suggestion
      )}&karaoke=${isKaraoke}`
    );
  };

  const handleClearSearch = () => {
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

    // Focus vào input để hiển thị bàn phím trên tablet
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleHomeNavigation = () => {
    if (!ensureRoomSelected()) return;
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
        }
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
      debouncedSetTerm.cancel();
      // Hủy các query đang pending để tránh memory leak
      queryClient.cancelQueries({ queryKey: ["songName"] });
    };
  }, [debouncedNavigate, debouncedSetTerm, queryClient]);

  return (
    <header
      className="bg-black text-white p-4 flex items-center justify-between shadow-md z-50"
      onTouchStart={handleHeaderTouchStart}
      onTouchEnd={handleHeaderTouchEnd}
    >
      {/* Logo */}
      <img
        src={logo}
        alt="Jozo"
        className="w-24 h-12 object-cover cursor-pointer animate-breathing"
        onClick={handleHomeNavigation}
      />

      {/* Search Input */}
      <div
        className="w-1/2 flex items-center gap-x-4 relative"
        ref={searchContainerRef}
      >
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
            value={inputValueRef.current}
            onChange={handleInputChange}
            onFocus={() => {
              if (!ensureRoomSelected()) return;
              setSearchState((prev) => ({ ...prev, showSuggestions: true }));
              if (!isSearchPage) {
                navigate(`/search?roomId=${roomId}&karaoke=${isKaraoke}`);
              }
            }}
            className="w-full p-3 bg-secondary text-white rounded-lg shadow-md focus:outline-none"
          />
          {searchState.term && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Auto Complete Suggestions */}
        {searchState.showSuggestions &&
          songNameSuggestions &&
          songNameSuggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg z-50 border border-gray-200 mt-1">
              <div className="flex justify-between items-center border-b border-gray-200">
                <div className="p-2 text-gray-600 font-medium">Gợi ý</div>
                <button
                  className="p-2 text-gray-500 hover:text-gray-800"
                  onClick={() =>
                    setSearchState((prev) => ({
                      ...prev,
                      showSuggestions: false,
                    }))
                  }
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
              {songNameSuggestions?.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

        <div className="flex items-center gap-x-2">
          <span className="text-sm whitespace-nowrap">Lời nhạc</span>
          <Switch
            isChecked={isKaraoke}
            onChange={() => {
              if (!ensureRoomSelected()) return;
              setIsKaraoke(!isKaraoke);
              if (isSearchPage) {
                navigate(
                  `/search?query=${encodeURIComponent(
                    searchState.term
                  )}&karaoke=${!isKaraoke}&roomId=${roomId}`
                );
              }
            }}
          />
        </div>
      </div>

      {/* Right: Contact with server */}
      <div className="flex items-center space-x-4">
        <button
          className={!isHomePage ? "opacity-100" : "opacity-0"}
          onClick={handleHomeNavigation}
          title="Trang chủ"
        >
          <div className="flex flex-col items-center gap-1 text-xs text-white/70">
            <HomeIcon />
            <span>Trang chủ</span>
          </div>
        </button>

        <button
          onClick={() => setIsBookingCodeModalOpen(true)}
          className="text-lightpink hover:text-lightpink/80"
          title="Nhập mã đặt chỗ"
        >
          <div className="flex flex-col items-center gap-1 text-xs text-white/70">
            <ListIcon />
            <span>Mã đặt chỗ</span>
          </div>
        </button>

        <button
          onClick={handleFnbNavigation}
          className="text-lightpink hover:text-lightpink/80"
          title="Đặt đồ ăn & thức uống"
        >
          <div className="flex flex-col items-center gap-1 text-xs text-white/70">
            <FoodIcon />
            <span>Order</span>
          </div>
        </button>

        <button
          onClick={() => setIsBillModalOpen(true)}
          className="text-lightpink hover:text-lightpink/80"
          title="Phiên sử dụng"
        >
          <div className="flex flex-col items-center gap-1 text-xs text-white/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 7.5h6M9 12h6m-6 4.5h3M7.5 3.75h9A1.5 1.5 0 0118 5.25v13.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"
              />
            </svg>
            <span>Phiên</span>
          </div>
        </button>

        <button
          onClick={() => setIsConfirmSupportModalOpen(true)}
          title="Gọi nhân viên hỗ trợ"
        >
          <div className="flex flex-col items-center gap-1 text-xs text-white/70">
            <BellAlertIcon />
            <span>Hỗ trợ</span>
          </div>
        </button>
      </div>

      {/* Confirm Support Modal */}
      {isConfirmSupportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl border border-gray-700 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-lightpink/20 rounded-full">
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
                className="flex-1 py-3 px-4 bg-lightpink hover:bg-lightpink/80 text-white font-bold rounded-xl transition-colors shadow-lg shadow-lightpink/30"
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
                Phiên sử dụng phòng {roomId || "?"}
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

      <div
        className={`fixed inset-0 z-[120] pointer-events-none transition-transform duration-300 ${
          isRoomScreenOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
        <div className="absolute inset-y-0 left-0 w-full max-w-xl bg-gray-900 text-white shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Room selection
              </p>
              <h2 className="text-lg font-bold">Chọn phòng để tiếp tục</h2>
            </div>
            <button
              onClick={() => setIsRoomScreenOpen(false)}
              className="p-2 rounded-full hover:bg-white/10"
              aria-label="Đóng chọn phòng"
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
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-white/70">
              Vuốt từ trái sang phải trên thanh tiêu đề để mở màn chọn phòng.
              Chỉ staff biết thao tác này.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {ROOM_OPTIONS.map((room) => (
                <button
                  key={room}
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("roomId", room);
                    setSearchParams(nextParams);
                    setIsRoomScreenOpen(false);
                  }}
                  className={`py-3 rounded-xl border transition-colors font-semibold ${
                    roomId === room
                      ? "bg-lightpink text-white border-lightpink"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Phòng {room}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
