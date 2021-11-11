<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated reveal>
      <q-toolbar class="q-pt-sm q-pb-sm">
        <q-btn
          flat
          dense
          round
          icon="menu"
          size="lg"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          CEVAZ
        </q-toolbar-title>
        <q-btn-group push>
        <q-btn
          push
          color="secondary"
          size="md"
          label="Add new object"
          icon="add_circle"
        />
        <q-btn
          push
          color="purple"
          size="md"
          label="Update object"
          icon="mode_edit"
        />
        <q-btn
          push
          color="negative"
          size="md"
          label="Delete object"
          icon="delete_forever"
        />
      </q-btn-group>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Departments
        </q-item-label>

        <DepartmentsMenu
          v-for="link in departments"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import DepartmentsMenu from 'components/departmentsMenu.vue'

const departmentsList = [
  {
    title: 'Academy',
    caption: 'Ground Floor',
    icon: 'school',
    link: 'Academy'
  },
  {
    title: 'Administration',
    caption: 'Floor 1',
    icon: 'manage_accounts',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Library',
    caption: 'Ground Floor',
    icon: 'library_books',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Human Resources',
    caption: 'Ground Floor',
    icon: 'people',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Customer Support',
    caption: 'Ground Floor',
    icon: 'support_agent',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Marketing',
    caption: 'Floor 1',
    icon: 'moving',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'IT',
    caption: 'Ground Floor',
    icon: 'computer',
    link: 'https://awesome.quasar.dev'
  },
  {
    title: 'Manteinance',
    caption: 'Ground Floor',
    icon: 'settings',
    link: 'https://awesome.quasar.dev'
  },
  {
    title: 'CEVAZ',
    caption: 'Different Floors',
    icon: 'domain',
    link: 'https://awesome.quasar.dev'
  }
];

import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MainLayout',

  components: {
    DepartmentsMenu
  },

  setup () {
    const leftDrawerOpen = ref(false)

    return {
      departments: departmentsList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>
