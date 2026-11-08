// app.js - Graphical Terminal Logic (Windows / macOS / Linux 完全両対応版)

let currentPlatform = navigator.userAgent.includes('Mac') ? 'darwin' : 'win32';
let lastUserInput = '';

function isUnix() {
  return currentPlatform === 'darwin' || currentPlatform === 'linux';
}

function resolveVariables(str) {
  if (!str) return '';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const todayStr = `${yyyy}${mm}${dd}`;
  const nowStr = `${yyyy}${mm}${dd}_${hh}${min}`;

  return str
    .replaceAll('{today}', todayStr)
    .replaceAll('{now}', nowStr)
    .replaceAll('{input}', lastUserInput);
}

// 1. 基本ブロック定義マスタ（OS自動切り替え対応）
const BUILTIN_BLOCKS = {
  // --- ファイルとフォルダの操作 ---
  'view-tree': {
    name: 'フォルダの構造を木の枝の形で見せる (tree)',
    category: 'file',
    fields: [
      { id: 'dir', label: 'どこを見る？', type: 'select', options: [
        { value: '.', label: '今のフォルダ' },
        { value: '..', label: '1つ上のフォルダ' },
        { value: '$HOME/Desktop', label: 'デスクトップ' }
      ], default: '.' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `which tree >/dev/null 2>&1 && tree -L 3 "${params.dir}" || find "${params.dir}" -maxdepth 3 -print | sed -e "s;[^/]*/;|____;g;s;____|; |;g"`;
      }
      return `tree ${params.dir} /a /f | Select-Object -First 40`;
    }
  },

  'make-dir': {
    name: '新しいフォルダを作る (mkdir)',
    category: 'file',
    fields: [
      { id: 'name', label: '新しいフォルダ名', type: 'text', placeholder: '例: 新しいフォルダ または photos_{today}', default: 'new_folder' }
    ],
    generateCommand: (params) => {
      const nm = resolveVariables(params.name);
      if (isUnix()) {
        return `mkdir -p "${nm}" && echo "フォルダを作りました: ${nm}"`;
      }
      return `New-Item -ItemType Directory -Path "${nm}" -Force | Out-Null; Write-Output "フォルダを作りました: ${nm}"`;
    }
  },

  'move-file': {
    name: 'ファイルを別の場所に移動する (move)',
    category: 'file',
    fields: [
      { id: 'source', label: '移動したいファイル', type: 'text', placeholder: '例: memo.txt', default: '' },
      { id: 'dest', label: '移動先フォルダ/名前', type: 'text', placeholder: '例: ./backup または ./new_folder', default: './backup' }
    ],
    generateCommand: (params) => {
      const src = resolveVariables(params.source);
      const dst = resolveVariables(params.dest);
      if (!src || !dst) return '# 移動元と移動先を入力してください';
      if (isUnix()) {
        return `mv "${src}" "${dst}" && echo "移動しました: ${src} ➔ ${dst}"`;
      }
      return `Move-Item -Path "${src}" -Destination "${dst}" -Force; Write-Output "移動しました: ${src} ➔ ${dst}"`;
    }
  },

  'rename-file': {
    name: 'ファイルやフォルダの名前を変える (ren)',
    category: 'file',
    fields: [
      { id: 'source', label: '今の名前', type: 'text', placeholder: '例: old_name.txt', default: '' },
      { id: 'newName', label: '新しい名前', type: 'text', placeholder: '例: new_name_{today}.txt', default: '' }
    ],
    generateCommand: (params) => {
      const src = resolveVariables(params.source);
      const nn = resolveVariables(params.newName);
      if (!src || !nn) return '# 今の名前と新しい名前を入力してください';
      if (isUnix()) {
        return `mv "${src}" "${nn}" && echo "名前を変更しました: ${src} ➔ ${nn}"`;
      }
      return `Rename-Item -Path "${src}" -NewName "${nn}" -Force; Write-Output "名前を変更しました: ${src} ➔ ${nn}"`;
    }
  },

  'read-file': {
    name: 'ファイルの中身を画面で見る (type/cat)',
    category: 'file',
    fields: [
      { id: 'filepath', label: '見たいファイル名', type: 'text', placeholder: '例: memo.txt', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const fp = resolveVariables(params.filepath);
      if (isUnix()) {
        return `cat "${fp}"`;
      }
      return `Get-Content "${fp}" -ErrorAction SilentlyContinue -Raw`;
    }
  },

  'open-notepad': {
    name: 'エディタで開いて編集する',
    category: 'file',
    fields: [
      { id: 'filepath', label: '開きたいファイル名', type: 'text', placeholder: '例: memo.txt', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const fp = resolveVariables(params.filepath);
      if (isUnix()) {
        return `open -e "${fp}" 2>/dev/null || xdg-open "${fp}" 2>/dev/null || echo "エディタを開きました: ${fp}"`;
      }
      return `notepad.exe "${fp}"; Write-Output "メモ帳を起動しました: ${fp}"`;
    }
  },

  'list-files': {
    name: '中身の一覧を見る (dir/ls)',
    category: 'file',
    fields: [
      { id: 'dir', label: 'どこを見る？', type: 'select', options: [
        { value: '.', label: '今のフォルダ' },
        { value: '..', label: '1つ上のフォルダ' },
        { value: '$HOME/Desktop', label: 'デスクトップ' },
        { value: '$HOME/Downloads', label: 'ダウンロードフォルダ' }
      ], default: '.' },
      { id: 'recursive', label: '奥のフォルダまで？', type: 'select', options: [
        { value: 'no', label: '今の場所だけ' },
        { value: 'yes', label: '奥の中身まで全部' }
      ], default: 'no' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        const rec = params.recursive === 'yes' ? '-R' : '';
        return `ls -lh ${rec} "${params.dir}"`;
      }
      const rec = params.recursive === 'yes' ? '-Recurse' : '';
      return `Get-ChildItem -Path "${params.dir}" ${rec} | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize`;
    }
  },

  'search-files': {
    name: 'ファイルを探す (find)',
    category: 'file',
    fields: [
      { id: 'keyword', label: '名前に含まれる文字', type: 'text', placeholder: '例: *.txt や memo', default: '*.*' },
      { id: 'ext', label: '種類（拡張子）', type: 'select', options: [
        { value: '*', label: 'すべての種類' },
        { value: '*.txt', label: 'テキスト (.txt)' },
        { value: '*.csv', label: '表データ (.csv)' },
        { value: '*.json', label: 'データファイル (.json)' },
        { value: '*.png', label: '画像 (.png)' },
        { value: '*.zip', label: 'Zipファイル (.zip)' },
        { value: '*.log', label: '記録ログ (.log)' }
      ], default: '*' }
    ],
    generateCommand: (params) => {
      const kw = resolveVariables(params.keyword);
      const filter = params.ext !== '*' ? params.ext : (kw || '*');
      if (isUnix()) {
        return `find . -name "${filter}" 2>/dev/null`;
      }
      return `Get-ChildItem -Path . -Filter "${filter}" -Recurse -File -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize`;
    }
  },

  'copy-file': {
    name: 'ファイルをコピーする (copy)',
    category: 'file',
    fields: [
      { id: 'source', label: '元のファイル', type: 'text', placeholder: '例: memo.txt', default: '' },
      { id: 'dest', label: 'コピー先の名前', type: 'text', placeholder: '例: memo_{today}.txt', default: '' }
    ],
    generateCommand: (params) => {
      const src = resolveVariables(params.source);
      const dst = resolveVariables(params.dest);
      if (!src || !dst) return '# コピー元とコピー先を入力してください';
      if (isUnix()) {
        return `cp -r "${src}" "${dst}" && echo "コピー完了: ${src} ➔ ${dst}"`;
      }
      return `Copy-Item -Path "${src}" -Destination "${dst}" -Force -PassThru | Format-Table Name, Length`;
    }
  },

  'delete-file': {
    name: 'ファイルをゴミ箱/削除 (rm)',
    category: 'danger',
    fields: [
      { id: 'target', label: '消したいファイル名', type: 'text', placeholder: '例: 不要なファイル.txt', default: '' }
    ],
    generateCommand: (params) => {
      const tgt = resolveVariables(params.target);
      if (!tgt) return '# 消したいファイル名を入力してください';
      if (isUnix()) {
        return `rm -rf "${tgt}" && echo "削除が終わりました: ${tgt}"`;
      }
      return `Remove-Item -Path "${tgt}" -Force -ErrorAction Stop; Write-Output "削除が終わりました: ${tgt}"`;
    }
  },

  // --- インターネット・ネットワーク診断 ---
  'show-ip': {
    name: '自分のIPアドレスを調べる (ifconfig/ipconfig)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `echo "--- [Wi-Fi / LAN のIPアドレス] ---" && ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'`;
      }
      return `Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object InterfaceAlias, IPAddress, PrefixOrigin | Format-Table -AutoSize`;
    }
  },

  'check-port': {
    name: 'ポート番号が使われているか調べる (lsof)',
    category: 'system',
    fields: [
      { id: 'port', label: '調べるポート番号', type: 'text', placeholder: '例: 3000, 8080', default: '3000' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.port).trim() || '3000';
      if (isUnix()) {
        return `lsof -i :${p} || echo "🟢 ポート ${p} は現在【空いています】"`;
      }
      return `$p = ${p}; $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { Write-Output "⚠️ ポート $p は現在【使用中】です！"; $conns | Select-Object LocalAddress, LocalPort, State, OwningProcess, @{Name="アプリ名";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Format-Table -AutoSize } else { Write-Output "🟢 ポート $p は現在【空いています】（自由に使えます）" }`;
    }
  },

  'network-ping': {
    name: 'ネットが繋がるか調べる (ping)',
    category: 'system',
    fields: [
      { id: 'host', label: '調べる宛先', type: 'text', placeholder: '例: google.com', default: 'google.com' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || 'google.com';
      if (isUnix()) {
        return `ping -c 2 "${h}"`;
      }
      return `Test-Connection -ComputerName "${h}" -Count 2 | Select-Object Address, ResponseTime, Status | Format-Table -AutoSize`;
    }
  },

  'trace-route': {
    name: '通信の通り道を調べる (traceroute)',
    category: 'system',
    fields: [
      { id: 'host', label: '宛先アドレス', type: 'text', placeholder: '例: google.com', default: 'google.com' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || 'google.com';
      if (isUnix()) {
        return `traceroute -m 8 "${h}" 2>/dev/null || traceroute "${h}"`;
      }
      return `tracert -d -h 8 "${h}"`;
    }
  },

  'web-download': {
    name: 'ネットからファイルを保存する (curl)',
    category: 'system',
    fields: [
      { id: 'url', label: 'ダウンロード先のURL', type: 'text', placeholder: 'https://example.com/file.zip', default: '' },
      { id: 'outfile', label: '保存するファイル名', type: 'text', placeholder: 'file.zip', default: 'downloaded.dat' }
    ],
    generateCommand: (params) => {
      const url = resolveVariables(params.url);
      const of = resolveVariables(params.outfile);
      if (!url) return '# ダウンロードするURLを入力してください';
      if (isUnix()) {
        return `curl -L -o "${of}" "${url}" && echo "ダウンロード完了: ${of}"`;
      }
      return `Invoke-WebRequest -Uri "${url}" -OutFile "${of}"; Write-Output "ダウンロードが終わりました: ${of}"`;
    }
  },

  'web-api': {
    name: 'Webからデータを取ってくる (API/curl)',
    category: 'system',
    fields: [
      { id: 'url', label: 'アクセス先のアドレス', type: 'text', placeholder: '例: https://api.github.com/zen', default: 'https://api.github.com/zen' }
    ],
    generateCommand: (params) => {
      const url = resolveVariables(params.url);
      if (isUnix()) {
        return `curl -s "${url}"`;
      }
      return `Invoke-RestMethod -Uri "${url}"`;
    }
  },

  // --- パソコンの状態と電源 ---
  'system-info': {
    name: 'パソコンの詳しい情報を見る',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `uname -a && (sw_vers 2>/dev/null || cat /etc/os-release 2>/dev/null)`;
      }
      return `[PSCustomObject]@{ "OS" = (Get-CimInstance Win32_OperatingSystem).Caption; "CPU" = (Get-CimInstance Win32_Processor).Name; "メモリ合計(GB)" = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2); "空きメモリ(GB)" = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2) } | Format-List`;
    }
  },

  'process-list': {
    name: '今動いているアプリ一覧 (ps)',
    category: 'system',
    fields: [
      { id: 'top', label: '何個見る？', type: 'select', options: [
        { value: '5', label: '上位 5個' },
        { value: '10', label: '上位 10個' },
        { value: '20', label: '上位 20個' }
      ], default: '10' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `ps aux | head -n ${parseInt(params.top, 10) + 1}`;
      }
      return `Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First ${params.top} Name, @{Name="使っているメモリ(MB)";Expression={[math]::Round($_.WorkingSet64 / 1MB, 1)}}, Id | Format-Table -AutoSize`;
    }
  },

  'timer-shutdown': {
    name: '指定時間後に電源を切る/再起動',
    category: 'system',
    fields: [
      { id: 'action', label: '何をする？', type: 'select', options: [
        { value: 'shutdown', label: '電源を切る (シャットダウン)' },
        { value: 'restart', label: 'パソコンを再起動する' },
        { value: 'cancel', label: 'タイマーをキャンセルする' }
      ], default: 'shutdown' },
      { id: 'minutes', label: '何分後？', type: 'select', options: [
        { value: '10', label: '10分後' },
        { value: '30', label: '30分後' },
        { value: '60', label: '1時間後 (60分)' }
      ], default: '30' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        if (params.action === 'cancel') {
          return `sudo killall shutdown 2>/dev/null && echo "シャットダウンの予約を取り消しました"`;
        }
        const flag = params.action === 'restart' ? '-r' : '-h';
        return `sudo shutdown ${flag} +${params.minutes} && echo "${params.minutes}分後に実行するよう予約しました"`;
      }
      if (params.action === 'cancel') {
        return `shutdown /a; Write-Output "シャットダウンの予約を取り消しました"`;
      }
      const flag = params.action === 'restart' ? '/r' : '/s';
      const sec = parseInt(params.minutes, 10) * 60;
      return `shutdown ${flag} /t ${sec}; Write-Output "${params.minutes}分後に実行するよう予約しました（取り消すときはキャンセルを選んでください）"`;
    }
  },

  // --- Windows/Mac 特有のメンテナンス ---
  'battery-report': {
    name: 'バッテリー寿命・残量を調べる (powercfg/pmset)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `pmset -g batt 2>/dev/null || upower -i $(upower -e | grep 'BAT') 2>/dev/null || echo "バッテリー情報を取得しました"`;
      }
      return `powercfg /batteryreport /output "battery_report.html"; Write-Output "バッテリー診断レポート (battery_report.html) を作成しました！ブラウザで開いて寿命を確認できます。"`;
    }
  },

  'robocopy-sync': {
    name: 'フォルダを丸ごと高速同期・バックアップ (robocopy/rsync)',
    category: 'file',
    fields: [
      { id: 'source', label: '元のフォルダ', type: 'text', placeholder: '例: ./data', default: './data' },
      { id: 'dest', label: '同期先フォルダ', type: 'text', placeholder: '例: ./backup_mirror', default: './backup_mirror' }
    ],
    generateCommand: (params) => {
      const src = resolveVariables(params.source);
      const dst = resolveVariables(params.dest);
      if (!src || !dst) return '# 元のフォルダと同期先を入力してください';
      if (isUnix()) {
        return `rsync -av --delete "${src}/" "${dst}/" && echo "同期（ミラーリング）が完了しました"`;
      }
      return `robocopy "${src}" "${dst}" /MIR /R:2 /W:2 /NP; Write-Output "同期（ミラーリング）が完了しました"`;
    }
  },

  // --- 頭脳・繰り返し・対話 ---
  'prompt-input': {
    name: '人に質問して文字を入力してもらう',
    category: 'custom',
    fields: [
      { id: 'question', label: '質問する内容', type: 'text', placeholder: '例: ファイル名は何にしますか？', default: 'ファイル名は何にしますか？' },
      { id: 'defaultVal', label: '最初に入っている文字', type: 'text', placeholder: '例: my_memo.txt', default: 'my_memo.txt' }
    ],
    isInteractive: true,
    generateCommand: (params) => {
      const q = resolveVariables(params.question);
      return `# 質問: "${q}" (入力された値: $userInput を使います)`;
    }
  },

  'loop-count': {
    name: '〇回繰り返す (指定回数)',
    category: 'custom',
    fields: [
      { id: 'count', label: '何回繰り返す？', type: 'select', options: [
        { value: '3', label: '3回' },
        { value: '5', label: '5回' },
        { value: '10', label: '10回' }
      ], default: '3' },
      { id: 'action', label: '繰り返す命令', type: 'text', placeholder: '例: echo "テスト $i 回目"', default: 'echo "テスト $i 回目"' }
    ],
    generateCommand: (params) => {
      const action = resolveVariables(params.action);
      if (isUnix()) {
        return `for i in $(seq 1 ${params.count}); do ${action}; done`;
      }
      return `1..${params.count} | ForEach-Object { $i = $_; ${action} }`;
    }
  },

  'foreach-loop': {
    name: '1行ずつ同じ処理を繰り返す',
    category: 'custom',
    fields: [
      { id: 'action', label: '各行に行う命令', type: 'text', placeholder: '例: echo "処理中: $line"', default: 'echo "アイテム: $line"' }
    ],
    generateCommand: (params) => {
      const action = resolveVariables(params.action) || 'echo "$line"';
      if (isUnix()) {
        return `while IFS= read -r line; do ${action}; done <<< "$LAST_RESULT"`;
      }
      return `$lastResult | ForEach-Object { ${action} }`;
    }
  },

  'condition-if': {
    name: 'もし〜なら／そうでなければ (If/Else)',
    category: 'custom',
    fields: [
      { id: 'condType', label: 'どんなとき？', type: 'select', options: [
        { value: 'file_exists', label: '指定したファイルが存在するとき' },
        { value: 'prev_success', label: '直前のブロックが成功したとき' },
        { value: 'prev_contains', label: '直前の結果に特定の文字が含まれるとき' }
      ], default: 'file_exists' },
      { id: 'target', label: '調べる名前や文字', type: 'text', placeholder: '例: memo.txt または OK', default: 'memo.txt' },
      { id: 'actionIf', label: '当てはまるとき', type: 'text', placeholder: '例: echo "見つかりました"', default: 'echo "条件に合いました"' },
      { id: 'actionElse', label: 'そうでなければ', type: 'text', placeholder: '例: echo "見つかりませんでした"', default: 'echo "条件に合いませんでした"' }
    ],
    generateCommand: (params) => {
      const target = resolveVariables(params.target);
      const actIf = resolveVariables(params.actionIf);
      const actElse = resolveVariables(params.actionElse);

      if (isUnix()) {
        if (params.condType === 'file_exists') {
          return `if [ -e "${target}" ]; then ${actIf}; else ${actElse}; fi`;
        } else if (params.condType === 'prev_success') {
          return `if [ $? -eq 0 ]; then ${actIf}; else ${actElse}; fi`;
        } else {
          return `if echo "$LAST_RESULT" | grep -q "${target}"; then ${actIf}; else ${actElse}; fi`;
        }
      }

      if (params.condType === 'file_exists') {
        return `if (Test-Path "${target}") { ${actIf} } else { ${actElse} }`;
      } else if (params.condType === 'prev_success') {
        return `if ($?) { ${actIf} } else { ${actElse} }`;
      } else {
        return `if ($lastResult -match "${target}") { ${actIf} } else { ${actElse} }`;
      }
    }
  },

  'set-env': {
    name: '設定メモを記憶する (環境変数)',
    category: 'custom',
    fields: [
      { id: 'key', label: '設定の名前', type: 'text', placeholder: '例: PORT, API_KEY', default: 'MODE' },
      { id: 'val', label: '設定する値', type: 'text', placeholder: '例: 3000, test', default: 'test' }
    ],
    generateCommand: (params) => {
      const val = resolveVariables(params.val);
      if (isUnix()) {
        return `export ${params.key}="${val}" && echo "設定を保存しました: ${params.key}=${val}"`;
      }
      return `$env:${params.key} = "${val}"; Write-Output "設定を保存しました: ${params.key}=${val}"`;
    }
  },

  // --- 便利なアクション・合図 ---
  'copy-clipboard': {
    name: '結果をクリップボードにコピー (pbcopy)',
    category: 'custom',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `printf '%s' "$LAST_RESULT" | (pbcopy 2>/dev/null || xclip -selection clipboard 2>/dev/null || cat) && echo "直前の結果をクリップボードにコピーしました！"`;
      }
      return `$lastResult | Set-Clipboard; Write-Output "直前の結果をクリップボードにコピーしました！（Ctrl+Vでどこにでも貼り付けられます）"`;
    }
  },

  'beep-sound': {
    name: 'ピピッ！と音を鳴らす (お知らせ)',
    category: 'custom',
    fields: [
      { id: 'count', label: '何回鳴らす？', type: 'select', options: [
        { value: '1', label: '1回 (ピピッ)' },
        { value: '2', label: '2回 (ピピッ・ピピッ)' },
        { value: '3', label: '3回 (ファンファーレ風)' }
      ], default: '1' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `(afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || printf '\\a') && echo "音でお知らせしました"`;
      }
      if (params.count === '2') {
        return `[Console]::Beep(880, 150); Start-Sleep -Milliseconds 100; [Console]::Beep(880, 200); Write-Output "音でお知らせしました（ピピッ）"`;
      } else if (params.count === '3') {
        return `[Console]::Beep(523, 120); [Console]::Beep(659, 120); [Console]::Beep(784, 250); Write-Output "音でお知らせしました（ファンファーレ）"`;
      }
      return `[Console]::Beep(1000, 250); Write-Output "音でお知らせしました"`;
    }
  },

  'sleep-wait': {
    name: '〇秒待つ (一時停止)',
    category: 'custom',
    fields: [
      { id: 'seconds', label: '何秒待つ？', type: 'select', options: [
        { value: '1', label: '1秒' },
        { value: '3', label: '3秒' },
        { value: '5', label: '5秒' },
        { value: '10', label: '10秒' }
      ], default: '3' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `echo "${params.seconds}秒 待っています..." && sleep ${params.seconds} && echo "次の処理に進みます"`;
      }
      return `Write-Output "${params.seconds}秒 待っています..."; Start-Sleep -Seconds ${params.seconds}; Write-Output "次の処理に進みます"`;
    }
  },

  'diff-files': {
    name: '2つのファイルの違いを比べる (diff)',
    category: 'file',
    fields: [
      { id: 'fileA', label: '比べるファイル①', type: 'text', placeholder: '例: old.txt', default: 'old.txt' },
      { id: 'fileB', label: '比べるファイル②', type: 'text', placeholder: '例: new.txt', default: 'new.txt' }
    ],
    generateCommand: (params) => {
      const fA = resolveVariables(params.fileA);
      const fB = resolveVariables(params.fileB);
      if (isUnix()) {
        return `diff -u "${fA}" "${fB}" || true`;
      }
      return `Compare-Object (Get-Content "${fA}") (Get-Content "${fB}") | Format-Table -AutoSize`;
    }
  },

  'save-to-file': {
    name: '結果をファイルに書き出す (保存)',
    category: 'custom',
    fields: [
      { id: 'filepath', label: '保存するファイル名', type: 'text', placeholder: '例: backup_{today}.txt', default: 'result_{today}.txt' },
      { id: 'mode', label: '保存のしかた', type: 'select', options: [
        { value: 'overwrite', label: '新しく上書きする' },
        { value: 'append', label: '一番後ろに書き足す' }
      ], default: 'overwrite' }
    ],
    generateCommand: (params) => {
      const fp = resolveVariables(params.filepath);
      const op = params.mode === 'append' ? '>>' : '>';
      if (isUnix()) {
        return `printf '%s' "$LAST_RESULT" ${op} "${fp}" && echo "ファイルに書き出しました: ${fp}"`;
      }
      const flag = params.mode === 'append' ? '-Append' : '';
      return `$lastResult | Out-File -FilePath "${fp}" ${flag} -Encoding utf8; Write-Output "ファイルに書き出しました: ${fp}"`;
    }
  },

  'custom-command': {
    name: '自由に入力して動かす (何でも)',
    category: 'custom',
    fields: [
      { id: 'prog', label: '使うツール名', type: 'text', placeholder: '例: python, npm, docker, curl', default: '' },
      { id: 'args', label: '細かい指定やファイル名', type: 'text', placeholder: '例: script.py, --help', default: '' }
    ],
    generateCommand: (params) => {
      const prog = resolveVariables(params.prog).trim();
      const args = resolveVariables(params.args).trim();
      if (!prog) return '# ツール名を入力してください';
      return `${prog} ${args}`;
    }
  },

  // --- Zipの圧縮と解凍 ---
  'zip-compress': {
    name: 'フォルダをZipにまとめる (圧縮)',
    category: 'file',
    fields: [
      { id: 'source', label: 'まとめるフォルダやファイル', type: 'text', placeholder: '例: ./data または memo.txt', default: '.' },
      { id: 'dest', label: 'できあがるZipファイル名', type: 'text', placeholder: '例: backup_{today}.zip', default: 'backup_{today}.zip' }
    ],
    generateCommand: (params) => {
      const src = resolveVariables(params.source);
      const dst = resolveVariables(params.dest);
      if (isUnix()) {
        return `zip -r "${dst}" "${src}" && echo "Zipファイルにまとめました: ${dst}"`;
      }
      return `Compress-Archive -Path "${src}" -DestinationPath "${dst}" -Force; Write-Output "Zipファイルにまとめました: ${dst}"`;
    }
  },

  'zip-extract': {
    name: 'Zipを開いて取り出す (解凍)',
    category: 'file',
    fields: [
      { id: 'zipfile', label: '取り出したいZipファイル', type: 'text', placeholder: '例: backup.zip', default: 'backup.zip' },
      { id: 'dest', label: '取り出し先のフォルダ名', type: 'text', placeholder: '例: ./extracted', default: './extracted' }
    ],
    generateCommand: (params) => {
      const zf = resolveVariables(params.zipfile);
      const dst = resolveVariables(params.dest);
      if (isUnix()) {
        return `mkdir -p "${dst}" && unzip -o "${zf}" -d "${dst}" && echo "Zipの中身を取り出しました: ${dst}"`;
      }
      return `Expand-Archive -Path "${zf}" -DestinationPath "${dst}" -Force; Write-Output "Zipの中身を取り出しました: ${dst}"`;
    }
  },

  // --- 道具・プログラムの追加 ---
  'pkg-install': {
    name: '必要なツールを入れる (インストール)',
    category: 'system',
    fields: [
      { id: 'tool', label: 'どの種類？', type: 'select', options: [
        { value: 'npm', label: 'JavaScript用 (npm)' },
        { value: 'pip', label: 'Python用 (pip)' },
        { value: 'brew', label: 'Mac用ツール (Homebrew)' },
        { value: 'winget', label: 'Windowsアプリ (winget)' }
      ], default: isUnix() ? 'brew' : 'npm' },
      { id: 'pkgname', label: '入れたいツールの名前', type: 'text', placeholder: '例: express, pandas, git, wget', default: '' }
    ],
    generateCommand: (params) => {
      const pkg = resolveVariables(params.pkgname);
      if (!pkg) return '# 入れたいツールの名前を入力してください';
      if (params.tool === 'npm') return `npm install ${pkg}`;
      if (params.tool === 'pip') return `pip install ${pkg}`;
      if (params.tool === 'brew') return `brew install ${pkg}`;
      return `winget install --id "${pkg}" -e --silent`;
    }
  },

  // --- 文字やデータの処理 ---
  'search-text': {
    name: 'ファイルの中から文字を探す (grep/find)',
    category: 'text',
    fields: [
      { id: 'pattern', label: '探したい言葉', type: 'text', placeholder: '例: 宿題 または エラー', default: 'エラー' },
      { id: 'path', label: '調べるファイル', type: 'text', placeholder: '例: *.txt または .', default: '.' }
    ],
    generateCommand: (params) => {
      const pt = resolveVariables(params.pattern);
      const ph = resolveVariables(params.path);
      if (isUnix()) {
        return `grep -rn "${pt}" "${ph}" 2>/dev/null || echo "見つかりませんでした"`;
      }
      return `Select-String -Path "${ph}" -Pattern "${pt}" -ErrorAction SilentlyContinue | Select-Object Filename, LineNumber, Line | Format-Table -AutoSize`;
    }
  },

  'count-lines': {
    name: '行の数や文字数を数える (wc)',
    category: 'text',
    fields: [
      { id: 'target', label: '数えたいファイル', type: 'text', placeholder: '例: sakubun.txt', default: '*.*' }
    ],
    generateCommand: (params) => {
      const tgt = resolveVariables(params.target);
      if (isUnix()) {
        return `wc "${tgt}" 2>/dev/null`;
      }
      return `Get-Content "${tgt}" -ErrorAction SilentlyContinue | Measure-Object -Line -Word -Character | Format-List Lines, Words, Characters`;
    }
  },

  // --- 変更の記録 (Git) ---
  'git-status': {
    name: 'どこが変わったか確認する (git status)',
    category: 'git',
    fields: [],
    generateCommand: () => {
      return `git status -s 2>/dev/null || echo "※ ここはGitで管理されていないフォルダです"`;
    }
  },

  'git-log': {
    name: '過去のセーブ履歴を見る (git log)',
    category: 'git',
    fields: [
      { id: 'count', label: '何件見る？', type: 'select', options: [
        { value: '3', label: '直近 3回分' },
        { value: '5', label: '直近 5回分' },
        { value: '10', label: '直近 10回分' }
      ], default: '5' }
    ],
    generateCommand: (params) => {
      return `git log -n ${params.count} --pretty=format:"%h - %an, %ar : %s"`;
    }
  }
};

