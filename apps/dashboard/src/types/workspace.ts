export interface WorkspaceCategoryRef {
  id: string;
  nameEn: string;
  nameFa: string;
}

export interface WorkspaceInstagramAccount {
  id: string;
  username: string;
  isIgTokenValid: boolean;
  profilePicture: { url: string } | null;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  isPersonal: boolean;
  category: WorkspaceCategoryRef | null;
  instagrams: WorkspaceInstagramAccount[];
}

export interface Permission {
  id: string;
  slug: string;
  description?: string;
}
