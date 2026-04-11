<script setup lang="ts">
import { reactive, ref } from 'vue'
import { obstacleTypeOptions } from '../../types/tool'
import type { ImportFormValue, PolygonObstacleAnalysisState } from '../../types/tool'

const props = defineProps<{
  state: PolygonObstacleAnalysisState
}>()

const emit = defineEmits<{
  close: []
  submitImport: [formValue: ImportFormValue]
  toggleTarget: [targetId: string]
  startAnalysis: []
  exportReport: []
}>()

const formValue = reactive<ImportFormValue>({
  projectName: '',
  obstacleType: obstacleTypeOptions[0],
  fileName: '',
  file: null,
})

const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFile = input.files?.[0]

  formValue.fileName = selectedFile?.name ?? ''
  formValue.file = selectedFile ?? null
}

function handleImportSubmit() {
  if (!formValue.projectName || !formValue.obstacleType || !formValue.fileName || !formValue.file) {
    return
  }

  emit('submitImport', { ...formValue })
}
</script>

<template>
  <section class="analysis-modal" :class="{ 'is-open': state.isOpen }">
    <div v-if="state.isOpen" class="analysis-modal__card">
      <div class="analysis-modal__header">
        <div>
          <p class="analysis-modal__eyebrow">单入口业务流程</p>
          <h2>多边形障碍物分析</h2>
        </div>
        <button type="button" class="analysis-modal__close" @click="emit('close')">关闭</button>
      </div>

      <p class="analysis-modal__status">{{ state.statusMessage }}</p>

      <div v-if="state.stage === 'import-form'" class="analysis-modal__section">
        <label class="analysis-modal__field">
          <span>项目名称</span>
          <input v-model="formValue.projectName" type="text" placeholder="请输入项目名称" />
        </label>

        <label class="analysis-modal__field">
          <span>障碍物类型</span>
          <select v-model="formValue.obstacleType">
            <option v-for="option in obstacleTypeOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label class="analysis-modal__field">
          <span>Excel 文件</span>
          <input ref="fileInputRef" class="analysis-modal__file-input" type="file" accept=".xls,.xlsx" @change="handleFileChange" />
          <button type="button" class="analysis-modal__file-trigger" @click="triggerFileSelect">选择 Excel 文件</button>
          <small v-if="formValue.fileName" class="analysis-modal__file-name">已选择：{{ formValue.fileName }}</small>
        </label>

        <button
          type="button"
          class="analysis-modal__primary"
          :disabled="!formValue.projectName || !formValue.obstacleType || !formValue.fileName || !formValue.file"
          @click="handleImportSubmit"
        >
          开始导入
        </button>
      </div>

      <div v-else-if="state.stage === 'importing'" class="analysis-modal__section">
        <p>导入任务执行中，正在等待后端解析 Excel、数据入库并返回候选分析对象。</p>
        <p>任务状态：{{ state.importStatus }}</p>
        <p>当前进度：{{ state.importProgressPercent }}%</p>
      </div>

      <div v-else-if="state.stage === 'target-selection'" class="analysis-modal__section">
        <div class="analysis-modal__summary">
          <span>项目：{{ state.projectName }}</span>
          <span>类型：{{ state.obstacleType }}</span>
          <span>文件：{{ state.fileName }}</span>
        </div>

        <table class="analysis-modal__table">
          <thead>
            <tr>
              <th>选择</th>
              <th>名称</th>
              <th>机场/空管局</th>
              <th>距离</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="target in state.targetOptions" :key="target.id">
              <td>
                <input
                  :checked="state.selectedTargetIds.includes(target.id)"
                  type="checkbox"
                  @change="emit('toggleTarget', target.id)"
                />
              </td>
              <td>{{ target.name }}</td>
              <td>{{ target.category }}</td>
              <td>{{ target.distance }}</td>
            </tr>
          </tbody>
        </table>

        <button
          type="button"
          class="analysis-modal__primary"
          :disabled="state.selectedTargetIds.length === 0"
          @click="emit('startAnalysis')"
        >
          开始分析
        </button>
      </div>

      <div v-else-if="state.stage === 'analyzing'" class="analysis-modal__section">
        <p>分析任务执行中，当前弹窗会在结果返回后原地切换为超高分析结论。</p>
      </div>

      <div v-else-if="state.stage === 'analysis-result'" class="analysis-modal__section">
        <div class="analysis-modal__result-card">
          <h3>超高分析结论</h3>
          <p>{{ state.analysisSummary }}</p>
        </div>

        <button
          type="button"
          class="analysis-modal__primary"
          :disabled="state.exportStatus === 'running'"
          @click="emit('exportReport')"
        >
          {{ state.exportStatus === 'running' ? '导出中...' : '导出结论' }}
        </button>

        <p class="analysis-modal__export-status" :data-status="state.exportStatus">{{ state.exportMessage }}</p>
        <a v-if="state.downloadUrl" class="analysis-modal__download" :href="state.downloadUrl">下载 Word 报告</a>
      </div>
    </div>
  </section>
</template>
