<!-- This view shows a list of services. Users can search for services and click on a service to be redirected to another component that displays the service's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Services
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Service By</h2>
        <!-- Displays Service Name and Description selection -->
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Service Name">Service Name</option>
            <option value="Service Description">Service Description</option>
          </select>
        </div>
        <!--Display service name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" v-on:keyup.enter="handleSubmitForm" placeholder="Enter service name" />
          </label>
        </div>
        <!--Display service description search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Description'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="description" v-on:keyup.enter="handleSubmitForm" placeholder="Enter service description" />
          </label>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <div class="mt-5 grid-cols-2">
          <!--Clear Search button-->
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="loadData" type="submit">
            Clear Search
          </button>
          <!--Search Service button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Service
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--List of Services table-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Services</h2>
        <h3 class="italic">Click table row to view service details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center mt-10">
          <p class="text-gray-500 animate-pulse">Loading services…</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="mt-4 bg-red-50 p-4 rounded">
          <p class="text-red-800 font-semibold">{{ error }}</p>
          <button class="mt-2 bg-red-700 text-white rounded px-3 py-1" @click="execute">
            Retry
          </button>
        </div>

        <!-- Data table (DataTable renders its own "No results" row when services is empty) -->
        <DataTable
          v-else
          :columns="columns"
          :rows="services || []"
          @row-click="openService"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
// Migrated from Options API to Composition API (Sprint 2, F1 task 6).
// Sprint 2, F2: wired through the useApi composable for loading/error
// state, instead of its own ref + try/catch bookkeeping.
// Sprint 2, F3 (reconciled with the f3-f4-datatable-session branch): the
// raw <table> is now the reusable <DataTable> component, using the same
// column definitions (including width/cellClass) from that branch.
// DataTable owns its own empty-state row, so the separate "no services"
// message is gone.
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getServices, searchServices } from '../api/api'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'

const router = useRouter()

// Parameters for search to occur
const searchBy = ref(null)
const name = ref(null)
const description = ref(null)

const columns = [
  { label: 'Service Name', field: 'name', width: '25%' },
  { label: 'Service Description', field: 'description', width: '75%', cellClass: 'text-sm' },
]

// decides which API call to make based on the current search fields; this
// is the one function useApi wraps, so calling execute() again (on submit,
// on clear, or from the retry button) always re-reads the latest values
async function fetchServices() {
  if (searchBy.value === 'Service Name') {
    return await searchServices({
      searchBy: 'name',
      name: name.value,
    })
  }
  if (searchBy.value === 'Service Description') {
    return await searchServices({
      searchBy: 'description',
      description: description.value,
    })
  }
  return await getServices()
}

const { data: services, loading, error, execute } = useApi(fetchServices)

// method called when component is mounted / Clear Search is clicked
function loadData() {
  // Resets all the variables
  searchBy.value = ''
  name.value = ''
  description.value = ''
  execute()
}

// method called when user searches for a service
function handleSubmitForm() {
  // same guard as before the conversion: only hit the API if there's
  // actually something to search by
  const hasNameQuery = searchBy.value === 'Service Name' && name.value
  const hasDescriptionQuery = searchBy.value === 'Service Description' && description.value
  if (hasNameQuery || hasDescriptionQuery) {
    execute()
  }
}

function openService(service) {
  router.push({ name: 'servicedetails', params: { id: service._id } })
}

onMounted(() => {
  execute()
})
</script>