// ユーザーが作成したカスタムブロック群
let userBlocks = {};

function loadUserBlocks() {
  try {
    const saved = localStorage.getItem('graphical_terminal_user_blocks');
    if (saved) {
      userBlocks = JSON.parse(saved);
      renderUserBlocksList();
    }
  } catch (e) {
    userBlocks = {};
  }
}

function saveUserBlock(id, def) {
  userBlocks[id] = def;
  localStorage.setItem('graphical_terminal_user_blocks', JSON.stringify(userBlocks));
  renderUserBlocksList();
}

function getBlockDef(type) {
  return BUILTIN_BLOCKS[type] || userBlocks[type];
}

// すぐ使えるおすすめセット
const PRESETS = {
  'battery-check': [
    { type: 'battery-report', params: {} },
    { type: 'beep-sound', params: { count: '1' } }
  ],
  'folder-sync': [
    { type: 'robocopy-sync', params: { source: './data', dest: './backup_mirror' } },
    { type: 'beep-sound', params: { count: '2' } }
  ],
  'date-backup': [
    { type: 'list-files', params: { dir: '.', recursive: 'no' } },
    { type: 'zip-compress', params: { source: '.', dest: 'backup_{today}.zip' } },
    { type: 'beep-sound', params: { count: '2' } }
  ]
};

