"""任务管理模块，提供文档处理接口"""
import os
import time
from models.model_manager import llm_manager
from converter.converter import convert_document
from extractors.extractor import extract_document
from replacers.replacer import replace_document
from mergers.merger import merge_html
from savers.saver import save_document
from callback.callback import callback_handler
from client import upload_template

async def startProcessTask(doc_path):
    """
    启动文档处理任务
    :param doc_path: Word文档路径
    :return: 处理结果状态和耗时
    """

    from global_define.constants import WS_MESSAGE_TYPE
    callback_handler.set_websocket_message_type(WS_MESSAGE_TYPE['DOC_PROCESS_PROGRESS'])

    await callback_handler.output_callback(f"===== 开始处理任务: {os.path.basename(doc_path)} =====")

    start_time = time.time()

    # 设置路径
    doc_dir = os.path.dirname(doc_path)
    html_path = os.path.join(doc_dir, "document.html")
    extract_dir = os.path.join(doc_dir, "document_extract")
    key_descriptions_dir = os.path.join(doc_dir, "key_descriptions")
    template_doc_path = os.path.join(doc_dir, "template.docx")
 
    try:
        # 步骤1: Word文档转换为HTML
        await callback_handler.output_callback("\n===== 步骤1: 文档转换 =====")
        await convert_document(doc_path, html_path)

        # 步骤2: 提取文档元素
        await callback_handler.output_callback("\n===== 步骤2: 文档元素提取 =====")
        await extract_document(html_path, extract_dir)

        # 步骤3: 替换文档元素
        await callback_handler.output_callback("\n===== 步骤3: 文档元素替换 =====")
        extracted_files = [os.path.join(extract_dir, f) for f in os.listdir(extract_dir) if f.endswith('.html')]
        await replace_document(extracted_files, key_descriptions_dir)

        # 步骤4: 合并处理后的元素回HTML
        await callback_handler.output_callback("\n===== 步骤4: 合并元素到HTML =====")
        await merge_html(html_path, extract_dir)

        # 计算总耗时
        total_time = time.time() - start_time
        await callback_handler.output_callback(f"\n===== 处理完成，总耗时: {total_time:.2f} 秒 =====")

        # 发送结束回调
        await callback_handler.end_callback(f"")
        
        return True, total_time
        
    except Exception as e:
        await callback_handler.output_callback(f"处理过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False, 0

async def startSaveTask(html_path):
    """
    启动保存任务（仅提取和保存）
    :param html_path: HTML文档路径
    :return: 处理结果状态和耗时
    """
    from global_define.constants import WS_MESSAGE_TYPE
    callback_handler.set_websocket_message_type(WS_MESSAGE_TYPE['DOC_SAVE_COMPLETE'])
    
    await callback_handler.output_callback(f"===== 开始保存任务: {os.path.basename(html_path)} =====")
    
    start_time = time.time()
    
    # 设置路径
    html_dir = os.path.dirname(html_path)
    extract_dir = os.path.join(html_dir, "document_extract")
    # 假设原始Word文档在同一目录下，文件名为document.docx
    doc_path = os.path.join(html_dir, "document.docx")
    template_doc_path = os.path.join(html_dir, "template.docx")
    
    try:
        # 步骤1: 提取文档元素
        await callback_handler.output_callback("\n===== 步骤1: 文档元素提取 =====")
        await extract_document(html_path, extract_dir)
        
        # 步骤2: 生成模板文档
        await callback_handler.output_callback("\n===== 步骤2: 模板文档生成 =====")
        await save_document(doc_path, extract_dir, template_doc_path)
        
        # 步骤3: 上传模板文档到服务器
        await callback_handler.output_callback("\n===== 步骤3: 上传模板文档 =====")
        upload_success = await upload_template(template_doc_path)
        if upload_success:
            await callback_handler.output_callback("模板文档上传成功")
        else:
            await callback_handler.output_callback("模板文档上传失败")
        
        # 计算总耗时
        total_time = time.time() - start_time
        await callback_handler.output_callback(f"\n===== 保存完成，总耗时: {total_time:.2f} 秒 =====")
        
        # 发送结束回调
        await callback_handler.end_callback(f"")
        
        return True, total_time
        
    except Exception as e:
        await callback_handler.output_callback(f"保存过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False, 0