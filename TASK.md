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
- [ ] `npx create-next-app@14 signage-bg --typescript --app --tailwind --src-dir`
- [ ] Install dependencies awal: `prisma`, `@prisma/client`, `next-auth@beta`, `bcryptjs`, `node-cron`, `multer`, `@types/*`
- [ ] Install shadcn/ui: `npx shadcn-ui@latest init` — pilih tema Neutral
- [ ] Tambahkan Tabler Icons webfont via CDN di `app/layout.tsx`
- [ ] Setup Google Fonts: Plus Jakarta Sans + Bricolage Grotesque di `app/layout.tsx`
- [ ] Buat `.env.local` dengan semua variabel yang dibutuhkan
- [ ] Buat `.env.example` sebagai template untuk tim

### 1.2 Konfigurasi TypeScript & ESLint
- [ ] Update `tsconfig.json` — tambahkan path alias `@/*` → `./src/*`
- [ ] Konfigurasi `eslint` rules: no-unused-vars, explicit return types untuk fungsi API
- [ ] Buat `src/types/index.ts` — definisi tipe global (Screen, Content, Schedule, dll)

### 1.3 Docker & infrastruktur
- [ ] Buat `Dockerfile` multi-stage (builder + runner)
- [ ] Buat `docker-compose.yml` dengan service: `app`, `db` (MySQL 8)
- [ ] Buat `docker-compose.dev.yml` untuk local development (bind mount src)
- [ ] Buat `.dockerignore`
- [ ] Test: `docker compose up --build` berhasil, app jalan di port 3000
- [ ] Tambahkan volume `media_uploads` untuk file storage
- [ ] Tambahkan volume `mysql_data` untuk persistensi database
- [ ] Test: container restart tidak kehilangan data

### 1.4 Prisma & Database schema
- [ ] `npx prisma init` — set `DATABASE_URL` ke MySQL
- [ ] Buat schema lengkap di `prisma/schema.prisma`:
  - [ ] Model `User` (id, email, name, role, passwordHash, createdAt)
  - [ ] Model `Screen` (id, name, slug, location, status, layoutId, lastSeenAt, createdAt)
  - [ ] Model `Layout` (id, name, zones Json, isDefault, createdAt)
  - [ ] Model `Content` (id, name, type, filePath, mimeType, duration, sizeBytes, category, createdAt, updatedAt)
  - [ ] Model `Playlist` (id, name, description, createdAt, updatedAt)
  - [ ] Model `PlaylistItem` (id, playlistId, contentId, order, durationOverride)
  - [ ] Model `Schedule` (id, screenId, playlistId, startAt, endAt, priority, status, createdAt)
  - [ ] Model `Ticker` (id, text, speed, color, isActive, order, createdAt)
  - [ ] Model `ActivityLog` (id, userId, action, entity, entityId, meta Json, createdAt)
  - [ ] Semua relasi foreign key terdefinisi dengan benar
  - [ ] Enum: `UserRole` (ADMIN, OPERATOR), `ContentType` (IMAGE, VIDEO), `ScheduleStatus` (DRAFT, ACTIVE, EXPIRED), `ContentCategory` (PROMO, INFO, EVENT, IDLE)
- [ ] `npx prisma migrate dev --name init`
- [ ] `npx prisma generate`
- [ ] Buat `src/lib/prisma.ts` — singleton PrismaClient
- [ ] Buat `prisma/seed.ts` — seed data awal: 1 admin user, 4 preset layout, 3 ticker contoh

### 1.5 Autentikasi (NextAuth v5)
- [ ] Buat `src/lib/auth.ts` — konfigurasi NextAuth dengan Credentials provider
- [ ] Implementasi `authorize()`: cari user by email, bcrypt compare password
- [ ] Buat `app/api/auth/[...nextauth]/route.ts`
- [ ] Buat middleware `src/middleware.ts` — proteksi semua route `/admin/*`
- [ ] Redirect unauthenticated ke `/login`
- [ ] Buat halaman `/login`:
  - [ ] Form email + password
  - [ ] Error state: "Email atau password salah"
  - [ ] Loading state saat submit
  - [ ] Redirect ke `/admin` setelah login berhasil
