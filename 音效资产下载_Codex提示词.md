# 任务：为 AR 太阳系项目下载全套交互音效

你的任务是为本项目搜索、下载、整理一套交互音效资产。**本任务只交付音频文件和清单，不修改任何现有代码，不做播放接入。**

---

## 一、整体音色方向（所有音效必须统一在这个气质里）

- 参考气质：**钢铁侠全息界面 × 太空纪录片**。空灵、干净、有能量感、略带科幻电子质感。
- 一律避免：卡通音、8-bit 游戏音、手机通知音、真实机械/金属碰撞声、带旋律的音乐片段、人声。
- 频段直觉：冲击类靠低频（sub/boom），确认类靠中高频（chime/click），氛围类铺中低频，互不打架。
- 同一交互的"过程音"和"完成音"要像一个家族：例如召唤的蓄力→拉开→展开三段，听起来应是同一能量的三个阶段。

## 二、来源与许可（硬性要求）

1. **只允许免费可商用来源**，按优先级：
   - **Pixabay SFX**（https://pixabay.com/sound-effects/）— 无需登录可直下，Pixabay Content License，可商用免署名。**首选。**
   - **Mixkit**（https://mixkit.co/free-sound-effects/）— 无需登录，Mixkit License，可商用免署名。
   - Freesound（https://freesound.org）— 仅当你有可用账号/API key 时使用，且**只取 CC0 授权**的素材；CC-BY 及其他授权一律不要。
2. 禁止使用：YouTube 音效库（限 YouTube 使用）、任何需付费/订阅/授权不明的来源。
3. 每个文件必须在 manifest 里记录 `source_url`、`author`、`license`（见第五节）。查不到作者就记录页面 URL + 平台许可名。
4. 某条实在找不到理想素材时：下载最接近的替代品占位，并在 manifest 里标 `"placeholder": true`，不要留空缺。

## 三、音效清单（共 22 个下载项 + 3 个复用项）

每条格式：**ID｜触发时机｜声音描述｜时长｜搜索关键词｜怎么选**。
优先级：P0 = 缺了 demo 不完整；P1 = 明显提升手感；P2 = 氛围加分项。

### A. 召唤与收起（太阳系的开与关）

**1. `summon-charge`（P0）**
- 触发：双手在胸前合拢，进入蓄力状态。
- 声音：低频鸣响 + 能量聚集感的 swell，由弱到强，像"充能待发"。
- 时长：0.6–1.5s。
- 搜索：`energy charge` / `power up hum` / `sci-fi charge swell` / `deep drone swell`
- 怎么选：【要】有明显从弱到强的动态曲线，低频扎实。【避免】beep 声、旋律感、突兀的起始爆点。

**2. `summon-pull-loop`（P0，循环）**
- 触发：双手向两侧拉开、太阳系随手距展开的整个过程（时长由用户手速决定，代码会按手距映射音量/音高）。
- 声音：持续的能量流/上升张力，像撕开空间的电流感 + 风感。
- 时长：2–6s，**必须可无缝循环**。
- 搜索：`energy loop` / `portal loop` / `electricity hum loop` / `sci-fi tension loop`
- 怎么选：【要】质感均匀、无明显节奏点、首尾能接上。【避免】内含渐强到爆点的结构（爆点由下一条单独负责）。

**3. `summon-open-impact`（P0）**
- 触发：太阳系完全展开的那一帧。全片最大爽点，对应视频里的音乐 DROP。
- 声音：低频 boom 冲击 + 星尘 shimmer 亮尾音，一击定音。
- 时长：1.5–3s（含自然混响尾）。
- 搜索：`cinematic impact` / `deep boom reverb` / `magic impact shimmer` / `epic hit whoosh`
- 怎么选：【要】冲击点在文件最开头（起振 <50ms，方便卡帧），尾音自然衰减。【避免】双重冲击、尾音带音乐和弦。

**4. `summon-cancel`（P1）**
- 触发：合拢后没拉开、或拉开中途放弃，退回空闲状态。
- 声音：能量消散的下行音，轻，像"泄气收场"。
- 时长：0.5–1s。
- 搜索：`power down short` / `energy dissipate` / `reverse whoosh short` / `fizzle`
- 怎么选：【要】音量克制、下行走向。【避免】"错误警告"感（这是取消，不是报错）。

