
import { useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardHome from "@/components/DashboardHome";
import Journal from "@/components/Journal";
import TextChat from "@/components/TextChat";
import VoiceSession from "@/components/VoiceSession";
import { BreathingExercise } from "@/components/BreathingExercise";
import SettingsPanel from "@/components/SettingsPanel";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import Resources from "@/components/Resources";
import WeeklyPlans from "@/components/WeeklyPlans";

const components = {
  dashboard: DashboardHome,
  journal: Journal,
  chat: TextChat,
  voice: VoiceSession,
  breathing: BreathingExercise,
  resources: Resources,
  plans: WeeklyPlans,
  settings: SettingsPanel,
};

type ComponentKey = keyof typeof components;

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which page is currently active
  const currentSection =
    location.pathname.slice(1) || "dashboard";

  const ActiveComponent =
    components[currentSection as ComponentKey] ||
    components.dashboard;

  // Handle sidebar navigation
  const handleSectionChange = (newSection: string) => {
    navigate(`/${newSection}`);
  };

  return (
    <SidebarProvider>
      <div
        className="
          flex
          h-screen
          w-full
          overflow-hidden
          bg-[#493D35]
        "
      >
        {/* WARM IVORY SIDEBAR */}
        <AppSidebar
          activeSection={currentSection}
          onSectionChange={handleSectionChange}
        />

        {/* DEEP ESPRESSO FRAME */}
        <SidebarInset
          className="
            flex
            min-w-0
            flex-1
            flex-col
            !bg-[#493D35]
            p-[6px]
            md:p-[10px]
          "
        >
          {/* MAIN CONTENT */}
          <main
            className="
              flex
              min-h-0
              w-full
              flex-1
              flex-col
              overflow-hidden
              rounded-[3px]
              bg-[#f5f0e9]
            "
          >
            {/* SCROLLABLE PAGE */}
            <div
              className="
                h-full
                w-full
                overflow-y-auto
                bg-[#f5f0e9]
              "
            >
              <ActiveComponent />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
