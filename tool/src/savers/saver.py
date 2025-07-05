"""
文档保存模块 - 负责将替换后的内容保存回Word文档
"""
from callback.callback import callback_handler
import os
from docx import Document
from savers import table_saver

async def save_document(doc_path: str, extract_dir: str, template_doc_path: str) -> None:
    """
    将替换后的表格内容保存回新的Word文档

    参数:
        doc_path: 原始Word文档路径
        extract_dir: 包含提取后(可能已修改)的HTML文件的目录
        template_doc_path: 保存模板化Word文档的路径
    """
    try:
        doc = Document(doc_path)
        
        # 提取所有替换后的表格HTML文件路径
        import re
        table_files = sorted([
            os.path.join(extract_dir, f)
            for f in os.listdir(extract_dir)
            if re.match(r'^table_\d+\.html$', f) and os.path.isfile(os.path.join(extract_dir, f))
        ])

        if table_files:
            await table_saver.save_tables(doc, table_files)
        
        # 确保目标目录存在
        os.makedirs(os.path.dirname(template_doc_path), exist_ok=True)
        
        # 保存为新文档
        doc.save(template_doc_path)
        await callback_handler.output_callback(f"模板文件已成功保存至: {template_doc_path}")

    except Exception as e:
        await callback_handler.output_callback(f"保存文档时出错: {e}")