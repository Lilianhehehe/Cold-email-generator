# Cold Email Generator

一个用于生成研究助理申请邮件的网页应用，集成了Coze工作流API。

## 功能特性

- 📝 **智能邮件生成**: 基于个人信息和实验室网站生成专业的cold email
- 💾 **模板管理**: 保存和管理多个个人信息模板
- 📚 **历史记录**: 查看和管理生成的邮件历史
- 🎨 **简洁设计**: 浅蓝色主题的现代化界面
- 📱 **响应式布局**: 支持桌面和移动设备
- 🔒 **本地存储**: 数据保存在浏览器本地，保护隐私

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env` 文件并配置你的Coze API信息：

```bash
# Coze API Configuration
COZE_API_KEY=your_coze_api_key_here
COZE_WORKFLOW_ID=your_workflow_id_here
COZE_API_BASE_URL=https://api.coze.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

**重要**: 你需要：
1. 将 `COZE_API_KEY` 替换为你的实际API密钥
2. 将 `COZE_WORKFLOW_ID` 替换为你的工作流ID
3. 根据实际的Coze API文档调整 `COZE_API_BASE_URL`

### 3. 启动应用
```bash
npm start
```

应用将在 `http://localhost:3000` 启动。

## 使用说明

### 生成邮件
1. 填写必填信息：
   - 姓名 (Name)
   - 学校 (School)  
   - 年级 (Grade)
   - 专业 (Major)
   - 学术背景 (Academic Background)
   - 实验室网站 (Lab Website)

2. 可选填写：
   - 研究经验 (Research Experience)
   - 技能 (Skills)
   - 兴趣领域 (Interest Area)

3. 点击 "Generate Email" 生成邮件

### 模板管理
- **保存模板**: 填写表单后点击 "Save as Template"
- **加载模板**: 在Templates标签页选择模板并点击 "Load"
- **删除模板**: 在Templates标签页点击 "Delete"

### 历史记录
- **查看历史**: 在History标签页查看所有生成的邮件
- **复制邮件**: 点击 "Copy" 复制邮件内容
- **重用数据**: 点击 "Load Data" 将历史数据加载到表单

## 项目结构

```
cold-email-generator/
├── public/                 # 前端文件
│   ├── index.html         # 主页面
│   ├── styles.css         # 样式文件
│   └── script.js          # JavaScript逻辑
├── server.js              # Express服务器
├── package.json           # 项目配置
├── .env                   # 环境变量
└── README.md             # 说明文档
```

## API接口

### POST /api/generate-email
生成cold email

**请求体**:
```json
{
  "name": "Your Name",
  "school": "Your School",
  "grade": "Your Grade",
  "major": "Your Major",
  "academic_background": "Your Academic Background",
  "lab_website": "https://lab-website.com",
  "research_experience": "Optional",
  "skill": "Optional",
  "interest_area": "Optional"
}
```

**响应**:
```json
{
  "success": true,
  "email": "Generated email content...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/health
健康检查接口

## 开发

### 开发模式
```bash
npm run dev
```

使用nodemon自动重启服务器。

### 技术栈
- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript
- **API集成**: Axios
- **存储**: localStorage (前端)

## 注意事项

1. **API配置**: 确保正确配置Coze API的相关信息
2. **网络连接**: 生成邮件需要网络连接到Coze API
3. **浏览器兼容**: 建议使用现代浏览器 (Chrome, Firefox, Safari, Edge)
4. **数据安全**: 个人信息存储在浏览器本地，不会上传到服务器

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查网络连接
   - 验证API密钥是否正确
   - 确认工作流ID是否正确

2. **服务器启动失败**
   - 检查端口3000是否被占用
   - 确认所有依赖已正确安装

3. **模板/历史记录丢失**
   - 数据存储在浏览器localStorage中
   - 清除浏览器数据会导致数据丢失

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！
