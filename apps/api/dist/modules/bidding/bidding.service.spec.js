"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bidding_service_1 = require("./bidding.service");
describe('BiddingService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [bidding_service_1.BiddingService],
        }).compile();
        service = module.get(bidding_service_1.BiddingService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=bidding.service.spec.js.map