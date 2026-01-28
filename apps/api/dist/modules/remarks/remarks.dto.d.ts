export declare enum RemarkType {
    TRADE_JUSTIFICATION = "trade_justification",
    STRATEGY = "strategy",
    RISK_ASSESSMENT = "risk_assessment",
    MARKET_SENTIMENT = "market_sentiment"
}
export declare class CreateRemarkDto {
    type: RemarkType;
    content: string;
    title?: string;
    symbolId?: string;
}
export declare class UpdateRemarkDto {
    content?: string;
}