// 2. アプリの状態管理
let blocks = [];
let currentCwd = '';
let showInternalCommands = true;
let isDemoMode = false;

// DOM要素
const canvas = document.getElementById('canvas');
const emptyState = document.getElementById('emptyState');
const blockCountEl = document.getElementById('blockCount');
const currentCwdEl = document.getElementById('currentCwd');
const statusBadge = document.getElementById('statusBadge');
const durationBadge = document.getElementById('durationBadge');
const osBadge = document.getElementById('osBadge');
const outputLog = document.getElementById('outputLog');
const explanationBox = document.getElementById('explanationBox');
const toggleShowCommands = document.getElementById('toggleShowCommands');
const toggleRunAsAdmin = document.getElementById('toggleRunAsAdmin');
const toggleStopOnError = document.getElementById('toggleStopOnError');
const btnStopProcess = document.getElementById('btnStopProcess');
const blockSearchInput = document.getElementById('blockSearchInput');

// 3. 初期化
async function init() {
  document.body.classList.add('show-commands');
  loadUserBlocks();
  await fetchCwd();
  setupEventListeners();
  loadPreset('date-backup');
}

async function fetchCwd() {
  try {
    const res = await fetch('/api/cwd');
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    currentCwd = data.cwd;
    currentCwdEl.textContent = currentCwd;
    if (data.platform) {
      currentPlatform = data.platform;
      if (osBadge) {
        osBadge.textContent = data.osName || (isUnix() ? 'macOS' : 'Windows');
      }
    }
  } catch (err) {
    isDemoMode = true;
    currentCwd = isUnix() ? '/Users/user/Projects/DemoWorkspace' : 'C:\\Users\\user\\Projects\\DemoWorkspace';
    currentCwdEl.textContent = `${currentCwd} (体験デモ中)`;
    if (osBadge) {
      osBadge.textContent = isUnix() ? 'macOS (デモ)' : 'Windows (デモ)';
    }
    explanationBox.innerHTML = '<strong>お試しデモ中:</strong> 画面の動きを体験できます。実際に動かす場合は <code>start.bat</code> または <code>./start.sh</code> を実行してください。';
    explanationBox.classList.remove('hidden');
  }
}

