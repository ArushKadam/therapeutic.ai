
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Sparkles,
  LogOut,
  LockKeyhole,
  Heart,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPanel = () => {
  const { logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-full w-full bg-[#F5F0E9] text-[#302A26]"
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* HEADER */}
        <header className="border-b border-[#DED3C7] pb-8">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
            TETHR / ACCOUNT
          </div>

          <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
            Settings.
          </h1>

          <p className="mt-3 text-sm text-[#7F7268]">
            Manage your account and learn more about TETHR.
          </p>
        </header>

        {/* PRIVACY SECTION */}
        <section className="border-b border-[#DED3C7] py-10">
          <div className="mb-6 flex items-center gap-3">
            <Shield
              size={21}
              strokeWidth={1.7}
              className="text-[#937E6B]"
            />

            <h2 className="text-xl font-extrabold tracking-tight">
              Privacy & Security
            </h2>
          </div>

          <div className="rounded-2xl border border-[#DED3C7] bg-[#F1EAE1] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DED3C7] bg-[#F5F0E9]">
                <LockKeyhole
                  size={21}
                  strokeWidth={1.7}
                  className="text-[#937E6B]"
                />
              </div>

              <div>
                <h3 className="text-base font-bold">
                  Your privacy matters.
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75685D]">
                  Your conversations and reflections are personal.
                  TETHR is designed to give you a dedicated space
                  to reflect and manage your wellness journey.
                </p>
              </div>
            </div>
          </div>

          {/* SIGN OUT */}
          <div className="mt-7 flex flex-col gap-5 rounded-xl border border-[#DED3C7] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <LogOut
                size={20}
                strokeWidth={1.7}
                className="shrink-0 text-[#937E6B]"
              />

              <div>
                <h3 className="text-sm font-bold">
                  Sign Out
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#7F7268]">
                  Log out of your account and return to the sign-in page.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#302A26] px-6 py-3 text-xs font-semibold text-[#F5F0E9] transition-colors hover:bg-[#514238]"
            >
              Sign Out
              <ArrowUpRight size={15} strokeWidth={1.8} />
            </button>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-10">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles
              size={21}
              strokeWidth={1.7}
              className="text-[#937E6B]"
            />

            <h2 className="text-xl font-extrabold tracking-tight">
              About TETHR
            </h2>
          </div>

          <div className="rounded-2xl border border-[#DED3C7] bg-[#F1EAE1] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto max-w-xl">
              <h3 className="text-5xl font-black tracking-[-0.09em] sm:text-6xl">
                TETHR
              </h3>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-[#937E6B]">
                A SPACE TO RECONNECT.
              </p>

              <div className="mx-auto my-8 h-px w-20 bg-[#CDBEAF]" />

              <p className="text-sm leading-7 text-[#75685D]">
                TETHR is your AI-powered wellness companion,
                created to provide a thoughtful space for
                reflection, emotional awareness, and personal growth.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#D8C9B9] px-4 py-2 text-xs font-medium text-[#78695D]">
                <Heart size={14} strokeWidth={1.7} />
                Version 1.0
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#DED3C7] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-tight text-[#937E6B]">
              TETHR
            </span>

            <span className="text-xs text-[#937E6B]">
              A space to reconnect.
            </span>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
