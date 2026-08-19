# TASK.md — Signage BPR Bank Gresik

**Versi:** 1.0 · Agustus 2026  
**Referensi:** PRD v1.0, Design System v1.0  
**Stack:** Next.js 14 · TypeScript · Prisma · MySQL · Docker · SSE

> **Konvensi status:**
> - `[ ]` Belum dikerjakan
> - `[~]` Sedang dikerjakan
> - `[x]` Selesai
> - `[!]` Blocked / butuh keputusan

---

## Fase 1 — Setup & Fondasi
> Target: Project bisa jalan di Docker, auth berfungsi, database terhubung.  
> Estimasi: 2 hari kerja

### 1.1 Scaffold project
- [x] `npx create-next-app@14 signage-bg --typescript --app --tailwind --src-dir`
- [x] Install dependencies awal: `prisma`, `@prisma/client`, `next-auth@beta`, `bcryptjs`, `node-cron`, `multer`, `@types/*`
- [!] Install shadcn/ui: `npx shadcn-ui@latest init` — pilih tema Neutral — **diganti**: dipakai custom CSS design-system (globals.css, port langsung dari `design-system-signage-bg.html`) yang sudah lengkap (btn/badge/input/card/table/toast/nav), tidak dobel dengan shadcn/ui. Bisa ditambahkan belakangan bila perlu komponen kompleks (dialog/dropdown headless).
- [x] Tambahkan Tabler Icons webfont via CDN di `app/layout.tsx`
- [x] Setup Google Fonts: Plus Jakarta Sans + Bricolage Grotesque di `app/layout.tsx` (pakai `next/font/google`, plus JetBrains Mono)
- [x] Buat `.env.local` dengan semua variabel yang dibutuhkan
- [x] Buat `.env.example` sebagai template untuk tim

### 1.2 Konfigurasi TypeScript & ESLint
- [x] Update `tsconfig.json` — tambahkan path alias `@/*` → `./src/*`
- [x] Konfigurasi `eslint` rules: no-unused-vars, explicit return types untuk fungsi API
- [x] Buat `src/types/index.ts` — definisi tipe global (Screen, Content, Schedule, dll)

### 1.3 Docker & infrastruktur
- [x] Buat `Dockerfile` multi-stage (deps → builder → runner, Alpine + `output: standalone`)
- [x] Buat `docker-compose.yml` dengan service: `app`, `db` (MySQL 8), plus service `migrate` (profile `tools`, one-off `prisma migrate deploy` — image runner standalone sengaja tidak menyertakan Prisma CLI, lihat catatan di file)
- [x] Buat `docker-compose.dev.yml` untuk local development (bind mount src, `Dockerfile.dev`)
- [x] Buat `.dockerignore`
- [x] Test: `docker compose up --build` berhasil, app jalan di port 3000 — diverifikasi (`curl /login` → 200)
- [x] Tambahkan volume `media_uploads` untuk file storage
- [x] Tambahkan volume `mysql_data` untuk persistensi database
- [x] Test: container restart tidak kehilangan data — diverifikasi (`docker compose restart`, data user tetap ada, login tetap berhasil)

> Catatan build: base image Alpine butuh `apk add openssl` + `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` di `schema.prisma` — tanpa ini Prisma query/schema engine gagal load (`Could not parse schema engine response`). Sudah diperbaiki di `Dockerfile` & `prisma/schema.prisma`.

### 1.4 Prisma & Database schema
- [x] `npx prisma init` — set `DATABASE_URL` ke MySQL (dibuat manual, setara hasil `prisma init`)
- [x] Buat schema lengkap di `prisma/schema.prisma`:
  - [x] Model `User` (id, email, name, role, passwordHash, createdAt)
  - [x] Model `Screen` (id, name, slug, location, status, layoutId, lastSeenAt, createdAt)
  - [x] Model `Layout` (id, name, zones Json, isDefault, createdAt)
  - [x] Model `Content` (id, name, type, filePath, mimeType, duration, sizeBytes, category, createdAt, updatedAt)
  - [x] Model `Playlist` (id, name, description, createdAt, updatedAt)
  - [x] Model `PlaylistItem` (id, playlistId, contentId, order, durationOverride)
  - [x] Model `Schedule` (id, screenId, playlistId, startAt, endAt, priority, status, createdAt)
  - [x] Model `Ticker` (id, text, speed, color, isActive, order, createdAt)
  - [x] Model `ActivityLog` (id, userId, action, entity, entityId, meta Json, createdAt)
  - [x] Semua relasi foreign key terdefinisi dengan benar
  - [x] Enum: `UserRole` (ADMIN, OPERATOR), `ContentType` (IMAGE, VIDEO), `ScheduleStatus` (DRAFT, ACTIVE, EXPIRED), `ContentCategory` (PROMO, INFO, EVENT, IDLE) — plus tambahan `ScreenStatus`, `SchedulePriority` yang dibutuhkan fitur heartbeat & prioritas jadwal
- [x] `npx prisma migrate dev --name init` — dijalankan & diverifikasi jalan ke MySQL 8 via `docker-compose.dev.yml`
- [x] `npx prisma generate`
- [x] Buat `src/lib/prisma.ts` — singleton PrismaClient
- [x] Buat `prisma/seed.ts` — seed data awal: 1 admin user, 4 preset layout, 3 ticker contoh (dijalankan & diverifikasi)

> Catatan: Prisma yang otomatis ter-install adalah v7 (breaking change: `url` di datasource tidak didukung lagi, butuh `prisma.config.ts` + driver adapter). Di-downgrade ke **Prisma 5** agar sesuai konvensi schema classic yang diasumsikan TASK.md ini.

