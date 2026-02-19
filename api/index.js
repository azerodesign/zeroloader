import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import { instagramGetUrl } from 'instagram-url-direct';
import { existsSync } from 'fs';
import { resolve as pathResolve } from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIGURATION
// ============================================================

const TIKWM_BASE = "https://www.tikwm.com";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const FETCH_TIMEOUT = 15000; // 15s for external API calls
const YTDLP_TIMEOUT = 30000; // 30s for yt-dlp calls

// Solution 5: Optional cookies.txt for auth-required platforms
const COOKIES_PATH = pathResolve('./cookies.txt');
const HAS_COOKIES = existsSync(COOKIES_PATH);
if (HAS_COOKIES) console.log('🍪 cookies.txt detected — auth-required platforms enabled');
else console.log('ℹ️ No cookies.txt found — some platforms may require auth');

// Supported platforms (Phase 3: Discord added)
const PLATFORMS = {
    tiktok: { name: "TikTok", icon: "🎵", patterns: [/tiktok\.com/, /vm\.tiktok\.com/, /vt\.tiktok\.com/] },
    twitter: { name: "Twitter/X", icon: "🐦", patterns: [/twitter\.com/, /x\.com/, /\/t\.co\//] },
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
    discord: { name: "Discord", icon: "💬", patterns: [/discord\.com/, /cdn\.discordapp\.com/, /media\.discordapp\.net/] },
};

// ============================================================
// UTILITY FUNCTIONS (Phase 8: Global improvements)
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
    return null;
}

// Phase 8: URL validation
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Phase 8: Fetch with timeout wrapper
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

// Phase 1: Clean TikTok URL (strip tracking params, resolve short links)
function cleanTikTokUrl(url) {
    try {
        const parsed = new URL(url);
        // Remove tracking params
        parsed.searchParams.delete('is_from_webapp');
        parsed.searchParams.delete('sender_device');
        parsed.searchParams.delete('is_copy_url');
        parsed.searchParams.delete('_r');
        return parsed.toString();
    } catch {
        return url.split('?')[0];
    }
}

// ============================================================
// EXTRACTOR: TikTok — 3-Layer Fallback (Phase 1)
// ============================================================

// Layer 1: TikWM API
async function extractTikWM(videoUrl) {
    console.log("  🎵 [TikTok] Layer 1: TikWM API...");
    const response = await fetchWithTimeout("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body: `url=${encodeURIComponent(videoUrl)}&count=12&cursor=0&web=1&hd=1`,
    });

    const json = await response.json();
    if (json.code !== 0 || !json.data) {
        throw new Error(json.msg || "TikWM API returned no data.");
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
        engine: "TikWM API",
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

// Layer 2: TikCDN API (tiklydown.eu)
async function extractTikCDN(videoUrl) {
    console.log("  🎵 [TikTok] Layer 2: TikCDN (tiklydown.eu)...");
    const response = await fetchWithTimeout(`https://api.tiklydown.eu/api/download?url=${encodeURIComponent(videoUrl)}`, {
        headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) throw new Error(`TikCDN returned ${response.status}`);
    const data = await response.json();

    if (!data || (!data.video && !data.music)) {
        throw new Error("TikCDN returned no media data.");
    }

    const formats = [];
    if (data.video?.noWatermark) {
        formats.push({ type: "MP4", quality: "No-Watermark", url: data.video.noWatermark, size: "HD", label: "Video (No Watermark)" });
    }
    if (data.video?.watermark) {
        formats.push({ type: "MP4", quality: "With-Watermark", url: data.video.watermark, size: "SD", label: "Video (With Watermark)" });
    }
    if (data.music) {
        formats.push({ type: "MP3", quality: "Audio", url: data.music, size: "ORIGINAL", label: "Audio Track" });
    }

    return {
        success: true,
        platform: "tiktok",
        engine: "TikCDN",
        title: data.title || "TikTok Video",
        author: {
            nickname: data.author?.name || "TikTok User",
            unique_id: data.author?.unique_id || "tiktok_user",
            avatar: data.author?.avatar || ""
        },
        cover: data.cover || "",
        stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
        downloads: formats,
    };
}

// Solution 1: SSSTik.io scraping layer
async function extractSSSTik(videoUrl) {
    console.log("  🎵 [TikTok] Layer 2: SSSTik.io...");

    // Step 1: Get the page to extract the dynamic form token
    const pageResp = await fetchWithTimeout("https://ssstik.io/en", {
        headers: { "User-Agent": USER_AGENT },
    });
    const pageHtml = await pageResp.text();

    // Extract the hidden token (tt param)
    const ttMatch = pageHtml.match(/name="tt"\s+value="([^"]+)"/);
    const tt = ttMatch ? ttMatch[1] : 'aGMxc2Rj';

    // Step 2: Submit the download form
    const resp = await fetchWithTimeout("https://ssstik.io/abc?url=dl", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
            "Origin": "https://ssstik.io",
            "Referer": "https://ssstik.io/en",
        },
        body: `id=${encodeURIComponent(videoUrl)}&locale=en&tt=${tt}`,
    });

    if (!resp.ok) throw new Error(`SSSTik returned ${resp.status}`);
    const html = await resp.text();

    // Parse download links from HTML response
    const formats = [];

    // No watermark video link
    const noWmMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*(?:Without|No)\s*[Ww]atermark/i)
        || html.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*without_watermark/i);
    if (noWmMatch) {
        formats.push({ type: "MP4", quality: "No-Watermark", url: noWmMatch[1], size: "HD", label: "Video (No Watermark)" });
    }

    // With watermark video link
    const wmMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*(?:With|)\s*[Ww]atermark/i);
    if (wmMatch) {
        formats.push({ type: "MP4", quality: "With-Watermark", url: wmMatch[1], size: "SD", label: "Video (With Watermark)" });
    }

    // Audio / MP3 link
    const audioMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>\s*(?:MP3|Audio)/i);
    if (audioMatch) {
        formats.push({ type: "MP3", quality: "Audio", url: audioMatch[1], size: "ORIGINAL", label: "Audio Track" });
    }

    // Fallback: grab any download links
    if (formats.length === 0) {
        const allLinks = [...html.matchAll(/href="(https?:\/\/[^"]*(?:tikcdn|ssstik|muscdn)[^"]*)"/gi)];
        allLinks.forEach((m, i) => {
            formats.push({ type: "MP4", quality: "Download", url: m[1], size: "ORIGINAL", label: `Download ${i + 1}` });
        });
    }

    if (formats.length === 0) throw new Error("SSSTik returned no download links.");

    // Extract title if available
    const titleMatch = html.match(/<p[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)/i);

    return {
        success: true,
        platform: "tiktok",
        engine: "SSSTik",
        title: titleMatch ? titleMatch[1].trim() : "TikTok Video",
        author: { nickname: "TikTok User", unique_id: "tiktok_user", avatar: "" },
        cover: "",
        stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
        downloads: formats,
    };
}

