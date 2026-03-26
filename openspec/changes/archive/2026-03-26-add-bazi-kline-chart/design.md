## Context

The portfolio uses a bento grid system to display various links, projects, and social profiles. Most items are managed via `data/bento-links.json` and rendered using generic or specialized card components in `BentoGrid.tsx`.

## Goals / Non-Goals

**Goals:**
- Integrate the "八字K線圖" (Bazi K-Line Chart) as a prominent section in the portfolio.
- Ensure the aesthetic matches the existing bento design.
- Provide a clear call to action to visit the full version at `https://bazi.david888.com`.

**Non-Goals:**
- Reimplementing the entire Bazi K-Line logic within this portfolio repository.
- Changing the overall layout of the bento grid significantly.

## Decisions

- **Decision 1: Use `BentoLinkCard` with custom styling.** Instead of creating a whole new component, we will use the existing `BentoLinkCard` but ensure it has a high-quality image and descriptive text.
- **Decision 2: Image Asset.** We will add a new image `public/assets/bazi-kline.png` (or similar) that represents the K-line chart.
- **Decision 3: Grid Placement.** The item will be added to `bento-links.json` with `colSpan: 1` or `2` depending on visual balance. Given its importance, `colSpan: 1` (standard) should suffice alongside other tools.

## Risks / Trade-offs

- **Risk:** The image might not load or might look blurry on different screen sizes.
- **Trade-off:** Using a link card is faster than building a custom interactive preview, which might be overkill for this portfolio.
