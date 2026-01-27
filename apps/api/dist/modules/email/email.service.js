"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    isConfigured = false;
    constructor(configService) {
        this.configService = configService;
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (smtpUser && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
                port: this.configService.get('SMTP_PORT') || 587,
                secure: false,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
            this.isConfigured = true;
            this.logger.log('Email service configured with SMTP');
        }
        else {
            this.logger.warn('Email service not configured - SMTP_USER or SMTP_PASS missing');
        }
    }
    async sendEmail(options) {
        if (!this.isConfigured) {
            this.logger.warn('Email not sent - service not configured');
            return false;
        }
        const smtpUser = this.configService.get('SMTP_USER');
        const fromEmail = smtpUser || 'noreply@bullishclash.com';
        try {
            const info = await this.transporter.sendMail({
                from: `"Bullish Clash" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
            });
            this.logger.log(`Email sent successfully to ${options.to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error);
            return false;
        }
    }
    async sendWelcomeEmail(user) {
        const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bullish Clash</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
        }
        .logo span {
            color: #333;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .credentials {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .credentials p {
            margin: 8px 0;
        }
        .credentials strong {
            color: #333;
            display: inline-block;
            width: 100px;
        }
        .credentials code {
            background-color: #e9ecef;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: #059669;
        }
        .warning {
            background-color: #fff3cd;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #856404;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📈 Bullish<span>Clash</span></div>
        </div>
        
        <h1>Welcome to Bullish Clash, ${user.fullName}!</h1>
        
        <p>Your account has been created for the Nepal Stock Market Trading Simulator. You can now participate in the competition and test your trading skills!</p>
        
        <div class="credentials">
            <p><strong>Email:</strong> <code>${user.email}</code></p>
            <p><strong>Username:</strong> <code>${user.username}</code></p>
            <p><strong>Password:</strong> <code>${user.password}</code></p>
        </div>
        
        <center>
            <a href="${appUrl}/login" class="btn">Login to Start Trading</a>
        </center>
        
        <div class="warning">
            ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
        </div>
        
        <div class="footer">
            <p>Good luck with your trades! 🚀</p>
            <p>— The Bullish Clash Team</p>
        </div>
    </div>
</body>
</html>
        `;
        return this.sendEmail({
            to: user.email,
            subject: '🎉 Welcome to Bullish Clash - Your Login Credentials',
            html,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map