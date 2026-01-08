<template>
  <view class="chat-container" :style="containerStyle">
    <view class="chat-header">
      <view class="header-left">
        <text class="header-icon">{{ labels.headerIcon }}</text>
        <view class="header-text">
          <text class="header-title">{{ labels.headerTitle }}</text>
          <text class="header-sub">{{ labels.headerSub }}</text>
        </view>
      </view>
      <view class="header-actions">
        <view class="action-btn" @click="handleNewContext">{{ labels.clearContext }}</view>
        <view class="action-btn danger" @click="handleClearHistory">{{ labels.clearHistory }}</view>
      </view>
    </view>
    <scroll-view
      scroll-y
      class="chat-history"
      :scroll-top="scrollTop"
      scroll-with-animation
      :style="historyStyle"
    >
      <view class="msg-list">
        <view v-if="messages.length === 0" class="empty-chat">
          <text class="icon">{{ labels.botIcon }}</text>
          <text class="tip">{{ labels.emptyTip }}</text>
          <text class="starter-title" v-if="suggestions.length">{{ labels.starterTitle }}</text>
          <view class="starters" v-if="suggestions.length">
            <view v-for="q in suggestions" :key="q" class="starter-tag" @click="send(q)">
              {{ q }}
            </view>
          </view>
        </view>

        <view v-for="msg in messages" :key="msg.id">
          <view v-if="msg.role === 'divider'" class="divider-row">
            <view class="divider-line"></view>
            <text class="divider-text">{{ msg.content || labels.contextCleared }}</text>
            <view class="divider-line"></view>
          </view>
          <view v-else class="msg-item" :class="msg.role">
            <view class="avatar">
              <text v-if="msg.role === 'user'">{{ labels.userIcon }}</text>
              <text v-else>{{ labels.aiIcon }}</text>
            </view>
            <view class="bubble" :class="{ 'bubble-assistant': msg.role === 'assistant' }">
              <template v-if="msg.role === 'assistant'">
                <view
                  v-for="(block, idx) in formatBlocks(msg.content)"
                  :key="`${msg.id}-${idx}`"
                  :class="['md-block', 'md-' + block.type]"
                >
                  <text v-if="block.prefix" class="md-prefix">{{ block.prefix }}</text>
                  <text
                    v-for="(seg, sidx) in block.segments"
                    :key="`${msg.id}-${idx}-${sidx}`"
                    :class="['md-seg', seg.bold ? 'md-bold' : '']"
                  >
                    {{ seg.text }}
                  </text>
                </view>
              </template>
              <text v-else :user-select="true">{{ msg.content }}</text>
            </view>
          </view>
        </view>

        <view v-if="loading && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant')" class="msg-item assistant">
          <view class="avatar">{{ labels.aiIcon }}</view>
          <view class="bubble loading-bubble">
            <text class="dot">.</text><text class="dot">.</text><text class="dot">.</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-area" :style="inputAreaStyle">
      <view v-if="showSuggestions" class="suggestions">
        <view v-for="q in suggestions" :key="q" class="suggestion-chip" @click="send(q)">
          {{ q }}
        </view>
      </view>
      <view class="input-row">
        <input
          class="chat-input"
          v-model="inputVal"
          :placeholder="labels.inputPlaceholder"
          :cursor-spacing="cursorSpacing"
          confirm-type="send"
          @confirm="handleSend"
        />
        <button class="send-btn" @click="handleSend" :disabled="loading || !inputVal.trim()">
          {{ labels.send }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed, getCurrentInstance } from 'vue';
import type { BaziChart } from '@/models';
import * as AI from '@/services/aiService';
import type { ChatMessage } from '@/services/aiService';

const props = defineProps<{
  chart: BaziChart | null;
  profileId: string | null;
}>();

