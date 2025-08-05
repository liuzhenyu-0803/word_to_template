import os

# --- 路径和目录 ---
# 项目根目录
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# document目录相关
DOCUMENT_DIR = os.path.join(PROJECT_DIR, "document")
TEST_DOCUMENTS_DIR = os.path.join(DOCUMENT_DIR, "test_documents")
EXTRACT_DIR = os.path.join(DOCUMENT_DIR, "document_extract")
UNZIP_DIR = os.path.join(DOCUMENT_DIR, "unzip")
KEY_DESCRIPTIONS_DIR = os.path.join(DOCUMENT_DIR, "key_descriptions")
PLACEHOLDER_IMAGES_DIR = os.path.join(DOCUMENT_DIR, "placeholder_images")

# 图片映射文件
IMAGE_MAP_FILE_NAME = "image_map.json"
IMAGE_MAP_PATH = os.path.join(EXTRACT_DIR, IMAGE_MAP_FILE_NAME)

# 图片占位符映射文件
IMAGE_PLACEHOLDER_MAP_FILE_NAME = "image_placeholder_map.json"
IMAGE_PLACEHOLDER_MAP_PATH = os.path.join(EXTRACT_DIR, IMAGE_PLACEHOLDER_MAP_FILE_NAME)

# --- 文件名和路径 ---
DEFAULT_DOC_PATH = os.path.join(TEST_DOCUMENTS_DIR, "报告1.docx")
# 存放由 data: 图片转换成的 png 文件的目录

DEFAULT_HTML_PATH = os.path.join(DOCUMENT_DIR, "document.html")
DEFAULT_TEMPLATE_DOC_PATH = os.path.join(DOCUMENT_DIR, "template.docx")

# Word文档内部结构相关常量
WORD_INTERNAL_DIR = "word"
MEDIA_INTERNAL_DIR = "media"
DOCUMENT_XML_FILE_NAME = "document.xml"

# 表格提取相关常量
TABLE_FILE_PREFIX = "table_"
HTML_FILE_EXTENSION = ".html"

# 客户端和服务器相关常量
WS_SERVER_URL = "ws://localhost:3000"
CLIENT_NAME = "tool_client"
HTTP_SERVER_URL = "http://localhost:3000"
TEMPLATE_UPLOAD_FILENAME = "template.docx"
TEMPLATE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

"""
全局常量定义
"""

# 用于标记斜线分割单元格的HTML属性
ATTR_DIAGONAL_SPLIT_TYPE = 'data-diagonal-split-type'

# 用于标记单元格是否包含内嵌表格的HTML属性
ATTR_HAS_NESTED_TABLE = 'data-has-nested-table'
# 用于标记单元格是否包含图片的HTML属性
ATTR_HAS_IMG = 'data-has-img'

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