import React from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "../Common/Avatar";
import { ArrowLeft, Users, Search, MoreVertical } from "lucide-react";

export const ChatHeader = () => {
  const { selectedChat, setSelectedChat, typingInChat } = useChat();
  const { authUser } = useAuth();
  const { onlineUsers, userStatuses } = useSocket();

  if (!selectedChat) return null;

  const isGroup = selectedChat.isGroupChat;
  const otherUser = !isGroup
    ? selectedChat.users?.find(
        (u) => (u._id || u).toString() !== authUser?._id?.toString()
      )
    : null;

  const otherUserId = (otherUser?._id || otherUser)?.toString();
  const isOnline = otherUserId
    ? onlineUsers.some((id) => id.toString() === otherUserId) ||
      userStatuses?.[otherUserId]?.isOnline === true
    : false;

  const isTyping = selectedChat?._id && typingInChat[selectedChat._id];

  const displayName = isGroup
    ? selectedChat.chatName
    : otherUser?.username || "Unknown";

  const avatarSrc = isGroup
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        selectedChat.chatName
      )}`
    : otherUser?.avatar;

  // Format WhatsApp style "last seen" status
  const formatLastSeen = (dateStr) => {
    if (!dateStr) return "offline";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "offline";

    const now = new Date();
    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `last seen today at ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `last seen yesterday at ${timeStr}`;
    }

    const dateFormatted = date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `last seen ${dateFormatted} at ${timeStr}`;
  };

  const lastSeenDate =
    userStatuses?.[otherUserId]?.lastSeen || otherUser?.lastSeen;

  const statusText = isTyping
    ? "typing..."
    : isGroup
    ? `${selectedChat.users?.length || 0} participants`
    : isOnline
    ? "online"
    : formatLastSeen(lastSeenDate);

  return (
    <header className="h-[60px] flex items-center justify-between px-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile back button */}
        <button
          onClick={() => setSelectedChat(null)}
          className="md:hidden p-1.5 -ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-active)] cursor-pointer"
        >
          <ArrowLeft size={19} />
        </button>

        <Avatar
          src={avatarSrc}
          alt={displayName}
          isOnline={isOnline}
          size="md"
        />

        <div className="truncate">
          <h2 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {displayName}
          </h2>
          <p
            className={`text-xs ${
              isTyping || isOnline
                ? "text-[var(--accent-color)] font-medium"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[var(--text-secondary)]">
        {isGroup && (
          <div className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--bg-active)] text-[var(--text-secondary)] mr-1">
            <Users size={13} />
            <span>{selectedChat.users?.length}</span>
          </div>
        )}

        <button
          type="button"
          title="Search in chat"
          className="p-2 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          title="More options"
          className="p-2 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
};
