"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
   * Full name validation
   *
   * Numbers ARE allowed.
   *
   * Examples:
   * Ishank Verma       -> allowed
   * Ishank12 Verma     -> allowed
   * 123 Ishank         -> allowed
   *
   * Special characters such as @, #, %, etc. are not allowed.
   */
  const isValidName = (name: string) => {
  // Only letters and spaces are allowed.
  const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

  return namePattern.test(name.trim());
};

  const handleNameChange = (value: string) => {
  // Allow the user to type anything.
  // Validation will happen when Create Account is clicked.
  setFullName(value);
  setErrorMessage("");
};

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!isValidName(trimmedName)) {
  setErrorMessage("Numbers are not allowed in name.");
  return;
}

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (!verified) {
      setErrorMessage("Please verify that you are not a robot.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the Terms and Conditions.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        throw error;
      }

      /*
       * If email confirmation is enabled in Supabase,
       * the user needs to verify their email first.
       */
      if (data.user && !data.session) {
        setSuccessMessage(
          "Account created successfully. Please check your email to verify your account."
        );

        setTimeout(() => {
          router.push("/signin");
        }, 2500);

        return;
      }

      /*
       * If email confirmation is disabled,
       * Supabase can log the user in immediately.
       */
      if (data.session) {
        setSuccessMessage("Account created successfully!");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);

        return;
      }

      setSuccessMessage(
        "Account created successfully. Please sign in."
      );

      setTimeout(() => {
        router.push("/signin");
      }, 1500);
    } catch (error: unknown) {
      console.error("SIGN UP ERROR:", error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Something went wrong while creating your account."
        );
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

      {/* Signup Card */}
      <section className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create your account
            </h1>

            <p className="mt-3 text-slate-500">
              Start storing and sharing your files securely.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSignUp}
            className="mt-8 space-y-5"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Letters, numbers, and spaces are allowed.
              </p>
            </div>

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
                  placeholder="Create a password"
                  autoComplete="new-password"
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

              <p className="mt-2 text-xs text-slate-400">
                Minimum 6 characters.
              </p>
            </div>

            {/* Robot Verification */}
            <button
              type="button"
              onClick={() => {
                setVerified((previous) => !previous);
                setErrorMessage("");
              }}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded border ${
                  verified
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {verified ? "✓" : ""}
              </span>

              <span className="text-sm font-medium text-slate-700">
                I&apos;m not a robot
              </span>
            </button>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  setErrorMessage("");
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm leading-6 text-slate-600">
                I agree to the{" "}
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Terms and Conditions
                </button>
                .
              </span>
            </label>

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

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="text-lg font-bold">G</span>
            Continue with Google
          </button>

          {/* Sign In */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>

          {/* Security */}
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Your information is securely protected. By creating an
            account, you agree to our Terms and Conditions.
          </p>
        </div>
      </section>
    </main>
  );
}