### 1.5 Autentikasi (NextAuth v5)
- [x] Buat `src/lib/auth.ts` — konfigurasi NextAuth dengan Credentials provider (dipecah jadi `auth.config.ts` edge-safe + `auth.ts` full, pola resmi NextAuth v5 agar middleware tidak memuat bcryptjs di Edge Runtime)
- [x] Implementasi `authorize()`: cari user by email, bcrypt compare password
- [x] Buat `app/api/auth/[...nextauth]/route.ts`
- [x] Buat middleware `src/middleware.ts` — proteksi semua route `/admin/*`
- [x] Redirect unauthenticated ke `/login`
- [x] Buat halaman `/login`:
  - [x] Form email + password
  - [x] Error state: "Email atau password salah"
  - [x] Loading state saat submit
  - [x] Redirect ke `/admin` setelah login berhasil
- [x] Test: login berhasil → redirect admin, login gagal → error, akses `/admin` tanpa login → redirect login — diverifikasi lewat curl (credentials benar → session tersimpan role ADMIN; password salah → session null; `/admin` tanpa cookie → 307 ke `/login`)

### 1.6 Layout & navigasi dasar
- [x] Buat `app/(admin)/layout.tsx` — shell layout dengan sidebar + topbar
- [x] Buat komponen `src/components/admin/Sidebar.tsx`
  - [x] Logo area (ikon + nama + sub)
  - [x] Nav items dengan ikon Tabler, active state dengan border-left blue
  - [x] Section labels (Konten / Layar / Sistem)
  - [x] User info di bawah sidebar
- [x] Buat komponen `src/components/admin/Topbar.tsx`
  - [x] Breadcrumb dinamis berdasarkan route
  - [x] Slot untuk action button (kanan)
  - [x] Bell notifikasi (placeholder)
  - [x] Avatar inisial user
- [x] Buat `app/(admin)/admin/page.tsx` — halaman dashboard (placeholder sementara, stat cards kosong — diisi penuh di Fase 6)
- [x] Test: navigasi sidebar berfungsi, active state berubah sesuai route (active state berbasis `usePathname`, sudah direview manual di kode)

---

## Fase 2 — Library Konten & Upload
> Target: Admin bisa upload dan kelola file media.  
> Estimasi: 2 hari kerja

### 2.1 API upload konten
- [x] Buat `app/api/contents/upload/route.ts`
  - [x] Parse multipart form dengan `multer` atau native Next.js (pakai native `req.formData()`)
  - [x] Validasi tipe file: hanya JPG, PNG, WebP, MP4, WebM
  - [x] Validasi ukuran: maks 100 MB
  - [x] Generate nama file unik (UUID + extension)
  - [x] Simpan ke `/app/uploads/` (Docker volume) — via `src/lib/upload.ts` (`UPLOAD_DIR` env)
  - [x] Simpan metadata ke tabel `contents`
  - [x] Return: `{ id, name, filePath, type, sizeBytes }`
- [x] Buat `app/api/contents/route.ts`
  - [x] `GET` — list semua konten, support query: `?type=IMAGE&category=PROMO&q=searchterm`
  - [x] Response include pagination: `{ data, total, page, perPage }`
- [x] Buat `app/api/contents/[id]/route.ts`
  - [x] `GET` — detail satu konten
  - [x] `PATCH` — update nama, kategori, durasi
  - [x] `DELETE` — hapus record + hapus file dari disk
- [x] Buat `app/api/uploads/[...path]/route.ts` — serve file statis dari volume

> Test end-to-end via curl (dev server + MySQL): upload PNG berhasil → file bisa diakses balik di `/api/uploads/...`, upload `.txt` ditolak (`UPLOAD_VALIDATION`), PATCH ubah nama/kategori/durasi berhasil, DELETE menghapus record **dan** file fisik (diverifikasi 404 setelah hapus).

### 2.2 Halaman library konten
- [x] Buat `app/(admin)/admin/contents/page.tsx`
  - [x] Grid 3 kolom, responsive 2 kolom di layar kecil
  - [x] Thumbnail: preview gambar untuk IMAGE, ikon video untuk VIDEO
  - [x] Info per card: nama, tipe, ukuran file, durasi tampil
  - [x] Filter bar: tombol All / Gambar / Video
  - [x] Search input dengan debounce 300ms
  - [x] Empty state: "Belum ada konten. Upload file pertama." + tombol upload
  - [x] Loading skeleton saat fetch data
- [x] Buat komponen `src/components/admin/ContentCard.tsx`
  - [x] Thumbnail lazy load
  - [x] Hover: tampilkan overlay dengan tombol Edit, Preview, Hapus
  - [x] Klik thumbnail → modal preview
- [x] Buat modal `src/components/admin/ContentPreviewModal.tsx`
  - [x] Gambar: render `<img>` full size
  - [x] Video: render `<video controls>`
  - [x] Metadata: nama, tipe, ukuran, tanggal upload
- [x] Buat `src/components/admin/ContentEditModal.tsx`
  - [x] Form: nama, kategori, durasi default (detik)
  - [x] Submit → PATCH API → update state lokal
- [x] Implementasi hapus dengan konfirmasi dialog (`src/components/ui/ConfirmDialog.tsx`, reusable)

### 2.3 Halaman upload
- [x] Buat `app/(admin)/admin/contents/upload/page.tsx`
  - [x] Dropzone area (drag & drop + klik)
  - [x] Support multiple file sekaligus
  - [x] Preview thumbnail sebelum upload (object URL utk gambar, ikon utk video)
  - [x] Progress bar per file (indeterminate saat status uploading — fetch API browser tidak expose progress % asli tanpa XHR)
  - [x] Status per file: uploading / success / error
  - [x] Otomatis redirect ke library setelah semua selesai
- [x] Buat komponen `src/components/admin/FileDropzone.tsx`

