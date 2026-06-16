import type { BlockLike } from './durableMarkdownBlocks'
import { readInlineText } from './durableMarkdownBlocks'

/**
 * Obsidian-style callout support.
 *
 * Obsidian callouts are authored as blockquotes whose first line is a
 * `[!type]` marker, optionally followed by a fold modifier (`+`/`-`) and a
 * title:
 *
 *     > [!tip] My Title
 *     > body line one
 *     > body line two
 *
 * BlockNote parses that into a plain `quote` block, so the marker shows up as
 * literal text instead of a styled box. This module detects the marker on a
 * quote block, converts it into a dedicated `calloutBlock`, and serialises the
 * callout back to the exact `> [!type]` markdown so notes round-trip losslessly.
 *
 * NOTE: the type labels below are user-facing copy. They are kept in code for
 * the initial contribution; maintainers may want to extract them into the Lara
 * localisation pipeline (`src/lib/locales/en.json`).
 */

export const CALLOUT_BLOCK_TYPE = 'calloutBlock'

export type CalloutFold = '' | '+' | '-'

export interface CalloutMarker {
  type: string
  fold: CalloutFold
  title: string
}

interface CalloutMeta {
  emoji: string
  label: string
}

// Canonical type -> { emoji, label }. Aliases map to the same visual family.
const CALLOUT_META: Record<string, CalloutMeta> = {
  note: { emoji: '📝', label: 'Note' },
  abstract: { emoji: '📄', label: 'Abstract' },
  summary: { emoji: '📄', label: 'Summary' },
  tldr: { emoji: '📄', label: 'TL;DR' },
  info: { emoji: 'ℹ️', label: 'Info' },
  todo: { emoji: '☑️', label: 'Todo' },
  tip: { emoji: '💡', label: 'Tip' },
  hint: { emoji: '💡', label: 'Hint' },
  important: { emoji: '❗', label: 'Important' },
  success: { emoji: '✅', label: 'Success' },
  check: { emoji: '✅', label: 'Check' },
  done: { emoji: '✅', label: 'Done' },
  question: { emoji: '❓', label: 'Question' },
  help: { emoji: '❓', label: 'Help' },
  faq: { emoji: '❓', label: 'FAQ' },
  warning: { emoji: '⚠️', label: 'Warning' },
  caution: { emoji: '⚠️', label: 'Caution' },
  attention: { emoji: '⚠️', label: 'Attention' },
  failure: { emoji: '❌', label: 'Failure' },
  fail: { emoji: '❌', label: 'Fail' },
  missing: { emoji: '❌', label: 'Missing' },
  danger: { emoji: '🛑', label: 'Danger' },
  error: { emoji: '🛑', label: 'Error' },
  bug: { emoji: '🐛', label: 'Bug' },
  example: { emoji: '🔎', label: 'Example' },
  quote: { emoji: '💬', label: 'Quote' },
  cite: { emoji: '💬', label: 'Quote' },
}

const DEFAULT_META: CalloutMeta = { emoji: '📝', label: 'Note' }

// Matches the marker on the first line: [!type], optional +/- fold, optional title.
// Deliberately simple (no lookbehind) so it is safe under WKWebView.
const MARKER_PATTERN = /^\[!([a-zA-Z]+)\]([+-]?)[ \t]*(.*)$/

function normaliseCalloutType(type: string): string {
  return type.trim().toLowerCase()
}

export function calloutMeta(type: string): CalloutMeta {
  return CALLOUT_META[normaliseCalloutType(type)] ?? DEFAULT_META
}

export function isKnownCalloutType(type: string): boolean {
  return normaliseCalloutType(type) in CALLOUT_META
}

/** Parse a `[!type] title` marker line. Returns null when the line is not a marker. */
export function parseCalloutMarker(line: string): CalloutMarker | null {
  const match = MARKER_PATTERN.exec(line.trim())
  if (!match) return null

  const type = match.at(1)
  if (!type) return null

  const fold = match.at(2)
  return {
    type: normaliseCalloutType(type),
    fold: fold === '+' || fold === '-' ? fold : '',
    title: (match.at(3) ?? '').trim(),
  }
}

/** Build the marker line for serialisation: `[!type]<fold> title`. */
export function formatCalloutMarker({ type, fold, title }: CalloutMarker): string {
  const head = `[!${type}]${fold}`
  return title ? `${head} ${title}` : head
}

interface CalloutBlockProps {
  calloutType: string
  fold: CalloutFold
  title: string
  body: string
}

function readQuoteText(block: BlockLike): string | null {
  if (block.type !== 'quote') return null
  return readInlineText(block.content)
}

/**
 * If a quote block's text begins with a callout marker, return the marker plus
 * the remaining body text. Returns null for ordinary quotes.
 */
export function readQuoteCallout(block: BlockLike): { marker: CalloutMarker; body: string } | null {
  const text = readQuoteText(block)
  if (text === null) return null

  const newlineIndex = text.indexOf('\n')
  const firstLine = newlineIndex === -1 ? text : text.slice(0, newlineIndex)
  const marker = parseCalloutMarker(firstLine)
  if (!marker) return null

  const body = newlineIndex === -1 ? '' : text.slice(newlineIndex + 1)
  return { marker, body }
}

/** Convert a marker-bearing quote block into a callout block. Pass others through. */
export function buildCalloutBlock(block: BlockLike): BlockLike {
  const parsed = readQuoteCallout(block)
  if (!parsed) return block

  const props: CalloutBlockProps = {
    calloutType: parsed.marker.type,
    fold: parsed.marker.fold,
    title: parsed.marker.title,
    body: parsed.body,
  }
  return {
    ...block,
    type: CALLOUT_BLOCK_TYPE,
    props: { ...(block.props ?? {}), ...props },
    content: [],
    children: [],
  }
}

export function isCalloutBlock(block: BlockLike): boolean {
  return block.type === CALLOUT_BLOCK_TYPE
}

function readCalloutProps(block: BlockLike): CalloutBlockProps {
  const props = (block.props ?? {}) as Partial<CalloutBlockProps>
  const fold = props.fold === '+' || props.fold === '-' ? props.fold : ''
  return {
    calloutType: typeof props.calloutType === 'string' ? props.calloutType : 'note',
    fold,
    title: typeof props.title === 'string' ? props.title : '',
    body: typeof props.body === 'string' ? props.body : '',
  }
}

/** Serialise a callout block back to `> [!type]<fold> title` blockquote markdown. */
export function serializeCalloutBlock(block: BlockLike): string {
  const props = readCalloutProps(block)
  const marker = formatCalloutMarker({ type: props.calloutType, fold: props.fold, title: props.title })
  const body = props.body
  const lines = body ? [marker, ...body.split('\n')] : [marker]
  return lines.map(line => (line ? `> ${line}` : '>')).join('\n')
}

function mapBlockTree(block: BlockLike, fn: (b: BlockLike) => BlockLike): BlockLike {
  const mapped = fn(block)
  if (!Array.isArray(mapped.children)) return mapped
  return { ...mapped, children: mapped.children.map(child => mapBlockTree(child, fn)) }
}

/** Post-parse pass: convert marker-bearing quote blocks into callout blocks (recursively). */
export function injectCalloutBlocks(blocks: unknown[]): unknown[] {
  return (blocks as BlockLike[]).map(block => mapBlockTree(block, buildCalloutBlock))
}