const labels = {
  botIcon: '\ud83e\udd16',
  userIcon: '\ud83d\udc64',
  aiIcon: '\ud83d\udd2e',
  headerIcon: '\u2728',
  headerTitle: '\u5929\u95ee',
  headerSub: '\u57fa\u4e8e\u516b\u5b57\u63a8\u6f14',
  emptyTip: '\u6211\u662f\u5929\u673a\u5148\u751f\uff0c\u8bf7\u95ee\u6709\u4ec0\u4e48\u53ef\u4ee5\u5e2e\u60a8\uff1f',
  starterTitle: '\u53ef\u4ee5\u4ece\u8fd9\u4e9b\u95ee\u9898\u5f00\u59cb',
  inputPlaceholder: '\u8f93\u5165\u60a8\u60f3\u95ee\u7684\u95ee\u9898...',
  send: '\u53d1\u9001',
  clearContext: '\u6e05\u4e0a\u4e0b\u6587',
  clearHistory: '\u6e05\u8bb0\u5f55',
  clearHistoryTitle: '\u786e\u8ba4\u6e05\u7a7a',
  clearHistoryConfirm: '\u786e\u5b9a\u6e05\u7a7a\u672c\u6863\u6848\u7684\u6240\u6709\u804a\u5929\u8bb0\u5f55\u5417\uff1f',
  contextCleared: '\u4e0a\u4e0b\u6587\u5df2\u6e05\u7a7a',
  contextReady: '\u5df2\u51c6\u5907\u597d\u65b0\u8bdd\u9898\uff0c\u8bf7\u7ee7\u7eed\u63d0\u95ee\u3002',
  welcome: '\u60a8\u597d\uff0c\u6211\u662f\u60a8\u7684\u4e13\u5c5e\u547d\u7406\u987e\u95ee\u201c\u5929\u673a\u5148\u751f\u201d\u3002\u60a8\u60f3\u95ee\u4ec0\u4e48\uff1f',
  needProfile: '\u8bf7\u5148\u521b\u5efa\u6863\u6848',
  aiFailPrefix: 'AI \u54cd\u5e94\u5931\u8d25: ',
  aiFailFallback: '\u62b1\u6b49\uff0c\u8fde\u63a5\u5929\u673a\u53d1\u751f\u9519\u8bef\u3002\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216 Key \u914d\u7f6e\u3002',
};

const fallbackStarters = [
  '\u6211\u4eca\u5e74\u7684\u8d22\u8fd0\u5982\u4f55\uff1f',
  '\u9002\u5408\u5f80\u54ea\u4e2a\u65b9\u5411\u53d1\u5c55\uff1f',
  '\u4eca\u5e74\u4e8b\u4e1a\u6709\u54ea\u4e9b\u673a\u4f1a\uff1f',
  '\u6709\u54ea\u4e9b\u9700\u8981\u907f\u514d\u7684\u98ce\u9669\uff1f'
];

const messages = ref<ChatMessage[]>([]);
const inputVal = ref('');
const loading = ref(false);
const scrollTop = ref(0);
const suggestions = ref<string[]>([]);
const keyboardHeight = ref(0);
const chatHeight = ref(0);
const containerHeight = ref(0);
const cursorSpacing = 16;
const hasApiKey = computed(() => !!import.meta.env.VITE_OPENAI_API_KEY);
const showSuggestions = computed(() => suggestions.value.length > 0 && !loading.value);

const historyStyle = computed(() => {
  if (!chatHeight.value) {
    return { height: '100%' };
  }
  return {
    height: `${chatHeight.value}px`
  };
});

const containerStyle = computed(() => {
  if (!containerHeight.value) return {};
  return { height: `${containerHeight.value}px` };
});

const inputAreaStyle = computed(() => ({}));

const instance = getCurrentInstance();

