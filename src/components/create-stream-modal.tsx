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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="glass-surface rounded-2xl max-w-lg w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Create Stream</h2>
          <button
            className="glass-button w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Source File</label>
              <div className="glass-surface rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate flex-1 mr-3">{mediaFile.filename}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    mediaFile.compatibility === "copy"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : mediaFile.compatibility === "transcode"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-red-500/20 text-red-300"
                  }`}>
                    {mediaFile.compatibility}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="stream-name" className="text-sm font-medium text-gray-300">
                Stream Name
              </label>
              <input
                id="stream-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-stream"
                pattern="[a-z0-9-]+"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and dashes only
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile" className="text-sm font-medium text-gray-300">
                Profile
              </label>
              <select
                id="profile"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {compatibleProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-gray-800">
                    {p.name} ({p.protocol.toUpperCase()}, {p.mode})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="glass-surface-red rounded-lg p-4 border border-red-500/30 bg-red-500/10">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              type="button"
              className="glass-button px-6 py-2.5 rounded-lg text-white hover:text-gray-300 transition-all"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-button-green px-6 py-2.5 rounded-lg text-white font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={loading || compatibleProfiles.length === 0}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Stream"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
