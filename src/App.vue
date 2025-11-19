<template>
  <div class="app">
    <AppHeader 
      :connectionStatus="connectionStatus"
      @clear-chat="clearChat"
      @toggle-settings="toggleSettings"
    />
    <SettingsPanel 
      v-model="hideSettings"
      :ws-url="wsUrl"
      @update-ws-url="updateWsUrl"
      @connect="handleConnect"
    />
    <ChatMessages
      :connectionStatus="connectionStatus"
      :messages="messages"
      :currentTypingMessage="currentTypingMessage"
    />
    
    <ChatInput 
      :connected="connected"
      :currentTypingMessage="currentTypingMessage"
      @send-message="sendMessage"
    />
  </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import AppHeader from './components/AppHeader.vue'
    import ChatMessages from './components/ChatMessages.vue'
    import ChatInput from './components/ChatInput.vue'
    import SettingsPanel from './components/SettingsPanel.vue'
    import { useRosConnection } from './js/useRosConnection.js'

    const wsUrl = ref('ws://localhost:9090')
    const hideSettings = ref(true)
    const messages = ref([
        {
            id: Date.now(),
            type: 'ai',
            content: `
            <p>你好！我是ROS2 AI助手，可以帮你解答关于ROS2的各种问题。</p>
            <p>请先点击右上角设置按钮连接到ROS系统，然后开始提问吧！</p>
            `,
            isWelcome: true
        }
    ])
    const currentTypingMessage = ref({
        id: Date.now(),
        type: 'ai',
        content: `AI正在思考`,
        isTyping: false
    })
    const { 
    connected,
    connectionStatus,
    connect,
    sendQuestion
    } = useRosConnection(wsUrl, messages, currentTypingMessage)

    function handleConnect() {
        connect()
    }

    function updateWsUrl(newUrl) {
        wsUrl.value = newUrl
    }

    function toggleSettings() {
        hideSettings.value = !hideSettings.value
    }

    function clearChat() {
        messages.value = [
            {
                id: Date.now(),
                type: 'ai',
                content: '<p>对话已清空！有什么问题可以继续问我。</p>',
                isWelcome: true
            }
        ]
    }

    function sendMessage(question) {
        // 添加用户消息
        messages.value.push({
            id: Date.now(),
            type: 'user',
            content: `<p>${question}</p>`
        })
        
        // 发送到ROS
        sendQuestion(question)
    }
</script>