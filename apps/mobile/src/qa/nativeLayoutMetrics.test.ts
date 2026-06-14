import { describe, expect, it } from 'vitest'
import {
  assertNativeSidebarLayoutMetrics,
  formatNativeLayoutAssertionFailures,
  latestNativeLayoutMetrics,
  nativeSidebarMetricContract,
  parseNativeLayoutMetrics,
  type NativeLayoutMetric,
} from './nativeLayoutMetrics'
import { desktopSidebarParity } from '../ui/desktopParity'

describe('native layout metrics', () => {
  it('keeps the native metric contract synced with desktop sidebar parity tokens', () => {
    expect(nativeSidebarMetricContract).toEqual({
      folderRowContentInset: desktopSidebarParity.folderRowContentInset,
      folderRowIndent: desktopSidebarParity.folderRowIndent,
      itemPadding: desktopSidebarParity.itemPadding,
      sectionHorizontalPadding: desktopSidebarParity.sectionHorizontalPadding,
    })
  })

  it('parses simulator log metrics and keeps the latest metric per id', () => {
    const metrics = latestNativeLayoutMetrics(parseNativeLayoutMetrics([
      'noise before metric',
      'TOLARIA_MOBILE_LAYOUT_METRIC {"height":12,"id":"sidebar.item.inbox.row","platform":"ios","width":10,"x":1,"y":2}',
      'TOLARIA_MOBILE_LAYOUT_METRIC {"height":32,"id":"sidebar.item.inbox.row","platform":"ios","width":247.5,"x":6,"y":4}',
      'TOLARIA_MOBILE_LAYOUT_METRIC not-json',
    ].join('\n')))

    expect(metrics['sidebar.item.inbox.row']).toEqual({
      height: 32,
      id: 'sidebar.item.inbox.row',
      platform: 'ios',
      width: 247.5,
      x: 6,
      y: 4,
    })
  })

  it('accepts native sidebar metrics that match desktop spacing tokens', () => {
    const metrics = latestNativeLayoutMetrics([
      itemMetric('sidebar.item.inbox', { hasCount: true }),
      itemMetric('sidebar.item.all-notes', { hasCount: true }),
      itemMetric('sidebar.item.personal-journal', { hasCount: false }),
      itemMetric('sidebar.item.essays', { hasCount: true }),
      folderMetric('sidebar.folder.writing', 12),
      folderMetric('sidebar.folder.tolaria-mobile', 37),
    ].flat())

    expect(assertNativeSidebarLayoutMetrics(metrics)).toEqual([])
  })

  it('reports native sidebar rows that lose horizontal or vertical padding', () => {
    const metrics = latestNativeLayoutMetrics([
      itemMetric('sidebar.item.inbox', { hasCount: true, rowHeight: 22, rowX: 0 }),
      itemMetric('sidebar.item.all-notes', { hasCount: true }),
      itemMetric('sidebar.item.personal-journal', { hasCount: false }),
      itemMetric('sidebar.item.essays', { hasCount: true }),
      folderMetric('sidebar.folder.writing', 0),
      folderMetric('sidebar.folder.tolaria-mobile', 37),
    ].flat())

    const failures = assertNativeSidebarLayoutMetrics(metrics)
    const formatted = formatNativeLayoutAssertionFailures(failures)

    expect(formatted).toContain('sidebar.item.inbox: row keeps desktop section inset')
    expect(formatted).toContain('sidebar.item.inbox: row keeps desktop vertical padding')
    expect(formatted).toContain('sidebar.folder.writing: folder content keeps desktop indentation')
  })
})

function itemMetric(
  id: string,
  {
    hasCount,
    rowHeight = hasCount ? 32 : 30,
    rowX = 6,
  }: {
    hasCount: boolean
    rowHeight?: number
    rowX?: number
  },
): NativeLayoutMetric[] {
  const contentHeight = hasCount ? 20 : 18
  const contentWidth = hasCount ? 227.5 : 219.5
  const rowWidth = 247.5

  return [
    {
      height: rowHeight,
      id: `${id}.row`,
      platform: 'ios',
      width: rowWidth,
      x: rowX,
      y: 0,
    },
    {
      height: contentHeight,
      id: `${id}.content`,
      platform: 'ios',
      width: contentWidth,
      x: 12,
      y: hasCount ? 6 : 7,
    },
  ]
}

function folderMetric(id: string, contentX: number): NativeLayoutMetric[] {
  return [
    {
      height: 30,
      id: `${id}.row`,
      platform: 'ios',
      width: 247.5,
      x: 0,
      y: 0,
    },
    {
      height: 18,
      id: `${id}.content`,
      platform: 'ios',
      width: 219.5,
      x: contentX,
      y: 6,
    },
  ]
}
