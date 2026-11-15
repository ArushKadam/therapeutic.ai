
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  Heart,
  Shield,
  AlertTriangle,
  ExternalLink,
  Search,
  BookOpen,
  Users,
  Globe,
  Clock,
  MapPin,
  LifeBuoy,
  ArrowUpRight,
  X,
  type LucideIcon,
} from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  phone?: string;
  website?: string;
  text?: string;
  category: "crisis" | "support" | "education" | "therapy";
  available: "24/7" | "business-hours" | "limited";
  country: string;
  icon: LucideIcon;
  urgent?: boolean;
}

const resources: Resource[] = [
  {
    id: "988",
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support for people in suicidal crisis or emotional distress.",
    phone: "988",
    text: "988",
    website: "https://988lifeline.org",
    category: "crisis",
    available: "24/7",
    country: "United States",
    icon: Phone,
    urgent: true,
  },
  {
    id: "crisis-text",
    name: "Crisis Text Line",
    description: "Text-based crisis intervention and emotional support.",
    text: "HOME to 741741",
    website: "https://www.crisistextline.org",
    category: "crisis",
    available: "24/7",
    country: "United States",
    icon: MessageCircle,
    urgent: true,
  },
  {
    id: "trevor-project",
    name: "The Trevor Project",
    description: "Crisis intervention and suicide prevention for LGBTQ+ youth.",
    phone: "1-866-488-7386",
    text: "START to 678678",
    website: "https://www.thetrevorproject.org",
    category: "crisis",
    available: "24/7",
    country: "United States",
    icon: Heart,
    urgent: true,
  },
  {
    id: "veterans-crisis",
    name: "Veterans Crisis Line",
    description: "Confidential support for veterans and their families.",
    phone: "1-800-273-8255",
    text: "838255",
    website: "https://www.veteranscrisisline.net",
    category: "crisis",
    available: "24/7",
    country: "United States",
    icon: Shield,
    urgent: true,
  },
  {
    id: "nami",
    name: "NAMI HelpLine",
    description: "Information, referrals, and support for mental health conditions.",
    phone: "1-800-950-NAMI (6264)",
    website: "https://www.nami.org/help",
    category: "support",
    available: "business-hours",
    country: "United States",
    icon: Users,
  },
  {
    id: "mental-health-america",
    name: "Mental Health America",
    description: "Resources, screening tools, and educational materials.",
    website: "https://www.mhanational.org",
    category: "education",
    available: "business-hours",
    country: "United States",
    icon: BookOpen,
  },
  {
    id: "psychology-today",
    name: "Psychology Today Therapist Finder",
    description: "Find licensed therapists, psychiatrists, and treatment centers.",
    website: "https://www.psychologytoday.com/us/therapists",
    category: "therapy",
    available: "business-hours",
    country: "United States",
    icon: Globe,
  },
  {
    id: "betterhelp",
    name: "BetterHelp",
    description: "Online therapy platform with licensed counselors.",
    website: "https://www.betterhelp.com",
    category: "therapy",
    available: "24/7",
    country: "United States",
    icon: MessageCircle,
  },
  {
    id: "talkspace",
    name: "Talkspace",
    description: "Online therapy and psychiatry services.",
    website: "https://www.talkspace.com",
    category: "therapy",
    available: "24/7",
    country: "United States",
    icon: MessageCircle,
  },
];

const categories = [
  { id: "all", label: "All Resources", icon: Globe },
  { id: "crisis", label: "Crisis Support", icon: AlertTriangle },
  { id: "support", label: "General Support", icon: Heart },
  { id: "education", label: "Education", icon: BookOpen },
  { id: "therapy", label: "Therapy", icon: Users },
];

const palette = {
  background: "#F5F0E9",
  card: "#F1EAE1",
  espresso: "#302A26",
  taupe: "#937E6B",
  muted: "#7F7268",
  border: "#DED3C7",
  sage: "#71816B",
};

