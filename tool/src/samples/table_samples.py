"""
表格样本处理模块 - 生成训练样本数据
从测试集Word文档中提取表格并格式化为训练样本
"""

import os
import json
import tempfile
from converter.converter import get_html_from_document
from extractors.table_extractor import get_tables_from_html

def generate_train_samples_file(doc_path):
    """
    从指定Word文档中提取表格，生成训练样本并保存到JSON文件
    
    参数:
        doc_path: Word文档路径
        
    返回:
        str: 保存的JSON文件路径，失败时返回空字符串
    """
    try:
        # 检查文档是否存在
        if not os.path.exists(doc_path):
            print(f"错误：文档 {doc_path} 不存在")
            return ""
        
        # 步骤1: Word文档转换为HTML
        print("转换Word文档为HTML...")
        html_content = get_html_from_document(doc_path)
        
        # 步骤2: 提取表格HTML字符串列表（直接使用HTML字符串）
        print("提取表格...")
        table_html_strings = get_tables_from_html(doc_path, html_content)
            
        if not table_html_strings:
            print("未找到任何表格")
            return ""
        
        # 步骤3: 格式化为训练样本
        print(f"格式化 {len(table_html_strings)} 个表格为训练样本...")
        sample_parts = []
        
        for i, table_html in enumerate(table_html_strings):
            if i % 2 == 0:  # 单数列（索引从0开始，0、2、4...是奇数个）
                sample_parts.append(f"输入：{table_html}")
            else:  # 双数列（1、3、5...是偶数个）
                sample_parts.append(f"输出：{table_html}")
        
        # 步骤4: 保存为JSON文件
        # 生成输出文件路径（与源文档同目录，名字一致但扩展名为.json）
        doc_dir = os.path.dirname(doc_path)
        doc_name = os.path.splitext(os.path.basename(doc_path))[0]
        output_file = os.path.join(doc_dir, f"{doc_name}.json")
        
        # 保存为JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sample_parts, f, ensure_ascii=False, indent=2)
        
        print(f"训练样本已保存到: {output_file}")
        print(f"样本数量: {len(sample_parts)}")
        return output_file
        
    except Exception as e:
        print(f"生成训练样本失败: {e}")
        import traceback
        traceback.print_exc()

def generate_test_samples_file(doc_path):
    """
    从指定Word文档中提取表格，生成测试样本并保存到JSON文件
    每个表格HTML前面加"输入："
    
    参数:
        doc_path: Word文档路径
        
    返回:
        str: 保存的JSON文件路径，失败时返回空字符串
    """
    try:
        # 检查文档是否存在
        if not os.path.exists(doc_path):
            print(f"错误：文档 {doc_path} 不存在")
            return ""
        
        # 步骤1: Word文档转换为HTML
        print("转换Word文档为HTML...")
        html_content = get_html_from_document(doc_path)
        
        # 步骤2: 提取表格HTML字符串列表（直接使用HTML字符串）
        print("提取表格...")
        table_html_strings = get_tables_from_html(doc_path, html_content)
            
        if not table_html_strings:
            print("未找到任何表格")
            return ""
        
        # 步骤3: 格式化为测试样本（每个表格前加"输入："）
        print(f"格式化 {len(table_html_strings)} 个表格为测试样本...")
        sample_parts = []
        
        for table_html in table_html_strings:
            sample_parts.append(f"输入：{table_html}")
        
        # 步骤4: 保存为JSON文件
        # 生成输出文件路径（与源文档同目录，名字一致但扩展名为.json）
        doc_dir = os.path.dirname(doc_path)
        doc_name = os.path.splitext(os.path.basename(doc_path))[0]
        output_file = os.path.join(doc_dir, f"{doc_name}.json")
        
        # 保存为JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sample_parts, f, ensure_ascii=False, indent=2)
        
        print(f"测试样本已保存到: {output_file}")
        print(f"样本数量: {len(sample_parts)}")
        return output_file
        
    except Exception as e:
        print(f"生成测试样本失败: {e}")
        import traceback
        traceback.print_exc()
        return ""