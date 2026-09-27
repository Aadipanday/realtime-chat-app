import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { FullScreenPhotoModal } from "./FullScreenPhotoModal";
import {
  X,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Phone,
  Video,
  ZoomIn,
  ShieldAlert,
  Loader2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

export const ContactProfileModal = ({
  isOpen,
  onClose,
  user,
  isOnline = false,
  statusText = "",
  onStartChat,
}) => {
  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Set initial data from props
    setProfileData(user);

    // If we have an ID, fetch latest fresh profile from backend
    const userId = user._id || user.id;
    if (userId) {
      setLoading(true);
      API.get(`/users/profile/${userId}`)
        .then(({ data }) => {
          if (data?.data) {
            setProfileData((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch((err) => {
          console.error("Error fetching contact profile:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const displayName = profileData?.username || user?.username || "Unknown";
  const avatarUrl =
    profileData?.avatar ||
    user?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;

  const isAvatarPrivate =
    profileData?.isAvatarHidden ||
    avatarUrl.includes("seed=private") ||
    avatarUrl.includes("seed=hidden");

  const aboutText =
    profileData?.about || "Hey there! I am using PulseChat.";

  const joinedDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  const handleMessageClick = () => {
    if (onStartChat) {
      onStartChat(profileData || user);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Contact Info
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex flex-col items-center max-h-[80vh] overflow-y-auto">
            {/* Avatar & Click to Zoom */}
            <div className="relative group cursor-pointer mt-1 mb-3">
              <div
                onClick={() => {
                  if (!isAvatarPrivate) {
                    setIsPhotoViewerOpen(true);
                  } else {
                    toast("User profile photo is private", { icon: "🔒" });
                  }
                }}
                className="relative rounded-full overflow-hidden w-28 h-28 border-3 border-[var(--accent-color)] shadow-xl bg-[var(--bg-header)] ring-4 ring-[var(--accent-color)]/20 transition-transform hover:scale-105"
                title={isAvatarPrivate ? "Photo is private" : "Click to view full photo"}
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay hint */}
                {!isAvatarPrivate && (
                  <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={22} />
                    <span className="text-[10px] font-medium mt-1">View Photo</span>
                  </div>
                )}
              </div>

              {/* Online Indicator Badge */}
              {isOnline && (
                <span
                  className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-[var(--accent-color)] ring-3 ring-[var(--bg-secondary)] shadow-sm"
                  title="Online"
                />
              )}
            </div>

            {isAvatarPrivate && (
              <p className="text-[11px] text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                <span>🔒</span> Profile photo is private
              </p>
            )}

            {/* Display Name & Status */}
            <h2 className="text-lg font-bold text-[var(--text-primary)] text-center">
              {displayName}
            </h2>
            <p className="text-xs text-[var(--accent-color)] font-medium mt-0.5 capitalize">
              {statusText || (isOnline ? "Online" : "Offline")}
            </p>

            {/* WhatsApp Quick Actions: Message, Audio Call, Video Call */}
            <div className="flex items-center justify-center gap-6 my-4 w-full py-2.5 px-4 rounded-xl bg-[var(--bg-header)]/80 border border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={handleMessageClick}
                className="flex flex-col items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
                title="Message"
              >
                <div className="p-2.5 rounded-full bg-[var(--bg-active)] hover:bg-[var(--accent-color)]/20 transition-colors">
                  <MessageSquare size={17} />
                </div>
                <span className="text-[10px] font-medium">Message</span>
              </button>

              <button
                type="button"
                onClick={() => toast("Voice call feature coming in next update!", { icon: "📞" })}
                className="flex flex-col items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
                title="Audio Call"
              >
                <div className="p-2.5 rounded-full bg-[var(--bg-active)] hover:bg-[var(--accent-color)]/20 transition-colors">
                  <Phone size={17} />
                </div>
                <span className="text-[10px] font-medium">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => toast("Video call feature coming in next update!", { icon: "📹" })}
                className="flex flex-col items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors cursor-pointer"
                title="Video Call"
              >
                <div className="p-2.5 rounded-full bg-[var(--bg-active)] hover:bg-[var(--accent-color)]/20 transition-colors">
                  <Video size={17} />
                </div>
                <span className="text-[10px] font-medium">Video</span>
              </button>
            </div>

            {/* Info Cards */}
            <div className="w-full space-y-2.5 text-left">
              {/* About / Bio Status */}
              <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
                <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider mb-1 flex items-center gap-1.5">
                  <Info size={13} className="text-[var(--accent-color)]" />
                  About
                </p>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
                  "{aboutText}"
                </p>
              </div>

              {/* Email (if available) */}
              {profileData?.email && (
                <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-[var(--accent-color)]" />
                    Email
                  </p>
                  <p className="text-xs text-[var(--text-primary)] truncate font-mono">
                    {profileData.email}
                  </p>
                </div>
              )}

              {/* Member Since */}
              {joinedDate && (
                <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider mb-0.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--accent-color)]" />
                    Joined
                  </p>
                  <p className="text-xs text-[var(--text-primary)]">
                    {joinedDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Full Screen Image Viewer Modal */}
      <FullScreenPhotoModal
        isOpen={isPhotoViewerOpen}
        onClose={() => setIsPhotoViewerOpen(false)}
        src={avatarUrl}
        title={displayName}
        subtitle={aboutText}
      />
    </>
  );
};
