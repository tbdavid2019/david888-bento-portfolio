import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

const siteOrigin = new URL(packageJson.homepage).origin;
const isoDate = new Date().toISOString();

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function collectHtmlRoutes(dirPath, basePath = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const routePath = path.posix.join(basePath, entry.name);

    if (entry.isDirectory()) {
      routes.push(...await collectHtmlRoutes(entryPath, routePath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.html')) {
      continue;
    }

    if (entry.name === 'index.html') {
      const normalized = routePath.slice(0, -'/index.html'.length) || '/';
      const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
      routes.push(withSlash.endsWith('/') ? withSlash : `${withSlash}/`);
      continue;
    }

    routes.push(`/${routePath}`);
  }

  return routes;
}

function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /.well-known/',
    'Disallow: /.git/',
    'Disallow: /node_modules/',
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    '',
  ].join('\n');
}

function buildSitemapXml(urls) {
  const xmlUrls = urls.map((url) => {
    const loc = `${siteOrigin}${url}`;
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${isoDate}</lastmod>`,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...xmlUrls,
    '</urlset>',
    '',
  ].join('\n');
}

function buildApiCatalog() {
  return `${JSON.stringify({
    linkset: [
      {
        anchor: `${siteOrigin}/`,
        'service-doc': [
          {
            href: `${siteOrigin}/docs/api/`,
            type: 'text/html',
          },
        ],
      },
    ],
  }, null, 2)}\n`;
}

await ensureDir(path.join(publicDir, '.well-known'));

const discoveredRoutes = await collectHtmlRoutes(publicDir);
const sitemapRoutes = Array.from(new Set(['/', ...discoveredRoutes])).sort();

await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(sitemapRoutes), 'utf8');
await fs.writeFile(path.join(publicDir, '.well-known', 'api-catalog'), buildApiCatalog(), 'utf8');
