import { describe, expect, it } from 'vitest'
import { parseEditorMessage } from './mobileEditorMessages'

describe('mobile editor messages', () => {
  it('parses empty wikilink queries with cursor geometry', () => {
    expect(parseEditorMessage(JSON.stringify({
      frame: { bottom: 124, left: 48 },
      query: '',
      type: 'wikilinkQuery',
    }))).toEqual({
      frame: { bottom: 124, left: 48 },
      query: '',
      type: 'wikilinkQuery',
    })
  })

  it('ignores invalid wikilink query geometry', () => {
    expect(parseEditorMessage(JSON.stringify({
      frame: { bottom: '124', left: 48 },
      query: 'roadmap',
      type: 'wikilinkQuery',
    }))).toEqual({
      frame: null,
      query: 'roadmap',
      type: 'wikilinkQuery',
    })
  })

  it('parses hardware Tab list indentation messages', () => {
    expect(parseEditorMessage(JSON.stringify({
      direction: 'in',
      type: 'listIndent',
    }))).toEqual({
      direction: 'in',
      type: 'listIndent',
    })

    expect(parseEditorMessage(JSON.stringify({
      direction: 'out',
      type: 'listIndent',
    }))).toEqual({
      direction: 'out',
      type: 'listIndent',
    })
  })

  it('rejects malformed list indentation messages', () => {
    expect(parseEditorMessage(JSON.stringify({
      direction: 'sideways',
      type: 'listIndent',
    }))).toBeNull()
  })
})
