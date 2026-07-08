import { categoryImages } from "@/assets/images/categories";
import ControlBar from "@/components/ControlBar";
import Footer from "@/components/Footer";
import GiftModal from "@/components/GiftModal";
import Header from "@/components/Header";
import QueueSidebar from "@/components/QueueSidebar";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import { QueueAddProvider } from "@/contexts/QueueAddContext";
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
    <QueueAddProvider>
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
        <div className="pointer-events-none absolute inset-0 bg-black/40" aria-hidden />

        {/* Outlet Content */}
        <div className="relative z-20 grid h-full min-h-0 grid-cols-12">
          <div
            className={`relative z-10 min-h-0 ${
              canShowQueue ? "col-span-8" : "col-span-12"
            } h-[calc(100vh-9.5rem)] overflow-y-auto overscroll-contain`}
          >
            <Outlet />
          </div>

          {/* Queue Sidebar */}
          {canShowQueue && (
            <div className="relative z-0 col-span-4 flex min-h-0 h-[calc(100vh-9.5rem)] flex-col overflow-hidden">
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
    </div>
    </QueueAddProvider>
  );
};

export default Layout;
