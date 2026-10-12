# Kaika Lab

Kaika Lab is an independent software studio in Osaka, Japan, founded in July 2026 by Michael Jiang. We make exam-prep apps and study materials for people learning Korean and Japanese, and tools for the teachers who teach them.

- Website: https://kaikalab.com/en/about/
- Contact: support@kaikalab.com

## Products

| Product | What it is | Where |
|---|---|---|
| TOPIK PILOT | A Korean study site and an Android app for the TOPIK exam | [topikpilot.app](https://topikpilot.app/), [Google Play](https://play.google.com/store/apps/details?id=com.topikpilot.app) |
| JLPT-GO | Practice tests for JLPT N1 to N3, with an explanation for every question | [Google Play](https://play.google.com/store/apps/details?id=com.kaikalab.nihongo) |
| Cloze Maker for Japanese and Korean | A Google Docs add-on that turns a passage into a cloze worksheet and an answer key | [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/cloze_maker_for_japanese_and_korean/377306261286) |
| OPENVOIX | An Android app for learning English, Japanese and Chinese by listening and typing | [Google Play](https://play.google.com/store/apps/details?id=com.osaka1090.openvoix) |
| Learn Korean with a Drama | A 100-episode short drama in everyday Korean | [YouTube](https://www.youtube.com/channel/UCmrA5dlKWYBJ0rzI02B0Oqg) |

All of our Android apps: [Kaika Lab on Google Play](https://play.google.com/store/apps/developer?id=Kaika+Lab)

## This repository

The source of https://kaikalab.com. Static files only, served by Cloudflare Workers.

- `site/`: the pages. Japanese at `/`, English at `/en/`, Korean at `/ko/`, and the Cloze Maker product page, privacy policy and terms at `/cloze-maker/`
- `wrangler.jsonc`: the Cloudflare settings
- `check-site.js`: checks titles, descriptions and internal links, and the statements Google requires in the Cloze Maker privacy policy

Run `node check-site.js` before publishing, then `npx wrangler deploy`.

## 日本語

Kaika Lab（カイカラボ）は、2026年7月に Michael Jiang が大阪で開業したソフトウェア工房です。韓国語と日本語を学ぶ人のための試験対策アプリと学習教材、語学を教える先生のための道具を作っています。

- 会社紹介: https://kaikalab.com/about/
- 連絡先: support@kaikalab.com

このリポジトリは kaikalab.com のソースです。公開の前に `node check-site.js` を実行し、`npx wrangler deploy` で公開します。

---

Google Docs and Google Play are trademarks of Google LLC. TOPIK and JLPT are trademarks of their respective organisers; Kaika Lab is not affiliated with them.

&copy; 2026 Kaika Lab. All rights reserved.
