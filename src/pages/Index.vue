<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row q-col-gutter-lg">
      
      <!-- 1. Key Performance Indicators (KPIs) -->
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-md">
          <div v-for="card in kpiCards" :key="card.label" class="col-12 col-sm-4">
            <q-card flat bordered :class="`bg-${card.color} text-white shadow-1`" class="kpi-card">
              <q-card-section>
                <div class="row items-center no-wrap">
                  <q-icon :name="card.icon" size="32px" class="q-mr-md opacity-7" />
                  <div>
                    <div class="text-overline">{{ card.label }}</div>
                    <div class="text-h4 text-weight-bolder">{{ card.value }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- 2. Interactive Alerts Center -->
        <q-card flat bordered class="q-mt-md shadow-1">
          <q-card-section class="flex justify-between items-center">
            <div class="text-h6 text-primary flex items-center">
              <q-icon name="emergency" class="q-mr-sm" />
              Critical Health Alerts
            </div>
          </q-card-section>
          
          <q-separator />

          <q-card-section v-if="loading" class="text-center q-pa-lg">
            <q-spinner-dots color="primary" size="3em" />
          </q-card-section>

          <q-card-section v-else-if="alerts.length === 0" class="text-center q-pa-lg text-grey-6">
            <q-icon name="check_circle" size="48px" color="positive" class="q-mb-sm" />
            <div>All infrastructure systems are within nominal parameters.</div>
          </q-card-section>

          <q-list v-else separator>
            <q-item v-for="alert in alerts" :key="alert.asset_id" class="q-py-md">
              <q-item-section avatar>
                <q-avatar :color="alert.severity === 'critical' ? 'red-1' : 'orange-1'" :text-color="alert.severity === 'critical' ? 'red' : 'orange'">
                  <q-icon :name="alert.severity === 'critical' ? 'dangerous' : 'warning'" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ alert.title }}</q-item-label>
                <q-item-label caption>{{ alert.description }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round color="blue-7" icon="launch" :to="`/edit/${alert.asset_id}`" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- 3. Predictive Budget Forecast (Side Panel) -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="shadow-1 full-height">
          <q-card-section class="bg-primary text-white row items-center">
             <q-icon name="payments" class="q-mr-md" size="24px" />
             <div class="text-h6">Budget Forecast</div>
          </q-card-section>
          
          <q-card-section class="q-pa-lg">
            <div v-if="loading" class="flex flex-center" style="height: 200px">
              <q-spinner-grid color="primary" size="2em" />
            </div>
            
            <template v-else>
              <div v-for="(amount, quarter) in budget.quarters" :key="quarter" class="q-mb-xl">
                <div class="flex justify-between items-end q-mb-xs">
                  <div class="text-overline text-grey-8">{{ quarter }}</div>
                  <div class="text-subtitle1 text-weight-bold text-primary">${{ amount.toLocaleString() }}</div>
                </div>
                <q-linear-progress 
                  :value="calcPercentage(amount)" 
                  size="12px" 
                  rounded
                  :color="getProgressColor(quarter)"
                  class="shadow-1"
                />
              </div>

              <q-separator spaced class="q-mt-xl" />
              <div class="text-right">
                <div class="text-overline text-grey-7">Aggregate Required</div>
                <div class="text-h5 text-weight-bolder text-primary">${{ (budget.total_forecast || 0).toLocaleString() }}</div>
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>

      <!-- 4. High-Resolution Inventory Table -->
      <div class="col-12">
        <q-table
          flat bordered
          title="Predictive Inventory Monitoring"
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
              <q-btn flat round dense color="negative" icon="auto_delete" @click="onDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'PageIndex',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    
    const loading = ref(true)
    const rows = ref([])
    const alerts = ref([])
    const budget = ref({ quarters: {}, total_forecast: 0 })
    const stats = ref({ totalItems: 0, lowStock: 0, sectorsCount: 0 })

    const columns = [
      { name: 'idItem', align: 'left', label: 'ID', field: 'idItem', sortable: true },
      { name: 'BrandName', align: 'left', label: 'Manufacturer', field: 'BrandName', sortable: true },
      { name: 'Model', align: 'left', label: 'Hardware Model', field: 'Model', sortable: true },
      { name: 'PulseScore', align: 'center', label: 'Pulse Score', field: 'PulseScore', sortable: true },
      { name: 'LocationName', align: 'left', label: 'Environment', field: 'LocationName' },
      { name: 'StatusName', align: 'left', label: 'Condition', field: 'StatusName' },
      { name: 'Active', align: 'center', label: 'Network', field: 'Active' },
      { name: 'actions', align: 'right', label: 'Management', field: 'actions' }
    ]

    const kpiCards = computed(() => [
      { label: 'Asset Fleet', value: stats.value.totalItems, icon: 'factory', color: 'primary' },
      { label: 'Risk Threshold', value: stats.value.lowStock, icon: 'biotech', color: 'deep-orange' },
      { label: 'Active Zones', value: stats.value.sectorsCount, icon: 'travel_explore', color: 'indigo' }
    ])

    const fetchData = async () => {
      loading.value = true
      try {
        const [items, dStats, dAlerts, dBudget] = await Promise.all([
          api.get('/items'),
          api.get('/dashboard/stats'),
          api.get('/alerts'),
          api.get('/analytics/budget')
        ])
        
        rows.value = items || []
        alerts.value = dAlerts || []
        budget.value = dBudget || { quarters: {}, total_forecast: 0 }
        stats.value = {
          totalItems: dStats?.totalItems || 0,
          lowStock: dStats?.lowStock || 0,
          sectorsCount: dStats?.sectors?.length || 0
        }
      } catch (err) {
        console.error('Core Sync Failure:', err)
        $q.notify({ color: 'negative', message: 'Synchronization Protocol Failed' })
      } finally {
        loading.value = false
      }
    }

    const getHealthColor = (val) => val < 30 ? 'negative' : (val < 60 ? 'warning' : 'positive')
    const getProgressColor = (q) => q.includes('Immediate') ? 'negative' : (q.includes('Critical') ? 'orange' : 'primary')
    const calcPercentage = (amt) => budget.value.total_forecast ? amt / budget.value.total_forecast : 0

    onMounted(fetchData)

    return {
      loading, rows, columns, alerts, budget, stats, kpiCards,
      getHealthColor, getProgressColor, calcPercentage,
      onEdit: (id) => router.push(`/edit/${id}`),
      onDelete: (row) => {
        $q.dialog({
          title: 'Decommissioning',
          message: `Archive asset ${row.idItem}?`,
          cancel: true,
          persistent: true
        }).onOk(async () => {
          await api.delete(`/items/${row.idItem}`)
          fetchData()
        })
      }
    }
  }
})
</script>

<style scoped>
.kpi-card { transition: transform 0.3s; cursor: pointer; }
.kpi-card:hover { transform: translateY(-5px); }
.opacity-7 { opacity: 0.7; }
</style>


