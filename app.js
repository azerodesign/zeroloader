import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Download, 
  Layout, 
  Link as LinkIcon, 
  Loader2, 
  Sun, 
  Moon, 
  ArrowRight,
  AlertTriangle,
  PlayCircle,
  Music,
  Terminal,
  Activity,
  Server,
  ThumbsUp,
  MessageCircle,
  Share2,
  Cpu,
  CheckCircle2,
  XCircle,
  Key
} from 'lucide-react';

// --- CONFIGURATION API ---
const FGSI_API_BASE = "https://fgsi.dpdns.org/api/downloader/tiktok";
const FGSI_API_KEY = "fgsiapi-33c31302-6d"; // Kunci Masuk!
const TIKWM_API_BASE = "https://www.tikwm.com/api"; 

export default function App() {
  const [view, setView] = useState('splash');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setView('landing'), 2500);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return () => clearTimeout(timer);
  }, [darkMode]);

  if (view === 'splash') return <SplashScreen />;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="pt-16">
        {view === 'landing' ? <LandingPage onLaunch={() => setView('dashboard')} /> : <Dashboard />}
      </div>
    </div>
  );
}

// --- COMPONENTS ---

function Navbar({ view, setView, darkMode, setDarkMode }) {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('landing')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Zap className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Zero<span className="text-indigo-500">Loader</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {view === 'landing' && (
              <button onClick={() => setView('dashboard')} className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/30 text-sm items-center gap-2">
                Launch App <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <Zap size={64} className="text-indigo-500 relative z-10 animate-bounce" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white tracking-widest uppercase animate-pulse">ZeroLoader <span className="text-xs align-top bg-indigo-600 text-white px-1 rounded ml-1">V7</span></h1>
      <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 animate-[loading_2.5s_ease-in-out]"></div>
      </div>
      {/* UPDATE: Removed 'jsx' attribute to fix React warning */}
      <style>{`@keyframes loading { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }`}</style>
    </div>
  );
}

function LandingPage({ onLaunch }) {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Fgsi API Key Loaded
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            TikTok Downloader <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">No Watermark.</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Extract high-fidelity video & audio. Powered by FgsiDev Engine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={onLaunch} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2">
              Start Engine <Zap size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- CORE LOGIC (V7 - FGSI LOCKED) ---
function Dashboard() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    setLogs(prev => [...prev, { msg, type, time: timestamp }]);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setResult(null);
    setError('');
    setLogs([]); 

    addLog(`Target: ${url.substring(0, 30)}...`, 'system');

    // --- STRATEGY 1: FGSI API (PRIMARY) ---
    const fgsiUrl = `${FGSI_API_BASE}?apikey=${FGSI_API_KEY}&url=${encodeURIComponent(url)}`;
    
    // Proxy AllOrigins untuk bypass CORS browser
    // Kita pake /get biar response-nya kebungkus JSON rapi
    const primaryProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(fgsiUrl)}`;

    let success = false;

    try {
      addLog(`[Engine 1] Auth with Fgsi Key...`, 'warning');
      const response = await fetch(primaryProxy);
      
      if (!response.ok) throw new Error("Proxy Network Error");

      const wrapperData = await response.json(); 
      const data = JSON.parse(wrapperData.contents); // Unpack isi dari proxy

      console.log("Fgsi Response:", data); // Debugging

      // Cek apakah API Fgsi return error message
      if (data.msg && !data.result) {
         throw new Error(`Fgsi API Error: ${data.msg}`);
      }

      // Handle variasi struktur data
      const resData = data.result || data.data || data;

      // Validasi minimal ada data video
      if (!resData || (!resData.video && !resData.play && !resData.nowm && !resData.no_watermark)) {
          throw new Error("Media not found in response");
      }

      addLog(`[Engine 1] Data received!`, 'success');
      
      // Mapping Field yang Aman
      const videoUrl = resData.no_watermark || resData.nowm || resData.video || resData.play;
      const musicUrl = resData.music || resData.audio;
      const title = resData.title || resData.desc || "TikTok Video";
      const authorName = resData.author_name || resData.nickname || resData.author?.nickname || "User";
      const authorUser = resData.author_id || resData.unique_id || resData.author?.unique_id || "unknown";
      const cover = resData.cover || resData.thumbnail || resData.avatar;

      setResult({
        engine: "Fgsi API",
        title: title,
        author: authorName,
        username: authorUser,
        thumbnail: cover || "https://placehold.co/400?text=No+Img",
        stats: resData.stats || { play: 0, like: 0, comment: 0, share: 0 },
        formats: [
          { type: "MP4", quality: "NO-WM", url: videoUrl, size: "HD" },
          { type: "MP3", quality: "AUDIO", url: musicUrl, size: "ORIGINAL" }
        ]
      });
      success = true;

    } catch (err) {
      addLog(`[Engine 1] Failed: ${err.message}`, 'error');
    }

    // --- STRATEGY 2: TIKWM (BACKUP) ---
    // Jalan kalau Engine 1 gagal
    if (!success) {
      try {
        addLog(`[Engine 2] Auto-Switching to Backup (TikWM)...`, 'warning');
        
        const tikwmUrl = `${TIKWM_API_BASE}/?url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`;
        const backupProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(tikwmUrl)}`;
        
        const response = await fetch(backupProxy);
        const data = await response.json();

        if (data.code !== 0) throw new Error("Video not found or Private (TikWM)");

        const v = data.data;
        addLog(`[Engine 2] Extraction Success!`, 'success');

        setResult({
          engine: "TikWM (Backup)",
          title: v.title || "TikTok Video",
          author: v.author?.nickname || "Unknown",
          username: v.author?.unique_id || "unknown",
          thumbnail: v.cover || v.origin_cover,
          stats: { play: v.play_count, like: v.digg_count, comment: v.comment_count, share: v.share_count },
          formats: [
            { type: "MP4", quality: "NO-WM (HD)", url: v.play, size: v.size ? `${(v.size/1024/1024).toFixed(1)}MB` : "HD" },
            { type: "MP3", quality: "AUDIO", url: v.music, size: "ORIGINAL" }
          ]
        });
        success = true;

      } catch (err) {
        addLog(`[Engine 2] Failed: ${err.message}`, 'error');
      }
    }

    if (!success) {
      addLog(`CRITICAL: All Engines Failed.`, 'error');
      setError("Gagal mengambil data. Cek API Key atau link mungkin private.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
      
      {/* Console Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Terminal className="text-indigo-500" /> Console
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Input URL to initiate extraction sequence.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          FGSI SYSTEM: ONLINE
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Input */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><LinkIcon size={100} /></div>
            <form onSubmit={handleProcess} className="space-y-4 relative z-10">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://vt.tiktok.com/..."
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm transition-all"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Zap />}
                </button>
              </div>
            </form>
          </div>

          {/* LOGS */}
          {(isLoading || logs.length > 0) && (
            <div className="bg-black/90 rounded-xl border border-slate-800 p-4 font-mono text-xs md:text-sm h-48 overflow-y-auto shadow-inner custom-scrollbar">
              <div className="sticky top-0 bg-black/90 pb-2 mb-2 border-b border-slate-800 flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-2"><Activity size={14} /> SYSTEM LOGS</span>
                <span>{isLoading ? 'PROCESSING...' : 'IDLE'}</span>
              </div>
              <div className="space-y-1.5">
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warning' ? 'text-yellow-400' : 
                    'text-blue-300'
                  }`}>
                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                    <span className="uppercase font-bold w-16 shrink-0 text-[10px] tracking-wider border border-current px-1 rounded text-center h-fit mt-0.5">
                      {log.type === 'system' ? 'INFO' : log.type}
                    </span>
                    <span>{log.msg}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-8">
              <div className={`p-2 border-b text-center text-xs font-bold uppercase tracking-widest ${result.engine.includes('Backup') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                Extracted via {result.engine}
              </div>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-5 items-start">
                
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-full overflow-hidden relative shadow-lg border-2 border-indigo-500/30 shrink-0">
                  <img src={result.thumbnail} alt="Avatar" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 py-1 w-full">
                  <h3 className="font-bold text-lg leading-tight mb-1 text-slate-900 dark:text-white">{result.author}</h3>
                  <p className="text-indigo-500 text-sm mb-4">@{result.username}</p>
                  
                  <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl">
                    <StatBox icon={<PlayCircle size={14}/>} val={result.stats.play} label="Views" />
                    <StatBox icon={<ThumbsUp size={14}/>} val={result.stats.like} label="Likes" />
                    <StatBox icon={<MessageCircle size={14}/>} val={result.stats.comment} label="Comms" />
                    <StatBox icon={<Share2 size={14}/>} val={result.stats.share} label="Shares" />
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2">{result.title}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 grid gap-2">
                {result.formats.map((fmt, i) => (
                  <a key={i} href={fmt.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${fmt.type.includes('MP3') ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/20' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20'}`}>
                        {fmt.type.includes('MP3') ? <Music size={18} /> : <PlayCircle size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{fmt.type} <span className="text-xs font-normal text-slate-400">• {fmt.quality}</span></div>
                        <div className="text-xs text-slate-400">{fmt.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      Download <Download size={16} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-500 text-sm items-center animate-in fade-in">
              <AlertTriangle className="shrink-0" size={18} />
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-500" /> System Status
            </h3>
            <div className="space-y-3">
              <StatusItem label="FgsiDev API" status="operational" />
              <StatusItem label="TikWM Engine" status="operational" />
              <StatusItem label="CORS Bypass" status="operational" />
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-2 font-bold text-sm text-indigo-500">
                <Key size={16} /> Active Credentials
             </div>
             <p className="text-xs text-slate-500 leading-relaxed font-mono break-all">
                Key: fgsiapi-33c31302-6d<br/>
                Host: fgsi.dpdns.org
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, val, label }) {
  const formatVal = (num) => {
    if(!num) return 0;
    return num > 999 ? (num/1000).toFixed(1) + 'k' : num;
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-200 dark:bg-slate-900 rounded-lg">
      <div className="text-slate-500 mb-1">{icon}</div>
      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{formatVal(val)}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

function StatusItem({ label, status }) {
  const color = status === 'operational' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500';
  const text = status === 'operational' ? 'Active' : status === 'degraded' ? 'Proxy Limit' : 'Down';
  
  const Icon = status === 'operational' ? CheckCircle2 : status === 'degraded' ? AlertTriangle : XCircle;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <Icon size={14} className={status === 'operational' ? 'text-green-500' : status === 'degraded' ? 'text-yellow-500' : 'text-red-500'} />
        <span className={`font-mono text-xs uppercase ${status === 'operational' ? 'text-green-500' : status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>{text}</span>
      </div>
    </div>
  );
}
