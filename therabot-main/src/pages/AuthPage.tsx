
import { useState, type FormEvent } from "react";
import { supabase } from "@/services/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            },
          },
        });

        if (authError) throw authError;

        setMessage(
          "Check your email for a confirmation link to activate your account."
        );
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(
        errorMessage.toLowerCase().includes("already registered")
          ? "This email is already registered. Please sign in instead."
          : errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((current) => !current);
    setError(null);
    setMessage(null);
    setShowPassword(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F2F0EB] px-5 py-12 font-sans text-[#29231F] sm:px-8">
      {/* Subtle atmospheric background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 43% 40%, rgba(176,155,134,0.19), transparent 54%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -left-40 h-[420px] w-[650px] rounded-full bg-[#8C9386]/20 blur-[95px]"
      />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 grid w-full max-w-[1050px] grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1px_0.85fr] md:gap-14 lg:gap-20"
      >
        {/* LEFT: BRAND */}
        <div className="flex flex-col items-center justify-center text-center md:items-start md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.15 }}
            className="relative text-[clamp(4.2rem,9vw,8.5rem)] font-black leading-none tracking-[-0.085em] text-[#29231F]"
            style={{
              fontFamily: '"Arial Black", Arial, sans-serif',
              textShadow: "0 12px 35px rgba(176,155,134,0.20)",
            }}
          >
            TETHR
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#9C8774] sm:text-xs"
          >
            A SPACE TO RECONNECT.
          </motion.p>
        </div>

        {/* CENTER DIVIDER */}
        <div className="hidden h-[310px] w-px bg-[#B09B86]/55 md:block" />

        {/* RIGHT: AUTHENTICATION */}
        <div className="mx-auto w-full max-w-[390px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-9">
                <h2 className="text-[36px] font-bold tracking-[-0.045em] text-[#29231F]">
                  {isSignUp ? "Create Account" : "Sign In"}
                </h2>
                <p className="mt-2 text-sm text-[#88786B]">
                  {isSignUp
                    ? "Your space to reconnect starts here."
                    : "Welcome back to your space."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="mb-2 block text-xs font-medium"
                      >
                        First name
                      </label>
                      <input
                        id="first-name"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="tethr-auth-input"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="last-name"
                        className="mb-2 block text-xs font-medium"
                      >
                        Last name
                      </label>
                      <input
                        id="last-name"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="tethr-auth-input"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium text-[#51463E]"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8774]"
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="tethr-auth-input pl-12"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-medium text-[#51463E]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8774]"
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      required
                      minLength={isSignUp ? 6 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="tethr-auth-input pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C8774] transition-colors hover:text-[#29231F]"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                )}

                {message && (
                  <p role="status" className="text-sm text-[#536C5D]">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex h-[52px] w-full items-center justify-center rounded-lg bg-[#29231F] text-sm font-semibold text-[#F2F0EB] transition-all duration-200 hover:bg-[#4A3D33] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </button>
              </form>

              <div className="mt-7 text-center">
                <p className="text-sm text-[#88786B]">
                  {isSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-[#806C5B] underline underline-offset-4 transition-colors hover:text-[#29231F]"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Bottom branding */}
      <div className="pointer-events-none absolute bottom-6 left-0 w-full text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#A5988B]">
        TETHR — A SPACE TO RECONNECT
      </div>
    </main>
  );
};

export default AuthPage;
