"""任务管理模块，提供文档处理接口"""
import time
from models.model_manager import llm_manager
from converter.converter import convert_document
from extractors.extractor import extract_document
from replacers.replacer import replace_document
from mergers.merger import merge_html
from savers.saver import save_document
from callback.callback import callback_handler
from client import upload_template
from global_define import constants

async def startProcessTask():
    """
    启动文档处理任务
    :return: 处理结果状态和耗时
    """

    callback_handler.set_websocket_message_type(constants.WS_MESSAGE_TYPE['DOC_PROCESS_PROGRESS'])

    await callback_handler.output_callback(f"===== 开始处理任务: {os.path.basename(constants.DEFAULT_DOC_PATH)} =====")

    start_time = time.time()
 
    try:
        # 步骤1: Word文档转换为HTML
        await callback_handler.output_callback("\n===== 步骤1: 文档转换 =====")
        await convert_document()

        # 步骤2: 提取文档元素
        await callback_handler.output_callback("\n===== 步骤2: 文档元素提取 =====")
        table_html_strings = await extract_document()

        # 步骤3: 替换文档元素
        await callback_handler.output_callback("\n===== 步骤3: 文档元素替换 =====")
        await replace_document(table_html_strings)

        # 步骤4: 合并处理后的元素回HTML (已废弃)
        await callback_handler.output_callback("\n===== 步骤4: 合并元素到HTML (已废弃) =====")
        # await merge_html()

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

async def startSaveTask():
    """
    启动保存任务（仅提取和保存）
    :return: 处理结果状态和耗时
    """
    callback_handler.set_websocket_message_type(constants.WS_MESSAGE_TYPE['DOC_SAVE_COMPLETE'])
    
    await callback_handler.output_callback(f"===== 开始保存任务: {os.path.basename(constants.DEFAULT_HTML_PATH)} =====")
    
    start_time = time.time()
    
    try:
        # 步骤1: 提取文档元素
        await callback_handler.output_callback("\n===== 步骤1: 文档元素提取 =====")
        await extract_document()
        
        # 步骤2: 生成模板文档
        await callback_handler.output_callback("\n===== 步骤2: 模板文档生成 =====")
        await save_document()
        
        # 步骤3: 上传模板文档到服务器
        await callback_handler.output_callback("\n===== 步骤3: 上传模板文档 =====")
        upload_success = await upload_template(constants.DEFAULT_TEMPLATE_DOC_PATH)
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