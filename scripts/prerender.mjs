import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexPath = path.join(distDir, 'index.html');

const profilePath = path.join(projectRoot, 'data/bento-profile.json');
const linksPath = path.join(projectRoot, 'data/bento-links.json');
const categoriesPath = path.join(projectRoot, 'data/bento-categories.json');
const contentPath = path.join(projectRoot, 'data/profile-content.json');

const escapeAttr = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function applyRouteHeadMetadata(baseHtml, { title, description, canonicalUrl }) {
  const safeTitle = escapeAttr(title);
  const safeDesc = escapeAttr(description);
  const safeUrl = escapeAttr(canonicalUrl);

  return baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${safeUrl}" />`,
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${safeUrl}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`,
    );
}

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
    const rawLinks = JSON.parse(await fs.readFile(linksPath, 'utf8'));
    const links = rawLinks.filter((item) => !item.hidden);
    const categoryConfig = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
    const categories = categoryConfig.categories;
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
  <!-- Additional SEO Meta Tags & Structured Data -->
  <meta name="keywords" content="${escapeAttr(keywords)}" />
  <meta property="og:image" content="https://david888.com/bento/og-me.jpg" />
  <meta property="og:locale" content="zh_TW" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:site_name" content="David888.com" />
  <script type="application/ld+json">
${JSON.stringify(schemaJson, null, 2)}
  </script>
`;

    // 3. Generate Pre-rendered HTML content
    let preRenderedContent = `
  <div class="sr-only">
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
        <h3>${cat.title} (${cat.titleEn})</h3>
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

    // 4. Update root head metadata cleanly & inject structured data
    html = applyRouteHeadMetadata(html, {
      title: `${profile.name} (David888) | CTO & Technical Advisor`,
      description: metaDescription,
      canonicalUrl: 'https://david888.com/',
    });
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

    // 6. Save modifications for root index.html
    await fs.writeFile(indexPath, html, 'utf8');

    // 7. Generate Canonical Route static HTML entrypoints for direct URL navigation
    const categoryMetaById = Object.fromEntries(
      categories.map((cat) => [
        cat.id,
        {
          title: `${cat.title} (${cat.titleEn}) | ${profile.name}`,
          description: `${cat.summary || ''} ${cat.summaryEn || ''}`.trim() || metaDescription,
        },
      ]),
    );

    const routeMetadata = {
      contact: {
        title: `Contact & Advisory Inquiry | ${profile.name}`,
        description: 'Direct contact concierge and double opt-in inquiry form for CTO advisory, technical due diligence, and architecture collaboration.',
      },
      'contact/form': {
        title: `Direct Contact Form | ${profile.name}`,
        description: 'Submit an executive technical advisory, CTO hiring, or collaboration inquiry directly to David Chiang.',
      },
      commitments: {
        title: `一個 CTO 的 5 大承諾 (A CTO's 5 Commitments) | ${profile.name}`,
        description: '戰略判斷、商業回報、百人工程團隊組織領導、風險承擔與底層執行落地——高階技術領導五大承諾。',
      },
      promises: {
        title: `一個 CTO 的 5 大承諾 (A CTO's 5 Commitments) | ${profile.name}`,
        description: '戰略判斷、商業回報、百人工程團隊組織領導、風險承擔與底層執行落地——高階技術領導五大承諾。',
      },
      executive: {
        title: `Executive Advisory & CTO Dossier | ${profile.name}`,
        description: '年度技術顧問約、全職 CTO / VP of Engineering 與投資前技術盡職調查 (Due Diligence) 合作總覽。',
      },
      advisory: {
        title: `Executive Advisory & CTO Dossier | ${profile.name}`,
        description: '年度技術顧問約、全職 CTO / VP of Engineering 與投資前技術盡職調查 (Due Diligence) 合作總覽。',
      },
      flagships: {
        title: `7 Flagship Production Systems | ${profile.name}`,
        description: 'Showcase of 7 live enterprise-grade production platforms: Quant Finance, Multi-Agent RAG, Security & MCP Engines.',
      },
      experiments: categoryMetaById.products || {
        title: `Products & Experiments | ${profile.name}`,
        description: metaDescription,
      },
      metaphysics: categoryMetaById.finance || {
        title: `Quant Finance & Calendar Systems | ${profile.name}`,
        description: metaDescription,
      },
      ...categoryMetaById,
    };

    const canonicalRoutes = Array.from(
      new Set([
        'contact',
        'contact/form',
        'commitments',
        'promises',
        'executive',
        'advisory',
        'flagships',
        'experiments',
        'metaphysics',
        ...categories.map((cat) => cat.id),
      ]),
    );

    for (const route of canonicalRoutes) {
      const routeDir = path.join(distDir, route);
      await fs.mkdir(routeDir, { recursive: true });
      const routeCanonicalUrl = `https://david888.com/${route}`;
      const meta = routeMetadata[route] || {
        title: `${profile.name} | ${route}`,
        description: metaDescription,
      };
      const routeHtml = applyRouteHeadMetadata(html, {
        title: meta.title,
        description: meta.description,
        canonicalUrl: routeCanonicalUrl,
      });
      await fs.writeFile(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
    }

    // Fallback 404.html for GitHub Pages SPA subpaths
    await fs.writeFile(path.join(distDir, '404.html'), html, 'utf8');

    console.log('Pre-rendering and Canonical Route generation completed successfully!');
  } catch (error) {
    console.error('Pre-rendering failed:', error);
    process.exit(1);
  }
}

run();