// TikTok main: waterfall fallback chain (4 layers)
async function extractTikTok(videoUrl) {
    const cleanUrl = cleanTikTokUrl(videoUrl);

    // Layer 1: TikWM
    try { return await extractTikWM(cleanUrl); } catch (e) {
        console.log(`  ⚠️ TikWM failed: ${e.message}`);
    }
    // Layer 2: SSSTik
    try { return await extractSSSTik(cleanUrl); } catch (e) {
        console.log(`  ⚠️ SSSTik failed: ${e.message}`);
    }
    // Layer 3: TikCDN
    try { return await extractTikCDN(cleanUrl); } catch (e) {
        console.log(`  ⚠️ TikCDN failed: ${e.message}`);
    }
    // Layer 4: yt-dlp
    console.log("  🎵 [TikTok] Layer 4: yt-dlp fallback...");
    const result = await extractYoutubeDL(cleanUrl, "tiktok");
    result.engine = "yt-dlp";
    return result;
}

// ============================================================
// EXTRACTOR: Twitter/X — FixTweet API (Phase 2)
// ============================================================

async function extractTwitter(videoUrl) {
    // Layer 1: yt-dlp
    try {
        const result = await extractYoutubeDL(videoUrl, "twitter");
        result.engine = "yt-dlp";
        return result;
    } catch (err) {
        console.log(`  ⚠️ yt-dlp failed for Twitter: ${err.message}`);
    }

    // Layer 2: FixTweet API (wrapped in try-catch so Layer 3 can run)
    try {
        console.log("  🐦 [Twitter] Layer 2: FixTweet API...");
        const fxUrl = videoUrl
            .replace("twitter.com", "api.fxtwitter.com")
            .replace("x.com", "api.fxtwitter.com");

        const response = await fetchWithTimeout(fxUrl, {
            headers: { "User-Agent": USER_AGENT },
        });

        if (!response.ok) throw new Error(`FixTweet returned ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('json')) {
            throw new Error("FixTweet returned non-JSON response.");
        }

        const data = await response.json();
        const tweet = data.tweet || data;
        const formats = [];

        if (tweet.media?.videos && Array.isArray(tweet.media.videos)) {
            tweet.media.videos.forEach((v, i) => {
                formats.push({
                    type: "MP4", quality: v.height ? `${v.height}p` : "Best",
                    url: v.url, size: v.size ? formatBytes(v.size) : "ORIGINAL",
                    label: `Video ${i + 1}`,
                });
            });
        }
        if (tweet.media?.photos && Array.isArray(tweet.media.photos)) {
            tweet.media.photos.forEach((p, i) => {
                formats.push({
                    type: "JPG", quality: "Original",
                    url: p.url, size: "ORIGINAL",
                    label: `Photo ${i + 1}`,
                });
            });
        }
        if (formats.length === 0 && tweet.media_extended && Array.isArray(tweet.media_extended)) {
            tweet.media_extended.forEach((m, i) => {
                if (m.type === "video" || m.type === "gif") {
                    formats.push({ type: "MP4", quality: "Best", url: m.url, size: "ORIGINAL", label: `Video ${i + 1}` });
                } else if (m.type === "image") {
                    formats.push({ type: "JPG", quality: "Original", url: m.url, size: "ORIGINAL", label: `Photo ${i + 1}` });
                }
            });
        }

        if (formats.length === 0) throw new Error("No downloadable media found in tweet.");

        const author = tweet.author || {};
        return {
            success: true,
            platform: "twitter",
            engine: "FixTweet API",
            title: tweet.text || "Twitter Post",
            author: {
                nickname: author.name || tweet.user_name || "Twitter User",
                unique_id: author.screen_name || tweet.user_screen_name || "twitter_user",
                avatar: author.avatar_url || ""
            },
            cover: tweet.media?.photos?.[0]?.url || tweet.media?.videos?.[0]?.thumbnail_url || "",
            stats: {
                play_count: tweet.views || 0,
                digg_count: tweet.likes || 0,
                comment_count: tweet.replies || 0,
                share_count: tweet.retweets || 0
            },
            downloads: formats,
        };
    } catch (fxErr) {
        console.log(`  ⚠️ FixTweet failed: ${fxErr.message}`);
    }

    // Layer 3: d.fxtwitter.com direct media redirect
    try {
        console.log("  🐦 [Twitter] Layer 3: d.fxtwitter.com direct...");
        const directUrl = videoUrl
            .replace("twitter.com", "d.fxtwitter.com")
            .replace("x.com", "d.fxtwitter.com");

        const resp = await fetchWithTimeout(directUrl, {
            headers: { "User-Agent": USER_AGENT },
            redirect: 'manual',
        });

        const location = resp.headers.get('location');
        if (!location) throw new Error("d.fxtwitter returned no redirect.");

        const isVideo = location.includes('.mp4') || location.includes('video');
        return {
            success: true,
            platform: "twitter",
            engine: "d.fxtwitter",
            title: "Twitter Post",
            author: { nickname: "Twitter User", unique_id: "twitter_user", avatar: "" },
            cover: "",
            stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
            downloads: [{
                type: isVideo ? "MP4" : "JPG",
                quality: "Best",
                url: location,
                size: "ORIGINAL",
                label: isVideo ? "Video (Direct)" : "Media (Direct)",
            }],
        };
    } catch (dfxErr) {
        console.log(`  ⚠️ d.fxtwitter failed: ${dfxErr.message}`);
    }

    // All layers exhausted
    throw new Error("All Twitter extraction methods failed (yt-dlp, FixTweet, d.fxtwitter). The tweet may be protected or deleted.");
}

// ============================================================
// COBALT API — Universal last-resort fallback
// Community instances (api.cobalt.tools requires JWT auth)
// ============================================================
const COBALT_INSTANCES = [
    "https://cobalt-backend.canine.tools/",
    "https://cobalt-api.meowing.de/",
];

async function extractCobalt(videoUrl, platformId = "unknown") {
    console.log(`  🌐 [${platformId}] Cobalt API fallback...`);

    let cobaltData = null;
    let lastErr = null;

    for (const instance of COBALT_INSTANCES) {
        try {
            console.log(`    Trying ${instance}...`);
            const cobaltResp = await fetchWithTimeout(instance, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": USER_AGENT,
                },
                body: JSON.stringify({ url: videoUrl, videoQuality: "1080" }),
            });

            if (!cobaltResp.ok) {
                const errText = await cobaltResp.text().catch(() => "");
                throw new Error(`Cobalt ${instance} returned ${cobaltResp.status}: ${errText.substring(0, 100)}`);
            }

            cobaltData = await cobaltResp.json();
            if (cobaltData.status === "error") {
                throw new Error(`Cobalt error: ${cobaltData.error?.code || "unknown"}`);
            }
            break; // success
        } catch (e) {
            console.log(`    ⚠️ ${e.message}`);
            lastErr = e;
        }
    }

    if (!cobaltData || cobaltData.status === "error") {
        throw lastErr || new Error("All Cobalt instances failed.");
    }

    const downloads = [];

    if (cobaltData.status === "tunnel" || cobaltData.status === "redirect") {
        downloads.push({
            type: "MP4",
            quality: "Best",
            url: cobaltData.url,
            size: "ORIGINAL",
            label: cobaltData.filename || "Download",
        });
    } else if (cobaltData.status === "picker" && Array.isArray(cobaltData.picker)) {
        cobaltData.picker.forEach((item, i) => {
            const isVideo = item.type === "video" || item.type === "gif";
            downloads.push({
                type: isVideo ? "MP4" : "JPG",
                quality: "Best",
                url: item.url,
                size: "ORIGINAL",
                label: `${isVideo ? "Video" : "Photo"} ${i + 1}`,
            });
        });
    }

    if (downloads.length === 0) throw new Error("Cobalt returned no downloadable media.");

    return {
        success: true,
        platform: platformId,
        engine: "Cobalt",
        title: cobaltData.filename || `${platformId} Post`,
        author: { nickname: `${platformId} User`, unique_id: platformId, avatar: "" },
        cover: cobaltData.picker?.[0]?.thumb || "",
        stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
        downloads,
    };
}

// ============================================================
// EXTRACTOR: Reddit — JSON API + yt-dlp + Cobalt
// ============================================================
async function extractReddit(videoUrl) {
    // Layer 1: yt-dlp
    try {
        const result = await extractYoutubeDL(videoUrl, "reddit");
        result.engine = "yt-dlp";
        return result;
    } catch (err) {
        console.log(`  ⚠️ yt-dlp failed for Reddit: ${err.message}`);
    }

    // Layer 2: Reddit JSON API
    try {
        console.log("  🤖 [Reddit] Layer 2: Reddit JSON API...");
        const jsonUrl = videoUrl.replace(/\/?(?:\?.*)?$/, '.json');
        const resp = await fetchWithTimeout(jsonUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
        });

        if (!resp.ok) throw new Error(`Reddit JSON returned ${resp.status}`);
        const json = await resp.json();

        const post = json?.[0]?.data?.children?.[0]?.data;
        if (!post) throw new Error("No post data found.");

        const downloads = [];
        const title = post.title || "Reddit Post";
        const author = post.author || "reddit_user";

        // Check for Reddit-hosted video
        if (post.secure_media?.reddit_video || post.media?.reddit_video) {
            const rv = post.secure_media?.reddit_video || post.media?.reddit_video;
            downloads.push({
                type: "MP4",
                quality: rv.height ? `${rv.height}p` : "Best",
                url: rv.fallback_url || rv.dash_url || rv.hls_url,
                size: "ORIGINAL",
                label: `Video ${rv.height || ""}p`,
            });
        }

        // Check for embedded external video (e.g., YouTube, Streamable)
        if (downloads.length === 0 && post.secure_media?.oembed) {
            const oembed = post.secure_media.oembed;
            if (oembed.url) {
                downloads.push({
                    type: "MP4",
                    quality: "Best",
                    url: oembed.url,
                    size: "ORIGINAL",
                    label: `External Video (${oembed.provider_name || "embed"})`,
                });
            }
        }

        // Check for gallery images
        if (downloads.length === 0 && post.is_gallery && post.media_metadata) {
            Object.values(post.media_metadata).forEach((media, i) => {
                if (media.s?.u) {
                    downloads.push({
                        type: "JPG",
                        quality: `${media.s.x}x${media.s.y}`,
                        url: media.s.u.replace(/&amp;/g, '&'),
                        size: "ORIGINAL",
                        label: `Image ${i + 1}`,
                    });
                }
            });
        }

        // Check for direct image link
        if (downloads.length === 0 && post.url && /\.(jpg|jpeg|png|gif|webp)/i.test(post.url)) {
            downloads.push({
                type: "JPG",
                quality: "Original",
                url: post.url,
                size: "ORIGINAL",
                label: "Image",
            });
        }

        if (downloads.length === 0) throw new Error("No media found in Reddit post.");

        return {
            success: true,
            platform: "reddit",
            engine: "Reddit JSON",
            title,
            author: { nickname: author, unique_id: author, avatar: "" },
            cover: post.thumbnail && post.thumbnail !== "self" ? post.thumbnail : "",
            stats: {
                play_count: 0,
                digg_count: post.ups || 0,
                comment_count: post.num_comments || 0,
                share_count: 0,
            },
            downloads,
        };
    } catch (redditErr) {
        console.log(`  ⚠️ Reddit JSON failed: ${redditErr.message}`);
    }

    // Reddit blocks server-side API calls; best handled via yt-dlp with cookies or on Vercel
    throw new Error("Reddit blocks server-side requests. Try deploying to Vercel or use cookies.txt.");
}

// ============================================================
// EXTRACTOR: Pinterest — oEmbed + yt-dlp + Cobalt
// ============================================================
async function extractPinterest(videoUrl) {
    // Layer 1: yt-dlp
    try {
        const result = await extractYoutubeDL(videoUrl, "pinterest");
        result.engine = "yt-dlp";
        return result;
    } catch (err) {
        console.log(`  ⚠️ yt-dlp failed for Pinterest: ${err.message}`);
    }

    // Layer 2: Pinterest oEmbed + page scrape
    try {
        console.log("  📌 [Pinterest] Layer 2: oEmbed API...");
        const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(videoUrl)}`;
        const resp = await fetchWithTimeout(oembedUrl, {
            headers: { "User-Agent": USER_AGENT },
        });

        if (!resp.ok) throw new Error(`Pinterest oEmbed returned ${resp.status}`);
        const oembed = await resp.json();

        const downloads = [];

        // oEmbed returns thumbnail_url — convert to original resolution
        const thumbUrl = oembed.thumbnail_url;
        if (thumbUrl) {
            // Pinterest image URLs: convert /236x/ thumbnail to /originals/
            const fullUrl = thumbUrl.replace(/\/\d+x\//, '/originals/');
            downloads.push({
                type: "JPG",
                quality: "Original",
                url: fullUrl,
                size: "ORIGINAL",
                label: "Pin Image (Original)",
            });
            // Also add the thumbnail as a smaller option
            downloads.push({
                type: "JPG",
                quality: "Thumbnail",
                url: thumbUrl,
                size: "ORIGINAL",
                label: "Pin Image (Thumbnail)",
            });
        }

        if (downloads.length === 0) throw new Error("Pinterest oEmbed returned no media.");

        return {
            success: true,
            platform: "pinterest",
            engine: "Pinterest oEmbed",
            title: oembed.title || "Pinterest Pin",
            author: {
                nickname: oembed.author_name || "Pinterest User",
                unique_id: oembed.author_url ? oembed.author_url.split('/').filter(Boolean).pop() : "pinterest",
                avatar: "",
            },
            cover: oembed.thumbnail_url || "",
            stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
            downloads,
        };
    } catch (pinErr) {
        console.log(`  ⚠️ Pinterest oEmbed failed: ${pinErr.message}`);
    }

    throw new Error("Pinterest extraction failed. Try a different pin URL.");
}

// ============================================================
// EXTRACTOR: Discord — CDN Proxy (Phase 3)
// ============================================================

async function extractDiscord(fileUrl) {
    console.log("  💬 [Discord] Direct CDN proxy...");

    // Extract filename from URL
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'discord_file';
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Detect file type from extension
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    let type = 'FILE';
    let label = 'Download File';
    if (videoExts.includes(ext)) { type = 'MP4'; label = `Video (${ext.toUpperCase()})`; }
    else if (audioExts.includes(ext)) { type = 'MP3'; label = `Audio (${ext.toUpperCase()})`; }
    else if (imageExts.includes(ext)) { type = 'JPG'; label = `Image (${ext.toUpperCase()})`; }

    // Verify the URL is accessible
    try {
        const headResp = await fetchWithTimeout(fileUrl, { method: 'HEAD', headers: { "User-Agent": USER_AGENT } }, 10000);
        if (!headResp.ok) throw new Error(`Discord CDN returned ${headResp.status}`);
    } catch (e) {
        throw new Error(`Discord file not accessible: ${e.message}`);
    }

    return {
        success: true,
        platform: "discord",
        engine: "CDN Direct",
        title: filename,
        author: { nickname: "Discord", unique_id: "discord", avatar: "" },
        cover: imageExts.includes(ext) ? fileUrl : "",
        stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
        downloads: [{
            type, quality: "Original",
            url: fileUrl,
            size: "ORIGINAL",
            label,
        }],
    };
}

// ============================================================
// EXTRACTOR: Instagram — yt-dlp + igram fallback (Phase 4)
// ============================================================

async function extractInstagramIgram(videoUrl) {
    // instagram-url-direct — npm pkg, no auth required, serves muxed CDN video URLs
    const data = await instagramGetUrl(videoUrl);
    if (!data || !data.url_list || data.url_list.length === 0) {
        throw new Error('instagram-url-direct: no media found');
    }
    return data.url_list.map((url, i) => ({
        type: "MP4",
        quality: "Best",
        url: url,
        size: "ORIGINAL",
        label: `Video ${i + 1} (+Audio)`,
    }));
}

async function extractInstagram(videoUrl) {
    // Layer 1: igram.world — no cookies/auth required, serves muxed video
    console.log("  📸 [Instagram] Layer 1: igram.world (no-auth)...");
    try {
        const downloads = await extractInstagramIgram(videoUrl);
        const hasVideo = downloads.some(f => f.type === "MP4");
        if (hasVideo) {
            return {
                success: true,
                platform: "instagram",
                engine: "igram.world",
                title: "Instagram Reel",
                author: { nickname: "Instagram User", unique_id: "instagram", avatar: "" },
                cover: "",
                stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
                downloads,
            };
        }
        console.log("  ⚠️ igram.world returned no video — trying yt-dlp...");
    } catch (e) {
        console.log(`  ⚠️ igram.world failed: ${e.message}`);
    }

    // Layer 2: yt-dlp (works best with cookies.txt for private content)
    console.log("  📸 [Instagram] Layer 2: yt-dlp fallback...");
    try {
        const result = await extractYoutubeDL(videoUrl, "instagram");
        const hasVideo = result.downloads?.some(f => f.type !== 'MP3');
        if (hasVideo) {
            result.engine = "yt-dlp";
            return result;
        }
        console.log("  ⚠️ yt-dlp returned only audio (DASH-only reel).");
    } catch (e) {
        console.log(`  ⚠️ yt-dlp failed for Instagram: ${e.message}`);
    }

    throw new Error("Instagram extraction failed. The reel may be private. Try logging in and re-exporting cookies.txt.");
}



// ============================================================
// EXTRACTOR: Facebook — Mobile URL + og:video (Phase 5)
// ============================================================

async function extractFacebook(videoUrl) {
    // Layer 1: yt-dlp with mobile URL
    const mobileUrl = videoUrl.replace("www.facebook.com", "m.facebook.com");
    try {
        const result = await extractYoutubeDL(mobileUrl, "facebook");
        result.engine = "yt-dlp (mobile)";
        return result;
    } catch (e) {
        console.log(`  ⚠️ yt-dlp mobile failed for Facebook: ${e.message}`);
    }

    // Solution 4: Layer 2 — Facebook oEmbed API
    console.log("  📘 [Facebook] Layer 2: oEmbed API...");
    try {
        const oembedUrl = `https://www.facebook.com/plugins/video/oembed.json?url=${encodeURIComponent(videoUrl)}`;
        const oembedResp = await fetchWithTimeout(oembedUrl, {
            headers: { "User-Agent": USER_AGENT },
        });

        if (oembedResp.ok) {
            const oembedData = await oembedResp.json();
            // Parse video URL from the iframe HTML
            const iframeSrcMatch = oembedData.html?.match(/src="([^"]+)"/i);
            if (iframeSrcMatch) {
                const embedPageUrl = iframeSrcMatch[1].replace(/&amp;/g, '&');
                // Try to fetch the embed page for the actual video source
                const embedResp = await fetchWithTimeout(embedPageUrl, {
                    headers: { "User-Agent": USER_AGENT },
                });
                const embedHtml = await embedResp.text();
                const videoSrcMatch = embedHtml.match(/"playable_url(?:_quality_hd)?"\s*:\s*"([^"]+)"/i)
                    || embedHtml.match(/"video_url"\s*:\s*"([^"]+)"/i);

                if (videoSrcMatch) {
                    const fbVideoUrl = videoSrcMatch[1].replace(/\\/g, '').replace(/&amp;/g, '&');
                    return {
                        success: true,
                        platform: "facebook",
                        engine: "oEmbed API",
                        title: oembedData.title || "Facebook Video",
                        author: { nickname: oembedData.author_name || "Facebook User", unique_id: "facebook", avatar: "" },
                        cover: "",
                        stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
                        downloads: [{ type: "MP4", quality: "Best", url: fbVideoUrl, size: "ORIGINAL", label: "Video (oEmbed)" }],
                    };
                }
            }
        }
    } catch (e) {
        console.log(`  ⚠️ Facebook oEmbed failed: ${e.message}`);
    }

    // Layer 3: Try original URL with yt-dlp
    try {
        const result = await extractYoutubeDL(videoUrl, "facebook");
        result.engine = "yt-dlp";
        return result;
    } catch (e) {
        console.log(`  ⚠️ yt-dlp failed for Facebook: ${e.message}`);
    }

    // Layer 4: Scrape og:video meta tag
    console.log("  📘 [Facebook] Layer 4: og:video scrape...");
    try {
        const resp = await fetchWithTimeout(videoUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            },
        });
        const html = await resp.text();
        const ogVideoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
            html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);

        if (ogVideoMatch && ogVideoMatch[1]) {
            const videoDirectUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
            return {
                success: true,
                platform: "facebook",
                engine: "og:video scrape",
                title: "Facebook Video",
                author: { nickname: "Facebook User", unique_id: "facebook", avatar: "" },
                cover: "",
                stats: { play_count: 0, digg_count: 0, comment_count: 0, share_count: 0 },
                downloads: [{ type: "MP4", quality: "Best", url: videoDirectUrl, size: "ORIGINAL", label: "Video (og:video)" }],
            };
        }
    } catch (e) {
        console.log(`  ⚠️ og:video scrape failed: ${e.message}`);
    }

    throw new Error("Facebook extraction failed. Try using a direct video URL.");
}

