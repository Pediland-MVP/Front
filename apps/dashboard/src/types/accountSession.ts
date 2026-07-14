export namespace AccountSessionNamespace {
  export type Sessions = _AccountSessions;
  export type Session = AccountSessionItem;
  export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';
}

export interface _AccountSessions {
  items: AccountSessionItem[];
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AccountSessionItem {
  id: string;
  deviceType: AccountSessionNamespace.DeviceType;
  name: string;
  type: string;
  ip: string;
  workspaceId: string;
  workspaceName: string;
  loginDate: string;
  isCurrent: boolean;
  canTerminate: boolean;
}
