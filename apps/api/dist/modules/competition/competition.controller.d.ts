import { CompetitionService } from './competition.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './competition.dto';
export declare class CompetitionController {
    private readonly competitionService;
    constructor(competitionService: CompetitionService);
    getActiveCompetition(): Promise<any>;
    getActiveCompetitionStats(): Promise<{
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
    } | null>;
    getActiveCompetitionSettings(): Promise<any>;
    updateActiveCompetitionSettings(dto: UpdateCompetitionDto): Promise<any>;
    startActiveCompetition(): Promise<any>;
    pauseActiveCompetition(): Promise<any>;
    endActiveCompetition(): Promise<any>;
    resetActiveCompetition(): Promise<{
        success: boolean;
        message: string;
    } | null>;
    getAllCompetitions(): Promise<any>;
    getCompetition(id: string): Promise<any>;
    getCompetitionStats(id: string): Promise<{
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
    exportCompetitionReport(id: string): Promise<{
        csv: string;
    }>;
    createCompetition(dto: CreateCompetitionDto): Promise<any>;
    updateCompetition(id: string, dto: UpdateCompetitionDto): Promise<any>;
    updateStatus(id: string, status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended'): Promise<any>;
    joinCompetition(userId: string, competitionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
