# SIHARKAN TIK

**Sistem Informasi Harmonisasi Peralatan Komunikasi dan Teknologi Informasi **

SIHARKAN TIK adalah sistem manajemen internal berbasis web untuk mengelola inventaris perangkat TIK, peminjaman HT, suku cadang, dokumen SPPM, dan aduan perbaikan di lingkungan Bidang TIK Polda DIY. Sistem dibangun dengan React + Vite di sisi frontend dan Supabase (Auth, PostgreSQL, Storage) sebagai backend‑as‑a‑service.

> **Status proyek:** Production‑ready. Semua modul CRUD berfungsi dengan Supabase. Formulir login menggunakan Supabase Auth (email/password). Fitur unggah file terintegrasi dengan Supabase Storage.

---

## Fitur Sekilas

- Supabase Authentication dengan sistem role (Admin & User)
- 7 modul CRUD dengan Supabase PostgreSQL
- Pencarian, filter, dan paginasi di setiap tabel
- Dasbor interaktif dengan statistik dan grafik donat
- Unggah / pratinjau / unduh file pendukung via Supabase Storage
- Ekspor data ke CSV
- Status peminjaman HT dihitung dinamis (Dipinjam / Jatuh Tempo / Terlambat / Dikembalikan)
- Desain responsif (desktop, tablet, ponsel)
- Tema kustom Polri (Navy & Gold)

---

## 📋 Daftar Isi

