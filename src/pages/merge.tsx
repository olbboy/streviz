// Merge page - wizard for merging multiple files into a single stream

import { useState, useEffect } from "react";
import { useScanner, useProfiles, useMerge } from "../hooks/use-api";
import { MergePreview } from "../components/merge-preview";
import type { MediaFile } from "../types";

interface MergePageProps {
  onNavigate: (page: string) => void;
}

type MergeStep = "select" | "configure" | "preview" | "complete";

export function MergePage({ onNavigate }: MergePageProps) {
  const { files, loadAll: loadFiles } = useScanner();
  const { profiles, loadAll: loadProfiles } = useProfiles();
  const { checkResult, loading, checkFiles, createJob } = useMerge();

  const [step, setStep] = useState<MergeStep>("select");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [streamName, setStreamName] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadFiles();
    loadProfiles();
  }, [loadFiles, loadProfiles]);

  // Auto-check compatibility when selection changes
  useEffect(() => {
    if (selectedFiles.length >= 2) {
      checkFiles(selectedFiles).catch((e) => setError(String(e)));
    }
  }, [selectedFiles, checkFiles]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    setSelectedFiles((prev) => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList;
    });
  };

  const moveFileDown = (index: number) => {
    if (index === selectedFiles.length - 1) return;
    setSelectedFiles((prev) => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList;
    });
  };

  const handleNext = () => {
    if (step === "select") {
      if (selectedFiles.length < 2) {
        setError("Select at least 2 files to merge");
        return;
      }
      setStep("configure");
    } else if (step === "configure") {
      if (!streamName.trim()) {
        setError("Enter a stream name");
        return;
      }
      if (!selectedProfile) {
        setError("Select a profile");
        return;
      }
      setStep("preview");
    }
    setError(null);
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("select");
    } else if (step === "preview") {
      setStep("configure");
    }
    setError(null);
  };

  const handleCreate = async () => {
    try {
      setError(null);
      const job = await createJob(selectedFiles, streamName, selectedProfile);
      setCreatedJobId(job.id);
      setStep("complete");
    } catch (e) {
      setError(String(e));
    }
  };

  const getSelectedFilesData = (): MediaFile[] => {
    return selectedFiles
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is MediaFile => f !== undefined);
  };

  const formatDuration = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Merge Files</h1>
            <p className="text-gray-400">Combine multiple media files into a single stream</p>
          </div>
          <button
            className="glass-button px-6 py-2 rounded-lg text-white hover:text-blue-400 transition-colors"
            onClick={() => onNavigate("control-center")}
          >
            Back
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="glass-surface-red rounded-lg p-4 mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
            <button
              className="text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setError(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-8">
            {[
              { key: "select", label: "Select Files" },
              { key: "configure", label: "Configure" },
              { key: "preview", label: "Preview" },
              { key: "complete", label: "Complete" }
            ].map((item, index) => {
              const isActive = step === item.key;
              const isDone = (item.key === "select" && selectedFiles.length >= 2) ||
                           (item.key === "configure" && (step === "preview" || step === "complete")) ||
                           (item.key === "preview" && step === "complete");

              return (
                <div key={item.key} className="flex items-center">
                  <div className={`flex flex-col items-center ${isActive ? "text-blue-400" : isDone ? "text-emerald-400" : "text-gray-500"}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 font-semibold transition-all ${
                      isActive
                        ? "bg-blue-500/20 border-2 border-blue-400"
                        : isDone
                        ? "bg-emerald-500/20 border-2 border-emerald-400"
                        : "bg-white/5 border-2 border-gray-600"
                    }`}>
                      {isDone ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isDone ? "bg-emerald-400" : "bg-gray-600"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto">
        {step === "select" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Files */}
            <div className="glass-surface rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Available Files</h3>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                  {files.length}
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`glass-hover p-4 rounded-lg cursor-pointer transition-all border ${
                      selectedFiles.includes(file.id)
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.filename}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {file.width}x{file.height} • {file.video_codec} •{" "}
                          {file.duration_secs ? formatDuration(file.duration_secs) : "?"}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        file.compatibility === "copy"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : file.compatibility === "transcode"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {file.compatibility}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Files (ordered) */}
            <div className="glass-surface rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Merge Order</h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                  {selectedFiles.length}
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {selectedFiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Click files on the left to add them to the merge list</p>
                  </div>
                ) : (
                  getSelectedFilesData().map((file, index) => (
                    <div key={file.id} className="glass-surface p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.filename}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="w-8 h-8 rounded glass-button flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFileUp(index);
                            }}
                            disabled={index === 0}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            className="w-8 h-8 rounded glass-button flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFileDown(index);
                            }}
                            disabled={index === selectedFiles.length - 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            className="w-8 h-8 rounded glass-button-red flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(file.id);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Compatibility Check Result */}
              {checkResult && selectedFiles.length >= 2 && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  checkResult.strategy === "concat_copy"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        checkResult.strategy === "concat_copy" ? "bg-emerald-400" : "bg-amber-400"
                      }`} />
                      <span className="text-white font-medium">
                        Strategy: {checkResult.strategy === "concat_copy" ? "Fast Copy" : "Transcode"}
                      </span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Total: {formatDuration(checkResult.total_duration_secs)}
                    </span>
                  </div>
                  {checkResult.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-amber-400 text-sm font-medium">Compatibility Issues:</p>
                      <ul className="text-amber-300 text-sm space-y-1 ml-4">
                        {checkResult.issues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "configure" && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-surface rounded-2xl p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Configure Stream</h2>
                  <p className="text-gray-400">Set up your merged stream properties</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="stream-name" className="text-sm font-medium text-gray-300">
                    Stream Name
                  </label>
                  <input
                    id="stream-name"
                    type="text"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    placeholder="e.g., merged-playlist-1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    Unique name for the merged stream
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="profile" className="text-sm font-medium text-gray-300">
                    Stream Profile
                  </label>
                  <select
                    id="profile"
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" className="bg-gray-800">Select a profile...</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id} className="bg-gray-800">
                        {p.name} ({p.protocol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Determines output protocol and quality settings
                  </p>
                </div>

                {checkResult && (
                  <div className="glass-surface rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Merge Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">Files</p>
                        <p className="text-white font-medium text-lg">{checkResult.file_count}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">Total Duration</p>
                        <p className="text-white font-medium text-lg">{formatDuration(checkResult.total_duration_secs)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">Strategy</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          checkResult.strategy === "concat_copy"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {checkResult.strategy === "concat_copy"
                            ? "Fast Copy"
                            : "Transcode"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <MergePreview
            files={getSelectedFilesData()}
            checkResult={checkResult}
            streamName={streamName}
            profile={profiles.find((p) => p.id === selectedProfile)}
          />
        )}

        {step === "complete" && (
          <div className="max-w-2xl mx-auto">
            <div className="glass-surface rounded-2xl p-8 text-center animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Merge Job Created</h2>
              <p className="text-gray-400 mb-6">
                Your merge job has been created and is ready to stream.
                {createdJobId && (
                  <span className="block mt-2 text-sm text-blue-400">Job ID: {createdJobId}</span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="glass-button-green px-6 py-3 rounded-lg text-white font-medium hover:scale-105 active:scale-95 transition-all"
                  onClick={() => onNavigate("control-center")}
                >
                  Go to Control Center
                </button>
                <button
                  className="glass-button px-6 py-3 rounded-lg text-white hover:text-blue-400 transition-all"
                  onClick={() => {
                    setStep("select");
                    setSelectedFiles([]);
                    setStreamName("");
                    setSelectedProfile("");
                    setCreatedJobId(null);
                  }}
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step !== "complete" && (
        <div className="fixed bottom-6 left-0 right-0 p-6 flex justify-center">
          <div className="glass-surface rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
            {step !== "select" && (
              <button
                className="glass-button px-6 py-2.5 rounded-lg text-white hover:text-gray-300 transition-all"
                onClick={handleBack}
              >
                Back
              </button>
            )}
            {step === "preview" ? (
              <button
                className="glass-button-green px-8 py-2.5 rounded-lg text-white font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Merge Job"
                )}
              </button>
            ) : (
              <button
                className="glass-button-green px-8 py-2.5 rounded-lg text-white font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                onClick={handleNext}
                disabled={step === "select" && selectedFiles.length < 2}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
