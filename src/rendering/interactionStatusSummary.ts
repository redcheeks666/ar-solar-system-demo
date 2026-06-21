import type { DebugSnapshot } from '../utils/types';

const UPDATE_INTERVAL_MS = 150;

interface StatusSummary {
  title: string;
  state: string;
  reason: string;
  params: string[];
}

export class InteractionStatusSummary {
  private lastRenderTime = 0;

  constructor(private readonly container: HTMLElement) {}

  update(snapshot: DebugSnapshot): void {
    const now = performance.now();

    if (now - this.lastRenderTime < UPDATE_INTERVAL_MS) {
      return;
    }

    this.lastRenderTime = now;
    this.render(buildStatusSummary(snapshot));
  }

  private render(summary: StatusSummary): void {
    const title = document.createElement('p');
    title.className = 'interaction-summary-title';
    title.textContent = summary.title;

    const state = document.createElement('p');
    state.className = 'interaction-summary-state';
    state.textContent = summary.state;

    const reason = document.createElement('p');
    reason.className = 'interaction-summary-reason';
    reason.textContent = `原因：${summary.reason}`;

    const params = document.createElement('p');
    params.className = 'interaction-summary-params';
    params.textContent = `核心参数：${summary.params.join('；')}`;

    this.container.replaceChildren(title, state, reason, params);
  }
}

