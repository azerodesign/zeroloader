const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inisialisasi Client (Token diambil dari Vercel Environment Variables)
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN 
});

// --- LOGIKA SCRAPER: TIKTOK (Via Apify Clockworks) ---
async function tiktokScraper(url) {
  // Cek token dulu
  if (!process.env.APIFY_TOKEN) {
      return { status: false, message: 'SERVER_ERROR: APIFY_TOKEN belum disetting di Vercel.' };
  }

  try {
    console.log('[APIFY] Menjalankan Actor clockworks/free-tiktok-scraper...');

    // 1. Panggil Actor
    const run = await client.actor("clockworks/free-tiktok-scraper").call({
        postUrls: [url],
        commentsPerPost: 0,
        shouldDownloadCovers: true,     // Ambil cover biar thumbnail bagus
        shouldDownloadSlideshowImages: false,
        shouldDownloadVideos: false 
    });

    console.log('[APIFY] Run selesai, mengambil dataset:', run.defaultDatasetId);

    // 2. Ambil Hasil (Dataset)
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
        throw new Error('Video tidak ditemukan atau Private (Apify returned empty).');
    }

    const data = items[0]; // Ambil item pertama

    // 3. Mapping Data Apify ke Format ZeroLoader
    return {
      status: true,
      platform: 'tiktok',
      title: data.text || 'TikTok Video',
      thumbnail: data.videoCover || 'https://via.placeholder.com/300?text=No+Cover',
      video_nowatermark: data.videoUrl, // Link video bersih
      video_watermark: data.videoUrl,   // Actor ini biasanya otomatis no-wm
      audio: data.musicMeta ? data.musicMeta.playUrl : null
    };

  } catch (error) {
    console.error("[APIFY ERROR]:", error.message);
    return { status: false, message: error.message };
  }
}

