<template>
  <view class="game-container">
    <view class="hud">
      <view class="hud-left">
        <view class="health-bar">
          <view class="health-fill" :style="{ width: healthPercent + '%' }"></view>
        </view>
        <text class="health-text">{{ playerStats.health }} / {{ playerStats.maxHealth }}</text>
      </view>
      
      <view class="hud-center">
        <text class="floor-text">第 {{ floor }} 层</text>
      </view>
      
      <view class="hud-right">
        <text class="gold-text">💰 {{ playerGold }}</text>
        <text class="score-text">分数: {{ score }}</text>
      </view>
    </view>

    <view class="game-area" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
      <!-- 地形层 -->
      <view class="terrain-layer">
        <view class="ground">
          <view class="ground-texture"></view>
          <view class="ground-decor">
            <view class="rock" v-for="i in 5" :key="'rock-' + i" :style="{ left: (i * 18 + Math.random() * 10) + '%' }"></view>
            <view class="grass" v-for="i in 8" :key="'grass-' + i" :style="{ left: (i * 11 + Math.random() * 5) + '%' }"></view>
          </view>
        </view>
        <view class="walls">
          <view class="wall wall-left"></view>
          <view class="wall wall-right"></view>
        </view>
        <view class="ceiling">
          <view class="ceiling-texture"></view>
          <view class="torch" v-for="i in 3" :key="'torch-' + i" :style="{ left: (i * 30 + 5) + '%' }">🔥</view>
        </view>
      </view>

      <view class="room-display">
        <view class="room-content">
          <view v-if="currentRoomType === 'start'" class="room-message">
            <text class="message-text">欢迎来到地牢！</text>
            <text class="message-hint">击败敌人，收集装备，挑战Boss！</text>
          </view>
          
          <view v-if="currentRoomType === 'rest'" class="room-message">
            <text class="message-text">休息区</text>
            <text class="message-hint">恢复全部生命值</text>
            <view class="rest-btn" @tap="rest">休息</view>
          </view>
          
          <view v-if="currentRoomType === 'shop'" class="room-message">
            <text class="message-text">商店</text>
            <text class="message-hint">购买强力装备</text>
          </view>
          
          <view v-if="currentRoomType === 'treasure'" class="room-message">
            <text class="message-text">宝箱房间</text>
            <text class="message-hint">收集珍贵物品</text>
          </view>
          
          <view v-if="currentRoomType === 'boss'" class="room-message">
            <text class="message-text">Boss房间</text>
            <text class="message-hint">击败Boss进入下一层</text>
          </view>

          <view class="enemies-container">
            <view 
              v-for="enemy in enemies" 
              :key="enemy.id" 
              class="enemy"
              :class="{ 'enemy-dead': !enemy.isAlive }"
            >
              <view class="enemy-sprite">{{ getEnemySprite(enemy.type) }}</view>
              <view class="enemy-health-bar">
                <view class="enemy-health-fill" :style="{ width: (enemy.stats.health / enemy.stats.maxHealth * 100) + '%' }"></view>
              </view>
            </view>
          </view>

          <view class="items-container">
            <view 
              v-for="item in items" 
              :key="item.id" 
              class="item"
              :style="{ borderColor: item.getRarityColor() }"
              @tap="collectItem(item.id)"
            >
              <text class="item-icon">{{ item.icon }}</text>
              <text class="item-name">{{ item.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="player" :class="{ 'player-invincible': isPlayerInvincible, 'player-attacking': isPlayerAttacking }">
        <view class="player-body">
          <view class="player-head">
            <view class="player-face">
              <view class="player-eyes"></view>
              <view class="player-mouth"></view>
            </view>
            <view class="player-hair"></view>
          </view>
          <view class="player-torso">
            <view class="player-arms">
              <view class="player-arm player-arm-left"></view>
              <view class="player-arm player-arm-right" :class="{ 'arm-swing': isPlayerAttacking }">
                <view class="player-weapon">⚔️</view>
              </view>
            </view>
            <view class="player-legs">
              <view class="player-leg player-leg-left" :class="{ 'leg-move': isMovingLeft }"></view>
              <view class="player-leg player-leg-right" :class="{ 'leg-move': isMovingRight }"></view>
            </view>
          </view>
        </view>
      </view>

      <view class="direction-hints">
        <view v-if="canMove.up" class="direction-hint" @tap="moveRoom('up')">⬆️</view>
        <view v-if="canMove.down" class="direction-hint" @tap="moveRoom('down')">⬇️</view>
        <view v-if="canMove.left" class="direction-hint" @tap="moveRoom('left')">⬅️</view>
        <view v-if="canMove.right" class="direction-hint" @tap="moveRoom('right')">➡️</view>
      </view>
    </view>

    <view class="controls">
      <view class="control-row">
        <view class="control-btn attack-btn" @touchstart="startAttack" @touchend="stopAttack">
          <text class="control-icon">⚔️</text>
        </view>
        <view class="control-btn jump-btn" @touchstart="jump">
          <text class="control-icon">⬆️</text>
        </view>
      </view>
      
      <view class="movement-controls">
        <view class="dpad">
          <view class="dpad-btn" @touchstart="moveLeft" @touchend="stopMove">⬆️</view>
          <view class="dpad-btn" @touchstart="moveLeft" @touchend="stopMove">⬅️</view>
          <view class="dpad-btn" @touchstart="moveRight" @touchend="stopMove">➡️</view>
          <view class="dpad-btn" @touchstart="moveDown" @touchend="stopMove">⬇️</view>
        </view>
      </view>
    </view>

    <view class="inventory-panel">
      <view class="inventory-header">
        <text class="inventory-title">背包</text>
      </view>
      <view class="inventory-items">
        <view 
          v-for="item in inventory" 
          :key="item.id" 
          class="inventory-item"
          :style="{ borderColor: item.getRarityColor() }"
          @tap="useItem(item)"
        >
          <text class="inventory-icon">{{ item.icon }}</text>
        </view>
        <view v-if="inventory.length === 0" class="empty-inventory">
          <text>背包为空</text>
        </view>
      </view>
    </view>

    <view v-if="isPaused" class="pause-overlay">
      <view class="pause-menu">
        <text class="pause-title">游戏暂停</text>
        <view class="pause-btn" @tap="resumeGame">继续游戏</view>
        <view class="pause-btn" @tap="quitGame">退出游戏</view>
      </view>
    </view>

    <view v-if="isGameOver" class="gameover-overlay">
      <view class="gameover-menu">
        <text class="gameover-title">游戏结束</text>
        <text class="gameover-score">最终分数: {{ score }}</text>
        <text class="gameover-kills">击杀数: {{ kills }}</text>
        <view class="gameover-btn" @tap="restartGame">再来一局</view>
        <view class="gameover-btn" @tap="quitGame">返回主页</view>
      </view>
    </view>

    <view v-if="isVictory" class="victory-overlay">
      <view class="victory-menu">
        <text class="victory-title">🎉 胜利！</text>
        <text class="victory-score">最终分数: {{ score }}</text>
        <view class="victory-btn" @tap="nextFloor">下一层</view>
        <view class="victory-btn" @tap="quitGame">返回主页</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { GameEngine, GameState, Weapon, Potion } from '@/game'

const engine = new GameEngine()

const playerStats = ref(engine.state.player.stats)
const playerGold = ref(engine.state.player.gold)
const floor = ref(engine.state.dungeon.currentFloor)
const score = ref(engine.state.score)
const kills = ref(engine.state.kills)
const isPaused = ref(false)
const isGameOver = ref(false)
const isVictory = ref(false)
const isPlayerInvincible = ref(false)
const isPlayerAttacking = ref(false)
const isMovingLeft = ref(false)
const isMovingRight = ref(false)

const currentRoomType = ref('start')
const enemies = ref<any[]>([])
const items = ref<any[]>([])
const inventory = ref<any[]>([])
const canMove = ref({ up: false, down: false, left: false, right: false })

const healthPercent = computed(() => {
  return (playerStats.value.health / playerStats.value.maxHealth) * 100
})

onMounted(() => {
  engine.setCallbacks(updateState, handleGameOver)
  engine.start()
  updateRoomInfo()
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  engine.stop()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

function updateState(state: GameState) {
  playerStats.value = { ...state.player.stats }
  playerGold.value = state.player.gold
  floor.value = state.dungeon.currentFloor
  score.value = state.score
  kills.value = state.kills
  isPaused.value = state.isPaused
  isGameOver.value = state.isGameOver
  isVictory.value = state.isVictory
  isPlayerInvincible.value = state.player.isInvincible
  
  if (state.dungeon.currentRoom) {
    currentRoomType.value = state.dungeon.currentRoom.type
    enemies.value = state.dungeon.currentRoom.enemies
    items.value = state.dungeon.currentRoom.items
  }
  
  inventory.value = state.player.inventory
  updateMovementOptions()
}

function updateRoomInfo() {
  if (engine.state.dungeon.currentRoom) {
    currentRoomType.value = engine.state.dungeon.currentRoom.type
    enemies.value = engine.state.dungeon.currentRoom.enemies
    items.value = engine.state.dungeon.currentRoom.items
  }
}

function updateMovementOptions() {
  const adjacent = engine.state.dungeon.getAdjacentRooms()
  canMove.value = { up: false, down: false, left: false, right: false }
  
  adjacent.forEach(adj => {
    if (adj.room && engine.state.dungeon.currentRoom?.isRoomCleared()) {
      canMove.value[adj.direction as keyof typeof canMove.value] = true
    }
  })
}

function handleGameOver(finalScore: number) {
  saveStats(finalScore)
}

function getEnemySprite(type: string): string {
  const sprites: Record<string, string> = {
    slime: '🟢',
    skeleton: '💀',
    goblin: '👺',
    orc: '👹',
    dragon: '🐉',
    boss: '👿'
  }
  return sprites[type] || '👹'
}

function handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      isMovingLeft.value = true
      engine.playerMoveLeft()
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      isMovingRight.value = true
      engine.playerMoveRight()
      break
    case 'ArrowUp':
    case 'w':
    case 'W':
      engine.playerJump()
      break
    case ' ':
      startAttack()
      break
    case 'Escape':
      engine.togglePause()
      break
  }
}

function handleKeyUp(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      isMovingLeft.value = false
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      isMovingRight.value = false
      break
  }
}

function saveStats(finalScore: number) {
  try {
    const gameStats = uni.getStorageSync('gameStats') || { maxFloor: 0, totalKills: 0, highScore: 0 }
    gameStats.maxFloor = Math.max(gameStats.maxFloor, floor.value)
    gameStats.totalKills += kills.value
    gameStats.highScore = Math.max(gameStats.highScore, finalScore)
    uni.setStorageSync('gameStats', gameStats)
    
    const upgrades = uni.getStorageSync('upgrades') || { gold: 0 }
    upgrades.gold = (upgrades.gold || 0) + playerGold.value
    uni.setStorageSync('upgrades', upgrades)
  } catch (e) {
    console.error('Failed to save stats:', e)
  }
}

function startAttack() {
  isPlayerAttacking.value = true
  engine.playerAttack()
  setTimeout(() => {
    isPlayerAttacking.value = false
  }, 300)
}

function stopAttack() {
  isPlayerAttacking.value = false
}

function jump() {
  engine.playerJump()
}

function moveLeft() {
  isMovingLeft.value = true
  engine.playerMoveLeft()
}

function moveRight() {
  isMovingRight.value = true
  engine.playerMoveRight()
}

function moveDown() {}

function stopMove() {}

function moveRoom(direction: 'up' | 'down' | 'left' | 'right') {
  engine.moveToRoom(direction)
  updateRoomInfo()
}

function collectItem(itemId: string) {
  engine.collectItem(itemId)
}

function useItem(item: any) {
  if (item.type === 'potion') {
    engine.playerUsePotion(item.id)
  }
}

function rest() {
  engine.state.player.heal(engine.state.player.stats.maxHealth)
}

function resumeGame() {
  engine.togglePause()
}

function restartGame() {
  engine.restart()
  isGameOver.value = false
  isVictory.value = false
}

function quitGame() {
  engine.stop()
  uni.navigateBack()
}

function nextFloor() {
  engine.state.dungeon.nextFloor()
  isVictory.value = false
}

let touchStartX = 0
let touchStartY = 0

function handleTouchStart(e: any) {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function handleTouchMove(e: any) {
  const touch = e.touches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 30) {
      engine.playerMoveRight()
    } else if (deltaX < -30) {
      engine.playerMoveLeft()
    }
  }
}

