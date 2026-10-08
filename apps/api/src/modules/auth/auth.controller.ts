import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterTenantSchema, LoginSchema, UpdateTenantSchema, UpdateUserProfileSchema } from '@orgdashio/shared';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const sessionToken = req.cookies?.['orgdashio_session'];
    if (!sessionToken) {
      throw new UnauthorizedException('Non connecté');
    }
    return this.authService.getMe(sessionToken);
  }

  @Patch('tenant')
  @UseGuards(AuthGuard)
  async updateTenant(@Req() req: any, @Body() body: any) {
    const parsed = UpdateTenantSchema.parse(body);
    return this.authService.updateTenantProfile(req.tenantId, parsed);
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    const parsed = UpdateUserProfileSchema.parse(body);
    return this.authService.updateUserProfile(req.user.id, parsed);
  }

  @Post('register-tenant')
  async registerTenant(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = RegisterTenantSchema.parse(body);
    const result = await this.authService.registerTenant(
      parsed,
      req.ip,
      req.headers['user-agent']
    );

    // Set HttpOnly session cookie for the newly registered tenant admin
    res.cookie('orgdashio_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      tenant: result.tenant,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parsed = LoginSchema.parse(body);
    const result = await this.authService.login(
      parsed,
      req.ip,
      req.headers['user-agent']
    );

    // Set HttpOnly session cookie
    res.cookie('orgdashio_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
      activeTenantId: result.activeTenantId,
    };
  }

  @Post('switch-tenant')
  @UseGuards(AuthGuard)
  async switchTenant(@Req() req: Request, @Body() body: { tenantId?: string | null }) {
    const sessionToken = req.cookies?.['orgdashio_session'];
    if (!sessionToken) {
      throw new UnauthorizedException('Non connecté');
    }
    return this.authService.switchTenant(sessionToken, body.tenantId ?? null);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async getSessions(@Req() req: any) {
    const sessionToken = req.cookies?.['orgdashio_session'];
    return this.authService.getUserSessions(req.user.id, sessionToken);
  }

  @Post('sessions/revoke-others')
  @UseGuards(AuthGuard)
  async revokeOtherSessions(@Req() req: any) {
    const sessionToken = req.cookies?.['orgdashio_session'];
    return this.authService.revokeOtherSessions(req.user.id, sessionToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionToken = req.cookies?.['orgdashio_session'];
    if (sessionToken) {
      await this.authService.revokeSession(sessionToken);
    }
    res.clearCookie('orgdashio_session', { path: '/' });
    return { success: true };
  }
}
