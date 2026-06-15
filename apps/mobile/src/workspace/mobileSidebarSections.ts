import { evaluateMobileSavedView } from './mobileSavedViews'
import type {
  MobileNote,
  MobileSavedView,
  MobileSidebarFolder,
  MobileSidebarIcon,
  MobileSidebarItem,
  MobileSidebarSection,
  MobileTone,
  MobileTypeDefinition,
  MobileTypeDefinitions,
} from './mobileWorkspaceModel'

type BuildMobileSidebarSectionsInput = {
  notes: MobileNote[]
  previousSections?: MobileSidebarSection[]
  typeDefinitions?: MobileTypeDefinitions
  views?: MobileSavedView[]
}

type TypeCount = {
  count: number
  tone: MobileTone
}

type TypeSectionEntry = [type: string, value: TypeCount]

const typeIcons: Record<string, MobileSidebarIcon> = {
  procedure: 'procedure',
  responsibility: 'tag',
}

export function buildMobileSidebarSections({
  notes,
  previousSections = [],
  typeDefinitions = {},
  views = [],
}: BuildMobileSidebarSectionsInput): MobileSidebarSection[] {
  const activeNotes = notes.filter((note) => !note.archived)
  const archivedNotes = notes.filter((note) => note.archived)
  const sections = [
    primarySection(activeNotes, archivedNotes),
    favoritesSection(activeNotes),
    viewsSection(views, notes),
    typesSection(activeNotes, previousSections, typeDefinitions),
    foldersSection(notes),
  ]

  return sections.filter((section) => section.id === 'primary' || Boolean(section.items?.length || section.folders?.length))
}

function primarySection(activeNotes: MobileNote[], archivedNotes: MobileNote[]): MobileSidebarSection {
  const inboxNotes = activeNotes.filter((note) => !note.organized)

  return {
    id: 'primary',
    items: [
      { active: true, count: countText(inboxNotes.length), icon: 'inbox', id: 'inbox', label: 'Inbox' },
      { count: countText(activeNotes.length), icon: 'file', id: 'all-notes', label: 'All Notes' },
      { count: countText(archivedNotes.length), icon: 'archive', id: 'archive', label: 'Archive' },
    ],
  }
}

function favoritesSection(notes: MobileNote[]): MobileSidebarSection {
  return {
    id: 'favorites',
    items: notes.filter((note) => note.favorite).slice(0, 8).map(favoriteItem),
    label: 'Favorites',
  }
}

function favoriteItem(note: MobileNote): MobileSidebarItem {
  return {
    icon: 'star',
    id: `favorite-${note.id}`,
    label: note.title,
    tone: note.typeTone,
  }
}

function viewsSection(views: MobileSavedView[], notes: MobileNote[]): MobileSidebarSection {
  return {
    id: 'views',
    items: views.map((view) => ({
      count: countText(evaluateMobileSavedView(view, notes).length),
      icon: 'view',
      id: view.id,
      label: view.definition.name,
      tone: viewTone(view),
      viewId: view.id,
    })),
    label: 'Views',
  }
}

function typesSection(
  notes: MobileNote[],
  previousSections: MobileSidebarSection[],
  typeDefinitions: MobileTypeDefinitions,
): MobileSidebarSection {
  const previousItems = previousSections.find((section) => section.id === 'types')?.items ?? []

  return {
    count: countText(notes.length),
    id: 'types',
    items: orderedTypeCounts(notes, typeDefinitions).map(([type, value]) => {
      const normalizedType = normalizedSidebarLabel(type)
      const definition = typeDefinitions[type]

      return {
        count: countText(value.count),
        icon: typeIcons[normalizedType] ?? 'file',
        id: previousTypeItemId(previousItems, type) ?? `type-${slugifySidebarId(type)}`,
        label: typeSectionLabel(type, definition),
        tone: value.tone,
        typeName: type,
      }
    }),
    label: 'Types',
  }
}

function foldersSection(notes: MobileNote[]): MobileSidebarSection {
  return {
    folders: folderTree(notes),
    id: 'folders',
    label: 'Folders',
  }
}