// ユーザー作成ブロックの描画
function renderUserBlocksList() {
  const section = document.getElementById('userBlocksSection');
  const list = document.getElementById('userBlocksList');
  list.innerHTML = '';

  const keys = Object.keys(userBlocks);
  if (keys.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  keys.forEach(k => {
    const def = userBlocks[k];
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.textContent = def.name;
    btn.addEventListener('click', () => addBlock(k));
    list.appendChild(btn);
  });
}

function setupEventListeners() {
  // パレットボタン
  document.querySelectorAll('.item-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      addBlock(type);
    });
  });

  // 検索フィルター
  blockSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const categories = document.querySelectorAll('#allBlocksSection .category');
    
    categories.forEach(cat => {
      let hasMatch = false;
      cat.querySelectorAll('.item-btn').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          btn.style.display = 'block';
          hasMatch = true;
        } else {
          btn.style.display = 'none';
        }
      });
      cat.style.display = hasMatch ? 'block' : 'none';
    });
  });

  // おすすめセットボタン
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const recipe = btn.getAttribute('data-recipe');
      loadPreset(recipe);
    });
  });

  // クリアボタン
  document.getElementById('btnClearCanvas').addEventListener('click', () => {
    blocks = [];
    renderCanvas();
  });

  // 実行ボタン
  document.getElementById('btnRunAll').addEventListener('click', handleRun);

  // プロセス中断ボタン
  btnStopProcess.addEventListener('click', async () => {
    try {
      await fetch('/api/kill', { method: 'POST' });
      statusBadge.className = 'status-indicator error';
      statusBadge.textContent = '止めました';
      btnStopProcess.classList.add('hidden');
    } catch (e) {
      // ignore
    }
  });

  // コマンド表示切替
  toggleShowCommands.addEventListener('change', (e) => {
    showInternalCommands = e.target.checked;
    document.body.classList.toggle('show-commands', showInternalCommands);
  });

  // 結果ログ操作
  document.getElementById('btnClearLog').addEventListener('click', () => {
    outputLog.textContent = 'ここに実行結果が表示されます';
    explanationBox.classList.add('hidden');
    statusBadge.className = 'status-indicator idle';
    statusBadge.textContent = '待機中';
    durationBadge.classList.add('hidden');
  });

  document.getElementById('btnCopyLog').addEventListener('click', () => {
    navigator.clipboard.writeText(outputLog.textContent);
    alert('結果をコピーしました！メモ帳などに貼り付けられます。');
  });

  // フォルダ変更モーダル
  document.getElementById('btnChangeCwd').addEventListener('click', () => {
    document.getElementById('inputNewCwd').value = currentCwd;
    document.getElementById('cwdModal').classList.remove('hidden');
  });
  document.getElementById('btnCwdCancel').addEventListener('click', () => {
    document.getElementById('cwdModal').classList.add('hidden');
  });
  document.getElementById('btnCwdSave').addEventListener('click', async () => {
    const newDir = document.getElementById('inputNewCwd').value.trim();
    if (!newDir) return;
    try {
      const res = await fetch('/api/cwd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir: newDir })
      });
      const data = await res.json();
      if (data.ok) {
        currentCwd = data.cwd;
        currentCwdEl.textContent = currentCwd;
        document.getElementById('cwdModal').classList.add('hidden');
      } else {
        alert(data.error || 'フォルダが見つかりませんでした');
      }
    } catch (err) {
      alert('エラー: ' + err.message);
    }
  });

  // 削除確認モーダル
  const modalCheckbox = document.getElementById('modalCheckbox');
  const btnModalConfirm = document.getElementById('btnModalConfirm');
  modalCheckbox.addEventListener('change', () => {
    btnModalConfirm.disabled = !modalCheckbox.checked;
  });
  document.getElementById('btnModalCancel').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.add('hidden');
  });
  btnModalConfirm.addEventListener('click', () => {
    document.getElementById('confirmModal').classList.add('hidden');
    executeScript(buildFullScript());
  });

  // 新規カスタムブロック作成
  document.getElementById('btnOpenCreateBlock').addEventListener('click', () => {
    document.getElementById('newBlockName').value = '';
    document.getElementById('newBlockCmd').value = '';
    document.getElementById('createBlockModal').classList.remove('hidden');
  });
  document.getElementById('btnCreateBlockCancel').addEventListener('click', () => {
    document.getElementById('createBlockModal').classList.add('hidden');
  });
  document.getElementById('btnCreateBlockSave').addEventListener('click', () => {
    const name = document.getElementById('newBlockName').value.trim();
    const cmdTemplate = document.getElementById('newBlockCmd').value.trim();
    if (!name || !cmdTemplate) {
      alert('ブロックの名前と命令の内容を入力してください。');
      return;
    }

    const matches = cmdTemplate.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const fields = matches.map(m => {
      const id = m.replace(/\{|\}/g, '');
      return { id, label: id, type: 'text', placeholder: id, default: '' };
    });

    const blockId = 'custom_' + Date.now();
    const newDef = {
      name,
      category: 'custom',
      fields,
      template: cmdTemplate
    };

    saveUserBlock(blockId, newDef);
    document.getElementById('createBlockModal').classList.add('hidden');
    addBlock(blockId);
  });

  // ヘルプ
  document.getElementById('btnHelp').addEventListener('click', () => {
    alert(
      '【Graphical Terminal の使い方】\n\n' +
      'WindowsでもMacでも、ブロックを並べるだけで同じようにパソコンを自動操作できます。\n\n' +
      '・お使いのOSに合わせて、裏側で動くコマンド（PowerShell / bash）が自動で切り替わります。\n' +
      '・ファイル名に {today} と書くと今日の日付（20261108など）が自動で入ります。\n' +
      '・ドラッグでブロックの順番を自由に入れ替えられます。'
    );
  });
}

