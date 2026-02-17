# My Todos - タスク管理アプリ

ToDo管理アプリケーション（HTML, CSS, JavaScript）

## 機能

- **Ongoing / Completed / Trashed** の3カラムでタスクを管理
- タスクの追加・完了・ゴミ箱への移動・復元
- スライドパネルでのタスク編集（タイトル、説明、タグ）
- タグ: urgent, coding, personal, health, important
- モバイル対応のレスポンシブデザイン

## 起動方法

### Node.js で起動（推奨）

```bash
npm start
```

または

```bash
npm run dev
```

ローカルサーバーが `http://localhost:3000` で起動します。Firebase を使用するため、サーバー経由でのアクセスを推奨します。

### 直接開く場合

`html-css-js-demo/index.html` をブラウザで開く

## 必要環境

- Node.js 18 以上
- npm（Node.js に同梱）

## ファイル構成

```
vibe-coding/
├── html-css-js-demo/
│   ├── index.html
│   ├── style.css
│   └── main.js
├── package.json
└── README.md
```
