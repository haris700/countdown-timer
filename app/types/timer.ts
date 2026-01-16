export interface Timer {
    _id?: string;
    name: string;
    type: 'fixed' | 'evergreen';
    status: 'active' | 'paused' | 'expired';
    startAt?: string;
    endAt?: string;
    description?: string;
    targeting: {
        type: 'all' | 'product' | 'collection';
        productIds: string[];
        collectionIds: string[];
    };
    styleConfig: {
        color: string;
        size: 'small' | 'medium' | 'large';
        position: 'top' | 'bottom' | 'static';
        urgency: 'none' | 'pulse';
    };
    durationMinutes?: number;
    impressions?: number;
}
