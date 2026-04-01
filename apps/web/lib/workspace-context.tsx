'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface WorkspaceContextValue {
  slug: string;
  id: string;
  name: string;
  role: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
  workspace,
}: {
  children: ReactNode;
  workspace: WorkspaceContextValue;
}) {
  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export function useWorkspaceOptional() {
  return useContext(WorkspaceContext);
}
