"""
表格提示模板生成模块 - 生成LLM提示模板文件
用于生成表格分析的提示模板
"""

import os
import json

def generatePromptTemplateFile():
    """
    生成表格提示模板文件到document_prompts目录下
    
    返回:
        str: 生成的模板文件路径，失败时返回空字符串
    """
    try:
        # 设置输出路径
        src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_dir = os.path.dirname(src_dir)
        prompts_dir = os.path.join(project_dir, "document\document_prompts")
        output_file = os.path.join(prompts_dir, "table_prompt_template.txt")
        
        # 确保目录存在
        os.makedirs(prompts_dir, exist_ok=True)
        
        # 读取训练样本JSON文件
        samples_file = os.path.join(project_dir, "document\document_samples", "训练集.json")
        samples_content = ""
        
        if os.path.exists(samples_file):
            with open(samples_file, 'r', encoding='utf-8') as f:
                samples_data = json.load(f)
                # 将JSON数组转换为换行分隔的字符串
                samples_content = "\n".join(samples_data)
                print(f"已加载训练样本: {len(samples_data)} 条")
        else:
            print(f"警告：训练样本文件不存在: {samples_file}")
            samples_content = "（暂无训练样本）"
        
        # 模板内容
        template_content = """任务：把输入的表格中所有字段值单元格用key开头的占位符进行替换。
表格模式如下：
-维度：用D表示，D1表示第一维度，D2表示第二维度，...；
-值：用V表示，D1_V1表示D1维度第一个值，D1_V2表示D1维度第二个值，...;
-字段名：
    -- 如果是多维度：如：[D1=D1_V1，D1=D1_V2，D2 = D2_V1]；
    -- 如果是单维度：如：[D1]；
-字段值：数据内容，已填写或未填写；

以下是不同表格结构处理的样例：
{placeholder_samples}

根据以上样例，给出下面表格的输出：
输入：{placeholder_input}
        """
        
        # 替换占位符
        template_content = template_content.replace("{placeholder_samples}", samples_content)
        
        # 保存模板文件
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(template_content)
        
        print(f"提示模板已保存到: {output_file}")
        return output_file
        
    except Exception as e:
        print(f"生成提示模板失败: {e}")
        import traceback
        traceback.print_exc()
        return ""