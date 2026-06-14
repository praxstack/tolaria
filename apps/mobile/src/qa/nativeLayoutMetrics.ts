export type NativeLayoutMetric = {
  height: number
  id: string
  platform: string
  width: number
  x: number
  y: number
}

export type NativeLayoutMetricMap = Record<string, NativeLayoutMetric>

export type NativeLayoutAssertionFailure = {
  actual: number | null
  expected: number
  id: string
  message: string
}

type SidebarPadding = {
  bottom: number
  left: number
  right: number
  top: number
}

type CountPillLayout = {
  compact?: boolean
  id: string
}

type LayoutExpectation = {
  actual: number | null
  expected: number
  id: string
  message: string
}

type MetricExpectation = {
  id: string
  message: string
  metric: NativeLayoutMetric | undefined
}

const metricPrefix = 'TOLARIA_MOBILE_LAYOUT_METRIC'
const layoutTolerance = 1.5
export const nativeSidebarMetricContract = {
  countPill: {
    compactHeight: 18,
    height: 20,
  },
  folderRowContentInset: 12,
  folderRowIndent: 25,
  itemPadding: {
    regular: { bottom: 6, left: 12, right: 16, top: 6 },
    withCount: { bottom: 6, left: 12, right: 8, top: 6 },
  },
  sectionHorizontalPadding: 6,
  sectionTitleMinHeight: 30,
} as const

export function parseNativeLayoutMetrics(logText: string): NativeLayoutMetric[] {
  const metrics: NativeLayoutMetric[] = []

  for (const line of logText.split('\n')) {
    const prefixIndex = line.indexOf(metricPrefix)
    if (prefixIndex === -1) continue

    const rawJson = line.slice(prefixIndex + metricPrefix.length).trim()
    const metric = parseMetric(rawJson)
    if (metric) metrics.push(metric)
  }

  return metrics
}

export function latestNativeLayoutMetrics(metrics: NativeLayoutMetric[]): NativeLayoutMetricMap {
  return Object.fromEntries(metrics.map((metric) => [metric.id, metric]))
}

export function assertNativeSidebarLayoutMetrics(metrics: NativeLayoutMetricMap): NativeLayoutAssertionFailure[] {
  return [
    ...assertSidebarItemLayout({ id: 'sidebar.item.inbox', metrics, padding: nativeSidebarMetricContract.itemPadding.withCount }),
    ...assertSidebarItemLayout({ id: 'sidebar.item.all-notes', metrics, padding: nativeSidebarMetricContract.itemPadding.withCount }),
    ...assertSidebarItemLayout({ id: 'sidebar.item.personal-journal', metrics, padding: nativeSidebarMetricContract.itemPadding.regular }),
    ...assertSidebarItemLayout({ id: 'sidebar.item.essays', metrics, padding: nativeSidebarMetricContract.itemPadding.withCount }),
    ...assertStackedRows(metrics, ['sidebar.item.inbox', 'sidebar.item.all-notes', 'sidebar.item.archive']),
    ...assertSectionTitleLayout({ firstContentMetricId: 'sidebar.item.personal-journal.row', metrics, sectionId: 'favorites' }),
    ...assertSectionTitleLayout({ firstContentMetricId: 'sidebar.item.essays.row', metrics, sectionId: 'types' }),
    ...assertSectionTitleLayout({ firstContentMetricId: 'sidebar.folderTree.root', metrics, sectionId: 'folders' }),
    ...assertFolderLayout({ expectedLeftInset: nativeSidebarMetricContract.folderRowContentInset, id: 'sidebar.folder.writing', metrics }),
    ...assertFolderLayout({
      expectedLeftInset:
        nativeSidebarMetricContract.folderRowContentInset + nativeSidebarMetricContract.folderRowIndent,
      id: 'sidebar.folder.tolaria-mobile',
      metrics,
    }),
    ...assertCountPillLayouts(metrics),
  ]
}

function assertStackedRows(metrics: NativeLayoutMetricMap, ids: string[]): NativeLayoutAssertionFailure[] {
  return ids.slice(1).flatMap((id, index) => {
    const previous = metrics[`${ids[index]}.row`]
    const current = metrics[`${id}.row`]

    return [
      ...expectMetric({
        id: ids[index],
        message: 'previous row is captured before checking sidebar row stacking',
        metric: previous,
      }),
      ...expectMetric({
        id,
        message: 'row is captured before checking sidebar row stacking',
        metric: current,
      }),
      ...expectAtLeast({
        actual: previous && current ? current.y - previous.y - previous.height : null,
        expected: 0,
        id,
        message: 'row starts after the previous sidebar row',
      }),
    ]
  })
}

function assertSectionTitleLayout({
  firstContentMetricId,
  metrics,
  sectionId,
}: {
  firstContentMetricId: string
  metrics: NativeLayoutMetricMap
  sectionId: string
}): NativeLayoutAssertionFailure[] {
  const id = `sidebar.section.${sectionId}`
  const titleRow = metrics[`${id}.row`]
  const firstContent = metrics[firstContentMetricId]

  return [
    ...expectMetric({
      id,
      message: 'section title row is captured before checking native sidebar spacing',
      metric: titleRow,
    }),
    ...expectMetric({
      id: firstContentMetricId,
      message: 'first section content is captured before checking native sidebar spacing',
      metric: firstContent,
    }),
    ...expectClose({
      actual: titleRow?.x ?? null,
      expected: nativeSidebarMetricContract.sectionHorizontalPadding,
      id,
      message: 'section title keeps desktop section inset',
    }),
    ...expectAtLeast({
      actual: titleRow?.height ?? null,
      expected: nativeSidebarMetricContract.sectionTitleMinHeight,
      id,
      message: 'section title keeps desktop header height',
    }),
    ...expectAtLeast({
      actual: titleRow && firstContent ? firstContent.y - titleRow.y - titleRow.height : null,
      expected: 0,
      id: firstContentMetricId,
      message: 'first row starts after the sidebar section title',
    }),
  ]
}

