// Media tree component - displays files grouped by folder

import type { MediaFile, MediaGroup } from "../types";

interface MediaTreeProps {
  files: MediaFile[];
  selectedId: string | null;
  onSelect: (file: MediaFile) => void;
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

// Compatibility badge
function CompatibilityBadge({ compat }: { compat: string }) {
  const colors: Record<string, string> = {
    copy: "badge-copy",
    transcode: "badge-transcode",
    unsupported: "badge-unsupported",
  };
  return <span className={`badge ${colors[compat] || ""}`}>{compat}</span>;
}

export function MediaTree({ files, selectedId, onSelect }: MediaTreeProps) {
  const groups = groupByFolder(files);

  if (files.length === 0) {
    return (
      <div className="media-tree-empty">
        <p>No media files scanned yet.</p>
        <p>Use the scan button to add a folder.</p>
      </div>
    );
  }

  return (
    <div className="media-tree">
      {groups.map((group) => (
        <div key={group.folder} className="media-group">
          <div className="media-group-header">
            <span className="folder-icon">📁</span>
            <span className="folder-name">{group.folder}</span>
            <span className="file-count">({group.files.length})</span>
          </div>
          <div className="media-group-files">
            {group.files.map((file) => (
              <div
                key={file.id}
                className={`media-file ${selectedId === file.id ? "selected" : ""}`}
                onClick={() => onSelect(file)}
              >
                <div className="media-file-main">
                  <span className="file-icon">🎬</span>
                  <span className="filename">{file.filename}</span>
                </div>
                <div className="media-file-meta">
                  <span className="codec">
                    {file.video_codec || "?"}/{file.audio_codec || "?"}
                  </span>
                  <span className="resolution">
                    {file.width && file.height ? `${file.width}x${file.height}` : "?"}
                  </span>
                  <span className="duration">{formatDuration(file.duration_secs)}</span>
                  <CompatibilityBadge compat={file.compatibility} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
