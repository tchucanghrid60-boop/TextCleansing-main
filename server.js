const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Local development may use .env. In production, the platform injects secrets as
// process environment variables and the container intentionally does not include .env.
loadLocalEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 3000);
const API_URL = 'https://api.aiforthai.in.th/textcleansing';
const API_KEY = process.env.AIFORTHAI_API_KEY || '';
const publicDir = path.resolve(__dirname, 'public');
const MAX_BODY_BYTES = 1024 * 1024;
const API_TIMEOUT_MS = 30_000;

function loadLocalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

async function readFormBody(req) {
  const declaredLength = Number(req.headers['content-length'] || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    const error = new Error('ข้อความมีขนาดใหญ่เกินไป');
    error.statusCode = 413;
    throw error;
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      const error = new Error('ข้อความมีขนาดใหญ่เกินไป');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function handleCleansing(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST', 'Cache-Control': 'no-store' });
    return res.end();
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/x-www-form-urlencoded')) {
    return sendJson(res, 415, { error: 'รูปแบบข้อมูลที่ส่งมาไม่รองรับ' });
  }

  let params;
  try {
    params = new URLSearchParams(await readFormBody(req));
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: error.message || 'อ่านข้อมูลไม่สำเร็จ' });
  }

  const text = params.get('text') || '';
  if (!text.trim()) {
    return sendJson(res, 400, { error: 'กรุณากรอกข้อความที่ต้องการแก้ไข' });
  }
  if (!API_KEY) {
    return sendJson(res, 503, { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า API Key' });
  }

  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Apikey: API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ text }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const responseText = await upstream.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (!upstream.ok) {
      return sendJson(res, upstream.status, {
        ok: false,
        status: upstream.status,
        error: `บริการ AI for Thai ตอบกลับด้วยสถานะ ${upstream.status}`,
      });
    }

    return sendJson(res, 200, { ok: true, status: upstream.status, data });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return sendJson(res, 504, { error: 'บริการใช้เวลานานเกินกำหนด กรุณาลองอีกครั้ง' });
    }
    return sendJson(res, 502, { error: 'เชื่อมต่อบริการ Text Cleansing ไม่สำเร็จ กรุณาลองอีกครั้ง' });
  }
}

function serveStatic(req, res) {
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return sendJson(res, 400, { error: 'เส้นทางคำขอไม่ถูกต้อง' });
  }

  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, relativePath);
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${path.sep}`)) {
    return sendJson(res, 403, { error: 'ไม่อนุญาตให้เข้าถึงไฟล์นี้' });
  }

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(res, 404, { error: 'ไม่พบหน้าเว็บ' });
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    return sendJson(res, 400, { error: 'คำขอไม่ถูกต้อง' });
  }

  if (pathname === '/healthz' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true });
  }
  if (pathname === '/api/cleanse') return handleCleansing(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405, { Allow: 'GET', 'Cache-Control': 'no-store' });
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Text Cleansing server listening on port ${PORT}`);
});
