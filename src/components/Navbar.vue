<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-menu">
        <router-link to="/politics" class="nav-item" active-class="active">政治</router-link>
        <router-link to="/economy" class="nav-item" active-class="active">经济</router-link>
        <router-link to="/culture" class="nav-item" active-class="active">文化</router-link>
        <router-link to="/tech" class="nav-item" active-class="active">科技</router-link>
        <router-link to="/" class="nav-item nav-item-main" active-class="active">首页</router-link>
        <router-link to="/" class="nav-item nav-logo-item" :class="{ 'is-home': isHomePage }" active-class="active">
          <img src="/static/icons/LOGO2.png" alt="Logo" class="nav-logo-img" />
        </router-link>
        <router-link to="/hot-search" class="nav-item nav-item-main" active-class="active"
          >热搜</router-link
        >
        <router-link to="/sports" class="nav-item" active-class="active">体育</router-link>
        <router-link to="/entertainment" class="nav-item" active-class="active">娱乐</router-link>
        <router-link to="/society" class="nav-item" active-class="active">社会</router-link>
        <router-link to="/military" class="nav-item" active-class="active">军事</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
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
  padding: 8px 16px;
  color: #555;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item:hover {
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.6);
}

.nav-item.active {
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4a90e2;
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

.nav-logo-item.is-home {
  background: transparent !important;
}

.nav-logo-item.is-home:hover {
  background: transparent !important;
}

.nav-logo-item.is-home.active::after {
  display: none;
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
