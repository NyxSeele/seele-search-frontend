<template>
  <footer class="app-footer">
    <p class="copyright">Copyright © 2025 小布丁 版权所有</p>
  </footer>
</template>

<script setup lang="ts">
// simple footer
</script>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 12px 20px;
  text-align: center;
  background: transparent;
  pointer-events: none;
}

.copyright {
  margin: 0;
  font-size: 12px;
  color: #888;
  font-weight: 400;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .app-footer {
    padding: calc(0.06rem + env(safe-area-inset-bottom)) 0.12rem;
    padding-bottom: calc(0.06rem + env(safe-area-inset-bottom));
  }

  .copyright {
    font-size: 0.1rem;
  }
}
</style>
