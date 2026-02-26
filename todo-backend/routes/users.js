const express = require('express');
const bcrypt = require('bcryptjs');
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

// ログイン（メール・パスワード照合）
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNorm = (email && String(email).trim().toLowerCase()) || '';
    if (!emailNorm || password === undefined || password === null) {
      return res.status(400).json({
        message: 'メールアドレスとパスワードを入力してください',
        error: 'passwordが一致しません',
      });
    }
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(401).json({
        message: 'ログインに失敗しました',
        error: 'passwordが一致しません',
      });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({
        message: 'ログインに失敗しました',
        error: 'passwordが一致しません',
      });
    }
    res.json(toSafeUser(user));
  } catch (err) {
    res.status(500).json({
      message: 'ログインに失敗しました',
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

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      user_type,
    });

    res.status(201).json(toSafeUser(user));
  } catch (err) {
    const isDuplicateEmail = err.code === 11000 || (err.message && err.message.includes('duplicate key'));
    const message = isDuplicateEmail
      ? 'emailが重複しています。もう一度確認してください'
      : (err.message || 'ユーザー作成に失敗しました');
    res.status(400).json({
      message: 'ユーザー作成に失敗しました',
      error: message,
    });
  }
});

// ユーザー更新
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, user_type } = req.body;

    const update = { email, name, user_type };
    if (password !== undefined) {
      update.password = await bcrypt.hash(String(password), 10);
    }
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
