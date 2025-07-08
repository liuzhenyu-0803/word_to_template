import { DATA_ORIGINAL_CONTENT } from '../../../constants';

export const TABLE_CSS = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    width: fit-content;
    height: 100dvh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: hidden;
}

table {
    border-collapse: collapse;
}

td {
    min-width: 100px;
    border: 1px solid #ddd;
    text-align: left;
    position: relative;
    padding: 0 10px;
    -webkit-user-select: none;
}

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

td textarea {
    flex: 1; 
    min-width: 0;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: inherit;
    resize: none;
}

.controls {
    display: flex;
    gap: 5px;
    align-items: center;
    opacity: 0;
}

td:hover .controls {
    opacity: 1;
}

.controls button {
    cursor: pointer;
    border: none;
    background: none;
}

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

.dropdown-content.show {
    display: block;
}

.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
}

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

export function generateTableHTML(content: string): string {
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