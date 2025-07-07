"""
全局常量定义
"""

# 用于标记斜线分割单元格的HTML属性
ATTR_DIAGONAL_SPLIT_TYPE = 'data-diagonal-split-type'

# 用于标记单元格是否包含内嵌表格的HTML属性
ATTR_HAS_NESTED_TABLE = 'data-has-nested-table'

# 用于标记表格单元格唯一ID的HTML属性
ATTR_CELL_ID = 'data-cell-id'

# 用于存储单元格原始内容的HTML属性
ATTR_ORIGINAL_CONTENT = 'data-original-content'

# WebSocket消息类型常量
WS_MESSAGE_TYPE = {
    'CLIENT_REGISTER': 0,       # 通知client名称
    'DOC_PROCESS_START': 1,     # 通知处理文档
    'DOC_PROCESS_PROGRESS': 2,  # 通知处理文档进度
    'DOC_SAVE_START': 3,        # 通知保存文档
    'DOC_SAVE_COMPLETE': 4      # 通知保存文档完成
}