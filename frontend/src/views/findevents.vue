<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        List of Events
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Event By</h2>
        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>
        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" v-on:keyup.enter="handleSubmitForm" placeholder="Enter event name" />
          </label>
        </div>
        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date" v-model="eventDate" v-on:keyup.enter="handleSubmitForm" />
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
          <!--Search Event button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Event
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--Table showing List of Events-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <DataTable :columns="columns" :rows="events" @row-click="openEvent" />
      </div>
    </div>
  </main>
</template>

<script>
import { getEvents, searchEvents } from '../api/api'
import { useToast } from 'vue-toastification'
import DataTable from '../components/DataTable.vue'

//Notifications
const toast = useToast()

// formats an event date as MM/DD/YYYY (outside the component so the column config can use it)
function formatDate(date) {
  const isoDate = new Date(date);
  const year = isoDate.getUTCFullYear();
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(isoDate.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

export default {
  components: { DataTable },
  data() {
    return {
      //variable to hold all events for the organization
      events: null,
      // Parameters for search to occur
      searchBy: null,
      name: null,
      eventDate: null,
      // column definitions for the DataTable
      columns: [
        { label: 'Event Name', field: 'name' },
        {
          label: 'Event Date',
          field: 'date',
          render: (e) => formatDate(e.date),
          // sort by the real date, not the MM/DD/YYYY text
          sortValue: (e) => new Date(e.date).getTime()
        },
        { label: 'Event Address', field: 'address.line1' }
      ]
    }
  },
  mounted() {
    // when component is mounted, load the data
    this.loadData();
  },
  methods: {
    // called when a table row is clicked
    openEvent(event) {
      this.$router.push({ name: 'eventdetails', params: { id: event._id } })
    },
    // method called when component is mounted
    async loadData() {
      // Resets variables used for search
      this.searchBy = null
      this.name = null
      this.eventDate = null

      // get list of events
      try {
        const response = await getEvents();
        this.events = response;
      } catch (error) {
        toast.error('loadData error', error)
      }
    },

    // method called when user searches for an event
    async handleSubmitForm() {
      // if user searches by event name
      if (this.searchBy === 'Event Name') {
        if (this.name) {
          try {
            const query = {
              searchBy: 'name',
              name: this.name
            };
            const response = await searchEvents(query);
            this.events = response;
          } catch (error) {
            toast.error('Error searching events', error)
          }
        }
        // if user searches by event date
      } else if (this.searchBy === 'Event Date') {
        if (this.eventDate) {
          try {
            const eventDate = new Date(this.eventDate);
            const formattedDate = eventDate.toISOString().substring(0, 10);
            const query = {
              searchBy: 'date',
              eventDate: formattedDate
            };
            const response = await searchEvents(query);
            this.events = response;
          } catch (error) {
            toast.error('Error searching events:', error)
          }
        }
      }
    },
  },
}
</script>