#!/usr/bin/env node
import { program } from 'commander';
import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Configstore from 'configstore';
import { createInterface } from 'readline';

// 初始化配置存储
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pkg = require('../package.json');
const config = new Configstore(pkg.name);

// 添加配置管理
const addConfig = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelName',
      message: '请输入模型名称：',
      validate: input => !!input || '模型名称不能为空'
    },
    {
      type: 'input',
      name: 'model_ID',
      message: '请输入模型ID（默认：deepseek-ai/DeepSeek-V3）：',
      default: 'deepseek-ai/DeepSeek-V3'
    },
    {
      type: 'input',
      name: 'apiKey',
      message: '请输入模型API密钥：',
      validate: input => !!input || 'API密钥不能为空'
    },
    {
      type: 'input',
      name: 'baseURL',
      message: 'API基础地址（默认：https://api.deepseek.com/v1）：',
      default: 'https://api.deepseek.com/v1'
    }
  ]);
  
  const configs = config.get('configs') || {};
  configs[answers.modelName] = {
    model_ID: answers.model_ID,
    apiKey: answers.apiKey,
    baseURL: answers.baseURL
  };
  config.set('configs', configs);
  console.log(chalk.green(`✅ 模型配置 ${answers.modelName} 已保存！`));
};

// 选择配置
const selectConfig = async () => {
  const configs = config.get('configs') || {};
  if (Object.keys(configs).length === 0) {
    console.log(chalk.red('⚠️ 没有可用的模型，请先添加模型配置'));
    return;
  }

  const currentConfig = config.get('currentConfig');
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: '请选择要使用的模型：',
      choices: Object.keys(configs),
      default: currentConfig || ''
    }
  ]);

  config.set('currentConfig', selectedConfig);
  console.log(chalk.green(`✅ 已切换到模型 ${selectedConfig}`));
  startChat();
};

// 修改模型配置
const editConfig = async () => {
  const configs = config.get('configs') || {};
  if (Object.keys(configs).length === 0) {
    console.log(chalk.red('⚠️ 没有可用的模型，请先添加模型配置'));
    return;
  }
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: '请选择要修改的模型：',
      choices: Object.keys(configs)
    }
  ]);

  const { model_ID, apiKey, baseURL } = configs[selectedConfig];
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelName',
      message: '请输入模型名称：',
      default: selectedConfig
    },
    {
      type: 'input',
      name: 'model_ID',
      message: '请输入模型ID：',
      default: model_ID
    },
    {
      type: 'input',
      name: 'apiKey',
      message: '请输入模型API密钥：',
      default: apiKey
    },
    {
      type: 'input',
      name: 'baseURL',
      message: 'API基础地址：',
      default: baseURL
    }
  ]);
  // modelName
  if (selectedConfig !== answers.modelName) {
    delete configs[selectedConfig];
  }
  configs[answers.modelName] = {
    model_ID: answers.model_ID,
    apiKey: answers.apiKey,
    baseURL: answers.baseURL
  };

  config.set('configs', configs);
  console.log(chalk.green(`✅ 模型 ${selectedConfig} 配置已更新！`));
}

