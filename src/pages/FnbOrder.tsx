import BottomSheet from "@/components/BottomSheet";
import FnbMenuItem from "@/components/FnbMenuItem";
import OrderList from "@/components/OrderList";
import { toast } from "@/components/ToastContainer";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";
import { useFnbMutations } from "@/hooks/useFnbMutations";
import { useFnbOrdersQuery } from "@/hooks/useFnbOrdersQuery";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SnackIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect
      x="9"
      y="2"
      width="2"
      height="7"
      rx="1"
      fill="currentColor"
      opacity="0.7"
    />
    <rect x="11.5" y="1.5" width="2" height="8" rx="1" fill="currentColor" />
    <rect
      x="14"
      y="2.5"
      width="2"
      height="6.5"
      rx="1"
      fill="currentColor"
      opacity="0.8"
    />
    <path
      d="M5.5 9.5 7.5 20.5h9l2-11H5.5z"
      fill="currentColor"
      opacity="0.18"
    />
    <path
      d="M5.5 9.5 7.5 20.5h9l2-11H5.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M7 9.5h10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8.5 13h7M8.5 16h7"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

const DrinkIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M8.5 8.5h7l-1.1 10.2c-.1.9-.9 1.6-1.8 1.6h-1.2c-.9 0-1.7-.7-1.8-1.6L8.5 8.5z"
      fill="currentColor"
      opacity="0.18"
    />
    <path
      d="M8.5 8.5h7l-1.1 10.2c-.1.9-.9 1.6-1.8 1.6h-1.2c-.9 0-1.7-.7-1.8-1.6L8.5 8.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 8.5h9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <ellipse
      cx="12"
      cy="8.5"
      rx="4.5"
      ry="1.3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M16 4.5v1.5M16 4.5h2.2c.3 0 .5.3.4.5l-1.6 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 12.5c1.2 1 2.8 1 4 0"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.6"
    />
    <circle cx="10.5" cy="14.5" r="0.7" fill="currentColor" opacity="0.45" />
    <circle cx="13.5" cy="16" r="0.6" fill="currentColor" opacity="0.35" />
  </svg>
);

const isSnackCategory = (id: string) => id === "snack" || id === "snacks";
const isDrinkCategory = (id: string) => id === "drink" || id === "drinks";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; helpText: string; icon: React.ReactNode }
> = {
  snack: {
    label: "Snacks",
    helpText: "",
    icon: <SnackIcon />,
  },
  snacks: {
    label: "Snacks",
    helpText: "Đồ ăn vặt",
    icon: <SnackIcon />,
  },
  drink: {
    label: "Nước",
    helpText: "",
    icon: <DrinkIcon />,
  },
  drinks: {
    label: "Nước uống",
    helpText: "Thức uống",
    icon: <DrinkIcon />,
  },
};

const getCategoryConfig = (id: string) =>
  CATEGORY_CONFIG[id] ?? {
    label: id,
    helpText: id,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
      </svg>
    ),
  };

const CART_HINT_DELAY_MS = 3500;
const CART_HINT_VISIBLE_MS = 2000;

