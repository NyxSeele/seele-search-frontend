import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: { title: 'Seele Vollerei' },
    },
    {
      path: '/hot-search',
      name: 'hot-search',
      component: () => import('@/views/HotSearchView.vue'),
      meta: { title: 'Seele Aggregation' },
    },
    {
      path: '/politics',
      name: 'politics',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Politics List', category: 'politics', categoryName: '政治' },
    },
    {
      path: '/economy',
      name: 'economy',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Economy List', category: 'economy', categoryName: '经济' },
    },
    {
      path: '/culture',
      name: 'culture',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Culture List', category: 'culture', categoryName: '文化' },
    },
    {
      path: '/tech',
      name: 'tech',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Technology List', category: 'tech', categoryName: '科技' },
    },
    {
      path: '/sports',
      name: 'sports',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Sports List', category: 'sports', categoryName: '体育' },
    },
    {
      path: '/entertainment',
      name: 'entertainment',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Entertainment List', category: 'entertainment', categoryName: '娱乐' },
    },
    {
      path: '/society',
      name: 'society',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Society List', category: 'society', categoryName: '社会' },
    },
    {
      path: '/military',
      name: 'military',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Seele Military List', category: 'military', categoryName: '军事' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || 'Seele'
  next()
})

export default router
