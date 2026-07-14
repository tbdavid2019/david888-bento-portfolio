import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexPath = path.join(distDir, 'index.html');

const profilePath = path.join(projectRoot, 'data/bento-profile.json');
const linksPath = path.join(projectRoot, 'data/bento-links.json');
const contentPath = path.join(projectRoot, 'data/profile-content.json');

const categories = [
  { id: 'social', title: '個人入口 (Profile & Content)', summary: '個人公開入口、內容輸出、GitHub、LinkedIn 與創業經歷。' },
  { id: 'extensions', title: '瀏覽器外掛 (Chrome Extensions)', summary: 'Chrome 外掛：摘要、聊天、分頁整理、學單字、改字體，讓日常瀏覽和資料整理更省力。' },
  { id: 'tools', title: '實用工具與服務 (Tools & Services)', summary: '這裡收的是高頻實用入口：內部工具、團隊知識庫、URL 轉 Markdown、決策輔助與各種效率服務。' },
  { id: 'skills', title: '專業開發技能 (Developer Skills)', summary: '給 LLM、Agent 與工程團隊使用的技能文件、API 與開發知識。' },
  { id: 'ai', title: 'AI 應用與研究 (AI Apps & Research)', summary: 'Hugging Face spaces、命理可視化、文件處理、投資研究與各種 AI prototype。' },
  { id: 'telegram', title: 'Telegram 機器人 (Telegram Bots)', summary: '資訊整理、投資新聞、截圖、摘要與日常工作流機器人。' },
  { id: 'line', title: 'LINE 機器人 (LINE Bots)', summary: '面向台灣使用情境的 LINE OA / LINE Bot 服務入口。' },
  { id: 'others', title: '其他作品 (Other Work)', summary: '其他作品。' }
];

