"""
表格合并模块 - 将处理后的表格单元格内容合并回总的HTML文件中
只替换有变更标记的单元格内容，而不是整个表格
"""
from callback.callback import callback_handler
import os
import re
from bs4 import BeautifulSoup
from global_define.constants import (
    ATTR_ORIGINAL_CONTENT, ATTR_CELL_ID, ATTR_HAS_NESTED_TABLE,
    TABLE_FILE_PREFIX, HTML_FILE_EXTENSION
)


async def merge_tables(html_path: str, extract_dir: str) -> None:
    """
    此函数不再执行表格合并操作，因为表格处理已改为直接在完整HTML上进行。
    """
    await callback_handler.output_callback("merge_tables: 表格合并功能已废弃。")
    return