- [ ] Test: login berhasil → redirect admin, login gagal → error, akses `/admin` tanpa login → redirect login

### 1.6 Layout & navigasi dasar
- [ ] Buat `app/(admin)/layout.tsx` — shell layout dengan sidebar + topbar
- [ ] Buat komponen `src/components/admin/Sidebar.tsx`
  - [ ] Logo area (ikon + nama + sub)
  - [ ] Nav items dengan ikon Tabler, active state dengan border-left blue
  - [ ] Section labels (Konten / Layar / Sistem)
  - [ ] User info di bawah sidebar
- [ ] Buat komponen `src/components/admin/Topbar.tsx`
  - [ ] Breadcrumb dinamis berdasarkan route
  - [ ] Slot untuk action button (kanan)
  - [ ] Bell notifikasi (placeholder)
  - [ ] Avatar inisial user
- [ ] Buat `app/(admin)/admin/page.tsx` — halaman dashboard (placeholder sementara)
- [ ] Test: navigasi sidebar berfungsi, active state berubah sesuai route

---

## Fase 2 — Library Konten & Upload
> Target: Admin bisa upload dan kelola file media.  
> Estimasi: 2 hari kerja

### 2.1 API upload konten
- [ ] Buat `app/api/contents/upload/route.ts`
  - [ ] Parse multipart form dengan `multer` atau native Next.js
  - [ ] Validasi tipe file: hanya JPG, PNG, WebP, MP4, WebM
  - [ ] Validasi ukuran: maks 100 MB
  - [ ] Generate nama file unik (UUID + extension)
  - [ ] Simpan ke `/app/uploads/` (Docker volume)
  - [ ] Simpan metadata ke tabel `contents`
  - [ ] Return: `{ id, name, filePath, type, sizeBytes }`
- [ ] Buat `app/api/contents/route.ts`
  - [ ] `GET` — list semua konten, support query: `?type=IMAGE&category=PROMO&q=searchterm`
  - [ ] Response include pagination: `{ data, total, page, perPage }`
- [ ] Buat `app/api/contents/[id]/route.ts`
  - [ ] `GET` — detail satu konten
  - [ ] `PATCH` — update nama, kategori, durasi
  - [ ] `DELETE` — hapus record + hapus file dari disk
- [ ] Buat `app/api/uploads/[...path]/route.ts` — serve file statis dari volume

### 2.2 Halaman library konten
- [ ] Buat `app/(admin)/admin/contents/page.tsx`
  - [ ] Grid 3 kolom, responsive 2 kolom di layar kecil
  - [ ] Thumbnail: preview gambar untuk IMAGE, ikon video untuk VIDEO
  - [ ] Info per card: nama, tipe, ukuran file, durasi tampil
  - [ ] Filter bar: tombol All / Gambar / Video
  - [ ] Search input dengan debounce 300ms
  - [ ] Empty state: "Belum ada konten. Upload file pertama." + tombol upload
  - [ ] Loading skeleton saat fetch data
- [ ] Buat komponen `src/components/admin/ContentCard.tsx`
  - [ ] Thumbnail lazy load
  - [ ] Hover: tampilkan overlay dengan tombol Edit, Preview, Hapus
  - [ ] Klik thumbnail → modal preview
- [ ] Buat modal `src/components/admin/ContentPreviewModal.tsx`
  - [ ] Gambar: render `<img>` full size
  - [ ] Video: render `<video controls>`
  - [ ] Metadata: nama, tipe, ukuran, tanggal upload
- [ ] Buat `src/components/admin/ContentEditModal.tsx`
  - [ ] Form: nama, kategori, durasi default (detik)
  - [ ] Submit → PATCH API → update state lokal
- [ ] Implementasi hapus dengan konfirmasi dialog

