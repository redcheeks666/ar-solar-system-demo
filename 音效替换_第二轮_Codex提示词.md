# 任务：音效第二轮替换（修复第一轮的风格错位问题）

第一轮下载的音效整体听感不协调，经过声学分析定位了原因。本轮任务是**只替换指定的问题条目**，其余文件一律不动。规则比第一轮更严格，且每条有可程序化验收的数值标准。

---

## 一、第一轮的三个问题（本轮必须避免）

1. **音色世界错位（最主要）**：25 条里 19 条来自同一作者 SoundShelfStudio 的 UI 音效包，16 个文件标题以 "UI" 开头。结果是：徒手撕开宇宙、抓住星球这类**物理/能量动作**，反馈的却是**手机软件按键哔声**（如 system-grab 用了 "UI Target Locked Beep"，focus-grab 用了 "UI Holographic Menu Open"）。而大事件又用电影预告片素材，两个世界拼在一起，听感割裂。
2. **包络方向错误**：summon-charge（蓄力音）峰值在 0.09s 然后衰减——是"打击"的形状，不是"由弱到强蓄力"的形状。ui-hold-cancel 是上行音，取消应该下行。原 summon-open-impact 冲击点在文件 1.8s 处（已由人工重裁修复，本轮不要动它）。
3. **循环件质地错误**：system-control-loop 频谱重心仅 68Hz（纯超低频，笔记本喇叭上几乎听不见）；ui-hold-loop 是 1 秒一次的上行 ping 循环（听感=哔、哔、哔）；system-close-loop 是有强弱起伏的 whoosh 做循环（一阵一阵地鼓包）。

## 二、本轮新增硬性规则

1. **分层禁令**：手势/物理层音效（下表除 ui-* 和 system-ready 外的全部）**禁止**使用标题或描述含 `UI / interface / menu / button / app / notification / beep / bleep / ping / chime / click`（click 仅 pinch-click 例外，且它不换）的素材。这一层只允许噪声/气流/能量质地：whoosh、rumble、hum、swell、shimmer、air、wind、suction、thud。
2. **来源多样性**：最终整套资产中，**同一作者最多 4 个文件**。SoundShelfStudio 已占 19 条，所以本轮替换素材必须来自其他作者/其他包（Pixabay 的 cinematic / nature / ambient 分类、Mixkit、有凭据时 Freesound CC0）。
3. **每条下载 2 个候选**：都放进 `assets-src/sfx/raw/`（第二候选命名 `<id>-alt-original.<ext>`），跑验收脚本后选指标更优的一条产出正式文件。
4. **只动替换清单里的条目**：其余文件、manifest 其余条目一律不改。替换条目在 manifest 中更新全部来源字段并加 `"revision": 2`。
5. 许可要求与第一轮相同（免费可商用，记录来源）。

## 三、保留清单（不要动）

`summon-open-impact`（已人工重裁）、`summon-cancel`、`summon-pull-loop`、`system-release`、`pinch-click`、`planet-focus-enter`、`focus-return-wave`、`ui-hold-success`、`system-ready`，以及复用条目 `focus-release`（跟随 system-release）。

## 四、替换清单（11 条必换 + 2 条复查）

每条给出：为什么换｜要什么｜搜索关键词｜数值验收（用第六节脚本测）。

**1. `summon-charge`** — 换因：包络反了（峰在开头），且是 UI 质感。
- 要：由弱到强的能量 swell，低中频为主，像深吸一口气蓄力。reverse cymbal 类素材非常合适。
- 搜：`riser swell short` / `reverse cymbal` / `energy swell` / `cinematic riser 1 second`
- 验收：时长 0.8–2s；**峰值时间在文件后 40%**；频谱重心 300–1500Hz。

**2. `system-grab`** — 换因："Target Locked Beep"，高频哔声（重心 2431Hz），抓握动作要的是低频踏实感。
- 要：低沉短促的 thud/pulse，像手按进能量场，几乎没有高频。
- 搜：`deep thud soft` / `bass pulse` / `low impact short` / `sub hit soft`
- 验收：时长 0.15–0.5s；峰值在前 50ms；频谱重心 <900Hz。

