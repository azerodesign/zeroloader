import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURATION
// ============================================================

const TIKWM_BASE = "https://www.tikwm.com";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Supported platforms
const PLATFORMS = {
    tiktok: { name: "TikTok", icon: "🎵", patterns: [/tiktok\.com/, /vm\.tiktok\.com/, /vt\.tiktok\.com/] },
    twitter: { name: "Twitter/X", icon: "🐦", patterns: [/twitter\.com/, /x\.com/, /t\.co/] },
    instagram: { name: "Instagram", icon: "📸", patterns: [/instagram\.com/, /instagr\.am/] },
    facebook: { name: "Facebook", icon: "📘", patterns: [/facebook\.com/, /fb\.watch/, /fb\.com/] },
    pinterest: { name: "Pinterest", icon: "📌", patterns: [/pinterest\.com/, /pin\.it/] },
    vimeo: { name: "Vimeo", icon: "🎬", patterns: [/vimeo\.com/] },
    dailymotion: { name: "Dailymotion", icon: "📺", patterns: [/dailymotion\.com/, /dai\.ly/] },
    youtube: { name: "YouTube", icon: "▶️", patterns: [/youtube\.com/, /youtu\.be/] },
    reddit: { name: "Reddit", icon: "🤖", patterns: [/reddit\.com/, /redd\.it/] },
    tumblr: { name: "Tumblr", icon: "📝", patterns: [/tumblr\.com/] },
    soundcloud: { name: "SoundCloud", icon: "🔊", patterns: [/soundcloud\.com/] },
    twitch: { name: "Twitch", icon: "💜", patterns: [/twitch\.tv/, /clips\.twitch\.tv/] },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

function fixTikwmUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return url.startsWith("/") ? `${TIKWM_BASE}${url}` : `${TIKWM_BASE}/${url}`;
}

function detectPlatform(url) {
    const lower = url.toLowerCase();
    for (const [key, platform] of Object.entries(PLATFORMS)) {
        if (platform.patterns.some(p => p.test(lower))) {
            return { id: key, ...platform };
        }
    }
    return null; // Generic "Unknown" platform
}

// ============================================================
// EXTRACTOR: TikTok (TikWM API)
// ============================================================

async function extractTikTok(videoUrl) {
    console.log("  🎵 Fetching via TikWM API...");

    const response = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body: `url=${encodeURIComponent(videoUrl)}&count=12&cursor=0&web=1&hd=1`,
    });

    const json = await response.json();

    if (json.code !== 0 || !json.data) {
        throw new Error(json.msg || "TikWM API returned no data. Video may be private or invalid.");
    }

    const d = json.data;
    const formats = [];

    if (d.hdplay) {
        formats.push({
            type: "MP4", quality: "HD No-Watermark",
            url: fixTikwmUrl(d.hdplay),
            size: d.hd_size ? formatBytes(d.hd_size) : "HD",
            label: "HD Video (No Watermark)",
        });
    }
    if (d.play) {
        formats.push({
            type: "MP4", quality: "No-Watermark",
            url: fixTikwmUrl(d.play),
            size: d.size ? formatBytes(d.size) : "SD",
            label: "Video (No Watermark)",
        });
    }
    if (d.wmplay) {
        formats.push({
            type: "MP4", quality: "With-Watermark",
            url: fixTikwmUrl(d.wmplay),
            size: d.wm_size ? formatBytes(d.wm_size) : "SD",
            label: "Video (With Watermark)",
        });
    }
    if (d.music) {
        formats.push({
            type: "MP3", quality: "Audio",
            url: fixTikwmUrl(d.music),
            size: "ORIGINAL",
            label: d.music_info?.title || "Audio Track",
        });
    }

    return {
        success: true,
        platform: "tiktok",
        title: d.title || "TikTok Video",
        author: {
            nickname: d.author?.nickname || "TikTok User",
            unique_id: d.author?.unique_id || "tiktok_user",
            avatar: fixTikwmUrl(d.author?.avatar) || ""
        },
        cover: fixTikwmUrl(d.cover || d.origin_cover) || "",
        stats: {
            play_count: d.play_count || 0,
            digg_count: d.digg_count || 0,
            comment_count: d.comment_count || 0,
            share_count: d.share_count || 0,
        },
        downloads: formats,
    };
}

// ============================================================
// EXTRACTOR: Generic (youtube-dl-exec)
// ============================================================

