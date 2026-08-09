import fs from 'node:fs/promises';
import path from 'node:path';

export function buildLlmsTxt({ profile, links, content, siteOrigin }) {
  const lines = [
    '# David Chiang (David888) - CTO & Technical Advisor Portfolio',
    '',
    `> ${content.zh.headline} / ${content.en.headline}. A CTO & Technical Advisor specializing in enterprise architecture, legacy refactoring, and business value creation.`,
    '',
    'David Chiang (David888) is a CTO, Technical Advisor, and serial entrepreneur with 10+ years of enterprise engineering leadership.',
    'Specializing in technical due diligence, high-concurrency eCommerce platforms, AI/LLM integration, Chrome extensions, Telegram & LINE bots, and developer tools.',
    '',
    `- Contact Email: ${profile.contactLine || '104@david888.com'}`,
    `- Website: ${siteOrigin}/`,
    `- GitHub: https://github.com/tbdavid2019`,
    `- LinkedIn: https://www.linkedin.com/in/david11111/`,
    `- Location: Taipei / Kaohsiung, Taiwan`,
    `- Service Models: Full-time / Part-time / Advisory (No gambling, crypto, or exchange projects)`,
    '',
    '## Core Expertise & Advisory Services',
    '',
    '- Technical Due Diligence & Architecture Audits: Independent technical evaluation for investors, boards, and founders.',
    '- Legacy System Refactoring & High Concurrency: Resolving system bottlenecks, data fragmentation, and scalability issues.',
    '- AI Applications & Workflow Automation: Building customized LLM tools, agentic systems, Chrome extensions, and bot workflows.',
    '',
  ];

  const categoryMap = {
    social: 'Profile & Media Channels',
    extensions: 'Chrome Extensions',
    tools: 'Tools & Services',
    skills: 'Developer Skills & APIs',
    ai: 'AI Apps & Research',
    telegram: 'Telegram Bots',
    line: 'LINE Bots',
    others: 'Other Work',
  };

  const grouped = {};
  for (const item of links) {
    const tag = item.tag || 'others';
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(item);
  }

  const mainTags = ['social', 'extensions', 'tools', 'skills', 'ai', 'telegram', 'line'];

  for (const tag of mainTags) {
    const items = grouped[tag] || [];
    if (items.length === 0) continue;

    lines.push(`## ${categoryMap[tag]}`);
    lines.push('');

    for (const item of items) {
      const title = item.titleEn ? `${item.title} (${item.titleEn})` : item.title;
      const rawUrl = item.url || '';
      const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${siteOrigin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      const desc = item.description || item.descriptionEn || '';
      lines.push(desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`);
    }
    lines.push('');
  }

  const optionalItems = grouped.others || [];
  if (optionalItems.length > 0) {
    lines.push('## Optional');
    lines.push('');
    for (const item of optionalItems) {
      const title = item.titleEn ? `${item.title} (${item.titleEn})` : item.title;
      const rawUrl = item.url || '';
      const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${siteOrigin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      const desc = item.description || item.descriptionEn || '';
      lines.push(desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`);
    }
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function buildLlmsFullTxt({ profile, links, content, siteOrigin }) {
  const baseLlmsTxt = buildLlmsTxt({ profile, links, content, siteOrigin });

  const fullLines = [
    baseLlmsTxt.trim(),
    '',
    '---',
    '',
    '# Full Profile & Background Context',
    '',
    '## About David Chiang (Traditional Chinese)',
    '',
    `### ${content.zh.headline}`,
    `> ${content.zh.subHeadline}`,
    '',
  ];

  for (const block of content.zh.body) {
    if (block.kind === 'sectionTitle') {
      fullLines.push(`#### ${block.text}`);
    } else if (block.kind === 'bullet') {
      fullLines.push(`- ${block.text}`);
    } else if (block.kind === 'note') {
      fullLines.push(`> ${block.text}`);
    } else {
      fullLines.push(block.text);
    }
    fullLines.push('');
  }

  fullLines.push('## About David Chiang (English)');
  fullLines.push('');
  fullLines.push(`### ${content.en.headline}`);
  fullLines.push(`> ${content.en.subHeadline}`);
  fullLines.push('');

  for (const block of content.en.body) {
    if (block.kind === 'sectionTitle') {
      fullLines.push(`#### ${block.text}`);
    } else if (block.kind === 'bullet') {
      fullLines.push(`- ${block.text}`);
    } else if (block.kind === 'note') {
      fullLines.push(`> ${block.text}`);
    } else {
      fullLines.push(block.text);
    }
    fullLines.push('');
  }

  fullLines.push('## Detailed Item Catalog');
  fullLines.push('');

  for (const item of links) {
    const title = item.titleEn ? `${item.title} / ${item.titleEn}` : item.title;
    const url = item.url || '';
    const descZh = item.description || '';
    const descEn = item.descriptionEn || '';

    fullLines.push(`### ${title}`);
    if (url) fullLines.push(`- URL: ${url}`);
    if (item.tag) fullLines.push(`- Category: ${item.tag}`);
    if (item.section) fullLines.push(`- Section: ${item.section}`);
    if (descZh) fullLines.push(`- Description (ZH): ${descZh}`);
    if (descEn) fullLines.push(`- Description (EN): ${descEn}`);
    fullLines.push('');
  }

  return fullLines.join('\n').trim() + '\n';
}

export async function generateLlmsFiles({ projectRoot = process.cwd(), siteOrigin = 'https://david888.com' } = {}) {
  const dataDir = path.join(projectRoot, 'data');
  const publicDir = path.join(projectRoot, 'public');

  const profile = JSON.parse(await fs.readFile(path.join(dataDir, 'bento-profile.json'), 'utf8'));
  const links = JSON.parse(await fs.readFile(path.join(dataDir, 'bento-links.json'), 'utf8'));
  const content = JSON.parse(await fs.readFile(path.join(dataDir, 'profile-content.json'), 'utf8'));

  const llmsTxtContent = buildLlmsTxt({ profile, links, content, siteOrigin });
  const llmsFullTxtContent = buildLlmsFullTxt({ profile, links, content, siteOrigin });

  await fs.writeFile(path.join(publicDir, 'llms.txt'), llmsTxtContent, 'utf8');
  await fs.writeFile(path.join(publicDir, 'llms-full.txt'), llmsFullTxtContent, 'utf8');

  return {
    llmsTxt: llmsTxtContent,
    llmsFullTxt: llmsFullTxtContent,
  };
}
