# 任务：问题音效重选（漫威影视风格）+ 试听预览页 —— 本轮只做预览，不接入

试听后确认 6 个音效不合格：尖锐、刺耳、风格不符。本轮任务是为它们找漫威电影质感的候选素材，并做一个**本地试听预览页**供用户逐个对比、决定取舍和音量。

**本轮铁律：不改 `src/` 任何代码，不改 `public/assets/solar/sfx/` 任何文件，不改 `sfx-assets.json`。** 只新增预览资产和一个独立 HTML 页面。用户在预览页选定后，才会有下一轮的正式替换任务。

---

## 一、目标风格：漫威影视感（本轮所有候选的统一标准)

参考画面：钢铁侠握住悬浮全息模型、贾维斯界面展开、奇异博士能量流转。

- **质感**：厚重、圆润、低中频为主，带短混响尾音（有空间感），像"真实物理事件被电影化"。
- **一律禁止**：任何"哔/叮/滴"类纯音提示音；高频毛刺、静电嘶嘶声、金属刮擦；游戏 UI 感；突兀的高频瞬态。
- **标题过滤**：候选素材标题/描述含 `beep / ping / bleep / chime / alarm / alert / buzz / glitch / notification` 一律跳过；优先含 `whoosh / hum / drone / deep / dark / cinematic / warm / soft / air` 的素材。
- 来源与许可规则同前两轮（Pixabay/Mixkit 免费商用直下，Freesound 仅 CC0；逐条记录 source_url/author/license）。

## 二、六个槽位的处置方案

其中 3 个建议**直接删除**（它们同时是"太多太杂"的主要来源），3 个必须替换。删除建议只是默认项——预览页上每个槽位都要提供「删除 / 用候选 X / 保留原样」三种选择，最终由用户决定。

### 建议删除的 3 个（各备 1 个候选以防用户想保留）

**1. `pinch-click`** — 删除理由：每次捏合都响，且与 `planet-select` 同时叠放成双重音；删掉后选中反馈由 select 独自承担，干净得多。
- 备选规格：圆润低哑的 thock（闷响轻拍），非清脆 click。搜 `soft thud tap` / `muted tap deep` / `low tap`。时长 <0.25s，频谱重心 <1200Hz。

**2. `summon-cancel`** — 删除理由：取消动作视觉上已经表达；手势识别抖动时（合拢↔退出反复横跳）此音会连环响，是"杂"感的最大单一来源。
- 备选规格：极轻空气消散。搜 `air release soft` / `breath whoosh fade` / `energy fade soft`。重心 <800Hz，处理后 RMS 压到 -22dB。

**3. `system-ready`** — 删除理由：启动提示不是必需，现在是典型的"叮"声。
- 备选规格：温暖的全息苏醒 bloom（软上行，无瞬态）。搜 `hologram warm bloom` / `soft swell short` / `interface warm on`。重心 <1500Hz。

### 必须替换的 3 个（每个 3 个候选，尽量不同作者）

**4. `focus-grab`（跟手触发）** — 现为高频哔声，动作却是"把星球握进手里"。
- 要：厚实圆润的低频 whoosh-thud，一点空气感尾音，像全息体落入掌心。
- 搜：`deep whoosh grab` / `cinematic whoosh short deep` / `soft impact air reverb` / `hologram whoosh low`
- 验收：时长 0.3–0.8s；峰值在前 150ms；频谱重心 <900Hz。

**5. `system-control-loop`（扶住/托举持续音）** — 现为电流蜂鸣感，刺。
- 要：温暖圆润的低鸣，方舟反应堆式的稳定能量场，无静电毛刺、无蜂鸣。
- 搜：`warm hum loop` / `deep drone loop soft` / `reactor hum` / `spaceship interior hum`
- 验收：可无缝循环 3–8s；频谱重心 120–600Hz；500ms 窗 RMS 波动 <2.5dB。
- 注意 `focus-control-loop` 复用此音，选定即两处生效。

**6. `focus-return-wave`（挥手甩回）** — 现为尖锐 swish。
- 要：厚重偏暗的电影 whoosh，带混响尾，像披风重挥/能量掠过，"有分量的快"而不是"尖的快"。
- 搜：`deep whoosh cinematic` / `dark whoosh reverb` / `heavy whoosh pass` / `cloth whoosh deep`
- 验收：时长 0.4–1.2s；峰值在前 150ms；频谱重心 <1200Hz。

## 三、候选处理规范（保证 A/B 公平）

1. 原始下载存 `assets-src/sfx/preview/raw/`；处理后的候选存 `assets-src/sfx/preview/<slot-id>/cand-<n>.mp3`（循环类用 .wav，循环必须无缝）。
2. 每个候选**响度对齐到该槽位当前线上文件的整文件 RMS**（用第五节脚本测当前值），否则响的听起来总像"更好"。
3. 采样率 44.1kHz，其余处理规范同第一轮（裁静音、边缘淡化）。
4. 跑第五节分析脚本，逐候选核对第二节的数值验收，不达标就换素材，禁止"下载了就算过"。

## 四、试听预览页（核心交付）

生成**单文件** `sfx-preview.html` 放在项目根目录，要求：

1. **双击即用**：不依赖 dev server，在 `file://` 下直接工作。因此清单数据必须**内联**在 HTML 里（`file://` 下 fetch JSON 会被拦），音频用相对路径 `<audio>` 引用（`assets-src/sfx/preview/...` 与 `public/assets/solar/sfx/...`）。页面顶部注明"请用 Chrome 打开"。
2. **六个槽位区**，每槽显示：
   - 触发场景说明（一句话，中文）＋ 处置建议标签（"建议删除"/"建议替换"）
   - 播放按钮：当前线上版本 + 各候选（标注来源作者和关键指标：时长/频谱重心）；循环类音效点击播放时 loop，再点停止；同一时间只允许一个音频在播（切播自动停前一个）
   - 单选：`用候选1 / 用候选2 / 用候选3 / 删除此音效 / 保留原样`（删除建议槽默认选"删除"）
   - 音量滑杆 0–150%（默认 100% = 当前 manifest 有效增益），实时作用于试听
3. **其余 16 个保留音效的列表区**：每条可播放 + 音量滑杆 + 「删除此音效」复选框——用户说整体"太多太杂"，要让他顺手把其他想砍/想调低的音效也一并标掉。
4. **导出**：页面底部「导出决定」按钮，生成 JSON（每个音效：`keep / replace:cand-n / delete` + `volume` 百分比）——同时提供"复制到剪贴板"和"下载 .json 文件"两种方式；所有选择实时存 localStorage，刷新不丢。
5. 页面样式简洁深色即可，不引入任何外部库/CDN。

这份导出 JSON 就是下一轮正式接入任务的输入，格式要干净稳定。

## 五、验收脚本

沿用第二轮提示词（`音效替换_第二轮_Codex提示词.md`）第六节的分析脚本，对所有候选与对应当前文件各跑一遍。

## 六、交付总结要求

1. 候选指标对照表：槽位｜候选｜来源标题/作者｜时长｜频谱重心｜RMS（与当前文件同列对比）｜数值验收是否通过。
2. 确认三条铁律未被违反（src / public sfx / manifest 均无改动，可用 `git status` 证明）。
3. 预览页自测结果：Chrome `file://` 打开可播放全部音频、导出 JSON 正常。
4. 提醒用户：试听时同时把"保留组"里觉得吵的音效音量拉低或勾删，一次导出。
