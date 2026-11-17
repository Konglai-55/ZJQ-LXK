# 我们的小日子

只使用 Rains3 对象存储，不需要 SQL 数据库。配置 `.env.local`（参考 `.env.example`）后运行：

```powershell
pnpm install
pnpm storage:setup
pnpm dev
```

`BETTER_AUTH_SECRET` 是服务端签名登录 Cookie 用的随机长字符串，部署后保持不变。
S3 密钥只放在服务端环境变量里，不使用 `NEXT_PUBLIC_` 前缀。

## 存放位置

- `data/entries/YYYY-MM.json`：双方日记、心情和照片位置。
- `data/notes/YYYY-MM.json`：纸条和已读状态。
- `data/locks/xikun.json`、`data/locks/jiaqi.json`：加盐密码哈希，不存明文密码。
- `data/capsules.json`：胶囊内容和开启状态。
- `data/photos.json`：合照日期、标题和故事。
- `diary/`、`photos/`：图片原文件。

`storage:setup` 配置跨域并保护以上目录，保留桶中其他目录的原有策略。
`data/` 只允许服务端签名请求，浏览器通过身份验证后的接口读取过滤后的内容。
图片上传、下载由浏览器直接连接 Rains3；应用接口只验证身份并生成五分钟有效的链接。
文字记录使用 S3 ETag 条件写入：更新冲突时读取新版本再合并重试，避免双方修改不同记录时互相覆盖。
本方案面向两个人使用，按月读取日记；合照和胶囊分别使用小型 JSON 列表。

## 检查

```powershell
pnpm check:photos
pnpm check:data
pnpm exec tsc --noEmit --incremental false
pnpm build
```

无需建表或运行迁移脚本。记录在第一次保存时自动创建。临时测试会使用独立键，不能用测试数据覆盖真实记录。

## 发布

推送 `main` 后，GitHub Actions 在独立 Linux 环境检查并构建 standalone 版本，将带有提交编号与 SHA256 校验值的成品发布到 GitHub Releases。
DreamPanel 主服务器只下载、校验并解压对应版本，然后运行 `node server.js`，不在生产主机安装依赖或编译。
将 `.env.example` 中的配置通过 DreamPanel 项目环境变量设置，不能把 `.env.local`、S3 密钥或登录签名密钥提交到仓库。
健康检查路径为 `/api/health`。
