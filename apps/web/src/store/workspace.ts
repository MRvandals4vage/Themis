import { create } from "zustand";

type WorkspaceState = {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (organizationId: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedOrganizationId: null,
  setSelectedOrganizationId: (selectedOrganizationId) =>
    set({ selectedOrganizationId }),
}));
