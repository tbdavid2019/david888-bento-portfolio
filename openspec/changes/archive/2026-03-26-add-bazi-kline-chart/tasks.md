## 1. Asset Preparation

- [x] 1.1 Generate or capture a representative screenshot of the Bazi K-Line chart.
- [x] 1.2 Save the image as `public/assets/bazi-kline.jpeg` (or `.png`).

## 2. Data Update

- [x] 2.1 Add a new entry to `data/bento-links.json` with the following properties:
    - `type`: "link"
    - `title`: "888 人生K線 | 八字命理可視化"
    - `url`: "https://bazi.david888.com"
    - `imageSource`: "/assets/bazi-kline.jpeg"
    - `colSpan`: 1 (adjust if needed after preview)

## 3. Verification

- [x] 3.1 Run `npm run dev` and verify the new block appears correctly in the bento grid.
- [x] 3.2 Verify the link opens the correct URL in a new tab.
