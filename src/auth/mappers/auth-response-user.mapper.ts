
export class AuthResponseUserMapper {
  public id: number;
  public name: string;
  public username: string;
  public email: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(values: any) {
    Object.assign(this, values);
  }

  public static map(user: any): any {
    return new AuthResponseUserMapper({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
}
