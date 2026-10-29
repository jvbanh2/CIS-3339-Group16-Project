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
              <span v-if="isSortable(col)" class="material-icons text-base">
                {{ sortIcon(col) }}
              </span>
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
      <span>Showing {{ startIndex + 1 }}–{{ endIndex }} of {{ total }}</span>
      <div class="flex items-center gap-2">
        <button
          class="border border-red-700 text-red-700 rounded px-3 py-1 disabled:opacity-40"
          :disabled="page === 1"
          @click="page--"
        >
          Previous
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button
          class="bg-red-700 text-white rounded px-3 py-1 disabled:opacity-40"
          :disabled="page === totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// columns: [{ label, field, render?(row), sortable?, sortValue?(row), width?, cellClass? }]
// field can be a dot path, e.g. 'address.city'
function getByPath(obj, path) {
  return path.split('.').reduce((o, key) => (o == null ? o : o[key]), obj)
}

export default {
  name: 'DataTable',
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    pageSize: { type: Number, default: 10 },
    rowKey: { type: String, default: '_id' }
  },
  emits: ['row-click'],
  data() {
    return {
      page: 1,
      sortField: null,
      sortDir: null, // 'asc' | 'desc' | null
      hoverId: null
    }
  },
  computed: {
    safeRows() {
      return this.rows || []
    },
    sortedRows() {
      if (!this.sortField || !this.sortDir) return this.safeRows
      const col = this.columns.find((c) => c.field === this.sortField)
      if (!col) return this.safeRows
      const dir = this.sortDir === 'asc' ? 1 : -1
      return [...this.safeRows].sort((a, b) => {
        const va = this.sortKey(a, col)
        const vb = this.sortKey(b, col)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
        return (
          String(va).localeCompare(String(vb), undefined, {
            numeric: true,
            sensitivity: 'base'
          }) * dir
        )
      })
    },
    total() {
      return this.sortedRows.length
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    startIndex() {
      return (this.page - 1) * this.pageSize
    },
    endIndex() {
      return Math.min(this.startIndex + this.pageSize, this.total)
    },
    pagedRows() {
      return this.sortedRows.slice(this.startIndex, this.endIndex)
    }
  },
  watch: {
    rows() {
      this.page = 1
    },
    totalPages(n) {
      if (this.page > n) this.page = n
    }
  },
  methods: {
    isSortable(col) {
      return col.sortable !== false
    },
    cellValue(row, col) {
      return col.render ? col.render(row) : getByPath(row, col.field)
    },
    sortKey(row, col) {
      return col.sortValue ? col.sortValue(row) : getByPath(row, col.field)
    },
    toggleSort(col) {
      if (!this.isSortable(col)) return
      if (this.sortField !== col.field) {
        this.sortField = col.field
        this.sortDir = 'asc'
      } else if (this.sortDir === 'asc') {
        this.sortDir = 'desc'
      } else {
        this.sortField = null
        this.sortDir = null
      }
      this.page = 1
    },
    sortIcon(col) {
      if (this.sortField !== col.field) return 'unfold_more'
      return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'
    },
    ariaSort(col) {
      if (!this.isSortable(col)) return null
      if (this.sortField !== col.field) return 'none'
      return this.sortDir === 'asc' ? 'ascending' : 'descending'
    }
  }
}
</script>