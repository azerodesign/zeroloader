const API = "http://localhost:3001/api/extract";

async function test(url, label) {
    const start = Date.now();
    try {
        const r = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            signal: AbortSignal.timeout(60000),
        });
        const d = await r.json();
        const ms = Date.now() - start;
        if (d.success) {
            console.log(`[PASS] ${label} (${ms}ms) engine=${d.engine} formats=${(d.downloads || []).length}`);
        } else {
            console.log(`[FAIL] ${label} (${ms}ms) ${(d.error || "").substring(0, 200)}`);
        }
    } catch (e) {
        console.log(`[CRASH] ${label} (${(Date.now() - start)}ms) ${e.message.substring(0, 200)}`);
    }
}

async function main() {
    console.log("=== TARGETED TESTS V3 ===");
    console.log("");

    // Twitter - photo tweet (more reliable)
    await test("https://x.com/SpaceX/status/1879290403003846860", "Twitter-SpaceX");
    console.log("");

    // Reddit - video post (known to have reddit_video)
    await test("https://www.reddit.com/r/cats/comments/1bx8n5m/", "Reddit-Cats");
    console.log("");

    // Reddit - image post 
    await test("https://www.reddit.com/r/aww/comments/1f2k3m8/", "Reddit-Image");
    console.log("");

    // Dailymotion
    await test("https://www.dailymotion.com/video/x7tgad0", "Dailymotion");
    console.log("");

    // Pinterest
    await test("https://www.pinterest.com/pin/312296555392530506/", "Pinterest");
    console.log("");

    // YouTube (should always work)
    await test("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "YouTube");
    console.log("");

    // SoundCloud (should work)  
    await test("https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4", "SoundCloud");
    console.log("");

    console.log("=== DONE ===");
}

main();
