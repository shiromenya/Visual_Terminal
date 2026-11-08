// Microsoft Windows Server & Client Commands (A to Z) 完全マスター辞書ジェネレーター
const fs = require('fs');
const path = require('path');

const MS_COMMANDS = [
  // ================= A =================
  {
    cmd: 'active',
    name: 'パーティションをアクティブ化',
    category: 'disk',
    level: 'admin',
    desc: '選択された基本パーティションをシステム起動用（アクティブ）としてマークします。(diskpartのサブコマンド)',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/active',
    presets: [
      { label: '現在選択中のパーティションをアクティブ化', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'add',
    name: 'ミラーボリュームの追加',
    category: 'disk',
    level: 'admin',
    desc: 'フォーカスのあるシンプルボリュームにミラーを追加して耐障害性を持たせます。(diskpartのサブコマンド)',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/add',
    presets: [
      { label: 'ディスク1にミラーを作成', args: 'disk=1' }
    ],
    defaultArgs: 'disk=1'
  },
  {
    cmd: 'append',
    name: 'データファイル検索パスの追加',
    category: 'system',
    level: 'beginner',
    desc: 'プログラムが現在のディレクトリにないデータファイルを開けるよう追加パスを指定します（レガシー互換）。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/append',
    presets: [
      { label: '追加パス一覧を表示', args: ';' },
      { label: '指定フォルダを検索パスに追加', args: 'C:\\Data' }
    ],
    defaultArgs: ';'
  },
  {
    cmd: 'arp',
    name: 'MACアドレス対応表の確認・変更',
    category: 'network',
    level: 'beginner',
    desc: 'IPアドレスと機器の物理MACアドレスの対応表（ARPキャッシュ）を表示・管理します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/arp',
    presets: [
      { label: '全ネットワークのARPキャッシュ一覧', args: '-a' },
      { label: '特定のIPのMACアドレスを照会', args: '-a 192.168.1.1' },
      { label: 'ARPキャッシュをクリア (要管理者)', args: '-d *' }
    ],
    defaultArgs: '-a'
  },
  {
    cmd: 'assoc',
    name: '拡張子の関連付け確認・変更',
    category: 'file',
    level: 'beginner',
    desc: '「.txt」「.jpg」などの拡張子がどのファイル形式として認識されているかを表示・変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/assoc',
    presets: [
      { label: 'すべての拡張子の関連付けを一覧表示', args: '' },
      { label: '.txt の関連付けを確認', args: '.txt' },
      { label: '.log の関連付けを確認', args: '.log' }
    ],
    defaultArgs: '.txt'
  },
  {
    cmd: 'at',
    name: '定期タスクの登録 (レガシー)',
    category: 'script',
    level: 'admin',
    desc: '指定した時刻にプログラムを自動実行します（現在はより高機能なschtasksが推奨されます）。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/at',
    presets: [
      { label: '登録されているタスク一覧', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'atmadm',
    name: 'ATMネットワークアダプタ監視',
    category: 'network',
    level: 'beginner',
    desc: 'ATM (Asynchronous Transfer Mode) ネットワーク接続の状態と統計情報を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/atmadm',
    presets: [
      { label: '接続状態を表示', args: '/c' }
    ],
    defaultArgs: '/c'
  },
  {
    cmd: 'attrib',
    name: 'ファイルの属性変更 (隠し/読取専用)',
    category: 'file',
    level: 'beginner',
    desc: 'ファイルの「読み取り専用(+R)」「隠しファイル(+H)」「システム(+S)」属性をオン/オフします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/attrib',
    presets: [
      { label: 'カレントフォルダの全ファイルの属性を表示', args: '*.*' },
      { label: 'ファイルを読み取り専用にする', args: '+r "sample.txt"' },
      { label: '隠しファイル化を解除する', args: '-h -s "secret.txt"' }
    ],
    defaultArgs: '*.*'
  },
  {
    cmd: 'auditpol',
    name: 'セキュリティ監査ポリシーの管理',
    category: 'security',
    level: 'admin',
    desc: 'Windowsのセキュリティ監査（ログオン履歴、ファイルアクセスなどの記録）ポリシーを表示・設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/auditpol',
    presets: [
      { label: 'すべての監査ポリシー設定を一覧表示', args: '/get /category:*' },
      { label: 'ログオン関連の監査ポリシーのみ表示', args: '/get /category:"Logon/Logoff"' },
      { label: '監査ポリシーをバックアップ', args: '/backup /file:audit_backup.csv' }
    ],
    defaultArgs: '/get /category:*'
  },
  {
    cmd: 'autochk',
    name: '起動時自動ディスク検査',
    category: 'disk',
    level: 'admin',
    desc: 'Windows起動時に自動で実行されるファイルシステムの整合性スキャンツールです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/autochk',
    presets: [
      { label: 'Cドライブの起動時スキャン設定', args: 'C:' }
    ],
    defaultArgs: 'C:'
  },
  {
    cmd: 'autoconv',
    name: '起動時FATからNTFSへの自動変換',
    category: 'disk',
    level: 'admin',
    desc: 'PC起動時にFATボリュームを自動的にNTFSファイルシステムへ変換します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/autoconv',
    presets: [
      { label: 'DドライブをNTFSに自動変換設定', args: '/FS:NTFS D:' }
    ],
    defaultArgs: '/FS:NTFS D:'
  },
  {
    cmd: 'autofmt',
    name: '起動時自動フォーマット',
    category: 'disk',
    level: 'caution',
    desc: '起動時に指定ボリュームをフォーマットする内部システムコマンドです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/autofmt',
    presets: [
      { label: 'NTFS自動フォーマット', args: '/FS:NTFS' }
    ],
    defaultArgs: '/FS:NTFS'
  },

  // ================= B =================
  {
    cmd: 'bcdboot',
    name: 'Windows起動ブートファイルの修復・初期化',
    category: 'system',
    level: 'admin',
    desc: 'システムパーティションにブート環境を構成・修復し、起動不能になったPCの修復に使用します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/bcdboot',
    presets: [
      { label: 'C:\\WindowsからブートファイルをUEFIに再作成', args: 'C:\\Windows /s S: /f UEFI' },
      { label: '全ファームウェア形式で再構築', args: 'C:\\Windows /s S: /f ALL' }
    ],
    defaultArgs: 'C:\\Windows'
  },
  {
    cmd: 'bcdedit',
    name: '起動設定データ(BCD)の編集',
    category: 'system',
    level: 'admin',
    desc: 'Windowsのブートマネージャー設定（セーフモード起動、テストモード、タイムアウト等）を編集します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/bcdedit',
    presets: [
      { label: '現在のブート設定一覧を表示', args: '/enum' },
      { label: 'ブート選択画面の待ち時間を10秒に設定', args: '/timeout 10' },
      { label: '次回起動時にセーフモードを強制', args: '/set {current} safeboot minimal' },
      { label: 'セーフモード強制を解除して通常起動', args: '/deletevalue {current} safeboot' }
    ],
    defaultArgs: '/enum'
  },
  {
    cmd: 'bdehdcfg',
    name: 'BitLocker用ハードドライブ準備',
    category: 'security',
    level: 'admin',
    desc: 'ドライブをBitLocker暗号化できるように別のシステムパーティションを自動準備します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/bdehdcfg',
    presets: [
      { label: 'デフォルト構成でBitLocker準備を実行', args: '-target default -quiet' }
    ],
    defaultArgs: '-target default'
  },
  {
    cmd: 'bitsadmin',
    name: 'バックグラウンド大容量ファイル転送(BITS)',
    category: 'network',
    level: 'beginner',
    desc: '回線帯域を圧迫せずにバックグラウンドでファイルをダウンロード・アップロードします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/bitsadmin',
    presets: [
      { label: '現在実行中の転送ジョブ一覧を表示', args: '/list /allusers' },
      { label: 'Webからファイルをバックグラウンドダウンロード', args: '/transfer myJob https://example.com/file.zip C:\\temp\\file.zip' },
      { label: 'すべての転送ジョブをキャンセル', args: '/reset' }
    ],
    defaultArgs: '/list /allusers'
  },
  {
    cmd: 'bootcfg',
    name: 'boot.ini設定の構成 (レガシー)',
    category: 'system',
    level: 'admin',
    desc: 'Windows XP/2003時代のboot.iniファイルを照会・構成します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/bootcfg',
    presets: [
      { label: '現在の設定を照会', args: '/query' }
    ],
    defaultArgs: '/query'
  },
  {
    cmd: 'break',
    name: 'DOS拡張Ctrl+Cチェック設定',
    category: 'script',
    level: 'beginner',
    desc: 'MS-DOS互換システムでCtrl+Cによる中断チェックを拡張するかどうかを設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/break',
    presets: [
      { label: '状態を確認', args: '' }
    ],
    defaultArgs: ''
  },

  // ================= C =================
  {
    cmd: 'cacls',
    name: 'ファイルアクセス権(ACL)の表示 (レガシー)',
    category: 'security',
    level: 'admin',
    desc: 'ファイルのアクセス権限（ACL）を表示・変更します（現在はicaclsが推奨されます）。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cacls',
    presets: [
      { label: '特定ファイルのACLを表示', args: 'sample.txt' }
    ],
    defaultArgs: 'sample.txt'
  },
  {
    cmd: 'cd',
    name: 'フォルダの移動 (ディレクトリ変更)',
    category: 'file',
    level: 'beginner',
    desc: 'カレントディレクトリ（作業フォルダ）を別の場所に移動します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cd',
    presets: [
      { label: '現在の作業フォルダパスを表示', args: '' },
      { label: '1つ上のフォルダへ移動', args: '..' },
      { label: '指定したフォルダへ移動', args: 'C:\\Users\\Public' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'certreq',
    name: '証明書要求の作成・提出 (Active Directory/CA)',
    category: 'security',
    level: 'admin',
    desc: '認証局（CA）に対するSSL/TLS証明書の要求作成、提出、受領を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/certreq',
    presets: [
      { label: '設定ファイルから新規証明書要求を作成', args: '-new request.inf cert.req' },
      { label: '要求をCAに提出して証明書を取得', args: '-submit cert.req cert.cer' },
      { label: '取得した証明書をインストール', args: '-accept cert.cer' }
    ],
    defaultArgs: '-?'
  },
  {
    cmd: 'certutil',
    name: '証明書管理・ファイルDL・ハッシュ計算',
    category: 'security',
    level: 'beginner',
    desc: 'ファイルのSHA256ハッシュ値の計算、URLからのファイルダウンロード、証明書管理を行える超万能ツールです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/certutil',
    presets: [
      { label: 'ファイルのSHA256ハッシュ値を計算する', args: '-hashfile "sample.zip" SHA256' },
      { label: 'Web上のファイルを直接ダウンロードする', args: '-urlcache -split -f "https://example.com/data.txt" data.txt' },
      { label: 'インストール済み個人証明書一覧を表示', args: '-user -store My' }
    ],
    defaultArgs: '-hashfile "sample.txt" SHA256'
  },
  {
    cmd: 'change',
    name: 'ターミナルサーバー設定変更',
    category: 'admin',
    level: 'admin',
    desc: 'リモートデスクトップセッションのログオンやCOMポート設定を変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/change',
    presets: [
      { label: 'リモートログオンを有効化', args: 'logon /enable' },
      { label: 'リモートログオンを一時無効化', args: 'logon /disable' }
    ],
    defaultArgs: 'logon /query'
  },
  {
    cmd: 'chcp',
    name: '文字コード(コードページ)の確認・変更',
    category: 'system',
    level: 'beginner',
    desc: 'コマンドプロンプトの文字コード（932:Shift-JIS、65001:UTF-8）を確認・変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/chcp',
    presets: [
      { label: '現在の文字コードを確認', args: '' },
      { label: '文字コードをUTF-8(65001)に変更', args: '65001' },
      { label: '文字コードを日本語Shift-JIS(932)に戻す', args: '932' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'chkdsk',
    name: 'ディスクのエラー検査と修復',
    category: 'disk',
    level: 'admin',
    desc: 'ハードディスクやSSDのファイルシステムエラーや不良セクターを診断・修復します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/chkdsk',
    presets: [
      { label: 'Cドライブを読み取り専用で安全に簡易診断', args: 'C:' },
      { label: 'エラーを検出して自動修復 (/F)', args: 'C: /F' },
      { label: '不良セクターを徹底検査して回復 (/R)', args: 'C: /F /R' }
    ],
    defaultArgs: 'C:'
  },
  {
    cmd: 'chkntfs',
    name: '起動時ディスクチェック状態の確認・除外',
    category: 'disk',
    level: 'admin',
    desc: '次回Windows起動時にchkdskが実行されるようマークされているかを確認します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/chkntfs',
    presets: [
      { label: 'Cドライブのエラーフラグ(ダーティビット)を確認', args: 'C:' },
      { label: 'Dドライブを次回起動時チェック対象から除外', args: '/x D:' }
    ],
    defaultArgs: 'C:'
  },
  {
    cmd: 'choice',
    name: 'ユーザー入力の選択肢待機 (Y/N)',
    category: 'script',
    level: 'beginner',
    desc: 'バッチ処理中にキーボードから「Y」や「N」などの選択肢キー入力を求めます。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/choice',
    presets: [
      { label: '続行しますか？ (Y/N)', args: '/M "続行しますか"' },
      { label: '10秒待って自動でYを選択', args: '/T 10 /D Y /M "10秒後に自動実行されます"' }
    ],
    defaultArgs: '/M "続行しますか"'
  },
  {
    cmd: 'cipher',
    name: '空き領域の完全抹消・暗号化',
    category: 'security',
    level: 'admin',
    desc: 'ゴミ箱から消したデータの復元防止のため空き領域を完全上書き抹消したり、フォルダをEFS暗号化します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cipher',
    presets: [
      { label: 'Cドライブの空き領域に残った残骸を復元不能に抹消', args: '/w:C:' },
      { label: '指定したフォルダを暗号化', args: '/e "C:\\SecretFolder"' },
      { label: '暗号化を解除', args: '/d "C:\\SecretFolder"' }
    ],
    defaultArgs: '/w:C:'
  },
  {
    cmd: 'cleanmgr',
    name: 'ディスククリーンアップ (不要ファイル削除)',
    category: 'disk',
    level: 'beginner',
    desc: '一時ファイルやWindows Updateの残骸など不要なファイルを自動検出して空き容量を増やします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cleanmgr',
    presets: [
      { label: 'Cドライブのクリーンアップ画面を開く', args: '/d C:' },
      { label: '自動クリーンアップの実行設定', args: '/sageset:1' },
      { label: '設定済みのクリーンアップをバックグラウンド実行', args: '/sagerun:1' }
    ],
    defaultArgs: '/d C:'
  },
  {
    cmd: 'clip',
    name: 'コマンド結果をクリップボードにコピー',
    category: 'script',
    level: 'beginner',
    desc: '先行コマンドの出力テキストをWindowsのクリップボードに直接コピーします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/clip',
    presets: [
      { label: 'ファイルの内容をクリップボードにコピー', args: '< "sample.txt"' },
      { label: '現在の日時をクリップボードにコピー', args: 'date /t | clip' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'cls',
    name: '画面のクリア',
    category: 'system',
    level: 'beginner',
    desc: '画面に表示されている過去のテキストログをクリアして真っ白にします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cls',
    presets: [
      { label: 'コンソール画面をクリア', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'cmd',
    name: 'コマンドプロンプトの新規セッション起動',
    category: 'system',
    level: 'beginner',
    desc: '新しいコマンドプロンプトシェルインスタンスを起動します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cmd',
    presets: [
      { label: 'コマンドを実行して直ちに終了する (/c)', args: '/c "echo Hello Windows"' }
    ],
    defaultArgs: '/c "echo Hello"'
  },
  {
    cmd: 'cmdkey',
    name: '保存済み資格情報(ID/パスワード)管理',
    category: 'security',
    level: 'admin',
    desc: 'リモートサーバーや共有フォルダに自動接続するために保存されている資格情報を一覧表示・登録・削除します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cmdkey',
    presets: [
      { label: '保存されている資格情報一覧を表示', args: '/list' },
      { label: '特定の接続先パスワードを削除', args: '/delete:targetName' }
    ],
    defaultArgs: '/list'
  },
  {
    cmd: 'color',
    name: '文字色と背景色の変更',
    category: 'system',
    level: 'beginner',
    desc: 'コマンドプロンプト画面の文字色と背景色を好みの色（緑・青・黒など）に変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/color',
    presets: [
      { label: '黒背景に緑文字 (マトリックス風)', args: '0A' },
      { label: '青背景に白文字', args: '1F' },
      { label: 'デフォルト（黒背景に白文字）に戻す', args: '07' }
    ],
    defaultArgs: '0A'
  },
  {
    cmd: 'comp',
    name: '2つのファイルの内容比較',
    category: 'file',
    level: 'beginner',
    desc: '2つのファイルの内容が完全に一致しているかどうかを比較検査します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/comp',
    presets: [
      { label: 'ファイルAとファイルBを比較', args: '"fileA.txt" "fileB.txt" /A' }
    ],
    defaultArgs: '"fileA.txt" "fileB.txt" /A'
  },
  {
    cmd: 'compact',
    name: 'ファイルやフォルダのNTFS圧縮',
    category: 'file',
    level: 'beginner',
    desc: 'NTFSパーティション上のファイルやフォルダを圧縮してディスク容量を節約します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/compact',
    presets: [
      { label: '現在のフォルダ内の圧縮状態を確認', args: '' },
      { label: 'サブフォルダも含めて丸ごと圧縮', args: '/c /s /i' },
      { label: '圧縮を解除して元に戻す', args: '/u /s /i' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'convert',
    name: 'ドライブをFATからNTFSへ変換',
    category: 'disk',
    level: 'caution',
    desc: 'データを保持したまま、FATやFAT32ボリュームを最新のNTFS形式へ不可逆変換します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/convert',
    presets: [
      { label: 'EドライブをNTFSに変換', args: 'E: /fs:ntfs' }
    ],
    defaultArgs: 'E: /fs:ntfs'
  },
  {
    cmd: 'copy',
    name: 'ファイルのコピー・結合',
    category: 'file',
    level: 'beginner',
    desc: 'ファイルを別のフォルダへコピーしたり、複数テキストファイルを1つに連結結合します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/copy',
    presets: [
      { label: 'ファイルを別フォルダへコピー', args: '"file.txt" "C:\\Backup\\"' },
      { label: '複数のテキストファイルを1つに結合', args: '"part1.txt"+"part2.txt" "combined.txt"' },
      { label: '同名ファイルがあっても強制上書きコピー (/Y)', args: '/Y "file.txt" "C:\\Backup\\"' }
    ],
    defaultArgs: '"source.txt" "destination.txt"'
  },
  {
    cmd: 'cscript',
    name: 'VBScript/JScriptのコンソール実行',
    category: 'script',
    level: 'beginner',
    desc: 'Windows Script Host (WSH) を使ってコマンドラインでスクリプトファイルを実行します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/cscript',
    presets: [
      { label: 'ロゴ非表示でVBScriptを実行', args: '//nologo "script.vbs"' }
    ],
    defaultArgs: '//nologo "script.vbs"'
  },

  // ================= D =================
  {
    cmd: 'date',
    name: 'システム日付の確認・設定',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンの現在の日付を表示、または変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/date',
    presets: [
      { label: '確認のみ（日付変更プロンプトを出さない）', args: '/t' }
    ],
    defaultArgs: '/t'
  },
  {
    cmd: 'dcdiag',
    name: 'ドメインコントローラー(AD)の健全性診断',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directoryドメインコントローラーの接続、DNS、複製(レプリケーション)状態を総合診断します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dcdiag',
    presets: [
      { label: '現在のドメインコントローラーを総合診断', args: '/v' },
      { label: 'DNS関連のエラーのみ徹底チェック', args: '/test:DNS /v' }
    ],
    defaultArgs: '/v'
  },
  {
    cmd: 'defrag',
    name: 'ドライブの最適化・デフラグ (SSDトリム対応)',
    category: 'disk',
    level: 'admin',
    desc: 'HDDの断片化を解消したり、SSDに対してTRIM最適化コマンドを発行して速度を回復します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/defrag',
    presets: [
      { label: 'Cドライブの最適化が必要か診断のみ', args: 'C: /A /V' },
      { label: 'Cドライブの最適化・デフラグを実行', args: 'C: /O /V' },
      { label: 'すべてのドライブをまとめて最適化', args: '/C /O' }
    ],
    defaultArgs: 'C: /A /V'
  },
  {
    cmd: 'del',
    name: 'ファイルの削除',
    category: 'file',
    level: 'beginner',
    desc: '指定した1つ以上のファイルを削除します（ゴミ箱には入らず即座に消去されます）。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/del',
    presets: [
      { label: '特定ファイルを削除', args: '"sample.tmp"' },
      { label: 'サブフォルダ内の指定拡張子もまとめて一括削除', args: '/s /q "*.tmp"' },
      { label: '読み取り専用ファイルも含めて強制削除', args: '/f /q "target.txt"' }
    ],
    defaultArgs: '"sample.tmp"'
  },
  {
    cmd: 'dfsadmin',
    name: 'DFS名前空間の管理',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directoryの分散ファイルシステム(DFS)名前空間の共有フォルダ構成を管理します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dfsadmin',
    presets: [
      { label: 'DFSヘルプを表示', args: '/?' }
    ],
    defaultArgs: '/?'
  },
  {
    cmd: 'dir',
    name: 'ファイルとフォルダの一覧表示',
    category: 'file',
    level: 'beginner',
    desc: '指定したフォルダの中にあるファイルやサブフォルダの名前・サイズ・更新日時を一覧表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dir',
    presets: [
      { label: 'カレントフォルダの一覧', args: '' },
      { label: '隠しファイルも含めてすべて表示', args: '/a' },
      { label: 'ファイル名のみをシンプルに一覧出力', args: '/b' },
      { label: 'サブフォルダ内もすべて再帰検索', args: '/s *.txt' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'diskcomp',
    name: 'フロッピーディスクの比較 (レガシー)',
    category: 'disk',
    level: 'beginner',
    desc: '2枚のフロッピーディスクの内容を比較します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/diskcomp',
    presets: [
      { label: 'AドライブとBドライブを比較', args: 'A: B:' }
    ],
    defaultArgs: 'A: B:'
  },
  {
    cmd: 'diskcopy',
    name: 'フロッピーディスクの複製 (レガシー)',
    category: 'disk',
    level: 'beginner',
    desc: 'フロッピーディスクの内容を別のディスクへ丸ごとコピーします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/diskcopy',
    presets: [
      { label: 'AドライブからBドライブへ複製', args: 'A: B:' }
    ],
    defaultArgs: 'A: B:'
  },
  {
    cmd: 'diskpart',
    name: '超高機能ディスク・パーティション管理',
    category: 'disk',
    level: 'caution',
    desc: 'ディスクの初期化、パーティション作成・縮小・結合、ドライブ文字割り当てを行う最強ツールです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/diskpart',
    presets: [
      { label: '認識されている全ディスク一覧を表示', args: '/s "scripts\\list_disks.txt"' },
      { label: '全ボリューム一覧を表示', args: '/s "scripts\\list_vols.txt"' }
    ],
    defaultArgs: '/?'
  },
  {
    cmd: 'diskperf',
    name: 'ディスクパフォーマンスカウンター設定',
    category: 'disk',
    level: 'admin',
    desc: 'ディスクのI/Oパフォーマンス計測カウンターを有効化または無効化します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/diskperf',
    presets: [
      { label: '現在のカウンター設定状態を確認', args: '' },
      { label: 'すべてのディスクカウンターを有効化', args: '-Y' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'dism',
    name: 'Windowsイメージの修復・機能追加(DISM)',
    category: 'system',
    level: 'admin',
    desc: 'Windowsシステムファイルの破損をネット経由で自動修復したり、Windowsオプション機能を有効化します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dism',
    presets: [
      { label: 'Windowsコンポーネントストアの破損をチェック', args: '/Online /Cleanup-Image /CheckHealth' },
      { label: 'コンポーネントストアをWindows Updateから自動修復', args: '/Online /Cleanup-Image /RestoreHealth' },
      { label: 'Windowsの有効化可能な機能一覧を表示', args: '/Online /Get-Features /Format:Table' }
    ],
    defaultArgs: '/Online /Cleanup-Image /CheckHealth'
  },
  {
    cmd: 'dispdiag',
    name: 'ディスプレイ構成のログ採取・診断',
    category: 'system',
    level: 'beginner',
    desc: 'マルチモニターやHDRなどのディスプレイ表示に関する詳細なログをファイルへ出力します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dispdiag',
    presets: [
      { label: 'デスクトップにディスプレイ診断ログを出力', args: '-out "%USERPROFILE%\\Desktop\\dispdiag.dat"' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'doskey',
    name: 'コマンドマクロ作成・コマンド履歴',
    category: 'script',
    level: 'beginner',
    desc: '入力したコマンド履歴の確認や、長いコマンドを短いショートカットマクロに登録します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/doskey',
    presets: [
      { label: '過去に入力したコマンド履歴一覧を表示', args: '/history' },
      { label: '「ls」で「dir /w」が動くようにマクロ登録', args: 'ls=dir /w' }
    ],
    defaultArgs: '/history'
  },
  {
    cmd: 'driverquery',
    name: '全デバイスドライバーの一覧と状態',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンにインストールされているすべてのハードウェアドライバーの名前とバージョンを一覧表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/driverquery',
    presets: [
      { label: 'インストール済みドライバー一覧を表形式で表示', args: '/fo table' },
      { label: 'ドライバーの詳細情報とデジタル署名の有無を表示', args: '/v /fo table' }
    ],
    defaultArgs: '/fo table'
  },
  {
    cmd: 'dsadd',
    name: 'Active Directoryオブジェクトの追加',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directoryドメインに新しいユーザー、グループ、コンピューターを追加します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dsadd',
    presets: [
      { label: '新規ユーザーを追加', args: 'user "CN=Yamada,OU=Sales,DC=corp,DC=local" -pwd "Password123!"' }
    ],
    defaultArgs: '/?'
  },
  {
    cmd: 'dsget',
    name: 'Active Directoryオブジェクト情報の照会',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directoryドメイン内のユーザーやグループの所属情報やメールアドレスを表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dsget',
    presets: [
      { label: '指定グループに所属するメンバー一覧を表示', args: 'group "CN=SalesGroup,DC=corp,DC=local" -members' }
    ],
    defaultArgs: '/?'
  },
  {
    cmd: 'dsmod',
    name: 'Active Directoryオブジェクトの変更',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directory内の既存ユーザーのパスワード変更やアカウント無効化を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dsmod',
    presets: [
      { label: '指定ユーザーのアカウントを無効化', args: 'user "CN=Yamada,DC=corp,DC=local" -disabled yes' }
    ],
    defaultArgs: '/?'
  },
  {
    cmd: 'dsquery',
    name: 'Active Directoryの条件検索',
    category: 'admin',
    level: 'admin',
    desc: '一定期間パスワードが変更されていないユーザーや無効なPCをAD内から一括検索します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dsquery',
    presets: [
      { label: '無効になっている全ユーザーアカウントを検索', args: 'user -disabled' },
      { label: '過去90日間ログオンしていない古いコンピューターを検索', args: 'computer -inactive 90' }
    ],
    defaultArgs: 'user -limit 20'
  },
  {
    cmd: 'dsrm',
    name: 'Active Directoryオブジェクトの削除',
    category: 'admin',
    level: 'caution',
    desc: 'Active Directoryドメインから不要になったユーザーやグループを削除します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/dsrm',
    presets: [
      { label: '確認なしで指定ユーザーをADから削除', args: '"CN=Yamada,DC=corp,DC=local" -noprompt' }
    ],
    defaultArgs: '/?'
  },

  // ================= E =================
  {
    cmd: 'echo',
    name: '画面へのメッセージ表示・エコー制御',
    category: 'script',
    level: 'beginner',
    desc: '画面に文字を出力したり、ファイルへテキストを書き込みます。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/echo',
    presets: [
      { label: '画面にHello Worldを表示', args: 'Hello World!' },
      { label: 'ファイルにテキストを新規書き込み', args: 'Hello! > message.txt' },
      { label: 'ファイルの末尾にテキストを追記', args: 'Line 2 >> message.txt' }
    ],
    defaultArgs: 'Hello World!'
  },
  {
    cmd: 'eventcreate',
    name: 'イベントログへのカスタム通知書き込み',
    category: 'system',
    level: 'admin',
    desc: 'Windowsイベントログ（Application）に自作の警告や情報ログを1件追加します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/eventcreate',
    presets: [
      { label: 'バックアップ完了の情報ログを書き込み', args: '/t SUCCESS /id 100 /l APPLICATION /d "夜間バックアップが正常に完了しました"' },
      { label: '警告イベントを記録', args: '/t WARNING /id 101 /l APPLICATION /d "ディスク空き容量が少なくなっています"' }
    ],
    defaultArgs: '/t SUCCESS /id 100 /l APPLICATION /d "My App Test Event"'
  },
  {
    cmd: 'expand',
    name: '圧縮ファイル(.cab)の展開・解凍',
    category: 'file',
    level: 'beginner',
    desc: 'Windowsのキャビネット圧縮ファイル(.cab)を展開してファイルを取り出します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/expand',
    presets: [
      { label: 'cabファイル内のファイルを指定フォルダへ全展開', args: '-f:* "update.cab" "C:\\temp\\extracted"' }
    ],
    defaultArgs: '-f:* "archive.cab" "C:\\temp"'
  },

  // ================= F =================
  {
    cmd: 'fc',
    name: '2つのファイルの内容比較 (差分検出)',
    category: 'file',
    level: 'beginner',
    desc: 'テキストファイルやバイナリファイルの行ごとの違い（Diff）を検出して表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/fc',
    presets: [
      { label: 'テキストファイルの差分を行番号付きで比較', args: '/n "old.txt" "new.txt"' },
      { label: '大文字小文字を区別せずに比較', args: '/c "file1.txt" "file2.txt"' }
    ],
    defaultArgs: '/n "old.txt" "new.txt"'
  },
  {
    cmd: 'find',
    name: 'ファイル内の指定文字列の検索',
    category: 'file',
    level: 'beginner',
    desc: 'ファイルの中から特定の単語や文字列を含む行を検索して画面に出力します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/find',
    presets: [
      { label: '大文字小文字を無視して「error」を含む行を検索', args: '/i "error" "app.log"' },
      { label: '「test」を含まない行のみを抽出', args: '/v "test" "data.txt"' }
    ],
    defaultArgs: '/i "error" "app.log"'
  },
  {
    cmd: 'findstr',
    name: '正規表現による高度な文字列・ファイル内検索',
    category: 'file',
    level: 'beginner',
    desc: 'Linuxのgrepのように、正規表現やサブフォルダ横断でファイル内のテキストを高速検索します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/findstr',
    presets: [
      { label: '全サブフォルダ内の全ファイルから文字列を再帰検索 (grep相当)', args: '/s /i /n "TODO" *.js' },
      { label: 'IPアドレスパターンにマッチする行を抽出', args: '/r "[0-9][0-9]*\\.[0-9][0-9]*" "log.txt"' }
    ],
    defaultArgs: '/s /i /n "target" *.*'
  },
  {
    cmd: 'finger',
    name: 'リモートサーバーのユーザー情報照会',
    category: 'network',
    level: 'beginner',
    desc: 'Fingerプロトコルを使ってリモートホストのユーザー情報を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/finger',
    presets: [
      { label: '特定ホストのユーザーを照会', args: 'user@example.com' }
    ],
    defaultArgs: 'user@example.com'
  },
  {
    cmd: 'fltmc',
    name: 'ファイルシステムフィルタードライバーの管理',
    category: 'system',
    level: 'admin',
    desc: 'ウイルス対策ソフトなどが登録しているファイル監視フィルタードライバーの一覧を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/fltmc',
    presets: [
      { label: '現在読み込まれているフィルター一覧を表示', args: 'filters' },
      { label: '接続されているボリューム一覧', args: 'volumes' }
    ],
    defaultArgs: 'filters'
  },
  {
    cmd: 'forfiles',
    name: '日付や名前でファイルを選んで一括処理',
    category: 'script',
    level: 'beginner',
    desc: '「30日以上前のログファイルを全部削除する」などの条件付き一括バッチ処理を1行で実行します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/forfiles',
    presets: [
      { label: '30日以上前に更新された古いログファイルを一括削除', args: '/p "C:\\logs" /s /m *.log /d -30 /c "cmd /c del @path"' },
      { label: '更新日時とファイルサイズを一覧表示', args: '/m *.txt /c "cmd /c echo @file - @fdate @ftime - @fsize bytes"' }
    ],
    defaultArgs: '/m *.* /c "cmd /c echo @file"'
  },
  {
    cmd: 'format',
    name: 'ディスク・USBメモリの初期化フォーマット',
    category: 'disk',
    level: 'caution',
    desc: '指定したドライブの全データを消去し、NTFSやFAT32/exFATで新しく初期化します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/format',
    presets: [
      { label: 'EドライブをNTFSでクイックフォーマット', args: 'E: /FS:NTFS /Q /V:USB_DRIVE' },
      { label: 'FドライブをexFATで初期化', args: 'F: /FS:exFAT /Q' }
    ],
    defaultArgs: 'E: /FS:NTFS /Q'
  },
  {
    cmd: 'fsutil',
    name: 'NTFSファイルシステムの詳細制御・クォータ',
    category: 'disk',
    level: 'admin',
    desc: 'ドライブの空き容量確認、指定サイズのダミーファイル一瞬作成、ショートファイル名の管理などを行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/fsutil',
    presets: [
      { label: '指定容量（例: 1GB）の空ダミーファイルを一瞬で作成', args: 'file createnew "1GB_dummy.dat" 1073741824' },
      { label: 'Cドライブのボリューム詳細情報を表示', args: 'fsinfo volumeinfo C:' },
      { label: '全ドライブの種類一覧（固定/リムーバブル）を表示', args: 'fsinfo drives' }
    ],
    defaultArgs: 'fsinfo drives'
  },
  {
    cmd: 'ftp',
    name: 'FTPサーバーとのファイル送受信',
    category: 'network',
    level: 'beginner',
    desc: 'FTPプロトコルを使ってリモートサーバーとファイルをアップロード・ダウンロードします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ftp',
    presets: [
      { label: 'スクリプトファイルを指定して自動FTP転送', args: '-s:ftp_script.txt ftp.example.com' }
    ],
    defaultArgs: 'ftp.example.com'
  },
  {
    cmd: 'ftype',
    name: 'ファイルタイプに紐付く起動コマンド管理',
    category: 'file',
    level: 'admin',
    desc: '特定のファイル形式（拡張子に関連付けられたタイプ）をダブルクリックした時に動くコマンドを表示・設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ftype',
    presets: [
      { label: 'すべてのファイルタイプの起動コマンドを一覧表示', args: '' },
      { label: 'テキストファイル(txtfile)の起動コマンドを確認', args: 'txtfile' }
    ],
    defaultArgs: 'txtfile'
  },

  // ================= G =================
  {
    cmd: 'getmac',
    name: 'MACアドレス(物理アドレス)の取得',
    category: 'network',
    level: 'beginner',
    desc: 'パソコンに搭載されている有線LANやWi-Fiの物理MACアドレスを一覧表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/getmac',
    presets: [
      { label: 'MACアドレスと接続アダプター名を表形式で表示', args: '/fo table /v' }
    ],
    defaultArgs: '/fo table /v'
  },
  {
    cmd: 'gpresult',
    name: '適用されているグループポリシーの確認(RSoP)',
    category: 'admin',
    level: 'admin',
    desc: '現在このPCおよびログオン中のユーザーに適用されているActive Directoryポリシー（制限設定など）を確認します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/gpresult',
    presets: [
      { label: '適用ポリシーの概要サマリーを表示', args: '/r' },
      { label: '見やすいHTMLレポートとしてデスクトップに出力', args: '/h "%USERPROFILE%\\Desktop\\gpreport.html"' }
    ],
    defaultArgs: '/r'
  },
  {
    cmd: 'gpupdate',
    name: 'グループポリシーの今すぐ最新化',
    category: 'admin',
    level: 'beginner',
    desc: '会社の情シスなどが設定したグループポリシーの更新を待たずに、今すぐ強制的に最新状態へ同期します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/gpupdate',
    presets: [
      { label: 'すべてのポリシーを強制的に再適用 (/force)', args: '/force' },
      { label: '再起動を伴わずに適用', args: '/target:computer' }
    ],
    defaultArgs: '/force'
  },

  // ================= H =================
  {
    cmd: 'help',
    name: 'Windows標準コマンド一覧とヘルプ',
    category: 'system',
    level: 'beginner',
    desc: 'Windows標準コマンドの簡易一覧とそれぞれの概要ヘルプを表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/help',
    presets: [
      { label: '標準コマンドの一覧と概要を表示', args: '' },
      { label: '指定コマンドのヘルプを表示', args: 'robocopy' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'hostname',
    name: 'コンピューター名の表示',
    category: 'system',
    level: 'beginner',
    desc: '現在のパソコンのホスト名（コンピューター名）を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/hostname',
    presets: [
      { label: 'ホスト名を表示', args: '' }
    ],
    defaultArgs: ''
  },

  // ================= I =================
  {
    cmd: 'if',
    name: '条件分岐・判定 (If/Else)',
    category: 'script',
    level: 'beginner',
    desc: 'ファイルが存在するか、直前のコマンドが成功したか(ERRORLEVEL)、変数の値が一致するか等で処理を分岐します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/if',
    presets: [
      { label: '直前のコマンドが成功したか判定', args: '%ERRORLEVEL% equ 0 (echo 成功) else (echo 失敗)' },
      { label: '指定ファイルが存在するか判定', args: 'exist "backup.zip" (echo ファイルあり) else (echo なし)' },
      { label: '変数が指定文字列と一致するか判定', args: '"%ENV%"=="production" (echo 本番環境) else (echo 開発環境)' },
      { label: '指定ファイルが存在しない場合のみ処理', args: 'not exist "config.json" (echo 初期設定を実行)' }
    ],
    defaultArgs: 'exist "file.txt" (echo あり) else (echo なし)'
  },
  {
    cmd: 'icacls',
    name: 'アクセス権(ACL)のバックアップ・詳細変更',
    category: 'security',
    level: 'admin',
    desc: 'ファイルやフォルダの読み取り・変更権限（NTFSアクセス権）の付与、継承解除、バックアップと復元を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/icacls',
    presets: [
      { label: '現在のアクセス権設定を表示', args: '"C:\\Data"' },
      { label: 'アクセス権設定を丸ごとテキストファイルにバックアップ', args: '"C:\\Data" /save "acl_backup.txt" /t' },
      { label: 'バックアップからアクセス権を一括復元', args: '"C:\\Data" /restore "acl_backup.txt"' },
      { label: '特定ユーザーにフルコントロール権限を付与', args: '"C:\\Data" /grant Users:(OI)(CI)F' }
    ],
    defaultArgs: '"C:\\Data"'
  },
  {
    cmd: 'ipconfig',
    name: 'IPアドレス・DNS・ネットワーク設定の確認',
    category: 'network',
    level: 'beginner',
    desc: '自分のPCのIPアドレス、サブネットマスク、デフォルトゲートウェイ、DNSサーバーを確認します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ipconfig',
    presets: [
      { label: 'IPアドレスとゲートウェイを簡易確認', args: '' },
      { label: 'DNSサーバーやMACアドレスも含めた詳細情報を表示 (/all)', args: '/all' },
      { label: 'ネットの詰まりを解消 (DNSキャッシュの消去)', args: '/flushdns' },
      { label: 'DHCPのIPアドレスを再取得', args: '/renew' }
    ],
    defaultArgs: '/all'
  },

  // ================= K =================
  {
    cmd: 'klist',
    name: 'Kerberosチケットの確認・パージ',
    category: 'security',
    level: 'admin',
    desc: 'Active Directoryログオン中にキャッシュされているKerberos認証チケットを表示または消去します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/klist',
    presets: [
      { label: '現在保持しているKerberosチケット一覧', args: 'tickets' },
      { label: '古いチケットを破棄して再認証', args: 'purge' }
    ],
    defaultArgs: 'tickets'
  },
  {
    cmd: 'ksetup',
    name: 'Kerberosレルム接続設定',
    category: 'security',
    level: 'admin',
    desc: '非WindowsのKerberos KDCサーバーに接続するためのレルム構成を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ksetup',
    presets: [
      { label: '現在のレルム構成を表示', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'ktpass',
    name: 'Kerberosキータブ(keytab)ファイルの生成',
    category: 'security',
    level: 'admin',
    desc: 'UNIX/LinuxシステムとActive Directory連携するためのKerberos Keytabファイルを作成します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ktpass',
    presets: [
      { label: 'キータブ作成ヘルプを表示', args: '/?' }
    ],
    defaultArgs: '/?'
  },

  // ================= L =================
  {
    cmd: 'label',
    name: 'ドライブの名前(ボリュームラベル)変更',
    category: 'disk',
    level: 'admin',
    desc: 'エクスプローラーに表示されるドライブの名前（例: 「OS」「DATA_SSD」など）を変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/label',
    presets: [
      { label: 'Cドライブの現在の名前を確認', args: 'C:' },
      { label: 'Dドライブの名前を「BackupDisk」に変更', args: 'D: BackupDisk' }
    ],
    defaultArgs: 'C:'
  },
  {
    cmd: 'logman',
    name: 'パフォーマンス収集・イベントトレース管理',
    category: 'system',
    level: 'admin',
    desc: 'CPUやメモリなどのパフォーマンスカウンターやWindowsイベントトレース(ETW)の定期採取を開始・停止します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/logman',
    presets: [
      { label: '現在実行中のデータコレクター一覧を表示', args: 'query' },
      { label: 'システムパフォーマンス監視を開始', args: 'start "System Diagnostics"' },
      { label: 'パフォーマンス監視を停止', args: 'stop "System Diagnostics"' }
    ],
    defaultArgs: 'query'
  },
  {
    cmd: 'logoff',
    name: '現在のセッションからログオフ',
    category: 'user',
    level: 'beginner',
    desc: '現在サインインしているWindowsセッションを終了し、ロック画面（サインイン画面）に戻ります。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/logoff',
    presets: [
      { label: '自分を今すぐログオフする', args: '' }
    ],
    defaultArgs: ''
  },

  // ================= M =================
  {
    cmd: 'manage-bde',
    name: 'BitLocker暗号化の総合管理',
    category: 'security',
    level: 'admin',
    desc: 'ドライブのBitLocker暗号化の進捗確認、保護の一時停止・再開、回復キーのバックアップを行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/manage-bde',
    presets: [
      { label: '全ドライブのBitLocker暗号化状態を確認', args: '-status' },
      { label: 'Cドライブの回復パスワード（48桁キー）を表示', args: '-protectors -get C:' },
      { label: 'Cドライブの保護を一時中断 (BIOS更新時など)', args: '-protectors -disable C:' },
      { label: 'Cドライブの保護を再開', args: '-protectors -enable C:' }
    ],
    defaultArgs: '-status'
  },
  {
    cmd: 'md',
    name: '新しいフォルダの作成',
    category: 'file',
    level: 'beginner',
    desc: '新しいフォルダ（ディレクトリ）を作成します。深い階層もまとめて一度に作成可能です。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/md',
    presets: [
      { label: 'フォルダを1つ作成', args: '"NewFolder"' },
      { label: '親フォルダも含めて深い階層を一発作成', args: '"C:\\Projects\\2026\\Q1"' }
    ],
    defaultArgs: '"NewFolder"'
  },
  {
    cmd: 'mklink',
    name: 'シンボリックリンク・ショートカットの作成',
    category: 'file',
    level: 'admin',
    desc: 'ファイルやフォルダの実体を移動することなく、別の場所にあるかのように見せるリンクを作成します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/mklink',
    presets: [
      { label: 'フォルダのシンボリックリンクを作成', args: '/D "C:\\LinkDir" "D:\\ActualDir"' },
      { label: 'ファイルのシンボリックリンクを作成', args: '"C:\\link.txt" "D:\\actual.txt"' },
      { label: 'ディレクトリエイリアス(ジャンクション)を作成 (管理者不要)', args: '/J "C:\\Junction" "D:\\TargetFolder"' }
    ],
    defaultArgs: '/J "Link" "Target"'
  },
  {
    cmd: 'mode',
    name: 'COMポートやコンソールの設定',
    category: 'system',
    level: 'beginner',
    desc: 'コマンドプロンプトの文字数・行数サイズや、シリアル通信(COMポート)のボーレートを設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/mode',
    presets: [
      { label: 'コンソール画面の幅を120文字・縦を40行に拡大', args: 'con: cols=120 lines=40' },
      { label: '現在のデバイス状態を表示', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'more',
    name: 'テキストを1画面ずつページ送り表示',
    category: 'file',
    level: 'beginner',
    desc: '長いテキストファイルや出力結果を、スペースキーで1画面ずつスクロールしながら閲覧します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/more',
    presets: [
      { label: 'ファイルの内容をページ送りしながら表示', args: '"large_log.txt"' }
    ],
    defaultArgs: '"large_log.txt"'
  },
  {
    cmd: 'mountvol',
    name: 'ボリュームマウントポイントの作成・照会',
    category: 'disk',
    level: 'admin',
    desc: 'ドライブ文字（D:など）を使わずに、特定の空フォルダに別のHDDボリュームを接続マウントします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/mountvol',
    presets: [
      { label: '認識されているボリュームの固有GUID一覧を表示', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'move',
    name: 'ファイルの移動・名前変更',
    category: 'file',
    level: 'beginner',
    desc: '1つ以上のファイルを別のフォルダへ移動したり、フォルダ名を変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/move',
    presets: [
      { label: 'ファイルを別フォルダへ移動', args: '"data.csv" "C:\\Processed\\"' },
      { label: 'フォルダ名を変更', args: '"OldFolderName" "NewFolderName"' }
    ],
    defaultArgs: '"source.txt" "destination.txt"'
  },
  {
    cmd: 'msg',
    name: 'ネットワーク内のユーザーへポップアップ送信',
    category: 'user',
    level: 'beginner',
    desc: '同じPCやLAN内の別セッションで作業しているユーザーの画面にダイアログメッセージを通知します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/msg',
    presets: [
      { label: '現在ログオンしている全ユーザーに通知を送信', args: '* "サーバーメンテナンスのため10分後に再起動します"' }
    ],
    defaultArgs: '* "Hello!"'
  },
  {
    cmd: 'msiexec',
    name: 'Windowsインストーラー(.msi)のサイレント実行',
    category: 'system',
    level: 'admin',
    desc: 'MSIパッケージをバックグラウンド（画面なしサイレント）で自動インストール・削除します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/msiexec',
    presets: [
      { label: 'インストーラーを完全無人サイレントで実行', args: '/i "setup.msi" /qn /norestart' },
      { label: '詳細ログをテキストに出力しながらインストール', args: '/i "setup.msi" /L*v "install.log"' },
      { label: '製品をアンインストール', args: '/x "setup.msi" /qn' }
    ],
    defaultArgs: '/i "setup.msi" /qn'
  },
  {
    cmd: 'msinfo32',
    name: 'システム情報ツールの起動・レポート出力',
    category: 'system',
    level: 'beginner',
    desc: 'ハードウェアリソース、コンポーネント、OSバージョンなどの超詳細なシステム情報をGUIで表示・ファイル出力します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/msinfo32',
    presets: [
      { label: 'システム情報ウィンドウを起動', args: '' },
      { label: 'システム情報をテキストファイルにエクスポート', args: '/report "sysinfo_report.txt"' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'mstsc',
    name: 'リモートデスクトップ接続クライアント',
    category: 'network',
    level: 'beginner',
    desc: '別のWindows PCやWindows Serverにリモートデスクトップ(RDP)接続する画面を起動します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/mstsc',
    presets: [
      { label: 'リモートデスクトップ画面を起動', args: '' },
      { label: '指定したサーバーにフルスクリーンで接続', args: '/v:192.168.1.100 /f' },
      { label: '保存されたRDP接続設定ファイルを開く', args: '"server.rdp"' }
    ],
    defaultArgs: ''
  },

  // ================= N =================
  {
    cmd: 'nbtstat',
    name: 'NetBIOS over TCP/IP 統計・名前解決',
    category: 'network',
    level: 'beginner',
    desc: 'Windows LAN内のコンピューター名(NetBIOS名)の解決状態や名前キャッシュを確認します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/nbtstat',
    presets: [
      { label: 'ローカルのNetBIOS名前テーブルを表示', args: '-n' },
      { label: '指定IPのNetBIOS名(PC名)を調べる', args: '-A 192.168.1.100' },
      { label: '名前キャッシュをクリアして再読み込み', args: '-R' }
    ],
    defaultArgs: '-n'
  },
  {
    cmd: 'net',
    name: 'ネットワーク・共有フォルダ・ユーザー総合管理',
    category: 'admin',
    level: 'beginner',
    desc: 'ローカルユーザーの確認、共有フォルダの接続・切断、Windowsサービスの開始・停止などを行う基本コマンドです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/net-commands',
    presets: [
      { label: '登録されている全ユーザーアカウント一覧', args: 'user' },
      { label: 'ネットワーク共有フォルダの一覧を表示', args: 'share' },
      { label: '現在接続しているネットワークドライブ一覧', args: 'use' },
      { label: 'ネットワークドライブをZドライブに割り当て', args: 'use Z: "\\\\server\\share" /persistent:yes' },
      { label: 'ネットワークドライブを切断', args: 'use Z: /delete' }
    ],
    defaultArgs: 'user'
  },
  {
    cmd: 'netcfg',
    name: 'ネットワークプロトコル・アダプター管理',
    category: 'network',
    level: 'admin',
    desc: 'ネットワークコンポーネント（プロトコル、サービス、ドライバー）のインストール・照会を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/netcfg',
    presets: [
      { label: 'インストール済みネットワークコンポーネント一覧', args: '-s n' }
    ],
    defaultArgs: '-s n'
  },
  {
    cmd: 'netsh',
    name: 'ネットワーク総合制御 (Wi-Fi・ファイアウォール・IP)',
    category: 'network',
    level: 'admin',
    desc: 'Wi-Fiパスワード照会、ファイアウォール設定、静的IP/DHCP設定、TCP/IPスタックのリセットを行う超万能ツールです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/netsh',
    presets: [
      { label: '保存済みWi-FiのSSID一覧を表示', args: 'wlan show profiles' },
      { label: 'Windowsファイアウォールの状態を表示', args: 'advfirewall show allprofiles' },
      { label: 'ネットワークの通信不具合時にTCP/IPをリセット', args: 'int ip reset' },
      { label: 'Winsockプロトコルカタログをリセット', args: 'winsock reset' }
    ],
    defaultArgs: 'wlan show profiles'
  },
  {
    cmd: 'netstat',
    name: '開いている通信ポート・接続中ホストの調査',
    category: 'network',
    level: 'beginner',
    desc: '現在パソコンが通信している接続先IPアドレス、待ち受け中(LISTEN)のポート、対応するプロセスIDを調査します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/netstat',
    presets: [
      { label: '待ち受け中ポートと接続先IPをプロセスID付きで一覧表示', args: '-ano' },
      { label: '通信統計サマリーを表示', args: '-e' },
      { label: 'ルーティングテーブルを表示', args: '-r' }
    ],
    defaultArgs: '-ano'
  },
  {
    cmd: 'nltest',
    name: 'ドメイン信頼関係・セキュアチャネルの検証',
    category: 'admin',
    level: 'admin',
    desc: 'Active Directoryドメインコントローラーへの接続性、信頼関係、セキュアチャネルの健全性を検証します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/nltest',
    presets: [
      { label: '現在接続しているドメインコントローラーを特定', args: '/dsgetdc:' },
      { label: 'ドメインコントローラーとのセキュアチャネル接続をテスト', args: '/sc_query:corp.local' }
    ],
    defaultArgs: '/dsgetdc:'
  },
  {
    cmd: 'nslookup',
    name: 'DNS名前解決・ドメイン情報の照会',
    category: 'network',
    level: 'beginner',
    desc: 'ドメイン名（例: google.com）のIPアドレスや、IPアドレスからの逆引き、MXレコードなどをDNSサーバーに問い合わせます。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/nslookup',
    presets: [
      { label: '特定ドメインのIPアドレスを調べる', args: 'google.com' },
      { label: 'GoogleのパブリックDNS(8.8.8.8)を指定して問い合わせ', args: 'google.com 8.8.8.8' },
      { label: 'メールサーバー(MXレコード)を照会', args: '-type=MX google.com' }
    ],
    defaultArgs: 'google.com'
  },

  // ================= O =================
  {
    cmd: 'openfiles',
    name: '共有ファイルを開いているユーザーの確認・切断',
    category: 'admin',
    level: 'admin',
    desc: 'ファイルサーバー等でネットワーク経由で誰がどのファイルを開いてロックしているかを確認・強制切断します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/openfiles',
    presets: [
      { label: '現在ネットワーク経由で開かれているファイル一覧', args: '/query /fo table' },
      { label: '開かれているファイルを切断してロック解除', args: '/disconnect /id *' }
    ],
    defaultArgs: '/query /fo table'
  },

  // ================= P =================
  {
    cmd: 'path',
    name: 'コマンド検索パス(PATH)の表示・設定',
    category: 'system',
    level: 'beginner',
    desc: 'コマンドを実行するときにファイルを探すPATH環境変数を現在のセッションで確認・設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/path',
    presets: [
      { label: '現在のPATH設定を表示', args: '' },
      { label: '指定フォルダをPATHの先頭に追加', args: 'C:\\tools;%PATH%' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'pathping',
    name: '経路診断とパケットロス率の詳細測定',
    category: 'network',
    level: 'beginner',
    desc: 'pingとtracerouteを合体させ、宛先に至る各ルーターでの通信遅延とパケット損失率を精密測定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/pathping',
    presets: [
      { label: '名前解決を省略して高速に経路測定 (8.8.8.8)', args: '-n 8.8.8.8' },
      { label: '指定ドメインまでの通信品質を測定', args: 'google.com' }
    ],
    defaultArgs: '-n 8.8.8.8'
  },
  {
    cmd: 'pause',
    name: '処理の一時停止 (キー入力待機)',
    category: 'script',
    level: 'beginner',
    desc: '「続行するには何かキーを押してください...」と表示して処理を一時停止します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/pause',
    presets: [
      { label: '一時停止してユーザーのキー入力を待つ', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'ping',
    name: 'ネットワーク疎通確認 (ICMP)',
    category: 'network',
    level: 'beginner',
    desc: '指定したサーバーやルーターに通信パケットを送り、相手が応答しているか（ネットが繋がっているか）確認します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ping',
    presets: [
      { label: 'GoogleパブリックDNS(8.8.8.8)へ4回疎通確認', args: '8.8.8.8' },
      { label: 'ルーター(192.168.1.1)へ疎通確認', args: '192.168.1.1' },
      { label: 'Ctrl+Cを押すまでずっとpingを送り続ける (/t)', args: '8.8.8.8 -t' }
    ],
    defaultArgs: '8.8.8.8'
  },
  {
    cmd: 'pnputil',
    name: 'デバイスドライバーの追加・削除・バックアップ',
    category: 'system',
    level: 'admin',
    desc: 'Windowsのドライバーパッケージ（INFファイル）の一覧表示、新規登録、不要ドライバーの完全削除を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/pnputil',
    presets: [
      { label: 'インストールされているサードパーティ製ドライバー一覧', args: '/enum-drivers' },
      { label: 'PC内の全ドライバーを指定フォルダに丸ごとバックアップ', args: '/export-driver * "C:\\DriverBackup"' }
    ],
    defaultArgs: '/enum-drivers'
  },
  {
    cmd: 'powercfg',
    name: '電源プラン・バッテリー健全度・休止状態の制御',
    category: 'system',
    level: 'admin',
    desc: 'バッテリーの劣化具合（寿命）レポートを出力したり、スリープ・休止状態の有効/無効、電源プランを制御します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/powercfg',
    presets: [
      { label: 'バッテリー寿命レポートをデスクトップに出力', args: '/batteryreport /output "%USERPROFILE%\\Desktop\\battery.html"' },
      { label: '利用可能な電源プラン一覧を表示', args: '/list' },
      { label: 'PCがスリープに入らないようにする休止状態をオフ', args: '/hibernate off' },
      { label: '休止状態を有効化', args: '/hibernate on' }
    ],
    defaultArgs: '/batteryreport /output "%USERPROFILE%\\Desktop\\battery.html"'
  },
  {
    cmd: 'pushd',
    name: '作業フォルダの保存と移動',
    category: 'file',
    level: 'beginner',
    desc: '現在のフォルダ位置を記憶スタックに保存し、指定フォルダへ移動します（popdで元の位置に戻れます）。ネットワークパスも一時ドライブ化して移動可能です。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/pushd',
    presets: [
      { label: 'フォルダを記憶して移動', args: '"C:\\temp"' },
      { label: 'ネットワーク共有フォルダへ移動 (自動ドライブ割り当て)', args: '"\\\\server\\share"' }
    ],
    defaultArgs: '"C:\\temp"'
  },
  {
    cmd: 'popd',
    name: '記憶した元のフォルダに戻る',
    category: 'file',
    level: 'beginner',
    desc: 'pushdコマンドで記憶しておいた前のフォルダに瞬時に戻ります。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/popd',
    presets: [
      { label: 'pushd前のフォルダに戻る', args: '' }
    ],
    defaultArgs: ''
  },

  // ================= Q =================
  {
    cmd: 'qprocess',
    name: '実行中プロセスの照会 (ターミナルサーバー)',
    category: 'system',
    level: 'beginner',
    desc: '特定ユーザーやシステム全体で実行中のプロセスに関する情報を一覧表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/qprocess',
    presets: [
      { label: '全ユーザーのプロセス一覧を表示', args: '*' }
    ],
    defaultArgs: '*'
  },
  {
    cmd: 'quser',
    name: 'ログオン中ユーザーの一覧とアイドル時間',
    category: 'user',
    level: 'beginner',
    desc: '現在このPCやサーバーにサインインしているユーザーの名前、セッションID、無操作時間（アイドル時間）を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/quser',
    presets: [
      { label: 'サインイン中の全ユーザー一覧を表示', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'qwinsta',
    name: 'リモートデスクトップセッションの状態一覧',
    category: 'admin',
    level: 'beginner',
    desc: 'リモートデスクトップのセッション一覧（アクティブ、切断中、リッスン中）を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/qwinsta',
    presets: [
      { label: '全セッション状態を表示', args: '' }
    ],
    defaultArgs: ''
  },

  // ================= R =================
  {
    cmd: 'rasdial',
    name: 'VPN接続・ダイヤルアップの開始・切断',
    category: 'network',
    level: 'beginner',
    desc: 'Windowsに登録されているVPN接続プロファイルをコマンドから自動で接続・切断します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/rasdial',
    presets: [
      { label: '現在接続中のVPN一覧を表示', args: '' },
      { label: '指定したVPNに接続', args: '"MyVPN" username password' },
      { label: '指定したVPNを切断', args: '"MyVPN" /disconnect' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'rd',
    name: 'フォルダ(ディレクトリ)の削除',
    category: 'file',
    level: 'beginner',
    desc: '指定したフォルダを削除します。中にファイルが入っていても一括でまるごと削除できます。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/rd',
    presets: [
      { label: '空のフォルダを削除', args: '"TargetFolder"' },
      { label: '中のファイルやサブフォルダも含めて確認なしで全削除', args: '/s /q "TargetFolder"' }
    ],
    defaultArgs: '"TargetFolder"'
  },
  {
    cmd: 'reagentc',
    name: '回復環境(Windows RE)の有効化・診断',
    category: 'system',
    level: 'admin',
    desc: 'Windowsが起動しなくなった時のための「回復環境 (Windows Recovery Environment)」の状態確認や有効化を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/reagentc',
    presets: [
      { label: '回復環境の状態（有効/無効）を確認', args: '/info' },
      { label: '回復環境を有効化', args: '/enable' },
      { label: '回復環境を無効化', args: '/disable' }
    ],
    defaultArgs: '/info'
  },
  {
    cmd: 'reg',
    name: 'レジストリの照会・追加・変更・バックアップ',
    category: 'system',
    level: 'admin',
    desc: 'Windowsの各種設定を司るレジストリの検索、キーの書き込み、値の変更、.regファイルへの書き出しを行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/reg',
    presets: [
      { label: '自動起動(Run)に登録されているプログラム一覧を照会', args: 'query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"' },
      { label: '指定レジストリキーを.regファイルにエクスポート', args: 'export "HKCU\\Software\\MyApp" "myapp_backup.reg" /y' },
      { label: 'レジストリに新しい文字列値を追加', args: 'add "HKCU\\Software\\MyApp" /v "Version" /t REG_SZ /d "1.0" /f' }
    ],
    defaultArgs: 'query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"'
  },
  {
    cmd: 'regsvr32',
    name: 'DLLやActiveXのレジストリ登録・解除',
    category: 'system',
    level: 'admin',
    desc: 'システムコンポーネントであるDLLファイルをWindowsに登録、または登録解除します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/regsvr32',
    presets: [
      { label: 'メッセージボックスを出さずにサイレント登録', args: '/s "component.dll"' },
      { label: 'DLLの登録を解除', args: '/u /s "component.dll"' }
    ],
    defaultArgs: '/s "component.dll"'
  },
  {
    cmd: 'ren',
    name: 'ファイルやフォルダの名前変更',
    category: 'file',
    level: 'beginner',
    desc: 'ファイル名やフォルダ名を新しい名前に変更します。ワイルドカードで拡張子の一括変更も可能です。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ren',
    presets: [
      { label: 'ファイル名を変更', args: '"oldname.txt" "newname.txt"' },
      { label: 'すべての.txtファイルの拡張子を.bakに一括変更', args: '*.txt *.bak' }
    ],
    defaultArgs: '"old.txt" "new.txt"'
  },
  {
    cmd: 'replace',
    name: 'ディレクトリ内のファイルを置換・更新',
    category: 'file',
    level: 'beginner',
    desc: '移動先にある同名ファイルのみを上書き更新したり、存在しない新しいファイルのみを追加コピーします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/replace',
    presets: [
      { label: '移動先にすでにある古いファイルのみを新しいファイルで更新', args: '"source\\*.*" "dest" /u' },
      { label: '移動先にまだ存在しない新規ファイルのみを追加コピー', args: '"source\\*.*" "dest" /a' }
    ],
    defaultArgs: '"source\\*.*" "dest" /u'
  },
  {
    cmd: 'robocopy',
    name: '大容量・高速・堅牢なフォルダミラーリング',
    category: 'file',
    level: 'beginner',
    desc: 'エラー時の自動再試行、差分高速コピー、フォルダの完全同一化（ミラーリング）ができるWindows最強のコピーツールです。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/robocopy',
    presets: [
      { label: 'フォルダを完全に同一化 (削除ファイルも同期反映)', args: '"C:\\Data" "D:\\Backup\\Data" /MIR /R:1 /W:1 /NP' },
      { label: '更新された新しいファイルのみを高速差分コピー', args: '"C:\\Data" "D:\\Backup\\Data" /E /XO /R:1 /W:1' },
      { label: 'マルチスレッド(8並列)で超高速コピー', args: '"C:\\Data" "D:\\Backup\\Data" /E /MT:8' }
    ],
    defaultArgs: '"source" "dest" /E'
  },
  {
    cmd: 'route',
    name: 'IPルーティングテーブルの確認・追加',
    category: 'network',
    level: 'admin',
    desc: 'ネットワークパケットがどのゲートウェイを経由して送られるかを決めるルーティングテーブルを管理します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/route_ws2008r2',
    presets: [
      { label: '現在のルーティングテーブル一覧を表示', args: 'print' },
      { label: '特定のネットワーク宛てパケットを別ゲートウェイへ向ける静的ルートを追加', args: 'add 10.0.0.0 mask 255.0.0.0 192.168.1.254' },
      { label: '追加した静的ルートを削除', args: 'delete 10.0.0.0' }
    ],
    defaultArgs: 'print'
  },
  {
    cmd: 'rundll32',
    name: 'DLL内の指定関数を実行 (Windows各種設定)',
    category: 'system',
    level: 'beginner',
    desc: 'WindowsのシステムDLLに定義されている各種設定画面や機能を直接コマンドから呼び出します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/rundll32',
    presets: [
      { label: 'PCをロックする (Win+Lと同じ)', args: 'user32.dll,LockWorkStation' },
      { label: 'システムの詳細プロパティ（環境変数画面など）を開く', args: 'sysdm.cpl,EditEnvironmentVariables' },
      { label: '印刷管理画面を開く', args: 'printui.dll,PrintUIEntry /?' }
    ],
    defaultArgs: 'user32.dll,LockWorkStation'
  },

  // ================= S =================
  {
    cmd: 'sc',
    name: 'Windowsサービス(バックグラウンド常駐)の管理',
    category: 'admin',
    level: 'admin',
    desc: 'Windowsのバックグラウンド常駐プログラム（サービス）の状態照会、開始、停止、自動起動設定を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/sc-config',
    presets: [
      { label: '実行中のサービス一覧を表示', args: 'query state= all' },
      { label: '特定サービスの状態を確認', args: 'query "wuauserv"' },
      { label: '指定サービスを開始', args: 'start "wuauserv"' },
      { label: '指定サービスを停止', args: 'stop "wuauserv"' },
      { label: 'サービスのスタートアップを「自動」に設定', args: 'config "wuauserv" start= auto' }
    ],
    defaultArgs: 'query'
  },
  {
    cmd: 'schtasks',
    name: 'タスクスケジューラ(自動定期実行)の管理',
    category: 'script',
    level: 'admin',
    desc: '「毎朝9時にスクリプトを動かす」「PC起動時にプログラムを動かす」などの自動実行タスクを作成・確認・削除します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/schtasks',
    presets: [
      { label: '登録されている全定期タスク一覧を表示', args: '/query /fo table' },
      { label: '毎日午前9時にバッチを実行するタスクを新規作成', args: '/create /tn "DailyBackup" /tr "C:\\scripts\\backup.bat" /sc daily /st 09:00' },
      { label: '登録したタスクを今すぐテスト実行', args: '/run /tn "DailyBackup"' },
      { label: 'タスクを削除', args: '/delete /tn "DailyBackup" /f' }
    ],
    defaultArgs: '/query /fo table'
  },
  {
    cmd: 'secedit',
    name: 'セキュリティテンプレートの適用と監査',
    category: 'security',
    level: 'admin',
    desc: 'Windowsのシステムセキュリティ基準（パスワードポリシー、ユーザー権利など）を一括適用または検証します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/secedit',
    presets: [
      { label: '現在のセキュリティ構成をデータベースと分析比較', args: '/analyze /db secedit.sdb' }
    ],
    defaultArgs: '/analyze /db secedit.sdb'
  },
  {
    cmd: 'set',
    name: '環境変数の確認・一時設定',
    category: 'system',
    level: 'beginner',
    desc: 'USERNAMEやTEMP、PATHなどの環境変数の一覧を表示したり、現在のシェル内で新しい変数を定義します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/set_1',
    presets: [
      { label: '現在の全環境変数を一覧表示', args: '' },
      { label: '名前が「USER」から始まる環境変数を抽出', args: 'USER' },
      { label: '一時的な変数を定義', args: 'MY_VAR=HelloWorld' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'setx',
    name: '環境変数の永続保存 (システム/ユーザー)',
    category: 'system',
    level: 'beginner',
    desc: 'PCを再起動したり新しいウィンドウを開いても消えない恒久的な環境変数をレジストリに保存します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/setx',
    presets: [
      { label: 'ユーザー環境変数を恒久保存', args: 'MY_KEY "SampleValue"' },
      { label: 'システム環境変数を恒久保存 (要管理者)', args: 'MY_SYS_KEY "Value" /M' }
    ],
    defaultArgs: 'MY_VAR "Value"'
  },
  {
    cmd: 'sfc',
    name: '破損したWindowsシステムファイルの自動修復',
    category: 'system',
    level: 'admin',
    desc: 'Windowsの重要な保護システムファイルが破損したり書き換えられていないかを全自動検証し、正規のファイルで修復します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/sfc',
    presets: [
      { label: 'システム全体の整合性を今すぐ検査して自動修復 (/scannow)', args: '/scannow' },
      { label: '修復は行わず検査のみ実施', args: '/verifyonly' }
    ],
    defaultArgs: '/scannow'
  },
  {
    cmd: 'shutdown',
    name: 'PCのシャットダウン・再起動・タイマー停止',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンを即座にまたは指定した秒数後にシャットダウン・再起動します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/shutdown',
    presets: [
      { label: '今すぐパソコンを再起動 (/r /t 0)', args: '/r /t 0' },
      { label: '今すぐパソコンの電源を完全に切る (/s /t 0)', args: '/s /t 0' },
      { label: 'UEFI/BIOS設定画面へ再起動する', args: '/r /fw /t 0' },
      { label: '予約されたシャットダウンを直前にキャンセル', args: '/a' }
    ],
    defaultArgs: '/s /t 60'
  },
  {
    cmd: 'sort',
    name: 'テキスト行の並べ替え (ソート)',
    category: 'file',
    level: 'beginner',
    desc: 'テキストファイルの中身を行単位でアルファベット順・数値順に並べ替えて出力します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/sort',
    presets: [
      { label: 'ファイルを昇順ソートして表示', args: '"names.txt"' },
      { label: '降順（逆順）でソート', args: '/r "names.txt"' }
    ],
    defaultArgs: '"names.txt"'
  },
  {
    cmd: 'start',
    name: 'プログラムやWebサイトを別ウィンドウで開く',
    category: 'system',
    level: 'beginner',
    desc: '指定したアプリやURL、フォルダを既定のプログラムを使ってバックグラウンドや別ウィンドウで起動します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/start',
    presets: [
      { label: 'ブラウザでWebサイトを開く', args: 'https://google.com' },
      { label: '現在のフォルダをエクスプローラーで開く', args: '.' },
      { label: 'メモ帳を起動', args: 'notepad.exe' }
    ],
    defaultArgs: 'https://google.com'
  },
  {
    cmd: 'subst',
    name: 'フォルダを仮想ドライブ文字(Z:など)に割り当て',
    category: 'disk',
    level: 'beginner',
    desc: '深い階層にあるフォルダ（例: C:\\Users\\...\\Projects）に「Z:」などのドライブレターを割り当ててアクセスを簡単にします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/subst',
    presets: [
      { label: '現在の仮想ドライブ割り当て一覧を表示', args: '' },
      { label: 'フォルダをZドライブとして割り当て', args: 'Z: "C:\\Projects"' },
      { label: 'Zドライブの割り当てを解除', args: 'Z: /d' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'systeminfo',
    name: 'OS・ハードウェア・稼働時間の総合スペック表示',
    category: 'system',
    level: 'beginner',
    desc: 'WindowsのOSバージョン、CPU、搭載メモリ容量、PC起動日時（稼働時間）、適用済みパッチ一覧を丸ごと取得します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/systeminfo',
    presets: [
      { label: 'システムスペックをすべて表示', args: '' },
      { label: 'CSV形式で出力', args: '/fo csv' }
    ],
    defaultArgs: ''
  },

  // ================= T =================
  {
    cmd: 'takeown',
    name: 'アクセス拒否されたファイルの所有権奪還',
    category: 'security',
    level: 'admin',
    desc: 'アクセス権が壊れたり拒否されたファイルやフォルダの所有権を、現在の管理者に強制的に移譲します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/takeown',
    presets: [
      { label: '指定フォルダと全配下ファイルの所有権を管理者に一括変更', args: '/f "C:\\LockedFolder" /r /d y' }
    ],
    defaultArgs: '/f "target" /r /d y'
  },
  {
    cmd: 'tasklist',
    name: '実行中プロセスの一覧とメモリ使用量確認',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンで現在動いているすべてのアプリやバックグラウンドタスクの名前、PID、メモリ消費量を一覧表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/tasklist',
    presets: [
      { label: 'すべての実行中プロセスを表示', args: '' },
      { label: 'メモリを100MB以上使っている重いプロセスのみ抽出', args: '/fi "MEMUSAGE gt 102400"' },
      { label: '各プロセスが読み込んでいるDLL一覧も表示', args: '/m' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'taskkill',
    name: 'フリーズしたプロセスの強制終了',
    category: 'system',
    level: 'beginner',
    desc: '応答しなくなったアプリや不要なバックグラウンドプロセスを、名前やプロセスID(PID)で強制的に終了します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/taskkill',
    presets: [
      { label: 'プロセス名で強制終了 (例: notepad.exe)', args: '/im notepad.exe /f' },
      { label: 'プロセスID(PID)を指定して子プロセスも含めてツリー強制終了', args: '/pid 1234 /t /f' }
    ],
    defaultArgs: '/im notepad.exe /f'
  },
  {
    cmd: 'telnet',
    name: 'Telnet接続・TCPポート疎通テスト',
    category: 'network',
    level: 'beginner',
    desc: '指定したIPアドレスとポート番号（例: 80や443）に接続し、サービスが待ち受けているかテストします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/telnet',
    presets: [
      { label: 'Webサーバーの80番ポート疎通テスト', args: 'example.com 80' }
    ],
    defaultArgs: 'example.com 80'
  },
  {
    cmd: 'time',
    name: 'システム時刻の確認・変更',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンの現在の時刻を表示、または手動で設定します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/time',
    presets: [
      { label: '現在時刻のみ表示（時刻変更プロンプトを出さない）', args: '/t' }
    ],
    defaultArgs: '/t'
  },
  {
    cmd: 'timeout',
    name: '指定秒数だけ処理を一時停止 (ウェイトタイマー)',
    category: 'script',
    level: 'beginner',
    desc: 'バッチ処理中に指定した秒数（例: 10秒）だけ待機します。途中でキーを押してスキップすることも可能です。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/timeout',
    presets: [
      { label: '5秒間カウントダウン待機 (キーでスキップ可)', args: '5' },
      { label: 'キーボード入力を無視して必ず10秒待機 (/nobreak)', args: '/t 10 /nobreak' }
    ],
    defaultArgs: '5'
  },
  {
    cmd: 'title',
    name: 'ウィンドウのタイトル文字変更',
    category: 'script',
    level: 'beginner',
    desc: 'コマンドプロンプト画面のタイトルバーに好みの文字列を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/title',
    presets: [
      { label: 'タイトルバーを変更', args: 'My Batch Workflow' }
    ],
    defaultArgs: 'My Shell Task'
  },
  {
    cmd: 'tracert',
    name: '目的のサーバーまでの通信経路(ホップ)追跡',
    category: 'network',
    level: 'beginner',
    desc: 'パケットがインターネットのどのルーターを経由して目的地に届いているかを1台ずつ順番に調査します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/tracert',
    presets: [
      { label: 'Googleまでの経路を調査', args: 'google.com' },
      { label: 'DNS逆引きを省略して高速に追跡 (/d)', args: '-d 8.8.8.8' }
    ],
    defaultArgs: '-d 8.8.8.8'
  },
  {
    cmd: 'tree',
    name: 'フォルダ階層を視覚的なツリー図で表示',
    category: 'file',
    level: 'beginner',
    desc: 'フォルダやサブフォルダの親子構造をグラフィカルなアスキーアートの木構造ツリーで表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/tree',
    presets: [
      { label: 'フォルダ構造のみツリー表示', args: '' },
      { label: 'ファイル名も含めて全ツリー表示 (/f)', args: '/f' },
      { label: 'ASCII文字のみでシンプルに表示 (/a)', args: '/a /f' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'type',
    name: 'テキストファイルの内容表示 (Linuxのcat相当)',
    category: 'file',
    level: 'beginner',
    desc: 'テキストファイルの中身をコマンドライン画面に出力します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/type',
    presets: [
      { label: 'ファイルの中身を表示', args: '"sample.txt"' }
    ],
    defaultArgs: '"sample.txt"'
  },
  {
    cmd: 'tzutil',
    name: 'Windowsのタイムゾーン確認・変更',
    category: 'system',
    level: 'beginner',
    desc: 'パソコンの標準時タイムゾーン（例: Tokyo Standard Time / 日本標準時）を表示・変更します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/tzutil',
    presets: [
      { label: '現在のタイムゾーンを表示', args: '/g' },
      { label: '利用可能な全タイムゾーン一覧を表示', args: '/l' },
      { label: '日本標準時(JST)に設定', args: '/s "Tokyo Standard Time"' }
    ],
    defaultArgs: '/g'
  },

  // ================= V =================
  {
    cmd: 'vaultcmd',
    name: 'Windows資格情報コンテナー管理',
    category: 'security',
    level: 'admin',
    desc: 'Webブラウザやアプリが利用するWindows資格情報保管庫（Vault）の照会や管理を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/vaultcmd',
    presets: [
      { label: '利用可能な資格情報コンテナー一覧を表示', args: '/list' }
    ],
    defaultArgs: '/list'
  },
  {
    cmd: 'ver',
    name: 'Windows OSバージョンの確認',
    category: 'system',
    level: 'beginner',
    desc: '現在実行しているWindowsの内部ビルドバージョン番号を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/ver',
    presets: [
      { label: 'OSバージョンを表示', args: '' }
    ],
    defaultArgs: ''
  },
  {
    cmd: 'vol',
    name: 'ドライブのラベルとシリアル番号表示',
    category: 'disk',
    level: 'beginner',
    desc: '指定したディスクボリュームの名前（ラベル）と製造シリアル番号を表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/vol',
    presets: [
      { label: 'Cドライブのボリューム情報を表示', args: 'C:' }
    ],
    defaultArgs: 'C:'
  },
  {
    cmd: 'vssadmin',
    name: 'ボリュームシャドウコピー(スナップショット)管理',
    category: 'admin',
    level: 'admin',
    desc: 'Windowsの復元ポイントやシャドウコピー（バックアップスナップショット）の作成・照会・削除を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/vssadmin',
    presets: [
      { label: '保存されているシャドウコピー一覧を表示', args: 'list shadows' },
      { label: 'シャドウコピーのストレージ割り当て容量を確認', args: 'list shadowstorage' },
      { label: '登録されているVSSプロバイダー一覧', args: 'list providers' }
    ],
    defaultArgs: 'list shadows'
  },

  // ================= W =================
  {
    cmd: 'w32tm',
    name: 'Windows時刻同期(NTP)の診断・強制同期',
    category: 'admin',
    level: 'admin',
    desc: 'パソコンの時計がズレている時に、NTPサーバーと通信して強制的に正確な時刻に再同期します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/w32tm',
    presets: [
      { label: 'NTP時刻同期を今すぐ強制実行 (/resync)', args: '/resync' },
      { label: '現在参照している時刻同期先サーバーの状況を確認', args: '/query /status' }
    ],
    defaultArgs: '/query /status'
  },
  {
    cmd: 'wbadmin',
    name: 'Windows Serverバックアップの作成・管理',
    category: 'admin',
    level: 'admin',
    desc: 'OS全体やベアメタル回復用バックアップの作成・ステータス確認を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/wbadmin',
    presets: [
      { label: '実行中のバックアップジョブの状態を表示', args: 'get status' },
      { label: '過去に作成したバックアップの一覧を表示', args: 'get versions' }
    ],
    defaultArgs: 'get status'
  },
  {
    cmd: 'wevtutil',
    name: 'Windowsイベントログの照会・エクスポート・消去',
    category: 'admin',
    level: 'admin',
    desc: 'SystemやApplicationイベントログからエラーや警告を抽出したり、ログの完全バックアップ・消去を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/wevtutil',
    presets: [
      { label: 'Systemログから直近5件のエラーのみ取得', args: 'qe System "/q:*[System[(Level=2)]]" /f:text /c:5 /rd:true' },
      { label: '登録されているすべてのイベントログ一覧を表示', args: 'enum-logs' },
      { label: '指定したログをEVTXファイルに保存エクスポート', args: 'epl Application "C:\\temp\\app_backup.evtx"' }
    ],
    defaultArgs: 'qe System "/q:*[System[(Level=2)]]" /f:text /c:5 /rd:true'
  },
  {
    cmd: 'where',
    name: '実行可能ファイルのフルパス検索 (Linuxのwhich相当)',
    category: 'system',
    level: 'beginner',
    desc: 'コマンド名（例: node, python, git, code）がPCのどこにインストールされているか実体パスを瞬時に検索します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/where',
    presets: [
      { label: 'gitコマンドのインストール先を検索', args: 'git' },
      { label: 'pythonの実行ファイルパスを検索', args: 'python' },
      { label: '指定フォルダ内で拡張子.exeのファイルを全検索', args: '/r "C:\\tools" *.exe' }
    ],
    defaultArgs: 'python'
  },
  {
    cmd: 'whoami',
    name: '現在ログオン中のユーザー名・所属グループ・特権',
    category: 'user',
    level: 'beginner',
    desc: '自分が今どのユーザー名（ドメイン名\\ユーザー名）でログオンしているか、管理者特権を持っているかを表示します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/whoami',
    presets: [
      { label: '現在のユーザー名のみ表示', args: '' },
      { label: 'ユーザーのSID、所属グループ、権限特権をすべて一覧表示 (/all)', args: '/all' },
      { label: '所属しているセキュリティグループ一覧を表示', args: '/groups' },
      { label: '保持している特権一覧（管理者権限の有無）を表示', args: '/priv' }
    ],
    defaultArgs: '/all'
  },
  {
    cmd: 'windiff',
    name: 'GUIでのファイル・フォルダ差分比較',
    category: 'file',
    level: 'beginner',
    desc: '2つのファイルやフォルダの中身の違いをGUIウィンドウでグラフィカルに比較します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/windiff',
    presets: [
      { label: '2つのフォルダの違いを比較', args: '"C:\\Folder1" "C:\\Folder2"' }
    ],
    defaultArgs: '"C:\\Folder1" "C:\\Folder2"'
  },
  {
    cmd: 'winrm',
    name: 'Windows Remote Management (WinRM) の構成',
    category: 'admin',
    level: 'admin',
    desc: 'リモートからPowerShellやコマンドを実行できるようにするためのWinRMリスナー設定を行います。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/winrm',
    presets: [
      { label: 'WinRMのクイック自動セットアップ (推奨設定)', args: 'quickconfig' },
      { label: 'WinRMリスナーの一覧と設定内容を表示', args: 'enumerate winrm/config/listener' }
    ],
    defaultArgs: 'enumerate winrm/config/listener'
  },
  {
    cmd: 'winrs',
    name: 'WinRM経由でのリモートコマンド実行',
    category: 'admin',
    level: 'admin',
    desc: 'SSHのように、遠隔地にあるWindows PCやサーバー上でコマンドをリモート実行して結果を受け取ります。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/winrs',
    presets: [
      { label: 'リモートサーバー上でipconfigを実行', args: '-r:Server01 ipconfig' },
      { label: '別ユーザー資格情報を指定して実行', args: '-r:Server01 -u:Admin -p:Password "dir C:\\"' }
    ],
    defaultArgs: '-r:Server01 ipconfig'
  },
  {
    cmd: 'winsat',
    name: 'PCハードウェア性能評価 (Windowsベンチマーク)',
    category: 'system',
    level: 'admin',
    desc: 'CPU演算、3Dグラフィックス、メモリ帯域、ディスクの読み書き速度を測定してスコア（旧Windowsエクスペリエンスインデックス）を算出します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/winsat',
    presets: [
      { label: 'Cドライブのディスク読み書き速度を測定', args: 'disk -drive c' },
      { label: 'メモリ帯域幅をベンチマーク測定', args: 'mem' },
      { label: '総合スペックをフル評価', args: 'formal' }
    ],
    defaultArgs: 'disk -drive c'
  },
  {
    cmd: 'wmic',
    name: 'WMIによるシステムハードウェア・ソフト詳細情報',
    category: 'system',
    level: 'admin',
    desc: 'マザーボードの型番、BIOSバージョン、CPU型番、シリアルナンバーなどをWMI経由で直接照会します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/wmic',
    presets: [
      { label: 'BIOSの製造元とシリアル番号を取得', args: 'bios get Manufacturer,Name,SerialNumber' },
      { label: 'CPUの型番とコア数を取得', args: 'cpu get Name,NumberOfCores,NumberOfLogicalProcessors' },
      { label: 'マザーボードの型番を取得', args: 'baseboard get Product,Manufacturer' },
      { label: 'インストール済みメモリ(RAM)の容量と速度を表示', args: 'memorychip get Capacity,Speed,Manufacturer' }
    ],
    defaultArgs: 'bios get Manufacturer,Name,SerialNumber'
  },
  {
    cmd: 'wscript',
    name: 'VBScript/JScriptのGUI実行',
    category: 'script',
    level: 'beginner',
    desc: 'Windows Script Hostを使ってポップアップダイアログを伴うスクリプトを実行します。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/wscript',
    presets: [
      { label: 'スクリプトファイルを実行', args: '"script.vbs"' }
    ],
    defaultArgs: '"script.vbs"'
  },

  // ================= X =================
  {
    cmd: 'xcopy',
    name: '高度な条件付きファイル・フォルダ一括コピー',
    category: 'file',
    level: 'beginner',
    desc: 'サブフォルダや空フォルダ、ファイル属性を保持したまま一括で安全に複製コピーします。',
    url: 'https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/xcopy',
    presets: [
      { label: 'サブフォルダや空フォルダも含めて丸ごとコピー (/e /h /y)', args: '"C:\\Data" "D:\\Backup\\Data" /e /h /y' },
      { label: '更新されたファイルのみを上書きコピー (/d)', args: '"C:\\Data" "D:\\Backup\\Data" /d /e /y' }
    ],
    defaultArgs: '"source" "dest" /e /h /y'
  }
];

const jsContent = `/**
 * Microsoft Windows Server & Client Commands (A to Z) 完全マスター辞書
 * 公式リファレンス準拠: https://learn.microsoft.com/ja-jp/windows-server/administration/windows-commands/windows-commands
 */
window.WINDOWS_ALL_COMMANDS = ${JSON.stringify(MS_COMMANDS, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../public/windows_commands_data.js'), jsContent, 'utf8');
console.log('Successfully generated public/windows_commands_data.js with ' + MS_COMMANDS.length + ' commands!');
