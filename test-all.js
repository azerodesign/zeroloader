const API = "http://localhost:3001/api/extract";

async function test(url, label) {
    const start = Date.now();
    try {
        const r = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            signal: AbortSignal.timeout(45000),
        });
        const j = await r.json();
        const ms = Date.now() - start;
        if (j.error) {
            console.log("[FAIL] " + label + " (" + ms + "ms): " + j.error.substring(0, 120));
            return { label, ok: false, reason: j.error.substring(0, 100), ms };
        } else {
            const title = (j.title || "").substring(0, 50);
            console.log("[PASS] " + label + " (" + ms + "ms): title=\"" + title + "\" engine=" + j.engine + " formats=" + (j.downloads || []).length);
            return { label, ok: true, engine: j.engine, formats: (j.downloads || []).length, ms };
        }
    } catch (e) {
        const ms = Date.now() - start;
        console.log("[CRASH] " + label + " (" + ms + "ms): " + e.message.substring(0, 100));
        return { label, ok: false, reason: e.message.substring(0, 100), ms };
    }
}

async function main() {
    console.log("=== ZEROLOADER FULL TEST SUITE V2 ===");
    console.log("Time: " + new Date().toISOString());
    console.log("");
    const results = [];

    // 1. YouTube (reliable)
    console.log("--- YOUTUBE ---");
    results.push(await test("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "YouTube: Rick Astley"));
    results.push(await test("https://youtu.be/9bZkp7q19f0", "YouTube: Gangnam Style (short URL)"));

    // 2. SoundCloud
    console.log("--- SOUNDCLOUD ---");
    results.push(await test("https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4", "SoundCloud: Rick Astley"));

    // 3. TikTok (4-layer fallback)
    console.log("--- TIKTOK ---");
    results.push(await test("https://www.tiktok.com/@tiktok/video/7456327867137398058", "TikTok: Official"));

    // 4. Twitter/X (3-layer fallback)
    console.log("--- TWITTER/X ---");
    results.push(await test("https://x.com/NASA/status/1880674668048081378", "Twitter: NASA"));

    // 5. Instagram (3-layer fallback)
    console.log("--- INSTAGRAM ---");
    results.push(await test("https://www.instagram.com/p/C1234567890/", "Instagram: Post"));

    // 6. Facebook (4-layer fallback)
    console.log("--- FACEBOOK ---");
    results.push(await test("https://www.facebook.com/reel/939826931518143", "Facebook: Reel"));

    // 7. Discord
    console.log("--- DISCORD ---");
    results.push(await test("https://cdn.discordapp.com/attachments/123/456/test.mp4", "Discord: CDN (fake)"));

    // 8. Vimeo
    console.log("--- VIMEO ---");
    results.push(await test("https://vimeo.com/76979871", "Vimeo: Video"));

    // 9. Reddit
    console.log("--- REDDIT ---");
    results.push(await test("https://www.reddit.com/r/aww/comments/1irjz2y/", "Reddit: Post"));

    // 10. Dailymotion
    console.log("--- DAILYMOTION ---");
    results.push(await test("https://www.dailymotion.com/video/x8m8m1i", "Dailymotion: Video"));

    // 11. Pinterest
    console.log("--- PINTEREST ---");
    results.push(await test("https://www.pinterest.com/pin/1234567890/", "Pinterest: Pin"));

    // 12. Twitch
    console.log("--- TWITCH ---");
    results.push(await test("https://www.twitch.tv/videos/2364215498", "Twitch: VOD"));

    // 13. Tumblr
    console.log("--- TUMBLR ---");
    results.push(await test("https://www.tumblr.com/staff", "Tumblr: Staff blog"));

    // 14. Edge cases
    console.log("--- EDGE CASES ---");
    results.push(await test("not-a-real-url", "Edge: Invalid URL"));
    results.push(await test("https://www.unknownsite.xyz/video/123", "Edge: Unknown platform"));
    results.push(await test("", "Edge: Empty URL"));

    // Summary
    console.log("");
    console.log("==========================================");
    console.log("            TEST RESULTS SUMMARY          ");
    console.log("==========================================");

    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    const totalMs = results.reduce((sum, r) => sum + (r.ms || 0), 0);

    console.log("Total: " + results.length + " | Passed: " + passed + " | Failed: " + failed);
    console.log("Total time: " + (totalMs / 1000).toFixed(1) + "s");
    console.log("");

    console.log("PASSED:");
    results.filter(r => r.ok).forEach(r => console.log("  ✅ " + r.label + " (engine=" + r.engine + ", formats=" + r.formats + ", " + r.ms + "ms)"));
    console.log("");

    console.log("FAILED:");
    results.filter(r => !r.ok).forEach(r => console.log("  ❌ " + r.label + " (" + r.ms + "ms): " + r.reason));
    console.log("");

    console.log("Pass rate: " + Math.round(passed / results.length * 100) + "%");
    console.log("");

    // Categorize failures
    const envFails = results.filter(r => !r.ok && (r.reason?.includes('fetch failed') || r.reason?.includes('DNS') || r.reason?.includes('ECONNRESET') || r.reason?.includes('timed out')));
    const authFails = results.filter(r => !r.ok && (r.reason?.includes('auth') || r.reason?.includes('login') || r.reason?.includes('401') || r.reason?.includes('403')));
    const codeFails = results.filter(r => !r.ok && !envFails.includes(r) && !authFails.includes(r));

    if (envFails.length > 0) {
        console.log("🌐 Environment issues (will work on Vercel): " + envFails.length);
        envFails.forEach(r => console.log("   - " + r.label));
    }
    if (authFails.length > 0) {
        console.log("🔒 Auth required: " + authFails.length);
        authFails.forEach(r => console.log("   - " + r.label));
    }
    if (codeFails.length > 0) {
        console.log("⚙️ Other failures: " + codeFails.length);
        codeFails.forEach(r => console.log("   - " + r.label + ": " + r.reason?.substring(0, 80)));
    }
}

main();
