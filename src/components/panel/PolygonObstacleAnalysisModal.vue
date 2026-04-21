<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
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

// 将导入表单恢复到初始状态，并清空原生文件输入框。
function resetFormValue() {
  formValue.projectName = ''
  formValue.obstacleType = obstacleTypeOptions[0]
  formValue.fileName = ''
  formValue.file = null

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 触发隐藏的原生文件选择框。
function triggerFileSelect() {
  fileInputRef.value?.click()
}

// 读取用户刚选择的 Excel 文件并同步到表单状态。
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFile = input.files?.[0]

  formValue.fileName = selectedFile?.name ?? ''
  formValue.file = selectedFile ?? null
  input.value = ''
}

// 校验表单后向上层提交导入请求。
function handleImportSubmit() {
  if (!formValue.projectName || !formValue.obstacleType || !formValue.fileName || !formValue.file) {
    return
  }

  emit('submitImport', { ...formValue })
}

watch(
  () => props.state.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetFormValue()
    }
  },
)

watch(
  () => props.state.stage,
  (stage) => {
    if (props.state.isOpen && stage === 'import-form') {
      resetFormValue()
    }
  },
)
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
          <input
            v-model="formValue.projectName"
            class="analysis-modal__project-input"
            type="text"
            placeholder="请输入项目名称"
          />
        </label>

        <label class="analysis-modal__field">
          <span>障碍物类型</span>
          <select v-model="formValue.obstacleType" class="analysis-modal__obstacle-type-select">
            <option v-for="option in obstacleTypeOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <label class="analysis-modal__field">
          <span>Excel 文件</span>
          <input
            ref="fileInputRef"
            class="analysis-modal__file-input"
            type="file"
            accept=".xls,.xlsx"
            @change="handleFileChange"
          />
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
              <!-- <th>名称</th> -->
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
              <!-- <td>{{ target.category }}</td> -->
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
          <p>分析任务：{{ state.analysisTaskId }}</p>
          <p>关联障碍物数量：{{ state.analysisObstacleCount }}</p>
          <p>{{ state.analysisSummary }}</p>

          <div v-if="state.analysisSelectedTargets.length > 0" class="analysis-modal__result-section analysis-modal__result-list">
            <h4>已分析对象</h4>
            <ul>
              <li v-for="target in state.analysisSelectedTargets" :key="target.id">
                {{ target.name }}
              </li>
            </ul>
          </div>

        </div>

        <button
          type="button"
          class="analysis-modal__primary"
          :disabled="state.exportStatus === 'pending' || state.exportStatus === 'running' || !state.analysisTaskId"
          @click="emit('exportReport')"
        >
          {{
            state.exportStatus === 'succeeded'
              ? '重新导出'
              : state.exportStatus === 'pending' || state.exportStatus === 'running'
                ? '导出中...'
                : '导出结论'
          }}
        </button>

        <p class="analysis-modal__export-status" :data-status="state.exportStatus">{{ state.exportMessage }}</p>
        <p v-if="state.exportStatus === 'pending' || state.exportStatus === 'running'" class="analysis-modal__export-progress">
          当前进度：{{ state.exportProgressPercent }}%
        </p>
        <p v-if="state.exportFileName" class="analysis-modal__export-file">文件名：{{ state.exportFileName }}</p>
        <p v-if="state.exportErrorMessage" class="analysis-modal__export-error">{{ state.exportErrorMessage }}</p>
        <a v-if="state.downloadUrl" class="analysis-modal__download" :href="state.downloadUrl" download>重新下载 Word 报告</a>
      </div>
    </div>
  </section>
</template>
