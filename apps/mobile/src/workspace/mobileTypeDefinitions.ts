import {
  parseLocalVaultDocument,
  type LocalVaultFrontmatter,
  type LocalVaultFrontmatterValue,
} from './localVaultFrontmatter'
import type {
  MobileTone,
  MobileTypeDefinition,
  MobileTypeDefinitions,
} from './mobileWorkspaceModel'

type TypeName = string
type TypePath = string
type TypeRawContent = string

export type MobileTypeDefinitionPatch = {
  icon?: string | null
  label?: string | null
  listPropertiesDisplay?: string[]
  order?: number | null
  sort?: string | null
  template?: string | null
  tone?: MobileTone | null
  visible?: boolean | null
}

export function applyMobileTypeDefinitionPatch(
  definition: MobileTypeDefinition | undefined,
  patch: MobileTypeDefinitionPatch,
): MobileTypeDefinition {
  return {
    ...(definition ?? {}),
    ...normalizedTypePatch(patch),
  }
}

export function mobileTypeDefinitionPath(
  typeName: TypeName,
  definition?: MobileTypeDefinition,
): TypePath {
  return definition?.path ?? `${slugifyTypeName(typeName)}.md`
}

export function mobileTypeDefinitionContent(
  typeName: TypeName,
  definition: MobileTypeDefinition | undefined,
  patch: MobileTypeDefinitionPatch,
): TypeRawContent {
  const document = parseLocalVaultDocument(definition?.rawContent ?? defaultTypeDefinitionContent(typeName))
  return serializeTypeDocument(
    patchedTypeFrontmatter(document.frontmatter, patch),
    document.body,
  )
}

export function typeDefinitionsWithPatch(
  definitions: MobileTypeDefinitions | undefined,
  typeName: TypeName,
  patch: MobileTypeDefinitionPatch,
): MobileTypeDefinitions {
  const current = definitions ?? {}
  const existing = current[typeName]
  const nextDefinition = applyMobileTypeDefinitionPatch(existing, patch)

  return {
    ...current,
    [typeName]: {
      ...nextDefinition,
      path: mobileTypeDefinitionPath(typeName, existing),
      rawContent: mobileTypeDefinitionContent(typeName, existing, patch),
    },
  }
}

function normalizedTypePatch(patch: MobileTypeDefinitionPatch): MobileTypeDefinitionPatch {
  return {
    ...patch,
    label: normalizedTextPatch(patch.label),
    listPropertiesDisplay: normalizedListPatch(patch.listPropertiesDisplay),
    sort: normalizedTextPatch(patch.sort),
    template: normalizedTextPatch(patch.template),
  }
}

function normalizedTextPatch(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizedListPatch(value: string[] | undefined) {
  if (value === undefined) return undefined

  const seen = new Set<string>()
  return value
    .map((item) => item.trim())
    .filter((item) => {
      const normalized = item.toLowerCase()
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

function patchedTypeFrontmatter(
  frontmatter: LocalVaultFrontmatter,
  patch: MobileTypeDefinitionPatch,
): LocalVaultFrontmatter {
  const nextFrontmatter = { ...frontmatter }
  writeFrontmatterValue(nextFrontmatter, 'type', 'Type')
  writeOptionalFrontmatterValue(nextFrontmatter, 'sidebar label', patch.label)
  writeOptionalFrontmatterValue(nextFrontmatter, 'color', patch.tone)
  writeOptionalFrontmatterValue(nextFrontmatter, 'icon', patch.icon)
  writeOptionalFrontmatterValue(nextFrontmatter, 'template', patch.template)
  writeOptionalFrontmatterValue(nextFrontmatter, 'sort', patch.sort)
  writeOptionalFrontmatterValue(nextFrontmatter, '_list_properties_display', patch.listPropertiesDisplay)
  writeOptionalFrontmatterValue(nextFrontmatter, 'order', patch.order)

  if (patch.visible !== undefined) {
    writeFrontmatterValue(nextFrontmatter, 'visible', patch.visible === false ? false : null)
  }

  return nextFrontmatter
}

function writeOptionalFrontmatterValue(
  frontmatter: LocalVaultFrontmatter,
  key: string,
  value: LocalVaultFrontmatterValue | undefined,
) {
  if (value !== undefined) writeFrontmatterValue(frontmatter, key, value)
}

function writeFrontmatterValue(
  frontmatter: LocalVaultFrontmatter,
  key: string,
  value: LocalVaultFrontmatterValue | undefined,
) {
  if (shouldRemoveFrontmatterValue(value)) {
    Reflect.deleteProperty(frontmatter, key)
    return
  }

  frontmatter[key] = value
}

function shouldRemoveFrontmatterValue(
  value: LocalVaultFrontmatterValue | undefined,
): value is undefined | null | [] {
  return value === undefined || value === null || (Array.isArray(value) && value.length === 0)
}

function defaultTypeDefinitionContent(typeName: TypeName): TypeRawContent {
  return serializeTypeDocument({ type: 'Type' }, `# ${typeName.trim() || 'Type'}\n`)
}

function serializeTypeDocument(
  frontmatter: LocalVaultFrontmatter,
  body: TypeRawContent,
): TypeRawContent {
  const entries = Object.entries(frontmatter).filter(([, value]) => value !== null && value !== undefined)
  if (entries.length === 0) return body

  return `---\n${entries.map(([key, value]) => serializeFrontmatterEntry(key, value)).join('\n')}\n---\n${body}`
}

function serializeFrontmatterEntry(
  key: string,
  value: LocalVaultFrontmatterValue,
): string {
  if (Array.isArray(value)) {
    return `${key}:\n${value.map((item) => `  - ${serializeScalar(item)}`).join('\n')}`
  }

  return `${key}: ${serializeScalar(value)}`
}

function serializeScalar(value: Exclude<LocalVaultFrontmatterValue, LocalVaultFrontmatterValue[]>): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  if (value === null) return 'null'
  if (value === '' || /[:#\n\r]/u.test(value)) return JSON.stringify(value)
  return value
}

function slugifyTypeName(value: TypeName): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '') || 'type'
}
