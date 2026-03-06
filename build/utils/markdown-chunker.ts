export const SCALE_FACTORS = {
  list: 1.4,
  code: 1.3,
  blockquote: 1.2,
  heading: 1.0,
  paragraph: 1.0,
};

export type BlockType = 'list' | 'code' | 'blockquote' | 'heading' | 'paragraph';

export type Block = {
  type: BlockType;
  content: string;
  effectiveLength: number;
};

export function parseMarkdownBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');
  
  let currentBlock: { type: BlockType; lines: string[] } | null = null;
  let inCodeBlock = false;
  
  const pushCurrentBlock = () => {
    if (currentBlock && currentBlock.lines.length > 0) {
      const blockContent = currentBlock.lines.join('\n');
      const scale = SCALE_FACTORS[currentBlock.type];
      blocks.push({
        type: currentBlock.type,
        content: blockContent,
        effectiveLength: Math.ceil(blockContent.length * scale),
      });
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

export function splitList(block: Block, remainingBudget: number): [string, string] {
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
  
  let usedLength = 0;
  let splitIndex = 0;
  
  for (let i = 0; i < items.length; i++) {
    const itemContent = items[i].join('\n');
    const itemEffectiveLength = Math.ceil(itemContent.length * SCALE_FACTORS.list);
    
    if (usedLength + itemEffectiveLength > remainingBudget && i > 0) {
      break;
    }
    usedLength += itemEffectiveLength;
    splitIndex = i + 1;
  }
  
  if (splitIndex === 0) {
    splitIndex = 1;
  }
  
  const firstPart = items.slice(0, splitIndex).map(item => item.join('\n')).join('\n');
  const secondPart = items.slice(splitIndex).map(item => item.join('\n')).join('\n');
  
  return [firstPart, secondPart];
}

export function splitCodeBlock(block: Block, remainingBudget: number): [string, string] {
  const lines = block.content.split('\n');
  
  const isFenced = lines[0]?.trim().startsWith('```');
  const fence = isFenced ? lines[0].match(/^(\s*```\w*)/)?.[1] || '```' : '';
  
  let usedLength = 0;
  let splitIndex = 0;
  
  const startIdx = isFenced ? 1 : 0;
  const endIdx = isFenced && lines[lines.length - 1]?.trim() === '```' ? lines.length - 1 : lines.length;
  
  for (let i = startIdx; i < endIdx; i++) {
    const lineLength = Math.ceil(lines[i].length * SCALE_FACTORS.code);
    if (usedLength + lineLength > remainingBudget && i > startIdx) {
      break;
    }
    usedLength += lineLength;
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

export function chunkContent(content: string, charsPerPage: number): string[] {
  const blocks = parseMarkdownBlocks(content);
  const chunks: string[] = [];
  
  let currentChunk = '';
  let currentEffectiveLength = 0;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    if (currentEffectiveLength + block.effectiveLength <= charsPerPage) {
      currentChunk += (currentChunk ? '\n\n' : '') + block.content;
      currentEffectiveLength += block.effectiveLength;
      continue;
    }
    
    const remainingBudget = charsPerPage - currentEffectiveLength;
    
    if (block.type === 'list' && block.effectiveLength > charsPerPage * 0.3) {
      const [firstPart, secondPart] = splitList(block, remainingBudget);
      
      if (firstPart && remainingBudget > charsPerPage * 0.2) {
        currentChunk += (currentChunk ? '\n\n' : '') + firstPart;
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentEffectiveLength = 0;
        
        if (secondPart) {
          const remainingBlock: Block = {
            type: 'list',
            content: secondPart,
            effectiveLength: Math.ceil(secondPart.length * SCALE_FACTORS.list),
          };
          blocks.splice(i + 1, 0, remainingBlock);
        }
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = '';
        currentEffectiveLength = 0;
        i--;
      }
    } else if (block.type === 'code' && block.effectiveLength > charsPerPage) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentEffectiveLength = 0;
      }
      
      const [firstPart, secondPart] = splitCodeBlock(block, charsPerPage);
      chunks.push(firstPart.trim());
      
      if (secondPart) {
        const remainingBlock: Block = {
          type: 'code',
          content: secondPart,
          effectiveLength: Math.ceil(secondPart.length * SCALE_FACTORS.code),
        };
        blocks.splice(i + 1, 0, remainingBlock);
      }
    } else if (block.type === 'paragraph' && block.effectiveLength > charsPerPage) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentEffectiveLength = 0;
      }
      
      const sentences = block.content.match(/[^.!?]+[.!?]+/g) || [block.content];
      for (const sentence of sentences) {
        const sentenceLength = sentence.length;
        if (currentEffectiveLength + sentenceLength > charsPerPage && currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
          currentEffectiveLength = sentenceLength;
        } else {
          currentChunk += sentence;
          currentEffectiveLength += sentenceLength;
        }
      }
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = block.content;
      currentEffectiveLength = block.effectiveLength;
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
