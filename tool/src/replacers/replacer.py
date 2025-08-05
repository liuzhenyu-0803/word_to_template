"""
Word文档匹配器 - 封装文档元素匹配功能
调用专门的匹配器模块完成实际工作
"""
from callback.callback import callback_handler

import os
# 使用绝对导入
from . import table_replacer # 确保table_matcher被正确导入
from . import image_replacer # 导入图片替换器
from extractors.extractor import extract_document
from global_define import constants

async def replace_document(table_html_strings: list[str]):
    """
    对HTML文件中的文档元素进行匹配分析和替换。
    """
    html_file_path = constants.DEFAULT_HTML_PATH
    # 表格关键字描述文件路径
    table_key_description_path = os.path.join(constants.KEY_DESCRIPTIONS_DIR, "table_key_description.txt")

    # 处理图片 - 调用image_replacer模块的replace_images函数
    await image_replacer.replace_images()
    
    # 处理表格 - 调用table_replacer模块的replace_tables函数
    await table_replacer.replace_tables(html_file_path, table_html_strings, table_key_description_path)
