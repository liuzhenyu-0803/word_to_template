"""
文档保存模块 - 负责将替换后的内容保存回Word文档
"""
from callback.callback import callback_handler
import os
from docx import Document
from savers import table_saver, image_saver

from global_define import constants

async def save_document() -> None:
    """
    将替换后的内容保存回新的Word文档
    """
    try:
        doc_path = constants.DEFAULT_DOC_PATH
        html_file_path = constants.DEFAULT_HTML_PATH
        template_doc_path = constants.DEFAULT_TEMPLATE_DOC_PATH
        doc = Document(doc_path)
        
        # 读取完整的HTML内容
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        await table_saver.save_tables(doc, html_content)
        
        # 确保目标目录存在
        os.makedirs(os.path.dirname(template_doc_path), exist_ok=True)
        
        # 保存为新文档
        doc.save(template_doc_path)
        await callback_handler.output_callback(f"模板文件已成功保存至: {template_doc_path}")

        # 调用image_saver来处理图片
        await image_saver.save_images()

    except Exception as e:
        await callback_handler.output_callback(f"保存文档时出错: {e}")