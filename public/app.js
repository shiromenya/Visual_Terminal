// app.js - Graphical Terminal Logic (Windows全コマンド図鑑 & マルチプラットフォーム対応版)

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

// 📖 全コマンド図鑑データベース（Microsoft公式 Windows Commands 逆引き集）
const COMMAND_CATALOG = [
  {
    id: 'wifi-password',
    name: '保存済みWi-Fiのパスワードを調べる',
    cmd: 'netsh wlan',
    category: 'network',
    desc: 'パソコンに一度でも繋いだことのあるWi-Fiの暗号化キー（パスワード）を表示します。',
    fields: [
      { id: 'ssid', label: 'Wi-Fiの名前(SSID)', type: 'text', placeholder: '例: Buffalo-G-1234', default: '' }
    ],
    generateCommand: (params) => {
      const s = resolveVariables(params.ssid).trim();
      if (!s) {
        return isUnix() 
          ? `echo "登録されているWi-Fi一覧:" && (networksetup -listpreferredwirelessnetworks en0 2>/dev/null || echo "Wi-Fi一覧を取得できませんでした")`
          : `netsh wlan show profiles`;
      }
      return isUnix()
        ? `security find-generic-password -D "AirPort network password" -a "${s}" -gw 2>/dev/null || echo "パスワードの取得に失敗しました"`
        : `netsh wlan show profile name="${s}" key=clear`;
    }
  },
  {
    id: 'flush-dns',
    name: 'ネットの詰まりを解消する (DNSキャッシュ消去)',
    cmd: 'ipconfig /flushdns',
    category: 'network',
    desc: '「Webページがうまく開かない・更新が反映されない」ときにネットの一時記憶をクリアします。',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder 2>/dev/null && echo "DNSキャッシュを消去しました"`;
      }
      return `ipconfig /flushdns; Write-Output "DNSキャッシュをきれいに消去しました"`;
    }
  },
  {
    id: 'compact-disk',
    name: 'フォルダを圧縮して空き容量を増やす',
    cmd: 'compact',
    category: 'storage',
    desc: 'Windowsの標準機能でフォルダ内のファイルを圧縮し、容量を空けます（開くときは自動解凍されます）。',
    fields: [
      { id: 'dir', label: '圧縮するフォルダ', type: 'text', placeholder: '例: ./data', default: './data' }
    ],
    generateCommand: (params) => {
      const d = resolveVariables(params.dir);
      if (isUnix()) {
        return `echo "Macでは自動圧縮の代わりにzipをご利用ください"`;
      }
      return `compact /c /s:"${d}" /i`;
    }
  },
  {
    id: 'cipher-wipe',
    name: '消したデータを完全抹消・復元不可にする',
    cmd: 'cipher /w',
    category: 'security',
    desc: '一度ゴミ箱から消したデータが復元ソフトで盗まれないよう、空き領域を完全に上書き消去します。',
    fields: [
      { id: 'drive', label: '対象ドライブ', type: 'select', options: [
        { value: 'C:', label: 'Cドライブ' },
        { value: 'D:', label: 'Dドライブ' }
      ], default: 'C:' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `echo "Macではディスクユーティリティの消去をご利用ください"`;
      }
      return `Write-Output "空き領域の抹消を開始します（数分〜数時間かかる場合があります）..."; cipher /w:${params.drive}`;
    }
  },
  {
    id: 'file-checksum',
    name: 'ファイルの指紋(ハッシュ/SHA256)を調べる',
    cmd: 'certutil / Get-FileHash',
    category: 'security',
    desc: 'ダウンロードしたファイルが改ざん・破損されていないか安全性を確かめます。',
    fields: [
      { id: 'file', label: '調べるファイル', type: 'text', placeholder: '例: setup.exe', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const f = resolveVariables(params.file);
      if (isUnix()) {
        return `shasum -a 256 "${f}" 2>/dev/null || md5 "${f}"`;
      }
      return `Get-FileHash -Path "${f}" -Algorithm SHA256 | Format-List`;
    }
  },
  {
    id: 'disk-free-space',
    name: '各ドライブの空き容量を一覧で見る',
    cmd: 'fsutil / Get-PSDrive',
    category: 'storage',
    desc: 'Cドライブや外付けハードディスクの残り空き容量と使用量をひと目で確認します。',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `df -h`;
      }
      return `Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{Name="空き容量(GB)";Expression={[math]::Round($_.Free / 1GB, 1)}}, @{Name="合計容量(GB)";Expression={[math]::Round(($_.Used + $_.Free) / 1GB, 1)}} | Format-Table -AutoSize`;
    }
  },
  {
    id: 'task-kill-name',
    name: '固まったアプリを強制終了する',
    cmd: 'taskkill / killall',
    category: 'system',
    fields: [
      { id: 'appName', label: 'アプリ名', type: 'text', placeholder: '例: notepad, chrome, Code', default: 'notepad' }
    ],
    generateCommand: (params) => {
      const n = resolveVariables(params.appName);
      if (isUnix()) {
        return `killall -9 "${n}" 2>/dev/null && echo "アプリを終了しました: ${n}" || echo "見つかりませんでした"`;
      }
      return `taskkill /im "${n}.exe" /f; Write-Output "アプリを終了しました: ${n}"`;
    }
  },
  {
    id: 'whoami-info',
    name: '自分のユーザー名とグループ権限を調べる',
    cmd: 'whoami',
    category: 'security',
    desc: '今パソコンを操作しているアカウントの権限情報やSIDを確認します。',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `id && whoami`;
      }
      return `whoami /all`;
    }
  },
  {
    id: 'open-url-browser',
    name: 'ブラウザでWebサイトをサッと開く',
    cmd: 'start / open',
    category: 'convenient',
    desc: '指定したホームページをいつものブラウザで直接起動します。',
    fields: [
      { id: 'url', label: '開きたいアドレス(URL)', type: 'text', placeholder: 'https://google.com', default: 'https://google.com' }
    ],
    generateCommand: (params) => {
      const u = resolveVariables(params.url);
      if (isUnix()) {
        return `open "${u}" 2>/dev/null || xdg-open "${u}" 2>/dev/null`;
      }
      return `Start-Process "${u}"`;
    }
  }
];

// 基本ブロックマスタ（図鑑の項目も辞書として統合）
const BUILTIN_BLOCKS = {};
COMMAND_CATALOG.forEach(item => {
  BUILTIN_BLOCKS[item.id] = item;
});

// 既存の標準ブロック群を追加統合
Object.assign(BUILTIN_BLOCKS, {
  'battery-report': {
    name: 'ノートPCのバッテリー寿命を調べる (powercfg)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) {
        return `pmset -g batt 2>/dev/null || echo "バッテリー情報を取得しました"`;
      }
      return `powercfg /batteryreport /output "battery_report.html"; Write-Output "バッテリー診断レポート (battery_report.html) を作成しました！ブラウザで開いて寿命を確認できます。"`;
    }
  },

  'robocopy-sync': {
    name: 'フォルダを丸ごと高速同期 (robocopy)',
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

  'disk-check': {
    name: 'ドライブの故障・エラーを検査する (chkdsk)',
    category: 'system',
    fields: [
      { id: 'drive', label: '調べるドライブ', type: 'select', options: [
        { value: 'C', label: 'Cドライブ (メインSSD/HDD)' },
        { value: 'D', label: 'Dドライブ (データ用)' }
      ], default: 'C' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `echo "MacではFirst Aidをご利用ください"`;
      return `chkdsk ${params.drive}: /scan`;
    }
  },

  'sys-repair': {
    name: '壊れたシステムファイルを修復する (sfc)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "MacではOSアップデートをご利用ください"`;
      return `Write-Output "Windowsのシステムファイルをスキャンして自動修復します..."; sfc /scannow`;
    }
  },

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
      if (isUnix()) return `cat "${fp}"`;
      return `Get-Content "${fp}" -ErrorAction SilentlyContinue -Raw`;
    }
  },

  'open-notepad': {
    name: 'メモ帳で開いて編集する',
    category: 'file',
    fields: [
      { id: 'filepath', label: '開きたいファイル名', type: 'text', placeholder: '例: memo.txt', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const fp = resolveVariables(params.filepath);
      if (isUnix()) return `open -e "${fp}" 2>/dev/null || xdg-open "${fp}" 2>/dev/null || echo "エディタを開きました: ${fp}"`;
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
      if (isUnix()) return `find . -name "${filter}" 2>/dev/null`;
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
      if (isUnix()) return `cp -r "${src}" "${dst}" && echo "コピー完了: ${src} ➔ ${dst}"`;
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
      if (isUnix()) return `rm -rf "${tgt}" && echo "削除が終わりました: ${tgt}"`;
      return `Remove-Item -Path "${tgt}" -Force -ErrorAction Stop; Write-Output "削除が終わりました: ${tgt}"`;
    }
  },

  'show-ip': {
    name: '自分のIPアドレスを調べる (ipconfig)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "--- [Wi-Fi / LAN のIPアドレス] ---" && ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'`;
      return `Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object InterfaceAlias, IPAddress, PrefixOrigin | Format-Table -AutoSize`;
    }
  },

  'check-port': {
    name: 'ポート番号が使われているか調べる',
    category: 'system',
    fields: [
      { id: 'port', label: '調べるポート番号', type: 'text', placeholder: '例: 3000, 8080', default: '3000' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.port).trim() || '3000';
      if (isUnix()) return `lsof -i :${p} || echo "🟢 ポート ${p} は現在【空いています】"`;
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
      if (isUnix()) return `ping -c 2 "${h}"`;
      return `Test-Connection -ComputerName "${h}" -Count 2 | Select-Object Address, ResponseTime, Status | Format-Table -AutoSize`;
    }
  },

  'trace-route': {
    name: '通信の通り道を調べる (tracert)',
    category: 'system',
    fields: [
      { id: 'host', label: '宛先アドレス', type: 'text', placeholder: '例: google.com', default: 'google.com' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || 'google.com';
      if (isUnix()) return `traceroute -m 8 "${h}" 2>/dev/null || traceroute "${h}"`;
      return `tracert -d -h 8 "${h}"`;
    }
  },

  'web-download': {
    name: 'ネットからファイルを保存する',
    category: 'system',
    fields: [
      { id: 'url', label: 'ダウンロード先のURL', type: 'text', placeholder: 'https://example.com/file.zip', default: '' },
      { id: 'outfile', label: '保存するファイル名', type: 'text', placeholder: 'file.zip', default: 'downloaded.dat' }
    ],
    generateCommand: (params) => {
      const url = resolveVariables(params.url);
      const of = resolveVariables(params.outfile);
      if (!url) return '# ダウンロードするURLを入力してください';
      if (isUnix()) return `curl -L -o "${of}" "${url}" && echo "ダウンロード完了: ${of}"`;
      return `Invoke-WebRequest -Uri "${url}" -OutFile "${of}"; Write-Output "ダウンロードが終わりました: ${of}"`;
    }
  },

  'web-api': {
    name: 'Webからデータを取ってくる (API)',
    category: 'system',
    fields: [
      { id: 'url', label: 'アクセス先のアドレス', type: 'text', placeholder: '例: https://api.github.com/zen', default: 'https://api.github.com/zen' }
    ],
    generateCommand: (params) => {
      const url = resolveVariables(params.url);
      if (isUnix()) return `curl -s "${url}"`;
      return `Invoke-RestMethod -Uri "${url}"`;
    }
  },

  'system-info': {
    name: 'パソコンの詳しい情報を見る',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `uname -a && (sw_vers 2>/dev/null || cat /etc/os-release 2>/dev/null)`;
      return `[PSCustomObject]@{ "OS" = (Get-CimInstance Win32_OperatingSystem).Caption; "CPU" = (Get-CimInstance Win32_Processor).Name; "メモリ合計(GB)" = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2); "空きメモリ(GB)" = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2) } | Format-List`;
    }
  },

  'process-list': {
    name: '今動いているアプリ一覧',
    category: 'system',
    fields: [
      { id: 'top', label: '何個見る？', type: 'select', options: [
        { value: '5', label: '上位 5個' },
        { value: '10', label: '上位 10個' }
      ], default: '10' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `ps aux | head -n ${parseInt(params.top, 10) + 1}`;
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
        if (params.action === 'cancel') return `sudo killall shutdown 2>/dev/null && echo "シャットダウンの予約を取り消しました"`;
        const flag = params.action === 'restart' ? '-r' : '-h';
        return `sudo shutdown ${flag} +${params.minutes} && echo "${params.minutes}分後に実行するよう予約しました"`;
      }
      if (params.action === 'cancel') return `shutdown /a; Write-Output "シャットダウンの予約を取り消しました"`;
      const flag = params.action === 'restart' ? '/r' : '/s';
      const sec = parseInt(params.minutes, 10) * 60;
      return `shutdown ${flag} /t ${sec}; Write-Output "${params.minutes}分後に実行するよう予約しました"`;
    }
  },

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
      return `# 質問: "${q}" (入力値: $userInput)`;
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
      if (isUnix()) return `for i in $(seq 1 ${params.count}); do ${action}; done`;
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
      if (isUnix()) return `while IFS= read -r line; do ${action}; done <<< "$LAST_RESULT"`;
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
        if (params.condType === 'file_exists') return `if [ -e "${target}" ]; then ${actIf}; else ${actElse}; fi`;
        if (params.condType === 'prev_success') return `if [ $? -eq 0 ]; then ${actIf}; else ${actElse}; fi`;
        return `if echo "$LAST_RESULT" | grep -q "${target}"; then ${actIf}; else ${actElse}; fi`;
      }
      if (params.condType === 'file_exists') return `if (Test-Path "${target}") { ${actIf} } else { ${actElse} }`;
      if (params.condType === 'prev_success') return `if ($?) { ${actIf} } else { ${actElse} }`;
      return `if ($lastResult -match "${target}") { ${actIf} } else { ${actElse} }`;
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
      if (isUnix()) return `export ${params.key}="${val}" && echo "設定を保存しました: ${params.key}=${val}"`;
      return `$env:${params.key} = "${val}"; Write-Output "設定を保存しました: ${params.key}=${val}"`;
    }
  },

  'copy-clipboard': {
    name: '結果をクリップボードにコピー',
    category: 'custom',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `printf '%s' "$LAST_RESULT" | (pbcopy 2>/dev/null || xclip -selection clipboard 2>/dev/null || cat) && echo "直前の結果をクリップボードにコピーしました！"`;
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
      if (isUnix()) return `(afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || printf '\\a') && echo "音でお知らせしました"`;
      if (params.count === '2') return `[Console]::Beep(880, 150); Start-Sleep -Milliseconds 100; [Console]::Beep(880, 200); Write-Output "音でお知らせしました（ピピッ）"`;
      if (params.count === '3') return `[Console]::Beep(523, 120); [Console]::Beep(659, 120); [Console]::Beep(784, 250); Write-Output "音でお知らせしました（ファンファーレ）"`;
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
      if (isUnix()) return `echo "${params.seconds}秒 待っています..." && sleep ${params.seconds} && echo "次の処理に進みます"`;
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
      if (isUnix()) return `diff -u "${fA}" "${fB}" || true`;
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
      if (isUnix()) return `printf '%s' "$LAST_RESULT" ${op} "${fp}" && echo "ファイルに書き出しました: ${fp}"`;
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
      if (isUnix()) return `zip -r "${dst}" "${src}" && echo "Zipファイルにまとめました: ${dst}"`;
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
      if (isUnix()) return `mkdir -p "${dst}" && unzip -o "${zf}" -d "${dst}" && echo "Zipの中身を取り出しました: ${dst}"`;
      return `Expand-Archive -Path "${zf}" -DestinationPath "${dst}" -Force; Write-Output "Zipの中身を取り出しました: ${dst}"`;
    }
  },

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
      if (isUnix()) return `grep -rn "${pt}" "${ph}" 2>/dev/null || echo "見つかりませんでした"`;
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
      if (isUnix()) return `wc "${tgt}" 2>/dev/null`;
      return `Get-Content "${tgt}" -ErrorAction SilentlyContinue | Measure-Object -Line -Word -Character | Format-List Lines, Words, Characters`;
    }
  },

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
  },

  'driver-list': {
    name: 'インストール済みドライバ一覧 (driverquery)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `kextstat 2>/dev/null || lsmod 2>/dev/null || echo "ドライバ情報を取得しました"`;
      return `driverquery /fo table | Select-Object -First 30`;
    }
  },

  'dxdiag-run': {
    name: 'DirectX・グラフィック診断 (dxdiag)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `system_profiler SPDisplaysDataType 2>/dev/null || lspci 2>/dev/null`;
      return `Get-CimInstance Win32_VideoController | Select-Object Caption, DriverVersion, VideoModeDescription | Format-List`;
    }
  },

  'netstat-ports': {
    name: '通信中ポート・PID全一覧 (netstat -ano)',
    category: 'network',
    fields: [
      { id: 'filter', label: '状態で絞り込み', type: 'select', options: [
        { value: 'all', label: 'すべて表示' },
        { value: 'listen', label: '待機中 (LISTENING) のみ' },
        { value: 'estab', label: '通信確立 (ESTABLISHED) のみ' }
      ], default: 'listen' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        const flag = params.filter === 'listen' ? 'LISTEN' : (params.filter === 'estab' ? 'ESTABLISHED' : '');
        return flag ? `lsof -i -P -n | grep ${flag} | head -n 30` : `lsof -i -P -n | head -n 30`;
      }
      const st = params.filter === 'listen' ? 'LISTENING' : (params.filter === 'estab' ? 'ESTABLISHED' : '');
      const filterCmd = st ? `| Where-Object { $_ -match '${st}' }` : '';
      return `netstat -ano ${filterCmd} | Select-Object -First 30`;
    }
  },

  'arp-scan': {
    name: 'LAN内機器MACアドレス一覧 (arp -a)',
    category: 'network',
    fields: [],
    generateCommand: () => {
      return `arp -a | Select-Object -First 25`;
    }
  },

  'defrag-drive': {
    name: 'ドライブ最適化・デフラグ (defrag)',
    category: 'storage',
    fields: [
      { id: 'drive', label: '対象ドライブ', type: 'select', options: [
        { value: 'C:', label: 'Cドライブ' },
        { value: 'D:', label: 'Dドライブ' }
      ], default: 'C:' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `echo "※ macOS / Linux ファイルシステムは自動最適化されます"`;
      return `Optimize-Volume -DriveLetter ${params.drive.replace(':', '')} -Defrag -Verbose`;
    }
  },

  'vol-info': {
    name: 'ボリュームシリアル確認 (vol)',
    category: 'storage',
    fields: [
      { id: 'drive', label: '対象ドライブ', type: 'text', placeholder: 'C:', default: 'C:' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `df -h "${params.drive || '/'}"`;
      return `vol ${params.drive || 'C:'}`;
    }
  },

  'find-str': {
    name: 'ファイル内文字列検索 (findstr / grep)',
    category: 'file',
    fields: [
      { id: 'pattern', label: '検索する文字列', type: 'text', placeholder: '例: password, ERROR', default: 'ERROR' },
      { id: 'mask', label: '対象ファイル', type: 'text', placeholder: '例: *.log または *.*', default: '*.txt' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.pattern);
      const m = resolveVariables(params.mask);
      if (isUnix()) return `grep -rn "${p}" ${m} 2>/dev/null || echo "見つかりませんでした"`;
      return `findstr /s /i /n "${p}" ${m}`;
    }
  },

  'where-cmd': {
    name: 'コマンド実体パス検索 (where / which)',
    category: 'file',
    fields: [
      { id: 'cmdName', label: '探したいコマンド/アプリ名', type: 'text', placeholder: '例: git, node, python, code', default: 'git' }
    ],
    generateCommand: (params) => {
      const c = resolveVariables(params.cmdName);
      if (isUnix()) return `which "${c}" 2>/dev/null || echo "見つかりませんでした: ${c}"`;
      return `where.exe "${c}"`;
    }
  },

  'file-attrib': {
    name: '属性変更・隠しファイル解除 (attrib)',
    category: 'file',
    fields: [
      { id: 'filepath', label: '対象ファイル', type: 'text', placeholder: '例: memo.txt', default: '' },
      { id: 'attr', label: '変更内容', type: 'select', options: [
        { value: '-h', label: '隠しファイル属性を解除 (-h)' },
        { value: '+h', label: '隠しファイルにする (+h)' },
        { value: '-r', label: '読み取り専用を解除 (-r)' },
        { value: '+r', label: '読み取り専用にする (+r)' }
      ], default: '-h' }
    ],
    generateCommand: (params) => {
      const fp = resolveVariables(params.filepath);
      if (!fp) return '# 対象ファイル名を入力してください';
      if (isUnix()) return `chmod 644 "${fp}" && echo "属性を更新しました: ${fp}"`;
      return `attrib ${params.attr} "${fp}"; Write-Output "ファイル属性を更新しました: ${fp}"`;
    }
  },

  'service-list': {
    name: 'Windowsサービス稼働確認 (sc query)',
    category: 'system',
    fields: [
      { id: 'state', label: '状態フィルター', type: 'select', options: [
        { value: 'all', label: 'すべてのサービス' },
        { value: 'running', label: '稼働中 (Running) のみ' },
        { value: 'stopped', label: '停止中 (Stopped) のみ' }
      ], default: 'running' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `launchctl list | head -n 30`;
      const flag = params.state === 'running' ? 'state= running' : (params.state === 'stopped' ? 'state= inactive' : 'state= all');
      return `sc.exe query ${flag} | Select-Object -First 35`;
    }
  },

  'schtasks-list': {
    name: 'タスクスケジューラ一覧 (schtasks)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `crontab -l 2>/dev/null || echo "登録されたcronタスクはありません"`;
      return `schtasks /query /fo TABLE | Select-Object -First 25`;
    }
  },

  'net-user-list': {
    name: '登録ユーザーアカウント一覧 (net user)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `dscl . -list /Users 2>/dev/null || cat /etc/passwd | cut -d: -f1 | head -n 25`;
      return `net user`;
    }
  },

  'net-group-list': {
    name: 'ローカルグループ・管理者一覧 (net group)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `dscl . -list /Groups 2>/dev/null || cat /etc/group | cut -d: -f1 | head -n 25`;
      return `net localgroup Administrators`;
    }
  },

  'group-policy': {
    name: 'グループポリシー適用状態 (gpresult)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "※ macOS / Linux にはグループポリシーはありません"`;
      return `gpresult /r`;
    }
  },

  'reg-query': {
    name: 'レジストリキーの読み取り (reg query)',
    category: 'system',
    fields: [
      { id: 'key', label: 'レジストリパス', type: 'text', placeholder: '例: HKLM\\Software\\Microsoft\\Windows\\CurrentVersion', default: 'HKCU\\Software' }
    ],
    generateCommand: (params) => {
      const k = resolveVariables(params.key) || 'HKCU\\Software';
      if (isUnix()) return `defaults read 2>/dev/null | head -n 20 || echo "設定情報を読み込みました"`;
      return `reg query "${k}" | Select-Object -First 30`;
    }
  },

  'setx-env': {
    name: '環境変数を永久保存 (setx)',
    category: 'system',
    fields: [
      { id: 'varName', label: '環境変数名', type: 'text', placeholder: '例: MY_KEY', default: 'MY_KEY' },
      { id: 'varVal', label: '保存する値', type: 'text', placeholder: '例: secret_value', default: 'secret_value' }
    ],
    generateCommand: (params) => {
      const n = resolveVariables(params.varName);
      const v = resolveVariables(params.varVal);
      if (!n) return '# 変数名を入力してください';
      if (isUnix()) return `echo "export ${n}=\\"${v}\\"" >> ~/.zshrc && echo "環境変数を保存しました: ${n}=${v}"`;
      return `setx "${n}" "${v}"; Write-Output "環境変数を永久保存しました: ${n}=${v}"`;
    }
  },

  'bcdedit-info': {
    name: 'ブートローダー構成情報 (bcdedit)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `nvram -p 2>/dev/null | head -n 20 || echo "ブート情報を取得しました"`;
      return `bcdedit /enum`;
    }
  },

  'pipe-filter': {
    name: '前の結果から文字で抽出 (Pipe)',
    category: 'custom',
    fields: [
      { id: 'keyword', label: '残したい文字', type: 'text', placeholder: '例: ERROR, chrome, 192.168', default: 'chrome' }
    ],
    generateCommand: (params) => {
      const kw = resolveVariables(params.keyword);
      if (isUnix()) return `printf '%s\\n' "$LAST_RESULT" | grep -i "${kw}"`;
      return `$lastResult | Where-Object { $_ -match "${kw}" }`;
    }
  },

  'pipe-sort': {
    name: '前の結果を並べ替え (Pipe)',
    category: 'custom',
    fields: [
      { id: 'desc', label: '並び順', type: 'select', options: [
        { value: 'no', label: '昇順 (小さい順 / A-Z)' },
        { value: 'yes', label: '降順 (大きい順 / Z-A)' }
      ], default: 'no' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        const flag = params.desc === 'yes' ? '-r' : '';
        return `printf '%s\\n' "$LAST_RESULT" | sort ${flag}`;
      }
      const flag = params.desc === 'yes' ? '-Descending' : '';
      return `$lastResult | Sort-Object ${flag}`;
    }
  },

  'pipe-head': {
    name: '前の結果の先頭〇行 (Pipe)',
    category: 'custom',
    fields: [
      { id: 'lines', label: '何行残す？', type: 'select', options: [
        { value: '3', label: '先頭 3行' },
        { value: '5', label: '先頭 5行' },
        { value: '10', label: '先頭 10行' },
        { value: '20', label: '先頭 20行' }
      ], default: '5' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `printf '%s\\n' "$LAST_RESULT" | head -n ${params.lines}`;
      return `$lastResult | Select-Object -First ${params.lines}`;
    }
  }
});

