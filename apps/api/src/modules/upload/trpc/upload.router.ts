import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Upload tRPC Router
 *
 * 文件上传路由，提供：
 * - getUploadCredentials: 获取上传凭证（OSS 客户端直传）
 * - uploadFile: 服务端上传（base64 编码，适用于本地存储等场景）
 */
export const uploadRouter = router({
  /**
   * 获取上传凭证（客户端直传）
   */
  getUploadCredentials: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.fileStorage) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '文件存储服务未初始化',
          });
        }

        const dirPath = `images/${input.type}`;
        const credentials = await ctx.fileStorage.getUploadCredentials(dirPath);
        return credentials;
      } catch (error) {
        // 本地存储等不支持客户端直传的场景，返回 null，前端自动回退到服务端上传
        if (error instanceof Error && error.message.includes('不支持客户端直传')) {
          return null;
        }
        console.error('获取上传凭证失败:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : '获取上传凭证失败',
        });
      }
    }),

  /**
   * 服务端上传文件（base64 编码）
   *
   * 用于本地存储或不支持客户端直传的场景。
   * 前端将文件转为 base64，后端解码后存储。
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        file: z.string(), // base64 编码的文件内容（含 data URI prefix）
        fileName: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.uploadService) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '上传服务未初始化',
          });
        }

        // 解析 data URI：data:image/png;base64,xxxxx
        const matches = input.file.match(/^data:(.+?);base64,(.+)$/);
        if (!matches) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '无效的文件格式，需要 data URI 编码',
          });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // 验证文件类型
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '仅支持 JPG、PNG、GIF、WEBP 格式的图片',
          });
        }

        // 验证文件大小（5MB）
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '图片大小不能超过 5MB',
          });
        }

        // 构造 UploadedFile 格式
        const file = {
          originalname: input.fileName,
          buffer,
          size: buffer.length,
          mimetype: mimeType,
        };

        const result = await ctx.uploadService.uploadFile(file, input.type);
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('文件上传失败:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : '文件上传失败',
        });
      }
    }),
});
