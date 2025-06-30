"""任务管理模块，提供文档处理接口"""
import os
import time
from models.model_manager import llm_manager
from converter.converter import convert_document
from extractors.extractor import extract_document
from replacers.replacer import replace_document
from savers.saver import save_document
from callback.callback import callback_handler

def startTask(doc_path):
    """
    启动文档处理任务
    :param doc_path: Word文档路径
    :return: 处理结果状态和耗时
    """
    callback_handler.output_callback(f"===== 开始处理文档: {os.path.basename(doc_path)} =====")
    
    start_time = time.time()

    # 设置路径
    doc_dir = os.path.dirname(doc_path)
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
        replace_document(extract_dir, key_descriptions_dir, replace_dir)

        # 步骤4: 生成模板文档
        callback_handler.output_callback("\n===== 步骤4: 模板文档生成 =====")
        save_document(doc_path, replace_dir, template_doc_path)

        # 计算总耗时
        total_time = time.time() - start_time
        callback_handler.output_callback(f"\n===== 处理完成，总耗时: {total_time:.2f} 秒 =====")

        # 发送结束回调
        callback_handler.end_callback(f"")
        
        return True, total_time
        
    except Exception as e:
        callback_handler.output_callback(f"处理过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False, 0