### 2.3 Halaman upload
- [ ] Buat `app/(admin)/admin/contents/upload/page.tsx`
  - [ ] Dropzone area (drag & drop + klik)
  - [ ] Support multiple file sekaligus
  - [ ] Preview thumbnail sebelum upload
  - [ ] Progress bar per file
  - [ ] Status per file: uploading / success / error
  - [ ] Otomatis redirect ke library setelah semua selesai
- [ ] Buat komponen `src/components/admin/FileDropzone.tsx`

---

## Fase 3 — Playlist & Scheduler
> Target: Admin bisa buat playlist, buat jadwal, dan cron berjalan otomatis.  
> Estimasi: 2 hari kerja

### 3.1 API playlist
- [ ] Buat `app/api/playlists/route.ts`
  - [ ] `GET` — list playlist dengan jumlah item
  - [ ] `POST` — buat playlist baru `{ name, description }`
- [ ] Buat `app/api/playlists/[id]/route.ts`
  - [ ] `GET` — detail playlist + semua items dengan konten
  - [ ] `PATCH` — update nama/deskripsi
  - [ ] `DELETE` — hapus playlist (cek dulu apakah masih dipakai di jadwal aktif)
- [ ] Buat `app/api/playlists/[id]/items/route.ts`
  - [ ] `GET` — list items dengan urutan
  - [ ] `POST` — tambah konten ke playlist `{ contentId, order, durationOverride }`
  - [ ] `PUT` — update urutan semua items sekaligus (drag & drop reorder)
- [ ] Buat `app/api/playlists/[id]/items/[itemId]/route.ts`
  - [ ] `PATCH` — update durasi override satu item
  - [ ] `DELETE` — hapus item dari playlist

### 3.2 Halaman manajemen playlist
- [ ] Buat `app/(admin)/admin/playlists/page.tsx`
  - [ ] List card playlist: nama, jumlah item, total durasi, tanggal update
  - [ ] Tombol buat playlist baru → modal form
  - [ ] Empty state
- [ ] Buat `app/(admin)/admin/playlists/[id]/page.tsx`
  - [ ] Header: nama playlist + edit inline
  - [ ] Daftar item dengan thumbnail, nama, durasi
  - [ ] Drag & drop reorder item (gunakan `@dnd-kit/core`)
  - [ ] Tombol + tambah konten → modal pilih dari library
  - [ ] Edit durasi per item (klik durasi → input inline)
  - [ ] Hapus item dari playlist
  - [ ] Total durasi playlist di footer
- [ ] Buat `src/components/admin/ContentPickerModal.tsx`
  - [ ] Grid konten yang tersedia (dengan search)
  - [ ] Multiple select
  - [ ] Confirm → tambah semua ke playlist

### 3.3 API schedule
- [ ] Buat `app/api/schedules/route.ts`
  - [ ] `GET` — list jadwal, support filter `?screenId=&date=&status=`
  - [ ] `POST` — buat jadwal baru `{ screenId, playlistId, startAt, endAt, priority, status }`
- [ ] Buat `app/api/schedules/[id]/route.ts`
  - [ ] `GET` — detail jadwal
  - [ ] `PATCH` — update jadwal
  - [ ] `DELETE` — hapus jadwal
- [ ] Buat `app/api/schedules/active/route.ts`
  - [ ] `GET ?screenId=` — ambil jadwal aktif saat ini untuk layar tertentu
  - [ ] Logic: cari jadwal dengan status ACTIVE, startAt <= now <= endAt, prioritas tertinggi
  - [ ] Jika tidak ada → return fallback playlist layar

### 3.4 Halaman manajemen jadwal
- [ ] Buat `app/(admin)/admin/schedules/page.tsx`
  - [ ] Tab: Hari ini / Minggu ini / Semua
  - [ ] Timeline view (kiri) + Tabel jadwal (kanan)
  - [ ] Timeline: urutan waktu dengan bar warna per playlist
  - [ ] Tabel: nama jadwal, layar, waktu, prioritas, status badge
  - [ ] Tombol buat jadwal baru → modal form
  - [ ] Filter: dropdown pilih layar