export function formatNativeLayoutAssertionFailures(failures: NativeLayoutAssertionFailure[]) {
  return failures
    .map((failure) => {
      const actual = failure.actual === null ? 'missing' : failure.actual.toFixed(1)
      return `${failure.id}: ${failure.message}; expected ${failure.expected.toFixed(1)}, got ${actual}`
    })
    .join('\n')
}

function assertSidebarItemLayout({
  id,
  metrics,
  padding,
}: {
  id: string
  metrics: NativeLayoutMetricMap
  padding: SidebarPadding
}): NativeLayoutAssertionFailure[] {
  const row = metrics[`${id}.row`]
  const content = metrics[`${id}.content`]

  return [
    ...expectMetric({ id, message: 'row is captured before checking native padding', metric: row }),
    ...expectMetric({ id, message: 'content is captured before checking native padding', metric: content }),
    ...expectClose({
      actual: row?.x ?? null,
      expected: nativeSidebarMetricContract.sectionHorizontalPadding,
      id,
      message: 'row keeps desktop section inset',
    }),
    ...expectClose({
      actual: content?.x ?? null,
      expected: padding.left,
      id,
      message: 'content keeps desktop left padding',
    }),
    ...expectClose({
      actual: row && content ? row.width - content.x - content.width : null,
      expected: padding.right,
      id,
      message: 'content keeps desktop right padding',
    }),
    ...expectClose({
      actual: row && content ? row.height - content.height : null,
      expected: padding.top + padding.bottom,
      id,
      message: 'row keeps desktop vertical padding',
    }),
  ]
}

function assertFolderLayout({
  expectedLeftInset,
  id,
  metrics,
}: {
  expectedLeftInset: number
  id: string
  metrics: NativeLayoutMetricMap
}): NativeLayoutAssertionFailure[] {
  const row = metrics[`${id}.row`]
  const content = metrics[`${id}.content`]

  return [
    ...expectMetric({ id, message: 'row is captured before checking native folder layout', metric: row }),
    ...expectMetric({ id, message: 'content is captured before checking native folder layout', metric: content }),
    ...expectClose({
      actual: content?.x ?? null,
      expected: expectedLeftInset,
      id,
      message: 'folder content keeps desktop indentation',
    }),
    ...expectAtLeast({
      actual: row?.height ?? null,
      expected: 28,
      id,
      message: 'folder row keeps a tappable hit area',
    }),
  ]
}

function assertCountPillLayouts(metrics: NativeLayoutMetricMap): NativeLayoutAssertionFailure[] {
  return [
    ...assertCountPillLayout(metrics, { id: 'sidebar.item.inbox.count' }),
    ...assertCountPillLayout(metrics, { id: 'sidebar.item.all-notes.count' }),
    ...assertCountPillLayout(metrics, { id: 'sidebar.item.essays.count' }),
    ...assertCountPillLayout(metrics, { compact: true, id: 'sidebar.section.types.count' }),
  ]
}

function assertCountPillLayout(
  metrics: NativeLayoutMetricMap,
  { compact = false, id }: CountPillLayout,
): NativeLayoutAssertionFailure[] {
  const container = metrics[`${id}.container`]
  const text = metrics[`${id}.text`]
  const expectedHeight = compact
    ? nativeSidebarMetricContract.countPill.compactHeight
    : nativeSidebarMetricContract.countPill.height

  return [
    ...expectMetric({ id, message: 'count pill container is captured before checking native alignment', metric: container }),
    ...expectMetric({ id, message: 'count pill text is captured before checking native alignment', metric: text }),
    ...expectClose({
      actual: container?.height ?? null,
      expected: expectedHeight,
      id,
      message: 'count pill keeps desktop height',
    }),
    ...expectClose({
      actual: text ? text.y + text.height / 2 : null,
      expected: expectedHeight / 2,
      id,
      message: 'count text is vertically centered inside native pill',
    }),
  ]
}

function expectMetric({
  id,
  message,
  metric,
}: MetricExpectation): NativeLayoutAssertionFailure[] {
  if (metric) return []

  return [{ actual: null, expected: 1, id, message }]
}

function expectClose({
  actual,
  expected,
  id,
  message,
}: LayoutExpectation): NativeLayoutAssertionFailure[] {
  if (actual !== null && Math.abs(actual - expected) <= layoutTolerance) return []

  return [{ actual, expected, id, message }]
}

function expectAtLeast({
  actual,
  expected,
  id,
  message,
}: LayoutExpectation): NativeLayoutAssertionFailure[] {
  if (actual !== null && actual >= expected) return []

  return [{ actual, expected, id, message }]
}

function parseMetric(rawJson: string): NativeLayoutMetric | null {
  try {
    const value: unknown = JSON.parse(rawJson)
    return nativeLayoutMetricFromJson(value)
  } catch {
    return null
  }
}

function nativeLayoutMetricFromJson(value: unknown): NativeLayoutMetric | null {
  if (!isRecord(value)) return null

  const id = stringValue(value.id)
  const platform = stringValue(value.platform)
  const height = numberValue(value.height)
  const width = numberValue(value.width)
  const x = numberValue(value.x)
  const y = numberValue(value.y)
  if (!id || !platform || height === null || width === null || x === null || y === null) return null

  return { height, id, platform, width, x, y }
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
