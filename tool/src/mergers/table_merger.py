"""
表格合并模块 - 将处理后的表格单元格内容合并回总的HTML文件中
只替换有变更标记的单元格内容，而不是整个表格
"""
from callback.callback import callback_handler
import os
import re
from bs4 import BeautifulSoup
from global_define.constants import ATTR_ORIGINAL_CONTENT, ATTR_CELL_ID, ATTR_HAS_NESTED_TABLE


async def merge_tables(html_path: str, extract_dir: str) -> None:
    """
    将处理后的表格单元格内容合并回总的HTML文件中
    
    参数:
        html_path: 原始HTML文件路径
        extract_dir: 包含处理后表格HTML文件的目录
    """
    try:
        # 读取原始HTML文件
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 获取所有表格文件
        table_files = sorted([
            os.path.join(extract_dir, f)
            for f in os.listdir(extract_dir)
            if re.match(r'^table_\d+\.html$', f) and os.path.isfile(os.path.join(extract_dir, f))
        ])
        
        if not table_files:
            await callback_handler.output_callback("未找到需要合并的表格文件")
            return
        
        total_merged_cells = 0
        
        # 逐个处理表格文件
        for table_file in table_files:
            base_name = os.path.basename(table_file)
            table_index = int(base_name.split('_')[1].split('.')[0])
            
            # 读取处理后的表格
            with open(table_file, 'r', encoding='utf-8') as f:
                table_content = f.read()
            
            table_soup = BeautifulSoup(table_content, 'html.parser')
            
            # 查找所有有变更标记的单元格
            modified_cells = table_soup.find_all(attrs={ATTR_ORIGINAL_CONTENT: True})
            
            merged_count = 0
            for modified_cell in modified_cells:
                cell_id = modified_cell.get(ATTR_CELL_ID)
                if not cell_id:
                    continue
                
                # 在原始HTML中找到对应的单元格
                original_cell = soup.find(attrs={ATTR_CELL_ID: cell_id})
                if original_cell and not original_cell.has_attr(ATTR_HAS_NESTED_TABLE):
                    # 只替换单元格内容，保持其他属性不变
                    new_content = modified_cell.get_text(strip=True)
                    original_cell.string = new_content
                    # 同步 data-original-content 属性
                    original_cell[ATTR_ORIGINAL_CONTENT] = modified_cell.get(ATTR_ORIGINAL_CONTENT)
                    merged_count += 1
                elif original_cell and original_cell.has_attr(ATTR_HAS_NESTED_TABLE):
                    await callback_handler.output_callback(f"跳过嵌套表格单元格: {cell_id}")
            
            if merged_count > 0:
                await callback_handler.output_callback(f"表格 {table_index} 已合并 {merged_count} 个单元格")
                total_merged_cells += merged_count
        
        # 写回HTML文件
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        await callback_handler.output_callback(f"成功合并 {total_merged_cells} 个单元格到 {html_path}")
        
    except Exception as e:
        await callback_handler.output_callback(f"合并表格时出错: {e}")
        import traceback
        traceback.print_exc()