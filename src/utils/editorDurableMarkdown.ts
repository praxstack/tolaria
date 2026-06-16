import {
  hasDurableMarkdownBlocks,
  injectDurableMarkdownBlocks,
  preProcessDurableMarkdownBlocks,
  serializeDurableMarkdownBlocks,
  type MarkdownSerializer,
} from './durableMarkdownBlocks'
import {
  hasFileAttachmentBlocks,
  injectFileAttachmentBlocks,
  preProcessFileAttachmentMarkdown,
  serializeFileAttachmentBlocks,
} from './fileAttachmentMarkdown'
import { restoreMarkdownHighlightsInBlocks } from './markdownHighlightMarkdown'
import { serializeMathAwareBlocks } from './mathMarkdown'
import { isCalloutBlock, serializeCalloutBlock } from './calloutMarkdown'
import { mermaidMarkdownCodec } from './mermaidMarkdown'
import { tldrawMarkdownCodec } from './tldrawMarkdown'

const EDITOR_DURABLE_MARKDOWN_CODECS = [
  mermaidMarkdownCodec,
  tldrawMarkdownCodec,
] as const

export function preProcessDurableEditorMarkdown({ markdown }: { markdown: string }): string {
  const withDurableBlocks = preProcessDurableMarkdownBlocks({
    markdown,
    codecs: EDITOR_DURABLE_MARKDOWN_CODECS,
  })
  return preProcessFileAttachmentMarkdown({ markdown: withDurableBlocks })
}

export function injectDurableEditorMarkdownBlocks(blocks: unknown[]): unknown[] {
  const withDurableBlocks = injectDurableMarkdownBlocks({
    blocks,
    codecs: EDITOR_DURABLE_MARKDOWN_CODECS,
  })
  return injectFileAttachmentBlocks(withDurableBlocks)
}

function serializeCalloutAndMathAwareBlocks(editor: MarkdownSerializer, blocks: unknown[]): string {
  const chunks: string[] = []
  let pending: unknown[] = []

  const flush = () => {
    if (pending.length === 0) return
    const markdown = serializeMathAwareBlocks(editor, restoreMarkdownHighlightsInBlocks(pending)).trimEnd()
    if (markdown) chunks.push(markdown)
    pending = []
  }

  for (const block of blocks) {
    if (isCalloutBlock(block as Parameters<typeof isCalloutBlock>[0])) {
      flush()
      chunks.push(serializeCalloutBlock(block as Parameters<typeof serializeCalloutBlock>[0]))
      continue
    }
    pending.push(block)
  }
  flush()
  return chunks.join('\n\n')
}

export function serializeDurableEditorBlocks(
  editor: MarkdownSerializer,
  blocks: unknown[],
  vaultPath?: string,
): string {
  return serializeFileAttachmentBlocks({
    blocks,
    vaultPath,
    serializeOrdinaryBlocks: ordinaryBlocks => serializeDurableMarkdownBlocks({
      blocks: ordinaryBlocks,
      codecs: EDITOR_DURABLE_MARKDOWN_CODECS,
      serializeOrdinaryBlocks: durableOrdinaryBlocks => serializeCalloutAndMathAwareBlocks(
        editor,
        durableOrdinaryBlocks,
      ),
    }),
  })
}

export function hasDurableEditorBlocks(blocks: unknown[]): boolean {
  return hasFileAttachmentBlocks(blocks) || hasDurableMarkdownBlocks({
    blocks,
    codecs: EDITOR_DURABLE_MARKDOWN_CODECS,
  })
}
