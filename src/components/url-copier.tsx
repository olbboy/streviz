// URL Copier component - generates and copies stream URLs

import { useState } from "react";
import type { Stream, StreamAuth } from "../types";

interface UrlCopierProps {
  stream: Stream;
  auth?: StreamAuth;
  wanMode?: boolean;
  publicIp?: string;
}

export function UrlCopier({
  stream,
  auth,
  wanMode = false,
  publicIp,
}: UrlCopierProps) {
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    const host = wanMode ? publicIp || "<YOUR_PUBLIC_IP>" : "localhost";

    if (stream.protocol === "srt") {
      let url = `srt://${host}:8890?streamid=read:${stream.name}&pkt_size=1316`;
      if (auth?.srt_passphrase) {
        url += `&passphrase=${auth.srt_passphrase}&pbkeylen=32`;
      }
      return url;
    } else {
      if (auth) {
        return `rtsp://${auth.username}:${auth.password}@${host}:8554/${stream.name}`;
      }
      return `rtsp://${host}:8554/${stream.name}`;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const url = generateUrl();

  return (
    <div className="url-copier">
      <code className="url-preview">{url}</code>
      <button
        className={`btn btn-copy ${copied ? "copied" : ""}`}
        onClick={copyToClipboard}
      >
        {copied ? "Copied!" : "Copy URL"}
      </button>
    </div>
  );
}
