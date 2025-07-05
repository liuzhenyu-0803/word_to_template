"""
Word文档匹配器 - 封装文档元素匹配功能
调用专门的匹配器模块完成实际工作
"""
from callback.callback import callback_handler

import os
# 使用绝对导入
from . import table_replacer # 确保table_matcher被正确导入

async def replace_document(extract_files: list[str], key_descriptions_dir: str):
    """
    对提取的文档元素进行匹配分析
    
    参数:
        extract_files: 要进行语义识别的提取文件列表
        key_descriptions_dir: 关键字描述文件所在目录
    """
    # 检查文件列表是否为空
    if not extract_files:
        await callback_handler.output_callback("错误：提取文件列表为空")
        return
    
    # 筛选出表格文件进行处理 (假设表格文件以 'table_' 开头并以 '.html' 结尾)
    table_files = [f for f in extract_files if os.path.basename(f).startswith('table_') and f.endswith('.html')]

    # 表格关键字描述文件路径
    table_key_description_path = os.path.join(key_descriptions_dir, "table_key_description.txt")

    # 处理表格 - 调用table_replacer模块的replace_tables函数
    if table_files:
        await table_replacer.replace_tables(table_files, table_key_description_path)
