// Stream creation workflow component with optimized modal and batch support

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, AlertCircle, Clock, Settings, Film, Radio, Wifi } from "lucide-react";
import { GlassCard } from "../ui/glass-card";
import { GlassButton } from "../ui/glass-button";
import type { MediaFile, Profile } from "../../types";

interface StreamCreationWorkflowProps {
  selectedFiles: MediaFile[];
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

// Get protocol icon
function getProtocolIcon(protocol: string) {
  switch (protocol) {
    case "rtsp": return <Film size={16} />;
    case "rtmp": return <Radio size={16} />;
    case "srt": return <Wifi size={16} />;
    default: return <Radio size={16} />;
  }
}

// Get profile compatibility info
function getProfileCompatibility(profile: Profile, files: MediaFile[]) {
  const compatibleFiles = files.filter(file => {
    if (file.compatibility === "copy") return true;
    if (file.compatibility === "transcode") return profile.mode !== "copy";
    return false;
  });

  const incompatibleFiles = files.filter(file => !compatibleFiles.includes(file));

  return {
    compatibleCount: compatibleFiles.length,
    incompatibleCount: incompatibleFiles.length,
    incompatibleFiles,
    isFullyCompatible: incompatibleFiles.length === 0
  };
}

export function StreamCreationWorkflow({
  selectedFiles,
  profiles,
  onClose,
  onCreate
}: StreamCreationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [streamName, setStreamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;
  const isBatch = selectedFiles.length > 1;

  // Initialize stream name with first file
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const baseName = isBatch
        ? `batch-${Date.now().toString().slice(-6)}`
        : generateStreamName(selectedFiles[0].filename);
      setStreamName(baseName);
    }
  }, [selectedFiles, isBatch]);

  // Auto-select first compatible profile
  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const compatibleProfile = profiles.find(p => {
        return selectedFiles.some(file => {
          if (file.compatibility === "copy") return true;
          return file.compatibility === "transcode" ? p.mode !== "copy" : false;
        });
      });
      setSelectedProfile(compatibleProfile || profiles[0]);
    }
  }, [profiles, selectedProfile, selectedFiles]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!selectedProfile || !streamName) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(streamName, selectedProfile.id);
    } catch (err) {
      setError(String(err));
      setIsCreating(false);
    }
  };

  const canProceed = currentStep === 1 ? selectedFiles.length > 0 :
                    currentStep === 2 ? selectedProfile !== null :
                    streamName.trim() !== "";

  return (
    <div className="stream-creation-workflow">
      <div className="workflow-header">
        <h2 className="workflow-title">
          {isBatch ? `Create ${selectedFiles.length} Streams` : "Create Stream"}
        </h2>
        <div className="workflow-steps">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`step ${step <= currentStep ? "active" : ""} ${
                step < currentStep ? "completed" : ""
              }`}
            >
              <div className="step-number">
                {step < currentStep ? <CheckCircle size={16} /> : step}
              </div>
              <span className="step-label">
                {step === 1 ? "Files" : step === 2 ? "Profile" : "Configure"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow-content">
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Selected Files</h3>
            <div className="selected-files-list">
              {selectedFiles.map((file, index) => (
                <GlassCard key={file.id} className="selected-file-card" variant="subtle">
                  <div className="file-info">
                    <span className="file-number">{index + 1}</span>
                    <div className="file-details">
                      <h4 className="file-name">{file.filename}</h4>
                      <div className="file-metadata">
                        {file.width && file.height && (
                          <span>{file.width}×{file.height}</span>
                        )}
                        {file.duration_secs && (
                          <span>{Math.floor(file.duration_secs / 60)}:{(file.duration_secs % 60).toString().padStart(2, "0")}</span>
                        )}
                        {file.size_bytes && (
                          <span>{(file.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                        )}
                      </div>
                    </div>
                    <div className={`compatibility-badge ${file.compatibility}`}>
                      {file.compatibility === "copy" ? "Direct" : file.compatibility === "transcode" ? "Transcode" : "Unsupported"}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
            <p className="step-description">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected for streaming
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <h3>Choose Streaming Profile</h3>
            <div className="profiles-grid">
              {profiles.map((profile) => {
                const compatibility = getProfileCompatibility(profile, selectedFiles);
                const isSelected = selectedProfile?.id === profile.id;

                return (
                  <GlassCard
                    key={profile.id}
                    className={`profile-card ${isSelected ? "selected" : ""} ${
                      !compatibility.isFullyCompatible ? "has-incompatible" : ""
                    }`}
                    variant={isSelected ? "primary" : "interactive"}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="profile-header">
                      <div className="protocol-info">
                        {getProtocolIcon(profile.protocol)}
                        <span className="protocol">{profile.protocol.toUpperCase()}</span>
                      </div>
                      <div className="mode-badge">{profile.mode.toUpperCase()}</div>
                    </div>

                    <h4 className="profile-name">{profile.name}</h4>

                    <div className="profile-specs">
                      {profile.video_bitrate && (
                        <div className="spec">
                          <span className="label">Video</span>
                          <span className="value">{profile.video_bitrate} kbps</span>
                        </div>
                      )}
                      {profile.audio_bitrate && (
                        <div className="spec">
                          <span className="label">Audio</span>
                          <span className="value">{profile.audio_bitrate} kbps</span>
                        </div>
                      )}
                      {profile.resolution && (
                        <div className="spec">
                          <span className="label">Resolution</span>
                          <span className="value">{profile.resolution}</span>
                        </div>
                      )}
                    </div>

                    <div className="compatibility-info">
                      {compatibility.isFullyCompatible ? (
                        <div className="compatible-files">
                          <CheckCircle size={16} className="icon success" />
                          <span>All {selectedFiles.length} files compatible</span>
                        </div>
                      ) : (
                        <div className="incompatible-files">
                          <AlertCircle size={16} className="icon warning" />
                          <span>
                            {compatibility.compatibleCount} compatible, {compatibility.incompatibleCount} incompatible
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
            {selectedProfile && !getProfileCompatibility(selectedProfile, selectedFiles).isFullyCompatible && (
              <div className="compatibility-warning">
                <AlertCircle size={20} />
                <p>
                  Some selected files are incompatible with this profile and will be skipped.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-content">
            <h3>Stream Configuration</h3>
            <div className="configuration-form">
              <GlassCard className="config-section" variant="subtle">
                <div className="form-group">
                  <label htmlFor="stream-name">Stream Name</label>
                  <input
                    id="stream-name"
                    type="text"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    placeholder="my-stream"
                    pattern="[a-z0-9-]+"
                    required
                    className="stream-name-input"
                  />
                  <small>Lowercase letters, numbers, and dashes only</small>
                </div>

                {isBatch && (
                  <div className="batch-info">
                    <Settings size={20} />
                    <p>
                      This will create {selectedFiles.length} streams with the name pattern:
                      <strong> {streamName}</strong>-[index]
                    </p>
                  </div>
                )}
              </GlassCard>

              {selectedProfile && (
                <GlassCard className="config-summary" variant="subtle">
                  <h4>Stream Summary</h4>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span className="label">Protocol:</span>
                      <span className="value">
                        {getProtocolIcon(selectedProfile.protocol)}
                        {selectedProfile.protocol.toUpperCase()}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Mode:</span>
                      <span className="value">{selectedProfile.mode.toUpperCase()}</span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Profile:</span>
                      <span className="value">{selectedProfile.name}</span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Files:</span>
                      <span className="value">{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <GlassCard className="error-message" variant="error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </GlassCard>
      )}

      <div className="workflow-actions">
        <GlassButton
          variant="secondary"
          onClick={onClose}
          disabled={isCreating}
        >
          Cancel
        </GlassButton>

        <div className="action-buttons">
          {currentStep > 1 && (
            <GlassButton
              variant="secondary"
              onClick={handlePrevious}
              disabled={isCreating}
            >
              Previous
            </GlassButton>
          )}

          {currentStep < totalSteps ? (
            <GlassButton
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed}
            >
              Next
              <ArrowRight size={16} />
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              onClick={handleCreate}
              disabled={!canProceed || isCreating}
              loading={isCreating}
            >
              {isCreating ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Create Stream{isBatch ? "s" : ""}
                </>
              )}
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}