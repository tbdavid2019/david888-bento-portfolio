import fs from 'node:fs/promises';
import path from 'node:path';

export function buildLlmsTxt({ profile, links, content, siteOrigin, categories }) {
  const lines = [
    '# David Chiang (David888) - CTO & Technical Advisor Portfolio',
    '',
    `> ${content.zh.headline} / ${content.en.headline}. A CTO & Technical Advisor specializing in enterprise architecture, legacy refactoring, and business value creation.`,
    '',
    'David Chiang (David888) is a CTO and Technical Advisor with 10+ years of enterprise engineering leadership.',
    'Specializing in technical due diligence, high-concurrency eCommerce platforms, AI/LLM integration, Chrome extensions, Telegram & LINE bots, and developer tools.',
    '',
    `- Contact: Verified web contact form at ${siteOrigin}/ (anti-spam protected, direct dispatch to David)`,
    `- Website: ${siteOrigin}/`,
    `- Executive Advisory & CTO Dossier: ${siteOrigin}/executive`,
    `- 5 Core Commitments (Direct Route): ${siteOrigin}/commitments`,
    `- GitHub: https://github.com/tbdavid2019`,
    `- LinkedIn: https://www.linkedin.com/in/david11111/`,
    `- Location / Availability: ${profile.contactLine || '台北/高雄 可合作'} (${profile.contactLineEn || 'Taipei / Kaohsiung / Remote collaboration'})`,
    `- Service Models: Full-time / Part-time / Advisory (No gambling, crypto, or exchange projects)`,
    '',
    '## Core Expertise & Advisory Services',
    '',
    '- Technical Due Diligence & Architecture Audits: Independent technical evaluation for investors, boards, and founders, diagnosing tangled information flows, multi-channel integrations (banking, promos, logistics), single points of failure (SPOF), and compute waste.',
    '- Untangling Complex Architectures & Open-Source Thrift: Auditing sprawling legacy systems, untangling spaghetti business logic without downtime, eliminating SPOF with resilient fallbacks, and diagnosing bottlenecks with methodical ablation analysis.',
    '- AI Applications & Workflow Automation: Building customized LLM tools, agentic systems, Chrome extensions, and bot workflows.',
    '',
  ];

  const grouped = {};
  for (const item of links) {
    if (item.hidden) continue;
    const tag = item.tag || 'others';
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(item);
  }

  let executiveAdded = false;
  for (const category of categories) {
    const items = grouped[category.id] || [];
    if (items.length === 0) continue;

    lines.push(`## ${category.titleEn}`);
    lines.push('');

    for (const item of items) {
      const title = item.titleEn ? `${item.title} (${item.titleEn})` : item.title;
      const rawUrl = item.url || '';
      const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `${siteOrigin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      const desc = item.description || item.descriptionEn || '';
      lines.push(desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`);
    }
    lines.push('');

    if (category.id === 'social' && !executiveAdded) {
      executiveAdded = true;
      lines.push('## Ways to Work & Executive Advisory');
      lines.push('');
      lines.push(`- [Executive Advisory & CTO Dossier / 合作方式與高階技術顧問完整實績](${siteOrigin}/executive): 具百人團隊實戰經驗的技術長：為企業打造能扛大盤的好系統。百人團隊帶得動，複雜系統搞得定，商業問題講得清；管得住成本、控制得了風險，兼具大型研發組織管理經驗與技術深度，能在企業面臨重大技術決策時做出判斷並負責落地。`);
      lines.push(`- [Annual Technical Advisor / 年度企業技術顧問 (12-Month Retainer)](${siteOrigin}/executive): 適合需要系統重構、跨系統整合、整理技術債或擴編團隊的企業。依約定頻率參與架構檢視與技術決策、規劃電商與 CRM/ERP 串接、檢討雲端成本並培訓技術主管。`);
      lines.push(`- [CTO & VP of Engineering / 技術長與研發管理](${siteOrigin}/executive): 跨國企業、上市櫃公司、零售電商或科技公司全職技術管理職缺。負責技術戰略、100+ 人工程團隊管理、核心商務平台改版與交付穩定度。`);
      lines.push(`- [Technical Due Diligence & System Review / 技術盡職調查與系統診斷](${siteOrigin}/executive): 為投資人與企業提供投資併購前第三方技術評估（架構、程式碼品質、資安規範）；或針對疊床架屋的毛線團資訊流、多方渠道串接摩擦（銀行/金流/優惠/物流）與單點故障風險進行全面盤查，提供精準消融診斷與開源節流方案。`);
      lines.push(`- [5 Core Commitments for Non-Technical Leaders / 給不諳技術老闆的 5 大安心承諾](${siteOrigin}/commitments): 精準盤查開源節流（加錢堆機器誰都會，那毫無技術含金量）、梳理毛線團（消除 SPOF & 健全 Fallback）、風險分級按期交付、說人話聽得懂生意經、正派透明可受檢驗。`);
      lines.push('');
    }
  }

  if (!executiveAdded) {
    lines.push('## Ways to Work & Executive Advisory');
    lines.push('');
    lines.push(`- [Executive Advisory & CTO Dossier / 合作方式與高階技術顧問完整實績](${siteOrigin}/executive): 具百人團隊實戰經驗的技術長：為企業打造能扛大盤的好系統。百人團隊帶得動，複雜系統搞得定，商業問題講得清；管得住成本、控制得了風險，兼具大型研發組織管理經驗與技術深度，能在企業面臨重大技術決策時做出判斷並負責落地。`);
    lines.push(`- [Annual Technical Advisor / 年度企業技術顧問 (12-Month Retainer)](${siteOrigin}/executive): 適合需要系統重構、跨系統整合、整理技術債或擴編團隊的企業。依約定頻率參與架構檢視與技術決策、規劃電商與 CRM/ERP 串接、檢討雲端成本並培訓技術主管。`);
    lines.push(`- [CTO & VP of Engineering / 技術長與研發管理](${siteOrigin}/executive): 跨國企業、上市櫃公司、零售電商或科技公司全職技術管理職缺。負責技術戰略、100+ 人工程團隊管理、核心商務平台改版與交付穩定度。`);
    lines.push(`- [Technical Due Diligence & System Review / 技術盡職調查與系統診斷](${siteOrigin}/executive): 為投資人與企業提供投資併購前第三方技術評估（架構、程式碼品質、資安規範）；或針對疊床架屋的毛線團資訊流、多方渠道串接摩擦（銀行/金流/優惠/物流）與單點故障風險進行全面盤查，提供精準消融診斷與開源節流方案。`);
    lines.push(`- [5 Core Commitments for Non-Technical Leaders / 給不諳技術老闆的 5 大安心承諾](${siteOrigin}/commitments): 精準盤查開源節流（加錢堆機器誰都會，那毫無技術含金量）、梳理毛線團（消除 SPOF & 健全 Fallback）、風險分級按期交付、說人話聽得懂生意經、正派透明可受檢驗。`);
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function buildLlmsFullTxt({ profile, links, content, siteOrigin, categories }) {
  const baseLlmsTxt = buildLlmsTxt({ profile, links, content, siteOrigin, categories });

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
    if (item.hidden) continue;
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
  const categoryConfig = JSON.parse(await fs.readFile(path.join(dataDir, 'bento-categories.json'), 'utf8'));
  const content = JSON.parse(await fs.readFile(path.join(dataDir, 'profile-content.json'), 'utf8'));

  const categories = categoryConfig.categories;
  const llmsTxtContent = buildLlmsTxt({ profile, links, content, siteOrigin, categories });
  const llmsFullTxtContent = buildLlmsFullTxt({ profile, links, content, siteOrigin, categories });

  await fs.writeFile(path.join(publicDir, 'llms.txt'), llmsTxtContent, 'utf8');
  await fs.writeFile(path.join(publicDir, 'llms-full.txt'), llmsFullTxtContent, 'utf8');

  return {
    llmsTxt: llmsTxtContent,
    llmsFullTxt: llmsFullTxtContent,
  };
}
