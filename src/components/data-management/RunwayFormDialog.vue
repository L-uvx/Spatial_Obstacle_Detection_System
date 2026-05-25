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
  maximumTypeAircraft: 'D类和D类以上',
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
    draft.maximumTypeAircraft = value.maximumTypeAircraft
    errorMessage.value = ''
  },
  { immediate: true, deep: true },
)

watch(
  () => draft.runwayType,
  (newValue) => {
    if (newValue === '非仪表跑道') {
      draft.stationSubType = ''
    }
  },
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
    maximumTypeAircraft: draft.maximumTypeAircraft,
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
          <span>最大适航机型</span>
          <select
            data-testid="runway-maximum-airworthiness-select"
            :value="draft.maximumAirworthiness ?? ''"
            :disabled="readonly"
            @change="draft.maximumAirworthiness = ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value)"
          >
            <option value="">请选择</option>
            <option value="0">车辆（H≤6米）</option>
            <option value="1">中型航空器(6米≤H≤14米)</option>
            <option value="2">大型航空器(14米≤H≤20米)</option>
            <option value="3">特大型航空器(20米≤H≤25米)</option>
          </select>
        </label>
        <label>
          <span>仪表着陆系统类别</span>
          <select data-testid="runway-station-sub-type-select" v-model="draft.stationSubType" :disabled="readonly">
            <option value="">请选择</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
          </select>
        </label>
        <label>
          <span>跑道类型</span>
          <select data-testid="runway-type-select" v-model="draft.runwayType" :disabled="readonly">
            <option value="">请选择</option>
            <option value="非仪表跑道">非仪表跑道</option>
            <option value="非精密进近跑道">非精密进近跑道</option>
            <option value="精密进近跑道">精密进近跑道</option>
          </select>
        </label>
        <label>
          <span>编码A</span>
          <select data-testid="runway-code-a-select" v-model="draft.runwayCodeA" :disabled="readonly">
            <option value="">请选择</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label>
          <span>编码B</span>
          <select data-testid="runway-code-b-select" v-model="draft.runwayCodeB" :disabled="readonly">
            <option value="">请选择</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
          </select>
        </label>
        <label>
          <span>最大可起降航空器类别</span>
          <select v-model="draft.maximumTypeAircraft" :disabled="readonly">
            <option value="D类和D类以上">D类和D类以上</option>
            <option value="C类和C类以下">C类和C类以下</option>
            <option value="B类和B类以下">B类和B类以下</option>
          </select>
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
