export const TABLE_CSS = `
/* 全局重置：清除所有元素的 margin 和 padding，统一盒模型 */
* {
    margin: 0; /* 清除所有元素的外边距 */
    padding: 0; /* 清除所有元素的内边距 */
    box-sizing: border-box; /* 设置盒模型为border-box，使宽度包含padding和border */
}

/* 页面主体布局样式 */
body {
    min-height: 100dvh; /* 最小高度为100动态视口高度 */
    padding: 20px; /* 内边距20px */
    display: flex; /* 启用弹性布局 */
    justify-content: center; /* 水平居中 */
    align-items: center; /* 垂直居中 */
    flex-direction: column; /* 纵向排列子元素 */
}

/* 表格整体样式 */
table {
    border-collapse: collapse; /* 合并相邻单元格边框为单一边框，消除默认的双边框间隙 */
}

/* 表格单元格基础样式 */
td {
    min-width: 100px; /* 固定每个单元格宽度100px */
    border: 1px solid #ddd; /* 1px灰色边框 */
    text-align: left; /* 文字左对齐 */
    position: relative; /* 为子元素绝对定位建立参照 */
    padding: 0 10px; /* 左右内边距10px */
    -webkit-user-select: none;
}

/* 单元格内容与控件的 flex 容器 */
.cell-flex-row {
    display: flex;
    align-items: center; /* 垂直居中按钮内容 */
    gap: 5px;
}

.cell-content {
    flex: 1; /* 占据剩余空间 */
    min-width: 0; /* 防止内容溢出时撑开单元格 */
    word-break: break-all; /* 长单词/长字符串自动换行 */
    white-space: pre-wrap; /* 保留换行并自动换行 */
    overflow-wrap: break-word; /* 兼容性换行 */
}

/* 单元格内输入框样式 */
td textarea {
    flex: 1; /* 占据剩余空间 */
    min-width: 0; /* 防止内容溢出时撑开单元格 */
    border: none; /* 1px浅灰色边框 */
    outline: none;
    font-family: inherit; /* 继承父元素字体 */
    font-size: inherit; /* 继承父元素字号 */
    resize: none; /* 禁止textarea任何方向调整大小 */
}

/* 控制按钮容器（编辑/下拉/撤销） */
.controls {
    display: flex; /* 显示控制按钮 */  
    gap: 5px; /* 按钮间距 */
    align-items: center; /* 垂直居中按钮内容 */
    opacity: 0; /* 默认隐藏 */
}

/* 悬停单元格时显示控制按钮 */
td:hover .controls {
    opacity: 1; /* 悬停时显示 */
}

/* 控制按钮基础样式 */
.controls button {
    cursor: pointer; /* 鼠标手型 */
    border: none; /* 无边框 */
    background: none; /* 透明背景 */
}

/* 下拉菜单容器样式 */
.dropdown-content {
    display: none; /* 默认隐藏 */
    position: absolute; /* 绝对定位 */
    background-color: #f9f9f9; /* 浅灰色背景 */
    min-width: 100px; /* 最小宽度100px */
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); /* 添加阴影效果 */
    z-index: 1; /* 确保悬浮层级 */
    right: 0; /* 右侧对齐 */
}

/* 显示下拉菜单的样式 */
.dropdown-content.show {
    display: block; /* 显示下拉菜单元素 */
}

/* 下拉菜单选项样式 */
.dropdown-content a {
    color: black; /* 黑色文字 */
    padding: 12px 16px; /* 内边距 */
    text-decoration: none; /* 无下划线 */
    display: block; /* 块级显示 */
}

/* 下拉菜单选项悬停高亮 */
.dropdown-content a:hover {
    background-color: #f1f1f1; /* 浅灰色背景 */
}`;

