import DefaultLayout from "@/layouts/DefaultLayout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import QRCodeScreen from "@/pages/QRCode";
import Search from "@/pages/Search";
import FnbOrder from "@/pages/FnbOrder";
import Gift from "@/pages/Gift";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const routes: RouteObject[] = [
  {
    element: <DefaultLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/", element: <Home /> }, // Trang Home
          { path: "/search", element: <Search /> }, // Trang Search
          { path: "/fnb", element: <FnbOrder /> }, // Trang FnB Order
          { path: "/gift", element: <Gift /> }, // Trang Quà / Lì xì
        ],
      },
      { path: "/qr-code", element: <QRCodeScreen /> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
