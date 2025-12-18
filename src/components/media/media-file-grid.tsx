// Media file grid component for displaying files in grid or list view

import { useMemo } from "react";
import { FolderTree } from "lucide-react";
import { MediaFileCard } from "./media-file-card";
import type { MediaFile, ViewMode } from "../../types";

interface MediaFileGridProps {
  files: MediaFile[];
  selectedIds: Set<string>;
  onSelect: (fileId: string) => void;
  onMultiSelect: (fileId: string) => void;
  viewMode: ViewMode;
}

export function MediaFileGrid({
  files,
  selectedIds,
  onSelect,
  onMultiSelect,
  viewMode
}: MediaFileGridProps) {
  // Group files by folder for better organization
  const groupedFiles = useMemo(() => {
    const groups: Record<string, MediaFile[]> = {};

    for (const file of files) {
      if (!groups[file.folder]) {
        groups[file.folder] = [];
      }
      groups[file.folder].push(file);
    }

    return Object.entries(groups)
      .map(([folder, folderFiles]) => ({ folder, files: folderFiles }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
  }, [files]);

  if (viewMode === "tree") {
    // Tree view is handled by EnhancedFileTree component
    return (
      <div className="p-8 text-center text-slate-500">
        <FolderTree className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Tree view will be implemented in a future update</p>
        <p className="text-sm mt-2 opacity-75">For now, please use the Enhanced File Tree component</p>
      </div>
    );
  }

  return (
    <div className={`media-file-grid ${viewMode}-view`}>
      {groupedFiles.map((group) => (
        <div key={group.folder} className="media-group">
          {groupedFiles.length > 1 && (
            <div className="group-header">
              <h3 className="group-name">{group.folder}</h3>
              <span className="group-count">{group.files.length} files</span>
            </div>
          )}

          <div className={`files-container ${viewMode}-container`}>
            {group.files.map((file) => (
              <MediaFileCard
                key={file.id}
                file={file}
                isSelected={selectedIds.has(file.id)}
                viewMode={viewMode as "grid" | "list"}
                onSelect={() => onSelect(file.id)}
                onMultiSelect={() => onMultiSelect(file.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {files.length === 0 && (
        <div className="empty-grid">
          <p>No media files found</p>
        </div>
      )}
    </div>
  );
}