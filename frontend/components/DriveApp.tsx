
"use client";

import { FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

type Mode = "drive" | "recent" | "starred" | "shared" | "trash" | "profile";

type Folder = {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

type FileItem = {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

type Share = {
  id: string;
  item_type: "file" | "folder";
  item_id: string;
  shared_with_email: string;
  permission: "viewer" | "editor";
  item?: FileItem | Folder;
};

type DriveAppProps = {
  mode: Mode;
  folderId?: string | null;
};

const blue = "bg-blue-600 hover:bg-blue-700";
const lightButton = "border border-slate-200 bg-white hover:bg-slate-50";
const darkButton = "border border-slate-700 bg-slate-900 hover:bg-slate-800";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fileIcon(file: FileItem) {
  const type = file.mime_type || "";
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word") || type.includes("document")) return "📘";
  if (type.includes("sheet") || type.includes("excel")) return "📗";
  if (type.includes("zip") || type.includes("compressed")) return "🗜️";
  return "📄";
}

export default function DriveApp({ mode, folderId = null }: DriveAppProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "My Drive" },
  ]);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"name" | "newest" | "size">("name");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ folders: Folder[]; files: FileItem[] }>({ folders: [], files: [] });

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [renameTarget, setRenameTarget] = useState<{ type: "file" | "folder"; item: FileItem | Folder } | null>(null);
  const [renameName, setRenameName] = useState("");

  const [moveTarget, setMoveTarget] = useState<{ type: "file" | "folder"; item: FileItem | Folder } | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [moveDestination, setMoveDestination] = useState("");

  const [shareTarget, setShareTarget] = useState<{ type: "file" | "folder"; item: FileItem | Folder } | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [permission, setPermission] = useState<"viewer" | "editor">("viewer");
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [existingShares, setExistingShares] = useState<Share[]>([]);
  const [existingLinks, setExistingLinks] = useState<{id:string; token:string; expires_at:string|null}[]>([]);

  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [profileName, setProfileName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const isTrash = mode === "trash";

  useEffect(() => {
    const saved = localStorage.getItem("cloudbox-theme");
    setDarkMode(saved === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("cloudbox-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (mode === "drive") loadDrive();
    else if (mode === "recent") loadRecent();
    else if (mode === "starred") loadStarred();
    else if (mode === "shared") loadShared();
    else if (mode === "trash") loadTrash();
    else if (mode === "profile") loadProfile();
  }, [mode, folderId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSearchResults({ folders: [], files: [] });
        return;
      }
      try {
        const result = await apiFetch(`/api/search?q=${encodeURIComponent(search.trim())}&sort=${sort}`);
        setSearchResults({ folders: result.folders || [], files: result.files || [] });
      } catch {
        setSearchResults({ folders: [], files: [] });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, sort]);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin");
        return;
      }
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
    } catch {
      router.replace("/signin");
    } finally {
      setLoading(false);
    }
  }

  async function loadDrive() {
    try {
      setWorking(true);
      setError("");
      const folderResult = await apiFetch(folderId ? `/api/folders?parentId=${encodeURIComponent(folderId)}` : "/api/folders");
      const fileResult = await apiFetch(folderId ? `/api/files?folderId=${encodeURIComponent(folderId)}` : "/api/files");
      setFolders(folderResult.folders || []);
      setFiles(fileResult.files || []);

      if (folderId) {
        const current = await apiFetch(`/api/folders/${folderId}`);
        setCurrentFolder(current.folder);
        await loadBreadcrumbs(current.folder);
      } else {
        setCurrentFolder(null);
        setBreadcrumbs([{ id: null, name: "My Drive" }]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadBreadcrumbs(folder: Folder) {
    const chain: { id: string | null; name: string }[] = [{ id: null, name: "My Drive" }];
    const parents: Folder[] = [];
    let cursor: Folder | null = folder;

    for (let i = 0; i < 20 && cursor; i++) {
      parents.unshift(cursor);
      if (!cursor.parent_id) break;
      try {
        const result = await apiFetch(`/api/folders/${cursor.parent_id}`);
        cursor = result.folder;
      } catch {
        break;
      }
    }

    for (const item of parents) chain.push({ id: item.id, name: item.name });
    setBreadcrumbs(chain);
  }

  async function loadRecent() {
    try {
      setWorking(true);
      const result = await apiFetch("/api/search/recent");
      setFolders(result.folders || []);
      setFiles(result.files || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadStarred() {
    try {
      setWorking(true);
      const result = await apiFetch("/api/stars");
      const stars: { item_type: "file" | "folder"; item_id: string }[] = result.stars || [];
      const nextFolders: Folder[] = [];
      const nextFiles: FileItem[] = [];
      await Promise.all(stars.map(async (star) => {
        try {
          if (star.item_type === "folder") {
            const r = await apiFetch(`/api/folders/${star.item_id}`);
            if (r.folder) nextFolders.push(r.folder);
          } else {
            const r = await apiFetch(`/api/files/${star.item_id}`);
            if (r.file) nextFiles.push(r.file);
          }
        } catch {}
      }));
      setFolders(nextFolders);
      setFiles(nextFiles);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadShared() {
    try {
      setWorking(true);
      const result = await apiFetch("/api/shares/shared-with-me");
      const shares: Share[] = result.shares || [];
      setFolders(shares.filter((s) => s.item_type === "folder").map((s) => s.item as Folder));
      setFiles(shares.filter((s) => s.item_type === "file").map((s) => s.item as FileItem));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadTrash() {
    try {
      setWorking(true);
      const result = await apiFetch("/api/search/trash");
      setFolders(result.folders || []);
      setFiles(result.files || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadProfile() {
    try {
      setWorking(true);
      const result = await apiFetch("/api/profile");
      setProfile(result.profile);
      setProfileName(result.profile?.full_name || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function createFolder(e?: FormEvent) {
    e?.preventDefault();
    if (!folderName.trim()) return;
    try {
      setWorking(true);
      setError("");
      await apiFetch("/api/folders", {
        method: "POST",
        body: JSON.stringify({ name: folderName.trim(), parentId: folderId || null }),
      });
      setFolderName("");
      setShowNewFolder(false);
      setMessage("Folder created.");
      await loadDrive();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function deleteFolder(folder: Folder) {
    if (!confirm(`Move "${folder.name}" to Trash?`)) return;
    try {
      setWorking(true);
      await apiFetch(`/api/folders/${folder.id}`, { method: "DELETE" });
      setMessage("Folder moved to Trash.");
      await loadDrive();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function deleteFile(file: FileItem) {
    if (!confirm(`Move "${file.name}" to Trash?`)) return;
    try {
      await apiFetch(`/api/files/${file.id}`, { method: "DELETE" });
      setMessage("File moved to Trash.");
      if (mode === "drive") await loadDrive();
      else await loadRecent();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function renameItem() {
    if (!renameTarget || !renameName.trim()) return;
    try {
      setWorking(true);
      if (renameTarget.type === "folder") {
        await apiFetch(`/api/folders/${renameTarget.item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: renameName.trim() }),
        });
      } else {
        await apiFetch(`/api/files/${renameTarget.item.id}/rename`, {
          method: "PATCH",
          body: JSON.stringify({ name: renameName.trim() }),
        });
      }
      setRenameTarget(null);
      setRenameName("");
      await refreshCurrent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function loadAllFolders() {
    try {
      const result = await apiFetch("/api/folders/all");
      setAllFolders(result.folders || []);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function moveItem() {
    if (!moveTarget) return;
    try {
      setWorking(true);
      const destination = moveDestination || null;
      if (moveTarget.type === "file") {
        await apiFetch(`/api/files/${moveTarget.item.id}/move`, {
          method: "PATCH",
          body: JSON.stringify({ folderId: destination }),
        });
      } else {
        await apiFetch(`/api/folders/${moveTarget.item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ parentId: destination }),
        });
      }
      setMoveTarget(null);
      setMoveDestination("");
      await refreshCurrent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function toggleStar(type: "file" | "folder", id: string, starred: boolean) {
    try {
      if (starred) {
        await apiFetch("/api/stars", { method: "DELETE", body: JSON.stringify({ itemType: type, itemId: id }) });
      } else {
        await apiFetch("/api/stars", { method: "POST", body: JSON.stringify({ itemType: type, itemId: id }) });
      }
      await refreshCurrent();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function downloadFile(file: FileItem) {
    try {
      const result = await apiFetch(`/api/files/${file.id}/download`);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function uploadFiles(list: FileList | File[]) {
    const filesToUpload = Array.from(list);
    if (!filesToUpload.length) return;
    try {
      setError("");
      setMessage("");
      setUploadStatus(`Uploading 0/${filesToUpload.length}...`);
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) formData.append("folderId", folderId);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Please sign in again.");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/files/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || `Failed to upload ${file.name}`);
        setUploadStatus(`Uploading ${i + 1}/${filesToUpload.length}: ${file.name}`);
      }
      setUploadStatus("");
      setMessage(`${filesToUpload.length} file${filesToUpload.length > 1 ? "s" : ""} uploaded successfully.`);
      await loadDrive();
    } catch (e: any) {
      setUploadStatus("");
      setError(e.message);
    }
  }

  async function refreshCurrent() {
    if (mode === "drive") await loadDrive();
    else if (mode === "recent") await loadRecent();
    else if (mode === "starred") await loadStarred();
    else if (mode === "shared") await loadShared();
    else if (mode === "trash") await loadTrash();
  }

  async function restoreFile(id: string) {
    try {
      await apiFetch(`/api/files/${id}/restore`, { method: "PATCH" });
      await loadTrash();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function permanentDeleteFile(id: string) {
    if (!confirm("Permanently delete this file? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/files/${id}/permanent`, { method: "DELETE" });
      await loadTrash();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function restoreFolder(id: string) {
    try {
      await apiFetch(`/api/folders/${id}/restore`, { method: "PATCH" });
      await loadTrash();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function permanentDeleteFolder(id: string) {
    if (!confirm("Permanently delete this folder? This cannot be undone.")) return;
    try {
      setWorking(true);
      await apiFetch(`/api/folders/${id}/permanent`, { method: "DELETE" });
      setMessage("Folder permanently deleted.");
      await loadTrash();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    try {
      setWorking(true);
      await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify({ fullName: profileName }) });
      setMessage("Profile updated.");
      setUserName(profileName);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    try {
      setWorking(true);
      await apiFetch("/api/profile/password", { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      setNewPassword("");
      setMessage("Password updated successfully.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }


  async function openShare(target: { type: "file" | "folder"; item: FileItem | Folder }) {
    setShareTarget(target);
    setShareEmail("");
    setSharePassword("");
    setShareExpiry("");
    setCreatedLink("");
    try {
      const [sharesResult, linksResult] = await Promise.all([
        apiFetch(`/api/shares?itemType=${target.type}&itemId=${target.item.id}`),
        apiFetch(`/api/shares/public?itemType=${target.type}&itemId=${target.item.id}`),
      ]);
      setExistingShares(sharesResult.shares || []);
      setExistingLinks(linksResult.links || []);
    } catch (e: any) {
      setExistingShares([]);
      setExistingLinks([]);
      setError(e.message);
    }
  }

  async function revokeShare(id: string) {
    try {
      await apiFetch(`/api/shares/${id}`, { method: "DELETE" });
      setExistingShares((items) => items.filter((item) => item.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  async function deletePublicLink(id: string) {
    try {
      await apiFetch(`/api/shares/public/${id}`, { method: "DELETE" });
      setExistingLinks((items) => items.filter((item) => item.id !== id));
    } catch (e: any) { setError(e.message); }
  }

  async function shareByEmail(e: FormEvent) {
    e.preventDefault();
    if (!shareTarget || !shareEmail.trim()) {
      setError("Enter the email address you want to share with.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      await apiFetch("/api/shares", {
        method: "POST",
        body: JSON.stringify({
          itemType: shareTarget.type,
          itemId: shareTarget.item.id,
          email: shareEmail.trim(),
          permission,
        }),
      });

      const refreshed = await apiFetch(`/api/shares?itemType=${shareTarget.type}&itemId=${shareTarget.item.id}`);
      setExistingShares(refreshed.shares || []);
      setShareEmail("");
      setMessage(`Shared with ${shareEmail.trim()}.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function createPublicLink(e: FormEvent) {
    e.preventDefault();
    if (!shareTarget) return;

    try {
      setWorking(true);
      setError("");
      setCreatedLink("");

      const expiresAt = shareExpiry
        ? new Date(Date.now() + Number(shareExpiry) * 86400000).toISOString()
        : null;

      const result = await apiFetch("/api/shares/public", {
        method: "POST",
        body: JSON.stringify({
          itemType: shareTarget.type,
          itemId: shareTarget.item.id,
          expiresAt,
          password: sharePassword || null,
        }),
      });

      const url = `${window.location.origin}/share/${result.link.token}`;
      setCreatedLink(url);
      setExistingLinks((items) => [
        { id: result.link.id, token: result.link.token, expires_at: result.link.expires_at },
        ...items,
      ]);
      setMessage("Public share link created.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/signin");
  }

  async function openSearchFolder(folder: Folder) {
    setSearch("");
    router.push(`/dashboard/folder/${folder.id}`);
  }

  function sortedFolders(items: Folder[]) {
    return [...items].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  function sortedFiles(items: FileItem[]) {
    return [...items].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return Number(b.size_bytes) - Number(a.size_bytes);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  const usedBytes = files.reduce((sum, f) => sum + Number(f.size_bytes || 0), 0);
  const storageLimit = 15 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, (usedBytes / storageLimit) * 100);

  const title = mode === "drive"
    ? currentFolder?.name || "My Drive"
    : mode === "recent" ? "Recent"
    : mode === "starred" ? "Starred"
    : mode === "shared" ? "Shared with me"
    : mode === "trash" ? "Trash"
    : "Profile";

  const description = mode === "drive"
    ? "Store and organize your files securely."
    : mode === "recent" ? "Your recently updated files and folders."
    : mode === "starred" ? "Quick access to your favorite items."
    : mode === "shared" ? "Files and folders shared with your account."
    : mode === "trash" ? "Items you've moved to the Trash."
    : "Manage your CloudBox account.";

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="text-slate-600">Loading CloudBox...</p></div></main>;
  }

  if (mode === "profile") {
    return (
      <Shell darkMode={darkMode} setDarkMode={setDarkMode} userName={userName} userEmail={userEmail} logout={logout} router={router} active={mode}>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-slate-500">Update your account details and password.</p>
          {error && <Alert type="error" text={error} />}
          {message && <Alert type="success" text={message} />}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <form onSubmit={saveProfile} className={card(darkMode) + " p-6"}>
              <h2 className="text-xl font-semibold">Personal information</h2>
              <label className="mt-6 block text-sm font-medium">Full Name</label>
              <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className={input(darkMode)} />
              <label className="mt-5 block text-sm font-medium">Email</label>
              <input value={profile?.email || userEmail} disabled className={input(darkMode) + " opacity-60"} />
              <button disabled={working} className={`${blue} mt-6 rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50`}>Save Profile</button>
            </form>
            <form onSubmit={savePassword} className={card(darkMode) + " p-6"}>
              <h2 className="text-xl font-semibold">Change password</h2>
              <p className="mt-2 text-sm text-slate-500">Use at least 6 characters.</p>
              <label className="mt-6 block text-sm font-medium">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input(darkMode)} />
              <button disabled={working} className={`${blue} mt-6 rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50`}>Update Password</button>
            </form>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell darkMode={darkMode} setDarkMode={setDarkMode} userName={userName} userEmail={userEmail} logout={logout} router={router} active={mode}>
      <div className="relative">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-1 text-slate-500">{description}</p>
          </div>
          {mode === "drive" && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowNewFolder(true)} className={`${blue} rounded-xl px-4 py-3 font-semibold text-white`}>＋ New Folder</button>
              <button onClick={() => inputRef.current?.click()} className={`${lightButton} ${darkMode ? darkButton : ""} rounded-xl px-4 py-3 font-semibold`}>⬆ Upload Files</button>
              <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
            </div>
          )}
        </div>

        {error && <Alert type="error" text={error} />}
        {message && <Alert type="success" text={message} />}
        {uploadStatus && <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{uploadStatus}</div>}

        {mode === "drive" && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); uploadFiles(e.dataTransfer.files); }}
              className={`mb-5 rounded-2xl border-2 border-dashed p-6 text-center transition ${dragActive ? "border-blue-500 bg-blue-50" : darkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}
            >
              <div className="text-3xl">☁️</div>
              <p className="mt-2 font-semibold">Drag & drop files here</p>
              <p className="mt-1 text-sm text-slate-500">or click Upload Files • Maximum 50 MB per file</p>
            </div>

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files and folders..." className={input(darkMode) + " pl-10"} />
                <span className="absolute left-3 top-1/2 -translate-y-1/2">⌕</span>
                {(searchResults.folders.length || searchResults.files.length) > 0 && (
                  <div className={`absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-auto rounded-xl border p-2 shadow-2xl ${darkMode ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"}`}>
                    {searchResults.folders.slice(0, 5).map((f) => <button key={f.id} onClick={() => openSearchFolder(f)} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-100"><span>📁</span><span className="truncate">{f.name}</span></button>)}
                    {searchResults.files.slice(0, 5).map((f) => <button key={f.id} onClick={() => { setSearch(""); downloadFile(f); }} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-100"><span>{fileIcon(f)}</span><span className="truncate">{f.name}</span></button>)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className={input(darkMode) + " !w-auto py-2"}>
                  <option value="name">Sort: Name</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="size">Sort: Size</option>
                </select>
                <button onClick={() => setView("grid")} className={`${view === "grid" ? "bg-blue-600 text-white" : darkMode ? darkButton : lightButton} rounded-lg px-3 py-2`}>▦</button>
                <button onClick={() => setView("list")} className={`${view === "list" ? "bg-blue-600 text-white" : darkMode ? darkButton : lightButton} rounded-lg px-3 py-2`}>☷</button>
              </div>
            </div>

            <div className={card(darkMode) + " mb-6 p-4"}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbs.map((b, i) => (
                  <span key={`${b.id || "root"}-${i}`} className="flex items-center gap-2">
                    {i > 0 && <span className="text-slate-400">/</span>}
                    <button onClick={() => router.push(b.id ? `/dashboard/folder/${b.id}` : "/dashboard")} className={i === breadcrumbs.length - 1 ? "font-semibold" : "text-blue-600 hover:underline"}>{b.name}</button>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {working && <p className="mb-4 text-sm text-slate-500">Updating...</p>}

        <section className={card(darkMode) + " p-5"}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{mode === "trash" ? "Deleted items" : "Items"}</h2>
            <span className="text-sm text-slate-500">{folders.length + files.length} items</span>
          </div>

          {folders.length === 0 && files.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <div className="text-6xl">{isTrash ? "🗑️" : "☁️"}</div>
              <h3 className="mt-4 text-xl font-semibold">{isTrash ? "Trash is empty" : "Nothing here yet"}</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">{isTrash ? "Deleted items will appear here." : "Create a folder or upload a file to get started."}</p>
            </div>
          ) : view === "list" ? (
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {[...sortedFolders(folders).map((f) => ({ kind: "folder" as const, item: f })), ...sortedFiles(files).map((f) => ({ kind: "file" as const, item: f }))].map(({ kind, item }: any) => (
                  <ListRow key={`${kind}-${item.id}`} kind={kind} item={item} darkMode={darkMode} trash={isTrash} shared={mode === "shared"}
                    onOpen={() => kind === "folder" && !isTrash ? router.push(`/dashboard/folder/${item.id}`) : undefined}
                    onDownload={() => kind === "file" && downloadFile(item)}
                    onRename={() => { setRenameTarget({ type: kind, item }); setRenameName(item.name); }}
                    onMove={() => { setMoveTarget({ type: kind, item }); loadAllFolders(); }}
                    onDelete={() => kind === "file" ? deleteFile(item) : deleteFolder(item)}
                    onRestore={() => kind === "file" ? restoreFile(item.id) : restoreFolder(item.id)}
                    onPermanent={() => kind === "file" ? permanentDeleteFile(item.id) : permanentDeleteFolder(item.id)}
                    onShare={() => openShare({ type: kind, item })}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedFolders(folders).map((folder) => (
                <ItemCard key={folder.id} kind="folder" item={folder} darkMode={darkMode} trash={isTrash} shared={mode === "shared"}
                  onOpen={() => !isTrash && router.push(`/dashboard/folder/${folder.id}`)}
                  onRename={() => { setRenameTarget({ type: "folder", item: folder }); setRenameName(folder.name); }}
                  onMove={() => { setMoveTarget({ type: "folder", item: folder }); loadAllFolders(); }}
                  onDelete={() => deleteFolder(folder)}
                  onRestore={() => restoreFolder(folder.id)}
                  onPermanent={() => permanentDeleteFolder(folder.id)}
                  onShare={() => openShare({ type: "folder", item: folder })}
                  onStar={() => toggleStar("folder", folder.id, mode === "starred")}
                />
              ))}
              {sortedFiles(files).map((file) => (
                <ItemCard key={file.id} kind="file" item={file} darkMode={darkMode} trash={isTrash} shared={mode === "shared"}
                  onDownload={() => downloadFile(file)}
                  onRename={() => { setRenameTarget({ type: "file", item: file }); setRenameName(file.name); }}
                  onMove={() => { setMoveTarget({ type: "file", item: file }); loadAllFolders(); }}
                  onDelete={() => deleteFile(file)}
                  onRestore={() => restoreFile(file.id)}
                  onPermanent={() => permanentDeleteFile(file.id)}
                  onShare={() => openShare({ type: "file", item: file })}
                  onStar={() => toggleStar("file", file.id, mode === "starred")}
                />
              ))}
            </div>
          )}
        </section>

        <div className={darkMode ? "mt-6 rounded-xl border border-blue-900 bg-blue-950/30 p-4 text-sm text-blue-200" : "mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"}>
          <strong>CloudBox:</strong> Your files are stored in a private Supabase Storage bucket and protected by authenticated backend access control.
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-500"><span>Storage used</span><span>{formatBytes(usedBytes)} / 15 GB</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(storagePercent, usedBytes ? 1 : 0)}%` }} /></div>
        </div>
      </div>

      {showNewFolder && <Modal darkMode={darkMode} title="Create New Folder" onClose={() => setShowNewFolder(false)}>
        <form onSubmit={createFolder}>
          <input autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Folder name" className={input(darkMode)} />
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewFolder(false)} className={`${darkMode ? darkButton : lightButton} rounded-lg px-4 py-2`}>Cancel</button><button className={`${blue} rounded-lg px-5 py-2 font-semibold text-white`}>Create</button></div>
        </form>
      </Modal>}

      {renameTarget && <Modal darkMode={darkMode} title={`Rename ${renameTarget.type}`} onClose={() => setRenameTarget(null)}>
        <input autoFocus value={renameName} onChange={(e) => setRenameName(e.target.value)} className={input(darkMode)} />
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setRenameTarget(null)} className={`${darkMode ? darkButton : lightButton} rounded-lg px-4 py-2`}>Cancel</button><button onClick={renameItem} className={`${blue} rounded-lg px-5 py-2 font-semibold text-white`}>Save</button></div>
      </Modal>}

      {moveTarget && <Modal darkMode={darkMode} title={`Move ${moveTarget.item.name}`} onClose={() => setMoveTarget(null)}>
        <label className="text-sm font-medium">Destination</label>
        <select value={moveDestination} onChange={(e) => setMoveDestination(e.target.value)} className={input(darkMode)}>
          <option value="">My Drive (Root)</option>
          {allFolders.filter((f) => f.id !== moveTarget.item.id).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setMoveTarget(null)} className={`${darkMode ? darkButton : lightButton} rounded-lg px-4 py-2`}>Cancel</button><button onClick={moveItem} className={`${blue} rounded-lg px-5 py-2 font-semibold text-white`}>Move</button></div>
      </Modal>}

      {shareTarget && <Modal darkMode={darkMode} title={`Share ${shareTarget.item.name}`} onClose={() => setShareTarget(null)}>
        <div className="space-y-6">
          <form onSubmit={shareByEmail} className={darkMode ? "rounded-2xl border border-slate-800 bg-slate-900 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
            <div className="mb-3">
              <p className="font-semibold">Share with a person</p>
              <p className="mt-1 text-sm text-slate-500">Enter their account email address. They will see this item under <b>Shared with me</b>.</p>
            </div>
            <label className="text-sm font-medium">Email address</label>
            <input required type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="person@example.com" className={input(darkMode)} />
            <label className="mt-4 block text-sm font-medium">Permission</label>
            <select value={permission} onChange={(e) => setPermission(e.target.value as "viewer" | "editor")} className={input(darkMode)}>
              <option value="viewer">Viewer — view and download</option>
              <option value="editor">Editor — modify and manage</option>
            </select>
            <button disabled={working} type="submit" className={`${blue} mt-4 w-full rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50`}>
              {working ? "Sharing..." : "Share by Email"}
            </button>
          </form>

          {existingShares.length > 0 && <div className={darkMode ? "rounded-xl border border-slate-800 p-3" : "rounded-xl border border-slate-200 p-3"}>
            <p className="font-semibold text-sm">People with access</p>
            {existingShares.map((s) => <div key={s.id} className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{s.shared_with_email} • {s.permission}</span>
              <button type="button" onClick={() => revokeShare(s.id)} className="shrink-0 font-semibold text-red-600">Revoke</button>
            </div>)}
          </div>}

          <form onSubmit={createPublicLink} className={darkMode ? "rounded-2xl border border-slate-800 bg-slate-900 p-4" : "rounded-2xl border border-slate-200 bg-slate-50 p-4"}>
            <div className="mb-3">
              <p className="font-semibold">Public share link</p>
              <p className="mt-1 text-sm text-slate-500">Anyone with the link can access it according to the settings below.</p>
            </div>
            <label className="text-sm font-medium">Link expiry</label>
            <select value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)} className={input(darkMode)}>
              <option value="">No expiry</option>
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
            <label className="mt-4 block text-sm font-medium">Link password <span className="text-slate-400">(optional)</span></label>
            <input type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="Optional password" className={input(darkMode)} />
            <button disabled={working} type="submit" className={`${darkMode ? "border border-slate-700 bg-slate-800 hover:bg-slate-700" : lightButton} mt-4 w-full rounded-xl px-5 py-3 font-semibold disabled:opacity-50`}>
              {working ? "Creating link..." : "Create Public Link"}
            </button>
          </form>

          {createdLink && <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700 break-all">
            <p className="font-semibold">Public link created</p>
            <p className="mt-1">{createdLink}</p>
            <button type="button" onClick={() => navigator.clipboard.writeText(createdLink)} className="mt-2 font-semibold underline">Copy link</button>
          </div>}

          {existingLinks.length > 0 && <div className={darkMode ? "rounded-xl border border-slate-800 p-3" : "rounded-xl border border-slate-200 p-3"}>
            <p className="font-semibold text-sm">Public links</p>
            {existingLinks.map((link) => <div key={link.id} className="mt-2 flex items-center justify-between gap-3 text-sm">
              <button type="button" className="truncate text-blue-600" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/${link.token}`)}>Copy link</button>
              <button type="button" onClick={() => deletePublicLink(link.id)} className="font-semibold text-red-600">Delete</button>
            </div>)}
          </div>}

          <div className="flex justify-end">
            <button type="button" onClick={() => setShareTarget(null)} className={`${darkMode ? darkButton : lightButton} rounded-lg px-4 py-2`}>Close</button>
          </div>
        </div>
      </Modal>}
    </Shell>
  );
}

function card(dark: boolean) {
  return dark ? "rounded-2xl border border-slate-800 bg-slate-950" : "rounded-2xl border border-slate-200 bg-white shadow-sm";
}
function input(dark: boolean) {
  return dark ? "mt-2 w-full rounded-xl border border-slate-700 bg-black px-4 py-3 text-white outline-none focus:border-blue-500" : "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
}
function Alert({ type, text }: { type: "error" | "success"; text: string }) {
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{text}</div>;
}

function Modal({
  darkMode,
  title,
  onClose,
  children,
}: {
  darkMode: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={
          darkMode
            ? "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl"
            : "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
        }
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={
            darkMode
              ? "sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4"
              : "sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4"
          }
        >
          <h2 className="pr-4 text-xl font-bold">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className={
              darkMode
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-2xl font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            }
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ kind, item, darkMode, trash, shared, onOpen, onDownload, onRename, onMove, onDelete, onRestore, onPermanent, onShare, onStar }: any) {
  const isFile = kind === "file";
  return <div className={darkMode ? "group rounded-xl border border-slate-800 bg-black p-4 hover:border-blue-500" : "group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-md"}>
    <button onDoubleClick={onOpen} onClick={isFile ? onDownload : onOpen} className="w-full text-left">
      <div className="flex h-28 items-center justify-center rounded-xl bg-slate-50 text-6xl">{isFile ? fileIcon(item) : "📁"}</div>
      <p className="mt-3 truncate font-semibold">{item.name}</p>
      <p className="mt-1 text-xs text-slate-500">{isFile ? formatBytes(Number(item.size_bytes)) : "Folder"} • {formatDate(item.updated_at || item.created_at)}</p>
    </button>
    <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-3">
      {!trash && !shared && <><button title="Rename" onClick={onRename} className="rounded-md p-2 hover:bg-slate-100">✏️</button><button title="Move" onClick={onMove} className="rounded-md p-2 hover:bg-slate-100">↗️</button><button title="Share" onClick={onShare} className="rounded-md p-2 hover:bg-slate-100">🔗</button><button title="Star" onClick={onStar} className="rounded-md p-2 hover:bg-slate-100">⭐</button></>}
      {isFile && !trash && <button title="Download" onClick={onDownload} className="rounded-md p-2 hover:bg-slate-100">⬇️</button>}
      {!trash && !shared && <button title="Trash" onClick={onDelete} className="rounded-md p-2 hover:bg-red-50">🗑️</button>}
      {trash && <button title="Restore" onClick={onRestore} className="rounded-md p-2 hover:bg-green-50">↩️</button>}
      {trash && <button title="Delete permanently" onClick={onPermanent} className="rounded-md p-2 hover:bg-red-50">❌</button>}
    </div>
  </div>;
}

function ListRow({ kind, item, darkMode, trash, shared, onOpen, onDownload, onRename, onMove, onDelete, onRestore, onPermanent, onShare }: any) {
  const isFile = kind === "file";
  return <div className={`flex items-center gap-4 border-b px-3 py-3 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
    <div className="w-10 text-2xl">{isFile ? fileIcon(item) : "📁"}</div>
    <button onClick={isFile ? onDownload : onOpen} className="min-w-0 flex-1 text-left"><p className="truncate font-semibold">{item.name}</p><p className="text-xs text-slate-500">{isFile ? formatBytes(Number(item.size_bytes)) : "Folder"}</p></button>
    <span className="hidden w-28 text-sm text-slate-500 md:block">{formatDate(item.updated_at || item.created_at)}</span>
    <div className="flex gap-1">
      {!trash && !shared && <><button onClick={onRename} className="rounded-md p-2 hover:bg-slate-100">✏️</button><button onClick={onMove} className="rounded-md p-2 hover:bg-slate-100">↗️</button><button onClick={onShare} className="rounded-md p-2 hover:bg-slate-100">🔗</button></>}
      {isFile && !trash && <button onClick={onDownload} className="rounded-md p-2 hover:bg-slate-100">⬇️</button>}
      {!trash && !shared && <button onClick={onDelete} className="rounded-md p-2 hover:bg-red-50">🗑️</button>}
      {trash && <button onClick={onRestore} className="rounded-md p-2 hover:bg-green-50">↩️</button>}
      {trash && <button onClick={onPermanent} className="rounded-md p-2 hover:bg-red-50">❌</button>}
    </div>
  </div>;
}

function Shell({ children, darkMode, setDarkMode, userName, userEmail, logout, router, active }: any) {
  const nav = [
    ["drive", "📁", "My Drive", "/dashboard"],
    ["recent", "🕘", "Recent", "/dashboard/recent"],
    ["starred", "⭐", "Starred", "/dashboard/starred"],
    ["shared", "👥", "Shared with me", "/dashboard/shared"],
    ["trash", "🗑️", "Trash", "/dashboard/trash"],
  ];
  return <main className={darkMode ? "min-h-screen bg-black text-white" : "min-h-screen bg-slate-50 text-slate-900"}>
    <header className={darkMode ? "border-b border-slate-800 bg-black" : "border-b border-slate-200 bg-white"}>
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">☁</div><span className="text-xl font-bold">CloudBox</span></button>
        <div className="hidden flex-1 md:block">
          <p className="text-center text-sm text-slate-500">Private cloud storage • Secure file management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className={`${darkMode ? darkButton : lightButton} rounded-lg px-3 py-2`}>{darkMode ? "☀" : "🌙"}</button>
          <button onClick={() => router.push("/dashboard/profile")} className="hidden rounded-full bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 sm:block">👤 {userName}</button>
          <button onClick={logout} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Logout</button>
        </div>
      </div>
    </header>
    <div className="mx-auto flex max-w-7xl">
      <aside className={darkMode ? "hidden min-h-[calc(100vh-80px)] w-64 border-r border-slate-800 bg-black p-5 md:block" : "hidden min-h-[calc(100vh-80px)] w-64 border-r border-slate-200 bg-white p-5 md:block"}>
        <button onClick={() => router.push("/dashboard")} className={`${blue} mb-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white`}>＋ New</button>
        <nav className="space-y-1">
          {nav.map(([key, icon, label, href]) => <button key={key} onClick={() => router.push(href)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${active === key ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}><span>{icon}</span><span>{label}</span></button>)}
        </nav>
        <div className="mt-10"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Storage</p><div className={darkMode ? "rounded-xl bg-slate-900 p-4" : "rounded-xl bg-slate-50 p-4"}><div className="mb-2 flex justify-between text-xs"><span>Plan</span><span>Free</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[2%] rounded-full bg-blue-600" /></div><p className="mt-3 text-xs text-slate-500">15 GB storage</p></div></div>
        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">Private storage • Server-side access control • Secure share links</div>
      </aside>
      <section className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</section>
    </div>
  </main>;
}
