import { Controller, Get, Post, Query, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UploadDocumentSchema } from '@orgdashio/shared';

@Controller('api/v1/documents')
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(@Inject(DocumentService) private readonly documentService: DocumentService) {}

  @Get()
  async findByEntity(
    @Req() req: any,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string
  ) {
    return this.documentService.findByEntity(req.tenantId, entityType, entityId);
  }

  @Post('upload-url')
  async createSignedUploadUrl(@Req() req: any, @Body() body: any) {
    const parsed = UploadDocumentSchema.parse(body);
    return this.documentService.createSignedUploadUrl(req.tenantId, req.user.id, parsed);
  }
}