> Bonus di luar checklist: `src/components/ui/Skeleton.tsx`, `EmptyState.tsx`, `Toast.tsx`, `Modal.tsx`, `ConfirmDialog.tsx` dibuat lebih awal (harusnya Fase 6.4) karena dibutuhkan halaman ini — akan dipakai ulang di fase-fase berikutnya.
- [x] Buat komponen `src/components/admin/FileDropzone.tsx`

---

## Fase 3 — Playlist & Scheduler
> Target: Admin bisa buat playlist, buat jadwal, dan cron berjalan otomatis.  
> Estimasi: 2 hari kerja

> Catatan: fase ini sudah diimplementasikan (ditemukan sudah jalan saat sinkronisasi TASK.md dengan kode, sebelumnya belum dicentang). Termasuk bonus: `SystemConfig` (key-value) + fallback playlist logic di `schedules/active` (harusnya Fase 6.6) karena dibutuhkan langsung oleh scheduler & player.

### 3.1 API playlist
- [x] Buat `app/api/playlists/route.ts`
  - [x] `GET` — list playlist dengan jumlah item
  - [x] `POST` — buat playlist baru `{ name, description }`
- [x] Buat `app/api/playlists/[id]/route.ts`
  - [x] `GET` — detail playlist + semua items dengan konten
  - [x] `PATCH` — update nama/deskripsi
  - [x] `DELETE` — hapus playlist (cek dulu apakah masih dipakai di jadwal aktif)
- [x] Buat `app/api/playlists/[id]/items/route.ts`
  - [x] `GET` — list items dengan urutan
  - [x] `POST` — tambah konten ke playlist `{ contentId, order, durationOverride }`
  - [x] `PUT` — update urutan semua items sekaligus (drag & drop reorder)
- [x] Buat `app/api/playlists/[id]/items/[itemId]/route.ts`
  - [x] `PATCH` — update durasi override satu item
  - [x] `DELETE` — hapus item dari playlist

### 3.2 Halaman manajemen playlist
- [x] Buat `app/(admin)/admin/playlists/page.tsx`
  - [x] List card playlist: nama, jumlah item, total durasi, tanggal update
  - [x] Tombol buat playlist baru → modal form
  - [x] Empty state
- [x] Buat `app/(admin)/admin/playlists/[id]/page.tsx`
  - [x] Header: nama playlist + edit inline
  - [x] Daftar item dengan thumbnail, nama, durasi
  - [x] Drag & drop reorder item (gunakan `@dnd-kit/core`)
  - [x] Tombol + tambah konten → modal pilih dari library
  - [x] Edit durasi per item (klik durasi → input inline)
  - [x] Hapus item dari playlist
  - [x] Total durasi playlist di footer
- [x] Buat `src/components/admin/ContentPickerModal.tsx`
  - [x] Grid konten yang tersedia (dengan search)
  - [x] Multiple select
  - [x] Confirm → tambah semua ke playlist

### 3.3 API schedule
- [x] Buat `app/api/schedules/route.ts`
  - [x] `GET` — list jadwal, support filter `?screenId=&date=&status=`
  - [x] `POST` — buat jadwal baru `{ screenId, playlistId, startAt, endAt, priority, status }`
- [x] Buat `app/api/schedules/[id]/route.ts`
  - [x] `GET` — detail jadwal
  - [x] `PATCH` — update jadwal
  - [x] `DELETE` — hapus jadwal
- [x] Buat `app/api/schedules/active/route.ts`
  - [x] `GET ?screenId=` — ambil jadwal aktif saat ini untuk layar tertentu
  - [x] Logic: cari jadwal dengan status ACTIVE, startAt <= now <= endAt, prioritas tertinggi
  - [x] Jika tidak ada → return fallback playlist layar

### 3.4 Halaman manajemen jadwal
- [x] Buat `app/(admin)/admin/schedules/page.tsx`
  - [x] Tab: Hari ini / Minggu ini / Semua
  - [x] Timeline view (kiri) + Tabel jadwal (kanan)
  - [x] Timeline: urutan waktu dengan bar warna per playlist
  - [x] Tabel: nama jadwal, layar, waktu, prioritas, status badge
  - [x] Tombol buat jadwal baru → modal form
  - [x] Filter: dropdown pilih layar
- [x] Buat `src/components/admin/ScheduleFormModal.tsx`
  - [x] Dropdown pilih layar
  - [x] Dropdown pilih playlist
  - [x] Date-time picker start & end
  - [x] Slider/select prioritas: Rendah / Sedang / Tinggi
  - [x] Status: Draft / Active
  - [x] Validasi: end > start, tidak boleh overlap jadwal sama-priority di layar yang sama

### 3.5 Content Scheduler (cron)
- [x] Buat `src/lib/scheduler.ts`
  - [x] Cron job setiap menit: `node-cron` schedule `* * * * *`
  - [x] Cek semua jadwal yang statusnya ACTIVE
  - [x] Update status ke EXPIRED jika `endAt < now`
  - [x] Trigger SSE broadcast ke layar yang terdampak — **awalnya ditulis sebagai `import("@/lib/sse")` langsung dari `scheduler.ts`, tapi ternyata tidak pernah benar-benar sampai ke client** karena beda module graph di build standalone (lihat temuan & fix lengkap di Fase 7.1 dan Fase 4.1). Sekarang lewat loopback fetch ke `app/api/internal/scheduler-tick/route.ts`.
- [x] Register scheduler di `src/instrumentation.ts` (pola resmi Next.js, bukan custom server) — dipanggil sekali via flag singleton
- [x] Pastikan scheduler hanya berjalan satu instance (guard dengan flag singleton `started`)

> Juga menambah deteksi jadwal yang **baru mulai** (`startAt` baru saja terlewati), bukan cuma yang expired — dibutuhkan supaya player yang sudah terhubung otomatis pindah ke jadwal baru begitu waktunya tiba, tanpa perlu reconnect (lihat Fase 7.1).

