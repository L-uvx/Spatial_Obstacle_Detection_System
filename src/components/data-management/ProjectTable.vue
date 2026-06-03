<script setup lang="ts">
import type { ProjectListItem, ProjectTargetSummary } from '../../types/dataManagement'
import type { ExportStatus } from '../../types/tool'
import { polygonObstacleTypeOptions, pointObstacleTypeOptions } from '../../types/tool'

const props = defineProps<{
  items: ProjectListItem[]
  projectName: string
  obstacleType: string
  status: string
  loading: boolean
  expandedProjectId: string | null
  expandedTargets: ProjectTargetSummary[]
  targetsLoading: boolean
  targetsError: string
  targetExportState: Record<string, {
    status: ExportStatus
    progressPercent: number
    message: string
    fileName: string
    downloadUrl: string
    errorMessage: string
  }>
}>()

const emit = defineEmits<{
  'update:projectName': [projectName: string]
  'update:obstacleType': [obstacleType: string]
  'update:status': [status: string]
  toggleExpand: [projectId: string]
  exportTarget: [payload: { analysisTaskId: string; targetId: number }]
}>()

const typeOptions = [...new Set([...polygonObstacleTypeOptions, ...pointObstacleTypeOptions])]

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'not_analyzed', label: '未分析' },
  { value: 'running', label: '进行中' },
  { value: 'succeeded', label: '成功' },
  { value: 'failed', label: '失败' },
]

function statusLabel(s: string) {
  const found = statusOptions.find((o) => o.value === s)
  return found ? found.label : s
}

function statusClass(s: string) {
  return `project-table__status--${s}`
}

function formatTime(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function exportStateKey(analysisTaskId: string, targetId: number) {
  return `${analysisTaskId}_${targetId}`
}

function getExportBtnText(analysisTaskId: string, targetId: number) {
  const s = props.targetExportState[exportStateKey(analysisTaskId, targetId)]
  if (!s || s.status === 'idle') return '导出结论'
  if (s.status === 'pending' || s.status === 'running') return `导出中... ${s.progressPercent}%`
  if (s.status === 'succeeded') return '重新导出'
  return '重新导出'
}

function exportBtnDisabled(analysisTaskId: string, targetId: number) {
  const s = props.targetExportState[exportStateKey(analysisTaskId, targetId)]
  return s?.status === 'pending' || s?.status === 'running'
}
</script>

<template>
  <section class="project-table" aria-label="项目列表">
    <div class="project-table__toolbar">
      <label>
        <span>项目名称</span>
        <input
          data-testid="project-name-input"
          type="text"
          :value="projectName"
          @input="emit('update:projectName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>障碍物类型</span>
        <select
          data-testid="project-obstacle-type-select"
          :value="obstacleType"
          @change="emit('update:obstacleType', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">全部类型</option>
          <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select
          data-testid="project-status-select"
          :value="status"
          @change="emit('update:status', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
    </div>

    <table class="project-table__table">
      <thead>
        <tr>
          <th class="project-table__col-expand">展开</th>
          <th>项目名称</th>
          <th>障碍物类型</th>
          <th>创建时间</th>
          <th>状态</th>
          <th>障碍物数</th>
           <th>分析目标数</th>
          <th>不合规数</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="9">加载中...</td>
        </tr>
        <tr v-else-if="items.length === 0">
          <td colspan="9">暂无历史分析项目</td>
        </tr>
        <template v-for="item in items" :key="item.id">
          <tr>
            <td class="project-table__col-expand">
              <button
                type="button"
                class="project-table__expand-btn"
                :class="{ 'project-table__expand-btn--expanded': expandedProjectId === item.id }"
                :data-testid="'expand-project-' + item.id"
                :aria-expanded="expandedProjectId === item.id"
                @click="emit('toggleExpand', item.id)"
              >
                <span class="project-table__expand-icon">{{ expandedProjectId === item.id ? '▼' : '▶' }}</span>
              </button>
            </td>
            <td>{{ item.projectName || '-' }}</td>
            <td>{{ item.obstacleType || '-' }}</td>
            <td>{{ formatTime(item.createdAt) }}</td>
            <td>
              <span :class="['project-table__status', statusClass(item.status)]">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td>{{ item.obstacleCount }}</td>
            <td>{{ item.targetCount }}</td>
            <td>
              <span :class="{ 'project-table__non-compliant': item.nonCompliantTargetCount > 0 }">
                {{ item.nonCompliantTargetCount }}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="project-table__expand-text-btn"
                :class="{ 'project-table__expand-btn--expanded': expandedProjectId === item.id }"
                :aria-expanded="expandedProjectId === item.id"
                @click="emit('toggleExpand', item.id)"
              >
                {{ expandedProjectId === item.id ? '收起' : '展开' }}
              </button>
            </td>
          </tr>
          <tr v-if="expandedProjectId === item.id" class="project-table__expanded-row">
            <td colspan="9">
              <div v-if="targetsLoading" class="project-table__targets-loading">加载中...</div>
              <div v-else-if="targetsError" class="project-table__targets-error">{{ targetsError }}</div>
              <div v-else-if="expandedTargets.length === 0" class="project-table__targets-empty">该项目无分析目标</div>
              <table v-else class="project-table__target-table">
                <thead>
                  <tr>
                    <th>目标名称</th>
                    <th>检测规则数</th>
                    <th>不合规数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="target in expandedTargets" :key="target.targetId">
                    <td>{{ target.targetName }}</td>
                    <td>{{ target.ruleCount }}</td>
                    <td>
                      <span :class="{ 'project-table__non-compliant': target.nonCompliantCount > 0 }">
                        {{ target.nonCompliantCount }}
                      </span>
                    </td>
                    <td>
                      <div class="project-table__export-cell">
                        <button
                          type="button"
                          class="project-table__export-btn"
                          :disabled="exportBtnDisabled(item.analysisTaskId, target.targetId)"
                          :data-testid="'export-target-' + target.targetId"
                          @click="emit('exportTarget', { analysisTaskId: item.analysisTaskId, targetId: target.targetId })"
                        >
                          {{ getExportBtnText(item.analysisTaskId, target.targetId) }}
                        </button>
                        <template v-if="targetExportState[exportStateKey(item.analysisTaskId, target.targetId)]?.status === 'succeeded'">
                          <span class="project-table__export-filename">
                            {{ targetExportState[exportStateKey(item.analysisTaskId, target.targetId)].fileName }}
                          </span>
                          <a
                            :href="targetExportState[exportStateKey(item.analysisTaskId, target.targetId)].downloadUrl"
                            class="project-table__export-download"
                            data-testid="download-export"
                          >
                            下载
                          </a>
                        </template>
                        <span
                          v-if="targetExportState[exportStateKey(item.analysisTaskId, target.targetId)]?.status === 'failed' && targetExportState[exportStateKey(item.analysisTaskId, target.targetId)].errorMessage"
                          class="project-table__export-error"
                        >
                          {{ targetExportState[exportStateKey(item.analysisTaskId, target.targetId)].errorMessage }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.project-table__col-expand {
  width: 48px;
  text-align: center;
}

.project-table__expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 12px;
  color: #d8e4ff;
}

.project-table__expand-text-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 12px;
  color: #d8e4ff;
  white-space: nowrap;
}

