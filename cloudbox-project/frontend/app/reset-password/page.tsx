"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (password.length < 6) return setError("Password must contain at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. Redirecting to sign in...");
      setTimeout(() => router.push("/signin"), 1500);
    } catch (e: any) { setError(e.message || "Unable to update password."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-md">
    <Link href="/" className="text-2xl font-bold text-blue-600">CloudBox</Link>
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <h1 className="text-3xl font-bold">Create a new password</h1>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-slate-300 px-4 py-3"/>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" className="w-full rounded-xl border border-slate-300 px-4 py-3"/>
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Updating..." : "Update Password"}</button>
      </form>
    </div>
  </div></main>;
}
