import { ref, reactive } from 'vue'
import ROSLIB from 'roslib'

const error_infos = [
  '连接失败！请检查：<br>• rosbridge是否运行<br>• 端口9090是否开放<br>• 网络连接是否正常',
  '连接失败！请检查ROS系统是否正常启动。',
  '连接失败！请检查端口9090是否开放。',
  '连接失败！请检查网络连接是否正常。',
  '服务器繁忙，请稍后再试。',
  '响应超时，请检查ROS系统状态或重试。'
]
export function useRosConnection(wsUrl, messages, currentTypingMessage) {
  // 状态变量
  const connected = ref(false)
  const connecting = ref(false)
  const ros = ref(null)
  const webQuestionTopic = ref(null)
  const webAnswerTopic = ref(null)
  const pendingQueue = ref([])
  
  const connectionStatus = reactive({
    status: 'disconnected',
    text: '未连接'
  })

  // 工具函数
  function updateConnectionStatus(status, text) {
    connectionStatus.status = status
    connectionStatus.text = text
  }

  function addMessage(content, type = 'ai', isTyping = false,status) {
    if (isTyping) {
      if(content.length > 0) {
        currentTypingMessage.value = reactive({
          id: Date.now(),
          type: 'ai',
          content: content,
          isTyping: true
        })
      }else{
        currentTypingMessage.value = reactive({
          id: Date.now(),
          type: 'ai',
          content: 'AI正在思考',
          isTyping: true
        })
      }
      return currentTypingMessage.value
    }else{
      const contentStr = String(content || '').trim()
      if(contentStr) {
        const message = reactive({
          id: Date.now(),
          type: type,
          status: status ? status : 'success',
          content: contentStr.startsWith('<') ? contentStr : `<p>${contentStr}</p>`
        })
        messages.value.push(message)
        status === 'error' ? currentTypingMessage.value = null : ''
        return message
      }
    }
  }

  function typewriterEffect(messageObj, text, speed = 50, delay = 100) {
    setTimeout(() => {
      return new Promise((resolve) => {
        let i = 0
        const interval = setInterval(() => {
          if (i < text.length) {
            // 直接修改响应式对象的content属性，将换行符转换为HTML换行标签
            const currentText = text.substring(0, i + 1).replace(/\n/g, '<br>')
            messageObj.content = currentText
            i++
          } else {
            currentTypingMessage.value = null
            addMessage(messageObj.content, messageObj.type)
            clearInterval(interval)
            resolve()
          }
        }, speed)
      })
    }, delay)
  }
  
  function errorgenerate() {
    const randomIndex = Math.floor(Math.random() * error_infos.length)
    switch(randomIndex) {
      case 1:
        updateConnectionStatus('error', '连接失败')
        break
      case 3:
        updateConnectionStatus('error', '连接失败')
        break
      case 4:
        updateConnectionStatus('error', '连接断开')
        break
    }
    return error_infos[randomIndex]
  }
  // ROS连接函数
  function connect() {
    const url = wsUrl.value.trim()
    if (!url) return

    if (connecting.value || connected.value) return
    
    connecting.value = true
    updateConnectionStatus('connecting', '连接中...')

    ros.value = new ROSLIB.Ros({ url })

    ros.value.on('connection', function() {
      connecting.value = false
      connected.value = true
      updateConnectionStatus('connected', '已连接')
      
      console.log('[ros2-qa] WebSocket connected successfully')
      
      // 添加连接成功消息
      addMessage('成功连接到ROS系统！现在可以开始提问了。')

      // QoS配置
      const qosOptions = { 
        qos: { 
          durability: 'transient_local', 
          reliability: 'reliable', 
          history: 'keep_last', 
          depth: 10 
        } 
      }

      // 创建话题
      webQuestionTopic.value = new ROSLIB.Topic({ 
        ros: ros.value, 
        name: '/web_question_input', 
        messageType: 'std_msgs/String',
        ...qosOptions
      })

      webAnswerTopic.value = new ROSLIB.Topic({ 
        ros: ros.value, 
        name: '/web_answer_output', 
        messageType: 'std_msgs/String',
        ...qosOptions
      })

      webAnswerTopic.value.subscribe(function(msg) { 
        const timestamp = new Date().toISOString()
        console.log(`[ros2-qa] ${timestamp} received answer:`, msg.data)
        
        const answer = msg.data || '抱歉，我现在无法回答这个问题。'
        const message = addMessage('', 'ai', true)
        currentTypingMessage.isTyping = true
        // messages.value.length < 10 ? setTimeout(() => {
        //   messages.value.length < 10 ? addMessage(errorgenerate(), 'ai', false, 'error') : ''
        // }, Math.random(3, 8) * 1000) 
        // : 
        // setTimeout(()=>{
        //   messages.value.length > 10 && messages.value.length <= 12 ? updateConnectionStatus('connected', '已连接') : "";
        //   messages.value.length > 10 && messages.value.length <= 12 ? addMessage('与ROS的连接已恢复', 'ai', false) : '';
        //   messages.value.length > 10 ? typewriterEffect(message, answer, 30, 400) : '';
        // },5000);
        // typewriterEffect(message, answer, 30)
        typewriterEffect(message, answer, 30, 400)
      })

      // 发送待处理的消息
      while (pendingQueue.value.length > 0 && webQuestionTopic.value) {
        const text = pendingQueue.value.shift()
        try { 
          webQuestionTopic.value.publish(new ROSLIB.Message({ data: text }))
          currentTypingMessage.value = addMessage('', 'ai', true)
        } catch (e) { 
          console.error('flush publish failed', e) 
        }
      }
    })

    ros.value.on('error', function(error) {
      connecting.value = false 
      connected.value = false
      updateConnectionStatus('error', '连接失败')
      
      console.error('[ros2-qa] WebSocket error:', error)
      addMessage('连接失败！请检查：<br>• rosbridge是否运行<br>• 端口9090是否开放<br>• 网络连接是否正常', 'ai', false, 'error')
    })

    ros.value.on('close', function() {
      connecting.value = false 
      connected.value = false
      updateConnectionStatus('error', '连接断开')
      
      console.log('[ros2-qa] WebSocket closed')
      addMessage('与ROS系统的连接已断开。', 'ai', false, 'error')
    })
  }

  // 发送问题函数
  function sendQuestion(questionText) {
    if (!questionText?.trim()) return

    if (!connected.value || !webQuestionTopic.value) {
      pendingQueue.value.push(questionText)
      addMessage('消息已加入队列，等待连接建立后发送...')
      return
    }

    try {
      webQuestionTopic.value.publish(new ROSLIB.Message({ data: questionText }))
      console.log('[ros2-qa] sent question:', questionText)
      
      // 添加打字指示器
      currentTypingMessage.value = addMessage('', 'ai', true)
      
      const messages_length = messages.value.length // 触发视图更新
      // 20秒后如果没有回复，显示超时消息
      setTimeout(() => {
        if (currentTypingMessage.content<5) {
          currentTypingMessage.value = null
          addMessage('响应超时，请检查ROS系统状态或重试。', 'ai', false, 'error')
        }
      }, 20000)
      
    } catch (e) {
      console.error('[ros2-qa] send failed:', e)
      addMessage('发送失败，请重试。', 'ai', false, 'error')
    }
  }

  return {
    connected,
    connecting,
    connectionStatus,
    currentTypingMessage,
    connect,
    sendQuestion
  }
}