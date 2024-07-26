export namespace InstagramNamespace {
  export interface Account {
    id: string;
    createDate: string;
    updateDate: string;
    instagramId: string | null;
    facebookAccountId: string;
    facebookPageId: string | null;
    name: string;
    firstname: string;
    lastname: string;
    email: string | null;
    username: string | null;
    profileUrl: string;
    profilePictureUrl: string | null;
  }

  export interface Page {
    name: string;
    username: string;
    followers_count: number;
    follows_count: number;
    profile_picture_url?: string;
    biography: string;
    id: string;
  }

  export interface GET {
    Accounts: Account[];
    Pages: Page[]
  }
}
