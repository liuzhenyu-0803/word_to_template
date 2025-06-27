"""
提示模板生成器 - 生成LLM提示模板文件
"""

from prompt_template.table_prompt_template import generatePromptTemplateFile

def main():
    """
    主函数 - 生成提示模板文件
    """
    print("===== 生成提示模板文件 =====")
    
    template_path = generatePromptTemplateFile()
    
    if template_path:
        print(f"提示模板文件生成成功: {template_path}")
    else:
        print("提示模板文件生成失败")

if __name__ == "__main__":
    main()