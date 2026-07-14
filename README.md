

# David888 Bento Portfolio

bento 模板

推送方法

```
git commit --allow-empty -m "Trigger deployment"
git push
```

A modern, responsive bento-grid style portfolio powered by React and Tailwind CSS.
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

### 2. Adding New Blocks (新增區塊)
Add a new object to the list in `data/bento-links.json`.

**Basic Link Card:**
```json
{
  "type": "link",
  "title": "My New Project",
  "url": "https://example.com",
  "imageSource": "https://example.com/image.png"
}
```

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
- SMTP: Gmail credentials are stored in Firebase Secret Manager, never in the repository

### Firebase Files

- `lib/firebase.ts`: public Firebase Web App configuration
- `lib/crm.ts`: frontend CRM calls and Firestore queries
- `functions/index.js`: ticket creation, service-number generation, replies, and email delivery
- `firestore.rules`: public announcement read access and admin-only CRM access
- `firebase.json` / `.firebaserc`: Firebase deployment configuration
- `firebasekey/`: local Admin SDK credentials; ignored by Git

### Deploy Firebase Backend

You need Firebase CLI access to the project and the Blaze plan for Cloud Functions:

```bash
firebase login
firebase deploy --only firestore:rules,functions --project aicreate360-official-web-stg
```

The Firebase Authentication user used for the admin console must be in the admin allowlist in `firestore.rules` and `functions/index.js`.

### Configure Gmail SMTP Secrets

Use a Gmail App Password, not your normal Gmail password. Enter the values interactively so they are not written to shell history:

```bash
firebase functions:secrets:set SMTP_USER --project aicreate360-official-web-stg
firebase functions:secrets:set SMTP_PASS --project aicreate360-official-web-stg
firebase deploy --only functions --project aicreate360-official-web-stg
```

The contact form displays a service number immediately after submission. SMTP sends the admin notification for a new ticket and the customer notification when an admin replies.

## 🛠 Deployment

This project is ready for **Vercel** or **GitHub Pages**.

- **Vercel**: Simply import this repo and deploy.
- **GitHub Pages**: Configure `base` in `vite.config.ts` if deploying to a subpath.