.project-table__expand-btn:hover,
.project-table__expand-text-btn:hover {
  color: #93c5fd;
}

.project-table__expand-icon {
  display: inline-block;
}

.project-table__status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.project-table__status--not_analyzed {
  background: rgba(128, 128, 128, 0.2);
  color: #999;
}

.project-table__status--running {
  background: rgba(0, 123, 255, 0.15);
  color: #3399ff;
}

.project-table__status--succeeded {
  background: rgba(40, 167, 69, 0.15);
  color: #4caf50;
}

.project-table__status--failed {
  background: rgba(220, 53, 69, 0.15);
  color: #f44336;
}

.project-table__non-compliant {
  color: #f44336;
  font-weight: bold;
}

.project-table__expanded-row > td {
  padding: 12px 20px 12px 28px;
  background: rgba(0, 0, 0, 0.02);
}

.project-table__targets-loading,
.project-table__targets-empty {
  padding: 16px;
  text-align: center;
}

.project-table__targets-error {
  padding: 16px;
  text-align: center;
  color: #f44336;
}

.project-table__target-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(15, 23, 42, 0.32);
}

.project-table__target-table th {
  padding: 8px 12px;
  color: #93c5fd;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
  background: rgba(15, 23, 42, 0.48);
}

.project-table__target-table td {
  padding: 8px 12px;
  color: #cbd5e1;
  font-size: 13px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.project-table__target-table tr:last-child td {
  border-bottom: 0;
}

.project-table__export-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.project-table__export-btn {
  border: 0;
  border-radius: 8px;
  padding: 5px 12px;
  color: #d8e4ff;
  font-size: 12px;
  background: rgba(51, 65, 85, 0.65);
  cursor: pointer;
  transition: background 0.15s ease;
}

.project-table__export-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.75);
}

.project-table__export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.project-table__export-filename {
  font-size: 12px;
  color: #999;
}

.project-table__export-download {
  font-size: 12px;
  color: #3399ff;
}

.project-table__export-error {
  font-size: 12px;
  color: #f44336;
}
</style>