- [ ] Buat `src/components/admin/ScheduleFormModal.tsx`
  - [ ] Dropdown pilih layar
  - [ ] Dropdown pilih playlist
  - [ ] Date-time picker start & end
  - [ ] Slider/select prioritas: Rendah / Sedang / Tinggi
  - [ ] Status: Draft / Active
  - [ ] Validasi: end > start, tidak boleh overlap jadwal sama-priority di layar yang sama

### 3.5 Content Scheduler (cron)
- [ ] Buat `src/lib/scheduler.ts`
  - [ ] Cron job setiap menit: `node-cron` schedule `* * * * *`
  - [ ] Cek semua jadwal yang statusnya ACTIVE
  - [ ] Update status ke EXPIRED jika `endAt < now`
  - [ ] Trigger SSE broadcast ke layar yang terdampak
- [ ] Register scheduler di `app/api/scheduler-init/route.ts` atau custom server
- [ ] Pastikan scheduler hanya berjalan satu instance (guard dengan flag singleton)

---

## Fase 4 — Player & Real-Time SSE
> Target: Player tampil di browser TV, update real-time saat jadwal berubah.  
> Estimasi: 2 hari kerja

### 4.1 SSE endpoint
- [ ] Buat `app/api/sse/[screenId]/route.ts`
  - [ ] Response dengan header: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - [ ] Kirim heartbeat setiap 15 detik: `data: {"type":"ping"}\n\n`
  - [ ] Daftarkan connection ke in-memory store `Map<screenId, Set<WritableStream>>`
  - [ ] Hapus dari store saat client disconnect
- [ ] Buat `src/lib/sse.ts`
  - [ ] `registerClient(screenId, stream)` — daftarkan client baru
  - [ ] `unregisterClient(screenId, stream)` — hapus saat disconnect
  - [ ] `broadcast(screenId, event)` — kirim event ke semua client untuk layar ini
  - [ ] `broadcastAll(event)` — kirim ke semua layar
  - [ ] Event types: `schedule_update`, `ticker_update`, `screen_config_update`, `ping`
- [ ] Update scheduler: panggil `broadcast()` setelah jadwal berubah

### 4.2 Heartbeat & status layar
- [ ] Buat `app/api/screens/[id]/heartbeat/route.ts`
  - [ ] `POST` — update `lastSeenAt` di database
  - [ ] Update status: ONLINE jika heartbeat dalam 2 menit terakhir
- [ ] Buat background job di sisi server: cek semua layar, tandai OFFLINE jika `lastSeenAt > 2 menit`
- [ ] Update status layar ditrigger setiap menit bersamaan dengan scheduler

### 4.3 Halaman player
- [ ] Buat `app/player/[screenId]/page.tsx`
  - [ ] Tidak ada auth — publik tapi hanya bisa diakses dari LAN (middleware check IP range)
  - [ ] `generateMetadata`: title = nama layar
  - [ ] Fetch konfigurasi layar awal: layout, jadwal aktif saat ini, ticker aktif
  - [ ] Render komponen PlayerShell dengan data awal
- [ ] Buat `src/components/player/PlayerShell.tsx`
  - [ ] Layout fullscreen: `position: fixed; inset: 0`
  - [ ] Komponen zone berdasarkan konfigurasi layout
  - [ ] Sambungkan ke SSE: `new EventSource('/api/sse/{screenId}')`
  - [ ] Handle event `schedule_update` → re-fetch jadwal aktif → update konten
  - [ ] Handle event `ticker_update` → update ticker
  - [ ] Reconnect otomatis jika SSE putus (exponential backoff)
  - [ ] Kirim heartbeat ke server setiap 30 detik