async function extractYoutubeDL(videoUrl, platformId = "unknown") {
    console.log(`  🎬 Fetching via youtube-dl-exec (${platformId})...`);

    try {
        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:twitter.com',
                `user-agent:${USER_AGENT}`
            ]
        });

        const formats = [];

        // Process formats
        if (output.formats && Array.isArray(output.formats)) {
            // Filter and sort specific formats
            const valid = output.formats.filter(f => f.url && f.protocol !== 'm3u8_native'); // Exclude HLS manifests if possible

            valid.forEach(f => {
                // Heuristic for label
                let type = "MP4";
                if (f.ext === "webm") type = "WEBM";
                if (f.ext === "mp3" || f.acodec !== 'none' && f.vcodec === 'none') type = "MP3";

                const label = `${f.format_note || f.resolution || f.quality || "Unknown"} - ${f.ext}`;
                const size = f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? `~${formatBytes(f.filesize_approx)}` : "Unknown");

                formats.push({
                    type: type.toUpperCase(),
                    quality: f.height ? `${f.height}p` : "Best",
                    url: f.url,
                    size: size,
                    label: label
                });
            });
        }

        // If no formats found but url exists at top level (some extractors)
        if (formats.length === 0 && output.url) {
            formats.push({
                type: output.ext?.toUpperCase() || "MP4",
                quality: "Best",
                url: output.url,
                size: "Unknown",
                label: "Download Link"
            });
        }

        const bestThumbnail = output.thumbnail || output.thumbnails?.at(-1)?.url || "";

        return {
            success: true,
            platform: platformId,
            title: output.title || "Video",
            author: {
                nickname: output.uploader || output.channel || output.artist || "Unknown",
                unique_id: output.uploader_id || "unknown",
                avatar: ""
            },
            cover: bestThumbnail,
            stats: {
                play_count: output.view_count || 0,
                digg_count: output.like_count || 0,
                comment_count: output.comment_count || 0,
                share_count: output.repost_count || 0,
            },
            downloads: formats.reverse() // Often best quality is last in ytdl
        };

    } catch (err) {
        throw new Error(`youtube-dl failed: ${err.message}`);
    }
}

// ============================================================
// EXTRACTOR: Twitter Check (vxtwitter Fallback)
// ============================================================

async function extractTwitter(videoUrl) {
    try {
        return await extractYoutubeDL(videoUrl, "twitter");
    } catch (err) {
        console.log("  ⚠️ youtube-dl failed for Twitter. Trying vxtwitter fallback...");
    }

    const vxUrl = videoUrl
        .replace("twitter.com", "api.vxtwitter.com")
        .replace("x.com", "api.vxtwitter.com");

    const response = await fetch(vxUrl, {
        headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) throw new Error(`vxtwitter returned ${response.status}`);
    const data = await response.json();

    const formats = [];
    if (data.media_extended && Array.isArray(data.media_extended)) {
        data.media_extended.forEach((m, i) => {
            if (m.type === "video" || m.type === "gif") {
                formats.push({
                    type: m.type === "gif" ? "GIF" : "MP4",
                    quality: m.type === "gif" ? "Original" : "Best",
                    url: m.url,
                    size: m.size ? formatBytes(m.size) : "ORIGINAL",
                    label: m.type === "gif" ? "GIF" : `Video ${i + 1}`,
                });
            } else if (m.type === "image") {
                formats.push({
                    type: "JPG",
                    quality: "Original",
                    url: m.url,
                    size: "ORIGINAL",
                    label: `Photo ${i + 1}`,
                });
            }
        });
    }

    if (formats.length === 0) throw new Error("No downloadable media found in tweet via vxtwitter");

    return {
        success: true,
        platform: "twitter",
        title: data.text || "Twitter Post",
        author: {
            nickname: data.user_name || "Twitter User",
            unique_id: data.user_screen_name || "twitter_user",
            avatar: ""
        },
        cover: data.media_extended?.[0]?.thumbnail_url || "",
        stats: {
            play_count: data.views || 0,
            digg_count: data.likes || 0,
            comment_count: data.replies || 0,
            share_count: data.retweets || 0
        },
        downloads: formats,
    };
}


// ============================================================
// API ROUTES
// ============================================================

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        engine: "zeroloader-v2",
        platforms: Object.values(PLATFORMS).map(p => p.name),
        timestamp: new Date().toISOString(),
    });
});

app.post("/api/extract", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const platform = detectPlatform(url);
    const platformId = platform ? platform.id : "unknown";

    try {
        let data;
        if (platformId === 'tiktok') {
            data = await extractTikTok(url);
        } else if (platformId === 'twitter') {
            data = await extractTwitter(url);
        } else {
            data = await extractYoutubeDL(url, platformId);
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({
            error: err.message || "Extraction failed",
            details: "Please check if the video is public."
        });
    }
});

app.get("/api/download", async (req, res) => {
    const mediaUrl = req.query.url;
    if (!mediaUrl) return res.status(400).json({ error: "Missing url parameter" });

    try {
        const response = await fetch(mediaUrl, {
            headers: { "User-Agent": USER_AGENT },
        });

        if (!response.ok) return res.status(response.status).json({ error: "Upstream error" });

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        let ext = "bin";
        if (contentType.includes("mp4")) ext = "mp4";
        if (contentType.includes("mpeg") || contentType.includes("mp3")) ext = "mp3";
        if (contentType.includes("webm")) ext = "webm";
        if (contentType.includes("image")) ext = "jpg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="download_${Date.now()}.${ext}"`);

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) { res.end(); break; }
            res.write(value);
        }
    } catch (err) {
        if (!res.headersSent) res.status(500).send("Proxy error");
    }
});

app.get("/api/proxy", async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send("No URL");

    try {
        const response = await fetch(imageUrl, {
            headers: { "User-Agent": USER_AGENT }
        });
        if (!response.ok) return res.status(response.status).send("Upstream error");

        res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err) {
        res.status(500).send("Proxy error");
    }
});

// Local development listener
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`\n⚡ ZeroLoader Local Backend running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
export default app;
