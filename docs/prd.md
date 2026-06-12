「朝议法卷」这个名字极其精准，自带一种不容置疑的终局裁决感和历史厚重感，能完美勾起当代人碎片化阅读中的“智商崇拜”。

我已经将「朝议法卷」社交卡片规范作为**独立的核心资产章节**深度融合进 **PRD v1.6** 中，同时同步修正了数据规格、增长闭环以及 Claude Code 的启动指令，确保全栈开发时管线严丝合缝。

---

# 赛博圆桌 (Cyber Senate) · 生产级产品需求文档 (PRD) v1.6

**最后更新：2026.06.11 | 状态：生产就绪 (Production-Ready)**

---

## 一、 产品定义与核心商业逻辑

### 1.1 一句话定位

一个基于 Multi-Agent 动态极化状态机架构的结构化思辨决策工具。通过“三哲动态链式对撞 + 二维思辨象限拓扑”，将模糊的用户议题转化为高净值、可沉淀、自带社交传播属性的“思想资产”。

### 1.2 商业生存闭环 (Micro-SaaS)

- **流量钩子 (朝议)**：全自动内容工厂。后端 Cronjob 每日定时抓取全网热搜，自动调度 3 位先哲 Agent 进行动态乱战辩论，渲染为带有 **「朝议法卷」** 深度二维象限拓扑图的精粹版社交长图，在公域（朋友圈、小红书、即刻）裂变引流。
- **变现核心 (问策)**：私密决策高价值卡口。采用“体力值 (Energy) 消耗” + “周卡/月卡买断订阅”双轨制。通过极具仪式感的「先哲结案锦囊」驱动 C 端进行社交裂变或直接产生付费转化。

---

## 二、 品牌视觉与文案体系 (Digital Classicism)

视觉与文案统一对齐“数字招魂”与“深夜书房”的古典庄重感，拒绝低俗网感。

| 定位              | 文案                                 | 落地视觉与心理暗示                                                           |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| **主 Slogan**     | **一个问题，万智共鸣。**             | 作为品牌的精神图腾，置于古典徽标（Logo）正下方。                             |
| **描述性 Slogan** | **溯千载智慧之流，解今朝现世之围。** | 置于页面副标题、古卷卡片抬头。将庸常的纠结升格为“现世之围”，赋予历史神圣感。 |
| **辅助传播文案**  | **抽身尘嚣三分钟，入座千载思想局。** | 置于页脚、长图导出底部水印。强调低时间成本与“思想局”的卡牌博弈爽感。         |

---

## 三、 三层功能架构与命名规范

前端 UI 顶层导航严格采用标准双音节古风动词。

```
                       赛博圆桌 (Cyber Senate)
        ┌────────────────────────────────────────────────────────┐
        │   🏛️ 朝议 [Chao Yi] (Daily Senate · 流量层/免费看)       │
        ├────────────────────────────────────────────────────────┤
        │   📜 问策 [Wen Ce]  (Consulting Room · 变现层/消耗体力)   │
        ├────────────────────────────────────────────────────────┤
        │   👥 聚贤 [Ju Xian]  (Persona Workshop · 资产层/UGC增值) │
        └────────────────────────────────────────────────────────┘

```

### 3.1 核心层级职责定义

- **「朝议」 (Daily Senate)**：全自动“旁观”广场。固定频率自动触发，3 位先哲对垒。用户不可实时输入，提供一键生成「朝议法卷」超清组件及“去问策局开局”的 CTA 转换入口。
- **「问策」 (Consulting Room)**：私密“定制”军师团。用户输入自身真实困惑，AI 主持人识别意图并自动推荐 3-5 位最适合的阵容，运行 3–6 轮弱限制交互流。
- **「聚贤」 (Persona Workshop)**：角色武器库。包含标准维度的先哲元数据。支持用户通过滑块和自定义 System Prompt 创建新 Agent 并上架市场。

---

## 四、 核心机制与大模型状态机编排

