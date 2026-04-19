<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="text-weight-bold">
          Inventory Core MVP
        </q-toolbar-title>

        <q-space />

        <div v-if="currentUser" class="row items-center q-gutter-x-sm q-mr-md">
          <q-avatar size="28px" color="white" text-color="primary">
            {{ currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U' }}
          </q-avatar>
          <div class="text-caption text-weight-medium text-white">
            {{ currentUser.username }}
          </div>
        </div>

        <q-btn flat round dense icon="logout" @click="onLogout">
          <q-tooltip>Sign Out</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label class="q-pa-sm text-overline text-grey-7">Navigation</q-item-label>
          
          <q-item clickable v-ripple to="/" exact active-class="text-primary bg-blue-1">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/add" active-class="text-primary bg-blue-1">
            <q-item-section avatar>
              <q-icon name="add_box" />
            </q-item-section>
            <q-item-section>New Asset</q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item-label class="q-pa-sm text-overline text-grey-7">Maintenance Hub</q-item-label>
          
          <div v-if="loadingSectors" class="q-pa-md text-center">
            <q-spinner-dots color="primary" size="2em" />
          </div>
          
          <template v-else>
            <q-item 
              v-for="sect in sectors" 
              :key="sect.id" 
              clickable 
              v-ripple 
              :to="`/inventory/sector/${sect.id}`"
            >
              <q-item-section avatar>
                <q-icon name="apartment" size="sm" color="grey-7" />
              </q-item-section>
              <q-item-section>{{ sect.title }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view v-if="isReady" />
      <div v-else class="flex flex-center" style="height: 100vh">
        <q-spinner-cube color="primary" size="3em" />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'

export default defineComponent({
  name: 'MainLayout',
  setup () {
    const store = useStore()
    const router = useRouter()
    
    const leftDrawerOpen = ref(false)
    const sectors = ref([])
    const isReady = ref(false)
    const loadingSectors = ref(false)

    // Defensively access user state
    const currentUser = computed(() => store.state.user?.user || {})

    const fetchSectors = async () => {
      loadingSectors.value = true
      try {
        const data = await api.get('/sectors')
        sectors.value = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Sector Sync Error:', err)
      } finally {
        loadingSectors.value = false
        isReady.value = true
      }
    }

    const onLogout = () => {
      store.dispatch('user/logout')
      router.push('/login')
    }

    onMounted(fetchSectors)

    return {
      sectors,
      leftDrawerOpen,
      currentUser,
      isReady,
      loadingSectors,
      onLogout,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>

