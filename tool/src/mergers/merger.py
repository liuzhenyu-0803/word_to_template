"""
HTML合并模块 - 负责将处理后的元素写回到总的HTML文件中
与extractors模块相反，这里是将分离的元素重新合并
"""
from callback.callback import callback_handler
import os
from . import table_merger


async def merge_html(html_path: str) -> None:
    """
    此函数不再执行HTML合并操作，因为表格处理已改为直接在完整HTML上进行。
    """
    await callback_handler.output_callback("merge_html: HTML合并功能已废弃。")
    # 移除对 table_merger 的调用，因为它现在是空操作
    # await table_merger.merge_tables(html_path, extract_dir)