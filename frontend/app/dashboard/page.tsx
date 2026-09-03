"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signin");
        return;
      }

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "User";

      setUserName(fullName);
      setUserEmail(user.email || "");
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* HEADER */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-10">

        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            C
          </div>

          <span className="text-2xl font-bold tracking-tight">
            CloudBox
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-gray-900">
              {userName}
            </p>
            <p className="text-xs text-gray-500">
              {userEmail}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition"
          >
            Logout
          </button>

        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex min-h-[calc(100vh-80px)]">

        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col p-5">

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition mb-6"
          >
            + New
          </button>

          <nav className="space-y-1">

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-semibold text-left">
              <span>🏠</span>
              My Drive
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 text-left">
              <span>🕘</span>
              Recent
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 text-left">
              <span>⭐</span>
              Starred
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 text-left">
              <span>👥</span>
              Shared with me
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 text-left">
              <span>🗑️</span>
              Trash
            </button>

          </nav>

          {/* STORAGE */}
          <div className="mt-auto">

            <div className="border-t border-gray-200 pt-5">

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Storage
                </span>

                <span className="text-xs text-gray-500">
                  0 GB / 5 GB
                </span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-0"></div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                5 GB available
              </p>

            </div>

          </div>

        </aside>

        {/* CONTENT */}
        <section className="flex-1 p-6 md:p-10">

          {/* TOP */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

            <div>
              <h1 className="text-3xl font-bold">
                My Drive
              </h1>

              <p className="text-gray-500 mt-1">
                Welcome back, {userName}.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:w-96">

              <input
                type="text"
                placeholder="Search files and folders..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

            </div>

          </div>

          {/* ACTION BAR */}
          <div className="flex flex-wrap items-center gap-3 mb-8">

            <button className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition">
              ⬆ Upload Files
            </button>

            <button className="px-5 py-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl font-medium transition">
              📁 New Folder
            </button>

            <button className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl">
              ↕ Sort
            </button>

            <button className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl">
              ▦
            </button>

          </div>

          {/* FOLDERS */}
          <div className="mb-10">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-lg font-semibold">
                Folders
              </h2>

              <span className="text-sm text-gray-500">
                0 folders
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition cursor-pointer">

                <div className="text-4xl mb-4">
                  📁
                </div>

                <h3 className="font-semibold">
                  Create your first folder
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Organize your files easily
                </p>

              </div>

            </div>

          </div>

          {/* FILES */}
          <div>

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-lg font-semibold">
                Files
              </h2>

              <span className="text-sm text-gray-500">
                0 files
              </span>

            </div>

            {/* EMPTY STATE */}
            <div className="bg-white border border-gray-200 rounded-2xl min-h-[300px] flex items-center justify-center">

              <div className="text-center max-w-md px-6">

                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
                  ☁️
                </div>

                <h3 className="text-xl font-bold mb-2">
                  Your drive is empty
                </h3>

                <p className="text-gray-500 mb-6">
                  Upload your first file and start storing your
                  documents, photos, videos and other media securely.
                </p>

                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition">
                  ⬆ Upload Your First File
                </button>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}