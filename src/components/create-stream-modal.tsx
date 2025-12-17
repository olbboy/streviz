// Create stream modal component

import { useState } from "react";
import type { MediaFile, Profile } from "../types";

interface CreateStreamModalProps {
  mediaFile: MediaFile;
  profiles: Profile[];
  onClose: () => void;
  onCreate: (name: string, profileId: string) => Promise<void>;
}

// Generate safe stream name from filename
function generateStreamName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9]/g, "-") // Replace special chars
    .replace(/-+/g, "-") // Remove duplicate dashes
    .toLowerCase()
    .slice(0, 32); // Limit length
}

export function CreateStreamModal({
  mediaFile,
  profiles,
  onClose,
  onCreate,
}: CreateStreamModalProps) {
  const [name, setName] = useState(generateStreamName(mediaFile.filename));
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onCreate(name, profileId);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter profiles based on compatibility
  const compatibleProfiles = profiles.filter((p) => {
    if (mediaFile.compatibility === "copy") {
      return true; // All profiles work
    }
    if (mediaFile.compatibility === "transcode") {
      return p.mode !== "copy"; // Must transcode
    }
    return false; // Unsupported
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Stream</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Source File</label>
              <div className="file-info">
                <span className="filename">{mediaFile.filename}</span>
                <span className="badge badge-{mediaFile.compatibility}">
                  {mediaFile.compatibility}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="stream-name">Stream Name</label>
              <input
                id="stream-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-stream"
                pattern="[a-z0-9-]+"
                required
              />
              <small>Lowercase letters, numbers, and dashes only</small>
            </div>

            <div className="form-group">
              <label htmlFor="profile">Profile</label>
              <select
                id="profile"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                required
              >
                {compatibleProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.protocol.toUpperCase()}, {p.mode})
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || compatibleProfiles.length === 0}
            >
              {loading ? "Creating..." : "Create Stream"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