**5. `system-close-loop`（P0，循环或长单发）**
- 触发：双手扶住端点向内合拢、收起太阳系的过程。
- 声音：reverse whoosh / 吸入感，能量往回收。
- 时长：可无缝循环 2–4s，或 2–4s 的反向 riser 单发。
- 搜索：`reverse whoosh` / `suction` / `vacuum whoosh` / `implosion`
- 怎么选：【要】明确的"向内收"方向感。【避免】收尾自带大爆点（落定由下一条负责）。

**6. `system-close-end`（P1）**
- 触发：太阳系收完、画面归于空场的落定瞬间。
- 声音：轻 boom / 气流收拢 + 归寂尾音，与 `summon-open-impact` 呼应但小一号。
- 时长：0.8–2s。
- 搜索：`soft impact` / `air puff` / `magic vanish` / `whoosh stop`
- 怎么选：【要】干净利落、尾音短。【避免】比展开音还响。

### B. 总览整体控制（扶住 / 平移 / 缩放）

**7. `system-grab`（P0）**
- 触发：双手扶住太阳系左右端点、进入整体控制的瞬间。
- 声音：短促低频轻触 + "锁定"确认感。
- 时长：0.2–0.5s。
- 搜索：`lock on` / `soft click deep` / `grab whoosh short` / `ui select low`
- 怎么选：【要】干脆、偏低频、有"握住了"的踏实感。【避免】清脆高频 click（和捏合音区分开）。

**8. `system-control-loop`（P0，循环）**
- 触发：扶住期间平移/缩放的持续过程（代码会按手距映射音量/音高）。
- 声音：低频托举 hum，像托着一个能量场。
- 时长：3–8s，**必须可无缝循环**。
- 搜索：`low hum loop` / `energy field loop` / `hover hum` / `force field loop`
- 怎么选：【要】静态均匀质感、频段偏低、存在感弱（是手感底衬不是主角）。【避免】节奏、颗粒噪声、明显的循环接缝。

**9. `system-release`（P1）**
- 触发：从扶住状态松手，太阳系留在原地。
- 声音：轻软的释放 whoosh，一放即走。
- 时长：0.3–0.8s。
- 搜索：`soft release` / `air whoosh gentle` / `ui deselect`
- 怎么选：【要】轻、短、下行。【避免】任何冲击感。

### C. 星球选择（太阳系总览界面）

**10. `planet-hover`（P0）**
- 触发：手靠近某颗星球、星球高亮的瞬间。会被频繁触发。
- 声音：极轻的 shimmer / 全息浮现感单发。
- 时长：0.3–0.8s。
- 搜索：`hologram blip` / `soft shimmer` / `ui hover` / `gentle glow`
- 怎么选：【要】音量天生很低、质感柔。【避免】响、长、抢戏——这条选错整个体验会变吵。

**11. `pinch-click`（P0）**
- 触发：每一次有效捏合（拇指食指捏合成功）的通用反馈。
- 声音：清脆干净的 click，科幻数字质感。
- 时长：0.1–0.3s。
- 搜索：`sci-fi click` / `digital click` / `crisp select` / `ui tap`
- 怎么选：【要】极短、起振即峰值、高频干净。【避免】机械键盘/鼠标的真实感 click。

**12. `planet-select`（P0）**
- 触发：捏合命中星球、选中锁定的瞬间（星球公转停止）。
- 声音：确认音，click 之上多一层"落锁/锁定"谐振。
- 时长：0.3–0.8s。
- 搜索：`target lock` / `sci-fi confirm` / `hologram select` / `confirm blip`
- 怎么选：【要】比 `pinch-click` 更有分量和确认感，两条连播（click→select）不打架。【避免】游戏"金币/得分"感。