export const TABLE_JS = `
/**
 * 表格单元格增强脚本
 * - 支持单元格内容编辑、下拉菜单选项、撤销恢复
 * - 自动延迟执行，无需 DOMContentLoaded 事件
 */
(() => {
    // 获取页面所有表格
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        // 遍历每个表格的所有单元格
        const cells = table.getElementsByTagName('td');
        for (const cell of cells) {
            /**
             * 初始化单元格结构：
             * - 原始内容包裹在 span
             * - 添加控件（下拉、撤销按钮）
             */
            cell.setAttribute('data-original-content', cell.textContent);
            cell.textContent = '';

            // 创建flex容器，包含内容和控件
            const flexDiv = document.createElement('div');
            flexDiv.className = 'cell-flex-row';

            // 内容区
            const contentSpan = document.createElement('span');
            contentSpan.className = 'cell-content';
            contentSpan.textContent = cell.getAttribute('data-original-content');

            // 控件区
            const controls = document.createElement('div');
            controls.className = 'controls';

            // 下拉菜单按钮
            const dropdownButton = document.createElement('button');
            dropdownButton.innerHTML = '&#9662;';
            dropdownButton.title = '选项';

            // 撤销按钮
            const undoButton = document.createElement('button');
            undoButton.innerHTML = '&#8634;';
            undoButton.title = '撤销';

            // 下拉菜单内容
            const dropdownContent = document.createElement('div');
            dropdownContent.className = 'dropdown-content';
            dropdownContent.innerHTML = \`
                <a href="#">选项 1</a>
                <a href="#">选项 2</a>
                <a href="#">选项 3</a>
            \`;

            controls.appendChild(dropdownButton);
            controls.appendChild(undoButton);

            flexDiv.appendChild(contentSpan);
            flexDiv.appendChild(controls);

            cell.appendChild(flexDiv);
            cell.appendChild(dropdownContent);

            // 事件监听区

            // 双击单元格：进入编辑模式
            cell.addEventListener('dblclick', (e) => {
                if (flexDiv.querySelector('textarea')) return; // 已有编辑框则忽略

                // 创建多行文本编辑框
                const textarea = document.createElement('textarea');
                textarea.value = contentSpan.textContent;

                // 设置textarea宽度与cell-content一致
                textarea.style.width = contentSpan.offsetWidth + 'px';

                // 隐藏内容区，插入编辑框
                contentSpan.style.display = 'none';
                flexDiv.insertBefore(textarea, controls);
                textarea.focus();

                // 自动调整高度以适应内容
                const adjustHeight = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                };
                adjustHeight();

                // 结束编辑（保存/取消）
                const finishEditing = (saveChanges) => {
                    if (!flexDiv.contains(textarea)) return;
                    if (saveChanges) {
                        // 保留换行符，使用innerHTML显示
                        contentSpan.innerHTML = textarea.value.replace(/\\n/g, '<br>');
                    }
                    flexDiv.removeChild(textarea);
                    contentSpan.style.display = '';
                };

                // 失焦或按键事件
                textarea.addEventListener('blur', () => finishEditing(true));
                textarea.addEventListener('input', adjustHeight); // 内容变化时调整高度
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        finishEditing(false);
                    } else if (e.key === 'Enter' && e.ctrlKey) {
                        // Ctrl+Enter 保存并退出编辑
                        finishEditing(true);
                    }
                    // 普通Enter键允许换行
                });
            });

            // 下拉按钮点击：显示/隐藏菜单
            dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                // 关闭其他已打开菜单
                document.querySelectorAll('.dropdown-content.show').forEach(d => {
                    if (d !== dropdownContent) d.classList.remove('show');
                });
                dropdownContent.classList.toggle('show');
            });
      
            // 下拉菜单选项点击：替换内容
            dropdownContent.querySelectorAll('a').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    contentSpan.textContent = option.textContent;
                    dropdownContent.classList.remove('show');
                });
            });

            // 撤销按钮点击：恢复原始内容
            undoButton.addEventListener('click', (e) => {
                e.stopPropagation();
                contentSpan.textContent = cell.getAttribute('data-original-content');
            });
        }
    });

    /**
     * 全局点击事件：关闭所有下拉菜单
     */
    function handleGlobalClick(e) {
        if (!e.target.matches('.controls button')) {
            document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }
    window.addEventListener('click', handleGlobalClick);
})();`;

export const generateTableHTML = (content: string): string => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>元素预览</title>
  <style>${TABLE_CSS}</style>
</head>
<body>
  ${content}
  <script>${TABLE_JS}</script>
</body>
</html>`;
};