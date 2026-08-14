# PRD — Signage BPR Bank Gresik
**Versi:** 1.0  
**Tanggal:** Agustus 2026  
**Disusun oleh:** IT/EDP BPR Bank Gresik  
**Status:** Draft

---

## 1. Latar Belakang

BPR Bank Gresik membutuhkan sistem digital signage internal yang dapat menampilkan informasi, promosi produk, dan pengumuman secara terjadwal di layar-layar yang terpasang di area banking hall, ruang tunggu, dan kantor cabang. Sistem ini harus berjalan sepenuhnya di jaringan lokal (LAN/VLAN internal) tanpa ketergantungan pada internet atau layanan cloud eksternal, untuk menjaga keamanan data dan keandalan operasional.

---

## 2. Tujuan Produk

- Menampilkan konten terjadwal (gambar, video, teks berjalan) di layar-layar internal secara otomatis
- Memberikan kemampuan manajemen konten terpusat melalui dashboard admin berbasis web
- Mendukung multi-layar dengan layout multi-zone yang dapat dikonfigurasi per layar
- Beroperasi penuh secara offline di jaringan lokal, tanpa ketergantungan internet
- Mudah dikelola oleh staf IT dengan satu panel administrasi

---

## 3. Pengguna (User Roles)

| Role | Deskripsi | Akses |
|---|---|---|
| **Admin** | Staf IT/EDP | Full access: CRUD konten, jadwal, layar, ticker |
| **Operator** | Staf marketing/cabang | Upload konten, buat jadwal, tidak bisa hapus layar |
| **Viewer** | TV/Monitor display | Hanya akses `/player/[screenId]` — read-only |

---

## 4. Fitur Utama

### 4.1 Manajemen Konten
- Upload file gambar (JPG, PNG, WebP) dan video (MP4, WebM)
- Batas ukuran file: maks 100 MB per file
- Preview konten sebelum dijadwalkan
- Organisasi konten dalam folder/kategori (Promo, Informasi, Event, Idle)
- Metadata konten: nama, durasi tampil, tag, tanggal upload

### 4.2 Penjadwalan Konten
- Jadwal aktif berdasarkan rentang tanggal dan jam (contoh: 08:00–12:00)
- Prioritas jadwal: jadwal dengan prioritas lebih tinggi menimpa jadwal default
- Playlist: urutan konten dengan durasi per item
- Fallback content: konten default bila tidak ada jadwal aktif
- Status jadwal: Draft, Active, Expired

### 4.3 Manajemen Layar (Screen)
- Registrasi layar baru dengan nama, lokasi, dan zone layout
- Setiap layar memiliki URL unik: `/player/[screenId]`
- Status layar: Online, Offline, Idle
- Heartbeat monitoring: layar melaporkan status setiap 30 detik
- Preview layar langsung dari dashboard admin

### 4.4 Multi-Zone Layout
- Layout terdiri dari zone-zone yang dapat dikonfigurasi secara visual
- Zone types: Main (konten utama), Ticker (teks berjalan bawah), Sidebar (info tambahan), Clock (jam digital)
- Preset layout: Fullscreen, Split Horizontal, Split Vertical, L-Shape
- Konfigurasi per layar: setiap layar bisa pakai layout berbeda

### 4.5 Running Text / Ticker
- Teks berjalan di zona bawah layar
- Bisa diisi manual atau tarik dari daftar pengumuman
- Kecepatan gerak dan warna dapat diatur
- Multiple ticker: bisa antri beberapa ticker sekaligus

### 4.6 Real-Time Update
- Konten di player diperbarui secara real-time menggunakan Server-Sent Events (SSE)
- Perubahan jadwal dari admin langsung terefleksi di layar tanpa refresh manual
- Ticker baru langsung muncul di layar aktif

### 4.7 Preview & Monitoring
- Preview mode: lihat tampilan layar langsung dari browser admin
- Dashboard monitoring: status semua layar, konten yang sedang tayang, log error
- Riwayat penayangan konten per layar

---

## 5. Fitur Non-Fungsional

| Aspek | Ketentuan |
|---|---|
| **Jaringan** | Hanya bisa diakses dari jaringan lokal (LAN/VLAN internal) |
| **Ketersediaan** | Player harus tetap menampilkan konten meski server restart sebentar (cache lokal browser) |
| **Performa** | Halaman admin load < 2 detik di jaringan lokal |
| **Browser support** | Chrome/Chromium (target utama untuk TV display), Firefox, Edge |
| **Resolusi** | Player mendukung 1920×1080 (Full HD) dan 3840×2160 (4K) |
| **Autentikasi** | Login berbasis session (NextAuth v5), hanya di halaman admin |
| **Logging** | Log aktivitas admin tersimpan di database |

---

## 6. Teknologi Stack

### 6.1 Application
| Komponen | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI Library | Tailwind CSS + shadcn/ui |
| ORM | Prisma |
| Auth | NextAuth v5 (Credentials provider) |
| Real-time | Server-Sent Events (SSE) via Next.js API Route |
| Scheduler | node-cron (cek jadwal setiap menit) |
| File upload | Multer / Next.js API Route |

### 6.2 Infrastructure
| Komponen | Teknologi |
|---|---|
| Database | MySQL 8 |
| Web server | Nginx Proxy Manager |
| Container | Docker + Docker Compose |
| Host | VM di Proxmox VE (BG-proxcluster) |
| File storage | Docker volume lokal |
| Jaringan | VLAN internal 10.100.0.x |

