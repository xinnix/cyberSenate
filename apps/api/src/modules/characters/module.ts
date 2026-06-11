import { Module } from '@nestjs/common';
import { CharactersService } from './services/characters.service';

@Module({
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
