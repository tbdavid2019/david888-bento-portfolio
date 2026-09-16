

# David888 Bento Portfolio

bento 模板

推送方法

```
git commit --allow-empty -m "Trigger deployment"
git push
```

A modern, responsive bento-grid style portfolio powered by React, Tailwind CSS, and Framer Motion.
This project separates data from structure, allowing you to easily manage your content via JSON files.

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run locally:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## 📝 How to Manage Content (調整與新增)

All content is managed in the `data/` folder. You do not need to touch the code.

### 1. Reordering Blocks (移動區塊)
To change the order of cards, simply rearrange the objects in `data/bento-links.json`. The grid renders items from top to bottom.

Category names, order, bilingual descriptions, and the homepage default are managed in `data/bento-categories.json`. The homepage uses the `social` category so the auto-updating Podcast, Blog, and GitHub Activity cards remain the default view.

### 2. Adding New Blocks (新增區塊)
Add a new object to the list in `data/bento-links.json`.

**Basic Link Card:**
```json
{
  "type": "link",
  "title": "My New Project",
  "url": "https://example.com",
  "imageSource": "https://example.com/image.png",
  "tag": "products",
  "section": "Web 產品與服務 (Web Products & Services)",
  "sectionEn": "Web Products & Services"
}
```

Current category IDs:

- `social`: Latest auto-updating content and media links
- `finance`: Stock analysis, AI hedge fund, quantitative models, and investment bots
- `products`: Web, browser, Telegram, and LINE products
- `agent-skills`: Skills built for LLMs and AI agents
- `experiments`: Research prototypes and side projects
- `metaphysics`: Qi Men, Bazi, tarot, Feng Shui, and related products

**Special Card Types:**
You can use the following values for the `"type"` field:
- `"github"`: Shows GitHub stats.
- `"project"`: Large featured project card.
- `"experience"`: Work history card.
- `"techstack"`: Tech stack list.
- `"twitter"`: Twitter/Social profile.
- `"design-system"`: Design system link.

### 3. Resizing Blocks (調整大小)
To make a card wider (span 2 columns), add `"colSpan": 2` to the object:
```json
{
  "type": "link",
  "title": "Wide Card",
  "colSpan": 2
}
```

### 4. Updating Profile
Edit `data/bento-profile.json` to update your name, bio, avatar, or contact info.

### 5. Updating Profile Copy with Markdown
Edit `data/profile-content.zh.md` or `data/profile-content.en.md`. The build scripts parse these files into the JSON consumed by the profile card.

### 6. Homepage Announcement
The announcement editor is available at:

```text
https://david888.com/?admin=1
```

After Firebase Authentication login, edit the announcement in the **首頁公告** section. The public announcement document is stored at `announcements/homepage` in Firestore and appears above the homepage categories.

## 🔥 Firebase CRM

The site frontend is hosted on GitHub Pages. Firebase is used only for the backend services:

- Firebase project: `aicreate360-official-web-stg`
- Web app: `david888-crm2`
- Firestore: tickets, replies, homepage announcements, and daily ticket counters
- Authentication: Email/Password for the CRM admin
- Cloud Functions: `createContactTicket` and `replyToContactTicket` in `asia-east1`
- Resend API & SMTP: Resend API is the primary mail delivery method; SMTP is retained as fallback
- Admin recipient: `104@david888.com`

### Contact Form Architecture (Edge Worker + Resend API + Firebase Fallback)

1. **Primary - Cloudflare Worker (`workers/contact-worker/`)**:
   - Deployed at Edge (e.g. `https://david888-contact-worker.raspy-salad-a4b7.workers.dev`).
   - Verifies Cloudflare Turnstile token directly with Cloudflare API.
   - Dispatches notification email directly to `104@david888.com` via Resend API (`RESEND_API_KEY`).
   - Completely independent from Firebase (if Firebase is down, contact inquiries are still delivered immediately).
   - Generates and returns ticket tracking number `CS-YYYYMMDD-XXXX`.

2. **Fallback - Firebase Cloud Functions (`functions/index.js`)**:
   - If the Edge Worker is unreachable or fails, the frontend automatically falls back to Firebase `createContactTicket`.
   - Cloud Functions attempts Resend API first; if unconfigured or failing, it falls back to Gmail SMTP (`nodemailer`).

3. **Local Dev & Testing (`api/contact.ts`)**:
   - Vite development middleware handles `/api/contact` during `npm run dev`.
   - Unit tests in `test/contact-api.test.mjs` run against the shared dispatch logic.

### Directory Structure & Files

