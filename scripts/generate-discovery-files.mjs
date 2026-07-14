import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  GITHUB_ATOM_FEED_URL,
  createGithubActivityPayload,
  createStaleGithubActivityPayload,
  parseGithubAtomFeed,
} from './github-activity.mjs';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const githubActivityPath = path.join(publicDir, 'github-activity.json');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
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

async function buildGithubActivityFeed() {
  let existingPayload = { entries: [] };

  try {
    existingPayload = JSON.parse(await fs.readFile(githubActivityPath, 'utf8'));
  } catch {
    // A missing or invalid cache is safe; the next successful sync will replace it.
  }

  try {
    const { stdout: xml } = await execFileAsync('curl', [
      '-fsSL',
      '-H',
      'Accept: application/atom+xml, application/xml;q=0.9, text/xml;q=0.8',
      GITHUB_ATOM_FEED_URL,
    ]);

    const entries = parseGithubAtomFeed(xml);

    await fs.writeFile(
      githubActivityPath,
      `${JSON.stringify(createGithubActivityPayload(entries, isoDate), null, 2)}\n`,
      'utf8',
    );
  } catch (error) {
    console.warn('Unable to build GitHub activity feed:', error);
    await fs.writeFile(
      githubActivityPath,
      `${JSON.stringify(createStaleGithubActivityPayload(existingPayload), null, 2)}\n`,
      'utf8',
    );
  }
}

await ensureDir(path.join(publicDir, '.well-known'));

const discoveredRoutes = await collectHtmlRoutes(publicDir);
const sitemapRoutes = Array.from(new Set(['/', ...discoveredRoutes])).sort();

await fs.writeFile(path.join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8');
await fs.writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemapXml(sitemapRoutes), 'utf8');
await fs.writeFile(path.join(publicDir, '.well-known', 'api-catalog'), buildApiCatalog(), 'utf8');
await buildGithubActivityFeed();
