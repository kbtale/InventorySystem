const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'add', component: () => import('pages/crudObject.vue') },
      { path: 'edit/:id', component: () => import('pages/crudObject.vue'), props: true },
      { path: 'inventory/sector/:id', component: () => import('pages/SectorInventory.vue'), props: true }
    ]
  },
  {
    path: '/login',
    component: () => import('pages/Login.vue')
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
