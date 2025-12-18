// Enhanced file tree component with glassmorphism design

import { useState } from "react";
import { ChevronRight, ChevronDown, Film, Music, Image, File as FileIcon, Folder, FolderOpen, Check } from "lucide-react";
import { Card } from "../ui/card";
import type { MediaFile, MediaGroup } from "../../types";

interface EnhancedFileTreeProps {
  files: MediaFile[];
  selectedIds: Set<string>;
  onSelect: (fileId: string) => void;
  onMultiSelect: (fileId: string) => void;
}

// Group files by folder
function groupByFolder(files: MediaFile[]): MediaGroup[] {
  const groups: Record<string, MediaFile[]> = {};

  for (const file of files) {
    if (!groups[file.folder]) {
      groups[file.folder] = [];
    }
    groups[file.folder].push(file);
  }

  return Object.entries(groups)
    .map(([folder, files]) => ({ folder, files }))
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

// Get file icon based on extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"].includes(ext || "")) {
    return <Film size={16} className="file-icon video" />;
  }
  if (["mp3", "wav", "flac", "aac", "ogg", "wma"].includes(ext || "")) {
    return <Music size={16} className="file-icon audio" />;
  }
  if (["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(ext || "")) {
    return <Image size={16} className="file-icon image" />;
  }
  return <FileIcon size={16} className="file-icon default" />;
}

// Format duration as HH:MM:SS
function formatDuration(secs: number | null): string {
  if (secs === null) return "--:--";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Format file size
function formatSize(bytes: number | null): string {
  if (!bytes) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Compatibility badge with glassmorphism styling
function CompatibilityBadge({ compat }: { compat: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    copy: { bg: "badge-copy", text: "Direct" },
    transcode: { bg: "badge-transcode", text: "Transcode" },
    unsupported: { bg: "badge-unsupported", text: "Unsupported" },
  };

  const config = variants[compat] || variants.unsupported;

  return (
    <span className={`compatibility-badge ${config.bg}`}>
      {config.text}
    </span>
  );
}

// Folder node component
function FolderNode({
  group,
  isExpanded,
  onToggle,
  selectedIds,
  onSelect,
  onMultiSelect
}: {
  group: MediaGroup;
  isExpanded: boolean;
  onToggle: () => void;
  selectedIds: Set<string>;
  onSelect: (fileId: string) => void;
  onMultiSelect: (fileId: string) => void;
}) {
  const selectedCount = group.files.filter(f => selectedIds.has(f.id)).length;

  return (
    <div className="folder-node">
      <div className="folder-header" onClick={onToggle}>
        <div className="folder-toggle">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        <div className="folder-info">
          {isExpanded ? (
            <FolderOpen size={18} className="folder-icon expanded" />
          ) : (
            <Folder size={18} className="folder-icon" />
          )}
          <span className="folder-name">{group.folder}</span>
          <span className="file-count">
            {selectedCount > 0 ? (
              <span className="selected-count">{selectedCount}/</span>
            ) : null}
            {group.files.length}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="folder-files">
          {group.files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              isSelected={selectedIds.has(file.id)}
              onSelect={() => onSelect(file.id)}
              onMultiSelect={() => onMultiSelect(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// File row component
function FileRow({
  file,
  isSelected,
  onSelect,
  onMultiSelect
}: {
  file: MediaFile;
  isSelected: boolean;
  onSelect: () => void;
  onMultiSelect: () => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      if (e.ctrlKey || e.metaKey) {
        onMultiSelect();
      } else {
        onSelect();
      }
    }
  };

  return (
    <div
      className={`file-row ${isSelected ? 'selected' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="file-main">
        <div className="file-checkbox">
          {isSelected && <Check size={14} />}
        </div>
        {getFileIcon(file.filename)}
        <span className="filename">{file.filename}</span>
      </div>

      <div className="file-metadata">
        <span className="resolution">
          {file.width && file.height ? `${file.width}×${file.height}` : "N/A"}
        </span>
        <span className="duration">{formatDuration(file.duration_secs)}</span>
        <span className="size">{formatSize(file.size_bytes)}</span>
        <CompatibilityBadge compat={file.compatibility} />
      </div>
    </div>
  );
}

export function EnhancedFileTree({
  files,
  selectedIds,
  onSelect,
  onMultiSelect
}: EnhancedFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const groups = groupByFolder(files);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folder)) {
        newSet.delete(folder);
      } else {
        newSet.add(folder);
      }
      return newSet;
    });
  };

  // Expand all folders by default on initial load
  if (expandedFolders.size === 0 && groups.length > 0) {
    setExpandedFolders(new Set(groups.map(g => g.folder)));
  }

  if (files.length === 0) {
    return (
      <Card className="empty-tree surface">
        <div className="empty-tree-content">
          <Folder size={48} className="empty-icon" />
          <h3>No media files</h3>
          <p>Scan a folder to add media files to your library.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="enhanced-file-tree">
      {groups.map((group) => (
        <Card key={group.folder} className="folder-card surface">
          <FolderNode
            group={group}
            isExpanded={expandedFolders.has(group.folder)}
            onToggle={() => toggleFolder(group.folder)}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onMultiSelect={onMultiSelect}
          />
        </Card>
      ))}
    </div>
  );
}