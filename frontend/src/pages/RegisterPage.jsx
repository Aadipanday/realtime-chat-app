import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ThemeModal } from "../components/Common/ThemeModal";
import { Logo } from "../components/Common/Logo";
import {
  Lock,
  User,
  Mail,
  Palette,
  Loader2,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Avatar image must be under 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      toast.error("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("username", formData.username.trim());
    data.append("email", formData.email.trim());
    data.append("password", formData.password);
    if (avatarFile) {
      data.append("avatar", avatarFile);
    }

    const res = await register(data);
    setLoading(false);
    if (res.success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)]">
      <button
        onClick={() => setIsThemeOpen(true)}
        className="fixed top-5 right-5 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs cursor-pointer"
        title="Change Theme"
      >
        <Palette size={18} />
      </button>

      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-7 shadow-xl">
        <div className="flex flex-col items-center text-center mb-5">
          <Logo size="lg" showText={true} showBadge={true} className="mb-2" />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Create an account to start messaging
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar upload preview */}
          <div className="flex justify-center mb-2">
            <div className="relative group cursor-pointer">
              <img
                src={
                  avatarPreview ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${
                    formData.username || "default"
                  }`
                }
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-color)] bg-[var(--bg-primary)]"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={18} />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                required
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-9 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl font-medium text-xs text-[var(--accent-text)] bg-[var(--accent-color)] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--accent-color)] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)]/70 mt-6 select-none flex items-center gap-1.5">
        <span>⚡ PulseChat</span>
        <span>•</span>
        <span className="text-[var(--accent-color)] font-medium">Powered by aadi</span>
      </p>

      <ThemeModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </div>
  );
};
