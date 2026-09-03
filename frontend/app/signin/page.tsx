"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Unable to sign in. Please try again.");
      }

      setSuccessMessage("Signed in successfully!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error: unknown) {
      console.error("SIGN IN ERROR:", error);

      if (error instanceof Error) {
        if (
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          setErrorMessage(
            "Please confirm your email address before signing in."
          );
        } else if (
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          setErrorMessage(
            "Incorrect email or password."
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      {/* Header */}
      <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-blue-600"
        >
          CloudBox
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Sign In */}
      <section className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome Back
            </h1>

            <p className="mt-3 text-slate-500">
              Sign in to access your files and folders.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSignIn}
            className="mt-8 space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-slate-600">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(
                    "Password reset will be added next."
                  );
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-sm text-slate-400">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-lg font-bold">
              G
            </span>

            Continue with Google
          </button>

          {/* Create Account */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create Account
            </Link>
          </p>

          {/* Security */}
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Your login information is securely protected.
          </p>
        </div>
      </section>
    </main>
  );
}