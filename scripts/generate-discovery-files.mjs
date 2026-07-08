import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const githubActivityPath = path.join(publicDir, 'github-activity.json');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
const githubAtomFeedUrl = 'https://github.com/tbdavid2019.atom';
const execFileAsync = promisify(execFile);

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
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
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

function decodeHtmlEntities(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value) {
  return decodeHtmlEntities(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripTags(match[1]) : '';
}

function extractAlternateLink(source) {
  const match = source.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  return match ? decodeHtmlEntities(match[1]) : '';
}

async function buildGithubActivityFeed() {
  try {
    const { stdout: xml } = await execFileAsync('curl', [
      '-fsSL',
      '-H',
      'Accept: application/atom+xml, application/xml;q=0.9, text/xml;q=0.8',
      githubAtomFeedUrl,
    ]);

    const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g))
      .slice(0, 3)
      .map((match) => {
        const entry = match[1];
        return {
          title: extractTagValue(entry, 'title'),
          url: extractAlternateLink(entry),
          updated: extractTagValue(entry, 'updated'),
          summary: extractTagValue(entry, 'content') || extractTagValue(entry, 'summary'),
        };
      })
      .filter((item) => item.title && item.url);

    await fs.writeFile(githubActivityPath, `${JSON.stringify({ entries }, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.warn('Unable to build GitHub activity feed:', error);
    await fs.writeFile(githubActivityPath, `${JSON.stringify({ entries: [] }, null, 2)}\n`, 'utf8');
  }
}

await ensureDir(path.join(publicDir, '.well-known'));

const discoveredRoutes = await collectHtmlRoutes(publicDir);
const sitemapRoutes = Array.from(new Set(['/', ...discoveredRoutes])).sort();

await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(sitemapRoutes), 'utf8');
await fs.writeFile(path.join(publicDir, '.well-known', 'api-catalog'), buildApiCatalog(), 'utf8');
await buildGithubActivityFeed();
