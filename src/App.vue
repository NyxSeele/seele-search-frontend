<script setup lang="ts"></script>

<template>
  <div class="app-shell">
    <router-view />
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

</style>
