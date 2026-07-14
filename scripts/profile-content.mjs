import fs from 'node:fs/promises';
import path from 'node:path';

function stripInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseProfileMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const body = [];
  let headline = '';
  let subHeadline = '';
  let paragraphLines = [];

  const flushParagraph = () => {
    const text = stripInlineMarkdown(paragraphLines.join(' '));
    paragraphLines = [];

    if (!text) return;
    if (!headline) {
      headline = text;
      return;
    }

    body.push({ kind: 'paragraph', text });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const text = stripInlineMarkdown(headingMatch[1]);
      if (!headline) {
        headline = text;
      } else {
        body.push({ kind: 'sectionTitle', text });
      }
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      const text = stripInlineMarkdown(quoteMatch[1]);
      if (!subHeadline) {
        subHeadline = text;
      } else if (text) {
        body.push({ kind: 'note', text });
      }
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      body.push({ kind: 'bullet', text: stripInlineMarkdown(bulletMatch[1]) });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();

  if (!headline) throw new Error('Profile Markdown must contain a headline.');
  if (!subHeadline) throw new Error('Profile Markdown must contain a sub-headline blockquote.');

  return { headline, subHeadline, body };
}

export async function generateProfileContent({ projectRoot = process.cwd() } = {}) {
  const dataDir = path.join(projectRoot, 'data');
  const locales = ['zh', 'en'];
  const content = {};

  for (const locale of locales) {
    const markdownPath = path.join(dataDir, `profile-content.${locale}.md`);
    const markdown = await fs.readFile(markdownPath, 'utf8');
    content[locale] = parseProfileMarkdown(markdown);
  }

  await fs.writeFile(
    path.join(dataDir, 'profile-content.json'),
    `${JSON.stringify(content, null, 2)}\n`,
    'utf8',
  );

  return content;
}
