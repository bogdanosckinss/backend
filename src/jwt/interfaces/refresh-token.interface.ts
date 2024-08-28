/*
  Free and Open Source - GNU LGPLv3
  Copyright © 2023
  Afonso Barracha
*/

import { ITokenBase } from './token-base.interface';
import { IAccessPayload } from './access-token.interface';

export interface IRefreshPayload extends IAccessPayload {
  tokenId: string;
  version: number;
}

export interface IRefreshToken extends IRefreshPayload, ITokenBase {}
