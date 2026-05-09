<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { SelectOption, StationFormValue } from '../../types/dataManagement'

const props = defineProps<{
  open: boolean
  readonly?: boolean
  airportOptions: SelectOption[]
  stationTypeOptions: SelectOption[]
  modelValue: StationFormValue
}>()

const emit = defineEmits<{
  close: []
  save: [value: StationFormValue]
}>()

const draft = reactive<StationFormValue>({
  airportId: '',
  name: '',
  stationType: '',
  stationGroup: null,
  frequency: null,
  runwayNo: '',
  longitude: null,
  latitude: null,
  altitude: null,
  coverageRadius: null,
  flyHeight: null,
  antennaHag: null,
  reflectionNetHag: null,
  centerAntennaH: null,
  bAntennaH: null,
  bToCenterDistance: null,
  reflectionDiameter: null,
  downwardAngle: null,
  antennaTag: null,
  distanceToRunway: null,
  distanceVToRunway: null,
  distanceEndoRunway: null,
  unitNumber: null,
  aircraft: '',
  antennaHeight: null,
  stationSubType: null,
  combineId: null,
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
    draft.stationType = value.stationType
    draft.stationGroup = value.stationGroup
    draft.frequency = value.frequency
    draft.runwayNo = value.runwayNo
    draft.longitude = value.longitude
    draft.latitude = value.latitude
    draft.altitude = value.altitude
    draft.coverageRadius = value.coverageRadius
    draft.flyHeight = value.flyHeight
    draft.antennaHag = value.antennaHag
    draft.reflectionNetHag = value.reflectionNetHag
    draft.centerAntennaH = value.centerAntennaH
    draft.bAntennaH = value.bAntennaH
    draft.bToCenterDistance = value.bToCenterDistance
    draft.reflectionDiameter = value.reflectionDiameter
    draft.downwardAngle = value.downwardAngle
    draft.antennaTag = value.antennaTag
    draft.distanceToRunway = value.distanceToRunway
    draft.distanceVToRunway = value.distanceVToRunway
    draft.distanceEndoRunway = value.distanceEndoRunway
    draft.unitNumber = value.unitNumber
    draft.aircraft = value.aircraft
    draft.antennaHeight = value.antennaHeight
    draft.stationSubType = value.stationSubType
    draft.combineId = value.combineId
    errorMessage.value = ''
  },
  { immediate: true, deep: true },
)

function validate() {
  if (!draft.airportId.trim()) {
    return '所属机场不能为空'
  }

  if (!draft.name.trim()) {
    return '台站名称不能为空'
  }

  if (!draft.stationType.trim()) {
    return '台站类型不能为空'
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
    stationType: draft.stationType.trim(),
    stationGroup: draft.stationGroup?.trim() || null,
    frequency: draft.frequency,
    runwayNo: draft.runwayNo.trim(),
    longitude: draft.longitude,
    latitude: draft.latitude,
    altitude: draft.altitude,
    coverageRadius: draft.coverageRadius,
    flyHeight: draft.flyHeight,
    antennaHag: draft.antennaHag,
    reflectionNetHag: draft.reflectionNetHag,
    centerAntennaH: draft.centerAntennaH,
    bAntennaH: draft.bAntennaH,
    bToCenterDistance: draft.bToCenterDistance,
    reflectionDiameter: draft.reflectionDiameter,
    downwardAngle: draft.downwardAngle,
    antennaTag: draft.antennaTag?.trim() || null,
    distanceToRunway: draft.distanceToRunway,
    distanceVToRunway: draft.distanceVToRunway,
    distanceEndoRunway: draft.distanceEndoRunway,
    unitNumber: draft.unitNumber,
    aircraft: draft.aircraft.trim(),
    antennaHeight: draft.antennaHeight,
    stationSubType: draft.stationSubType?.trim() || null,
    combineId: draft.combineId,
  })
}
</script>

