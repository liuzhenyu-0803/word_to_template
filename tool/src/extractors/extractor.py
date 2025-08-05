"""  
Word文档提取器 - 封装文档元素提取功能  
调用专门的提取器模块完成实际工作  
"""  

import os
import shutil
import zipfile
from . import table_extractor
from . import image_extractor
from callback.callback import callback_handler


async def extract_document(unzip_dir: str) -> list[str]:
    """
    从HTML文件提取所有表格和图片，返回表格HTML字符串列表，并提取图片到指定目录

    参数:
        unzip_dir (str): Word文档解压后的临时目录路径

    返回:
        list[str]: 表格HTML字符串列表
    """
    # 处理表格
    tables = await table_extractor.extract_tables()
    # 提取图片
    image_paths = await image_extractor.extract_and_save_images(unzip_dir)
    await callback_handler.output_callback(f"已提取图片数量: {len(image_paths)}")
    return tables