const FnbOrder: React.FC = () => {
  const {
    data: fnbMenu,
    isLoading,
    isError,
    refetch: refetchMenu,
  } = useFnbMenuQuery({ refetchInterval: 30_000 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [categories, setCategories] = useState<FnbCategory[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{
    id: string;
    image: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const [showCartHint, setShowCartHint] = useState(false);
  const cartHintTimersRef = useRef<{
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
  }>({});
  const { submitCart } = useFnbMutations();
  const isSubmitting = submitCart.isPending;
  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useFnbOrdersQuery(roomId);

  const clearCartHintTimers = () => {
    const timers = cartHintTimersRef.current;
    if (timers.show) clearTimeout(timers.show);
    if (timers.hide) clearTimeout(timers.hide);
    timers.show = undefined;
    timers.hide = undefined;
  };

  const scheduleCartHint = () => {
    clearCartHintTimers();
    setShowCartHint(false);

    const timers = cartHintTimersRef.current;
    timers.show = setTimeout(() => {
      setShowCartHint(true);
      timers.hide = setTimeout(() => {
        setShowCartHint(false);
      }, CART_HINT_VISIBLE_MS);
    }, CART_HINT_DELAY_MS);
  };

  // Refetch menu khi quay lại tab Menu để đồng bộ tồn kho mới nhất
  useEffect(() => {
    if (activeTab === "menu") {
      refetchMenu();
    }
  }, [activeTab, refetchMenu]);

  useEffect(() => {
    const timers = cartHintTimersRef.current;
    return () => {
      if (timers.show) clearTimeout(timers.show);
      if (timers.hide) clearTimeout(timers.hide);
    };
  }, []);

  useEffect(() => {
    if (isCartModalOpen) {
      setShowCartHint(false);
    }
  }, [isCartModalOpen]);

  useEffect(() => {
    if (cart.length === 0) {
      setShowCartHint(false);
      clearCartHintTimers();
    }
  }, [cart.length]);

  // Tạo danh sách categories từ items
  useEffect(() => {
    if (fnbMenu?.items) {
      const uniqueCategories = Array.from(
        new Set(fnbMenu.items.map((item) => item.category)),
      ).filter(Boolean) as string[]; // Đảm bảo các giá trị là string

      const categoryList: FnbCategory[] = uniqueCategories.map((category) => ({
        id: category, // category đã là string nên id chắc chắn là string
        name:
          category === "snacks"
            ? "Snacks"
            : category === "drinks"
              ? "Drinks"
              : category,
      }));

      setCategories(categoryList);

      // Nếu có categories và chưa có category được chọn, chọn category đầu tiên
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0].id);
      }
    }
  }, [fnbMenu, selectedCategory]);

  // KHÔNG sync cart từ server - cart chỉ là local state để user build order mới

  const handleAddToCart = async (
    item: FnbItem,
    variant?: FnbVariant,
    buttonElement?: HTMLElement,
  ) => {
    // Prevent double click
    if (isAdding) {
      return;
    }

    // Kiểm tra số lượng còn lại theo inventory.quantity
    const currentQuantity = variant
      ? (variant.inventory?.quantity ?? 0)
      : (item.inventory?.quantity ?? 0);
    if (currentQuantity <= 0) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    setIsAdding(true);

    // Get item image
    const itemImage = variant?.image || item.image || item.existingImage || "";

    // Calculate positions for animation
    if (buttonElement && itemImage) {
      const buttonRect = buttonElement.getBoundingClientRect();
      const cartButton = document.querySelector(".floating-cart-button");
      const cartRect = cartButton?.getBoundingClientRect();

      if (cartRect) {
        setFlyingItem({
          id: `${item._id}-${variant?._id || "base"}-${Date.now()}`,
          image: itemImage,
          startX: buttonRect.left + buttonRect.width / 2,
          startY: buttonRect.top + buttonRect.height / 2,
          endX: cartRect.left + cartRect.width / 2,
          endY: cartRect.top + cartRect.height / 2,
        });

        // Clear animation after completion
        setTimeout(() => {
          setFlyingItem(null);
        }, 1000);
      }
    }

    try {
      // Prepare payload for API
      const itemId = variant?._id || item._id;
      const drinks: Record<string, number> = {};
      const snacks: Record<string, number> = {};

      if (item.category === "drink") {
        drinks[itemId] = 1;
      } else if (item.category === "snack") {
        snacks[itemId] = 1;
      }

      // KHÔNG gọi API ngay, chỉ update local cart state
      // API sẽ được gọi khi submit

      // Update local cart state
      const existingItem = cart.find((cartItem) =>
        variant
          ? cartItem.itemId === item._id && cartItem.variantId === variant._id
          : cartItem.itemId === item._id && !cartItem.variantId,
      );

      if (existingItem) {
        // Increase quantity if item already in cart
        setCart(
          cart.map((cartItem) =>
            variant
              ? cartItem.itemId === item._id &&
                cartItem.variantId === variant._id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
              : cartItem.itemId === item._id && !cartItem.variantId
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem,
          ),
        );
      } else {
        // Add new item to cart
        setCart([
          ...cart,
          {
            category: item.category,
            itemId: item._id,
            variantId: variant?._id,
            quantity: 1,
          },
        ]);
      }

      const itemName = variant ? `${item.name} - ${variant.name}` : item.name;
      toast.success(`Đã thêm ${itemName} vào giỏ hàng`);
      scheduleCartHint();
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    } finally {
      setIsAdding(false);
    }
  };

  // Helper function to parse variants (handle both array and JSON string)
  const parseVariants = (
    variants: FnbVariant[] | string | undefined,
  ): FnbVariant[] => {
    if (!variants) return [];
    if (Array.isArray(variants)) return variants;
    if (typeof variants === "string") {
      try {
        return JSON.parse(variants);
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleUpdateQuantity = async (
    itemId: string,
    quantity: number,
    variantId?: string,
  ) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId, variantId);
      return;
    }

    // Kiểm tra số lượng còn lại
    const item = fnbMenu?.items.find((i) => i._id === itemId);
    if (!item) return;

    let currentQuantity: number;
    if (variantId) {
      const variants: FnbVariant[] = parseVariants(item.variants);
      const variant = variants.find((v) => v._id === variantId);
      currentQuantity = variant
        ? (variant.inventory?.quantity ?? 0)
        : (item.inventory?.quantity ?? 0);
    } else {
      currentQuantity = item.inventory?.quantity ?? 0;
    }

    if (quantity > currentQuantity) {
      toast.error("Không thể thêm nữa, đã đạt số lượng tối đa");
      return;
    }

    // Chỉ update local cart state, KHÔNG gọi API ngay
    // API sẽ được gọi khi submit
    setCart(
      cart.map((item) =>
        variantId
          ? item.itemId === itemId && item.variantId === variantId
            ? { ...item, quantity }
            : item
          : item.itemId === itemId && !item.variantId
            ? { ...item, quantity }
            : item,
      ),
    );
  };

  const handleRemoveFromCart = (itemId: string, variantId?: string) => {
    // Chỉ update local cart state, KHÔNG gọi API ngay
    // API sẽ được gọi khi submit
    setCart(
      cart.filter((item) =>
        variantId
          ? !(item.itemId === itemId && item.variantId === variantId)
          : item.itemId !== itemId,
      ),
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, cartItem) => {
      const item = fnbMenu?.items.find((i) => i._id === cartItem.itemId);
      if (!item) return total;

      let itemPrice: number;

      if (cartItem.variantId) {
        // Get variant price
        const variants: FnbVariant[] = parseVariants(item.variants);
        const variant = variants.find((v) => v._id === cartItem.variantId);
        itemPrice = variant ? variant.price : item.price;
      } else {
        // Use item price directly
        itemPrice = item.price;
      }

      return total + itemPrice * cartItem.quantity;
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error("Vui lòng thêm món ăn vào giỏ hàng trước khi đặt hàng");
      return;
    }

    // Build payload từ cart với format mới
    const drinks: Record<string, number> = {};
    const snacks: Record<string, number> = {};

    cart.forEach((cartItem) => {
      const item = fnbMenu?.items.find((i) => i._id === cartItem.itemId);
      if (!item) return;

      const cartItemId = cartItem.variantId || cartItem.itemId;
      if (item.category === "drink") {
        drinks[cartItemId] = (drinks[cartItemId] || 0) + cartItem.quantity;
      } else if (item.category === "snack") {
        snacks[cartItemId] = (snacks[cartItemId] || 0) + cartItem.quantity;
      }
    });

    const payload = {
      cart: { drinks, snacks },
    };

    try {
      // Gọi API mới submit-cart
      await submitCart.mutateAsync({ payload, roomId });

      toast.success("Đã gửi đơn hàng thành công!");
      setIsCartModalOpen(false);

      // Clear cart sau khi submit để user có thể tạo order mới
      setCart([]);

      // Refetch orders và menu để cập nhật danh sách và số lượng
      refetchOrders();
      refetchMenu();
    } catch (error) {
      console.error("Submit order error:", error);
      toast.error("Đặt hàng thất bại. Vui lòng thử lại!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">
          Không thể tải menu. Vui lòng thử lại sau.
        </div>
      </div>
    );
  }

  const filteredItems = fnbMenu?.items.filter(
    (item) => item.category === selectedCategory && !item.parentId,
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50/90 to-neutral-50">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5">
          <h1 className="text-base md:text-lg font-bold text-gray-800 shrink-0">
            Đặt món
          </h1>

          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <div className="bg-gray-100 rounded-xl p-0.5 flex min-w-0">
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "menu"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "orders"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Đơn đã đặt
                {(orders?.length || 0) > 0 && (
                  <span className="ml-1 text-xs opacity-80">
                    ({orders?.length})
                  </span>
                )}
              </button>
            </div>

            <div className="relative shrink-0">
              {showCartHint && cartItemCount > 0 && (
                <div
                  className="absolute right-0 top-[calc(100%+6px)] z-20 whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 shadow-lg pointer-events-none transition-opacity duration-300"
                  role="status"
                >
                  Ấn vào để đặt
                  <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
                </div>
              )}
              <button
                onClick={() => {
                  setShowCartHint(false);
                  clearCartHintTimers();
                  setIsCartModalOpen(true);
                }}
                disabled={isSubmitting}
                className={`floating-cart-button relative flex items-center gap-1.5 shrink-0 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  cartItemCount > 0
                    ? "bg-gradient-to-br from-primary to-primary-deeper text-primary-foreground px-2.5 md:px-3 py-1.5 shadow-brand-soft hover:shadow-brand-glow"
                    : "w-10 h-10 justify-center bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Giỏ hàng"
                aria-label={`Giỏ hàng${cartItemCount > 0 ? `, ${cartItemCount} món` : ""}`}
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {cartItemCount > 0 && (
                <>
                  <span className="text-sm font-bold tabular-nums">
                    {cartItemCount}
                  </span>
                  <span className="hidden sm:inline text-xs font-semibold opacity-90">
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </span>
                </>
              )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-8">
        {activeTab === "menu" ? (
          <div className="relative">
            {/* macOS-style Category Dock — glass, item cuộn phía sau */}
            <div className="fixed left-1.5 md:left-2 top-1/2 z-20 -translate-y-1/2 pointer-events-none">
              <div className="pointer-events-auto isolate flex flex-col items-center gap-1.5 rounded-xl border border-white/35 bg-white/15 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 md:rounded-2xl md:p-2">
                <p className="text-[8px] md:text-[9px] font-semibold text-gray-400 uppercase tracking-wide px-0.5 text-center leading-tight">
                  Chọn
                  <br />
                  danh mục
                </p>
                <div className="w-full h-px bg-gray-200/80" />
                {categories.map((category) => {
                  const config = getCategoryConfig(category.id);
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      className={`group flex flex-col items-center gap-0.5 w-[3.75rem] md:w-[4rem] py-1.5 px-0.5 rounded-lg md:rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary/15 ring-2 ring-primary shadow-brand-soft scale-105 backdrop-blur-sm"
                          : "hover:bg-white/40 hover:shadow-md hover:scale-105"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isSnackCategory(category.id)
                              ? "bg-amber-50/70 text-amber-600 backdrop-blur-sm"
                              : isDrinkCategory(category.id)
                                ? "bg-sky-50/70 text-sky-500 backdrop-blur-sm"
                                : "bg-white/50 text-gray-600 backdrop-blur-sm"
                        }`}
                      >
                        {config.icon}
                      </div>
                      <span
                        className={`text-[9px] md:text-[10px] font-bold leading-tight text-center ${
                          isActive ? "text-primary" : "text-gray-700"
                        }`}
                      >
                        {config.label}
                      </span>
                      <span
                        className={`text-[8px] md:text-[9px] leading-tight text-center ${
                          isActive ? "text-primary/70" : "text-gray-400"
                        }`}
                      >
                        {config.helpText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Grid — full width, item cuộn dưới dock glass */}
            <div className="px-2 pt-2 md:px-3 md:pt-3">
              <div className="grid grid-cols-3 items-stretch gap-2 lg:grid-cols-4">
                {filteredItems?.map((item) => (
                  <FnbMenuItem
                    key={item._id}
                    item={item}
                    cart={cart}
                    compact
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                    onOpenCart={() => setIsCartModalOpen(true)}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "orders" ? (
          <div className="px-4 pt-3">
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => refetchOrders()}
                disabled={ordersLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                title="Làm mới"
              >
                <svg
                  className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Làm mới
              </button>
            </div>
            <OrderList orders={orders || []} isLoading={ordersLoading} />
          </div>
        ) : null}
      </div>

      {/* Cart Bottom Sheet */}
      <BottomSheet
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        title={`Giỏ hàng (${cart.length})`}
        maxHeight="85vh"
      >
        <div className="flex flex-col h-full">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Giỏ hàng trống
              </h3>
              <p className="text-gray-400 text-center px-8">
                Hãy chọn món ngon để thêm vào giỏ hàng nhé!
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {cart.map((cartItem, index) => {
                    const item = fnbMenu?.items.find(
                      (i) => i._id === cartItem.itemId,
                    );
                    if (!item) return null;

                    // Get variant info if exists
                    let variant: FnbVariant | undefined;
                    let itemName = item.name;
                    let itemPrice = item.price;
                    let itemImage = item.image || item.existingImage;

                    if (cartItem.variantId) {
                      const variants: FnbVariant[] = parseVariants(
                        item.variants,
                      );
                      variant = variants.find(
                        (v) => v._id === cartItem.variantId,
                      );
                      if (variant) {
                        itemName = `${item.name} - ${variant.name}`;
                        itemPrice = variant.price;
                        itemImage = variant.image || itemImage;
                      }
                    }

                    const totalItemPrice = (
                      itemPrice * cartItem.quantity
                    ).toLocaleString("vi-VN");

                    return (
                      <div
                        key={`${cartItem.itemId}-${
                          cartItem.variantId || "base"
                        }-${index}`}
                        className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-3"
                      >
                        {/* Item Image */}
                        <div className="flex-shrink-0">
                          <div className="w-24 aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img
                              src={itemImage || ""}
                              alt={itemName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">
                            {itemName}
                          </h3>
                          <p className="text-sm text-brand-600 font-bold">
                            {totalItemPrice}đ
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleUpdateQuantity(
                                item._id,
                                cartItem.quantity - 1,
                                cartItem.variantId,
                              )
                            }
                          >
                            <svg
                              className="w-3 h-3 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="text-sm font-bold text-brand-600 min-w-[1.5rem] text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleUpdateQuantity(
                                item._id,
                                cartItem.quantity + 1,
                                cartItem.variantId,
                              )
                            }
                          >
                            <svg
                              className="w-3 h-3 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() =>
                            handleRemoveFromCart(item._id, cartItem.variantId)
                          }
                          disabled={isSubmitting}
                          className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer with Total and Order Button */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-semibold text-gray-800">
                    Tổng cộng:
                  </span>
                  <span className="text-lg font-bold text-brand-600">
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <button
                  className="w-full py-2.5 rounded-2xl font-semibold text-base transition-all bg-gradient-to-r from-primary to-primary-deep text-primary-foreground hover:from-primary-hover hover:to-primary-deeper hover:shadow-brand-soft disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none relative"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đặt hàng"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Flying Item Animation */}
      {flyingItem && (
        <div
          className="fixed z-50 pointer-events-none animate-fly-to-cart"
          style={
            {
              left: flyingItem.startX - 20,
              top: flyingItem.startY - 20,
              "--start-x": "0px",
              "--start-y": "0px",
              "--mid-x": `${(flyingItem.endX - flyingItem.startX) / 2}px`,
              "--mid-y": `${(flyingItem.endY - flyingItem.startY) / 2 - 50}px`,
              "--end-x": `${flyingItem.endX - flyingItem.startX}px`,
              "--end-y": `${flyingItem.endY - flyingItem.startY}px`,
            } as React.CSSProperties
          }
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">
            <img
              src={flyingItem.image}
              alt="Flying item"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FnbOrder;
