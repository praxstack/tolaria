import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'

describe('mobile note creation parity', () => {
  it('blocks named note creation when the desktop target path already exists', () => {
    const base = workspaceScenarioForId('default')
    const existingNote = {
      ...base.notes[0],
      id: 'Writing/Launch/launch-checklist.md',
      path: 'Writing/Launch/launch-checklist.md',
    }
    const snapshot = {
      ...base,
      allNotes: [existingNote, ...base.notes],
      notes: [existingNote, ...base.notes],
    }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, {
      defaults: { folderPath: 'Writing/Launch' },
      title: 'Launch Checklist',
      type: 'createNote',
    })

    expect(result.writes).toEqual([])
    expect(result.snapshot.notes).toHaveLength(snapshot.notes.length)
    expect(result.snapshot.selectedNoteId).toBe(snapshot.selectedNoteId)
  })

  it('blocks relationship target creation when the generated target path already exists', () => {
    const base = workspaceScenarioForId('default')
    const sourceNote = {
      ...base.notes[0],
      id: 'Writing/Launch/source.md',
      path: 'Writing/Launch/source.md',
      rawContent: '# Source\n\nSource body.\n',
      title: 'Source',
    }
    const existingTarget = {
      ...base.notes[1],
      id: 'Writing/Launch/launch-checklist.md',
      path: 'Writing/Launch/launch-checklist.md',
      title: 'Launch Checklist',
    }
    const snapshot = {
      ...base,
      allNotes: [sourceNote, existingTarget, ...base.notes.slice(2)],
      notes: [sourceNote, existingTarget, ...base.notes.slice(2)],
      selectedNoteId: sourceNote.id,
    }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, {
      key: 'related_to',
      sourceNoteId: sourceNote.id,
      targetTitle: 'Launch Checklist',
      type: 'createRelationshipTarget',
    })

    expect(result.writes).toEqual([])
    expect(result.snapshot.notes).toHaveLength(snapshot.notes.length)
    expect(result.snapshot.notes[0]?.rawContent).toBe(sourceNote.rawContent)
    expect(result.snapshot.selectedNoteId).toBe(sourceNote.id)
  })
})
