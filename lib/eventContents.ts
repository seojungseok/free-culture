/** Convert provider markup to plain text. Never render provider HTML directly. */
export function eventContentsText(raw: string = ""): string {
  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    ndash: "–", mdash: "—", hellip: "…", middot: "·", bull: "•",
    lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", copy: "©", reg: "®",
  };
  let text = raw;
  // Some feeds escape already escaped HTML. Bound the passes for predictable cost.
  for (let i = 0; i < 3; i++) {
    const decoded = text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? whole;
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
    });
    if (decoded === text) break;
    text = decoded;
  }
  return text
    .replace(/<!--[^]*?(?:-->|$)/g, "")
    .replace(/<(script|style|iframe|noscript)\b[^>]*>[^]*?<\/\1\s*>/gi, "")
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<\/?(?:p|div|section|article|h[1-6]|ul|ol|blockquote|tr)\b[^>]*>/gi, "\n\n")
    .replace(/<\/(?:li|td|th)\s*>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t \u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Preserve source breaks; split long prose only at sentence boundaries. */
export function eventContentsParagraphs(raw: string = ""): string[] {
  return eventContentsText(raw).split(/\n\s*\n/).filter(Boolean).flatMap(block => {
    if (block.length <= 260 || block.includes("\n")) return [block];
    const sentences = block.split(/(?<=[.!?。])\s+(?=[가-힣A-Z《「“])/u);
    const paragraphs: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > 260) {
        paragraphs.push(current);
        current = "";
      }
      current += (current ? " " : "") + sentence;
    }
    if (current) paragraphs.push(current);
    return paragraphs;
  });
}
