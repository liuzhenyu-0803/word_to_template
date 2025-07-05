"""
HTML合并模块 - 负责将处理后的元素写回到总的HTML文件中
与extractors模块相反，这里是将分离的元素重新合并
"""
from callback.callback import callback_handler
import os
from . import table_merger


async def merge_html(html_path: str, extract_dir: str) -> None:
    """
    将处理后的元素HTML文件合并回总的HTML文件中
    
    参数:
        html_path: 原始HTML文件路径
        extract_dir: 包含处理后元素HTML文件的目录
    """
    try:
        await callback_handler.output_callback(f"开始合并HTML文件: {html_path}")
        
        # 合并表格
        await table_merger.merge_tables(html_path, extract_dir)
        
        await callback_handler.output_callback(f"HTML文件合并完成: {html_path}")
        
    except Exception as e:
        await callback_handler.output_callback(f"合并HTML文件时出错: {e}")
        import traceback
        traceback.print_exc()