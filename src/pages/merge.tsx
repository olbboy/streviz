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
    <div className="page merge-page">
      <div className="page-header">
        <h1>Merge Files</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate("control-center")}>
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="merge-steps">
        <div className={`step ${step === "select" ? "active" : selectedFiles.length >= 2 ? "done" : ""}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Files</span>
        </div>
        <div className={`step ${step === "configure" ? "active" : step === "preview" || step === "complete" ? "done" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Configure</span>
        </div>
        <div className={`step ${step === "preview" ? "active" : step === "complete" ? "done" : ""}`}>
          <span className="step-number">3</span>
          <span className="step-label">Preview</span>
        </div>
        <div className={`step ${step === "complete" ? "active" : ""}`}>
          <span className="step-number">4</span>
          <span className="step-label">Complete</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="merge-content">
        {step === "select" && (
          <div className="merge-select">
            <div className="select-columns">
              {/* Available Files */}
              <div className="file-column">
                <h3>Available Files ({files.length})</h3>
                <div className="file-list">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`file-item ${selectedFiles.includes(file.id) ? "selected" : ""}`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="file-info">
                        <span className="filename">{file.filename}</span>
                        <span className="file-meta">
                          {file.width}x{file.height} | {file.video_codec} |{" "}
                          {file.duration_secs ? formatDuration(file.duration_secs) : "?"}
                        </span>
                      </div>
                      <span className={`compat-badge ${file.compatibility}`}>
                        {file.compatibility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Files (ordered) */}
              <div className="file-column">
                <h3>Merge Order ({selectedFiles.length})</h3>
                <div className="file-list ordered">
                  {selectedFiles.length === 0 ? (
                    <div className="empty-state">
                      Click files on the left to add them to the merge list
                    </div>
                  ) : (
                    getSelectedFilesData().map((file, index) => (
                      <div key={file.id} className="file-item ordered">
                        <span className="order-number">{index + 1}</span>
                        <div className="file-info">
                          <span className="filename">{file.filename}</span>
                        </div>
                        <div className="order-actions">
                          <button
                            className="btn btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFileUp(index);
                            }}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            className="btn btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFileDown(index);
                            }}
                            disabled={index === selectedFiles.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            className="btn btn-icon remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(file.id);
                            }}
                          >
                            x
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Compatibility Check Result */}
                {checkResult && selectedFiles.length >= 2 && (
                  <div className={`compat-result ${checkResult.strategy}`}>
                    <div className="compat-header">
                      <span className="compat-strategy">
                        Strategy: {checkResult.strategy === "concat_copy" ? "Fast Copy" : "Transcode"}
                      </span>
                      <span className="compat-duration">
                        Total: {formatDuration(checkResult.total_duration_secs)}
                      </span>
                    </div>
                    {checkResult.issues.length > 0 && (
                      <div className="compat-issues">
                        <strong>Compatibility Issues:</strong>
                        <ul>
                          {checkResult.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "configure" && (
          <div className="merge-configure">
            <div className="config-form">
              <div className="form-group">
                <label htmlFor="stream-name">Stream Name</label>
                <input
                  id="stream-name"
                  type="text"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  placeholder="e.g., merged-playlist-1"
                />
                <small>Unique name for the merged stream</small>
              </div>

              <div className="form-group">
                <label htmlFor="profile">Stream Profile</label>
                <select
                  id="profile"
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  <option value="">Select a profile...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.protocol.toUpperCase()})
                    </option>
                  ))}
                </select>
                <small>Determines output protocol and quality settings</small>
              </div>

              {checkResult && (
                <div className="config-summary">
                  <h4>Merge Summary</h4>
                  <div className="summary-row">
                    <span>Files:</span>
                    <span>{checkResult.file_count}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Duration:</span>
                    <span>{formatDuration(checkResult.total_duration_secs)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Strategy:</span>
                    <span className={`strategy-badge ${checkResult.strategy}`}>
                      {checkResult.strategy === "concat_copy"
                        ? "Fast Copy (no transcode)"
                        : "Transcode (slower)"}
                    </span>
                  </div>
                </div>
              )}
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
          <div className="merge-complete">
            <div className="complete-icon">✓</div>
            <h2>Merge Job Created</h2>
            <p>
              Your merge job has been created and is ready to stream.
              {createdJobId && <span className="job-id">Job ID: {createdJobId}</span>}
            </p>
            <div className="complete-actions">
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("control-center")}
              >
                Go to Control Center
              </button>
              <button
                className="btn btn-secondary"
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
        )}
      </div>

      {/* Navigation Buttons */}
      {step !== "complete" && (
        <div className="merge-actions">
          {step !== "select" && (
            <button className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          {step === "preview" ? (
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Merge Job"}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={step === "select" && selectedFiles.length < 2}
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
