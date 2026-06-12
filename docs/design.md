我输出完整的 `design.md` 内容。你保存为文件， Claude Code 直接使用。

---

# design.md

> 论衡 · UI 设计规范
> 供 Claude Code / Cursor 等 AI 编码工具参考
> 最后同步于：2026.06.06

---

## 一、设计定位

暖白学术风。不是赛博朋克，不是暗黑哥特——像旧书页、羊皮卷、深夜书房开灯后的感觉。强调可读性、高级感、截图友好。

## 二、配色系统

```
背景色（外层）    #e8e2d4    暖灰米
卡片色            #f5f0e6    暖白/羊皮纸
主文字色          #2a2824    深褐（近黑）
弱化文字          rgba(80,60,30,0.3~0.5)

强调色/金色       #b8963a    粗体/高亮
                 #8a6a20    文字金
                 #6a5528    品牌名金

分割线            rgba(120,90,40,0.12~0.15)

角色色：
  🏛️ 苏格拉底     #2a6a8a    蓝
    背景          #e4ecf0
  🔨 尼采         #aa3a3a    红
    背景          #f0e0e0
  🌿 老子         #3a7a4a    绿
    背景          #e4f0e8
```

**原则**：所有弱化文字透明度不低于 25%。任何文字在亮色背景上必须清晰可读。不渐变，不发光，不炫技。

## 三、字体系统

```
中文标题    Noto Serif SC    700/900   衬线，学术感
中文正文    Noto Sans SC     300~700   无衬线，清晰
英文/代码   JetBrains Mono   300~400   等宽，装饰性
```

### 字号层级

```
品牌名      17px    Noto Serif SC 700
议题标题    26px    Noto Serif SC 900
先哲名称    17px    Noto Serif SC 700
正文        16px    Noto Sans SC 400
弱化标签    10px    JetBrains Mono / Noto Sans
角色时代    10px    JetBrains Mono 300
弹幕/页脚   9~15px  视场景
```

## 四、组件定义

### 4.1 卡片容器

```
.card
width: 660px             最大宽度，保证截图时内容完整
padding: 40px 44px 36px  四边留白
background: #f5f0e6
box-shadow: 0 2px 20px rgba(0,0,0,0.04)  非常淡的阴影
position: relative
overflow: hidden
```

光晕（背景装饰，不影响 scrollHeight）：

```
.card::before
position: absolute, top -20%, left -10%
width 60%, height 50%
background: radial-gradient(ellipse, rgba(180,140,60,0.04), transparent)
pointer-events: none
截图时通过 .card.capturing::before { display: none } 隐藏
```

### 4.2 品牌栏

```
.brand-bar
flex: space-between
gap: 12px

.brand-emblem    28px emoji
.brand-name      17px, 粗体, #6a5528, 字间距4px
.brand-sub       9px 等宽, 灰度30%
.brand-tag       10px，外框圆角20px
```

### 4.3 议题栏

```
.topic-section
text-align: center
margin-bottom: 28px

.topic-label       10px 等宽，浅色，字间距4px
.topic-text        26px 粗衬线，#4a3a20，行高1.5
.topic-text .highlight  高亮色 #b8963a
```

### 4.4 发言卡片

```
.speech
padding: 20px 0
border-bottom: 1px solid rgba(0,0,0,0.04)
最后一条 .speech:last-child 去掉 border-bottom

.speech-header
flex, gap: 12px
margin-bottom: 8px

.speech-body
font-size: 16px
line-height: 1.9
color: #2a2824
padding-left: 52px
```

### 4.5 头像系统

当前使用 CSS 字母头像，避免本地图片跨域问题。

```
.avatar
width: 40px, height: 40px
border-radius: 6px
display: flex, align-items: center, justify-content: center
flex-shrink: 0

.avatar span
font-size: 18px, 粗衬线

角色配色：
  .avatar.socrates   bg: #e4ecf0, 文字: #2a6a8a    → 显示 "S"
  .avatar.nietzsche  bg: #f0e0e0, 文字: #aa3a3a    → 显示 "N"
  .avatar.laozi      bg: #e4f0e8, 文字: #3a7a4a    → 显示 "L"
```

未来升级为头像图片时，需要解决 html2canvas 对 file:// 协议图片的跨域限制。推荐方案：将图片 base64 嵌入 HTML 或使用线上 CDN。

### 4.6 弹幕栏

```
.barrage
margin-top: 24px
padding: 16px 20px
background: linear-gradient(135deg, rgba(180,140,60,0.05), rgba(60,120,80,0.05))
border-radius: 10px
border: 1px solid rgba(120,90,40,0.08)
text-align: center
```

### 4.7 落幕/CTA 区

```
.curtain
margin-top: 28px
padding: 20px 0
border-top: 1px solid rgba(120,90,40,0.1)
text-align: center

.cta-btn
inline-block
padding: 10px 28px
border: 1px solid rgba(120,90,40,0.2)
border-radius: 6px
color: rgba(80,60,30,0.45)
font-size: 12px
letter-spacing: 3px
```

## 五、间距规矩

```
卡片内边距   40px 44px 36px
段间距       20px（相邻发言卡之间）
大区间距     24-28px（议题→发言 / 发言→弹幕 / 弹幕→落幕）
品牌栏下边距 24px
分割线下边距 22px
```

## 六、截图适配

所有UI围绕截图设计。

```
截图模式：
  📱 朋友圈 1:1    → canvas 宽高比 1:1
  📕 小红书 3:4    → canvas 宽高比 3:4（竖）
  🖼️ 整页          → canvas 高度 = card.scrollHeight

实现工具：html2canvas@1.4.1
scale: 2（Retina 清晰度）
backgroundColor: #f5f0e6
useCORS: true

关键 hack：
  截图前加 class "capturing"，隐藏 ::before 伪元素
  防止 scrollHeight 将光晕区域计入高度导致底部空白
```

工具栏（截图按钮）不进入截图范围。工具栏样式随正文风格：

```
toolbar button
padding: 10px 22px
bg: #f5f0e6, border: rgba(120,90,40,0.15)
color: #5a4a28
hover 加深背景 + border
```

## 七、移动端适配

```
@media (max-width: 700px)
  .card, .toolbar → width: 100%
  .card padding 缩为 28px 20px 24px
  .topic-text 缩为 22px
  .speech-body 缩为 15px，去掉 padding-left
```

## 八、设计原则（开发对齐用）

1. **截图是最终交付物** — 用户的使用方式是截图发朋友圈。任何 UI 决策优先问：截图里好不好看？

2. **字大色深不费眼** — 所有文字至少 15px，弱化文字不透明度不低于 25%。不在亮色背景上用浅灰色文字。

3. **不靠图片靠代码** — 减少外部资源依赖。头像先用纯 CSS 字母占位。加载任何图片前先测试 html2canvas 兼容。

4. **每屏是一张海报** — 用户不需要滚动。所有内容在 1:1 方形截图内完整可见。

5. **三个角色，三轮发言** — 不多不少。是卡牌游戏，不是论坛。

## 九、截图问题排查清单

当 Claude Code 修改样式后截图异常时，检查：

```
[ ] 是否有 ::before / ::after 伪元素导致 scrollHeight 虚高
[ ] 是否有本地图片触发 html2canvas 跨域错误
[ ] canvas 宽高是否用 getBoundingClientRect() 精确取值
[ ] overflow 是否在截图后恢复
[ ] 是否用了 html2canvas 不支持的 CSS 属性
     (如 background-clip: text, 渐变文字需要替换为纯色)
```

---

保存为 `design.md`，放在项目根目录。Claude Code 启动时，可以 `@design.md` 引用。