// ============================================================
// EXTRACTOR: Generic (youtube-dl-exec) with retry (Phase 6)
// ============================================================

async function extractYoutubeDL(videoUrl, platformId = "unknown") {
    console.log(`  🎬 Fetching via youtube-dl-exec (${platformId})...`);

    // Platform-specific headers
    const headers = [`user-agent:${USER_AGENT}`];
    if (platformId === 'twitter') headers.push('referer:https://twitter.com');
    else if (platformId === 'instagram') headers.push('referer:https://www.instagram.com');
    else if (platformId === 'reddit') headers.push('referer:https://www.reddit.com');

    // Solution 5: Build yt-dlp options with optional cookies
    const ytdlpOpts = {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: headers,
    };

    // Add cookies if available (unlocks auth-required content)
    if (HAS_COOKIES && ['instagram', 'facebook', 'tiktok', 'twitter'].includes(platformId)) {
        ytdlpOpts.cookies = COOKIES_PATH;
        console.log(`  🍪 Using cookies.txt for ${platformId}`);
    }

    try {
        const output = await youtubedl(videoUrl, ytdlpOpts);

        const formats = [];

        if (output.formats && Array.isArray(output.formats)) {
            const valid = output.formats.filter(f => f.url && f.protocol !== 'm3u8_native');

            // Categorize by type
            const muxed = valid.filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none');
            const audioOnly = valid.filter(f => f.vcodec === 'none' && f.acodec && f.acodec !== 'none');
            const videoOnly = valid.filter(f => f.acodec === 'none' && f.vcodec && f.vcodec !== 'none');
            // videoOnly are DASH video-only streams — excluded from normal list, used as last resort only


            // Build download list: muxed first (video+audio), then audio-only
            const combined = [...muxed, ...audioOnly];

            // If no muxed found (pure DASH platform), fall through to output.url below
            combined.forEach(f => {
                const isAudioOnly = f.vcodec === 'none';
                let type = "MP4";
                if (isAudioOnly) type = "MP3";
                else if (f.ext === "webm") type = "WEBM";

                const qualityNote = f.format_note || f.resolution || f.quality || "Unknown";
                const ext = f.ext || "mp4";
                const audioTag = isAudioOnly ? "" : " (+Audio)";
                const label = `${qualityNote}${audioTag} - ${ext}`;
                const size = f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? `~${formatBytes(f.filesize_approx)}` : "Unknown");

                formats.push({
                    type: type.toUpperCase(),
                    quality: f.height ? `${f.height}p` : (isAudioOnly ? "Audio" : "Best"),
                    url: f.url,
                    size: size,
                    label: label
                });
            });

            // Last resort: if no muxed formats exist at all (pure DASH platform),
            // surface the best video-only stream with a clear [No Audio] label
            const hasVideoFormat = formats.some(f => f.type !== 'MP3');
            if (!hasVideoFormat && videoOnly.length > 0) {
                console.log(`  ⚠️ No muxed formats found — surfacing top DASH video-only as fallback`);
                // Take only the best quality video-only format
                const best = videoOnly.sort((a, b) => (b.height || 0) - (a.height || 0)).slice(0, 1);
                best.forEach(f => {
                    const size = f.filesize ? formatBytes(f.filesize) : (f.filesize_approx ? `~${formatBytes(f.filesize_approx)}` : "Unknown");
                    formats.push({
                        type: "MP4",
                        quality: f.height ? `${f.height}p` : "Best",
                        url: f.url,
                        size: size,
                        label: `${f.format_note || f.resolution || 'Best'} [No Audio] - ${f.ext || 'mp4'}`
                    });
                });
            }
        }

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
            engine: "yt-dlp",
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
            downloads: formats.reverse()
        };

    } catch (err) {
        throw new Error(`youtube-dl failed: ${err.message}`);
    }
}

