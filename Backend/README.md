# Figma Plugin Backend Service

这是一个用于Figma插件的后端服务，主要功能是代理Smart API请求并管理敏感的API密钥信息。

## 功能特性

- 🔐 **安全管理**：API密钥等敏感信息存储在后端，避免前端暴露
- 🔄 **API代理**：代理前端对Smart API的请求
- 📤 **文件上传**：支持上传图片、PDF、文档等文件（使用 invoke_with_files 端点）
- 📊 **健康检查**：提供服务状态监控接口
- 🛡️ **错误处理**：完善的错误处理和日志记录
- 🌐 **CORS支持**：支持跨域请求

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制环境变量模板：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置您的Smart API信息：
```env
SMART_API_URL=https://smart.shopee.io/apis/smart/v1/workflow_orchestrator/deployments/invoke
SMART_INVOKE_WITH_FILES_URL=https://smart.shopee.io/apis/smart/v1/orchestrator/deployments/invoke_with_files
SMART_DEPLOYMENT_HASH_ID=your_deployment_hash_id
SMART_DEPLOYMENT_KEY=your_deployment_key
PORT=3001
NODE_ENV=development
API_TIMEOUT=60000
```

### 3. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API接口

### 健康检查
- **GET** `/health`
- 返回服务状态信息

```json
{
  "status": "ok",
  "message": "Figma Plugin Backend Service is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 生成界面配置
- **POST** `/api/smart/generate`
- 代理Smart API请求，支持文本和文件上传

**纯文本请求** (`application/json`)：
```json
{
  "query": "创建一个数据管理页面，包含顶部导航栏、左侧边栏、页面标题和数据表格"
}
```

**带文件请求** (`multipart/form-data`)：
- `query`: 文本描述（可选，有文件时）
- `files`: 上传的文件（支持多文件）

支持的文件类型：图片（JPEG, PNG, GIF, WEBP）、文档（PDF, DOC, DOCX, TXT）
文件大小限制：单文件 15MB

成功响应：
```json
{
  "success": true,
  "data": {
    "answer": "Smart API返回的内容"
  }
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息（仅开发环境）"
}
```

### 获取配置信息
- **GET** `/api/config`
- 返回非敏感的配置信息

```json
{
  "apiUrl": "https://smart.shopee.io/...",
  "timeout": 60000,
  "environment": "development"
}
```

## 部署说明

### Docker部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

构建和运行：
```bash
docker build -t figma-plugin-backend .
docker run -p 3001:3001 --env-file .env figma-plugin-backend
```

### PM2部署

安装PM2：
```bash
npm install -g pm2
```

启动服务：
```bash
pm2 start server.js --name "figma-plugin-backend"
```

## 安全注意事项

1. **API密钥保护**：绝不要将API密钥提交到版本控制系统
2. **HTTPS使用**：生产环境建议使用HTTPS
3. **CORS配置**：根据实际需要配置允许的域名
4. **日志管理**：避免在日志中记录敏感信息

## 故障排除

### 常见问题

1. **连接Smart API失败**
   - 检查SMART_API_URL是否正确
   - 确认Smart服务是否正常运行
   - 确认网络可以访问 smart.shopee.io

2. **API认证错误**
   - 验证SMART_DEPLOYMENT_HASH_ID是否有效
   - 验证SMART_DEPLOYMENT_KEY是否有效
   - 检查API密钥权限

3. **CORS错误**
   - 确认前端域名在允许列表中
   - 检查CORS配置

### 日志查看

开发环境日志会直接输出到控制台。生产环境建议使用日志管理工具。

## 开发

### 项目结构
```
backend/
├── server.js          # 主服务文件
├── package.json       # 依赖配置
├── env.example        # 环境变量模板
└── README.md         # 说明文档
```

### 添加新接口

在 `server.js` 中添加新的路由：

```javascript
app.get('/api/new-endpoint', (req, res) => {
  res.json({ message: 'New endpoint' });
});
```
