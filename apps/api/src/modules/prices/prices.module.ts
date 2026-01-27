// ============================================================
// Bullish Clash - Prices Module
// ============================================================

import { Module, forwardRef } from '@nestjs/common';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';
import { SymbolsModule } from '../symbols/symbols.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
    imports: [
        SymbolsModule,
        forwardRef(() => WebSocketModule),
    ],
    controllers: [PricesController],
    providers: [PricesService],
    exports: [PricesService],
})
export class PricesModule { }
