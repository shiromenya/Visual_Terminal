# Contributing to Graphical Terminal

Thank you for your interest in contributing to **Graphical Terminal**!  
We welcome all kinds of contributions: new blocks, bug fixes, documentation, translation, and UI design improvements.

---

## 🚀 How to Add a New Block (5 Minutes)

You can easily contribute a new block by adding a definition to `public/app.js` under `BUILTIN_BLOCKS`:

```javascript
'your-block-id': {
  name: 'ブロックの表示名 (例: 画像をリサイズ)',
  category: 'file', // 'file' | 'text' | 'system' | 'git' | 'danger'
  fields: [
    {
      id: 'target',
      label: '対象ファイル',
      type: 'text', // 'text' or 'select'
      placeholder: '*.jpg',
      default: '*.png'
    }
  ],
  generateCommand: (params) => {
    // Return the PowerShell / shell command string
    return `magick convert "${params.target}" -resize 50% "output_${params.target}"`;
  }
}
```

---

## 🛠️ Local Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/graphical-terminal.git
   cd graphical-terminal
   ```

2. **Run the App**:
   - Double-click `start.bat` (Windows)
   - Or run `node server.js` in terminal.
   - Open your browser at `http://localhost:3456`.

---

## 🤝 Submitting a Pull Request (PR)

1. Create a feature branch:
   ```bash
   git checkout -b feature/add-new-block
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat: Add image resize block"
   ```
3. Push to your fork and open a Pull Request on GitHub!

We appreciate every single contribution, no matter how small!
