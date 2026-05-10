# Locker

Open-source file storage and knowledge platform. A self-hostable alternative to Dropbox and Google Drive — with built-in search, document transcription, and an AI-powered knowledge base.

## Features

- **File Explorer** — Upload, organize, rename, move, and delete files and folders with grid and list views
- **File Previews** — In-app viewers for PDFs, images, Markdown, CSV, audio, video, and plain text
- **Tags** — Organize files with color-coded, workspace-scoped tags and filter by them
- **Share Links** — Generate shareable links with optional password protection, expiration, and download limits
- **Upload Links** — Let others upload files to your storage without an account
- **Command Palette** — Cmd+K search across file names and content with keyboard navigation
- **Knowledge Base** — AI-powered wiki that ingests tagged documents, supports chat, and visualizes page relationships in an interactive graph view
- **Plugins** — Extensible plugin system with built-in plugins for search (QMD, FTS), document transcription, Google Drive sync, and knowledge base
- **Document Transcription** — AI-powered OCR/transcription for images and PDFs, making non-text files searchable
- **Notifications** — In-app notifications for workspace invites and announcements
- **Workspace Invites** — Invite users via email with token-based onboarding flow
- **Multi-Store Storage** — Attach multiple storage backends (Local, S3, R2, Vercel Blob) per workspace with automatic replication across stores
- **Read-Only Ingest** — Scan external buckets or directories for new files and import them into Locker without moving originals
- **Storage Quotas** — Per-user storage limits with usage tracking
- **Virtual Bash Filesystem** — Traverse workspace files with `ls`, `cd`, `find`, `cat`, `grep`, etc. via `just-bash`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Monorepo**: Turborepo + pnpm workspaces
- **Database**: PostgreSQL 16 + Drizzle ORM
- **API**: tRPC 11 (end-to-end type safety)
- **Auth**: BetterAuth (email/password, Google OAuth)
- **AI**: Vercel AI SDK for transcription and knowledge base chat
- **UI**: Tailwind CSS 4, Radix UI, Geist fonts, Lucide icons
- **Email**: Resend
- **Testing**: Playwright (E2E)
- **Language**: TypeScript (strict mode)

## Project Structure

```
locker/
├── apps/web/              Next.js web app
│   ├── app/               Pages and API routes
│   ├── components/        Shared UI components
│   ├── features/          Feature modules (files, knowledge-bases)
│   ├── server/            tRPC routers, auth, and plugin system
│   └── lib/               Utilities
├── packages/
│   ├── common/            Shared types, validation, constants
│   ├── database/          Drizzle schema and database client
│   ├── email/             Email templates and sending (Resend)
│   └── storage/           Storage provider adapters
├── services/
│   ├── fts/               Full-text search microservice (SQLite FTS5)
│   └── qmd/              Semantic search microservice
├── e2e/                   Playwright end-to-end tests
├── docker-compose.yml     PostgreSQL + optional search services
└── turbo.json             Build pipeline
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (for PostgreSQL)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development. Edit `.env` to change the storage provider or add OAuth credentials.

### 4. Run database migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start uploading files.

## Self-Hosting Guide

Locker auto-detects which platform it's running on and adjusts its capabilities accordingly. Persistent runtimes (Docker, Fly.io, Railway) support all features. Serverless runtimes (Vercel) disable long-running operations like store sync and bulk KB ingestion.

### Requirements

Every deployment needs:

- **PostgreSQL 16+** — the primary database
- **`BETTER_AUTH_SECRET`** — generate with `openssl rand -base64 32`
- **`NEXT_PUBLIC_APP_URL`** — the public URL of your deployment
- **A storage provider** — local filesystem (persistent runtimes only) or a cloud provider (S3, R2, Vercel Blob)

### Docker Compose (recommended)

The included `docker-compose.yml` bundles PostgreSQL, migrations, and the web app. This is the fastest way to self-host.

```bash
# 1. Clone and configure
git clone https://github.com/zmeyer44/Locker.git && cd Locker
cp .env.example .env

# 2. Set the required secret
#    Replace the placeholder in .env or export it:
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# 3. Start everything
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). Files are stored on a Docker volume (`blob_data`) by default.

To use S3 or R2 instead of local storage, set `BLOB_STORAGE_PROVIDER` and the matching credentials in your `.env` before starting.

To enable optional search services:

```bash
docker compose --profile search up -d
```

### Railway

Railway provides managed PostgreSQL and persistent disk, so all features work out of the box.