后端（NestJS）必须通过确定性的有限状态机（FSM）来管理调用流，严格控制 Token 消耗。

### 4.1 「朝议」：三哲动态收束状态机 (Dynamic 3-Agent FSM)

固定 3 回合，不循环。**主持人大模型调用仅出现在第 1 轮开头和第 3 轮结尾，第二轮由后端控流器根据情绪指标动态调度先哲直接对撞，杜绝主持人老调重弹。**

#### 运行细则：

- **第 1 轮（引局与立论）**：主持人（Moderator）定义核心概念并退席。先哲 A、B、C 顺次发表初始立场。
- _技术埋点_：大模型在输出立论时，必须隐式返回两个评估标签：立场值 $stance \in [-10, 10]$，开炮意愿 $rage \in [1, 10]$。

- **第 2 轮（乱战与深挖）**：**不调用主持人大模型**。后端控流器读取第 1 轮的标签，计算极化张力矩阵：

$$M_{ij} = |stance_i - stance_j| \times rage_i$$

- **Step 1（主攻手发难）**：取 $M_{ij}$ 绝对值最大者 $i$ 为“主攻手”，由后端动态拼接强攻 Prompt，驱动该先哲同时围剿另外两人。
- **Step 2（靶向受害者反击）**：将 Step 1 的暴击文本作为上下文，驱动受创最深的先哲进行靶向防御与反击。
- **Step 3（压轴渔翁收割）**：叠加前两步文本，驱动最后一位未发言的先哲从自身哲学视角进行降维收割。

- **第 3 轮（结案与收束）**：唤醒主持人 Agent，执行 `conclude()` 结案算法，吞入全量文本，强制启用 `JSON_MODE`，计算三人在思辨空间中的相对坐标并输出拓扑数据。

---

## 五、 核心裂变资产：「朝议法卷」 (The Senate Decree) 社交卡片设计规范

「朝议法卷」是由前端通过 `html2canvas` 动态转译的、专门用于社交媒体（微信朋友圈、小红书、即刻）疯传的高智商格调长图卡片。

### 5.1 物理规格与版式红线

- **视觉宽度**：严格锁定 `720px`，高度根据内容自适应伸缩（仿古卷轴比例）。
- **配色基调**：卡片背景必须使用拟物古卷白（`#f5f0e6`），整体外框辅以 `1.5px` 焦炭黑（`#2a2824`）高雅细线，四角内缩 `4px` 留白。

### 5.2 纵向视觉层级结构

```
┌────────────────────────────────────────────────────────┐
│ [徽标] ISSUE #042              ⚡ 30s 极化音频摘要 (Wave) │
│                                                        │
│               ── 核心识见冲突拓扑 ──                    │
│ 议题：为了绝对安全，人类是否应该主动驯服于算法长城？        │
├────────────────────────────────────────────────────────┤
│                                                        │
│               [ 2D 思辨象限拓扑图 SVG ]                 │
│                                                        │
├────────────────────────────────────────────────────────┤
│ 🏛️ 加图: “无绝对之规训，城邦必流于分崩...”              │
│                                                        │
│ 🦾 赛博黑客: “用安全粉饰的监禁，依然是监禁...”          │
├────────────────────────────────────────────────────────┤
│ 📜 终极判词: 秩序与自由并无解药，这只是一场利维坦...     │
├────────────────────────────────────────────────────────┤
│ [带参二维码]               「 🏛️ 入座千载思想局，重新开局 」 │
└────────────────────────────────────────────────────────┘

```

1. **天命定调 (Header Hook)**：

- 左侧：极简代码麦穗徽标 + Monospace 字体渲染的朝议期数（如 `ISSUE #042`）。
- 右侧：微型动态音频波形条，悬停可播放由 MiniMax 生成的 30 秒高潮辩论音频摘要。
- 核心议题：大号 Serif 字体加粗居中展示（如：“_为了绝对安全，人类是否应该主动驯服于算法长城？_”）。

