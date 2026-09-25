import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "./Avatar";
import {
  X,
  Camera,
  Mail,
  User,
  Calendar,
  Loader2,
  Check,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

export const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser, updateAvatar, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "security"

  // Avatar upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!isOpen || !authUser) return null;

  const resetPasswordForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    resetPasswordForm();
    setActiveTab("profile");
    onClose();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in both current and new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword({ oldPassword, newPassword });
    setPasswordLoading(false);

    if (result?.success) {
      resetPasswordForm();
      setActiveTab("profile");
    }
  };

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
        {/* Modal Header & Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 bg-[var(--bg-header)] p-1 rounded-xl border border-[var(--border-color)]/60">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[var(--accent-color)] text-[var(--accent-text)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "security"
                  ? "bg-[var(--accent-color)] text-[var(--accent-text)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
              }`}
            >
              <Lock size={12} />
              Password
            </button>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in">
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
        )}

        {/* Tab 2: Security / Password Change View */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordChange} className="space-y-3.5 pt-4 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] pt-1">
              🔒 After updating, use your new password next time you log in.
            </p>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {passwordLoading ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <Lock size={15} />
              )}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