1. Create a new project and add a **PostgreSQL** service. Copy the `DATABASE_URL`.
2. Add a new service from the Locker repo. Railway will detect the `Dockerfile` automatically.
3. Set these environment variables on the web service:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The PostgreSQL connection string from step 1 |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | Your Railway public URL (e.g. `https://locker-production.up.railway.app`) |
   | `NEXT_PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
   | `BLOB_STORAGE_PROVIDER` | `local` (default) or `s3` / `r2` with matching credentials |

4. If using local storage, attach a **volume** mounted at `/app/local-blobs`.
5. Deploy. Railway runs migrations automatically via the `migrate` service in Docker Compose, or you can add a deploy command: `pnpm db:migrate && node apps/web/server.js`.

### Fly.io

Fly provides persistent VMs with attached volumes.

1. Create a PostgreSQL cluster:

   ```bash
   fly postgres create --name locker-db
   ```

2. Launch the app from the repo root:

   ```bash
   fly launch --dockerfile Dockerfile
   ```

3. Attach the database:

   ```bash
   fly postgres attach locker-db
   ```

4. Create a volume for local storage:

   ```bash
   fly volumes create blob_data --size 10 --region your-region
   ```

   Add to `fly.toml`:

   ```toml
   [mounts]
     source = "blob_data"
     destination = "/app/local-blobs"
   ```

5. Set secrets:

   ```bash
   fly secrets set \
     BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
     BETTER_AUTH_URL=https://your-app.fly.dev \
     NEXT_PUBLIC_APP_URL=https://your-app.fly.dev
   ```

6. Run migrations and deploy:

   ```bash
   fly deploy
   ```

### Render

1. Create a **PostgreSQL** database in Render. Copy the internal connection string.
2. Create a new **Web Service** from the Locker repo. Set the Dockerfile path to `./Dockerfile`.
3. Add a **Disk** mounted at `/app/local-blobs` for local file storage.
4. Set environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
5. Deploy.

### Vercel

Vercel runs Next.js on serverless functions. Locker auto-detects this and disables features that require a persistent runtime:

- Store sync and ingest are disabled
- Bulk KB ingestion is disabled
- Local filesystem storage is unavailable

You must use a cloud storage provider (Vercel Blob, S3, or R2).

1. Import the repo into Vercel.
2. Set the framework preset to **Next.js** and the root directory to `apps/web`.
3. Add a PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.) and set `DATABASE_URL`.
4. Set environment variables:

   | Variable | Value |
   | --- | --- |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | Your Vercel deployment URL |
   | `NEXT_PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
   | `BLOB_STORAGE_PROVIDER` | `vercel` (recommended) or `s3` / `r2` |
   | `BLOB_READ_WRITE_TOKEN` | From Vercel Blob (if using `vercel` provider) |

5. Deploy. Run migrations manually or via a build command: `pnpm db:migrate && pnpm build`.

### Runtime override

Locker detects the hosting platform automatically from environment variables (`VERCEL`, `FLY_REGION`, `RAILWAY_ENVIRONMENT`, etc.). If detection is wrong or you want to test serverless behavior locally, set:

```bash
LOCKER_RUNTIME_ENV=vercel  # or: docker, fly, railway, render, development
```

## Storage

### Platform default

Set `BLOB_STORAGE_PROVIDER` in `.env` to configure the default storage backend for new workspaces:

| Provider         | Value    | Required Env Vars                                                        |
| ---------------- | -------- | ------------------------------------------------------------------------ |
| Local filesystem | `local`  | `LOCAL_BLOB_DIR`                                                         |
| AWS S3           | `s3`     | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`  |
| Cloudflare R2    | `r2`     | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| Vercel Blob      | `vercel` | `BLOB_READ_WRITE_TOKEN`                                                  |

### Multi-store

Workspace admins can attach additional stores from **Settings > Stores**. Each store can be configured as:

- **Writable replica** — files are automatically synced to this store for redundancy
- **Read-only ingest** — Locker scans the store for new files and imports them without moving the originals

Stores use their own credentials (BYOB), so different teams can bring different backends. A primary store is designated per workspace for new uploads; replicas receive copies automatically.

## Plugins

Locker ships with a built-in plugin system. Plugins are installed per-workspace and can add search, transcription, file actions, and more.

| Plugin                  | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| **QMD Search**          | Semantic document search powered by QMD embeddings                          |
| **Full-Text Search**    | Lightweight SQLite FTS5 search — no external service required               |
| **Document Transcription** | AI-powered OCR for images and PDFs, making non-text files searchable     |
| **Google Drive Sync**   | Import files from and export files to Google Drive                          |
| **Knowledge Base**      | Build an AI-powered wiki from tagged documents with chat and graph view     |

### Optional search services

QMD and FTS run as standalone microservices. Enable them with the `search` Docker Compose profile:

```bash
docker compose --profile search up -d
```

## Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `pnpm dev`         | Start all packages in dev mode   |
| `pnpm start`       | Start all packages in production |
| `pnpm build`       | Production build                 |
| `pnpm typecheck`   | Type-check all packages          |
| `pnpm lint`        | Lint all packages                |
| `pnpm db:generate` | Generate a new Drizzle migration |
| `pnpm db:migrate`  | Apply pending migrations         |
| `pnpm db:seed`     | Seed the database                |
| `pnpm format`      | Format code with Prettier        |

## Virtual Filesystem Shell API

Locker includes a read-only virtual filesystem over workspace files/folders, powered by [`just-bash`](https://github.com/vercel-labs/just-bash).

The shell API is available on tRPC router `vfsShell`:

- `vfsShell.createSession({ cwd? })` → create a workspace-scoped shell session
- `vfsShell.exec({ sessionId, command, timeoutMs? })` → run a bash command
- `vfsShell.session({ sessionId })` → get session `cwd` + expiry
- `vfsShell.closeSession({ sessionId })` → close a session

Implementation details:

- Directory tree is bootstrapped from `folders` + `files` and cached in memory.
- File contents are fetched lazily from the configured storage provider and cached.
- All write operations (`rm`, `mv`, redirections, etc.) fail with `EROFS` (read-only filesystem).
- Access is workspace-scoped and enforced by existing workspace membership checks.

## License

MIT
