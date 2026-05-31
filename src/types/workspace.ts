export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  isPersonal: boolean;
}

export interface Permission {
  id: string;
  slug: string;
  description?: string;
}
