// Onboarding wizard for first-time users

import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Profile } from "../types";

interface OnboardingProps {
  profiles: Profile[];
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to C-Video",
    content:
      "Stream your video files to any device on your network using RTSP, SRT, or RTMP protocols.",
  },
  {
    id: "folders",
    title: "Add Media Folders",
    content:
      "Select folders containing your video files. We'll scan them for compatible media.",
  },
  {
    id: "profile",
    title: "Choose Default Profile",
    content:
      "Select a streaming profile that matches your use case. You can always change this later.",
  },
  {
    id: "network",
    title: "Network Mode",
    content:
      "Are you streaming on a local network (LAN) or over the internet (WAN)?",
  },
  {
    id: "complete",
    title: "All Set!",
    content:
      "You're ready to start streaming. Add files to your library and create streams from the Control Center.",
  },
];

type NetworkMode = "lan" | "wan";

export function Onboarding({ profiles, onComplete }: OnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [scannedFolders, setScannedFolders] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [networkMode, setNetworkMode] = useState<NetworkMode>("lan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleAddFolder = useCallback(async () => {
    try {
      setError(null);
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Media Folder",
      });

      if (selected && typeof selected === "string") {
        setLoading(true);
        await invoke("scan_folder", { folderPath: selected });
        setScannedFolders((prev) => [...prev, selected]);
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to add folder:", e);
      setError("Failed to scan folder. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      return;
    }
    setStepIndex((prev) => prev + 1);
  }, [isLastStep]);

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      return;
    }
    setStepIndex((prev) => prev - 1);
  }, [isFirstStep]);

  const handleFinish = useCallback(async () => {
    try {
      setLoading(true);
      // Save preferences if needed
      if (selectedProfile) {
        // Could save default profile preference
      }
      // Mark onboarding as complete
      await invoke("complete_onboarding");
      onComplete();
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
      setLoading(false);
    }
  }, [selectedProfile, onComplete]);

  const handleSkip = useCallback(async () => {
    try {
      await invoke("complete_onboarding");
      onComplete();
    } catch (e) {
      console.error("Failed to skip onboarding:", e);
    }
  }, [onComplete]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep.id) {
      case "folders":
        return true; // Optional to add folders
      case "profile":
        return true; // Optional to select profile
      case "network":
        return true; // Default selected
      default:
        return true;
    }
  }, [currentStep.id]);

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        {/* Error display */}
        {error && (
          <div className="onboarding-error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">x</button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="onboarding-progress">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`progress-dot ${
                index < stepIndex
                  ? "completed"
                  : index === stepIndex
                  ? "active"
                  : ""
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="onboarding-content">
          <h1>{currentStep.title}</h1>
          <p className="onboarding-description">{currentStep.content}</p>

          {/* Step-specific actions */}
          {currentStep.id === "welcome" && (
            <div className="step-welcome">
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">V</span>
                  <span>Stream any H.264/H.265 video</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">S</span>
                  <span>Support for 50+ concurrent streams</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">G</span>
                  <span>GPU acceleration with NVENC</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">N</span>
                  <span>SRT encryption for WAN streaming</span>
                </div>
              </div>
            </div>
          )}

          {currentStep.id === "folders" && (
            <div className="step-folders">
              <button
                className="btn btn-primary add-folder-btn"
                onClick={handleAddFolder}
                disabled={loading}
              >
                {loading ? "Scanning..." : "Add Folder"}
              </button>

              {scannedFolders.length > 0 && (
                <div className="scanned-folders">
                  <h4>Added Folders:</h4>
                  <ul>
                    {scannedFolders.map((folder, i) => (
                      <li key={i}>{folder}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="step-note">
                You can add more folders later from the Library page.
              </p>
            </div>
          )}

          {currentStep.id === "profile" && (
            <div className="step-profile">
              <div className="profile-options">
                {profiles.map((profile) => (
                  <label
                    key={profile.id}
                    className={`profile-option ${
                      selectedProfile === profile.id ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={profile.id}
                      checked={selectedProfile === profile.id}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                    />
                    <div className="profile-info">
                      <span className="profile-name">{profile.name}</span>
                      <span className="profile-details">
                        {profile.protocol.toUpperCase()} | {profile.mode}
                        {profile.resolution && ` | ${profile.resolution}`}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <p className="step-note">
                Profiles can be changed per-stream in the Control Center.
              </p>
            </div>
          )}

          {currentStep.id === "network" && (
            <div className="step-network">
              <div className="network-options">
                <label
                  className={`network-option ${
                    networkMode === "lan" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="network"
                    value="lan"
                    checked={networkMode === "lan"}
                    onChange={() => setNetworkMode("lan")}
                  />
                  <div className="network-info">
                    <span className="network-title">Local Network (LAN)</span>
                    <span className="network-desc">
                      Streaming within your home or office network. Lower latency,
                      no encryption needed.
                    </span>
                  </div>
                </label>

                <label
                  className={`network-option ${
                    networkMode === "wan" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="network"
                    value="wan"
                    checked={networkMode === "wan"}
                    onChange={() => setNetworkMode("wan")}
                  />
                  <div className="network-info">
                    <span className="network-title">Internet (WAN)</span>
                    <span className="network-desc">
                      Streaming over the internet. Uses SRT with encryption for
                      security.
                    </span>
                  </div>
                </label>
              </div>

              <p className="step-note">
                {networkMode === "wan"
                  ? "WAN mode enables SRT encryption. You may need to configure port forwarding."
                  : "LAN mode uses RTSP for simplicity and lowest latency. RTMP is also available for streaming to platforms like YouTube or Twitch."}
              </p>
            </div>
          )}

          {currentStep.id === "complete" && (
            <div className="step-complete">
              <div className="complete-icon">C</div>
              <div className="quick-tips">
                <h4>Quick Tips:</h4>
                <ul>
                  <li>
                    Press <kbd>Cmd/Ctrl</kbd> + <kbd>N</kbd> to create a new
                    stream
                  </li>
                  <li>
                    Press <kbd>?</kbd> to see all keyboard shortcuts
                  </li>
                  <li>Use the Control Center to manage your streams</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="onboarding-actions">
          <button className="btn btn-ghost skip-btn" onClick={handleSkip}>
            Skip Setup
          </button>

          <div className="nav-buttons">
            {!isFirstStep && (
              <button className="btn btn-secondary" onClick={handleBack}>
                Back
              </button>
            )}

            {isLastStep ? (
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? "Finishing..." : "Get Started"}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {currentStep.id === "welcome" ? "Let's Go" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
