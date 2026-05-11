# Air GIS

基于 Vue 3 + Vite + TypeScript + Cesium 的机场障碍物评估地图前端项目。

## 技术栈

- **Vite 8** — 构建工具
- **Vue 3** — UI 框架
- **TypeScript** — 类型安全
- **Cesium 1.140+** — 三维地图引擎
- **vite-plugin-cesium** — Cesium 运行时资源接入

## 前置要求

- Node.js >= 18
- npm >= 9

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量模板并填写：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
VITE_TDT_KEY=your_tianditu_key_here
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
```

| 变量 | 是否必填 | 说明 |
|------|----------|------|
| `VITE_TDT_KEY` | 是 | 天地图影像底图与注记图层 |
| `VITE_CESIUM_ION_TOKEN` | 否 | Cesium World Terrain，不填则关闭地形 |

### 3. 启动开发环境

```bash
npm run dev
```

浏览器打开 `http://localhost:5173` 即可。

## 后端代理配置

项目依赖后端接口进行障碍物分析、数据管理等功能。开发环境下通过 Vite proxy 转发请求，编辑 `vite.config.ts`：

```ts
server: {
  proxy: {
    '/polygon-obstacle': { target: 'http://<你的后端IP>:8000', changeOrigin: true },
    '/point-obstacle':   { target: 'http://<你的后端IP>:8000', changeOrigin: true },
    '/data-management':  { target: 'http://<你的后端IP>:8000', changeOrigin: true },
  },
},
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run test` | 运行单元测试 |

## 环境变量

参考 `.env.example` 中的变量定义，在 `.env.local` 中配置。
