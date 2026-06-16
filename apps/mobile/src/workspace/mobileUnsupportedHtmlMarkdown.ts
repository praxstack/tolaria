type HtmlSnippet = string
type MarkdownLine = string
type MarkdownLines = MarkdownLine[]
type ReadUnsupportedHtmlBlock = { lines: MarkdownLines; nextIndex: number }

export function readUnsupportedHtmlBlock(
  lines: MarkdownLines,
  startIndex: number,
): ReadUnsupportedHtmlBlock | null {
  if (!isDetailsOpenLine(lines[startIndex] ?? '')) return null

  const blockLines: MarkdownLines = []
  let index = startIndex
  while (index < lines.length) {
    const line = lines[index] ?? ''
    blockLines.push(line)
    index += 1
    if (isDetailsCloseLine(line)) break
  }

  return { lines: blockLines, nextIndex: index }
}

export function unsupportedHtmlBlockToParagraphHtml(
  lines: MarkdownLines,
  escapeHtml: (value: string) => string,
): HtmlSnippet {
  return `<p>${lines.map(escapeHtml).join('<br>')}</p>`
}

export function normalizeUnsupportedHtmlBlockMarkdown(markdown: string): string {
  const lines = markdown.split('\n').map(stripHardBreakMarker)
  return isUnsupportedDetailsParagraph(lines) ? lines.join('\n') : markdown
}

function isUnsupportedDetailsParagraph(lines: MarkdownLines): boolean {
  return lines.length >= 2
    && isDetailsOpenLine(lines[0] ?? '')
    && isDetailsCloseLine(lines.at(-1) ?? '')
}

function isDetailsOpenLine(line: MarkdownLine): boolean {
  return /^<details(?:\s|>)/u.test(line.trim())
}

function isDetailsCloseLine(line: MarkdownLine): boolean {
  return line.trim() === '</details>'
}

function stripHardBreakMarker(line: MarkdownLine): MarkdownLine {
  return line.endsWith('  ') ? line.slice(0, -2) : line
}