// 4. ブロック操作
function addBlock(type, initialParams = null) {
  const def = getBlockDef(type);
  if (!def) return;

  const params = {};
  def.fields.forEach(f => {
    params[f.id] = (initialParams && initialParams[f.id] !== undefined) ? initialParams[f.id] : f.default;
  });

  blocks.push({
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    type,
    params
  });

  renderCanvas();
}

function removeBlock(index) {
  blocks.splice(index, 1);
  renderCanvas();
}

function moveBlock(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= blocks.length) return;
  const temp = blocks[index];
  blocks[index] = blocks[targetIndex];
  blocks[targetIndex] = temp;
  renderCanvas();
}

function reorderBlocks(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [movedItem] = blocks.splice(fromIndex, 1);
  blocks.splice(toIndex, 0, movedItem);
  renderCanvas();
}

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;
  blocks = [];
  preset.forEach(item => {
    addBlock(item.type, item.params);
  });
}

function generateBlockCommand(b) {
  const def = getBlockDef(b.type);
  if (!def) return '';

  if (def.generateCommand) {
    return def.generateCommand(b.params);
  }

  if (def.template) {
    let cmd = def.template;
    def.fields.forEach(f => {
      const val = resolveVariables(b.params[f.id]) || '';
      cmd = cmd.replaceAll(`{${f.id}}`, val);
    });
    return resolveVariables(cmd);
  }

  return '';
}

