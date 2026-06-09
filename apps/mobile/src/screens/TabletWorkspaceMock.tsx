import { useState, type ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  DotsThree,
  FileText,
  FolderOpen,
  LinkSimple,
  MagnifyingGlass,
  Plus,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
} from 'phosphor-react-native'
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { fixtureEditorBullets, fixtureNotes, type FixtureNote } from '../fixtures/workspaceFixtures'
import { mobileCopy, mobileText } from '../i18n/mobileText'
import { MobileButton } from '../ui/MobileButton'
import { MobileChip } from '../ui/MobileChip'
import { MobileIconButton } from '../ui/MobileIconButton'
import { MobileListRow } from '../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../ui/MobilePanel'
import { MobilePropertyRow } from '../ui/MobilePropertyRow'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../ui/tokens'

export function TabletWorkspaceMock() {
  const { width } = useWindowDimensions()
  const [selectedNoteId, setSelectedNoteId] = useState(fixtureNotes[0].id)
  const selectedNote = fixtureNotes.find((note) => note.id === selectedNoteId) ?? fixtureNotes[0]
  const compactTablet = width < 1180

  return (
    <View style={layoutStyles.shell}>
      {compactTablet ? null : <SidebarPanel />}
      <NoteListPanel compact={compactTablet} selectedNoteId={selectedNoteId} onSelectNote={setSelectedNoteId} />
      <EditorPanel compact={compactTablet} note={selectedNote} />
      <PropertiesPanel compact={compactTablet} note={selectedNote} />
    </View>
  )
}

function SidebarPanel() {
  return (
    <MobilePanel style={sidebarStyles.panel}>
      <MobileToolbar>
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')}>
          <SidebarSimple color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <Text numberOfLines={1} style={sidebarStyles.vaultTitle}>Tolaria Vault</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={sidebarStyles.content}>
        <SidebarItem active count="7" icon={<Tray color={mobileColors.primary} size={15} />} label={mobileCopy.inbox} />
        <SidebarItem count="8846" icon={<FileText color={mobileColors.textMuted} size={15} />} label={mobileCopy.allNotes} />
        <SidebarItem count="276" icon={<Archive color={mobileColors.textMuted} size={15} />} label={mobileCopy.archive} />
        <SectionTitle label={mobileCopy.favorites} />
        <SidebarItem icon={<Star color={mobileColors.textMuted} size={15} />} label="Personal Journal" />
        <SidebarItem icon={<FolderOpen color={mobileColors.textMuted} size={15} />} label="Tolaria MVP" />
        <SectionTitle count="517" label={mobileCopy.types} />
        <SidebarItem count="448" icon={<FileText color={mobileColors.green} size={15} />} label="Essays" />
        <SidebarItem count="51" icon={<StackSimple color={mobileColors.purple} size={15} />} label="Procedures" />
        <SidebarItem count="18" icon={<Tag color={mobileColors.orange} size={15} />} label="Responsibilities" />
      </ScrollView>
    </MobilePanel>
  )
}

function NoteListPanel({
  compact,
  onSelectNote,
  selectedNoteId,
}: {
  compact: boolean
  onSelectNote: (noteId: string) => void
  selectedNoteId: string
}) {
  return (
    <MobilePanel style={[noteListStyles.panel, compact ? noteListStyles.panelCompact : null]}>
      <MobileToolbar>
        <View style={noteListStyles.toolbarTitleBlock}>
          <MobileToolbarTitle title={mobileCopy.inbox} />
          <Text style={noteListStyles.toolbarSubtitle}>7 open notes</Text>
        </View>
        <MobileToolbarSpacer />
        <MobileIconButton accessibilityLabel={mobileCopy.searchNotes}>
          <MagnifyingGlass color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileCopy.createNote}>
          <Plus color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
      </MobileToolbar>
      <ScrollView>
        {fixtureNotes.map((note) => (
          <MobileListRow
            chips={<NoteRowChips note={note} />}
            key={note.id}
            leading={<NoteTypeDot note={note} />}
            meta={`${mobileCopy.modified} ${note.modified} · ${note.words} words`}
            selected={note.id === selectedNoteId}
            subtitle={note.snippet}
            title={note.title}
            trailing={note.favorite ? <Star color={mobileColors.primary} size={16} weight="fill" /> : <WorkspaceBadge label={note.workspace} />}
            onPress={() => onSelectNote(note.id)}
          />
        ))}
      </ScrollView>
      <MobileButton
        icon={<Plus color={mobileColors.textInverse} size={16} />}
        label={mobileCopy.createNote}
        style={noteListStyles.compose}
        variant="primary"
      />
    </MobilePanel>
  )
}

