# Coze API 配置说明

## 当前状态

✅ **项目已完成**：网站界面、本地存储、模板管理等功能都已完成
⚠️ **API配置待完成**：需要正确配置Coze API才能生成真实邮件

## 临时测试功能

目前项目使用**模拟数据**来测试功能：
- 你可以正常使用所有界面功能
- 生成的邮件是基于你输入信息的模板邮件
- 所有本地功能（模板保存、历史记录）都正常工作

## API配置问题分析

从错误日志看到两个主要问题：

### 1. API Token 无效 (错误代码: 700012006)
```
{ code: 700012006, msg: 'access token invalid' }
```

**可能原因：**
- API key已过期
- API key权限不足
- 需要不同的认证方式

### 2. API端点可能不正确
当前使用：`https://api.coze.com/v1/workflow/run`

**需要确认：**
- 正确的API端点URL
- 请求格式是否正确
- 是否需要额外的headers

### 3. API调用格式
在 `server.js` 文件中，我们使用了以下格式调用Coze API：

```javascript
const cozeResponse = await axios.post(
    `${COZE_API_BASE_URL}/v1/workflow/run`,
    {
        workflow_id: process.env.COZE_WORKFLOW_ID,
        parameters: cozePayload
    },
    {
        headers: {
            'Authorization': `Bearer ${COZE_API_KEY}`,
            'Content-Type': 'application/json'
        }
    }
);
```

这个格式可能需要根据Coze的实际API文档进行调整。

## 如何获取这些信息

1. **登录Coze平台**
2. **找到你的工作流**
3. **查看工作流的API调用信息**
4. **获取工作流ID和正确的API端点**
5. **查看API调用的正确格式和参数结构**

## 测试API连接

你可以使用以下方法测试API连接：

1. **使用Postman或curl测试**：
   ```bash
   curl -X POST "你的API端点" \
     -H "Authorization: Bearer 你的API密钥" \
     -H "Content-Type: application/json" \
     -d '{
       "workflow_id": "你的工作流ID",
       "parameters": {
         "Lab_website": "https://example.com",
         "Name": "Test Name",
         "School": "Test School",
         "Grade": "Graduate",
         "Academic_Background": "Test Background",
         "Major": "Computer Science"
       }
     }'
   ```

2. **在网页中测试**：
   - 启动服务器后，填写表单并点击生成
   - 查看浏览器开发者工具的Network标签页
   - 查看服务器控制台的错误信息

## 可能需要修改的文件

如果API格式不匹配，你可能需要修改 `server.js` 文件中的以下部分：

1. **API端点URL**
2. **请求体格式**
3. **响应数据解析**
4. **错误处理**

## 当前项目状态

✅ **已完成**：
- 前端界面和用户体验
- 本地存储功能（模板和历史记录）
- 表单验证和数据处理
- 响应式设计
- 基础的API调用框架

⚠️ **待完成**：
- Coze API的具体配置和调试
- API调用格式的最终确认

## 立即行动步骤

### 1. 测试当前功能
现在你可以：
- 访问 `http://localhost:3000`
- 测试所有界面功能
- 保存模板和查看历史记录
- 生成模拟邮件（用于测试界面）

### 2. 获取正确的API信息
在Coze平台上查找：
- **API文档页面**：查看正确的API端点和调用格式
- **工作流设置**：确认API key权限和工作流发布状态
- **API调用示例**：获取正确的请求格式

### 3. 常见的Coze API端点格式
可能的正确格式：
```
https://api.coze.com/open_api/v2/chat
https://api.coze.cn/v1/workflow/run
https://api.coze.com/v1/bot/chat
```

### 4. 启用真实API
找到正确信息后，在 `.env` 文件中添加：
```bash
COZE_API_WORKING=true
```
这将禁用模拟模式，使用真实的Coze API。

## 需要你提供的信息

请在Coze平台上查找并提供：
1. **正确的API端点URL**
2. **API调用的示例代码**
3. **确认API key是否有效**
4. **工作流是否已正确发布**
