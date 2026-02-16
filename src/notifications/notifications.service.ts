import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private configService: ConfigService) {
        // Determine if we should mock transport or not
        const host = this.configService.get<string>('SMTP_HOST');

        if (!host) {
            this.logger.warn('SMTP_HOST not set. Email notifications will be mocked.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: host,
            port: this.configService.get<number>('SMTP_PORT') || 587,
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, text: string) {
        if (!this.transporter) {
            this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: '"Appointment System" <noreply@example.com>',
                to,
                subject,
                text,
            });
            this.logger.log(`Email sent: ${info.messageId}`);
        } catch (error) {
            this.logger.error('Error sending email', error);
        }
    }
}
