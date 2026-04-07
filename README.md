# Air GIS

基于 `Vue 3 + Vite + TypeScript + Cesium` 的业务型地图前端骨架项目。

## 当前功能概览

当前项目已具备以下基础能力：

1. Cesium 地图容器与业务壳布局
2. 顶部工具栏 + 左侧侧边栏联动
3. 天地图影像底图 `img_w`
4. 天地图影像注记层 `cia_w`
5. 公共标准 terrain 接入入口（当前默认 `Cesium World Terrain`）
6. 武汉市初始化视角
7. 点击复位按钮后飞回武汉视角
8. 天地图瓦片偶发失败的自动重试
9. Cesium 在 Vite 下的运行时资源接入

## 技术栈

1. `Vue 3`
2. `Vite`
3. `TypeScript`
4. `Cesium 1.140.0`
5. `vite-plugin-cesium`
6. `npm`

## 运行方式

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```env
VITE_TDT_KEY=your_tianditu_key
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token
```

说明：

1. `VITE_TDT_KEY` 用于天地图影像底图与注记图层。
2. `VITE_CESIUM_ION_TOKEN` 用于公共标准 terrain。当前默认 terrain 为 `Cesium World Terrain`。
3. 如果未配置 `VITE_CESIUM_ION_TOKEN`，地图仍可正常显示影像底图与注记，但 terrain 会自动关闭。

### 3. 启动开发环境

```bash
npm run dev
```

### 4. 生产构建验证

```bash
npm run build
```

## 当前地图行为

### 初始化视角

当前默认视角配置位于 `src/config/map.ts`：

1. 经度：`114.3055`
2. 纬度：`30.5928`
3. 高度：`40000`
4. 俯仰角：`-90`

表示地图初始化时飞到武汉市中心附近，并以垂直俯视视角观察地面。

### 复位行为

顶部工具栏中的“地图复位”按钮会调用 `resetTick`，最终触发 `CesiumViewer.vue` 中的 `flyToInitialView()`，以 `1.5` 秒动画飞回上述武汉视角。

### Terrain 行为

当前项目采用纯 npm `Cesium` 路线，默认 terrain 方案为公共标准 terrain：

1. 当前实现优先接入 `Cesium World Terrain`
2. 底图与 terrain 解耦，天地图影像负责展示，terrain 负责高程与贴地计算
3. 后续可将公共 terrain 替换为私有化标准 terrain 服务，而不必重写分析逻辑

## 关键文件

### 页面与布局

1. `src/App.vue`
2. `src/components/layout/AppShell.vue`
3. `src/components/toolbar/TopToolbar.vue`
4. `src/components/panel/SidePanel.vue`

### 地图与配置

1. `src/components/map/CesiumViewer.vue`
2. `src/config/map.ts`
3. `src/types/map.ts`
4. `src/types/tool.ts`

### 构建与运行时接入

1. `vite.config.ts`
2. `src/main.ts`

## 已知实现要点

1. 当前 Cesium 版本下，`Viewer` 构造参数不能直接用 `imageryProvider`，而是使用：

```ts
baseLayer: new Cesium.ImageryLayer(imageryProvider)
```

2. 当前项目需要引入：

```ts
import 'cesium/Build/Cesium/Widgets/widgets.css'
```

3. 当前项目依赖 `vite-plugin-cesium` 处理 Cesium 运行时资源。

4. 天地图偶发单瓦片失败时，当前实现会自动重试最多 2 次。

5. 项目已放弃天地图官方三维扩展，保持纯 npm `Cesium` 运行时，以便后续支持贴地分析、真实高程与 terrain 私有化替换。