- [ ] Buat `src/components/player/zones/MainZone.tsx`
  - [ ] Loop playlist: tampilkan item sesuai durasi, lanjut ke item berikutnya
  - [ ] Gambar: `<img>` dengan `object-fit: cover`
  - [ ] Video: `<video autoPlay muted loop>` atau satu kali putar lanjut ke next
  - [ ] Transisi antar konten: fade 300ms
  - [ ] Fallback: tampilkan logo BPR jika tidak ada konten
- [ ] Buat `src/components/player/zones/TickerZone.tsx`
  - [ ] Render ticker strip di bawah
  - [ ] Label "INFO" dengan background blue
  - [ ] Animasi scroll menggunakan CSS `@keyframes` translateX(-50%)
  - [ ] Konten diduplikasi 2× untuk seamless loop
  - [ ] Kecepatan bisa dikonfigurasi (dari data ticker)
- [ ] Buat `src/components/player/zones/SidebarZone.tsx`
  - [ ] ClockWidget: jam HH:MM menggunakan Bricolage Grotesque, date, update setiap detik
  - [ ] InfoWidget: komponen tabel info (suku bunga, jam layanan) dari konfigurasi layar
- [ ] Buat `src/components/player/zones/ClockZone.tsx`
  - [ ] Jam besar untuk layout yang hanya butuh jam

### 4.4 Halaman preview
- [ ] Buat `app/(admin)/admin/preview/[screenId]/page.tsx`
  - [ ] Embed player dalam iframe `width: 100%; aspect-ratio: 16/9`
  - [ ] Frame kontrol di atas: nama layar, status, tombol reload, tombol buka di tab baru
  - [ ] Link kembali ke detail layar

---

## Fase 5 — Multi-Zone Layout & Ticker
> Target: Layout bisa dikonfigurasi per layar, ticker bisa dikelola.  
> Estimasi: 3 hari kerja

### 5.1 API screens & layout
- [ ] Buat `app/api/screens/route.ts`
  - [ ] `GET` — list semua layar dengan status terkini
  - [ ] `POST` — daftarkan layar baru `{ name, location, layoutId, slug }`
  - [ ] Auto-generate slug dari nama jika tidak diisi
- [ ] Buat `app/api/screens/[id]/route.ts`
  - [ ] `GET` — detail layar + layout + jadwal aktif saat ini
  - [ ] `PATCH` — update konfigurasi layar
  - [ ] `DELETE` — hapus layar (cek dulu tidak ada jadwal aktif)
- [ ] Buat `app/api/layouts/route.ts`
  - [ ] `GET` — list semua layout
  - [ ] `POST` — buat layout kustom baru
- [ ] Buat `app/api/layouts/[id]/route.ts`
  - [ ] `GET`, `PATCH`, `DELETE`
- [ ] Seed 4 preset layout:
  - `fullscreen` — satu zone Main mengisi seluruh layar + Ticker strip
  - `l-shape` — Main kiri (flex:1) + Sidebar kanan (220px) + Ticker strip
  - `split-horizontal` — Main atas (60%) + Info bawah (40%) + Ticker strip
  - `split-vertical` — Main kiri (60%) + Info kanan (40%) + Ticker strip

### 5.2 Halaman manajemen layar
- [ ] Buat `app/(admin)/admin/screens/page.tsx`
  - [ ] Grid 2 kolom: screen cards (thumbnail + status + info)
  - [ ] Filter: All / Online / Idle / Offline
  - [ ] Tombol daftarkan layar baru → modal form
  - [ ] Heartbeat indicator: dot warna sesuai status
  - [ ] Auto-refresh status setiap 30 detik (polling ringan)
  - [ ] Empty state: "Belum ada layar. Daftarkan layar pertama."
- [ ] Buat `app/(admin)/admin/screens/[id]/page.tsx`
  - [ ] Header: nama layar + status badge + tombol Preview
  - [ ] Tab: Info / Jadwal / Layout
  - [ ] Tab Info: nama, lokasi, slug, URL player, last seen, edit
  - [ ] Tab Jadwal: list jadwal untuk layar ini, link ke jadwal baru
  - [ ] Tab Layout: pilih preset layout dari dropdown, preview visual zone

