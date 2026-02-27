const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: '認証が必要です',
      error: 'トークンがありません',
    });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({
      message: '認証に失敗しました',
      error: 'トークンが無効または期限切れです',
    });
  }
}

router.use(auth);

// タスク一覧取得（全タスク）
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId, deletedAt: null }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      message: 'タスク取得に失敗しました',
      error: err.message,
    });
  }
});

// ゴミ箱一覧取得（論理削除済みタスク）
router.get('/trashed', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId, deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      message: 'ゴミ箱のタスク取得に失敗しました',
      error: err.message,
    });
  }
});

// やること一覧取得（未完了タスク）
router.get('/todo', async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId,
      deletedAt: null,
      status: { $ne: 'DONE' },
    }).sort({ createdAt: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      message: 'やること取得に失敗しました',
      error: err.message,
    });
  }
});

// タスク作成（保存）
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      user: req.userId,
      title,
      description,
      status,
      priority,
      dueDate,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({
      message: 'タスク作成に失敗しました',
      error: err.message,
    });
  }
});

// やること修正（タスク更新）
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const update = {
      title,
      description,
      status,
      priority,
      dueDate,
    };

    // undefined のフィールドは更新しないように削除
    Object.keys(update).forEach((key) => {
      if (update[key] === undefined) delete update[key];
    });

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId, deletedAt: null },
      { $set: update },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりませんでした' });
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({
      message: 'タスク更新に失敗しました',
      error: err.message,
    });
  }
});

// やること復元（ゴミ箱から戻す）
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりませんでした' });
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({
      message: 'タスクの復元に失敗しました',
      error: err.message,
    });
  }
});

// やること削除（論理削除 = ゴミ箱へ移動）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりませんでした' });
    }

    res.json({ message: 'タスクを削除しました', task });
  } catch (err) {
    res.status(400).json({
      message: 'タスク削除に失敗しました',
      error: err.message,
    });
  }
});

// やること完全削除（物理削除）
router.delete('/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりませんでした' });
    }

    res.json({ message: 'タスクを完全に削除しました' });
  } catch (err) {
    res.status(400).json({
      message: 'タスク削除に失敗しました',
      error: err.message,
    });
  }
});

module.exports = router;
