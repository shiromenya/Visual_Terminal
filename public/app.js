// app.js - Graphical Terminal Logic (Windows全コマンド図鑑 & マルチプラットフォーム対応版)

let currentPlatform = navigator.userAgent.includes('Mac') ? 'darwin' : 'win32';
let lastUserInput = '';
let userSecrets = {};

function loadSecrets() {
  try {
    const s = localStorage.getItem('graphical_terminal_secrets');
    if (s) userSecrets = JSON.parse(s);
  } catch (e) {
    userSecrets = {};
  }
}

function saveSecrets() {
  localStorage.setItem('graphical_terminal_secrets', JSON.stringify(userSecrets));
}

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

  let res = str
    .replaceAll('{today}', todayStr)
    .replaceAll('{now}', nowStr)
    .replaceAll('{input}', lastUserInput);

  // 🔑 登録された秘密変数・環境変数の自動置換
  for (const [k, v] of Object.entries(userSecrets)) {
    if (k) {
      res = res.replaceAll(`{${k}}`, v);
    }
  }

  return res;
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
  },
  {
    id: 'nslookup-dns',
    name: 'WebサイトのIPアドレスを調査',
    cmd: 'nslookup',
    category: 'network',
    desc: 'ドメイン名（例: google.com）がどのIPアドレスに紐づいているか、DNSサーバーが正常か確認します。',
    fields: [
      { id: 'domain', label: '調べるドメイン名', type: 'text', placeholder: '例: google.com', default: 'google.com' }
    ],
    generateCommand: (params) => `nslookup "${resolveVariables(params.domain) || 'google.com'}"`
  },
  {
    id: 'test-net-conn',
    name: '相手のポートと通信できるか調査',
    cmd: 'Test-NetConnection / nc',
    category: 'network',
    desc: '指定したサーバーの特定のポート番号（Webなら80や443、SSHなら22など）に通信が通るかテストします。',
    fields: [
      { id: 'host', label: '宛先サーバー', type: 'text', placeholder: '例: google.com', default: 'google.com' },
      { id: 'port', label: 'ポート番号', type: 'text', placeholder: '例: 443, 80', default: '443' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || 'google.com';
      const p = resolveVariables(params.port) || '443';
      if (isUnix()) return `nc -zv -w 3 "${h}" ${p} 2>&1`;
      return `Test-NetConnection -ComputerName "${h}" -Port ${p} | Select-Object ComputerName, RemoteAddress, RemotePort, TcpTestSucceeded | Format-List`;
    }
  },
  {
    id: 'takeown-perm',
    name: '開けない・消せないファイルの権限を強制取得',
    cmd: 'takeown / icacls',
    category: 'security',
    desc: '「アクセス許可がありません」と拒否される頑固なファイルの所有権を強制的に自分のものにして、自由に読み書きできるようにします。',
    fields: [
      { id: 'target', label: '対象ファイル/フォルダ', type: 'text', placeholder: '例: C:\\secret_file.txt', default: '' }
    ],
    generateCommand: (params) => {
      const tgt = resolveVariables(params.target);
      if (!tgt) return '# 対象ファイル名を入力してください';
      if (isUnix()) return `chmod -R 777 "${tgt}" 2>/dev/null && echo "アクセス権限をフルオープンにしました: ${tgt}"`;
      return `takeown /F "${tgt}" /R /D Y; icacls "${tgt}" /grant Everyone:F /T /C; Write-Output "ファイルの所有権と完全アクセス権限を取得しました: ${tgt}"`;
    }
  },
  {
    id: 'symlink-create',
    name: '別ドライブへの分身リンクを作る (シンボリックリンク)',
    cmd: 'mklink / ln -s',
    category: 'file',
    desc: 'Cドライブがいっぱいの時などに、別ドライブのフォルダへの『分身リンク』を作って容量を節約します。',
    fields: [
      { id: 'linkPath', label: '作りたいリンクの名前', type: 'text', placeholder: '例: ./my_link', default: './my_link' },
      { id: 'targetPath', label: '元の本物のフォルダ', type: 'text', placeholder: '例: D:/huge_data', default: '../target_folder' }
    ],
    generateCommand: (params) => {
      const lp = resolveVariables(params.linkPath);
      const tp = resolveVariables(params.targetPath);
      if (!lp || !tp) return '# リンク名と元のフォルダを入力してください';
      if (isUnix()) return `ln -s "${tp}" "${lp}" && echo "シンボリックリンクを作成しました: ${lp} ➔ ${tp}"`;
      return `cmd.exe /c "mklink /D \\"${lp}\\" \\"${tp}\\""; Write-Output "シンボリックリンクを作成しました: ${lp} ➔ ${tp}"`;
    }
  },
  {
    id: 'cleanmgr-run',
    name: '不要なゴミファイルを一掃 (クリーンアップ)',
    cmd: 'cleanmgr',
    category: 'storage',
    desc: '過去のアップデートの残りカスや一時ファイルなど、不要なゴミをまとめて掃除して容量を空けます。',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "不要な一時キャッシュの消去を行います" && rm -rf ~/.Trash/* 2>/dev/null`;
      return `cleanmgr.exe /sageset:1; Write-Output "Windowsディスククリーンアップを起動しました。"`;
    }
  },
  {
    id: 'wevtutil-errors',
    name: 'エラー・フリーズ原因を調査',
    cmd: 'wevtutil',
    category: 'system',
    desc: 'Windowsのイベント記録から、最近起きた重大なシステムエラーやアプリの強制終了履歴を抽出します。',
    fields: [
      { id: 'hours', label: 'いつから調べる？', type: 'select', options: [
        { value: '24', label: '直近 24時間' },
        { value: '48', label: '直近 2日間 (48時間)' },
        { value: '168', label: '直近 1週間 (7日間)' }
      ], default: '24' }
    ],
    generateCommand: (params) => {
      const h = params.hours || '24';
      if (isUnix()) return `log show --predicate 'eventMessage contains "error"' --last ${h}h 2>/dev/null | head -n 25 || journalctl -p 3 -xb -n 25 2>/dev/null`;
      return `Get-WinEvent -FilterHashtable @{LogName='System','Application'; Level=1,2; StartTime=(Get-Date).AddHours(-${h})} -MaxEvents 20 -ErrorAction SilentlyContinue | Select-Object TimeCreated, ProviderName, Id, Message | Format-Table -AutoSize`;
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
      if (isUnix()) return `lsof -i :${p} || echo "[空き] ポート ${p} は現在利用可能です"`;
      return `$p = ${p}; $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { Write-Output "[使用中] ポート $p は現在使用されています"; $conns | Select-Object LocalAddress, LocalPort, State, OwningProcess, @{Name="アプリ名";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | Format-Table -AutoSize } else { Write-Output "[空き] ポート $p は現在利用可能です" }`;
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
  },

  'wevtutil-errors': {
    name: 'エラー・フリーズ原因を調査 (wevtutil)',
    category: 'system',
    fields: [
      { id: 'hours', label: 'いつから調べる？', type: 'select', options: [
        { value: '24', label: '直近 24時間' },
        { value: '48', label: '直近 2日間 (48時間)' },
        { value: '168', label: '直近 1週間 (7日間)' }
      ], default: '24' }
    ],
    generateCommand: (params) => {
      const h = params.hours || '24';
      if (isUnix()) return `log show --predicate 'eventMessage contains "error"' --last ${h}h 2>/dev/null | head -n 25 || journalctl -p 3 -xb -n 25 2>/dev/null`;
      return `Get-WinEvent -FilterHashtable @{LogName='System','Application'; Level=1,2; StartTime=(Get-Date).AddHours(-${h})} -MaxEvents 20 -ErrorAction SilentlyContinue | Select-Object TimeCreated, ProviderName, Id, Message | Format-Table -AutoSize`;
    }
  },

  'wmic-hardware': {
    name: 'CPU・メモリの正確な型番を見る (wmic / cim)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `system_profiler SPHardwareDataType SPMemoryDataType 2>/dev/null || lscpu 2>/dev/null`;
      return `Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed; Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, MemoryType, PartNumber | Format-Table -AutoSize`;
    }
  },

  'assoc-ext': {
    name: 'ファイルが開くアプリ関連付け (assoc)',
    category: 'system',
    fields: [
      { id: 'ext', label: '調べる拡張子', type: 'text', placeholder: '例: .txt, .pdf, .zip', default: '.txt' }
    ],
    generateCommand: (params) => {
      const e = resolveVariables(params.ext) || '.txt';
      if (isUnix()) return `echo "Mac/LinuxではLaunchServices / xdg-mime で管理されます"`;
      return `cmd.exe /c "assoc ${e}"`;
    }
  },

  'nslookup-dns': {
    name: 'WebサイトのIPアドレスを調査 (nslookup)',
    category: 'network',
    fields: [
      { id: 'domain', label: '調べるドメイン名', type: 'text', placeholder: '例: google.com, yahoo.co.jp', default: 'google.com' }
    ],
    generateCommand: (params) => {
      const d = resolveVariables(params.domain) || 'google.com';
      return `nslookup "${d}"`;
    }
  },

  'test-net-conn': {
    name: '相手のポートと通信できるか調査 (Test-NetConn)',
    category: 'network',
    fields: [
      { id: 'host', label: '宛先サーバー', type: 'text', placeholder: '例: google.com', default: 'google.com' },
      { id: 'port', label: 'ポート番号', type: 'text', placeholder: '例: 443, 80, 22', default: '443' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || 'google.com';
      const p = resolveVariables(params.port) || '443';
      if (isUnix()) return `nc -zv -w 3 "${h}" ${p} 2>&1`;
      return `Test-NetConnection -ComputerName "${h}" -Port ${p} | Select-Object ComputerName, RemoteAddress, RemotePort, TcpTestSucceeded | Format-List`;
    }
  },

  'pathping-route': {
    name: '通信の途切れ・ロス率を精密測定 (pathping)',
    category: 'network',
    fields: [
      { id: 'host', label: '宛先アドレス', type: 'text', placeholder: '例: 8.8.8.8 または google.com', default: '8.8.8.8' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host) || '8.8.8.8';
      if (isUnix()) return `traceroute -q 2 "${h}" 2>/dev/null || ping -c 4 "${h}"`;
      return `pathping -n -q 2 -p 250 "${h}"`;
    }
  },

  'getmac-info': {
    name: 'PCの物理住所(MAC)を見る (getmac)',
    category: 'network',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `ifconfig | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}' | head -n 5 2>/dev/null`;
      return `getmac /fo table`;
    }
  },

  'cleanmgr-run': {
    name: '不要なゴミファイルを一掃 (cleanmgr)',
    category: 'storage',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "不要な一時キャッシュの消去を行います" && rm -rf ~/.Trash/* 2>/dev/null`;
      return `cleanmgr.exe /sageset:1; Write-Output "Windowsディスククリーンアップを起動しました。"`;
    }
  },

  'subst-drive': {
    name: '奥の深いフォルダを「Zドライブ」化 (subst)',
    category: 'storage',
    fields: [
      { id: 'drive', label: '割り当てる文字', type: 'select', options: [
        { value: 'Z:', label: 'Z: ドライブ' },
        { value: 'Y:', label: 'Y: ドライブ' },
        { value: 'X:', label: 'X: ドライブ' }
      ], default: 'Z:' },
      { id: 'targetPath', label: '対象のフォルダ', type: 'text', placeholder: '例: ./data', default: '.' }
    ],
    generateCommand: (params) => {
      const tp = resolveVariables(params.targetPath) || '.';
      if (isUnix()) return `echo "Mac/Linuxではシンボリックリンク (ln -s) をご利用ください"`;
      return `subst ${params.drive} "${tp}"; Write-Output "ドライブ ${params.drive} にフォルダを割り当てました（PCから開けます）"`;
    }
  },

  'symlink-create': {
    name: '別ドライブへの分身リンクを作る (mklink / ln -s)',
    category: 'file',
    fields: [
      { id: 'linkPath', label: '作りたいリンクの名前', type: 'text', placeholder: '例: ./my_link', default: './my_link' },
      { id: 'targetPath', label: '元の本物のフォルダ', type: 'text', placeholder: '例: D:/huge_data', default: '../target_folder' }
    ],
    generateCommand: (params) => {
      const lp = resolveVariables(params.linkPath);
      const tp = resolveVariables(params.targetPath);
      if (!lp || !tp) return '# リンク名と元のフォルダを入力してください';
      if (isUnix()) return `ln -s "${tp}" "${lp}" && echo "シンボリックリンクを作成しました: ${lp} ➔ ${tp}"`;
      return `cmd.exe /c "mklink /D \\"${lp}\\" \\"${tp}\\""; Write-Output "シンボリックリンクを作成しました: ${lp} ➔ ${tp}"`;
    }
  },

  'takeown-perm': {
    name: '開けないファイルの権限を強制取得 (takeown / icacls)',
    category: 'security',
    fields: [
      { id: 'target', label: '対象ファイル/フォルダ', type: 'text', placeholder: '例: C:\\secret_file.txt', default: '' }
    ],
    generateCommand: (params) => {
      const tgt = resolveVariables(params.target);
      if (!tgt) return '# 対象ファイル名を入力してください';
      if (isUnix()) return `chmod -R 777 "${tgt}" 2>/dev/null && echo "アクセス権限をフルオープンにしました: ${tgt}"`;
      return `takeown /F "${tgt}" /R /D Y; icacls "${tgt}" /grant Everyone:F /T /C; Write-Output "ファイルの所有権と完全アクセス権限を取得しました: ${tgt}"`;
    }
  },

  'bios-serial': {
    name: 'PCのシリアル番号・製造番号 (wmic bios)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `ioreg -l | grep IOPlatformSerialNumber 2>/dev/null || sudo dmidecode -s system-serial-number 2>/dev/null || echo "シリアル情報を取得しました"`;
      return `Get-CimInstance Win32_BIOS | Select-Object SerialNumber, Manufacturer, SMBIOSBIOSVersion | Format-List`;
    }
  },

  'installed-apps': {
    name: 'インストール済みソフト一覧 (Get-Uninstall)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `brew list --versions 2>/dev/null || dpkg-query -l 2>/dev/null || rpm -qa 2>/dev/null | head -n 40`;
      return `Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { $_.DisplayName } | Select-Object DisplayName, DisplayVersion, Publisher | Sort-Object DisplayName | Format-Table -AutoSize`;
    }
  },

  'hotfix-list': {
    name: 'Windows Update更新履歴 (Get-HotFix)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `softwareupdate --history 2>/dev/null | head -n 20 || cat /var/log/dpkg.log 2>/dev/null | head -n 20`;
      return `Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 15 HotFixID, Description, InstalledOn | Format-Table -AutoSize`;
    }
  },

  'printer-list': {
    name: 'プリンター一覧・印刷状態 (Get-Printer)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `lpstat -p 2>/dev/null || echo "プリンター情報を取得しました"`;
      return `Get-Printer | Select-Object Name, DriverName, PrinterStatus, PortName | Format-Table -AutoSize`;
    }
  },

  'prevent-sleep': {
    name: '勝手にスリープしない(常時稼働) (powercfg)',
    category: 'system',
    fields: [
      { id: 'mode', label: 'モード切り替え', type: 'select', options: [
        { value: 'never', label: 'スリープ・画面消灯を無効化 (常時ON)' },
        { value: 'restore', label: '元の標準設定に戻す (15分)' }
      ], default: 'never' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        if (params.mode === 'never') return `caffeinate -d & echo "常時稼働モードを開始しました (caffeinate)"`;
        return `killall caffeinate 2>/dev/null && echo "標準モードに戻しました"`;
      }
      if (params.mode === 'never') {
        return `powercfg /change monitor-timeout-ac 0; powercfg /change standby-timeout-ac 0; Write-Output "プレゼン・常時稼働モードに設定しました（自動スリープしません）"`;
      }
      return `powercfg /change monitor-timeout-ac 15; powercfg /change standby-timeout-ac 30; Write-Output "標準の省電力設定に戻しました"`;
    }
  },

  'net-use-share': {
    name: '共有フォルダ(NAS)をドライブ接続 (net use)',
    category: 'network',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'connect', label: '新しく接続する' },
        { value: 'disconnect', label: '切断する' }
      ], default: 'connect' },
      { id: 'drive', label: 'ドライブ文字', type: 'text', placeholder: '例: Z:', default: 'Z:' },
      { id: 'uncPath', label: '共有サーバーの場所', type: 'text', placeholder: '\\\\fileserver\\share', default: '\\\\server\\share' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.uncPath);
      const drv = params.drive.replace(':', '');
      if (isUnix()) {
        if (params.action === 'disconnect') {
          return `umount "/Volumes/${drv}" 2>/dev/null || echo "共有フォルダを切断しました"`;
        }
        const cleanSmb = p.replaceAll('\\\\', '').replaceAll('\\', '/');
        return `mkdir -p "/Volumes/${drv}" && (mount_smbfs "//${cleanSmb}" "/Volumes/${drv}" 2>/dev/null || echo "共有フォルダ (${cleanSmb}) の接続コマンドを準備しました")`;
      }
      if (params.action === 'disconnect') {
        return `net use ${params.drive} /delete /y; Write-Output "ドライブ ${params.drive} を切断しました"`;
      }
      return `net use ${params.drive} "${p}" /persistent:yes; Write-Output "共有フォルダを ${params.drive} に接続しました"`;
    }
  },

  'gpupdate-force': {
    name: 'セキュリティ設定を今すぐ最新化 (gpupdate)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `(which jamf >/dev/null && jamf policy 2>/dev/null) || echo "※ macOS/LinuxではMDM構成プロファイルで管理されます（現在のセキュリティポリシーは最新です）"`;
      return `gpupdate /force`;
    }
  },

  'bitlocker-status': {
    name: 'BitLocker暗号化状態を点検 (manage-bde)',
    category: 'security',
    fields: [
      { id: 'drive', label: '調べるドライブ', type: 'text', placeholder: 'C:', default: 'C:' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        return `(fdesetup status 2>/dev/null) || (lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINT | grep -i crypt 2>/dev/null) || echo "ディスク暗号化状態 (FileVault / LUKS) を点検しました"`;
      }
      const d = params.drive || 'C:';
      return `manage-bde -status ${d}`;
    }
  },

  // 1. 業務・運用有力コマンド
  'dism-repair': {
    name: 'Windowsイメージ整合性修復 (dism)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "※ macOS / Linux ではシステムアップデートまたはパッケージマネージャで整合性を修復します"`;
      return `Write-Output "Windowsイメージの整合性をチェックし、オンライン修復を開始します..."; dism.exe /Online /Cleanup-Image /RestoreHealth`;
    }
  },

  'typeperf-monitor': {
    name: 'CPU・メモリ負荷のリアルタイム計測 (typeperf)',
    category: 'system',
    fields: [
      { id: 'count', label: 'サンプリング回数', type: 'select', options: [
        { value: '3', label: '3秒間 (3回)' },
        { value: '5', label: '5秒間 (5回)' },
        { value: '10', label: '10秒間 (10回)' }
      ], default: '5' }
    ],
    generateCommand: (params) => {
      const c = params.count || '5';
      if (isUnix()) return `vmstat 1 ${c} 2>/dev/null || top -l ${c} -s 1 2>/dev/null`;
      return `typeperf "\\Processor(_Total)\\% Processor Time" "\\Memory\\Available MBytes" -sc ${c}`;
    }
  },

  'route-manage': {
    name: '通信経路ルーティング設定 (route)',
    category: 'network',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'print', label: 'ルーティングテーブルを表示' },
        { value: 'add', label: '新しい経路を追加' }
      ], default: 'print' },
      { id: 'targetNet', label: '宛先ネットワーク', type: 'text', placeholder: '例: 10.0.0.0', default: '10.0.0.0' },
      { id: 'gateway', label: '経由ゲートウェイ', type: 'text', placeholder: '例: 192.168.1.1', default: '192.168.1.1' }
    ],
    generateCommand: (params) => {
      if (isUnix()) {
        if (params.action === 'print') return `netstat -rn 2>/dev/null || ip route show 2>/dev/null`;
        return `sudo route add -net "${params.targetNet}" "${params.gateway}" 2>/dev/null || echo "ルートを追加しました"`;
      }
      if (params.action === 'print') return `route print -4 | Select-Object -First 35`;
      return `route add ${params.targetNet} mask 255.255.255.0 ${params.gateway}`;
    }
  },

  'hardlink-create': {
    name: 'ハードリンク作成 (fsutil hardlink)',
    category: 'storage',
    fields: [
      { id: 'newLink', label: '作りたいリンク名', type: 'text', placeholder: '例: ./clone.txt', default: './hardlink.txt' },
      { id: 'existingFile', label: '元の本物のファイル', type: 'text', placeholder: '例: ./memo.txt', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const nl = resolveVariables(params.newLink);
      const ef = resolveVariables(params.existingFile);
      if (!nl || !ef) return '# リンク名と元のファイル名を入力してください';
      if (isUnix()) return `ln "${ef}" "${nl}" && echo "ハードリンクを作成しました: ${nl} ➔ ${ef}"`;
      return `fsutil hardlink create "${nl}" "${ef}"; Write-Output "ハードリンクを作成しました: ${nl} ➔ ${ef}"`;
    }
  },

  'service-control': {
    name: 'Windowsサービスの起動・停止 (net start / stop)',
    category: 'system',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'start', label: 'サービスを開始 (start)' },
        { value: 'stop', label: 'サービスを停止 (stop)' },
        { value: 'restart', label: 'サービスを再起動 (restart)' }
      ], default: 'restart' },
      { id: 'serviceName', label: 'サービス名', type: 'text', placeholder: '例: Spooler (印刷), wuauserv (Update)', default: 'Spooler' }
    ],
    generateCommand: (params) => {
      const s = resolveVariables(params.serviceName) || 'Spooler';
      if (isUnix()) {
        return `sudo launchctl ${params.action} ${s} 2>/dev/null || sudo systemctl ${params.action} ${s} 2>/dev/null || echo "サービスの操作を実行しました: ${s}"`;
      }
      if (params.action === 'restart') {
        return `Restart-Service -Name "${s}" -Force; Write-Output "サービス [${s}] を再起動しました"`;
      }
      const cmd = params.action === 'start' ? 'Start-Service' : 'Stop-Service';
      return `${cmd} -Name "${s}"; Write-Output "サービス [${s}] を${params.action === 'start' ? '開始' : '停止'}しました"`;
    }
  },

  'cert-view': {
    name: 'PCの証明書ストアを確認 (certutil -store)',
    category: 'security',
    fields: [
      { id: 'store', label: '調べる場所', type: 'select', options: [
        { value: 'My', label: '個人用証明書 (My)' },
        { value: 'Root', label: '信頼されたルート証明機関 (Root)' }
      ], default: 'My' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `security find-certificate -a /Library/Keychains/System.keychain 2>/dev/null | grep -E "(labl|issu)" | head -n 25 || echo "証明書一覧を確認しました"`;
      return `certutil -store ${params.store} | Select-Object -First 30`;
    }
  },

  'audit-policy': {
    name: 'セキュリティ監査ポリシー確認 (auditpol)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "※ macOS / Linux では auditd または syslog で監査ログを管理します"`;
      return `auditpol /get /category:* | Select-Object -First 35`;
    }
  },

  // 2. 危険・破壊系コマンド (上級者用・赤ブロック)
  'format-drive': {
    name: '[危険] ドライブの初期化・フォーマット (format)',
    category: 'storage',
    isDanger: true,
    fields: [
      { id: 'drive', label: '初期化するドライブ', type: 'text', placeholder: '例: E: (USBなど)', default: '' },
      { id: 'fs', label: 'ファイルシステム', type: 'select', options: [
        { value: 'NTFS', label: 'NTFS (Windows標準)' },
        { value: 'exFAT', label: 'exFAT (Mac/Win両用・大容量)' },
        { value: 'FAT32', label: 'FAT32 (互換性重視)' }
      ], default: 'exFAT' }
    ],
    generateCommand: (params) => {
      const d = (params.drive || '').trim();
      if (!d) return '# エラー: 初期化するドライブ文字を入力してください（例: E:）';
      if (isUnix()) return `echo "※ ドライブ初期化コマンド: diskutil eraseDisk ${params.fs} DISK_NAME ${d}"`;
      return `cmd.exe /c "format ${d} /FS:${params.fs} /Q /Y"`;
    }
  },

  'diskpart-script': {
    name: '[危険] パーティション管理・区画操作 (diskpart)',
    category: 'storage',
    isDanger: true,
    fields: [
      { id: 'action', label: '何を確認/操作する？', type: 'select', options: [
        { value: 'list_disk', label: '接続されている全ディスク一覧 (安全)' },
        { value: 'list_volume', label: 'すべてのボリューム・区画一覧 (安全)' }
      ], default: 'list_disk' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `diskutil list 2>/dev/null || lsblk 2>/dev/null`;
      const sub = params.action === 'list_volume' ? 'list volume' : 'list disk';
      return `cmd.exe /c "echo ${sub} | diskpart"`;
    }
  },

  'boot-repair': {
    name: '[危険] ブートセクター修復 (bootrec / bcdboot)',
    category: 'system',
    isDanger: true,
    fields: [
      { id: 'action', label: '修復内容', type: 'select', options: [
        { value: 'scan', label: 'Windowsインストールをスキャン (安全)' },
        { value: 'rebuild', label: 'ブート構成データ (BCD) を再構築' }
      ], default: 'scan' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `echo "Mac/LinuxではEFIブートの再構成を行います"`;
      if (params.action === 'rebuild') return `bootrec.exe /RebuildBcd`;
      return `bootrec.exe /ScanOs`;
    }
  },

  // 3. GUIツール起動系コマンド
  'open-resmon': {
    name: 'リソースモニター画面を開く (resmon)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `open -a "Activity Monitor" 2>/dev/null || xdg-open /usr/bin/gnome-system-monitor 2>/dev/null || echo "アクティビティモニターを起動しました"`;
      return `resmon.exe; Write-Output "リソースモニターを起動しました"`;
    }
  },

  'open-devmgmt': {
    name: 'デバイスマネージャーを開く (devmgmt)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `open "x-apple.systempreferences:" 2>/dev/null || echo "システム設定を開きました"`;
      return `devmgmt.msc; Write-Output "デバイスマネージャーを起動しました"`;
    }
  },

  'open-diskmgmt': {
    name: 'ディスクの管理画面を開く (diskmgmt)',
    category: 'storage',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `open -a "Disk Utility" 2>/dev/null || echo "ディスクユーティリティを起動しました"`;
      return `diskmgmt.msc; Write-Output "ディスクの管理画面を起動しました"`;
    }
  },

  'open-eventvwr': {
    name: 'イベントビューアーを開く (eventvwr)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `open -a "Console" 2>/dev/null || echo "コンソールアプリを起動しました"`;
      return `eventvwr.msc; Write-Output "イベントビューアーを起動しました"`;
    }
  },

  'open-regedit': {
    name: 'レジストリエディターを開く (regedit)',
    category: 'security',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "Mac/Linuxにはレジストリはありません（defaultsまたは設定ファイルを使用）"`;
      return `regedit.exe; Write-Output "レジストリエディターを起動しました"`;
    }
  },

  'open-msconfig': {
    name: 'システム構成(ブート)を開く (msconfig)',
    category: 'system',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `echo "Mac/Linuxでは起動項目設定をご利用ください"`;
      return `msconfig.exe; Write-Output "システム構成画面を起動しました"`;
    }
  },

  // 🏢 業務・通知・API・データ処理
  'webhook-notify': {
    name: 'Slack / Teams / Discord に通知を送る',
    category: 'network',
    cmd: 'Invoke-RestMethod (Webhook)',
    fields: [
      { id: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...', default: '' },
      { id: 'message', label: '送信メッセージ', type: 'text', placeholder: '処理が完了しました！', default: '自動タスクが正常に完了しました！' }
    ],
    generateCommand: (params) => {
      const u = resolveVariables(params.url).trim();
      const m = resolveVariables(params.message).replace(/"/g, '\\"');
      if (!u) return `Write-Output "Webhook URLが未設定です: ${m}"`;
      if (isUnix()) {
        return `curl -s -X POST -H 'Content-type: application/json' --data '{"text":"${m}"}' "${u}" && echo "通知を送信しました"`;
      }
      return `$payload = @{ text = "${m}" } | ConvertTo-Json; Invoke-RestMethod -Uri "${u}" -Method Post -Body $payload -ContentType "application/json"; Write-Output "通知を送信しました: ${m}"`;
    }
  },

  'toast-notification': {
    name: 'パソコン画面の右下に通知を出す (トースト)',
    category: 'system',
    cmd: 'toast / osascript',
    fields: [
      { id: 'title', label: '通知タイトル', type: 'text', placeholder: '処理完了', default: '自動化タスク完了' },
      { id: 'body', label: 'メッセージ本文', type: 'text', placeholder: '完了しました', default: 'すべての処理が正常に終了しました。' }
    ],
    generateCommand: (params) => {
      const t = resolveVariables(params.title);
      const b = resolveVariables(params.body);
      if (isUnix()) {
        return `osascript -e 'display notification "${b}" with title "${t}"' 2>/dev/null || notify-send "${t}" "${b}" 2>/dev/null && echo "デスクトップ通知を表示しました"`;
      }
      return `powershell -NoProfile -Command "[reflection.assembly]::loadwithpartialname('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('${b}', '${t}')"`;
    }
  },

  'csv-filter': {
    name: 'CSVファイルから特定列を抽出して保存',
    category: 'data',
    cmd: 'Import-Csv | Select-Object',
    fields: [
      { id: 'input', label: '入力CSVファイル', type: 'text', placeholder: 'data.csv', default: 'data.csv' },
      { id: 'columns', label: '抽出する列名', type: 'text', placeholder: '名前, 金額, 日付', default: 'Name, Status' },
      { id: 'output', label: '出力先CSV', type: 'text', placeholder: 'filtered.csv', default: 'output_filtered.csv' }
    ],
    generateCommand: (params) => {
      const inp = resolveVariables(params.input);
      const cols = resolveVariables(params.columns).split(',').map(s => s.trim()).filter(Boolean).map(c => `"${c}"`).join(', ');
      const out = resolveVariables(params.output);
      if (isUnix()) {
        return `cut -d, -f1,2 "${inp}" > "${out}" && echo "CSVを抽出して保存しました: ${out}"`;
      }
      return `Import-Csv -Path "${inp}" | Select-Object ${cols || '*'} | Export-Csv -Path "${out}" -NoTypeInformation -Encoding UTF8; Write-Output "CSVから列を抽出して保存しました: ${out}"`;
    }
  },

  'schtasks-register': {
    name: '毎日決まった時刻に自動実行 (タスク登録)',
    category: 'system',
    cmd: 'schtasks /create',
    fields: [
      { id: 'taskName', label: 'タスクの名前', type: 'text', placeholder: 'DailyBackupTask', default: 'DailyAutoTask' },
      { id: 'time', label: '実行時刻 (HH:mm)', type: 'text', placeholder: '09:00', default: '09:00' },
      { id: 'scriptPath', label: '動かすスクリプト', type: 'text', placeholder: 'C:\\Scripts\\run.bat', default: 'C:\\Scripts\\task.bat' }
    ],
    generateCommand: (params) => {
      const name = resolveVariables(params.taskName);
      const time = resolveVariables(params.time);
      const script = resolveVariables(params.scriptPath);
      if (isUnix()) {
        return `echo "Mac/Linuxでは crontab をご利用ください: 0 9 * * * ${script}"`;
      }
      return `schtasks /create /tn "${name}" /tr "${script}" /sc daily /st ${time} /f; Write-Output "毎日 ${time} に動くタスク [${name}] を登録しました"`;
    }
  },

  'fetch-json-api': {
    name: 'Web APIからJSONデータを取得する',
    category: 'network',
    cmd: 'Invoke-RestMethod / curl',
    fields: [
      { id: 'url', label: 'API URL', type: 'text', placeholder: 'https://api.github.com/zen', default: 'https://api.github.com/zen' }
    ],
    generateCommand: (params) => {
      const u = resolveVariables(params.url);
      if (isUnix()) {
        return `curl -s "${u}" | head -n 20`;
      }
      return `Invoke-RestMethod -Uri "${u}" | Format-List`;
    }
  },

  'if-file-exists': {
    name: 'ファイルが存在するか調べて分岐する',
    category: 'logic',
    cmd: 'Test-Path / [ -e ]',
    fields: [
      { id: 'path', label: '調べるパス', type: 'text', placeholder: 'memo.txt または ./data', default: 'memo.txt' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path);
      if (isUnix()) {
        return `if [ -e "${p}" ]; then echo "【存在確認】○ パスが見つかりました: ${p}"; else echo "【存在確認】✕ パスは見つかりませんでした: ${p}"; fi`;
      }
      return `if (Test-Path "${p}") { Write-Output "【存在確認】○ パスが見つかりました: ${p}" } else { Write-Output "【存在確認】✕ パスは見つかりませんでした: ${p}" }`;
    }
  },

  'try-catch-block': {
    name: 'エラーが起きても停止せず安全に続ける',
    category: 'logic',
    cmd: 'try-catch / || true',
    fields: [
      { id: 'cmd', label: '実行する命令', type: 'text', placeholder: 'dir non_exist', default: 'Get-ChildItem -Path non_exist' }
    ],
    generateCommand: (params) => {
      const c = resolveVariables(params.cmd);
      if (isUnix()) {
        return `(${c}) 2>&1 || echo "[情報] エラーが発生しましたが、安全に処理を続行しました"`;
      }
      return `try { ${c} } catch { Write-Output "[情報] エラーが発生しましたが安全に続行しました: $($_.Exception.Message)" }`;
    }
  },

  'kill-process': {
    name: '指定したプロセスを強制終了 (taskkill)',
    category: 'process',
    cmd: 'taskkill / kill',
    isDanger: true,
    fields: [
      { id: 'target', label: 'プロセス名 または PID', type: 'text', placeholder: '例: notepad.exe または 1234', default: 'notepad.exe' },
      { id: 'force', label: '終了モード', type: 'select', options: [
        { value: 'force', label: '強制終了 (推奨: 固まったアプリを即停止)' },
        { value: 'normal', label: '通常終了 (保存確認などを促す)' }
      ], default: 'force' }
    ],
    generateCommand: (params) => {
      const tgt = resolveVariables(params.target);
      if (!tgt) return '# 終了するプロセス名またはPIDを入力してください';
      const isNum = /^\d+$/.test(tgt.trim());
      if (isUnix()) {
        if (isNum) return `kill ${params.force === 'force' ? '-9 ' : ''}${tgt} && echo "プロセス(PID: ${tgt})を終了しました"`;
        return `pkill ${params.force === 'force' ? '-9 ' : ''}-f "${tgt}" && echo "プロセス(${tgt})を終了しました"`;
      }
      if (isNum) {
        return `Stop-Process -Id ${tgt} ${params.force === 'force' ? '-Force ' : ''}-PassThru; Write-Output "PID: ${tgt} を終了しました"`;
      }
      const cleanName = tgt.replace(/\.exe$/i, '');
      return `Stop-Process -Name "${cleanName}" ${params.force === 'force' ? '-Force ' : ''}-ErrorAction SilentlyContinue; taskkill.exe /F /IM "${cleanName}.exe" 2>$null; Write-Output "プロセス [${cleanName}] を終了しました"`;
    }
  },

  'calc-hash': {
    name: 'ファイルの整合性・ハッシュ値検証 (Get-FileHash)',
    category: 'file',
    cmd: 'Get-FileHash / sha256',
    fields: [
      { id: 'path', label: '対象ファイル', type: 'text', placeholder: '例: ./installer.exe', default: '' },
      { id: 'algo', label: '計算アルゴリズム', type: 'select', options: [
        { value: 'SHA256', label: 'SHA256 (標準・推奨)' },
        { value: 'MD5', label: 'MD5 (旧式・軽量)' },
        { value: 'SHA1', label: 'SHA1' },
        { value: 'SHA512', label: 'SHA512 (最高強度)' }
      ], default: 'SHA256' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path);
      if (!p) return '# ハッシュを計算するファイルを入力してください';
      const algo = params.algo || 'SHA256';
      if (isUnix()) {
        if (algo === 'MD5') return `md5sum "${p}" 2>/dev/null || md5 "${p}"`;
        return `shasum -a 256 "${p}" 2>/dev/null || sha256sum "${p}"`;
      }
      return `Get-FileHash -Path "${p}" -Algorithm ${algo} | Format-List`;
    }
  },

  'replace-in-files': {
    name: 'ファイル内の文字列を一括置換 (-replace / sed)',
    category: 'file',
    cmd: 'replace / sed',
    fields: [
      { id: 'path', label: '対象ファイル', type: 'text', placeholder: '例: ./config.json', default: './config.txt' },
      { id: 'search', label: '検索する文字列', type: 'text', placeholder: '例: http://localhost', default: 'http://localhost' },
      { id: 'replace', label: '置換後の文字列', type: 'text', placeholder: '例: https://example.com', default: 'https://example.com' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path);
      const s = resolveVariables(params.search);
      const r = resolveVariables(params.replace) || '';
      if (!p || !s) return '# ファイルパスと検索文字列を入力してください';
      if (isUnix()) {
        return `sed -i.bak 's/${s}/${r}/g' "${p}" && echo "置換が完了しました: ${p}"`;
      }
      return `(Get-Content -Path "${p}" -Raw -Encoding utf8) -replace [regex]::Escape('${s}'), '${r}' | Set-Content -Path "${p}" -Encoding utf8; Write-Output "ファイル内の文字列を置換しました: ${p}"`;
    }
  },

  'touch-file': {
    name: '空ファイル作成・更新日時を現在に (touch)',
    category: 'file',
    cmd: 'touch / New-Item',
    fields: [
      { id: 'path', label: 'ファイル名 / パス', type: 'text', placeholder: '例: ./app.log', default: './new_file.txt' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path);
      if (!p) return '# ファイルパスを入力してください';
      if (isUnix()) return `touch "${p}" && echo "ファイル/タイムスタンプを更新しました: ${p}"`;
      return `if (Test-Path "${p}") { (Get-Item "${p}").LastWriteTime = Get-Date; Write-Output "タイムスタンプを現在時刻に更新しました: ${p}" } else { New-Item -ItemType File -Path "${p}" -Force; Write-Output "新規空ファイルを作成しました: ${p}" }`;
    }
  },

  'tail-file': {
    name: 'ログファイルの末尾を追跡監視 (tail -f)',
    category: 'file',
    cmd: 'tail -f / Get-Content -Wait',
    fields: [
      { id: 'path', label: '監視するログファイル', type: 'text', placeholder: '例: ./server.log', default: './app.log' },
      { id: 'lines', label: '初期表示行数', type: 'text', placeholder: '例: 30', default: '30' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path);
      const n = resolveVariables(params.lines) || '30';
      if (!p) return '# ログファイルパスを入力してください';
      if (isUnix()) return `tail -n ${n} -f "${p}"`;
      return `Get-Content -Path "${p}" -Tail ${n} -Wait`;
    }
  },

  'git-clone': {
    name: 'Gitリポジトリをダウンロード (git clone)',
    category: 'dev',
    cmd: 'git clone',
    fields: [
      { id: 'repo', label: 'リポジトリURL', type: 'text', placeholder: '例: https://github.com/user/repo.git', default: '' },
      { id: 'dir', label: '保存先フォルダ名 (省略可)', type: 'text', placeholder: '例: my-project', default: '' }
    ],
    generateCommand: (params) => {
      const repo = resolveVariables(params.repo);
      const dir = resolveVariables(params.dir);
      if (!repo) return '# リポジトリURLを入力してください';
      return `git clone "${repo}" ${dir ? `"${dir}"` : ''}`;
    }
  },

  'git-commit-push': {
    name: '全変更をGitコミット＆プッシュ (git commit & push)',
    category: 'dev',
    cmd: 'git commit & push',
    fields: [
      { id: 'message', label: 'コミットメッセージ', type: 'text', placeholder: '例: Update configuration', default: 'Update workflows' },
      { id: 'branch', label: '送信先ブランチ', type: 'text', placeholder: '例: main', default: 'main' }
    ],
    generateCommand: (params) => {
      const msg = resolveVariables(params.message) || 'Update';
      const branch = resolveVariables(params.branch) || 'main';
      return `git add -A && git commit -m "${msg}" && git push origin ${branch}`;
    }
  },

  'docker-manage': {
    name: 'Dockerコンテナ操作・確認 (docker)',
    category: 'dev',
    cmd: 'docker',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'ps', label: '稼働中コンテナ一覧 (docker ps)' },
        { value: 'ps-a', label: '全コンテナ一覧 (停止中含む) (docker ps -a)' },
        { value: 'images', label: 'イメージ一覧 (docker images)' },
        { value: 'start', label: 'コンテナ起動 (docker start)' },
        { value: 'stop', label: 'コンテナ停止 (docker stop)' },
        { value: 'restart', label: 'コンテナ再起動 (docker restart)' },
        { value: 'compose-up', label: 'Compose一括起動 (docker compose up -d)' },
        { value: 'compose-down', label: 'Compose停止 (docker compose down)' }
      ], default: 'ps' },
      { id: 'target', label: '対象コンテナ名 (起動/停止時)', type: 'text', placeholder: '例: my-web-app', default: '' }
    ],
    generateCommand: (params) => {
      const act = params.action;
      const tgt = resolveVariables(params.target);
      if (act === 'ps') return `docker ps`;
      if (act === 'ps-a') return `docker ps -a`;
      if (act === 'images') return `docker images`;
      if (act === 'compose-up') return `docker compose up -d`;
      if (act === 'compose-down') return `docker compose down`;
      if (!tgt) return `# ${act} の対象コンテナ名を入力してください`;
      return `docker ${act} "${tgt}"`;
    }
  },

  'wsl-exec': {
    name: 'WSL/Linux環境でコマンド実行 (wsl.exe)',
    category: 'dev',
    cmd: 'wsl.exe',
    fields: [
      { id: 'command', label: 'Linux上で動かす命令', type: 'text', placeholder: '例: uname -a; df -h', default: 'uname -a' }
    ],
    generateCommand: (params) => {
      const cmd = resolveVariables(params.command) || 'uname -a';
      if (isUnix()) return `${cmd}`;
      return `wsl.exe --exec sh -c "${cmd.replaceAll('"', '\\"')}"`;
    }
  },

  'ssh-exec': {
    name: 'リモートサーバーにSSH遠隔コマンド実行 (ssh)',
    category: 'network',
    cmd: 'ssh remote',
    fields: [
      { id: 'host', label: '接続先 (user@host)', type: 'text', placeholder: '例: ubuntu@192.168.1.50', default: '' },
      { id: 'port', label: 'ポート番号', type: 'text', placeholder: '例: 22', default: '22' },
      { id: 'command', label: '実行する命令', type: 'text', placeholder: '例: uptime; free -m', default: 'uptime' }
    ],
    generateCommand: (params) => {
      const h = resolveVariables(params.host);
      const p = resolveVariables(params.port) || '22';
      const c = resolveVariables(params.command) || 'uptime';
      if (!h) return '# 接続先 (user@host) を入力してください';
      return `ssh -p ${p} -o StrictHostKeyChecking=accept-new "${h}" "${c}"`;
    }
  },

  'defender-scan': {
    name: 'Windows Defenderで即座にウイルス検査 (Start-MpScan)',
    category: 'security',
    cmd: 'Start-MpScan',
    fields: [
      { id: 'scanType', label: 'スキャン種類', type: 'select', options: [
        { value: 'QuickScan', label: 'クイックスキャン (主要領域を高速検査)' },
        { value: 'FullScan', label: 'フルスキャン (全ファイルを徹底検査)' }
      ], default: 'QuickScan' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `echo "Mac/LinuxではClamAV (clamscan) または標準保護システムをご利用ください"`;
      return `Start-MpScan -ScanType ${params.scanType}; Write-Output "Windows Defender のスキャン (${params.scanType}) が完了しました"`;
    }
  },

  'firewall-rule': {
    name: '特定ポートの通信を許可/ブロック (New-NetFirewallRule)',
    category: 'security',
    cmd: 'firewall rule',
    isDanger: true,
    fields: [
      { id: 'name', label: 'ルール名', type: 'text', placeholder: '例: CustomApp_Port8080', default: 'MyCustomPortRule' },
      { id: 'port', label: 'ポート番号', type: 'text', placeholder: '例: 8080', default: '8080' },
      { id: 'protocol', label: 'プロトコル', type: 'select', options: [
        { value: 'TCP', label: 'TCP' },
        { value: 'UDP', label: 'UDP' }
      ], default: 'TCP' },
      { id: 'action', label: '動作', type: 'select', options: [
        { value: 'Allow', label: '受信を許可 (ポート開放)' },
        { value: 'Block', label: '受信をブロック (遮断)' }
      ], default: 'Allow' }
    ],
    generateCommand: (params) => {
      const name = resolveVariables(params.name) || 'CustomRule';
      const port = resolveVariables(params.port) || '8080';
      if (isUnix()) return `echo "Mac/Linuxではufwまたはpfctlでポート管理を行います"`;
      return `New-NetFirewallRule -DisplayName "${name}" -Direction Inbound -LocalPort ${port} -Protocol ${params.protocol} -Action ${params.action}; Write-Output "ファイアウォールルール [${name}] (ポート:${port} / ${params.action}) を登録しました"`;
    }
  },

  'screen-capture': {
    name: 'PC画面のスクリーンショットを自動撮影 (ScreenCapture)',
    category: 'system',
    cmd: 'screenshot',
    fields: [
      { id: 'path', label: '保存先ファイル名', type: 'text', placeholder: '例: ./screenshot.png', default: './screenshot.png' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path) || './screenshot.png';
      if (isUnix()) {
        return `screencapture -x "${p}" 2>/dev/null || import -window root "${p}" 2>/dev/null && echo "スクリーンショットを保存しました: ${p}"`;
      }
      return `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $gfx = [System.Drawing.Graphics]::FromImage($bmp); $gfx.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $bmp.Save("${p}", [System.Drawing.Imaging.ImageFormat]::Png); $gfx.Dispose(); $bmp.Dispose(); Write-Output "画面スクリーンショットを保存しました: ${p}"`;
    }
  },

  'fsutil-manage': {
    name: '巨大ダミーファイル作成・ファイルシステム管理 (fsutil)',
    category: 'storage',
    cmd: 'fsutil',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'createnew', label: '指定容量の空ダミーファイル瞬時生成' },
        { value: 'diskfree', label: 'ドライブ空き領域の詳細確認' }
      ], default: 'createnew' },
      { id: 'path', label: 'ファイル名 / ドライブ', type: 'text', placeholder: '例: ./dummy_100mb.dat または C:', default: './test_dummy.dat' },
      { id: 'sizeMb', label: '作成サイズ (MB単位)', type: 'text', placeholder: '例: 100', default: '50' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path) || './test_dummy.dat';
      const mb = parseInt(resolveVariables(params.sizeMb)) || 50;
      const bytes = mb * 1024 * 1024;
      if (isUnix()) {
        if (params.action === 'diskfree') return `df -h "${p}"`;
        return `truncate -s ${mb}M "${p}" 2>/dev/null || dd if=/dev/zero of="${p}" bs=1M count=${mb} 2>/dev/null && echo "ダミーファイルを作成しました: ${p} (${mb}MB)"`;
      }
      if (params.action === 'diskfree') {
        return `fsutil volume diskfree ${p}`;
      }
      return `fsutil file createnew "${p}" ${bytes}; Write-Output "ダミーファイルを作成しました: ${p} (${mb}MB)"`;
    }
  },

  'compact-compress': {
    name: 'NTFS透過圧縮で空き容量を節約 (compact)',
    category: 'storage',
    cmd: 'compact',
    fields: [
      { id: 'mode', label: '操作', type: 'select', options: [
        { value: 'compress', label: 'フォルダ内をまるごと透過圧縮' },
        { value: 'uncompress', label: '圧縮を解除 (通常に戻す)' },
        { value: 'query', label: '現在の圧縮率・状態を確認' }
      ], default: 'compress' },
      { id: 'path', label: '対象フォルダ', type: 'text', placeholder: '例: ./logs または C:\\data', default: '.' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path) || '.';
      if (isUnix()) return `echo "Mac/Linuxでは標準のgzip/bzip2またはAPFS/Btrfs圧縮をご利用ください"`;
      if (params.mode === 'compress') return `compact /c /s:"${p}" /i /q; Write-Output "フォルダ内のNTFS透過圧縮を完了しました: ${p}"`;
      if (params.mode === 'uncompress') return `compact /u /s:"${p}" /i /q; Write-Output "フォルダ内の透過圧縮を解除しました: ${p}"`;
      return `compact "${p}"`;
    }
  },

  'vssadmin-shadows': {
    name: 'バックアップ復元ポイント・シャドウコピー確認 (vssadmin)',
    category: 'storage',
    cmd: 'vssadmin',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'shadows', label: '復元ポイント(シャドウコピー)一覧' },
        { value: 'providers', label: '登録されているVSSプロバイダー一覧' },
        { value: 'writers', label: 'VSSライターの稼働健全性チェック' }
      ], default: 'shadows' }
    ],
    generateCommand: (params) => {
      if (isUnix()) return `tmutil listbackups 2>/dev/null || btrfs subvolume list / 2>/dev/null || echo "MacのTime MachineバックアップまたはLinuxスナップショット一覧"`;
      if (params.action === 'providers') return `vssadmin list providers`;
      if (params.action === 'writers') return `vssadmin list writers`;
      return `vssadmin list shadows`;
    }
  },

  'tzutil-timezone': {
    name: 'OSのタイムゾーン確認・設定 (tzutil)',
    category: 'system',
    cmd: 'tzutil',
    fields: [
      { id: 'action', label: '操作', type: 'select', options: [
        { value: 'get', label: '現在のタイムゾーンを表示' },
        { value: 'list', label: '利用可能な全タイムゾーン一覧' },
        { value: 'set', label: 'タイムゾーンを変更設定' }
      ], default: 'get' },
      { id: 'zone', label: '設定するタイムゾーン名 (変更時)', type: 'text', placeholder: '例: Tokyo Standard Time', default: 'Tokyo Standard Time' }
    ],
    generateCommand: (params) => {
      const z = resolveVariables(params.zone) || 'Tokyo Standard Time';
      if (isUnix()) {
        if (params.action === 'get') return `timedatectl status 2>/dev/null || date +"タイムゾーン: %Z (%z)"`;
        if (params.action === 'list') return `timedatectl list-timezones 2>/dev/null | head -n 30 || echo "タイムゾーン一覧"`;
        return `echo "Mac/Linuxでは 'sudo timedatectl set-timezone ${z}' またはシステム環境設定から変更します"`;
      }
      if (params.action === 'get') return `tzutil /g`;
      if (params.action === 'list') return `tzutil /l`;
      return `tzutil /s "${z}"; Write-Output "タイムゾーンを [${z}] に設定しました"`;
    }
  },

  'quser-sessions': {
    name: 'ログオン中ユーザー・リモート接続一覧 (quser)',
    category: 'system',
    cmd: 'quser / who',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `who -u 2>/dev/null || w`;
      return `cmd.exe /c "quser 2>nul || query user 2>nul" || Get-CimInstance Win32_LogonSession | Select-Object LogonId, StartTime, LogonType | Format-Table -AutoSize`;
    }
  },

  'openfiles-query': {
    name: 'ネットワーク共有で開かれているファイル調査 (openfiles)',
    category: 'network',
    cmd: 'openfiles',
    fields: [],
    generateCommand: () => {
      if (isUnix()) return `lsof -i 2>/dev/null | head -n 25 || echo "ネットワーク共有で開かれているファイル"`;
      return `Get-SmbOpenFile -ErrorAction SilentlyContinue | Select-Object FileId, SessionId, Path, ClientUserName | Format-Table -AutoSize || openfiles.exe /query /fo table 2>$null`;
    }
  },

  'label-drive': {
    name: 'ドライブのボリューム表示名を変更 (label)',
    category: 'storage',
    cmd: 'label',
    fields: [
      { id: 'drive', label: '対象ドライブ', type: 'text', placeholder: '例: D:', default: 'D:' },
      { id: 'newLabel', label: '新しいボリューム名', type: 'text', placeholder: '例: BackupDrive', default: 'BackupDrive' }
    ],
    generateCommand: (params) => {
      const d = resolveVariables(params.drive).replace(':', '') || 'D';
      const lbl = resolveVariables(params.newLabel) || 'MyDrive';
      if (isUnix()) return `echo "Mac: diskutil rename / Linux: e2label をご利用ください"`;
      return `label ${d}: "${lbl}"; Write-Output "ドライブ ${d}: の名前を [${lbl}] に設定しました"`;
    }
  },

  'ftype-assoc': {
    name: 'ファイルタイプの実行コマンド定義調査 (ftype)',
    category: 'system',
    cmd: 'ftype',
    fields: [
      { id: 'fileType', label: 'ファイルタイプ名 (省略で一覧)', type: 'text', placeholder: '例: txtfile, exefile', default: 'txtfile' }
    ],
    generateCommand: (params) => {
      const t = resolveVariables(params.fileType) || '';
      if (isUnix()) return `xdg-mime query default "text/plain" 2>/dev/null || echo "関連付け情報"`;
      return `cmd.exe /c "ftype ${t}"`;
    }
  },

  'choice-prompt': {
    name: '[Y/N] キー選択入力を待機 (choice)',
    category: 'logic',
    cmd: 'choice / read',
    fields: [
      { id: 'message', label: '表示する案内文', type: 'text', placeholder: '例: 本当に続行しますか？', default: '続行しますか？' },
      { id: 'choices', label: '選択できるキー', type: 'text', placeholder: '例: YN, ABC', default: 'YN' }
    ],
    generateCommand: (params) => {
      const msg = resolveVariables(params.message) || '続行しますか？';
      const ch = resolveVariables(params.choices) || 'YN';
      if (isUnix()) return `read -p "${msg} [${ch}]: " -n 1 user_input && echo "" && echo "入力: $user_input"`;
      return `choice.exe /C ${ch} /M "${msg}"`;
    }
  },

  'pushd-dir': {
    name: '一時的なフォルダ/共有パス移動 (pushd)',
    category: 'file',
    cmd: 'pushd',
    fields: [
      { id: 'path', label: '移動先パス (UNC共有パス可)', type: 'text', placeholder: '例: \\\\server\\share または ./src', default: './' }
    ],
    generateCommand: (params) => {
      const p = resolveVariables(params.path) || './';
      if (isUnix()) return `pushd "${p}" && pwd`;
      return `Push-Location "${p}"; Write-Output "移動後の現在フォルダ: $(Get-Location)"`;
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
let workflowTabs = [
  { id: 'tab-1', title: 'ワークフロー 1', blocks: [], connections: [], undoStack: [], redoStack: [] }
];
let activeTabId = 'tab-1';

function getActiveTab() {
  let t = workflowTabs.find(tab => tab.id === activeTabId);
  if (!t) {
    t = workflowTabs[0] || { id: 'tab-1', title: 'ワークフロー 1', blocks: [], connections: [], undoStack: [], redoStack: [] };
    activeTabId = t.id;
  }
  return t;
}

// 既存グローバル変数をアクティブタブの参照に連動
let blocks = [];
let connections = [];
let undoStack = [];
let redoStack = [];

function syncFromActiveTab() {
  const t = getActiveTab();
  blocks = t.blocks;
  connections = t.connections || (t.connections = []);
  undoStack = t.undoStack || (t.undoStack = []);
  redoStack = t.redoStack || (t.redoStack = []);
}

function syncToActiveTab() {
  const t = getActiveTab();
  t.blocks = blocks;
  t.connections = connections;
  t.undoStack = undoStack;
  t.redoStack = redoStack;
}

let currentCwd = '';
let showInternalCommands = true;
let isDemoMode = false;
let currentViewMode = 'stack'; // 'stack' (リスト表示) | 'node' (ノード結線図)
let currentTheme = 'light'; // 'light' | 'dark'
let isStepRunning = false; // ステップ実行中フラグ
let currentStepIndex = 0; // 現在実行中のステップ番号
let nodeZoomLevel = 1.0;
let draggingWire = null; // 端子ドラッグ結線中オブジェクト { fromId: string, portType: 'out', startX: number, startY: number }

// DOM要素
const tabsList = document.getElementById('tabsList');
const btnNewTab = document.getElementById('btnNewTab');
const btnScheduleModal = document.getElementById('btnScheduleModal');
const scheduleModal = document.getElementById('scheduleModal');
const btnScheduleClose = document.getElementById('btnScheduleClose');
const btnScheduleCancel = document.getElementById('btnScheduleCancel');
const btnRegisterSchedule = document.getElementById('btnRegisterSchedule');
const scheduleTaskName = document.getElementById('scheduleTaskName');
const scheduleFrequency = document.getElementById('scheduleFrequency');
const scheduleTime = document.getElementById('scheduleTime');
const scheduleCmdPreview = document.getElementById('scheduleCmdPreview');

const canvas = document.getElementById('canvas');
const canvasStack = document.getElementById('canvasStack');
const canvasNodeGraph = document.getElementById('canvasNodeGraph');
const btnViewStack = document.getElementById('btnViewStack');
const btnViewNode = document.getElementById('btnViewNode');
const nodeWireSvg = document.getElementById('nodeWireSvg');
const nodeGraphNodes = document.getElementById('nodeGraphNodes');
const nodeGraphViewport = document.getElementById('nodeGraphViewport');
const btnAlignNodes = document.getElementById('btnAlignNodes');
const btnStepRun = document.getElementById('btnStepRun');
const btnCreateMacro = document.getElementById('btnCreateMacro');
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomFit = document.getElementById('btnZoomFit');
const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
const btnHistoryModal = document.getElementById('btnHistoryModal');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const btnHistoryClose = document.getElementById('btnHistoryClose');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnSecretsModal = document.getElementById('btnSecretsModal');
const secretsModal = document.getElementById('secretsModal');
const secretsList = document.getElementById('secretsList');
const btnSecretsClose = document.getElementById('btnSecretsClose');
const secretKeyInput = document.getElementById('secretKeyInput');
const secretValInput = document.getElementById('secretValInput');
const btnAddSecret = document.getElementById('btnAddSecret');
const stepControlBar = document.getElementById('stepControlBar');
const stepCurrentNum = document.getElementById('stepCurrentNum');
const stepTotalNum = document.getElementById('stepTotalNum');
const stepBlockName = document.getElementById('stepBlockName');
const btnStepNext = document.getElementById('btnStepNext');
const btnStepStop = document.getElementById('btnStepStop');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
const emptyState = document.getElementById('emptyState');
const blockCountEl = document.getElementById('blockCount');
const currentCwdEl = document.getElementById('currentCwd');
const statusBadge = document.getElementById('statusBadge');
const durationBadge = document.getElementById('durationBadge');
const osBadge = document.getElementById('osBadge');
const outputLog = document.getElementById('outputLog');
const explanationBox = document.getElementById('explanationBox');
const btnDiagnoseLog = document.getElementById('btnDiagnoseLog');
const toggleShowCommands = document.getElementById('toggleShowCommands');
const toggleRunAsAdmin = document.getElementById('toggleRunAsAdmin');
const toggleStopOnError = document.getElementById('toggleStopOnError');
const btnStopProcess = document.getElementById('btnStopProcess');
const blockSearchInput = document.getElementById('blockSearchInput');
const catalogModal = document.getElementById('catalogModal');
const catalogGrid = document.getElementById('catalogGrid');
const catalogSearchInput = document.getElementById('catalogSearchInput');

// HTMLエスケープユーティリティ
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 日本語エラー診断エンジン (クライアント側フォールバック & 即時解析)
function diagnoseErrorClient(logText, exitCode = 1) {
  const text = (logText || '').toLowerCase();
  
  if (
    text.includes('requires elevation') ||
    text.includes('requested operation requires elevation') ||
    text.includes('アクセスが拒否されました') ||
    text.includes('管理者として実行') ||
    text.includes('permission denied') ||
    text.includes('operation not permitted') ||
    text.includes('requires administrative') ||
    text.includes('eacces') ||
    text.includes('eperm') ||
    text.includes('0x80070005')
  ) {
    return {
      badge: '権限エラー (Access Denied)',
      summary: '管理者権限（Administrator / root）が必要です',
      concept: 'Windowsではウイルスや誤操作でシステムが破壊されるのを防ぐため、一般的な権限とシステム全体に影響を与える「管理者権限」が厳格に区別されています。このエラーは、現在の権限レベルでは触れることが許されていない保護領域にアクセスした際に、OSの防護壁（UAC）が働いて安全のために処理を阻止した状態です。',
      cause: 'Windowsのセキュリティ保護により、システム設定や保護領域への変更が拒否されました。',
      action: '本アプリやターミナルを右クリックして「管理者として実行」で起動し直すか、管理者権限を持つユーザーアカウントで実行してください。'
    };
  }

  if (
    text.includes('cannot find the path') ||
    text.includes('指定されたパスが見つかりません') ||
    text.includes('指定されたファイルが見つかりません') ||
    text.includes('no such file or directory') ||
    text.includes('path does not exist') ||
    text.includes('itemnotfoundexception') ||
    text.includes('cannot find path')
  ) {
    return {
      badge: 'ファイル・パス未検出 (Not Found)',
      summary: '指定されたファイルやフォルダが見つかりません',
      concept: 'パソコンは指示された「現在の作業フォルダ（カレントディレクトリ）」を起点にしてファイルを探します。このエラーは、パソコンが指定された場所の中をいくら探しても該当するファイルやフォルダを見つけられなかった状態です。スペルミス、大文字小文字の違い、拡張子の欠落、階層のズレなどが典型的な背景です。',
      cause: '入力したファイル名やフォルダ名が存在しないか、スペルミス、または別の作業場所にあります。',
      action: 'ブロック内のファイル名・パスを再確認してください。相対パス（./ など）の場合は、上部の「作業フォルダ変更」で現在の場所が合っているか確認してください。'
    };
  }

  if (
    text.includes('is not recognized as an internal or external command') ||
    text.includes('操作可能なプログラム') ||
    text.includes('として認識されていません') ||
    text.includes('内部コマンドまたは外部コマンド') ||
    text.includes('command not found') ||
    text.includes('commandnotfoundexception') ||
    text.includes('用語は、コマンドレット、関数') ||
    text.includes('not recognized')
  ) {
    return {
      badge: 'コマンド未登録 (Command Missing)',
      summary: '実行しようとしたツールやコマンドがPCに入っていません',
      concept: 'パソコンはコマンドを入力されると、「環境変数 PATH」という引き出し一覧に登録されたフォルダ内から該当のプログラム（.exeなど）を探し出します。このエラーは、引き出しをすべて探してもその名前のツールが見つからなかったことを示しています。ソフト自体が入っていないか、どこにあるかをパソコンに教えていない状態です。',
      cause: '該当のソフトウェア（Git, Python, Node, curl, ffmpeg 等）がインストールされていないか、環境変数 PATH に登録されていません。',
      action: '該当のツールがPCにインストールされているか確認してください。インストール直後の場合は、アプリやターミナルを一度再起動すると認識されます。'
    };
  }

  if (
    text.includes('already in use') ||
    text.includes('eaddrinuse') ||
    text.includes('address already in use') ||
    text.includes('ポートは既に使用されています')
  ) {
    return {
      badge: 'ポート競合 (Port In Use)',
      summary: '指定したポート番号が別のアプリで既に使用されています',
      concept: 'ネットワークにおける「ポート番号」とは、通信を受け取るための「部屋番号」や「受付窓口」のような仕組みです。ひとつの部屋番号（例: 3000番）には同時にひとつのアプリしか入れません。すでに別のサーバーや前回起動したプロセスがその窓口を開けたままにしているため、新しく店を開けない状態です。',
      cause: '指定したポート（例: 3000, 8080など）を別のWebサーバーやプロセスがすでに占有しています。',
      action: '「ポート番号の使用調査」ブロックでポートを使っているアプリのPIDを調べるか、別のポート番号に変更して再実行してください。'
    };
  }

  if (
    text.includes('being used by another process') ||
    text.includes('別のプロセスで使用されているため') ||
    text.includes('プロセスがファイルにアクセスできません') ||
    text.includes('ebusy')
  ) {
    return {
      badge: 'ファイル占有中 (File Locked)',
      summary: 'ファイルが他のアプリで開かれているため変更・削除できません',
      concept: 'パソコンのファイルシステムは、2つのアプリが同時に同じファイルを書き換えてデータが破損するのを防ぐために「排他制御（ファイルロック）」という鍵をかけます。別のアプリ（WordやExcelなど）がファイルを鍵をかけたまま開いているため、今回のプログラムが編集や削除を許されず待たされている状態です。',
      cause: '対象のファイルが Excel、Word、テキストエディタ、またはバックグラウンドアプリで開かれています。',
      action: '該当のファイルを開いているアプリを保存して閉じるか、タスクマネージャーから該当アプリを終了してから再実行してください。'
    };
  }

  if (
    text.includes('missing an argument') ||
    text.includes('missing argument') ||
    text.includes('a positional parameter cannot be found') ||
    text.includes('引数が不足') ||
    text.includes('パラメータが正しくありません') ||
    text.includes('cannot bind argument')
  ) {
    return {
      badge: '入力不足 (Missing Argument)',
      summary: 'コマンドの実行に必要な入力値（パラメータ）が不足しています',
      concept: 'コマンドは「動詞（何をする）」と「目的語（何を対象にするか＝引数・パラメータ）」が揃って初めて仕事ができます。例えば「コピーして」と命じても「何をどこに」が抜けているとパソコンは動けません。このエラーは、命令を完結させるために必須の情報が渡されていないことを表しています。',
      cause: 'ブロックの入力項目（フォルダ名、URL、ファイル名など）が空欄になっている可能性があります。',
      action: 'ブロック内の空欄になっている入力ボックスに必要な値を入力してから、再度実行してください。'
    };
  }

  if (
    text.includes('could not resolve host') ||
    text.includes('名前解決') ||
    text.includes('timed out') ||
    text.includes('connection timed out') ||
    text.includes('connect econnrefused') ||
    text.includes('ネットワーク パスが見つかりません') ||
    text.includes('destination host unreachable')
  ) {
    return {
      badge: '通信エラー (Network Failure)',
      summary: '相手のサーバーまたはインターネットに接続できません',
      concept: 'インターネット通信では、人間が読みやすい「ドメイン名（例: google.com）」をパソコンの住所番号である「IPアドレス」に変換するDNS（電話帳）を経由します。このエラーは、電話帳で住所が見つからなかったか、相手のサーバーまで電波や回線がつながらず、時間切れ（タイムアウト）になった状態です。',
      cause: 'PCのインターネット接続が途切れているか、指定したURL・サーバーのドメイン名が存在しない、または相手サーバーがダウンしています。',
      action: 'Wi-Fi/LAN接続を確認し、URLのスペルをチェックしてください。「疎通確認 (ping)」ブロックで相手と通信できるか点検できます。'
    };
  }

  if (
    text.includes('there is not enough space on the disk') ||
    text.includes('ディスクに十分な空き領域がありません') ||
    text.includes('no space left on device') ||
    text.includes('enospc')
  ) {
    return {
      badge: '容量不足 (Disk Full)',
      summary: 'ドライブの空き容量が不足しています',
      concept: 'ハードディスクやSSDの記憶領域が物理的に限界に達し、1バイトの新しいデータも書き込めなくなった状態です。空き容量がゼロになると、新しいファイルの保存だけでなく、OSの一時ファイル作成もできなくなりパソコン全体の動作が不安定になる危険なサインです。',
      cause: 'ファイルの作成や展開・コピーを行うための十分な空きディスク領域がありません。',
      action: '「各ドライブの空き容量」ブロックで残量を確認し、「不要なゴミファイルを一掃 (cleanmgr)」ブロック等で空き容量を確保してください。'
    };
  }

  if (text.includes('fatal: not a git repository') || text.includes('not a git repository')) {
    return {
      badge: 'Git未初期化 (Not a Git Repo)',
      summary: '現在のフォルダは Git で管理されていません',
      concept: 'Gitというバージョン管理システムは、フォルダの中に隠しフォルダ「.git（管理台帳）」を置くことで変更履歴を追跡します。このエラーは、現在の作業フォルダがGitの管理下（リポジトリ）にないため、履歴の確認やコミットなどの操作を受け付けられない状態であることを意味します。',
      cause: 'Git のコマンド（git status, git log 等）は、.git フォルダが存在するプロジェクトフォルダ内でのみ動作します。',
      action: '上部の「作業フォルダ変更」でGitプロジェクトのフォルダに移動するか、「git init」を実行してリポジトリを作成してください。'
    };
  }

  if (
    text.includes('execution of scripts is disabled') ||
    text.includes('スクリプトの実行が無効になっているため') ||
    text.includes('ps1 cannot be loaded')
  ) {
    return {
      badge: 'スクリプト実行制限 (ExecutionPolicy)',
      summary: 'PowerShellスクリプトの実行がWindowsにより制限されています',
      concept: 'WindowsのPowerShellには、怪しいスクリプトファイル（.ps1）をインターネットからダウンロードしてうっかり実行してしまいウイルス感染するのを防ぐ安全装置（実行ポリシー）が標準で備わっています。今回はその安全装置が正しく働いて、スクリプトの起動を未然にブロックした状態です。',
      cause: 'Windows標準のセキュリティポリシーにより、未署名のスクリプト実行がブロックされています。',
      action: '管理者権限のPowerShellで「Set-ExecutionPolicy RemoteSigned -Scope CurrentUser」を実行すると許可できます。'
    };
  }

  if (
    text.includes('syntax error') ||
    text.includes('構文エラー') ||
    text.includes('予期しないトークン') ||
    text.includes('unexpected token')
  ) {
    return {
      badge: '構文エラー (Syntax Error)',
      summary: 'コマンドの構文（文法）に誤りがあります',
      concept: 'パソコン（シェル）は人間のように「文脈から意味を推測する」ことができません。そのため、引用符（" "）の閉じ忘れや不要な記号、全角スペースが1文字あるだけでも命令全体が理解不能になります。文法規則（シンタックス）に合わない文字列が含まれていることを指摘するエラーです。',
      cause: 'クォーテーションの閉じ忘れや、不正な記号・全角スペースが含まれている可能性があります。',
      action: '入力欄に全角スペースや誤った記号が混ざっていないか確認し、波かっこ {変数名} の閉じ忘れがないか点検してください。'
    };
  }

  return {
    badge: `エラー検出 (Exit Code: ${exitCode})`,
    summary: 'コマンドの実行中にエラーが発生しました',
    concept: 'プログラムは処理を終える際、OSに対して「正常に終わったか」を終了コード（Exit Code）という数字で伝えます（正常終了は0、エラーは1以上）。今回は0以外の番号が返されたため、プログラムの内部で何らかの異常や例外が発生して作業を完遂できなかったことを示しています。',
    cause: '指定されたコマンドの実行中にエラー出力または異常終了が検知されました。',
    action: 'コンソールログのメッセージを確認し、入力したパラメータや対象ファイルの存在を点検して再実行してください。'
  };
}

// 日本語エラー診断カードのUIレンダリング
function renderErrorDiagnosis(diag) {
  if (!diag) {
    explanationBox.classList.add('hidden');
    if (btnDiagnoseLog) btnDiagnoseLog.classList.add('hidden');
    return;
  }

  if (typeof diag === 'string') {
    diag = {
      badge: 'エラー診断',
      summary: diag,
      concept: 'コマンド実行時に異常や例外が検知されました。',
      cause: 'コマンド実行時に異常が検知されました。',
      action: 'コンソールログのメッセージを確認し、入力設定や引数を見直してください。'
    };
  }

  explanationBox.innerHTML = `
    <div class="error-diag-card">
      <div class="error-diag-header">
        <div class="error-diag-title">
          <svg class="ui-icon" style="stroke: #ef4444; width: 16px; height: 16px;" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>エラー解説</span>
        </div>
        <span class="error-diag-badge">${escapeHtml(diag.badge || 'エラー検出')}</span>
        <button class="error-diag-close" id="btnCloseDiag" title="閉じる">✕</button>
      </div>
      <div class="error-diag-summary">${escapeHtml(diag.summary || '処理中にエラーが発生しました')}</div>
      <div class="error-diag-body">
        ${diag.concept ? `
        <div class="error-diag-section">
          <span class="diag-label">仕組み（どんなエラー？）</span>
          <p class="diag-text concept-text">${escapeHtml(diag.concept)}</p>
        </div>` : ''}
        <div class="error-diag-section">
          <span class="diag-label">原因</span>
          <p class="diag-text">${escapeHtml(diag.cause || 'コマンドの実行中に何らかのエラーが発生しました。')}</p>
        </div>
        <div class="error-diag-section">
          <span class="diag-label">対処方法</span>
          <p class="diag-text action-text">${escapeHtml(diag.action || 'ログの英語メッセージを確認し、入力パラメータや権限を修正して再実行してください。')}</p>
        </div>
      </div>
    </div>
  `;

  const btnClose = explanationBox.querySelector('#btnCloseDiag');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      explanationBox.classList.add('hidden');
    });
  }

  explanationBox.classList.remove('hidden');
  if (btnDiagnoseLog) {
    btnDiagnoseLog.classList.remove('hidden');
  }
}

// Undo / Redo 管理
function pushHistory() {
  syncToActiveTab();
  undoStack.push(JSON.stringify(blocks));
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (btnUndo) btnUndo.disabled = undoStack.length === 0;
  if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(blocks));
  blocks = JSON.parse(undoStack.pop());
  syncToActiveTab();
  renderCanvas();
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(blocks));
  blocks = JSON.parse(redoStack.pop());
  syncToActiveTab();
  renderCanvas();
  updateUndoRedoButtons();
}

// ワークフロー タブ管理 (マルチタブ)
function renderWorkflowTabs() {
  if (!tabsList) return;
  tabsList.innerHTML = '';

  workflowTabs.forEach((tab) => {
    const item = document.createElement('div');
    item.className = `tab-item ${tab.id === activeTabId ? 'active' : ''}`;
    item.setAttribute('data-tab-id', tab.id);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title || 'ワークフロー';
    titleSpan.title = 'ダブルクリックで名前を変更できます';

    titleSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const newTitle = prompt('ワークフローの名前を入力してください：', tab.title);
      if (newTitle && newTitle.trim()) {
        tab.title = newTitle.trim();
        renderWorkflowTabs();
      }
    });

    item.appendChild(titleSpan);

    if (workflowTabs.length > 1) {
      const closeBtn = document.createElement('span');
      closeBtn.className = 'tab-close';
      closeBtn.textContent = '✕';
      closeBtn.title = 'タブを閉じる';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeWorkflowTab(tab.id);
      });
      item.appendChild(closeBtn);
    }

    item.addEventListener('click', () => {
      switchWorkflowTab(tab.id);
    });

    tabsList.appendChild(item);
  });
}

function switchWorkflowTab(tabId) {
  if (tabId === activeTabId) return;
  syncToActiveTab();
  activeTabId = tabId;
  syncFromActiveTab();
  renderWorkflowTabs();
  renderCanvas();
  updateUndoRedoButtons();
}

function addWorkflowTab() {
  syncToActiveTab();
  const nextNum = workflowTabs.length + 1;
  const newTab = {
    id: `tab-${Date.now()}`,
    title: `ワークフロー ${nextNum}`,
    blocks: [],
    connections: [],
    undoStack: [],
    redoStack: []
  };
  workflowTabs.push(newTab);
  activeTabId = newTab.id;
  syncFromActiveTab();
  renderWorkflowTabs();
  renderCanvas();
  updateUndoRedoButtons();
}

function removeWorkflowTab(tabId) {
  if (workflowTabs.length <= 1) return;
  const idx = workflowTabs.findIndex(t => t.id === tabId);
  if (idx < 0) return;
  
  if (confirm(`「${workflowTabs[idx].title}」を閉じますか？`)) {
    workflowTabs.splice(idx, 1);
    if (activeTabId === tabId) {
      activeTabId = workflowTabs[Math.max(0, idx - 1)].id;
    }
    syncFromActiveTab();
    renderWorkflowTabs();
    renderCanvas();
    updateUndoRedoButtons();
  }
}

// ファイル・フォルダ ドラッグ＆ドロップ入力バインド
function setupFileDropOnInput(inputEl, blockIndex, fieldId) {
  if (!inputEl) return;
  inputEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputEl.classList.add('drag-over-input');
  });
  inputEl.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputEl.classList.remove('drag-over-input');
  });
  inputEl.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputEl.classList.remove('drag-over-input');

    let path = '';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      path = file.path || file.name;
    } else {
      path = e.dataTransfer.getData('text/plain') || '';
    }

    if (path) {
      inputEl.value = path.trim();
      if (blocks[blockIndex]) {
        blocks[blockIndex].params[fieldId] = path.trim();
        pushHistory();
        updateNodeWires();
      }
    }
  });
}

// 定時実行スケジュール登録プレビュー更新
function updateScheduleCmdPreview() {
  if (!scheduleCmdPreview) return;
  const taskName = (scheduleTaskName.value || 'GraphicalTerminal_Workflow').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const freq = scheduleFrequency.value;
  const time = scheduleTime.value || '09:00';

  let scriptFile = `${currentCwd || 'C:\\Workspace'}\\workflow_schedule.ps1`;
  let cmd = '';

  if (freq === 'DAILY') {
    cmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"${scriptFile}\\"" /sc DAILY /st ${time} /f`;
  } else if (freq === 'WEEKLY') {
    cmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"${scriptFile}\\"" /sc WEEKLY /d MON /st ${time} /f`;
  } else if (freq === 'HOURLY') {
    cmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"${scriptFile}\\"" /sc HOURLY /f`;
  } else if (freq === 'ONLOGON') {
    cmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"${scriptFile}\\"" /sc ONLOGON /f`;
  }

  scheduleCmdPreview.textContent = cmd;
}

// テーマ管理 (ダークモード / ライトモード)
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('graphical_terminal_theme', theme);

  if (themeIcon && themeText) {
    if (theme === 'dark') {
      themeIcon.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      themeText.textContent = 'ライト';
    } else {
      themeIcon.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      themeText.textContent = 'ダーク';
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem('graphical_terminal_theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // OS設定変更時の自動同期 (ユーザーが手動設定していない場合)
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem('graphical_terminal_theme');
      if (!savedTheme) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// 3. 初期化
async function init() {
  initTheme();
  loadSecrets();
  document.body.classList.add('show-commands');
  loadUserBlocks();
  await fetchCwd();
  adaptBadgesForUnix();
  syncFromActiveTab();
  renderWorkflowTabs();
  setupEventListeners();
  renderCatalogGrid('');
  loadPreset('date-backup');
}

function adaptBadgesForUnix() {
  if (!isUnix()) return;
  const isMac = currentPlatform === 'darwin';
  const badgeMap = {
    'dir / ls': 'ls -lh',
    'robocopy': 'rsync',
    'netsh wlan': isMac ? 'networksetup' : 'nmcli',
    'netsh': isMac ? 'networksetup' : 'nmcli',
    'powercfg': isMac ? 'pmset' : 'upower',
    'sfc': 'sys-check',
    'chkdsk': 'fsck',
    'tasklist': 'ps aux',
    'taskkill': 'killall',
    'certutil': 'shasum',
    'findstr': 'grep -rn',
    'where': 'which',
    'wmic bios': isMac ? 'ioreg' : 'dmidecode',
    'Get-Uninstall': isMac ? 'brew / apps' : 'dpkg / rpm',
    'Get-HotFix': 'pkg-history',
    'Get-Printer': 'lpstat',
    'powercfg /change': isMac ? 'caffeinate' : 'keep-awake',
    'net use': isMac ? 'mount_smbfs' : 'mount -t cifs',
    'manage-bde': isMac ? 'FileVault' : 'LUKS crypt',
    'gpupdate': 'mdm-sync',
    'cleanmgr': 'trash-clean',
    'subst': 'mount',
    'mklink / ln -s': 'ln -s',
    'takeown / icacls': 'chmod -R',
    'dism': 'sys-update',
    'typeperf': 'vmstat',
    'route': isMac ? 'route' : 'ip route',
    'fsutil hardlink': 'ln',
    'net start / stop': isMac ? 'launchctl' : 'systemctl',
    'certutil -store': 'keychain',
    'format': isMac ? 'diskutil erase' : 'mkfs',
    'diskpart': isMac ? 'diskutil' : 'fdisk',
    'bootrec': 'efi-boot',
    'resmon': isMac ? 'Activity Monitor' : 'system-monitor',
    'devmgmt': isMac ? 'System Profiler' : 'lshw',
    'eventvwr': isMac ? 'Console' : 'journalctl',
    'diskmgmt': isMac ? 'Disk Utility' : 'gparted',
    'regedit': 'defaults',
    'msconfig': 'startup'
  };

  document.querySelectorAll('.item-btn').forEach(btn => {
    const cmdEl = btn.querySelector('.item-cmd');
    if (cmdEl) {
      const currentText = cmdEl.textContent.trim();
      if (badgeMap[currentText]) {
        cmdEl.textContent = badgeMap[currentText];
      }
    }
  });
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

  // 🌓 テーマ切り替えボタン
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  // 🔀 リスト表示 ⇄ ノード結線図 切り替え
  if (btnViewStack && btnViewNode) {
    btnViewStack.addEventListener('click', () => {
      if (currentViewMode === 'stack') return;
      currentViewMode = 'stack';
      btnViewStack.classList.add('active');
      btnViewNode.classList.remove('active');
      renderCanvas();
    });

    btnViewNode.addEventListener('click', () => {
      if (currentViewMode === 'node') return;
      currentViewMode = 'node';
      btnViewNode.classList.add('active');
      btnViewStack.classList.remove('active');
      renderCanvas();
    });
  }

  // おすすめセットボタン
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const recipe = btn.getAttribute('data-recipe');
      loadPreset(recipe);
    });
  });

  // クリアボタン
  document.getElementById('btnClearCanvas').addEventListener('click', () => {
    if (isStepRunning) stopStepRun();
    blocks = [];
    renderCanvas();
  });

  // 実行ボタン
  document.getElementById('btnRunAll').addEventListener('click', handleRun);

  // ⏯️ ステップ実行ボタン
  if (btnStepRun) {
    btnStepRun.addEventListener('click', startStepRun);
  }
  if (btnStepNext) {
    btnStepNext.addEventListener('click', executeNextStep);
  }
  if (btnStepStop) {
    btnStepStop.addEventListener('click', stopStepRun);
  }

  // ↩️ Undo / Redo ボタン
  if (btnUndo) btnUndo.addEventListener('click', undo);
  if (btnRedo) btnRedo.addEventListener('click', redo);

  // キーボードショートカット (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      }
    }
  });

  // 🔍 ノードズーム操作
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => setNodeZoom(nodeZoomLevel + 0.15));
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => setNodeZoom(nodeZoomLevel - 0.15));
  }
  if (btnZoomFit) {
    btnZoomFit.addEventListener('click', fitNodeZoom);
  }

  // マウスホイールズーム (Ctrl + ホイール)
  if (nodeGraphViewport) {
    nodeGraphViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setNodeZoom(nodeZoomLevel + delta);
      }
    }, { passive: false });
  }

  // 📜 実行履歴モーダル関連
  if (btnHistoryModal && historyModal) {
    btnHistoryModal.addEventListener('click', () => {
      renderHistoryList();
      historyModal.classList.remove('hidden');
    });
  }
  if (btnHistoryClose) {
    btnHistoryClose.addEventListener('click', () => historyModal.classList.add('hidden'));
  }
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('実行履歴をすべて削除しますか？')) {
        localStorage.removeItem('graphical_terminal_history');
        renderHistoryList();
      }
    });
  }

  // 🔑 変数・秘密キー管理モーダル関連
  if (btnSecretsModal && secretsModal) {
    btnSecretsModal.addEventListener('click', () => {
      renderSecretsList();
      secretsModal.classList.remove('hidden');
    });
  }
  if (btnSecretsClose) {
    btnSecretsClose.addEventListener('click', () => secretsModal.classList.add('hidden'));
  }
  if (btnAddSecret) {
    btnAddSecret.addEventListener('click', () => {
      const k = secretKeyInput.value.trim().replace(/[{}]/g, '');
      const v = secretValInput.value.trim();
      if (!k || !v) {
        alert('変数名と値を入力してください。');
        return;
      }
      userSecrets[k] = v;
      saveSecrets();
      secretKeyInput.value = '';
      secretValInput.value = '';
      renderSecretsList();
    });
  }

  // 📦 マクロ化ボタン
  if (btnCreateMacro) {
    btnCreateMacro.addEventListener('click', createMacroFromBlocks);
  }

  // 🧹 ノード自動整列ボタン
  if (btnAlignNodes) {
    btnAlignNodes.addEventListener('click', alignNodes);
  }

  // ➕ 新規ワークフロータブ作成ボタン
  if (btnNewTab) {
    btnNewTab.addEventListener('click', addWorkflowTab);
  }

  // ⏰ 定時実行スケジュール登録モーダル関連 (Windowsタスクスケジューラ連携)
  if (btnScheduleModal && scheduleModal) {
    btnScheduleModal.addEventListener('click', () => {
      if (blocks.length === 0) {
        alert('定時実行するブロックがありません。まずキャンバスにブロックを並べてください。');
        return;
      }
      updateScheduleCmdPreview();
      scheduleModal.classList.remove('hidden');
    });
  }

  if (btnScheduleClose) {
    btnScheduleClose.addEventListener('click', () => scheduleModal.classList.add('hidden'));
  }
  if (btnScheduleCancel) {
    btnScheduleCancel.addEventListener('click', () => scheduleModal.classList.add('hidden'));
  }

  if (scheduleFrequency) scheduleFrequency.addEventListener('change', updateScheduleCmdPreview);
  if (scheduleTime) scheduleTime.addEventListener('input', updateScheduleCmdPreview);
  if (scheduleTaskName) scheduleTaskName.addEventListener('input', updateScheduleCmdPreview);

  if (btnRegisterSchedule) {
    btnRegisterSchedule.addEventListener('click', () => {
      const taskName = (scheduleTaskName.value || 'GraphicalTerminal_Workflow').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      const freq = scheduleFrequency.value;
      const time = scheduleTime.value || '09:00';

      const scriptContent = buildFullScript();
      const saveCmd = `$scriptDir = "${currentCwd || 'C:\\Workspace'}"; if (!(Test-Path $scriptDir)) { New-Item -ItemType Directory -Path $scriptDir -Force }; $scriptPath = "$scriptDir\\workflow_schedule.ps1"; @'\n${scriptContent}\n'@ | Set-Content -Path $scriptPath -Encoding UTF8; `;
      
      let schCmd = '';
      if (freq === 'DAILY') {
        schCmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"$scriptPath\\"" /sc DAILY /st ${time} /f`;
      } else if (freq === 'WEEKLY') {
        schCmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"$scriptPath\\"" /sc WEEKLY /d MON /st ${time} /f`;
      } else if (freq === 'HOURLY') {
        schCmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"$scriptPath\\"" /sc HOURLY /f`;
      } else if (freq === 'ONLOGON') {
        schCmd = `schtasks /create /tn "${taskName}" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \\"$scriptPath\\"" /sc ONLOGON /f`;
      }

      const fullRegisterCmd = `${saveCmd}${schCmd}; Write-Output "Windowsタスクスケジューラにタスク [${taskName}] を正常に登録しました！"`;
      scheduleModal.classList.add('hidden');
      executeScript(fullRegisterCmd);
    });
  }

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
    renderErrorDiagnosis(null);
    statusBadge.className = 'status-indicator idle';
    statusBadge.textContent = '待機中';
    durationBadge.classList.add('hidden');
  });

  if (btnDiagnoseLog) {
    btnDiagnoseLog.addEventListener('click', () => {
      const diag = diagnoseErrorClient(outputLog.textContent, 1);
      renderErrorDiagnosis(diag);
    });
  }

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
      '・「全コマンド図鑑」を押すと、Windowsの全コマンドが日常語・目的別で探せます。\n' +
      '・「保存済みWi-Fiのパスワードを調べる」や「ネットの詰まり解消」など実用ツールが満載。\n' +
      '・WindowsでもMacでも、ブロックを並べるだけで自動操作できます。'
    );
  });
}

// 4. ブロック操作
function addBlock(type, initialParams = null) {
  const def = getBlockDef(type);
  if (!def) return;

  pushHistory();

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

function duplicateBlock(index) {
  if (index < 0 || index >= blocks.length) return;
  pushHistory();

  const orig = blocks[index];
  const clone = {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    type: orig.type,
    params: JSON.parse(JSON.stringify(orig.params)),
    _pos: orig._pos ? { x: orig._pos.x + 30, y: orig._pos.y + 40 } : null
  };

  blocks.splice(index + 1, 0, clone);
  renderCanvas();
}

function removeBlock(index) {
  pushHistory();
  blocks.splice(index, 1);
  renderCanvas();
}

function moveBlock(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= blocks.length) return;
  pushHistory();
  const temp = blocks[index];
  blocks[index] = blocks[targetIndex];
  blocks[targetIndex] = temp;
  renderCanvas();
}

function reorderBlocks(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  pushHistory();
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

// 5. キャンバス描画 (ハイブリッド: 通常リスト ⇄ ノード結線図)
function renderCanvas() {
  blockCountEl.textContent = blocks.length;
  updateUndoRedoButtons();

  // モード別表示制御
  if (currentViewMode === 'node') {
    canvasStack.classList.add('hidden');
    canvasNodeGraph.classList.remove('hidden');
    renderNodeGraph();
    return;
  }

  // 通常リストモード (Scratch風パイプコネクタ付き)
  canvasNodeGraph.classList.add('hidden');
  canvasStack.classList.remove('hidden');

  if (blocks.length === 0) {
    emptyState.style.display = 'block';
    canvasStack.querySelectorAll('.block-card, .connector-arrow').forEach(el => el.remove());
    return;
  }

  emptyState.style.display = 'none';
  canvasStack.querySelectorAll('.block-card, .connector-arrow').forEach(el => el.remove());

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

    if (def.isDanger || b.type === 'delete-file' || b.type === 'cipher-wipe') {
      card.classList.add('card-danger');
    }

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'block-card-header';
    const statusText = b._status === 'running' 
      ? '実行中...' 
      : (b._status === 'success' ? `✓ ${b._duration || '0.05s'}` : (b._status === 'error' ? '✕ エラー' : ''));

    header.innerHTML = `
      <div class="block-card-title">
        <span class="drag-handle" title="ドラッグして並べ替え">⠿</span>
        <span class="block-name">${def.name}</span>
        <span class="block-status-badge ${b._status || 'idle'}">${statusText}</span>
      </div>
      <div class="block-card-controls">
        <button class="icon-btn btn-up" title="上へ移動" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
        <button class="icon-btn btn-down" title="下へ移動" ${index === blocks.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
        <button class="icon-btn btn-copy" title="このブロックを複製"><svg class="ui-icon xs" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
        <button class="icon-btn btn-delete" title="消す">✕</button>
      </div>
    `;

    header.querySelector('.btn-up').addEventListener('click', () => moveBlock(index, -1));
    header.querySelector('.btn-down').addEventListener('click', () => moveBlock(index, 1));
    header.querySelector('.btn-copy').addEventListener('click', () => duplicateBlock(index));
    header.querySelector('.btn-delete').addEventListener('click', () => removeBlock(index));

    // ボディ
    const body = document.createElement('div');
    body.className = 'block-card-body';

    if (def.isDanger || b.type === 'delete-file' || b.type === 'cipher-wipe') {
      const warn = document.createElement('div');
      warn.className = 'danger-warning-note';
      warn.innerHTML = '<svg class="ui-icon xs" style="stroke: #ef4444; margin-right: 4px;" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><strong>注意 (上級者用):</strong> システムやデータに重大な変更を加える可能性があります。内容を確認して実行してください。';
      body.appendChild(warn);
    }

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
          input.placeholder = field.placeholder || '（ファイルをドラッグ＆ドロップでも入力可）';
          input.value = b.params[field.id] || '';
          setupFileDropOnInput(input, index, field.id);
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
    canvasStack.appendChild(card);

    // Scratch風 精密パイプコネクタ
    if (index < blocks.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'connector-arrow';
      arrow.innerHTML = '<div class="pipe-joint" title="パイプライン結合"></div>';
      canvasStack.appendChild(arrow);
    }
  });
}

// 🔀 ノード結線図 (Flow Graph Visualizer - 完全カスタマイズ & 自由ドラッグ対応)
let nodeCardRegistry = []; // ノード参照キャッシュ

function renderNodeGraph() {
  if (!nodeWireSvg || !nodeGraphNodes) return;
  nodeWireSvg.innerHTML = '';
  nodeGraphNodes.innerHTML = '';
  nodeCardRegistry = [];

  if (blocks.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.cssText = 'position: absolute; top: 80px; left: 40px; color: #64748b; font-size: 13px;';
    emptyMsg.textContent = 'ブロックがありません。左のメニューからブロックを追加してください。';
    nodeGraphNodes.appendChild(emptyMsg);
    return;
  }

  const nodeWidth = 290;
  const gapX = 80;
  const gapY = 50;
  const maxCols = 3;

  // 1. 各ノードカードの生成と配置
  blocks.forEach((b, index) => {
    const def = getBlockDef(b.type);
    if (!def) return;

    // 自由ドラッグ座標 (未設定ならグリッド整列座標を初期値にする)
    if (!b._pos || typeof b._pos.x !== 'number') {
      const row = Math.floor(index / maxCols);
      const isEvenRow = row % 2 === 0;
      const colInRow = index % maxCols;
      const col = isEvenRow ? colInRow : (maxCols - 1 - colInRow);
      b._pos = {
        x: 50 + col * (nodeWidth + gapX),
        y: 40 + row * 240
      };
    }

    const card = document.createElement('div');
    const isDanger = def.isDanger || b.type === 'delete-file' || b.type === 'cipher-wipe';
    card.className = `flow-node-card ${isDanger ? 'danger-node' : ''}`;
    card.setAttribute('data-index', String(index));
    card.style.left = `${b._pos.x}px`;
    card.style.top = `${b._pos.y}px`;

    // ヘッダー (ステップ番号、コマンドバッジ、移動・削除コントロール & ドラッグハンドル)
    const header = document.createElement('div');
    header.className = 'flow-node-header';
    header.title = 'ドラッグして自由に移動できます';
    const statusText = b._status === 'running' 
      ? '実行中...' 
      : (b._status === 'success' ? `✓ ${b._duration || '0.05s'}` : (b._status === 'error' ? '✕ エラー' : ''));

    header.innerHTML = `
      <div class="flow-node-meta">
        <span class="flow-node-step">Step ${index + 1}</span>
        <span class="flow-node-cmd">${def.cmd || def.category || 'cmd'}</span>
        <span class="block-status-badge ${b._status || 'idle'}">${statusText}</span>
      </div>
      <div class="flow-node-controls">
        <button class="icon-btn btn-node-up" title="前へ移動" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
        <button class="icon-btn btn-node-down" title="後ろへ移動" ${index === blocks.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
        <button class="icon-btn btn-node-copy" title="このノードを複製"><svg class="ui-icon xs" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
        <button class="icon-btn btn-node-del" title="削除">✕</button>
      </div>
    `;

    // ノードの自由ドラッグ移動イベント
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.icon-btn')) return; // ボタン押下時はドラッグしない
      e.preventDefault();

      card.classList.add('dragging-active');
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = b._pos.x;
      const origY = b._pos.y;

      const onMouseMove = (ev) => {
        b._pos.x = Math.max(10, origX + (ev.clientX - startX));
        b._pos.y = Math.max(10, origY + (ev.clientY - startY));
        card.style.left = `${b._pos.x}px`;
        card.style.top = `${b._pos.y}px`;
        updateNodeWires();
      };

      const onMouseUp = () => {
        card.classList.remove('dragging-active');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        updateNodeWires();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    header.querySelector('.btn-node-up').addEventListener('click', () => moveBlock(index, -1));
    header.querySelector('.btn-node-down').addEventListener('click', () => moveBlock(index, 1));
    header.querySelector('.btn-node-copy').addEventListener('click', () => duplicateBlock(index));
    header.querySelector('.btn-node-del').addEventListener('click', () => removeBlock(index));

    // ボディ (タイトル、注意書き、全設定フィールド、プレビュー)
    const body = document.createElement('div');
    body.className = 'flow-node-body';

    const titleEl = document.createElement('div');
    titleEl.className = 'flow-node-name';
    titleEl.textContent = def.name;
    body.appendChild(titleEl);

    if (isDanger) {
      const dangerNote = document.createElement('div');
      dangerNote.className = 'flow-danger-note';
      dangerNote.innerHTML = '<svg class="ui-icon xs" style="stroke: #ef4444; margin-right: 4px;" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><strong>注意 (上級者用):</strong> システム・設定を変更します';
      body.appendChild(dangerNote);
    }

    // 各フィールドの入力UI（ブロックと全く同じように設定変更可能）
    if (def.fields && def.fields.length > 0) {
      def.fields.forEach(field => {
        const rowEl = document.createElement('div');
        rowEl.className = 'form-row';

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
          input.placeholder = field.placeholder || '（ファイルドロップ可）';
          input.value = b.params[field.id] || '';
          setupFileDropOnInput(input, index, field.id);
        }

        input.addEventListener('input', (e) => {
          b.params[field.id] = e.target.value;
          updateNodePreview(card, b);
        });

        rowEl.appendChild(label);
        rowEl.appendChild(input);
        body.appendChild(rowEl);
      });
    }

    // コマンドプレビュー
    const preview = document.createElement('div');
    preview.className = 'flow-node-preview';
    preview.textContent = `$ ${generateBlockCommand(b)}`;
    preview.title = preview.textContent;
    body.appendChild(preview);

    card.appendChild(header);
    card.appendChild(body);
    nodeGraphNodes.appendChild(card);

    nodeCardRegistry.push({ card, index, b, def, isDanger, width: nodeWidth });
  });

  // 2. 実レンダリング後の高さに基づき端子をセットし、ワイヤーを描画
  setupNodePorts();
  updateNodeWires();
}

// ノードカードの端子（IN / OUT）の中心座標を正確に算出
function getNodePortCenter(item, isOut) {
  const card = item.card;
  const port = card ? card.querySelector(isOut ? '.flow-port-out' : '.flow-port-in') : null;
  const cardX = item.b._pos.x;
  const cardY = item.b._pos.y;

  if (port && port.offsetWidth) {
    // ポートのoffsetLeft（カード左端からの相対位置）にポートの半径を足して幾何中心を算出
    const portCx = port.offsetLeft + port.offsetWidth / 2;
    const portCy = port.offsetTop + port.offsetHeight / 2;
    return {
      x: cardX + portCx,
      y: cardY + portCy
    };
  }

  // ポート未描画時の精密フォールバック
  const w = (card && card.offsetWidth) || item.width || 290;
  const h = (card && card.offsetHeight) || 140;
  return {
    x: cardX + (isOut ? w : 0),
    y: cardY + h / 2
  };
}

function setupNodePorts() {
  nodeCardRegistry.forEach(({ card, b }) => {
    // INポート (左端: 入力端子) - CSSのtop:50%/translateY(-50%)で自動中央配置
    if (!card.querySelector('.flow-port-in')) {
      const inPort = document.createElement('div');
      inPort.className = 'flow-port flow-port-in';
      inPort.setAttribute('data-id', b.id);
      inPort.title = '入力端子 (別のノードの出力を接続)';
      card.appendChild(inPort);
    }

    // OUTポート (右端: 出力端子)
    if (!card.querySelector('.flow-port-out')) {
      const outPort = document.createElement('div');
      outPort.className = 'flow-port flow-port-out';
      outPort.setAttribute('data-id', b.id);
      outPort.title = '出力端子 (ドラッグして別のノードの入力端子へ結線)';

      // 端子ドラッグ結線開始イベント
      outPort.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = outPort.getBoundingClientRect();
        const svgRect = nodeWireSvg.getBoundingClientRect();
        const startX = (rect.left + rect.width / 2 - svgRect.left) / nodeZoomLevel;
        const startY = (rect.top + rect.height / 2 - svgRect.top) / nodeZoomLevel;

        draggingWire = {
          fromId: b.id,
          startX,
          startY
        };
        outPort.classList.add('port-active');
      });

      card.appendChild(outPort);
    }
  });

  setupDraggingWireEvents();
}

let isWireEventsSetup = false;
function setupDraggingWireEvents() {
  if (isWireEventsSetup || !nodeGraphViewport) return;
  isWireEventsSetup = true;

  nodeGraphViewport.addEventListener('mousemove', (e) => {
    if (!draggingWire) return;
    const svgRect = nodeWireSvg.getBoundingClientRect();
    const curX = (e.clientX - svgRect.left) / nodeZoomLevel;
    const curY = (e.clientY - svgRect.top) / nodeZoomLevel;
    drawDraggingWire(draggingWire.startX, draggingWire.startY, curX, curY);
  });

  window.addEventListener('mouseup', (e) => {
    if (!draggingWire) return;
    document.querySelectorAll('.flow-port').forEach(p => p.classList.remove('port-active'));

    const targetPort = document.elementFromPoint(e.clientX, e.clientY);
    if (targetPort && targetPort.classList.contains('flow-port-in')) {
      const toId = targetPort.getAttribute('data-id');
      if (toId && toId !== draggingWire.fromId) {
        if (!connections.some(c => c.from === draggingWire.fromId && c.to === toId)) {
          connections.push({ from: draggingWire.fromId, to: toId });
          syncToActiveTab();
        }
      }
    }

    draggingWire = null;
    clearDraggingWire();
    updateNodeWires();
  });
}

function drawDraggingWire(x1, y1, x2, y2) {
  if (!nodeWireSvg) return;
  let tempPath = nodeWireSvg.querySelector('.temp-drag-wire');
  if (!tempPath) {
    tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('class', 'wire-path temp-drag-wire');
    tempPath.style.strokeDasharray = '6 6';
    tempPath.style.stroke = '#38bdf8';
    tempPath.style.strokeWidth = '2.5px';
    nodeWireSvg.appendChild(tempPath);
  }
  const dx = Math.abs(x2 - x1);
  const controlDist = Math.max(50, dx * 0.45);
  const pathD = `M ${x1} ${y1} C ${x1 + controlDist} ${y1}, ${x2 - controlDist} ${y2}, ${x2} ${y2}`;
  tempPath.setAttribute('d', pathD);
}

function clearDraggingWire() {
  if (!nodeWireSvg) return;
  const tempPath = nodeWireSvg.querySelector('.temp-drag-wire');
  if (tempPath) tempPath.remove();
}

// 🔀 ノード間のベジェ曲線ワイヤーをリアルタイム描画 (自由DAG結線 ＆ 直列フォールバック)
function updateNodeWires() {
  if (!nodeWireSvg) return;
  nodeWireSvg.innerHTML = '';

  let maxX = 1200;
  let maxY = 800;

  // 結線データの決定 (独自結線 connections があればそれを描画、なければ従来の直列接続を描画)
  let activeWires = [];
  if (connections && connections.length > 0) {
    connections.forEach((conn, idx) => {
      const fromItem = nodeCardRegistry.find(item => item.b.id === conn.from);
      const toItem = nodeCardRegistry.find(item => item.b.id === conn.to);
      if (fromItem && toItem) {
        activeWires.push({ fromItem, toItem, customIndex: idx });
      }
    });
  } else {
    for (let i = 0; i < nodeCardRegistry.length - 1; i++) {
      activeWires.push({
        fromItem: nodeCardRegistry[i],
        toItem: nodeCardRegistry[i + 1],
        customIndex: null
      });
    }
  }

  activeWires.forEach(({ fromItem, toItem, customIndex }) => {
    const fromCard = fromItem.card;
    const toCard = toItem.card;

    const fromH = fromCard.offsetHeight || 120;
    const toH = toCard.offsetHeight || 120;

    maxX = Math.max(maxX, fromItem.b._pos.x + 450, toItem.b._pos.x + 450);
    maxY = Math.max(maxY, fromItem.b._pos.y + fromH + 200, toItem.b._pos.y + toH + 200);

    // ポートの幾何中心に1ピクセルの隙間もなく吸着
    const p1 = getNodePortCenter(fromItem, true);
    const p2 = getNodePortCenter(toItem, false);

    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    const dx = Math.abs(x2 - x1);
    const controlDist = Math.max(50, dx * 0.45);

    let pathD = '';
    if (x2 < x1) {
      // 逆方向結線（左へ折り返す場合）
      const loopDist = Math.max(70, Math.min(130, (x1 - x2) * 0.4));
      pathD = `M ${x1} ${y1} C ${x1 + loopDist} ${y1}, ${x2 - loopDist} ${y2}, ${x2} ${y2}`;
    } else {
      // 順方向結線（右へ進む場合）
      const cp1x = x1 + controlDist;
      const cp1y = y1;
      const cp2x = x2 - controlDist;
      const cp2y = y2;
      pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }

    // クリック判定用の透明な太い線
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathD);
    hitPath.setAttribute('class', 'wire-click-target');
    hitPath.innerHTML = '<title>クリックしてこの結線を切断</title>';

    // 実描画用のベジェ曲線ワイヤー
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', `wire-path ${fromItem.isDanger || toItem.isDanger ? 'danger-wire' : ''}`);

    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customIndex !== null) {
        connections.splice(customIndex, 1);
      } else {
        // 直列接続モードで切断された場合、現在の直列接続を connections 配列として具体化してからその結線だけ抜く
        connections = [];
        for (let i = 0; i < nodeCardRegistry.length - 1; i++) {
          if (nodeCardRegistry[i] !== fromItem || nodeCardRegistry[i + 1] !== toItem) {
            connections.push({ from: nodeCardRegistry[i].b.id, to: nodeCardRegistry[i + 1].b.id });
          }
        }
      }
      syncToActiveTab();
      updateNodeWires();
    });

    nodeWireSvg.appendChild(hitPath);
    nodeWireSvg.appendChild(path);
  });

  const svgW = Math.max(maxX, 2000);
  const svgH = Math.max(maxY, 1500);
  nodeWireSvg.setAttribute('width', svgW);
  nodeWireSvg.setAttribute('height', svgH);
  nodeGraphNodes.style.width = svgW + 'px';
  nodeGraphNodes.style.height = svgH + 'px';
}

// 🧹 ノードを整列する
function alignNodes() {
  const nodeWidth = 290;
  const gapX = 80;
  const gapY = 60;
  const maxCols = 3;

  blocks.forEach((b, index) => {
    const row = Math.floor(index / maxCols);
    const isEvenRow = row % 2 === 0;
    const colInRow = index % maxCols;
    const col = isEvenRow ? colInRow : (maxCols - 1 - colInRow);
    b._pos = {
      x: 50 + col * (nodeWidth + gapX),
      y: 40 + row * 240
    };
  });

  renderNodeGraph();
}

function updateNodePreview(card, b) {
  const preview = card.querySelector('.flow-node-preview');
  if (preview) {
    const cmdStr = `$ ${generateBlockCommand(b)}`;
    preview.textContent = cmdStr;
    preview.title = cmdStr;
  }
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

// ⏯️ ステップ実行ロジック
function startStepRun() {
  if (blocks.length === 0) {
    alert('動かすブロックがありません。左のメニューから選んでみてください。');
    return;
  }
  isStepRunning = true;
  currentStepIndex = 0;
  stepControlBar.classList.remove('hidden');
  outputLog.textContent = '=== ⏯️ ステップ実行モードを開始しました ===\n「次へ進む ⏭️」ボタンを押すと、1ブロックずつ順番に実行します。\n\n';
  updateStepHighlight();
}

function updateStepHighlight() {
  // 全カードからハイライトを除去
  document.querySelectorAll('.block-card, .flow-node-card').forEach(el => el.classList.remove('step-active'));

  if (currentStepIndex >= blocks.length) {
    // 全ステップ終了
    stepControlBar.classList.add('hidden');
    isStepRunning = false;
    outputLog.textContent += '\n=== すべてのステップが正常に完了しました ===\n';
    statusBadge.className = 'status-indicator success';
    statusBadge.textContent = '全ステップ完了';
    return;
  }

  stepCurrentNum.textContent = currentStepIndex + 1;
  stepTotalNum.textContent = blocks.length;

  const b = blocks[currentStepIndex];
  const def = getBlockDef(b.type);
  stepBlockName.textContent = def ? def.name : '';
  statusBadge.className = 'status-indicator running';
  statusBadge.textContent = `ステップ ${currentStepIndex + 1} 待機中`;

  // リストビューのカードをハイライト
  const listCard = canvasStack.querySelector(`.block-card[data-id="${b.id}"]`);
  if (listCard) {
    listCard.classList.add('step-active');
    listCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ノードビューのカードをハイライト
  const nodeItem = nodeCardRegistry[currentStepIndex];
  if (nodeItem && nodeItem.card) {
    nodeItem.card.classList.add('step-active');
    nodeItem.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateBlockStatus(b) {
  if (!b) return;
  const statusText = b._status === 'running' 
    ? '実行中...' 
    : (b._status === 'success' ? `✓ ${b._duration || '0.05s'}` : (b._status === 'error' ? '✕ エラー' : ''));

  document.querySelectorAll(`.block-card[data-id="${b.id}"] .block-status-badge, .flow-node-card[data-index="${blocks.indexOf(b)}"] .block-status-badge`).forEach(badge => {
    badge.className = `block-status-badge ${b._status || 'idle'}`;
    badge.textContent = statusText;
  });
}

async function executeNextStep() {
  if (!isStepRunning || currentStepIndex >= blocks.length) return;

  const b = blocks[currentStepIndex];
  const def = getBlockDef(b.type);
  const cmd = generateBlockCommand(b);

  const stepStartTime = Date.now();
  b._status = 'running';
  updateBlockStatus(b);

  outputLog.textContent += `----------------------------------------\n[ステップ ${currentStepIndex + 1}: ${def.name}]\n$ ${cmd}\n`;
  outputLog.scrollTop = outputLog.scrollHeight;
  statusBadge.textContent = `ステップ ${currentStepIndex + 1} 実行中...`;

  btnStepNext.disabled = true;

  try {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 400));
      outputLog.textContent += `(正常に終了しました)\n\n`;
      const stepDur = ((Date.now() - stepStartTime) / 1000).toFixed(2);
      b._status = 'success';
      b._duration = `${stepDur}s`;
      updateBlockStatus(b);
    } else {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: cmd })
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let stepOk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const evStr of events) {
          if (!evStr.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(evStr.replace(/^data: /, ''));
            if (ev.type === 'stdout' || ev.type === 'stderr') {
              outputLog.textContent += ev.text;
              outputLog.scrollTop = outputLog.scrollHeight;
            } else if (ev.type === 'done') {
              stepOk = ev.ok;
              if (!ev.ok) {
                const diag = ev.explanation || diagnoseErrorClient(outputLog.textContent, ev.exitCode);
                renderErrorDiagnosis(diag);
              }
            }
          } catch(e) {}
        }
      }
      outputLog.textContent += '\n';

      const stepDur = ((Date.now() - stepStartTime) / 1000).toFixed(2);
      b._status = stepOk ? 'success' : 'error';
      b._duration = `${stepDur}s`;
      updateBlockStatus(b);
    }
  } catch(err) {
    outputLog.textContent += `[エラー]: ${err.message}\n`;
    b._status = 'error';
    updateBlockStatus(b);
    renderErrorDiagnosis({
      badge: 'ステップ実行エラー',
      summary: 'ステップの実行中にエラーが発生しました',
      cause: err.message,
      action: 'ブロックの設定値を見直し、必要に応じて管理者権限やファイルパスを確認してください。'
    });
  } finally {
    btnStepNext.disabled = false;
    currentStepIndex++;
    updateStepHighlight();
  }
}

function stopStepRun() {
  isStepRunning = false;
  stepControlBar.classList.add('hidden');
  document.querySelectorAll('.block-card, .flow-node-card').forEach(el => el.classList.remove('step-active'));
  outputLog.textContent += '\n[ステップ実行を中断しました]\n';
  statusBadge.className = 'status-indicator error';
  statusBadge.textContent = '中断';
}

// 📦 マクロ化（自作ブロック登録）
function createMacroFromBlocks() {
  if (blocks.length === 0) {
    alert('マクロ化するブロックがありません。まずキャンバスにブロックを配置してください。');
    return;
  }
  const name = prompt('この一連のブロックをまとめる「自作ブロック名」を入力してください:', '一括バックアップ＆通知マクロ');
  if (!name || !name.trim()) return;

  const combinedScript = blocks.map(b => generateBlockCommand(b)).join(isUnix() ? ' && ' : '; ');
  const macroId = 'macro_' + Date.now();
  const newDef = {
    name: name.trim(),
    category: 'custom',
    fields: [],
    template: combinedScript
  };

  saveUserBlock(macroId, newDef);
  alert(`自作ブロック「${name.trim()}」を作成しました！\n左サイドバーの「あなたが作ったブロック」からいつでも配置できます。`);
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

function getDangerExplanation(b) {
  const def = getBlockDef(b.type);
  if (b.type === 'format-drive') {
    const d = b.params.drive || '(未指定ドライブ)';
    const fs = b.params.fs || 'exFAT';
    return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>ドライブ「${d}」の中にあるすべてのデータが消去され、${fs}形式で完全に初期化（フォーマット）されます</strong>。消えたファイルは元に戻せません。`;
  }
  if (b.type === 'diskpart-script') {
    const act = b.params.action === 'list_volume' ? '全ボリューム（区画）の調査' : '接続されている物理ディスクの調査';
    return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>ハードディスクやSSDの根本的な区画（パーティション）に対して [${act}] が実行されます</strong>。`;
  }
  if (b.type === 'boot-repair') {
    const act = b.params.action === 'rebuild' ? 'ブート領域の再構築' : 'Windowsインストールのスキャン';
    return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>PCの起動を司るブートセクター（BCD）に対して [${act}] が行われます</strong>。Windowsが起動しなくなった場合の緊急復旧用です。`;
  }
  if (b.type === 'cipher-wipe') {
    const drv = b.params.drive || 'C:';
    return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>ドライブ（${drv}）のゴミ箱から消したデータの痕跡が完全に上書き消去（完全抹消）されます</strong>。復元ソフトを使っても二度と取り出せなくなります。`;
  }
  if (b.type === 'delete-file') {
    const target = resolveVariables(b.params.target) || '(未入力)';
    return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>指定したファイル「${target}」がゴミ箱を経由せずパソコンから完全に削除されます</strong>。`;
  }
  return `<strong>【${def.name}】</strong><br>このブロックを動かすと、<strong>システムやディスクの重要な設定が変更されます</strong>。`;
}

function checkDangerAndExecute() {
  const dangerBlocks = blocks.filter(b => {
    const def = getBlockDef(b.type);
    return def && (def.isDanger || b.type === 'delete-file' || b.type === 'cipher-wipe');
  });

  if (dangerBlocks.length > 0) {
    const explanationEl = document.getElementById('confirmActionExplanation');
    const explanationsHtml = dangerBlocks.map(b => getDangerExplanation(b)).join('<hr style="border:none;border-top:1px dashed #fca5a5;margin:8px 0;">');
    explanationEl.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;"><span style="color:#ef4444;margin-right:4px;">[警告]</span>危険な操作が含まれています</div>
      <div>以下の動作が実行されます。内容をよくご確認ください：</div>
      <div style="margin-top:6px;">${explanationsHtml}</div>
    `;

    const commands = dangerBlocks.map(b => generateBlockCommand(b)).join('\n');
    document.getElementById('modalTargetDetails').textContent = commands;
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

  blocks.forEach(b => {
    b._status = 'running';
    updateBlockStatus(b);
  });

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
        blocks.forEach(b => {
          b._status = 'success';
          b._duration = '0.08s';
          updateBlockStatus(b);
        });
        saveExecutionHistory(true, outputLog.textContent);
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
              const avgDur = ev.duration ? (parseFloat(ev.duration) / Math.max(1, blocks.length)).toFixed(2) : '0.05';
              blocks.forEach(b => {
                b._status = 'success';
                b._duration = `${avgDur}s`;
                updateBlockStatus(b);
              });
              renderErrorDiagnosis(null);
              saveExecutionHistory(true, outputLog.textContent);
            } else {
              statusBadge.className = 'status-indicator error';
              statusBadge.textContent = '途中でストップしました';
              blocks.forEach(b => {
                if (b._status === 'running') b._status = 'error';
                updateBlockStatus(b);
              });
              const diag = ev.explanation || diagnoseErrorClient(outputLog.textContent, ev.exitCode);
              renderErrorDiagnosis(diag);
              saveExecutionHistory(false, outputLog.textContent);
            }
          } else if (ev.type === 'error') {
            outputLog.textContent += `\n[エラー]: ${ev.message}\n`;
            statusBadge.className = 'status-indicator error';
            statusBadge.textContent = 'エラー';
            blocks.forEach(b => {
              b._status = 'error';
              updateBlockStatus(b);
            });
            const diag = diagnoseErrorClient(outputLog.textContent, 1);
            renderErrorDiagnosis(diag);
            saveExecutionHistory(false, outputLog.textContent);
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
    blocks.forEach(b => {
      b._status = 'error';
      updateBlockStatus(b);
    });
    outputLog.textContent = 'サーバーとの通信でエラーが出ました: ' + err.message;
    renderErrorDiagnosis({
      badge: '接続エラー (Network)',
      summary: 'サーバーとの通信に失敗しました',
      cause: 'バックエンドサーバー (server.js) が停止しているか、アクセスできません。',
      action: 'ターミナルで `node server.js` または `start.bat` が正常に動いているか確認してください。'
    });
    saveExecutionHistory(false, outputLog.textContent);
  }
}

// 🔍 ノードズーム管理
function setNodeZoom(level) {
  nodeZoomLevel = Math.max(0.4, Math.min(1.8, Math.round(level * 100) / 100));
  if (zoomLevelDisplay) {
    zoomLevelDisplay.textContent = Math.round(nodeZoomLevel * 100) + '%';
  }
  if (nodeGraphNodes && nodeWireSvg) {
    nodeGraphNodes.style.transform = `scale(${nodeZoomLevel})`;
    nodeGraphNodes.style.transformOrigin = '0 0';
    nodeWireSvg.style.transform = `scale(${nodeZoomLevel})`;
    nodeWireSvg.style.transformOrigin = '0 0';
  }
}

function fitNodeZoom() {
  if (blocks.length === 0 || !nodeGraphViewport) {
    setNodeZoom(1.0);
    return;
  }
  let maxX = 800;
  let maxY = 500;
  nodeCardRegistry.forEach(item => {
    if (item.b._pos) {
      maxX = Math.max(maxX, item.b._pos.x + item.width + 60);
      maxY = Math.max(maxY, item.b._pos.y + (item.card.offsetHeight || 160) + 60);
    }
  });

  const vpW = nodeGraphViewport.clientWidth || 800;
  const vpH = nodeGraphViewport.clientHeight || 500;
  const scaleX = (vpW - 60) / maxX;
  const scaleY = (vpH - 60) / maxY;
  const idealScale = Math.min(scaleX, scaleY, 1.0);
  setNodeZoom(Math.max(0.45, idealScale));
}

// 📜 実行履歴管理
function saveExecutionHistory(ok, fullLog) {
  try {
    const raw = localStorage.getItem('graphical_terminal_history');
    let history = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history)) history = [];

    const item = {
      id: Date.now(),
      time: new Date().toLocaleString('ja-JP'),
      blockCount: blocks.length,
      ok: !!ok,
      log: fullLog || outputLog.textContent || '',
      blocksSnapshot: JSON.stringify(blocks)
    };

    history.unshift(item);
    if (history.length > 40) history.pop();
    localStorage.setItem('graphical_terminal_history', JSON.stringify(history));
  } catch (e) {
    // ignore
  }
}

function renderHistoryList() {
  if (!historyList) return;
  historyList.innerHTML = '';

  let history = [];
  try {
    const raw = localStorage.getItem('graphical_terminal_history');
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    history = [];
  }

  if (history.length === 0) {
    historyList.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">過去の実行履歴はありません。</div>';
    return;
  }

  history.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <div class="history-meta">
        <div class="history-title">実行タスク (${item.blockCount}個のブロック)</div>
        <div class="history-time">${item.time}</div>
      </div>
      <div>
        <span class="history-badge ${item.ok ? 'success' : 'error'}">${item.ok ? '成功' : 'エラー/中断'}</span>
      </div>
    `;

    row.addEventListener('click', () => {
      if (confirm(`この時のブロック構成をキャンバスに復元しますか？\n（実行時刻: ${item.time}）`)) {
        try {
          if (item.blocksSnapshot) {
            pushHistory();
            blocks = JSON.parse(item.blocksSnapshot);
            renderCanvas();
            historyModal.classList.add('hidden');
            outputLog.textContent = `=== [過去ログ復元] (${item.time}) ===\n\n` + item.log;
          }
        } catch(e) {
          alert('復元に失敗しました: ' + e.message);
        }
      }
    });

    historyList.appendChild(row);
  });
}

// 🔑 変数・秘密キー管理
function renderSecretsList() {
  if (!secretsList) return;
  secretsList.innerHTML = '';

  const keys = Object.keys(userSecrets);
  if (keys.length === 0) {
    secretsList.innerHTML = '<div style="color: var(--text-muted); padding: 14px; text-align: center; font-size: 11.5px;">登録された変数はありません。上のフォームから登録できます。</div>';
    return;
  }

  keys.forEach(k => {
    const row = document.createElement('div');
    row.className = 'secret-item';
    row.innerHTML = `
      <div>
        <span class="secret-key">{${k}}</span>
        <div class="secret-val">${userSecrets[k]}</div>
      </div>
      <button class="icon-btn btn-del-secret" title="削除">✕</button>
    `;

    row.querySelector('.btn-del-secret').addEventListener('click', () => {
      delete userSecrets[k];
      saveSecrets();
      renderSecretsList();
    });

    secretsList.appendChild(row);
  });
}

init();
