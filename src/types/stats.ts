export type OverallStats = {
  products: Leads;
  leads: Leads;
  sessions: Leads;
  sales: Leads;
  contentCycles: ContentCycles;
  eachMonthLeadGrows: EachMonthLeadGrow[];
  recentSessions: RecentSessions[];
}

export type ContentCycles = {
  count: number;
}

export type EachMonthLeadGrow = {
  monthName: string;
  count: number;
  startDate: Date;
  endDate: Date;
}

export type Leads = {
  count: number;
  total: number;
  growth: number;
}

export type RecentSessions = {
  updateDate: string;
  passedFlows: any[];
  id: number;
  contentCycle: ContentCycle;
  leadInstagram: LeadInstagram;
}

export type ContentCycle = {
  id: string;
  title: string;
}

export type LeadInstagram = {
  id: string;
  name: string;
  username: string;
  profilePicture: ProfilePicture;
}

export type ProfilePicture = {
  id: number;
  url: string;
}
