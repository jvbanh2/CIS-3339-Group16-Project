<!-- This view displays a list of clients. The user can search for clients, and click on a client to redirect to another component to view that client's information -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Client
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <!--Search Client By selection-->
        <h2 class="text-2xl font-bold">Search Client By</h2>
        <!-- Displays Client Name search field -->
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Client Name">Client Name</option>
            <option value="Client Number">Client Number</option>
          </select>
        </div>
        <!--Input box for searching by Client First Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="firstName" v-on:keyup.enter="handleSubmitForm" placeholder="Enter first name" />
          </label>
        </div>
        <!--Input box for searching by Client Last Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="lastName" v-on:keyup.enter="handleSubmitForm" placeholder="Enter last name" />
          </label>
        </div>
        <!-- Displays Client Number search field -->
        <div class="flex flex-col" v-if="searchBy === 'Client Number'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="text" v-model="phoneNumber" v-on:keyup.enter="handleSubmitForm"
            placeholder="Enter Client Phone Number" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <!--Clear Search button-->
        <div class="mt-5 grid-cols-2">
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="loadData" type="submit">
            Clear Search
          </button>
          <!--Search Client button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Client
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Clients</h2>
        <h3 class="italic">Click table row to view client details</h3>
      </div>
      <!--Table showing list of Clients-->
      <div class="flex flex-col col-span-2">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center mt-10">
          <p class="text-gray-500 animate-pulse">Loading clients…</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="mt-4 bg-red-50 p-4 rounded">
          <p class="text-red-800 font-semibold">{{ error }}</p>
          <button class="mt-2 bg-red-700 text-white rounded px-3 py-1" @click="execute">
            Retry
          </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="!clients || clients.length === 0" class="flex justify-center mt-10 text-gray-600">
          No clients found.
        </div>

        <!-- Data table -->
        <table v-else class="min-w-full shadow-md rounded">
          <thead class="bg-gray-50 text-xl">
            <tr>
              <th class="p-4 text-left">Name</th>
              <th class="p-4 text-left">Phone number</th>
              <th class="p-4 text-left">City</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-300">
            <tr @click="$router.push({ name: 'clientdetails', params: { id: client._id } })" v-for="client in clients"
              :key="client._id" class="cursor-pointer" :class="{ 'hoverRow': hoverId === client._id }"
              @mouseenter="hoverId = client._id" @mouseleave="hoverId = null">
              <td class="p-2 text-left">
                {{ client.firstName + ' ' + client.lastName }}
              </td>
              <td class="p-2 text-left">
                {{ client.phoneNumber.primary }}
              </td>
              <td class="p-2 text-left">{{ client.address.city }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
// Migrated from Options API to Composition API (Sprint 2, F1 task 4).
// Sprint 2, F2: wired through the useApi composable for loading/empty/error
// state, instead of its own ref + try/catch bookkeeping. The old
// toast.error(error) call is gone -- the error now renders inline with a
// retry button, which is a clearer affordance for a failed list load than a
// toast that disappears on its own.
import { ref, onMounted } from 'vue'
import { getClients, searchClients } from '../api/api'
import { useApi } from '../composables/useApi'

const searchBy = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const hoverId = ref(null)

// decides which API call to make based on the current search fields; this
// is the one function useApi wraps, so calling execute() again (on submit,
// on clear, or from the retry button) always re-reads the latest values
async function fetchClients() {
  if (searchBy.value === 'Client Name') {
    return await searchClients({
      searchBy: 'name',
      firstName: firstName.value,
      lastName: lastName.value,
    })
  }
  if (searchBy.value === 'Client Number') {
    return await searchClients({
      searchBy: 'number',
      phoneNumber: phoneNumber.value,
    })
  }
  return await getClients()
}

const { data: clients, loading, error, execute } = useApi(fetchClients)

function loadData() {
  searchBy.value = ''
  firstName.value = ''
  lastName.value = ''
  phoneNumber.value = ''
  execute()
}

function handleSubmitForm() {
  // same guard as before the conversion: only hit the API if there's
  // actually something to search by
  const hasNameQuery = searchBy.value === 'Client Name' && (firstName.value || lastName.value)
  const hasNumberQuery = searchBy.value === 'Client Number' && phoneNumber.value
  if (hasNameQuery || hasNumberQuery) {
    execute()
  }
}

onMounted(() => {
  execute()
})
</script>
