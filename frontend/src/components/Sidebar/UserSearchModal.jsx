import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "../Common/Avatar";
import { X, Search, Loader2 } from "lucide-react";

export const UserSearchModal = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { accessChat } = useChat();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/users?search=${encodeURIComponent(search)}`);
        setUsers(data.data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, isOpen]);

  const handleSelectUser = async (userId) => {
    await accessChat(userId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            New Chat
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mt-4">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-header)] pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
            autoFocus
          />
        </div>

        {/* Users list */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <div className="flex justify-center py-8 text-[var(--text-secondary)]">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
              {search ? "No contacts found matching your search" : "No users available"}
            </div>
          ) : (
            users.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              return (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user._id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-active)] text-left transition-colors cursor-pointer"
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.username}
                    isOnline={isOnline}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {user.email}
                    </p>
                  </div>
                  {isOnline && (
                    <span className="text-[11px] font-medium text-[var(--accent-color)] bg-[var(--accent-color)]/10 px-2 py-0.5 rounded-full">
                      online
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
