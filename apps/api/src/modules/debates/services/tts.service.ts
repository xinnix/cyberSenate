import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// ============================================
// 语音配置 — MiniMax 音色
// ============================================

interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  locale: string;
}

const VOICE_MAP: Record<string, VoiceProfile> = {
  moderator: {
    id: 'female-chengshu',
    name: '成熟女性',
    gender: 'Female',
    locale: 'zh-CN',
  },
  attacker: {
    id: 'male-qn-badao',
    name: '霸道青年',
    gender: 'Male',
    locale: 'zh-CN',
  },
  defender: {
    id: 'presenter_male',
    name: '男性主持人',
    gender: 'Male',
    locale: 'zh-CN',
  },
  deconstructor: {
    id: 'male-qn-jingying',
    name: '精英青年',
    gender: 'Male',
    locale: 'zh-CN',
  },
};

const MINIMAX_API_URL = 'https://api.minimaxi.com/v1/t2a_v2';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('MINIMAX_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('MINIMAX_API_KEY 未设置，MiniMax TTS 将不可用');
    } else {
      this.logger.log(`MiniMax TTS initialized (key: ${this.apiKey.substring(0, 8)}...)`);
    }
  }

  /**
   * 根据角色类别返回语音配置
   */
  getVoiceForRole(role: string): VoiceProfile {
    return VOICE_MAP[role] || VOICE_MAP['moderator'];
  }

  /**
   * 获取所有可用语音
   */
  getAvailableVoices(): VoiceProfile[] {
    return Object.entries(VOICE_MAP).map(([, v]) => ({
      ...v,
      name: `${v.name}`,
    }));
  }

  /**
   * 语音合成：文本 → MP3 Buffer
   * MiniMax 支持单次 10000 字符，无需分段
   */
  async synthesize(
    text: string,
    voiceId: string,
    _options?: { rate?: string; pitch?: string },
  ): Promise<{ buffer: Buffer; duration: number }> {
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY 未配置');
    }

    const startTime = Date.now();

    try {
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: 'speech-2.8-turbo',
          text,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
            emotion: 'neutral',
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1,
          },
          // 返回 hex 编码，默认选项
          // output: 'hex',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      // 检查响应
      const baseResp = response.data?.base_resp;
      if (baseResp?.status_code !== 0) {
        throw new Error(
          `MiniMax API error: ${baseResp?.status_msg || 'unknown'} (code: ${baseResp?.status_code})`,
        );
      }

      // 从 hex 解码音频
      const audioHex: string = response.data?.data?.audio;
      if (!audioHex) {
        throw new Error('MiniMax response missing audio data');
      }

      const buffer = Buffer.from(audioHex, 'hex');
      const duration = (response.data?.extra_info?.audio_length || 0) / 1000;
      const calcDuration = duration > 0 ? duration : (Date.now() - startTime) / 1000;

      this.logger.debug(
        `TTS: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}" → ${buffer.length} bytes, ${calcDuration.toFixed(1)}s`,
      );
      return { buffer, duration: calcDuration };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`TTS failed for "${text.substring(0, 30)}...": ${msg}`);
      throw err;
    }
  }
}
