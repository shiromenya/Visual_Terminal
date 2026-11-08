# Visual Terminal

<div align="center">

### No-Code, Block-Based Visual Terminal & Workflow Automation
**黒い画面も英語のコマンドも不要。ブロックとノードを結線するだけで動くノーコード・ターミナル**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-brightgreen.svg)]()

[English](#english) | [日本語](#japanese)

</div>

---

<a name="japanese"></a>
## 概要 (Overview)

**Visual Terminal** は、コマンドライン（CLI）の難解な英語や構文を一切覚えることなく、ブロックを並べるだけで安全にPC操作や自動化を行える**ビジュアル開発・自動化ツール**です。

Scratchのような直感的な**リスト表示**と、ノードを結線してデータフローを構築する**フローグラフ表示（Node Mode）**の2大モードを自由に行き来しながら、Microsoft公式Windows全コマンド（300種類以上）やクロスプラットフォーム（macOS/Linux/WSL）の自動化スクリプトを思い通りに組み立てられます。

さらに、実行中に発生したエラーの根本的な仕組みや解決策を日本語で平易に解説する**「エラー解説アシスタント」**や、大規模フローをスッキリ整理できる**「サブフロー（グループ化）」**、**「DAG非同期並列実行エンジン」**を搭載。初心者からプロまで快適に自動化を活用できます。

---

## 主な機能 (Features)

### 1. 2つの編集モード（リスト ⇄ ノード結線図）
- **リストモード (Scratch風)**: 上から順に実行される直感的な積み上げレイアウト。
- **ノードモード (Flow Graph & DAG結線)**: パイプラインを視覚化する本格的なノード結線図。各ノードの出力端子（OUT）から入力端子（IN）へマウスで自由にドラッグ結線が可能。スムーズなベジェ曲線、自由なドラッグ配置、ズームイン/アウト、全体表示（Fit View）、自動グリッド整列を完備。

### 2. 📦 サブフロー（処理グループ化）
- 散らかった複数のブロックを1つのスッキリしたブロックにひとまとめ（フォルダ化）できるグループ化機能を搭載。
- クリックで中身をパカッと展開してパラメータ編集したり、ワンクリックでグループ解除（Ungroup）が可能。ノード結線図もクモの巣にならず常に整然と保たれます。

### 3. 初心者向け「エラー解説アシスタント」
- **左右スプリットビュー**: コマンドの実行結果ログを一切隠すことなく、横並びで解説を展開。
- **3段解説システム**:
  1. **仕組み（どんなエラー？）**: OSやネットワークの根本的な仕組みから平易に解説。
  2. **原因**: 今回のコマンド実行で具体的に何が引っかかったのかを特定。
  3. **対処方法**: 次に押すべきボタンや設定の変更手順を具体的に案内。
- 管理者権限不足、ファイル未検出、ポート競合、ファイルロックなど初心者が遭遇する典型エラーを自動判定。

### 4. Windows全コマンド図鑑（Microsoft公式 A〜Z 300+コマンド網羅）
- Microsoft公式リファレンス準拠の全コマンドを目的別・日常語で探せる逆引きカタログを内蔵。
- 難しい引数を知らなくてもドロップダウンからやりたいことを選ぶだけでオプションが自動セットされる**「スマート・プリセット」**を搭載。
- システム修復（`sfc`, `dism`）、ファイル同期（`robocopy`, `rsync`）、暗号化・完全抹消（`cipher`）、リアルタイム負荷計測（`typeperf`）、BitLocker状態確認（`manage-bde`）など、あらゆる操作に対応。

### 5. 🔀 独立カテゴリ（条件分岐・判定・フロー制御）
- `もし〜なら (If/Else)`、`ファイル存在判定 (Test-Path)`、`エラー安全ガード (try/catch)`、`[Y/N] キー選択待機`、`回数ループ`、`行ごとループ`、`ウェイトタイマー` を専用パープルカテゴリに集約。

### 6. プロフェッショナル機能（Google等大企業基準の運用機能）
- **DAG非同期並列実行エンジン**: 依存関係のない独立したノードを `Promise.all` で完全同時並行実行。
- **外部Webhook / ヘッドレス実行**: 外部システムやCI/CDから cURL、PowerShell、Python 経由でワークフローをリモート実行。
- **実行時間プロファイラー**: 各ブロックの所要時間をウォーターフォールチャートで可視化しボトルネックを特定。
- **世代スナップショット & Git風差分Diff**: ワークフローの履歴を自動記録し、差分のカラー比較とワンクリック復元を実現。
- **環境プロファイル切り替え**: Local / Staging / Production をワンクリック切替。`{HOST}` などを一発置換。
- **データパイプライン**: `{output}` や `{prev}` で先行ブロックの標準出力を後続ブロックへ直接パイプ。
- **ノード単位ブレークポイント**: 任意のブロックで一時停止し、ステップ実行（再開/次へ/中断）が可能。
- **定時自動実行 (Windowsタスクスケジューラ連携)**: 組み立てたワークフローを定時実行タスクとしてOSに自動登録。
- **スクリプト書き出し**: PowerShell (`.ps1`)、Bash (`.sh`)、バッチ (`.bat`) 形式で出力保存。
- **ゼロ依存アーキテクチャ**: 外部npmパッケージ不要。標準の `node server.js` だけで即座に起動。

---

## クイックスタート (Quick Start)

Node.js（v16以上推奨）がインストールされていれば、追加パッケージのインストール（`npm install`）は一切不要です。

### Windows (ワンクリック起動)
1. 本リポジトリをダウンロードまたはクローンします。
2. フォルダ内の `start.bat` をダブルクリックします。
3. 自動的にブラウザが立ち上がり、`http://localhost:3456` が開きます。

### macOS / Linux
```bash
git clone https://github.com/your-username/visual-terminal.git
cd visual-terminal
chmod +x start.sh
./start.sh
```

### 手動起動
```bash
node server.js
```
ブラウザで `http://localhost:3456` にアクセスしてください。

---

<a name="english"></a>
## English Summary

**Visual Terminal** is an intuitive visual interface that replaces black terminal screens and obscure CLI syntax with connecting blocks and pipeline node graphs.

### Highlights:
- **Dual Visual Modes**: Seamlessly switch between Scratch-like stack list and pipeline Node Graph with bezier wires, zoom, pan, and auto-alignment.
- **Subflow & Grouping**: Group multiple blocks into compact folder-like subflow containers. Expand to edit, ungroup anytime.
- **Error Diagnostics Assistant**: Splits the console pane side-by-side to explain errors in plain language (Mechanism, Cause, and Fix Action).
- **300+ Command Catalog (A to Z)**: Full Microsoft Windows Commands directory with beginner-friendly presets and MS Learn documentation links.
- **Condition & Flow Control**: Dedicated category for If/Else, file existence checks, try/catch safety, loops, and timeouts.
- **Professional Enterprise Features**: DAG parallel execution engine, external webhook execution (curl/pwsh/python), execution profiler waterfall charts, snapshot diff history, and environment profiles (Local/Staging/Prod).
- **Multi-Format Script Exporter**: Export visual workflows directly to PowerShell (`.ps1`), Bash (`.sh`), or Batch (`.bat`).
- **Zero Dependencies**: Pure vanilla JavaScript/Node.js with no external npm packages required.

---

## ライセンス (License)

MIT License. 商用利用・改変・再配布を自由に行っていただけます。
