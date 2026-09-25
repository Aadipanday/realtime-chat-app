import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useChat } from "../../context/ChatContext";
import { Avatar } from "../Common/Avatar";
import { X, Search, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { createGroupChat } = useChat();

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearch("");
      setUsers([]);
      setSelectedUsers([]);
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

  const toggleSelectUser = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group subject");
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error("Select at least 2 participants");
      return;
    }

    setSubmitting(true);
    const success = await createGroupChat(groupName.trim(), selectedUsers);
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Users size={19} className="text-[var(--accent-color)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              New Group
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden mt-4">
          {/* Group Name input */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Group Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Project Team, Family, Friends..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-header)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              autoFocus
            />
          </div>

          {/* Selected members chips */}
          {selectedUsers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {selectedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30"
                >
                  {user.username}
                  <button
                    type="button"
                    onClick={() => toggleSelectUser(user)}
                    className="hover:text-red-400 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search members */}
          <div className="relative mt-4">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="text"
              placeholder="Type contact name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-header)] pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
            />
          </div>

          {/* Users list */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-1 min-h-[160px]">
            {loading ? (
              <div className="flex justify-center py-6 text-[var(--text-secondary)]">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
                {search ? "No contacts found" : "Search to add participants"}
              </div>
            ) : (
              users.map((user) => {
                const isSelected = selectedUsers.some((u) => u._id === user._id);
                return (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() => toggleSelectUser(user)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--bg-active)] border border-[var(--accent-color)]/40"
                        : "hover:bg-[var(--bg-active)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={user.avatar} alt={user.username} size="sm" />
                      <div className="truncate">
                        <p className="font-medium text-xs text-[var(--text-primary)] truncate">
                          {user.username}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? "bg-[var(--accent-color)] border-[var(--accent-color)] text-[var(--accent-text)] font-bold"
                          : "border-[var(--border-color)]"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Submit button */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-medium text-xs text-[var(--accent-text)] bg-[var(--accent-color)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                `Create Group (${selectedUsers.length} participants)`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