<template>
  <Teleport to="body">
    <section v-if="open" class="data-management-form-dialog" aria-label="台站表单">
    <div class="data-management-form-dialog__card">
      <header class="data-management-form-dialog__header">
        <h3>{{ props.readonly ? '查看台站' : '台站信息' }}</h3>
        <button type="button" @click="emit('close')">关闭</button>
      </header>
      <div class="data-management-form-dialog__body shell-scrollbar">
        <label>
          <span>所属机场</span>
          <select data-testid="station-airport-select" v-model="draft.airportId" :disabled="readonly">
            <option value="">请选择机场</option>
            <option v-for="option in airportOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          <span>台站名称</span>
          <input v-model="draft.name" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>台站类型</span>
          <select data-testid="station-type-select" v-model="draft.stationType" :disabled="readonly">
            <option value="">请选择台站类型</option>
            <option v-for="option in stationTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          <span>台站组（选填）</span>
          <input v-model="draft.stationGroup" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>频率(MHz)</span>
          <input
            :value="draft.frequency ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.frequency = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
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
          <span>地势标高(国家85高程)(米)</span>
          <input
            data-testid="station-altitude-input"
            :value="draft.altitude ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.altitude = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>覆盖范围(默认20海里)(米)</span>
          <input
            :value="draft.coverageRadius ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.coverageRadius = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <!-- <label>
          <span>天线高度()(米)</span>
          <input
            :value="draft.flyHeight ?? ''"
            type="number"
            step="any"
            @input="draft.flyHeight = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label> -->
        <label>
          <span>天线离地高(若下滑信标，填写上天线离地高)(米)</span>
          <input
            :value="draft.antennaHag ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.antennaHag = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>关联跑道(LOC、GP、VOR、场监必填)</span>
          <input v-model="draft.runwayNo" type="text" :disabled="readonly" />
        </label>
        <label>
          <span>反射网离地高(米)(VOR)</span>
          <input
            :value="draft.reflectionNetHag ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.reflectionNetHag = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>中心天线高度(VOR)</span>
          <input
            :value="draft.centerAntennaH ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.centerAntennaH = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>边带天线到反射网高度(米)(VOR)</span>
          <input
            :value="draft.bAntennaH ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.bAntennaH = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>边带天线到中心天线距离(米)(VOR)</span>
          <input
            :value="draft.bToCenterDistance ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.bToCenterDistance = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>反射网直径(米)(VOR)</span>
          <input
            :value="draft.reflectionDiameter ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.reflectionDiameter = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>下滑角(°)(GP)</span>
          <input
            :value="draft.downwardAngle ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.downwardAngle = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <!-- <label>
          <span>天线标签</span>
          <input v-model="draft.antennaTag" type="text" />
        </label> -->
        <label>
          <span>后撤距离(米)(GP)</span>
          <input
            :value="draft.distanceToRunway ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.distanceToRunway = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>距离跑道中线的距离(在进近方向左侧为负，右侧为正)(米)(GP)</span>
          <input
            :value="draft.distanceVToRunway ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.distanceVToRunway = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>前方360米地势标高(米)（选填）(GP)</span>
          <input
            :value="draft.antennaHeight ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.antennaHeight = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>与跑道末端距离(米)(LOC)</span>
          <input
            :value="draft.distanceEndoRunway ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.distanceEndoRunway = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label>
          <span>天线单元个数(LOC)</span>
          <input
            :value="draft.unitNumber ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.unitNumber = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <!-- <label>
          <span>航空器</span>
          <input v-model="draft.aircraft" type="text" />
        </label> -->
        <!-- <label>
          <span>台站子类(选填)</span>
          <input v-model="draft.stationSubType" type="text" />
        </label>
        <label>
          <span>组合 ID(选填)</span>
          <input
            :value="draft.combineId ?? ''"
            type="number"
            step="any"
            @input="draft.combineId = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label> -->
        <p v-if="errorMessage" class="data-management-form-dialog__error">{{ errorMessage }}</p>
      </div>
      <footer class="data-management-form-dialog__footer">
        <button
          type="button"
          data-action="save-station"
          @click="handleSave"
        >
          {{ readonly ? '关闭' : '保存' }}
        </button>
      </footer>
    </div>
  </section>
  </Teleport>
</template>
