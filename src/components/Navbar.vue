<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-menu">
        <router-link
          v-for="item in leftNavItems"
          :key="item.path"
          :to="item.path"
          :class="navItemClasses(item)"
          :style="{ '--nav-icon': `url(${item.icon})` }"
        >
          <span class="nav-text" :data-label="item.label">{{ item.label }}</span>
        </router-link>

        <router-link
          :to="homeNavItem.path"
          :class="navItemClasses(homeNavItem)"
          :style="{ '--nav-icon': `url(${homeNavItem.icon})` }"
        >
          <span class="nav-text" :data-label="homeNavItem.label">{{ homeNavItem.label }}</span>
        </router-link>

        <router-link to="/" class="nav-item nav-logo-item" :class="{ 'is-home': isHomePage }">
          <img src="/static/icons/LOGO2.png" alt="Logo" class="nav-logo-img" />
        </router-link>

        <router-link
          :to="hotNavItem.path"
          :class="navItemClasses(hotNavItem)"
          :style="{ '--nav-icon': `url(${hotNavItem.icon})` }"
        >
          <span class="nav-text" :data-label="hotNavItem.label">{{ hotNavItem.label }}</span>
        </router-link>

        <router-link
          v-for="item in rightNavItems"
          :key="item.path"
          :to="item.path"
          :class="navItemClasses(item)"
          :style="{ '--nav-icon': `url(${item.icon})` }"
        >
          <span class="nav-text" :data-label="item.label">{{ item.label }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')

type NavItem = {
  label: string
  path: string
  icon: string
  isMain?: boolean
}

const leftNavItems: NavItem[] = [
  { label: '政治', path: '/politics', icon: '/static/icons/politics.png' },
  { label: '经济', path: '/economy', icon: '/static/icons/economics.png' },
  { label: '文化', path: '/culture', icon: '/static/icons/culture.png' },
  { label: '科技', path: '/tech', icon: '/static/icons/technology.png' },
]

const homeNavItem: NavItem = {
  label: '首页',
  path: '/',
  icon: '/static/icons/dashboard.png',
  isMain: true,
}
const hotNavItem: NavItem = {
  label: '热搜',
  path: '/hot-search',
  icon: '/static/icons/heat.png',
  isMain: true,
}

const rightNavItems: NavItem[] = [
  { label: '体育', path: '/sports', icon: '/static/icons/sports.png' },
  { label: '娱乐', path: '/entertainment', icon: '/static/icons/reaction.png' },
  { label: '社会', path: '/society', icon: '/static/icons/society.png' },
  { label: '军事', path: '/military', icon: '/static/icons/military.png' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const navItemClasses = (item: NavItem) => ({
  'nav-item': true,
  'nav-item-main': !!item.isMain,
  'is-active': isActive(item.path),
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.navbar-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.navbar-menu::-webkit-scrollbar {
  display: none;
}

.nav-item {
  padding: 8px 18px;
  color: #4a5568;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.3s ease;
  position: relative;
  display: inline-flex;
  justify-content: center;
}

.nav-item::before {
  content: '';
  position: absolute;
  inset: 6px 12px;
  background: url('/static/icons/long banner.png') no-repeat center center;
  background-size: 100% 100%;
  opacity: 0;
  transform: scaleX(0.8);
  transition: all 0.3s ease;
  z-index: -1;
}

.nav-item:hover {
  color: #1f2933;
  transform: translateY(-2px);
}

.nav-item.is-active {
  color: #1c2a38;
  font-weight: 700;
}

.nav-item.is-active::before {
  opacity: 1;
  transform: scaleX(0.9);
}

.nav-text {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  transition: color 0.25s ease;
}

.nav-text::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background-image: var(--nav-icon);
  background-repeat: no-repeat;
  background-size: contain;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    width 0.25s ease,
    height 0.25s ease;
}

.nav-item:hover .nav-text,
.nav-item.is-active .nav-text {
  color: transparent;
}

.nav-item:hover .nav-text::after,
.nav-item.is-active .nav-text::after {
  opacity: 1;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%) scale(1);
}

.nav-item-main {
  font-weight: 800;
  font-size: 19px;
  color: #2c3e50;
  padding: 10px 22px;
}

.nav-item-main:hover {
  color: #1a252f;
}

.nav-logo-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.nav-logo-item::before,
.nav-logo-item::after {
  display: none;
}

.nav-logo-item.is-home {
  background: transparent !important;
}

.nav-logo-item.is-home:hover {
  background: transparent !important;
}

.nav-logo-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.nav-logo-item:hover .nav-logo-img {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
  }

  .navbar-menu {
    gap: 2px;
  }

  .nav-item {
    padding: 6px 10px;
    font-size: 12px;
  }

  .nav-item::after {
    width: 36px;
    height: 36px;
  }

  .nav-item-main {
    font-size: 13px;
    padding: 6px 12px;
  }

  .nav-logo-img {
    width: 42px;
    height: 42px;
  }
}
</style>