### 5.3 Layout zone configuration
- [ ] Buat `src/components/admin/LayoutPicker.tsx`
  - [ ] Grid 4 preset dengan preview visual miniature zone
  - [ ] Highlight yang sedang dipilih dengan border blue
  - [ ] Klik → update layar dengan layout baru via API
- [ ] Buat tipe `ZoneConfig`:
  ```typescript
  type ZoneConfig = {
    zones: {
      id: string
      type: 'main' | 'sidebar' | 'ticker' | 'clock'
      position: 'top' | 'bottom' | 'left' | 'right' | 'full'
      width?: string   // CSS value, e.g. '220px' atau '30%'
      height?: string
    }[]
  }
  ```
- [ ] PlayerShell baca zones JSON dari konfigurasi layar → render zone dinamis

### 5.4 API ticker
- [ ] Buat `app/api/tickers/route.ts`
  - [ ] `GET` — list semua ticker dengan urutan
  - [ ] `POST` — buat ticker baru `{ text, speed, color, isActive, order }`
- [ ] Buat `app/api/tickers/[id]/route.ts`
  - [ ] `GET`, `PATCH`, `DELETE`
- [ ] Buat `app/api/tickers/active/route.ts`
  - [ ] `GET` — ambil semua ticker aktif, diurutkan by `order`
  - [ ] Digabung jadi satu string untuk player: `text1 · text2 · text3`
- [ ] Setiap kali ticker diupdate → broadcast SSE event `ticker_update` ke semua layar aktif

### 5.5 Halaman manajemen ticker
- [ ] Buat `app/(admin)/admin/tickers/page.tsx`
  - [ ] List ticker: teks, status aktif/nonaktif, urutan, warna, kecepatan
  - [ ] Toggle aktif/nonaktif per ticker dengan switch
  - [ ] Drag & drop reorder (gunakan `@dnd-kit/core`)
  - [ ] Tombol tambah ticker baru → inline form atau modal
  - [ ] Preview live: strip ticker berjalan di bawah halaman
  - [ ] Edit teks inline (klik teks → input)
  - [ ] Hapus dengan konfirmasi

---

## Fase 6 — Dashboard, Monitoring & Polish
> Target: Dashboard informatif, UI konsisten dengan design system, siap deploy.  
> Estimasi: 2 hari kerja

### 6.1 Dashboard overview
- [ ] Lengkapi `app/(admin)/admin/page.tsx`:
  - [ ] Stat row: Total layar, Konten media, Jadwal aktif, Ticker aktif
  - [ ] Widget "Status layar": tabel ringkas dengan status badge, auto-refresh 30 detik
  - [ ] Widget "Jadwal hari ini": timeline list dengan waktu + status
  - [ ] Widget "Konten terbaru": 3 card konten yang paling baru diupload
  - [ ] Widget "Layar offline": highlight layar yang offline dengan peringatan

### 6.2 Activity log
- [ ] Buat middleware logging di semua API route yang mutasi data:
  - [ ] `createLog(userId, action, entity, entityId, meta)` helper
  - [ ] Log actions: `CONTENT_UPLOAD`, `CONTENT_DELETE`, `PLAYLIST_CREATE`, `SCHEDULE_CREATE`, `SCHEDULE_DELETE`, `SCREEN_REGISTER`, `TICKER_UPDATE`, dll
- [ ] Buat `app/api/activity-logs/route.ts` — `GET` dengan pagination dan filter by entity
- [ ] Tampilkan log di sidebar bawah atau halaman tersendiri `/admin/logs`

### 6.3 Manajemen user (admin only)
- [ ] Buat `app/api/users/route.ts`
  - [ ] `GET` — list user (admin only, cek role di middleware)
  - [ ] `POST` — buat user baru dengan bcrypt hash password