// 删除模型配置
const deleteConfig = async () => {
  const configs = config.get('configs') || {};
  if (Object.keys(configs).length === 0) {
    console.log(chalk.red('⚠️ 没有可用的模型，请先添加模型配置'));
    return;
  }
  const { selectedConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedConfig',
      message: '请选择要删除的模型：',
      choices: Object.keys(configs)
    }
  ]);

  // 删除确认
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确认删除模型 ${selectedConfig} 吗？`
    }
  ]);
  if (!confirm) return;

  delete configs[selectedConfig];
  config.set('configs', configs);
  console.log(chalk.green(`✅ 模型 ${selectedConfig} 已删除！`));
};

// 删除所有配置
const deleteAllConfigs = async () => {
  const configs = config.get('configs') || {};
  if (Object.keys(configs).length === 0) {
    console.log(chalk.red('⚠️ 没有可用的模型，请先添加模型配置'));
    return;
  }

  // 删除确认
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `warning：确认删除所有模型配置吗？`
    }
  ]);
  if (!confirm) return;

  config.delete('configs');
  config.delete('currentConfig');
  console.log(chalk.green(`✅ 所有模型配置已删除！`));
};

// 显示模型列表
const showConfigs = () => {
  const configs = config.get('configs') || {};
  const currentConfig = config.get('currentConfig');
  console.log(chalk.cyan('\n🚀 配置信息 \n'));
  for (const [name, conf] of Object.entries(configs)) {
    console.log(chalk.cyan(` ${name === currentConfig ? chalk.red('* ') : '  '}模型名称：${name}`));
    console.log(chalk.cyan(`   模型ID：${conf.model_ID}`));
    console.log(chalk.cyan(`   API密钥：${conf.apiKey}`));
    console.log(chalk.cyan(`   API地址：${conf.baseURL}\n`));
  }
};

// 显示插件信息
const showInfo = () => {
  console.log(chalk.cyan('\n🚀 插件信息 \n'));
  console.log(chalk.cyan(`  版本：${pkg.version}`));
  console.log(chalk.cyan(`  作者：${pkg.author.name}`));
  console.log(chalk.cyan(`  项目地址：${pkg.repository.url}\n`));
  console.log(chalk.red('  💗 WangYanPing (✪ω✪) \n'));
};

// 初始化API客户端
const createClient = () => {
  const configs = config.get('configs') || {};
  const currentConfig = config.get('currentConfig');

  const { apiKey, baseURL } = configs[currentConfig];
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });
};

// 聊天会话
const startChat = async (options) => {
  const configs = config.get('configs') || {};
  const currentConfig = config.get('currentConfig');

  if (Object.keys(configs).length === 0) {
    console.log(chalk.red('⚠️ 没有可用的模型配置，请先添加模型'));
    return
  }

  if (!currentConfig || !configs[currentConfig]) {
    await selectConfig();
    return;
  }
  
  const { model_ID } = configs[currentConfig];
  const client = createClient();
  const max = options?.max || 1;
  let messages = [];

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.cyan(`\n💬 进入【${model_ID}】聊天模式 \n`));
  
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
      
      let loadingInterval
      try {
        // 显示loading动画
        const loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let loadingIndex = 0;
        loadingInterval = setInterval(() => {
          process.stdout.write(`\r${chalk.green(`${currentConfig}：`)} ${loadingChars[loadingIndex]}`);
          loadingIndex = (loadingIndex + 1) % loadingChars.length;
        }, 100);

        // 添加新消息到历史记录
        messages.push({ role: 'user', content: input });

        // 控制历史记录长度
        if (messages.length > max) {
          messages = messages.slice(-max);
        }
        
        const response = await client.post('/chat/completions', {
          model: model_ID,
          messages: messages,
          stream: true
        }, {
          responseType: 'stream'
        });

        // 清除loading动画
        clearInterval(loadingInterval);
        process.stdout.write(`\r${chalk.green(`${currentConfig}：`)} `);

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

        let assistantResponse = '';
        let hasResponse = false;
        response.data.on('data', chunk => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const message = line.replace(/^data: /, '');
              const parsed = JSON.parse(message);
              const content = parsed.choices[0].delta.content || '';
              if (!hasResponse) {
                if (content.trim() === '') {
                  continue;
                } else {
                  hasResponse = true;
                }
              }
              process.stdout.write(content);
              assistantResponse += content;
            } catch (err) {
              // 处理非JSON响应
            }
          }
        });

        response.data.on('end', () => {
          // 将助手回复添加到历史记录
          messages.push({ role: 'assistant', content: assistantResponse });
          console.log('\n');
          rl.input.removeListener('keypress', keypressHandler); // 移除监听器
          chatLoop();
        });

      } catch (error) {
        clearInterval(loadingInterval);  // 清除loading动画
        console.error(chalk.red('\n❌ 请求失败：'), error.message);
        chatLoop();
      }
    });
  };

  function removeLeadingSpaces(str) {
    return str.replace(/^\s+/, '');
  }

  chatLoop();
};

// 命令行配置
program
  .name('deepseek-chat')
  .description('DeepSeek 命令行聊天工具')
  .version(pkg.version);

// 添加新命令
program.command('add')
  .description('添加新的模型配置')
  .action(addConfig);

program.command('switch')
  .description('切换当前使用的模型配置')
  .action(selectConfig);

program.command('edit')
  .description('编辑模型配置')
  .action(editConfig);

program.command('delete')
  .description('删除模型配置')
  .action(deleteConfig);

program.command('deleteAll')
  .description('删除所有模型配置')
  .action(deleteAllConfigs);

program.command('list')
  .description('查看所有模型配置')
  .action(showConfigs);

program.command('info')
  .description('查看插件信息')
  .action(showInfo);

program.command('chat')
  .description('启动聊天')
  .option('-m, --max <number>', '设置历史记录最大长度', parseInt)
  .action(startChat);

program.parse();