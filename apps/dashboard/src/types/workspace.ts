export interface WorkspaceCategoryRef {
  id: string;
  nameEn: string;
  nameFa: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  isPersonal: boolean;
  category: WorkspaceCategoryRef | null;
}

export interface Permission {
  id: string;
  slug: string;
  description?: string;
}
