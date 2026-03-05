const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI;

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
    const payload = {
      id: user._id,
      email: user.email,
      user_type: user.user_type,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      user: toSafeUser(user),
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: 'ログインに失敗しました',
      error: err.message,
    });
  }
});

// トークンからログインユーザー情報を取得
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: '認証が必要です',
        error: 'トークンがありません',
      });
    }
    const token = authHeader.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        message: '認証に失敗しました',
        error: 'トークンが無効または期限切れです',
      });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりませんでした' });
    }
    res.json(toSafeUser(user));
  } catch (err) {
    res.status(500).json({
      message: 'ユーザー情報の取得に失敗しました',
      error: err.message,
    });
  }
});

// Slack OAuth ログイン（code からユーザー作成/取得して JWT 発行）
router.post('/slack-login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        message: 'Slack ログインに失敗しました',
        error: 'code がありません',
      });
    }
    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !SLACK_REDIRECT_URI) {
      return res.status(500).json({
        message: 'Slack ログインに失敗しました',
        error: 'Slack OAuth の設定が不足しています',
      });
    }

    // OpenID Connect のトークンエンドポイントで code をアクセストークンに交換
    const tokenRes = await fetch('https://slack.com/api/openid.connect.token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.ok) {
      return res.status(400).json({
        message: 'Slack ログインに失敗しました',
        error: tokenData.error || 'openid.connect.token が失敗しました',
      });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(400).json({
        message: 'Slack ログインに失敗しました',
        error: 'Slack アクセストークンを取得できませんでした',
      });
    }

    // OpenID Connect の userInfo エンドポイントでユーザー情報を取得
    const infoRes = await fetch('https://slack.com/api/openid.connect.userInfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const infoData = await infoRes.json();
    if (!infoData.ok) {
      return res.status(400).json({
        message: 'Slack ログインに失敗しました',
        error: infoData.error || 'openid.connect.userInfo が失敗しました',
      });
    }

    const email =
      (infoData.email && String(infoData.email).toLowerCase()) ||
      `${infoData.sub || 'slack-user'}@slack.local`;
    const name = infoData.name || 'Slack User';

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = `slack:${userId}:${Date.now()}`;
      const hashedPassword = await bcrypt.hash(String(randomPassword), 10);
      user = await User.create({
        email,
        name,
        password: hashedPassword,
        user_type: 'customer',
      });
    }

    const payload = {
      id: user._id,
      email: user.email,
      user_type: user.user_type,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      user: toSafeUser(user),
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Slack ログインに失敗しました',
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
