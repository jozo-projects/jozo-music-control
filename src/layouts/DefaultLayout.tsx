import { categoryImages } from "@/assets/images/categories";
import ControlBar from "@/components/ControlBar";
import Footer from "@/components/Footer";
import GiftModal from "@/components/GiftModal";
import Header from "@/components/Header";
import RoomPinGate from "@/components/RoomPinGate";
import QueueSidebar from "@/components/QueueSidebar";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
// import { categoryImages } from "@/assets/images/categories";
// import { Socket } from "socket.io-client";

const ROUTES_WITHOUT_QUEUE = ["/gift", "/fnb"];

const Layout: React.FC = () => {
  const location = useLocation();
  const { backgroundId } = useImageBackground();
  const canShowQueue = !ROUTES_WITHOUT_QUEUE.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen bg-brand-950 text-white">
      {/* Header */}
      <Header />

      {/* Queue Sidebar */}

      {/* Main */}
      <main
        className="flex-1 relative overflow-hidden rounded-3xl bg-secondary"
        style={{
          backgroundImage: `url(${categoryImages[backgroundId]})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Background Overlay for Blur Effect */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Outlet Content */}
        <div className="relative z-20 h-full grid grid-cols-12">
          <div
            className={`${
              canShowQueue ? "col-span-8" : "col-span-12"
            } h-[calc(100vh-9.5rem)] overflow-y-auto`}
          >
            <Outlet />
          </div>

          {/* Queue Sidebar */}
          {canShowQueue && (
            <div className="col-span-4">
              <QueueSidebar />
            </div>
          )}
        </div>
      </main>

      <Footer>
        <ControlBar />
      </Footer>

      {/* Gift Modal */}
      <GiftModal />

      <RoomPinGate />
    </div>
  );
};

export default Layout;
