import type { ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  CaretRight,
  FileText,
  Folder,
  FolderOpen,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
} from 'phosphor-react-native'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobilePanel, MobileToolbar } from '../../ui/MobilePanel'
import { desktopPanelParity, desktopSidebarParity, desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type {
  MobileNote,
  MobileSidebarFolder,
  MobileSidebarIcon,
  MobileSidebarSection,
} from '../../workspace/mobileWorkspaceModel'
import { MobileSidebarCountPill } from './MobileSidebarCountPill'
import { noteTypeColor, noteTypeSoftColor } from './mobileWorkspaceTone'

export type MobileSidebarFolderSelection = {
  id: string
  name: string
}

export type MobileSidebarItemSelection = {
  count?: string
  id: string
  label: string
  sectionId: string
}

export function MobileWorkspaceSidebar({
  activeFolderId,
  activeItemId,
  onSelectFolder,
  onSelectItem,
  sections,
  title = 'Tolaria Vault',
}: {
  activeFolderId?: string | null
  activeItemId?: string | null
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
  onSelectItem?: (selection: MobileSidebarItemSelection) => void
  sections: MobileSidebarSection[]
  title?: string
}) {
  return (
    <MobilePanel style={styles.panel} testID="workspace-sidebar-panel">
      <MobileToolbar testID="sidebar-toolbar">
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')} testID="sidebar-collapse-action">
          <SidebarSimple color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        </MobileIconButton>
        <Text numberOfLines={1} style={styles.vaultTitle} testID="sidebar-toolbar-title">{title}</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View
            key={section.id}
            style={[styles.section, section.id === 'primary' ? styles.primarySection : styles.groupSection]}
            testID={`sidebar-section-${section.id}`}
          >
            {section.label ? <SectionTitle count={section.count} label={sidebarSectionLabel(section.id, section.label)} sectionId={section.id} /> : null}
            {section.items?.map((item) => {
              const active = activeItemId ? item.id === activeItemId : item.active
              const label = sidebarLabel(item.id, item.label)
              const activeColor = sidebarActiveColor(item.tone)

              return (
                <SidebarItem
                  active={active}
                  activeBackgroundColor={sidebarActiveBackgroundColor(item.tone)}
                  activeColor={activeColor}
                  count={item.count}
                  icon={sidebarIcon(item.icon, active ? item.tone ?? 'primary' : item.tone)}
                  key={item.id}
                  label={label}
                  onPress={() => onSelectItem?.({
                    count: item.count,
                    id: item.id,
                    label,
                    sectionId: section.id,
                  })}
                />
              )
            })}
            {section.folders ? (
              <FolderTree
                activeFolderId={activeFolderId}
                folders={section.folders}
                onSelectFolder={onSelectFolder}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function SidebarItem({
  active = false,
  activeBackgroundColor = mobileColors.primarySoft,
  activeColor = mobileColors.primary,
  count,
  icon,
  label,
  onPress,
}: {
  active?: boolean
  activeBackgroundColor?: string
  activeColor?: string
  count?: string
  icon: ReactNode
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        nativeItemStyle,
        sidebarItemPadding(Boolean(count)),
        active ? { backgroundColor: activeBackgroundColor } : null,
        pressed ? styles.itemPressed : null,
      ]}
      testID={`sidebar-item-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <View style={styles.itemContent}>
        {icon}
        <Text numberOfLines={1} style={[styles.itemText, nativeItemTextStyle, active ? { color: activeColor } : null]} testID={`sidebar-item-${label.toLowerCase().replaceAll(' ', '-')}-label`}>{label}</Text>
        {count ? (
          <MobileSidebarCountPill
            activeColor={active ? activeColor : undefined}
            testID={`sidebar-item-${label.toLowerCase().replaceAll(' ', '-')}-count`}
            value={count}
          />
        ) : null}
      </View>
    </Pressable>
  )
}

function SectionTitle({
  count,
  label,
  sectionId,
}: {
  count?: string
  label: string
  sectionId: string
}) {
  return (
    <View
      style={[styles.sectionTitleRow, nativeSectionTitleRowStyle, count ? styles.sectionTitleRowWithCount : styles.sectionTitleRowRegular]}
      testID={`sidebar-section-title-${sectionId}`}
    >
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text style={[styles.sectionTitle, nativeSectionTitleTextStyle]} testID={`sidebar-section-title-text-${sectionId}`}>{label}</Text>
      {count ? <MobileSidebarCountPill compact testID={`sidebar-section-count-${sectionId}`} value={count} /> : null}
    </View>
  )
}

function FolderTree({
  activeFolderId,
  folders,
  onSelectFolder,
}: {
  activeFolderId?: string | null
  folders: MobileSidebarFolder[]
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  return (
    <View style={folderTreeStyles.tree}>
      {folders.map((folder) => (
        <FolderTreeRow
          activeFolderId={activeFolderId}
          depth={0}
          folder={folder}
          key={folder.id}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </View>
  )
}

function FolderTreeRow({
  activeFolderId,
  depth,
  folder,
  onSelectFolder,
}: {
  activeFolderId?: string | null
  depth: number
  folder: MobileSidebarFolder
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  const hasChildren = folder.children.length > 0
  const active = activeFolderId ? folder.id === activeFolderId : folder.active

  return (
    <View>
      <Pressable
        accessibilityLabel={folder.name}
        accessibilityRole="button"
        onPress={() => onSelectFolder?.({ id: folder.id, name: folder.name })}
        style={({ pressed }) => [
          folderTreeStyles.row,
          nativeFolderTreeRowStyle,
          active ? folderTreeStyles.rowActive : null,
          pressed ? folderTreeStyles.rowPressed : null,
          folderTreeIndent(depth),
        ]}
      >
        <View style={folderTreeStyles.rowContent}>
          <FolderTreeCaret expanded={folder.expanded} hasChildren={hasChildren} />
          <FolderTreeIcon active={active} expanded={folder.expanded} />
          <Text numberOfLines={1} style={[folderTreeStyles.rowText, nativeFolderTreeTextStyle, active ? folderTreeStyles.rowTextActive : null]}>{folder.name}</Text>
        </View>
      </Pressable>
      {folder.expanded && hasChildren ? (
        <View style={folderTreeStyles.children}>
          {folder.children.map((child) => (
            <FolderTreeRow
              activeFolderId={activeFolderId}
              depth={depth + 1}
              folder={child}
              key={child.id}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function FolderTreeCaret({
  expanded,
  hasChildren,
}: {
  expanded?: boolean
  hasChildren: boolean
}) {
  if (!hasChildren) {
    return <View style={folderTreeStyles.caretSpacer} />
  }

  return expanded ? <CaretDown color={mobileColors.textMuted} size={11} /> : <CaretRight color={mobileColors.textMuted} size={11} />
}

function FolderTreeIcon({
  active,
  expanded,
}: {
  active?: boolean
  expanded?: boolean
}) {
  const iconColor = active ? mobileColors.primary : mobileColors.textMuted

  if (active || expanded) {
    return <FolderOpen color={iconColor} size={16} weight={active ? 'fill' : 'regular'} />
  }

  return <Folder color={iconColor} size={16} />
}

function folderTreeIndent(depth: number) {
  return {
    paddingLeft: desktopSidebarParity.folderRowContentInset
      + depth * desktopSidebarParity.folderRowIndent,
  }
}

function sidebarIcon(icon: MobileSidebarIcon, tone?: MobileNote['typeTone'] | 'primary') {
  const color = sidebarIconColor(tone)

  if (icon === 'archive') return <Archive color={color} size={15} />
  if (icon === 'folder') return <FolderOpen color={color} size={15} />
  if (icon === 'inbox') return <Tray color={color} size={15} />
  if (icon === 'procedure') return <StackSimple color={color} size={15} />
  if (icon === 'star') return <Star color={color} size={15} />
  if (icon === 'tag') return <Tag color={color} size={15} />

  return <FileText color={color} size={15} />
}

function sidebarIconColor(tone?: MobileNote['typeTone'] | 'primary') {
  if (tone === 'primary') return mobileColors.primary
  if (tone) return noteTypeColor(tone)

  return mobileColors.textMuted
}

function sidebarActiveColor(tone?: MobileNote['typeTone']) {
  return tone ? noteTypeColor(tone) : mobileColors.primary
}

function sidebarActiveBackgroundColor(tone?: MobileNote['typeTone']) {
  return tone ? noteTypeSoftColor(tone) : mobileColors.primarySoft
}

function sidebarLabel(id: string, fallback: string) {
  if (id === 'all-notes') return mobileCopy.allNotes
  if (id === 'archive') return mobileCopy.archive
  if (id === 'inbox') return mobileCopy.inbox

  return fallback
}

function sidebarSectionLabel(id: string, fallback: string) {
  if (id === 'folders') return mobileText('sidebar.group.folders')
  if (id === 'favorites') return mobileCopy.favorites
  if (id === 'types') return mobileCopy.types

  return fallback
}

const panelStyles = StyleSheet.create({
  content: { padding: 0 },
  groupSection: { paddingHorizontal: desktopSidebarParity.sectionHorizontalPadding },
  panel: {
    alignSelf: 'stretch',
    width: desktopPanelParity.sidebarWidth,
    height: '100%',
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  primarySection: {
    paddingBottom: desktopSidebarParity.topNavPadding.bottom,
    paddingLeft: desktopSidebarParity.topNavPadding.left,
    paddingRight: desktopSidebarParity.topNavPadding.right,
    paddingTop: desktopSidebarParity.topNavPadding.top,
  },
  section: { borderBottomColor: mobileColors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  vaultTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})

const itemStyles = StyleSheet.create({
  item: {
    justifyContent: 'center',
    borderRadius: desktopSidebarParity.itemRadius,
    width: '100%',
  },
  itemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopSidebarParity.itemGap,
  },
  itemPressed: { backgroundColor: mobileColors.control },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopSidebarParity.itemTextSize,
    fontWeight: '500',
  },
})

const sectionTitleStyles = StyleSheet.create({
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: desktopSidebarParity.countPillTextSize,
    fontWeight: desktopSidebarParity.sectionTitleFontWeight,
    letterSpacing: desktopSidebarParity.sectionTitleLetterSpacing,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
  },
  sectionTitleRowRegular: {
    paddingBottom: desktopSidebarParity.groupHeaderPadding.regular.bottom,
    paddingLeft: desktopSidebarParity.groupHeaderPadding.regular.left,
    paddingRight: desktopSidebarParity.groupHeaderPadding.regular.right,
    paddingTop: desktopSidebarParity.groupHeaderPadding.regular.top,
  },
  sectionTitleRowWithCount: {
    paddingBottom: desktopSidebarParity.groupHeaderPadding.withCount.bottom,
    paddingLeft: desktopSidebarParity.groupHeaderPadding.withCount.left,
    paddingRight: desktopSidebarParity.groupHeaderPadding.withCount.right,
    paddingTop: desktopSidebarParity.groupHeaderPadding.withCount.top,
  },
})

const styles = {
  ...panelStyles,
  ...itemStyles,
  ...sectionTitleStyles,
} as const

const folderTreeLayoutStyles = StyleSheet.create({
  caretSpacer: {
    width: 11,
  },
  children: {
    position: 'relative',
  },
  tree: {
    gap: 2,
    paddingBottom: desktopSidebarParity.sectionContentPaddingBottom,
  },
})

const folderTreeRowStyles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    borderRadius: desktopSidebarParity.itemRadius,
    paddingBottom: desktopSidebarParity.itemPadding.regular.bottom,
    paddingRight: desktopSidebarParity.itemPadding.regular.right,
    paddingTop: desktopSidebarParity.itemPadding.regular.top,
    width: '100%',
  },
})

const folderTreeStateStyles = StyleSheet.create({
  rowActive: {
    backgroundColor: mobileColors.primarySoft,
  },
  rowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
})

const folderTreeContentStyles = StyleSheet.create({
  rowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopSidebarParity.folderIconGap,
  },
})

const folderTreeTextStyles = StyleSheet.create({
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopSidebarParity.itemTextSize,
    fontWeight: '500',
  },
  rowTextActive: { color: mobileColors.primary, fontWeight: '600' },
})

const folderTreeStyles = {
  ...folderTreeLayoutStyles,
  ...folderTreeRowStyles,
  ...folderTreeStateStyles,
  ...folderTreeContentStyles,
  ...folderTreeTextStyles,
} as const

const nativeRowStyles = StyleSheet.create({
  folderRow: { marginVertical: 1, minHeight: 34 },
  item: { marginVertical: 2, minHeight: 38 },
  sectionTitleRow: { marginTop: 4, minHeight: 34 },
})

const nativeTextStyles = StyleSheet.create({
  folderText: { lineHeight: 18 },
  itemText: { lineHeight: 18 },
  sectionTitle: { lineHeight: 14 },
})

const nativeFolderTreeRowStyle = Platform.OS === 'web' ? null : nativeRowStyles.folderRow
const nativeFolderTreeTextStyle = Platform.OS === 'web' ? null : nativeTextStyles.folderText
const nativeItemStyle = Platform.OS === 'web' ? null : nativeRowStyles.item
const nativeItemTextStyle = Platform.OS === 'web' ? null : nativeTextStyles.itemText
const nativeSectionTitleRowStyle = Platform.OS === 'web' ? null : nativeRowStyles.sectionTitleRow
const nativeSectionTitleTextStyle = Platform.OS === 'web' ? null : nativeTextStyles.sectionTitle


function sidebarItemPadding(hasCount: boolean) {
  const padding = hasCount ? desktopSidebarParity.itemPadding.withCount : desktopSidebarParity.itemPadding.regular

  return {
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    paddingRight: padding.right,
    paddingTop: padding.top,
  }
}
