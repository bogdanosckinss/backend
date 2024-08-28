import { AuthResponseUserMapper } from './auth-response-user.mapper';

export class AuthResponseMapper  {
  public readonly user: AuthResponseUserMapper;

  public readonly accessToken: string;

  constructor(values: any) {
    Object.assign(this, values);
  }

  public static map(result: any): AuthResponseMapper {
    return new AuthResponseMapper({
      user: AuthResponseUserMapper.map(result.user),
      accessToken: result.accessToken,
    });
  }
}