function orderedTypeCounts(notes: MobileNote[], typeDefinitions: MobileTypeDefinitions) {
  const counts = new Map<string, TypeCount>()
  for (const note of notes) {
    const current = counts.get(note.type) ?? { count: 0, tone: note.typeTone }
    counts.set(note.type, { ...current, count: current.count + 1 })
  }
  for (const [type, definition] of Object.entries(typeDefinitions)) {
    if (!isVisibleTypeDefinition(definition)) continue
    counts.set(type, counts.get(type) ?? { count: 0, tone: 'gray' })
  }

  return [...counts.entries()]
    .filter(([type]) => isVisibleTypeDefinition(typeDefinitions[type]))
    .sort((left, right) => compareTypeSectionEntries(left, right, typeDefinitions))
    .slice(0, 10)
}

function previousTypeItemId(items: MobileSidebarItem[], type: string): string | null {
  const label = normalizedSidebarLabel(pluralizeType(type))
  const existing = items.find((item) => item.typeName === type || normalizedSidebarLabel(item.label) === label)
  return existing?.id ?? null
}

function compareTypeSectionEntries(
  left: TypeSectionEntry,
  right: TypeSectionEntry,
  typeDefinitions: MobileTypeDefinitions,
) {
  const leftDefinition = typeDefinitions[left[0]]
  const rightDefinition = typeDefinitions[right[0]]
  const orderResult = compareTypeOrder(leftDefinition, rightDefinition)
  if (orderResult !== 0) return orderResult

  return typeSectionLabel(left[0], leftDefinition).localeCompare(typeSectionLabel(right[0], rightDefinition))
}

function compareTypeOrder(left?: MobileTypeDefinition, right?: MobileTypeDefinition) {
  const leftOrder = left?.order ?? Infinity
  const rightOrder = right?.order ?? Infinity
  if (leftOrder === rightOrder) return 0
  return leftOrder < rightOrder ? -1 : 1
}

function typeSectionLabel(type: string, definition?: MobileTypeDefinition) {
  return definition?.label ?? pluralizeType(type)
}

function isVisibleTypeDefinition(definition?: MobileTypeDefinition) {
  return definition?.visible !== false
}

function folderTree(notes: MobileNote[]): MobileSidebarFolder[] {
  const roots: MobileSidebarFolder[] = []

  for (const note of notes) {
    appendFolderPath(roots, folderPathSegments(note))
  }

  sortFolderTree(roots)
  return roots
}

function appendFolderPath(roots: MobileSidebarFolder[], segments: string[]) {
  let currentPath = ''
  let level = roots

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment
    const folder = findOrCreateFolder(level, segment, currentPath)
    level = folder.children
  }
}

function folderPathSegments(note: MobileNote): string[] {
  return notePath(note)
    .split('/')
    .slice(0, -1)
    .filter(visibleFolderSegment)
}

function notePath(note: MobileNote): string {
  return note.path ?? note.id
}

function findOrCreateFolder(
  folders: MobileSidebarFolder[],
  name: string,
  path: string,
): MobileSidebarFolder {
  const existing = folders.find((folder) => folder.id === path)
  if (existing) return existing

  const folder = { children: [], expanded: true, id: path, name }
  folders.push(folder)
  return folder
}

function sortFolderTree(folders: MobileSidebarFolder[]) {
  folders.sort((left, right) => left.name.localeCompare(right.name))
  for (const folder of folders) {
    sortFolderTree(folder.children)
  }
}

function viewTone(view: MobileSavedView): MobileTone {
  const color = view.definition.color
  return isMobileTone(color) ? color : 'gray'
}

function isMobileTone(value: string | null): value is MobileTone {
  return value === 'blue'
    || value === 'gray'
    || value === 'green'
    || value === 'orange'
    || value === 'purple'
    || value === 'red'
    || value === 'yellow'
}

function visibleFolderSegment(segment: string): boolean {
  return Boolean(segment) && !segment.startsWith('.') && segment !== 'type'
}

function pluralizeType(type: string): string {
  if (type.endsWith('s')) return type
  if (type.endsWith('y')) return `${type.slice(0, -1)}ies`
  return `${type}s`
}

function normalizedSidebarLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function slugifySidebarId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'note'
}

function countText(count: number): string {
  return count.toLocaleString()
}
