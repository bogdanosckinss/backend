import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number | undefined => {
    return context.switchToHttp().getRequest<any>()?.user
  },
);