**13. `planet-focus-enter`（P0）**
- 触发：选中后捏两下、星球放大居中进入单星球界面（镜头 0.3s 推进）。
- 声音：whoosh + 上扬 shimmer，有"飞向它"的纵深感。
- 时长：0.8–2s。
- 搜索：`transition whoosh` / `warp short` / `magical rise` / `zoom whoosh`
- 怎么选：【要】能量峰在前段（与 0.3s 镜头推进对齐），尾音亮。【避免】过长的 build-up 前奏。

### D. 单星球焦点界面

**14. `focus-dwell-loop`（P1，循环）**
- 触发：双手进入热区停留 1 秒的蓄力过程（进入跟手前的充能提示）。
- 声音：短促充能 loop / 上升 tick，"正在充能"的提示感。
- 时长：约 1s 或可循环。
- 搜索：`charging loop` / `energy buildup short` / `scanning progress`
- 怎么选：【要】1 秒内听感完整、能中途打断。【避免】数字滴滴声。找不到理想的可复用 `ui-hold-loop`（降低音量），并在 manifest 注明。

**15. `focus-grab`（P0）**
- 触发：热区停满 1 秒、星球进入双手跟随的瞬间。
- 声音：触发确认 + "托起来了"的能量启动感。
- 时长：0.3–0.8s。
- 搜索：`telekinesis grab` / `energy grab` / `whoosh grab` / `force grab`
- 怎么选：【要】有"接管控制权"的分量感，和 `system-grab` 同族但更亮一点。【避免】纯 click（这不是点击，是握持开始）。

**16. `focus-control-loop`（复用项，不下载）**
- 跟手期间的持续音：**复用 `system-control-loop`**，播放音量调低。在 manifest 里登记为 reuse。

**17. `focus-release`（复用项，不下载）**
- 捏合一下释放星球、进入自由漂浮：**复用 `system-release`**。若顺手发现更空灵的可单独下载替换，非必须。

**18. `focus-return-wave`（P0）**
- 触发：快速挥手，星球被甩回太阳系总览。
- 声音：有力的快速 swoosh，"扔出去"的方向感。
- 时长：0.3–0.7s。
- 搜索：`fast swoosh` / `swipe whoosh strong` / `throw whoosh` / `air swish`
- 怎么选：【要】速度感强、起振快。【避免】温柔的风声（这是全套里最"用力"的一条）。

**19. `planet-return-land`（P1）**
- 触发：被甩回的星球落回轨道、归位的瞬间。
- 声音：轻落定 + 一点 shimmer，"回家了"的收尾。
- 时长：0.5–1.5s。
- 搜索：`soft landing` / `magic settle` / `gentle impact chime` / `object place`
- 怎么选：【要】柔和、明确的"停住"感。【避免】重低频 boom（分量必须小于 `summon-open-impact`）。

### E. UI 卡片（食指长按玻璃卡）

**20. `ui-hold-loop`（P0，循环）**
- 触发：食指停在 UI 卡上、0.5 秒长按进度累积的过程。
- 声音：进度充能 / 扫描感，数字质感比 D 组更"界面"一点。
- 时长：≥0.6s 或可循环。
- 搜索：`ui progress` / `hold charge` / `scan loop soft` / `interface loading`
- 怎么选：【要】有"正在累积"的走向、能被随时打断。【避免】响度高、颗粒粗。

**21. `ui-hold-success`（P0）**
- 触发：长按满 0.5 秒成功触发（含地月视角切换等所有卡片）。
- 声音：干净的确认 chime，全息玻璃质感。
- 时长：0.3–0.8s。
- 搜索：`ui confirm chime` / `digital chime` / `hologram confirm` / `soft success`
- 怎么选：【要】明亮但克制、单音或双音。【避免】手机通知声、三连音以上的"旋律"。

**22. `ui-hold-cancel`（P1）**
- 触发：长按中途手指移开，进度归零。
- 声音：极轻的下行 blip。
- 时长：0.1–0.4s。
- 搜索：`ui cancel` / `blip down` / `subtle deny soft`
- 怎么选：【要】几乎不被注意到的存在感。【避免】错误警报感。

### F. 氛围层（P2，可选但建议一并拿下）

