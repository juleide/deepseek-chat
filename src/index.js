#!/usr/bin/env node
import { program } from 'commander';
import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Configstore from 'configstore';
import { createInterface } from 'readline';

// 初始化配置存储
import pkg from '../package.json' assert { type: 'json' };
const config = new Configstore(pkg.name);

// 初始化API客户端
const createClient = () => {
  const apiKey = config.get('apiKey');
  const baseURL = config.get('baseURL') || 'https://api.deepseek.com/v1';
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
};

// 配置向导
const setupConfig = async () => {
  console.log(chalk.yellow('\n🌟 首次使用需要配置API参数\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelName',
      message: '请输入模型名称（默认：deepseek-ai/DeepSeek-V3）：',
      default: 'deepseek-ai/DeepSeek-V3'
    },
    {
      type: 'input',
      name: 'apiKey',
      message: '请输入Deepseek API密钥：',
      validate: input => !!input || 'API密钥不能为空'
    },
    {
      type: 'input',
      name: 'baseURL',
      message: 'API基础地址（默认：https://api.deepseek.com/v1）：',
      default: 'https://api.deepseek.com/v1'
    }
  ]);
  
  config.set(answers);
  // 输出配置信息
  console.log(chalk.cyan('\n🚀 配置信息：'));
  console.log(chalk.cyan(`   模型名称：${answers.modelName}`));
  console.log(chalk.cyan(`   API密钥：${answers.apiKey}`));
  console.log(chalk.cyan(`   API地址：${answers.baseURL}`));
  console.log(chalk.green('✅ 配置已保存！运行deepseek-chat chat开始聊天\n'));
};

// 聊天会话
const startChat = async () => {
  if (!config.size) {
    console.log(chalk.red('⚠️  请先配置API参数'));
    await setupConfig();
  }
  
  const client = createClient();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.cyan('\n💬 进入聊天模式，Ctrl+X 停止大模型生成 \n'));
  
  const modelName = config.get('modelName');
  const chatLoop = async () => {
    rl.question(chalk.blue('你： '), async (input) => {
      if (input.trim() === '') {
        chatLoop();
        return;
      }
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      
      try {
        process.stdout.write(chalk.green('DeepSeek：'));
        
        // 显示loading动画
        const loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let loadingIndex = 0;
        const loadingInterval = setInterval(() => {
          process.stdout.write(`\r${chalk.green('DeepSeek：')} ${loadingChars[loadingIndex]}`);
          loadingIndex = (loadingIndex + 1) % loadingChars.length;
        }, 100);
        
        const response = await client.post('/chat/completions', {
          model: modelName,
          messages: [{ role: 'user', content: input }],
          stream: true
        }, {
          responseType: 'stream'
        });
        
        // 清除loading动画
        clearInterval(loadingInterval);
        process.stdout.write(`\r${chalk.green('DeepSeek：')}`);

        // 监听 Ctrl+X 终止回复
        const keypressHandler = (str, key) => {
          if (key.ctrl && key.name === 'x') {
            console.log(chalk.cyan('\n💬 已停止生成，请继续输入... \n'));
            response.data.destroy(); // 中断流
            rl.input.removeListener('keypress', keypressHandler); // 移除监听器
            chatLoop();
          }
        };
        rl.input.on('keypress', keypressHandler);

        response.data.on('data', chunk => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const message = line.replace(/^data: /, '');
              const parsed = JSON.parse(message);
              process.stdout.write(parsed.choices[0].delta.content || '');
            } catch (err) {
              // 处理非JSON响应
            }
          }
        });

        response.data.on('end', () => {
          console.log('\n');
          rl.input.removeListener('keypress', keypressHandler); // 移除监听器
          chatLoop();
        });

      } catch (error) {
        console.error(chalk.red('\n❌ 请求失败：'), error.message);
        chatLoop();
      }
    });
  };

  chatLoop();
};

// 命令行配置
program
  .name('deepseek-chat')
  .description('DeepSeek 命令行聊天工具')
  .version(pkg.version);

program.command('config')
  .description('配置API参数')
  .action(setupConfig);

program.command('remote')
  .description('查看config配置')
  .action(() => {
    const conf = config.all;
    console.log(chalk.cyan('\n🚀 配置信息：'));
    console.log(chalk.cyan(`   模型名称：${conf.modelName}`));
    console.log(chalk.cyan(`   API密钥：${conf.apiKey}`));
    console.log(chalk.cyan(`   API地址：${conf.baseURL}`));
  });

program.command('chat')
  .description('启动聊天')
  .action(startChat);

program.parse();