import { describe, expect, it } from 'vitest'
import type { BlockLike } from './durableMarkdownBlocks'
import {
  buildCalloutBlock,
  calloutMeta,
  CALLOUT_BLOCK_TYPE,
  formatCalloutMarker,
  isCalloutBlock,
  isKnownCalloutType,
  parseCalloutMarker,
  readQuoteCallout,
  serializeCalloutBlock,
} from './calloutMarkdown'

function quote(text: string): BlockLike {
  return { type: 'quote', content: [{ type: 'text', text }] }
}

describe('parseCalloutMarker', () => {
  it('parses type, title and fold', () => {
    expect(parseCalloutMarker('[!tip] Hello')).toEqual({ type: 'tip', fold: '', title: 'Hello' })
    expect(parseCalloutMarker('[!example]+ Open')).toEqual({ type: 'example', fold: '+', title: 'Open' })
    expect(parseCalloutMarker('[!failure]-')).toEqual({ type: 'failure', fold: '-', title: '' })
  })

  it('lowercases the type (case-insensitive)', () => {
    expect(parseCalloutMarker('[!IMPORTANT] X')).toEqual({ type: 'important', fold: '', title: 'X' })
  })

  it('returns null for non-marker lines', () => {
    expect(parseCalloutMarker('just a quote')).toBeNull()
    expect(parseCalloutMarker('[not a callout]')).toBeNull()
    expect(parseCalloutMarker('[!123] digits not allowed')).toBeNull()
  })
})

describe('formatCalloutMarker round-trips parseCalloutMarker', () => {
  const cases = ['[!tip] Hello', '[!example]+ Open', '[!failure]-', '[!note]', '[!warning] Multi word title']
  for (const line of cases) {
    it(`re-emits "${line}"`, () => {
      const marker = parseCalloutMarker(line)
      expect(marker).not.toBeNull()
      expect(formatCalloutMarker(marker!)).toBe(line)
    })
  }
})

describe('calloutMeta', () => {
  it('maps known types to emoji + label', () => {
    expect(calloutMeta('tip')).toEqual({ emoji: '💡', label: 'Tip' })
    expect(calloutMeta('ABSTRACT')).toEqual({ emoji: '📄', label: 'Abstract' })
  })
  it('falls back to Note for unknown types (no crash)', () => {
    expect(calloutMeta('totally-made-up')).toEqual({ emoji: '📝', label: 'Note' })
    expect(isKnownCalloutType('totally-made-up')).toBe(false)
    expect(isKnownCalloutType('tip')).toBe(true)
  })
})

describe('readQuoteCallout', () => {
  it('splits marker line from body', () => {
    const parsed = readQuoteCallout(quote('[!tip] Title\nbody one\nbody two'))
    expect(parsed).toEqual({ marker: { type: 'tip', fold: '', title: 'Title' }, body: 'body one\nbody two' })
  })
  it('handles marker-only quote (no body)', () => {
    expect(readQuoteCallout(quote('[!note]'))).toEqual({ marker: { type: 'note', fold: '', title: '' }, body: '' })
  })
  it('returns null for ordinary quotes', () => {
    expect(readQuoteCallout(quote('a normal quotation'))).toBeNull()
  })
  it('returns null for non-quote blocks', () => {
    expect(readQuoteCallout({ type: 'paragraph', content: [{ type: 'text', text: '[!tip] x' }] })).toBeNull()
  })
})

describe('buildCalloutBlock', () => {
  it('converts a marker quote into a callout block', () => {
    const block = buildCalloutBlock(quote('[!warning] Careful\nwatch out'))
    expect(block.type).toBe(CALLOUT_BLOCK_TYPE)
    expect(block.props).toMatchObject({ calloutType: 'warning', fold: '', title: 'Careful' })
    expect(isCalloutBlock(block)).toBe(true)
  })
  it('passes ordinary quotes through unchanged', () => {
    const original = quote('not a callout')
    expect(buildCalloutBlock(original)).toBe(original)
  })
})

describe('serializeCalloutBlock', () => {
  it('emits exact > [!type] markdown', () => {
    const block = buildCalloutBlock(quote('[!tip] Title\nbody one\nbody two'))
    expect(serializeCalloutBlock(block)).toBe('> [!tip] Title\n> body one\n> body two')
  })
  it('emits fold modifier and marker-only callouts', () => {
    expect(serializeCalloutBlock(buildCalloutBlock(quote('[!example]+ Open\nx')))).toBe('> [!example]+ Open\n> x')
    expect(serializeCalloutBlock(buildCalloutBlock(quote('[!note]')))).toBe('> [!note]')
  })
})

// THE CRITICAL GUARANTEE: quote-callout -> callout block -> markdown round-trips.
// Note: the callout TYPE is normalised to lowercase (Obsidian treats it
// case-insensitively), so `[!IMPORTANT]` canonicalises to `[!important]`. Title,
// body, and fold are preserved verbatim. This is a deliberate, lossless-in-meaning
// normalisation, asserted explicitly below.
describe('round-trip (quote text -> callout block -> markdown), type lowercased', () => {
  const inputs = [
    '[!note]',
    '[!tip] A tip with title',
    '[!abstract] Summary here\nline two',
    '[!IMPORTANT] Upper case type',
    '[!example]+ Foldable open\nbody',
    '[!failure]- Foldable closed\nbody one\nbody two',
    '[!quote] cite something',
    '[!totallymadeup] unknown type still round-trips\nbody',
  ]
  for (const text of inputs) {
    it(`round-trips "${text.split('\n')[0]}"`, () => {
      const block = buildCalloutBlock(quote(text))
      // Expected output canonicalises only the [!TYPE] token to lowercase.
      const expectedText = text.replace(/^\[!([a-zA-Z]+)\]/, (_m, t: string) => `[!${t.toLowerCase()}]`)
      const expected = expectedText.split('\n').map(l => (l ? `> ${l}` : '>')).join('\n')
      expect(serializeCalloutBlock(block)).toBe(expected)
    })
  }

  it('preserves already-lowercase types byte-identically', () => {
    const block = buildCalloutBlock(quote('[!tip] Exact\nbody'))
    expect(serializeCalloutBlock(block)).toBe('> [!tip] Exact\n> body')
  })
})

describe('callout edge cases (round-trip safety)', () => {
  it('keeps a body line that itself looks like a marker in the body', () => {
    const block = buildCalloutBlock(quote('[!tip] T\n[!note] inner\nplain'))
    expect(serializeCalloutBlock(block)).toBe('> [!tip] T\n> [!note] inner\n> plain')
  })
  it('treats marker with only whitespace title as marker-only', () => {
    expect(serializeCalloutBlock(buildCalloutBlock(quote('[!note]   ')))).toBe('> [!note]')
  })
  it('preserves a blank body line as a bare ">"', () => {
    expect(serializeCalloutBlock(buildCalloutBlock(quote('[!tip] T\na\n\nb')))).toBe('> [!tip] T\n> a\n>\n> b')
  })
})