- `workers/contact-worker/`: Cloudflare Worker source (`src/index.ts`) and configuration (`wrangler.jsonc`)
- `api/contact.ts`: Core dispatch and Turnstile validation logic (used by Vite dev middleware & tests)
- `components/ContactDialog.tsx`: Dialog with interactive subject chips, Turnstile widget, and full submission receipt
- `components/TurnstileWidget.tsx`: Native React wrapper for Cloudflare Turnstile CAPTCHA
- `lib/crm.ts`: Frontend CRM client (Worker primary -> Firebase fallback)
- `functions/index.js`: Firebase Cloud Functions backend with dual Resend/SMTP support
- `firestore.rules`: Public announcement read access and admin-only CRM access
- `firebase.json` / `.firebaserc`: Firebase deployment configuration

---

## 🔐 環境變數與金鑰配置總覽 (Environment Variables & Secrets)

專案完整環境變數範本請參考 [.env.example](file:///.env.example)。以下為各服務所需變數整理：

### 1. 前端環境變數（Vite / 客戶端 `.env`）
以 `VITE_` 開頭的變數會於編譯時注入前端頁面（GitHub Actions 也需設定於 Repository Secrets）：

| 變數名稱 | 預設值 / 範例 | 說明 | 必填 |
| :--- | :--- | :--- | :--- |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAAAAAEvqf7unH6MrhIv2` | Cloudflare Turnstile 網站金鑰（Sitekey），供前端彈出表單時加載人機驗證框 | **是** |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Web App 公開 API 金鑰，供首頁公告與 Firebase Fallback 連線 | **是** |
| `VITE_CONTACT_API_URL` | `https://david888-contact-worker...` | 自訂 Contact Worker 端點（選填，預設已內建 Cloudflare Worker） | 否 |

---

### 2. Cloudflare Worker 密鑰（主要發信服務，設定於 Cloudflare Secrets）
在 `workers/contact-worker` 目錄下透過 `wrangler secret put` 設定：

```bash
cd workers/contact-worker
npx wrangler secret put RESEND_API_KEY       # 輸入您的 Resend API Key (re_...)
npx wrangler secret put TURNSTILE_SECRET     # 輸入 Cloudflare Turnstile Secret Key
```

| 變數名稱 | 類型 | 範例 / 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | Secret | `re_xxxxxxxxxxxx` | Resend API 金鑰（在 resend.com 取得） |
| `TURNSTILE_SECRET` | Secret | `0x4AAAAAA...` | Cloudflare Turnstile 私密金鑰 |
| `ADMIN_EMAIL` | Variable | `104@david888.com` | 管理員通知收件信箱（於 wrangler.jsonc 設定） |
| `RESEND_FROM` | Variable | `David888 Portfolio <onboarding@resend.dev>` | 寄件者名稱（於 wrangler.jsonc 設定） |

---

### 3. Firebase Cloud Functions 密鑰（備援寄信通道，Google Secret Manager）
若 Edge Worker 異常時，前端會自動降級走 Firebase Cloud Functions：

```bash
# 設定 Resend 與 Turnstile（優先）
firebase functions:secrets:set RESEND_API_KEY --project aicreate360-official-web-stg
firebase functions:secrets:set TURNSTILE_SECRET --project aicreate360-official-web-stg

# 設定 Gmail SMTP（最終備援）
firebase functions:secrets:set SMTP_USER --project aicreate360-official-web-stg
firebase functions:secrets:set SMTP_PASS --project aicreate360-official-web-stg

# 部署
firebase deploy --only functions --project aicreate360-official-web-stg
```

| 變數名稱 | 預設值 / 範例 | 說明 | 必填 |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Cloud Functions 優先發信密鑰 | 建議 |
| `TURNSTILE_SECRET` | `0x4AAAAAA...` | Cloud Functions 人機驗證私鑰 | 建議 |
| `SMTP_USER` | `104@david888.com` | Gmail SMTP 發信用帳號 | SMTP 備援必填 |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | Gmail 應用程式專用密碼（App Password） | SMTP 備援必填 |
| `ADMIN_EMAIL` | `104@david888.com` | 管理員通知信箱 | 否（預設已是 `104@david888.com`） |

---

The contact form displays a service number immediately after submission. Resend API (or SMTP fallback) sends the admin notification for a new ticket and customer notification when an admin replies.

## 🛠 Deployment

This project is ready for **Vercel** or **GitHub Pages**.

- **Vercel**: Simply import this repo and deploy.
- **GitHub Pages**: Configure `base` in `vite.config.ts` if deploying to a subpath.
