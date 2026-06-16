import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TtsService } from './tts.service';
import { FileStorageService, UploadedFile } from '../../../shared/services/file-storage.service';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// ============================================
// 辅助类型
// ============================================

interface AudioSegment {
  roundNumber: number;
  segmentType: 'moderator_opening' | 'speech' | 'conclusion' | 'moderator_closing';
  characterId?: string;
  characterName?: string;
  text: string;
  role: string; // attacker / defender / deconstructor / moderator
  sortOrder: number;
}

interface ChapterMeta {
  offset: number;
  type: string;
  speaker: string;
  roundNumber?: number;
  characterId?: string;
}

@Injectable()
export class DebateAudioService {
  private readonly logger = new Logger(DebateAudioService.name);

  constructor(
    private prisma: PrismaService,
    private ttsService: TtsService,
    private fileStorage: FileStorageService,
  ) {}

  // ── URL 规范化 ──────────────────────────────────────────────
  // 入库只存相对路径（/debate-audio/xxx.mp3），与环境解耦；
  // 出口再按当前环境拼成完整 URL，避免把 host 写死进数据库。

  /** 取 URL 的 pathname 作为稳定的相对引用（兼容已带 host 的存量数据） */
  private pathnameOf(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  /** 出口：拼上面向浏览器的 SERVER_URL（旧 localhost 数据也被归一化） */
  private toPublicUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const base = (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}${this.pathnameOf(url)}`;
  }

  /** 合并片段下载用：拼容器内回环地址（后台任务 fetch 自己的静态服务） */
  private toInternalUrl(url: string): string {
    const base = `http://localhost:${process.env.PORT || 3000}`.replace(/\/$/, '');
    return `${base}${this.pathnameOf(url)}`;
  }

  /**
   * 为整场辩论生成全部音频（后台调用）
   */
  async generateAudioForDebate(debateId: string): Promise<void> {
    this.logger.log(`Starting audio generation for debate ${debateId}`);

    const debate = await this.prisma.debate.findUnique({
      where: { id: debateId },
    });

    if (!debate || debate.status !== 'CONCLUDED') {
      throw new Error(`Debate ${debateId} is not concluded yet`);
    }

    // 处理僵尸/重试状态
    if (debate.audioStatus === 'generating') {
      const readyTracks = await this.prisma.debateAudio.count({
        where: { debateId, status: 'READY' },
      });
      const failedTracks = await this.prisma.debateAudio.count({
        where: { debateId, status: 'FAILED' },
      });
      const pendingTracks = await this.prisma.debateAudio.count({
        where: { debateId, status: 'PENDING' },
      });

      const activeTracks = await this.prisma.debateAudio.count({
        where: { debateId, status: 'GENERATING' },
      });
      if (activeTracks > 0 && pendingTracks === 0 && failedTracks === 0) {
        this.logger.warn(`Audio generation already in progress for ${debateId}`);
        return;
      }

      this.logger.warn(
        `Found ${failedTracks} failed + ${pendingTracks} pending + ${readyTracks} ready for ${debateId}, resuming`,
      );
      await this.prisma.debateAudio.deleteMany({
        where: { debateId, status: { in: ['FAILED', 'GENERATING'] } },
      });
      if (pendingTracks > 0) {
        await this.prisma.debateAudio.deleteMany({
          where: { debateId, status: 'PENDING' },
        });
      }
    }

    // 获取角色-类别映射
    const debateChars = await this.prisma.debateCharacter.findMany({
      where: { debateId },
      include: { character: true },
    });
    const roleMap = new Map<string, string>();
    for (const dc of debateChars) {
      roleMap.set(dc.character.name, dc.role || 'deconstructor');
    }

    // 更新状态为生成中
    await this.prisma.debate.update({
      where: { id: debateId },
      data: { audioStatus: 'generating' },
    });

    try {
      // 解析所有音频片段
      const segments = this.parseSegments(debate as any, roleMap);
      this.logger.log(`Parsed ${segments.length} audio segments`);

      // 清除旧的音频记录（重新生成）
      const existingTracks = await this.prisma.debateAudio.count({
        where: { debateId },
      });
      if (existingTracks > 0) {
        await this.prisma.debateAudio.deleteMany({ where: { debateId } });
      }

      // 创建 DebateAudio 记录
      for (const seg of segments) {
        const voice = this.ttsService.getVoiceForRole(seg.role);
        await this.prisma.debateAudio.create({
          data: {
            debateId,
            roundNumber: seg.roundNumber,
            segmentType: seg.segmentType,
            characterId: seg.characterId,
            characterName: seg.characterName,
            voiceId: voice.id,
            textContent: seg.text,
            sortOrder: seg.sortOrder,
            status: 'PENDING',
          },
        });
      }

      // 并发批量生成音频（每批 3 个）
      const BATCH_SIZE = 3;
      const tracks = await this.prisma.debateAudio.findMany({
        where: { debateId },
        orderBy: [{ roundNumber: 'asc' }, { sortOrder: 'asc' }],
      });

      for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((track) => this.synthesizeTrack(track)));
      }

