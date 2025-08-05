import os
import base64
from bs4 import BeautifulSoup
import json
from models.model_manager import llm_manager
from callback.callback import callback_handler
from global_define.constants import DEFAULT_HTML_PATH, DOCUMENT_DIR, EXTRACT_DIR, PLACEHOLDER_IMAGES_DIR, IMAGE_PLACEHOLDER_MAP_PATH
# 移除对 extract_and_save_images 的导入，因为图片提取已在extractor中完成
# from extractors.image_extractor import extract_and_save_images

async def replace_images():
    """
    使用LLM识别HTML中已提取的图片类型，并将img src替换为对应的占位符图片路径
    """
    try:
        await callback_handler.output_callback("--- 开始处理图片识别和替换 ---")
        
        # 1. 读取HTML内容
        await callback_handler.output_callback("步骤 1/3: 读取HTML内容...")
        with open(DEFAULT_HTML_PATH, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 2. 逐一识别图片并替换
        await callback_handler.output_callback("步骤 2/3: 使用LLM识别图片类型...")
        
        # 读取prompt模板
        prompt_path = os.path.join(os.path.dirname(__file__), "image_prompt.txt")
        with open(prompt_path, 'r', encoding='utf-8') as f:
            image_prompt_template = f.read()
        
        # 占位符图片映射
        placeholder_mapping = {
            "0": "logo.png",
            "1": "可见光图.png",
            "2": "热成像图.png",
            "3": "线温图.png",
            "4": "其它.png"
        }
        
        replaced_count = 0
        html_to_placeholder_map = {} # 新增：用于存储HTML img索引到占位符文件名的映射

        # 遍历所有img标签，只处理src指向EXTRACT_DIR的图片
        # 注意：这里需要确保EXTRACT_DIR的相对路径是正确的
        relative_extract_dir = os.path.relpath(EXTRACT_DIR, os.path.dirname(DEFAULT_HTML_PATH)).replace("\\", "/")
        img_tags_to_process = [img_tag for img_tag in soup.find_all('img') if img_tag.get('src') and img_tag.get('src').startswith(relative_extract_dir)]
        
        if not img_tags_to_process:
            await callback_handler.output_callback("没有发现需要处理的图片。")
            return
            
        for i, img_tag in enumerate(img_tags_to_process):
            img_src = img_tag.get('src')
            # 构造图片的绝对路径
            img_path = os.path.join(os.path.dirname(DEFAULT_HTML_PATH), img_src)
            
            await callback_handler.output_callback(f"识别第 {i+1}/{len(img_tags_to_process)} 张图片: {img_path}...")
            
            # 将图片转为base64用于LLM识别
            try:
                with open(img_path, 'rb') as img_file:
                    img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                
                # 构造消息（包含图像）
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": image_prompt_template},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ]
                
                # 调用LLM进行图片识别
                stream = llm_manager.create_completion(messages)
                response = "".join([chunk for chunk in stream])
                
                await callback_handler.output_callback(f"LLM识别结果: {response.strip()}")
                
                # 解析识别结果，提取选项数字
                identified_type = None
                for option in placeholder_mapping.keys():
                    if option in response:
                        identified_type = option
                        break
                
                if identified_type and identified_type in placeholder_mapping:
                    # 构造占位符图片路径 - 使用相对路径，相对于HTML文件位置
                    placeholder_filename = placeholder_mapping[identified_type]
                    # 生成相对于HTML文件的路径
                    placeholder_path = os.path.join("placeholder_images", placeholder_filename).replace("\\", "/")
                    
                    # 替换img标签的src属性
                    img_tag['src'] = placeholder_path
                    replaced_count += 1
                    
                    # 保存映射关系
                    img_id = f"{i}"
                    html_to_placeholder_map[img_id] = placeholder_filename

                    await callback_handler.output_callback(f"图片 {i+1} 识别为类型 {identified_type}，已替换为占位符: {placeholder_filename}")
                else:
                    await callback_handler.output_callback(f"警告：无法识别图片 {i+1} 的类型，跳过替换")
                    
            except Exception as e:
                await callback_handler.output_callback(f"处理图片 {i+1} 时出错: {e}")
        
        # 3. 保存修改后的HTML
        await callback_handler.output_callback("步骤 3/3: 保存修改后的HTML...")
        with open(DEFAULT_HTML_PATH, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        # 保存HTML img索引到placeholder_image文件名的映射
        os.makedirs(os.path.dirname(IMAGE_PLACEHOLDER_MAP_PATH), exist_ok=True)
        with open(IMAGE_PLACEHOLDER_MAP_PATH, 'w', encoding='utf-8') as f:
            json.dump(html_to_placeholder_map, f, ensure_ascii=False, indent=4)
        await callback_handler.output_callback(f"成功保存图片占位符映射: {IMAGE_PLACEHOLDER_MAP_PATH}")

        await callback_handler.output_callback(f"--- 完成图片识别和替换，共处理 {len(img_tags_to_process)} 张图片，成功替换 {replaced_count} 张 ---\n")
        
    except Exception as e:
        await callback_handler.output_callback(f"图片识别和替换过程中发生严重错误: {e}")
        import traceback
        traceback.print_exc()