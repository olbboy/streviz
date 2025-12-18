// Media file card component with glassmorphism design

import { useState } from "react";
import { Play, Pause, Film, Music, Image, File as FileIcon, Check, MoreVertical, Download, Trash2 } from "lucide-react";
import { GlassCard } from "../ui/glass-card";
import { GlassButton } from "../ui/glass-button";
import type { MediaFile } from "../../types";

interface MediaFileCardProps {
  file: MediaFile;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onMultiSelect: () => void;
}

// Get file icon based on extension
function getFileIcon(filename: string, size: number = 24) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"].includes(ext || "")) {
    return <Film size={size} className="file-type-icon video" />;
  }
  if (["mp3", "wav", "flac", "aac", "ogg", "wma"].includes(ext || "")) {
    return <Music size={size} className="file-type-icon audio" />;
  }
  if (["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(ext || "")) {
    return <Image size={size} className="file-type-icon image" />;
  }
  return <FileIcon size={size} className="file-type-icon default" />;
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

// Get compatibility configuration
function getCompatibilityConfig(compat: string) {
  const configs: Record<string, { label: string; variant: "success" | "warning" | "error" }> = {
    copy: { label: "Direct", variant: "success" },
    transcode: { label: "Transcode", variant: "warning" },
    unsupported: { label: "Unsupported", variant: "error" },
  };

  return configs[compat] || configs.unsupported;
}

export function MediaFileCard({
  file,
  isSelected,
  viewMode,
  onSelect,
  onMultiSelect
}: MediaFileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const compatConfig = getCompatibilityConfig(file.compatibility);
  const hasThumbnail = file.thumbnail_url;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      if (e.ctrlKey || e.metaKey) {
        onMultiSelect();
      } else {
        onSelect();
      }
    }
  };

  if (viewMode === "list") {
    return (
      <GlassCard
        className={`media-file-card list-view ${isSelected ? 'selected' : ''}`}
        variant="interactive"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="list-card-content">
          <div className="file-info">
            <div className="file-selector">
              <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                {isSelected && <Check size={14} />}
              </div>
              {hasThumbnail ? (
                <div className="file-thumbnail">
                  <img src={file.thumbnail_url} alt={file.filename} />
                  {isHovered && (
                    <div className="play-overlay">
                      <GlassButton variant="secondary" size="sm" className="play-btn">
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </GlassButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="file-icon-wrapper">
                  {getFileIcon(file.filename, 20)}
                </div>
              )}
            </div>

            <div className="file-details">
              <h4 className="file-name">{file.filename}</h4>
              <p className="file-path">{file.path}</p>
            </div>
          </div>

          <div className="file-metadata">
            <div className="metadata-item">
              <span className="label">Resolution</span>
              <span className="value">
                {file.width && file.height ? `${file.width}×${file.height}` : "N/A"}
              </span>
            </div>

            <div className="metadata-item">
              <span className="label">Duration</span>
              <span className="value">{formatDuration(file.duration_secs)}</span>
            </div>

            <div className="metadata-item">
              <span className="label">Size</span>
              <span className="value">{formatSize(file.size_bytes)}</span>
            </div>

            <div className="metadata-item">
              <span className="label">Codecs</span>
              <span className="value">
                {file.video_codec || "?"}/{file.audio_codec || "?"}
              </span>
            </div>

            <div className="metadata-item">
              <span className={`compatibility-badge ${compatConfig.variant}`}>
                {compatConfig.label}
              </span>
            </div>

            <div className="file-actions">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical size={16} />
              </GlassButton>

              {showMenu && (
                <div className="action-menu">
                  <GlassButton variant="secondary" size="sm">
                    <Download size={14} />
                    Download
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm">
                    <Trash2 size={14} />
                    Delete
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Grid view
  return (
    <GlassCard
      className={`media-file-card grid-view ${isSelected ? 'selected' : ''}`}
      variant="interactive"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="grid-card-content">
        <div className="card-media">
          {hasThumbnail ? (
            <div className="media-thumbnail">
              <img src={file.thumbnail_url} alt={file.filename} />
              {isHovered && (
                <div className="media-overlay">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(!isPlaying);
                    }}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </GlassButton>
                </div>
              )}
            </div>
          ) : (
            <div className="media-icon">
              {getFileIcon(file.filename, 48)}
            </div>
          )}

          <div className="selection-indicator">
            <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
              {isSelected && <Check size={14} />}
            </div>
          </div>
        </div>

        <div className="card-info">
          <h4 className="file-name" title={file.filename}>
            {file.filename}
          </h4>

          <div className="file-stats">
            {file.width && file.height && (
              <span className="stat">
                {file.width}×{file.height}
              </span>
            )}

            {file.duration_secs && (
              <span className="stat">
                {formatDuration(file.duration_secs)}
              </span>
            )}

            {file.size_bytes && (
              <span className="stat">
                {formatSize(file.size_bytes)}
              </span>
            )}
          </div>

          <div className="card-footer">
            <span className={`compatibility-badge ${compatConfig.variant}`}>
              {compatConfig.label}
            </span>

            <div className="card-actions">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical size={16} />
              </GlassButton>

              {showMenu && (
                <div className="action-menu">
                  <GlassButton variant="secondary" size="sm">
                    <Download size={14} />
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm">
                    <Trash2 size={14} />
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}