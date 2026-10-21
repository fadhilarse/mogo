# MOGO - Multi-Oriented Gamification Omniplants

MOGO adalah aplikasi Smart Urban Farming yang memadukan Machine Learning untuk rekomendasi tanam presisi dan sistem gamifikasi interaktif. Aplikasi ini dirancang untuk memandu masyarakat perkotaan membangun kebiasaan merawat tanaman secara konsisten guna mewujudkan ketahanan pangan mandiri dari rumah.

## Fitur Utama
- Planner AI Insight: Rekomendasi tanaman dan jadwal panen yang presisi menggunakan Machine Learning berdasarkan dataset historis.
- Gamifikasi Berkebun: Sistem level pengguna, Daily Streak, dan Gudang Panen untuk memotivasi rutinitas.
- Misi Harian & Jurnal: Daftar tugas harian real-time untuk memantau aktivitas perawatan tanaman.
- Agronomy Roadmap: Penjadwalan latar belakang (cron job) untuk memperbarui siklus umur dan kesehatan tanaman secara otomatis.

## Tech Stack
- Frontend: React.js, Vite, React Router, Tailwind CSS
- Backend: Node.js, Bun
- Database: PostgreSQL
- Machine Learning: Python, Scikit-Learn, Pandas, Flask

## Prasyarat Instalasi
Sebelum menjalankan aplikasi ini, pastikan sistem Anda sudah terinstal:
1. Node.js (v18 atau terbaru)
2. Bun Runtime
3. Python (v3.8 atau terbaru)
4. PostgreSQL (termasuk psql command line tool)

## Langkah-langkah Instalasi dan Konfigurasi

### 1. Clone Repository
Buka terminal (Command Prompt/PowerShell/Bash) dan jalankan perintah berikut:
```bash
git clone [https://github.com/fadhilarse/mogo.git](https://github.com/fadhilarse/mogo.git)
cd mogo
## 2. Setup Database (PostgreSQL)
Aplikasi ini membutuhkan database PostgreSQL lokal. Struktur tabel dan data awal sudah disediakan di dalam file mogo_db.sql pada root folder.

## Opsi A: Menggunakan psql (Terminal/Command Line)

Masuk ke shell PostgreSQL:

psql -U postgres

## Buat database baru:

SQL
CREATE DATABASE mogo_db;
\q

## Import file database:

psql -U postgres -d mogo_db < mogo_db.sql

## Opsi B: Menggunakan pgAdmin (GUI)

Buka pgAdmin, login, dan buat database baru dengan nama mogo_db.

Klik kanan pada database mogo_db -> Pilih Restore.

Pada tab Filename, cari dan pilih file mogo_db.sql yang ada di folder project MOGO.

Klik Restore.

## 3. Menjalankan Backend (Node.js + Bun)
Biarkan terminal sebelumnya tetap terbuka (jika ada), dan buka terminal baru.

## Masuk ke folder backend:

cd backend

## Instal semua dependensi menggunakan Bun:

bun install

## Buat file bernama .env di dalam folder backend dan isi dengan konfigurasi database lokal Anda:

Cuplikan kode
DB_USER=postgres
DB_PASSWORD=password_postgres_anda
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mogo_db
PORT=3000
(Catatan: Ganti password_postgres_anda dengan password pgAdmin/PostgreSQL Anda).

## Jalankan server backend (termasuk Cron Job otomatis):

bun run server.js

## Menjalankan Modul AI (Python Flask)

Biarkan terminal Backend tetap menyala, dan buka terminal baru.

## Masuk ke folder AI:
cd ai

## Instal dependensi Python yang dibutuhkan:

pip install pandas scikit-learn flask flask-cors
## Jalankan server Machine Learning:

python app.py

## Menjalankan Frontend (React + Vite)

Biarkan terminal Backend dan AI tetap menyala, dan buka terminal baru (ketiga).

## Masuk ke folder frontend:

cd frontend
## Instal dependensi React menggunakan npm:

npm install

## Jalankan development server:

npm run dev

## Mengakses Aplikasi
Jika semua server (Backend, AI, dan Frontend) sudah berjalan tanpa error, Anda dapat mengakses aplikasi MOGO melalui browser di alamat berikut:

http://localhost:5173