---

## Fase 4 — Player & Real-Time SSE
> Target: Player tampil di browser TV, update real-time saat jadwal berubah.  
> Estimasi: 2 hari kerja

### 4.1 SSE endpoint
- [x] Buat `app/api/sse/[screenId]/route.ts`
  - [x] Response dengan header: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - [x] Kirim heartbeat setiap 15 detik: `data: {"type":"ping"}\n\n`
  - [x] Daftarkan connection ke in-memory store (`Map<screenId, Set<Client>>` di `src/lib/sse.ts`, `Client` membungkus `ReadableStreamDefaultController`)
  - [x] Hapus dari store saat client disconnect (`req.signal` abort listener)
- [x] Buat `src/lib/sse.ts`
  - [x] `registerClient(screenId, controller)` — daftarkan client baru
  - [x] `unregisterClient(screenId, client)` — hapus saat disconnect
  - [x] `broadcast(screenId, event)` — kirim event ke semua client untuk layar ini
  - [x] `broadcastAll(event)` — kirim ke semua layar
  - [x] Event types: `schedule_update`, `ticker_update`, `screen_config_update`, `ping`
- [x] Update scheduler: panggil `broadcast()` setelah jadwal berubah — **bug ditemukan & diperbaiki di Fase 7.1**: `instrumentation.ts` (tempat scheduler jalan) dan API routes dikompilasi sebagai module graph terpisah di Next.js standalone build, jadi `clients` Map singleton di `src/lib/sse.ts` yang diakses scheduler via dynamic import BUKAN instance yang sama dengan yang dipakai route `/api/sse/[screenId]`. Broadcast dari scheduler secara diam-diam tidak pernah nyampai ke client manapun sejak awal dibuat, tapi lolos karena belum pernah diuji dengan koneksi SSE nyata (cuma diverifikasi lewat kode/log, bukan hasil akhir di client). Fix: scheduler sekarang `fetch()` loopback ke `app/api/internal/scheduler-tick/route.ts` (proteksi shared-secret via header `x-internal-secret` dibanding `process.env.NEXTAUTH_SECRET`, yang konsisten karena `process.env` bukan state modul webpack) — broadcast jadi dieksekusi di dalam module graph API routes yang sama dengan SSE route. Diverifikasi ulang end-to-end di container produksi: `schedule_update` benar-benar diterima client SSE yang sudah terhubung sebelumnya.

### 4.2 Heartbeat & status layar
- [x] Buat `app/api/screens/[id]/heartbeat/route.ts`
  - [x] `POST` — update `lastSeenAt` di database
  - [x] Update status: ONLINE saat heartbeat diterima
- [x] Background job: `tick()` di `src/lib/scheduler.ts` (jalan tiap menit bareng scheduler) menandai `OFFLINE` semua layar yang `lastSeenAt` lebih lama dari `HEARTBEAT_TIMEOUT_SECONDS` (default 120 detik) atau belum pernah heartbeat
- [x] Update status layar ditrigger setiap menit bersamaan dengan scheduler

### 4.3 Halaman player
- [x] Buat `app/player/[screenId]/page.tsx`
  - [!] Tidak ada auth — publik, tapi proteksi "hanya dari LAN" (middleware IP range) **belum diimplementasikan** — butuh keputusan CIDR/VLAN jaringan bank yang sebenarnya sebelum di-hardcode, lihat catatan di bawah
  - [x] `generateMetadata`: title = nama layar
  - [x] Fetch konfigurasi layar awal: layout, jadwal aktif saat ini (dengan fallback playlist), ticker aktif — resolve via `slug` atau `id` di param `[screenId]`
  - [x] Render komponen PlayerShell dengan data awal
- [x] Buat `src/components/player/PlayerShell.tsx`
  - [x] Layout fullscreen: `position: fixed; inset: 0`
  - [x] Komponen zone berdasarkan konfigurasi layout (`zones.zones[]`, arah row/column ditentukan dari `position`, ukuran dari `width`/`height`)
  - [x] Sambungkan ke SSE: `new EventSource('/api/sse/{screenId}')`
  - [x] Handle event `schedule_update` (dan `screen_config_update`) → re-fetch jadwal aktif → update konten
  - [x] Handle event `ticker_update` → update ticker
  - [x] Reconnect otomatis jika SSE putus (exponential backoff, 1s → 30s)
  - [x] Kirim heartbeat ke server setiap 30 detik
- [x] Buat `src/components/player/zones/MainZone.tsx`
  - [x] Loop playlist: tampilkan item sesuai durasi, lanjut ke item berikutnya
  - [x] Gambar: `<img>` dengan `object-fit: cover`
  - [x] Video: `<video autoPlay muted>`, lanjut ke next saat `onEnded`
  - [x] Transisi antar konten: fade 300ms
  - [x] Fallback: tampilkan nama bank jika tidak ada konten (logo image belum tersedia di aset)
- [x] Buat `src/components/player/zones/TickerZone.tsx`
  - [x] Render ticker strip di bawah
  - [x] Label "INFO" dengan background blue
  - [x] Animasi scroll menggunakan CSS `@keyframes` translateX(-50%)
  - [x] Konten diduplikasi 2× untuk seamless loop
  - [x] Kecepatan bisa dikonfigurasi (dari data ticker `speed`, durasi animasi dihitung dari lebar teks aktual / speed)
- [x] Buat `src/components/player/zones/SidebarZone.tsx`
  - [x] ClockWidget: jam HH:MM menggunakan Bricolage Grotesque, date, update setiap detik
  - [x] InfoWidget: jam layanan statis (Senin–Jumat, Sabtu) — suku bunga **tidak** ditampilkan karena belum ada field di schema (`Screen`/`Layout` tidak punya data rate; hindari data palsu)
