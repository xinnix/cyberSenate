import { z } from 'zod';
import { CreateCharacterSchema, UpdateCharacterSchema } from '@opencode/shared';
import { createCrudRouterWithCustom } from '../../../trpc/trpc.helper';
import { permissionProcedure, publicProcedure } from '../../../trpc/trpc';
import { ConflictException, ErrorCodes } from '../../../core/exceptions';

const characterGetManySchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    search: z.string().optional(),
    where: z.any().optional(),
    orderBy: z.any().optional(),
  })
  .optional();

export const charactersRouter = createCrudRouterWithCustom(
  'Character',
  {
    create: CreateCharacterSchema,
    update: UpdateCharacterSchema,
  },
  () => ({
    getMany: publicProcedure.input(characterGetManySchema).query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.limit ?? input?.pageSize ?? 10;
      const skip = (page - 1) * pageSize;

      const where: any = input?.where && typeof input.where === 'object' ? { ...input.where } : {};

      let searchTerm = input?.search;
      if (searchTerm) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { era: { contains: searchTerm, mode: 'insensitive' } },
          { expertise: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      delete where.search;

      const [data, total] = await Promise.all([
        ctx.prisma.character.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: input?.orderBy ?? { sort: 'asc' },
        }),
        ctx.prisma.character.count({ where }),
      ]);

      return {
        items: data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

    getOne: permissionProcedure('character', 'read')
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.character.findUnique({ where: { id: input.id } });
      }),

    create: permissionProcedure('character', 'create')
      .input(CreateCharacterSchema)
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.prisma.character.findUnique({ where: { slug: input.slug } });
        if (existing) {
          throw new ConflictException(ErrorCodes.CHARACTER_SLUG_EXISTS);
        }
        return ctx.prisma.character.create({
          data: {
            ...input,
            createdById: ctx.user?.id,
          },
        });
      }),

    update: permissionProcedure('character', 'update')
      .input(z.object({ id: z.string(), data: UpdateCharacterSchema }))
      .mutation(async ({ ctx, input }) => {
        if (input.data.slug) {
          const existing = await ctx.prisma.character.findFirst({
            where: { slug: input.data.slug, NOT: { id: input.id } },
          });
          if (existing) {
            throw new ConflictException(ErrorCodes.CHARACTER_SLUG_EXISTS);
          }
        }
        return ctx.prisma.character.update({
          where: { id: input.id },
          data: {
            ...input.data,
            updatedById: ctx.user?.id,
          },
        });
      }),

    delete: permissionProcedure('character', 'delete')
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.character.delete({ where: { id: input.id } });
      }),

    deleteMany: permissionProcedure('character', 'delete')
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.character.deleteMany({
          where: { id: { in: input.ids } },
        });
      }),

    getActive: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.character.findMany({
        where: { isActive: true },
        orderBy: { sort: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          era: true,
          mbti: true,
          coreStance: true,
          speakingStyle: true,
          expertise: true,
          avatar: true,
          isPreset: true,
          sort: true,
        },
      });
    }),
  }),
);
