export type PaginationConfig = {
  columns: 1 | 2;
  linesPerPage?: number;
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
  estimatedLines: number;
};

const DEFAULTS = {
  columns: 2 as const,
  columnWidth: 330,
  columnHeight: 540,
  lineHeight: 24,
  avgCharWidth: 8,
  safetyMargin: 0.85,
};

export function getLinesPerPage(config: PaginationConfig, themeScale: number = 1): number {
  if (config.linesPerPage) {
    return config.linesPerPage;
  }

  const p = config.pagination ?? {};
  const columnWidth = p.columnWidth ?? DEFAULTS.columnWidth;
  const columnHeight = p.columnHeight ?? DEFAULTS.columnHeight;
  const lineHeight = p.lineHeight ?? DEFAULTS.lineHeight;
  const safetyMargin = p.safetyMargin ?? DEFAULTS.safetyMargin;
  const columns = config.columns ?? DEFAULTS.columns;

  const adjustedLineHeight = lineHeight * themeScale;
  const linesPerColumn = Math.floor(columnHeight / adjustedLineHeight);
  const linesPerPage = Math.floor(linesPerColumn * columns * safetyMargin);

  return linesPerPage;
}

export function getCharsPerLine(config: PaginationConfig, themeScale: number = 1): number {
  const p = config.pagination ?? {};
  const columnWidth = p.columnWidth ?? DEFAULTS.columnWidth;
  const avgCharWidth = p.avgCharWidth ?? DEFAULTS.avgCharWidth;

  const adjustedCharWidth = avgCharWidth * themeScale;
  return Math.floor(columnWidth / adjustedCharWidth);
}

function estimateParagraphLines(content: string, charsPerLine: number): number {
  return Math.ceil(content.length / charsPerLine);
}

function estimateHeadingLines(content: string, charsPerLine: number): number {
  const headingCharsPerLine = Math.floor(charsPerLine * 0.7);
  return Math.ceil(content.length / headingCharsPerLine) + 1;
}

function estimateListLines(content: string, charsPerLine: number): number {
  const lines = content.split('\n');
  let totalLines = 0;

  for (const line of lines) {
    const effectiveChars = charsPerLine - 4;
    totalLines += Math.max(1, Math.ceil(line.length / effectiveChars));
  }

  return totalLines;
}

function estimateCodeLines(content: string, charsPerLine: number): number {
  const lines = content.split('\n');
  let totalLines = 0;
  const codeCharsPerLine = Math.floor(charsPerLine * 0.85);

  for (const line of lines) {
    totalLines += Math.max(1, Math.ceil(line.length / codeCharsPerLine));
  }

  return totalLines;
}

function estimateBlockquoteLines(content: string, charsPerLine: number): number {
  const quoteCharsPerLine = Math.floor(charsPerLine * 0.9);
  const lines = content.split('\n');
  let totalLines = 0;

  for (const line of lines) {
    totalLines += Math.max(1, Math.ceil(line.length / quoteCharsPerLine));
  }

  return totalLines + 1;
}

export function estimateBlockLines(block: Block, charsPerLine: number): number {
  switch (block.type) {
    case 'heading':
      return estimateHeadingLines(block.content, charsPerLine);
    case 'list':
      return estimateListLines(block.content, charsPerLine);
    case 'code':
      return estimateCodeLines(block.content, charsPerLine);
    case 'blockquote':
      return estimateBlockquoteLines(block.content, charsPerLine);
    case 'paragraph':
    default:
      return estimateParagraphLines(block.content, charsPerLine);
  }
}

export function parseMarkdownBlocks(content: string, charsPerLine: number): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');

  let currentBlock: { type: BlockType; lines: string[] } | null = null;
  let inCodeBlock = false;

  const pushCurrentBlock = () => {
    if (currentBlock && currentBlock.lines.length > 0) {
      const blockContent = currentBlock.lines.join('\n');
      const block: Block = {
        type: currentBlock.type,
        content: blockContent,
        estimatedLines: 0,
      };
      block.estimatedLines = estimateBlockLines(block, charsPerLine);
      blocks.push(block);
    }
    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        if (currentBlock) {
          currentBlock.lines.push(line);
        }
        pushCurrentBlock();
        inCodeBlock = false;
        continue;
      } else {
        pushCurrentBlock();
        inCodeBlock = true;
        currentBlock = { type: 'code', lines: [line] };
        continue;
      }
    }

    if (inCodeBlock) {
      if (currentBlock) {
        currentBlock.lines.push(line);
      }
      continue;
    }

    if (line.trim() === '') {
      pushCurrentBlock();
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
    const blockquoteMatch = line.match(/^>\s?/);
    const headingMatch = line.match(/^#{1,6}\s/);

    if (listMatch) {
      if (currentBlock?.type === 'list') {
        currentBlock.lines.push(line);
      } else {
        pushCurrentBlock();
        currentBlock = { type: 'list', lines: [line] };
      }
    } else if (blockquoteMatch) {
      if (currentBlock?.type === 'blockquote') {
        currentBlock.lines.push(line);
      } else {
        pushCurrentBlock();
        currentBlock = { type: 'blockquote', lines: [line] };
      }
    } else if (headingMatch) {
      pushCurrentBlock();
      currentBlock = { type: 'heading', lines: [line] };
      pushCurrentBlock();
    } else {
      if (currentBlock?.type === 'list' && line.match(/^\s+/)) {
        currentBlock.lines.push(line);
      } else if (currentBlock?.type === 'paragraph') {
        currentBlock.lines.push(line);
      } else {
        pushCurrentBlock();
        currentBlock = { type: 'paragraph', lines: [line] };
      }
    }
  }

  pushCurrentBlock();
  return blocks;
}

