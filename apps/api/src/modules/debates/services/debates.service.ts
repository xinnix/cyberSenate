import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmService, LLMMessage } from './llm.service';
import { BusinessException, ErrorCodes } from '../../../core/exceptions';

// ============================================
// Type Definitions
// ============================================

interface CharacterPersona {
  id: string;
  name: string;
  era: string;
  mbti: string;
  coreStance: string;
  speakingStyle: string;
  expertise: string;
  systemPrompt: string;
}

interface RoundSpeech {
  characterId: string;
  characterName: string;
  content: string;
  dynamicRole?: 'agitator' | 'victim' | 'wildcard';
}

interface DebateRound {
  roundNumber: number;
  title: string;
  speeches: RoundSpeech[];
}

interface StanceRage {
  stance: number;
  rage: number;
}

interface TopologyNode {
  id: string;
  name: string;
  mbti: string;
  weapon: string;
  thesis: string;
  color: string;
  x: number;
  y: number;
}

interface TopologyEdge {
  source: string;
  target: string;
  type: 'clash' | 'exploit' | 'deconstruct';
  label: string;
}

interface ConflictTopology {
  quadrants: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

interface DebateConclusion {
  topic: string;
  characterSignatures: string[];
  coreConflict: string;
  goldenQuotes: string[];
  decisionModel: string;
  conflictTopology?: ConflictTopology;
}

@Injectable()
export class DebatesService {
  private readonly logger = new Logger(DebatesService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
  ) {}

  // ============================================
  // Main: Non-streaming generation (admin tRPC)
  // ============================================

