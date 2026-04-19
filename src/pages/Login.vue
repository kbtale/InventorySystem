<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card square class="q-pa-lg shadow-24" style="width: 400px;">
          <q-card-section class="bg-primary text-white text-center q-pa-md">
            <div class="text-h4 text-weight-bold">My Inventory</div>
            <div class="text-subtitle2">Access Portal</div>
          </q-card-section>
          
          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <q-input
                v-model="form.username"
                label="Username"
                filled
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Please enter your username']"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                type="password"
                label="Password"
                filled
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Please enter your password']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <div class="q-mt-xl">
                <q-btn
                  label="Login"
                  type="submit"
                  color="primary"
                  class="full-width text-weight-bold"
                  size="lg"
                  :loading="loading"
                />
              </div>
            </q-form>
          </q-card-section>
          
          <q-card-section class="text-center q-pa-none q-mb-md">
            <p class="text-grey-7">Forgot your password? <a href="#" class="text-primary">Contact IT Support</a></p>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'PageLogin',
  setup () {
    const store = useStore()
    const router = useRouter()
    const loading = ref(false)
    const form = ref({
      username: '',
      password: ''
    })

    const onSubmit = async () => {
      loading.value = true
      const success = await store.dispatch('user/login', form.value)
      loading.value = false
      
      if (success) {
        router.push('/')
      }
    }

    return {
      form,
      loading,
      onSubmit
    }
  }
})
</script>

<style scoped>
.shadow-24 {
  box-shadow: 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2) !important;
}
</style>
