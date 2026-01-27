import { ConfigService } from '@nestjs/config';
interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private isConfigured;
    constructor(configService: ConfigService);
    sendEmail(options: SendEmailOptions): Promise<boolean>;
    sendWelcomeEmail(user: {
        email: string;
        fullName: string;
        username: string;
        password: string;
    }): Promise<boolean>;
}
export {};
