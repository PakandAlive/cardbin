# cardbinSearch

一个用于实时查询银行卡 BIN 信息的网站。

## 功能特点

- 🎨 现代化深色主题界面
- 🔍 实时 BIN 查询
- 📱 响应式设计，支持移动端
- ⚡ 快速查询响应
- 🛡️ 错误处理和用户友好提示

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + JavaScript
- **API**: RapidAPI BIN Checker

## 部署与使用

### 1. 克隆项目
```bash
git clone https://github.com/你的用户名/cardbinSearch.git
cd cardbinSearch
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录新建 `.env` 文件，内容如下：
```env
RAPIDAPI_KEY=你的RapidAPI密钥
```

### 4. 启动服务
```bash
npm start
```
或开发模式：
```bash
npm run dev
```

### 5. 访问网站
浏览器打开: http://localhost:20209

## 目录结构
```
bincheck/
├── server.js             # 后端服务器
├── public/               # 前端静态文件
│   ├── index.html        # 首页
│   ├── result.html       # 结果页面
│   ├── style.css         # 样式文件
│   └── script.js         # 前端逻辑
├── package.json          # 项目配置文件
├── README.md             # 项目说明
└── .env                  # 环境变量（需自行创建）
```

## 注意事项
- RapidAPI Key 必须通过 `.env` 文件配置，切勿提交密钥到 GitHub。
- 如需使用代理，可设置环境变量 `ALL_PROXY`。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

ISC 

## 环境变量配置说明

1. 安装 dotenv 依赖（只需一次）：
   ```bash
   npm install dotenv
   ```
2. 在 `server.js` 顶部添加：
   ```js
   require('dotenv').config();
   ```
3. 确保 `.env` 文件在项目根目录，内容如下：
   ```env
   RAPIDAPI_KEY=你的RapidAPI密钥
   ```

### 常见问题排查
- 如果 API Key 无法读取，请确认 `.env` 文件路径、内容和 `require('dotenv').config();` 是否正确。
- 修改 `.env` 后需重启服务。 