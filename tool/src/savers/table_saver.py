"""
表格保存模块 - 将HTML表格内容写回Word文档
"""
from callback.callback import callback_handler
import os
import re
from bs4 import BeautifulSoup
from docx.document import Document
from docx.table import Table
from global_define.constants import ATTR_ORIGINAL_CONTENT

async def save_tables(doc: Document, table_files: list[str]) -> None:
    """
    将HTML表格中的内容更新到Word文档对象中对应的表格。
    此实现通过构建逻辑网格来正确处理合并单元格，并正确处理嵌套表格。

    参数:
        doc: python-docx的Document对象
        table_files: 包含替换内容的HTML表格文件列表
    """
    try:
        # 收集所有表格，包括嵌套表格，使用与提取阶段一致的深度优先遍历
        all_tables = _collect_all_tables_dfs(doc)
        
        for table_file in table_files:
            base_name = os.path.basename(table_file)
            table_index = int(base_name.split('_')[1].split('.')[0]) - 1

            with open(table_file, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
                html_table = soup.find('table')
                
                if not html_table:
                    continue

                doc_table = all_tables[table_index]
                html_grid = _build_grid_from_html(html_table)
                
                for r, row in enumerate(html_grid):
                    for c, cell in enumerate(row):
                        if cell and cell.has_attr(ATTR_ORIGINAL_CONTENT):
                            try:
                                doc_cell = doc_table.cell(r, c)
                                doc_cell.text = cell.get_text(strip=True)

                            except IndexError:
                                await callback_handler.output_callback(f"警告: 表格 {table_index + 1} 的坐标 ({r}, {c}) 超出范围。")

    except Exception as e:
        await callback_handler.output_callback(f"保存表格时出错: {e}")

def _collect_all_tables_dfs(doc: Document) -> list[Table]:
    """
    使用深度优先遍历收集文档中的所有表格，包括嵌套表格。
    遍历顺序与BeautifulSoup的find_all('table', recursive=True)保持一致。
    
    参数:
        doc: python-docx的Document对象
        
    返回:
        list[Table]: 按深度优先顺序排列的所有表格列表
    """
    all_tables = []
    
    def _dfs_collect_tables(element):
        """深度优先递归收集表格"""
        # 如果当前元素有tables属性，遍历其直接包含的表格
        if hasattr(element, 'tables'):
            for table in element.tables:
                # 先添加当前表格
                all_tables.append(table)
                # 然后深度优先遍历该表格的所有单元格，查找嵌套表格
                for row in table.rows:
                    for cell in row.cells:
                        _dfs_collect_tables(cell)
    
    # 从文档开始深度优先遍历
    _dfs_collect_tables(doc)
    return all_tables

def _build_grid_from_html(html_table):
    """
    将HTML表格（可能包含colspan/rowspan）转换为一个二维列表（网格）。
    每个网格单元格包含HTML单元格元素。
    """
    grid = []
    for r_idx, row in enumerate(html_table.find_all('tr')):
        # 确保当前行在网格中存在
        if len(grid) <= r_idx:
            grid.append([])

        for cell in row.find_all(['td', 'th']):
            # 移动到因之前单元格的rowspan而占用的、第一个可用的列位置
            c_idx = 0
            while len(grid[r_idx]) > c_idx and grid[r_idx][c_idx] is not None:
                c_idx += 1
            
            rowspan = int(cell.get('rowspan', 1))
            colspan = int(cell.get('colspan', 1))

            # 将单元格放置在网格中，并根据rowspan/colspan填充
            for i in range(rowspan):
                for j in range(colspan):
                    # 确保目标行存在
                    if len(grid) <= r_idx + i:
                        grid.append([])
                    # 确保目标行有足够的列
                    while len(grid[r_idx + i]) < c_idx + j:
                        grid[r_idx + i].append(None)
                    grid[r_idx + i].insert(c_idx + j, cell)
    return grid