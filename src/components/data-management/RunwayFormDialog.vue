<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { RunwayPayload, SelectOption } from '../../types/dataManagement'

interface RunwayFormValue extends RunwayPayload {}

const props = defineProps<{
  open: boolean
  readonly?: boolean
  airportOptions: SelectOption[]
  modelValue: RunwayFormValue
}>()

const emit = defineEmits<{
  close: []
  save: [value: RunwayFormValue]
}>()

const draft = reactive<RunwayFormValue>({
  airportId: '',
  name: '',
  runNumber: '',
  longitude: null,
  latitude: null,
  headingDegrees: null,
  lengthMeters: null,
  width: null,
  altitude: null,
  enterHeight: null,
  maximumAirworthiness: null,
  stationSubType: '',
  runwayCodeA: '',
  runwayType: '',
  runwayCodeB: '',
})
const errorMessage = ref('')

function normalizeNumber(value: string) {
  if (value.trim() === '') {
    return null
  }

  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : null
}

watch(
  () => props.modelValue,
  (value) => {
    draft.airportId = value.airportId
    draft.name = value.name
    draft.runNumber = value.runNumber
    draft.longitude = value.longitude
    draft.latitude = value.latitude
    draft.headingDegrees = value.headingDegrees
    draft.lengthMeters = value.lengthMeters
    draft.width = value.width
    draft.altitude = value.altitude
    draft.enterHeight = value.enterHeight
    draft.maximumAirworthiness = value.maximumAirworthiness
    draft.stationSubType = value.stationSubType
    draft.runwayCodeA = value.runwayCodeA
    draft.runwayType = value.runwayType
    draft.runwayCodeB = value.runwayCodeB
    errorMessage.value = ''
  },
  { immediate: true, deep: true },
)

function validate() {
  if (!draft.airportId.trim()) {
    return '所属机场不能为空'
  }

  if (!draft.name.trim()) {
    return '跑道名称不能为空'
  }

  if (draft.headingDegrees !== null && (draft.headingDegrees < 0 || draft.headingDegrees >= 360)) {
    return '航向角必须在 0 到 360 之间，且不包含 360'
  }

  return ''
}

function handleSave() {
  if (props.readonly) {
    emit('close')
    return
  }

  const nextError = validate()

  if (nextError) {
    errorMessage.value = nextError
    return
  }

  emit('save', {
    airportId: draft.airportId.trim(),
    name: draft.name.trim(),
    runNumber: draft.runNumber.trim(),
    longitude: draft.longitude,
    latitude: draft.latitude,
    headingDegrees: draft.headingDegrees,
    lengthMeters: draft.lengthMeters,
    width: draft.width,
    altitude: draft.altitude,
    enterHeight: draft.enterHeight,
    maximumAirworthiness: draft.maximumAirworthiness,
    stationSubType: draft.stationSubType.trim(),
    runwayCodeA: draft.runwayCodeA.trim(),
    runwayType: draft.runwayType.trim(),
    runwayCodeB: draft.runwayCodeB.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <section v-if="open" class="data-management-form-dialog" aria-label="跑道表单">
    <div class="data-management-form-dialog__card">
      <header class="data-management-form-dialog__header">
        <h3>{{ props.readonly ? '查看跑道' : '跑道信息' }}</h3>
        <button type="button" @click="emit('close')">关闭</button>
      </header>
      <div class="data-management-form-dialog__body shell-scrollbar">
        <label>
          <span>所属机场</span>
          <select data-testid="runway-airport-select" v-model="draft.airportId" :disabled="readonly">
            <option value="">请选择机场</option>
            <option v-for="option in airportOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          <span>跑道名称</span>
          <input v-model="draft.name" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>跑道号码</span>
          <input v-model="draft.runNumber" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>经度</span>
          <input
            :value="draft.longitude ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.longitude = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>纬度</span>
          <input
            :value="draft.latitude ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.latitude = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>跑道真方位(°)</span>
          <input
            data-testid="runway-heading-degrees-input"
            :value="draft.headingDegrees ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.headingDegrees = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>跑道长度(米)</span>
          <input
            :value="draft.lengthMeters ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.lengthMeters = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>跑道宽度(米)</span>
          <input
            :value="draft.width ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.width = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>机场基准点标高(米)</span>
          <input
            :value="draft.altitude ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.altitude = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>跑道入口标高(米)</span>
          <input
            :value="draft.enterHeight ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.enterHeight = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>最大适航机型(H:航空器高度)</span>
          <input
            :value="draft.maximumAirworthiness ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.maximumAirworthiness = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>仪表着陆系统类别</span>
          <input v-model="draft.stationSubType" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>跑道类型</span>
          <input v-model="draft.runwayType" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>编码A</span>
          <input v-model="draft.runwayCodeA" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>编码B</span>
          <input v-model="draft.runwayCodeB" type="text" :disabled="readonly" />
        </label>
        <p v-if="errorMessage" class="data-management-form-dialog__error">{{ errorMessage }}</p>
      </div>
      <footer class="data-management-form-dialog__footer">
        <button
          type="button"
          data-action="save-runway"
          @click="handleSave"
        >
          {{ readonly ? '关闭' : '保存' }}
        </button>
      </footer>
    </div>
  </section>
  </Teleport>
</template>
