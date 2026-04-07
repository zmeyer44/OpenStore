# Locker

Open-source file storage platform. A self-hostable alternative to Dropbox and Google Drive.

## Features

- **File Explorer** — Upload, organize, rename, move, and delete files and folders
- **Share Links** — Generate shareable links with optional password protection, expiration, and download limits
- **Upload Links** — Let others upload files to your storage without an account
- **Storage Provider Agnostic** — Swap between Local, AWS S3, Cloudflare R2, or Vercel Blob via a single env var
- **Storage Quotas** — Per-user storage limits with usage tracking
- **Virtual Bash Filesystem (beta)** — Traverse workspace files with `ls`, `cd`, `find`, `cat`, `grep`, etc. via `just-bash`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Monorepo**: Turborepo + pnpm workspaces
- **Database**: PostgreSQL 16 + Drizzle ORM
- **API**: tRPC 11 (end-to-end type safety)
- **Auth**: BetterAuth (email/password, Google OAuth)
- **UI**: Tailwind CSS 4, Radix UI, Geist fonts, Lucide icons
- **Language**: TypeScript (strict mode)

## Project Structure

```
locker/
├── apps/web/              Next.js web app
│   ├── app/               Pages and API routes
│   ├── components/        UI components
│   ├── server/            tRPC routers and auth config
│   └── lib/               Utilities
├── packages/
│   ├── common/            Shared types, validation, constants
│   ├── database/          Drizzle schema and database client
│   └── storage/           Storage provider adapters
├── docker-compose.yml     PostgreSQL
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

## Storage Providers

Set `BLOB_STORAGE_PROVIDER` in `.env`:

| Provider         | Value    | Required Env Vars                                                        |
| ---------------- | -------- | ------------------------------------------------------------------------ |
| Local filesystem | `local`  | `LOCAL_BLOB_DIR`                                                         |
| AWS S3           | `s3`     | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`  |
| Cloudflare R2    | `r2`     | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| Vercel Blob      | `vercel` | `BLOB_READ_WRITE_TOKEN`                                                  |

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
