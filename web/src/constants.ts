// WebSocket消息类型常量
export const WS_MESSAGE_TYPE = {
  CLIENT_REGISTER: 0,       // 通知client名称
  DOC_PROCESS_START: 1,     // 通知处理文档
  DOC_PROCESS_PROGRESS: 2,  // 通知处理文档进度
  DOC_SAVE_START: 3,        // 通知保存文档
  DOC_SAVE_COMPLETE: 4      // 通知保存文档完成
};