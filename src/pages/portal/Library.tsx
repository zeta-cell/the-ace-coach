import { useState } from "react";
import { BookOpen, Blocks } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import { CoachModulesContent } from "./CoachModules";
import { TrainingBlocksContent } from "./TrainingBlocks";

type LibraryTab = "modules" | "blocks";

const Library = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>("modules");

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-4">LIBRARY</h1>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-card border border-border rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("modules")}
            className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
              activeTab === "modules"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <BookOpen size={16} />
            MODULES
          </button>
          <button
            onClick={() => setActiveTab("blocks")}
            className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
              activeTab === "blocks"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Blocks size={16} />
            TRAINING BLOCKS
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "modules" ? (
          <CoachModulesContent embedded />
        ) : (
          <TrainingBlocksContent embedded />
        )}
      </div>
    </PortalLayout>
  );
};

export default Library;
