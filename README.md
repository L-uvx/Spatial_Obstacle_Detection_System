# Air GIS

基于 `Vue 3 + Vite + TypeScript + Cesium` 的业务型地图前端骨架项目。

## 当前阶段

当前已完成第一阶段地图底座搭建，主要能力包括：

1. Cesium 地图容器与业务壳布局
2. 顶部工具栏 + 左侧侧边栏联动
3. 天地图影像底图 `img_w`
4. 天地图影像注记层 `cia_w`
5. 武汉市初始化视角
6. 点击复位按钮后飞回武汉视角
7. 天地图瓦片偶发失败的自动重试
8. Cesium 在 Vite 下的运行时资源接入

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
```

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

## 下一阶段建议

当前更适合继续做“业务功能层”，而不是继续修改地图底座。

建议的下一阶段方向：

1. 将左侧侧边栏从占位面板改造成真实业务面板
2. 接入业务数据，例如 GeoJSON、点位、边界或专题图层
3. 实装工具栏能力，例如查询、测距、面积量算等

## 当前分支状态

当前工作已提交在分支：

`feature/cesium-vue-shell`

首次提交：

`f38f917 feat: initialize cesium vue map shell`
