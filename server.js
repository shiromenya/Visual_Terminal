// server.js - Graphical Terminal Backend
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

let currentWorkingDir = process.cwd();
const PORT = 3456;
let activeProcess = null; // 現在実行中の子プロセス

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function explainError(stderr, exitCode) {
  if (!stderr && exitCode === 0) return null;
  const msg = (stderr || '').toLowerCase();
  
  if (msg.includes('cannot find the path') || msg.includes('パスが見つかりません') || msg.includes('does not exist')) {
    return '【エラー解説】指定したファイルまたはフォルダが見つかりませんでした。パスのスペルや場所を確認してください。';
  }
  if (msg.includes('permission') || msg.includes('アクセスが拒否されました') || msg.includes('access is denied')) {
    return '【エラー解説】アクセス権限がありません。管理者権限が必要か、ファイルがロックされています。';
  }
  if (msg.includes('is not recognized') || msg.includes('認識されていません') || msg.includes('not found')) {
    return '【エラー解説】そのコマンドやツールがPCにインストールされていないか、PATHが通っていません。';
  }
  if (msg.includes('fatal: not a git repository')) {
    return '【エラー解説】ここはGitリポジトリではありません。先に「git init」を行う必要があります。';
  }
  return '【エラー解説】処理中にエラーが発生しました。出力を確認してください。';
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // CWD取得
  if (url.pathname === '/api/cwd' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ cwd: currentWorkingDir }));
    return;
  }

  // CWD変更
  if (url.pathname === '/api/cwd' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { targetDir } = JSON.parse(body);
        if (targetDir && fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
          currentWorkingDir = path.resolve(targetDir);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, cwd: currentWorkingDir }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '指定されたディレクトリが存在しません。' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // プロセス中断 (Ctrl+C 相当)
  if (url.pathname === '/api/kill' && req.method === 'POST') {
    if (activeProcess) {
      try {
        // Windowsで子プロセスツリーごと強制終了
        spawn('taskkill', ['/pid', activeProcess.pid, '/f', '/t']);
        activeProcess = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'プロセスを中断しました。' }));
        return;
      } catch (e) {
        // ignore
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: '実行中のプロセスはありません。' }));
    return;
  }

  // PowerShellコマンド実行
  if (url.pathname === '/api/execute' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { script } = JSON.parse(body);
        if (!script) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'スクリプトが指定されていません。' }));
          return;
        }

        const startTime = Date.now();
        const psCommand = `chcp 65001 >$null; $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${script}`;

        activeProcess = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], {
          cwd: currentWorkingDir,
          env: process.env
        });

        let stdout = '';
        let stderr = '';

        activeProcess.stdout.on('data', data => {
          stdout += data.toString('utf8');
        });

        activeProcess.stderr.on('data', data => {
          stderr += data.toString('utf8');
        });

        activeProcess.on('close', code => {
          activeProcess = null;
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const exitCode = code === null ? 1 : code;
          const explanation = explainError(stderr, exitCode);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: exitCode === 0,
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode,
            duration: `${duration}s`,
            explanation
          }));
        });

        activeProcess.on('error', err => {
          activeProcess = null;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        });

      } catch (err) {
        activeProcess = null;
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 静的ファイル配信
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Graphical Terminal] サーバーが起動しました: http://127.0.0.1:${PORT}`);
  console.log(`[Graphical Terminal] 初期作業ディレクトリ: ${currentWorkingDir}`);
});