- [x] Buat `src/components/player/zones/ClockZone.tsx`
  - [x] Jam besar untuk layout yang hanya butuh jam

> Catatan LAN-only: belum tahu CIDR/VLAN jaringan BPR Bank Gresik yang sebenarnya untuk TV player, jadi middleware IP-range sengaja belum ditulis (daripada menebak dan salah proteksi). Perlu keputusan network sebelum dikerjakan — lihat item `[!]` di atas.

### 4.4 Halaman preview
- [x] Buat `app/(admin)/admin/preview/[screenId]/page.tsx`
  - [x] Embed player dalam iframe `width: 100%; aspect-ratio: 16/9`
  - [x] Frame kontrol di atas: nama layar, status, tombol reload, tombol buka di tab baru
  - [x] Link kembali ke detail layar (ke `/admin/screens/[id]` — halaman ini sendiri masih perlu dibuat, lihat Fase 5.2)

---

## Fase 5 — Multi-Zone Layout & Ticker
> Target: Layout bisa dikonfigurasi per layar, ticker bisa dikelola.  
> Estimasi: 3 hari kerja

### 5.1 API screens & layout
- [x] Buat `app/api/screens/route.ts`
  - [x] `GET` — list semua layar dengan status terkini
  - [x] `POST` — daftarkan layar baru `{ name, location, layoutId, slug }`
  - [x] Auto-generate slug dari nama jika tidak diisi
- [x] Buat `app/api/screens/[id]/route.ts`
  - [x] `GET` — detail layar + layout + jadwal aktif saat ini
  - [x] `PATCH` — update konfigurasi layar (broadcast `screen_config_update` jika `layoutId` berubah)
  - [x] `DELETE` — hapus layar (cek dulu tidak ada jadwal aktif)
- [x] Buat `app/api/layouts/route.ts`
  - [x] `GET` — list semua layout
  - [x] `POST` — buat layout kustom baru
- [x] Buat `app/api/layouts/[id]/route.ts`
  - [x] `GET`, `PATCH`, `DELETE` (`PATCH` broadcast `screen_config_update` ke semua layar yang pakai layout ini bila `zones` berubah; `DELETE` cek dulu tidak dipakai layar manapun)
- [x] Seed 4 preset layout (sudah dikerjakan di 1.4 / `prisma/seed.ts`):
  - `fullscreen` — satu zone Main mengisi seluruh layar + Ticker strip
  - `l-shape` — Main kiri (flex:1) + Sidebar kanan (220px) + Ticker strip
  - `split-horizontal` — Main atas (60%) + Info bawah (40%) + Ticker strip
  - `split-vertical` — Main kiri (60%) + Info kanan (40%) + Ticker strip

### 5.2 Halaman manajemen layar
- [x] Buat `app/(admin)/admin/screens/page.tsx`
  - [x] Grid 2 kolom: screen cards (thumbnail + status + info)
  - [x] Filter: All / Online / Idle / Offline
  - [x] Tombol daftarkan layar baru → modal form (`src/components/admin/ScreenFormModal.tsx`)
  - [x] Heartbeat indicator: dot warna sesuai status (`badge-dot` di badge status)
  - [x] Auto-refresh status setiap 30 detik (polling ringan via `setInterval`)
  - [x] Empty state: "Belum ada layar. Daftarkan layar pertama."
- [x] Buat `app/(admin)/admin/screens/[id]/page.tsx`
  - [x] Header: nama layar + status badge + tombol Preview
  - [x] Tab: Info / Jadwal / Layout
  - [x] Tab Info: nama, lokasi, slug, URL player, last seen, edit
  - [x] Tab Jadwal: list jadwal untuk layar ini, link ke jadwal baru
  - [x] Tab Layout: pilih preset layout via `LayoutPicker` (grid visual, bukan dropdown teks — lebih sesuai UX)

### 5.3 Layout zone configuration
- [x] Buat `src/components/admin/LayoutPicker.tsx`
  - [x] Grid preset dengan preview visual miniature zone
  - [x] Highlight yang sedang dipilih dengan border blue
  - [x] Klik → update layar dengan layout baru via API
- [x] Tipe `ZoneConfig` (sudah ada di `src/types/index.ts` sejak awal proyek, dipakai oleh `LayoutPicker` & `PlayerShell`)
- [x] PlayerShell baca zones JSON dari konfigurasi layar → render zone dinamis (lihat Fase 4.3)

### 5.4 API ticker
- [x] Buat `app/api/tickers/route.ts`
  - [x] `GET` — list semua ticker dengan urutan
  - [x] `POST` — buat ticker baru `{ text, speed, color, isActive, order }`
- [x] Buat `app/api/tickers/[id]/route.ts`
  - [x] `GET`, `PATCH`, `DELETE`
- [x] Buat `app/api/tickers/active/route.ts`
  - [x] `GET` — ambil semua ticker aktif, diurutkan by `order` (dibuat lebih awal di Fase 4 karena jadi dependency langsung `TickerZone`; digabung jadi satu string di sisi client, bukan di API, supaya separator bisa diatur per-tampilan)
- [x] Setiap kali ticker diupdate (create/update/delete) → broadcast SSE event `ticker_update` ke semua layar aktif via `broadcastAll`