function buildStatusSummary(snapshot: DebugSnapshot): StatusSummary {
  const whole = snapshot.wholeSystem;

  if (snapshot.cameraStatus !== 'granted') {
    return {
      title: '等待摄像头',
      state: cameraStateText(snapshot.cameraStatus),
      reason: '摄像头还没有进入可追踪状态',
      params: [
        `Camera=${snapshot.cameraStatus}`,
        `Tracking=${snapshot.trackingStatus}`,
      ],
    };
  }

  if (snapshot.trackingStatus !== 'ready') {
    return {
      title: '正在加载识别',
      state: '手势判断暂未开始',
      reason: 'MediaPipe 姿态与手部模型还没有准备好',
      params: [
        `Tracking=${snapshot.trackingStatus}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      ],
    };
  }

  if (whole.controlState === 'SolarHandleControl') {
    if (
      whole.gripHoldActive &&
      (whole.rotationIntent !== 'none' ||
        whole.releaseBlockReason === 'rotationHold' ||
        whole.releaseBlockReason === 'cuppedGrip')
    ) {
      return {
        title: '已托住，可以旋转',
        state: `旋转状态：${rotationText(whole.rotationIntent)}`,
        reason: releaseBlockText(whole.releaseBlockReason),
        params: [
          `Grip hold=${yesNo(whole.gripHoldActive)}`,
          `Rotation=${whole.rotationIntent} ${score(whole.rotationIntentScore)}`,
          `Palm up=${score(avg(whole.leftPalm.upScore, whole.rightPalm.upScore))}`,
          `Release stable=${Math.round(whole.releaseStableMs)}ms`,
        ],
      };
    }

    if (whole.collapseIntentScore >= 0.72) {
      return {
        title: '正在收起判断',
        state: '双手向内，可能进入收起',
        reason: '双手距离接近闭合阈值，收起意图正在升高',
        params: [
          `Collapse=${score(whole.collapseIntentScore)}`,
          `Distance=${nullable(snapshot.handDistance)}`,
          `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
        ],
      };
    }

    if (whole.scaleIntent !== 'none') {
      return {
        title: '已握住，可以缩放',
        state: scaleText(whole.scaleIntent),
        reason: '双手仍附着端点，手距变化正在驱动缩放意图',
        params: [
          `Scale=${whole.scaleIntent} ${score(whole.scaleIntentScore)}`,
          `Distance=${nullable(snapshot.handDistance)}`,
          `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
          `Control=${score(whole.controlConfidence)}`,
        ],
      };
    }

    return {
      title: '已握住，可以自由操控',
      state: '端点跟随双手',
      reason: '双手与左右虚拟端点匹配，整体控制置信度达标',
      params: [
        `Control=${score(whole.controlConfidence)}`,
        `Endpoints=${matchText(whole.leftEndpointMatched, whole.rightEndpointMatched)}`,
        `Grip hold=${yesNo(whole.gripHoldActive)}`,
      ],
    };
  }

  if (whole.controlState === 'ReleaseCandidate') {
    return {
      title: '正在确认松手',
      state: '端点已冻结，等待悬浮确认',
      reason: whole.releaseGestureLatched
        ? '双手张开已被接受，释放锁已开启'
        : '控制置信度降低或端点丢失，进入兜底松手候选',
      params: [
        `Release=${yesNo(whole.releaseGestureActive)}`,
        `Lock=${whole.releaseGestureLatched ? 'on' : 'off'}`,
        `Stable=${Math.round(whole.releaseStableMs)}ms`,
        `Release conf=${score(whole.releaseConfidence)}`,
      ],
    };
  }

  if (whole.controlState === 'SolarFreeHover') {
    return {
      title: '已松手，悬浮状态锁定',
      state: whole.releaseGestureLatched
        ? '等待双手先离开端点'
        : '可重新握住两端',
      reason: whole.releaseGestureLatched
        ? '释放锁仍开启，防止慢慢撤手时立刻重新粘手'
        : '端点冻结在最后位置，双手回到磁吸区即可重新控制',
      params: [
        `Lock=${whole.releaseGestureLatched ? 'on' : 'off'}`,
        `Re-grip=${score(whole.reGripConfidence)}`,
        `Reason=${whole.reGripReason}`,
      ],
    };
  }

  if (whole.controlState === 'ReGripCandidate') {
    return {
      title: '正在重新握住',
      state: '即将恢复自由操控',
      reason: reGripReasonText(whole.reGripReason),
      params: [
        `Re-grip=${score(whole.reGripConfidence)}`,
        `Reason=${whole.reGripReason}`,
        `Endpoints=${matchText(whole.leftEndpointMatched, whole.rightEndpointMatched)}`,
      ],
    };
  }

  if (whole.controlState === 'SolarClosing') {
    return {
      title: '正在收起',
      state: '双手向内合拢',
      reason: '收起意图已经稳定，未来太阳系会按手距反向收回',
      params: [
        `Collapse=${score(whole.collapseIntentScore)}`,
        `Distance=${nullable(snapshot.handDistance)}`,
        `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
      ],
    };
  }

  if (whole.controlState === 'VirtualOpeningHandle') {
    return {
      title: '正在建立双手控制',
      state: '拉开后协议已启动',
      reason: '启动手势已进入 PullArmed，正在确认左右端点控制',
      params: [
        `Startup=${snapshot.interactionState}`,
        `Control=${score(whole.controlConfidence)}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      ],
    };
  }

  if (snapshot.interactionState === 'HandsClosed') {
    return {
      title: '双手已合拢',
      state: '等待向两侧拉开',
      reason: '双手距离足够近，但还没有形成持续拉开趋势',
      params: [
        `Distance=${nullable(snapshot.handDistance)}`,
        `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PullArmed') {
    return {
      title: '已识别拉开准备',
      state: '等待整体控制接管',
      reason: '双手从合拢状态持续拉开，启动手势已成立',
      params: [
        `Distance=${nullable(snapshot.handDistance)}`,
        `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      ],
    };
  }

  return {
    title: '等待启动手势',
    state: '空场待机',
    reason: '还没有检测到稳定的双手合拢再拉开',
    params: [
      `Startup=${snapshot.interactionState}`,
      `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      `Lost hold=${snapshot.lostHandHoldActive ? 'active' : 'inactive'}`,
    ],
  };
}

function cameraStateText(status: DebugSnapshot['cameraStatus']): string {
  if (status === 'idle') {
    return '等待点击开启摄像头';
  }

  if (status === 'requesting') {
    return '正在请求摄像头权限';
  }

  return `摄像头状态：${status}`;
}

function scaleText(intent: DebugSnapshot['wholeSystem']['scaleIntent']): string {
  if (intent === 'scaleUp') {
    return '缩放状态：正在放大';
  }

  if (intent === 'scaleDown') {
    return '缩放状态：正在缩小';
  }

  return '缩放状态：保持';
}

function rotationText(
  intent: DebugSnapshot['wholeSystem']['rotationIntent'],
): string {
  if (intent === 'rotate3d') {
    return '3D 旋转';
  }

  if (intent === 'rotate2d') {
    return '2D 旋转';
  }

  return '托住保持';
}

function releaseBlockText(
  reason: DebugSnapshot['wholeSystem']['releaseBlockReason'],
): string {
  if (reason === 'rotationHold') {
    return '掌心朝上且旋转意图存在，优先按托住旋转处理';
  }

  if (reason === 'cuppedGrip') {
    return '掌心朝上且手指微弯，优先按托举握持处理';
  }

  return '双手仍在端点附近，整体控制优先';
}

function reGripReasonText(
  reason: DebugSnapshot['wholeSystem']['reGripReason'],
): string {
  if (reason === 'endpoint') {
    return '双手已重新附着精确端点';
  }

  if (reason === 'wideMagnet') {
    return '双手进入端点磁吸区，允许恢复控制';
  }

  return '重新扶住置信度正在升高';
}

function matchText(leftMatched: boolean, rightMatched: boolean): string {
  return `${leftMatched ? 'L是' : 'L否'}/${rightMatched ? 'R是' : 'R否'}`;
}

function visibleText(visible: boolean): string {
  return visible ? 'visible' : 'missing';
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function nullable(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(3);
}

function score(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(2);
}

function avg(left: number | null, right: number | null): number | null {
  if (left === null && right === null) {
    return null;
  }

  if (left === null) {
    return right;
  }

  if (right === null) {
    return left;
  }

  return (left + right) / 2;
}
