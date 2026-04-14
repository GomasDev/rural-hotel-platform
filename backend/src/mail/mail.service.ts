import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface BookingEmailData {
  bookingId:    string;
  guestName:    string;
  guestEmail:   string;
  adminName:    string;
  adminEmail:   string;
  hotelName:    string;
  roomName:     string;
  checkIn:      string;
  checkOut:     string;
  nights:       number;
  guests:       number;
  totalPrice:   number;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from   = process.env.MAIL_FROM ?? 'onboarding@resend.dev';

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private fmtDate(d: string | Date): string {
    return new Date(d).toLocaleDateString('es-ES', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  private fmtMoney(n: number): string {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  private baseTemplate(title: string, content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <tr>
              <td style="background:#15803d;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
                <span style="font-size:28px;">🏡</span>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                  RuralHot
                </h1>
              </td>
            </tr>

            <tr>
              <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
                ${content}
                <hr style="border:none;border-top:1px solid #e5e4e0;margin:32px 0;" />
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                  © ${new Date().getFullYear()} RuralHot · Este email fue enviado automáticamente, por favor no respondas a este mensaje.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
  }

  async sendNewBookingToAdmin(data: BookingEmailData): Promise<void> {
    const content = `
      <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">
        Nueva reserva recibida 🎉
      </h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">
        Hola <strong>${data.adminName}</strong>, tienes una nueva reserva pendiente de confirmación en <strong>${data.hotelName}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:24px;margin-bottom:28px;">
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Habitación</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.roomName}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Huésped</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.guestName} · ${data.guestEmail}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Check-in</span><br/>
          <strong style="color:#111827;font-size:15px;">${this.fmtDate(data.checkIn)}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Check-out</span><br/>
          <strong style="color:#111827;font-size:15px;">${this.fmtDate(data.checkOut)}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Noches · Huéspedes</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.nights} noches · ${data.guests} huéspedes</strong>
        </td></tr>
        <tr><td style="padding:6px 0;border-top:1px solid #e5e7eb;">
          <span style="color:#6b7280;font-size:13px;">Total</span><br/>
          <strong style="color:#15803d;font-size:20px;">${this.fmtMoney(data.totalPrice)}</strong>
        </td></tr>
      </table>

      <p style="color:#6b7280;font-size:14px;text-align:center;margin:0;">
        Accede al panel para <strong>confirmar o rechazar</strong> esta reserva.
      </p>`;

    await this.send(data.adminEmail, `Nueva reserva en ${data.hotelName} — ${data.roomName}`, content);
  }

  async sendBookingConfirmedToClient(data: BookingEmailData): Promise<void> {
    const content = `
      <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">
        ¡Tu reserva está confirmada! ✅
      </h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">
        Hola <strong>${data.guestName}</strong>, el alojamiento ha confirmado tu reserva. ¡Nos vemos pronto!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:24px;margin-bottom:28px;">
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Alojamiento</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.hotelName} · ${data.roomName}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Check-in</span><br/>
          <strong style="color:#111827;font-size:15px;">${this.fmtDate(data.checkIn)}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Check-out</span><br/>
          <strong style="color:#111827;font-size:15px;">${this.fmtDate(data.checkOut)}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Noches · Huéspedes</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.nights} noches · ${data.guests} huéspedes</strong>
        </td></tr>
        <tr><td style="padding:6px 0;border-top:1px solid #bbf7d0;">
          <span style="color:#6b7280;font-size:13px;">Total pagado</span><br/>
          <strong style="color:#15803d;font-size:20px;">${this.fmtMoney(data.totalPrice)}</strong>
        </td></tr>
      </table>

      <p style="color:#6b7280;font-size:14px;text-align:center;margin:0;">
        Si necesitas modificar o cancelar tu reserva, accede a tu panel de usuario.
      </p>`;

    await this.send(data.guestEmail, `Reserva confirmada — ${data.hotelName}`, content);
  }

  async sendBookingCancelledToClient(data: BookingEmailData): Promise<void> {
    const content = `
      <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">
        Tu reserva ha sido cancelada ❌
      </h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">
        Hola <strong>${data.guestName}</strong>, lamentamos informarte de que tu reserva ha sido cancelada.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#fff7f7;border:1px solid #fecaca;border-radius:10px;padding:24px;margin-bottom:28px;">
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Alojamiento</span><br/>
          <strong style="color:#111827;font-size:15px;">${data.hotelName} · ${data.roomName}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="color:#6b7280;font-size:13px;">Fechas</span><br/>
          <strong style="color:#111827;font-size:15px;">${this.fmtDate(data.checkIn)} → ${this.fmtDate(data.checkOut)}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;border-top:1px solid #fecaca;">
          <span style="color:#6b7280;font-size:13px;">Importe</span><br/>
          <strong style="color:#ef4444;font-size:20px;">${this.fmtMoney(data.totalPrice)}</strong>
        </td></tr>
      </table>

      <p style="color:#6b7280;font-size:14px;text-align:center;margin:0;">
        Si crees que es un error, contacta con el alojamiento o con nuestro soporte.
      </p>`;

    await this.send(data.guestEmail, `Reserva cancelada — ${data.hotelName}`, content);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const content = `
      <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">
        Restablecer contraseña 🔑
      </h2>
      <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">
        Has solicitado restablecer tu contraseña en <strong>RuralHot</strong>.
        Haz clic en el botón para continuar:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr><td align="center">
          <a href="${resetUrl}"
            style="display:inline-block;background:#15803d;color:#ffffff;
                   font-size:15px;font-weight:600;text-decoration:none;
                   padding:14px 32px;border-radius:8px;">
            Restablecer contraseña
          </a>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 24px;">
        <tr><td>
          <p style="color:#92400e;font-size:13px;margin:0;">
            ⚠️ Este enlace expira en <strong>1 hora</strong>.<br/>
            Si no solicitaste este cambio, puedes ignorar este email de forma segura.
          </p>
        </td></tr>
      </table>`;

    await this.send(email, '🔑 Recuperación de contraseña — RuralHot', content);
  }

  private async send(to: string, subject: string, content: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html: this.baseTemplate(subject, content),
      });
      this.logger.log(`Email enviado a ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Error enviando email a ${to}:`, err);
    }
  }
}