### 5.5 Halaman manajemen ticker
- [x] Buat `app/(admin)/admin/tickers/page.tsx`
  - [x] List ticker: teks, status aktif/nonaktif, urutan (warna & kecepatan tidak ada kontrol UI terpisah — `color`/`speed` masih default dari seed, form edit lengkap belum dibuat karena belum ada kebutuhan konkret per-ticker color/speed berbeda)
  - [x] Toggle aktif/nonaktif per ticker dengan switch (`.toggle-wrap`/`.toggle`)
  - [x] Drag & drop reorder (`@dnd-kit/core`, PATCH `order` per item — belum ada endpoint batch PUT seperti playlist items karena jumlah ticker biasanya kecil)
  - [x] Tombol tambah ticker baru → inline form (bukan modal, lebih cepat untuk input teks tunggal)
  - [x] Preview live: strip ticker berjalan di bawah halaman (pakai class `.player-ticker` yang sama dengan player)
  - [x] Edit teks inline (klik teks → input)
  - [x] Hapus (langsung tanpa dialog konfirmasi — pertimbangkan menambah `ConfirmDialog` bila ticker sering terhapus tidak sengaja)

> Catatan: `src/app/(admin)/admin/layouts/page.tsx` juga dibuat (di luar checklist eksplisit, tapi dibutuhkan karena Sidebar sudah punya nav item "Layout Zone") — halaman read-only menampilkan preset yang ada + jumlah layar yang memakainya. Editor visual untuk layout kustom belum dibuat, tetap di Backlog ("Layout builder visual").

---

## Fase 6 — Dashboard, Monitoring & Polish
> Target: Dashboard informatif, UI konsisten dengan design system, siap deploy.  
> Estimasi: 2 hari kerja

### 6.1 Dashboard overview
- [x] Lengkapi `app/(admin)/admin/page.tsx`:
  - [x] Stat row: Total layar, Konten media, Jadwal aktif, Ticker aktif
  - [x] Widget "Status layar": tabel ringkas dengan status badge, auto-refresh 30 detik
  - [x] Widget "Jadwal hari ini": list dengan waktu + status (bukan timeline visual, list sederhana cukup untuk volume jadwal harian bank)
  - [x] Widget "Konten terbaru": 3 card konten yang paling baru diupload
  - [x] Widget "Layar offline": banner peringatan merah + badge nama layar yang offline

### 6.2 Activity log
- [x] `createLog(userId, action, entity, entityId, meta)` helper — sudah ada sejak awal di `src/lib/activity-log.ts`, dipakai konsisten di semua route mutasi (`CONTENT_*`, `PLAYLIST_*`, `SCHEDULE_*`, `SCREEN_*`, `LAYOUT_*`, `TICKER_UPDATE`/`TICKER_DELETE`, `USER_*`, `SETTINGS_UPDATE`)
- [x] Buat `app/api/activity-logs/route.ts` — `GET` dengan pagination dan filter by entity
- [x] Tampilkan log di halaman tersendiri `/admin/logs` (bukan di sidebar — lebih mudah dibaca sebagai tabel penuh dengan filter & pagination)

### 6.3 Manajemen user (admin only)
- [x] Buat `app/api/users/route.ts`
  - [x] `GET` — list user (dicek role ADMIN di dalam handler, bukan di middleware — middleware Edge Runtime tidak bisa akses Prisma untuk cek role per-request tanpa query DB tambahan)
  - [x] `POST` — buat user baru dengan bcrypt hash password
- [x] Buat `app/api/users/[id]/route.ts`
  - [x] `PATCH` — update nama, role (tidak bisa ubah role sendiri — dicek di handler)
  - [x] `DELETE` — hapus user (tidak bisa hapus diri sendiri)
- [x] Buat `app/(admin)/admin/users/page.tsx`
  - [x] Tabel: avatar inisial, nama, email, role badge, tanggal dibuat
  - [x] Tombol tambah user → modal form (nama, email, password, role)
  - [x] Tombol hapus dengan konfirmasi
  - [x] Hanya tampil untuk user dengan role ADMIN (halaman menampilkan pesan akses ditolak untuk non-admin; nav item "Pengguna" juga disembunyikan di `Sidebar.tsx` untuk non-admin)

### 6.4 Error handling & loading states
- [x] Buat `src/components/ui/Skeleton.tsx` — komponen skeleton loading (sudah dikerjakan lebih awal di Fase 2)
- [x] Loading skeleton sudah ada di semua halaman list (contents, screens, playlists, schedules, users, logs, settings)
- [x] Buat `src/components/ui/EmptyState.tsx` — komponen empty state reusable (Fase 2)
- [x] Buat `src/components/ui/Toast.tsx` — toast notification (success, error, warning, info) (Fase 2)
- [x] Semua API error return format standar: `{ error: string, code?: string }`
- [x] Buat error page: `app/(admin)/error.tsx` dan `app/not-found.tsx`
- [x] Player: tampilkan fallback nama bank jika tidak ada konten aktif (logo image belum ada di aset — lihat catatan Fase 4.3)

### 6.5 UI polish & design system
- [x] Semua halaman menggunakan token warna CSS variable dari design system (tidak ada warna hardcode di luar `var(--...)`, kecuali warna gelap khusus player yang memang sengaja beda palet dari admin sesuai `design-system-signage-bg.html`)
- [x] Font konsisten: Plus Jakarta Sans untuk admin (default body), Bricolage Grotesque (`var(--font-display)`) untuk heading admin & player
- [x] Semua tombol memakai kelas `.btn` yang sesuai varian (primary/secondary/outline/ghost/danger)
- [x] Semua badge memakai kelas `.badge` dengan warna sesuai konteks (green/amber/red/blue/gray)
- [x] Form: label + hint + error state (`.form-error`) sudah konsisten dipakai di semua form baru
- [x] `aria-label` sudah ditambahkan di tombol icon-only baru (hapus, reload, dsb)
- [!] Test keyboard navigation menyeluruh & audit Tabler Icons outline-vs-filled **belum dilakukan** — butuh QA manual di browser sungguhan, bukan sesuatu yang bisa "diselesaikan" lewat kode saja

