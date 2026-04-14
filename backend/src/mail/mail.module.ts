import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_SMTP_HOST,
        port: Number(process.env.EMAIL_SMTP_PORT) || 1025,
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: process.env.EMAIL_SMTP_USER ? {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASSWORD,
        } : undefined,
      },
      defaults: {
        from: process.env.EMAIL_FROM
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
