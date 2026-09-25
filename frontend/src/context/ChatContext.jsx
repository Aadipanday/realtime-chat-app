import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import API from "../services/api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const ChatContext = createContext();

// Pleasant Web Audio synthesizer for message notification pop
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    // Audio context may require user gesture on first interaction
  }
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingInChat, setTypingInChat] = useState({});

  const { socket } = useSocket();
  const { authUser } = useAuth();

  // Ref to track the current selected chat without closure staleness
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Fetch all user chats
  const fetchChats = useCallback(async () => {
    if (!authUser) return;
    setLoadingChats(true);
    try {
      const { data } = await API.get("/chats");
      setChats(data.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;
      setLoadingMessages(true);

      // Immediately join room and emit markAsRead via socket
      if (socket && authUser) {
        socket.emit("joinChat", chatId);
        socket.emit("markAsRead", { chatId, userId: authUser._id });
      }

      try {
        const { data } = await API.get(`/messages/${chatId}`);
        setMessages(data.data);

        // Clear unread count for this chat
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[chatId];
          return updated;
        });
      } catch (error) {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [socket, authUser]
  );

  // When selectedChat changes, load its messages
  useEffect(() => {
    if (selectedChat?._id) {
      fetchMessages(selectedChat._id);
    } else {
      setMessages([]);
    }
  }, [selectedChat, fetchMessages]);

  // Request browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Send a new message (text, image, or voice note)
  const sendMessage = async (content = "", file = null) => {
    if (!selectedChat?._id) return false;
    if (!content?.trim() && !file) return false;

    try {
      let responseData;
      if (file) {
        const formData = new FormData();
        formData.append("chatId", selectedChat._id);
        if (content && content.trim()) {
          formData.append("content", content.trim());
        }
        formData.append("file", file);

        const { data } = await API.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        responseData = data.data;
      } else {
        const { data } = await API.post("/messages", {
          content: content.trim(),
          chatId: selectedChat._id,
        });
        responseData = data.data;
      }

      const newMsg = responseData;

      // Append to messages only if not already present
      setMessages((prev) => {
        if (prev.some((m) => m._id.toString() === newMsg._id.toString())) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // Update latest message in chats list and bring to top
      setChats((prev) => {
        const updated = prev.map((c) =>
          c._id.toString() === selectedChat._id.toString()
            ? { ...c, latestMessage: newMsg, updatedAt: new Date().toISOString() }
            : c
        );
        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt) -
            new Date(a.updatedAt || a.createdAt)
        );
      });

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      return false;
    }
  };

  // React to a message with an emoji
  const reactToMessage = async (messageId, emoji) => {
    if (!messageId || !emoji) return;

    try {
      const { data } = await API.patch(`/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) =>
          m._id.toString() === messageId.toString()
            ? { ...m, reactions: data.data }
            : m
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update reaction");
    }
  };

  // Create or access 1-to-1 chat
  const accessChat = async (userId) => {
    try {
      const { data } = await API.post("/chats", { userId });
      const chat = data.data;

      if (!chats.some((c) => c._id.toString() === chat._id.toString())) {
        setChats((prev) => [chat, ...prev]);
      }
      setSelectedChat(chat);
      return chat;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to open chat");
    }
  };

  // Create a new group chat
  const createGroupChat = async (name, selectedUsers) => {
    try {
      const { data } = await API.post("/chats/group", {
        name,
        users: selectedUsers.map((u) => u._id),
      });

      const newGroup = data.data;
      setChats((prev) => [newGroup, ...prev]);
      setSelectedChat(newGroup);
      toast.success(`Group "${name}" created!`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      return false;
    }
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    try {
      await API.delete(`/messages/${messageId}`);
      setMessages((prev) =>
        prev.filter((m) => m._id.toString() !== messageId.toString())
      );
      toast.success("Message deleted");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      return false;
    }
  };

  // Real-time socket message handler
  useEffect(() => {
    if (!socket) return;

    // Unified incoming message handler (both room receiveMessage and direct messageNotification)
    const handleIncomingMessage = (newMsg) => {
      const chatId = (newMsg.chat?._id || newMsg.chat)?.toString();
      if (!chatId) return;

      const senderId = (newMsg.sender?._id || newMsg.sender)?.toString();
      const myId = authUser?._id?.toString();

      // 1. If it's my own message, do NOT duplicate it (sendMessage already appended it!)
      if (senderId && myId && senderId === myId) return;

      const currentActiveChat = selectedChatRef.current;
      const isCurrentChatOpen =
        currentActiveChat && currentActiveChat._id.toString() === chatId;

      if (isCurrentChatOpen) {
        // Active chat is open: append message to current view
        setMessages((prev) => {
          if (prev.some((m) => m._id.toString() === newMsg._id.toString())) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Immediately notify sender that we've read it!
        if (socket && myId) {
          socket.emit("markAsRead", { chatId, userId: myId });
        }
      } else {
        // Chat is not open: increment unread count for this conversation
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }

      // 2. Update sidebar chats list:
      // If the chat exists, update its latestMessage and bring to top.
      // If the chat does NOT exist in sidebar yet, ADD IT to the sidebar!
      setChats((prev) => {
        const exists = prev.some((c) => c._id.toString() === chatId);
        if (exists) {
          const updated = prev.map((c) =>
            c._id.toString() === chatId
              ? { ...c, latestMessage: newMsg, updatedAt: new Date().toISOString() }
              : c
          );
          return updated.sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt) -
              new Date(a.updatedAt || a.createdAt)
          );
        } else {
          // Prepend the new chat into the user's sidebar
          const newChatObj =
            typeof newMsg.chat === "object"
              ? { ...newMsg.chat, latestMessage: newMsg }
              : { _id: chatId, latestMessage: newMsg };
          return [newChatObj, ...prev];
        }
      });

      // 3. Browser push notification when user is tabbed out
      if (
        document.hidden &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const senderName = newMsg.sender?.username || "New Message";
        let bodyPreview = newMsg.content || "";
        if (newMsg.mediaType === "image") {
          bodyPreview = "📷 Photo";
        } else if (newMsg.mediaType === "audio") {
          bodyPreview = "🎤 Voice note";
        }
        try {
          new Notification(senderName, {
            body: bodyPreview,
            icon: newMsg.sender?.avatar || undefined,
          });
        } catch (e) {
          // notification ignore
        }
      }

      playNotificationSound();
    };

    // When someone reads messages in a chat
    const handleMessagesRead = ({ chatId, readBy }) => {
      const readerId = (readBy?._id || readBy)?.toString();
      if (!readerId) return;

      // 1. Update messages state
      setMessages((prev) =>
        prev.map((msg) => {
          const currentReadBy = msg.readBy || [];
          const isAlreadyRead = currentReadBy.some(
            (id) => (id?._id || id)?.toString() === readerId
          );
          if (!isAlreadyRead) {
            return { ...msg, readBy: [...currentReadBy, readerId] };
          }
          return msg;
        })
      );

      // 2. Update latestMessage in sidebar
      setChats((prev) =>
        prev.map((c) => {
          if (c._id.toString() === chatId?.toString() && c.latestMessage) {
            const currentReadBy = c.latestMessage.readBy || [];
            const isAlreadyRead = currentReadBy.some(
              (id) => (id?._id || id)?.toString() === readerId
            );
            if (!isAlreadyRead) {
              return {
                ...c,
                latestMessage: {
                  ...c.latestMessage,
                  readBy: [...currentReadBy, readerId],
                },
              };
            }
          }
          return c;
        })
      );
    };

    // When someone creates a new 1-to-1 or group chat with me
    const handleNewChatCreated = (newChat) => {
      setChats((prev) => {
        if (prev.some((c) => c._id.toString() === newChat._id.toString())) {
          return prev;
        }
        return [newChat, ...prev];
      });
    };

    // When someone reacts or unreacts to a message
    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id.toString() === messageId.toString()
            ? { ...msg, reactions }
            : msg
        )
      );
    };

    // Typing indicators
    const handleTyping = (roomId) => {
      setTypingInChat((prev) => ({ ...prev, [roomId]: true }));
    };

    const handleStopTyping = (roomId) => {
      setTypingInChat((prev) => ({ ...prev, [roomId]: false }));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((m) => m._id.toString() !== messageId.toString())
      );
    };

    socket.on("receiveMessage", handleIncomingMessage);
    socket.on("messageNotification", handleIncomingMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("newChatCreated", handleNewChatCreated);
    socket.on("messageReactionUpdated", handleReactionUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleIncomingMessage);
      socket.off("messageNotification", handleIncomingMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("newChatCreated", handleNewChatCreated);
      socket.off("messageReactionUpdated", handleReactionUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, authUser]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        selectedChat,
        setSelectedChat,
        messages,
        loadingChats,
        loadingMessages,
        unreadCounts,
        typingInChat,
        fetchChats,
        fetchMessages,
        sendMessage,
        reactToMessage,
        deleteMessage,
        accessChat,
        createGroupChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
