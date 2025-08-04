import os
import base64
import io
from PIL import Image
from bs4 import BeautifulSoup
from global_define.constants import EXTRACT_DIR, DEFAULT_HTML_PATH

def extract_and_save_images():
    """
    从 constants.DEFAULT_HTML_PATH 提取所有 data: 开头的 img 图片，保存为 png 到 constants.EXTRACT_DIR，并返回图片路径列表
    """
    output_dir = EXTRACT_DIR
    html_path = DEFAULT_HTML_PATH

    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    soup = BeautifulSoup(html, 'html.parser')

    img_count = 0
    saved_paths = []
    for img_tag in soup.find_all('img'):
        src = img_tag.get('src')
        if src and src.startswith('data:'):
            try:
                header, b64data = src.split(',', 1)
                if ';base64' in header:
                    img_bytes = base64.b64decode(b64data)
                    img = Image.open(io.BytesIO(img_bytes))
                    img_path = os.path.join(output_dir, f'image_{img_count}.png')
                    img.save(img_path, format='PNG')
                    saved_paths.append(img_path)
                    img_count += 1
            except Exception:
                continue
    return saved_paths