function handleTouchEnd() {}
</script>

<style lang="scss">
.game-container {
  width: 100%;
  height: 100vh;
  background: #0f0f1a;
  position: relative;
  overflow: hidden;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.hud-left {
  display: flex;
  flex-direction: column;
}

.health-bar {
  width: 200rpx;
  height: 20rpx;
  background: #333;
  border-radius: 10rpx;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ffaa00);
  transition: width 0.3s ease;
}

.health-text {
  font-size: 24rpx;
  color: #fff;
  margin-top: 5rpx;
}

.hud-center {
  text-align: center;
}

.floor-text {
  font-size: 32rpx;
  color: #ffd700;
  font-weight: bold;
}

.hud-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.gold-text {
  font-size: 28rpx;
}

.score-text {
  font-size: 24rpx;
  color: #aaa;
}

.game-area {
  position: absolute;
  top: 100rpx;
  left: 0;
  right: 0;
  bottom: 250rpx;
  overflow: hidden;
  background: linear-gradient(180deg, #1a0a0a 0%, #2d1818 50%, #1a0a0a 100%);
}

/* 地形层 */
.terrain-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
}

.ground-texture {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #4a3728 0%, #2d1f14 100%);
  border-top: 4rpx solid #5a4030;
}

.ground-decor {
  position: absolute;
  top: -20rpx;
  left: 0;
  right: 0;
  height: 40rpx;
}

