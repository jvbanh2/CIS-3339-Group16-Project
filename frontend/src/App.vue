<!-- This is the main frontend file. It displays a navigation bar and rendered components. -->

<template>
  <main class="flex flex-row">
    <div id="_container" class="min-h-screen">
      <header class="w-full">
        <section class="text-center">
          <img class="m-auto" src="@\assets\DanPersona.svg" />
        </section>
        <!--Navigation bar-->
        <nav class="mt-10">
          <ul class="flex flex-col gap-4">
            <!-- Dashboard link -->
            <li>
              <router-link to="/">
                <span style="position: relative; top: 6px" class="material-icons">dashboard</span>
                Dashboard
              </router-link>
            </li>
            <!--Login link - Link only shows is user is logged out-->
            <li v-if="!user.isLoggedIn">
              <router-link to="/login">
                <span style="position:relative; top: 6px" class="material-icons">login</span>
                Login
              </router-link>
            </li>
            <!--Logout link - Link only shows is user is logged in-->
            <li v-if="user.isLoggedIn" @click.prevent="user.logout" style="cursor: pointer;">
              <span style="position:relative; top: 6px" class="material-icons">logout</span>
              Logout
            </li>
            <!--Client Intake Form link - only shows if user is an editor-->
            <li v-if="user.role === 'editor'">
              <router-link to="/clientform">
                <span style="position: relative; top: 6px" class="material-icons">people</span>
                Client Intake Form
              </router-link>
            </li>
            <!--Create Event link - only shows if user is an editor-->
            <li v-if="user.role === 'editor'">
              <router-link to="/eventform">
                <span style="position: relative; top: 6px" class="material-icons">event</span>
                Create Event
              </router-link>
            </li>
            <!--Create Service link - only shows if user is an editor-->
            <li v-if="user.role === 'editor'">
              <router-link to="/serviceform">
                <span style="position: relative; top: 6px" class="material-icons">volunteer_activism</span>
                Create Service
              </router-link>
            </li>
            <!--Find Client link - only shows if user is logged in-->
            <li v-if="user.isLoggedIn">
              <router-link to="/findclient">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Client
              </router-link>
            </li>
            <!--Find Event link - only shows if user is logged in-->
            <li v-if="user.isLoggedIn">
              <router-link to="/findevents">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Event
              </router-link>
            </li>
            <!--Find Service link - only shows if user is logged in-->
            <li v-if="user.isLoggedIn">
              <router-link to="/findservice">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Service
              </router-link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
    <div class="grow w-4/5">
      <!--Organization Name Header-->
      <section class="justify-end items-center h-24 flex"
        style="background: linear-gradient(250deg, #c8102e 70%, #efecec 50.6%)">
        <h1 class="mr-20 text-3xl text-white"> {{ orgName }}</h1>
      </section>
      <!--Page Content-->
      <div>
        <router-view></router-view>
      </div>
    </div>
  </main>
</template>

<script setup>
// Migrated from Options API to Composition API (Sprint 2, F1 task 2).
// setup() -> runs directly here; data() -> ref(); created() -> async IIFE
// (kept fire-and-forget, not a blocking top-level await — see the doc);
// methods -> plain functions, no `this`.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoggedInUserStore } from './store/loggedInUser'
import { getOrgName } from './api/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const user = useLoggedInUserStore()

// was data()
const orgName = ref("Dataplatform")

// was async created() — fire-and-forget, matches the original (doesn't block the first render)
;(async () => {
  try {
    orgName.value = await getOrgName()
  } catch {
    throw (error)
  }
})()

// was methods.logout() — see "issues found" below: not called by the template,
// and relies on a Vuex-style `this.$store` that doesn't exist in this Pinia app.
// Carried over as-is for this task; not fixed here.
function logout() {
  try {
    $store.dispatch('clearSessionData')
    router.push('/')
  } catch (error) {
    toast.error('logout error', error)
  }
}
</script>

<style scoped>
#_container {
  background-color: #c8102e;
  color: white;
  padding: 18px;
}
</style>
