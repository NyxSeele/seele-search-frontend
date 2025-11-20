import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/hot-search',
      name: 'hot-search',
      component: () => import('@/views/HotSearchView.vue'),
      meta: { title: '热搜聚合' },
    },
    {
      path: '/politics',
      name: 'politics',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '政治', category: 'politics', categoryName: '政治' },
    },
    {
      path: '/economy',
      name: 'economy',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '经济', category: 'economy', categoryName: '经济' },
    },
    {
      path: '/culture',
      name: 'culture',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '文化', category: 'culture', categoryName: '文化' },
    },
    {
      path: '/tech',
      name: 'tech',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '科技', category: 'tech', categoryName: '科技' },
    },
    {
      path: '/sports',
      name: 'sports',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '体育', category: 'sports', categoryName: '体育' },
    },
    {
      path: '/entertainment',
      name: 'entertainment',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '娱乐', category: 'entertainment', categoryName: '娱乐' },
    },
    {
      path: '/society',
      name: 'society',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '社会', category: 'society', categoryName: '社会' },
    },
    {
      path: '/military',
      name: 'military',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '军事', category: 'military', categoryName: '军事' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '热搜'} - 热搜聚合`
  next()
})

export default router