**23. `ambient-solar-loop`（P2，循环）**
- 触发：太阳系展开期间全程铺底。
- 声音：空灵太空 pad / 低频太阳鸣，无旋律无节奏。
- 时长：30–60s，**必须可无缝循环**。
- 搜索：`space ambient loop` / `ambient drone space` / `ethereal pad loop` / `cosmic atmosphere`
- 怎么选：【要】中低频为主、动态平稳、循环接缝听不出。【避免】任何旋律动机、鼓点、突出的高频事件。

**24. `comet-flyby`（P2）**
- 触发：彗星飞过场景的伴随音（项目里有彗星飞掠事件）。
- 声音：遥远的 whoosh + 冰晶 shimmer，远景感。
- 时长：1–3s。
- 搜索：`flyby whoosh` / `comet whoosh` / `shooting star` / `distant pass by`
- 怎么选：【要】"由远及近再远去"的空间感、音量小。【避免】近距离的猛烈风声。

**25. `system-ready`（P2）**
- 触发：摄像头 + 手部追踪就绪、可以开始交互的提示。
- 声音：轻的全息界面开启音。
- 时长：0.5–1s。
- 搜索：`hologram on` / `interface on` / `startup soft` / `boot subtle`
- 怎么选：【要】友好、安静、上行走向。【避免】开机铃声感。

## 四、文件规范与处理流程

1. **原始文件**存到 `assets-src/sfx/raw/<id>-original.<原扩展名>`（保留原始下载，不做修改）。
2. 用 ffmpeg 处理后输出到 **`public/assets/solar/sfx/<id>.<ext>`**：
   - 裁掉首尾静音（`silenceremove`），一击音的起振点尽量贴文件开头。
   - 采样率统一 44.1kHz；一击音可 mono，循环/氛围保持 stereo。
   - 响度粗略统一：一击音峰值归一到 -3dBFS；循环/氛围类目标约 -18 LUFS（用 `loudnorm` 即可，不必精确）。
   - **格式**：一击音 → `.mp3` 320kbps；循环音（标了"循环"的）→ `.wav` 16-bit（mp3 有编码静音填充，无法无缝循环）；`ambient-solar-loop` 若 wav 过大可用 `.ogg`，并在 manifest 注明播放时建议做交叉淡入循环。
   - 循环文件必须自检无缝：首尾采样值接近，必要时做短交叉淡化重构循环点；一击音首尾各加 3–5ms 淡入淡出防爆音。
3. 单文件体积上限：一击音 < 500KB，循环 < 2MB，ambient < 5MB。

## 五、清单与验收

1. 生成 **`public/assets/solar/manifests/sfx-assets.json`**（对齐项目里 `ai-vfx-assets.json` 的风格），每条包含：

```json
{
  "id": "summon-open-impact",
  "file": "summon-open-impact.mp3",
  "trigger": "太阳系完全展开瞬间（SolarOpening → SolarActive）",
  "loop": false,
  "suggested_gain": 1.0,
  "priority": "P0",
  "duration_s": 2.1,
  "source_url": "https://pixabay.com/sound-effects/xxxx/",
  "author": "xxx",
  "license": "Pixabay Content License",
  "placeholder": false
}
```

   - `suggested_gain` 给出相对建议：impact 类 1.0，确认类 0.6–0.8，hover/cancel 类 0.3–0.5，loop 类 0.4–0.6，ambient 0.25。
   - 复用项（16、17）也写进 manifest，`"reuse_of": "system-control-loop"`，无需文件。
2. **验收自检**（完成后必须执行并在总结中给出结果表）：
   - 遍历 manifest，用 ffprobe 确认每个文件存在、可解码，打印每条的实际时长与峰值电平；
   - 确认所有 P0 无 placeholder；
   - 列出所有 placeholder 项和原因。
3. 交付总结：一张表（id / 文件 / 时长 / 来源 / 许可 / 是否占位）。

## 六、判断优先级冲突时

- 音色统一 > 单条完美：宁可整套都"80 分且同族"，不要一条 100 分但气质突兀。
- P0 必须全部有文件（允许占位标记）；P1 尽力；P2 时间不够可跳过并说明。
- 拿不准两条候选时，选更短、更干净、尾音更自然的那条。
