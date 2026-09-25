import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "./Avatar";
import { X, Camera, Mail, User, Calendar, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

export const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser, updateAvatar } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !authUser) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file must be under 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const success = await updateAvatar(selectedFile);
    setLoading(false);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Profile Info
          </h3>
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              onClose();
            }}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar change section */}
        <div className="flex flex-col items-center mt-5 mb-4">
          <div className="relative group cursor-pointer">
            <img
              src={
                previewUrl ||
                authUser.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.username}`
              }
              alt={authUser.username}
              className="w-24 h-24 rounded-full object-cover border-2 border-[var(--accent-color)] bg-[var(--bg-header)] shadow-md"
            />
            <label
              htmlFor="profile-avatar-input"
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera size={22} />
            </label>
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] mt-2">
            Click photo to upload new picture
          </p>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-3 px-4 py-1.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Check size={14} />
              )}
              Save Photo
            </button>
          )}
        </div>

        {/* Profile Info Details */}
        <div className="space-y-2.5 pt-2">
          <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
            <div className="flex items-center gap-3">
              <User size={16} className="text-[var(--accent-color)]" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                  Your Name
                </p>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {authUser.username}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[var(--accent-color)]" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                  Email
                </p>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {authUser.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-[var(--accent-color)]" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                  Joined
                </p>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {formatDate(authUser.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