.rock {
  position: absolute;
  width: 30rpx;
  height: 25rpx;
  background: #5a5a5a;
  border-radius: 50% 50% 40% 40%;
  top: 5rpx;
}

.grass {
  position: absolute;
  width: 8rpx;
  height: 20rpx;
  background: #2d5a27;
  border-radius: 4rpx 4rpx 0 0;
  top: 0;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 6rpx;
    height: 15rpx;
    background: #3a7a32;
    border-radius: 3rpx 3rpx 0 0;
  }
  
  &::before {
    left: -8rpx;
    top: 5rpx;
    transform: rotate(-20deg);
  }
  
  &::after {
    right: -8rpx;
    top: 5rpx;
    transform: rotate(20deg);
  }
}

.walls {
  position: absolute;
  top: 0;
  bottom: 100rpx;
  left: 0;
  right: 0;
}

.wall {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 60rpx;
  background: linear-gradient(90deg, #3d2817 0%, #5a3d2a 50%, #3d2817 100%);
}

.wall-left {
  left: 0;
  border-right: 4rpx solid #6b4423;
}

.wall-right {
  right: 0;
  border-left: 4rpx solid #6b4423;
}

.ceiling {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60rpx;
}

.ceiling-texture {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2d1f14 0%, #4a3728 100%);
  border-bottom: 4rpx solid #5a4030;
}

.torch {
  position: absolute;
  bottom: -10rpx;
  font-size: 36rpx;
  animation: flicker 0.5s infinite alternate;
}

@keyframes flicker {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.1); }
}

