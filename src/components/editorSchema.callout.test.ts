import { BlockNoteEditor } from '@blocknote/core'
import { describe, expect, it } from 'vitest'
import { CALLOUT_BLOCK_TYPE, injectCalloutBlocks } from '../utils/calloutMarkdown'
import { serializeDurableEditorBlocks } from '../utils/editorDurableMarkdown'
import { schema } from './editorSchema'

// Integration: markdown -> blocks -> inject -> callout block -> serialize -> markdown.
// This is the note-corruption guard: a callout authored in markdown must come back
// out as the same callout markdown after a parse/serialise cycle.
describe('editor schema callout integration', () => {
  async function roundTrip(markdown: string): Promise<string> {
    const editor = BlockNoteEditor.create({ schema })
    const parsed = await editor.tryParseMarkdownToBlocks(markdown)
    const injected = injectCalloutBlocks(parsed)
    // Re-hydrate the injected blocks into the editor so serialisation sees them.
    editor.replaceBlocks(editor.document, injected as Parameters<typeof editor.replaceBlocks>[1])
    return serializeDurableEditorBlocks(editor, editor.document).trim()
  }

  it('parses a [!tip] blockquote into a callout block', async () => {
    const editor = BlockNoteEditor.create({ schema })
    const parsed = await editor.tryParseMarkdownToBlocks('> [!tip] Hello\n> body')
    const injected = injectCalloutBlocks(parsed)
    expect(injected[0]).toMatchObject({
      type: CALLOUT_BLOCK_TYPE,
      props: { calloutType: 'tip', title: 'Hello', body: 'body' },
    })
  })

  it('round-trips a single-line callout', async () => {
    expect(await roundTrip('> [!warning] Careful')).toBe('> [!warning] Careful')
  })

  it('round-trips a callout with body', async () => {
    expect(await roundTrip('> [!tip] Title\n> body one')).toBe('> [!tip] Title\n> body one')
  })

  it('round-trips a multi-line (3+) callout body end-to-end', async () => {
    expect(await roundTrip('> [!tip] T\n> a\n> b')).toBe('> [!tip] T\n> a\n> b')
  })

  it('round-trips a multi-line body with a fold modifier', async () => {
    expect(await roundTrip('> [!example]+ Open\n> line one\n> line two')).toBe('> [!example]+ Open\n> line one\n> line two')
  })

  it('does not emit a spurious bare ">" when the marker title is whitespace-only', async () => {
    expect(await roundTrip('> [!tip]    \n> body')).toBe('> [!tip]\n> body')
  })

  it('does not emit a trailing bare ">" for an interior-blank callout body', async () => {
    expect(await roundTrip('> [!tip] T\n> a\n>\n> b')).toBe('> [!tip] T\n> a\n> b')
  })

  it('leaves an ordinary blockquote unchanged', async () => {
    const editor = BlockNoteEditor.create({ schema })
    const parsed = await editor.tryParseMarkdownToBlocks('> just a quote')
    const injected = injectCalloutBlocks(parsed)
    expect(injected[0]).toMatchObject({ type: 'quote' })
  })
})