  async generateDebate(debateId: string, topic: string, characterIds: string[]) {
    const characters = await this.prisma.character.findMany({
      where: { id: { in: characterIds }, isActive: true },
    });

    if (characters.length < 2) {
      throw new BusinessException({
        errorCode: ErrorCodes.DEBATE_GENERATION_FAILED,
        message: '至少需要2位活跃角色',
      });
    }

    const personas: CharacterPersona[] = characters.map((c: any) => ({
      id: c.id,
      name: c.name,
      era: c.era,
      mbti: c.mbti,
      coreStance: c.coreStance,
      speakingStyle: c.speakingStyle,
      expertise: c.expertise,
      systemPrompt: c.systemPrompt,
    }));

    await this.prisma.debate.update({
      where: { id: debateId },
      data: { status: 'GENERATING' },
    });

    try {
      const assignedPersonas = this.assignRoles(personas);

      await this.prisma.debateCharacter.createMany({
        data: assignedPersonas.map((p) => ({
          debateId,
          characterId: p.id,
          role: p.assignedRole,
        })),
      });

      // 主持人开场
      const moderatorOpening = await this.generateModeratorOpening(topic, assignedPersonas);

      // Round 1: 立论 + stance/rage
      const { round: round1, stanceRageMap } = await this.executeRound1(topic, assignedPersonas);

      // Round 2: 乱战（动态极化矩阵，绕过主持人）
      const round2 = await this.executeRound2(topic, assignedPersonas, round1, stanceRageMap);

      // Round 3: 收束
      const round3 = await this.executeRound3(topic, assignedPersonas, [round1, round2]);

      const rounds = [round1, round2, round3];

      // 结案锦囊（含 conflictTopology）
      const conclusion = await this.generateConclusion(topic, assignedPersonas, rounds);

      // 主持人结语
      const moderatorClosing = await this.generateModeratorClosing(topic, conclusion);

      await this.prisma.debate.update({
        where: { id: debateId },
        data: {
          status: 'CONCLUDED',
          rounds: rounds as any,
          conclusion: conclusion as any,
          moderatorOpening: { content: moderatorOpening } as any,
          moderatorClosing: { content: moderatorClosing } as any,
        },
      });

      return { rounds, conclusion, moderatorOpening, moderatorClosing };
    } catch (error) {
      await this.prisma.debate.update({
        where: { id: debateId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  // ============================================
  // Main: Streaming generation (REST SSE)
  // ============================================

  async generateDebateStream(debateId: string, topic: string, sendEvent: (data: any) => void) {
    const debateChars = await this.prisma.debateCharacter.findMany({
      where: { debateId },
      include: { character: true },
    });

    if (debateChars.length < 2) {
      throw new Error('至少需要2位角色');
    }

    const personas: (CharacterPersona & { assignedRole: string })[] = debateChars.map((dc: any) => {
      const c = dc.character;
      return {
        id: c.id,
        name: c.name,
        era: c.era,
        mbti: c.mbti,
        coreStance: c.coreStance,
        speakingStyle: c.speakingStyle,
        expertise: c.expertise,
        systemPrompt: c.systemPrompt,
        assignedRole: dc.role || 'deconstructor',
      };
    });

    await this.prisma.debate.update({
      where: { id: debateId },
      data: { status: 'GENERATING' },
    });
    sendEvent({ type: 'status', status: 'GENERATING' });

    try {
      // 主持人开场
      const moderatorOpening = await this.generateModeratorOpening(topic, personas);
      sendEvent({ type: 'moderator_opening', content: moderatorOpening });

      // Round 1: 立论 + stance/rage 提取
      sendEvent({ type: 'round_start', roundNumber: 1, title: '拆解与立论' });
      const { round: round1, stanceRageMap } = await this.executeRound1(topic, personas, sendEvent);

      // Round 2: 乱战（动态极化矩阵，绕过主持人）
      sendEvent({ type: 'round_start', roundNumber: 2, title: '乱战' });
      const round2 = await this.executeRound2(topic, personas, round1, stanceRageMap, sendEvent);

      // Round 3: 收束
      sendEvent({ type: 'round_start', roundNumber: 3, title: '结案与收束' });
      const round3 = await this.executeRound3(topic, personas, [round1, round2], sendEvent);

      const rounds = [round1, round2, round3];

      // 结案锦囊（含 conflictTopology）
      const conclusion = await this.generateConclusion(topic, personas, rounds);
      sendEvent({ type: 'conclusion', conclusion });

      // 主持人结语
      const moderatorClosing = await this.generateModeratorClosing(topic, conclusion);
      sendEvent({ type: 'moderator_closing', content: moderatorClosing });

      // 保存
      await this.prisma.debate.update({
        where: { id: debateId },
        data: {
          status: 'CONCLUDED',
          rounds: rounds as any,
          conclusion: conclusion as any,
          moderatorOpening: { content: moderatorOpening } as any,
          moderatorClosing: { content: moderatorClosing } as any,
        },
      });

      sendEvent({ type: 'done' });
    } catch (error) {
      await this.prisma.debate.update({
        where: { id: debateId },
        data: { status: 'FAILED' },
      });
      sendEvent({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================
  // FSM: Round 1 — 立论 + stance/rage 提取
  // ============================================

  private async executeRound1(
    topic: string,
    personas: (CharacterPersona & { assignedRole: string })[],
    sendEvent?: (data: any) => void,
  ): Promise<{ round: DebateRound; stanceRageMap: Map<string, StanceRage> }> {
    const speeches: RoundSpeech[] = [];
    const stanceRageMap = new Map<string, StanceRage>();
    const ordered = this.orderByRole(personas);

    for (const persona of ordered) {
      const previousSpeeches = speeches.map((s) => `${s.characterName}：${s.content}`).join('\n');

      const messages: LLMMessage[] = [
        { role: 'system', content: persona.systemPrompt },
        { role: 'system', content: this.buildCharacterRolePrompt(persona) },
        {
          role: 'user',
          content: `当前议题：「${topic}」\n这是第一轮「拆解与立论」，请先陈述你的核心立场。\n${previousSpeeches ? `前面其他先哲已经说了：\n${previousSpeeches}\n` : ''}请用你的风格发表观点。\n\n重要：在你的发言末尾，必须另起一行，用以下格式输出你的内心评估（这段不会展示给用户）：\n[立场:X, 意愿:Y]\n其中 X ∈ [-10, 10]（负=保守，正=激进），Y ∈ [1, 10]（越大越想开炮）`,
        },
      ];

      const rawSpeech = await this.llmService.chat(messages, {
        temperature: 0.9,
        maxTokens: 600,
      });

      // 提取 stance/rage 并清理文本
      const { cleanText, stance, rage } = this.extractStanceRage(rawSpeech);
      stanceRageMap.set(persona.id, { stance, rage });

      speeches.push({
        characterId: persona.id,
        characterName: persona.name,
        content: cleanText,
      });

      sendEvent?.({
        type: 'speech',
        roundNumber: 1,
        characterId: persona.id,
        characterName: persona.name,
        content: cleanText,
      });
    }

    return {
      round: { roundNumber: 1, title: '拆解与立论', speeches },
      stanceRageMap,
    };
  }

  // ============================================
  // FSM: Round 2 — 乱战（动态极化矩阵）
  // 绕过主持人，由后端控流器根据情绪指标动态调度
  // ============================================

  private async executeRound2(
    topic: string,
    personas: (CharacterPersona & { assignedRole: string })[],
    round1: DebateRound,
    stanceRageMap: Map<string, StanceRage>,
    sendEvent?: (data: any) => void,
  ): Promise<DebateRound> {
    const speeches: RoundSpeech[] = [];

    // Round 1 上下文摘要
    const r1Context = round1.speeches
      .map((s) => `${s.characterName}：「${s.content.slice(0, 150)}」`)
      .join('\n');

    // 1. 计算极化矩阵 M_ij = |stance_i - stance_j| × rage_i
    const { agitator, victim, wildcard } = this.computeRound2Roles(personas, stanceRageMap);

    this.logger.log(
      `Round 2 动态角色：主攻手=${agitator.name}, 受害者=${victim.name}, 渔翁=${wildcard.name}`,
    );

    // Step 1：主攻手发难
    const attackSpeech = await this.llmService.chat(
      [
        { role: 'system', content: agitator.systemPrompt },
        { role: 'system', content: this.buildCharacterRolePrompt(agitator) },
        {
          role: 'user',
          content: `当前议题：「${topic}」\n现在是第二轮「乱战」。\n\n[前轮回顾]\n${r1Context}\n\n对方的立论极其幼稚，请你立刻点名对其进行迎头痛击，不要留情面。用你独特的哲学体系碾压对方。控制在200字以内。`,
        },
      ],
      { temperature: 0.95, maxTokens: 512 },
    );

    speeches.push({
      characterId: agitator.id,
      characterName: agitator.name,
      content: attackSpeech,
      dynamicRole: 'agitator',
    });
    sendEvent?.({
      type: 'speech',
      roundNumber: 2,
      characterId: agitator.id,
      characterName: agitator.name,
      content: attackSpeech,
      dynamicRole: 'agitator',
    });

    // Step 2：靶向受害者反击
    const defenseSpeech = await this.llmService.chat(
      [
        { role: 'system', content: victim.systemPrompt },
        { role: 'system', content: this.buildCharacterRolePrompt(victim) },
        {
          role: 'user',
          content: `当前议题：「${topic}」\n现在是第二轮「乱战」。\n\n[前轮回顾]\n${r1Context}\n\n[对方攻击] ${agitator.name}：「${attackSpeech}」\n\n对方刚才对你发动了猛烈攻击。请从你的哲学立场出发，进行靶向防御并予以反击。控制在200字以内。`,
        },
      ],
      { temperature: 0.9, maxTokens: 512 },
    );

    speeches.push({
      characterId: victim.id,
      characterName: victim.name,
      content: defenseSpeech,
      dynamicRole: 'victim',
    });
    sendEvent?.({
      type: 'speech',
      roundNumber: 2,
      characterId: victim.id,
      characterName: victim.name,
      content: defenseSpeech,
      dynamicRole: 'victim',
    });

    // Step 3：压轴渔翁收割
    const harvestSpeech = await this.llmService.chat(
      [
        { role: 'system', content: wildcard.systemPrompt },
        { role: 'system', content: this.buildCharacterRolePrompt(wildcard) },
        {
          role: 'user',
          content: `当前议题：「${topic}」\n现在是第二轮「乱战」。\n\n[前轮回顾]\n${r1Context}\n\n[激烈交锋]\n${agitator.name}：「${attackSpeech}」\n${victim.name}：「${defenseSpeech}」\n\n前两位已经激烈交锋。请你从更高的维度审视这场辩论，用你独特的视角进行降维收割。控制在200字以内。`,
        },
      ],
      { temperature: 0.9, maxTokens: 512 },
    );

    speeches.push({
      characterId: wildcard.id,
      characterName: wildcard.name,
      content: harvestSpeech,
      dynamicRole: 'wildcard',
    });
    sendEvent?.({
      type: 'speech',
      roundNumber: 2,
      characterId: wildcard.id,
      characterName: wildcard.name,
      content: harvestSpeech,
      dynamicRole: 'wildcard',
    });

    return { roundNumber: 2, title: '乱战', speeches };
  }

  // ============================================
  // FSM: Round 3 — 收束（带跨轮记忆）
  // ============================================

  private async executeRound3(
    topic: string,
    personas: (CharacterPersona & { assignedRole: string })[],
    previousRounds: DebateRound[],
    sendEvent?: (data: any) => void,
  ): Promise<DebateRound> {
    const speeches: RoundSpeech[] = [];
    const crossContext = this.buildCrossRoundContext(previousRounds);
    const ordered = this.orderByRole(personas);

    for (const persona of ordered) {
      const previousSpeeches = speeches.map((s) => `${s.characterName}：${s.content}`).join('\n');

      const messages: LLMMessage[] = [
        { role: 'system', content: persona.systemPrompt },
        { role: 'system', content: this.buildCharacterRolePrompt(persona) },
        {
          role: 'user',
          content: `当前议题：「${topic}」\n现在是第三轮「结案与收束」，这是最后一轮，请做最终陈述。\n\n${crossContext}\n${previousSpeeches ? `本轮前面先哲已说：\n${previousSpeeches}\n` : ''}请用你的风格发表最终观点。控制在200字以内。`,
        },
      ];

      const speech = await this.llmService.chat(messages, {
        temperature: 0.85,
        maxTokens: 512,
      });

      speeches.push({
        characterId: persona.id,
        characterName: persona.name,
        content: speech,
      });

      sendEvent?.({
        type: 'speech',
        roundNumber: 3,
        characterId: persona.id,
        characterName: persona.name,
        content: speech,
      });
    }

    return { roundNumber: 3, title: '结案与收束', speeches };
  }

  // ============================================
  // Utility: Stance/Rage 提取
  // ============================================

  private extractStanceRage(text: string): {
    cleanText: string;
    stance: number;
    rage: number;
  } {
    const regex = /\[立场:(-?\d+\.?\d*),\s*意愿:(\d+\.?\d*)\]/;
    const match = text.match(regex);

    if (match) {
      const stance = Math.max(-10, Math.min(10, parseFloat(match[1])));
      const rage = Math.max(1, Math.min(10, parseFloat(match[2])));
      const cleanText = text.replace(regex, '').trim();
      return { cleanText, stance, rage };
    }

    // Fallback: 无法提取时返回中性值
    return { cleanText: text, stance: 0, rage: 5 };
  }

  // ============================================
  // Utility: 极化矩阵计算 → Round 2 动态角色
  // ============================================

  private computeRound2Roles(
    personas: (CharacterPersona & { assignedRole: string })[],
    stanceRageMap: Map<string, StanceRage>,
  ): {
    agitator: CharacterPersona & { assignedRole: string };
    victim: CharacterPersona & { assignedRole: string };
    wildcard: CharacterPersona & { assignedRole: string };
  } {
    let maxTension = -1;
    let agitatorIdx = 0;
    let victimIdx = 1;

    // 计算 M_ij = |stance_i - stance_j| × rage_i，找最大张力对
    for (let i = 0; i < personas.length; i++) {
      for (let j = 0; j < personas.length; j++) {
        if (i === j) continue;
        const si = stanceRageMap.get(personas[i].id) || { stance: 0, rage: 5 };
        const sj = stanceRageMap.get(personas[j].id) || { stance: 0, rage: 5 };
        const tension = Math.abs(si.stance - sj.stance) * si.rage;

        if (tension > maxTension) {
          maxTension = tension;
          agitatorIdx = i;
          victimIdx = j;
        }
      }
    }

    // 渔翁 = 既不是主攻手也不是受害者的人
    const usedIndices = new Set([agitatorIdx, victimIdx]);
    const wildcardIdx =
      personas.length > 2 ? personas.findIndex((_, idx) => !usedIndices.has(idx)) : victimIdx; // 2人场景下复用受害者

    return {
      agitator: personas[agitatorIdx],
      victim: personas[victimIdx],
      wildcard: personas[wildcardIdx >= 0 ? wildcardIdx : 0],
    };
  }

  // ============================================
  // Utility: 跨轮上下文摘要
  // ============================================

  private buildCrossRoundContext(rounds: DebateRound[]): string {
    const parts = rounds.map((r) => {
      const summaries = r.speeches
        .map((s) => `${s.characterName}：「${s.content.slice(0, 120)}」`)
        .join('\n');
      return `【第${r.roundNumber}轮·${r.title}】\n${summaries}`;
    });
    return parts.join('\n\n');
  }

  // ============================================
  // Utility: 角色排序 & 分配
  // ============================================

  private orderByRole(personas: (CharacterPersona & { assignedRole: string })[]) {
    return [...personas].sort((a, b) => {
      const order = { defender: 0, attacker: 1, deconstructor: 2 };
      return (
        (order[a.assignedRole as keyof typeof order] ?? 3) -
        (order[b.assignedRole as keyof typeof order] ?? 3)
      );
    });
  }

  private assignRoles(
    personas: CharacterPersona[],
  ): (CharacterPersona & { assignedRole: string })[] {
    const roles = ['attacker', 'defender', 'deconstructor'];
    return personas.map((p, i) => ({
      ...p,
      assignedRole: roles[i % roles.length],
    }));
  }

  private buildCharacterRolePrompt(persona: CharacterPersona & { assignedRole: string }): string {
    const roleLabel =
      persona.assignedRole === 'attacker'
        ? '攻击方——激进打破平衡'
        : persona.assignedRole === 'defender'
          ? '防御方——保守维持秩序'
          : '解构方——拆前两家前提';

    return `你的角色设定：你是${persona.name}，来自${persona.era}，${persona.mbti}型人格。
你的核心立场：${persona.coreStance}
你的说话风格：${persona.speakingStyle}
你擅长的领域：${persona.expertise}
你在本局中的角色：${roleLabel}

重要规则：
- 保持角色人格一致性
- 用你独特的说话风格表达
- 直接回应前面的观点，不要自说自话
- 控制在200字以内
- 对关键观点、金句和核心论点使用 **加粗** 标记（用两个星号包裹），让读者一眼抓住重点`;
  }

  // ============================================
  // Moderator
  // ============================================

  private async generateModeratorOpening(
    topic: string,
    personas: (CharacterPersona & { assignedRole: string })[],
  ): Promise<string> {
    const characterIntro = personas
      .map((p) => {
        const role =
          p.assignedRole === 'attacker'
            ? '攻击方'
            : p.assignedRole === 'defender'
              ? '防御方'
              : '解构方';
        return `${p.name}（${p.era}，${role}）`;
      })
      .join('、');

    return this.llmService.chat(
      [
        {
          role: 'system',
          content: `你是「赛博圆桌」的主持人。你的职责是引导一场结构化辩论。
你的风格：公正、犀利、善于提炼冲突点。用简练的中文表达。`,
        },
        {
          role: 'user',
          content: `你是「赛博圆桌」的主持人。辩论即将开始。

议题：「${topic}」
参与先哲：${characterIntro}

请用2-3句话开场，介绍今天的议题，引出各位先哲的身份和立场，给听众制造期待感。
风格：庄重但不刻板，简洁有力。`,
        },
      ],
      { temperature: 0.7, maxTokens: 512 },
    );
  }

  private async generateModeratorClosing(
    topic: string,
    conclusion: DebateConclusion,
  ): Promise<string> {
    return this.llmService.chat(
      [
        {
          role: 'system',
          content: `你是「赛博圆桌」的主持人。你的职责是引导一场结构化辩论。
你的风格：公正、犀利、善于提炼冲突点。用简练的中文表达。`,
        },
        {
          role: 'user',
          content: `你是「赛博圆桌」的主持人。辩论已经结束。

议题回顾：「${topic}」
核心冲突：${conclusion.coreConflict}
决策建议：${conclusion.decisionModel}

请用2-3句话为这场辩论做最终总结，感谢各位先哲，并给听众一个启发性的收尾。
风格：收束有力，留下余韵。`,
        },
      ],
      { temperature: 0.6, maxTokens: 512 },
    );
  }

  // ============================================
  // Conclusion (结案锦囊 + conflictTopology)
  // ============================================

  private async generateConclusion(
    topic: string,
    personas: (CharacterPersona & { assignedRole: string })[],
    rounds: DebateRound[],
  ): Promise<DebateConclusion> {
    const roundSummaries = rounds.map((r) => {
      const lastSpeech = r.speeches[r.speeches.length - 1];
      return `第${r.roundNumber}轮（${r.title}）：${lastSpeech?.characterName}：「${lastSpeech?.content?.slice(0, 100)}...」`;
    });

    const characterList = personas
      .map((p) => `  - ${p.name}（id: "${p.id}", ${p.era}, ${p.mbti}）`)
      .join('\n');

    const prompt = `基于以下三轮辩论，生成一份「问策结案锦囊」。

议题：${topic}
参与先哲：
${characterList}

${roundSummaries.join('\n')}

请以JSON格式输出结案锦囊，包含以下字段：
{
  "topic": "用户的原始问题",
  "characterSignatures": ["先哲1签名式概括", "先哲2签名式概括", ...],
  "coreConflict": "核心冲突的一句话概括",
  "goldenQuotes": ["最有暴击感的金句1", "金句2", "金句3"],
  "decisionModel": "给用户的决策建议模型（3-5句话）",
  "conflictTopology": {
    "quadrants": {
      "topLeft": "左上象限名称（根据议题定制，4字以内）",
      "topRight": "右上象限名称",
      "bottomLeft": "左下象限名称",
      "bottomRight": "右下象限名称"
    },
    "nodes": [
      {
        "id": "使用角色的id值",
        "name": "角色名（含emoji）",
        "mbti": "MBTI+关键词（如ESTJ秩序）",
        "weapon": "该角色最犀利的论证武器（一句话）",
        "thesis": "该角色在本场辩论的核心论点摘要（一句话）",
        "color": "#十六进制颜色（暖色系：金色/棕色/墨色/暗红等古典色）",
        "x": 150,
        "y": 120
      }
    ],
    "edges": [
      {
        "source": "角色id",
        "target": "角色id",
        "type": "clash或exploit或deconstruct",
        "label": "关系描述（含emoji，10字以内）"
      }
    ]
  }
}

坐标系统（画布650×460）：
- 横轴：左端"集权控序"(x≈60) → 右端"分权自由"(x≈590)
- 纵轴：上端"精神道德"(y≈60) → 下端"功利效率"(y≈400)
- 每个角色的坐标应反映其哲学立场在该空间中的相对位置
- 角色之间坐标要有足够间距，避免重叠

edges的type说明：
- clash: 不可调和的激烈冲突
- exploit: 一方利用另一方的逻辑
- deconstruct: 一方解构另一方的前提

只输出纯JSON，不要markdown代码块。`;

    const response = await this.llmService.chat(
      [
        {
          role: 'system',
          content: '你是一个辩论总结专家和哲学分析师。你只输出纯JSON，不要markdown代码块。',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.5, maxTokens: 2048 },
    );

    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      // 解析失败时 fallback
      const lastRound = rounds[rounds.length - 1];
      const fallbackSummary =
        lastRound?.speeches
          .map((s) => s.content)
          .join('；')
          .slice(0, 200) || '';
      return {
        topic,
        characterSignatures: personas.map((p) => p.name),
        coreConflict: fallbackSummary,
        goldenQuotes: [],
        decisionModel: fallbackSummary,
      };
    }
  }

  // ============================================
  // DB Query Methods
  // ============================================

  async findByUserId(userId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.debate.findMany({
        where: { userId },
        include: {
          characters: {
            include: { character: { select: { id: true, name: true, avatar: true } } },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.debate.count({ where: { userId } }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findPublic(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.debate.findMany({
        where: { type: 'COURT', status: 'CONCLUDED' },
        include: {
          characters: {
            include: { character: { select: { id: true, name: true, avatar: true } } },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.debate.count({ where: { type: 'COURT', status: 'CONCLUDED' } }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string) {
    return this.prisma.debate.findUnique({
      where: { id },
      include: {
        characters: {
          include: {
            character: {
              select: { id: true, name: true, avatar: true, era: true, mbti: true },
            },
          },
        },
      },
    });
  }
}
