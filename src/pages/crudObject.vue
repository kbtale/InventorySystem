<template>
  <q-page class="q-pa-md">
    <div class="row flex-center">
      <q-card class="q-pa-lg col-9 col-xs-12 col-sm-10 col-md-9 col-lg-8 col-xl-6">
        <q-form
          @submit="onSubmit"
          @reset="onReset"
          class="q-gutter-md"
        >
          <div class="row justify-between">
          <q-select class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.objectType" :options="objectsList" label="Object Type" options-dense="true" />
          <q-select class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.location" :options="locationsList" label="Location" options-dense="true" />
          <q-select class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.status" :options="statusesList" label="Status" options-dense="true" />
          </div>
          <div class="row justify-start">
          <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.brand" label="Brand" />
          <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.model" label="Model" />
          <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.serial" label="Serial" />
           <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model="selection.color" label="Color" />
           <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model.number="selection.pulseScore" label="Health Score (%)" type="number" />
           <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined v-model.number="selection.estimatedCost" label="Estimated Cost ($)" type="number" />
           <q-input class="col-12 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined autogrow v-model="selection.observations" label="Observations" />
           </div>
          <div>
            <q-btn label="Submit" type="submit" color="primary"/>
            <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
          </div>
        </q-form>
      </q-card>
    </div>

  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'CrudObject',
  props: ['id'],
  setup(props) {
    const $q = useQuasar()
    const router = useRouter()
    
    const objectsList = ref([])
    const locationsList = ref([])
    const statusesList = ref([])
    
    const isEditMode = ref(!!props.id && props.id !== '0' && props.id !== 0)

    const selection = ref({
      objectType: null,
      location: null,
      status: null,
      brand: '',
      model: '',
      serial: '',
      color: '',
      observations: '',
      pulseScore: 100,
      estimatedCost: 0
    })

    const fetchData = async () => {
      try {
        const [types, locs, stats] = await Promise.all([
          api.get('/itemtypes'),
          api.get('/locations'),
          api.get('/statuses')
        ]);
        objectsList.value = Array.isArray(types) ? types : (types?.data || []);
        locationsList.value = Array.isArray(locs) ? locs : (locs?.data || []);
        statusesList.value = Array.isArray(stats) ? stats : (stats?.data || []);

        // If editing, load item data
        if (isEditMode.value) {
          const item = await api.get(`/items/${props.id}`)
          const itemData = item?.data || item
          
          if (itemData) {
            selection.value = {
              objectType: objectsList.value.find(o => o.value === itemData.fk_idItemtype),
              location: locationsList.value.find(l => l.value === itemData.fk_idLocation),
              status: statusesList.value.find(s => s.value === itemData.fk_idStatus),
              brand: itemData.BrandName || '',
              model: itemData.Model,
              serial: itemData.Serial,
              color: itemData.Color,
              observations: itemData.Observations,
              pulseScore: itemData.PulseScore || 100,
              estimatedCost: itemData.EstimatedCost || 0
            }
          }
        }
      } catch (err) {
        console.error('Form Load Error:', err)
        $q.notify({ color: 'negative', message: 'Error loading form data' });
      }
    }

    const onSubmit = async () => {
      try {
        if (!selection.value.objectType || !selection.value.location || !selection.value.status) {
          $q.notify({ color: 'warning', message: 'Please select Object Type, Location, and Status' });
          return;
        }

        const payload = {
          fk_idItemtype: selection.value.objectType?.value,
          fk_idLocation: selection.value.location?.value,
          fk_idStatus: selection.value.status?.value,
          fk_idBrand: 1, // Defaulting for MVP
          Model: selection.value.model,
          Serial: selection.value.serial,
          Color: selection.value.color,
          Observations: selection.value.observations,
          PulseScore: selection.value.pulseScore,
          EstimatedCost: selection.value.estimatedCost
        };

        if (isEditMode.value) {
          await api.put(`/items/${props.id}`, payload);
          $q.notify({ color: 'positive', message: 'Item updated successfully' });
        } else {
          await api.post('/items', payload);
          $q.notify({ color: 'positive', message: 'Item created successfully' });
        }
        
        router.push('/')
      } catch (err) {
        $q.notify({ color: 'negative', message: 'Error saving item' });
      }
    }

    const onReset = () => {
      selection.value = {
        objectType: null,
        location: null,
        status: null,
        brand: '',
        model: '',
        serial: '',
        color: '',
        observations: '',
        pulseScore: 100,
        estimatedCost: 0
      };
    }

    onMounted(fetchData)

    return {
      objectsList,
      locationsList,
      statusesList,
      selection,
      isEditMode,
      onSubmit,
      onReset
    }
  }
})
</script>

