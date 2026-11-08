// server.js - Graphical Terminal Backend (Windows / macOS / Linux 両対応)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const os = require('node:os');

let currentWorkingDir = process.cwd();
const PORT = 3456;
const activeProcesses = new Map(); // runId -> childProcess (並列実行対応)
let globalProcessCounter = 0;

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// 高精度日本語エラー診断エンジン (Windows / macOS / Linux 共通)
function explainError(stderr, exitCode, stdout) {
  if (!stderr && exitCode === 0) return null;
  const combined = ((stderr || '') + ' ' + (stdout || '')).toLowerCase();
  
  // 1. 管理者権限が必要
  if (
    combined.includes('requires elevation') ||
    combined.includes('requested operation requires elevation') ||
    combined.includes('アクセスが拒否されました') ||
    combined.includes('管理者として実行') ||
    combined.includes('permission denied') ||
    combined.includes('operation not permitted') ||
    combined.includes('requires administrative privileges') ||
    combined.includes('requires elevated') ||
    combined.includes('eacces') ||
    combined.includes('eperm') ||
    combined.includes('0x80070005')
  ) {
    return {
      type: 'permission',
      badge: '権限エラー (Access Denied)',
      summary: '管理者権限（Administrator / root）が必要です',
      concept: 'Windowsではウイルスや誤操作でシステムが破壊されるのを防ぐため、一般的な権限とシステム全体に影響を与える「管理者権限」が厳格に区別されています。このエラーは、現在の権限レベルでは触れることが許されていない保護領域にアクセスした際に、OSの防護壁（UAC）が働いて安全のために処理を阻止した状態です。',
      cause: 'Windows のセキュリティ保護により、システム設定や保護領域への変更が拒否されました。',
      action: '本アプリまたはターミナルを右クリックして「管理者として実行」で起動するか、管理者ユーザーでログインして再実行してください。'
    };
  }

  // 2. パス・ファイル・フォルダが見つからない
  if (
    combined.includes('cannot find the path') ||
    combined.includes('指定されたパスが見つかりません') ||
    combined.includes('指定されたファイルが見つかりません') ||
    combined.includes('no such file or directory') ||
    combined.includes('path does not exist') ||
    combined.includes('itemnotfoundexception') ||
    combined.includes('cannot find path')
  ) {
    return {
      type: 'not_found',
      badge: 'ファイル・パス未検出 (Not Found)',
      summary: '指定されたファイルやフォルダが見つかりません',
      concept: 'パソコンは指示された「現在の作業フォルダ（カレントディレクトリ）」を起点にしてファイルを探します。このエラーは、パソコンが指定された場所の中をいくら探しても該当するファイルやフォルダを見つけられなかった状態です。スペルミス、大文字小文字の違い、拡張子の欠落、階層のズレなどが典型的な背景です。',
      cause: '入力したファイル名やフォルダ名が存在しないか、スペルミス、または別の作業場所にあります。',
      action: 'ブロック内のファイル名・パスを再確認してください。相対パス（./ など）の場合は、上部の「作業フォルダ変更」で現在の場所が合っているか確認してください。'
    };
  }

  // 3. コマンド・ツールが見つからない (未インストール / PATH未設定)
  if (
    combined.includes('is not recognized as an internal or external command') ||
    combined.includes('操作可能なプログラム') ||
    combined.includes('として認識されていません') ||
    combined.includes('内部コマンドまたは外部コマンド') ||
    combined.includes('command not found') ||
    combined.includes('commandnotfoundexception') ||
    combined.includes('用語は、コマンドレット、関数') ||
    combined.includes('not recognized')
  ) {
    return {
      type: 'cmd_missing',
      badge: 'コマンド未登録 (Command Missing)',
      summary: '実行しようとしたツールやコマンドがPCに入っていません',
      concept: 'パソコンはコマンドを入力されると、「環境変数 PATH」という引き出し一覧に登録されたフォルダ内から該当のプログラム（.exeなど）を探し出します。このエラーは、引き出しをすべて探してもその名前のツールが見つからなかったことを示しています。ソフト自体が入っていないか、どこにあるかをパソコンに教えていない状態です。',
      cause: '該当のソフトウェア（Git, Python, Node, curl, ffmpeg 等）がインストールされていないか、環境変数 PATH に登録されていません。',
      action: '該当のツールがPCにインストールされているか確認してください。インストール直後の場合は、アプリやターミナルを一度再起動すると認識されます。'
    };
  }

  // 4. ポート重複・使用中
  if (
    combined.includes('already in use') ||
    combined.includes('eaddrinuse') ||
    combined.includes('address already in use') ||
    combined.includes('ポートは既に使用されています')
  ) {
    return {
      type: 'port_in_use',
      badge: 'ポート競合 (Port In Use)',
      summary: '指定したポート番号が別のアプリで既に使用されています',
      concept: 'ネットワークにおける「ポート番号」とは、通信を受け取るための「部屋番号」や「受付窓口」のような仕組みです。ひとつの部屋番号（例: 3000番）には同時にひとつのアプリしか入れません。すでに別のサーバーや前回起動したプロセスがその窓口を開けたままにしているため、新しく店を開けない状態です。',
      cause: '指定したポート（例: 3000, 8080など）を別のWebサーバーやプロセスがすでに占有しています。',
      action: '「ポート番号の使用調査」ブロックでポートを使っているアプリのPIDを調べるか、別のポート番号（例: 3001, 8081）に変更して再実行してください。'
    };
  }

  // 5. ファイルが他のアプリでロック中
  if (
    combined.includes('being used by another process') ||
    combined.includes('別のプロセスで使用されているため') ||
    combined.includes('プロセスがファイルにアクセスできません') ||
    combined.includes('ebusy') ||
    combined.includes('resource temporarily unavailable')
  ) {
    return {
      type: 'file_locked',
      badge: 'ファイル占有中 (File Locked)',
      summary: 'ファイルが他のアプリで開かれているため変更・削除できません',
      concept: 'パソコンのファイルシステムは、2つのアプリが同時に同じファイルを書き換えてデータが破損するのを防ぐために「排他制御（ファイルロック）」という鍵をかけます。別のアプリ（WordやExcelなど）がファイルを鍵をかけたまま開いているため、今回のプログラムが編集や削除を許されず待たされている状態です。',
      cause: '対象のファイルが Excel、Word、テキストエディタ、またはバックグラウンドアプリで開かれています。',
      action: '該当のファイルを開いているアプリを保存して閉じるか、タスクマネージャーから該当アプリを終了してから再実行してください。'
    };
  }

  // 6. 引数・パラメータ不足
  if (
    combined.includes('missing an argument') ||
    combined.includes('missing argument') ||
    combined.includes('a positional parameter cannot be found') ||
    combined.includes('引数が不足') ||
    combined.includes('パラメータが正しくありません') ||
    combined.includes('cannot bind argument') ||
    combined.includes('missing an argument for parameter')
  ) {
    return {
      type: 'param_missing',
      badge: '入力不足 (Missing Argument)',
      summary: 'コマンドの実行に必要な入力値（パラメータ）が不足しています',
      concept: 'コマンドは「動詞（何をする）」と「目的語（何を対象にするか＝引数・パラメータ）」が揃って初めて仕事ができます。例えば「コピーして」と命じても「何をどこに」が抜けているとパソコンは動けません。このエラーは、命令を完結させるために必須の情報が渡されていないことを表しています。',
      cause: 'ブロックの入力項目（フォルダ名、URL、ファイル名など）が空欄になっている可能性があります。',
      action: 'ブロック内の空欄になっている入力ボックスに必要な値を入力してから、再度実行してください。'
    };
  }

  // 7. ネットワーク接続エラー・DNS名前解決不可
  if (
    combined.includes('could not resolve host') ||
    combined.includes('名前解決') ||
    combined.includes('timed out') ||
    combined.includes('connection timed out') ||
    combined.includes('connect econnrefused') ||
    combined.includes('ネットワーク パスが見つかりません') ||
    combined.includes('destination host unreachable') ||
    combined.includes('no route to host')
  ) {
    return {
      type: 'network_error',
      badge: '通信エラー (Network Failure)',
      summary: '相手のサーバーまたはインターネットに接続できません',
      concept: 'インターネット通信では、人間が読みやすい「ドメイン名（例: google.com）」をパソコンの住所番号である「IPアドレス」に変換するDNS（電話帳）を経由します。このエラーは、電話帳で住所が見つからなかったか、相手のサーバーまで電波や回線がつながらず、時間切れ（タイムアウト）になった状態です。',
      cause: 'PCのインターネット接続が途切れているか、指定したURL・サーバーのドメイン名が存在しない、または相手サーバーがダウンしています。',
      action: 'Wi-Fi/LAN接続を確認し、URLのスペルをチェックしてください。「疎通確認 (ping)」ブロックで相手と通信できるか点検できます。'
    };
  }

  // 8. ディスク容量不足
  if (
    combined.includes('there is not enough space on the disk') ||
    combined.includes('ディスクに十分な空き領域がありません') ||
    combined.includes('no space left on device') ||
    combined.includes('enospc')
  ) {
    return {
      type: 'disk_full',
      badge: '容量不足 (Disk Full)',
      summary: 'ドライブの空き容量が不足しています',
      concept: 'ハードディスクやSSDの記憶領域が物理的に限界に達し、1バイトの新しいデータも書き込めなくなった状態です。空き容量がゼロになると、新しいファイルの保存だけでなく、OSの一時ファイル作成もできなくなりパソコン全体の動作が不安定になる危険なサインです。',
      cause: 'ファイルの作成や展開・コピーを行うための十分な空きディスク領域がありません。',
      action: '「各ドライブの空き容量」ブロックで残量を確認し、「不要なゴミファイルを一掃 (cleanmgr)」ブロック等で空き容量を確保してください。'
    };
  }

  // 9. Gitリポジトリではない
  if (combined.includes('fatal: not a git repository') || combined.includes('not a git repository')) {
    return {
      type: 'git_error',
      badge: 'Git未初期化 (Not a Git Repo)',
      summary: '現在のフォルダは Git で管理されていません',
      concept: 'Gitというバージョン管理システムは、フォルダの中に隠しフォルダ「.git（管理台帳）」を置くことで変更履歴を追跡します。このエラーは、現在の作業フォルダがGitの管理下（リポジトリ）にないため、履歴の確認やコミットなどの操作を受け付けられない状態であることを意味します。',
      cause: 'Git のコマンド（git status, git log 等）は、.git フォルダが存在するプロジェクトフォルダ内でのみ動作します。',
      action: '上部の「作業フォルダ変更」でGitプロジェクトのフォルダに移動するか、「git init」を実行してリポジトリを作成してください。'
    };
  }

  // 10. PowerShellスクリプト実行ポリシー制限
  if (
    combined.includes('execution of scripts is disabled') ||
    combined.includes('スクリプトの実行が無効になっているため') ||
    combined.includes('ps1 cannot be loaded') ||
    combined.includes('psssecurityexception')
  ) {
    return {
      type: 'ps_policy',
      badge: 'スクリプト実行制限 (ExecutionPolicy)',
      summary: 'PowerShellスクリプトの実行がWindowsにより制限されています',
      concept: 'WindowsのPowerShellには、怪しいスクリプトファイル（.ps1）をインターネットからダウンロードしてうっかり実行してしまいウイルス感染するのを防ぐ安全装置（実行ポリシー）が標準で備わっています。今回はその安全装置が正しく働いて、スクリプトの起動を未然にブロックした状態です。',
      cause: 'Windows標準のセキュリティポリシーにより、未署名のスクリプト実行がブロックされています。',
      action: '管理者権限のPowerShellで「Set-ExecutionPolicy RemoteSigned -Scope CurrentUser」を実行すると許可できます。'
    };
  }

  // 11. 構文エラー
  if (
    combined.includes('syntax error') ||
    combined.includes('構文エラー') ||
    combined.includes('予期しないトークン') ||
    combined.includes('unexpected token') ||
    combined.includes('the syntax of the command is incorrect')
  ) {
    return {
      type: 'syntax_error',
      badge: '構文エラー (Syntax Error)',
      summary: 'コマンドの構文（文法）に誤りがあります',
      concept: 'パソコン（シェル）は人間のように「文脈から意味を推測する」ことができません。そのため、引用符（" "）の閉じ忘れや不要な記号、全角スペースが1文字あるだけでも命令全体が理解不能になります。文法規則（シンタックス）に合わない文字列が含まれていることを指摘するエラーです。',
      cause: 'クォーテーション（" や \'）の閉じ忘れや、不正な記号・全角スペースが含まれている可能性があります。',
      action: '入力欄に全角スペースや誤った記号が混ざっていないか確認し、波かっこ {変数名} の閉じ忘れがないか点検してください。'
    };
  }

  // 12. 中断
  if (combined.includes('中断しました') || combined.includes('killed') || combined.includes('sigkill')) {
    return {
      type: 'cancelled',
      badge: '処理中断 (Cancelled)',
      summary: 'ユーザー操作により処理が途中で中断されました',
      concept: '実行中だったプロセスに対し、OSやユーザーから強制終了シグナル（SIGKILL / SIGINT / taskkill）が送信された状態です。処理が完了する前に外側から途中で電源を切られたような状態のため、作業の一部だけが反映されている可能性があります。',
      cause: '「途中で止める」ボタンまたは中断シグナルが送信されました。',
      action: '処理が途中で停止したため、一部のファイルのみ生成または変更された可能性があります。ログを確認して必要に応じ再実行してください。'
    };
  }

  // 13. その他・終了コード異常
  if (exitCode !== 0) {
    return {
      type: 'general',
      badge: `異常終了 (Exit Code: ${exitCode})`,
      summary: `コマンドがエラーコード ${exitCode} で終了しました`,
      concept: 'プログラムは処理を終える際、OSに対して「正常に終わったか」を終了コード（Exit Code）という数字で伝えます（正常終了は0、エラーは1以上）。今回は0以外の番号が返されたため、プログラムの内部で何らかの異常や例外が発生して作業を完遂できなかったことを示しています。',
      cause: 'コマンドの内部処理で何らかのエラーまたは警告が発生しました。',
      action: '上のコンソールログに記載されたメッセージを確認し、入力したパラメータを修正して再実行してみてください。'
    };
  }

  return null;
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

  // CWD & OS情報取得
  if (url.pathname === '/api/cwd' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      cwd: currentWorkingDir,
      platform: process.platform, // 'win32', 'darwin', 'linux'
      osName: isWindows ? 'Windows' : (isMac ? 'macOS' : 'Linux')
    }));
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

  // プロセス中断 (Ctrl+C / Kill / 全停止対応)
  if (url.pathname === '/api/kill' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { runId } = body ? JSON.parse(body) : {};
        if (runId && activeProcesses.has(runId)) {
          const proc = activeProcesses.get(runId);
          if (isWindows) {
            spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
          } else {
            proc.kill('SIGKILL');
          }
          activeProcesses.delete(runId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: `プロセス (${runId}) を中断しました。` }));
          return;
        }

        // runId未指定の場合は全稼働中プロセスを中断
        if (activeProcesses.size > 0) {
          activeProcesses.forEach((proc, id) => {
            try {
              if (isWindows) {
                spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
              } else {
                proc.kill('SIGKILL');
              }
            } catch (e) {}
          });
          const count = activeProcesses.size;
          activeProcesses.clear();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: `${count}件のプロセスをすべて中断しました。` }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: '実行中のプロセスはありません。' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // コマンド実行 (ストリーミング対応 SSE / NDJSON / 並行実行サポート)
  if (url.pathname === '/api/execute' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { script, runId: reqRunId } = JSON.parse(body);
        if (!script) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'スクリプトが指定されていません。' }));
          return;
        }

        const runId = reqRunId || `proc_${++globalProcessCounter}_${Date.now()}`;
        const startTime = Date.now();

        // リアルタイム・ストリーミング用のヘッダー
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const sendEvent = (obj) => {
          res.write(`data: ${JSON.stringify({ ...obj, runId })}\n\n`);
        };

        let childProc = null;
        if (isWindows) {
          // Windows: PowerShell (UTF-8)
          const psCommand = `chcp 65001 >$null; $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${script}`;
          childProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], {
            cwd: currentWorkingDir,
            env: process.env
          });
        } else {
          // macOS / Linux: /bin/bash or /bin/zsh
          const shellBin = fs.existsSync('/bin/zsh') ? '/bin/zsh' : '/bin/bash';
          childProc = spawn(shellBin, ['-c', script], {
            cwd: currentWorkingDir,
            env: { ...process.env, LANG: 'ja_JP.UTF-8' }
          });
        }

        activeProcesses.set(runId, childProc);

        let fullStderr = '';
        let fullStdout = '';

        childProc.stdout.on('data', data => {
          const text = data.toString('utf8');
          fullStdout += text;
          sendEvent({ type: 'stdout', text });
        });

        childProc.stderr.on('data', data => {
          const text = data.toString('utf8');
          fullStderr += text;
          sendEvent({ type: 'stderr', text });
        });

        childProc.on('close', code => {
          activeProcesses.delete(runId);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const exitCode = code === null ? 1 : code;
          const explanation = explainError(fullStderr, exitCode, fullStdout);

          sendEvent({
            type: 'done',
            ok: exitCode === 0,
            exitCode,
            duration: `${duration}s`,
            explanation
          });
          res.end();
        });

        childProc.on('error', err => {
          activeProcesses.delete(runId);
          sendEvent({
            type: 'error',
            message: err.message
          });
          res.end();
        });

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 🚀 ヘッドレスREST API / Webhookトリガー実行 (外部CLI・CI/CD・Cronから実行可能)
  if (url.pathname === '/api/workflow/run' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const script = payload.script;
        const targetDir = payload.workingDir || currentWorkingDir;

        if (!script) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'スクリプト (script) が指定されていません。' }));
          return;
        }

        const startTime = Date.now();
        const runId = `headless_${++globalProcessCounter}_${Date.now()}`;

        let childProc = null;
        if (isWindows) {
          const psCommand = `chcp 65001 >$null; $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${script}`;
          childProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], {
            cwd: targetDir,
            env: process.env
          });
        } else {
          const shellBin = fs.existsSync('/bin/zsh') ? '/bin/zsh' : '/bin/bash';
          childProc = spawn(shellBin, ['-c', script], {
            cwd: targetDir,
            env: { ...process.env, LANG: 'ja_JP.UTF-8' }
          });
        }

        activeProcesses.set(runId, childProc);

        let fullStdout = '';
        let fullStderr = '';

        childProc.stdout.on('data', data => fullStdout += data.toString('utf8'));
        childProc.stderr.on('data', data => fullStderr += data.toString('utf8'));

        childProc.on('close', code => {
          activeProcesses.delete(runId);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const exitCode = code === null ? 1 : code;
          const explanation = explainError(fullStderr, exitCode, fullStdout);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: exitCode === 0,
            exitCode,
            duration: `${duration}s`,
            stdout: fullStdout,
            stderr: fullStderr,
            explanation,
            timestamp: new Date().toISOString()
          }));
        });

        childProc.on('error', err => {
          activeProcesses.delete(runId);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        });

      } catch (err) {
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
  const osLabel = isWindows ? 'Windows' : (isMac ? 'macOS' : 'Linux');
  console.log(`[Graphical Terminal] サーバーが起動しました (${osLabel}): http://127.0.0.1:${PORT}`);
  console.log(`[Graphical Terminal] 初期作業ディレクトリ: ${currentWorkingDir}`);
});