// Phase 6: Retry wrapper for generic platforms
async function extractWithRetry(videoUrl, platformId) {
    try {
        return await extractYoutubeDL(videoUrl, platformId);
    } catch (e) {
        if (e.message.includes('timed out') || e.message.includes('fetch failed') || e.message.includes('ECONNRESET')) {
            console.log(`  🔄 Retrying ${platformId} after 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            return await extractYoutubeDL(videoUrl, platformId);
        }
        throw e;
    }
}

// ============================================================
// API ROUTES
// ============================================================

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        engine: "zeroloader-v7",
        platforms: Object.values(PLATFORMS).map(p => p.name),
        timestamp: new Date().toISOString(),
    });
});

app.post("/api/extract", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // Phase 8: URL validation
    if (!isValidUrl(url)) {
        return res.status(400).json({ error: "Invalid URL. Please provide a valid http or https link." });
    }

    const platform = detectPlatform(url);
    const platformId = platform ? platform.id : "unknown";
    console.log(`\n📥 Extract request: [${platformId}] ${url}`);

    try {
        let data;
        switch (platformId) {
            case 'tiktok':
                data = await extractTikTok(url);
                break;
            case 'twitter':
                data = await extractTwitter(url);
                break;
            case 'discord':
                data = await extractDiscord(url);
                break;
            case 'instagram':
                data = await extractInstagram(url);
                break;
            case 'facebook':
                data = await extractFacebook(url);
                break;
            case 'reddit':
                data = await extractReddit(url);
                break;
            case 'pinterest':
                data = await extractPinterest(url);
                break;
            // Generic platforms with retry logic
            case 'vimeo':
            case 'dailymotion':
            case 'tumblr':
            case 'twitch':
                data = await extractWithRetry(url, platformId);
                break;
            default:
                data = await extractYoutubeDL(url, platformId);
                break;
        }

        // Phase 8: Add engine info to response
        console.log(`  ✅ Success via ${data.engine || 'unknown'} — ${data.downloads?.length || 0} formats`);
        res.json(data);
    } catch (err) {
        console.log(`  ❌ Failed: ${err.message}`);

        // Platform-specific error messages
        let details = "Please check if the content is public and the URL is correct.";
        if (platformId === 'instagram') details = "Instagram often requires authentication. Try with a public post URL.";
        else if (platformId === 'facebook') details = "Facebook videos must be public. Try using a direct video URL.";
        else if (platformId === 'discord') details = "Make sure the Discord CDN link is still valid and not expired.";

        res.status(500).json({
            error: err.message || "Extraction failed",
            details,
            platform: platformId,
        });
    }
});

app.get("/api/download", async (req, res) => {
    const mediaUrl = req.query.url;
    const fmtHint = req.query.fmt; // optional: "mp4", "mp3", "webm", "jpg"
    if (!mediaUrl) return res.status(400).json({ error: "Missing url parameter" });

    try {
        const response = await fetchWithTimeout(mediaUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": mediaUrl,
                "Accept": "*/*",
            },
        }, 30000);

        if (!response.ok) return res.status(response.status).json({ error: "Upstream error" });

        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // --- Robust extension detection ---
        // Priority 1: Frontend hint (most reliable — knows what format was selected)
        // Priority 2: Detect from URL path extension
        // Priority 3: Detect from content-type header
        // Priority 4: Fallback to mp4 (most downloads are video)

        let ext = null;

        // Priority 1: Frontend format hint
        if (fmtHint && /^(mp4|mp3|webm|mov|avi|mkv|jpg|jpeg|png|gif|webp|wav|ogg|flac|m4a)$/i.test(fmtHint)) {
            ext = fmtHint.toLowerCase();
        }

        // Priority 2: Extract from URL path
        if (!ext) {
            try {
                const urlPath = new URL(mediaUrl).pathname;
                const urlExt = urlPath.split('.').pop()?.toLowerCase();
                if (urlExt && /^(mp4|mp3|webm|mov|avi|mkv|jpg|jpeg|png|gif|webp|wav|ogg|flac|m4a)$/.test(urlExt)) {
                    ext = urlExt;
                }
            } catch (_) { /* ignore URL parse errors */ }
        }

        // Priority 3: Content-Type mapping
        if (!ext) {
            const ctMap = {
                "video/mp4": "mp4",
                "video/webm": "webm",
                "video/quicktime": "mov",
                "video/x-msvideo": "avi",
                "video/x-matroska": "mkv",
                "audio/mpeg": "mp3",
                "audio/mp3": "mp3",
                "audio/mp4": "m4a",
                "audio/ogg": "ogg",
                "audio/wav": "wav",
                "audio/x-wav": "wav",
                "audio/flac": "flac",
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/gif": "gif",
                "image/webp": "webp",
            };
            // Exact match first
            const ctLower = contentType.split(';')[0].trim().toLowerCase();
            if (ctMap[ctLower]) {
                ext = ctMap[ctLower];
            } else {
                // Partial match fallback
                if (contentType.includes("mp4") || contentType.includes("video")) ext = "mp4";
                else if (contentType.includes("mpeg") || contentType.includes("mp3") || contentType.includes("audio")) ext = "mp3";
                else if (contentType.includes("webm")) ext = "webm";
                else if (contentType.includes("image")) ext = "jpg";
            }
        }

        // Priority 4: Ultimate fallback — assume mp4 (most common download)
        if (!ext) ext = "mp4";

        // Set proper headers for download
        const finalContentType = ext === "mp4" ? "video/mp4"
            : ext === "mp3" ? "audio/mpeg"
                : ext === "webm" ? "video/webm"
                    : ext === "mov" ? "video/quicktime"
                        : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
                            : ext === "png" ? "image/png"
                                : ext === "gif" ? "image/gif"
                                    : ext === "webp" ? "image/webp"
                                        : contentType;

        res.setHeader("Content-Type", finalContentType);
        res.setHeader("Content-Disposition", `attachment; filename="zeroloader_${Date.now()}.${ext}"`);

        // Forward content-length if available
        const contentLength = response.headers.get("content-length");
        if (contentLength) res.setHeader("Content-Length", contentLength);

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
        const response = await fetchWithTimeout(imageUrl, {
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
        console.log(`   Platforms: ${Object.keys(PLATFORMS).length} supported`);
    });
}

// Export for Vercel
export default app;
