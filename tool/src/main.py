"""
Word文档智能模板生成系统 - 主程序
整合文档转换、提取、匹配和替换功能，实现Word文档到模板的自动转换
"""

import os
import time
from models.model_manager import llm_manager
from converter.converter import convert_document
from extractors.extractor import extract_document
from replacers.replacer import replace_document
from savers.saver import save_document
from callback.callback import callback_handler

def main():
    """
    主流程：按照LLM初始化 → 转换 → 提取 → 匹配 → 替换的顺序执行
    """
    callback_handler.output_callback("===== Word文档智能模板生成系统 =====")
    
    # 记录开始时间
    start_time = time.time()
    
    # 设置路径 - 项目根目录是src的父目录
    src_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(src_dir)  # 向上一级到项目根目录
    doc_dir = os.path.join(project_dir, "document")
    doc_path = os.path.join(doc_dir, "test_documents/中文表格汇总.docx")
    html_path = os.path.join(doc_dir, "document.html")
    extract_dir = os.path.join(doc_dir, "document_extract")
    key_descriptions_dir = os.path.join(doc_dir, "key_descriptions")
    replace_dir = os.path.join(doc_dir, "document_replace")
    template_doc_path = os.path.join(doc_dir, "template.docx")
    
    try:
        # 步骤1: Word文档转换为HTML
        callback_handler.output_callback("\n===== 步骤1: 文档转换 =====")
        convert_document(doc_path, html_path)

        # 步骤2: 提取文档元素
        callback_handler.output_callback("\n===== 步骤2: 文档元素提取 =====")
        extract_document(html_path, extract_dir)

        # 步骤3: 替换文档元素
        callback_handler.output_callback("\n===== 步骤3: 文档元素替换 =====")
        extracted_files = [
            os.path.join(project_dir, "document/document_extract/table_1.html"),
            os.path.join(project_dir, "document/document_extract/table_2.html"),
            os.path.join(project_dir, "document/document_extract/table_3.html"),
            os.path.join(project_dir, "document/document_extract/table_4.html"),
            os.path.join(project_dir, "document/document_extract/table_5.html"),
            os.path.join(project_dir, "document/document_extract/table_6.html"),
        ]
        replace_document(extracted_files, key_descriptions_dir, replace_dir)
        
        # 步骤4: 生成模板文档
        callback_handler.output_callback("\n===== 步骤4: 模板文档生成 =====")
        # save_document(doc_path, replace_dir, template_doc_path)
        
        # 计算总耗时
        total_time = time.time() - start_time
        callback_handler.output_callback(f"\n===== 处理完成，总耗时: {total_time:.2f} 秒 =====")
        
    except Exception as e:
        callback_handler.output_callback(f"处理过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

# 直接运行时的入口点  
if __name__ == "__main__":
    main()