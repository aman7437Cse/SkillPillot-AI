import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div className="space-y-3 leading-relaxed text-sm text-slate-200 font-sans break-words">
      {renderMarkdownBlocks(content)}
    </div>
  );
};

function renderMarkdownBlocks(text: string) {
  // Regex to split on fenced code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      blocks.push(renderTextMarkdown(textBefore, `text-${lastIndex}`));
    }

    const language = match[1]?.trim() || 'code';
    const code = match[2];
    blocks.push(
      <CodeSnippetBlock
        key={`code-${match.index}`}
        code={code}
        language={language}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    blocks.push(renderTextMarkdown(remaining, `text-${lastIndex}`));
  }

  return blocks;
}

function CodeSnippetBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md my-3 font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language || 'snippet'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans">Copy code</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed font-mono select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderTextMarkdown(text: string, keyPrefix: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`${keyPrefix}-h4-${i}`} className="text-base font-bold text-white mt-3 mb-1.5 flex items-center gap-2">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`${keyPrefix}-h3-${i}`} className="text-lg font-extrabold text-white mt-4 mb-2">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`${keyPrefix}-h2-${i}`} className="text-xl font-black text-white mt-4 mb-2">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`${keyPrefix}-quote-${i}`}
          className="border-l-2 border-indigo-500 pl-3 py-1 my-2 text-slate-300 italic bg-indigo-950/20 rounded-r-lg"
        >
          {renderInlineFormatting(line.slice(2))}
        </blockquote>
      );
    }
    // Horizontal divider
    else if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`${keyPrefix}-hr-${i}`} className="border-slate-800 my-3" />);
    }
    // Bullet item
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={`${keyPrefix}-li-${i}`} className="ml-4 list-disc text-slate-200 my-0.5">
          {renderInlineFormatting(line.trim().slice(2))}
        </li>
      );
    }
    // Numbered item
    else if (/^\d+\.\s/.test(line.trim())) {
      const dotIndex = line.trim().indexOf('. ');
      elements.push(
        <li key={`${keyPrefix}-oli-${i}`} className="ml-4 list-decimal text-slate-200 my-0.5">
          {renderInlineFormatting(line.trim().slice(dotIndex + 2))}
        </li>
      );
    }
    // Empty line
    else if (!line.trim()) {
      elements.push(<div key={`${keyPrefix}-blank-${i}`} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={`${keyPrefix}-p-${i}`} className="my-1 text-slate-200">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }

  return <div key={keyPrefix}>{elements}</div>;
}

function renderInlineFormatting(line: string): React.ReactNode {
  // Parse inline code: `code`
  const parts: React.ReactNode[] = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineCodeRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(parseBoldItalics(line.slice(lastIdx, match.index), `txt-${lastIdx}`));
    }
    parts.push(
      <code
        key={`code-inline-${match.index}`}
        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-indigo-300 font-mono text-[12px]"
      >
        {match[1]}
      </code>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < line.length) {
    parts.push(parseBoldItalics(line.slice(lastIdx), `txt-${lastIdx}`));
  }

  return parts;
}

function parseBoldItalics(text: string, keyPrefix: string): React.ReactNode {
  // Parse **bold** and *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span key={keyPrefix}>
      {tokens.map((token, idx) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <strong key={idx} className="font-bold text-white">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('*') && token.endsWith('*')) {
          return (
            <em key={idx} className="italic text-slate-300">
              {token.slice(1, -1)}
            </em>
          );
        }
        return token;
      })}
    </span>
  );
}