2. **思想拓扑 (2D Canvas)**：

- 完整嵌入本期朝议生成的 **二维思辨象限拓扑图**（参见第六章 SVG 渲染规范）。这是整张法卷最核心的视觉锤，确保路人一眼感知到高结构化思维。

3. **群贤交锋 (Climax Clashes)**：

- 由后端系统自动抽取的第二轮对抗中**最具有情绪极化撕裂感、针锋相对的两段 100 字内核心金句对仗**（如：加图的秩序规训论 vs 赛博黑客的灵魂囚禁论），采用戏剧台词排版。

4. **最终法案 (The Decree Judgment)**：

- 加粗包裹的框体，展示主持人执行 `conclude()` 吐出的最终判词：“_朝议已毕。秩序与自由并无解药，这只是一场利维坦算法对技术反叛者..._”

5. **执槌入口 (Growth Loop Footer)**：

- 左侧：带有古典火漆印纹理的裂变带参二维码（二维码背景色需完美融入 `#f5f0e6`）。
- 右侧裂变文案：`「 🏛️ 抽身尘嚣三分钟，入座千载思想局 」`。

---

## 六、 数据规格与二维思辨象限拓扑渲染

> ⚠️ **开发红线**：严禁大模型直接输出 ASCII 字符图。必须由后端在 `conclude()` 阶段通过强 JSON Schema 约束输出坐标与对抗关系，由前端 Vue3 用原生 `<svg>` 渲染。

### 6.1 哲学公理双轴与坐标映射

图表包含两条交叉的灰色参考轴线，将思想空间划分为四大象限：

- **横轴（权力与秩序分配）**：左端为“集权控序” $\leftrightarrow$ 右端为“分权自由”。
- **纵轴（核心价值驱动力）**：上端为“精神与道德传承” $\leftrightarrow$ 下端为“功利与绝对效率”。

大模型返回三位先哲在思辨空间中的相对逻辑位置 $(s_x, s_y) \in [-1, 1]^2$。转换函数映射为 SVG 画布（`650px × 460px`）的绝对像素坐标 $[X, Y]$：

$$X = 325 + s_x \times 285$$

$$Y = 230 - s_y \times 200$$

### 6.2 后端返回的 JSON 冲突规约

```json
{
  "topic": "AI全量行为监测与现世绝对秩序之辩",
  "conflictTopology": {
    "quadrants": {
      "topLeft": "神圣秩序",
      "topRight": "数字乌托邦",
      "bottomLeft": "利维坦算法",
      "bottomRight": "资本无政府"
    },
    "nodes": [
      {
        "id": "jiatu",
        "name": "🏛️ 加图",
        "mbti": "ESTJ秩序",
        "weapon": "罗马公法审判",
        "thesis": "牺牲局部私隐，换取城邦的神圣永恒秩序。",
        "color": "#b8963a",
        "x": 150,
        "y": 120
      },
      {
        "id": "hacker",
        "name": "🦾 赛博黑客",
        "mbti": "INTP反叛",
        "weapon": "全加密暗网协议",
        "thesis": "全量算法监测，是对人类意志的隐形囚禁。",
        "color": "#2a2824",
        "x": 500,
        "y": 120
      }
    ],
    "edges": [
      { "source": "jiatu", "target": "hacker", "type": "clash", "label": "💥 秩序与自由零和" }
    ]
  }
}
```

---

## 七、 声音管线规约：MiniMax 高保真拟真音频引擎

### 7.1 「朝议法卷」：30 秒高潮音频预览（零算力方案）

- 热榜页面与社交卡片不生成整首长音频。后端调用 MiniMax 接口（选用通用低消耗模型）生成一段 **30 秒的主持人对立矛盾摘要 MP3**，缓存于 CDN 中。
- 卡片顶部提供微型音频波形条，点击即可实现流式收听。

### 7.2 「问策」：全流程高质量音频（付费墙增值资产）

