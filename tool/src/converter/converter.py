import collections
import collections.abc
collections.Hashable = collections.abc.Hashable
from pydocx import PyDocX
from callback.callback import callback_handler
import os
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import zipfile
import tempfile
from global_define.constants import ATTR_DIAGONAL_SPLIT_TYPE, ATTR_HAS_NESTED_TABLE, ATTR_CELL_ID


async def convert_document(word_file, html_file):
    """使用PyDocX库将Word文件完整转换为HTML并添加标记"""
    try:
        html_content = get_html_from_document(word_file)
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        await callback_handler.output_callback(f"成功导出: {html_file}")
    except Exception as e:
        await callback_handler.output_callback(f"导出失败: {e}")


def get_html_from_document(word_file):
    """使用PyDocX库将Word文件完整转换为HTML并添加标记"""
    html_content = PyDocX.to_html(word_file)
    return _mark_cells(html_content, word_file)


def _mark_cells(html_content, doc_path):
    """在HTML转换过程中标记表格单元格"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 解压Word文档获取XML信息
    with tempfile.TemporaryDirectory() as unzip_dir:
        with zipfile.ZipFile(doc_path, 'r') as zip_ref:
            zip_ref.extractall(unzip_dir)
        
        xml_path = os.path.join(unzip_dir, 'word', 'document.xml')
        xml_root = ET.parse(xml_path).getroot()
        xml_tables = xml_root.findall('.//w:tbl', {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'})
        
        # 标记所有表格单元格
        for table_idx, html_table in enumerate(soup.find_all('table')):
            xml_table = xml_tables[table_idx] if table_idx < len(xml_tables) else None
            
            for row_idx, row in enumerate(html_table.find_all('tr')):
                for cell_idx, cell in enumerate(row.find_all(['td', 'th'])):
                    # 设置唯一ID
                    cell[ATTR_CELL_ID] = f"table_{table_idx}_cell_{row_idx}_{cell_idx}"
                    
                    # 检查斜线
                    if row_idx == 0 and cell_idx == 0 and xml_table:
                        split_type = _check_diagonal_split(xml_table, row_idx, cell_idx)
                        if split_type:
                            cell[ATTR_DIAGONAL_SPLIT_TYPE] = split_type
                    
                    # 检查嵌套表格
                    if cell.find('table'):
                        cell[ATTR_HAS_NESTED_TABLE] = 'true'
    
    return str(soup)

def _check_diagonal_split(xml_table, row_idx, cell_idx):
    """检查Word XML中的斜线分割"""
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    try:
        xml_rows = xml_table.findall('w:tr', ns)
        if row_idx >= len(xml_rows):
            return None
            
        xml_cells = xml_rows[row_idx].findall('w:tc', ns)
        if cell_idx >= len(xml_cells):
            return None
            
        tc_pr = xml_cells[cell_idx].find('w:tcPr', ns)
        if tc_pr is not None:
            if tc_pr.find('w:tcBorders/w:tl2br', ns) is not None:
                return 'tl2br'
            elif tc_pr.find('w:tcBorders/w:tr2bl', ns) is not None:
                return 'tr2bl'
    except:
        pass
    return None
