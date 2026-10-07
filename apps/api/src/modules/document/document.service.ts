import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DB } from '../../common/database/database.module';
import { DbClient, withTenantContext, document, UploadDocumentInput } from '@orgdashio/shared';
import { eq, and } from 'drizzle-orm';
import { generateStorageKey, validateMimeType } from './document.utils';

@Injectable()
export class DocumentService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DbClient) {}

  async createSignedUploadUrl(tenantId: string, userId: string, input: UploadDocumentInput) {
    if (!validateMimeType(input.mimeType)) {
      throw new BadRequestException('Type de fichier non autorisé');
    }

    const storageKey = generateStorageKey(tenantId, input.entityType, input.entityId, input.fileName);

    const docRecord = await withTenantContext(this.db, tenantId, async (tx) => {
      const [res] = await tx
        .insert(document)
        .values({
          tenantId,
          entityType: input.entityType,
          entityId: input.entityId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          storageKey,
          uploadedBy: userId,
        })
        .returning();
      return res;
    });

    // Simulated 15-minute signed S3 upload URL
    const uploadUrl = `https://s3.ca-central-1.amazonaws.com/orgdashio-uploads/${storageKey}?signature=mock_sig_15min`;

    return {
      document: docRecord,
      uploadUrl,
    };
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string) {
    return withTenantContext(this.db, tenantId, async (tx) => {
      return tx
        .select()
        .from(document)
        .where(and(eq(document.entityType, entityType), eq(document.entityId, entityId)));
    });
  }
}
