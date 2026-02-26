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

## Heroku へのデプロイ（ログイン API を含む最新コードを反映する場合）

`POST /users/login` が 404 になる場合は、Heroku 上のコードが古い可能性があります。以下で再デプロイしてください。

**Heroku CLI でデプロイする場合（バックエンド用リポジトリが別の場合）**

1. `todo-backend` フォルダで:
   ```bash
   git add .
   git commit -m "Add POST /users/login"
   git push heroku main
   ```
   （`heroku` リモートが未設定のとき: `heroku git:remote -a ahn-todo-backend-acce2db76095`）

**GitHub 連携でデプロイしている場合**

1. このリポジトリ（または Heroku が参照しているリポジトリ）に `todo-backend` の最新コードを push
2. Heroku のダッシュボードで「Deploy」タブから再デプロイ、または該当ブランチへ push して自動デプロイ

デプロイ後、`https://ahn-todo-backend-acce2db76095.herokuapp.com/users/login` に POST して 404 でなくなれば成功です。

## MongoDB Atlas を使用する場合

環境変数で接続文字列を指定:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster.xxxxx.mongodb.net/todolist" npm start
```
