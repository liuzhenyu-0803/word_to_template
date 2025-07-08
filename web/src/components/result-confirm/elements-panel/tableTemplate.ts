import { DATA_ORIGINAL_CONTENT } from '../../../constants';

export const TABLE_CSS = `
/* 全局重置：清除所有元素的 margin 和 padding，统一盒模型 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* 页面主体布局样式 */
body {
    width: fit-content;
    height: 100dvh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: hidden;
}

/* 表格整体样式 */
table {
    border-collapse: collapse;
}

/* 表格单元格基础样式 */
td {
    min-width: 100px;
    border: 1px solid #ddd;
    text-align: left;
    position: relative;
    padding: 0 10px;
    -webkit-user-select: none;
}

/* 单元格内容与控件的 flex 容器 */
.cell-flex-row {
    min-height: 40px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.cell-content {
    flex: 1;
    min-width: 0;
    min-height: 21px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}

/* 单元格内输入框样式 */
td textarea {
    flex: 1; 
    min-width: 0;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: inherit;
    resize: none;
}

/* 控制按钮容器（编辑/下拉/撤销） */
.controls {
    display: flex;
    gap: 5px;
    align-items: center;
    opacity: 0;
}

/* 悬停单元格时显示控制按钮 */
td:hover .controls {
    opacity: 1;
}

/* 控制按钮基础样式 */
.controls button {
    cursor: pointer;
    border: none;
    background: none;
}

/* 下拉菜单容器样式 */
.dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 100px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    right: 0;
    top: 100%;
}

/* 显示下拉菜单的样式 */
.dropdown-content.show {
    display: block;
}

/* 下拉菜单选项样式 */
.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
}

/* 下拉菜单选项悬停高亮 */
.dropdown-content a:hover {
    background-color: #f1f1f1;
}`;

export const TABLE_JS = `
(() => {
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
        const cells = table.getElementsByTagName('td');
        for (const cell of cells) {
            if (!cell.hasAttribute('${DATA_ORIGINAL_CONTENT}')) {
                cell.setAttribute('${DATA_ORIGINAL_CONTENT}', cell.textContent);
            }
            currentContent = cell.textContent;
            cell.textContent = '';

            const flexDiv = document.createElement('div');
            flexDiv.className = 'cell-flex-row';

            const contentSpan = document.createElement('span');
            contentSpan.className = 'cell-content';
            contentSpan.textContent = currentContent;

            const controls = document.createElement('div');
            controls.className = 'controls';

            const dropdownButton = document.createElement('button');
            dropdownButton.innerHTML = '&#9662;';
            dropdownButton.title = '选项';

            const undoButton = document.createElement('button');
            undoButton.innerHTML = '&#8634;';
            undoButton.title = '撤销';

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

            cell.addEventListener('dblclick', (e) => {
                if (flexDiv.querySelector('textarea')) return;

                const textarea = document.createElement('textarea');
                textarea.value = contentSpan.textContent;

                textarea.style.width = contentSpan.offsetWidth + 'px';
                // 使用常量计算最小高度
                textarea.style.height = contentSpan.offsetHeight + 'px';

                contentSpan.style.display = 'none';
                flexDiv.insertBefore(textarea, controls);
                textarea.focus();

                const adjustHeight = () => {
                    const newHeight = Math.max(textarea.scrollHeight, contentSpan.offsetHeight);
                    textarea.style.height = newHeight + 'px';
                };

                const finishEditing = (saveChanges) => {
                    if (!flexDiv.contains(textarea)) return;
                    if (saveChanges) {
                        contentSpan.textContent = textarea.value;
                    }
                    flexDiv.removeChild(textarea);
                    contentSpan.style.display = '';
                };

                textarea.addEventListener('blur', () => finishEditing(true));
                textarea.addEventListener('input', adjustHeight);
                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        finishEditing(false);
                    } else if (e.key === 'Enter' && e.ctrlKey) {
                        finishEditing(true);
                    }
                });
            });

            dropdownButton.addEventListener('click', (e) => {
                document.querySelectorAll('.dropdown-content.show').forEach(d => {
                    if (d !== dropdownContent) d.classList.remove('show');
                });
                dropdownContent.classList.toggle('show');
            });
      
            dropdownContent.querySelectorAll('a').forEach(option => {
                option.addEventListener('click', (e) => {
                    contentSpan.textContent = option.textContent;
                    dropdownContent.classList.remove('show');
                });
            });

            undoButton.addEventListener('click', (e) => {
                contentSpan.textContent = cell.getAttribute('${DATA_ORIGINAL_CONTENT}');
            });
        }
    });

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