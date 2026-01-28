import { CreateRemarkDto } from './remarks.dto';
import { CompetitionService } from '../competition/competition.service';
export declare class RemarksService {
    private readonly db;
    private readonly competitionService;
    constructor(db: any, competitionService: CompetitionService);
    createRemark(userId: string, dto: CreateRemarkDto): Promise<any>;
    getMyRemarks(userId: string): Promise<any[]>;
    getAllRemarks(competitionId: string): Promise<any[]>;
    updateRemark(userId: string, remarkId: string, content: string): Promise<{
        message: string;
    }>;
    scoreRemark(remarkId: string, score: number): Promise<{
        message: string;
    }>;
}
