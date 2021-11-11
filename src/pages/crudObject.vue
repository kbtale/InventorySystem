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
          <q-input class="col-4 col-xs-10 col-sm-6 col-md-4 col-lg-4 col-xl-4 q-pa-xs" outlined autogrow v-model="selection.observations" label="Observations" />
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
export default {
  name: 'CrudObject',
  data(){
    return {
      objectsList: [
        "Computer",
        "Television",
        "Scanner",
        "Printer",
        "Speakers"
      ],
      locationsList: [
        "Academy",
        "Human Resources",
        "Accounting",
        "Administration",
        "IT"
      ],
      statusesList: [
        "Ideal",
        "Working",
        "Being Repaired",
        "Administration",
        "IT"
      ],
      selection: {
        objectType: ''
      }
    }
  }
}
</script>
