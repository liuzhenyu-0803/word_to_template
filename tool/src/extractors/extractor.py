"""  
Word文档提取器 - 封装文档元素提取功能  
调用专门的提取器模块完成实际工作  
"""  

import os
import shutil
import zipfile
from . import table_extractor


def extract_document(html_path: str, extract_dir: str):
    """
    从HTML文件提取所有内容元素
    
    参数:
        html_path: HTML文件路径
        extract_dir: 输出目录路径
    """
    # 检查并清理输出目录
    if os.path.exists(extract_dir):
        shutil.rmtree(extract_dir)
    os.makedirs(extract_dir)
    
    # 处理表格
    table_extractor.extract_tables(html_path, extract_dir)