import { CreateCompetitionDto, UpdateCompetitionDto } from './competition.dto';
export declare class CompetitionService {
    private readonly db;
    constructor(db: any);
    getActiveCompetition(): Promise<any>;
    getCompetition(id: string): Promise<any>;
    getAllCompetitions(): Promise<any>;
    createCompetition(dto: CreateCompetitionDto): Promise<any>;
    updateCompetition(id: string, dto: UpdateCompetitionDto): Promise<any>;
    updateStatus(id: string, status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended'): Promise<any>;
    joinCompetition(userId: string, competitionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCompetitionStats(competitionId: string): Promise<{
        competitionId: string;
        name: any;
        status: any;
        participantCount: any;
        totalTrades: any;
        totalVolume: any;
        startTime: any;
        endTime: any;
        remainingTimeMs: number;
        remainingTimeFormatted: string;
    }>;
    resetCompetition(competitionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private formatRemainingTime;
}
