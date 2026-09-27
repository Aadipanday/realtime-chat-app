import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FullScreenPhotoModal } from "./FullScreenPhotoModal";
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
  ShieldCheck,
  ZoomIn,
  Info,
  Users,
  Globe,
  UserX,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

const ABOUT_PRESETS = [
  "Hey there! I am using PulseChat.",
  "Available",
  "Busy",
  "At work",
  "In a meeting",
  "Urgent calls only",
  "Sleeping 😴",
];

export const ProfileModal = ({ isOpen, onClose }) => {
  const {
    authUser,
    updateAvatar,
    changePassword,
    updatePrivacySettings,
    updateProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "privacy" | "security"

  // Avatar state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  // About status state
  const [aboutText, setAboutText] = useState(
    authUser?.about || "Hey there! I am using PulseChat."
  );
  const [aboutLoading, setAboutLoading] = useState(false);

  // Privacy settings state
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState(
    authUser?.privacySettings?.profilePhoto || "everyone"
  );
  const [whoCanFindMe, setWhoCanFindMe] = useState(
    authUser?.privacySettings?.whoCanFindMe || "everyone"
  );
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setAboutText(authUser.about || "Hey there! I am using PulseChat.");
      setProfilePhotoPrivacy(
        authUser.privacySettings?.profilePhoto || "everyone"
      );
      setWhoCanFindMe(
        authUser.privacySettings?.whoCanFindMe || "everyone"
      );
    }
  }, [authUser]);

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

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    if (aboutText.length > 140) {
      toast.error("About status cannot exceed 140 characters");
      return;
    }
    setAboutLoading(true);
    await updateProfile({ about: aboutText });
    setAboutLoading(false);
  };

  const handleSavePrivacy = async () => {
    setPrivacyLoading(true);
    await updatePrivacySettings({
      profilePhoto: profilePhotoPrivacy,
      whoCanFindMe,
    });
    setPrivacyLoading(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const currentAvatar =
    previewUrl ||
    authUser.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.username}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header & Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
            <div className="flex items-center gap-1 bg-[var(--bg-header)] p-1 rounded-xl border border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[var(--accent-color)] text-[var(--accent-text)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === "privacy"
                    ? "bg-[var(--accent-color)] text-[var(--accent-text)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]"
                }`}
              >
                <ShieldCheck size={13} />
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
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

          <div className="overflow-y-auto flex-1 pr-1 mt-1">
            {/* TAB 1: Profile View & Edit About */}
            {activeTab === "profile" && (
              <div className="animate-in fade-in space-y-4 pt-3">
                {/* Avatar section */}
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer">
                    <img
                      src={currentAvatar}
                      alt={authUser.username}
                      onClick={() => setIsPhotoViewerOpen(true)}
                      className="w-24 h-24 rounded-full object-cover border-2 border-[var(--accent-color)] bg-[var(--bg-header)] shadow-md transition-transform group-hover:scale-105"
                      title="Click to view full photo"
                    />

                    {/* View Photo Badge */}
                    <button
                      type="button"
                      onClick={() => setIsPhotoViewerOpen(true)}
                      className="absolute bottom-0 left-0 p-1.5 rounded-full bg-[var(--bg-header)] text-[var(--text-secondary)] hover:text-[var(--accent-color)] shadow border border-[var(--border-color)] cursor-pointer"
                      title="View full photo"
                    >
                      <ZoomIn size={14} />
                    </button>

                    {/* Upload new photo trigger */}
                    <label
                      htmlFor="profile-avatar-input"
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90 shadow cursor-pointer transition-transform hover:scale-110"
                      title="Upload new photo"
                    >
                      <Camera size={14} />
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
                    Click photo to view • Tap camera icon to change
                  </p>

                  {selectedFile && (
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="mt-2.5 px-4 py-1.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                      Save New Photo
                    </button>
                  )}
                </div>

                {/* About (WhatsApp Status) Section */}
                <form
                  onSubmit={handleSaveAbout}
                  className="p-3.5 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider flex items-center gap-1.5">
                      <Info size={13} className="text-[var(--accent-color)]" />
                      About (Your Status)
                    </label>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {aboutText.length}/140
                    </span>
                  </div>

                  <input
                    type="text"
                    maxLength={140}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Hey there! I am using PulseChat."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)]"
                  />

                  {/* Preset status chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ABOUT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAboutText(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          aboutText === preset
                            ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)] text-[var(--accent-color)] font-medium"
                            : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      aboutLoading ||
                      aboutText === (authUser.about || "Hey there! I am using PulseChat.")
                    }
                    className="w-full mt-2 py-1.5 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {aboutLoading ? (
                      <Loader2 className="animate-spin" size={13} />
                    ) : (
                      <Check size={13} />
                    )}
                    Save Status
                  </button>
                </form>

                {/* Account Details */}
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 flex items-center gap-3">
                    <User size={16} className="text-[var(--accent-color)]" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                        Username
                      </p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        @{authUser.username}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 flex items-center gap-3">
                    <Mail size={16} className="text-[var(--accent-color)]" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                        Email Address
                      </p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {authUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 flex items-center gap-3">
                    <Calendar size={16} className="text-[var(--accent-color)]" />
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
                        Joined Date
                      </p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {formatDate(authUser.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Privacy Settings */}
            {activeTab === "privacy" && (
              <div className="animate-in fade-in space-y-4 pt-3">
                {/* 1. Profile Photo Visibility */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 space-y-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Camera size={14} className="text-[var(--accent-color)]" />
                      Who can see my Profile Photo
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Choose who is allowed to view your profile picture.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      {
                        id: "everyone",
                        title: "Everyone",
                        desc: "Anyone on PulseChat can see your profile photo.",
                        icon: Globe,
                      },
                      {
                        id: "contacts",
                        title: "My Chats Only",
                        desc: "Only people you have chatted with can see your photo.",
                        icon: Users,
                      },
                      {
                        id: "nobody",
                        title: "Nobody",
                        desc: "Your photo is hidden with a private default avatar.",
                        icon: UserX,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = profilePhotoPrivacy === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setProfilePhotoPrivacy(opt.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]"
                              : "bg-[var(--bg-secondary)] border-[var(--border-color)]/60 hover:border-[var(--border-color)]"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                                : "border-[var(--text-secondary)]"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-text)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium flex items-center gap-1.5 ${
                                isSelected
                                  ? "text-[var(--accent-color)] font-semibold"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              <Icon size={12} />
                              {opt.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Who can find / add me by username */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-header)] border border-[var(--border-color)]/60 space-y-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Search size={14} className="text-[var(--accent-color)]" />
                      Who can find & add me
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Control whether other users can discover your username in search.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      {
                        id: "everyone",
                        title: "Everyone",
                        desc: "Anyone can search your username/email to start a new chat.",
                        icon: Globe,
                      },
                      {
                        id: "nobody",
                        title: "Nobody (Private)",
                        desc: "Hide your profile from search results. Only existing chats can reach you.",
                        icon: Lock,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = whoCanFindMe === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setWhoCanFindMe(opt.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]"
                              : "bg-[var(--bg-secondary)] border-[var(--border-color)]/60 hover:border-[var(--border-color)]"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                                : "border-[var(--text-secondary)]"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-text)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium flex items-center gap-1.5 ${
                                isSelected
                                  ? "text-[var(--accent-color)] font-semibold"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              <Icon size={12} />
                              {opt.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Privacy Button */}
                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={privacyLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {privacyLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                  Save Privacy Settings
                </button>
              </div>
            )}

            {/* TAB 3: Security / Password Change */}
            {activeTab === "security" && (
              <form
                onSubmit={handlePasswordChange}
                className="space-y-3.5 pt-3 animate-in fade-in"
              >
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] pt-1">
                  🔒 After updating, use your new password next time you log in.
                </p>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
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
      </div>

      {/* Full Screen Photo Viewer for own avatar */}
      <FullScreenPhotoModal
        isOpen={isPhotoViewerOpen}
        onClose={() => setIsPhotoViewerOpen(false)}
        src={currentAvatar}
        title={authUser.username}
        subtitle={authUser.about || "Your Profile Photo"}
      />
    </>
  );
};
