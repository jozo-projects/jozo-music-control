interface ApiResponse<TData> {
  message: string;
  result: TData;
}

interface Video {
  video_id: string;
  title: string;
  thumbnail: string;
  author: string;
  duration: number; // Nếu cần thời lượng
  url?: string; // URL của video (optional)
  position?: "top" | "end"; // Vị trí trong queue (top hoặc end)
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

// type PlaybackState = "play" | "pause";

interface FnbCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

interface FnbVariant {
  _id: string;
  name: string;
  price: number;
  image?: string;
  inventory: {
    quantity: number;
    minStock?: number;
    maxStock?: number;
  };
}

interface FnbItem {
  _id: string;
  name: string;
  parentId?: string;
  hasVariant: boolean;
  price: number;
  description?: string;
  image?: string;
  category: string;
  inventory?: {
    quantity: number;
    lastUpdated: string;
  };
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  existingImage?: string;
  quantity?: string;
  variants?: FnbVariant[] | string; // Array of FnbVariant objects or JSON string (for backward compatibility)
}

interface FnbMenu {
  categories: FnbCategory[];
  items: FnbItem[];
}

interface OrderItem {
  itemId: string;
  category: string;
  variantId?: string; // For items with variants
  quantity: number;
  notes?: string;
}

interface FnbOrder {
  id: string;
  roomId: string;
  order: {
    drinks: Record<string, number>;
    snacks: Record<string, number>;
  };
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

interface CreateFnbOrderPayload {
  order: {
    drinks: Record<string, number>; // { "itemId": quantity }
    snacks: Record<string, number>; // { "itemId": quantity }
  };
}

interface Order {
  id?: string;
  items: OrderItem[];
  totalAmount: number;
  status?: "pending" | "processing" | "completed" | "cancelled";
  createdAt?: string;
}

// Gift Types
type GiftType = "snacks_drinks" | "discount";

type ScheduleGiftStatus = "assigned" | "claimed" | "removed";

interface GiftBundleItem {
  itemId: string; // ObjectId từ backend sẽ được serialize thành string
  quantity: number;
  name: string;
  category?: string; // FnBCategory từ backend (snacks, drinks, etc.)
  priceSnapshot?: number;
  source: "fnb_menu" | "fnb_menu_item";
}

interface Gift {
  _id?: string; // ObjectId từ backend sẽ được serialize thành string
  id?: string; // Alias cho _id để dễ sử dụng
  name: string;
  type: GiftType;
  image?: string;
  price?: number;
  discountPercentage?: number;
  items?: GiftBundleItem[];
  totalQuantity: number; // tổng số suất quà (bundle) tạo ra
  remainingQuantity: number; // số suất còn lại để random
  isActive: boolean;
  createdAt?: string; // Date từ backend sẽ được serialize thành string
  updatedAt?: string; // Date từ backend sẽ được serialize thành string
}

interface ScheduleGift {
  giftId: string; // ObjectId từ backend sẽ được serialize thành string
  name: string;
  type: GiftType;
  status: ScheduleGiftStatus;
  assignedAt: string; // Date từ backend sẽ được serialize thành string
  claimedAt?: string; // Date từ backend sẽ được serialize thành string
  image?: string;
  discountPercentage?: number;
  items?: GiftBundleItem[];
}

interface RoomGiftResponse {
  scheduleId: string; // ObjectId từ backend sẽ được serialize thành string
  gift: ScheduleGift | undefined;
  giftEnabled: boolean;
}
