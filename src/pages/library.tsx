// Library page - browse and manage media files

import { useState, useEffect } from "react";
import { MediaTree } from "../components/media-tree";
import { CreateStreamModal } from "../components/create-stream-modal";
import { useScanner, useStreams, useProfiles } from "../hooks/use-api";
import type { MediaFile } from "../types";

interface LibraryPageProps {
  onNavigate: (page: string) => void;
}

export function LibraryPage({ onNavigate }: LibraryPageProps) {
  const { files, loading: scanLoading, scan, loadAll } = useScanner();
  const { create: createStream } = useStreams();
  const { profiles, loadAll: loadProfiles } = useProfiles();

  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scanPath, setScanPath] = useState("");

  // Load data on mount
  useEffect(() => {
    loadAll();
    loadProfiles();
  }, [loadAll, loadProfiles]);

  const handleScan = async () => {
    if (!scanPath) return;
    try {
      await scan(scanPath);
      setScanPath("");
    } catch (err) {
      alert(`Scan error: ${err}`);
    }
  };

  const handleCreateStream = async (name: string, profileId: string) => {
    if (!selectedFile) return;
    await createStream(selectedFile.id, name, profileId);
    setShowCreateModal(false);
    onNavigate("control-center");
  };

  return (
    <div className="page library-page">
      <div className="page-header">
        <h1>Media Library</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => onNavigate("control-center")}>
            Control Center →
          </button>
        </div>
      </div>

      <div className="scan-section">
        <div className="scan-input">
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="/path/to/media/folder"
          />
          <button
            className="btn btn-secondary"
            onClick={handleScan}
            disabled={scanLoading || !scanPath}
          >
            {scanLoading ? "Scanning..." : "Scan Folder"}
          </button>
        </div>
        <small>Enter a folder path to scan for media files (2-level deep)</small>
      </div>

      <div className="library-content">
        <div className="media-list">
          <MediaTree
            files={files}
            selectedId={selectedFile?.id || null}
            onSelect={setSelectedFile}
          />
        </div>

        {selectedFile && (
          <div className="media-details">
            <h2>File Details</h2>
            <div className="details-grid">
              <div className="detail-row">
                <span className="label">Filename:</span>
                <span className="value">{selectedFile.filename}</span>
              </div>
              <div className="detail-row">
                <span className="label">Path:</span>
                <span className="value path">{selectedFile.path}</span>
              </div>
              <div className="detail-row">
                <span className="label">Video Codec:</span>
                <span className="value">{selectedFile.video_codec || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="label">Audio Codec:</span>
                <span className="value">{selectedFile.audio_codec || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="label">Resolution:</span>
                <span className="value">
                  {selectedFile.width && selectedFile.height
                    ? `${selectedFile.width}x${selectedFile.height}`
                    : "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Compatibility:</span>
                <span className={`badge badge-${selectedFile.compatibility}`}>
                  {selectedFile.compatibility}
                </span>
              </div>
            </div>
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                disabled={selectedFile.compatibility === "unsupported"}
              >
                Create Stream
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && selectedFile && (
        <CreateStreamModal
          mediaFile={selectedFile}
          profiles={profiles}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStream}
        />
      )}
    </div>
  );
}
