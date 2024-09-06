import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ITemplatedData } from './interfaces/template-data.interface';
import { IEmailConfirmData } from './interfaces/template-confirm.interface';
import { ITemplates } from './interfaces/templates.interface';

@Injectable()
export class MailerService {
  private readonly loggerService: LoggerService;
  private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly email: string;
  private readonly templates: ITemplates;

  constructor(private readonly configService: ConfigService) {
    const emailConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'lamenscya@gmail.com',
        pass: 'vugm mhvd uiaf hjaw',
      },
    }
    this.transport = createTransport(emailConfig);
    this.email = `"My App" <${emailConfig.auth.user}>`;
    this.loggerService = new Logger(MailerService.name);
    this.templates = {
      confirmation: MailerService.parseConfirmation('confirmation.hbs'),
      resetPassword: MailerService.parseTemplate('reset-password.hbs'),
    };
  }

  private static parseTemplate(
    templateName: string,
  ): Handlebars.TemplateDelegate<ITemplatedData> {
    const templateText = '' /*readFileSync(
      join('app/src/src/mailer/', 'templates', templateName),
      'utf-8',
    );*/
    return Handlebars.compile<ITemplatedData>(templateText, { strict: true });
  }

  private static parseConfirmation(
    templateName: string,
  ): Handlebars.TemplateDelegate<IEmailConfirmData> {
    const templateText = '' /*readFileSync(
      join('app/src/src/mailer/', 'templates', templateName),
      'utf-8',
    );*/
    return Handlebars.compile<IEmailConfirmData>(templateText, {
      strict: true,
    });
  }

  public sendConfirmationEmail(user: any, confirmationCode: string): void {
    const { email } = user;
    const subject = 'Confirm your email';
    const html = this.templates.confirmation({
      name: email,
      code: confirmationCode,
    });
    this.sendEmail(email, subject, html, 'A new confirmation email was sent.');
  }

  public sendEmail(
    to: string,
    subject: string,
    html: string,
    log?: string,
  ): void {
    this.transport
      .sendMail({
        from: this.email,
        to,
        subject,
        html,
      })
      .then(() => this.loggerService.log(log ?? 'A new email was sent.'))
      .catch((error) => this.loggerService.error(error));
  }
}
