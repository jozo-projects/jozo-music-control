import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import ControlBar from "@/components/ControlBar";
import QueueSidebar from "@/components/QueueSidebar";
import GiftFloatButton from "@/components/GiftFloatButton";
import GiftModal from "@/components/GiftModal";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import { categoryImages } from "@/assets/images/categories";
// import { categoryImages } from "@/assets/images/categories";
// import { Socket } from "socket.io-client";

const Layout: React.FC = () => {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  // const socketRef = useRef<typeof Socket | null>(null);
  // const [params] = useSearchParams();
  // const roomId = params.get("roomId") || "";

  // listen event from backend by socket.io
  useEffect(() => {
    // socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
    //   query: { roomId },
    // });

    // socketRef.current.on("videos_turned_off", (data: unknown) => {
    //   console.log(data);
    // });

    return () => {
      // socketRef.current?.disconnect();
    };
  }, []);

  const { backgroundId } = useImageBackground();

  return (
    <div className="flex flex-col h-screen bg-black text-white">
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
              isQueueOpen ? "col-span-8" : "col-span-12"
            } overflow-y-auto h-[calc(100vh-200px)]`}
          >
            <Outlet />
          </div>

          {/* Queue Sidebar */}
          <div
            className={`${
              isQueueOpen ? "col-span-4" : "invisible col-span-0 hidden"
            }`}
          >
            <QueueSidebar
              isOpen={isQueueOpen}
              onClose={() => setIsQueueOpen(false)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <ControlBar onToggleQueue={() => setIsQueueOpen(!isQueueOpen)} />
      </footer>

      {/* Gift Float Button */}
      <GiftFloatButton />

      {/* Gift Modal */}
      <GiftModal />
    </div>
  );
};

export default Layout;
