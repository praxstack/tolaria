export type FixtureNote = {
  created: string
  date: string
  favorite: boolean
  id: string
  links: number
  modified: string
  relationships: string[]
  status: string
  snippet: string
  tags: string[]
  title: string
  type: string
  typeTone: 'green' | 'orange' | 'purple'
  words: number
  workspace: string
}

export const fixtureNotes: FixtureNote[] = [
  {
    id: 'workflow-orchestration',
    title: 'Workflow Orchestration Essay',
    snippet: 'The current narrative and temptation: everything routed through an LLM.',
    type: 'Essay',
    typeTone: 'green',
    tags: ['Design', 'AI'],
    status: 'Draft',
    date: 'May 13, 2026',
    modified: '9h ago',
    created: '5d ago',
    favorite: true,
    links: 12,
    relationships: ['LLM Workflow', 'Tolaria MVP'],
    words: 842,
    workspace: 'TV',
  },
  {
    id: 'open-source-project',
    title: 'How I Run an Open Source Project',
    snippet: 'Tolaria unexpected success: various sources of input, requests, and bugs.',
    type: 'Procedure',
    typeTone: 'purple',
    tags: ['Process', 'Public'],
    status: 'Active',
    date: 'May 12, 2026',
    modified: '10h ago',
    created: '10h ago',
    favorite: false,
    links: 8,
    relationships: ['Contribution Flow', 'Release Notes'],
    words: 1264,
    workspace: 'TV',
  },
  {
    id: 'release-2026-05-02',
    title: 'v2026-05-02',
    snippet: 'Release cleanup date, bug fixes, and mobile planning notes.',
    type: 'Release',
    typeTone: 'orange',
    tags: ['Tolaria MVP'],
    status: 'Shipped',
    date: 'May 2, 2026',
    modified: '12h ago',
    created: '1d ago',
    favorite: false,
    links: 18,
    relationships: ['QA Checklist', 'Mobile Planning'],
    words: 493,
    workspace: 'TV',
  },
]

export const fixtureEditorBullets = [
  'The current narrative routes every workflow through an LLM surface.',
  'Tolaria should keep writing, relationships, and properties visible together.',
  'The mobile UI should match desktop semantics before phone-specific reduction.',
]
