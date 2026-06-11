import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CharactersService extends BaseService<'character'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'character');
  }

  async findActive() {
    return this.model.findMany({
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
  }

  async findBySlugs(slugs: string[]) {
    return this.model.findMany({
      where: { slug: { in: slugs }, isActive: true },
    });
  }
}
