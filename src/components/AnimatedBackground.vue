<template>
  <div class="animated-background">
    <!-- 左上角柔和光晕效果 -->
    <div class="sunlight-effect">
      <div class="sun-glow"></div>
      <div class="light-particles"></div>
    </div>

    <!-- 流动白光效果 -->
    <div class="flowing-lights">
      <div class="light-beam light-beam-1"></div>
      <div class="light-beam light-beam-2"></div>
      <div class="light-beam light-beam-3"></div>
      <div class="light-beam light-beam-4"></div>
      <div class="light-orb light-orb-1"></div>
      <div class="light-orb light-orb-2"></div>
      <div class="light-orb light-orb-3"></div>
    </div>

    <!-- 星星装饰 -->
    <div class="stars">
      <div class="star star-1">★</div>
      <div class="star star-2">★</div>
      <div class="star star-3">★</div>
      <div class="star star-4">☆</div>
      <div class="star star-5">☆</div>
      <div class="star star-6">★</div>
      <div class="star star-7">☆</div>
      <div class="star star-8">★</div>
      <div class="star star-9">☆</div>
      <div class="star star-10">★</div>
      <div class="star star-11">☆</div>
      <div class="star star-12">★</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 现代化背景效果
</script>

<style scoped>
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  /* 半蓝半白渐变背景 - 上蓝下白，蓝色更深 */
  background: linear-gradient(
    180deg,
    #64b5f6 0%,
    #90caf9 25%,
    #bbdefb 50%,
    #e3f2fd 75%,
    #ffffff 100%
  );
}

/* 左上角柔和光晕效果 */
.sunlight-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 600px;
  height: 600px;
  overflow: visible;
  pointer-events: none;
}

.sun-glow {
  position: absolute;
  top: -320px;
  left: -320px;
  width: 700px;
  height: 700px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.6) 15%,
    rgba(255, 255, 255, 0.4) 30%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(50px);
  animation: glowPulse 6s ease-in-out infinite;
}

.light-particles {
  position: absolute;
  top: -240px;
  left: -240px;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.2) 40%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(30px);
  animation: particleFloat 8s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
}

@keyframes particleFloat {
  0%,
  100% {
    opacity: 0.4;
    transform: translate(0, 0) scale(1);
  }
  25% {
    opacity: 0.6;
    transform: translate(20px, -20px) scale(1.05);
  }
  50% {
    opacity: 0.5;
    transform: translate(30px, 10px) scale(0.95);
  }
  75% {
    opacity: 0.6;
    transform: translate(-10px, -15px) scale(1.02);
  }
}

/* 流动白光效果 */
.flowing-lights {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.light-beam {
  position: absolute;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.35) 30%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.35) 70%,
    transparent 100%
  );
  filter: blur(40px);
  opacity: 0.8;
  box-shadow: 0 0 60px rgba(255, 255, 255, 0.4);
}

.light-beam-1 {
  width: 600px;
  height: 200px;
  top: 20%;
  left: -600px;
  animation: flowRight 18s linear infinite;
}

.light-beam-2 {
  width: 700px;
  height: 180px;
  top: 50%;
  left: -700px;
  animation: flowRight 22s linear infinite;
  animation-delay: -8s;
}

.light-beam-3 {
  width: 550px;
  height: 220px;
  top: 70%;
  left: -550px;
  animation: flowRight 20s linear infinite;
  animation-delay: -15s;
}

.light-beam-4 {
  width: 650px;
  height: 190px;
  top: 35%;
  left: -650px;
  animation: flowRight 21s linear infinite;
  animation-delay: -4s;
}

@keyframes flowRight {
  0% {
    transform: translateX(0) rotate(-8deg) scaleY(0.8);
    opacity: 0.4;
  }
  50% {
    opacity: 1;
    transform: translateX(calc(50vw + 250px)) rotate(0deg) scaleY(1);
  }
  100% {
    transform: translateX(calc(100vw + 700px)) rotate(8deg) scaleY(0.8);
    opacity: 0.4;
  }
}

.light-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.3) 30%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 70%
  );
  filter: blur(50px);
  box-shadow: 0 0 80px rgba(255, 255, 255, 0.3);
  animation: floatOrb ease-in-out infinite;
}

.light-orb-1 {
  width: 300px;
  height: 300px;
  top: 15%;
  right: 10%;
  animation-duration: 16s;
  animation-delay: 0s;
}

.light-orb-2 {
  width: 350px;
  height: 350px;
  bottom: 20%;
  left: 15%;
  animation-duration: 19s;
  animation-delay: -10s;
}

.light-orb-3 {
  width: 280px;
  height: 280px;
  top: 60%;
  right: 25%;
  animation-duration: 17s;
  animation-delay: -5s;
}

@keyframes floatOrb {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(50px, -50px) scale(1.15);
    opacity: 0.9;
  }
  50% {
    transform: translate(-40px, 60px) scale(0.85);
    opacity: 0.75;
  }
  75% {
    transform: translate(60px, 30px) scale(1.1);
    opacity: 0.85;
  }
}

/* 星星装饰 */
.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.star {
  position: absolute;
  color: rgba(255, 255, 255, 0.8);
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(144, 202, 249, 0.5);
  font-size: 24px;
  animation: starFloat ease-in-out infinite;
}

.star-1 {
  top: 8%;
  left: 12%;
  font-size: 36px;
  animation-duration: 4s;
}

.star-2 {
  top: 15%;
  right: 18%;
  font-size: 28px;
  animation-duration: 5s;
  animation-delay: -1s;
}

.star-3 {
  top: 25%;
  left: 45%;
  font-size: 22px;
  animation-duration: 4.5s;
  animation-delay: -2s;
}

.star-4 {
  top: 35%;
  right: 40%;
  font-size: 26px;
  animation-duration: 5.5s;
  animation-delay: -0.5s;
}

.star-5 {
  top: 45%;
  left: 20%;
  font-size: 20px;
  animation-duration: 4.8s;
  animation-delay: -2.5s;
}

.star-6 {
  top: 12%;
  left: 75%;
  font-size: 30px;
  animation-duration: 5.2s;
  animation-delay: -1.5s;
}

.star-7 {
  top: 55%;
  left: 8%;
  font-size: 24px;
  animation-duration: 4.3s;
  animation-delay: -3s;
}

.star-8 {
  top: 42%;
  right: 15%;
  font-size: 32px;
  animation-duration: 6s;
  animation-delay: -2.8s;
}

.star-9 {
  top: 68%;
  left: 35%;
  font-size: 18px;
  animation-duration: 4.6s;
  animation-delay: -1.2s;
}

.star-10 {
  top: 75%;
  right: 25%;
  font-size: 28px;
  animation-duration: 5.3s;
  animation-delay: -3.5s;
}

.star-11 {
  top: 82%;
  left: 60%;
  font-size: 22px;
  animation-duration: 4.9s;
  animation-delay: -0.8s;
}

.star-12 {
  top: 90%;
  right: 45%;
  font-size: 26px;
  animation-duration: 5.8s;
  animation-delay: -4s;
}

@keyframes starFloat {
  0%,
  100% {
    opacity: 0.4;
    transform: translateY(0) scale(1);
  }
  25% {
    opacity: 0.7;
    transform: translateY(-15px) scale(1.1);
  }
  50% {
    opacity: 1;
    transform: translateY(-25px) scale(1.2);
  }
  75% {
    opacity: 0.7;
    transform: translateY(-15px) scale(1.1);
  }
}
</style>
