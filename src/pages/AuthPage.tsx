
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  ChevronDown,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  MessageCircle,
  Mic,
  Wind,
  X,
} from "lucide-react";
import { supabase } from "@/services/supabase";

const COLORS = {
  ivory: "#F5F0E9",
  espresso: "#302A26",
  taupe: "#937E6B",
  muted: "#75675D",
  border: "#DCD1C6",
  soft: "#EBE3D9",
  sage: "#819179",
};

const features = [
  {
    number: "01",
    icon: MessageCircle,
    title: "A SPACE TO TALK.",
    description:
      "Express what's on your mind through AI-powered conversations, without the pressure of knowing exactly what to say.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "A SPACE TO REFLECT.",
    description:
      "Put your thoughts into words through journaling and thoughtful prompts designed to encourage self-reflection.",
  },
  {
    number: "03",
    icon: Brain,
    title: "A SPACE TO UNDERSTAND.",
    description:
      "Explore emotional patterns through mood tracking and personalized insights.",
  },
  {
    number: "04",
    icon: Wind,
    title: "A SPACE TO RESET.",
    description:
      "Find moments of calm through guided breathing exercises and simple wellness routines.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const AuthPage = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openAuth = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError(null);
    setMessage(null);
    setAuthOpen(true);
  };

  const closeAuth = () => {
    if (loading) return;
    setAuthOpen(false);
    setError(null);
    setMessage(null);
  };

  const switchAuth = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        setMessage(
          "Account request received. Check your email for a confirmation link if email verification is enabled."
        );
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) throw signInError;

        // AuthProvider handles the session and navigation.
      }
    } catch (err: any) {
      setError(
        err?.message?.includes("already registered")
          ? "This email is already registered. Please sign in."
          : err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: COLORS.ivory,
        color: COLORS.espresso,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-[#DCD1C6] bg-[#F5F0E9]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[86px] max-w-[1500px] items-center justify-between px-6 md:px-12 lg:px-20">
          <a href="#home" className="flex flex-col">
            <span className="text-[31px] font-black leading-none tracking-[-0.09em]">
              TETHR
            </span>
            <span className="mt-2 text-[8px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
              A SPACE TO RECONNECT.
            </span>
          </a>

          <nav className="hidden items-center gap-10 md:flex">
            <a
              href="#about"
              className="text-xs font-semibold transition-colors hover:text-[#937E6B]"
            >
              About
            </a>
            <a
              href="#features"
              className="text-xs font-semibold transition-colors hover:text-[#937E6B]"
            >
              What We Offer
            </a>
            <a
              href="#mission"
              className="text-xs font-semibold transition-colors hover:text-[#937E6B]"
            >
              Our Mission
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth(false)}
              className="text-xs font-bold transition-colors hover:text-[#937E6B]"
            >
              Sign In
            </button>

            <button
              onClick={() => openAuth(true)}
              className="rounded-md bg-[#302A26] px-5 py-3 text-xs font-bold text-[#F5F0E9] transition-all hover:bg-[#55473D]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section
          id="home"
          className="relative flex min-h-[calc(100vh-86px)] items-center border-b border-[#DCD1C6]"
        >
          <div className="mx-auto grid w-full max-w-[1500px] items-center gap-12 px-6 py-20 md:px-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-20">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.13 }}
            >
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="mb-9 flex items-center gap-3"
              >
                <span className="h-[1px] w-9 bg-[#937E6B]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                  Mental wellness, at your own pace
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                className="max-w-[900px] text-[clamp(48px,7.2vw,112px)] font-black leading-[0.97] tracking-[-0.075em]"
              >
                GETTING
                <br />
                HELP IS HARD.
                <br />
                <span className="text-[#937E6B]">
                  START HERE.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                className="mt-10 max-w-[490px] text-base leading-8 text-[#75675D] md:text-lg"
              >
                You don't have to have everything figured out.
                TETHR gives you a place to talk, reflect, and
                understand yourself — one step at a time.
              </motion.p>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.7 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <button
                  onClick={() => openAuth(true)}
                  className="group flex items-center gap-8 rounded-md bg-[#302A26] px-7 py-4 text-sm font-semibold text-white transition-all hover:bg-[#55473D]"
                >
                  Begin Your Journey
                  <ArrowUpRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </button>

                <a
                  href="#about"
                  className="flex items-center gap-4 rounded-md border border-[#CDBEAF] px-7 py-4 text-sm font-semibold transition-colors hover:bg-[#EBE3D9]"
                >
                  Learn More
                  <ArrowRight size={17} />
                </a>
              </motion.div>
            </motion.div>

            {/* ABSTRACT BRAND VISUAL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.25 }}
              className="relative mx-auto flex aspect-square w-full max-w-[470px] items-center justify-center"
            >
              <div className="absolute inset-[7%] rounded-full border border-[#D5C8BB]" />
              <div className="absolute inset-[17%] rounded-full border border-[#D5C8BB]" />
              <div className="absolute inset-[27%] rounded-full border border-[#D5C8BB]" />

              <motion.div
                animate={{
                  scale: [1, 1.06, 1],
                  rotate: [0, 3, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-[52%] w-[52%] items-center justify-center rounded-[40%] bg-[#D8C5B1] shadow-[0_0_100px_35px_rgba(147,126,107,0.17)]"
              >
                <div className="absolute inset-5 rounded-[38%] border border-[#BCA58E]/60" />
                <span className="text-[clamp(36px,5vw,70px)] font-black tracking-[-0.09em] text-[#302A26]">
                  T.
                </span>
              </motion.div>

              <span className="absolute bottom-[9%] text-[9px] font-bold uppercase tracking-[0.35em] text-[#937E6B]">
                A space to reconnect
              </span>
            </motion.div>
          </div>

          <a
            href="#about"
            aria-label="Scroll to learn more"
            className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-[#937E6B] lg:block"
          >
            <ChevronDown size={23} />
          </a>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="border-b border-[#DCD1C6] px-6 py-28 md:px-12 lg:px-20"
        >
          <div className="mx-auto grid max-w-[1350px] gap-14 lg:grid-cols-[0.55fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                01 / Why We Exist
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-[clamp(34px,4.5vw,68px)] font-black leading-[1.07] tracking-[-0.06em]">
                SOMETIMES THE
                <br />
                HARDEST PART
                <br />
                IS BEGINNING.
              </h2>

              <div className="mt-9 max-w-[640px] space-y-5 text-base leading-8 text-[#75675D]">
                <p>
                  Opening up about mental health isn't always easy.
                  Finding the right words, understanding what you're
                  feeling, or deciding whether to seek therapy can
                  feel overwhelming.
                </p>

                <p>
                  We believe that getting support shouldn't have to
                  start with a big commitment. Sometimes, it starts
                  with a simple conversation or a moment of reflection.
                </p>

                <p className="font-semibold text-[#302A26]">
                  That's where TETHR comes in.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* STATEMENT BAND */}
        <section className="bg-[#302A26] px-6 py-24 text-[#F5F0E9] md:px-12 lg:px-20">
          <div className="mx-auto max-w-[1350px]">
            <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C7AE97]">
              Our Philosophy
            </p>

            <h2 className="max-w-[1100px] text-[clamp(34px,5.6vw,85px)] font-black leading-[1.08] tracking-[-0.06em]">
              YOU DON'T NEED TO
              <br />
              HAVE ALL THE ANSWERS
              <br />
              TO TAKE THE
              <span className="text-[#BBA38D]"> FIRST STEP.</span>
            </h2>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="border-b border-[#DCD1C6] px-6 py-28 md:px-12 lg:px-20"
        >
          <div className="mx-auto max-w-[1350px]">
            <div className="mb-16 flex flex-wrap items-end justify-between gap-8">
              <div>
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                  02 / What We Offer
                </p>
                <h2 className="text-[clamp(38px,5vw,70px)] font-black leading-none tracking-[-0.06em]">
                  YOUR SPACE.
                  <br />
                  YOUR PACE.
                </h2>
              </div>

              <p className="max-w-[320px] text-sm leading-7 text-[#75675D]">
                Simple tools to help you explore your emotions,
                develop self-awareness, and build healthy habits.
              </p>
            </div>

            <div className="grid border-t border-l border-[#DCD1C6] md:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.div
                    key={feature.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                    }}
                    className="group min-h-[300px] border-r border-b border-[#DCD1C6] p-8 transition-colors hover:bg-[#EBE3D9] md:p-11"
                  >
                    <div className="mb-16 flex items-start justify-between">
                      <span className="text-xs font-semibold text-[#937E6B]">
                        {feature.number}
                      </span>

                      <Icon
                        size={26}
                        strokeWidth={1.3}
                        className="text-[#937E6B] transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <h3 className="mb-4 text-xl font-black tracking-[-0.04em] md:text-2xl">
                      {feature.title}
                    </h3>

                    <p className="max-w-[390px] text-sm leading-7 text-[#75675D]">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-xs text-[#937E6B]">
              <span>VOICE CONVERSATIONS</span>
              <span>•</span>
              <span>MOOD TRACKING</span>
              <span>•</span>
              <span>WEEKLY WELLNESS PLANS</span>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section
          id="mission"
          className="px-6 py-28 md:px-12 lg:px-20"
        >
          <div className="mx-auto grid max-w-[1350px] items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                03 / Our Mission
              </p>

              <h2 className="text-[clamp(38px,5vw,75px)] font-black leading-[1.04] tracking-[-0.06em]">
                A BRIDGE
                <br />
                TOWARD
                <br />
                <span className="text-[#937E6B]">
                  REAL SUPPORT.
                </span>
              </h2>

              <p className="mt-8 max-w-[500px] text-base leading-8 text-[#75675D]">
                TETHR isn't here to replace professional therapy.
                It's here to make the idea of seeking support feel
                a little less intimidating.
              </p>

              <p className="mt-5 max-w-[500px] text-base leading-8 text-[#75675D]">
                By giving you room to reflect, practice expressing
                your thoughts, and understand your emotions,
                TETHR can help you prepare for conversations
                with mental health professionals when you're ready.
              </p>
            </motion.div>

            <div className="rounded-[3px] bg-[#EBE3D9] p-8 md:p-12">
              <div className="mb-12 flex h-14 w-14 items-center justify-center rounded-full border border-[#CDBEAF]">
                <Heart size={25} strokeWidth={1.4} />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#937E6B]">
                The TETHR Approach
              </p>

              <div className="mt-8 space-y-0">
                {[
                  ["01", "START A CONVERSATION"],
                  ["02", "UNDERSTAND YOURSELF"],
                  ["03", "BUILD CONFIDENCE"],
                  ["04", "EXPLORE PROFESSIONAL SUPPORT"],
                ].map(([number, title]) => (
                  <div
                    key={number}
                    className="flex items-center gap-6 border-t border-[#CDBEAF] py-6"
                  >
                    <span className="text-xs font-semibold text-[#937E6B]">
                      {number}
                    </span>
                    <span className="text-sm font-black tracking-tight">
                      {title}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs leading-6 text-[#75675D]">
                Your journey doesn't have to follow a fixed order.
                Professional support is always an option, at any stage.
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-[#E7DBCF] px-6 py-28 text-center md:px-12">
          <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
            Your Journey Starts Here
          </p>

          <h2 className="mx-auto max-w-[1000px] text-[clamp(43px,6vw,90px)] font-black leading-[1.02] tracking-[-0.065em]">
            ONE SMALL STEP
            <br />
            CAN CHANGE
            <br />
            EVERYTHING.
          </h2>

          <p className="mx-auto mt-8 max-w-[500px] text-sm leading-7 text-[#75675D]">
            You don't need the perfect words or a perfect plan.
            Just a willingness to begin.
          </p>

          <button
            onClick={() => openAuth(true)}
            className="mt-9 inline-flex items-center gap-8 rounded-md bg-[#302A26] px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-[#55473D]"
          >
            Get Started
            <ArrowUpRight size={18} />
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#DCD1C6] px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-[1350px] flex-wrap items-end justify-between gap-8">
          <div>
            <h3 className="text-3xl font-black tracking-[-0.08em]">
              TETHR
            </h3>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.25em] text-[#937E6B]">
              A SPACE TO RECONNECT.
            </p>
          </div>

          <div className="max-w-[500px] text-xs leading-6 text-[#75675D]">
            TETHR is an AI-powered wellness tool, not a substitute
            for professional mental health care, diagnosis,
            or emergency services.
            <div className="mt-2">
              If you're in crisis in the U.S., call or text 988.
            </div>
          </div>

          <span className="text-xs text-[#937E6B]">
            © {new Date().getFullYear()} TETHR
          </span>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#211B17]/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeAuth();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative grid w-full max-w-[960px] overflow-hidden rounded-[24px] bg-[#F5F0E9] shadow-2xl md:grid-cols-2"
            >
              <button
                type="button"
                onClick={closeAuth}
                disabled={loading}
                aria-label="Close"
                className="absolute right-5 top-5 z-10 rounded-full p-2 text-[#75675D] transition-colors hover:bg-[#EBE3D9]"
              >
                <X size={20} />
              </button>

              {/* LEFT BRAND PANEL */}
              <div className="relative hidden min-h-[570px] flex-col justify-between overflow-hidden border-r border-[#DCD1C6] bg-[#EBE3D9] p-12 md:flex">
                <div>
                  <h2 className="text-[55px] font-black leading-none tracking-[-0.09em]">
                    TETHR
                  </h2>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                    A SPACE TO RECONNECT.
                  </p>
                </div>

                <div className="relative z-10">
                  <div className="mb-7 h-[1px] w-12 bg-[#937E6B]" />
                  <h3 className="text-[38px] font-black leading-[1.1] tracking-[-0.06em]">
                    YOUR SPACE.
                    <br />
                    YOUR PACE.
                  </h3>
                  <p className="mt-5 max-w-[290px] text-sm leading-7 text-[#75675D]">
                    A place to reflect, reconnect, and take your
                    first step toward understanding yourself.
                  </p>
                </div>

                <div className="absolute -bottom-24 -right-24 h-[300px] w-[300px] rounded-full bg-[#C9B7A5]/30 blur-[60px]" />
              </div>

              {/* RIGHT FORM */}
              <div className="flex flex-col justify-center px-7 py-12 sm:px-11 md:py-16">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#937E6B]">
                  {isSignUp ? "Begin Your Journey" : "Welcome Back"}
                </p>

                <h2
                  id="auth-title"
                  className="text-[36px] font-black tracking-[-0.06em]"
                >
                  {isSignUp ? "Create Account" : "Sign In"}
                </h2>

                <p className="mb-9 mt-2 text-sm text-[#75675D]">
                  {isSignUp
                    ? "Your space to reconnect starts here."
                    : "Continue where you left off."}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-2 block text-xs font-semibold"
                        >
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          value={firstName}
                          onChange={(e) =>
                            setFirstName(e.target.value)
                          }
                          placeholder="First name"
                          className="w-full rounded-md border border-[#CDBEAF] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#937E6B]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-2 block text-xs font-semibold"
                        >
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          value={lastName}
                          onChange={(e) =>
                            setLastName(e.target.value)
                          }
                          placeholder="Last name"
                          className="w-full rounded-md border border-[#CDBEAF] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#937E6B]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#937E6B]"
                      />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-[#CDBEAF] bg-transparent py-3 pl-11 pr-4 text-sm outline-none focus:border-[#937E6B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#937E6B]"
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          isSignUp
                            ? "new-password"
                            : "current-password"
                        }
                        minLength={6}
                        required
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Enter your password"
                        className="w-full rounded-md border border-[#CDBEAF] bg-transparent py-3 pl-11 pr-12 text-sm outline-none focus:border-[#937E6B]"
                      />

                      <button
                        type="button"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#937E6B]"
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
                    <p
                      role="alert"
                      className="rounded-md bg-red-50 px-4 py-3 text-xs text-red-700"
                    >
                      {error}
                    </p>
                  )}

                  {message && (
                    <p
                      role="status"
                      className="rounded-md bg-[#E3E9DF] px-4 py-3 text-xs text-[#496446]"
                    >
                      {message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-md bg-[#302A26] px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#55473D] disabled:opacity-50"
                  >
                    {loading
                      ? "Processing..."
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}

                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>

                <div className="mt-7 text-center text-xs text-[#75675D]">
                  {isSignUp
                    ? "Already have an account?"
                    : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={switchAuth}
                    className="font-bold text-[#302A26] underline underline-offset-4"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </div>

                <p className="mt-10 text-center text-[10px] leading-5 text-[#937E6B]">
                  A space to reconnect, reflect, and grow.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;