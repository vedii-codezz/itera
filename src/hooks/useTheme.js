import { useEffect, useState } from "react";
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("itera-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("itera-theme", theme);
    } catch {
      /* Theme remains usable with storage disabled. */
    }
  }, [theme]);
  return [
    theme,
    () => setTheme((value) => (value === "dark" ? "light" : "dark")),
  ];
}
