export namespace StatsNamespace {
    export type Overall = OverallStats;
}

export interface OverallStats {
    products:           Leads;
    leads:              Leads;
    sessions:           Leads;
    contentCycles:      ContentCycles;
    eachMonthLeadGrows: EachMonthLeadGrow[];
    recentSessions: RecentSessions[]
}

export interface ContentCycles {
    count: number;
}

export interface EachMonthLeadGrow {
    monthName: string;
    count:     number;
    startDate: Date;
    endDate:   Date;
}

export interface Leads {
    count:  number;
    growth: number;
}


export interface RecentSessions {
    updateDate:         string
    passedFlows:   any[];
    id:            number;
    contentCycle:  ContentCycle;
    leadInstagram: LeadInstagram;
}

export interface ContentCycle {
    id:    string;
    title: string;
}

export interface LeadInstagram {
    id:             string;
    name:           string;
    username:       string;
    profilePicture: ProfilePicture;
}

export interface ProfilePicture {
    id:  number;
    url: string;
}
