"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bidding_controller_1 = require("./bidding.controller");
describe('BiddingController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [bidding_controller_1.BiddingController],
        }).compile();
        controller = module.get(bidding_controller_1.BiddingController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=bidding.controller.spec.js.map