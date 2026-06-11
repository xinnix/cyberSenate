import { Module } from '@nestjs/common';
import { DebatesService } from './services/debates.service';
import { DailyCourtService } from './services/daily-court.service';
import { LlmService } from './services/llm.service';
import { TtsService } from './services/tts.service';
import { DebateAudioService } from './services/debate-audio.service';
import { DebatesController } from './rest/debates.controller';
import { FileStorageService } from '../../shared/services/file-storage.service';

@Module({
  controllers: [DebatesController],
  providers: [
    DebatesService,
    DailyCourtService,
    LlmService,
    TtsService,
    DebateAudioService,
    FileStorageService,
  ],
  exports: [DebatesService, DailyCourtService, LlmService, TtsService, DebateAudioService],
})
export class DebatesModule {}
