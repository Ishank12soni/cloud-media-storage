"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (!email.trim()) return setError("Enter your email address.");
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage("If an account exists for this email, a password reset email has been sent.");
    } catch (e: any) { setError(e.message || "Unable to send reset email."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-md">
    <Link href="/" className="text-2xl font-bold text-blue-600">CloudBox</Link>
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <h1 className="text-3xl font-bold">Reset your password</h1><p className="mt-2 text-slate-500">We'll send a secure reset link to your email.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"/>
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Sending..." : "Send Reset Link"}</button>
      </form>
      <Link href="/signin" className="mt-6 block text-center text-sm font-semibold text-blue-600">Back to Sign In</Link>
    </div>
  </div></main>;
}
