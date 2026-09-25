import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const THEMES = [
  { id: "dark", name: "WhatsApp Dark", color: "#00a884", bg: "#111b21" },
  { id: "light", name: "WhatsApp Light", color: "#008069", bg: "#efeae2" },
  { id: "midnight", name: "Midnight OLED", color: "#00a884", bg: "#000000" },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("chat_app_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chat_app_theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
