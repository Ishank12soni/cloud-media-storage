"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <main className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
              C
            </div>

            <span className="text-xl font-bold tracking-tight">
              CloudBox
            </span>
          </Link>

          {/* Back to Home */}
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Sign In Section */}
      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950">
              ☁️
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to access your CloudBox files
            </p>
          </div>

          {/* Sign In Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg dark:border-gray-800 dark:bg-gray-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-black dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-950"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-black dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-950"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>

              <span className="text-sm text-gray-500">OR</span>

              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              <span className="text-lg font-bold">G</span>
              Continue with Google
            </button>

            {/* Sign Up */}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Security Text */}
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
            Your files are protected with secure cloud storage.
          </p>
        </div>
      </section>
    </main>
  );
}