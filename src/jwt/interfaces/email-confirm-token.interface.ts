/*
  Free and Open Source - GNU LGPLv3
  Copyright © 2023
  Afonso Barracha
*/

import { IAccessPayload } from './access-token.interface';
import { ITokenBase } from './token-base.interface';

export interface IEmailPayload extends IAccessPayload {
  code: string;
  version: number;
}

export interface IEmailToken extends IEmailPayload, ITokenBase {}