const Resources: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredResources = resources.filter((resource) => {
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      resource.name.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query) ||
      resource.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "all" ||
      resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* PAGE HEADER */}
        <header className="border-b border-[#DED3C7] pb-8">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
            TETHR / SUPPORT DIRECTORY
          </div>

          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
                Mental Health Resources.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7F7268]">
                Find support, guidance, and professional resources
                whenever you need them.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#937E6B]">
              <LifeBuoy size={17} strokeWidth={1.7} />
              Support is available
            </div>
          </div>
        </header>

        {/* SEARCH & FILTERS */}
        <section className="border-b border-[#DED3C7] py-8">
          <div className="relative w-full">
            <Search
              size={19}
              strokeWidth={1.8}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#937E6B]"
            />

            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 w-full rounded-xl border border-[#DED3C7] bg-[#F1EAE1] pl-14 pr-12 text-sm text-[#302A26] outline-none transition-colors placeholder:text-[#9B8B7C] focus:border-[#937E6B] focus:ring-2 focus:ring-[#937E6B]/10"
            />

            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#937E6B] hover:text-[#302A26]"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "border-[#302A26] bg-[#302A26] text-[#F5F0E9]"
                      : "border-[#DED3C7] bg-transparent text-[#78695D] hover:border-[#937E6B] hover:bg-[#EAE1D7]"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {category.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* DIRECTORY TITLE */}
        <div className="flex items-center justify-between gap-4 py-8">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Explore Support
            </h2>
            <p className="mt-1 text-xs text-[#7F7268]">
              A collection of mental health and wellness resources.
            </p>
          </div>

          <span className="text-xs font-medium text-[#937E6B]">
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "resource" : "resources"}
          </span>
        </div>

        {/* RESOURCE CARDS */}
        {filteredResources.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredResources.map((resource, index) => {
              const Icon = resource.icon;

              return (
                <motion.article
                  key={resource.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.035, 0.2),
                  }}
                  className="group flex h-full flex-col rounded-2xl border border-[#DED3C7] bg-[#F1EAE1] p-6 transition-all duration-200 hover:border-[#C9B8A7] hover:shadow-[0_10px_30px_rgba(48,42,38,0.055)]"
                >
                  {/* CARD HEADER */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DED3C7] bg-[#F5F0E9] text-[#937E6B]">
                      <Icon size={21} strokeWidth={1.7} />
                    </div>

                    {resource.urgent && (
                      <span className="rounded-full border border-[#D8B6A7] bg-[#EAD6CB] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#945B48]">
                        Urgent
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold leading-snug tracking-tight">
                    {resource.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-[#7F7268]">
                    <Clock size={13} strokeWidth={1.8} />
                    <span>
                      {resource.available === "24/7"
                        ? "24/7 Support"
                        : resource.available === "business-hours"
                        ? "Business hours"
                        : "Limited availability"}
                    </span>
                  </div>

                  <p className="mt-5 min-h-[48px] text-sm leading-6 text-[#75685D]">
                    {resource.description}
                  </p>

                  {/* CONTACT DETAILS */}
                  <div className="mt-5 space-y-3 border-t border-[#DED3C7] pt-5">
                    {resource.phone && (
                      <div className="flex items-start gap-3 text-sm">
                        <Phone
                          size={16}
                          className="mt-0.5 shrink-0 text-[#937E6B]"
                        />
                        <span className="text-[#7F7268]">Call</span>
                        <a
                          href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`}
                          className="ml-auto text-right font-semibold text-[#302A26] hover:underline"
                        >
                          {resource.phone}
                        </a>
                      </div>
                    )}

                    {resource.text && (
                      <div className="flex items-start gap-3 text-sm">
                        <MessageCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-[#937E6B]"
                        />
                        <span className="text-[#7F7268]">Text</span>
                        <span className="ml-auto text-right font-semibold text-[#302A26]">
                          {resource.text}
                        </span>
                      </div>
                    )}

                    {!resource.phone && !resource.text && (
                      <div className="flex items-center gap-2 text-xs text-[#937E6B]">
                        <Globe size={15} />
                        Online resource
                      </div>
                    )}
                  </div>

                  {/* WEBSITE BUTTON */}
                  <div className="mt-auto pt-6">
                    {resource.website && (
                      <a
                        href={resource.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#302A26] px-4 py-3 text-xs font-semibold text-[#F5F0E9] transition-colors hover:bg-[#514238]"
                      >
                        Visit Website
                        <ArrowUpRight size={15} strokeWidth={1.8} />
                      </a>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-[#DED3C7] pt-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#937E6B]">
                        <MapPin size={13} />
                        {resource.country}
                      </div>

                      <span className="rounded-full bg-[#E5D9CC] px-3 py-1 text-[10px] font-semibold capitalize text-[#756354]">
                        {resource.category}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#CDBEAF] px-6 py-20 text-center">
            <Search
              size={28}
              strokeWidth={1.5}
              className="mx-auto mb-4 text-[#937E6B]"
            />
            <h3 className="text-lg font-bold">
              No resources found
            </h3>
            <p className="mt-2 text-sm text-[#7F7268]">
              Try another search or choose a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-5 rounded-lg bg-[#302A26] px-5 py-2.5 text-xs font-semibold text-[#F5F0E9]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* IMPORTANT INFORMATION */}
        <section className="mt-12 border-t border-[#DED3C7] pt-10">
          <div className="mb-7 flex items-center gap-3">
            <Heart
              size={20}
              strokeWidth={1.7}
              className="text-[#937E6B]"
            />
            <h2 className="text-xl font-extrabold tracking-tight">
              Important Information
            </h2>
          </div>

          <div className="grid gap-8 rounded-2xl border border-[#DED3C7] bg-[#F1EAE1] p-6 md:grid-cols-2 md:p-8">
            <div>
              <h3 className="mb-4 text-sm font-bold">
                What to Expect
              </h3>

              <ul className="space-y-3 text-sm leading-6 text-[#75685D]">
                <li>• Confidential and free support from crisis services</li>
                <li>• Trained counselors available 24/7 through designated crisis lines</li>
                <li>• A supportive, nonjudgmental conversation</li>
                <li>• Anonymous options may be available</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold">
                When to Reach Out
              </h3>

              <ul className="space-y-3 text-sm leading-6 text-[#75685D]">
                <li>• Having thoughts of suicide</li>
                <li>• Feeling overwhelmed or hopeless</li>
                <li>• Needing someone to talk to</li>
                <li>• Looking for mental health resources</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-[#DED3C7] pt-6 text-center">
            <p className="text-sm font-medium text-[#51473F]">
              Support is available whenever you need it.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-[#937E6B]">
              These resources are provided for informational purposes.
              Availability and eligibility vary by service. This directory
              is not a substitute for professional medical advice.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Resources;
