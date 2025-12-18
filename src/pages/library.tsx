// Library page - browse and manage media files with glassmorphism design

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./library.css";
import { Plus, FolderOpen, X, Film, Music, Image, File } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { MediaFileGrid } from "../components/media/media-file-grid";
import { EnhancedFileTree } from "../components/media/enhanced-file-tree";
import { StreamCreationWorkflow } from "../components/media/stream-creation-workflow";
import { MediaSearchBar } from "../components/media/media-search-bar";
import { ViewToggle } from "../components/media/view-toggle";
import { useScanner, useStreams, useProfiles } from "../hooks/use-api";
import type { ViewMode } from "../types";

export function LibraryPage() {
  const navigate = useNavigate();
  const { files, loading: scanLoading, scan, loadAll } = useScanner();
  const { create: createStream, createBatch } = useStreams();
  const { profiles, loadAll: loadProfiles } = useProfiles();

  // UI State
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scanPath, setScanPath] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAll();
    loadProfiles();
  }, [loadAll, loadProfiles]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(file => {
        const ext = file.filename.split('.').pop()?.toLowerCase();
        if (filterType === "video") return ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"].includes(ext || "");
        if (filterType === "audio") return ["mp3", "wav", "flac", "aac", "ogg", "wma"].includes(ext || "");
        if (filterType === "image") return ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(ext || "");
        return true;
      });
    }

    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.filename.localeCompare(b.filename);
        case "date":
          return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
        case "size":
          return (b.size_bytes || 0) - (a.size_bytes || 0);
        case "duration":
          return (b.duration_secs || 0) - (a.duration_secs || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [files, searchQuery, filterType, sortBy]);

  // Handle file selection
  const handleFileSelect = (fileId: string, multiSelect = false) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (multiSelect) {
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
      } else {
        newSet.clear();
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Handle file selection for stream creation
  const handleCreateStream = async (name: string, profileId: string) => {
    if (selectedFiles.size === 0) return;

    try {
      if (selectedFiles.size === 1) {
        // Single file stream creation
        const fileId = Array.from(selectedFiles)[0];
        await createStream(fileId, name, profileId);
      } else {
        // Batch stream creation
        await createBatch(Array.from(selectedFiles), name, profileId);
      }

      setShowCreateModal(false);
      setSelectedFiles(new Set());
      navigate("/control-center");
    } catch (err) {
      console.error("Stream creation error:", err);
    }
  };

  // Handle folder scan
  const handleScan = async () => {
    if (!scanPath) return;
    try {
      await scan(scanPath);
      setScanPath("");
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Handle dropped files (would need to implement file upload logic)
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log("Dropped files:", droppedFiles);
  };

  // Statistics
  const stats = useMemo(() => ({
    total: files.length,
    videos: files.filter(f => ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"].includes(f.filename.split('.').pop()?.toLowerCase() || "")).length,
    audio: files.filter(f => ["mp3", "wav", "flac", "aac", "ogg", "wma"].includes(f.filename.split('.').pop()?.toLowerCase() || "")).length,
    images: files.filter(f => ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"].includes(f.filename.split('.').pop()?.toLowerCase() || "")).length,
  }), [files]);

  return (
    <div className="page library-page">
      {/* Header with stats */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Media Library</h1>
            <div className="media-stats">
              <span className="stat-item">
                <Film size={16} className="stat-icon" />
                <span>{stats.videos}</span>
              </span>
              <span className="stat-item">
                <Music size={16} className="stat-icon" />
                <span>{stats.audio}</span>
              </span>
              <span className="stat-item">
                <Image size={16} className="stat-icon" />
                <span>{stats.images}</span>
              </span>
              <span className="stat-item total">
                <File size={16} className="stat-icon" />
                <span>{stats.total} total</span>
              </span>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => navigate("/control-center")}
            className="control-center-btn"
          >
            Control Center →
          </Button>
        </div>
      </div>

      {/* Scan Section */}
      <Card className="scan-section surface">
        <div className="scan-content">
          <div className="scan-input-group">
            <div className="scan-input-wrapper">
              <FolderOpen size={20} className="scan-icon" />
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="/path/to/media/folder"
                className="scan-input"
              />
              <Button
                variant="default"
                onClick={handleScan}
                disabled={scanLoading || !scanPath}
              >
                {scanLoading ? "Scanning..." : "Scan Folder"}
              </Button>
            </div>
            <small className="scan-hint">
              Scan up to 2 levels deep for media files (MP4, AVI, MKV, MOV, MP3, WAV, etc.)
            </small>
          </div>
        </div>
      </Card>

      {/* Search and Filter Bar */}
      <Card className="search-filter-section surface">
        <MediaSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </Card>

      {/* View Controls */}
      <div className="view-controls">
        <div className="view-left">
          {selectedFiles.size > 0 && (
            <div className="selection-info">
              <span className="selection-count">{selectedFiles.size} selected</span>
              <Button
                variant="default"
                onClick={() => setShowCreateModal(true)}
                className="create-stream-btn"
              >
                <Plus size={16} />
                Create Stream{selectedFiles.size > 1 ? "s" : ""}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedFiles(new Set())}
                className="clear-selection-btn"
              >
                <X size={16} />
                Clear
              </Button>
            </div>
          )}
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Main Content */}
      <div
        className={`library-content scrollbar-enhanced ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {filteredAndSortedFiles.length === 0 ? (
          <Card className="empty-state surface hover-directional">
            <div className="empty-content">
              <div className="empty-icon">
                <FolderOpen size={48} />
              </div>
              <h3>No media files found</h3>
              <p>
                {files.length === 0
                  ? "Use the scan button above to add media folders."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {isDragging && (
                <p className="drag-message">
                  Drop files here to add them to your library
                </p>
              )}
            </div>
          </Card>
        ) : viewMode === "tree" ? (
          <EnhancedFileTree
            files={filteredAndSortedFiles}
            selectedIds={selectedFiles}
            onSelect={handleFileSelect}
            onMultiSelect={(fileId) => handleFileSelect(fileId, true)}
          />
        ) : (
          <MediaFileGrid
            files={filteredAndSortedFiles}
            selectedIds={selectedFiles}
            onSelect={handleFileSelect}
            onMultiSelect={(fileId) => handleFileSelect(fileId, true)}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Drag Overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-message">
            <FolderOpen size={48} />
            <h3>Drop files to add to library</h3>
          </div>
        </div>
      )}

      {/* Stream Creation Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={() => setShowCreateModal(false)}>
        <DialogContent className="max-w-2xl">
          <StreamCreationWorkflow
            selectedFiles={Array.from(selectedFiles).map(id =>
              files.find(f => f.id === id)!
            ).filter(Boolean)}
            profiles={profiles}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateStream}
          />
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}