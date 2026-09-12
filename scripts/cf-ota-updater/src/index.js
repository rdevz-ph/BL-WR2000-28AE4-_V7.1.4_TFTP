/**
 * BL-WR2000 HTTP OTA Updater Cloudflare Worker
 *
 * Serves as a lightweight HTTP bridge between the router's embedded wget (which lacks SSL/TLS)
 * and GitHub Releases / main branch (which require HTTPS with redirect handling).
 *
 * High Performance & Zero-CPU Architecture:
 * - Reads lightweight metadata (version, MD5, size) without downloading heavy binaries into memory
 * - Completely avoids in-Worker MD5 hashing, staying well within Cloudflare Free 10ms CPU limits
 * - Streams firmware binaries directly to the router using streaming fetch responses
 * - Caches metadata for 60 seconds to respect GitHub rate limits
 */

// In-memory cache for firmware metadata
let cachedMeta = null;
let lastMetaCheck = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

/**
 * Normalizes GitHub web URLs into direct raw download URLs
 */
function normalizeGithubUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.replace(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/,
    "https://raw.githubusercontent.com/$1/$2/$3/$4"
  );
  url = url.replace(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/raw\/([^\/]+)\/(.+)$/,
    "https://raw.githubusercontent.com/$1/$2/$3/$4"
  );
  return url;
}

/**
 * Formats a Date or ISO string into a clean readable string: YYYY-MM-DD HH:MM:SS UTC
 */
