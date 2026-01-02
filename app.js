const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- LOGIKA SCRAPER TIKTOK (V2 - LEBIH KUAT) ---
async function tiktokScraper(url) {
  try {
    const payload = new URLSearchParams({ q: url, lang: 'id' });
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Origin': 'https://savetik.co',
        'Referer': 'https://savetik.co/id',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    // Request ke SaveTik
    const { data } = await axios.post('https://savetik.co/api/ajaxSearch', payload.toString(), config);
    if (!data || !data.data) throw new Error('Gagal koneksi ke sumber data.');
    
    const $ = cheerio.load(data.data);
    
    // --- DEBUGGING (Cari Link dengan Selector Lebih Luas) ---
    // Kadang class-nya berubah, jadi kita cari tag <a> yang punya href
    const videoNoWm = $('a:contains("Download Video")').first().attr('href') || 
                      $('a.download-link').eq(0).attr('href') ||
                      $('.download-box a').eq(0).attr('href');
                      
    const videoWm = $('a:contains("Watermark")').first().attr('href') || 
                    $('a.download-link').eq(1).attr('href') ||
                    $('.download-box a').eq(1).attr('href');
                    
    const audio = $('a:contains("MP3")').first().attr('href') || 
                  $('a.download-link').last().attr('href') ||
                  $('.download-box a').last().attr('href');

    const result = {
      status: true,
      title: $('.tik-video .thumbnail .content h3').text().trim() || 'TikTok Video Found',
      thumbnail: $('.tik-video .thumbnail img').attr('src') || 'https://via.placeholder.com/300x200?text=No+Image',
      // Kalau link kosong, isi null biar frontend tau
      video_nowatermark: videoNoWm || null,
      video_watermark: videoWm || null,
      audio: audio || null
    };
    
    return result;

  } catch (error) {
    console.error("Scraper Error:", error.message);
    return { status: false, message: error.message };
  }
}

