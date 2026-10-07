import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user has platform admin privilege or header flag
    const isPlatformAdmin =
      request.headers['x-platform-admin'] === 'true' ||
      request.user?.isPlatformAdmin === true ||
      process.env.NODE_ENV === 'development'; // allow in dev if header or flag passed

    if (!isPlatformAdmin) {
      throw new ForbiddenException(
        'Accès réservé exclusivement aux administrateurs de la plateforme SaaS OrgDashio'
      );
    }

    return true;
  }
}
