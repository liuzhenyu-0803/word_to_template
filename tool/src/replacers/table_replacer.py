"""
表格匹配器 - 实现表格内容的语义匹配
"""
from callback.callback import callback_handler
from enum import Enum, auto
from bs4 import BeautifulSoup
import os
from global_define.constants import ATTR_DIAGONAL_SPLIT_TYPE, ATTR_CELL_MODIFIED
from models.model_manager import llm_manager

class TableType(Enum):
    """表格类型枚举"""
    # 未知类型
    UNKNOWN = 0
    # 斜分表格（左上角单元格斜分，首行是列标题，首列是行标题，其余是数据项）
    # 数据单元格key拼接格式：[数据单元格对应的列标题_数据单元格对应的行标题]
    Type1 = 1
    # 单行表格（只有一行，标题、数据、标题、数据...）
    # 数据单元格key拼接格式：[左侧标题（左侧单元格内容）]
    Type2 = 2
    # 矩阵表格（首行是列标题，或首列是行标题，或首行是列标题且首列是行标题，其余是数据项）
    # 数据单元格key拼接格式：[数据单元格对应的列标题]、[数据单元格对应的行标题]、[数据单元格对应的列标题_数据单元格对应的行标题]
    Type3 = 3

class TableType3SubType(Enum):
    """
    表格类型3的子类型枚举
    """
    # 未知子类型
    UNKNOWN = 0
    # 列标题
    Type1 = 1
    # 行标题
    Type2 = 2
    # 列标题+行标题
    Type3 = 3

def _recognize_table_sub_type(table_file: str) -> TableType:
    """
    识别表格子类型

    参数:
        table_file: 表格文件路径

    返回:
        TableType: 表格子类型枚举
    """

    callback_handler.output_callback(f"\n{'-'*30}")

    response = ""
    for chunk in llm_manager.create_completion_stream(
                    [{"role": "user", "content": "hi"}]
                ):
        callback_handler.output_callback(chunk)
        response += chunk
        
    callback_handler.output_callback(f"\n{'-'*30}")

    # TODO: 实现表格子类型识别逻辑
    return TableType.UNKNOWN

def _recognize_table_type(table_file: str) -> TableType:
    """
    识别表格类型
    
    参数:
        table_file: 表格文件路径
        
    返回:
        TableType: 表格类型枚举
    """
    
    with open(table_file, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
        table = soup.find('table')
        
        # 检查是否有对角线分割属性
        if table.find('td', attrs={ATTR_DIAGONAL_SPLIT_TYPE: True}):
            return TableType.Type1
            
        # 检查行数是否为1
        rows = table.find_all('tr')
        if len(rows) == 1:
            return TableType.Type2
            
        # 默认返回矩阵表格类型
        return TableType.Type3


def _build_grid(table):
    """
    将HTML表格（可能包含colspan/rowspan）转换为一个二维列表（网格）。
    这是处理复杂表格最直接和健壮的方法。
    """
    grid = []
    for r_idx, row in enumerate(table.find_all('tr')):
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

def _replace_type1_table(table):
    """处理斜分表格 (Type1)"""
    # Type1 的逻辑也应该使用网格来确保健壮性，但暂时保持简单
    rows = table.find_all('tr')
    for i, row in enumerate(rows):
        cells = row.find_all('td')
        for j, cell in enumerate(cells):
            if i > 0 and j > 0:
                col_header = rows[i].find_all('td')[0].get_text(strip=True)
                row_header = rows[0].find_all('td')[j].get_text(strip=True)
                key = f"{col_header}_{row_header}"
                cell.string = f"[key_{key}]"
                cell[ATTR_CELL_MODIFIED] = 'true'

def _replace_type2_table(table):
    """处理单行表格 (Type2)"""
    cells = table.find('tr').find_all('td')
    for i in range(1, len(cells), 2):
        key = cells[i-1].get_text().strip()
        cells[i].string = f"[key_{key}]"
        cells[i][ATTR_CELL_MODIFIED] = 'true'

def _replace_type3_table(table):
    """处理矩阵表格 (Type3)"""
    grid = _build_grid(table)
    if not grid: return

    num_rows = len(grid)
    num_cols = max(len(r) for r in grid) if num_rows > 0 else 0

    # 假设为有行列标题的矩阵 (Type3SubType.Type3)
    # TODO: 后续需要结合子类型识别来确定标题和数据区域
    for r in range(1, num_rows):
        for c in range(1, num_cols):
            cell = grid[r][c]
            
            if cell:
                row_header_cell = grid[r][0]
                col_header_cell = grid[0][c]
                
                if row_header_cell and col_header_cell:
                    row_header = row_header_cell.get_text(strip=True)
                    col_header = col_header_cell.get_text(strip=True)
                    
                    if row_header and col_header:
                        key = f"{col_header}_{row_header}"
                        cell.string = f"[key_{key}]"
                        cell[ATTR_CELL_MODIFIED] = 'true'

def _replace_table(table_file: str, table_type: TableType, replace_dir: str) -> None:
    """
    根据表格类型替换表格内容
    """
    try:
        with open(table_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            table = soup.find('table')

            if not table:
                return

            if table_type == TableType.Type1:
                _replace_type1_table(table)
            elif table_type == TableType.Type2:
                _replace_type2_table(table)
            elif table_type == TableType.Type3:
                _replace_type3_table(table)

        output_path = os.path.join(replace_dir, os.path.basename(table_file))
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))

    except Exception as e:
        callback_handler.output_callback(f"替换表格 '{os.path.basename(table_file)}' 时出错: {e}")


def replace_tables(table_files: list[str],
                table_key_description_path: str,
                replace_dir: str) -> None:
    """
    对提取的表格进行语义匹配分析
    
    参数:
        table_files: 要处理的表格文件列表
        table_key_description_path: 关键字描述文件路径
        replace_dir: 替换结果输出目录

    返回:
        None: 无返回值
    """

    if not os.path.exists(table_key_description_path):
        callback_handler.output_callback(f"错误：表格关键字描述文件 {table_key_description_path} 不存在")
    return

    
    for table_file in table_files:
        table_type = _recognize_table_type(table_file)
        _replace_table(table_file, table_type, replace_dir)