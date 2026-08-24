<template>
  <view class="upgrade-container">
    <view class="upgrade-header">
      <text class="upgrade-title">⚔️ 能力升级</text>
      <view class="gold-display">
        <text class="gold-text">💰 {{ gold }}</text>
      </view>
    </view>

    <view class="upgrade-content">
      <view 
        v-for="upgrade in upgrades" 
        :key="upgrade.id" 
        class="upgrade-item"
      >
        <view class="upgrade-info">
          <text class="upgrade-name">{{ upgrade.name }}</text>
          <text class="upgrade-desc">{{ upgrade.description }}</text>
          <text class="upgrade-effect">效果: {{ upgrade.effect(upgrade.currentLevel) }}</text>
        </view>
        
        <view class="upgrade-level">
          <view class="level-bar">
            <view 
              class="level-fill" 
              :style="{ width: (upgrade.currentLevel / upgrade.maxLevel * 100) + '%' }"
            ></view>
          </view>
          <text class="level-text">{{ upgrade.currentLevel }} / {{ upgrade.maxLevel }}</text>
        </view>
        
        <view 
          class="upgrade-btn"
          :class="{ 
            disabled: gold < getCost(upgrade) || upgrade.currentLevel >= upgrade.maxLevel,
            maxed: upgrade.currentLevel >= upgrade.maxLevel
          }"
          @tap="purchaseUpgrade(upgrade.id)"
        >
          <text v-if="upgrade.currentLevel >= upgrade.maxLevel">已满级</text>
          <text v-else>💰 {{ getCost(upgrade) }}</text>
        </view>
      </view>
    </view>

    <view class="back-btn" @tap="goBack">
      <text>返回</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PersistentUpgrades, Upgrade } from '@/game'

const upgradesManager = new PersistentUpgrades()
const gold = ref(0)
const upgrades = ref<Upgrade[]>([])

onMounted(() => {
  loadData()
})

function loadData() {
  gold.value = upgradesManager.gold
  upgrades.value = upgradesManager.upgrades
}

function getCost(upgrade: Upgrade): number {
  return typeof upgrade.cost === 'function' ? upgrade.cost(upgrade.currentLevel + 1) : upgrade.cost
}

function purchaseUpgrade(id: string) {
  const success = upgradesManager.purchaseUpgrade(id)
  
  if (success) {
    gold.value = upgradesManager.gold
    upgrades.value = [...upgradesManager.upgrades]
    uni.showToast({ title: '升级成功', icon: 'success' })
  } else {
    const upgrade = upgradesManager.getUpgradeById(id)
    if (!upgrade) return
    
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      uni.showToast({ title: '已达最高等级', icon: 'none' })
    } else {
      uni.showToast({ title: '金币不足', icon: 'none' })
    }
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss">
.upgrade-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30rpx;
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.upgrade-title {
  font-size: 48rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.gold-display {
  padding: 15rpx 30rpx;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 20rpx;
}

.gold-text {
  font-size: 32rpx;
}

.upgrade-content {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.upgrade-item {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20rpx;
  padding: 25rpx;
}

.upgrade-info {
  flex: 1;
}

.upgrade-name {
  display: block;
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.upgrade-desc {
  display: block;
  font-size: 24rpx;
  color: #888;
  margin-bottom: 8rpx;
}

.upgrade-effect {
  display: block;
  font-size: 22rpx;
  color: #4CAF50;
}

.upgrade-level {
  text-align: center;
  margin: 0 20rpx;
}

.level-bar {
  width: 100rpx;
  height: 15rpx;
  background: #333;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.level-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.level-text {
  font-size: 24rpx;
  color: #fff;
}

.upgrade-btn {
  padding: 20rpx 35rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 15rpx;
  color: #fff;
  font-size: 28rpx;
  min-width: 140rpx;
  text-align: center;
  
  &.disabled {
    background: #444;
    opacity: 0.5;
  }
  
  &.maxed {
    background: #666;
  }
  
  &:active:not(.disabled) {
    background: linear-gradient(135deg, #45a049, #3d8b40);
  }
}

.back-btn {
  margin-top: 40rpx;
  padding: 25rpx;
  background: linear-gradient(135deg, #4a4a6a 0%, #3a3a5a 100%);
  border-radius: 20rpx;
  text-align: center;
  color: #fff;
  font-size: 32rpx;
  
  &:active {
    background: linear-gradient(135deg, #5a5a7a 0%, #4a4a6a 100%);
  }
}
</style>