// 5. キャンバス描画
function renderCanvas() {
  blockCountEl.textContent = blocks.length;

  if (blocks.length === 0) {
    emptyState.style.display = 'block';
    canvas.querySelectorAll('.block-card, .connector-arrow').forEach(el => el.remove());
    return;
  }

  emptyState.style.display = 'none';
  canvas.querySelectorAll('.block-card, .connector-arrow').forEach(el => el.remove());

  blocks.forEach((b, index) => {
    const def = getBlockDef(b.type);
    if (!def) return;

    const card = document.createElement('div');
    card.className = `block-card ${def.category || ''}`;
    card.setAttribute('data-id', b.id);
    card.setAttribute('draggable', 'true');

    // ドラッグ＆ドロップイベント
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.block-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(fromIdx) && fromIdx !== index) {
        reorderBlocks(fromIdx, index);
      }
    });

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'block-card-header';
    header.innerHTML = `
      <div class="block-card-title">
        <span class="drag-handle" title="ドラッグして並べ替え">⠿</span>
        <span>${def.name}</span>
      </div>
      <div class="block-card-controls">
        <button class="icon-btn btn-up" title="上へ移動" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
        <button class="icon-btn btn-down" title="下へ移動" ${index === blocks.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
        <button class="icon-btn btn-delete" title="消す">✕</button>
      </div>
    `;

    header.querySelector('.btn-up').addEventListener('click', () => moveBlock(index, -1));
    header.querySelector('.btn-down').addEventListener('click', () => moveBlock(index, 1));
    header.querySelector('.btn-delete').addEventListener('click', () => removeBlock(index));

    // ボディ
    const body = document.createElement('div');
    body.className = 'block-card-body';

    if (def.fields.length === 0) {
      const p = document.createElement('div');
      p.style.fontSize = '12px';
      p.style.color = '#64748b';
      p.textContent = '（このブロックは入力なしでそのまま動かせます）';
      body.appendChild(p);
    } else {
      def.fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'form-row';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = field.label;

        let input;
        if (field.type === 'select') {
          input = document.createElement('select');
          input.className = 'form-select';
          field.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === b.params[field.id]) option.selected = true;
            input.appendChild(option);
          });
        } else {
          input = document.createElement('input');
          input.type = 'text';
          input.className = 'form-input';
          input.placeholder = field.placeholder || '';
          input.value = b.params[field.id] || '';
        }

        input.addEventListener('input', (e) => {
          b.params[field.id] = e.target.value;
          updatePreview(card, b);
        });

        row.appendChild(label);
        row.appendChild(input);
        body.appendChild(row);
      });
    }

    // コマンドプレビュー
    const preview = document.createElement('div');
    preview.className = 'internal-cmd-preview';
    preview.textContent = `$ ${generateBlockCommand(b)}`;
    body.appendChild(preview);

    card.appendChild(header);
    card.appendChild(body);
    canvas.appendChild(card);

    if (index < blocks.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'connector-arrow';
      arrow.innerHTML = '<span>↓</span>';
      canvas.appendChild(arrow);
    }
  });
}