function splitListByLines(block: Block, remainingLines: number, charsPerLine: number): [string, string] {
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
  if (currentItem.length > 0) {
    items.push(currentItem);
  }

  let usedLines = 0;
  let splitIndex = 0;
  const effectiveChars = charsPerLine - 4;

  for (let i = 0; i < items.length; i++) {
    let itemLines = 0;
    for (const line of items[i]) {
      itemLines += Math.max(1, Math.ceil(line.length / effectiveChars));
    }

    if (usedLines + itemLines > remainingLines && i > 0) {
      break;
    }
    usedLines += itemLines;
    splitIndex = i + 1;
  }

  const firstPart = items.slice(0, splitIndex).map(item => item.join('\n')).join('\n');
  const secondPart = items.slice(splitIndex).map(item => item.join('\n')).join('\n');

  return [firstPart, secondPart];
}

function splitCodeByLines(block: Block, remainingLines: number, charsPerLine: number): [string, string] {
  const lines = block.content.split('\n');
  const isFenced = lines[0]?.trim().startsWith('```');
  const fence = isFenced ? lines[0].match(/^(\s*```\w*)/)?.[1] || '```' : '';

  const codeCharsPerLine = Math.floor(charsPerLine * 0.85);
  let usedLines = 0;
  let splitIndex = 0;

  const startIdx = isFenced ? 1 : 0;
  const endIdx = isFenced && lines[lines.length - 1]?.trim() === '```' ? lines.length - 1 : lines.length;

  for (let i = startIdx; i < endIdx; i++) {
    const lineCount = Math.max(1, Math.ceil(lines[i].length / codeCharsPerLine));
    if (usedLines + lineCount > remainingLines && i > startIdx) {
      break;
    }
    usedLines += lineCount;
    splitIndex = i + 1;
  }

  if (splitIndex <= startIdx) {
    splitIndex = startIdx + 1;
  }

  let firstPart: string;
  let secondPart: string;

  if (isFenced) {
    firstPart = [lines[0], ...lines.slice(1, splitIndex), '```'].join('\n');
    secondPart = splitIndex < endIdx
      ? [fence, ...lines.slice(splitIndex, endIdx), '```'].join('\n')
      : '';
  } else {
    firstPart = lines.slice(0, splitIndex).join('\n');
    secondPart = lines.slice(splitIndex).join('\n');
  }

  return [firstPart, secondPart];
}

export function chunkContent(
  content: string,
  linesPerPage: number,
  charsPerLine: number
): string[] {
  const blocks = parseMarkdownBlocks(content, charsPerLine);
  const chunks: string[] = [];

  let currentChunk = '';
  let currentLines = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (currentLines + block.estimatedLines <= linesPerPage) {
      currentChunk += (currentChunk ? '\n\n' : '') + block.content;
      currentLines += block.estimatedLines;
      continue;
    }

    if (block.type === 'list' || block.type === 'code') {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      if (block.estimatedLines <= linesPerPage) {
        currentChunk = block.content;
        currentLines = block.estimatedLines;
      } else {
        const remainingLines = linesPerPage;

        if (block.type === 'list') {
          const [firstPart, secondPart] = splitListByLines(block, remainingLines, charsPerLine);
          if (firstPart.trim()) {
            chunks.push(firstPart.trim());
          }
          if (secondPart.trim()) {
            const remainingBlock: Block = {
              type: 'list',
              content: secondPart,
              estimatedLines: estimateBlockLines({ type: 'list', content: secondPart, estimatedLines: 0 }, charsPerLine),
            };
            blocks.splice(i + 1, 0, remainingBlock);
          }
          currentChunk = '';
          currentLines = 0;
        } else if (block.type === 'code') {
          const [firstPart, secondPart] = splitCodeByLines(block, remainingLines, charsPerLine);
          if (firstPart.trim()) {
            chunks.push(firstPart.trim());
          }
          if (secondPart.trim()) {
            const remainingBlock: Block = {
              type: 'code',
              content: secondPart,
              estimatedLines: estimateBlockLines({ type: 'code', content: secondPart, estimatedLines: 0 }, charsPerLine),
            };
            blocks.splice(i + 1, 0, remainingBlock);
          }
          currentChunk = '';
          currentLines = 0;
        }
      }
    } else if (block.type === 'paragraph' && block.estimatedLines > linesPerPage) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentLines = 0;
      }

      const sentences = block.content.match(/[^.!?]+[.!?]+/g) || [block.content];
      for (const sentence of sentences) {
        const sentenceLines = Math.ceil(sentence.length / charsPerLine);
        if (currentLines + sentenceLines > linesPerPage && currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
          currentLines = sentenceLines;
        } else {
          currentChunk += sentence;
          currentLines += sentenceLines;
        }
      }
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = block.content;
      currentLines = block.estimatedLines;
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
