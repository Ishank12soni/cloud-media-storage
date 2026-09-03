# CloudBox — Cloud Media Storage Service

A full-stack cloud media/file storage application built with Next.js, Express, PostgreSQL/Supabase and Supabase Storage.

## Features

- Supabase email/password authentication
- Google OAuth button
- Forgot/reset password flow
- User profile and password management
- Hierarchical folders
- Folder create, rename, move and trash/restore
- Private cloud file storage
- File upload up to 50 MB per file
- Drag-and-drop upload
- Multiple file upload
- Download using short-lived signed URLs
- File rename, move and trash/restore
- Grid/list view
- Sorting by name, newest and size
- Search files/folders
- Starred items
- Recent items
- Shared with me
- Viewer/editor sharing
- Share revocation
- Public share links
- Optional expiry
- Optional public-link password
- Private storage bucket
- Server-side access control
- RLS defense-in-depth
- 15 GB UI storage meter
- Light/dark dashboard theme

## Architecture

```text
cloud-media-storage/
├── frontend/       Next.js App Router
├── backend/        Express REST API
├── SUPABASE_SETUP.sql
└── README.md
```

## Local setup

### 1. Supabase

Run `SUPABASE_SETUP.sql` in the Supabase SQL Editor.

Create/confirm a private bucket named:

`cloudbox-files`

The SQL script creates it automatically.

### 2. Backend

Copy `.env.example` to `.env` and fill in your Supabase project URL and backend secret key.

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

`http://localhost:5001`

### 3. Frontend

Create `frontend/.env.local` from `.env.example`.

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

`http://localhost:3000`

### 4. Google OAuth

If Google sign-in is required, enable Google in Supabase Authentication > Providers and add the local/production redirect URL.

## Security notes

- Never put `SUPABASE_SECRET_KEY` in frontend code.
- Never commit `.env` or `.env.local`.
- The Storage bucket is private.
- The backend verifies Supabase bearer tokens.
- The backend performs ownership/share permission checks.
- Public link tokens are cryptographically random.
- Public link passwords are stored as bcrypt hashes.
- Downloads use short-lived signed URLs.

## Main routes

Frontend:

- `/`
- `/signup`
- `/signin`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/folder/:id`
- `/dashboard/recent`
- `/dashboard/starred`
- `/dashboard/shared`
- `/dashboard/trash`
- `/dashboard/profile`
- `/share/:token`

Backend:

- `/api/auth`
- `/api/folders`
- `/api/files`
- `/api/shares`
- `/api/stars`
- `/api/profile`
- `/api/search`
- `/api/public`