function updatePreview(card, b) {
  const preview = card.querySelector('.internal-cmd-preview');
  if (preview) {
    preview.textContent = `$ ${generateBlockCommand(b)}`;
  }
}

// 6. コマンド構築と実行 (OSに応じたスクリプト組み立て)
function buildFullScript() {
  const parts = [];
  const stopOnError = toggleStopOnError && toggleStopOnError.checked;

  if (isUnix()) {
    // macOS / Linux: bash / zsh 用のパイプライン
    if (stopOnError) {
      parts.push('set -e');
    }
    parts.push('LAST_RESULT=""');
    if (lastUserInput) {
      parts.push(`userInput="${lastUserInput}"`);
    }

    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      parts.push(`echo "--- [ステップ ${idx + 1}: ${def.name}] ---"\nLAST_RESULT=$(${cmd})\nif [ -n "$LAST_RESULT" ]; then echo "$LAST_RESULT"; fi`);
    });

    return parts.join('\n\n');
  } else {
    // Windows: PowerShell 用のパイプライン
    if (stopOnError) {
      parts.push('$ErrorActionPreference = "Stop";');
    }
    parts.push('$lastResult = $null;');
    if (lastUserInput) {
      parts.push(`$userInput = "${lastUserInput}";`);
    }

    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      parts.push(`Write-Output "--- [ステップ ${idx + 1}: ${def.name}] ---";\n$lastResult = (${cmd});\nif ($lastResult) { $lastResult | Out-String | Write-Output }`);
    });

    return parts.join(';\n\n');
  }
}

