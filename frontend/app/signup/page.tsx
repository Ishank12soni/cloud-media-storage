"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ☁
            </div>

            <span className="text-xl font-bold">CloudBox</span>
          </Link>

          <div className="text-sm text-slate-500">
            Already have an account?
            <Link
              href="/signin"
              className="ml-2 font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Signup */}
      <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-6 py-14">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute left-[12%] top-20 text-blue-300">
          • • • •
        </div>

        <div className="pointer-events-none absolute right-[12%] top-32 text-pink-300">
          ◆ ● ■
        </div>

        <div className="pointer-events-none absolute bottom-20 left-[15%] text-yellow-300">
          ● ◆
        </div>

        <div className="pointer-events-none absolute bottom-16 right-[16%] text-blue-300">
          ▲ ●
        </div>

        <div className="w-full max-w-md">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              ☁
            </div>

            <h1 className="text-3xl font-bold">
              Create your CloudBox account
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Securely store, organize and share your files from anywhere.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">
            <form className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>

              {/* Verification */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Security Verification
                </label>

                <button
                  type="button"
                  onClick={() => setVerified(!verified)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded border ${
                      verified
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {verified ? "✓" : ""}
                  </span>

                  <span className="text-sm text-slate-600">
                    {verified
                      ? "Verification completed"
                      : "I'm not a robot"}
                  </span>

                  <span className="ml-auto text-xl">🛡️</span>
                </button>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-500">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-blue-600"
                />

                <span>
                  I agree to the{" "}
                  <span className="font-medium text-blue-600">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-blue-600">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>

              {/* Submit */}
              <button
                type="button"
                className="h-12 w-full rounded-lg bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Create Account
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google */}
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="font-bold text-lg">G</span>
                Continue with Google
              </button>
            </form>
          </div>

          {/* Bottom */}
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Your files are protected using secure cloud storage.
          </p>
        </div>
      </section>
    </main>
  );
}