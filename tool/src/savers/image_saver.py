import os
import json
import shutil
import zipfile
import xml.etree.ElementTree as ET
from callback.callback import callback_handler
from global_define import constants

async def save_images():
    """
    将占位符图片根据映射关系写回Word文档的media目录。
    """
    try:
        await callback_handler.output_callback("--- 开始将占位符图片保存回Word文档 ---")

        # 1. 检查必要的映射文件是否存在
        if not os.path.exists(constants.IMAGE_PLACEHOLDER_MAP_PATH) or not os.path.exists(constants.IMAGE_MAP_PATH):
            await callback_handler.output_callback("警告：缺少图片映射文件，跳过图片保存。")
            return

        # 2. 读取映射文件
        await callback_handler.output_callback("步骤 1/4: 读取图片映射文件...")
        with open(constants.IMAGE_PLACEHOLDER_MAP_PATH, 'r', encoding='utf-8') as f:
            placeholder_map = json.load(f)
        with open(constants.IMAGE_MAP_PATH, 'r', encoding='utf-8') as f:
            image_map = json.load(f)

        if not placeholder_map:
            await callback_handler.output_callback("图片占位符映射为空，无需保存。")
            return

        # 3. 解压Word文档
        template_doc_path = constants.DEFAULT_TEMPLATE_DOC_PATH
        temp_unzip_dir = os.path.join(os.path.dirname(template_doc_path), "temp_unzip_save")
        if os.path.exists(temp_unzip_dir):
            shutil.rmtree(temp_unzip_dir)
        os.makedirs(temp_unzip_dir)

        await callback_handler.output_callback(f"步骤 2/4: 解压文档 {template_doc_path} 到临时目录...")
        with zipfile.ZipFile(template_doc_path, 'r') as zip_ref:
            zip_ref.extractall(temp_unzip_dir)

        # 4. 替换media中的图片
        await callback_handler.output_callback("步骤 3/4: 替换media文件夹中的图片...")
        media_dir = os.path.join(temp_unzip_dir, 'word', 'media')
        replaced_count = 0
        filename_changes = {} # 用于记录文件名（格式）的变化
        for html_img_index, placeholder_filename in placeholder_map.items():
            # 在image_map中查找对应的Word media文件名
            word_media_filename = image_map.get(str(html_img_index))

            if word_media_filename:
                placeholder_image_path = os.path.join(constants.PLACEHOLDER_IMAGES_DIR, placeholder_filename)
                target_image_path = os.path.join(media_dir, os.path.basename(word_media_filename))

                if os.path.exists(placeholder_image_path) and os.path.exists(target_image_path):
                    source_ext = os.path.splitext(placeholder_image_path)[1].lower()
                    target_ext = os.path.splitext(target_image_path)[1].lower()

                    if source_ext == '.svg' and source_ext != target_ext:
                        # 将SVG转换为目标格式
                        try:
                            # 对于emf等特殊格式，统一转为png，word会处理
                            output_format = 'png' if target_ext in ['.emf', '.wmf'] else target_ext.lstrip('.')
                            temp_output_path = os.path.splitext(target_image_path)[0] + f'.{output_format}'
                            
                            # 使用 svglib 和 reportlab 进行转换
                            drawing = svg2rlg(placeholder_image_path)
                            renderPM.drawToFile(drawing, temp_output_path, fmt=output_format.upper())

                            # 如果转换后的文件名与目标不同，需要重命名
                            if os.path.basename(temp_output_path) != os.path.basename(target_image_path):
                                # 先删除旧文件，再重命名新文件
                                os.remove(target_image_path)
                                os.rename(temp_output_path, target_image_path)
                                # 记录文件名变化
                                old_filename = os.path.basename(word_media_filename)
                                new_filename = os.path.basename(target_image_path)
                                if old_filename != new_filename:
                                    filename_changes[old_filename] = new_filename

                            await callback_handler.output_callback(f"  - 已将 {placeholder_filename} (转换为 {output_format}) 替换到 {os.path.basename(word_media_filename)}")
                            replaced_count += 1
                        except Exception as convert_e:
                            await callback_handler.output_callback(f"  - 错误: 转换SVG时出错: {convert_e}")
                    else:
                        # 格式相同，直接复制
                        shutil.copy(placeholder_image_path, target_image_path)
                        await callback_handler.output_callback(f"  - 已将 {placeholder_filename} 替换到 {os.path.basename(word_media_filename)}")
                        replaced_count += 1
                else:
                    await callback_handler.output_callback(f"  - 警告: 找不到源占位符图片 {placeholder_image_path} 或目标图片 {target_image_path}，跳过。")
            else:
                await callback_handler.output_callback(f"  - 警告: 在image_map.json中找不到HTML图片索引 {html_img_index} 对应的Word media图片，跳过。")

        # 5. 如果有文件名变化，更新 .rels 文件
        if filename_changes:
            await callback_handler.output_callback("步骤 4/5: 更新 word/_rels/document.xml.rels 文件...")
            rels_path = os.path.join(temp_unzip_dir, 'word', '_rels', 'document.xml.rels')
            if os.path.exists(rels_path):
                tree = ET.parse(rels_path)
                root = tree.getroot()
                # 命名空间
                ns = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}
                for rel in root.findall('r:Relationship', ns):
                    target = rel.get('Target')
                    if target:
                        original_filename = os.path.basename(target)
                        if original_filename in filename_changes:
                            new_target = os.path.join('media', filename_changes[original_filename]).replace('\\', '/')
                            rel.set('Target', new_target)
                            await callback_handler.output_callback(f"  - 更新关系: {target} -> {new_target}")
                tree.write(rels_path)
            else:
                await callback_handler.output_callback("  - 警告: 未找到 document.xml.rels 文件。")


        # 6. 重新打包
        await callback_handler.output_callback("步骤 5/5: 重新打包Word文档...")
        with zipfile.ZipFile(template_doc_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(temp_unzip_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_unzip_dir)
                    zipf.write(file_path, arcname)

        # 7. 清理临时文件
        shutil.rmtree(temp_unzip_dir)

        await callback_handler.output_callback(f"--- 图片保存完成，共替换 {replaced_count} 张图片 ---\n")

    except Exception as e:
        await callback_handler.output_callback(f"保存图片到Word时出错: {e}")
        import traceback
        traceback.print_exc()
        # 如果出错，确保清理临时目录
        if 'temp_unzip_dir' in locals() and os.path.exists(temp_unzip_dir):
            shutil.rmtree(temp_unzip_dir)