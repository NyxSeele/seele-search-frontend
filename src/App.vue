<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMainPage = computed(() => route.path === '/' || route.path.startsWith('/hot-search'))
</script>

<template>
  <div class="app-shell">
    <router-view />
    <img
      src="/static/icons/seele.png"
      alt="seele"
      class="global-seele"
      :class="isMainPage ? 'seele-main' : 'seele-sub'"
    />
  </div>
</template>

<style>
/* 引入自定义字体 */
@font-face {
  font-family: 'SourceHanSansCN';
  src: url('/static/fonts/SourceHanSansCN-Bold.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  font-family:
    'SourceHanSansCN',
    'Noto Sans SC',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell {
  min-height: 100%;
  width: 100%;
  position: relative;
}

.global-seele {
  position: fixed;
  bottom: 10px;
  left: 52.5%;
  transform: translateX(-240px);
  pointer-events: none;
  z-index: 40;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.2));
}

.seele-main {
  width: 130px;
}

.seele-sub {
  width: 130px;
}

@media (max-width: 768px) {
  .global-seele {
    bottom: 14px;
    transform: translateX(-180px) scale(0.92);
  }

  .seele-main {
    width: 100px;
  }

  .seele-sub {
    width: 130px;
  }
}
</style>
