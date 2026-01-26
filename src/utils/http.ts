import { toast } from "@/components/ToastContainer";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Thay bằng URL của backend

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor xử lý request (nếu cần thêm logic cho request)
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

// Interceptor xử lý response
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Nếu request bị cancel thì không xử lý gì thêm
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Xử lý các lỗi khác như cũ
    if (error.response) {
      // Lỗi từ server (status code >= 400)
      console.error("Server Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });
      switch (error.response.status) {
        case 400:
          toast.error("Lỗi yêu cầu không hợp lệ (400)");
          break;
        case 404:
          toast.error("Không tìm thấy tài nguyên (404)");
          break;
        case 500:
          toast.error("Lỗi server nội bộ (500)");
          break;
        default:
          toast.error(`Lỗi không xác định: ${error.response.status}`);
      }
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      console.error("Network Error:", error.message);
      toast.error(
        "Lỗi mạng hoặc server không phản hồi. Vui lòng kiểm tra kết nối.",
      );
    } else {
      // Các lỗi khác
      console.error("Error:", error.message);
      toast.error("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
    }

    // Thử lại nếu cần
    // if (error.config && error.response && error.response.status >= 500) {
    //   return retryRequest(error, 1); // Retry 1 lần nếu lỗi >= 500
    // }

    return Promise.reject(error);
  },
);

export default axiosInstance;
