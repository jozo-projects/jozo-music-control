import DefaultLayout from "@/layouts/DefaultLayout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import QRCodeScreen from "@/pages/QRCode";
import Search from "@/pages/Search";
import FnbOrder from "@/pages/FnbOrder";
import Gift from "@/pages/Gift";
import { FNB_ORDER_ENABLED } from "@/utils/fnbOrder";
import { Navigate, RouteObject, useSearchParams } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const FnbOrderRoute = () => {
  const [searchParams] = useSearchParams();
  if (!FNB_ORDER_ENABLED) {
    const roomId = searchParams.get("roomId");
    return (
      <Navigate
        to={roomId ? `/?roomId=${encodeURIComponent(roomId)}` : "/"}
        replace
      />
    );
  }
  return <FnbOrder />;
};

const routes: RouteObject[] = [
  {
    element: <DefaultLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/", element: <Home /> }, // Trang Home
          { path: "/search", element: <Search /> }, // Trang Search
          { path: "/fnb", element: <FnbOrderRoute /> }, // Tạm ẩn khi FNB_ORDER_ENABLED = false
          { path: "/gift", element: <Gift /> }, // Trang Quà / Lì xì
        ],
      },
      { path: "/qr-code", element: <QRCodeScreen /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
