# GitHub へのアップロード手順

以下のコマンドをターミナル（PowerShell または コマンドプロンプト）で実行してください。

## 1. プロジェクトフォルダに移動

```powershell
cd "z:\h.ahn\OneDrive - アイティーエム　株式会社\PassageDrive\Workspace\Desktop\vibe-coding"
```

## 2. Git リポジトリの初期化（初回のみ）

```powershell
git init
```

## 3. リモートリポジトリを追加

```powershell
git remote add origin https://github.com/gmlwls1710/vibe-coding-todolist.git
```

※既に origin が設定されている場合は、以下のコマンドで上書き:
```powershell
git remote set-url origin https://github.com/gmlwls1710/vibe-coding-todolist.git
```

## 4. ファイルをステージング

```powershell
git add .
```

## 5. コミット

```powershell
git commit -m "Initial commit: My Todos タスク管理アプリ"
```

## 6. メインブランチにプッシュ

```powershell
git branch -M main
git push -u origin main
```

※GitHub の認証が求められた場合は、ユーザー名とパスワード（または Personal Access Token）を入力してください。

---

## 注意事項

- GitHub にリポジトリが空の状態で存在していることを確認してください
- 初回プッシュ時に認証が必要です（HTTPS の場合は Personal Access Token を推奨）
