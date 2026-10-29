// A small async-state composable (Sprint 2, F2).
// Wraps any API call with a consistent { data, loading, error, execute } shape,
// so views don't each hand-roll their own loading/empty/error bookkeeping.
//
// Usage:
//   const { data, loading, error, execute } = useApi(() => getClients())
//   onMounted(execute)
//   // error.value is a short, human-readable string -- the axios response
//   // interceptor in api.js is what guarantees that, not this file.
import { ref } from 'vue'

export function useApi(apiCall) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await apiCall()
    } catch (err) {
      error.value = err?.message || 'Something went wrong'
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
