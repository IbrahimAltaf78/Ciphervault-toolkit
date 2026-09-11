export interface Anomaly {
    category: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
}

export interface AnalysisReport {
    filename: string;
    file_type: string;
    probability_score: number;
    is_suspicious: boolean;
    anomalies: Anomaly[];
    metadata: Record<string, unknown>;
}