export type PaginationConfig = {
  columns: 1 | 2;
  charsPerPage?: number;
  pagination?: {
    columnWidth?: number;
    columnHeight?: number;
    lineHeight?: number;
    avgCharWidth?: number;
    safetyMargin?: number;
  };
};

export type BlockType = 'list' | 'code' | 'blockquote' | 'heading' | 'paragraph';

export type Block = {
  type: BlockType;
  content: string;
};

const DEFAULTS = {
  columns: 2 as const,
  columnWidth: 330,
  columnHeight: 540,
  lineHeight: 24,
  avgCharWidth: 8,
  safetyMargin: 0.85,
  blockOverhead: 50,
};

export function getCharsPerPage(config: PaginationConfig, themeScale: number = 1): number {
  if (config.charsPerPage) {
    return config.charsPerPage;
  }

  const p = config.pagination ?? {};
  const columnWidth = p.columnWidth ?? DEFAULTS.columnWidth;
  const columnHeight = p.columnHeight ?? DEFAULTS.columnHeight;
  const lineHeight = p.lineHeight ?? DEFAULTS.lineHeight;
  const avgCharWidth = p.avgCharWidth ?? DEFAULTS.avgCharWidth;
  const safetyMargin = p.safetyMargin ?? DEFAULTS.safetyMargin;
  const columns = config.columns ?? DEFAULTS.columns;

  const adjustedLineHeight = lineHeight * themeScale;
  const adjustedCharWidth = avgCharWidth * themeScale;

  const linesPerColumn = Math.floor(columnHeight / adjustedLineHeight);
  const charsPerLine = Math.floor(columnWidth / adjustedCharWidth);
  const charsPerPage = Math.floor(linesPerColumn * charsPerLine * columns * safetyMargin);

  return charsPerPage;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');

  let current: { type: BlockType; lines: string[] } | null = null;
  let inCodeBlock = false;

  const push = () => {
    if (current && current.lines.length > 0) {
      blocks.push({ type: current.type, content: current.lines.join('\n') });
    }
    current = null;
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        current?.lines.push(line);
        push();
        inCodeBlock = false;
      } else {
        push();
        inCodeBlock = true;
        current = { type: 'code', lines: [line] };
      }
      continue;
    }

    if (inCodeBlock) {
      current?.lines.push(line);
      continue;
    }

    if (line.trim() === '') {
      push();
      continue;
    }

    if (line.match(/^(\s*)([-*+]|\d+\.)\s/)) {
      if (current?.type === 'list') {
        current.lines.push(line);
      } else {
        push();
        current = { type: 'list', lines: [line] };
      }
    } else if (line.match(/^>\s?/)) {
      if (current?.type === 'blockquote') {
        current.lines.push(line);
      } else {
        push();
        current = { type: 'blockquote', lines: [line] };
      }
    } else if (line.match(/^#{1,6}\s/)) {
      push();
      blocks.push({ type: 'heading', content: line });
    } else {
      if (current?.type === 'list' && line.match(/^\s+/)) {
        current.lines.push(line);
      } else if (current?.type === 'blockquote') {
        current.lines.push(line);
      } else if (current?.type === 'paragraph') {
        current.lines.push(line);
      } else {
        push();
        current = { type: 'paragraph', lines: [line] };
      }
    }
  }

  push();
  return blocks;
}

function findSplitPoint(text: string, maxLen: number): number {
  if (text.length <= maxLen) return text.length;

  const sentenceBreaks = ['. ', '? ', '! '];
  for (const brk of sentenceBreaks) {
    const idx = text.lastIndexOf(brk, maxLen);
    if (idx > maxLen * 0.3) return idx + brk.length;
  }

  const clauseBreaks = [', ', '; ', ': '];
  for (const brk of clauseBreaks) {
    const idx = text.lastIndexOf(brk, maxLen);
    if (idx > maxLen * 0.3) return idx + brk.length;
  }

  const spaceIdx = text.lastIndexOf(' ', maxLen);
  if (spaceIdx > maxLen * 0.3) return spaceIdx + 1;

  return maxLen;
}

function splitParagraph(block: Block, budget: number): [string, string] {
  const splitAt = findSplitPoint(block.content, budget);
  return [block.content.slice(0, splitAt).trim(), block.content.slice(splitAt).trim()];
}

