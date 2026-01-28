import { RemarksService } from './remarks.service';
import { CreateRemarkDto } from './remarks.dto';
export declare class RemarksController {
    private readonly remarksService;
    constructor(remarksService: RemarksService);
    createRemark(userId: string, dto: CreateRemarkDto): Promise<any>;
    updateRemark(userId: string, remarkId: string, body: {
        content: string;
    }): Promise<{
        message: string;
    }>;
    getMyRemarks(userId: string): Promise<any[]>;
    getAllRemarks(competitionId: string): Promise<any[]>;
    scoreRemark(remarkId: string, body: {
        score: number;
    }): Promise<{
        message: string;
    }>;
}