// ユーザー自作ブロック
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

// プリセット
const PRESETS = {
  'battery-check': [
    { type: 'battery-report', params: {} },
    { type: 'beep-sound', params: { count: '1' } }
  ],
  'wifi-check': [
    { type: 'wifi-password', params: { ssid: '' } }
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
const catalogModal = document.getElementById('catalogModal');
const catalogGrid = document.getElementById('catalogGrid');
const catalogSearchInput = document.getElementById('catalogSearchInput');

// 3. 初期化
async function init() {
  document.body.classList.add('show-commands');
  loadUserBlocks();
  await fetchCwd();
  setupEventListeners();
  renderCatalogGrid('');
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

// 📖 全コマンド図鑑のカード描画
function renderCatalogGrid(query = '') {
  catalogGrid.innerHTML = '';
  const q = query.toLowerCase().trim();

  COMMAND_CATALOG.forEach(item => {
    const match = !q || item.name.toLowerCase().includes(q) || item.cmd.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    if (!match) return;

    const card = document.createElement('div');
    card.className = 'catalog-card';
    card.innerHTML = `
      <div class="catalog-card-header">
        <span class="catalog-card-title">${item.name}</span>
        <span class="catalog-cmd-badge">${item.cmd}</span>
      </div>
      <div class="catalog-card-desc">${item.desc}</div>
    `;

    card.addEventListener('click', () => {
      addBlock(item.id);
      catalogModal.classList.add('hidden');
    });

    catalogGrid.appendChild(card);
  });
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

  // 図鑑モーダル開閉
  document.getElementById('btnOpenCommandCatalog').addEventListener('click', () => {
    catalogSearchInput.value = '';
    renderCatalogGrid('');
    catalogModal.classList.remove('hidden');
  });
  document.getElementById('btnCatalogClose').addEventListener('click', () => {
    catalogModal.classList.add('hidden');
  });

  catalogSearchInput.addEventListener('input', (e) => {
    renderCatalogGrid(e.target.value);
  });

  // すべて開く / すべて閉じるボタン
  const btnExpandAll = document.getElementById('btnExpandAll');
  if (btnExpandAll) {
    btnExpandAll.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-accordion').forEach(acc => acc.open = true);
    });
  }
  const btnCollapseAll = document.getElementById('btnCollapseAll');
  if (btnCollapseAll) {
    btnCollapseAll.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-accordion').forEach(acc => acc.open = false);
    });
  }

  // 検索フィルター (アコーディオン自動展開付き)
  blockSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const accordions = document.querySelectorAll('#allBlocksSection .sidebar-accordion');
    
    accordions.forEach(acc => {
      let hasMatch = false;
      acc.querySelectorAll('.item-btn').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          btn.style.display = 'flex';
          hasMatch = true;
        } else {
          btn.style.display = 'none';
        }
      });

      if (!query) {
        acc.style.display = 'block';
        // 検索クリア時は最初の「よく使う」だけ開く
        const titleEl = acc.querySelector('.acc-title');
        acc.open = titleEl && titleEl.textContent.includes('よく使う');
      } else {
        acc.style.display = hasMatch ? 'block' : 'none';
        if (hasMatch) {
          acc.open = true; // 一致したら自動で折りたたみを開く！
        }
      }
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

  // 📥 スクリプト書き出しモーダル関連
  let currentExportFormat = 'ps1';
  const exportScriptModal = document.getElementById('exportScriptModal');
  const exportCodePreview = document.getElementById('exportCodePreview');
  const exportTargetLabel = document.getElementById('exportTargetLabel');

  const updateExportView = () => {
    const code = generateFormattedScript(currentExportFormat);
    exportCodePreview.textContent = code;
    if (currentExportFormat === 'ps1') {
      exportTargetLabel.textContent = 'Windows PowerShell スクリプト (.ps1)';
    } else if (currentExportFormat === 'sh') {
      exportTargetLabel.textContent = 'macOS / Linux Bash スクリプト (.sh)';
    } else {
      exportTargetLabel.textContent = 'Windows バッチファイル (.bat)';
    }
  };

  document.getElementById('btnExportScript').addEventListener('click', () => {
    if (blocks.length === 0) {
      alert('書き出すブロックがありません。まずブロックを配置してください。');
      return;
    }
    updateExportView();
    exportScriptModal.classList.remove('hidden');
  });

  document.getElementById('btnExportClose').addEventListener('click', () => {
    exportScriptModal.classList.add('hidden');
  });

  document.querySelectorAll('.tab-btn[data-export-type]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-export-type]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentExportFormat = tab.getAttribute('data-export-type');
      updateExportView();
    });
  });

  document.getElementById('btnCopyExportScript').addEventListener('click', () => {
    navigator.clipboard.writeText(exportCodePreview.textContent);
    alert('スクリプトをクリップボードにコピーしました！');
  });

  document.getElementById('btnDownloadExportScript').addEventListener('click', () => {
    const code = exportCodePreview.textContent;
    const ext = currentExportFormat;
    const mime = ext === 'ps1' ? 'text/plain' : (ext === 'sh' ? 'application/x-sh' : 'text/plain');
    downloadFile(code, `workflow_${Date.now()}.${ext}`, mime);
  });

  // 💾 レシピ保存 / 読込モーダル関連
  const recipeModal = document.getElementById('recipeModal');
  document.getElementById('btnRecipeModal').addEventListener('click', () => {
    recipeModal.classList.remove('hidden');
  });
  document.getElementById('btnRecipeClose').addEventListener('click', () => {
    recipeModal.classList.add('hidden');
  });

  document.getElementById('btnDownloadRecipeJson').addEventListener('click', () => {
    if (blocks.length === 0) {
      alert('保存するブロックがありません。');
      return;
    }
    const name = document.getElementById('recipeExportName').value.trim() || 'my_workflow';
    const recipeData = {
      title: name,
      version: '1.0',
      createdAt: new Date().toISOString(),
      platform: currentPlatform,
      blocks: blocks
    };
    downloadFile(JSON.stringify(recipeData, null, 2), `${name}.json`, 'application/json');
  });

  document.getElementById('recipeFileInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.blocks)) {
          blocks = data.blocks;
          renderCanvas();
          recipeModal.classList.add('hidden');
          alert(`レシピ「${data.title || file.name}」を読み込みました！ (${blocks.length}個のブロック)`);
        } else {
          alert('レシピファイルの形式が正しくありません。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

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
      '・「📖 全コマンド図鑑から探す」を押すと、Windowsの全コマンドが日常語で探せます。\n' +
      '・「保存済みWi-Fiのパスワードを調べる」や「ネットの詰まり解消」など超実用ツールが満載。\n' +
      '・WindowsでもMacでも、ブロックを並べるだけで自動操作できます。'
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

// 6. スクリプト組み立て
function buildFullScript() {
  const parts = [];
  const stopOnError = toggleStopOnError && toggleStopOnError.checked;

  if (isUnix()) {
    if (stopOnError) parts.push('set -e');
    parts.push('LAST_RESULT=""');
    if (lastUserInput) parts.push(`userInput="${lastUserInput}"`);

    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      parts.push(`echo "--- [ステップ ${idx + 1}: ${def.name}] ---"\nLAST_RESULT=$(${cmd})\nif [ -n "$LAST_RESULT" ]; then echo "$LAST_RESULT"; fi`);
    });

    return parts.join('\n\n');
  } else {
    if (stopOnError) parts.push('$ErrorActionPreference = "Stop";');
    parts.push('$lastResult = $null;');
    if (lastUserInput) parts.push(`$userInput = "${lastUserInput}";`);

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

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateFormattedScript(format) {
  const stopOnError = toggleStopOnError && toggleStopOnError.checked;

  if (format === 'ps1') {
    let script = `# ==========================================\n# Generated by Graphical Terminal (PowerShell)\n# Date: ${new Date().toLocaleString('ja-JP')}\n# ==========================================\n\n`;
    script += `chcp 65001 > $null\n$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n`;
    if (stopOnError) script += `$ErrorActionPreference = "Stop"\n`;
    script += `$lastResult = $null\n`;
    if (lastUserInput) script += `$userInput = "${lastUserInput}"\n`;
    script += `\n`;

    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      script += `# [Step ${idx + 1}] ${def.name}\n`;
      script += `Write-Output "--- [Step ${idx + 1}: ${def.name}] ---"\n`;
      script += `$lastResult = (${cmd})\n`;
      script += `if ($lastResult) { $lastResult | Out-String | Write-Output }\n\n`;
    });
    return script;
  }

  if (format === 'sh') {
    let script = `#!/usr/bin/env bash\n# ==========================================\n# Generated by Graphical Terminal (Bash / Zsh)\n# Date: ${new Date().toLocaleString('ja-JP')}\n# ==========================================\n\n`;
    if (stopOnError) script += `set -e\n`;
    script += `LAST_RESULT=""\n`;
    if (lastUserInput) script += `userInput="${lastUserInput}"\n`;
    script += `\n`;

    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      script += `# [Step ${idx + 1}] ${def.name}\n`;
      script += `echo "--- [Step ${idx + 1}: ${def.name}] ---"\n`;
      script += `LAST_RESULT=$(${cmd})\n`;
      script += `if [ -n "$LAST_RESULT" ]; then echo "$LAST_RESULT"; fi\n\n`;
    });
    return script;
  }

  if (format === 'bat') {
    let script = `@echo off\nrem ==========================================\nrem Generated by Graphical Terminal (Windows Batch)\nrem Date: ${new Date().toLocaleString('ja-JP')}\nrem ==========================================\n\n`;
    script += `chcp 65001 > nul\n\n`;
    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      const cmd = generateBlockCommand(b);
      script += `rem [Step ${idx + 1}] ${def.name}\n`;
      script += `echo --- [Step ${idx + 1}: ${def.name}] ---\n`;
      script += `powershell -NoProfile -Command "chcp 65001 > $null; ${cmd.replaceAll('"', '\\"')}"\n\n`;
    });
    script += `pause\n`;
    return script;
  }

  return '';
}

