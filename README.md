# Graphical Terminal

<div align="center">

### No-Code, Block-Based Graphical Terminal for Everyone
**黒い画面も英語のコマンドも一切不要。ブロックを並べて繋ぐだけで動くノーコード・ターミナル**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

[English](#english) | [日本語](#日本語)

</div>

---

<a name="english"></a>
## 💡 Why Graphical Terminal?

Command-line interfaces (CLI) are powerful, but traditional terminals present huge barriers for beginners, non-engineers, and students:
- Complex command syntax and obscure flags (`tree`, `ipconfig`, `tracert`, `mkdir`, `move`)
- Constant fear of accidental file deletion
- Language barriers (almost all docs and error messages are in English)

**Graphical Terminal reimagines the terminal as a visual canvas.**  
Just like Scratch or Apple Shortcuts, users simply connect friendly action blocks. Under the hood, Graphical Terminal generates and safely executes standard shell commands.

---

## ✨ Features

- 🧱 **Zero Typing Required**: Build automation workflows by connecting intuitive blocks.
- 🌳 **Visual Tree & File Ops**: Explore folder hierarchies (`tree`), create folders (`mkdir`), move (`move`), and rename (`ren`).
- 🌐 **Network Diagnostics**: Inspect local IPv4 addresses (`ipconfig`), ping test, port checker, and route tracer (`tracert`).
- 🔌 **Timer Shutdown**: Schedule PC shutdown or restart in 10, 30, or 60 minutes (`shutdown`).
- 🖐️ **Drag & Drop Reordering**: Grab handles to reorder blocks effortlessly.
- 📅 **Smart Dynamic Variables**: Use `{today}` (YYYYMMDD), `{now}`, and `{input}` directly in any text box or file path.
- 💬 **Interactive User Prompt**: Ask questions during execution and use answers in downstream blocks.
- 🔀 **Full Logic Support**: If/Else conditional branches, ForEach loops, and repeat-count loops.
- 🔔 **Audio Alerts**: Plays a beep or fanfare chime upon task completion.
- 📋 **Clipboard Sync**: Instantly copy execution outputs to OS clipboard.
- 🛡️ **Safety Guardrails**: Auto-stop on errors, visual dry-run deletion confirmations, and Run-as-Administrator toggle.
- 👁️ **Peek Behind the Curtain**: Always see real-time PowerShell commands generated under each block.
- ⚡ **Zero Dependencies**: Pure vanilla HTML/CSS/JS & standard Node.js libraries. No npm install required.

---

## 🚀 Quick Start

### Windows (One-Click)
1. Clone or download this repo.
2. Double-click `start.bat`.
3. Your browser will automatically open `http://localhost:3456`.

### macOS / Linux (One-Click)
```bash
git clone https://github.com/your-username/graphical-terminal.git
cd graphical-terminal
chmod +x start.sh
./start.sh
```
Your browser will automatically open `http://localhost:3456`.

### Manual
```bash
node server.js
```
Open `http://localhost:3456` in any modern web browser.

---

<a name="日本語"></a>
## 🇯🇵 日本語概要

### なぜ Graphical Terminal なのか？
ターミナルやコマンドプロンプトは強力ですが、英語の略語や「間違えてファイルを消してしまう恐怖」など、初心者にとって高いハードルがあります。

Graphical Terminalは、**「コマンドのスペルを覚える必要のない、ブロックを繋ぐだけのターミナル」**です。

- **フォルダのツリー表示**: `tree` コマンドでフォルダ構造を木の枝の形で見やすく表示。
- **ファイル整理の完全網羅**: フォルダ作成（`mkdir`）、移動（`move`）、名前変更（`ren`）もすべてブロック化。
- **ネットワーク診断**: 自分のIPアドレス調査（`ipconfig`）や通信の通り道追跡（`tracert`）。
- **タイマー電源オフ**: 「30分後にパソコンの電源を切る（`shutdown`）」など日常で役立つ便利機能。
- **今日の日付を自動挿入**: ファイル名に `{today}` と書くだけで `backup_20261108.zip` のように自動変換。
- **ドラッグで並び替え**: マウスでブロックを掴んで自由に順番を入れ替えられます。

---

## 🗺️ Roadmap

- [x] **v0.1**: Core File, Text, Git, System, and Zip blocks
- [x] **v0.2**: Drag-and-drop reordering, Port checker, Audio alerts, Clipboard sync
- [x] **v0.3**: Dynamic variables (`{today}`), Interactive user prompts, If/Else branching
- [x] **v0.4**: Directory tree, mkdir/move/rename, IP config, route tracer, timer shutdown
- [ ] **v0.5**: Standalone desktop app (.exe / .dmg) via **Tauri**
- [ ] **v0.6**: Community plugin ecosystem (Share custom recipe blocks via JSON)

---

## 🤝 Contributing

We love contributions! Want to add a new block? Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started in under 5 minutes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