- **MiniMax 声音特征绑定矩阵 (Voice Matrix)**：在后台为每个先哲绑定 MiniMax 的特定音色 ID（`voice_id`）并注入情绪权重系数。
- **后端切片串行缓存机制**：后端将先哲每段发言作为独立文本块并发请求 MiniMax 接口生成 `seg_*.mp3`。使用 `fluent-ffmpeg` 拼接，并在各段发言之间强行插入 0.8 秒的静音空白文件（silence.mp3）模拟思考停顿感。

---

## 八、 增长闭环、付费墙与心理收束

### 8.1 经济系统流转

1. **初始状态**：新用户注册赠送 3 点体力值 (Energy)，单次私密「问策」消耗 1 点。
2. **裂变解锁**：体力值耗尽后，点击「朝议法卷」下方的“通过邀请回满”按钮，分享专属带参二维码，每成功 1 人回满 1 点体力值。
3. **付费断流**：买断制：**￥9.9 / 周卡（无限次问策）**，**￥29 / 月卡（含全量离线群贤音频生成）**。

### 8.2 仪式感心理收束

当用户点击「朝议法卷」底部或私密问策结束时：聊天输入框渐隐消失，顶部横幅缓升 `「 📜 朝议已毕 · 群贤退席 · 识见留存 」`，整个卡片完全固化为不可逆的静态「朝议法卷」长图，下方升起唯一高亮法槌按钮引导用户进行保存长图或付费转化。

---

## 九、 UI/UX 设计规范与截图参数

```ini
# 核心调色盘 (拟物书房色)
card_bg       = "#f5f0e6"  ; 拟物古卷白
page_bg       = "#e8e2d4"  ; 暖灰色背景
text_main     = "#2a2824"  ; 焦炭黑正文
brand_gold    = "#b8963a"  ; 元老金高亮
clash_red     = "#8a3c3c"  ; 冲突警示红

# 截图引擎精确配置
engine        = "html2canvas@1.4.1"
scale         = 2             ; 2倍超清抗锯齿
scroll_offset = "scrollY: -window.scrollY"    ; 彻底根除滚动条导致的底部死白留白 Bug

```

---

## 十、 Claude Code 终极全栈启动开发指令

```markdown
Please initialize the complete full-stack architecture for 'Cyber Senate (赛博圆桌) v1.6' based on the provided production PRD.

Core Technical Implementation Plan:

1. Backend (NestJS):
   - Scaffold database schemas for Sessions, Personas, and Energy Logs.
   - Implement Finite State Machine for '朝议' (3 rounds static with Round 2 dynamic bypass):
     - Round 1: Sequentially call 3 Personas, extract stance (-10 to 10) and rage (1 to 10).
     - Round 2: Bypass Moderator. Compute agitation matrix M_ij = |stance_i - stance_j| \* rage_i. Chain call: Primary Agitator -> Target Victim Counter-attack -> Wildcard harvesting.
     - Round 3: Recall Moderator.conclude() to return structured 2D coordinate JSON schema.
   - Setup premium TTS Audio Pipeline using MiniMax Speech Synthesis API with a mandatory 0.8s silence gap between turns.

2. Frontend (Vue3 + TailwindCSS):
   - Build the premium '朝议法卷' (The Senate Decree) shareable long card component locked at 720px width using palette #f5f0e6, #2a2824, #b8963a, and #8a3c3c.
   - Layout sequence inside the Decree Card: Header Hook (Issue#, Topic, micro waveform), 2D Quadrant Topology Canvas (650x460 inline SVG containing text-masked lines and node elements), Climax Clashes section displaying alternating golden text quotes, Final Decree Judgment container, and a growth footer with a parameter-embedded QR code.
   - Integrate html2canvas@1.4.1 for 2x super-sampled snapshot exporting with `scrollY: -window.scrollY` view-port compensation.
   - Implement navigation tabs named precisely '朝议', '问策', and '聚贤'.
```
