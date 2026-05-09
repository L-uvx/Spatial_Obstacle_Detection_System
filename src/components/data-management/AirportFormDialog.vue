<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

interface AirportFormValue {
  name: string
  longitude: number | null
  latitude: number | null
  altitude: number | null
}

const props = defineProps<{
  open: boolean
  readonly?: boolean
  modelValue: AirportFormValue
}>()

const emit = defineEmits<{
  close: []
  save: [value: AirportFormValue]
}>()

const draft = reactive<AirportFormValue>({
  name: '',
  longitude: null,
  latitude: null,
  altitude: null,
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
    draft.name = value.name
    draft.longitude = value.longitude
    draft.latitude = value.latitude
    draft.altitude = value.altitude
    errorMessage.value = ''
  },
  { immediate: true, deep: true },
)

function validate() {
  if (!draft.name.trim()) {
    return '机场名称不能为空'
  }

  if (draft.longitude !== null && (draft.longitude < -180 || draft.longitude > 180)) {
    return '经度必须在 -180 到 180 之间'
  }

  if (draft.latitude !== null && (draft.latitude < -90 || draft.latitude > 90)) {
    return '纬度必须在 -90 到 90 之间'
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
    name: draft.name.trim(),
    longitude: draft.longitude,
    latitude: draft.latitude,
    altitude: draft.altitude,
  })
}
</script>

<template>
  <Teleport to="body">
    <section v-if="open" class="data-management-form-dialog" aria-label="机场表单">
    <div class="data-management-form-dialog__card">
      <header class="data-management-form-dialog__header">
        <h3>{{ props.readonly ? '查看机场' : '机场信息' }}</h3>
        <button type="button" @click="emit('close')">关闭</button>
      </header>
      <div class="data-management-form-dialog__body shell-scrollbar">
        <label>
          <span>机场名称</span>
          <input v-model="draft.name" type="text" :disabled="readonly" />
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
          <span>海拔</span>
          <input
            :value="draft.altitude ?? ''"
            type="number"
            step="any"
            :disabled="readonly"
            @input="draft.altitude = normalizeNumber(($event.target as HTMLInputElement).value)"
          />
        </label>
        <p v-if="errorMessage" class="data-management-form-dialog__error">{{ errorMessage }}</p>
      </div>
      <footer class="data-management-form-dialog__footer">
        <button
          type="button"
          data-action="save-airport"
          @click="handleSave"
        >
          {{ readonly ? '关闭' : '保存' }}
        </button>
      </footer>
    </div>
  </section>
  </Teleport>
</template>
