export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

export interface Permission {
  id: string;
  slug: string;
  description?: string;
}
