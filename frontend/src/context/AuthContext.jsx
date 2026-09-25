import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(() => {
    const savedUser = localStorage.getItem("chat_app_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await API.get("/users/current-user");
        const userData = data.data.user || data.data;
        setAuthUser(userData);
        localStorage.setItem("chat_app_user", JSON.stringify(userData));
        if (data.data.accessToken) {
          localStorage.setItem("chat_app_token", data.data.accessToken);
        }
        if (data.data.refreshToken) {
          localStorage.setItem("chat_app_refresh_token", data.data.refreshToken);
        }
      } catch (error) {
        // Only wipe user session if backend explicitly rejected with 401 Unauthorized.
        // If it's a temporary network hiccup or Render cold-start, do NOT kick user to login screen.
        if (error.response?.status === 401) {
          setAuthUser(null);
          localStorage.removeItem("chat_app_user");
          localStorage.removeItem("chat_app_token");
          localStorage.removeItem("chat_app_refresh_token");
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await API.post("/users/login", credentials);
      const user = data.data.user;
      const token = data.data.accessToken;
      const refreshToken = data.data.refreshToken;
      setAuthUser(user);
      localStorage.setItem("chat_app_user", JSON.stringify(user));
      if (token) {
        localStorage.setItem("chat_app_token", token);
      }
      if (refreshToken) {
        localStorage.setItem("chat_app_refresh_token", refreshToken);
      }
      toast.success("Welcome back, " + user.username + "!");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await API.post("/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const user = data.data.user;
      const token = data.data.accessToken;
      const refreshToken = data.data.refreshToken;
      setAuthUser(user);
      localStorage.setItem("chat_app_user", JSON.stringify(user));
      if (token) {
        localStorage.setItem("chat_app_token", token);
      }
      if (refreshToken) {
        localStorage.setItem("chat_app_refresh_token", refreshToken);
      }
      toast.success("Account created successfully!");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await API.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthUser(null);
      localStorage.removeItem("chat_app_user");
      localStorage.removeItem("chat_app_token");
      localStorage.removeItem("chat_app_refresh_token");
      toast.success("Logged out successfully");
    }
  };

  const updateAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await API.patch("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = data.data;
      setAuthUser(updatedUser);
      localStorage.setItem("chat_app_user", JSON.stringify(updatedUser));
      toast.success("Avatar updated successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update avatar");
      return false;
    }
  };

  const changePassword = async ({ oldPassword, newPassword }) => {
    try {
      const { data } = await API.post("/users/change-password", {
        oldPassword,
        newPassword,
      });
      toast.success(data.message || "Password changed successfully!");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to change password";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        setAuthUser,
        isCheckingAuth,
        login,
        register,
        logout,
        updateAvatar,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
