/*
  Free and Open Source - GNU LGPLv3
  Copyright © 2023
  Afonso Barracha
*/

import { TemplateDelegate } from 'handlebars';
import { ITemplatedData } from './template-data.interface';
import { IEmailConfirmData } from './template-confirm.interface';

export interface ITemplates {
  confirmation: TemplateDelegate<IEmailConfirmData>;
  resetPassword: TemplateDelegate<ITemplatedData>;
}
