import { useState, useEffect, useRef } from 'react';
import {
    Zap,
    Download,
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
    ThumbsUp,
    MessageCircle,
    Share2,
    Cpu,
    CheckCircle2,
    XCircle,
    Key,
    Eye,
    Film,
    Headphones,
    ExternalLink,
    Sparkles,
    Twitter,
    Facebook,
    Instagram,
    Youtube,
    Video,
    Music4
} from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE = '/api';

// --- SHARED STYLES ---
const cardStyle = {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px',
};

const cardStyleNoRadius = {
    ...cardStyle,
    borderRadius: undefined,
};

// --- PLATFORM CONFIG ---
const SUPPORTED_PLATFORMS = [
    { id: 'tiktok', name: 'TikTok', icon: Music4, color: 'text-pink-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-purple-500' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-400' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'soundcloud', name: 'SoundCloud', icon: Music, color: 'text-orange-500' },
];

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
        <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
            className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

            {/* Subtle dot grid background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                opacity: 0.015,
                backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
                backgroundSize: '30px 30px',
            }}></div>

            <Navbar view={view} setView={setView} darkMode={darkMode} setDarkMode={setDarkMode} />
            <div className="relative" style={{ paddingTop: '60px' }}>
                {view === 'landing' ? <LandingPage onLaunch={() => setView('dashboard')} /> : <Dashboard />}
            </div>
        </div>
    );
}

// --- NAVBAR ---
function Navbar({ view, setView, darkMode, setDarkMode }) {
    return (
        <nav style={{
            position: 'fixed', top: 0, width: '100%', zIndex: 50,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(2, 6, 23, 0.7)',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setView('landing')}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                            padding: '6px', borderRadius: '10px',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
                        }}>
                            <Zap className="text-white" size={16} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
                            Zero<span style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>Loader</span>
                        </span>
                        <span style={{
                            fontSize: '9px', fontWeight: 700,
                            background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                            padding: '2px 8px', borderRadius: '20px',
                            border: '1px solid rgba(99,102,241,0.2)',
                        }}>V7</span>
                    </div>
                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setDarkMode(!darkMode)} style={{
                            padding: '8px', borderRadius: '8px', background: 'transparent',
                            border: 'none', cursor: 'pointer', color: '#94a3b8',
                        }}>
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        {view === 'landing' && (
                            <button onClick={() => setView('dashboard')} style={{
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', padding: '8px 16px', borderRadius: '10px',
                                fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                            }}>
                                Launch <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// --- SPLASH SCREEN ---
function SplashScreen() {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#020617',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
        }}>
            <div style={{ position: 'relative', animation: 'float 3s ease-in-out infinite' }}>
                <div style={{
                    position: 'absolute', inset: 0, background: '#6366f1',
                    filter: 'blur(40px)', opacity: 0.2, borderRadius: '50%', transform: 'scale(1.5)',
                }}></div>
                <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                    padding: '16px', borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(99,102,241,0.3)',
                }}>
                    <Zap size={48} className="text-white" />
                </div>
            </div>
            <h1 style={{
                marginTop: '32px', fontSize: '24px', fontWeight: 800, color: 'white',
                letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
                Zero<span style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Loader</span>
                <span style={{
                    fontSize: '10px', verticalAlign: 'top',
                    background: 'rgba(99,102,241,0.3)', color: '#c4b5fd',
                    padding: '2px 8px', borderRadius: '6px', marginLeft: '8px',
                    letterSpacing: 'normal',
                }}>V7</span>
            </h1>
            <div style={{
                marginTop: '24px', width: '180px', height: '3px',
                background: '#1e293b', borderRadius: '99px', overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                    borderRadius: '99px',
                    animation: 'loading 2.5s ease-in-out forwards',
                }}></div>
            </div>
            <p style={{ marginTop: '12px', fontSize: '10px', color: '#475569', letterSpacing: '0.1em' }}>
                INITIALIZING ENGINE...
            </p>
        </div>
    );
}

// --- LANDING PAGE ---
function LandingPage({ onLaunch }) {
    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '100px', paddingBottom: '140px' }}>
                {/* Background orbs */}
                <div style={{ position: 'absolute', top: '40px', left: '10%', width: '400px', height: '400px', background: 'rgba(168,85,247,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: '40px', right: '10%', width: '500px', height: '500px', background: 'rgba(99,102,241,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '99px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: '#818cf8', fontSize: '12px', fontWeight: 600,
                        marginBottom: '40px',
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease-in-out infinite' }}></span>
                        TikWM API Engine Online
                    </div>

                    {/* Heading */}
                    <h1 style={{
                        fontSize: 'clamp(40px, 6vw, 72px)',
                        fontWeight: 900, letterSpacing: '-0.03em',
                        lineHeight: 1.1, marginBottom: '24px',
                    }}>
                        All in One<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7, #6366f1)',
                            backgroundSize: '200% 200%',
                            animation: 'gradient-shift 3s ease infinite',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Downloader</span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '440px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                        Extract HD video & audio instantly.<br />
                        Fast. Clean. No limits.
                    </p>

                    {/* CTA */}
                    <button onClick={onLaunch} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        padding: '16px 32px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: 'white', borderRadius: '14px', fontWeight: 700,
                        fontSize: '17px', border: 'none', cursor: 'pointer',
                        boxShadow: '0 20px 50px rgba(99,102,241,0.3)',
                        transition: 'all 0.3s ease',
                    }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 25px 60px rgba(99,102,241,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(99,102,241,0.3)'; }}
                    >
                        <Zap size={20} /> Start Engine <ArrowRight size={18} />
                    </button>

                    {/* Feature pills */}
                    <div style={{ marginTop: '56px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                        {['HD Quality', 'No Watermark', 'MP3 Audio', 'Fast API'].map((feat, i) => (
                            <div key={i} style={{
                                padding: '8px 16px', borderRadius: '99px',
                                fontSize: '12px', fontWeight: 500,
                                ...cardStyle, display: 'flex', alignItems: 'center', gap: '6px',
                                color: '#94a3b8',
                            }}>
                                <CheckCircle2 size={12} style={{ color: '#4ade80' }} /> {feat}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

// --- DASHBOARD ---
function Dashboard() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [platform, setPlatform] = useState(null);
    const [logs, setLogs] = useState([]);
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('zl_history');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('History parse error:', e);
            return [];
        }
    });
    const logsEndRef = useRef(null);

    // Save history to localStorage
    useEffect(() => {
        localStorage.setItem('zl_history', JSON.stringify(history));
    }, [history]);

    // Auto Scroll Logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    // Real-time Auto-Detection
    useEffect(() => {
        if (!url) {
            setPlatform(null);
            return;
        }
        const lowerUrl = url.toLowerCase();
        let detected = null;

        if (lowerUrl.includes('tiktok.com')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'tiktok');
        } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'youtube');
        } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'twitter');
        } else if (lowerUrl.includes('instagram.com')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'instagram');
        } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'facebook');
        } else if (lowerUrl.includes('soundcloud.com')) {
            detected = SUPPORTED_PLATFORMS.find(p => p.id === 'soundcloud');
        } else {
            detected = { id: 'generic', name: 'Generic Video', icon: Video, color: 'text-gray-400' };
        }

        setPlatform(detected);
    }, [url]);

    const addLog = (message) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, { time, message }]);
    };

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleProcess = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        setData(null);
        setLogs([]); // Clear previous logs

        try {
            addLog(`[INFO] Initializing handshake with backend...`);
            await wait(600);

            if (platform) {
                addLog(`[INFO] Detecting metadata for ${platform.name}...`);
            } else {
                addLog(`[INFO] Analyzing URL structure...`);
            }
            await wait(800);

            // Determine engine (simulation for UI feedback)
            const engineName = platform?.id === 'tiktok' ? 'TikWM API' : 'yt-dlp Engine';
            addLog(`[INFO] Routing request via ${engineName}...`);
            await wait(700);

            const res = await fetch(`${API_BASE}/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Extraction failed');
            }

            const result = await res.json();

            await wait(500);
            addLog(`[SUCCESS] Validated metadata from ${result.author ? result.author.nickname : 'source'}.`);

            await wait(400);
            if (result.downloads && result.downloads.length > 0) {
                addLog(`[SUCCESS] Found ${result.downloads.length} formats (MP4, MP3). Ready for download.`);
            } else {
                addLog(`[INFO] Processing base URL: ${result.url || 'N/A'}`);
            }

            setData(result);

            // Add to history
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                platform: platform?.id || 'generic',
                title: result.title || 'Untitled Video',
                author: result.author?.nickname || 'Unknown',
                cover: result.cover,
                downloads: result.downloads || []
            };
            setHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10

        } catch (err) {
            console.error(err);
            setError(err.message);
            addLog(`[ERROR] ${err.message}`);
        } finally {
            setLoading(false);
            addLog(`[INFO] Process completed.`);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setUrl(text);
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', animation: 'fadeIn 0.4s ease-out' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Input & Status */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Input Card */}
                    <div style={{ ...cardStyle }}>
                        <CardHeader
                            icon={<Terminal size={20} className="text-white" />}
                            title="Console"
                            subtitle="Video Extraction Engine"
                            loading={loading}
                        />

                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                            <label style={{
                                display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b',
                                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
                                marginLeft: '4px',
                            }}>Target URL {platform && <span className="normal-case text-indigo-400 ml-2 border-l border-gray-700 pl-2 flex inline-flex items-center gap-1.5"><platform.icon size={14} className={platform.color} /> {platform.name} Detect</span>}</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    style={{
                                        width: '100%', padding: '16px 16px 16px 48px',
                                        background: 'rgba(2, 6, 23, 0.5)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px', color: 'white', fontSize: '15px',
                                        outline: 'none', transition: 'all 0.2s ease',
                                        fontFamily: 'monospace',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366f1';
                                        e.target.style.background = 'rgba(2, 6, 23, 0.8)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.background = 'rgba(2, 6, 23, 0.5)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    onClick={handlePaste}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        padding: '4px 8px', borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                                        fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                    onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                >
                                    PASTE
                                </button>
                            </div>
                            <p className="text-gray-400 mt-2 font-medium text-xs ml-1">Paste any video/audio URL to extract (TikTok, YouTube, Twitter...)</p>
                        </div>

                        <button
                            onClick={handleProcess}
                            disabled={loading || !url}
                            style={{
                                width: '100%', padding: '16px',
                                background: loading || !url
                                    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.2))'
                                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: loading || !url ? 'rgba(255,255,255,0.3)' : 'white',
                                borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                                border: 'none', cursor: loading || !url ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: loading || !url ? 'none' : '0 10px 30px -10px rgba(99,102,241,0.6)',
                                position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    PROCESSING...
                                </>
                            ) : (
                                <>
                                    <Zap size={18} className={url ? 'animate-pulse' : ''} />
                                    INITIALIZE EXTRACTION
                                </>
                            )}
                        </button>
                    </div>

                    {/* Activity Logs Panel */}
                    <div style={{ ...cardStyle }}>
                        <CardHeader
                            icon={<Activity size={18} className="text-indigo-400" />}
                            title="Activity Logs"
                            subtitle="Process Streams"
                        />
                        <div className="bg-[#0f172a] rounded-xl p-4 h-48 overflow-y-auto font-mono text-[11px] border border-white/5 custom-scrollbar relative">
                            {logs.length === 0 ? (
                                <div className="text-gray-600 italic text-center mt-12 flex flex-col items-center gap-2">
                                    <Activity size={24} className="opacity-20" />
                                    <span>Waiting for process to start...</span>
                                </div>
                            ) : (
                                <>
                                    {logs.map((log, index) => (
                                        <div key={index} className="mb-1.5 flex gap-3 text-gray-300 animate-fade-in">
                                            <span className="text-gray-600 select-none">[{log.time}]</span>
                                            <span className={
                                                log.message.includes('[ERROR]') ? 'text-red-400' :
                                                    log.message.includes('[SUCCESS]') ? 'text-green-400' :
                                                        'text-gray-300'
                                            }>{log.message}</span>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Result Section */}
                    {error && (
                        <div style={{
                            padding: '24px', borderRadius: '16px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex', alignItems: 'flex-start', gap: '16px',
                            animation: 'slideUp 0.3s ease-out',
                        }}>
                            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>Extraction Failed</h3>
                                <p style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
                            </div>
                        </div>
                    )}

                    {data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
                            {/* Video Info Card */}
                            <div style={{ ...cardStyle }}>
                                <div style={{
                                    height: '140px', position: 'relative',
                                    borderRadius: '16px 16px 0 0', overflow: 'hidden'
                                }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${data.cover ? `${API_BASE}/proxy?url=${encodeURIComponent(data.cover)}` : 'https://via.placeholder.com/800x400'})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(30px) brightness(0.4)',
                                            opacity: 0.6,
                                            position: 'absolute'
                                        }}
                                    />
                                    <img
                                        src={data.cover ? `${API_BASE}/proxy?url=${encodeURIComponent(data.cover)}` : 'https://via.placeholder.com/150'}
                                        alt="Cover"
                                        style={{
                                            height: '220px',
                                            width: 'auto',
                                            borderRadius: '16px',
                                            position: 'relative',
                                            zIndex: 1,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            // Fallback to direct URL if proxy fails, then to placeholder
                                            if (e.target.src.includes('/proxy')) {
                                                e.target.src = data.cover;
                                            } else {
                                                e.target.src = 'https://via.placeholder.com/150?text=No+Preview';
                                            }
                                        }}
                                    />
                                    {/* Content Overlay */}
                                    <div style={{ position: 'relative', height: '100%', padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', zIndex: 10 }}>
                                        <div style={{
                                            width: '80px', height: '80px', flexShrink: 0,
                                            borderRadius: '16px', overflow: 'hidden',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                                            border: '2px solid rgba(255,255,255,0.15)',
                                        }}>
                                            <img
                                                src={data.cover ? `${API_BASE}/proxy?url=${encodeURIComponent(data.cover)}` : 'https://via.placeholder.com/150'}
                                                alt="Cover"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Preview'; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                {platform && <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <platform.icon size={12} className={platform.color} /> {platform.name}
                                                </div>}
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <PlayCircle size={14} /> Video Stream
                                                </div>
                                            </div>
                                            <h3 style={{
                                                fontSize: '18px', fontWeight: 800, color: 'white',
                                                marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.01em',
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {data.title || 'Untitled Video'}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <StatChip icon={<PlayCircle size={14} />} value={data.stats?.play_count} />
                                                <StatChip icon={<ThumbsUp size={14} />} value={data.stats?.digg_count} />
                                                <StatChip icon={<MessageCircle size={14} />} value={data.stats?.comment_count} />
                                                <StatChip icon={<Share2 size={14} />} value={data.stats?.share_count} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Author Section Inline */}
                                {data.author && (
                                    <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img
                                                src={data.author.avatar ? `${API_BASE}/proxy?url=${encodeURIComponent(data.author.avatar)}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${data.author.unique_id}`}
                                                alt="Avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.author.unique_id}`; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{data.author.nickname || 'Unknown Author'}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>@{data.author.unique_id}</div>
                                        </div>
                                        <a href={`https://www.tiktok.com/@${data.author.unique_id}`} target="_blank" rel="noopener noreferrer" style={{
                                            padding: '6px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)',
                                            color: '#818cf8', textDecoration: 'none', fontSize: '11px', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                                            border: '1px solid rgba(99,102,241,0.2)'
                                        }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                                        >
                                            View <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* DEDICATED DOWNLOAD SECTION */}
                            <div style={{ ...cardStyle }}>
                                <CardHeader
                                    icon={<Download size={20} className="text-green-400" />}
                                    title="Download Section"
                                    subtitle="High Fidelity Formats"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                    {data.downloads && data.downloads.length > 0 ? (
                                        data.downloads.map((fmt, i) => (
                                            <DownloadCard key={i} fmt={fmt} index={i} />
                                        ))
                                    ) : (
                                        <div className="text-gray-500 text-sm italic col-span-2 py-8 text-center bg-black/20 rounded-xl border border-dashed border-white/5">
                                            No download formats found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - System Info */}
                <div className="flex flex-col gap-6">
                    {/* Dynamic Engine Info Card */}
                    <div style={{ ...cardStyle }}>
                        <CardHeader
                            icon={<Cpu size={18} className="text-blue-400" />}
                            title="Engine Info"
                        />
                        <div className="space-y-4">
                            <InfoRow
                                label="Detected Platform"
                                value={platform ? platform.name : 'Waiting...'}
                                valueColor={platform ? 'text-green-400' : 'text-gray-200'}
                            />
                            <InfoRow
                                label="Active Engine"
                                value={platform?.id === 'tiktok' ? 'TikWM API' : platform?.id ? 'yt-dlp Engine' : 'Idle'}
                            />
                            <InfoRow label="Mode" value="Direct Extract" />
                            <InfoRow label="Quality" value="HD No-WM" />
                            <InfoRow label="Formats" value="MP4 + MP3" />
                        </div>
                    </div>

                    {/* System Status */}
                    <div style={{ ...cardStyle }}>
                        <CardHeader
                            icon={<Activity size={18} className="text-indigo-400" />}
                            title="System Status"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <StatusItem label="TikWM API" status="operational" />
                            <StatusItem label="Download Proxy" status="operational" />
                            <StatusItem label="Backend API" status="operational" />
                            <StatusItem label="Platform Detector" status="operational" />
                        </div>
                    </div>

                    {/* Platforms */}
                    <div style={{ ...cardStyle }}>
                        <CardHeader
                            icon={<Sparkles size={18} className="text-purple-400" />}
                            title="Platforms"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            {SUPPORTED_PLATFORMS.map((p) => (
                                <div key={p.id}
                                    className={`text-xs flex items-center gap-1.5 transition-all duration-300 p-1.5 rounded-lg border ${platform?.id === p.id
                                        ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                        : 'border-transparent text-gray-400'
                                        }`}
                                >
                                    <p.icon size={12} className={platform?.id === p.id ? p.color : 'text-gray-600'} />
                                    {p.name}
                                    {platform?.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto animate-pulse" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Card */}
                    <div style={{ ...cardStyle }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <CardHeader
                                icon={<Activity size={18} className="text-gray-400" />}
                                title="Recent Activity"
                                subtitle="Download History"
                            />
                            {history.length > 0 && (
                                <button
                                    onClick={() => setHistory([])}
                                    style={{
                                        fontSize: '10px', fontWeight: 700, color: '#f87171',
                                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                                        padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                                        marginTop: '-24px'
                                    }}
                                >CLEAR</button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {history.length === 0 ? (
                                <div className="py-6 text-center text-gray-600 text-[11px] italic">No recent history.</div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img
                                                src={item.cover ? `${API_BASE}/proxy?url=${encodeURIComponent(item.cover)}` : 'https://via.placeholder.com/150'}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                            <div style={{ fontSize: '9px', color: '#64748b' }}>{item.author} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <button
                                            onClick={() => setData(item)}
                                            style={{ padding: '4px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'none', cursor: 'pointer' }}
                                        >
                                            <ExternalLink size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- DOWNLOAD CARD COMPONENT ---
function DownloadCard({ fmt, index }) {
    const [hover, setHover] = useState(false);

    const colors = fmt.type === 'MP3'
        ? { bg: 'rgba(236,72,153,0.08)', hover: 'rgba(236,72,153,0.15)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' }
        : fmt.quality.includes('HD')
            ? { bg: 'rgba(245,158,11,0.08)', hover: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
            : { bg: 'rgba(99,102,241,0.08)', hover: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' };

    return (
        <a
            href={fmt.url === '#' ? '#' : `${API_BASE}/download?url=${encodeURIComponent(fmt.url)}`}
            download={`zeroloader_${index}.${fmt.type === 'MP3' ? 'mp3' : 'mp4'}`}
            onClick={(e) => { if (fmt.url === '#') e.preventDefault(); }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: hover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${hover ? colors.border : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '14px', textDecoration: 'none', color: 'inherit',
                transition: 'all 0.25s ease',
                transform: hover ? 'translateX(4px)' : 'none',
                boxShadow: hover ? `0 4px 20px rgba(99,102,241,0.08)` : 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hover ? colors.hover : colors.bg,
                    color: colors.text, transition: 'all 0.25s ease',
                }}>
                    {fmt.type === 'MP3' ? <Headphones size={18} /> : <Film size={18} />}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {fmt.type}
                        <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                            background: fmt.quality.includes('HD') ? 'rgba(245,158,11,0.1)' :
                                fmt.quality.includes('No') ? 'rgba(52,211,153,0.1)' :
                                    fmt.quality.includes('Audio') ? 'rgba(236,72,153,0.1)' :
                                        'rgba(100,116,139,0.1)',
                            color: fmt.quality.includes('HD') ? '#fbbf24' :
                                fmt.quality.includes('No') ? '#34d399' :
                                    fmt.quality.includes('Audio') ? '#f472b6' : '#94a3b8',
                        }}>
                            {fmt.quality}
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{fmt.size} • {fmt.label}</div>
                </div>
            </div>
            <div style={{
                opacity: hover ? 1 : 0, transform: hover ? 'translateX(0)' : 'translateX(8px)',
                transition: 'all 0.25s ease', color: '#818cf8',
            }}>
                <Download size={16} />
            </div>
        </a>
    );
}

function CardHeader({ icon, title, subtitle, loading }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    minWidth: '42px', minHeight: '42px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{subtitle}</p>}
                </div>
            </div>
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: '99px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.05em' }}>PROCESSING</span>
                </div>
            )}
        </div>
    );
}

function StatChip({ icon, value }) {
    const fmt = (num) => {
        if (!num) return '0';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px' }}>
            {icon}
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{fmt(value)}</span>
        </div>
    );
}

function StatusItem({ label, status }) {
    const isUp = status === 'operational';
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isUp ? '#10b981' : '#ef4444',
                    boxShadow: isUp ? '0 0 10px rgba(16,185,129,0.4)' : '0 0 10px rgba(239,68,68,0.4)',
                }}></span>
                <span style={{
                    fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', color: isUp ? '#10b981' : '#ef4444',
                    letterSpacing: '0.02em',
                }}>
                    {isUp ? 'Active' : 'Down'}
                </span>
            </div>
        </div>
    );
}

function InfoRow({ label, value, valueColor }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>{label}</span>
            <span className={`font-mono text-[11px] ${valueColor || 'text-slate-200'} font-medium`}>{value}</span>
        </div>
    );
}
