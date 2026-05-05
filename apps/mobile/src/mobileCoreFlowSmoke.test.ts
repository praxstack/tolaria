import { describe, expect, it } from 'vitest'
import { createMobileEditorDraft } from './mobileEditorDraft'
import { saveMobileEditorDraft } from './mobileEditorDraftSave'
import { createMobileNoteFile } from './mobileNoteCreate'
import { saveMobileNoteFrontmatter } from './mobileNoteFrontmatterSave'
import { createMobileVaultConfig, type MobileVaultConfig } from './mobileVaultConfig'
import { createStoredMobileVaultRepository } from './mobileVaultRepository'
import { createMemoryMobileVaultStorage, type MobileVaultStorageDriver } from './mobileVaultStorage'

describe('mobile core flow smoke', () => {
  it('creates, opens, edits, updates properties, and deletes an app-local note', async () => {
    const vault = createVault()
    const storage = createMemoryMobileVaultStorage([])
    const noteId = await createNote({ storage, vault })

    const openedNote = await readNote({ noteId, storage, vault })
    expect(openedNote).toMatchObject({ id: noteId, title: 'Morning Plan', type: 'Note' })

    await saveEditorContent({ note: openedNote, storage, vault })
    await expect(storage.readMarkdownFile(vault, `${noteId}.md`)).resolves.toBe([
      '---',
      'title: Morning Plan',
      'type: Note',
      'created: 2026-05-05T08:00:00.000Z',
      '---',
      '# Morning Plan',
      '',
      'Edited agenda',
      '',
      '> Follow up',
    ].join('\n'))

    await saveMobileNoteFrontmatter({
      metadata: {
        date: '5 May 2026',
        icon: 'wrench',
        status: 'Active',
        tags: ['Tolaria MVP', 'mobile'],
        type: 'Project',
      },
      noteId,
      storage,
      vault,
    })

    await expect(readNote({ noteId, storage, vault })).resolves.toMatchObject({
      date: '5 May 2026',
      icon: 'wrench',
      status: 'Active',
      tags: ['Tolaria MVP', 'mobile'],
      type: 'Project',
    })

    await repository({ storage, vault }).deleteNote(noteId)
    await expect(repository({ storage, vault }).readNote(noteId)).resolves.toBeNull()
  })
})

async function createNote({
  storage,
  vault,
}: {
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}) {
  const file = createMobileNoteFile({
    now: new Date('2026-05-05T08:00:00.000Z'),
    title: 'Morning Plan',
  })
  await storage.writeMarkdownFile(vault, file.path, file.content)

  return file.path.replace(/\.md$/, '')
}

async function readNote({
  noteId,
  storage,
  vault,
}: {
  noteId: string
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}) {
  const note = await repository({ storage, vault }).readNote(noteId)
  if (!note) {
    throw new Error(`Expected note ${noteId}`)
  }

  return note
}

async function saveEditorContent({
  note,
  storage,
  vault,
}: {
  note: Awaited<ReturnType<typeof readNote>>
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}) {
  await saveMobileEditorDraft({
    draft: createMobileEditorDraft({
      note,
      editorHtml: '<h1>Morning Plan</h1><p>Edited agenda</p><blockquote><p>Follow up</p></blockquote>',
    }),
    storage,
    vault,
  })
}

function repository({
  storage,
  vault,
}: {
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}) {
  return createStoredMobileVaultRepository({ storage, vault })
}

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
