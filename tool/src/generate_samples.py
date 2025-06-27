import os
from samples.table_samples import generate_train_samples_file, generate_test_samples_file


def main():
    # 指定样本文档路径
    src_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(src_dir)
    train_samples_doc_path = os.path.join(project_dir, "document", "document_samples", "训练集.docx")
    test_samples_doc_path = os.path.join(project_dir, "document", "document_samples", "测试集.docx")

    print(f"处理文档: {train_samples_doc_path}")
    result_path = generate_train_samples_file(train_samples_doc_path)
    
    if result_path:
        print(f"训练样本生成成功: {result_path}")
    else:
        print("训练样本生成失败")

    print(f"处理文档: {test_samples_doc_path}")
    result_path = generate_test_samples_file(test_samples_doc_path)

    if result_path:
        print(f"测试样本生成成功: {result_path}")
    else:
        print("测试样本生成失败")

if __name__ == "__main__":
    main()