function splitList(block: Block, budget: number): [string, string] {
  const lines = block.content.split('\n');
  const items: string[][] = [];
  let currentItem: string[] = [];

  for (const line of lines) {
    if (line.match(/^(\s*)([-*+]|\d+\.)\s/) && currentItem.length > 0) {
      items.push(currentItem);
      currentItem = [line];
    } else {
      currentItem.push(line);
    }
  }
  if (currentItem.length > 0) items.push(currentItem);

  let used = 0;
  let splitIdx = 0;

  for (let i = 0; i < items.length; i++) {
    const itemLen = items[i].join('\n').length + DEFAULTS.blockOverhead;
    if (used + itemLen > budget && i > 0) break;
    used += itemLen;
    splitIdx = i + 1;
  }

  if (splitIdx === 0) splitIdx = 1;

  const first = items.slice(0, splitIdx).map(i => i.join('\n')).join('\n');
  const second = items.slice(splitIdx).map(i => i.join('\n')).join('\n');
  return [first, second];
}

function splitCode(block: Block, budget: number): [string, string] {
  const lines = block.content.split('\n');
  const isFenced = lines[0]?.trim().startsWith('```');
  const fence = isFenced ? lines[0] : '```';

  const startIdx = isFenced ? 1 : 0;
  const endIdx = isFenced && lines[lines.length - 1]?.trim() === '```' ? lines.length - 1 : lines.length;

  let used = fence.length * 2;
  let splitIdx = startIdx;

  for (let i = startIdx; i < endIdx; i++) {
    if (used + lines[i].length > budget && i > startIdx) break;
    used += lines[i].length;
    splitIdx = i + 1;
  }

  if (splitIdx <= startIdx) splitIdx = startIdx + 1;

  const firstLines = isFenced
    ? [fence, ...lines.slice(startIdx, splitIdx), '```']
    : lines.slice(0, splitIdx);
  const secondLines = splitIdx < endIdx
    ? (isFenced ? [fence, ...lines.slice(splitIdx, endIdx), '```'] : lines.slice(splitIdx))
    : [];

  return [firstLines.join('\n'), secondLines.join('\n')];
}

function splitBlockquote(block: Block, budget: number): [string, string] {
  const rawContent = block.content
    .split('\n')
    .map(l => l.replace(/^>\s?/, ''))
    .join(' ')
    .trim();

  const splitAt = findSplitPoint(rawContent, budget);
  const firstText = rawContent.slice(0, splitAt).trim();
  const secondText = rawContent.slice(splitAt).trim();

  const first = firstText ? '> ' + firstText : '';
  const second = secondText ? '> ' + secondText : '';

  return [first, second];
}

function splitBlock(block: Block, budget: number): [string, string] {
  switch (block.type) {
    case 'list':
      return splitList(block, budget);
    case 'code':
      return splitCode(block, budget);
    case 'blockquote':
      return splitBlockquote(block, budget);
    case 'paragraph':
    default:
      return splitParagraph(block, budget);
  }
}

export function chunkContent(content: string, charsPerPage: number): string[] {
  const blocks = parseBlocks(content);
  const chunks: string[] = [];

  let currentChunk = '';
  let currentLen = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockLen = block.content.length + DEFAULTS.blockOverhead;

    if (currentLen + blockLen <= charsPerPage) {
      currentChunk += (currentChunk ? '\n\n' : '') + block.content;
      currentLen += blockLen;
      continue;
    }

    if (block.type === 'heading') {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = block.content;
      currentLen = blockLen;
      continue;
    }

    const remainingBudget = charsPerPage - currentLen - DEFAULTS.blockOverhead;
    
    if (remainingBudget > 100 && block.type !== 'heading') {
      const [first, second] = splitBlock(block, remainingBudget);
      
      if (first && first.trim()) {
        currentChunk += (currentChunk ? '\n\n' : '') + first;
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentLen = 0;
        
        if (second && second.trim()) {
          let remaining = second;
          let remainingType = block.type;
          
          while (remaining.length > 0) {
            const remLen = remaining.length + DEFAULTS.blockOverhead;
            if (remLen <= charsPerPage) {
              currentChunk = remaining;
              currentLen = remLen;
              break;
            }
            const [part, rest] = splitBlock({ type: remainingType, content: remaining }, charsPerPage);
            if (part) chunks.push(part.trim());
            remaining = rest;
            if (!remaining) break;
          }
        }
        continue;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    if (blockLen <= charsPerPage) {
      currentChunk = block.content;
      currentLen = blockLen;
    } else {
      currentChunk = '';
      currentLen = 0;

      let remaining = block.content;
      let remainingType = block.type;

      while (remaining.length > 0) {
        const [first, second] = splitBlock({ type: remainingType, content: remaining }, charsPerPage);

        if (first) {
          chunks.push(first.trim());
        }

        remaining = second;
        if (!remaining) break;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0) {
    chunks.push(content);
  }

  return chunks;
}
