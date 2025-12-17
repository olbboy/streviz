// Keyboard shortcuts hook for global hotkeys

import { useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ShortcutConfig {
  action: string;
  description: string;
  keys: string;
}

// Global shortcut definitions
export const SHORTCUTS: ShortcutConfig[] = [
  { keys: "mod+n", action: "new_stream", description: "Create new stream" },
  { keys: "mod+,", action: "open_settings", description: "Open settings" },
  { keys: "mod+shift+d", action: "export_diagnostics", description: "Export diagnostics" },
  { keys: "space", action: "toggle_selected", description: "Start/stop selected stream" },
  { keys: "mod+a", action: "select_all", description: "Select all streams" },
  { keys: "escape", action: "clear_selection", description: "Clear selection" },
  { keys: "delete", action: "delete_selected", description: "Delete selected" },
  { keys: "mod+c", action: "copy_url", description: "Copy stream URL" },
  { keys: "mod+shift+s", action: "stop_all", description: "Stop all streams" },
  { keys: "mod+1", action: "goto_library", description: "Go to Library" },
  { keys: "mod+2", action: "goto_control_center", description: "Go to Control Center" },
  { keys: "mod+3", action: "goto_settings", description: "Go to Settings" },
  { keys: "?", action: "show_shortcuts", description: "Show shortcuts help" },
];

// Build lookup map for O(1) access
const SHORTCUT_MAP = new Map(SHORTCUTS.map((s) => [s.keys, s]));

// Platform detection
const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

// Convert key event to shortcut string
function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];

  // Modifier key (Cmd on Mac, Ctrl elsewhere)
  if (e.metaKey || e.ctrlKey) {
    parts.push("mod");
  }
  if (e.shiftKey) {
    parts.push("shift");
  }
  if (e.altKey) {
    parts.push("alt");
  }

  // Main key
  const key = e.key.toLowerCase();
  // Skip if key is just a modifier
  if (!["control", "meta", "shift", "alt"].includes(key)) {
    parts.push(key);
  }

  return parts.join("+");
}

// Format shortcut for display
export function formatShortcut(keys: string): string {
  return keys
    .split("+")
    .map((part) => {
      switch (part) {
        case "mod":
          return isMac ? "⌘" : "Ctrl";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "alt":
          return isMac ? "⌥" : "Alt";
        case "escape":
          return "Esc";
        case "delete":
          return isMac ? "⌫" : "Del";
        case "space":
          return "Space";
        default:
          return part.toUpperCase();
      }
    })
    .join(isMac ? "" : "+");
}

export type ShortcutHandlers = Partial<Record<string, () => void>>;

interface UseShortcutsOptions {
  enabled?: boolean;
}

export function useShortcuts(
  handlers: ShortcutHandlers,
  options: UseShortcutsOptions = {}
) {
  const { enabled = true } = options;

  // Memoize handler keys to avoid unnecessary re-renders
  const handlerKeys = Object.keys(handlers).sort().join(',');
  const stableHandlers = useMemo(() => handlers, [handlerKeys]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if disabled or user is typing in an input
      if (!enabled) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Allow escape to blur inputs
        if (e.key !== "Escape") return;
      }

      const shortcut = eventToShortcut(e);
      const config = SHORTCUT_MAP.get(shortcut);

      if (config) {
        const handler = stableHandlers[config.action];
        if (handler) {
          e.preventDefault();
          e.stopPropagation();
          handler();
        }
      }
    },
    [enabled, stableHandlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Hook for export diagnostics shortcut handler
export function useExportDiagnostics() {
  return useCallback(async () => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        filters: [{ name: "ZIP", extensions: ["zip"] }],
        defaultPath: `c-video-diagnostics-${Date.now()}.zip`,
      });

      if (path) {
        await invoke("export_diagnostics_zip", { outputPath: path });
        // Could show toast notification here
        console.log("Diagnostics exported to", path);
      }
    } catch (e) {
      console.error("Failed to export diagnostics:", e);
    }
  }, []);
}

// Shortcuts help modal content
export function ShortcutsHelp() {
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, ShortcutConfig[]> = {
      Navigation: [],
      Streams: [],
      Selection: [],
      Other: [],
    };

    for (const shortcut of SHORTCUTS) {
      if (shortcut.action.startsWith("goto_")) {
        groups.Navigation.push(shortcut);
      } else if (
        shortcut.action.includes("stream") ||
        shortcut.action === "toggle_selected" ||
        shortcut.action === "stop_all"
      ) {
        groups.Streams.push(shortcut);
      } else if (
        shortcut.action.includes("select") ||
        shortcut.action === "clear_selection"
      ) {
        groups.Selection.push(shortcut);
      } else {
        groups.Other.push(shortcut);
      }
    }

    return groups;
  }, []);

  return (
    <div className="shortcuts-help">
      <h2>Keyboard Shortcuts</h2>
      {Object.entries(groupedShortcuts).map(([group, shortcuts]) => (
        <div key={group} className="shortcut-group">
          <h3>{group}</h3>
          <div className="shortcut-list">
            {shortcuts.map((s) => (
              <div key={s.keys} className="shortcut-item">
                <span className="shortcut-keys">{formatShortcut(s.keys)}</span>
                <span className="shortcut-description">{s.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
