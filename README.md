⚡ ZeroLoader V7 (Fgsi Locked Edition)

ZeroLoader V7 adalah aplikasi web modern berbasis React untuk mengunduh video TikTok tanpa watermark (No-WM) dan audio (MP3) dengan kualitas tinggi.

Versi ini menggunakan Hybrid Engine V7 yang menggabungkan kekuatan API Premium FgsiDev sebagai mesin utama dan TikWM sebagai cadangan otomatis, memastikan tingkat keberhasilan download hingga 99.9%.

🚀 Fitur Unggulan

Hybrid Engine System:

Primary: Menggunakan API FgsiDev (fgsi.dpdns.org) dengan API Key terintegrasi.

Backup: Otomatis beralih ke TikWM jika server utama sibuk atau limit.

Smart CORS Bypass: Menggunakan proxy rotation (AllOrigins) untuk menembus blokir browser client-side.

Live Console Logs: Menampilkan status proses ekstraksi secara realtime layaknya terminal hacker.

Modern UI/UX:

Tampilan Glassmorphism dengan Tailwind CSS.

Dark Mode Default (Slate-950 theme).

Animasi smooth menggunakan CSS native.

Format Lengkap: Mendukung download Video (No-WM) dan Audio (MP3 Original).

🛠️ Teknologi

Project ini dibangun menggunakan stack modern:

Frontend: React.js (Hooks & Functional Components)

Styling: Tailwind CSS

Icons: Lucide React

API Integration: Fetch API + Async/Await

Proxy: AllOrigins (Get/Raw Strategy)

📦 Instalasi & Penggunaan

Prasyarat

Pastikan kamu sudah menginstall Node.js dan npm/yarn.

1. Setup Project React

Buat project baru (jika belum ada):

npm create vite@latest zeroloader -- --template react
cd zeroloader
npm install


2. Install Dependencies

Install library ikon yang dibutuhkan:

npm install lucide-react


Pastikan Tailwind CSS sudah terkonfigurasi di project kamu.

3. Integrasi Code

Salin seluruh kode dari file ZeroLoaderV7.jsx ke dalam App.jsx atau App.js kamu.

4. Jalankan

npm run dev


⚙️ Konfigurasi API

Kode ini sudah dilengkapi dengan kredensial bawaan (Hardcoded) untuk kemudahan penggunaan. Kamu bisa mengubahnya di bagian atas file:

// --- CONFIGURATION API ---
const FGSI_API_BASE = "[https://fgsi.dpdns.org/api/downloader/tiktok](https://fgsi.dpdns.org/api/downloader/tiktok)";
const FGSI_API_KEY = "fgsiapi-33c31302-6d"; // Ganti dengan key Fgsi milikmu jika limit
const TIKWM_API_BASE = "[https://www.tikwm.com/api](https://www.tikwm.com/api)"; 


📸 Preview

Dashboard Console

Aplikasi menampilkan log sistem secara detail saat memproses URL:

[SYSTEM] Target: [https://vt.tiktok.com/ZSm](https://vt.tiktok.com/ZSm)...
[WARNING] Auth with Fgsi Key...
[SUCCESS] Engine 1 Data received!


Status Indikator

🟢 Active: API berjalan normal.

🟡 Proxy Limit: Menggunakan jalur cadangan.

🔴 Down: Semua jalur gagal (jarang terjadi).

🤝 Credits

FgsiDev untuk API utamanya yang kenceng.

TikWM untuk public API sebagai backup yang solid.

Kamal (Developer) - Happy coding, stay relaxed!

Dibuat dengan ❤️ dan sedikit halusinasi (20%) oleh Kamal.
