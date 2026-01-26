import BottomSheet from "@/components/BottomSheet";
import FnbMenuItem from "@/components/FnbMenuItem";
import OrderList from "@/components/OrderList";
import { toast } from "@/components/ToastContainer";
import { useFnbMenuQuery } from "@/hooks/useFnbMenuQuery";
import { useFnbMutations } from "@/hooks/useFnbMutations";
import { useFnbOrdersQuery } from "@/hooks/useFnbOrdersQuery";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const CATEGORIES = {
  snack: "Snacks",
  drink: "Nước uống",
};

const FnbOrder: React.FC = () => {
  const {
    data: fnbMenu,
    isLoading,
    isError,
    refetch: refetchMenu,
  } = useFnbMenuQuery();
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
  const roomId = searchParams.get("roomId") || "1";
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const { submitCart } = useFnbMutations();
  const isSubmitting = submitCart.isPending;
  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useFnbOrdersQuery(roomId);

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

    // Kiểm tra số lượng còn lại
    const currentQuantity = variant
      ? variant.inventory.quantity
      : item.inventory?.quantity || parseInt(item.quantity || "0");
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
        ? variant.inventory.quantity
        : item.inventory?.quantity || parseInt(item.quantity || "0");
    } else {
      currentQuantity =
        item.inventory?.quantity || parseInt(item.quantity || "0");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-lightpink to-pink-600 bg-clip-text text-transparent mb-2">
              Đặt Đồ Ăn & Thức Uống
            </h1>
            <p className="text-gray-600">
              Chọn món ngon và đặt hàng ngay tại box
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-2xl p-1 flex">
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === "menu"
                    ? "bg-gradient-to-r from-lightpink to-pink-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === "orders"
                    ? "bg-gradient-to-r from-lightpink to-pink-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Đơn hàng ({orders?.length || 0})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {activeTab === "menu" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Categories */}
            <div className="lg:col-span-1 sticky top-4 self-start">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-lightpink to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                  Danh Mục
                </h2>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full p-4 rounded-xl text-left transition-all transform hover:scale-105 ${
                        selectedCategory === category.id
                          ? "bg-gradient-to-r from-lightpink to-pink-500 text-white shadow-lg"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span className="font-semibold whitespace-nowrap">
                        {CATEGORIES[category.id as keyof typeof CATEGORIES]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Menu Items */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-500">
                    {filteredItems?.length || 0} món
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                  {filteredItems?.map((item) => (
                    <FnbMenuItem
                      key={item._id}
                      item={item}
                      cart={cart}
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
          </div>
        ) : activeTab === "orders" ? (
          /* Orders Tab */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-lightpink to-pink-600 bg-clip-text text-transparent">
                Đơn hàng đã đặt
              </h2>
              <button
                onClick={() => refetchOrders()}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-lightpink to-pink-500 text-white rounded-xl hover:from-lightpink/90 hover:to-pink-500/90 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
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
                <span>Làm mới</span>
              </button>
            </div>
            <OrderList orders={orders || []} isLoading={ordersLoading} />
          </div>
        ) : null}
      </div>

      {/* Floating Cart Button - Chỉ hiển thị khi ở tab menu */}
      {activeTab === "menu" && (
        <div className="fixed bottom-20 right-6 z-30">
          <button
            onClick={() => setIsCartModalOpen(true)}
            disabled={isSubmitting}
            className="floating-cart-button bg-gradient-to-r from-lightpink to-pink-500 text-white p-3 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative">
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
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {cart.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              )}
            </div>
          </button>
        </div>
      )}

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
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200">
                            <img
                              src={
                                itemImage ||
                                "https://via.placeholder.com/56?text=No+Image"
                              }
                              alt={itemName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/56?text=No+Image";
                              }}
                            />
                          </div>
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">
                            {itemName}
                          </h3>
                          <p className="text-sm text-lightpink font-bold">
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
                          <span className="text-sm font-bold text-lightpink min-w-[1.5rem] text-center">
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
                  <span className="text-lg font-bold text-lightpink">
                    {calculateTotal().toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <button
                  className="w-full py-2.5 rounded-2xl font-semibold text-base transition-all bg-gradient-to-r from-lightpink to-pink-500 text-white hover:from-lightpink/90 hover:to-pink-500/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none relative"
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
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/40?text=No+Image";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FnbOrder;