**3. `focus-grab`** — 换因："Holographic Menu Open" 菜单音（重心 3198Hz），应是"托起星球"的能量感。
- 要：与 system-grab 同族但更亮一层：低频 pulse + 一点能量泛音。
- 搜：`energy pulse hit` / `whoosh hit short` / `force grab` / `low whoosh thump`
- 验收：时长 0.25–0.8s；峰值在前 80ms；频谱重心 <1400Hz。

**4. `planet-select`** — 换因："Navigation Route Confirmed" 是旋律型确认音，规范明确禁止。
- 要：落锁感 = 短促低频 thunk + 轻微 shimmer 尾光，非旋律。
- 搜：`impact shimmer small` / `lock thud` / `cinematic hit soft short` / `pulse hit reverb`
- 验收：时长 0.3–0.9s；峰值在前 100ms；频谱重心 <1500Hz。

**5. `planet-hover`** — 换因：UI Focus 哔声；此音触发频率最高，最影响整体气质。
- 要：极轻的气感 shimmer / 微光拂过，音量天生小，重复听不烦。
- 搜：`airy shimmer soft` / `glass shimmer gentle` / `soft air whoosh tiny` / `sparkle subtle`
- 验收：时长 0.2–0.8s；处理后整文件 RMS -20±2dB（比其他 one-shot 低一档）。

**6. `planet-return-land`** — 换因："Mission Complete Chime" 游戏通关感，规范明确禁止。
- 要：星球归位的轻落定：柔和低频 thud + 短 shimmer，分量明显小于 summon-open-impact。
- 搜：`soft landing thud` / `gentle impact reverb` / `object settle` / `low thud soft reverb`
- 验收：时长 0.4–1.5s；峰值在前 100ms；频谱重心 <1200Hz；标题不含 chime/complete/success。

**7. `system-close-end`** — 换因："UI Modal Close Soft Tap" 是界面弹窗音，这里是宇宙收拢完成。
- 要：气流收拢 + 轻闷响，"呼——嗒"归于安静，与 summon-open-impact 呼应但小两号。
- 搜：`air suction end` / `reverse whoosh impact` / `implosion soft` / `vacuum thump`
- 验收：时长 0.5–1.5s；峰值在前 150ms；频谱重心 <800Hz。

**8. `system-control-loop`** — 换因：重心 68Hz 纯超低频，普通设备上近乎无声。
- 要：平稳能量场 hum，低频为底但要有 200–800Hz 的"身体"，笔记本喇叭可闻。
- 搜：`energy field hum loop` / `hum loop sci-fi` / `hover drone loop` / `force field loop`
- 验收：可无缝循环 3–8s；**频谱重心 150–1000Hz**；以 500ms 窗计算 RMS，窗间波动 <3dB（平稳无起伏）。
- 注意：复用条目 `focus-control-loop` 跟随此文件，manifest 同步更新。

**9. `system-close-loop`** — 换因：单发 whoosh 做循环，强弱鼓包。
- 要：平稳的吸入/风洞质地，有持续"向内收"的流动感而无单次事件感。
- 搜：`wind tunnel loop` / `air flow loop` / `suction loop` / `smooth wind loop`
- 验收：可无缝循环 2–5s；频谱重心 400–2000Hz；500ms 窗 RMS 波动 <4dB。

**10. `ui-hold-loop`** — 换因：1 秒上行 ping 循环，听感是重复哔声。
- 要：平滑的充能/扫描质地，连续无瞬态，能随时被打断。
- 搜：`smooth charging loop` / `energy build loop` / `tension drone short loop` / `scanner hum`
- 验收：可循环 0.8–3s；峰值与 RMS 差 <14dB（无尖锐瞬态）；500ms 窗 RMS 波动 <4dB。
- 注意：复用条目 `focus-dwell-loop` 跟随此文件，manifest 同步更新。

