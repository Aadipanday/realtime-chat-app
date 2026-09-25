import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "https://realtime-chat-app-25ow.onrender.com"
    : "http://localhost:5000");

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const { authUser } = useAuth();

  useEffect(() => {
    if (authUser?._id) {
      const token = localStorage.getItem("chat_app_token");
      const socketInstance = io(SOCKET_URL, {
        auth: {
          token,
        },
        withCredentials: true,
      });

      setSocket(socketInstance);

      // Listen for active online users list broadcast
      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers((users || []).map((u) => u.toString()));
      });

      // Listen for individual user online/offline status & lastSeen updates
      socketInstance.on("userStatusChanged", ({ userId, isOnline, lastSeen }) => {
        const uId = userId?.toString();
        if (!uId) return;

        setOnlineUsers((prev) => {
          const strPrev = prev.map((id) => id.toString());
          if (isOnline) {
            return strPrev.includes(uId) ? strPrev : [...strPrev, uId];
          } else {
            return strPrev.filter((id) => id !== uId);
          }
        });

        setUserStatuses((prev) => ({
          ...prev,
          [uId]: { isOnline, lastSeen: isOnline ? null : lastSeen },
        }));
      });

      return () => {
        socketInstance.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, userStatuses }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
