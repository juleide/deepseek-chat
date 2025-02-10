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
      message: '请输入模型名称（默认：DeepSeek-V3）：',
      default: 'DeepSeek-V3'
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
  console.log(chalk.green('✅ 配置已保存！'));
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
  
  console.log(chalk.cyan('\n💬 进入聊天模式 \n'));
  
  const modelName = config.get('modelName') || 'deepseek-chat';
  const chatLoop = async () => {
    rl.question(chalk.blue('你： '), async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      
      try {
        process.stdout.write(chalk.green('DeepSeek：'));
        
        const response = await client.post('/chat/completions', {
          model: `deepseek-ai/${modelName}`,
          messages: [{ role: 'user', content: input }],
          stream: true
        }, {
          responseType: 'stream'
        });

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

program.command('chat')
  .description('启动聊天')
  .action(startChat);

program.parse();