- [ ] Buat `app/api/users/[id]/route.ts`
  - [ ] `PATCH` — update nama, role (tidak bisa ubah sendiri)
  - [ ] `DELETE` — hapus user (tidak bisa hapus diri sendiri)
- [ ] Buat `app/(admin)/admin/users/page.tsx`
  - [ ] Tabel: avatar inisial, nama, email, role badge, tanggal dibuat
  - [ ] Tombol tambah user → modal form (nama, email, password, role)
  - [ ] Tombol hapus dengan konfirmasi
  - [ ] Hanya tampil untuk user dengan role ADMIN

### 6.4 Error handling & loading states
- [ ] Buat `src/components/ui/Skeleton.tsx` — komponen skeleton loading
- [ ] Tambahkan loading skeleton di semua halaman list (contents, screens, playlists, schedules)
- [ ] Buat `src/components/ui/EmptyState.tsx` — komponen empty state reusable
- [ ] Buat `src/components/ui/Toast.tsx` — toast notification (success, error, warning, info)
- [ ] Semua API error return format standar: `{ error: string, code?: string }`
- [ ] Buat error page: `app/(admin)/error.tsx` dan `app/not-found.tsx`
- [ ] Player: tampilkan fallback logo BPR jika konten gagal dimuat

### 6.5 UI polish & design system
- [ ] Pastikan semua halaman menggunakan token warna dari design system (CSS variables)
- [ ] Cek konsistensi font: Plus Jakarta Sans untuk admin, Bricolage Grotesque untuk player
- [ ] Verifikasi semua tombol menggunakan kelas `.btn` yang benar
- [ ] Verifikasi semua badge menggunakan kelas `.badge` dengan warna sesuai konteks
- [ ] Cek semua form: label, hint, error state, disabled state
- [ ] Tambahkan `aria-label` pada semua icon-only button
- [ ] Test keyboard navigation: semua elemen interaktif bisa diakses via Tab
- [ ] Pastikan semua ikon menggunakan Tabler Icons outline (bukan filled)

### 6.6 Pengaturan sistem
- [ ] Buat `app/(admin)/admin/settings/page.tsx`:
  - [ ] Nama sistem / branding (nama bank yang tampil di header)
  - [ ] Default ticker speed (px/s)
  - [ ] Heartbeat interval (detik)
  - [ ] Fallback content (playlist default jika tidak ada jadwal)
- [ ] Simpan settings di tabel `SystemConfig` (key-value) atau file JSON

---

## Fase 7 — Testing & Deployment
> Target: Aplikasi berjalan stabil di VM Proxmox, backup terkonfigurasi.  
> Estimasi: 1–2 hari kerja

### 7.1 Testing manual
- [ ] Test flow lengkap: upload konten → buat playlist → buat jadwal → lihat di player
- [ ] Test SSE: ubah jadwal → layar update tanpa refresh
- [ ] Test ticker: tambah ticker baru → muncul di semua layar aktif
- [ ] Test heartbeat: matikan browser TV → status berubah Offline dalam 2 menit
- [ ] Test upload: file > 100 MB → tolak dengan error yang jelas
- [ ] Test auth: akses `/admin` tanpa login → redirect ke `/login`
- [ ] Test role: login sebagai Operator → tidak bisa akses `/admin/users`
- [ ] Test multi-layar: buka 3 tab player berbeda → semua update bersamaan
- [ ] Test scheduler: buat jadwal yang mulai 1 menit lagi → layar update otomatis
- [ ] Test koneksi LAN: akses dari IP luar → harusnya tidak bisa (cek middleware)

### 7.2 Build & Docker production
- [ ] `npm run build` — pastikan tidak ada TypeScript error
- [ ] `docker compose build` — image berhasil dibuild
- [ ] Test image production: `docker compose up -d`
- [ ] Verifikasi environment variable tidak ada yang bocor ke client
- [ ] Pastikan `NEXTAUTH_URL` diset ke IP/hostname lokal yang benar
- [ ] Test volume persistence: restart container → data tidak hilang

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
