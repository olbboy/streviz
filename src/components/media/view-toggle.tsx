// View toggle component for switching between grid, list, and tree views

import { Grid, List, FolderTree } from "lucide-react";
import { GlassButton } from "../ui/glass-button";
import type { ViewMode } from "../../types";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const views = [
    { mode: "grid" as ViewMode, icon: Grid, label: "Grid" },
    { mode: "list" as ViewMode, icon: List, label: "List" },
    { mode: "tree" as ViewMode, icon: FolderTree, label: "Tree" },
  ];

  return (
    <div className="view-toggle">
      <div className="toggle-group">
        {views.map(({ mode, icon: Icon, label }) => (
          <GlassButton
            key={mode}
            variant={viewMode === mode ? "primary" : "surface"}
            size="sm"
            onClick={() => onViewChange(mode)}
            className={`view-button ${viewMode === mode ? "active" : ""}`}
            title={`Switch to ${label} view`}
          >
            <Icon size={18} />
            <span className="view-label">{label}</span>
          </GlassButton>
        ))}
      </div>
    </div>
  );
}