- [Tentang Sistem](#-tentang-sistem)
- [Fitur Utama](#-fitur-utama)
- [Akses Pengguna](#-akses-pengguna)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Alur Aplikasi](#-alur-aplikasi)
- [Modul dan Alur Data](#-modul-dan-alur-data)
- [Database](#-database)
- [Keamanan](#-keamanan)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Menjalankan Project Secara Lokal](#-menjalankan-project-secara-lokal)
- [Konfigurasi Supabase](#-konfigurasi-supabase)
- [Pengujian Fungsional](#-pengujian-fungsional)
- [Build dan Deployment](#-build-dan-deployment)
- [Known Limitations](#-known-limitations--catatan-penting)
- [Roadmap](#-roadmap)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 📖 Tentang Sistem

### Masalah yang Dipecahkan

Bidang TIK sebelumnya mengelola inventaris perangkat, peminjaman HT, suku cadang, dokumen SPPM, dan aduan perbaikan secara manual atau melalui sistem yang tidak terintegrasi. SIHARKAN TIK menyatukan semua proses tersebut dalam satu platform digital dengan otentikasi terpusat dan akses berbasis peran.

### Ruang Lingkup

- **Inventaris Alat TIK** — pencatatan seluruh perangkat TIK (HT, Tower, Repeater, Ransus, Bodyworn, Command Center, Call Center, Drone)
- **Pinjam Pakai HT** — pengelolaan peminjaman HT ke satwil dengan status dinamis
- **Suku Cadang** — monitoring stok dengan peringatan batas minimum
- **SPPM** — pengelolaan Surat Perintah Pelaksanaan Pekerjaan (Mabes Polri & Polres)
- **Tracking Perbaikan** — pencatatan dan pemantauan aduan perbaikan perangkat
- **Kontak Admin** — informasi kontak administrator yang dapat diedit

### Pengguna

Sistem menggunakan **dua peran** yang disimpan di tabel `profiles.role` (lihat migrasi `00005_create_profiles.sql`):

- **Admin** — akses penuh ke seluruh modul CRUD dan dashboard statistik.
- **User** — hanya melihat halaman sambutan (welcome) di dashboard; route admin otomatis di-redirect oleh `ProtectedRoute`.

Setiap pengguna baru harus ditambahkan manual di Supabase Dashboard (Authentication → Users) dan perannya diatur di tabel `profiles`. Tidak ada halaman pendaftaran umum.

---

## ✨ Fitur Utama

| Modul | Fungsi | Status |
|-------|--------|--------|
| **Dashboard** | Ringkasan statistik, grafik donat, akses cepat, aktivitas terbaru, notifikasi stok | ✅ Berfungsi |
| **Login** | Autentikasi email/password via Supabase Auth | ✅ Berfungsi |
| **Logout** | Hapus sesi, redirect ke halaman login | ✅ Berfungsi |
| **Inventaris / Alat TIK** | CRUD inventaris, filter kategori/kondisi/lokasi, pencarian, paginasi, ekspor CSV, ID otomatis, field Model & No. Seri | ✅ Berfungsi |
| **Pinjaman HT** | CRUD peminjaman, status dinamis (Dipinjam/Jatuh Tempo/Terlambat/Dikembalikan), tandai kembali, unggah file, pratinjau file, field ID HT/No. Seri/Merk/Model | ✅ Berfungsi |
| **Suku Cadang** | CRUD suku cadang, monitoring stok menipis/aman, statistik, ekspor CSV, field Terima (masuk)/Digunakan (keluar) | ✅ Berfungsi |
| **SPPM** | CRUD SPPM, dua tab (Mabes/Polres), unggah file, pratinjau, unduh, ekspor CSV | ✅ Berfungsi |
| **Tracking Perbaikan** | CRUD aduan, filter status/layanan, pencarian, unggah file, ekspor CSV | ✅ Berfungsi |
| **Kontak Admin** | Tampilkan/edit informasi kontak administrator, simpan ke Supabase | ✅ Berfungsi |
| **Pencarian** | Pencarian teks multi-kolom (case‑insensitive) | ✅ Berfungsi |
| **Filter** | Filter dropdown per status/kategori/lokasi | ✅ Berfungsi |
| **Paginasi** | Paginasi 10 item per halaman dengan navigasi halaman | ✅ Berfungsi |
| **Unggah File** | Upload file pendukung (PDF/JPG/PNG) ke Supabase Storage | ✅ Berfungsi (Pinjaman HT, SPPM, Tracking) |
| **Ekspor CSV** | Unduh data tabel sebagai file CSV dengan BOM UTF‑8 | ✅ Berfungsi |

---

## 👤 Akses Pengguna

- Sistem menggunakan **Supabase Authentication** dengan provider **Email / Password**.
- Terdapat **dua peran**: `Admin` dan `User`, disimpan di tabel `profiles.role` (migrasi `00005_create_profiles.sql`).
  - **Admin** — akses penuh ke seluruh modul CRUD dan dashboard statistik.
  - **User** — hanya melihat halaman sambutan (welcome) di dashboard; route admin otomatis di-redirect oleh `ProtectedRoute`.
- Pengguna baru ditambahkan manual di Supabase Dashboard (Authentication → Users); peran diatur di tabel `profiles`.
- **Tidak ada halaman pendaftaran umum.**
- Setiap route (kecuali `/login`) dilindungi oleh komponen `ProtectedRoute` — mengarahkan ke `/login` jika sesi tidak aktif.
- Sesi dikelola melalui `autoRefreshToken` dan `persistSession` (tersimpan di localStorage, sehingga login bertahan meski browser ditutup).

> **Jangan menyimpan kredensial login di kode sumber atau README.**

---

## 🏗️ Arsitektur Sistem

```mermaid
graph TD
    Browser["Browser / React + Vite"] --> SupabaseAuth["Supabase Auth"]
    Browser --> SupabaseAPI["Supabase REST API"]
    Browser --> SupabaseStorage["Supabase Storage"]

    SupabaseAuth -->|"JWT Session"| Browser
    Browser -->|"Authorization: Bearer JWT"| SupabaseAPI
    Browser -->|"Authorization: Bearer JWT"| SupabaseStorage

    SupabaseAPI --> PostgreSQL[("PostgreSQL<br/>(inventaris, pinjaman,<br/>suku_cadang, sppm,<br/>tracking, admin_config,<br/>satwil, kategori)")]
    SupabaseStorage --> Bucket[("Storage Bucket<br/>siharkan-tik")]

    PostgreSQL --> RLS["Row Level Security<br/>(allow all for authenticated)"]
    RLS -->|"filter by auth.role()"| SupabaseAPI

    style Browser fill:#f0f3f8,stroke:#111,stroke-width:2
    style SupabaseAuth fill:#3ecf8e,stroke:#2d9e6b,stroke-width:2,color:#fff
    style SupabaseAPI fill:#3ecf8e,stroke:#2d9e6b,stroke-width:2,color:#fff
    style SupabaseStorage fill:#3ecf8e,stroke:#2d9e6b,stroke-width:2,color:#fff
    style PostgreSQL fill:#336791,stroke:#1a3a4d,stroke-width:2,color:#fff
    style Bucket fill:#336791,stroke:#1a3a4d,stroke-width:2,color:#fff
```

### Komponen Arsitektur

| Komponen | Teknologi | Peran |
|----------|-----------|-------|
| **Frontend** | React 18 + Vite 5 | UI, routing, state management, komunikasi Supabase |
| **Autentikasi** | Supabase Auth (GoTrue) | Login email/password, manajemen sesi JWT |
| **Database** | Supabase PostgreSQL 15 | Penyimpanan data utama dengan RLS |
| **Storage** | Supabase Storage | Penyimpanan file pendukung (PDF, gambar) |
| **Keamanan** | Row Level Security (RLS) | Pembatasan akses data per role |
| **Routing** | React Router DOM 6 | Navigasi klien dengan protected route |

---

## 🔄 Alur Aplikasi

```mermaid
flowchart TD
    A[Mulai] --> B{Session valid?}

    B -->|Tidak| C[Redirect ke /login]
    C --> D[Input email & password]
    D --> E[Sign in via Supabase Auth]
    E --> F{Login berhasil?}
    F -->|Gagal| G[Tampilkan pesan error]
    G --> D
    F -->|Berhasil| H[Simpan session, redirect ke /]

    B -->|Ya| H
    H --> I[Dashboard]
    I --> J[Navigasi ke modul CRUD]

    J --> K[ProtectedRoute validasi session]
    K --> L[Component mount & fetch data]
    L --> M[Supabase REST: SELECT / INSERT / UPDATE / DELETE]
    M --> N[RLS memfilter hasil]
    N --> O[Render table / form / card]

    O --> P{User melakukan aksi?}
    P -->|Tambah / Edit| Q[Buka modal form]
    Q --> R[Validasi input]
    R --> S[Supabase: INSERT / UPDATE]
    S --> T[Tutup modal, refresh table]
    T --> O

    P -->|Hapus| U[Konfirmasi modal]
    U --> V[Supabase: DELETE]
    V --> O

    P -->|Cari / Filter| W[Update searchTerm / filter]
    W --> O

    P -->|Logout| X[clearSession, signOut]
    X --> C
```

---

## 🧩 Modul dan Alur Data

### Dashboard

Menampilkan ringkasan dari seluruh modul. Data statistik dikomputasi dari semua service.

**Statistik:** total inventaris per kategori, kondisi HT, status tracking (Belum Ditindaklanjuti / Proses / Selesai), peminjaman HT aktif, stok suku cadang menipis. **Total HT** dihitung dari tabel `rekap_inventaris` (agregasi `jumlah` per kategori `HT`, total 4.184 unit) melalui service `rekap.js` dan `computeStats()` di `stats.js`; fallback ke per-unit bila rekap kosong.

**Grafik:** donut chart kondisi inventaris.

**Akses Cepat:** tautan navigasi ke halaman tambah data.

### Inventaris / Alat TIK

| Kolom Database | Tipe |
|---|---|
| `id` | VARCHAR(20) PK |
| `nama`, `merk` | VARCHAR |
| `model`, `serial_number` | VARCHAR (migrasi `00009`) |
| `kategori_id` → kategori(id) | UUID |
| `kondisi` | ENUM (Baik, Rusak Ringan, Rusak Berat) |
| `lokasi_id` → satwil(id) | UUID |
| `tgl` | DATE |

**Aksi:** tambah, edit, hapus, ekspor CSV. ID dihasilkan otomatis dengan prefix kategori (HT‑, TWR‑, RPT‑, dll).

### Pinjaman HT

| Kolom Database | Tipe |
|---|---|
| `id` | UUID PK |
| `id_ht` → inventaris(id) | VARCHAR(20) |
| `serial_number`, `merk`, `model` | VARCHAR (migrasi `00009`) |
| `satwil_id` → satwil(id) | UUID |
| `tgl_pinjam`, `tgl_kembali` | DATE |
| `keterangan` | TEXT |
| `is_returned` | BOOLEAN |
| `tgl_dikembalikan` | TIMESTAMPTZ |
| `file_url` | TEXT |

**Status dihitung dinamis:**
- `is_returned = true` → **Dikembalikan**
- `tgl_kembali < hari ini` → **Terlambat**
- `tgl_kembali 0–2 hari` → **Jatuh Tempo**
- selainnya → **Dipinjam**

**Aksi:** tambah, edit, hapus, tandai dikembalikan, unggah file, pratinjau file, ekspor CSV.

### Suku Cadang

| Kolom Database | Tipe |
|---|---|
| `id` | UUID PK |
| `nama`, `satuan` | VARCHAR |
| `stok`, `stok_awal`, `min_stok`, `transaksi_bln` | INTEGER |
| `terima`, `digunakan` | INTEGER (migrasi `00009`) |
| `kategori_sc` | VARCHAR |

**Peringatan otomatis** ketika `stok < min_stok`.

### SPPM

| Kolom Database | Tipe |
|---|---|
| `id` | UUID PK |
| `nomor` | VARCHAR UNIQUE |
| `sumber` | TEXT CHECK (Mabes Polri / Polres) |
| `perihal` | TEXT |
| `tgl` | DATE |
| `file_url` | TEXT |

**Dua tab:** Mabes Polri dan Polres. Unggah file khusus PDF/JPG/PNG.

### Tracking Perbaikan

| Kolom Database | Tipe |
|---|---|
| `id` | VARCHAR(20) PK |
| `satwil_id` → satwil(id) | UUID |
| `jenis` | VARCHAR |
| `tgl` | DATE |
| `status` | ENUM (Belum Ditindaklanjuti, Proses, Selesai) |
| `file_url` | TEXT |

**ID otomatis:** `ADU‑001`, `ADU‑002`, …

### Kontak Admin

| Kolom Database | Tipe |
|---|---|
| `id` | UUID PK |
| `nama`, `jabatan`, `telepon`, `email`, `alamat`, dll | VARCHAR |

Data ditampilkan di kartu kontak. Panel pengaturan memungkinkan edit langsung.

---

## 🗃️ Database

### Entity Relationship

```mermaid
erDiagram
    satwil {
        uuid id PK
        varchar nama
    }
    kategori {
        uuid id PK
        varchar nama
    }
    inventaris {
        varchar id PK
        varchar nama
        varchar merk
        varchar model
        varchar serial_number
        uuid kategori_id FK
        enum kondisi
        uuid lokasi_id FK
        date tgl
    }
    pinjaman {
        uuid id PK
        varchar id_ht FK
        varchar serial_number
        varchar merk
        varchar model
        uuid satwil_id FK
        date tgl_pinjam
        date tgl_kembali
        text keterangan
        boolean is_returned
        timestamptz tgl_dikembalikan
        text file_url
    }
    suku_cadang {
        uuid id PK
        varchar nama
        varchar satuan
        int stok
        int stok_awal
        int min_stok
        int transaksi_bln
        int terima
        int digunakan
        varchar kategori_sc
    }
    rekap_inventaris {
        uuid id PK
        varchar satwil
        varchar kategori
        varchar merk
        varchar kondisi
        int jumlah
        timestamptz created_at
    }
    tracking {
        varchar id PK
        uuid satwil_id FK
        varchar jenis
        date tgl
        enum status
        text file_url
    }
    sppm {
        uuid id PK
        varchar nomor
        text sumber
        text perihal
        date tgl
        text file_url
    }
    admin_config {
        uuid id PK
        varchar nama
        varchar jabatan
        varchar telepon
        varchar email
        text alamat
        text alamat_detail
        varchar jam_operasional
    }

    satwil ||--o{ inventaris : "lokasi"
    satwil ||--o{ pinjaman : "peminjam"
    satwil ||--o{ tracking : "pelapor"
    kategori ||--o{ inventaris : "kategori"
    inventaris ||--o{ pinjaman : "HT dipinjam"
    rekap_inventaris ||--o{ inventaris : "ringkasan jumlah"
```

### Tabel Database

| Tabel | Tipe PK | Catatan |
|-------|---------|---------|
| `satwil` | UUID | Referensi satuan wilayah (6 row seed) |
| `kategori` | UUID | Referensi kategori alat (8 row seed) |
| `inventaris` | VARCHAR(20) | ID dengan prefix: HT‑, TWR‑, RPT‑, dll; kolom `model` & `serial_number` (migrasi `00009`) |
| `pinjaman` | UUID | Status dihitung dinamis via `is_returned` + `tgl_kembali`; kolom `id_ht`/`serial_number`/`merk`/`model` (migrasi `00009`) |
| `suku_cadang` | UUID | Kolom `stok_awal` ditambahkan via migrasi manual; kolom `terima` & `digunakan` (migrasi `00009`) |
| `rekap_inventaris` | UUID | Tabel ringkasan jumlah per satwil/kategori/merk/kondisi; sumber Total HT dashboard (migrasi `00009`) |
| `tracking` | VARCHAR(20) | ID format `ADU‑XXX` |
| `sppm` | UUID | Field `sumber` dibatasi: Mabes Polri / Polres |
| `admin_config` | UUID | Hanya 1 row; menyimpan kontak administrator |

### Row Level Security

Semua tabel memiliki RLS diaktifkan. Migrasi `00003_hotfix_rls_anon.sql` menetapkan kebijakan `USING (true)` (allow all) untuk semua operasi karena aplikasi menggunakan kustom login yang membuat `auth.role()` selalu `anon`. Tabel `rekap_inventaris` (migrasi `00009`) memiliki kebijakan terpisah: `SELECT` untuk `authenticated`, `INSERT`/`UPDATE`/`DELETE` untuk `service_role`.

---

## 🔐 Keamanan

### Praktik yang Diterapkan

| Praktik | Status |
|---------|--------|
| Autentikasi via Supabase Auth (email/password) | ✅ |
| Route protection dengan `ProtectedRoute` | ✅ |
| Sesi JWT dikelola dengan `autoRefreshToken` + `persistSession` | ✅ |
| Halaman login menerjemahkan pesan error tanpa membocorkan detail teknis | ✅ |
| `.env` tidak masuk version control | ✅ |
| Kredensial tidak di-hardcode di kode sumber | ✅ |

### Checklist Keamanan

- [x] Tidak ada kredensial di kode sumber
- [x] Environment variables untuk URL dan kunci Supabase
- [x] Protected routes memvalidasi sesi sebelum render konten
- [x] Sesi di-refresh otomatis
- [x] Logout menghapus sesi di sisi klien
- [ ] **RLS membutuhkan reviu keamanan** — migrasi `00003` menetapkan `USING (true)` untuk seluruh tabel. Untuk production sejati, kebijakan RLS harus diperketat kembali menjadi `auth.role() = 'authenticated'`.
- [ ] **Kunci publishable key (anon)** terekspos di kode frontend — ini adalah desain arsitektur Supabase, RLS adalah lapisan keamanan yang seharusnya membatasi akses meskipun kunci publik bocor. Namun karena RLS saat ini `USING (true)`, database praktiknya terbuka untuk siapa pun yang memiliki kunci anon. Lihat [Known Limitations](#-known-limitations--catatan-penting).

---

## 🛠️ Tech Stack

| Layer | Teknologi | Kegunaan |
|-------|-----------|----------|
| **UI Library** | React 18.2.0 | Komponen antarmuka |
| **Build Tool** | Vite 5.x | Development server, bundling |
| **Routing** | React Router DOM 6.20.0 | Navigasi klien, protected routes |
| **Backend as a Service** | Supabase | Autentikasi, PostgreSQL, Storage |
| **Supabase Client** | `@supabase/supabase-js` 2.108+ | SDK untuk akses Auth, REST, Storage |
| **Linting** | ESLint 9.x | Kualitas kode |
| **CSS** | Custom (vanilla CSS) | Design system Polri + responsive |

---

## 📁 Struktur Folder

```text
siharkan-tik-web/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Gambar statis (logo)
│   ├── components/
│   │   ├── layout/          # Sidebar, Topbar, ProtectedRoute
│   │   └── ui/              # Badge, Button, Card, Modal, Table, dll
│   ├── contexts/            # AuthContext (sesi & login)
│   ├── hooks/               # useSearch, usePagination, useToast, useExport
│   ├── layouts/             # MainLayout (sidebar + topbar + outlet)
│   ├── lib/                 # Inisialisasi Supabase client
│   ├── pages/               # 8 halaman aplikasi
│   ├── routes/              # Konfigurasi route dengan React.lazy()
│   ├── services/            # Tiap modul punya service file terpisah
│   ├── utils/               # exportToCSV, format tanggal
│   ├── App.css              # Design system lengkap (~800 baris)
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── supabase/
│   └── migrations/          # 10 file migrasi SQL (00001–00007, 00009–0010)
├── .env                     # Environment variables (tidak dikomit)
├── .env.example             # Template env
├── package.json
├── vite.config.js
└── README.md
```

### Peran Direktori `src/`

| Direktori | Tanggung Jawab |
|-----------|----------------|
| `components/layout/` | Shell aplikasi: sidebar navigasi, topbar, wrapper protected route |
| `components/ui/` | Komponen UI reusable (modal, tabel, badge, button, pagination, dll) — 14 file |
| `contexts/` | `AuthContext` — menyediakan session, loading, refreshSession, clearSession ke seluruh app |
| `hooks/` | Custom hooks: pencarian, paginasi, toast, ekspor CSV |
| `layouts/` | `MainLayout` — layout utama setelah login: sidebar + topbar + `<Outlet />` |
| `lib/` | Inisialisasi Supabase client — membaca env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `pages/` | 8 halaman: LoginPage + 7 protected pages |
| `routes/` | `AppRoutes` — lazy loading, error boundary, protected route wrapper |
| `services/` | 11 file service: tiap file mengelola akses ke satu tabel Supabase + storage + auth (+ `rekap.js`) |
| `utils/` | Fungsi utilitas: `exportToCSV()`, `formatTanggal()`, `formatSatuan()` |

---

## 🚀 Menjalankan Project Secara Lokal

### Prasyarat

- Node.js 18+ dan npm
- Akses ke proyek Supabase (URL + publishable key)

### Langkah

```bash
# 1. Clone atau buka direktori project
cd siharkan-tik-web

# 2. Install dependencies
npm install

# 3. Buat file .env dari template
cp .env.example .env
#   Edit .env: isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Jalankan development server
npm run dev
#   Server berjalan di http://localhost:5173

# 5. Build untuk production
npm run build
#   Output di folder dist/

# 6. Preview build production
npm run preview
```

### Environment Variables

Berkas `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

| Variabel | Deskripsi |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL endpoint Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Kunci anon/publik dari Supabase dashboard |

> **Peringatan:** Jangan pernah commit `.env` yang berisi kunci nyata ke repository.

---

## ⚙️ Konfigurasi Supabase

### 1. Buat Proyek Supabase

Buka [supabase.com](https://supabase.com), buat proyek baru.

### 2. Jalankan Migrasi

Buka **SQL Editor** di Supabase Dashboard, jalankan file migrasi dari `supabase/migrations/` secara berurutan:

- `00001_initial_schema_fixed.sql` atau `00001_initial_schema.sql`
- `00002_rls_and_storage.sql`
- `00003_hotfix_rls_anon.sql`
- `00004_rename_ht_to_jenis_ht.sql`
- `00005_create_profiles.sql` (tabel `profiles` + role)
- `00006_seed_sample_data.sql`
- `00007_fix_pinjaman_schema.sql`
- `00009_fix_schema_real_data.sql` (kolom `model`/`serial_number` di inventaris, `terima`/`digunakan` di suku_cadang, `id_ht`/`serial_number`/`merk`/`model` di pinjaman, tabel `rekap_inventaris` + RLS)
- `0010_seed_real_data.sql` (data riil : SPPM, suku cadang, inventaris 17 HT, pinjaman 36, rekap_inventaris 42 row / total HT 4.184)

> Catatan: file `00008` tidak ada di repositori. Migrasi `00009` dan `0010` dijalankan manual via SQL Editor.

Migrasi akan membuat tabel, relasi, seed data, bucket storage, dan kebijakan RLS.

### 3. Buat Pengguna Auth & Atur Role

- Buka **Authentication → Users** di Supabase Dashboard
- Klik **Add User**
- Masukkan email dan password untuk akun
- **Pastikan** untuk mengonfirmasi email pengguna (atau nonaktifkan confirm email di Auth settings)
- Atur peran di tabel `profiles`: `Admin` atau `User` (lihat migrasi `00005_create_profiles.sql`)

> Atau gunakan panel Settings → Configuration → Provider → Email — nonaktifkan **Confirm email** untuk memudahkan pengujian.

### 4. Verifikasi RLS

Periksa kebijakan RLS di **Authentication → Policies**. Migrasi `00003` menetapkan `USING (true)` untuk semua tabel. Jika diperlukan pengamanan lebih ketat, ubah setiap policy menjadi:

```sql
CREATE POLICY "Allow authenticated full access" ON nama_tabel
  FOR ALL USING (auth.role() = 'authenticated');
```

### 5. Konfigurasi Storage (Opsional)

Bucket `siharkan-tik` dibuat otomatis oleh migrasi `00002`. Verifikasi di **Storage → Buckets**.

### 6. Tambah Environment Variables

Salin `.env.example` ke `.env`, isi dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari **Project Settings → API**.

### 7. Restart Vite

Setelah mengubah `.env`, restart development server.

---

## 🧪 Pengujian Fungsional

### Login dan Autentikasi

- [x] Login dengan email dan password yang valid → redirect ke Dashboard
- [x] Login dengan kredensial salah → pesan error dalam Bahasa Indonesia
- [x] Akses route `/` tanpa sesi → redirect ke `/login`
- [x] Klik logout → sesi dihapus, redirect ke `/login`
- [x] Setelah logout, akses route manapun → redirect ke `/login`

### Dashboard

- [x] Statistik inventaris, pinjaman, suku cadang, tracking muncul
- [x] Grafik donut kondisi inventaris tampil
- [x] Quick Access links berfungsi
- [x] Aktivitas terbaru tampil

### Inventaris / Alat TIK

- [x] Tabel memuat data dari Supabase
- [x] Tambah data via modal → data muncul di tabel
- [x] Edit data via modal → perubahan tersimpan
- [x] Hapus data dengan konfirmasi → data hilang
- [x] Pencarian berdasarkan nama, merk, lokasi
- [x] Filter dropdown (kategori, kondisi, lokasi)
- [x] Paginasi (10 item per halaman)
- [x] Ekspor CSV berfungsi

### Pinjaman HT

- [ ] CRUD berfungsi
- [ ] Status otomatis (Dipinjam / Jatuh Tempo / Terlambat / Dikembalikan)
- [ ] Tombol "Kembalikan" mengubah status
- [x] Unggah file pendukung → file muncul di Supabase Storage
- [x] Pratinjau file via modal
- [x] Ekspor CSV berfungsi

### Suku Cadang

- [x] CRUD berfungsi
- [x] Kartu statistik (Total, Menipis, Aman, Transaksi)
- [x] Peringatan stok menipis (stok < min_stok)
- [x] Ekspor CSV berfungsi

### SPPM

- [x] CRUD berfungsi
- [x] Dua tab (Mabes Polri / Polres)
- [x] Unggah file → file muncul di Supabase Storage
- [x] Pratinjau file via modal
- [x] Unduh file (force download via fetch + blob)
- [x] Ekspor CSV berfungsi

### Tracking Perbaikan

- [x] CRUD berfungsi
- [x] ID otomatis (ADU‑XXX)
- [x] Filter status dan jenis layanan
- [x] Pencarian
- [x] Paginasi
- [x] Unggah file
- [x] Ekspor CSV berfungsi

### Kontak Admin

- [x] Informasi kontak tampil dari Supabase
- [x] Panel pengaturan dapat diedit dan disimpan
- [x] Perubahan langsung tampil di kartu kontak

### Responsive UI

- [x] Desktop (> 900px): sidebar tetap, navigasi penuh
- [x] Tablet (600–900px): sidebar overlay, brand tampil
- [x] Ponsel (< 600px): sidebar overlay, breadcrumb sembunyi, user‑chip sederhana
- [x] Tabel dapat di-scroll horizontal di layar sempit

---

## 📦 Build dan Deployment

### Production Build

```bash
npm run build
```

Output: folder `dist/` — siap di‑hosting di static web server mana pun.

### Deployment Guide

Tidak ada konfigurasi deployment spesifik di dalam proyek saat ini (tidak ada file `vercel.json`, `Dockerfile`, atau konfigurasi platform lain). Untuk mendeploy:

1. **Build** project: `npm run build`
2. **Upload** folder `dist/` ke hosting statis (Vercel, Netlify, Firebase Hosting, atau web server)
3. **Set environment variables** di platform hosting:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. **Konfigurasi redirect** untuk SPA (semua route selain file statis diarahkan ke `index.html`)

> Jika menggunakan Vercel, buat file `vercel.json`:
> ```json
> { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
> ```

---

## ⚠️ Known Limitations / Catatan Penting

### Keamanan

1. **RLS menggunakan `USING (true)`** — migrasi `00003_hotfix_rls_anon.sql` menetapkan kebijakan allow‑all karena `auth.role()` selalu `anon` di lingkungan saat ini. Database pada praktiknya tidak memiliki proteksi RLS. Untuk production, implementasi autentikasi perlu disesuaikan sehingga `auth.role()` mengembalikan `authenticated`, lalu kebijakan RLS diperketat.

2. **Sistem role sederhana** — hanya dua peran (`Admin`/`User`) via tabel `profiles`. `User` hanya melihat welcome dashboard; belum ada pembatasan data per-satwil atau audit log.

### Fungsional

3. **Form "Kirim Pesan" di halaman Kontak Admin** — masih berupa form statis tanpa handler submit. Belum ada integrasi pengiriman pesan (email atau database).

4. **Uji coba status Pinjaman HT** — perhitungan status dinamis (Dipinjam / Jatuh Tempo / Terlambat / Dikembalikan) perlu diuji dengan data tanggal yang bervariasi.

### Dokumentasi

5. **Belum ada lisensi resmi** — lihat bagian [Lisensi](#-lisensi).

---

## 🗺️ Roadmap

### Jangka Pendek

- [x] Migrasi `00009`/`0010`: kolom baru (model, serial, terima/digunakan, id_ht/merk/model) + tabel `rekap_inventaris`
- [x] Service `rekap.js` + `computeStats()` menghitung Total HT dari rekap (4.184 unit)
- [x] Sistem role Admin/User via tabel `profiles`
- [ ] Perketat RLS: `auth.role() = 'authenticated'`
- [ ] Verifikasi acceptance test untuk seluruh modul
- [ ] Tambah animasi transisi halaman

### Security Hardening

- [ ] Audit kebijakan RLS untuk seluruh tabel
- [ ] Perketat RLS `rekap_inventaris` (saat ini SELECT = authenticated, write = service_role)
- [ ] Gunakan Supabase Edge Function untuk operasi yang membutuhkan service_role key

### Enhancement

- [ ] Kirim pesan dari halaman Kontak Admin (simpan ke tabel `messages` atau kirim email via Edge Function)
- [ ] Dashboard real‑time dengan Supabase Realtime subscriptions
- [ ] Ekspor PDF / Excel
- [ ] Riwayat audit log

---

## 🤝 Kontribusi

1. Buat branch dari `main` untuk setiap perubahan
2. Pastikan tidak ada kredensial atau secrets yang tercantum di kode
3. Jalankan `npm run build` sebelum pull request
4. Jika mengubah struktur database, buat file migrasi baru di `supabase/migrations/`
5. Update README jika menambah atau mengubah fitur

---

## 📄 Lisensi

Belum ditentukan.

---

*Dokumentasi ini sesuai dengan kode sumber per tanggal **5 Juli 2026**.*
