<template>
  <div v-bind="$attrs" class="relative">
    <FormLabel :for="inputId" :class="labelClass">{{ label }}</FormLabel>
    <div class="mt-2">
      <FormInput
        v-model="internalValue"
        :id="inputId"
        :name="name"
        :type="type"
        :autocomplete="autocomplete"
        :required="required"
        :placeholder="placeholder"
        :class="inputClass"
      />
    </div>
    <transition name="fade">
      <p v-if="showError" class="text-sm text-red-600 mt-1">
        <span class="inline-flex items-center space-x-2">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-red-500" />
          <span>{{ errorMessages }}</span>
        </span>
      </p>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  label: String,
  name: String,
  type: {
    type: String,
    default: 'text'
  },
  labelFor: String,
  autocomplete: String,
  required: Boolean,
  placeholder: String,
  inputClass: String,
  labelClass: String,
  errorMessages: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number],
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const internalValue = ref(props.modelValue);
const showError = ref(false);
let errorTimer = null;

// Đồng bộ internalValue với modelValue từ bên ngoài
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue;
});

// Phát sự kiện update:modelValue khi internalValue thay đổi
watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue);
});

// Tạo ID động cho input, ưu tiên labelFor nếu có
const inputId = computed(() => props.labelFor || props.name);

// Theo dõi errorMessages và ẩn nó sau 3 giây
watch(() => props.errorMessages, (newMessage) => {
  if (newMessage) {
    showError.value = true;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      showError.value = false;
    }, 3000);
  } else {
    showError.value = false;
  }
}, { immediate: true });

// Dọn dẹp timer khi component unmount
onUnmounted(() => {
  if (errorTimer) clearTimeout(errorTimer);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0; 
}
</style>
