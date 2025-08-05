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
import json # 导入json模块
from global_define.constants import ATTR_DIAGONAL_SPLIT_TYPE, ATTR_HAS_NESTED_TABLE, ATTR_CELL_ID, ATTR_HAS_IMG, DEFAULT_DOC_PATH, DEFAULT_HTML_PATH, WORD_INTERNAL_DIR, DOCUMENT_XML_FILE_NAME, MEDIA_INTERNAL_DIR, IMAGE_MAP_PATH, UNZIP_DIR
from global_define import constants
from PIL import Image
import base64
import io
import shutil


async def convert_document():
    """使用PyDocX库将Word文件完整转换为HTML并添加标记"""
    try:
        html_content = get_html_from_document()
        with open(DEFAULT_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(html_content)
        await callback_handler.output_callback(f"成功导出HTML: {DEFAULT_HTML_PATH}")
        
    except Exception as e:
        await callback_handler.output_callback(f"导出失败: {e}")


def get_html_from_document():
    """使用PyDocX库将Word文件完整转换为HTML并添加标记"""
    html_content = PyDocX.to_html(DEFAULT_DOC_PATH)
    
    # 解压Word文档到UNZIP_DIR
    if os.path.exists(constants.UNZIP_DIR):
        shutil.rmtree(constants.UNZIP_DIR)
    os.makedirs(constants.UNZIP_DIR)
    with zipfile.ZipFile(DEFAULT_DOC_PATH, 'r') as zip_ref:
        zip_ref.extractall(constants.UNZIP_DIR)
        
    soup = _mark_cells(html_content)
    return str(soup)


def _mark_cells(html_content):
    """在HTML转换过程中标记表格单元格"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 设置body为可编辑
    body_tag = soup.find('body')
    if body_tag:
        body_tag['contenteditable'] = 'true'

    xml_path = os.path.join(constants.UNZIP_DIR, WORD_INTERNAL_DIR, DOCUMENT_XML_FILE_NAME)
    xml_root = ET.parse(xml_path).getroot()
    xml_tables = xml_root.findall('.//w:tbl', {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'})
    

    # 标记所有表格单元格 - 处理所有表格，但避免嵌套干扰
    for table_idx, html_table in enumerate(soup.find_all('table')):  # 找到所有表格，包括嵌套的
        xml_table = xml_tables[table_idx] if table_idx < len(xml_tables) else None
        
        # 只处理直接属于当前表格的tr，不包括嵌套表格中的tr
        for row_idx, html_row in enumerate(html_table.find_all('tr', recursive=False)):
            # 只处理直接属于当前行的td/th，不包括嵌套表格中的td/th
            for cell_idx, cell in enumerate(html_row.find_all(['td', 'th'], recursive=False)):
                # 使用实际的表格索引和行列位置
                cell[ATTR_CELL_ID] = f"table_{table_idx}_cell_{row_idx}_{cell_idx}"
                
                # 检查斜线（只对第一个单元格检查）
                if row_idx == 0 and cell_idx == 0 and xml_table:
                    split_type = _check_diagonal_split(xml_table, row_idx, cell_idx)
                    if split_type:
                        cell[ATTR_DIAGONAL_SPLIT_TYPE] = split_type
                
                # 检查嵌套表格
                if cell.find('table'):
                    cell[ATTR_HAS_NESTED_TABLE] = 'true'
                
                # 标记单元格是否包含图片
                if cell.find('img'):
                    cell[ATTR_HAS_IMG] = 'true'

                # 对于内容为空的单元格用 "-" 占位，但如果包含图片则不占位
                if not cell.find('img') and not cell.get_text(strip=True):
                    cell.string = "-"
    
    # 检查并处理img标签的src属性
    for img_tag in soup.find_all('img'):
        if not img_tag.get('src'):
            img_tag['src'] = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" # 1x1 transparent GIF

    return soup # 不再返回image_map

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

