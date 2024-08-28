export class OAuthProviderResponseMapper {
  public readonly provider: any;

  public readonly createdAt: string;

  public readonly updatedAt: string;

  constructor(values: any) {
    Object.assign(this, values);
  }

  public static map(provider: any): OAuthProviderResponseMapper {
    return new OAuthProviderResponseMapper({
      provider: provider.provider,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    });
  }
}

export class OAuthProvidersResponseMapper {
  public readonly data: OAuthProviderResponseMapper[];

  constructor(values: any) {
    Object.assign(this, values);
  }

  public static map(providers: any[]): any {
    return new OAuthProvidersResponseMapper({
      data: providers.map((provider) =>
        OAuthProviderResponseMapper.map(provider),
      ),
    });
  }
}