function EditorPanel({
  compact,
  note,
}: {
  compact: boolean
  note: FixtureNote
}) {
  return (
    <MobilePanel style={editorStyles.panel}>
      <MobileToolbar>
        <FileText color={mobileColors.textMuted} size={18} />
        <Text numberOfLines={1} style={editorStyles.breadcrumb}>{mobileCopy.inbox} / {note.title}</Text>
        <MobileChip label={note.workspace} tone="gray" />
        <MobileIconButton accessibilityLabel={mobileText('command.note.addFavorite')}>
          <Star color={note.favorite ? mobileColors.primary : mobileColors.textMuted} size={18} weight={note.favorite ? 'fill' : 'regular'} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileText('command.group.note')}>
          <DotsThree color={mobileColors.textMuted} size={20} weight="bold" />
        </MobileIconButton>
      </MobileToolbar>
      <ScrollView contentContainerStyle={[editorStyles.content, compact ? editorStyles.contentCompact : null]}>
        <View style={editorStyles.metaRow}>
          <MobileChip label={note.type} tone={note.typeTone} />
          <Text style={editorStyles.metaText}>{note.status}</Text>
          <Text style={editorStyles.metaText}>{note.date}</Text>
        </View>
        <Text style={[editorStyles.title, compact ? editorStyles.titleCompact : null]}>{note.title}</Text>
        {fixtureEditorBullets.map((item) => (
          <View key={item} style={editorStyles.bulletRow}>
            <Text style={editorStyles.bullet}>•</Text>
            <Text style={editorStyles.text}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function PropertiesPanel({
  compact,
  note,
}: {
  compact: boolean
  note: FixtureNote
}) {
  return (
    <MobilePanel style={[propertyStyles.panel, compact ? propertyStyles.panelCompact : null]}>
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.properties} />
      </MobileToolbar>
      <ScrollView contentContainerStyle={propertyStyles.content}>
        <MobilePropertyRow label="Type" value={<MobileChip label={note.type} tone={note.typeTone} />} />
        <MobilePropertyRow label={mobileText('noteList.sort.status')} value={<MobileChip label={note.status} tone={statusTone(note.status)} />} />
        <MobilePropertyRow label={mobileText('noteList.sort.created')} value={note.created} />
        <MobilePropertyRow label={mobileCopy.modified} value={note.modified} />
        <MobilePropertyRow label={mobileText('inspector.properties.workspace')} value={<WorkspaceBadge label={note.workspace} />} />
        <MobilePropertyRow label="Tags" value={<ChipStack labels={note.tags} tone="gray" />} />
        <MobilePropertyRow label="Links" value={`${note.links}`} />
        <SectionTitle label="Relationships" />
        <View style={propertyStyles.relationshipList}>
          {note.relationships.map((relationship) => (
            <View key={relationship} style={propertyStyles.relationshipRow}>
              <LinkSimple color={mobileColors.textMuted} size={14} />
              <Text numberOfLines={1} style={propertyStyles.relationshipText}>{relationship}</Text>
            </View>
          ))}
        </View>
        <MobileButton label={mobileText('inspector.relationship.addRelationship')} style={propertyStyles.fullWidthButton} variant="secondary" />
      </ScrollView>
    </MobilePanel>
  )
}

function NoteRowChips({ note }: { note: FixtureNote }) {
  return (
    <View style={noteListStyles.chipRow}>
      <MobileChip label={note.type} tone={note.typeTone} />
      <MobileChip label={note.status} tone={statusTone(note.status)} />
      {note.tags.slice(0, 1).map((tag) => <MobileChip key={tag} label={tag} tone="gray" />)}
    </View>
  )
}

function ChipStack({
  labels,
  tone,
}: {
  labels: string[]
  tone: 'gray' | 'green' | 'orange' | 'purple'
}) {
  return (
    <View style={sharedStyles.chipStack}>
      {labels.map((label) => <MobileChip key={label} label={label} tone={tone} />)}
    </View>
  )
}

function NoteTypeDot({ note }: { note: FixtureNote }) {
  return <View style={[noteListStyles.typeDot, noteTypeDotStyles[note.typeTone]]} />
}

function SidebarItem({
  active = false,
  count,
  icon,
  label,
}: {
  active?: boolean
  count?: string
  icon: ReactNode
  label: string
}) {
  return (
    <View style={[sidebarStyles.item, active ? sidebarStyles.itemActive : null]}>
      {icon}
      <Text numberOfLines={1} style={[sidebarStyles.itemText, active ? sidebarStyles.itemTextActive : null]}>{label}</Text>
      {count ? <Text style={[sidebarStyles.count, active ? sidebarStyles.countActive : null]}>{count}</Text> : null}
    </View>
  )
}

function SectionTitle({
  count,
  label,
}: {
  count?: string
  label: string
}) {
  return (
    <View style={sidebarStyles.sectionTitleRow}>
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text style={sidebarStyles.sectionTitle}>{label}</Text>
      {count ? <Text style={sidebarStyles.sectionCount}>{count}</Text> : null}
    </View>
  )
}

function WorkspaceBadge({ label }: { label: string }) {
  return <Text style={sharedStyles.workspaceBadge}>{label}</Text>
}

function statusTone(status: string): 'blue' | 'green' | 'orange' {
  if (status === 'Shipped') return 'green'
  if (status === 'Active') return 'blue'
  return 'orange'
}

const noteTypeDotStyles = StyleSheet.create({
  green: {
    backgroundColor: mobileColors.green,
  },
  orange: {
    backgroundColor: mobileColors.orange,
  },
  purple: {
    backgroundColor: mobileColors.purple,
  },
})

const layoutStyles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: mobileColors.app,
  },
})