const updateLayout = () => {
  if (!instance || !instance.proxy) return;
  let top = 0;
  let headerHeight = 0;
  let inputHeight = 0;
  let windowHeight = 0;
  try {
    const info = uni.getSystemInfoSync();
    windowHeight = info?.windowHeight || 0;
  } catch (e) {
    windowHeight = 0;
  }
  const query = uni.createSelectorQuery().in(instance.proxy);
  query.select('.chat-container').boundingClientRect(rect => {
    top = rect?.top || 0;
  });
  query.select('.chat-header').boundingClientRect(rect => {
    headerHeight = rect?.height || 0;
  });
  query.select('.input-area').boundingClientRect(rect => {
    inputHeight = rect?.height || 0;
  });
  query.exec(() => {
    if (!windowHeight) return;
    const available = Math.max(windowHeight - top - keyboardHeight.value, 0);
    containerHeight.value = available;
    const height = available - inputHeight - headerHeight;
    chatHeight.value = Math.max(height, 120);
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = 999999;
  });
};

const getStarterQuestions = async (): Promise<string[]> => {
  if (!props.chart) {
    return [...fallbackStarters];
  }
  if (!hasApiKey.value || typeof AI.generateStarterQuestions !== 'function') {
    return [...fallbackStarters];
  }
  try {
    const starters = await AI.generateStarterQuestions(props.chart);
    if (Array.isArray(starters) && starters.length) {
      return starters.slice(0, 6);
    }
  } catch (e) {
    // ignore
  }
  return [...fallbackStarters];
};

const buildWelcomeMessage = (): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'assistant',
  content: labels.welcome,
  timestamp: Date.now()
});

const saveSession = (nextMessages: ChatMessage[], nextSuggestions: string[]) => {
  if (!props.profileId) return;
  AI.saveChatSession(props.profileId, { messages: nextMessages, suggestions: nextSuggestions });
};

const initSession = async () => {
  if (!props.profileId) {
    messages.value = [];
    suggestions.value = [];
    scrollToBottom();
    nextTick(updateLayout);
    return;
  }

  const session = AI.getChatSession(props.profileId);
  if (session && session.messages.length > 0) {
    messages.value = session.messages;
    suggestions.value = Array.isArray(session.suggestions) ? session.suggestions : [];
    if (!suggestions.value.length) {
      suggestions.value = await getStarterQuestions();
      saveSession(messages.value, suggestions.value);
    }
  } else {
    const welcome = buildWelcomeMessage();
    messages.value = [welcome];
    suggestions.value = await getStarterQuestions();
    saveSession(messages.value, suggestions.value);
  }

  scrollToBottom();
  nextTick(updateLayout);
};

const keyboardHandler = (res: any) => {
  keyboardHeight.value = res?.height || 0;
  nextTick(() => {
    updateLayout();
    if (keyboardHeight.value > 0) scrollToBottom();
  });
};

onMounted(() => {
  initSession();
  nextTick(updateLayout);
  uni.onKeyboardHeightChange(keyboardHandler);
});

onUnmounted(() => {
  try {
    uni.offKeyboardHeightChange(keyboardHandler);
  } catch (e) {
    // ignore
  }
});

watch(() => props.profileId, () => {
  initSession();
});

watch(() => props.chart, () => {
  initSession();
});

watch(() => messages.value.length, () => {
  scrollToBottom();
  nextTick(updateLayout);
});

watch(() => suggestions.value.length, () => {
  nextTick(updateLayout);
});

type RenderSegment = { text: string; bold?: boolean };
type RenderBlock = { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'spacer'; segments: RenderSegment[]; prefix?: string };

const BULLET_PREFIX = '\u2022 ';
const H2_PREFIX = '\u25cf ';
const H3_PREFIX = '\u25e6 ';

const parseSegments = (line: string): RenderSegment[] => {
  const segments: RenderSegment[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ text: match[1], bold: true });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) });
  }
  if (!segments.length) {
    segments.push({ text: line });
  }
  return segments;
};

