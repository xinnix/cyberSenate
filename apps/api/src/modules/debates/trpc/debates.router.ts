import { z } from 'zod';
import { protectedProcedure } from '../../../trpc/trpc';
import { DebateAudioService } from '../services/debate-audio.service';
import { DebatesService } from '../services/debates.service';
import { FileStorageService } from '../../../shared/services/file-storage.service';

const COURT_TOPICS = [
  'AI 会取代人类吗？',
  '该不该让孩子玩游戏？',
  '35岁该不该辞职创业？',
  '大学还有必要上吗？',
  '金钱能买到幸福吗？',
  '努力工作真的能改变命运吗？',
  '结婚是人生的必选项吗？',
  '大城市买房还是回老家发展？',
  '996 加班文化该废除吗？',
  '原生家庭对一个人的影响能摆脱吗？',
  '学历贬值时代，读书还有用吗？',
  '自由恋爱比相亲更靠谱吗？',
  '丁克家庭会被社会淘汰吗？',
  '宠物经济是情感代偿还是消费陷阱？',
  '社交媒体让我们更孤独了吗？',
  '天赋和努力哪个更重要？',
  '内卷是个人选择还是系统困境？',
  '躺平是消极还是清醒？',
  '应不应该支持全民基本收入（UBI）？',
  '死刑应当被废除吗？',
  '克隆技术应该被允许吗？',
  '人类应该殖民火星吗？',
  '动物实验应不应该被禁止？',
  '电动汽车真的比燃油车更环保吗？',
  '素食主义是道德义务还是个人选择？',
  '远程办公会成为未来主流吗？',
  '加密货币是未来货币还是庞氏骗局？',
  '元宇宙是下一代互联网还是泡沫？',
  '碎片化阅读正在摧毁深度思考吗？',
  '知识付费是智商税还是投资？',
  '人工智能创作的作品有版权吗？',
];

/**
 * 辩论管理 tRPC 路由（Admin 端）
 */
export const debatesRouter = createDebatesRouter();

function createDebatesRouter() {
  return {
    /** 辩论列表 */
    getMany: protectedProcedure
      .input(
        z
          .object({
            page: z.number().int().positive().optional(),
            pageSize: z.number().int().positive().optional(),
            search: z.string().optional(),
            status: z.string().optional(),
            type: z.string().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 10;
        const skip = (page - 1) * pageSize;

        const where: any = {};
        if (input?.search) {
          where.OR = [{ topic: { contains: input.search, mode: 'insensitive' } }];
        }
        if (input?.status) where.status = input.status;
        if (input?.type) where.type = input.type;

        const [data, total] = await Promise.all([
          ctx.prisma.debate.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
              characters: {
                include: { character: { select: { id: true, name: true, avatar: true } } },
              },
              user: { select: { id: true, nickname: true, email: true } },
            },
          }),
          ctx.prisma.debate.count({ where }),
        ]);

        return { items: data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }),

    /** 辩论详情 */
    getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
      return ctx.prisma.debate.findUnique({
        where: { id: input.id },
        include: {
          characters: {
            include: { character: { select: { id: true, name: true, avatar: true } } },
          },
        },
      });
    }),

    /** 触发随机圆桌（随机场） */
    triggerCourt: protectedProcedure
      .input(z.object({ topic: z.string().optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        const topic =
          input?.topic?.trim() || COURT_TOPICS[Math.floor(Math.random() * COURT_TOPICS.length)];

        const allChars = await ctx.prisma.character.findMany({ where: { isActive: true } });
        const shuffled = [...allChars].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 3);

        if (selected.length < 2) throw new Error('角色不足，至少需要2位');

        const debate = await ctx.prisma.debate.create({
          data: { type: 'COURT', topic, status: 'PENDING' },
        });

        await ctx.prisma.debateCharacter.createMany({
          data: selected.map((c: any, i: number) => ({
            debateId: debate.id,
            characterId: c.id,
            role: ['attacker', 'defender', 'deconstructor'][i % 3],
          })),
        });

        // Fire-and-forget：后台生成辩论内容
        const debatesService = ctx.app.get(DebatesService) as DebatesService;
        const characterIds = selected.map((c: any) => c.id);
        debatesService.generateDebate(debate.id, topic, characterIds).catch(() => {});

        return {
          id: debate.id,
          topic,
          characters: selected.map((c: any) => ({ id: c.id, name: c.name, era: c.era })),
        };
      }),

    /** 触发音频生成 */
    generateAudio: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const debate = await ctx.prisma.debate.findUnique({ where: { id: input.id } });
        if (!debate) throw new Error('辩论不存在');
        if (debate.status !== 'CONCLUDED') throw new Error('辩论尚未完成');
        if (debate.audioStatus === 'generating') {
          return { status: 'generating', message: '音频正在生成中' };
        }
        if (debate.audioStatus === 'ready') {
          return { status: 'ready', message: '音频已就绪' };
        }

        // Fire-and-forget：后台生成
        const audioService = ctx.app.get(DebateAudioService) as DebateAudioService;
        audioService.generateAudioForDebate(input.id).catch(() => {});
        return { status: 'generating', message: '音频生成已开始' };
      }),

    /** 查询音频生成进度 */
    audioStatus: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const [debate, total, ready] = await Promise.all([
          ctx.prisma.debate.findUnique({ where: { id: input.id }, select: { audioStatus: true } }),
          ctx.prisma.debateAudio.count({ where: { debateId: input.id } }),
          ctx.prisma.debateAudio.count({ where: { debateId: input.id, status: 'READY' } }),
        ]);
        return { total, ready, status: debate?.audioStatus || null };
      }),

    /** 获取合并音频下载链接 */
    downloadAudio: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const debate = await ctx.prisma.debate.findUnique({
          where: { id: input.id },
          select: {
            mergedAudioUrl: true,
            mergedAudioDuration: true,
            topic: true,
          },
        });
        if (!debate) throw new Error('辩论不存在');
        if (!debate.mergedAudioUrl) throw new Error('合并音频尚未生成');

        const fileStorage = ctx.app.get(FileStorageService) as FileStorageService;
        const signedUrl = await fileStorage.getSignedUrl(debate.mergedAudioUrl, 300);
        const filename = `论衡-${debate.topic.substring(0, 20).replace(/[^a-zA-Z0-9一-鿿]/g, '_')}.mp3`;

        return { url: signedUrl, filename, duration: debate.mergedAudioDuration };
      }),
  };
}
