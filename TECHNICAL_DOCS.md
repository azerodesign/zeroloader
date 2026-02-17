# ZeroLoader V7 - Technical Documentation

## 1. Overview
ZeroLoader V7 is a high-performance web application designed for multi-platform video and audio extraction. It utilizes a **Hybrid Engine System** to ensure high availability and success rates across 12+ major platforms.

## 2. System Architecture

### Hybrid Engine (Backend)
The backend (located in `api/index.js`) acts as an intelligent router for extraction requests:
- **Primary Source (TikTok)**: Specialized extraction via the TikWM API for high-fidelity No-Watermark MP4s and original MP3s.
- **Primary Source (Twitter/X)**: Uses `youtube-dl-exec` (yt-dlp) with an automatic fallback to `api.vxtwitter.com` for maximum reliability.
- **Universal Engine**: Support for 12+ platforms (YouTube, Instagram, Facebook, Reddit, etc.) powered by `yt-dlp`.

### Proxy System
To bypass browser CORS restrictions and hotlink protection:
- **Download Proxy**: Stream-based proxy that pipes media directly from the source to the user, bypassing client-side blocks.
- **Image Proxy**: Specialized endpoint for bypassing domain-locking on thumbnails/avatars.

## 3. Frontend Architecture

### UI/UX Design
- **Style**: Modern Glassmorphism using Vanilla CSS + Tailwind.
- **State Management**: React `useState` for UI views (Splash -> Landing -> Dashboard) and data flow.
- **Real-time Feedback**: Hacker-style console logging using a managed state array to provide technical transparency during extraction.

### Feature List
- **Auto-Platform Detection**: Real-time URL analysis to provide visual feedback and routing hints.
- **History System**: Persistent local storage for the last 10 successful extractions.
- **Dark Mode**: Integrated system-wide dark/light toggle.

## 4. API Reference

### `POST /api/extract`
Extracts metadata and download links from a URL.
- **Body**: `{ "url": "string" }`
- **Response**: Comprehensive object including `title`, `author`, `stats`, and a `downloads` array.

### `GET /api/health`
System status and supported platforms list.

### `GET /api/download?url=...`
Initiates a proxied download with appropriate content-type headers.

## 5. Deployment & Configuration

### Prerequisites
- Node.js v18+
- yt-dlp binary (handled via `youtube-dl-exec`)

### Environment Variables
- `PORT`: (Optional) Backend port, defaults to 3001.
- `NODE_ENV`: Set to `production` for Vercel/Cloud deployments.

### Local Running
```bash
npm install
npm run dev    # Starts Vite (Port 5173)
npm run server # Starts Backend (Port 3001)
```

---
*Developed by Kamal & FgsiDev.*
