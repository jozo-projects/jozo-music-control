import React, { useState } from "react";

interface FnbMenuItemProps {
  item: FnbItem;
  cart?: OrderItem[];
  onAddToCart?: (
    item: FnbItem,
    variant?: FnbVariant,
    buttonElement?: HTMLElement,
  ) => void;
  onUpdateQuantity?: (
    itemId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  onRemoveFromCart?: (itemId: string, variantId?: string) => void;
  onOpenCart?: () => void;
  isSubmitting?: boolean;
}

const FnbMenuItem: React.FC<FnbMenuItemProps> = ({
  item,
  cart = [],
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onOpenCart,
  isSubmitting = false,
}) => {
  const [showVariantsModal, setShowVariantsModal] = useState(false);

  const defaultImage = "https://via.placeholder.com/150?text=No+Image";

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

  // Parse variants from array
  const variants: FnbVariant[] = parseVariants(item.variants);

  // Helper function to get quantity in cart for item
  const getItemQuantityInCart = (
    itemId: string,
    variantId?: string,
  ): number => {
    const cartItem = cart.find((cartItem) =>
      variantId
        ? cartItem.itemId === itemId && cartItem.variantId === variantId
        : cartItem.itemId === itemId && !cartItem.variantId,
    );
    return cartItem ? cartItem.quantity : 0;
  };

  // Helper function to get remaining quantity for item
  // Vì chỉ update local state (không gọi API ngay), nên cần trừ cart quantity
  const getRemainingQuantity = (
    _itemId: string,
    variantId?: string,
  ): number => {
    const baseQuantity = variantId
      ? variants.find((v) => v._id === variantId)?.inventory.quantity || 0
      : item.inventory?.quantity || parseInt(item.quantity || "0");

    const cartQuantity = getItemQuantityInCart(_itemId, variantId);
    return Math.max(0, baseQuantity - cartQuantity);
  };

  // Check if item/variant is available
  const isAvailable = getRemainingQuantity(item._id) > 0;

  const handleVariantQuantityChange = (variantId: string, change: number) => {
    const currentQuantity = getItemQuantityInCart(item._id, variantId);
    const newQuantity = Math.max(0, currentQuantity + change);

    if (change > 0) {
      // Add to cart
      if (onAddToCart) {
        const variant = variants.find((v) => v._id === variantId);
        if (variant) {
          onAddToCart(item, variant);
        }
      }
    } else if (change < 0) {
      // Update quantity in cart or remove if quantity becomes 0
      if (newQuantity === 0 && onRemoveFromCart) {
        onRemoveFromCart(item._id, variantId);
      } else if (onUpdateQuantity) {
        onUpdateQuantity(item._id, newQuantity, variantId);
      }
    }
  };

  const handleItemQuantityChange = (
    change: number,
    buttonElement?: HTMLElement,
  ) => {
    const currentQuantity = getItemQuantityInCart(item._id);
    const newQuantity = Math.max(0, currentQuantity + change);

    if (change > 0) {
      // Add to cart
      if (onAddToCart) {
        onAddToCart(item, undefined, buttonElement);
      }
    } else if (change < 0) {
      // Update quantity in cart or remove if quantity becomes 0
      if (newQuantity === 0 && onRemoveFromCart) {
        onRemoveFromCart(item._id);
      } else if (onUpdateQuantity) {
        onUpdateQuantity(item._id, newQuantity);
      }
    }
  };

  // If item has variants, show parent item with "Chọn loại" button
  if (item.hasVariant && variants.length > 0) {
    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-xl transition-all duration-300">
          {/* Item Image */}
          <div className="h-48 overflow-hidden relative flex-shrink-0">
            <img
              src={item.image || item.existingImage || defaultImage}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
          </div>

          {/* Item Info */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="mb-4">
                <div className="text-xl font-bold text-lightpink mb-1">
                  Từ{" "}
                  {Math.min(...variants.map((v) => v.price)).toLocaleString(
                    "vi-VN",
                  )}
                  đ
                </div>
                <span className="text-xs text-gray-500">
                  {variants.length} loại khác nhau
                </span>
              </div>
            </div>

            {/* Choose Variant Button */}
            <button
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-lightpink to-pink-500 text-white hover:from-lightpink/90 hover:to-pink-500/90 hover:shadow-lg transform hover:-translate-y-0.5"
              onClick={() => setShowVariantsModal(true)}
            >
              Chọn loại
            </button>
          </div>
        </div>

        {/* Variants Modal */}
        {showVariantsModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowVariantsModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">
                    {item.name}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {/* Cart Button */}
                    {onOpenCart && (
                      <button
                        onClick={() => {
                          onOpenCart();
                          setShowVariantsModal(false);
                        }}
                        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Xem giỏ hàng"
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                          />
                        </svg>
                        {cart.length > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border border-white">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                        )}
                      </button>
                    )}
                    {/* Close Button */}
                    <button
                      onClick={() => setShowVariantsModal(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Variants List */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4">
                  {variants.map((variant) => {
                    const remainingQuantity = getRemainingQuantity(
                      item._id,
                      variant._id,
                    );
                    const variantAvailable = remainingQuantity > 0;

                    return (
                      <div
                        key={variant._id}
                        className={`relative rounded-xl border-2 transition-all duration-300 ${
                          variantAvailable
                            ? "border-gray-200 hover:border-lightpink"
                            : "border-gray-200 opacity-75"
                        }`}
                        onClick={() => {
                          // Card click does nothing, only +/- buttons work
                        }}
                      >
                        {/* Out of Stock Badge */}
                        {!variantAvailable && (
                          <div className="absolute top-1 right-1 z-10">
                            <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                              HẾT
                            </div>
                          </div>
                        )}

                        {/* Variant Image - Small square */}
                        <div className="aspect-square overflow-hidden relative">
                          <img
                            src={
                              variant.image ||
                              item.image ||
                              item.existingImage ||
                              defaultImage
                            }
                            alt={variant.name}
                            className="w-full h-full object-cover rounded-t-xl"
                            onLoad={() => {}}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultImage;
                            }}
                          />
                          {/* Image overlay for out of stock */}
                          {!variantAvailable && (
                            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                          )}
                        </div>

                        {/* Variant Info - Compact */}
                        <div className="p-2">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                            {variant.name}
                          </h4>
                          <div className="text-sm font-bold text-lightpink mb-2">
                            {variant.price.toLocaleString("vi-VN")}đ
                          </div>

                          {/* Quantity Controls - Inline */}
                          {variantAvailable && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Còn {remainingQuantity}
                              </span>

                              <div className="flex items-center space-x-1">
                                <button
                                  className="w-6 h-6 rounded-full bg-lightpink text-white flex items-center justify-center hover:bg-pink-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isSubmitting}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVariantQuantityChange(
                                      variant._id,
                                      -1,
                                    );
                                  }}
                                >
                                  <svg
                                    className="w-3 h-3"
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

                                <span className="text-xs font-bold text-lightpink min-w-[1rem] text-center">
                                  {getItemQuantityInCart(item._id, variant._id)}
                                </span>

                                <button
                                  className="w-6 h-6 rounded-full bg-lightpink text-white flex items-center justify-center hover:bg-pink-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isSubmitting}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVariantQuantityChange(variant._id, 1);
                                  }}
                                >
                                  <svg
                                    className="w-3 h-3"
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
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Regular item without variants
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${
        !isAvailable ? "opacity-75" : "hover:scale-105"
      }`}
    >
      {/* Out of Stock Badge */}
      {!isAvailable && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            HẾT HÀNG
          </div>
        </div>
      )}

      {/* Item Image */}
      <div className="h-48 overflow-hidden relative flex-shrink-0">
        <img
          src={item.image || item.existingImage || defaultImage}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        {/* Image overlay for out of stock */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        )}
      </div>

      {/* Item Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="mb-4">
            <div className="text-xl font-bold text-lightpink mb-1">
              {item.price.toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        {isAvailable ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Còn {getRemainingQuantity(item._id)}
            </span>

            <div className="flex items-center space-x-2">
              <button
                className="w-8 h-8 rounded-full bg-lightpink text-white flex items-center justify-center hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                onClick={() => handleItemQuantityChange(-1)}
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
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span className="text-sm font-bold text-lightpink min-w-[2rem] text-center">
                {getItemQuantityInCart(item._id)}
              </span>

              <button
                className="w-8 h-8 rounded-full bg-lightpink text-white flex items-center justify-center hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                onClick={(e) => handleItemQuantityChange(1, e.currentTarget)}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-sm text-red-500 font-medium">Hết hàng</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FnbMenuItem;
