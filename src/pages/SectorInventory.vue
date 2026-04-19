<template>
  <q-page class="q-pa-md bg-grey-1">
    <!-- breadcrumbs for context -->
    <q-breadcrumbs class="q-mb-md text-grey-7" active-color="primary">
      <q-breadcrumbs-el label="Dashboard" icon="dashboard" to="/" />
      <q-breadcrumbs-el label="Maintenance Hub" icon="apartment" />
      <q-breadcrumbs-el :label="sectorName" />
    </q-breadcrumbs>

    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-table
          flat bordered
          :title="`${sectorName} Infrastructure Status`"
          :rows="rows"
          :columns="columns"
          row-key="idItem"
          :loading="loading"
          class="inventory-table shadow-1"
          title-class="text-h5 text-weight-bolder text-primary"
        >
          <template v-slot:body-cell-PulseScore="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-circular-progress
                  show-value
                  font-size="10px"
                  :value="props.value"
                  size="36px"
                  :thickness="0.2"
                  :color="getHealthColor(props.value)"
                  track-color="grey-3"
                  class="q-mr-sm"
                >
                  {{ props.value }}%
                </q-circular-progress>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-Active="props">
            <q-td :props="props" class="text-center">
              <q-badge rounded :color="props.value ? 'positive' : 'grey-5'" :label="props.value ? 'ONLINE' : 'OFFLINE'" />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-x-xs">
              <q-btn flat round dense color="primary" icon="settings_applications" @click="onEdit(props.row.idItem)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { api } from 'boot/axios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'SectorInventory',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const $q = useQuasar()
    
    const loading = ref(true)
    const rows = ref([])
    const sectorName = ref('Sector')

    const columns = [
      { name: 'idItem', align: 'left', label: 'ID', field: 'idItem', sortable: true },
      { name: 'BrandName', align: 'left', label: 'Manufacturer', field: 'BrandName', sortable: true },
      { name: 'Model', align: 'left', label: 'Hardware Model', field: 'Model', sortable: true },
      { name: 'PulseScore', align: 'center', label: 'Pulse Score', field: 'PulseScore', sortable: true },
      { name: 'LocationName', align: 'left', label: 'Environment', field: 'LocationName' },
      { name: 'StatusName', align: 'left', label: 'Condition', field: 'StatusName' },
      { name: 'Active', align: 'center', label: 'Network', field: 'Active' },
      { name: 'actions', align: 'right', label: 'Inspect', field: 'actions' }
    ]

    const fetchData = async () => {
      loading.value = true
      try {
        // Fetch items and sector name in parallel for precision
        const [items, sectorData] = await Promise.all([
          api.get(`/inventory/sector/${props.id}`),
          api.get(`/sectors/${props.id}`)
        ])

        rows.value = items || []
        sectorName.value = sectorData?.Name || `Sector ${props.id}`
      } catch (err) {
        console.error('Sector Load Failure:', err)
        $q.notify({ color: 'negative', message: 'Sector Synchronization Protocol Failed' })
      } finally {
        loading.value = false
      }
    }

    const getHealthColor = (val) => val < 30 ? 'negative' : (val < 60 ? 'warning' : 'positive')

    onMounted(fetchData)
    
    // Watch for ID changes (when switching sectors in sidebar)
    watch(() => props.id, fetchData)

    return {
      loading, rows, columns, sectorName,
      getHealthColor,
      onEdit: (id) => router.push(`/edit/${id}`)
    }
  }
})
</script>

<style scoped>
.inventory-table {
  transition: all 0.3s ease;
}
</style>
