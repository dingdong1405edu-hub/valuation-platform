"use client";

import { useEffect, useState } from "react";

type Props = {
  jobId: string;
  initialStatus: string;
  initialProgress: number;
  initialCurrentAgent: string | null;
};

export function JobStatus(props: Props): JSX.Element {
  const [status, setStatus] = useState(props.initialStatus);
  const [progress, setProgress] = useState(props.initialProgress);
  const [currentAgent, setCurrentAgent] = useState<string | null>(props.initialCurrentAgent);

  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${props.jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; progress: number; currentAgent: string | null };
        setStatus(data.status);
        setProgress(data.progress);
        setCurrentAgent(data.currentAgent);
        if (data.status === "done" || data.status === "failed") {
          clearInterval(id);
          window.location.reload();
        }
      } catch {
        // ignore
      }
    }, 4000);
    return () => clearInterval(id);
  }, [props.jobId, status]);

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold">Trạng thái: <span className="font-normal">{status}</span></span>
        <span className="text-sm text-slate-600">{currentAgent ?? "—"}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${status === "failed" ? "bg-red-500" : "bg-blue-600"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">{progress}%</p>
    </section>
  );
}