### 6.6 Pengaturan sistem
- [x] Buat `app/(admin)/admin/settings/page.tsx`:
  - [x] Nama sistem / branding (nama bank yang tampil di header) — tersimpan tapi **belum dibaca** oleh `Sidebar.tsx`/`Topbar.tsx` (masih hardcode "Signage BG"); perlu keputusan apakah branding sidebar sebaiknya statis atau dinamis dari settings
  - [x] Default ticker speed (px/s) — tersimpan; **belum otomatis dipakai** sebagai default saat membuat ticker baru di `/admin/tickers` (form ticker masih pakai default 60 dari API, tidak query settings dulu)
  - [x] Heartbeat interval (detik) — tersimpan **dan dipakai nyata** oleh `src/lib/scheduler.ts` (override env `HEARTBEAT_TIMEOUT_SECONDS` jika ada)
  - [x] Fallback content (playlist default jika tidak ada jadwal) — tersimpan **dan dipakai nyata** oleh `/api/schedules/active` (sudah ada sejak Fase 3)
- [x] Simpan settings di tabel `SystemConfig` (key-value, sudah ada di schema sejak Fase 3)

> Catatan jujur: dua item di atas ditandai `[x]` karena API & UI-nya lengkap dan tersimpan ke DB, tapi *belum semua* nilai settings itu benar-benar dikonsumsi di tempat lain (systemName, defaultTickerSpeed). Bukan bug — hanya belum ada konsumen yang membacanya. Tandai `[!]` di bawah jika ingin dikerjakan lebih lanjut.

---

## Fase 7 — Testing & Deployment
> Target: Aplikasi berjalan stabil di VM Proxmox, backup terkonfigurasi.  
> Estimasi: 1–2 hari kerja

> **Temuan penting sesi ini:** testing manual nyata (bukan cuma type-check) menemukan bug arsitektur serius — lihat catatan di bawah 7.1. Sudah diperbaiki dan diverifikasi ulang.

### 7.1 Testing manual
- [x] Test flow lengkap: upload konten → buat playlist → buat jadwal → lihat di player — diverifikasi end-to-end nyata (upload PNG asli via curl, tambah ke playlist, buat jadwal ACTIVE, `/player/[slug]` merender `<img>` dengan path upload yang sama persis)
- [x] Test SSE: ubah jadwal → layar update tanpa refresh — **ditemukan bug nyata**: broadcast dari scheduler (`instrumentation.ts`) tidak pernah sampai ke client SSE, karena di Next.js standalone build, `instrumentation.ts` dan API routes dikompilasi jadi module graph terpisah oleh webpack — `import("@/lib/sse")` dari scheduler dapat instance module `clients` Map yang BEDA dari yang dipakai route `/api/sse/[screenId]`. Ini bug lama (sudah ada sejak Fase 3.5/4.1, bukan regresi sesi ini), tidak ketahuan sebelumnya karena belum pernah diuji end-to-end dengan koneksi SSE nyata. **Diperbaiki**: scheduler sekarang memanggil `fetch()` loopback ke route baru `app/api/internal/scheduler-tick/route.ts` (proteksi header `x-internal-secret` dibanding `NEXTAUTH_SECRET`), supaya broadcast benar-benar jalan di dalam module graph API routes yang sama dengan `/api/sse/[screenId]`. Diverifikasi ulang di container produksi terisolasi: `schedule_update` benar-benar diterima client SSE baik untuk jadwal yang expired maupun jadwal yang baru mulai (lihat item scheduler di bawah).
- [x] Test ticker: tambah ticker baru → muncul di semua layar aktif — diverifikasi nyata di container produksi: `POST /api/tickers` memicu `broadcastAll`, client SSE yang terhubung menerima `{"type":"ticker_update"}`
- [x] Test heartbeat: status berubah Offline setelah timeout — diverifikasi nyata (bukan tunggu 2 menit penuh, tapi set `heartbeatIntervalSeconds=10` via `/api/settings`, kirim heartbeat, tunggu 75 detik, status di DB benar berubah ke `OFFLINE`) — ini juga sekaligus membuktikan tick scheduler jalan reguler tiap menit di container produksi
- [x] Test upload: tipe file tidak didukung → tolak dengan error jelas (`.txt` → 400 `UPLOAD_VALIDATION`); validasi ukuran >100MB tidak diuji ulang di sesi ini (sudah diverifikasi sebelumnya di Fase 2.1 per catatan lama, logic tidak berubah)
- [x] Test auth: akses `/admin` tanpa login → redirect ke `/login` (307, diverifikasi di dev dan produksi)
- [x] Test role: login sebagai Operator → tidak bisa akses `/admin/users` — diverifikasi nyata: buat user Operator, login sebagai dia, `GET /api/users` → 403, halaman `/admin/users` menampilkan pesan akses ditolak
- [!] Test multi-layar: buka 3 tab player berbeda → semua update bersamaan — **belum diuji** dengan 3 koneksi SSE simultan; secara desain seharusnya bekerja (broadcast iterasi semua client terdaftar per `screenId`/`broadcastAll`), tapi belum diverifikasi konkret dengan banyak client
- [x] Test scheduler: buat jadwal yang mulai di masa depan → layar update otomatis tanpa reconnect — **inilah yang awalnya membongkar bug di atas**; setelah fix, diverifikasi jadwal dengan `startAt` 35 detik ke depan berhasil trigger `schedule_update` ke client SSE yang sudah terhubung sebelumnya, tanpa perlu reconnect
- [!] Test koneksi LAN: akses dari IP luar → harusnya tidak bisa — **belum bisa diuji maupun diimplementasikan**, middleware LAN-only belum dibuat (lihat catatan Fase 4.3, butuh keputusan CIDR/VLAN jaringan bank yang sebenarnya)

