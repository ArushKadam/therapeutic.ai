
import { motion } from "framer-motion";
import {
  Home,
  Mic,
  MessageCircle,
  Settings,
  BookOpen,
  Wind,
  Library,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileHeart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { UserProfile } from "./UserProfile";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "voice", label: "Voice Session", icon: Mic },
  { id: "chat", label: "Text Chat", icon: MessageCircle },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "breathing", label: "Breathing", icon: Wind },
  { id: "plans", label: "Weekly Plans", icon: Calendar },
  { id: "therapy-guide", label: "What to Expect", icon: ClipboardList },
  { id: "prepare-therapy", label: "Prepare for Therapy", icon: FileHeart },
  { id: "resources", label: "Resources", icon: Library },
  { id: "settings", label: "Settings", icon: Settings },
];

const formatUserName = (name: string) => {
  if (name.length > 15) {
    const parts = name.trim().split(/\s+/);

    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
  }

  return name;
};

export function AppSidebar({
  activeSection,
  onSectionChange,
}: AppSidebarProps) {
  const { user, loading, logout } = useAuth();

  const userName =
    user?.user_metadata?.full_name || "Anonymous";

  const userEmail = user?.email;

  return (
    <Sidebar
      collapsible="offcanvas"
      className="
        w-64
        border-r border-[#ded4c9]
        bg-[#f5f0e9]
        text-[#302a26]
        [&_[data-sidebar=sidebar]]:!bg-[#f5f0e9]
        [&_[data-sidebar=sidebar]]:!text-[#302a26]
        [&_[data-sidebar=sidebar]]:!border-[#ded4c9]
      "
    >
      {/* BRAND HEADER */}
      <SidebarHeader className="border-b border-[#ded4c9] px-7 pb-8 pt-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="
              text-[38px]
              font-black
              leading-none
              tracking-[-0.075em]
              text-[#302a26]
            "
          >
            TETHR
          </h1>

          <p
            className="
              mt-3
              text-[9px]
              font-bold
              uppercase
              tracking-[0.24em]
              text-[#937e6b]
            "
          >
            A SPACE TO RECONNECT.
          </p>
        </motion.div>
      </SidebarHeader>

      {/* NAVIGATION */}
      <SidebarContent className="flex h-full flex-col px-3 py-7">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel
            className="
              mb-5
              px-4
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-[#937e6b]
            "
          >
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <SidebarMenuItem key={item.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.035,
                      }}
                    >
                      <SidebarMenuButton
                        onClick={() =>
                          onSectionChange(item.id)
                        }
                        isActive={isActive}
                        tooltip={item.label}
                        className={`
                          !h-11
                          w-full
                          rounded-xl
                          px-4
                          transition-colors
                          duration-200
                          ${
                            isActive
                              ? "!bg-[#e5d9cd] !text-[#302a26]"
                              : "!text-[#665a50] hover:!bg-[#ece4db] hover:!text-[#302a26]"
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          strokeWidth={1.7}
                          className="shrink-0"
                        />

                        <span
                          className={`
                            ml-2
                            flex-1
                            text-[13px]
                            tracking-[-0.01em]
                            ${
                              isActive
                                ? "font-bold"
                                : "font-medium"
                            }
                          `}
                        >
                          {item.label}
                        </span>

                        {isActive && (
                          <ChevronRight
                            size={15}
                            strokeWidth={1.7}
                            className="text-[#937e6b]"
                          />
                        )}
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* USER PROFILE */}
        <div className="mt-auto border-t border-[#ded4c9] px-1 pt-5">
          {loading ? (
            <div className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full bg-[#e5d9cd]" />

              <div className="space-y-2">
                <Skeleton className="h-3 w-24 bg-[#e5d9cd]" />
                <Skeleton className="h-3 w-32 bg-[#e5d9cd]" />
              </div>
            </div>
          ) : user ? (
            <div
              className="
                rounded-xl
                [&_*]:!border-[#ded4c9]
                [&_*]:!text-[#302a26]
                [&_button:hover]:!bg-[#e5d9cd]
              "
            >
              <UserProfile
                name={formatUserName(userName)}
                email={userEmail}
                imageUrl={user.user_metadata?.avatar_url}
                onSettingsClick={() =>
                  onSectionChange("settings")
                }
                onLogout={logout}
              />
            </div>
          ) : (
            <p className="px-3 py-4 text-xs text-[#937e6b]">
              No user found
            </p>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
