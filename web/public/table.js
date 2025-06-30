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
            dropdownContent.innerHTML = `
                <a href="#">选项 1</a>
                <a href="#">选项 2</a>
                <a href="#">选项 3</a>
            `;

            controls.appendChild(dropdownButton);
            controls.appendChild(undoButton);

            flexDiv.appendChild(contentSpan);
            flexDiv.appendChild(controls);

            cell.appendChild(flexDiv);
            cell.appendChild(dropdownContent);

            // 事件监听区

            // 双击单元格：进入编辑模式
            cell.addEventListener('dblclick', (e) => {
                if (flexDiv.querySelector('input')) return; // 已有输入框则忽略

                // 创建输入框
                const input = document.createElement('input');
                input.type = 'text';
                input.value = contentSpan.textContent;

                // 隐藏内容区，插入输入框
                contentSpan.style.display = 'none';
                flexDiv.insertBefore(input, controls);
                input.focus();

                // 结束编辑（保存/取消）
                const finishEditing = (saveChanges) => {
                    if (!flexDiv.contains(input)) return;
                    if (saveChanges) {
                        contentSpan.innerHTML = input.value;
                    }
                    flexDiv.removeChild(input);
                    contentSpan.style.display = '';
                };

                // 失焦或按键事件
                input.addEventListener('blur', () => finishEditing(true));
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        finishEditing(true);
                    } else if (e.key === 'Escape') {
                        finishEditing(false);
                    }
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
})();