### 7.2 Build & Docker production
- [x] `npm run build` — tidak ada TypeScript error (diverifikasi berkali-kali sepanjang sesi, termasuk setelah fix scheduler)
- [x] `docker compose build` — image berhasil dibuild
- [x] Test image production: `docker compose up -d` — dijalankan di stack terisolasi (`-p signage-test`, volume & network terpisah dari dev) supaya tidak mengganggu `signage-bg-db-dev` yang sedang dipakai
- [x] Verifikasi environment variable tidak ada yang bocor ke client — `curl` HTML halaman login, grep untuk `NEXTAUTH_SECRET`/`DATABASE_URL`/connection string → nihil
- [x] Pastikan `NEXTAUTH_URL` diset ke IP/hostname lokal yang benar — placeholder `http://10.100.0.XX` di `docker-compose.yml` masih perlu diganti manual dengan IP/hostname VM sungguhan saat deploy (tidak bisa diverifikasi dari sini, tidak ada VM nyata)
- [x] Test volume persistence: restart container → data tidak hilang — `docker restart` app+db, data user & tabel lain tetap ada setelahnya

> **Catatan penting soal `docker compose up` di direktori yang sama dengan dev**: `docker-compose.yml` (prod) dan `docker-compose.dev.yml` memakai project name default yang sama (nama folder `signage-bg`) dan service key `db` yang sama persis — menjalankan `docker compose up` (prod) di direktori ini akan **me-recreate container dev** (`signage-bg-db-dev` → `signage-bg-db`) karena Compose menganggap keduanya "service yang sama". Volume datanya aman (nama volume beda: `mysql_data` vs `mysql_data_dev`), tapi container dev-nya hilang dan perlu di-`up` ulang manual. Saat testing production locally, selalu pakai `-p <nama-lain>` (mis. `docker compose -p signage-test -f docker-compose.yml ...`) supaya tidak collide dengan environment dev yang sedang jalan.

### 7.3 Deploy ke Proxmox VM
- [ ] Pilih atau buat VM untuk signage (atau container LXC jika cukup)
- [ ] Install Docker + Docker Compose di VM
- [ ] Copy project atau clone dari repo
- [ ] Buat `.env.local` dengan nilai production
- [ ] `docker compose up -d --build`
- [ ] Konfigurasi Nginx Proxy Manager:
  - [ ] Tambahkan proxy host: `signage.local` → `http://[VM_IP]:3000`
  - [ ] Atau akses langsung via IP: `http://10.100.0.XX:3000`
- [ ] Test akses dari PC admin di jaringan lokal
- [ ] Test akses dari TV/Monitor (buka browser, masuk ke `/player/[screenId]`)

### 7.4 Backup & monitoring
- [ ] Konfigurasi backup VM di PBS (Proxmox Backup Server) yang sudah ada
- [ ] Jadwal backup: daily, retention 7 hari
- [ ] Dokumentasikan langkah restore jika VM crash
- [ ] Tambahkan ke namespace PBS yang sesuai (Penting atau Essentials)

---

## Backlog (Nice to Have)
> Fitur tambahan yang bisa dikerjakan setelah fitur utama selesai dan stabil.

- [ ] **Dark mode admin** — tambahkan toggle dark/light di topbar, simpan preferensi di localStorage
- [ ] **Export log** — unduh activity log sebagai CSV
- [ ] **Bulk action** — pilih banyak konten sekaligus → hapus / tambah ke playlist
- [ ] **Duplicate jadwal** — salin jadwal yang sudah ada ke tanggal lain
- [ ] **Screen groups** — kelompokkan layar, broadcast jadwal ke satu grup sekaligus
- [ ] **Konten HTML/widget** — zone yang bisa render HTML kustom (harga saham, cuaca lokal)
- [ ] **PIN lock player** — player butuh PIN untuk masuk ke mode konfigurasi
- [ ] **Log tayang** — catat setiap konten yang tayang + durasi aktual (untuk laporan)
- [ ] **Notifikasi Telegram** — kirimi bot Telegram jika ada layar offline
- [ ] **API key** — endpoint publik untuk push ticker dari sistem lain (core banking, dll)
- [ ] **Layout builder visual** — editor drag-and-drop untuk konfigurasi zone kustom

---

## Catatan Teknis

### Environment variables yang dibutuhkan
```bash
# App
NEXTAUTH_SECRET=         # random string 32+ karakter
NEXTAUTH_URL=            # http://10.100.0.XX atau http://signage.local
UPLOAD_DIR=/app/uploads  # path di dalam container

# Database
DATABASE_URL=mysql://signage:password@db:3306/signage_bg

# Opsional
MAX_UPLOAD_SIZE_MB=100
HEARTBEAT_TIMEOUT_SECONDS=120
SCHEDULER_INTERVAL_CRON="* * * * *"
```

### Dependensi penting
```bash
# Framework & DB
next@14 typescript prisma @prisma/client

# Auth
next-auth@beta bcryptjs @types/bcryptjs

# UI
tailwindcss @tailwindcss/forms shadcn-ui
@tabler/icons-webfont @tabler/icons-react

# Real-time & scheduling
node-cron @types/node-cron

# File upload
multer @types/multer

# Drag & drop (playlist reorder)
@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Utilities
date-fns zod react-hook-form @hookform/resolvers
```

### Aturan pengembangan
- Semua API route harus validasi input menggunakan `zod`
- Semua mutasi database harus wrap dalam try-catch, return error yang jelas
- Komponen player tidak boleh import `next/headers` atau server-only code
- SSE connection harus handle reconnect di sisi client
- Semua tanggal/waktu disimpan dalam UTC, ditampilkan dalam WIB (UTC+7)
- File upload disimpan dengan nama UUID, bukan nama asli (hindari path traversal)
- Log aktivitas ditulis untuk semua operasi CRUD yang dilakukan user

---

*TASK.md ini dibuat berdasarkan PRD v1.0 dan Design System v1.0 · Signage BPR Bank Gresik*
