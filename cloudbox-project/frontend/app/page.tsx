"use client";

import { useState } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-[#0b0f14] text-white"
          : "bg-white text-[#172033]"
      }`}
    >
      {/* NAVBAR */}
      <nav
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
          darkMode
            ? "border-white/10 bg-[#0b0f14]/90"
            : "border-gray-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              ☁
            </div>

            <span className="text-xl font-bold tracking-tight">
              CloudBox
            </span>
          </div>

          {/* NAV LINKS */}
          <div className="hidden items-center gap-10 md:flex">
            <a
              href="#home"
              className="text-sm font-medium transition hover:text-blue-600"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-sm font-medium transition hover:text-blue-600"
            >
              Features
            </a>

            <a
              href="#about"
              className="text-sm font-medium transition hover:text-blue-600"
            >
              About Us
            </a>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            
            {/* LANGUAGE */}
            <button
              className={`hidden text-sm md:block ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              🌐 EN
            </button>

            {/* THEME BUTTON */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                darkMode
                  ? "border-white/20 bg-white/10 hover:bg-white/20"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* SIGN IN */}
            <a
              href="/signin"
              className="hidden text-sm font-medium transition hover:text-blue-600 sm:block"
            >
              Sign in
            </a>

            {/* GET STARTED */}
            <a
              href="/signup"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden"
      >
        {/* Background decorative shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute left-[8%] top-28 h-3 w-3 rotate-12 rounded-sm ${
              darkMode ? "bg-blue-500/50" : "bg-blue-300"
            }`}
          />

          <div
            className={`absolute right-[15%] top-40 h-4 w-4 rotate-45 rounded-md ${
              darkMode ? "bg-purple-500/40" : "bg-purple-200"
            }`}
          />

          <div
            className={`absolute bottom-20 left-[20%] h-4 w-4 rotate-45 rounded-md ${
              darkMode ? "bg-cyan-500/40" : "bg-cyan-200"
            }`}
          />

          <div
            className={`absolute right-[8%] bottom-32 h-3 w-3 rounded-full ${
              darkMode ? "bg-pink-500/40" : "bg-pink-200"
            }`}
          />
        </div>

        <div className="relative mx-auto flex min-h-[650px] max-w-5xl flex-col items-center justify-center px-6 text-center">
          
          {/* BADGE */}
          <div
            className={`mb-7 rounded-full border px-4 py-2 text-xs font-medium ${
              darkMode
                ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                : "border-blue-100 bg-blue-50 text-blue-600"
            }`}
          >
            ✨ CloudBox v1.0 • Secure Media & File Storage
          </div>

          {/* HEADING */}
          <h1
            className={`max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl ${
              darkMode
                ? "text-white"
                : "text-[#182033]"
            }`}
          >
            Secure Cloud Media
            <br />
            Storage for
            <br />

            <span className="text-blue-600">
              Everyone.
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p
            className={`mt-7 max-w-2xl text-base leading-7 sm:text-lg ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Upload, organize, search, share and access your files from anywhere with a simple private cloud storage dashboard.
          </p>

          {/* BUTTONS */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a
              href="/signup"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Get Started for Free →
            </a>

            <a
              href="#features"
              className={`rounded-xl border px-7 py-3.5 text-sm font-semibold transition ${
                darkMode
                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Explore Features
            </a>
          </div>

          {/* FEATURES STRIP */}
          <div
            className={`mt-14 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <span>🔒 Secure Encryption</span>
            <span>⚡ Secure Access</span>
            <span>♢ Easy Sharing</span>
            <span>▣ Access Anywhere</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className={`border-t px-6 py-24 transition-colors ${
          darkMode
            ? "border-white/10 bg-[#0f151d]"
            : "border-gray-100 bg-[#fafbfc]"
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Powerful Features
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything you need for your files
            </h2>

            <p
              className={`mt-4 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              A simple and secure place to store, organize and manage
              your digital files.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            <FeatureCard
              icon="🔐"
              title="Secure Storage"
              text="Keep your important files protected with secure cloud storage."
              darkMode={darkMode}
            />

            <FeatureCard
              icon="📁"
              title="Easy Organization"
              text="Create folders and organize your files exactly the way you want."
              darkMode={darkMode}
            />

            <FeatureCard
              icon="🔗"
              title="Easy Sharing"
              text="Share your files with others whenever you need to."
              darkMode={darkMode}
            />

            <FeatureCard
              icon="☁️"
              title="Access Anywhere"
              text="Access your files from your laptop, phone or any device."
              darkMode={darkMode}
            />

          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="px-6 py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
            About CloudBox
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Your personal cloud, simplified.
          </h2>

          <p
            className={`mx-auto mt-5 max-w-2xl leading-7 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            CloudBox is designed to make storing and managing digital
            media simple, secure and accessible. Upload your files,
            create folders, manage your storage and share content from
            one convenient dashboard.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`border-t px-6 py-8 ${
          darkMode
            ? "border-white/10 bg-[#080c11]"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-blue-600">☁</span>
            CloudBox
          </div>

          <p
            className={`text-sm ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            ©️ 2026 CloudBox. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  darkMode,
}: {
  icon: string;
  title: string;
  text: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-7 transition duration-300 hover:-translate-y-1 ${
        darkMode
          ? "border-white/10 bg-[#151c25] hover:border-blue-500/40"
          : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
      }`}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p
        className={`mt-3 text-sm leading-6 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}