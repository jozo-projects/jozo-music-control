import { categoryImages } from "@/assets/images/categories";
import ControlBar from "@/components/ControlBar";
import Footer from "@/components/Footer";
import GiftFloatButton from "@/components/GiftFloatButton";
import GiftModal from "@/components/GiftModal";
import Header from "@/components/Header";
import QueueSidebar from "@/components/QueueSidebar";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
// import { categoryImages } from "@/assets/images/categories";
// import { Socket } from "socket.io-client";

const ROUTES_WITHOUT_QUEUE = ["/gift", "/fnb"];

const Layout: React.FC = () => {
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const location = useLocation();
  const { backgroundId } = useImageBackground();
  const canShowQueue = !ROUTES_WITHOUT_QUEUE.includes(location.pathname);
  const isQueueVisible = isQueueOpen && canShowQueue;

  // Ẩn hàng chờ ở /gift, /fnb; tự mở lại khi về Home
  useEffect(() => {
    if (!canShowQueue) {
      setIsQueueOpen(false);
    } else if (location.pathname === "/") {
      setIsQueueOpen(true);
    }
  }, [canShowQueue, location.pathname]);

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
              isQueueVisible ? "col-span-8" : "col-span-12"
            } h-[calc(100vh-9.5rem)] overflow-y-auto`}
          >
            <Outlet />
          </div>

          {/* Queue Sidebar */}
          {canShowQueue && (
            <div
              className={`${
                isQueueVisible ? "col-span-4" : "invisible col-span-0 hidden"
              }`}
            >
              <QueueSidebar
                isOpen={isQueueVisible}
                onClose={() => setIsQueueOpen(false)}
              />
            </div>
          )}
        </div>
      </main>

      <Footer>
        <ControlBar
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          showQueueToggle={canShowQueue}
        />
      </Footer>

      {/* Gift Float Button */}
      <GiftFloatButton />

      {/* Gift Modal */}
      <GiftModal />
    </div>
  );
};

export default Layout;
