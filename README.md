# DeepSeek Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

一个基于 DeepSeek API 的命令行聊天工具，支持流式响应和配置持久化。

## 功能特性

- 🌟 **命令行交互**：直接在终端与 DeepSeek 模型聊天。
- 🔑 **配置持久化**：首次使用时配置 API 密钥和基础 URL，后续无需重复输入。
- 🚀 **流式响应**：实时接收模型响应，体验更流畅。
- 🎨 **彩色输出**：使用 `chalk` 实现彩色终端输出，提升可读性。
- ⚙️ **灵活配置**：支持自定义 API 基础 URL 和其他参数。

## 安装

通过 npm 全局安装：

```bash
npm install -g deepseek-chat
```

## 配置 API 参数
首次使用需要配置 DeepSeek API 密钥和基础 URL：
```bash
deepseek-chat config
```
按照提示输入以下信息：

模型名称：默认deepseek-ai/DeepSeek-V3

API 密钥：您的 DeepSeek API 密钥。

API 基础 URL：DeepSeek API 的基础 URL（默认：https://api.deepseek.com/v1）。

配置完成后，信息会存储在本地，后续无需重复输入。

## 启动聊天
运行以下命令启动聊天：
```bash
deepseek-chat chat
```

## 查看帮助
查看所有可用命令和选项：
```bash
deepseek-chat --help
```

## 示例
配置 API 参数
```bash
$ deepseek-chat config
🌟 首次使用需要配置API参数
? 请输入模型名称：deepseek-ai/DeepSeek-V3
? 请输入Deepseek API密钥： sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
? API基础地址（默认：https://api.deepseek.com/v1）： https://api.deepseek.com/v1
✅ 配置已保存！
```

## 启动聊天
```bash
$ deepseek-chat chat
💬 进入聊天模式

你： 你好，DeepSeek！
DeepSeek： 你好！有什么我可以帮你的吗？
```

## 许可证
本项目基于 MIT 许可证 开源。