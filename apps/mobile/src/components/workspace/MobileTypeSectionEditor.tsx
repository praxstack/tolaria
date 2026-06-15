import { CheckCircle } from 'phosphor-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileTextInput } from '../../ui/MobileTextInput'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileTone } from '../../workspace/mobileWorkspaceModel'
import { noteTypeColor, noteTypeSoftColor } from './mobileWorkspaceTone'
import { MobileViewDisplayPropertiesPicker } from './MobileViewDisplayPropertiesPicker'

type MobileTypeSectionEditorProps = {
  displayProperties: string[]
  propertyOptions: string[]
  propertyQuery: string
  sectionLabel: string
  sort: string
  tone: MobileTone
  typeName: string
  visible: boolean
  onDisplayPropertiesChange: (value: string[]) => void
  onPropertyQueryChange: (value: string) => void
  onSectionLabelChange: (value: string) => void
  onSortChange: (value: string) => void
  onToneChange: (value: MobileTone) => void
  onVisibleChange: (value: boolean) => void
}

const toneOptions: MobileTone[] = ['gray', 'green', 'purple', 'orange', 'blue', 'yellow', 'red']

const sortOptions = [
  { label: `${mobileText('noteList.sort.modified')} ${mobileText('noteList.sort.descending')}`, value: 'modified:desc' },
  { label: `${mobileText('noteList.sort.modified')} ${mobileText('noteList.sort.ascending')}`, value: 'modified:asc' },
  { label: `${mobileText('noteList.sort.title')} ${mobileText('noteList.sort.ascending')}`, value: 'title:asc' },
  { label: `${mobileText('noteList.sort.title')} ${mobileText('noteList.sort.descending')}`, value: 'title:desc' },
  { label: `${mobileText('noteList.sort.status')} ${mobileText('noteList.sort.ascending')}`, value: 'status:asc' },
]

export function MobileTypeSectionEditor(props: MobileTypeSectionEditorProps) {
  return (
    <View style={styles.editor} testID="workspace-type-section-editor">
      <Text style={styles.typeName} testID="workspace-type-section-name">{props.typeName}</Text>
      <MobileTextInput
        autoFocus
        label={mobileText('sidebar.section.name')}
        placeholder={props.typeName}
        testID="workspace-type-section-label-input"
        value={props.sectionLabel}
        onChangeText={props.onSectionLabelChange}
      />
      <VisibilityToggle visible={props.visible} onChange={props.onVisibleChange} />
      <TonePicker selectedTone={props.tone} onSelect={props.onToneChange} />
      <SortPicker selectedSort={props.sort} onSelect={props.onSortChange} />
      <MobileViewDisplayPropertiesPicker
        options={props.propertyOptions}
        query={props.propertyQuery}
        selectedProperties={props.displayProperties}
        testIDPrefix="workspace-type-property"
        onQueryChange={props.onPropertyQueryChange}
        onSelectedPropertiesChange={props.onDisplayPropertiesChange}
      />
    </View>
  )
}

function VisibilityToggle({
  onChange,
  visible,
}: {
  onChange: (value: boolean) => void
  visible: boolean
}) {
  return (
    <Pressable
      accessibilityLabel={mobileText('sidebar.section.showInSidebar')}
      accessibilityRole="switch"
      accessibilityState={{ checked: visible }}
      style={({ pressed }) => [styles.toggleRow, pressed ? styles.pressed : null]}
      testID="workspace-type-visible-toggle"
      onPress={() => onChange(!visible)}
    >
      {visible ? (
        <CheckCircle color={mobileColors.primary} size={16} weight="fill" />
      ) : (
        <CheckCircle color={mobileColors.textFaint} size={16} weight="regular" />
      )}
      <Text style={styles.rowText}>{mobileText('sidebar.section.showInSidebar')}</Text>
    </Pressable>
  )
}

function TonePicker({
  onSelect,
  selectedTone,
}: {
  onSelect: (tone: MobileTone) => void
  selectedTone: MobileTone
}) {
  return (
    <View style={styles.section} testID="workspace-type-tone-picker">
      <Text style={styles.label}>{mobileText('customize.color')}</Text>
      <View style={styles.swatches}>
        {toneOptions.map((tone) => (
          <Pressable
            accessibilityLabel={tone}
            accessibilityRole="button"
            key={tone}
            style={[
              styles.swatch,
              { backgroundColor: noteTypeSoftColor(tone), borderColor: selectedTone === tone ? noteTypeColor(tone) : 'transparent' },
            ]}
            testID={`workspace-type-tone-${tone}`}
            onPress={() => onSelect(tone)}
          >
            <View style={[styles.swatchDot, { backgroundColor: noteTypeColor(tone) }]} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function SortPicker({
  onSelect,
  selectedSort,
}: {
  onSelect: (value: string) => void
  selectedSort: string
}) {
  return (
    <View style={styles.section} testID="workspace-type-sort-picker">
      {sortOptions.map((option) => {
        const selected = selectedSort === option.value
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="button"
            key={option.value}
            style={({ pressed }) => [
              styles.sortRow,
              selected ? styles.sortRowSelected : null,
              pressed ? styles.pressed : null,
            ]}
            testID={`workspace-type-sort-${option.value.replace(/[^a-z0-9]+/gu, '-')}`}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.rowText, selected ? styles.selectedText : null]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  editor: {
    gap: mobileSpace.md,
  },
  label: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  pressed: {
    backgroundColor: mobileColors.graySoft,
  },
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
  },
  section: {
    gap: mobileSpace.xs,
  },
  selectedText: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  sortRow: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
  },
  sortRowSelected: {
    backgroundColor: mobileColors.primarySoft,
  },
  swatch: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.sm,
  },
  toggleRow: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
  },
  typeName: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
})