// --- API ROUTE ---
app.post('/api/tiktok', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ status: false, message: 'URL wajib diisi' });
  
  try {
    const result = await tiktokScraper(url);
    // Kita tetap kirim response sukses meski link kosong, biar UI bisa nanganin
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
    <title>ZERO_LOADER | AZTRACK</title>
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
                <div class="flex flex-col"><span class="text-xl font-bold tracking-tighter text-white font-sans">ZERO<span class="text-cyan-400">LOADER</span></span><span class="text-[9px] tracking-[0.4em] text-cyan-600 uppercase">Sys v3.12 AZTRACK</span></div>
            </div>
        </div>
    </nav>

    <main class="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-32">
        <div class="flex flex-col items-center">
            <div class="relative mb-16 text-center">
                <div class="inline-flex items-center gap-3 px-4 py-1 mb-6 border border-cyan-500/30 bg-cyan-950/20 rounded-none text-xs tracking-[0.2em]"><div class="w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_10px_cyan]"></div>SYSTEM_READY // AZTRACK_CORE_ONLINE</div>
                <div class="relative group"><h1 class="text-5xl md:text-8xl font-black text-white mb-2 tracking-tighter relative z-10 glitch-text" data-text="ZERO_LOADER">ZERO_LOADER</h1></div>
                <p class="text-cyan-600 text-sm md:text-base tracking-widest uppercase mt-4 max-w-2xl mx-auto border-t border-b border-cyan-900/50 py-2">Advanced Neural Network Downloader // Powered by AZTRACK AI</p>
            </div>

            <div class="w-full max-w-4xl relative group perspective-1000">
                <div class="relative bg-[#050505] border border-cyan-800/50 p-1 md:p-2 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)]">
                    <div class="bg-cyan-950/5 border border-cyan-900/30 p-6 md:p-8 relative overflow-hidden">
                        <div class="relative flex flex-col md:flex-row gap-4">
                            <div class="relative flex-1">
                                <div class="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-cyan-900/30 bg-black/50 text-cyan-600"><i data-lucide="terminal" class="w-5 h-5"></i></div>
                                <input id="url-input" type="text" placeholder="PASTE TIKTOK URL HERE..." class="w-full h-14 bg-black/80 text-cyan-100 pl-16 pr-4 border border-cyan-900/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none transition-all placeholder:text-cyan-900/50 text-sm tracking-wider">
                            </div>
                            <button id="init-btn" class="md:w-48 h-14 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 uppercase"><span class="relative z-10 flex items-center gap-2" id="btn-text">INITIALIZE <i data-lucide="zap" class="w-4 h-4"></i></span></button>
                        </div>
                        <div id="logs-container" class="mt-4 p-4 bg-black border border-cyan-900/50 text-xs font-mono h-32 overflow-y-auto custom-scrollbar hidden"></div>
                        <div id="error-box" class="mt-4 p-3 bg-red-950/20 border-l-4 border-red-600 text-red-500 text-xs flex items-center gap-3 hidden"><i data-lucide="alert-circle" class="w-4 h-4"></i><span class="tracking-widest" id="error-message">ERROR</span></div>
                    </div>
                </div>
            </div>

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
        <p class="text-[9px] text-cyan-900 text-center">&copy; 2026 ZEROLOADER CORP. AUTHORIZED PERSONNEL ONLY.</p>
    </footer>

    <script>
        lucide.createIcons();
        const API_ENDPOINT = "/api/tiktok"; 

        const urlInput = document.getElementById('url-input');
        const initBtn = document.getElementById('init-btn');
        const btnText = document.getElementById('btn-text');
        const logsContainer = document.getElementById('logs-container');
        const errorBox = document.getElementById('error-box');
        const errorMessage = document.getElementById('error-message');
        const resultSection = document.getElementById('result-section');

        function runLogs() {
            logsContainer.classList.remove('hidden');
            logsContainer.innerHTML = '';
            const steps = ['> CONNECTING TO SERVER...', '> BYPASSING SECURITY...', '> PARSING DATA...', '> DONE.'];
            let i = 0;
            const interval = setInterval(() => {
                if(i >= steps.length) { clearInterval(interval); return; }
                const div = document.createElement('div');
                div.className = "mb-1 text-emerald-500/80 animate-pulse";
                div.innerText = steps[i];
                logsContainer.appendChild(div);
                logsContainer.scrollTop = logsContainer.scrollHeight;
                i++;
            }, 300);
        }

        initBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            errorBox.classList.add('hidden');
            resultSection.classList.add('hidden');
            if (!url) { showError('URL REQUIRED'); return; }

            btnText.innerHTML = 'PROCESSING...';
            initBtn.disabled = true;
            runLogs();

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                const resJson = await response.json();
                
                if (!resJson.status) throw new Error(resJson.message);
                
                renderResult(resJson);
            } catch (err) {
                showError(err.message);
            } finally {
                initBtn.disabled = false;
                btnText.innerHTML = 'INITIALIZE';
            }
        });

        function renderResult(data) {
            document.getElementById('res-thumb').src = data.thumbnail;
            document.getElementById('res-title').innerText = data.title;
            const optsContainer = document.getElementById('download-options');
            optsContainer.innerHTML = '';
            
            // FUNGSI BUAT TOMBOL YANG LEBIH PINTAR
            const createBtn = (label, url) => {
                const div = document.createElement('div');
                div.className = "flex flex-col sm:flex-row items-center justify-between p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-md hover:bg-cyan-900/30 transition-all gap-3";
                
                // Kalau URL-nya kosong, kita kasih tombol mati biar user tau
                if (!url) {
                    div.innerHTML = \`
                        <div class="text-red-400 font-bold text-sm tracking-widest">\${label}</div>
                        <button disabled class="w-full sm:w-auto px-6 py-3 bg-red-900/20 border border-red-900/50 text-red-500 font-bold text-xs tracking-widest uppercase rounded cursor-not-allowed">
                            UNAVAILABLE <i data-lucide="x-circle" class="w-4 h-4 ml-2 inline"></i>
                        </button>
                    \`;
                } else {
                    div.innerHTML = \`
                        <div class="text-cyan-300 font-bold text-sm tracking-widest">\${label}</div>
                        <a href="\${url}" target="_blank" rel="noopener noreferrer" 
                           class="w-full sm:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-widest uppercase rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2">
                            DOWNLOAD <i data-lucide="download" class="w-4 h-4"></i>
                        </a>
                    \`;
                }
                optsContainer.appendChild(div);
            };

            createBtn('NO WATERMARK [HD]', data.video_nowatermark);
            createBtn('WATERMARK [SD]', data.video_watermark);
            createBtn('AUDIO ONLY [MP3]', data.audio);
            
            resultSection.classList.remove('hidden');
            lucide.createIcons();
        }

        function showError(msg) {
            errorBox.classList.remove('hidden');
            errorMessage.innerText = msg;
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
