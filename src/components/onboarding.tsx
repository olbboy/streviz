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
    title: "Welcome to Streviz",
    content:
      "Professional multi-stream video broadcasting with hardware acceleration support for LAN and WAN streaming.",
  },
  {
    id: "folders",
    title: "Add Media Folders",
    content:
      "Select folders containing your video files. We'll scan them for compatible media and analyze codec support.",
  },
  {
    id: "profile",
    title: "Choose Default Profile",
    content:
      "Select a streaming profile that matches your use case. You can always change this later for individual streams.",
  },
  {
    id: "network",
    title: "Network Configuration",
    content:
      "Configure your streaming network mode for optimal performance and security.",
  },
  {
    id: "complete",
    title: "Ready to Broadcast",
    content:
      "Your professional streaming setup is complete. Start broadcasting with confidence using Streviz.",
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="glass-surface rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Error display */}
        {error && (
          <div className="glass-surface-red rounded-xl p-4 mb-6 flex items-center justify-between animate-fade-in" role="alert">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
            <button
              className="text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  index < stepIndex
                    ? "bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300"
                    : index === stepIndex
                    ? "bg-blue-500/20 border-2 border-blue-400 text-blue-300"
                    : "bg-white/5 border-2 border-gray-600 text-gray-500"
                }`}>
                  {index < stepIndex ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < stepIndex ? "bg-emerald-400" : "bg-gray-600"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8 overflow-y-auto max-h-[50vh] custom-scrollbar">
          <h1 className="text-3xl font-bold text-white mb-4">{currentStep.title}</h1>
          <p className="text-lg text-gray-300 mb-8">{currentStep.content}</p>

          {/* Step-specific actions */}
          {currentStep.id === "welcome" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-surface rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Multi-Stream Support</h3>
                <p className="text-gray-400 text-sm">Broadcast 50+ concurrent video streams with independent process management</p>
              </div>

              <div className="glass-surface rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">GPU Acceleration</h3>
                <p className="text-gray-400 text-sm">NVIDIA NVENC support with automatic fallback to CPU encoding</p>
              </div>

              <div className="glass-surface rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Multi-Protocol</h3>
                <p className="text-gray-400 text-sm">RTSP for LAN, SRT for WAN, RTMP for platform streaming</p>
              </div>

              <div className="glass-surface rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Streaming</h3>
                <p className="text-gray-400 text-sm">SRT encryption and authentication for secure WAN broadcasting</p>
              </div>
            </div>
          )}

          {currentStep.id === "folders" && (
            <div className="space-y-6">
              <button
                className="glass-button-green w-full py-4 rounded-xl text-white font-semibold text-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                onClick={handleAddFolder}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Add Media Folder
                  </>
                )}
              </button>

              {scannedFolders.length > 0 && (
                <div className="glass-surface rounded-xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Added Folders
                  </h4>
                  <div className="space-y-2">
                    {scannedFolders.map((folder, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-gray-300 text-sm font-mono">{folder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-surface rounded-xl p-4 border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-amber-300 text-sm">
                    You can add more folders later from the Library page. We support H.264/H.265 videos with various container formats.
                  </p>
                </div>
              </div>
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
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            className="glass-button px-6 py-2.5 rounded-lg text-gray-400 hover:text-white transition-colors"
            onClick={handleSkip}
          >
            Skip Setup
          </button>

          <div className="flex items-center gap-4">
            {!isFirstStep && (
              <button
                className="glass-button px-6 py-2.5 rounded-lg text-white hover:text-gray-300 transition-all"
                onClick={handleBack}
              >
                Back
              </button>
            )}

            {isLastStep ? (
              <button
                className="glass-button-green px-8 py-2.5 rounded-lg text-white font-semibold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Finishing...
                  </>
                ) : (
                  <>
                    Start Broadcasting
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                className="glass-button-green px-8 py-2.5 rounded-lg text-white font-semibold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {currentStep.id === "welcome" ? "Let's Start" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
