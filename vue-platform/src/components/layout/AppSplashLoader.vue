<script setup lang="ts">
import { Refrigerator, Sparkles } from '@lucide/vue';
</script>

<template>
  <div class="splash-screen">
    <div class="splash-content">
      <div class="logo-pulse">
        <div class="pulse-ring"></div>
        <div class="pulse-ring delay-1"></div>
        <div class="icon-bubble">
          <Refrigerator :size="38" class="fridge-icon" />
          <Sparkles :size="16" class="sparkle-badge" />
        </div>
      </div>
      <div class="brand-text">
        <h1 class="brand-title">V-Fridge</h1>
        <p class="brand-subtitle">Розумний та свіжий простір продуктів</p>
      </div>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: 
    radial-gradient(circle at 50% 35%, rgba(190, 211, 90, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 60% 60%, rgba(187, 237, 244, 0.18) 0%, transparent 45%);
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: fadeIn 0.3s ease-out;
}

.logo-pulse {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--primary-subtle);
  animation: ringPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.6s;
}

.icon-bubble {
  position: relative;
  width: 72px;
  height: 72px;
  background: var(--bg-surface);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px -4px rgba(140, 163, 34, 0.2), 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 1.5px solid var(--border-subtle);
  z-index: 1;
}

.fridge-icon {
  color: var(--primary);
  animation: floatBounce 2.4s ease-in-out infinite;
}

.sparkle-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  color: var(--light-iris-dark);
  background: var(--light-iris-bg);
  padding: 3px;
  border-radius: 50%;
  border: 1px solid var(--light-iris-border);
  animation: sparkleTwinkle 1.8s ease-in-out infinite alternate;
}

.brand-text {
  text-align: center;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.brand-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.loading-bar {
  width: 140px;
  height: 4px;
  background: var(--bg-subtle);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.loading-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: linear-gradient(90deg, var(--june-bud), var(--aqua-mist-dark));
  border-radius: 9999px;
  animation: slideLoading 1.4s ease-in-out infinite;
}

@keyframes ringPulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes sparkleTwinkle {
  0% { transform: scale(0.85) rotate(-10deg); opacity: 0.7; }
  100% { transform: scale(1.15) rotate(15deg); opacity: 1; }
}

@keyframes slideLoading {
  0% { left: -50%; }
  50% { left: 50%; }
  100% { left: 100%; }
}
</style>
