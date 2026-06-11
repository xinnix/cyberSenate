import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { DebatesService } from './debates.service';

@Injectable()
export class DailyCourtService {
  private readonly logger = new Logger(DailyCourtService.name);

  /** 每日生成时间（北京时间） */
  private readonly DAILY_HOUR = 8;
  private readonly DAILY_MINUTE = 0;

  /** 朝议话题库（与 court-trigger 同步） */
  private readonly TOPICS = [
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

  constructor(
    private prisma: PrismaService,
    private debatesService: DebatesService,
  ) {}

  // ============================================
  // Cron: 每日 08:00 自动生成朝议
  // ============================================

  /**
   * 每日北京时间 08:00 触发，检查今日是否已有朝议，
   * 若无则自动创建并启动 AI 辩论生成。
   */
  @Cron('0 8 * * *', { name: 'daily-court', timeZone: 'Asia/Shanghai' })
  async triggerDailyCourt() {
    this.logger.log('⏰ 每日朝议定时触发...');

    const status = await this.getDailyStatus();
    if (status.todayExists) {
      this.logger.log('今日朝议已存在，跳过生成');
      return;
    }

    try {
      const topic = this.TOPICS[Math.floor(Math.random() * this.TOPICS.length)];

      const allChars = await this.prisma.character.findMany({
        where: { isActive: true },
      });

      if (allChars.length < 2) {
        this.logger.error('活跃角色不足（至少需要 2 位），无法生成朝议');
        return;
      }

      // Fisher-Yates 随机选 3 位角色
      const shuffled = [...allChars].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      const characterIds = selected.map((c: any) => c.id);

      // 创建辩论记录
      const debate = await this.prisma.debate.create({
        data: { type: 'COURT', topic, status: 'PENDING' },
      });

      // 创建角色关联
      await this.prisma.debateCharacter.createMany({
        data: characterIds.map((cid: string, i: number) => ({
          debateId: debate.id,
          characterId: cid,
          role: ['attacker', 'defender', 'deconstructor'][i % 3],
        })),
      });

      this.logger.log(`✅ 朝议已创建: ${debate.id} — "${topic}"`);

      // Fire-and-forget: 后台调用 DeepSeek 生成辩论内容
      this.debatesService
        .generateDebate(debate.id, topic, characterIds)
        .then(() => this.logger.log(`🎉 朝议生成完成: ${debate.id}`))
        .catch((err: Error) => this.logger.error(`❌ 朝议生成失败: ${debate.id}`, err.message));
    } catch (err) {
      this.logger.error('❌ 每日朝议触发失败', err);
    }
  }

  // ============================================
  // Public: 前端获取今日状态
  // ============================================

  /**
   * 返回今日朝议状态，供前端倒计时 / 状态展示使用。
   */
  async getDailyStatus() {
    const { todayStart, tomorrowStart } = this.getTodayRange();

    const todayDebate = await this.prisma.debate.findFirst({
      where: {
        type: 'COURT',
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
      include: {
        characters: {
          include: {
            character: {
              select: { id: true, name: true, avatar: true, era: true, mbti: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const nextGenAt = this.getNextGenerationTime();

    return {
      todayExists: !!todayDebate,
      todayDebate,
      nextGenerationAt: nextGenAt.toISOString(),
      countdownSeconds: Math.max(0, Math.floor((nextGenAt.getTime() - Date.now()) / 1000)),
      status: todayDebate?.status ?? null,
    };
  }

  // ============================================
  // Private: 时区辅助
  // ============================================

  /** 获取北京时间今天的起止范围 [todayStart, tomorrowStart) */
  private getTodayRange(): { todayStart: Date; tomorrowStart: Date } {
    const now = Date.now();
    const offset = 8 * 60 * 60 * 1000; // UTC+8
    const localMs = now + offset;
    const localDate = new Date(localMs);
    localDate.setUTCHours(0, 0, 0, 0);

    const todayStart = new Date(localDate.getTime() - offset);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return { todayStart, tomorrowStart };
  }

  /** 计算下次朝议生成时间（北京时间 08:00） */
  private getNextGenerationTime(): Date {
    const now = Date.now();
    const offset = 8 * 60 * 60 * 1000;
    const localMs = now + offset;
    const localDate = new Date(localMs);
    localDate.setUTCHours(this.DAILY_HOUR, this.DAILY_MINUTE, 0, 0);

    let nextLocal = localDate.getTime();
    if (nextLocal <= localMs) {
      nextLocal += 24 * 60 * 60 * 1000; // 如果今天已过点，推到明天
    }

    return new Date(nextLocal - offset);
  }
}
