import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'mailpit',
        port: Number(process.env.MAIL_PORT) || 1025,
        auth: process.env.MAIL_USER ? {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        } : undefined, // ← Mailpit no necesita auth
      },
      defaults: {
        from: process.env.MAIL_FROM || 'noreply@ruralhot.com',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