const sharedStyles = StyleSheet.create({
  chipStack: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
  },
  workspaceBadge: {
    overflow: 'hidden',
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '800',
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
})

const sidebarStyles = StyleSheet.create({
  panel: {
    width: 260,
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  content: {
    padding: mobileSpace.sm,
  },
  count: {
    minWidth: 30,
    overflow: 'hidden',
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '700',
    paddingHorizontal: mobileSpace.xs,
    paddingVertical: mobileSpace.xs,
    textAlign: 'center',
  },
  countActive: {
    backgroundColor: mobileColors.primary,
    color: mobileColors.textInverse,
  },
  item: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
  },
  itemActive: {
    backgroundColor: mobileColors.selected,
  },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  itemTextActive: {
    color: mobileColors.primary,
  },
  sectionCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '700',
  },
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '800',
  },
  sectionTitleRow: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginTop: mobileSpace.md,
    paddingHorizontal: mobileSpace.sm,
  },
  vaultTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '700',
  },
})

const noteListStyles = StyleSheet.create({
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  compose: {
    bottom: mobileSpace.xl,
    position: 'absolute',
    right: mobileSpace.xl,
  },
  panel: {
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 340,
  },
  panelCompact: {
    width: 336,
  },
  toolbarSubtitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '600',
  },
  toolbarTitleBlock: {
    minWidth: 0,
  },
  typeDot: {
    borderRadius: mobileRadius.pill,
    height: 8,
    width: 8,
  },
})

const editorStyles = StyleSheet.create({
  breadcrumb: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  bullet: {
    color: mobileColors.primary,
    fontSize: 20,
    lineHeight: 30,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: mobileSpace.md,
    marginBottom: mobileSpace.lg,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 700,
    paddingHorizontal: mobileSpace.xxl,
    paddingVertical: 40,
    width: '100%',
  },
  contentCompact: {
    paddingHorizontal: mobileSpace.xl,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.sm,
    marginBottom: mobileSpace.lg,
  },
  metaText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '600',
  },
  panel: {
    flex: 1,
  },
  text: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.bodyLarge,
    lineHeight: 26,
  },
  title: {
    color: mobileColors.text,
    fontSize: mobileType.hero,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: mobileSpace.xl,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
})

const propertyStyles = StyleSheet.create({
  content: {
    padding: mobileSpace.lg,
  },
  fullWidthButton: {
    marginTop: mobileSpace.lg,
  },
  panel: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    width: 300,
  },
  panelCompact: {
    width: 280,
  },
  relationshipList: {
    gap: mobileSpace.sm,
  },
  relationshipRow: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.graySoft,
    paddingHorizontal: mobileSpace.md,
  },
  relationshipText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})
