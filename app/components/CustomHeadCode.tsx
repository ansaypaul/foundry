/**
 * Server Component qui parse du HTML et rend les tags meta/link/script
 * React 19 les hoist automatiquement dans le <head>
 */

interface ParsedTag {
  tag: string;
  attrs: Record<string, string>;
  content?: string;
}

function parseHtmlTags(html: string): ParsedTag[] {
  const tags: ParsedTag[] = [];

  // Meta et link (self-closing)
  const selfClosingRegex = /<(meta|link)\s+([^>]*?)\/?>/gi;
  let match;
  while ((match = selfClosingRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const attrsStr = match[2];
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w[\w-]*)=["']([^"']*?)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    tags.push({ tag, attrs });
  }

  // Script (with content)
  const scriptRegex = /<script\s*([^>]*?)>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrsStr = match[1];
    const content = match[2];
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w[\w-]*)=["']([^"']*?)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    tags.push({ tag: 'script', attrs, content: content.trim() });
  }

  return tags;
}

export default function CustomHeadCode({ code }: { code: string }) {
  if (!code) return null;

  const tags = parseHtmlTags(code);

  return (
    <>
      {tags.map((t, i) => {
        if (t.tag === 'meta') {
          return <meta key={`meta-${i}`} {...t.attrs} />;
        }
        if (t.tag === 'link') {
          return <link key={`link-${i}`} {...(t.attrs as any)} />;
        }
        if (t.tag === 'script') {
          if (t.content) {
            return (
              <script
                key={`script-${i}`}
                {...t.attrs}
                dangerouslySetInnerHTML={{ __html: t.content }}
              />
            );
          }
          return <script key={`script-${i}`} {...(t.attrs as any)} />;
        }
        return null;
      })}
    </>
  );
}
