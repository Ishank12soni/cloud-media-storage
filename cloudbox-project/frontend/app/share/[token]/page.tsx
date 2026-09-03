
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type Item = { id: string; name: string; original_name?: string; size_bytes?: number; mime_type?: string; passwordProtected?: boolean };

function bytes(value = 0) {
  if (!value) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(Math.floor(Math.log(value)/Math.log(1024)), units.length-1);
  return `${(value/Math.pow(1024,i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export default function PublicSharePage() {
  const params = useParams<{token:string}>();
  const token = params.token;
  const [item, setItem] = useState<Item | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/public/${token}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Share link unavailable");
        setItem(data.item);
        setPasswordRequired(Boolean(data.item?.passwordProtected));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function download() {
    setError(""); setDownloading(true);
    try {
      const response = await fetch(`${API_URL}/api/public/${token}/download`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ password: password || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Download failed");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) { setError(e.message); }
    finally { setDownloading(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
    <div className="mx-auto max-w-lg">
      <div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">☁</div><h1 className="mt-4 text-2xl font-bold">CloudBox Shared File</h1><p className="mt-1 text-sm text-slate-500">A secure file shared with you.</p></div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        {loading ? <div className="py-12 text-center text-slate-500">Loading share...</div> :
         error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> :
         item ? <><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">📄</div><div className="min-w-0"><h2 className="truncate text-xl font-semibold">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{bytes(Number(item.size_bytes || 0))}</p></div></div>
          {passwordRequired && <div className="mt-6"><label className="text-sm font-medium">Share password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"/></div>}
          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button onClick={download} disabled={downloading} className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{downloading ? "Preparing download..." : "Download File"}</button>
         </> : null}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">CloudBox • Private cloud media storage</p>
    </div>
  </main>;
}
