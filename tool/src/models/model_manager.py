#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
模型管理器 - 提供统一的LLM调用接口
"""

import os
from typing import List, Dict
from openai import OpenAI


class ModelManager:
    """
    模型管理器类 - 提供统一的接口调用LLM
    """
    
    def __init__(self, 
                 api_key: str = "1sk-or-v1-37dd84eb11baaebb4da929794ab5e01463b5b797f6738f0c9f4dce1af1862a7c",
                 base_url: str = "https://openrouter.ai/api/v1",
                 model: str = "google/gemma-3n-e4b-it"):
        """
        初始化API模型
        
        Args:
            api_key: API密钥
            base_url: API基础URL
            model: 模型名称
        """
        # 初始化客户端            
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        # self.model = "google/gemma-3-12b-it"
        # self.model = "google/gemma-3-12b-it"
        # self.model = "amazon/nova-lite-v1"
        # self.model = "google/gemini-2.0-flash-lite-001"
        self.model = "google/gemini-2.5-flash-lite-preview-06-17"
    
    def create_completion(self, messages: List[Dict[str, str]]):
        """
        流式创建聊天完成

        Args:
            messages: 消息列表，格式为[{"role": "user", "content": "内容"}]

        Yields:
            str: 每次生成的内容片段
        """
        if not self.client:
            print("模型客户端未初始化")
            return

        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0,
                stream=True
            )
            for chunk in stream:
                if hasattr(chunk.choices[0].delta, "content") and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            print(f"调用模型失败: {str(e)}")
            return


# 全局单例实例
llm_manager = ModelManager()
