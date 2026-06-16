import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'

describe('mobile Type document editing', () => {
  it('normalizes desktop Type aliases before creating documents', () => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceScenarioForId('default'), {
      type: 'createTypeDefinition',
      typeName: 'notes',
    })

    expect(result.snapshot.typeDefinitions?.Note).toMatchObject({
      path: 'note.md',
      rawContent: expect.stringContaining('# Note'),
    })
    expect(result.snapshot.typeDefinitions?.notes).toBeUndefined()
    expect(result.writes).toEqual([{
      content: expect.stringContaining('# Note'),
      kind: 'createNote',
      path: 'note.md',
    }])
  })

  it('preserves desktop default Type casing when creating documents', () => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceScenarioForId('default'), {
      type: 'createTypeDefinition',
      typeName: 'person',
    })

    expect(result.snapshot.typeDefinitions?.Person).toMatchObject({
      path: 'person.md',
      rawContent: expect.stringContaining('# Person'),
    })
    expect(result.snapshot.typeDefinitions?.person).toBeUndefined()
    expect(result.writes).toEqual([{
      content: expect.stringContaining('# Person'),
      kind: 'createNote',
      path: 'person.md',
    }])
  })

  it('does not create duplicate Type documents for slug-equivalent names', () => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceScenarioForId('default'), {
      type: 'createTypeDefinition',
      typeName: 'procedure',
    })

    expect(result.snapshot.typeDefinitions?.Procedure).toBeDefined()
    expect(result.snapshot.typeDefinitions?.procedure).toBeUndefined()
    expect(result.writes).toEqual([])
  })
})
