require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS（フロントエンドからの API 呼び出しを許可）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON ボディをパースするミドルウェア
app.use(express.json());

// MongoDB 接続（環境変数またはローカル）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB 連結成功');
  })
  .catch((err) => {
    console.error('MongoDB 連結エラー:', err.message);
  });

// タスクルーター（POST /tasks で作成）
app.use('/tasks', tasksRouter);
app.use('/users', usersRouter);

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nポート ${PORT} は既に使用中です。`);
    console.error(`別のプロセスを終了してから再起動してください。`);
    console.error(`Windows: netstat -ano | findstr :${PORT} で PID を確認 → taskkill /PID <番号> /F\n`);
    process.exit(1);
  }
  throw err;
});
