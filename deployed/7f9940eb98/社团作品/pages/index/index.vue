<template>
  <view class="container">
    <view class="background"></view>
    <view class="content">
      <view class="title-section">
        <text class="title">重生地牢</text>
        <text class="subtitle">DEAD CELLS ROGUELIKE</text>
      </view>
      
      <view class="menu-section">
        <view class="menu-btn" @tap="startGame">
          <text class="btn-text">开始冒险</text>
        </view>
        
        <view class="menu-btn" @tap="goToUpgrade">
          <text class="btn-text">能力升级</text>
          <view class="gold-badge">
            <text class="gold-text">💰 {{ gold }}</text>
          </view>
        </view>
        
        <view class="menu-btn" @tap="goToShop">
          <text class="btn-text">商店</text>
        </view>
      </view>
      
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-label">最高层数</text>
          <text class="stat-value">{{ maxFloor }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">击杀数</text>
          <text class="stat-value">{{ totalKills }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">最高分数</text>
          <text class="stat-value">{{ highScore }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const gold = ref(0)
const maxFloor = ref(0)
const totalKills = ref(0)
const highScore = ref(0)

onMounted(() => {
  loadStats()
})

function loadStats() {
  try {
    const saved = uni.getStorageSync('upgrades')
    if (saved) {
      gold.value = saved.gold || 0
    }
    
    const gameStats = uni.getStorageSync('gameStats')
    if (gameStats) {
      maxFloor.value = gameStats.maxFloor || 0
      totalKills.value = gameStats.totalKills || 0
      highScore.value = gameStats.highScore || 0
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

function startGame() {
  uni.navigateTo({ url: '/pages/game/game' })
}

function goToUpgrade() {
  uni.navigateTo({ url: '/pages/upgrade/upgrade' })
}

function goToShop() {
  uni.navigateTo({ url: '/pages/shop/shop' })
}
</script>

<style lang="scss">
.container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle at 20% 80%, rgba(120, 80, 200, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 100, 100, 0.1) 0%, transparent 50%);
  }
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
}

.title-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 80rpx;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 32rpx;
  color: #a0a0a0;
  letter-spacing: 8rpx;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
  max-width: 500rpx;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%);
  border: 2rpx solid #4a4a6a;
  border-radius: 20rpx;
  transition: all 0.3s ease;
  position: relative;
  
  &:active {
    transform: scale(0.98);
    border-color: #ff6b6b;
  }
}

.btn-text {
  font-size: 40rpx;
  color: #fff;
  font-weight: 600;
}

.gold-badge {
  position: absolute;
  right: 30rpx;
}

.gold-text {
  font-size: 28rpx;
}

.stats-section {
  display: flex;
  gap: 40rpx;
  margin-top: 80rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 40rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 10rpx;
}

.stat-value {
  font-size: 36rpx;
  color: #ffd700;
  font-weight: bold;
}
</style>
