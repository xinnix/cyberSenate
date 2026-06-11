import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DebatesService } from '../services/debates.service';
import { DebateAudioService } from '../services/debate-audio.service';
import { FileStorageService } from '../../../shared/services/file-storage.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDebateSchema } from '@opencode/shared';

@Controller('debates')
export class DebatesController {
  constructor(
    private debatesService: DebatesService,
    private debateAudioService: DebateAudioService,
    private fileStorage: FileStorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * POST /api/debates/court-trigger — 创建随机辩论（赛博圆桌·随机场），返回 ID，通过 SSE 获取流式内容
   */
  @Post('court-trigger')
  async courtTrigger(@Body() body: { topic?: string }) {
    const topics = [
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
    const topic = body?.topic?.trim() || topics[Math.floor(Math.random() * topics.length)];

    const allChars = await this.prisma.character.findMany({ where: { isActive: true } });

    // 随机选 3 位角色（Fisher-Yates shuffle）
    const shuffled = [...allChars].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    const characterIds = selected.map((c: any) => c.id);

    if (characterIds.length < 2) {
      throw new HttpException('角色不足，至少需要2位', HttpStatus.BAD_REQUEST);
    }

    const debate = await this.prisma.debate.create({
      data: { type: 'COURT', topic, status: 'PENDING' },
    });

    // 创建关联
    await this.prisma.debateCharacter.createMany({
      data: characterIds.map((cid: string, i: number) => ({
        debateId: debate.id,
        characterId: cid,
        role: ['attacker', 'defender', 'deconstructor'][i % 3],
      })),
    });

    return {
      id: debate.id,
      topic,
      characters: selected.map((c: any) => ({ id: c.id, name: c.name, era: c.era })),
    };
  }

  /**
   * GET /api/debates/:id/stream — SSE 流式获取辩论生成过程
   */
  @Get(':id/stream')
  async stream(@Param('id') id: string, @Res() res: Response) {
    const debate = await this.prisma.debate.findUnique({ where: { id } });
    if (!debate) {
      throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    }

    // 如果已完成，直接返回全部数据
    if (debate.status === 'CONCLUDED') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(
        `data: ${JSON.stringify({ type: 'done', debate: { ...debate, rounds: debate.rounds, conclusion: debate.conclusion } })}\n\n`,
      );
      res.end();
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.debatesService.generateDebateStream(id, debate.topic, sendEvent);
      sendEvent({ type: 'done' });
    } catch (err: any) {
      sendEvent({ type: 'error', message: err.message || '生成失败' });
    }
    res.end();
  }

  /**
   * POST /api/debates — 创建辩论（赛博圆桌·问策场）
   */
  @Post()
  async create(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const parsed = CreateDebateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        { message: '参数验证失败', errors: parsed.error.flatten() },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { type, topic, characterIds } = parsed.data;
    const userId = (req as any).user?.id ?? null;

    const debate = await this.prisma.debate.create({
      data: { type, topic, status: 'PENDING', userId: type === 'CONSULTATION' ? userId : null },
    });

    // 创建角色关联（generateDebateStream 依赖此关联获取角色）
    const roles = ['attacker', 'defender', 'deconstructor'];
    await this.prisma.debateCharacter.createMany({
      data: characterIds.map((cid, i) => ({
        debateId: debate.id,
        characterId: cid,
        role: roles[i % roles.length],
      })),
    });

    // 返回 ID，前端通过 SSE 获取流式生成内容
    return res.status(HttpStatus.CREATED).json({ id: debate.id, topic, status: 'PENDING' });
  }

  /**
   * GET /api/debates — 随机场列表（公开）
   */
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
  ) {
    return this.debatesService.findPublic(parseInt(page ?? '1'), parseInt(pageSize ?? '10'));
  }

  /**
   * GET /api/debates/characters — 活跃角色列表
   */
  @Get('characters')
  async characters() {
    return this.prisma.character.findMany({
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
      },
    });
  }

  /**
   * GET /api/debates/mine — 我的辩论列表
   */
  @Get('mine')
  async mine(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) throw new HttpException('未登录', HttpStatus.UNAUTHORIZED);
    return this.debatesService.findByUserId(
      userId,
      parseInt(page ?? '1'),
      parseInt(pageSize ?? '10'),
    );
  }

  /**
   * GET /api/debates/:id/audio-status — 音频生成进度
   */
  @Get(':id/audio-status')
  async audioStatus(@Param('id') id: string) {
    const debate = await this.prisma.debate.findUnique({ where: { id } });
    if (!debate) throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    return this.debateAudioService.getAudioStatus(id);
  }

  /**
   * GET /api/debates/:id/audio — 获取音频轨道列表（含合并音频信息）
   */
  @Get(':id/audio')
  async audioTracks(@Param('id') id: string) {
    const debate = await this.prisma.debate.findUnique({ where: { id } });
    if (!debate) throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    return this.debateAudioService.getAudioTracks(id);
  }

  /**
   * GET /api/debates/:id/download-audio — 下载合并后的 MP3
   */
  @Get(':id/download-audio')
  async downloadAudio(@Param('id') id: string, @Res() res: Response) {
    const debate = await this.prisma.debate.findUnique({ where: { id } });
    if (!debate) throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    if (!debate.mergedAudioUrl) {
      throw new HttpException('合并音频尚未生成', HttpStatus.BAD_REQUEST);
    }

    const signedUrl = await this.fileStorage.getSignedUrl(debate.mergedAudioUrl, 300);
    const filename = `赛博圆桌-${debate.topic.substring(0, 20).replace(/[^a-zA-Z0-9一-鿿]/g, '_')}.mp3`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.redirect(signedUrl);
  }

  /**
   * POST /api/debates/:id/generate-audio — 手动触发音频生成
   */
  @Post(':id/generate-audio')
  async generateAudio(@Param('id') id: string) {
    const debate = await this.prisma.debate.findUnique({ where: { id } });
    if (!debate) throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    if (debate.status !== 'CONCLUDED') {
      throw new HttpException('辩论尚未完成', HttpStatus.BAD_REQUEST);
    }
    if (debate.audioStatus === 'ready') {
      return { status: 'ready', message: '音频已就绪' };
    }

    // Fire-and-forget：后台生成
    this.debateAudioService.generateAudioForDebate(id).catch(() => {});
    return { status: 'generating', message: '音频生成已开始' };
  }

  /**
   * GET /api/debates/:id — 辩论详情
   */
  @Get(':id')
  async detail(@Param('id') id: string) {
    const debate = await this.debatesService.findById(id);
    if (!debate) throw new HttpException('辩论不存在', HttpStatus.NOT_FOUND);
    return debate;
  }
}
