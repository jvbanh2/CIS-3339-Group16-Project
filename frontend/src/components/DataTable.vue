<!-- Reusable sortable/paginated table. Written in Composition API to match
     the rest of the app (Sprint 2, F1's rule: no Options API under src/).
     Converted from the Options API version on the f3-f4-datatable-session
     branch -- props, emitted event, sorting/pagination logic, and the
     cell-<field> slot are unchanged from that original. -->
<template>
  <div class="flex flex-col w-full">
    <table class="min-w-full shadow-md rounded">
      <thead class="bg-gray-50 text-xl">
        <tr>
          <th
            v-for="col in columns"
            :key="col.field"
            class="p-4 text-left select-none"
            :class="{ 'cursor-pointer': isSortable(col) }"
            :style="col.width ? { width: col.width } : null"
            :tabindex="isSortable(col) ? 0 : null"
            :aria-sort="ariaSort(col)"
            @click="toggleSort(col)"
            @keydown.enter="toggleSort(col)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <span v-if="isSortable(col)" class="text-sm text-gray-400">{{ sortIcon(col) }}</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-300">
        <tr v-if="total === 0">
          <td :colspan="columns.length" class="p-6 text-center text-gray-500">
            No results
          </td>
        </tr>
        <tr
          v-for="row in pagedRows"
          :key="row[rowKey]"
          class="cursor-pointer"
          :class="{ hoverRow: hoverId === row[rowKey] }"
          tabindex="0"
          @click="$emit('row-click', row)"
          @keydown.enter="$emit('row-click', row)"
          @mouseenter="hoverId = row[rowKey]"
          @mouseleave="hoverId = null"
        >
          <td
            v-for="col in columns"
            :key="col.field"
            class="p-2 text-left"
            :class="col.cellClass"
          >
            <slot :name="'cell-' + col.field" :row="row" :value="cellValue(row, col)">
              {{ cellValue(row, col) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="total > 0"
      class="flex items-center justify-between mt-3 text-sm text-gray-700"
    >
      <span>Showing {{ startIndex + 1 }}&ndash;{{ endIndex }} of {{ total }}</span>
      <div class="flex items-center gap-2">
        <button
          class="border border-red-700 text-red-700 rounded px-3 py-1 disabled:opacity-40"
          type="button"
          :disabled="page === 1"
          @click="page--"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button
          class="bg-red-700 text-white rounded px-3 py-1 disabled:opacity-40"
          type="button"
          :disabled="page === totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// columns: [{ label, field, render?(row), sortable?, sortValue?(row), width?, cellClass? }]
// field may be a dot path, e.g. 'address.city'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 10 },
  rowKey: { type: String, default: '_id' },
})

defineEmits(['row-click'])

const page = ref(1)
const sortField = ref(null)
const sortDir = ref(null) // 'asc' | 'desc' | null
const hoverId = ref(null)

function getByPath(obj, path) {
  return path.split('.').reduce((o, key) => (o == null ? o : o[key]), obj)
}

const safeRows = computed(() => props.rows || [])

function isSortable(col) {
  return col.sortable !== false
}

function cellValue(row, col) {
  return col.render ? col.render(row) : getByPath(row, col.field)
}

function sortKey(row, col) {
  return col.sortValue ? col.sortValue(row) : getByPath(row, col.field)
}

const sortedRows = computed(() => {
  if (!sortField.value || !sortDir.value) return safeRows.value
  const col = props.columns.find((c) => c.field === sortField.value)
  if (!col) return safeRows.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...safeRows.value].sort((a, b) => {
    const va = sortKey(a, col)
    const vb = sortKey(b, col)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return (
      String(va).localeCompare(String(vb), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * dir
    )
  })
})

const total = computed(() => sortedRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / props.pageSize)))
const startIndex = computed(() => (page.value - 1) * props.pageSize)
const endIndex = computed(() => Math.min(startIndex.value + props.pageSize, total.value))
const pagedRows = computed(() => sortedRows.value.slice(startIndex.value, endIndex.value))

// keep pagination sane when the underlying rows change (new search results,
// sort toggled, etc.)
watch(() => props.rows, () => {
  page.value = 1
})
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

function toggleSort(col) {
  if (!isSortable(col)) return
  if (sortField.value !== col.field) {
    sortField.value = col.field
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortField.value = null
    sortDir.value = null
  }
  page.value = 1
}

function sortIcon(col) {
  if (sortField.value !== col.field) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function ariaSort(col) {
  if (!isSortable(col)) return null
  if (sortField.value !== col.field) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}
</script>