// 対話型入力プロンプト処理
async function handleRun() {
  if (blocks.length === 0) {
    alert('動かすブロックがありません。左のメニューから選んでみてください。');
    return;
  }

  const promptBlock = blocks.find(b => b.type === 'prompt-input');
  if (promptBlock) {
    const q = promptBlock.params.question || '文字を入力してください：';
    const dVal = resolveVariables(promptBlock.params.defaultVal || '');
    
    document.getElementById('promptModalTitle').textContent = '質問です';
    document.getElementById('promptModalLabel').textContent = q;
    const inputEl = document.getElementById('promptModalInput');
    inputEl.value = dVal;
    
    document.getElementById('promptModal').classList.remove('hidden');

    return new Promise((resolve) => {
      const handler = () => {
        lastUserInput = inputEl.value.trim();
        document.getElementById('promptModal').classList.add('hidden');
        document.getElementById('btnPromptModalSubmit').removeEventListener('click', handler);
        checkDangerAndExecute();
        resolve();
      };
      document.getElementById('btnPromptModalSubmit').addEventListener('click', handler);
    });
  }

  checkDangerAndExecute();
}

function checkDangerAndExecute() {
  const hasDanger = blocks.some(b => b.type === 'delete-file');
  if (hasDanger) {
    const deleteBlock = blocks.find(b => b.type === 'delete-file');
    const target = resolveVariables(deleteBlock.params.target) || '(未入力)';
    document.getElementById('modalTargetDetails').textContent = `消す対象: ${target}`;
    document.getElementById('modalCheckbox').checked = false;
    document.getElementById('btnModalConfirm').disabled = true;
    document.getElementById('confirmModal').classList.remove('hidden');
    return;
  }

  executeScript(buildFullScript());
}

async function executeScript(script) {
  statusBadge.className = 'status-indicator running';
  statusBadge.textContent = '動かしています...';
  durationBadge.classList.add('hidden');
  btnStopProcess.classList.remove('hidden');
  outputLog.textContent = '処理しています。少々お待ちください...\n';

  const isAdmin = toggleRunAsAdmin && toggleRunAsAdmin.checked;
  const finalScript = isAdmin 
    ? (isUnix() ? `sudo bash -c '${script}'` : `Write-Output "※ 管理者権限で起動しています..."; ${script}`)
    : script;

  if (isDemoMode) {
    setTimeout(() => {
      btnStopProcess.classList.add('hidden');
      durationBadge.textContent = '0.30秒';
      durationBadge.classList.remove('hidden');
      statusBadge.className = 'status-indicator success';
      statusBadge.textContent = '完了 (デモ)';

      let mockOutput = '=== [お試し実行の結果] ===\n\n';
      blocks.forEach((b, idx) => {
        const def = getBlockDef(b.type);
        mockOutput += `----------------------------------------\n`;
        mockOutput += `[ステップ ${idx + 1}: ${def.name}]\n`;
        mockOutput += `裏で動いたコマンド: ${generateBlockCommand(b)}\n\n`;

        if (b.type === 'zip-compress') {
          mockOutput += `Zipファイルを作成しました: ${resolveVariables(b.params.dest)}\n\n`;
        } else if (b.type === 'beep-sound') {
          mockOutput += `音でお知らせしました。\n\n`;
        } else {
          mockOutput += `(正常に処理が終わりました)\n\n`;
        }
      });
      outputLog.textContent = mockOutput;
    }, 400);
    return;
  }

  try {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: finalScript })
    });
    const data = await res.json();

    btnStopProcess.classList.add('hidden');
    durationBadge.textContent = `${data.duration}`;
    durationBadge.classList.remove('hidden');

    if (data.ok) {
      statusBadge.className = 'status-indicator success';
      statusBadge.textContent = 'おわりました';
      outputLog.textContent = data.stdout || '(画面へのメッセージはありませんでした)';
    } else {
      statusBadge.className = 'status-indicator error';
      statusBadge.textContent = '途中でストップしました';
      outputLog.textContent = (data.stdout ? data.stdout + '\n' : '') + (data.stderr || 'エラーが発生しました');
      
      if (data.explanation) {
        explanationBox.textContent = data.explanation;
        explanationBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    btnStopProcess.classList.add('hidden');
    statusBadge.className = 'status-indicator error';
    statusBadge.textContent = '通信エラー';
    outputLog.textContent = 'サーバーとの通信でエラーが出ました: ' + err.message;
  }
}

init();
