import os
import re
import json
from bs4 import BeautifulSoup
from models.model_manager import llm_manager
from callback.callback import callback_handler
from global_define.constants import ATTR_CELL_MODIFIED, ATTR_ORIGINAL_CONTENT

def _call_llm_and_parse_json(prompt: str):
    """调用LLM并解析返回的JSON数组"""
    try:
        messages = [{"role": "user", "content": prompt}]
        stream = llm_manager.create_completion(messages)
        response = "".join([chunk for chunk in stream])
        callback_handler.output_callback(f"LLM输出: {response}")
        
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
        
        callback_handler.output_callback(f"警告：无法从LLM响应中解析出有效的JSON对象数组。")
        return None
    except Exception as e:
        callback_handler.output_callback(f"调用LLM或解析时出错: {e}")
        return None

def replace_tables(table_files: list[str],
                   table_key_description_path: str,
                   replace_dir: str) -> None:
    """
    对提取的表格进行语义匹配分析，并用LLM生成的标签替换内容
    """
    if not table_files:
        callback_handler.output_callback("没有需要处理的表格文件。")
        return

    for table_file in table_files:
        try:
            callback_handler.output_callback(f"--- 开始处理表格: {os.path.basename(table_file)} ---")
            
            # 1. 读取表格内容
            with open(table_file, 'r', encoding='utf-8') as f:
                table_content = f.read()

            # 2. 构造并执行 prompt_1
            prompt_1 = (
                "使用COT思考以下任务。\n"
                "充分理解表格内容，然后提取表格中的key-value关系。\n"
                "key：用来描述其它单元格中的内容，可由多个标签共同构成。\n"
                "value：单元格中需要填充或已填充的具体数值或内容。\n"
                "输出格式：[{\"key\": key, \"value\": value, \"value-cell-id\": value-cell-id}, ...]"
                f"表格内容：{table_content}\n"
            )
            
            callback_handler.output_callback("步骤 1/2: 提取键值对...")
            kv_pairs = _call_llm_and_parse_json(prompt_1)

            if not kv_pairs or not isinstance(kv_pairs, list):
                callback_handler.output_callback(f"警告：未能获取有效的键值对列表，跳过文件 {table_file}")
                continue
            
            callback_handler.output_callback(f"成功提取 {len(kv_pairs)} 个键值对。")

            # 3. 修改表格内容
            callback_handler.output_callback("步骤 2/2: 更新表格HTML内容...")
            soup = BeautifulSoup(table_content, 'html.parser')
            modified_count = 0
            for item in kv_pairs:
                if not isinstance(item, dict):
                    continue

                key = item.get('key')
                value_cell_id = item.get('value-cell-id')

                if key and value_cell_id:
                    cell = soup.find(attrs={'data-cell-id': value_cell_id})
                    if cell:
                        original_content = cell.string or ""
                        cell[ATTR_ORIGINAL_CONTENT] = original_content
                        cell.string = f"{{{key}}}"
                        cell[ATTR_CELL_MODIFIED] = 'true'
                        modified_count += 1
            
            callback_handler.output_callback(f"已更新 {modified_count} 个单元格。")

            # 4. 写回文件
            with open(table_file, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            
            callback_handler.output_callback(f"--- 完成处理: {os.path.basename(table_file)} ---\n")

        except Exception as e:
            callback_handler.output_callback(f"处理文件 {table_file} 时发生严重错误: {e}")
            import traceback
            traceback.print_exc()