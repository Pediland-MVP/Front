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
  subscriptionDaysLeft: number | null;
  hasReservedSubscription: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  isPersonal: boolean;
  category: WorkspaceCategoryRef | null;
  hasCreditCoverage: boolean;
  instagrams: WorkspaceInstagramAccount[];
}

export interface Permission {
  id: string;
  slug: string;
  description?: string;
}