**11. `ui-hold-cancel`** — 换因：上行音且峰值在结尾，方向完全反了。
- 要：极轻的下行 blip / 能量小幅泄掉。
- 搜：`power down short soft` / `descending blip` / `deactivate subtle` / `energy down small`
- 验收：时长 0.1–0.5s；峰值在前 30%；文件后半段 RMS 低于前半段（下行渐弱）。

**12. `comet-flyby`（P2，复查）** — 现用 "Hyper-Drive Spaceship Flyby"，引擎味重、峰值贴文件头，没有"由远及近再远去"的形状。时间允许就换。
- 搜：`whoosh pass by distant` / `wind flyby soft` / `airy swoosh pass`
- 验收：时长 1.5–4s；**峰值时间在文件中段 20%–70% 区间**（先近后远）。

**13. `ambient-solar-loop`（P2，复查）** — 来源标题含 "musical"。判断：若素材含可辨的旋律线/和弦进行则替换，纯 drone/pad 质地则保留。
- 搜（若需替换）：`space drone dark loop` / `deep space atmosphere` / `nebula ambience loop`
- 验收：30–60s 无缝循环；标题不含 melody/musical/song/chord。

## 五、响度统一（处理阶段执行）

处理流程沿用第一轮（裁静音、44.1kHz、one-shot mono mp3 320k、循环 wav、边缘淡化）。响度改为按整文件 RMS 对齐（用第六节脚本的 rms 列核对）：

| 类别 | RMS 目标 |
|---|---|
| impact 类（return-land、close-end） | -13±2 dB |
| 常规确认/抓握 one-shot | -16±2 dB |
| hover / cancel 类 | -20±2 dB |
| 循环件 | -18±2 dB |

## 六、验收脚本（必须运行，结果表附在总结里）

对 `public/assets/solar/sfx/` 全目录跑以下脚本，替换条目逐项核对第四节的数值标准；未达标就换第二候选或重新搜索，不允许"下载了就算过"。

```python
import subprocess, numpy as np, os
SFX = "public/assets/solar/sfx"   # 从项目根目录运行
def load(path):
    p = subprocess.run(["ffmpeg","-v","quiet","-i",path,"-f","f32le","-ac","1","-ar","44100","-"],
                       capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32)
print(f"{'file':<28}{'dur':>6}{'peak':>7}{'rms':>7}{'tPeak':>7}{'centroid':>9}{'winRMSvar':>10}")
for f in sorted(os.listdir(SFX)):
    x = load(os.path.join(SFX,f))
    if len(x)==0: continue
    dur=len(x)/44100; peak=np.max(np.abs(x))
    t_peak=np.argmax(np.abs(x))/44100
    rms=20*np.log10(np.sqrt(np.mean(x**2))+1e-12)
    n=2048; win=np.hanning(n); cents=[]
    for i in range(0,len(x)-n,1024):
        sp=np.abs(np.fft.rfft(x[i:i+n]*win))
        if sp.sum()<1e-6: continue
        cents.append((sp*np.fft.rfftfreq(n,1/44100)).sum()/sp.sum())
    cent=np.median(cents) if cents else 0
    w=22050  # 500ms
    wr=[20*np.log10(np.sqrt(np.mean(x[i:i+w]**2))+1e-12) for i in range(0,max(1,len(x)-w),w)]
    var=(max(wr)-min(wr)) if len(wr)>1 else 0
    print(f"{f:<28}{dur:>6.2f}{20*np.log10(peak+1e-12):>7.1f}{rms:>7.1f}{t_peak:>7.2f}{cent:>9.0f}{var:>10.1f}")
```

判读对照：`tPeak` 对应"峰值时间"要求；`centroid` 对应频谱重心；`winRMSvar` 对应循环平稳度；`rms` 对应第五节响度表。

## 七、交付

1. 替换后的文件（覆盖同名文件，扩展名规则同第一轮）。
2. 更新 manifest：替换条目更新 `source_title / source_url / author / duration_s`，加 `"revision": 2`；两个复用条目同步。
3. 总结表：id｜新来源标题｜作者｜验收数值是否全部达标（逐项列出实测值）。
4. 确认最终整套中单一作者文件数 ≤4（SoundShelfStudio 保留条目除外，它们不新增）。
