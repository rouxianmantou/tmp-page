# 股票订阅恶搞页面 - 部署指南

## 项目说明
这是一个高端股票订阅页面，用户输入邮箱后会看到搞笑的猫猫"这你也信"页面。适合与同事开玩笑！

## 文件说明
- `stock-prank.html` - 主页面文件（包含订阅页面和恶搞页面）
- `worker.js` - Cloudflare Workers 代码（可选，用于保存邮箱）
- `wrangler.toml` - Workers 配置文件

## 部署方式

### 方式一：仅部署 HTML 到 Cloudflare Pages（推荐，最简单）

1. **准备文件**
   - 只需要 `stock-prank.html` 文件
   - 可以重命名为 `index.html`

2. **部署到 Cloudflare Pages**
   ```bash
   # 登录 Cloudflare Dashboard
   # 进入 Pages
   # 点击 "Create a project"
   # 上传 index.html 文件
   # 或者连接 Git 仓库自动部署
   ```

3. **不使用 Workers 保存邮箱**
   - HTML 中的 `saveEmail()` 函数会静默失败
   - 但恶搞效果依然完整
   - 用户输入的邮箱会显示在恶搞页面上

### 方式二：使用 Workers + Pages（可保存邮箱数据）

#### 步骤 1：创建 KV Namespace
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录
wrangler login

# 创建 KV namespace
wrangler kv:namespace create "EMAILS"
```

记录返回的 `id`，替换 `wrangler.toml` 中的 `your_kv_namespace_id_here`

#### 步骤 2：部署 Workers
```bash
# 部署 Worker
wrangler deploy
```

#### 步骤 3：修改 HTML
将 HTML 中的 API 调用地址改为你的 Worker 地址：
```javascript
await fetch('https://your-worker.your-subdomain.workers.dev/api/save-email', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email })
});
```

#### 步骤 4：部署 HTML 到 Pages
- 将修改后的 HTML 上传到 Cloudflare Pages
- 完成！

### 方式三：Workers + Functions（推荐用于完整功能）

1. **项目结构**
   ```
   /
   ├── stock-prank.html (重命名为 index.html)
   └── functions/
       └── api/
           └── save-email.js
   ```

2. **创建 Functions 文件**
   在项目根目录创建 `functions/api/save-email.js`：
   ```javascript
   export async function onRequestPost(context) {
     const { request, env } = context;
     
     try {
       const { email } = await request.json();
       
       if (!email || !email.includes('@')) {
         return new Response(JSON.stringify({ error: '无效邮箱' }), {
           status: 400,
           headers: { 'Content-Type': 'application/json' }
         });
       }

       const emailData = {
         email,
         timestamp: new Date().toISOString(),
         ip: request.headers.get('CF-Connecting-IP')
       };

       if (env.EMAILS) {
         const key = `email_${Date.now()}`;
         await env.EMAILS.put(key, JSON.stringify(emailData));
       }

       return new Response(JSON.stringify({ success: true }), {
         headers: { 'Content-Type': 'application/json' }
       });
     } catch (error) {
       return new Response(JSON.stringify({ error: '保存失败' }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
     }
   }
   ```

3. **在 Pages 设置中绑定 KV**
   - 进入你的 Pages 项目
   - Settings → Functions → KV namespace bindings
   - 添加绑定：变量名 `EMAILS`，选择你创建的 KV namespace

## 查看收集到的邮箱

### 如果使用了 Workers
访问：`https://your-worker.your-subdomain.workers.dev/api/get-emails`

### 使用 Wrangler CLI 查看 KV
```bash
# 列出所有 keys
wrangler kv:key list --namespace-id=your_kv_namespace_id

# 查看邮箱列表
wrangler kv:key get "email_list" --namespace-id=your_kv_namespace_id
```

## 功能特点

### 订阅页面
- ✅ 高端金融风格设计
- ✅ 流畅的动画效果
- ✅ 响应式布局
- ✅ 前端邮箱验证

### 恶搞页面
- ✅ 搞笑猫猫动画
- ✅ 五彩纸屑特效
- ✅ 显示被记录的邮箱
- ✅ 可重置重新玩

### 数据收集（可选）
- ✅ 保存邮箱地址
- ✅ 记录时间戳
- ✅ 记录 IP 和 User Agent
- ✅ 支持查询所有数据

## 安全提示
这个项目仅用于与同事之间的友好玩笑，请勿用于：
- ❌ 欺诈或钓鱼
- ❌ 未经授权收集他人信息
- ❌ 任何违法用途

## 自定义建议
1. **修改文案** - 可以改成适合你团队的笑话
2. **更换猫猫表情** - 改成其他搞笑 emoji
3. **调整颜色** - 在 CSS 的 `:root` 变量中修改
4. **添加音效** - 在恶搞页面显示时播放音效

## 故障排除

### HTML 样式不显示
- 检查浏览器控制台是否有错误
- 确认 Google Fonts 可以访问

### 邮箱保存失败
- 检查 Worker 是否正确部署
- 确认 KV namespace 已正确绑定
- 查看 Worker 日志：`wrangler tail`

### CORS 错误
- 确保 Worker 返回了正确的 CORS headers
- 如果使用 Pages Functions，检查 API 路径是否正确

## 联系与反馈
玩得开心！记得录下同事的反应 😄