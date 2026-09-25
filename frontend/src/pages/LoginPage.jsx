import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ThemeModal } from "../components/Common/ThemeModal";
import { MessageSquare, Lock, User, Palette, Loader2, Eye, EyeOff } from "lucide-react";

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usernameOrEmail.trim() || !formData.password) return;

    setLoading(true);
    const isEmail = formData.usernameOrEmail.includes("@");
    const payload = {
      email: isEmail ? formData.usernameOrEmail.trim() : undefined,
      username: !isEmail ? formData.usernameOrEmail.trim() : undefined,
      password: formData.password,
    };

    const res = await login(payload);
    setLoading(false);
    if (res.success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      {/* Theme toggle button top-right */}
      <button
        onClick={() => setIsThemeOpen(true)}
        className="fixed top-5 right-5 p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs"
        title="Change Theme"
      >
        <Palette size={18} />
      </button>

      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-7 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <MessageSquare size={24} />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Welcome Back
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Sign in to continue to your messages
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type="text"
                required
                placeholder="Enter username or email"
                value={formData.usernameOrEmail}
                onChange={(e) =>
                  setFormData({ ...formData, usernameOrEmail: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-10 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-xs text-[var(--accent-text)] bg-[var(--accent-color)] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-5">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[var(--accent-color)] font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      <ThemeModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </div>
  );
};
