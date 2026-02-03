

# David888 Bento Portfolio

bento 模板


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

## 🛠 Deployment

This project is ready for **Vercel** or **GitHub Pages**.

- **Vercel**: Simply import this repo and deploy.
- **GitHub Pages**: Configure `base` in `vite.config.ts` if deploying to a subpath.