async function run() {
  try {
    console.log('Starting pre-rendering for SEO...');
    
    // Check if dist/index.html exists
    try {
      await fs.access(indexPath);
    } catch {
      throw new Error(`dist/index.html not found. Please run 'vite build' first.`);
    }

    const profile = JSON.parse(await fs.readFile(profilePath, 'utf8'));
    const links = JSON.parse(await fs.readFile(linksPath, 'utf8'));
    const content = JSON.parse(await fs.readFile(contentPath, 'utf8'));
    let html = await fs.readFile(indexPath, 'utf8');

    // 1. Generate SEO Description & Keywords
    const description = `${content.zh.headline}。我是具備跨國企業實戰經驗的 CTO 與技術顧問，專注解決複雜技術債、重整破碎的資料流與系統架構，讓技術真正成為商業的加速器。`;
    const descriptionEn = `${content.en.headline}. A CTO & Technical Advisor specializing in transforming complexity into execution and business value.`;
    const combinedDesc = `${description} ${descriptionEn}`;
    const metaDescription = `${description} ${descriptionEn}`;
    const keywords = "David Chiang, David888, CTO, Technical Advisor, 技術顧問, 系統架構, 軟體開發, 電商架構, 跨系統整合, AI 應用, 瀏覽器外掛, Telegram Bots";

    // 2. Extract Social Links for Structured Data
    const socialUrls = links
      .filter(item => item.tag === 'social' && item.url)
      .map(item => item.url);
    const sameAs = Array.from(new Set([
      "https://github.com/tbdavid2019",
      "https://www.linkedin.com/in/david11111/",
      ...socialUrls
    ]));

    const schemaJson = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.name,
      "alternateName": "David888",
      "url": "https://david888.com/",
      "image": "https://david888.com/bento/og-me.jpg",
      "jobTitle": "CTO & Technical Advisor",
      "description": combinedDesc,
      "sameAs": sameAs
    };

    const headInjections = `
  <!-- SEO Meta Tags -->
  <meta name="description" content="${metaDescription}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="${profile.name}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://david888.com/" />
  <meta property="og:title" content="${profile.name} | CTO & Technical Advisor" />
  <meta property="og:description" content="${metaDescription}" />
  <meta property="og:image" content="https://david888.com/bento/og-me.jpg" />
  <meta property="og:locale" content="zh_TW" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:site_name" content="David888.com" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${profile.name} | CTO & Technical Advisor" />
  <meta name="twitter:description" content="${metaDescription}" />
  <meta name="twitter:image" content="https://david888.com/bento/og-me.jpg" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(schemaJson, null, 2)}
  </script>
`;

    // 3. Generate Pre-rendered HTML content
    let preRenderedContent = `
  <div class="sr-only" style="display: none;" aria-hidden="true">
    <header>
      <h1>${profile.name}</h1>
      <p><strong>Contact:</strong> ${profile.contactLine} / ${profile.contactLineEn || ''}</p>
      
      <h2>${content.zh.headline}</h2>
      <h3>${content.zh.subHeadline}</h3>
      <div>
        ${content.zh.body.map(block => {
          if (block.kind === 'sectionTitle') return `<h4>${block.text}</h4>`;
          if (block.kind === 'bullet') return `<li>${block.text}</li>`;
          if (block.kind === 'note') return `<p><em>${block.text}</em></p>`;
          return `<p>${block.text}</p>`;
        }).join('\n        ')}
      </div>
      
      <h2>${content.en.headline}</h2>
      <h3>${content.en.subHeadline}</h3>
      <div>
        ${content.en.body.map(block => {
          if (block.kind === 'sectionTitle') return `<h4>${block.text}</h4>`;
          if (block.kind === 'bullet') return `<li>${block.text}</li>`;
          if (block.kind === 'note') return `<p><em>${block.text}</em></p>`;
          return `<p>${block.text}</p>`;
        }).join('\n        ')}
      </div>
    </header>
    
    <main>
      <h2>作品與連結 (Portfolio & Links)</h2>
`;

    const groupedItems = {};
    for (const item of links) {
      const tag = item.tag || 'others';
      if (!groupedItems[tag]) {
        groupedItems[tag] = [];
      }
      groupedItems[tag].push(item);
    }

    for (const cat of categories) {
      const items = groupedItems[cat.id] || [];
      if (items.length === 0) continue;
      
      preRenderedContent += `
      <section>
        <h3>${cat.title}</h3>
        <p><em>${cat.summary}</em></p>
        <ul>
`;
      
      for (const item of items) {
        const title = item.titleEn ? `${item.title} / ${item.titleEn}` : item.title;
        const desc = item.descriptionEn ? `${item.description || ''} / ${item.descriptionEn}` : (item.description || '');
        const url = item.url || '';
        
        preRenderedContent += `          <li>
            <strong>${title}</strong>
            ${url ? ` - <a href="${url}">${url}</a>` : ''}
            ${desc ? `<br/><span>${desc}</span>` : ''}
          </li>\n`;
      }
      
      preRenderedContent += `        </ul>
      </section>\n`;
    }

    preRenderedContent += `    </main>
  </div>`;

    // 4. Inject Head elements
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${headInjections}\n</head>`);
    } else {
      console.warn('Could not find </head> tag to inject meta tags.');
    }

    // 5. Inject Body elements inside root container
    if (html.includes('<div id="root"></div>')) {
      html = html.replace('<div id="root"></div>', `<div id="root">${preRenderedContent}</div>`);
    } else if (html.includes('<div id="root">')) {
      // Handle cases where build might have modified the whitespace
      html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${preRenderedContent}</div>`);
    } else {
      console.warn('Could not find <div id="root"></div> to inject pre-rendered content.');
    }

    // 6. Save modifications
    await fs.writeFile(indexPath, html, 'utf8');
    console.log('Pre-rendering and SEO metadata injection completed successfully!');
  } catch (error) {
    console.error('Pre-rendering failed:', error);
    process.exit(1);
  }
}

run();
