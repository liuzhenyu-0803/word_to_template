import os
import re
import json
from bs4 import BeautifulSoup
from models.model_manager import llm_manager
from callback.callback import callback_handler
from global_define.constants import ATTR_ORIGINAL_CONTENT

async def _call_llm_and_parse_json(prompt: str):
    """调用LLM并解析返回的JSON数组"""
    try:
        messages = [{"role": "user", "content": prompt}]
        stream = llm_manager.create_completion(messages)
        response = "".join([chunk for chunk in stream])
        await callback_handler.output_callback(f"LLM输出: {response}")
        
        # 优先提取最后一个标准JSON对象数组（[{...}]）
        obj_array_matches = re.findall(r'(\[\s*\{.*?\}\s*(?:,\s*\{.*?\}\s*)*\])', response, re.DOTALL)
        if obj_array_matches:
            json_str = obj_array_matches[-1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                # 尝试修复常见的LLM错误（如尾随逗号）
                cleaned_json_str = re.sub(r',\s*\]', ']', json_str)
                cleaned_json_str = re.sub(r',\s*\}', '}', cleaned_json_str)
                return json.loads(cleaned_json_str)
        
        await callback_handler.output_callback(f"警告：无法从LLM响应中解析出有效的JSON对象数组。")
        return None
    except Exception as e:
        await callback_handler.output_callback(f"调用LLM或解析时出错: {e}")
        return None

from global_define import constants

async def replace_tables(html_file_path: str, table_html_strings: list[str], table_key_description_path: str) -> None:
    """
    对HTML中的表格进行语义匹配分析，并用LLM生成的标签替换内容
    """
    try:
        html_file_path = constants.DEFAULT_HTML_PATH
        await callback_handler.output_callback(f"--- 开始处理HTML文件中的表格: {os.path.basename(html_file_path)} ---")
        
        # 1. 读取完整的HTML内容
        with open(html_file_path, 'r', encoding='utf-8') as f:
            full_html_content = f.read()
        
        soup = BeautifulSoup(full_html_content, 'html.parser')
        
        if not table_html_strings:
            await callback_handler.output_callback("没有需要处理的表格。")
            return

        modified_total_count = 0
        for table_idx, table_content in enumerate(table_html_strings):
            await callback_handler.output_callback(f"处理第 {table_idx + 1} 个表格...")

            # 2. 读取 prompt_1 内容并构造 prompt
            prompt_1_path = os.path.join(os.path.dirname(__file__), "table_prompt_1.txt")
            with open(prompt_1_path, 'r', encoding='utf-8') as f:
                prompt_1_template = f.read()
            
            prompt_1 = prompt_1_template.replace("{table_content}", table_content)
            
            await callback_handler.output_callback("步骤 1/2: 提取键值对...")
            kv_pairs = await _call_llm_and_parse_json(prompt_1)

            if not kv_pairs or not isinstance(kv_pairs, list):
                await callback_handler.output_callback(f"警告：未能获取有效的键值对列表，跳过当前表格。")
                continue
            
            await callback_handler.output_callback(f"成功提取 {len(kv_pairs)} 个键值对。")

            # 3. 修改表格内容
            await callback_handler.output_callback("步骤 2/2: 更新表格HTML内容...")
            modified_count = 0
            for item in kv_pairs:
                if not isinstance(item, dict):
                    continue

                key = item.get('key')
                value_cell_id = item.get('value-cell-id')

                if key and value_cell_id:
                    # 在整个soup中查找单元格
                    cell = soup.find(attrs={'data-cell-id': value_cell_id})
                    if cell:
                        original_content = cell.string or ""
                        cell[ATTR_ORIGINAL_CONTENT] = original_content
                        cell.string = f"{{{key}}}"
                        modified_count += 1
            
            await callback_handler.output_callback(f"已更新当前表格中 {modified_count} 个单元格。")
            modified_total_count += modified_count
        
        # 4. 写回文件
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        await callback_handler.output_callback(f"--- 完成处理HTML文件: {os.path.basename(html_file_path)}，共更新 {modified_total_count} 个单元格。---\n")

    except Exception as e:
        await callback_handler.output_callback(f"处理文件 {html_file_path} 时发生严重错误: {e}")
        import traceback
        traceback.print_exc()