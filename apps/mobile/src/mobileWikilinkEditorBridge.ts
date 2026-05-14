import {
  BridgeExtension,
  LinkBridge,
  TenTapStartKit,
} from '@10play/tentap-editor'
import type { Editor } from '@tiptap/core'

type InsertWikilinkMessage = {
  payload: {
    label: string
    target: string
  }
  type: 'insert-wikilink'
}

type InsertWikilinkCommand = {
  insertWikilink: (payload: InsertWikilinkMessage['payload']) => void
}

declare module '@10play/tentap-editor' {
  interface EditorBridge {
    insertWikilink: InsertWikilinkCommand['insertWikilink']
  }
}

export const mobileEditorBridgeExtensions = [
  ...TenTapStartKit,
  LinkBridge.configureExtension({
    autolink: true,
    openOnClick: false,
    protocols: ['tolaria-note'],
  }),
  new BridgeExtension<unknown, InsertWikilinkCommand, InsertWikilinkMessage>({
    forceName: 'tolaria-wikilink',
    onBridgeMessage: (editor, message) => {
      if (message.type !== 'insert-wikilink') {
        return false
      }

      return insertWikilink({ editor, ...message.payload })
    },
    extendEditorInstance: (sendBridgeMessage) => ({
      insertWikilink: (payload) => sendBridgeMessage({
        payload,
        type: 'insert-wikilink',
      }),
    }),
  }),
]

function insertWikilink({
  editor,
  label,
  target,
}: {
  editor: Editor
  label: string
  target: string
}) {
  editor.commands.focus()

  const range = activeWikilinkRange(editor)
  if (!range) {
    return false
  }

  return editor
    .chain()
    .deleteRange(range)
    .insertContent(wikilinkTextNode({ label, target }))
    .run()
}

function activeWikilinkRange(editor: Editor) {
  const { from } = editor.state.selection
  const textStart = Math.max(0, from - 200)
  const textBefore = editor.state.doc.textBetween(textStart, from, '\n', '\n')
  const triggerOffset = textBefore.lastIndexOf('[[')
  if (triggerOffset < 0) {
    return null
  }

  const query = textBefore.slice(triggerOffset + 2)
  if (query.includes(']]') || query.includes('\n')) {
    return null
  }

  return {
    from: textStart + triggerOffset,
    to: from,
  }
}

function wikilinkHref(target: string) {
  return `tolaria-note:${encodeURIComponent(target.trim())}`
}

function wikilinkTextNode({
  label,
  target,
}: {
  label: string
  target: string
}) {
  return {
    marks: [{
      attrs: { href: wikilinkHref(target) },
      type: 'link',
    }],
    text: label,
    type: 'text',
  }
}
