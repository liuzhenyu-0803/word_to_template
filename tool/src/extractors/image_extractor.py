import os
import base64
import io
import json
from PIL import Image
from bs4 import BeautifulSoup
from global_define.constants import EXTRACT_DIR, DEFAULT_HTML_PATH, IMAGE_MAP_PATH, WORD_INTERNAL_DIR, MEDIA_INTERNAL_DIR
from callback.callback import callback_handler

async def extract_and_save_images(unzip_dir):
    """
    从 constants.DEFAULT_HTML_PATH 提取所有 data: 开头的 img 图片，保存为 png 到 constants.EXTRACT_DIR，
    并返回图片路径列表。同时创建HTML图片索引到Word内部media目录图片名称的映射。
    """
    output_dir = EXTRACT_DIR
    html_path = DEFAULT_HTML_PATH

    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')

    image_map = _create_image_map(soup, unzip_dir) # 创建图片映射

    # 保存图片映射
    os.makedirs(os.path.dirname(IMAGE_MAP_PATH), exist_ok=True)
    with open(IMAGE_MAP_PATH, 'w', encoding='utf-8') as f:
        json.dump(image_map, f, ensure_ascii=False, indent=4)
    await callback_handler.output_callback(f"成功保存图片映射: {IMAGE_MAP_PATH}")

    saved_paths = []
    
    # 遍历HTML中的img标签，根据image_map进行处理
    for i, img_tag in enumerate(soup.find_all('img')):
        src = img_tag.get('src')
        if src and src.startswith('data:'): # 检查是否是data:开头的图片
            img_id = f"{i}" # HTML中img的索引
            word_image_filename = image_map.get(img_id) # 从映射中获取Word内部图片文件名

            if word_image_filename:
                word_image_path = os.path.join(unzip_dir, WORD_INTERNAL_DIR, MEDIA_INTERNAL_DIR, word_image_filename)
                
                if os.path.exists(word_image_path):
                    try:
                        img = Image.open(word_image_path)
                        # 使用原始文件名作为保存的PNG文件名，避免冲突
                        img_path = os.path.join(output_dir, f'image_{i}.png')
                        img.save(img_path, format='PNG')
                        saved_paths.append(img_path)
                        
                        # 更新HTML中的src属性为新的PNG文件路径
                        img_tag['src'] = os.path.relpath(img_path, os.path.dirname(DEFAULT_HTML_PATH)).replace("\\", "/")
                        
                    except Exception as e:
                        await callback_handler.output_callback(f"处理Word内部图片 {word_image_filename} 时出错: {e}")
                        continue
                else:
                    await callback_handler.output_callback(f"警告: Word内部图片文件 {word_image_path} 不存在。")
            else:
                await callback_handler.output_callback(f"警告: 图片ID {img_id} 在image_map中没有找到对应文件。")

    # 保存修改后的HTML
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))

    return saved_paths


def _create_image_map(soup, unzip_dir):
    """
    创建HTML img src (data:base64) 到 Word内部media目录图片名称的映射。
    匹配方式是通过比较HTML中src中的data数据和media中图片数据。
    """
    image_map = {}
    media_dir = os.path.join(unzip_dir, WORD_INTERNAL_DIR, MEDIA_INTERNAL_DIR)
    
    # 获取Word内部media目录中的图片文件及其数据
    word_media_data = {}
    if os.path.exists(media_dir):
        for filename in os.listdir(media_dir):
            filepath = os.path.join(media_dir, filename)
            if os.path.isfile(filepath):
                try:
                    with open(filepath, 'rb') as f:
                        word_media_data[filename] = f.read()
                except Exception:
                    continue

    img_tags = soup.find_all('img')
    
    # 遍历HTML中的img标签，建立映射
    for i, img_tag in enumerate(img_tags):
        src = img_tag.get('src')
        if src and src.startswith('data:'):
            try:
                header, b64data = src.split(',', 1)
                if ';base64' in header:
                    html_img_bytes = base64.b64decode(b64data)
                    
                    matched_filename = None
                    for filename, file_data in word_media_data.items():
                        if html_img_bytes == file_data:
                            matched_filename = filename
                            break
                    
                    img_id = f"{i}" # HTML中img的索引
                    image_map[img_id] = matched_filename # 映射到Word内部图片名称
                    
                else:
                    # 如果不是base64编码的data URI，则不处理
                    pass
            except Exception:
                # 处理解码或文件读取错误
                continue

    return image_map