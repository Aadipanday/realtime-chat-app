import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "../Common/Avatar";
import { ThemeModal } from "../Common/ThemeModal";
import { ProfileModal } from "../Common/ProfileModal";
import { Logo } from "../Common/Logo";
import { UserSearchModal } from "./UserSearchModal";
import { CreateGroupModal } from "./CreateGroupModal";
import {
  Palette,
  MessageSquarePlus,
  Users,
  LogOut,
  Search,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";

export const Sidebar = () => {
  const { authUser, logout } = useAuth();
  const {
    chats,
    selectedChat,
    setSelectedChat,
    loadingChats,
    unreadCounts,
    typingInChat,
  } = useChat();
  const { onlineUsers, userStatuses } = useSocket();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'unread', 'groups'
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Helper to extract the other user in a 1-to-1 chat
  const getOtherUser = (chat) => {
    return (
      chat.users?.find(
        (u) => (u._id || u).toString() !== authUser?._id?.toString()
      ) || chat.users?.[0]
    );
  };

  // Helper to format timestamps WhatsApp style
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderLatestCheckmark = (chat) => {
    const latest = chat.latestMessage;
    if (!latest) return null;

    const otherUser = !chat.isGroupChat ? getOtherUser(chat) : null;
    const otherUserId = (otherUser?._id || otherUser)?.toString();
    const readByList = latest.readBy || [];

    const isRead =
      otherUserId &&
      readByList.some(
        (id) => (id?._id || id).toString() === otherUserId
      );

    if (isRead) {
      return (
        <CheckCheck
          size={15}
          className="shrink-0 text-[var(--tick-color)]"
          title="Read"
        />
      );
    }

    const isRecipientOnline = otherUserId
      ? onlineUsers.some((id) => id.toString() === otherUserId)
      : false;
    if (isRecipientOnline) {
      return (
        <CheckCheck
          size={15}
          className="shrink-0 text-[var(--text-secondary)]"
          title="Delivered"
        />
      );
    }

    return (
      <Check
        size={15}
        className="shrink-0 text-[var(--text-secondary)]"
        title="Sent"
      />
    );
  };

  // Filter conversations
  const filteredChats = chats.filter((chat) => {
    const unread = unreadCounts[chat._id] || 0;

    // Filter by tab
    if (activeTab === "unread" && unread === 0) return false;
    if (activeTab === "groups" && !chat.isGroupChat) return false;

    // Filter by search query
    if (!search.trim()) return true;

    const query = search.toLowerCase();
    if (chat.isGroupChat) {
      return chat.chatName.toLowerCase().includes(query);
    } else {
      const otherUser = getOtherUser(chat);
      return (
        otherUser?.username?.toLowerCase().includes(query) ||
        otherUser?.email?.toLowerCase().includes(query)
      );
    }
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] shrink-0">
      {/* 1. WhatsApp Top Header: User Profile on left, Action Icons on right */}
      <div className="h-[60px] flex items-center justify-between px-4 bg-[var(--bg-header)] border-b border-[var(--border-color)] shrink-0">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer group"
          title="View profile & status"
        >
          <Avatar
            src={authUser?.avatar}
            alt={authUser?.username}
            isOnline={true}
            size="md"
          />
          <div className="truncate max-w-[120px] lg:max-w-[150px]">
            <h2 className="text-sm font-medium text-[var(--text-primary)] truncate">
              {authUser?.username}
            </h2>
            <p className="text-[11px] text-[var(--accent-color)] font-medium">My Profile</p>
          </div>
        </button>

        {/* WhatsApp Action Icons */}
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <button
            onClick={() => setIsThemeOpen(true)}
            title="Change Theme"
            className="p-2 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <Palette size={19} />
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            title="New Chat"
            className="p-2 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <MessageSquarePlus size={19} />
          </button>
          <button
            onClick={() => setIsGroupOpen(true)}
            title="New Group"
            className="p-2 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <Users size={19} />
          </button>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-full hover:text-red-400 hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>

      {/* 2. WhatsApp Search Bar & Filter Chips */}
      <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] space-y-2">
        <div className="relative flex items-center bg-[var(--bg-header)] rounded-lg px-3 py-1.5 border border-[var(--border-color)]/60 focus-within:border-[var(--accent-color)] transition-colors">
          <Search
            size={16}
            className="text-[var(--text-secondary)] shrink-0 mr-2.5"
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
          />
        </div>

        {/* WhatsApp Filter Chips: All, Unread, Groups */}
        <div className="flex items-center gap-1.5 px-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/40"
                : "bg-[var(--bg-header)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "unread"
                ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/40"
                : "bg-[var(--bg-header)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "groups"
                ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/40"
                : "bg-[var(--bg-header)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* 3. WhatsApp Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loadingChats ? (
          <div className="flex justify-center py-12 text-[var(--text-secondary)]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-14 px-4">
            <p className="text-xs text-[var(--text-secondary)]">
              {search ? "No chats found" : "No chats yet"}
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-3 text-xs text-[var(--accent-color)] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Start a new chat →
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChat?._id === chat._id;
            const otherUser = !chat.isGroupChat ? getOtherUser(chat) : null;
            const otherUserId = (otherUser?._id || otherUser)?.toString();
            const isOnline = otherUserId
              ? onlineUsers.some((id) => id.toString() === otherUserId) ||
                userStatuses?.[otherUserId]?.isOnline === true
              : false;
            const unread = unreadCounts[chat._id] || 0;
            const isTyping = typingInChat[chat._id];

            const displayName = chat.isGroupChat
              ? chat.chatName
              : otherUser?.username || "Unknown";

            const avatarSrc = chat.isGroupChat
              ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                  chat.chatName
                )}`
              : otherUser?.avatar;

            const senderId = (
              chat.latestMessage?.sender?._id || chat.latestMessage?.sender
            )?.toString();
            const isSenderLatest =
              senderId && authUser?._id && senderId === authUser._id.toString();

            let latestMsgText = "No messages yet";
            if (chat.latestMessage) {
              if (chat.latestMessage.mediaType === "image") {
                latestMsgText = chat.latestMessage.content
                  ? `📷 ${chat.latestMessage.content}`
                  : "📷 Photo";
              } else if (chat.latestMessage.mediaType === "audio") {
                latestMsgText = "🎤 Voice note";
              } else if (chat.latestMessage.content) {
                latestMsgText = chat.latestMessage.content;
              }
            }

            const latestMsgTime = formatTime(
              chat.latestMessage?.createdAt || chat.updatedAt
            );

            return (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer border-b border-[var(--border-color)]/40 ${
                  isSelected
                    ? "bg-[var(--bg-active)]"
                    : "hover:bg-[var(--bg-header)]/70"
                }`}
              >
                <Avatar
                  src={avatarSrc}
                  alt={displayName}
                  isOnline={isOnline}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {displayName}
                    </h3>
                    <span
                      className={`text-[11px] shrink-0 ml-1 ${
                        unread > 0
                          ? "text-[var(--accent-color)] font-medium"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {latestMsgTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0 pr-2">
                      {isSenderLatest && !isTyping && renderLatestCheckmark(chat)}
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {isTyping ? (
                          <span className="text-[var(--accent-color)] font-medium">
                            typing...
                          </span>
                        ) : (
                          latestMsgText
                        )}
                      </p>
                    </div>

                    {unread > 0 && (
                      <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Branding */}
      <div className="py-2.5 px-3.5 border-t border-[var(--border-color)] bg-[var(--bg-header)]/70 flex items-center justify-between text-xs text-[var(--text-secondary)] select-none shrink-0">
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} />
          <span className="font-bold text-xs text-[var(--text-primary)]">PulseChat</span>
        </div>
        <span className="text-[10px] text-[var(--accent-color)] font-medium flex items-center gap-1">
          <span>⚡</span> powered by aadi
        </span>
      </div>

      {/* Modals */}
      <ThemeModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <CreateGroupModal
        isOpen={isGroupOpen}
        onClose={() => setIsGroupOpen(false)}
      />
    </aside>
  );
};
