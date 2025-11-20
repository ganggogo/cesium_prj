/**
 * 路由列表数据
 */
export default [
  { path: '/', redirect: '/index' },
  { path: '/index', name: 'index', component: () =>import('@/app/app0.vue') },
  { path: '/xtglz1', name: 'xtglz1', component: () =>import('@/app/app1.vue') },
  { path: '/xtglz2', name: 'xtglz2', component: () =>import('@/app/app2.vue') },
  { path: '/mxjz20250617', name: 'mxjz20250617', component: () =>import('@/app/app20250617.vue') },
  { path: '/xtglz3', name: 'xtglz3', component: () =>import('@/app/app3.vue') },
  { path: '/dpzsz1', name: 'dpzsz1', component: () =>import('@/app/app4.vue') },
  { path: '/dpzsz3', name: 'dpzsz3', component: () =>import('@/app/app5.vue') },
  { path: '/dpzsz4', name: 'dpzsz4', component: () =>import('@/app/app6.vue') },
  { path: '/dpzsz5', name: 'dpzsz5', component: () =>import('@/app/SHA256withRSA.vue') },
  { path: '/dpzsz6', name: 'dpzsz6', component: () =>import('@/app/ModelWs.vue') },
  { path: '/dpzsz7', name: 'dpzsz7', component: () =>import('@/app/20250507Ceisum.vue') }
]