---

## 7. Struktur Database (Skema)

### Tabel Utama

```
screens           — daftar layar (id, name, location, layout_id, last_seen)
contents          — library media (id, name, type, file_path, duration, size)
playlists         — kumpulan konten (id, name, description)
playlist_items    — isi playlist (id, playlist_id, content_id, order, duration)
schedules         — jadwal tayang (id, screen_id, playlist_id, start_at, end_at, priority, status)
tickers           — teks berjalan (id, text, speed, color, active, order)
layouts           — konfigurasi zone (id, name, zones JSON)
users             — akun admin/operator (id, email, name, role, password_hash)
activity_logs     — log aktivitas (id, user_id, action, entity, created_at)
```

---

## 8. Struktur Halaman Aplikasi

```
/                         → Redirect ke /admin atau /login
/login                    → Halaman login
/admin                    → Dashboard overview
/admin/screens            → Daftar semua layar
/admin/screens/[id]       → Detail & setting layar
/admin/contents           → Library konten (gambar/video)
/admin/contents/upload    → Upload konten baru
/admin/playlists          → Manajemen playlist
/admin/playlists/[id]     → Edit playlist & urutan konten
/admin/schedules          → Kalender & daftar jadwal
/admin/tickers            → Manajemen teks berjalan
/admin/layouts            → Konfigurasi zone layout
/admin/users              → Manajemen user (admin only)
/player/[screenId]        → Halaman player (TV/Monitor)
/preview/[screenId]       → Preview layar dari browser admin
```

---

## 9. Struktur Folder Project

```
signage-bg/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx            ← Dashboard
│   │   │   │   ├── screens/
│   │   │   │   ├── contents/
│   │   │   │   ├── playlists/
│   │   │   │   ├── schedules/
│   │   │   │   ├── tickers/
│   │   │   │   └── layouts/
│   │   ├── player/
│   │   │   └── [screenId]/
│   │   │       └── page.tsx            ← Player fullscreen
│   │   ├── api/
│   │   │   ├── sse/[screenId]/         ← SSE endpoint
│   │   │   ├── screens/
│   │   │   ├── contents/
│   │   │   ├── schedules/
│   │   │   └── tickers/
│   │   └── login/
│   ├── components/
│   │   ├── admin/                      ← Komponen dashboard
│   │   ├── player/                     ← Komponen player/viewer
│   │   └── ui/                         ← shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── scheduler.ts
│   │   └── sse.ts
│   └── types/
├── prisma/
│   └── schema.prisma
├── public/
│   └── uploads/                        ← Atau mount ke Docker volume
├── docker-compose.yml
├── Dockerfile
└── .env.local
```

---

## 10. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: signage-bg-app
    restart: unless-stopped
    environment:
      DATABASE_URL: mysql://signage:password@db:3306/signage_bg
      NEXTAUTH_SECRET: your-secret-here
      NEXTAUTH_URL: http://10.100.0.XX
      UPLOAD_DIR: /app/uploads
    volumes:
      - media_uploads:/app/uploads
    networks:
      - signage-net
    depends_on:
      - db

  db:
    image: mysql:8
    container_name: signage-bg-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: signage_bg
      MYSQL_USER: signage
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - signage-net

volumes:
  media_uploads:
  mysql_data:

networks:
  signage-net:
    driver: bridge
```

---

## 11. Alur Kerja Utama

### Menambah Konten Baru
1. Admin upload file → tersimpan di Docker volume
2. Sistem simpan metadata ke database (nama, tipe, durasi, ukuran)
3. Konten muncul di library — siap dijadwalkan

### Menjadwalkan Konten
1. Admin buat playlist → tambahkan konten dengan urutan & durasi
2. Admin buat jadwal → pilih layar, playlist, tanggal/jam, prioritas
3. Scheduler (cron tiap menit) cek jadwal aktif
4. SSE push update ke player yang bersangkutan
5. Player otomatis beralih ke konten baru

### Layar Baru (Registrasi)
1. Admin tambah layar baru di dashboard → dapat URL unik
2. Buka URL `/player/[screenId]` di browser TV
3. Layar langsung aktif dan mulai terima konten terjadwal

---

## 12. Milestone & Estimasi Pengerjaan

| Fase | Scope | Estimasi |
|---|---|---|
| **Fase 1** | Setup project, Docker, Auth, DB schema | 2 hari |
| **Fase 2** | Library konten + upload | 2 hari |
| **Fase 3** | Playlist & scheduler | 2 hari |
| **Fase 4** | Player + SSE real-time | 2 hari |
| **Fase 5** | Multi-zone layout + ticker | 3 hari |
| **Fase 6** | Dashboard monitoring + UI polish | 2 hari |
| **Total** | | **~13 hari kerja** |

---

## 13. Batasan & Asumsi

- Sistem hanya bisa diakses dari jaringan lokal BPR Bank Gresik
- Tidak ada fitur streaming video live (hanya file video pre-upload)
- Autentikasi menggunakan username/password lokal, tidak integrasi LDAP/AD
- Backup database menggunakan Proxmox Backup Server (PBS) yang sudah ada
- TV/Monitor diasumsikan menggunakan browser Chromium dalam mode kiosk
- File media disimpan lokal di server, tidak menggunakan object storage eksternal

---

*Dokumen ini merupakan PRD versi awal dan dapat direvisi sesuai kebutuhan pengembangan.*