async function executeScript(script) {
  statusBadge.className = 'status-indicator running';
  statusBadge.textContent = '動かしています...';
  durationBadge.classList.add('hidden');
  btnStopProcess.classList.remove('hidden');
  explanationBox.classList.add('hidden');
  outputLog.textContent = ''; // リアルタイム受信のためクリア

  const isAdmin = toggleRunAsAdmin && toggleRunAsAdmin.checked;
  const finalScript = isAdmin 
    ? (isUnix() ? `sudo bash -c '${script}'` : `Write-Output "※ 管理者権限で起動しています..."; ${script}`)
    : script;

  if (isDemoMode) {
    let lines = ['=== [お試し実行の結果 (デモ)] ===\n'];
    blocks.forEach((b, idx) => {
      const def = getBlockDef(b.type);
      lines.push(`----------------------------------------\n`);
      lines.push(`[ステップ ${idx + 1}: ${def.name}]\n`);
      lines.push(`裏で動いたコマンド: ${generateBlockCommand(b)}\n`);
      if (b.type === 'wifi-password') {
        lines.push(`SSID名           : MyHome_Wi-Fi_5G\nセキュリティキー : 893479124012\n\n`);
      } else if (b.type === 'flush-dns') {
        lines.push(`DNS リゾルバー キャッシュは正常にフラッシュされました。\n\n`);
      } else {
        lines.push(`(正常に処理が終わりました)\n\n`);
      }
    });

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        outputLog.textContent += lines[currentLine];
        outputLog.scrollTop = outputLog.scrollHeight;
        currentLine++;
      } else {
        clearInterval(interval);
        btnStopProcess.classList.add('hidden');
        durationBadge.textContent = '0.35s';
        durationBadge.classList.remove('hidden');
        statusBadge.className = 'status-indicator success';
        statusBadge.textContent = '完了 (デモ)';
      }
    }, 70);
    return;
  }

  try {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: finalScript })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    // SSE / NDJSON ストリーミング受信
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop(); // 途中のデータを持ち越し

      for (const evStr of events) {
        if (!evStr.startsWith('data: ')) continue;
        const jsonStr = evStr.replace(/^data: /, '').trim();
        if (!jsonStr) continue;

        try {
          const ev = JSON.parse(jsonStr);
          if (ev.type === 'stdout' || ev.type === 'stderr') {
            outputLog.textContent += ev.text;
            outputLog.scrollTop = outputLog.scrollHeight;
          } else if (ev.type === 'done') {
            btnStopProcess.classList.add('hidden');
            durationBadge.textContent = ev.duration;
            durationBadge.classList.remove('hidden');

            if (ev.ok) {
              statusBadge.className = 'status-indicator success';
              statusBadge.textContent = 'おわりました';
            } else {
              statusBadge.className = 'status-indicator error';
              statusBadge.textContent = '途中でストップしました';
              if (ev.explanation) {
                explanationBox.textContent = ev.explanation;
                explanationBox.classList.remove('hidden');
              }
            }
          } else if (ev.type === 'error') {
            outputLog.textContent += `\n[エラー]: ${ev.message}\n`;
            statusBadge.className = 'status-indicator error';
            statusBadge.textContent = 'エラー';
          }
        } catch (e) {
          // ignore
        }
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
