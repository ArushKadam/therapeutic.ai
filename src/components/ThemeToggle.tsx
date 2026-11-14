import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-muted text-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
    >
      <span>{isLight ? "🌙" : "☀️"}</span>
      <span>{isLight ? "Dark Mode" : "Light Mode"}</span>
    </button>
  );
}