const formatBlocks = (content: string): RenderBlock[] => {
  const raw = AI.splitChatReply(content).reply || '';
  const lines = raw.split(/\r?\n/);
  const blocks: RenderBlock[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      if (blocks.length && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer', segments: [] });
      }
      return;
    }

    let type: RenderBlock['type'] = 'p';
    let text = line;
    let prefix = '';

    if (/^###\s+/.test(line)) {
      type = 'h3';
      text = line.replace(/^###\s+/, '');
      prefix = H3_PREFIX;
    } else if (/^##\s+/.test(line)) {
      type = 'h2';
      text = line.replace(/^##\s+/, '');
      prefix = H2_PREFIX;
    } else if (/^#\s+/.test(line)) {
      type = 'h1';
      text = line.replace(/^#\s+/, '');
    } else if (/^[-*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)) {
      type = 'li';
      text = line.replace(/^[-*]\s+/, '').replace(/^\d+[\.)]\s+/, '');
      prefix = BULLET_PREFIX;
    }

    const segments = parseSegments(text);
    blocks.push({ type, segments, prefix });
  });

  return blocks;
};

const send = (txt: string) => {
  inputVal.value = txt;
  handleSend();
};

const handleSend = async () => {
  const txt = inputVal.value.trim();
  if (!txt || loading.value) return;

  if (!props.chart || !props.profileId) {
    uni.showToast({ title: labels.needProfile, icon: 'none' });
    return;
  }

  const userMsg: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: txt,
    timestamp: Date.now()
  };
  messages.value.push(userMsg);
  inputVal.value = '';
  suggestions.value = [];
  loading.value = true;
  scrollToBottom();

  saveSession(messages.value, suggestions.value);

  try {
    const history = [...messages.value];
    const botId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: botId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    messages.value.push(aiMsg);
    scrollToBottom();

    const result = await AI.streamChatMessage(history, props.chart, txt, (chunk: string) => {
      const last = messages.value[messages.value.length - 1];
      if (last && last.id === botId) {
        last.content += chunk;
        messages.value = [...messages.value];
        scrollToBottom();
      }
    });

    const last = messages.value[messages.value.length - 1];
    if (last && last.id === botId && result) {
      last.content = result.fullReply || '';
      messages.value = [...messages.value];
    }
    suggestions.value = result?.suggestions?.length ? result.suggestions : [...fallbackStarters];
    saveSession(messages.value, suggestions.value);
  } catch (e: any) {
    uni.showToast({ title: labels.aiFailPrefix + (e?.message || ''), icon: 'none' });
    messages.value.push({
      id: Date.now().toString(),
      role: 'assistant',
      content: labels.aiFailFallback,
      timestamp: Date.now()
    });
    suggestions.value = [...fallbackStarters];
    saveSession(messages.value, suggestions.value);
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handleClearHistory = () => {
  if (!props.profileId || !props.chart) return;
  uni.showModal({
    title: labels.clearHistoryTitle,
    content: labels.clearHistoryConfirm,
    success: async (res) => {
      if (!res.confirm) return;
      AI.clearChatSession(props.profileId);
      const welcome = buildWelcomeMessage();
      messages.value = [welcome];
      suggestions.value = await getStarterQuestions();
      saveSession(messages.value, suggestions.value);
      scrollToBottom();
      nextTick(updateLayout);
    }
  });
};

const handleNewContext = async () => {
  if (!props.profileId || !props.chart) return;
  const divider: ChatMessage = {
    id: `divider-${Date.now()}`,
    role: 'divider',
    content: labels.contextCleared,
    timestamp: Date.now()
  };
  const notice: ChatMessage = {
    id: `context-${Date.now() + 1}`,
    role: 'assistant',
    content: labels.contextReady,
    timestamp: Date.now() + 1
  };
  messages.value = [...messages.value, divider, notice];
  suggestions.value = await getStarterQuestions();
  saveSession(messages.value, suggestions.value);
  scrollToBottom();
  nextTick(updateLayout);
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f1f5f9;
  border-radius: 20rpx;
  overflow: hidden;
  flex: 1;
}

.chat-header {
  background: #fff;
  padding: 16rpx 20rpx;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.header-left { display: flex; align-items: center; gap: 12rpx; }
.header-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}
.header-text { display: flex; flex-direction: column; gap: 4rpx; }
.header-title { font-size: 28rpx; font-weight: bold; color: #1e293b; }
.header-sub { font-size: 20rpx; color: #94a3b8; }
.header-actions { display: flex; gap: 12rpx; }
.action-btn {
  font-size: 22rpx;
  color: #64748b;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
}
.action-btn.danger { color: #ef4444; background: #fee2e2; }

.chat-history {
  flex: 1;
  min-height: 0;
  padding: 24rpx;
}

.msg-list {
  padding-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 24rpx 40rpx;
  color: #94a3b8;
}

.icon { font-size: 80rpx; margin-bottom: 24rpx; }
.tip { font-size: 28rpx; margin-bottom: 24rpx; text-align: center; }
.starter-title { font-size: 22rpx; color: #94a3b8; margin-bottom: 16rpx; }
.starters { display: flex; gap: 16rpx; flex-wrap: wrap; justify-content: center; }
.starter-tag {
  background: #fff;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.msg-item { display: flex; gap: 16rpx; margin-bottom: 16rpx; }
.msg-item.user { flex-direction: row-reverse; }

.divider-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 16rpx 0;
  opacity: 0.7;
}
.divider-line { flex: 1; height: 1px; background: #e2e8f0; }
.divider-text { font-size: 20rpx; color: #94a3b8; }

.avatar {
  width: 64rpx;
  height: 64rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  border: 1px solid #e2e8f0;
}
.msg-item.user .avatar { background: #eff6ff; }
.msg-item.assistant .avatar { background: #f5f3ff; }

.bubble {
  max-width: 65%;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
  background: #fff;
  color: #334155;
  border: 1px solid #e2e8f0;
}
.bubble-assistant { padding: 16rpx 20rpx; }
.msg-item.user .bubble {
  background: #7c3aed;
  color: #fff;
  border-color: #7c3aed;
  border-top-right-radius: 4rpx;
}
.msg-item.assistant .bubble { border-top-left-radius: 4rpx; }

.loading-bubble { display: flex; gap: 4rpx; }
.dot { animation: pulse 1s infinite; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

.input-area {
  background: #fff;
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  transition: transform 0.2s ease;
}

.suggestions { display: flex; flex-wrap: wrap; gap: 12rpx; }
.suggestion-chip {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.input-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.chat-input {
  flex: 1;
  background: #f8fafc;
  border-radius: 40rpx;
  font-size: 26rpx;
  border: 1px solid #e2e8f0;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.send-btn {
  background: #7c3aed;
  color: #fff;
  border-radius: 40rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  height: 72rpx;
  line-height: 72rpx;
}
.send-btn[disabled] { opacity: 0.5; background: #94a3b8; }

.md-block { margin-bottom: 10rpx; }
.md-spacer { height: 10rpx; }
.md-h1 { border-bottom: 1px solid #e2e8f0; padding-bottom: 6rpx; }
.md-h1 text { font-size: 28rpx; font-weight: bold; color: #7c3aed; }
.md-h2 { display: flex; align-items: center; gap: 6rpx; }
.md-h2 text { font-size: 26rpx; font-weight: bold; color: #1e293b; }
.md-h3 { display: flex; align-items: center; gap: 6rpx; }
.md-h3 text { font-size: 24rpx; font-weight: bold; color: #475569; }
.md-p text, .md-li text { font-size: 24rpx; color: #475569; line-height: 1.6; }
.md-li { padding-left: 6rpx; }
.md-prefix { color: #a855f7; font-size: 22rpx; margin-right: 4rpx; }
.md-seg { font-size: 24rpx; color: inherit; }
.md-bold { font-weight: 700; color: #6d28d9; }
</style>
