/// <reference types="vite/client" />

import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Bỏ qua toast lỗi mặc định của interceptor; caller tự xử lý. */
    skipErrorToast?: boolean;
  }
}
