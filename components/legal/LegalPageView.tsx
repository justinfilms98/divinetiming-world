import Link from 'next/link';

interface LegalPageViewProps {
  title: string;
  bodyMd: string;
  updatedAt: string;
}

/**
 * Simple markdown-ish renderer for legal copy.
 * Supports:
 *  - blockquote (>...)
 *  - h2 (## ...)
 *  - bullet list (- ...)
 *  - paragraphs split by blank lines
 *  - inline **bold**
 *
 * Intentionally minimal — no external dependency. If legal copy gets richer,
 * swap this out for a markdown library (react-markdown).
 */
export function LegalPageView({ title, bodyMd, updatedAt }: LegalPageViewProps) {
  const blocks = parseBlocks(bodyMd);
  const updated = new Date(updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <div className="flex flex-col w-full max-w-[100vw] overflow-x-clip bg-[var(--bg)]">
      <main className="flex-1 py-20 md:py-28">
        <article className="max-w-3xl mx-auto px-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] transition-colors duration-200 mb-10 text-sm"
          >
            ← Home
          </Link>
          <h1
            className="type-h1 text-[var(--text)] mb-3 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-[0.2em] mb-12">
            Last updated: {updated}
          </p>
          <div className="space-y-5 text-[var(--text)] leading-relaxed type-body">
            {blocks.map((b, i) => (
              <RenderBlock key={i} block={b} />
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'blockquote'; text: string }
  | { kind: 'ul'; items: string[] };

function parseBlocks(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;
  let buf: string[] = [];
  const flushParagraph = () => {
    if (buf.length) {
      const text = buf.join(' ').trim();
      if (text) blocks.push({ kind: 'p', text });
      buf = [];
    }
  };
  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      blocks.push({ kind: 'h2', text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('> ')) {
      flushParagraph();
      const items: string[] = [line.slice(2).trim()];
      i++;
      while (i < lines.length && (lines[i] ?? '').startsWith('> ')) {
        items.push((lines[i] ?? '').slice(2).trim());
        i++;
      }
      blocks.push({ kind: 'blockquote', text: items.join(' ') });
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('- ')) {
        items.push((lines[i] ?? '').trim().slice(2).trim());
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    buf.push(line);
    i++;
  }
  flushParagraph();
  return blocks;
}

function RenderBlock({ block }: { block: Block }) {
  if (block.kind === 'h2') {
    return (
      <h2
        className="type-h3 text-[var(--text)] mt-10 mb-3 tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {block.text}
      </h2>
    );
  }
  if (block.kind === 'blockquote') {
    return (
      <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic text-[var(--text-muted)] my-6">
        {renderInline(block.text)}
      </blockquote>
    );
  }
  if (block.kind === 'ul') {
    return (
      <ul className="list-disc pl-6 space-y-1.5 text-[var(--text)]">
        {block.items.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-[var(--text)]">{renderInline(block.text)}</p>;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}