.room-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-content {
  text-align: center;
}

.room-message {
  margin-bottom: 40rpx;
}

.message-text {
  display: block;
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.message-hint {
  display: block;
  font-size: 28rpx;
  color: #888;
  margin-bottom: 30rpx;
}

.rest-btn {
  display: inline-block;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 20rpx;
  color: #fff;
  font-size: 32rpx;
}

.enemies-container {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 40rpx;
}

.enemy {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 1;
  transition: opacity 0.3s ease;
  
  &.enemy-dead {
    opacity: 0;
  }
}

.enemy-sprite {
  font-size: 80rpx;
  margin-bottom: 10rpx;
}

.enemy-health-bar {
  width: 80rpx;
  height: 10rpx;
  background: #333;
  border-radius: 5rpx;
  overflow: hidden;
}

.enemy-health-fill {
  height: 100%;
  background: #ff4444;
  transition: width 0.3s ease;
}

.items-container {
  display: flex;
  justify-content: center;
  gap: 30rpx;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15rpx;
  border: 3rpx solid;
}

.item-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.item-name {
  font-size: 22rpx;
  color: #fff;
}

.player {
  position: absolute;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  
  &.player-invincible {
    animation: blink 0.2s infinite;
  }
  
  &.player-attacking {
    .player-arm-right {
      animation: swing 0.3s ease-out;
    }
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes swing {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-60deg); }
  100% { transform: rotate(0deg); }
}

.player-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-head {
  width: 48rpx;
  height: 48rpx;
  background: #ffd5b4;
  border-radius: 50%;
  position: relative;
  z-index: 3;
}

.player-face {
  position: absolute;
  top: 12rpx;
  left: 50%;
  transform: translateX(-50%);
}

.player-eyes {
  display: flex;
  gap: 8rpx;
  
  &::before, &::after {
    content: '';
    width: 6rpx;
    height: 6rpx;
    background: #333;
    border-radius: 50%;
  }
}

.player-mouth {
  width: 8rpx;
  height: 3rpx;
  background: #8b4513;
  border-radius: 2rpx;
  margin: 6rpx auto 0;
}

.player-hair {
  position: absolute;
  top: -4rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 56rpx;
  height: 20rpx;
  background: #4a3728;
  border-radius: 20rpx 20rpx 0 0;
}

.player-torso {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-arms {
  display: flex;
  justify-content: space-between;
  width: 80rpx;
  position: relative;
  top: 10rpx;
}

.player-arm {
  width: 16rpx;
  height: 30rpx;
  background: #1e90ff;
  border-radius: 8rpx;
  position: relative;
}

.player-arm-left {
  transform-origin: top center;
}

.player-arm-right {
  transform-origin: top center;
  
  &.arm-swing {
    animation: swing 0.3s ease-out;
  }
}

.player-weapon {
  position: absolute;
  bottom: -30rpx;
  right: -20rpx;
  font-size: 32rpx;
}

.player-legs {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-top: 5rpx;
}

.player-leg {
  width: 18rpx;
  height: 35rpx;
  background: #4169e1;
  border-radius: 0 0 9rpx 9rpx;
  
  &.leg-move {
    animation: walk 0.3s infinite;
  }
}

.player-leg-left {
  animation-delay: 0s;
}

.player-leg-right {
  animation-delay: 0.15s;
}

@keyframes walk {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

.direction-hints {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.direction-hint {
  position: absolute;
  font-size: 40rpx;
  padding: 20rpx;
  pointer-events: auto;
  
  &:nth-child(1) { top: -100rpx; left: 50%; transform: translateX(-50%); }
  &:nth-child(2) { bottom: -100rpx; left: 50%; transform: translateX(-50%); }
  &:nth-child(3) { left: -100rpx; top: 50%; transform: translateY(-50%); }
  &:nth-child(4) { right: -100rpx; top: 50%; transform: translateY(-50%); }
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 250rpx;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
}

.control-row {
  display: flex;
  gap: 60rpx;
  margin-bottom: 30rpx;
}

.control-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #333, #222);
  border: 3rpx solid #444;
  
  &:active {
    background: linear-gradient(135deg, #444, #333);
  }
}

.control-icon {
  font-size: 48rpx;
}

.movement-controls {
  width: 100%;
  display: flex;
  justify-content: center;
}

.dpad {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10rpx;
}

.dpad-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  font-size: 32rpx;
  
  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:nth-child(1) { grid-column: 2; }
  &:nth-child(2) { grid-column: 1; grid-row: 2; }
  &:nth-child(3) { grid-column: 3; grid-row: 2; }
  &:nth-child(4) { grid-column: 2; grid-row: 2; }
}

.inventory-panel {
  position: absolute;
  top: 120rpx;
  right: 20rpx;
  width: 200rpx;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15rpx;
  padding: 20rpx;
}

.inventory-header {
  margin-bottom: 15rpx;
}

.inventory-title {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.inventory-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15rpx;
}

.inventory-item {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10rpx;
  border: 2rpx solid;
}

.inventory-icon {
  font-size: 32rpx;
}

.empty-inventory {
  grid-column: span 2;
  text-align: center;
  color: #666;
  font-size: 24rpx;
}

.pause-overlay,
.gameover-overlay,
.victory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.pause-menu,
.gameover-menu,
.victory-menu {
  background: linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%);
  padding: 60rpx;
  border-radius: 30rpx;
  text-align: center;
}

.pause-title,
.gameover-title,
.victory-title {
  display: block;
  font-size: 56rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 40rpx;
}

.victory-title {
  color: #ffd700;
}

.gameover-score,
.gameover-kills,
.victory-score {
  display: block;
  font-size: 32rpx;
  color: #aaa;
  margin-bottom: 20rpx;
}

.pause-btn,
.gameover-btn,
.victory-btn {
  display: block;
  padding: 25rpx 60rpx;
  margin: 20rpx auto;
  background: linear-gradient(135deg, #4a4a6a 0%, #3a3a5a 100%);
  border-radius: 20rpx;
  color: #fff;
  font-size: 32rpx;
  
  &:active {
    background: linear-gradient(135deg, #5a5a7a 0%, #4a4a6a 100%);
  }
}

.victory-btn:first-child {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}
</style>
