import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

let socket = null;

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [videoUpdates, setVideoUpdates] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    
    if (!socket) {
      socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        setIsConnected(true);
        
        // Join user and tenant rooms
        socket.emit("join", {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role,
        });
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      // Listen for video processing updates
      socket.on("video:progress", (update) => {
        console.log("Video progress update:", update);
        setVideoUpdates((prev) => [...prev, update]);
      });
    }

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("video:progress");
      }
    };
  }, [user]);

  const clearUpdates = () => {
    setVideoUpdates([]);
  };

  return {
    socket,
    isConnected,
    videoUpdates,
    clearUpdates,
  };
};
