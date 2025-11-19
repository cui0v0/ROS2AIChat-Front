<template>
    <!-- 连接设置面板 -->
    <div ref="panelRef" class="settings-panel liquid-glass apple-radius" :class="{ 'hidden': modelValue }" :style="cssVars">
      <div class="settings-content">
        <div class="settings-header">
          <label for="ws-url">WebSocket地址</label>
          <button @click="$emit('update:modelValue', true)" class="close-btn" title="关闭">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="input-group">
          <input
            id="ws-url" 
            :value="wsUrl" 
            @input="$emit('update-ws-url', $event.target.value)"
            placeholder="ws://localhost:9090" class="apple_radius"
          />
          <button @click="handleConnect" class="connect-btn apple_radius">
            <i class="fas fa-plug"></i>
            <span>连接</span>
          </button>
        </div>
      </div>
    </div>
</template>

<script setup>
import {ref,computed,watch,onMounted} from 'vue'
const props = defineProps({
  modelValue: {  // 改为使用v-model
    type: Boolean,
    required: true
  },
  wsUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'update-ws-url', 'connect'])

function handleConnect() {
  emit('connect')
  // 连接成功后可以选择自动关闭面板
  // emit('update:modelValue', false)
}

const panelRef = ref(null);
const targetX = ref(0);
const targetY = ref(0);

function updateTargetPosition(){
  const settingBtn = document.querySelector('.action-btn.settings')
  if(settingBtn && panelRef.value){
    const btnRect = settingBtn.getBoundingClientRect();
    const panelRect = panelRef.value.getBoundingClientRect();
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    targetX.value = btnRect.left + btnRect.width / 2 - centerX
    targetY.value = btnRect.top + btnRect.height / 2 - centerY
  }
}

const cssVars = computed(() => ({
  '--target-x': `${targetX.value}px`,
  '--target-y': `${targetY.value}px`
}))

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    updateTargetPosition();
  }
})

onMounted(() => {
  updateTargetPosition();
  window.addEventListener('resize', updateTargetPosition);
})

</script>