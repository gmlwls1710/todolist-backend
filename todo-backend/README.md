# Todo Backend

MongoDB を使用した ToDo バックエンドサーバー

## セットアップ

**重要: 必ず `todo-backend` フォルダ内で実行してください。**

1. エクスプローラーで `todo-backend` フォルダを右クリック → 「ターミナルで開く」
2. または Cursor で `todo-backend` フォルダを右クリック → 「Open in Integrated Terminal」

```bash
npm install
```

## 起動

```bash
npm start
```

※ `Cannot find module 'express'` が出る場合:
- **方法A**: `todo-backend` フォルダ内で `npm install` を実行
- **方法B**: `start.bat` をダブルクリックで起動（自動で npm install を実行）

- サーバー: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017/todolist`（デフォルト）

## MongoDB Atlas を使用する場合

環境変数で接続文字列を指定:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster.xxxxx.mongodb.net/todolist" npm start
```
