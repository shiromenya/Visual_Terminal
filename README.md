# Graphical Terminal

<div align="center">

### No-Code, Visual Graphical Terminal & Workflow Automation
**黒い画面も英語のコマンドも不要。ブロックとノードを結線するだけで動くノーコード・ターミナル**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-brightgreen.svg)]()

[English](#english) | [日本語](#japanese)

</div>

---

<a name="japanese"></a>
## 概要 (Overview)

**Graphical Terminal** は、コマンドライン（CLI）の難解な英語や構文を一切覚えることなく、ブロックを並べるだけで安全にPC操作や自動化を行える**ビジュアル開発・自動化ツール**です。

Scratchのような直感的な**リスト表示**と、ノードを結線してデータフローを構築する**フローグラフ表示（Node Mode）**の2大モードを自由に行き来しながら、Windows標準の全280以上のコマンドや自動化スクリプトを思い通りに組み立てられます。

さらに、実行中に発生したエラーの根本的な仕組みや解決策を日本語で平易に解説する**「エラー解説アシスタント」**を搭載。初心者でも挫折することなく安全にコマンドラインのパワーを活用できます。

---

## 主な機能 (Features)

### 1. 2つの編集モード（リスト ⇄ ノード結線図）
- **リストモード (Scratch風)**: 上から順に実行される直感的な積み上げレイアウト。
- **ノードモード (Flow Graph)**: パイプラインを視覚化する本格的なノード結線図。スムーズなベジェ曲線ワイヤー、自由なドラッグ配置、ズームイン/アウト、全体表示（Fit View）、自動グリッド整列を完備。

### 2. 初心者向け「エラー解説アシスタント」
- **左右スプリットビュー**: コマンドの実行結果ログを一切隠すことなく、横並びで解説を展開。
- **3段解説システム**:
  1. **仕組み（どんなエラー？）**: OSやネットワークの根本的な仕組みから、なぜそのエラーが起きるのかを噛み砕いて解説。
  2. **原因**: 今回のコマンド実行で具体的に何が引っかかったのかを特定。
  3. **対処方法**: 次に押すべきボタンや設定の変更手順を具体的に案内。
- 管理者権限不足、ファイル・パス未検出、コマンド未登録、ポート競合、ファイルロック、実行ポリシー制限など、初心者が遭遇する典型的なエラーを自動判定。

### 3. Windows全コマンド図鑑（280+コマンド網羅）
- Microsoft公式のWindowsコマンドを目的別・日常語で探せる逆引きカタログを内蔵。
- システム修復（`sfc`, `dism`）、ファイル高速ミラー同期（`robocopy`）、空き容量一掃（`cleanmgr`）、リアルタイム負荷計測（`typeperf`）、BitLocker状態確認（`manage-bde`）など、あらゆる操作をワンクリックでキャンバスに追加可能。

### 4. プロフェッショナルな操作性と安全性
- **元に戻す / やり直し (Undo / Redo)**: `Ctrl+Z` / `Ctrl+Y` に完全対応。
- **ブロックの複製**: リスト・ノード双方でワンクリック複製可能。
- **ステップ実行**: 1ブロックずつ結果を確認しながら進められるステップ実行バー。
- **変数・秘密キー管理 (Secret Store)**: Webhook URLやAPIキーを安全に保存し、`{webhook_url}` 形式で自動置換。
- **実行履歴**: 過去の実行タスク成否と出力ログを記録。当時のブロック構成をワンクリックで復元。
- **スクリプト書き出し (Export)**: PowerShell (`.ps1`)、Bash (`.sh`)、バッチ (`.bat`) 形式でスクリプトを出力・保存。
- **レシピ共有 (JSON)**: 組み立てたワークフローをJSONファイルで保存・インポート。
- **危険操作ガードレール**: ファイル完全抹消やドライブ初期化など、重大な影響を及ぼすコマンドには事前動作予告（「このブロックを動かすと〇〇されます」）と確認モーダルを表示。
- **洗練されたデザイン**: 安っぽいカラー絵文字を完全撤廃し、VS Code / Linear スタイルのミニマルSVGベクターアイコンを採用。ダークモードとライトモードの両方に完全対応。

---

## クイックスタート (Quick Start)

Node.js（v16以上推奨）がインストールされていれば、追加パッケージのインストール（`npm install`）は一切不要です。純粋な標準機能のみで動作します。

### Windows (ワンクリック起動)
1. 本リポジトリをダウンロードまたはクローンします。
2. フォルダ内の `start.bat` をダブルクリックします。
3. 自動的にブラウザが立ち上がり、`http://localhost:3456` が開きます。

### macOS / Linux
```bash
git clone https://github.com/your-username/graphical-terminal.git
cd graphical-terminal
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

**Graphical Terminal** is an intuitive visual interface that replaces black terminal screens and obscure CLI syntax with visual connecting blocks and pipeline node graphs.

### Highlights:
- **Dual Visual Modes**: Seamlessly switch between Scratch-like stack list and pipeline Node Graph with bezier wires, zoom, pan, and auto-alignment.
- **Error Diagnostics Assistant**: Splits the console pane side-by-side to explain errors in plain language (Mechanism, Cause, and Fix Action) without hiding the actual command output.
- **280+ Command Catalog**: Built-in searchable reverse-lookup directory of standard Windows commands translated into plain intent-driven actions.
- **Undo / Redo & Duplication**: Full keyboard shortcut support (`Ctrl+Z`, `Ctrl+Y`) and instant node/block cloning.
- **Step-by-Step Execution**: Step through blocks one by one with visual execution highlights.
- **Secret Store & Dynamic Variables**: Store sensitive API keys safely and reference them with `{variable_name}`, alongside dynamic date tags like `{today}` and `{now}`.
- **Multi-Format Script Exporter**: Export visual workflows directly to PowerShell (`.ps1`), Bash (`.sh`), or Batch (`.bat`).
- **Modern Minimal Design**: Pure vector SVG line icons, zero third-party dependencies, and full dark/light theme support.

---

## ロードマップ (Roadmap)

- [x] **v0.1**: 基本ファイル操作、テキスト、Git、Zipブロック
- [x] **v0.2**: ドラッグ並べ替え、ポート調査、クリップボード連携
- [x] **v0.3**: 動的変数（`{today}`, `{now}`）、対話プロンプト、If/Else分岐
- [x] **v0.4**: ツリー表示、フォルダ同期、ネットワーク診断、タイマー電源
- [x] **v0.5**: Windows全280+コマンド逆引き図鑑、ノード結線図モード（Flow Graph）
- [x] **v0.6**: Undo/Redo、ブロック複製、実行履歴、秘密変数ストア、ステップ実行、スクリプト書き出し
- [x] **v0.7**: 日本語エラー解説アシスタント（スプリットビュー）、ダーク/ライトテーマ、SVGアイコン刷新
- [ ] **v1.0**: Tauriによるスタンドアロンデスクトップアプリ化（.exe / .dmg）

---

## ライセンス (License)

MIT License. 商用利用・改変・再配布を自由に行っていただけます。