// --- API ROUTE ---
app.post('/api/scrape', async (req, res) => {
  const { url, platform } = req.body;
  const target = platform || 'tiktok';
  
  if (!url) return res.status(400).json({ status: false, message: 'URL wajib diisi' });

  try {
    let result;

    switch (target) {
        case 'tiktok':
            result = await tiktokScraper(url);
            break;
        case 'yt-video':
        case 'yt-music':
        case 'instagram':
        case 'twitter':
            // Placeholder buat platform lain
            return res.status(200).json({ 
                status: false, 
                message: `MODULE [${target.toUpperCase()}] SEDANG MAINTENANCE / BELUM DIPASANG.` 
            });
        default:
            return res.status(400).json({ status: false, message: 'Platform tidak dikenali' });
    }

    if (!result.status) return res.status(400).json(result);
    res.json(result);

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// --- FRONTEND HTML ---
const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZERO_LOADER | APIFY CORE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Space Mono', monospace; background-color: #020202; color: #06b6d4; overflow-x: hidden; }
        .scan-line { position: fixed; left: 0; width: 100%; height: 5px; background: linear-gradient(to right, transparent, #06b6d4, transparent); opacity: 0.5; animation: scanline 4s linear infinite; pointer-events: none; z-index: 50; box-shadow: 0 0 15px #06b6d4; }
        @keyframes scanline { 0% { top: -10%; opacity: 0; } 50% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
        .crt-overlay { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; position: fixed; inset: 0; z-index: 40; }
        .glitch-text { position: relative; display: inline-block; }
        .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8; }
        .glitch-text::before { color: #00ffff; z-index: -1; transform: translate(-2px, -2px); animation: glitch-anim-1 3s infinite linear alternate-reverse; }
        .glitch-text::after { color: #8b5cf6; z-index: -2; transform: translate(2px, 2px); animation: glitch-anim-2 2s infinite linear alternate-reverse; }
        @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); } 100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); } }
        @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px); } 100% { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 1px); } }
        .hidden { display: none !important; }
        .btn-platform.active { background-color: rgba(6, 182, 212, 0.2); border-color: #06b6d4; color: #fff; box-shadow: 0 0 15px rgba(6,182,212,0.3); }
        .btn-platform { opacity: 0.6; }
        .btn-platform:hover { opacity: 1; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; }
    </style>
</head>
<body class="selection:bg-cyan-500 selection:text-black">
    <div class="crt-overlay"></div>
    <div class="scan-line"></div>
    
    <nav class="border-b border-cyan-900/30 bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="window.location.reload()">
                <div class="relative w-10 h-10 border border-cyan-500/50 bg-black flex items-center justify-center text-cyan-400"><i data-lucide="cpu" class="w-6 h-6 animate-pulse"></i></div>
                <div class="flex flex-col"><span class="text-xl font-bold tracking-tighter text-white font-sans">ZERO<span class="text-cyan-400">LOADER</span></span><span class="text-[9px] tracking-[0.4em] text-cyan-600 uppercase">Sys v4.5 APIFY_CLOCKWORKS</span></div>
            </div>
        </div>
    </nav>

    <main class="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-32">
        <div class="flex flex-col items-center">
            <div class="relative mb-12 text-center">
                <div class="inline-flex items-center gap-3 px-4 py-1 mb-6 border border-cyan-500/30 bg-cyan-950/20 rounded-none text-xs tracking-[0.2em]"><div class="w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_10px_cyan]"></div>SYSTEM_READY // CLOCKWORKS_ACTIVE</div>
                <div class="relative group"><h1 class="text-5xl md:text-8xl font-black text-white mb-2 tracking-tighter relative z-10 glitch-text" data-text="ZERO_LOADER">ZERO_LOADER</h1></div>
                <p class="text-cyan-600 text-sm md:text-base tracking-widest uppercase mt-4 max-w-2xl mx-auto border-t border-b border-cyan-900/50 py-2">Universal Media Extraction Interface</p>
            </div>

            <div class="w-full max-w-4xl relative group perspective-1000">
                <div class="relative bg-[#050505] border border-cyan-800/50 p-1 md:p-2 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)]">
                    <div class="bg-cyan-950/5 border border-cyan-900/30 p-6 md:p-8 relative overflow-hidden">
                        
                        <div class="grid grid-cols-3 md:grid-cols-5 gap-2 mb-8">
                            <button onclick="selectPlatform('tiktok')" id="btn-tiktok" class="btn-platform active flex flex-col items-center justify-center p-3 border border-cyan-900/50 rounded transition-all"><i data-lucide="music" class="w-5 h-5 mb-1"></i> <span class="text-[9px] font-bold tracking-widest">TIKTOK</span></button>
                            <button onclick="selectPlatform('yt-video')" id="btn-yt-video" class="btn-platform flex flex-col items-center justify-center p-3 border border-cyan-900/50 rounded transition-all"><i data-lucide="video" class="w-5 h-5 mb-1"></i> <span class="text-[9px] font-bold tracking-widest">YT_VIDEO</span></button>
                            <button onclick="selectPlatform('yt-music')" id="btn-yt-music" class="btn-platform flex flex-col items-center justify-center p-3 border border-cyan-900/50 rounded transition-all"><i data-lucide="headphones" class="w-5 h-5 mb-1"></i> <span class="text-[9px] font-bold tracking-widest">YT_MUSIC</span></button>
                            <button onclick="selectPlatform('instagram')" id="btn-instagram" class="btn-platform flex flex-col items-center justify-center p-3 border border-cyan-900/50 rounded transition-all"><i data-lucide="instagram" class="w-5 h-5 mb-1"></i> <span class="text-[9px] font-bold tracking-widest">INSTAGRAM</span></button>
                            <button onclick="selectPlatform('twitter')" id="btn-twitter" class="btn-platform flex flex-col items-center justify-center p-3 border border-cyan-900/50 rounded transition-all"><i data-lucide="twitter" class="w-5 h-5 mb-1"></i> <span class="text-[9px] font-bold tracking-widest">TWITTER</span></button>
                        </div>

                        <div class="relative flex flex-col md:flex-row gap-4">
                            <div class="relative flex-1">
                                <div class="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-cyan-900/30 bg-black/50 text-cyan-600"><i data-lucide="terminal" class="w-5 h-5"></i></div>
                                <input id="url-input" type="text" placeholder="PASTE TIKTOK URL HERE..." class="w-full h-14 bg-black/80 text-cyan-100 pl-16 pr-4 border border-cyan-900/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none transition-all placeholder:text-cyan-900/50 text-sm tracking-wider">
                            </div>
                            <button id="init-btn" class="md:w-48 h-14 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 uppercase">
                                <span class="relative z-10 flex items-center gap-2" id="btn-text">INITIALIZE <i data-lucide="zap" class="w-4 h-4"></i></span>
                            </button>
                        </div>

                        <div id="logs-container" class="mt-4 p-4 bg-black border border-cyan-900/50 text-xs font-mono h-32 overflow-y-auto hidden"></div>
                        <div id="error-box" class="mt-4 p-3 bg-red-950/20 border-l-4 border-red-600 text-red-500 text-xs flex items-center gap-3 hidden"><i data-lucide="alert-circle" class="w-4 h-4"></i><span class="tracking-widest" id="error-message">ERROR</span></div>
                    </div>
                </div>
            </div>

            <!-- RESULT SECTION -->
            <div id="result-section" class="w-full max-w-4xl mt-12 hidden">
                <div class="relative border-t border-b border-cyan-500/50 bg-black/60 backdrop-blur-md">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#020202] px-4 text-cyan-400 text-xs tracking-[0.3em] border border-cyan-900">EXTRACTION_COMPLETE</div>
                    <div class="p-8 flex flex-col md:flex-row gap-8">
                        <div class="w-full md:w-72 flex-shrink-0 relative"><div class="relative h-40 bg-black border border-cyan-700 overflow-hidden"><img id="res-thumb" src="" alt="thumb" class="w-full h-full object-cover opacity-80" /></div></div>
                        <div class="flex-1">
                            <div class="flex items-start justify-between mb-6"><div><h3 id="res-title" class="text-cyan-100 font-bold text-lg mb-1 tracking-wide">TITLE</h3></div></div>
                            <div id="download-options" class="grid gap-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="mt-20 pt-10 border-t border-cyan-900/20 flex flex-col items-center pb-10">
        <p class="text-[9px] text-cyan-900 text-center">&copy; 2026 ZEROLOADER CORP.</p>
    </footer>

    <script>
        lucide.createIcons();
        const API_ENDPOINT = "/api/scrape"; 
        let currentPlatform = 'tiktok';

        const urlInput = document.getElementById('url-input');
        const initBtn = document.getElementById('init-btn');
        const logsContainer = document.getElementById('logs-container');
        const errorBox = document.getElementById('error-box');
        const resultSection = document.getElementById('result-section');

        function selectPlatform(platform) {
            currentPlatform = platform;
            document.querySelectorAll('.btn-platform').forEach(btn => btn.classList.remove('active'));
            document.getElementById('btn-' + platform).classList.add('active');
            urlInput.placeholder = 'PASTE ' + platform.toUpperCase() + ' URL HERE...';
            resultSection.classList.add('hidden');
            errorBox.classList.add('hidden');
        }

        function runLogs() {
            logsContainer.classList.remove('hidden');
            logsContainer.innerHTML = '';
            const steps = ['> CONTACTING APIFY ACTOR...', '> UPLOADING PAYLOAD...', '> WAITING FOR CRAWLER...', '> DOWNLOADING DATASET...', '> DONE.'];
            let i = 0;
            const interval = setInterval(() => {
                if(i >= steps.length) { clearInterval(interval); return; }
                const div = document.createElement('div');
                div.className = "mb-1 text-emerald-500/80 animate-pulse";
                div.innerText = steps[i];
                logsContainer.appendChild(div);
                logsContainer.scrollTop = logsContainer.scrollHeight;
                i++;
            }, 800); 
        }

        initBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            errorBox.classList.add('hidden');
            resultSection.classList.add('hidden');
            if (!url) { showError('URL REQUIRED'); return; }

            // Loading state
            const originalBtnText = initBtn.innerHTML;
            initBtn.querySelector('span').innerHTML = 'PROCESSING... <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
            lucide.createIcons();
            initBtn.disabled = true;
            runLogs();

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url, platform: currentPlatform })
                });
                const resJson = await response.json();
                
                if (!resJson.status) throw new Error(resJson.message);
                renderResult(resJson);
            } catch (err) {
                showError(err.message);
            } finally {
                initBtn.disabled = false;
                initBtn.innerHTML = originalBtnText;
                lucide.createIcons();
            }
        });

        function renderResult(data) {
            document.getElementById('res-thumb').src = data.thumbnail || 'https://via.placeholder.com/300';
            document.getElementById('res-title').innerText = data.title;
            const optsContainer = document.getElementById('download-options');
            optsContainer.innerHTML = '';
            
            const createBtn = (label, url) => {
                const div = document.createElement('div');
                div.className = "flex flex-col sm:flex-row items-center justify-between p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-md hover:bg-cyan-900/30 transition-all gap-3";
                
                if (!url) {
                    // Tombol Unavailable
                    div.innerHTML = \`<div class="text-red-400 font-bold text-sm tracking-widest">\${label}</div><button disabled class="w-full sm:w-auto px-6 py-3 bg-red-900/20 border border-red-900/50 text-red-500 font-bold text-xs tracking-widest uppercase rounded cursor-not-allowed">UNAVAILABLE</button>\`;
                } else {
                    // Tombol Download Aktif
                    div.innerHTML = \`<div class="text-cyan-300 font-bold text-sm tracking-widest">\${label}</div><a href="\${url}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-widest uppercase rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2">DOWNLOAD <i data-lucide="download" class="w-4 h-4"></i></a>\`;
                }
                optsContainer.appendChild(div);
            };

            // Apify Clockworks biasanya kasih 'video_nowatermark'
            // Kita tampilkan saja semua opsi yang tersedia
            createBtn('NO WATERMARK', data.video_nowatermark);
            if (data.audio) createBtn('AUDIO ONLY', data.audio);
            
            resultSection.classList.remove('hidden');
            lucide.createIcons();
        }

        function showError(msg) {
            errorBox.classList.remove('hidden');
            document.getElementById('error-message').innerText = msg;
        }
    </script>
</body>
</html>
`;

// ROUTING
app.get('/', (req, res) => res.send(FRONTEND_HTML));

// PENTING BUAT VERCEL: Export App, Jangan Listen di sini (kecuali development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
