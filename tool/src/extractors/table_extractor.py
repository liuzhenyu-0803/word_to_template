"""
表格提取模块 - 基于HTML解析的实现
从Word文档转换的HTML中提取表格并保存为清理后的HTML文件
"""
from callback.callback import callback_handler

import os
from bs4 import BeautifulSoup
from global_define.constants import ATTR_DIAGONAL_SPLIT_TYPE, ATTR_HAS_NESTED_TABLE, ATTR_CELL_ID


async def extract_tables(html_file_path: str, output_dir: str) -> None:
    """从HTML文件中提取所有表格，每个表格保存为独立HTML文件"""
    try:
        try:
            with open(html_file_path, 'r', encoding='utf-8') as file:
                html_content = file.read()
        except UnicodeDecodeError:
            with open(html_file_path, 'r', encoding='gbk') as file:
                html_content = file.read()
        
        table_html_strings = await get_tables_from_html(html_content)
        
        if not table_html_strings:
            await callback_handler.output_callback("未找到任何表格")
            return
        
        for i, table_html in enumerate(table_html_strings):
            table_count = i + 1
            output_file = os.path.join(output_dir, f"table_{table_count}.html")
            with open(output_file, 'w', encoding='utf-8') as file:
                file.write(table_html)
            await callback_handler.output_callback(f"表格 {table_count} 已保存")
        
        await callback_handler.output_callback(f"总共保存了 {len(table_html_strings)} 个表格")
    except Exception as e:
        await callback_handler.output_callback(f"表格提取失败: {e}")


async def get_tables_from_html(html_content: str) -> list[str]:
    """
    从HTML字符串中提取表格，返回表格HTML字符串列表
    
    参数:
        html_content: HTML内容字符串
        
    返回:
        list[str]: 每个字符串代表一个表格的HTML字符串
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        html_tables = soup.find_all('table', recursive=True)

        if not html_tables:
            await callback_handler.output_callback("未找到任何表格")
            return []
        
        table_html_strings = []
        for i, html_table in enumerate(html_tables):
            clean_html_table = _create_clean_table(html_table, i)
            if clean_html_table:
                table_html_strings.append(str(clean_html_table))
        
        await callback_handler.output_callback(f"总共处理了 {len(html_tables)} 个表格，提取了 {len(table_html_strings)} 个表格")
        return table_html_strings
            
    except Exception as e:
        await callback_handler.output_callback(f"表格提取失败: {e}")
        return []
    

def _create_clean_table(html_table, table_idx):
    """创建简化的表格，只保留表格相关标签，去除所有样式和多余属性，并保持原始行顺序"""
    soup = BeautifulSoup('<table></table>', 'html.parser')
    clean_html_table = soup.table
    clean_html_table['border'] = "1"
    
    # 遍历所有直接子元素以保持顺序
    for child in html_table.find_all(recursive=False):
        if child.name == 'caption':
            if child.get_text(strip=True):
                new_caption = soup.new_tag('caption')
                new_caption.string = child.get_text(strip=True)
                clean_html_table.append(new_caption)
        
        elif child.name in ['thead', 'tbody', 'tfoot']:
            new_section = soup.new_tag(child.name)
            for original_row in child.find_all('tr'):
                new_row = _create_clean_row(original_row, soup)
                if new_row:
                    new_section.append(new_row)
            clean_html_table.append(new_section)

        elif child.name == 'tr':
            new_row = _create_clean_row(child, soup)
            if new_row:
                clean_html_table.append(new_row)
            
    return clean_html_table

def _create_clean_row(original_row, soup):
    """创建简化的表格行，保留原始标记属性"""
    new_row = soup.new_tag('tr')
    cells = original_row.find_all(['td', 'th'], recursive=False)
    
    for cell in cells:
        new_cell = soup.new_tag(cell.name)
        
        # 复制原始属性
        for attr in [ATTR_CELL_ID, ATTR_DIAGONAL_SPLIT_TYPE, ATTR_HAS_NESTED_TABLE, 'colspan', 'rowspan']:
            if cell.has_attr(attr):
                new_cell[attr] = cell[attr]
        
        # 设置单元格内容
        cell_text = cell.get_text(strip=True)
        if cell_text:
            new_cell.string = cell_text
        
        new_row.append(new_cell)
    
    return new_row