# Word文档智能模板生成系统

本项目旨在实现Word文档到模板的自动化转换，通过整合文档转换、元素提取、语义匹配和内容替换等功能，提高文档处理效率。

## 项目结构概览

`src` 目录下包含了项目的核心代码，主要模块及其职责如下：

- **`main.py`**: 项目的主入口文件，定义了整个文档处理流程的顺序，包括转换、提取、替换和保存等步骤。
- **`client.py`**: 负责与外部WebSocket服务器进行通信，处理消息收发，并提供模板上传功能。
- **`callback/callback.py`**: 提供回调处理机制，用于在处理过程中输出进度信息，支持WebSocket和标准输出两种方式。
- **`converter/converter.py`**: 负责将Word文档转换为HTML格式，自动提取 HTML 中 data: 开头的图片为独立 png 文件（保存在 `document_images` 目录），并将 img 标签的 src 路径替换为对应 png 文件路径。转换时还会为 HTML 添加表格样式、`contenteditable` 属性，并标记表格单元格以供后续处理。
- **`extractors/extractor.py`**: 文档元素提取的封装模块，目前主要调用 `table_extractor` 来处理表格。
- **`extractors/table_extractor.py`**: 专门用于从HTML中提取表格内容，并将其保存为独立的HTML文件。
- **`global_define/constants.py`**: 定义了项目中使用的全局常量，如HTML属性名和WebSocket消息类型。
- **`mergers/merger.py`**: HTML合并模块的封装，主要调用 `table_merger` 将处理后的表格内容合并回原始HTML。
- **`mergers/table_merger.py`**: 负责将经过LLM处理后的表格单元格内容合并回总的HTML文件中，只替换有变更标记的单元格。
- **`models/model_manager.py`**: 模型管理器，提供统一的LLM（大型语言模型）调用接口，用于语义分析和内容生成。
- **`replacers/replacer.py`**: 文档元素替换的封装模块，目前主要调用 `table_replacer` 来处理表格。
- **`replacers/table_replacer.py`**: 负责对提取的表格进行语义匹配分析，并使用LLM生成的标签替换表格中的内容。
- **`savers/saver.py`**: 文档保存模块的封装，主要调用 `table_saver` 将替换后的内容保存回Word文档。
- **`savers/table_saver.py`**: 负责将HTML表格中的内容更新到Word文档对象中对应的表格，处理合并单元格和嵌套表格。
- **`task/task.py`**: 定义了文档处理和保存的任务流程，供 `client.py` 中的消息处理函数调用。

## 工作流程

1. **文档转换**: 将输入的Word文档通过 `converter` 模块转换为HTML格式，在此过程中，所有图片会被转换为浏览器兼容的 `.png` 格式，HTML 的 `<body>` 会被设置为可编辑，表格会添加单线边框，并为表格单元格添加自定义属性。
2. **元素提取**: `extractors` 模块从转换后的HTML中提取出独立的文档元素（目前主要是表格），保存为单独的HTML文件。
3. **内容替换**: `replacers` 模块（特别是 `table_replacer`）利用LLM对提取出的表格内容进行语义分析，识别关键信息并替换为模板标签。
4. **HTML合并**: `mergers` 模块将经过替换的表格内容合并回原始HTML结构中。
5. **文档保存**: `savers` 模块将更新后的HTML内容保存回新的Word文档，生成最终的模板文件。
6. **模板上传**: `client` 模块负责将生成的模板文档上传到服务器。

## 依赖

项目的依赖项列在 `requirements.txt` 文件中。其中，`pydocx` 用于Word到HTML的转换，`Pillow` 用于图片格式处理，`beautifulsoup4` 用于HTML解析，`base64` 和 `io` 用于图片数据处理。

## 运行

通过运行 `src/main.py` 或 `src/client.py` 来启动程序。`main.py` 演示了完整的处理流程，而 `client.py` 则作为WebSocket客户端与服务器交互，接收并处理文档任务。