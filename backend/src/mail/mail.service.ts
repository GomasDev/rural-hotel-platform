import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: '🔑 Recuperación de contraseña — RuralHot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #15803d;">Recuperar contraseña</h2>
          <p>Has solicitado restablecer tu contraseña en RuralHot.</p>
          <p>Haz click en el botón para continuar:</p>
          <a href="${resetUrl}"
             style="display:inline-block; background:#15803d; color:white;
                    padding:12px 24px; border-radius:8px; text-decoration:none;">
            Restablecer contraseña
          </a>
          <p style="color:#999; font-size:12px; margin-top:16px;">
            Este enlace expira en <strong>1 hora</strong>.<br/>
            Si no solicitaste esto, ignora este email.
          </p>
        </div>
      `,
    });
  }
}
