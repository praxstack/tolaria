import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  applyMobileWorkspaceEditWithWrites,
  type MobileWorkspaceEdit,
  type MobileWorkspaceWrite,
} from '../workspace/mobileWorkspaceEditing'
import type { MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import type {
  ReadOnlyWorkspaceRepository,
  ReadOnlyWorkspaceRequest,
} from '../workspace/readOnlyWorkspaceRepository'

type WorkspaceSnapshotRef = MutableRefObject<MobileWorkspaceSnapshot>
type WorkspaceSnapshotSetter = Dispatch<SetStateAction<MobileWorkspaceSnapshot>>

export function useWorkspaceEditPipeline({
  repository,
  repositoryRequest,
  snapshot,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  snapshot: MobileWorkspaceSnapshot
}) {
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(snapshot)
  const workspaceSnapshotRef = useRef(workspaceSnapshot)
  const applyWorkspaceEdit = useCallback((edit: MobileWorkspaceEdit) => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceSnapshotRef.current, edit)
    updateWorkspaceSnapshot(result.snapshot, workspaceSnapshotRef, setWorkspaceSnapshot)
    if (result.writes.length > 0) void persistWorkspaceWrites({
      repository,
      repositoryRequest,
      setWorkspaceSnapshot,
      workspaceSnapshotRef,
      writes: result.writes,
    })
    return result
  }, [repository, repositoryRequest])

  useEffect(() => {
    workspaceSnapshotRef.current = workspaceSnapshot
  }, [workspaceSnapshot])

  return {
    applyWorkspaceEdit,
    workspaceSnapshot,
  }
}

function updateWorkspaceSnapshot(
  snapshot: MobileWorkspaceSnapshot,
  workspaceSnapshotRef: WorkspaceSnapshotRef,
  setWorkspaceSnapshot: WorkspaceSnapshotSetter,
) {
  workspaceSnapshotRef.current = snapshot
  setWorkspaceSnapshot(snapshot)
}

async function persistWorkspaceWrites({
  repository,
  repositoryRequest,
  setWorkspaceSnapshot,
  workspaceSnapshotRef,
  writes,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  setWorkspaceSnapshot: WorkspaceSnapshotSetter
  workspaceSnapshotRef: WorkspaceSnapshotRef
  writes: MobileWorkspaceWrite[]
}) {
  try {
    await repository.persistWrites(writes, repositoryRequest)
  } catch {
    markWorkspaceWriteFailed(workspaceSnapshotRef, setWorkspaceSnapshot)
  }
}

function markWorkspaceWriteFailed(
  workspaceSnapshotRef: WorkspaceSnapshotRef,
  setWorkspaceSnapshot: WorkspaceSnapshotSetter,
) {
  setWorkspaceSnapshot((current) => {
    const failedSnapshot = snapshotWithWriteFailure(current)
    workspaceSnapshotRef.current = failedSnapshot
    return failedSnapshot
  })
}

function snapshotWithWriteFailure(snapshot: MobileWorkspaceSnapshot): MobileWorkspaceSnapshot {
  if (snapshot.sync.kind === 'writeFailed') return snapshot

  return {
    ...snapshot,
    sync: { kind: 'writeFailed' },
  }
}
