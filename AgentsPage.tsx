// 开始聊天
const startChat = async (agentId: string) => {
  try {
    // 获取智能体信息
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      console.error('找不到智能体:', agentId);
      return;
    }

    // 检查是否已存在相同智能体的会话
    let existingSessions = [];
    try {
      const sessions = chatService.getSessions();
      // 确保sessions是一个数组
      existingSessions = Array.isArray(sessions) ? sessions : [];
      if (!Array.isArray(sessions)) {
        console.warn('chatService.getSessions()未返回数组:', sessions);
      }
    } catch (error) {
      console.warn('获取会话列表失败:', error);
      existingSessions = [];
    }
    
    // 使用可选链和安全的查找方式
    const existingSession = existingSessions.length > 0 ? 
      existingSessions.find?.(s => s.agentId === agentId) : undefined;
    
    let sessionId;
    
    if (existingSession) {
      // 如果存在相同智能体的会话，使用它
      sessionId = existingSession.id;
      console.log("使用现有会话:", sessionId);
    } else {
      // 创建新会话
      const session = await chatService.createSession(agent.name, agentId);
      sessionId = session.id;
      console.log("创建新会话:", sessionId);
    }
    
    // 发送一个自定义事件，让Workspace组件知道需要打开特定会话
    // 确保在导航前先发送事件
    console.log("发送open-session事件，sessionId:", sessionId);  
    const event = new CustomEvent('open-session', { 
      detail: { sessionId: sessionId } 
    });
    window.dispatchEvent(event);
    
    // 直接导航到工作区聊天页面
    navigate(`/workspace/chat?sessionId=${sessionId}`);
  } catch (error) {
    console.error('创建会话失败:', error);
    alert(`创建会话失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}; 