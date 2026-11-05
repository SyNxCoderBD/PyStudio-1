import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, spawn } from 'child_process';
import { timingSafeEqual } from 'node:crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Path to yt-dlp binary
let ytDlpBinaryPath = path.join(process.cwd(), 'bin', 'yt-dlp');

async function ensureYtDlpBinary(): Promise<string> {
  const localBin = path.join(process.cwd(), 'bin', 'yt-dlp');
  const tmpBin = '/tmp/yt-dlp';

  if (fs.existsSync(localBin)) {
    try {
      fs.chmodSync(localBin, 0o755);
      return localBin;
    } catch {}
  }

  if (fs.existsSync(tmpBin)) {
    try {
      fs.chmodSync(tmpBin, 0o755);
      return tmpBin;
    } catch {}
  }

  // Attempt to download if not present
  try {
    const binDir = path.join(process.cwd(), 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    const response = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp');
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(localBin, buffer);
      fs.chmodSync(localBin, 0o755);
      return localBin;
    }
  } catch (err) {
    console.warn('Could not auto-download yt-dlp binary:', err);
  }

  return 'yt-dlp';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/yt-dlp', (req, res, next) => {
  const expectedToken = process.env.YTDLP_API_TOKEN;
  if (!expectedToken) {
    res.status(503).json({ success: false, error: 'yt-dlp API is disabled until YTDLP_API_TOKEN is configured' });
    return;
  }

  const authorization = req.get('authorization') || '';
  const providedToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    res.status(401).json({ success: false, error: 'A valid bearer token is required' });
    return;
  }

  next();
});

// yt-dlp version endpoint
app.get('/api/yt-dlp/version', async (req, res) => {
  try {
    const bin = await ensureYtDlpBinary();
    execFile(bin, ['--version'], (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }
      res.json({ success: true, version: stdout.trim() });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// yt-dlp CLI execution proxy
app.post('/api/yt-dlp/exec', async (req, res) => {
  try {
    const { args = [] } = req.body;
    const bin = await ensureYtDlpBinary();

    if (!Array.isArray(args)) {
      return res.status(400).json({ success: false, error: 'args must be an array of strings' });
    }

    execFile(bin, args, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      res.json({
        success: !err || err.code === 0,
        exitCode: err ? err.code : 0,
        stdout: stdout || '',
        stderr: stderr || '',
        error: err ? err.message : null,
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// yt-dlp info extraction
app.post('/api/yt-dlp/extract', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }

    const bin = await ensureYtDlpBinary();
    const nodeBin = fs.existsSync('/usr/local/bin/node') ? '/usr/local/bin/node' : 'node';
    const args: string[] = ['--dump-single-json', '--no-warnings', '--js-runtimes', `node:${nodeBin}`];

    if (options.flat_playlist || options.extract_flat) {
      args.push('--flat-playlist');
    }
    if (options.format) {
      args.push('-f', String(options.format));
    }
    if (options.cookies) {
      // Write temporary cookies file if provided
      const cookiePath = path.join(os.tmpdir(), `ytdlp_cookie_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.txt`);
      fs.writeFileSync(cookiePath, options.cookies);
      args.push('--cookies', cookiePath);
    }
    if (options.user_agent) {
      args.push('--user-agent', String(options.user_agent));
    }
    if (options.referer) {
      args.push('--referer', String(options.referer));
    }
    if (options.extractor_args) {
      args.push('--extractor-args', String(options.extractor_args));
    }
    if (options.extra_args && Array.isArray(options.extra_args)) {
      args.push(...options.extra_args);
    }

    args.push(url);

    execFile(bin, args, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      const cleanStderr = (stderr || '')
        .replace(/Deprecated Feature:[^\n]*\n?/g, '')
        .trim();
      const cleanStdout = (stdout || '')
        .replace(/Deprecated Feature:[^\n]*\n?/g, '')
        .trim();

      // Check if we have valid JSON output in stdout
      const jsonStart = cleanStdout.indexOf('{');
      const jsonEnd = cleanStdout.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const jsonStr = cleanStdout.slice(jsonStart, jsonEnd + 1);
          const data = JSON.parse(jsonStr);
          return res.json({ success: true, data });
        } catch (parseErr: any) {
          // If JSON parse failed, fall through to error reporting
        }
      }

      // If no valid JSON or error occurred
      const errorMsg = cleanStderr || (err ? err.message : '') || cleanStdout || 'Failed to extract media information';
      return res.status(400).json({
        success: false,
        error: errorMsg,
        exitCode: err ? err.code : 1,
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// yt-dlp file download endpoint
app.post('/api/yt-dlp/download', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }

    const bin = await ensureYtDlpBinary();
    const nodeBin = fs.existsSync('/usr/local/bin/node') ? '/usr/local/bin/node' : 'node';
    const tempDir = path.join(os.tmpdir(), `ytdlp_dl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const outTemplate = path.join(tempDir, '%(title).100s.%(ext)s');
    const args: string[] = ['-o', outTemplate, '--no-warnings', '--no-playlist', '--js-runtimes', `node:${nodeBin}`];

    if (options.format) {
      args.push('-f', String(options.format));
    } else if (options.audio_only) {
      args.push('-x', '--audio-format', options.audio_format || 'mp3');
    }
    if (options.cookies) {
      const cookiePath = path.join(tempDir, `cookies_${Date.now()}.txt`);
      fs.writeFileSync(cookiePath, options.cookies);
      args.push('--cookies', cookiePath);
    }
    if (options.extractor_args) {
      args.push('--extractor-args', String(options.extractor_args));
    }
    if (options.extra_args && Array.isArray(options.extra_args)) {
      args.push(...options.extra_args);
    }

    args.push(url);

    execFile(bin, args, { maxBuffer: 100 * 1024 * 1024 }, async (err, stdout, stderr) => {
      const cleanStderr = (stderr || '')
        .replace(/Deprecated Feature:[^\n]*\n?/g, '')
        .trim();
      const cleanStdout = (stdout || '')
        .replace(/Deprecated Feature:[^\n]*\n?/g, '')
        .trim();

      if (err) {
        // Clean up temp dir
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
        return res.status(400).json({
          success: false,
          error: cleanStderr || (err ? err.message : '') || cleanStdout || 'Download failed',
          stdout: cleanStdout,
        });
      }

      try {
        // Find downloaded files
        const files = fs.readdirSync(tempDir).filter((f) => !f.endsWith('.txt') && !f.endsWith('.part'));
        if (files.length === 0) {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}
          return res.status(404).json({ success: false, error: 'No media file was produced by yt-dlp' });
        }

        const primaryFile = files[0];
        const filePath = path.join(tempDir, primaryFile);
        const fileBuffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);
        const ext = path.extname(primaryFile).replace('.', '').toLowerCase();

        const base64Data = fileBuffer.toString('base64');

        // Clean up temp dir
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}

        res.json({
          success: true,
          filename: primaryFile,
          ext: ext,
          size: stats.size,
          mimeType: ext === 'mp4' ? 'video/mp4' : ext === 'mp3' ? 'audio/mpeg' : ext === 'webm' ? 'video/webm' : 'application/octet-stream',
          dataBase64: base64Data,
        });
      } catch (fileErr: any) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
        res.status(500).json({ success: false, error: `Failed to process downloaded file: ${fileErr.message}` });
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
