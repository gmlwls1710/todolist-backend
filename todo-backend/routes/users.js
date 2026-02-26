const express = require('express');
const User = require('../models/user');

const router = express.Router();

// レスポンスから password を除外するヘルパー
function toSafeUser(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.password;
  return obj;
}

// ユーザー一覧取得
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: 'ユーザー一覧の取得に失敗しました',
      error: err.message,
    });
  }
});

// ユーザー1件取得
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりませんでした' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({
      message: 'ユーザー取得に失敗しました',
      error: err.message,
    });
  }
});

// ユーザー作成
router.post('/', async (req, res) => {
  try {
    const { email, name, password, user_type } = req.body;

    const user = await User.create({
      email,
      name,
      password,
      user_type,
    });

    res.status(201).json(toSafeUser(user));
  } catch (err) {
    res.status(400).json({
      message: 'ユーザー作成に失敗しました',
      error: err.message,
    });
  }
});

// ユーザー更新
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, user_type } = req.body;

    const update = { email, name, password, user_type };
    Object.keys(update).forEach((key) => {
      if (update[key] === undefined) delete update[key];
    });

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりませんでした' });
    }

    res.json(toSafeUser(user));
  } catch (err) {
    res.status(400).json({
      message: 'ユーザー更新に失敗しました',
      error: err.message,
    });
  }
});

// ユーザー削除
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりませんでした' });
    }

    res.json({ message: 'ユーザーを削除しました' });
  } catch (err) {
    res.status(400).json({
      message: 'ユーザー削除に失敗しました',
      error: err.message,
    });
  }
});

module.exports = router;
