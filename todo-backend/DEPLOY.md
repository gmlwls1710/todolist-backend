# Heroku デプロイ手順（/users/login 404 を解消する場合）

## 原因
`POST /users/login` が 404 になる = Heroku 上のコードにログイン用ルートが含まれていません。**最新の todo-backend を再デプロイ**する必要があります。

---

## 方法A: Heroku CLI でデプロイ（このリポジトリを push する場合）

**リポジトリのルート（vibe-coding）で実行してください。**

```powershell
# 1. リモート確認（heroku が無ければ追加）
git remote -v
# heroku が無い場合:
heroku git:remote -a ahn-todo-backend-acce2db76095

# 2. 最新をコミットしてから push
git add todo-backend/
git commit -m "Add POST /users/login"
git push heroku main
```

ブランチ名が `master` の場合は `git push heroku master` にしてください。

---

## 方法B: GitHub 連携でデプロイしている場合

1. **Heroku ダッシュボード** → アプリ **ahn-todo-backend-acce2db76095** を開く
2. **Deploy** タブで「Connected repository」を確認（どの GitHub リポジトリ・ブランチか）
3. **そのリポジトリ**に、`todo-backend` の最新コード（`routes/users.js` に `POST /login` があるもの）を push
4. **Deploy branch** で再デプロイ、または該当ブランチへ push して自動デプロイ

※ Heroku が「vibe-coding」ではなく**別リポジトリ**（例: todolist-backend）を見ている場合、そのリポジトリ側の `routes/users.js` に `POST /login` を追加して push するか、Heroku の接続先を vibe-coding に変更してください。

---

## デプロイ後の確認

次のコマンドで **401** または **200** が返れば、ルートは存在しています（404 ならまだ古いコードです）。

```powershell
curl -X POST "https://ahn-todo-backend-acce2db76095.herokuapp.com/users/login" -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"xxx\"}"
```

- **401** → ルートはある。メール/パスワードが違うだけ（正常）
- **200** → ログイン成功
- **404** → まだ古いコード。上記のデプロイを再度実行するか、接続リポジトリを確認してください
