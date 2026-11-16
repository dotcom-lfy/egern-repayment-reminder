# Egern 每月還款倒數

這是一個純顯示型 Egern Widget 模組。它只根據你在 Egern 本機填寫的「名稱 + 每月還款日」計算倒數，不查詢帳單、不連接銀行，也不發送通知或上報資料。

## 安裝

在 Egern 的「工具 → 模組 → ＋ → 遠端」中填入：

```text
https://raw.githubusercontent.com/dotcom-lfy/egern-repayment-reminder/main/module.yaml
```

儲存後打開模組設定，在「還款項目」中填寫本機資料：

```text
信用卡 A:10;信用卡 B:25
```

- 冒號後是每月還款日，範圍為 `1` 到 `31`。
- 多項用英文分號 `;`、中文分號 `；` 或換行分隔。
- 若設定為 `31`，遇到二月或只有 30 天的月份，會自動使用該月最後一天。
- 不要填卡號、姓名、帳單金額或其他敏感資料；簡短暱稱已足夠。

接著在 iOS 主畫面或鎖定畫面新增 Egern 小工具，選擇 `repayment-reminder`。小、中、大及常用鎖定畫面尺寸均有對應排版。

## 更新方式

Egern 新增遠端模組時可設定更新間隔。建議使用 `86400` 秒（一天）；這只更新公開的通用 YAML/JavaScript，不會把本機還款資料帶到 GitHub。若剛更新程式仍顯示舊版，可在模組頁手動更新一次，再重新整理 Widget。

## 隱私說明

- 程式沒有 `fetch`、`ctx.http`、Webhook、分析 SDK、廣告或遙測。
- 還款項目透過 Egern 的模組環境變數保存在裝置本機，不寫入 URL，也不提交到 GitHub。
- 唯一網路行為是 Egern 從 GitHub Raw 下載公開的 `module.yaml` 與 `repayment.js`。
- GitHub 可能記錄一般下載請求資訊（例如 IP 與 User-Agent），但請求中不含你的還款項目。

## 與原網址錯誤的關係

原網址回傳的是 JavaScript，卻被貼進 Egern 的「新增模組」URL 欄位。該欄位需要 YAML，所以 Egern 會在第 1 行第 1 列遇到 `/` 並解析失敗。本倉庫使用 `module.yaml` 作為入口，再由 YAML 正確引用 Widget 腳本。
