# 拼拼豆 (pinpindou)

一个纯前端的 React 应用，把上传的图片转换成可拼可打印的拼豆（perler bead）图纸。所有图像处理都在浏览器端通过 Canvas API + Web Worker 完成，**无需后端服务**，因此可以作为纯静态站点部署。

## 特性

- **4 步向导**：上传 → 裁剪 → 调参 → 导出
- **CIEDE2000 颜色匹配**（Lab 空间）比 RGB 欧氏距离更接近人眼感知
- **三种抖动**：无 / Floyd-Steinberg / Ordered Bayer 4×4
- **两遍式量化**：先用全色板数频次 → 取 top-N → 用缩减后的色板渲染，避免雪花斑点
- **三套调色板**：漫游酱（淘宝）/ Perler / Hama，每套 30 色 starter（可扩展）
- **符号图纸 + 纯色预览** 两种渲染模式
- **多页 PDF**（带坐标 + BOM 配件清单）+ PNG 导出
- **中英双语 UI**（zh-CN 默认）

## 本地开发

```bash
npm install               # 安装依赖
npm run dev               # 启动开发服务器（默认 http://127.0.0.1:5173）
npm run lint              # 运行 ESLint
npm run typecheck         # TypeScript 类型检查
npm run test              # 跑 Vitest 单元测试
npm run build             # 类型检查 + 构建生产产物到 dist/
npm run preview           # 本地预览生产构建
npm run e2e               # 运行 Playwright 端到端测试
npm run build:palettes    # 重新生成 src/palettes/generated/（增删色号后用）
```

## 部署（使用 Nginx）

本项目构建后是一组静态文件，使用 Nginx 托管即可。以下流程以 Ubuntu/Debian 为例。

### 1. 构建生产产物

在项目目录下执行：

```bash
npm install
npm run build
```

构建完成后，所有静态文件位于 `dist/` 目录。

### 2. 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 3. 部署静态文件

将 `dist/` 中的内容拷贝到 Web 根目录（例如 `/var/www/pinpindou`）：

```bash
sudo mkdir -p /var/www/pinpindou
sudo cp -r dist/* /var/www/pinpindou/
sudo chown -R www-data:www-data /var/www/pinpindou
```

### 4. 配置 Nginx

创建站点配置文件 `/etc/nginx/sites-available/pinpindou`：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 替换为你的域名或服务器 IP

    root /var/www/pinpindou;
    index index.html;

    # 单页应用（SPA）路由回退：未匹配到的路径都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 对带哈希的静态资源做长期缓存
    location ~* \.(?:js|css|woff2?|png|jpe?g|gif|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 开启 gzip 压缩
    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
    gzip_min_length 1024;
}
```

启用站点并重载 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/pinpindou /etc/nginx/sites-enabled/
sudo nginx -t           # 校验配置语法
sudo systemctl reload nginx
```

完成后访问 `http://your-domain.com` 即可使用。

### 5.（可选）配置 HTTPS

推荐使用 [Certbot](https://certbot.eff.org/) 自动申请并配置 Let's Encrypt 证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot 会自动修改上面的 Nginx 配置以启用 443 端口，并设置证书自动续期。

### 更新部署

每次发布新版本时，重新构建并覆盖 Web 根目录即可：

```bash
npm run build
sudo cp -r dist/* /var/www/pinpindou/
sudo systemctl reload nginx
```

## 项目结构

```
src/
├── app/              # 顶层布局、hash 路由、i18n provider、ErrorBoundary
├── features/
│   ├── upload/       # 文件上传 + 校验
│   ├── crop/         # 比例选择 + 亮度/对比度
│   ├── tune/         # 参数面板（尺寸/调色板/色数上限/抖动）+ 实时预览
│   ├── export/       # 导出步骤（PNG / PDF / BOM 复制）
│   ├── preview/      # PatternCanvas + 共享预览组件 + StatCards 等
│   └── bom/          # 配件清单计算 + 色卡传奇渲染
├── lib/
│   ├── color/        # sRGB ↔ Lab 转换、CIEDE2000、nearest 色板匹配
│   ├── image/        # 箱式缩放、亮度/对比度
│   ├── dither/       # Floyd-Steinberg、Ordered Bayer 4×4、none
│   ├── pattern/      # 两遍式生成、调色板加载、共享类型
│   └── pdf/          # pdf-lib 多页 PDF 构建
├── workers/          # preprocess.worker.ts + quantize.worker.ts
├── palettes/         # 源色板 JSON（generated/ 由构建脚本生成）
├── store/            # Zustand 状态 + localStorage 持久化
├── i18n/             # zh-CN / en 翻译
└── components/decor/ # SpecLabel / CornerMarks / InfoTip 等装饰元件
```

## 扩展调色板

1. 编辑 `src/palettes/<id>.json`，按现有结构添加 colors
2. 在 `docs/palettes/<id>.md` 记录新数据的 RGB 来源
3. 运行 `npm run build:palettes` 重新生成带 Lab 值的 `src/palettes/generated/`

## 技术栈

- **框架**：React 19 + TypeScript + Vite
- **UI**：Tailwind CSS v3 + 自定义 specimen-sheet 设计语言
- **状态**：Zustand（+ localStorage 持久化）
- **i18n**：react-i18next（zh-CN 默认 / en）
- **图像处理**：Canvas 2D API + Web Worker（preprocess + quantize 分离）
- **导出**：pdf-lib（多页 PDF）+ 原生 Canvas → PNG
- **测试**：Vitest + Testing Library（单元）+ Playwright（e2e）

## 设计 / 实施文档

- 设计 spec：[`docs/superpowers/specs/2026-06-06-pinpindou-design.md`](./docs/superpowers/specs/2026-06-06-pinpindou-design.md)
- 实施计划：[`docs/superpowers/plans/2026-06-06-pinpindou-v1.md`](./docs/superpowers/plans/2026-06-06-pinpindou-v1.md)
- 调色板数据来源：[`docs/palettes/`](./docs/palettes/)