      // 全部完成，判断是否全部失败
      const successCount = await this.prisma.debateAudio.count({
        where: { debateId, status: 'READY' },
      });

      if (successCount > 0) {
        // 合并所有音频片段为一个 MP3
        await this.concatenateAudio(debateId);
      }

      const finalStatus = successCount > 0 ? 'ready' : 'failed';
      await this.prisma.debate.update({
        where: { id: debateId },
        data: { audioStatus: finalStatus },
      });

      this.logger.log(
        `Audio generation completed for debate ${debateId}: ${successCount}/${tracks.length} tracks ready`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';
      const successCount = await this.prisma.debateAudio.count({
        where: { debateId, status: 'READY' },
      });
      const finalStatus = successCount > 0 ? 'ready' : 'failed';
      await this.prisma.debate.update({
        where: { id: debateId },
        data: { audioStatus: finalStatus },
      });
      if (finalStatus === 'ready') {
        this.logger.warn(
          `Audio generation partially failed for ${debateId}: ${msg}. ${successCount} tracks available.`,
        );
      } else {
        this.logger.error(`Audio generation failed for ${debateId}: ${msg}`, stack);
        throw error;
      }
    }
  }

  /**
   * 获取辩论的所有音频轨道
   */
  async getAudioTracks(debateId: string) {
    const debate = await this.prisma.debate.findUnique({
      where: { id: debateId },
      select: {
        audioStatus: true,
        mergedAudioUrl: true,
        mergedAudioDuration: true,
        chapterMetadata: true,
      },
    });

    const tracks = await this.prisma.debateAudio.findMany({
      where: { debateId, status: 'READY' },
      orderBy: [{ roundNumber: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        roundNumber: true,
        segmentType: true,
        characterName: true,
        audioUrl: true,
        audioDuration: true,
        status: true,
      },
    });

    return {
      audioStatus: debate?.audioStatus,
      mergedAudioUrl: this.toPublicUrl(debate?.mergedAudioUrl),
      mergedAudioDuration: debate?.mergedAudioDuration,
      chapterMetadata: debate?.chapterMetadata,
      tracks: tracks.map((t) => ({ ...t, audioUrl: this.toPublicUrl(t.audioUrl) })),
    };
  }

  /**
   * 获取音频生成进度
   */
  async getAudioStatus(debateId: string) {
    const [debate, total, ready] = await Promise.all([
      this.prisma.debate.findUnique({ where: { id: debateId }, select: { audioStatus: true } }),
      this.prisma.debateAudio.count({ where: { debateId } }),
      this.prisma.debateAudio.count({ where: { debateId, status: 'READY' } }),
    ]);

    return {
      total,
      ready,
      status: debate?.audioStatus || null,
    };
  }

  /**
   * 解析辩论文本为音频片段列表
   * 新结构: moderator_opening → 3轮×speech → conclusion → moderator_closing
   */
  private parseSegments(
    debate: {
      rounds: Array<{
        roundNumber: number;
        title: string;
        speeches: Array<{ characterId: string; characterName: string; content: string }>;
      }> | null;
      conclusion: { decisionModel?: string } | null;
      moderatorOpening: { content: string } | null;
      moderatorClosing: { content: string } | null;
    },
    roleMap: Map<string, string>,
  ): AudioSegment[] {
    const segments: AudioSegment[] = [];
    let sortOrder = 0;

    // 1. 全局主持人开场
    if (debate.moderatorOpening?.content) {
      segments.push({
        roundNumber: 0,
        segmentType: 'moderator_opening',
        characterName: '主持人',
        text: debate.moderatorOpening.content,
        role: 'moderator',
        sortOrder: sortOrder++,
      });
    }

    // 2. 三轮角色发言
    if (debate.rounds) {
      for (const round of debate.rounds) {
        for (const speech of round.speeches) {
          segments.push({
            roundNumber: round.roundNumber,
            segmentType: 'speech',
            characterId: speech.characterId,
            characterName: speech.characterName,
            text: speech.content,
            role: roleMap.get(speech.characterName) || 'deconstructor',
            sortOrder: sortOrder++,
          });
        }
      }
    }

    // 3. 结案锦囊
    if (debate.conclusion?.decisionModel) {
      segments.push({
        roundNumber: 0,
        segmentType: 'conclusion',
        characterName: '主持人',
        text: debate.conclusion.decisionModel,
        role: 'moderator',
        sortOrder: sortOrder++,
      });
    }

    // 4. 全局主持人结语
    if (debate.moderatorClosing?.content) {
      segments.push({
        roundNumber: 0,
        segmentType: 'moderator_closing',
        characterName: '主持人',
        text: debate.moderatorClosing.content,
        role: 'moderator',
        sortOrder: sortOrder++,
      });
    }

    return segments;
  }

  /**
   * 合并所有音频片段为一个 MP3 文件
   * 使用 ffmpeg concat demuxer 进行无损合并
   */
  private async concatenateAudio(debateId: string): Promise<void> {
    this.logger.log(`Starting audio concatenation for debate ${debateId}`);

    const tracks = await this.prisma.debateAudio.findMany({
      where: { debateId, status: 'READY', audioUrl: { not: null } },
      orderBy: { sortOrder: 'asc' },
    });

    if (tracks.length === 0) {
      this.logger.warn(`No ready tracks to concatenate for ${debateId}`);
      return;
    }

    // 构建章节元数据
    let offset = 0;
    const chapters: ChapterMeta[] = tracks.map((track) => {
      const chapter: ChapterMeta = {
        offset: Math.round(offset * 100) / 100,
        type: track.segmentType,
        speaker: track.characterName || '主持人',
      };
      if (track.roundNumber > 0) {
        chapter.roundNumber = track.roundNumber;
      }
      if (track.characterId) {
        chapter.characterId = track.characterId;
      }
      offset += track.audioDuration || 0;
      return chapter;
    });

    const totalDuration = offset;

    // 下载各片段到临时文件并合并
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'debate-audio-'));
    try {
      // 下载所有片段到临时目录
      const tmpFiles: string[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (!track.audioUrl) continue;

        const tmpFile = path.join(tmpDir, `segment_${String(i).padStart(3, '0')}.mp3`);
        await this.downloadToFile(this.toInternalUrl(track.audioUrl), tmpFile);
        tmpFiles.push(tmpFile);
      }

      if (tmpFiles.length === 0) {
        this.logger.warn(`No audio files downloaded for ${debateId}`);
        return;
      }

      // 创建 concat list 文件
      const listFile = path.join(tmpDir, 'concat.txt');
      const listContent = tmpFiles.map((f) => `file '${f}'`).join('\n');
      await fs.writeFile(listFile, listContent);

      // 用 ffmpeg 合并
      const outputFile = path.join(tmpDir, 'merged.mp3');
      await this.runFfmpegConcat(listFile, outputFile);

      // 读取合并后的文件
      const mergedBuffer = await fs.readFile(outputFile);

      // 上传到存储
      const file: UploadedFile = {
        fieldname: 'audio',
        originalname: `debate-${debateId}-full.mp3`,
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: mergedBuffer.length,
        buffer: mergedBuffer,
      };
      const result = await this.fileStorage.upload(file, 'debate-audio');

      // 更新 Debate 记录（入库相对路径，出口再拼完整 URL）
      await this.prisma.debate.update({
        where: { id: debateId },
        data: {
          mergedAudioUrl: this.pathnameOf(result.url),
          mergedAudioDuration: totalDuration,
          chapterMetadata: chapters as any,
        },
      });

      this.logger.log(
        `Audio concatenation completed for ${debateId}: ${tracks.length} tracks, ${totalDuration.toFixed(1)}s total, ${(mergedBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      );
    } catch (error) {
      this.logger.error(
        `Audio concatenation failed for ${debateId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // 非致命：独立轨道仍然可用
    } finally {
      // 清理临时文件
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // 忽略清理失败
      }
    }
  }

  /**
   * 下载音频文件到本地临时文件
   */
  private async downloadToFile(url: string, filePath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
  }

  /**
   * 使用 ffmpeg concat demuxer 合并 MP3 文件（无损，不重新编码）
   */
  private runFfmpegConcat(inputList: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputList)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputFile)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  /**
   * 为单个轨道生成 TTS 并上传
   */
  private async synthesizeTrack(track: { id: string; voiceId: string; textContent: string }) {
    try {
      await this.prisma.debateAudio.update({
        where: { id: track.id },
        data: { status: 'GENERATING' },
      });

      const { buffer, duration } = await this.ttsService.synthesize(
        track.textContent,
        track.voiceId,
      );

      // 上传到 OSS / 本地存储
      const file: UploadedFile = {
        fieldname: 'audio',
        originalname: `${track.id}.mp3`,
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: buffer.length,
        buffer,
      };
      const result = await this.fileStorage.upload(file, `debate-audio`);

      await this.prisma.debateAudio.update({
        where: { id: track.id },
        data: {
          audioUrl: this.pathnameOf(result.url),
          audioDuration: duration,
          status: 'READY',
        },
      });

      this.logger.log(`Track ${track.id} ready: ${buffer.length} bytes, ${duration.toFixed(1)}s`);
    } catch (error: unknown) {
      if (error instanceof Error && error.constructor?.name === 'PrismaClientKnownRequestError') {
        const prismaErr = error as { code?: string };
        if (prismaErr.code === 'P2025') {
          this.logger.warn(`Track ${track.id} was already deleted (race condition)`);
          return;
        }
      }
      try {
        await this.prisma.debateAudio.update({
          where: { id: track.id },
          data: { status: 'FAILED' },
        });
      } catch {
        // 记录已被删除，忽略
      }
      this.logger.error(
        `Track ${track.id} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
