# AGENTS

## Purpose

This repository uses lightweight local documentation to preserve project state between development sessions.

Before starting any new feature or code change, read the files below first to recover context.

## Files To Read First

Read these files in order:

1. `README.md`
2. `task_plan.md`
3. `progress.md`
4. `findings.md`
5. `src/config/map.ts`
6. `src/components/map/CesiumViewer.vue`
7. `src/components/layout/AppShell.vue`
8. `src/components/toolbar/TopToolbar.vue`
9. `src/components/panel/SidePanel.vue`
10. `src/types/tool.ts`
11. `vite.config.ts`
12. `src/main.ts`

## Git Workflow

1. By default, continue development directly on `master`.
2. Do not use git worktrees unless the user explicitly asks for them again.
3. Before claiming work is complete, run the relevant verification command, at minimum `npm run build` for this project.

## Commit Messages

1. Future git commit messages should use Chinese.
2. Keep commit messages concise and focused on the stage goal or feature intent.

Examples:

1. `feat: 完成武汉地图初始视角配置`
2. `fix: 修复天地图影像注记层加载问题`
3. `docs: 更新项目当前阶段说明`

## Local-Only Development Notes

1. `docs/current-status.md` is for local development reference only.
2. Do not keep `docs/current-status.md` tracked in the repository in future commits.
3. The planning files `task_plan.md`, `progress.md`, and `findings.md` may exist locally to support development context recovery.

## Current Project Notes

1. The project is a Vue 3 + Vite + TypeScript + Cesium business map shell.
2. Tianditu imagery and annotation are already connected.
3. The initial map view is centered on Wuhan and reset flies back to that view.
4. Cesium runtime depends on `vite-plugin-cesium` and `cesium/Build/Cesium/Widgets/widgets.css`.