function formatDateTime(dateInput) {
  if (!dateInput) return "Just now";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Lightweight firmware metadata resolver (0ms CPU, zero binary buffering)
 */
async function resolveFirmwareMetadata(env) {
  const now = Date.now();
  if (cachedMeta && (now - lastMetaCheck) < CACHE_TTL_MS) {
    return cachedMeta;
  }

  const primaryDownloadUrl = normalizeGithubUrl(
    env.FIRMWARE_DOWNLOAD_URL ||
    "https://github.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/releases/download/pre-release/update_firmware.bin"
  );
  const fallbackDownloadUrl = normalizeGithubUrl(
    env.FALLBACK_DOWNLOAD_URL ||
    "https://raw.githubusercontent.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/main/update_firmware.bin"
  );
  const versionInfoUrl = normalizeGithubUrl(
    env.VERSION_INFO_URL ||
    "https://raw.githubusercontent.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/main/rootfs/etc_ro/FW-Version"
  );
  const md5InfoUrl = normalizeGithubUrl(
    env.MD5_INFO_URL ||
    "https://github.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/releases/download/pre-release/update_firmware.bin.md5"
  );
  const fallbackMd5Url = normalizeGithubUrl(
    env.FALLBACK_MD5_URL ||
    "https://raw.githubusercontent.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP/main/update_firmware.bin.md5"
  );
  const fallbackVersion = env.FALLBACK_VERSION || env.FIRMWARE_VERSION || "7.1.4";
  const fallbackMd5 = env.FALLBACK_MD5 || "950126ed7542b27b1f2cefbd8cb64927";

  let detectedVersion = fallbackVersion;
  let resolvedMd5 = fallbackMd5;
  let binarySize = 3792995; // Baseline firmware size (~3.79 MB)
  let effectiveDownloadUrl = primaryDownloadUrl;

  // 1. Fetch version from rootfs/etc_ro/FW-Version (~28 bytes)
  try {
    const vResp = await fetch(versionInfoUrl, {
      headers: { "User-Agent": "BL-WR2000-OTA-Worker" },
      cf: { cacheTtl: 60 },
    });
    if (vResp.ok) {
      const vText = (await vResp.text()).trim();
      if (vText.includes(",")) {
        detectedVersion = vText.split(",")[1].trim();
      } else if (vText.length > 0) {
        detectedVersion = vText;
      }
    }
  } catch (err) {
    console.warn("Could not fetch version string from upstream:", err);
  }

  // 2. Fetch pre-calculated MD5 hash (~32 bytes)
  let md5Fetched = false;
  for (const url of [md5InfoUrl, fallbackMd5Url]) {
    try {
      const md5Resp = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "BL-WR2000-OTA-Worker" },
        cf: { cacheTtl: 60 },
      });
      if (md5Resp.ok) {
        const hashText = (await md5Resp.text()).trim().split(/\s+/)[0];
        if (hashText && hashText.length === 32) {
          resolvedMd5 = hashText;
          md5Fetched = true;
          break;
        }
      }
    } catch (md5Err) {
      console.warn(`Could not fetch MD5 from ${url}:`, md5Err);
    }
  }

  // 3. Probe file size and check primary URL availability via lightweight HEAD request (0 bytes payload)
  try {
    const headResp = await fetch(primaryDownloadUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "BL-WR2000-OTA-Worker" },
      cf: { cacheTtl: 60 },
    });
    if (headResp.ok) {
      effectiveDownloadUrl = primaryDownloadUrl;
      const cl = headResp.headers.get("content-length");
      if (cl && parseInt(cl, 10) > 0) {
        binarySize = parseInt(cl, 10);
      }
    } else if (fallbackDownloadUrl) {
      effectiveDownloadUrl = fallbackDownloadUrl;
      const fbHead = await fetch(fallbackDownloadUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": "BL-WR2000-OTA-Worker" },
        cf: { cacheTtl: 60 },
      });
      if (fbHead.ok) {
        const cl = fbHead.headers.get("content-length");
        if (cl && parseInt(cl, 10) > 0) {
          binarySize = parseInt(cl, 10);
        }
      }
    }
  } catch (probeErr) {
    console.warn("Failed to probe download URL size via HEAD:", probeErr);
  }

  cachedMeta = {
    version: detectedVersion,
    md5: resolvedMd5,
    size: binarySize,
    downloadUrl: effectiveDownloadUrl,
    fallbackUrl: fallbackDownloadUrl,
    checkedAt: new Date(now).toISOString(),
  };
  lastMetaCheck = now;

  return cachedMeta;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // 1. Health check / ping
    if (pathname === "/ping" || pathname === "/health") {
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const meta = await resolveFirmwareMetadata(env);
    const version = meta.version;
    const md5 = meta.md5;
    const fwUrl = meta.downloadUrl;
    const notesEn = env.RELEASE_NOTES_EN || "BL-WR2000 Custom Firmware v7.1.4: Dedicated Health Check diagnostic dashboard, Timezone & NTP sync fix, UTC+8 Philippines Manila default, DHCP DNS fix, Telnet management, and modern dark UI.";
    const notesZh = env.RELEASE_NOTES_ZH || "BL-WR2000 自定义固件 v7.1.4: 专用健康检查诊断页面、修复时区与NTP同步、默认UTC+8菲律宾马尼拉、修复DHCP DNS、支持Telnet管理与暗黑风格UI。";

    // 2. Vendor upgrade.txt endpoint (for router upgrade binary and libshare)
    // Matches: /image/WRS-432-300M-28N-S-EN/upgrade.txt, /image/.../upgrade.txt, /upgrade.txt
    if (pathname.endsWith("/upgrade.txt")) {
      const txtContent = [
        "update_firmware.bin",
        version,
        md5,
        `lastver=${version}`,
        `content_zh=${notesZh}`,
        `content_en=${notesEn}`,
      ].join("\n") + "\n";

      return new Response(txtContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Length": txtContent.length.toString(),
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 3. Firmware binary download proxy (streaming - zero RAM buffering)
    // Matches: /image/WRS-432-300M-28N-S-EN/update_firmware.bin, /update_firmware.bin, /firmware, /download
    if (
      pathname.endsWith("/update_firmware.bin") ||
      pathname === "/firmware" ||
      pathname === "/download"
    ) {
      try {
        let ghResponse = await fetch(fwUrl, {
          redirect: "follow",
          headers: {
            "User-Agent": "BL-WR2000-OTA-Updater",
          },
          cf: { cacheTtl: 300 },
        });

        if (!ghResponse.ok && meta.fallbackUrl && fwUrl !== meta.fallbackUrl) {
          const fbResponse = await fetch(meta.fallbackUrl, {
            redirect: "follow",
            headers: {
              "User-Agent": "BL-WR2000-OTA-Updater",
            },
            cf: { cacheTtl: 300 },
          });
          if (fbResponse.ok) {
            ghResponse = fbResponse;
          }
        }

        if (!ghResponse.ok) {
          return new Response(`Error fetching firmware from upstream: ${ghResponse.status} ${ghResponse.statusText}`, {
            status: 502,
            headers: { "Content-Type": "text/plain" },
          });
        }

        const headers = new Headers();
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Disposition", 'attachment; filename="update_firmware.bin"');
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=300");

        const contentLength = ghResponse.headers.get("content-length");
        if (contentLength) {
          headers.set("Content-Length", contentLength);
        }

        return new Response(ghResponse.body, {
          status: 200,
          headers: headers,
        });
      } catch (err) {
        return new Response(`Internal error proxying firmware: ${err.message}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }

    // 4. Modern JSON API for Web Admin UI
    if (pathname === "/api/version" || pathname === "/version.json") {
      const data = {
        model: "WRS-432-300M-28N-S-EN",
        current_base_version: "7.1.4",
        lastver: version,
        md5: md5,
        size_bytes: meta.size,
        download_url: `${url.origin}/image/WRS-432-300M-28N-S-EN/update_firmware.bin`,
        direct_url: `${url.origin}/update_firmware.bin`,
        github_url: fwUrl,
        checked_at: meta.checkedAt,
        checked_at_formatted: formatDateTime(meta.checkedAt),
        content_en: notesEn,
        content_zh: notesZh,
      };

      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 5. Root status dashboard
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BL-WR2000 OTA Firmware Updater</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; line-height: 1.6; }
    .card { max-width: 680px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #38bdf8; margin-top: 0; font-size: 24px; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #334155; font-size: 14px; }
    .info-table td:first-child { color: #94a3b8; width: 150px; }
    .link-btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; margin-top: 10px; margin-right: 10px; }
    .link-btn:hover { background: #0369a1; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #38bdf8; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h1>BL-WR2000 OTA Firmware Updater <span class="badge">Dynamic</span></h1>
    <p>This Cloudflare Worker dynamically bridges plain HTTP for router OTA updates with GitHub Releases and pre-computed checksums.</p>
    
    <table class="info-table">
      <tr><td>Target Model</td><td><code>WRS-432-300M-28N-S-EN</code></td></tr>
      <tr><td>Detected Version</td><td><strong>${version}</strong></td></tr>
      <tr><td>Dynamic MD5</td><td><code>${md5}</code></td></tr>
      <tr><td>Binary Size</td><td>${meta.size > 0 ? (meta.size / 1024 / 1024).toFixed(2) + " MB (" + meta.size.toLocaleString() + " bytes)" : "Streamed"}</td></tr>
      <tr><td>Upstream Source</td><td><code>${fwUrl}</code></td></tr>
      <tr><td>Last Check</td><td><strong>${formatDateTime(meta.checkedAt)}</strong></td></tr>
      <tr><td>Release Notes</td><td>${notesEn}</td></tr>
    </table>

    <h3>Available Endpoints:</h3>
    <ul>
      <li><a href="/image/WRS-432-300M-28N-S-EN/upgrade.txt" style="color:#38bdf8">Router Native upgrade.txt</a></li>
      <li><a href="/update_firmware.bin" style="color:#38bdf8">Download Firmware Binary (HTTP Stream)</a></li>
      <li><a href="/api/version" style="color:#38bdf8">JSON Version API</a></li>
      <li><a href="/ping" style="color:#38bdf8">Health Check</a></li>
    </ul>

    <a href="/update_firmware.bin" class="link-btn">Download update_firmware.bin</a>
    <a href="https://github.com/rdevz-ph/BL-WR2000-28AE4-_V7.1.4_TFTP" class="link-btn" style="background:#475569">GitHub Repository</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
};
