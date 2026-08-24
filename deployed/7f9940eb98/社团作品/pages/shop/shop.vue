<template>
  <view class="shop-container">
    <view class="shop-header">
      <text class="shop-title">🏪 商店</text>
      <view class="gold-display">
        <text class="gold-text">💰 {{ gold }}</text>
      </view>
    </view>

    <view class="shop-content">
      <view class="shop-section">
        <text class="section-title">武器</text>
        <view class="items-grid">
          <view 
            v-for="item in weapons" 
            :key="item.id" 
            class="shop-item"
            :style="{ borderColor: item.getRarityColor() }"
          >
            <text class="item-icon">{{ item.icon }}</text>
            <text class="item-name">{{ item.name }}</text>
            <text class="item-damage">伤害: {{ item.stats.damage }}</text>
            <text class="item-price">💰 {{ getPrice(item) }}</text>
            <view 
              class="buy-btn"
              :class="{ disabled: gold < getPrice(item) }"
              @tap="buyItem(item)"
            >
              <text>购买</text>
            </view>
          </view>
        </view>
      </view>

      <view class="shop-section">
        <text class="section-title">药水</text>
        <view class="items-grid">
          <view 
            v-for="item in potions" 
            :key="item.id" 
            class="shop-item"
            :style="{ borderColor: item.getRarityColor() }"
          >
            <text class="item-icon">{{ item.icon }}</text>
            <text class="item-name">{{ item.name }}</text>
            <text class="item-effect">{{ item.description }}</text>
            <text class="item-price">💰 {{ getPrice(item) }}</text>
            <view 
              class="buy-btn"
              :class="{ disabled: gold < getPrice(item) }"
              @tap="buyItem(item)"
            >
              <text>购买</text>
            </view>
          </view>
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
import { Weapon, Potion, Item } from '@/game'

const gold = ref(0)
const weapons = ref<Weapon[]>([])
const potions = ref<Potion[]>([])

onMounted(() => {
  loadGold()
  generateShopItems()
})

function loadGold() {
  try {
    const saved = uni.getStorageSync('upgrades')
    gold.value = saved.gold || 0
  } catch (e) {
    console.error('Failed to load gold:', e)
  }
}

function generateShopItems() {
  for (let i = 0; i < 4; i++) {
    weapons.value.push(Weapon.createRandomWeapon(3))
    potions.value.push(Potion.createRandomPotion(3))
  }
}

function getPrice(item: Item): number {
  const rarityMultiplier: Record<string, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5
  }
  
  if (item.type === 'weapon') {
    const weapon = item as Weapon
    return Math.floor(weapon.stats.damage * 10 * (rarityMultiplier[item.rarity] || 1))
  } else {
    const potion = item as Potion
    return Math.floor(potion.effect.value * 5 * (rarityMultiplier[item.rarity] || 1))
  }
}

function buyItem(item: Item) {
  const price = getPrice(item)
  if (gold.value < price) {
    uni.showToast({ title: '金币不足', icon: 'none' })
    return
  }

  gold.value -= price
  
  try {
    const saved = uni.getStorageSync('upgrades') || { gold: 0 }
    saved.gold = gold.value
    
    const inventory = saved.inventory || []
    inventory.push({
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      stats: item.type === 'weapon' ? (item as Weapon).stats : (item as Potion).effect
    })
    saved.inventory = inventory
    
    uni.setStorageSync('upgrades', saved)
    uni.showToast({ title: '购买成功', icon: 'success' })
    
    if (item.type === 'weapon') {
      weapons.value = weapons.value.filter(w => w.id !== item.id)
      weapons.value.push(Weapon.createRandomWeapon(3))
    } else {
      potions.value = potions.value.filter(p => p.id !== item.id)
      potions.value.push(Potion.createRandomPotion(3))
    }
  } catch (e) {
    console.error('Failed to save purchase:', e)
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss">
.shop-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30rpx;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.shop-title {
  font-size: 48rpx;
  color: #ffd700;
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

.shop-content {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.shop-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.shop-item {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 15rpx;
  padding: 20rpx;
  border: 3rpx solid;
  text-align: center;
}

.item-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.item-name {
  display: block;
  font-size: 26rpx;
  color: #fff;
  margin-bottom: 10rpx;
}

.item-damage,
.item-effect {
  display: block;
  font-size: 22rpx;
  color: #888;
  margin-bottom: 10rpx;
}

.item-price {
  display: block;
  font-size: 28rpx;
  margin-bottom: 15rpx;
}

.buy-btn {
  padding: 15rpx 30rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 10rpx;
  color: #fff;
  font-size: 26rpx;
  
  &.disabled {
    background: #444;
    opacity: 0.5;
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
