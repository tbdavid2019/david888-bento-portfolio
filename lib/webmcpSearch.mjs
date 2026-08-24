function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

function getSearchFields(capability) {
  return [
    ['title', capability.title],
    ['titleEn', capability.titleEn],
    ['description', capability.description],
    ['descriptionEn', capability.descriptionEn],
    ['section', capability.section],
    ['sectionEn', capability.sectionEn],
    ['category', capability.categoryLabel],
    ['keywords', Array.isArray(capability.keywords) ? capability.keywords.join(' ') : ''],
  ].map(([name, value]) => [name, normalize(value)]);
}

export function rankCapabilities(query, capabilities, limit = 8) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || !Array.isArray(capabilities)) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const safeLimit = Math.max(1, Math.min(20, Math.trunc(Number(limit) || 8)));

  return capabilities
    .map((capability) => {
      const fields = getSearchFields(capability);
      const title = fields.find(([name]) => name === 'title')?.[1] ?? '';
      const titleEn = fields.find(([name]) => name === 'titleEn')?.[1] ?? '';
      const searchableText = fields.map(([, value]) => value).join(' ');
      let score = 0;
      const matchedFields = new Set();

      if (title === normalizedQuery || titleEn === normalizedQuery) {
        score += 120;
        matchedFields.add('title');
      } else if (title.includes(normalizedQuery) || titleEn.includes(normalizedQuery)) {
        score += 80;
        matchedFields.add('title');
      }

      for (const token of queryTokens) {
        if (title.includes(token) || titleEn.includes(token)) {
          score += 30;
          matchedFields.add('title');
        } else if (searchableText.includes(token)) {
          score += 10;
          const matchingField = fields.find(([, value]) => value.includes(token));
          if (matchingField) {
            matchedFields.add(matchingField[0]);
          }
        }
      }

      return {
        capability,
        score,
        matchedFields: [...matchedFields],
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || String(left.capability.id).localeCompare(String(right.capability.id)))
    .slice(0, safeLimit);
}
