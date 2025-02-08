export interface IPlan {
    id:           number;
    createDate:   Date;
    updateDate:   Date;
    isActive:     boolean;
    name:         string;
    description:  string;
    minFollowers: number;
    maxFollowers: number;
    durations:    Duration[];
}

export interface IDuration {
    id:           number;
    createDate:   Date;
    updateDate:   Date;
    name:         string;
    price:        number;
    durationDays: number;
    planId:       number;
}
