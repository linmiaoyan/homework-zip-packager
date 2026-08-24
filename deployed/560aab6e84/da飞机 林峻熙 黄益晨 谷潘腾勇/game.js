const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const hpEl = document.getElementById("hp");
const levelEl = document.getElementById("level");
const monsterLevelEl = document.getElementById("monsterLevel");
const monsterXpEl = document.getElementById("monsterXp");
const monsterXpNeedEl = document.getElementById("monsterXpNeed");
const statusTextEl = document.getElementById("statusText");

const startPanel = document.getElementById("startPanel");
const pausePanel = document.getElementById("pausePanel");
const gameOverPanel = document.getElementById("gameOverPanel");
const victoryPanel = document.getElementById("victoryPanel");
const finalScoreEl = document.getElementById("finalScore");
const victoryScoreEl = document.getElementById("victoryScore");

const startSoloBtn = document.getElementById("startSoloBtn");
const startCoopBtn = document.getElementById("startCoopBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const victoryRestartBtn = document.getElementById("victoryRestartBtn");
const finalCoopRow = document.getElementById("finalCoopRow");
const finalBreakdown = document.getElementById("finalBreakdown");
const victoryCoopRow = document.getElementById("victoryCoopRow");
const victoryBreakdown = document.getElementById("victoryBreakdown");

const W = canvas.width;
const H = canvas.height;

let gameState = "menu";
/** 1 = 单人，3 = 三人合作 */
let playerMode = 1;
let keys = {};
let lastTime = 0;
let elapsed = 0;
let spawnTimer = 0;
let powerupTimer = 0;
let bossSpawnTimer = 0;
let starOffset = 0;
let starOffsetFar = 0;
let screenShake = 0;
let bossOnField = false;
let victoryTimer = 0;
let victoryFlash = 0;
let blockMilestone = false;
let bgGrad = null;
let bgVignetteGrad = null;
let bgLayer = null;
let bgLayerCtx = null;
let bgLayerFrame = 0;

const hudCache = { score: -1, hp: "", level: -1, mLv: -1, mXp: -1, mNeed: -1 };

let score = 0;
let bestScore = Number(localStorage.getItem("plane_best_score") || 0);
bestScoreEl.textContent = String(bestScore);
let lastScoreThreshold = 0;

let players = [];

function makePlayer(slot, coop) {
  const solo = !coop;
  const w = solo ? 36 : 28;
  const h = solo ? 44 : 34;
  const yy = solo ? H - 80 : H - 62;
  const layouts = solo
    ? [{ x: W / 2, y: yy, main: "#6fb8ff", mid: "#cbe7ff", acc: "#eaf4ff", tag: "P1" }]
    : [
        { x: W * 0.22, y: yy, main: "#5aa8ff", mid: "#8ec8ff", acc: "#eaf4ff", tag: "P1" },
        { x: W * 0.5, y: yy, main: "#52e8a0", mid: "#8ef0c8", acc: "#eafff4", tag: "P2" },
        { x: W * 0.78, y: yy, main: "#ff9a5c", mid: "#ffc090", acc: "#fff0e5", tag: "P3" }
      ];
  const L = layouts[slot];
  return {
    slot,
    alive: true,
    tag: L.tag,
    x: L.x,
    y: L.y,
    w,
    h,
    speed: solo ? 400 : 382,
    hp: 3,
    maxHp: 5,
    hasShield: false,
    doubleFireLevel: 0,
    hasPierce: false,
    pierceTimer: 0,
    hasHoming: false,
    homingTimer: 0,
    autoShootInterval: 0.22,
    bulletDamage: 2,
    autoShootTimer: 0,
    manualShootCooldown: 0,
    colorMain: L.main,
    colorMid: L.mid,
    colorAccent: L.acc,
    personalScore: 0,
    invincibilityTimer: 0,
    weaponSkill: slot === 0 ? "spread" : slot === 1 ? "pierce" : "homing",
    secondarySkill: slot === 0 ? "rapidFire" : slot === 1 ? "shieldRegen" : "lifeSteal",
    skillCooldown: 0,
    rapidFireActive: false,
    rapidFireTimer: 0
  };
}

function rebuildPlayers() {
  players = [];
  if (playerMode === 1) {
    players.push(makePlayer(0, false));
  } else {
    players.push(makePlayer(0, true), makePlayer(1, true), makePlayer(2, true));
  }
}

function anyPlayerAlive() {
  return players.some((p) => p.alive);
}

function alivePlayerCount() {
  return Math.max(1, players.filter((p) => p.alive).length);
}

function getBossAimPoint(fromX, fromY) {
  const alive = players.filter((p) => p.alive);
  if (alive.length === 0) return { x: W / 2, y: H / 2 };
  let best = alive[0];
  let bestD = Infinity;
  for (const p of alive) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const d = (cx - fromX) ** 2 + (cy - fromY) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { x: best.x + best.w / 2, y: best.y + best.h / 2 };
}

let monster = {
  level: 1,
  xp: 0,
  nextXp: 100
};
let monsterLevelUpTimer = 0;

const rewardPanel = document.getElementById("rewardPanel");
const rewardOptions = document.getElementById("rewardOptions");
const rewardTitle = document.getElementById("rewardTitle");

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];
const powerups = [];
const damageNumbers = [];
let combo = 0;
let comboTimer = 0;

const MAX_BULLETS = 50;
const MAX_ENEMY_BULLETS = 35;
const MAX_ENEMIES = 12;
const MAX_PARTICLES = 40;
const MAX_DAMAGE_NUMBERS = 12;

/** 受击后无敌帧（秒） */
const INVINCIBLE_AFTER_HIT = 0.55;
/** 选完里程碑奖励后的短暂无敌（秒） */
const INVINCIBLE_AFTER_REWARD = 2;

function grantInvincibility(p, seconds) {
  if (p && p.alive && seconds > 0) p.invincibilityTimer = seconds;
}

function initRenderCache() {
  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#0d1830");
  bgGrad.addColorStop(0.45, "#0a1222");
  bgGrad.addColorStop(1, "#050810");
  bgVignetteGrad = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.5, H * 0.9);
  bgVignetteGrad.addColorStop(0, "transparent");
  bgVignetteGrad.addColorStop(1, "rgba(0,0,0,0.55)");
  bgLayer = document.createElement("canvas");
  bgLayer.width = W;
  bgLayer.height = H;
  bgLayerCtx = bgLayer.getContext("2d");
  paintBgLayer();
}
initRenderCache();

function withGlow(color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function paintBgLayer() {
  const b = bgLayerCtx;
  b.fillStyle = bgGrad;
  b.fillRect(0, 0, W, H);
  b.fillStyle = "rgba(180, 200, 255, 0.35)";
  for (let i = 0; i < 18; i += 1) {
    b.fillRect((i * 67) % W, (i * 131 + starOffsetFar) % H, 1, 1);
  }
  b.fillStyle = "rgba(220, 235, 255, 0.7)";
  for (let i = 0; i < 20; i += 1) {
    b.fillRect((i * 61) % W, (i * 149 + starOffset) % H, 2, 2);
  }
  b.fillStyle = bgVignetteGrad;
  b.fillRect(0, 0, W, H);
}

function pushEnemyBullet(b) {
  if (enemyBullets.length >= MAX_ENEMY_BULLETS) return;
  enemyBullets.push(b);
}

function beginVictory() {
  if (gameState === "victory" || gameState === "victory_done") return;

  bossOnField = false;
  blockMilestone = true;
  gameState = "victory";
  victoryTimer = 2.8;
  victoryFlash = 1;
  enemyBullets.length = 0;
  enemies.length = 0;
  bullets.length = 0;
  screenShake = 0.35;

  addExplosion(W / 2, H * 0.28, "#ffd700", 28);
  addExplosion(W / 2, H * 0.32, "#ff8be8", 18);
  statusTextEl.textContent = "状态：Boss 击败！";
  rewardPanel.classList.remove("visible");
}

function showVictoryPanel() {
  gameState = "victory_done";
  victoryPanel.classList.add("visible");
  victoryScoreEl.textContent = String(score);

  if (playerMode === 3 && victoryCoopRow && victoryBreakdown) {
    victoryCoopRow.hidden = false;
    victoryBreakdown.textContent = players.map((p) => `${p.tag} ${p.personalScore}`).join(" · ");
  } else if (victoryCoopRow) {
    victoryCoopRow.hidden = true;
  }

  statusTextEl.textContent = "状态：任务完成";
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("plane_best_score", String(bestScore));
    bestScoreEl.textContent = String(bestScore);
  }
}

function updateVictory(dt) {
  victoryTimer -= dt;
  victoryFlash = Math.max(0, victoryFlash - dt * 0.85);

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (victoryTimer <= 0) showVictoryPanel();
  updateHud();
}

function defeatEnemy(i, killerOwner) {
  const e = enemies[i];
  if (!e) return;

  combo += 1;
  comboTimer = 2.5;
  const comboBonus = Math.min(combo, 10) * 0.1;
  const finalScore = Math.floor(e.score * (1 + comboBonus));
  const o = killerOwner != null ? killerOwner : 0;
  const shooter = players[o];
  if (shooter) shooter.personalScore += finalScore;
  score += finalScore;
  awardMonsterXp(e);

  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const wasBoss = e.boss;

  addExplosion(cx, cy, e.elite ? "#ff7f66" : "#ffd166", wasBoss ? 20 : e.elite ? 10 : 6);
  enemies.splice(i, 1);

  if (wasBoss) {
    beginVictory();
    return;
  }

  if (Math.random() < 0.08) {
    powerups.push({
      x: cx,
      y: cy,
      r: 11,
      speed: 120,
      type: ["double", "shield", "heal", "rapid", "power", "maxhp", "score", "pierce", "homing", "barrage"][
        Math.floor(Math.random() * 10)
      ]
    });
  }
}

function hurtPlayer(pl, damage) {
  if (!pl || !pl.alive) return false;
  if (gameState === "victory" || gameState === "victory_done" || gameState === "reward") return false;
  if (pl.invincibilityTimer > 0) return false;
  if (pl.hasShield) {
    pl.hasShield = false;
    return false;
  }
  pl.hp -= damage;
  grantInvincibility(pl, INVINCIBLE_AFTER_HIT);
  if (pl.hp <= 0) {
    pl.alive = false;
    if (!anyPlayerAlive()) {
      updateHud();
      gameOver();
      return true;
    }
  }
  return false;
}

function resetGame() {
  score = 0;
  lastScoreThreshold = 0;
  elapsed = 0;
  spawnTimer = 0;
  powerupTimer = 5;
  resetMonster();
  bossSpawnTimer = 14;
  combo = 0;
  comboTimer = 0;

  rebuildPlayers();

  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  powerups.length = 0;
  damageNumbers.length = 0;
  screenShake = 0;
  bossOnField = false;
  victoryTimer = 0;
  victoryFlash = 0;
  blockMilestone = false;

  updateHud(true);
}

function monsterNextXpForLevel(level) {
  // 等级越高需要的经验越多（非线性曲线）；整体略快升级 → 压力上升更快
  return Math.floor(82 * Math.pow(level, 1.38));
}

function resetMonster() {
  monster = {
    level: 1,
    xp: 0,
    nextXp: monsterNextXpForLevel(1)
  };
  monsterLevelUpTimer = 0;
}

function updateHud(force) {
  if (score !== hudCache.score || force) {
    hudCache.score = score;
    scoreEl.textContent = String(score);
  }
  const hpText =
    playerMode === 1
      ? String(players[0] ? players[0].hp : 0)
      : players.map((p) => `${p.tag}:${p.alive ? p.hp : "×"}`).join("  ");
  if (hpText !== hudCache.hp || force) {
    hudCache.hp = hpText;
    hpEl.textContent = hpText;
  }
  const lv = getLevel();
  if (lv !== hudCache.level || force) {
    hudCache.level = lv;
    levelEl.textContent = String(lv);
  }
  if (monsterLevelEl && (monster.level !== hudCache.mLv || force)) {
    hudCache.mLv = monster.level;
    monsterLevelEl.textContent = String(monster.level);
  }
  if (monsterXpEl && (monster.xp !== hudCache.mXp || force)) {
    hudCache.mXp = monster.xp;
    monsterXpEl.textContent = String(monster.xp);
  }
  if (monsterXpNeedEl && (monster.nextXp !== hudCache.mNeed || force)) {
    hudCache.mNeed = monster.nextXp;
    monsterXpNeedEl.textContent = String(monster.nextXp);
  }
}

function getLevel() {
  return Math.min(20, 1 + Math.floor(elapsed / 10));
}

function getDifficultyLevel() {
  let base = Math.min(85, 1.5 + getLevel() * 1.15 + (monster.level - 1) * 1.15);
  if (playerMode === 3) {
    const n = alivePlayerCount();
    base = Math.min(90, base + (n - 1) * 2.8);
  }
  return base;
}

function enemySpawnInterval() {
  const diff = getDifficultyLevel();
  return Math.max(0.05, 0.55 - diff * 0.048);
}

function hidePanels() {
  startPanel.classList.remove("visible");
  pausePanel.classList.remove("visible");
  gameOverPanel.classList.remove("visible");
  victoryPanel.classList.remove("visible");
  rewardPanel.classList.remove("visible");
}

function startGame() {
  resetGame();
  gameState = "playing";
  hidePanels();
  statusTextEl.textContent = playerMode === 3 ? "状态：战斗中（三人）" : "状态：战斗中";
}

function pauseGame() {
  if (gameState !== "playing") return;
  gameState = "paused";
  pausePanel.classList.add("visible");
  statusTextEl.textContent = playerMode === 3 ? "状态：暂停（三人）" : "状态：暂停";
}

function resumeGame() {
  if (gameState !== "paused") return;
  gameState = "playing";
  pausePanel.classList.remove("visible");
  statusTextEl.textContent = playerMode === 3 ? "状态：战斗中（三人）" : "状态：战斗中";
}

function gameOver() {
  if (gameState === "victory" || gameState === "victory_done") return;
  gameState = "over";
  finalScoreEl.textContent = String(score);
  if (playerMode === 3 && finalCoopRow && finalBreakdown) {
    finalCoopRow.hidden = false;
    finalBreakdown.textContent = players.map((p) => `${p.tag} ${p.personalScore}`).join(" · ");
  } else if (finalCoopRow) {
    finalCoopRow.hidden = true;
  }
  gameOverPanel.classList.add("visible");
  statusTextEl.textContent = "状态：已结束";
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("plane_best_score", String(bestScore));
    bestScoreEl.textContent = String(bestScore);
  }
}

function spawnEnemy() {
  const diff = getDifficultyLevel();
  const eliteChance = Math.min(0.78, 0.22 + diff * 0.016);
  const isElite = Math.random() < eliteChance;
  const w = isElite ? 46 : 32;
  const h = isElite ? 52 : 36;
  const hpBase = isElite ? 7 : 3;
  const hp = Math.max(1, Math.round(hpBase + diff * (isElite ? 2.2 : 1.3)));
  const shooter =
    isElite ||
    (diff >= 4 && Math.random() < Math.min(0.6, 0.12 + diff * 0.011));
  const shootInterval = isElite
    ? Math.max(0.42, 0.92 - diff * 0.018)
    : Math.max(0.75, 1.5 - diff * 0.019);
  const hasArmor = isElite && diff > 15 && Math.random() < 0.3;
  enemies.push({
    x: Math.random() * (W - w),
    y: -h,
    w,
    h,
    speed: (isElite ? 98 : 148) + diff * (isElite ? 9.5 : 7.8),
    hp,
    maxHp: hp,
    damage: isElite ? 2 + Math.floor(diff / 5) : 1 + Math.floor(diff / 6.5),
    score: isElite ? 120 : 30,
    elite: isElite,
    shooter,
    hasArmor,
    armor: hasArmor ? 1 : 0,
    xpValue: isElite ? 70 + Math.floor(diff * 2.2) : 25 + Math.floor(diff * 1.4),
    shootTimer: 0,
    shootInterval
  });
}

function bossNextInterval() {
  const diff = getDifficultyLevel();
  // 怪物越强，Boss越频繁，但保证不会刷太密
  return Math.max(15, 33 - diff * 0.48);
}

function spawnBoss() {
  const diff = getDifficultyLevel();
  const w = 92;
  const h = 110;
  const x = 20 + Math.random() * (W - w - 40);

  // 机制不同的 Boss 类型
  const bossTypePool = ["scatter", "scatter", "aim", "burst", "summon"];
  const bossType = bossTypePool[Math.floor(Math.random() * bossTypePool.length)];

  const bossColorMap = {
    scatter: "#7c3aed",
    aim: "#ff3d8a",
    burst: "#ffb020",
    summon: "#20c997"
  };

  let hp;
  let damage;
  let score;
  let shootInterval;
  let summonInterval = 0;
  let xpValue;

  if (bossType === "scatter") {
    hp = Math.round(300 + diff * 12);
    damage = 2 + Math.floor(diff / 6.5);
    score = 350 + Math.floor(diff * 18);
    shootInterval = Math.max(0.42, 1.02 - diff * 0.0095);
    xpValue = 420 + Math.floor(diff * 28);
  } else if (bossType === "aim") {
    hp = Math.round(278 + diff * 11);
    damage = 2 + Math.floor(diff / 5.8);
    score = 380 + Math.floor(diff * 20);
    shootInterval = Math.max(0.36, 0.84 - diff * 0.0072);
    xpValue = 470 + Math.floor(diff * 30);
  } else if (bossType === "burst") {
    hp = Math.round(255 + diff * 10);
    damage = 2 + Math.floor(diff / 5.2);
    score = 410 + Math.floor(diff * 22);
    shootInterval = Math.max(0.26, 0.62 - diff * 0.0048);
    xpValue = 500 + Math.floor(diff * 32);
  } else {
    // summon
    hp = Math.round(385 + diff * 14);
    damage = 2 + Math.floor(diff / 7.5);
    score = 450 + Math.floor(diff * 25);
    shootInterval = Math.max(0.62, 1.08 - diff * 0.0058);
    summonInterval = Math.max(1.1, 2.75 - diff * 0.024);
    xpValue = 560 + Math.floor(diff * 35);
  }

  bossOnField = true;
  enemies.push({
    x,
    y: 110, // Boss固定在上半区作战
    w,
    h,
    speed: 0,
    hp,
    maxHp: hp,
    damage,
    score,
    elite: false,
    boss: true,
    bossType,
    bossColor: bossColorMap[bossType] || "#7c3aed",
    xpValue,
    shootTimer: 0,
    shootInterval,
    summonTimer: 0,
    summonInterval
  });

  return bossType;
}

function spawnBossMinions(boss, diff) {
  const minionsToSpawn = 2 + Math.floor(Math.random() * 2); // 2~3只
  const minionW = 40;
  const minionH = 46;
  const baseX = boss.x + boss.w / 2 - minionW / 2;
  const baseY = boss.y + boss.h - 8;

  const hp = Math.round(10 + diff * 0.5);
  const speed = 138 + diff * 1.45;
  const damage = 1 + Math.floor(diff / 15);
  const shootInterval = Math.max(0.62, 1.18 - diff * 0.0075);
  const score = 120 + Math.floor(diff * 5);
  const xpValue = 90 + Math.floor(diff * 1.2);

  for (let i = 0; i < minionsToSpawn; i += 1) {
    const spread = (i - (minionsToSpawn - 1) / 2) * 26;
    const jitter = (Math.random() - 0.5) * 14;
    const x = Math.max(0, Math.min(W - minionW, baseX + spread + jitter));
    enemies.push({
      x,
      y: baseY,
      w: minionW,
      h: minionH,
      speed,
      hp,
      maxHp: hp,
      damage,
      score,
      elite: true,
      boss: false,
      xpValue,
      shootTimer: 0,
      shootInterval
    });
  }
}

function spawnPowerup() {
  const types = ["double", "shield", "heal", "rapid", "power", "maxhp", "score", "pierce", "homing", "barrage"];
  const type = types[Math.floor(Math.random() * types.length)];
  powerups.push({
    x: 20 + Math.random() * (W - 40),
    y: -20,
    r: 11,
    speed: 110,
    type
  });
}

function fireScreenBarrage(fromP) {
  if (!fromP || !fromP.alive) return;
  const columns = 12;
  for (let i = 0; i < columns; i += 1) {
    const x = ((i + 0.5) / columns) * W;
    bullets.push({
      x,
      y: H - 30,
      vx: 0,
      vy: -520,
      speed: 520,
      w: 4,
      h: 12,
      damage: fromP.bulletDamage,
      hitsLeft: fromP.hasPierce ? 99 : 1,
      homing: fromP.hasHoming,
      owner: fromP.slot
    });
  }
}

function activateSkill(p) {
  if (!p || !p.alive) return;
  
  switch (p.secondarySkill) {
    case "rapidFire":
      p.rapidFireActive = true;
      p.rapidFireTimer = 3;
      p.skillCooldown = 12;
      statusTextEl.textContent = `${p.tag} 激活快速射击！`;
      break;
    case "shieldRegen":
      p.hasShield = true;
      p.skillCooldown = 15;
      statusTextEl.textContent = `${p.tag} 生成护盾！`;
      break;
    case "lifeSteal":
      p.hp = Math.min(p.maxHp, p.hp + 2);
      p.skillCooldown = 18;
      statusTextEl.textContent = `${p.tag} 生命汲取！`;
      break;
  }
}

function shoot(manual, p) {
  if (!p || !p.alive) return;
  if (manual && p.manualShootCooldown > 0) return;
  if (manual) p.manualShootCooldown = 0.14;

  const bulletCount = 2 ** p.doubleFireLevel;
  
  const skillConfig = {
    spread: { spread: 15, countMultiplier: 1.5 },
    pierce: { hitsLeft: 3, speed: 520 },
    homing: { homing: true, speed: 420 }
  };
  
  const config = skillConfig[p.weaponSkill] || {};
  
  const base = {
    y: p.y - p.h / 2,
    vx: 0,
    vy: -(config.speed || 460),
    speed: config.speed || 460,
    w: 4,
    h: 12,
    damage: p.bulletDamage,
    hitsLeft: p.hasPierce ? 99 : (config.hitsLeft || 1),
    homing: p.hasHoming || config.homing || false,
    owner: p.slot
  };

  const skillSpread = config.spread || 10;
  const skillCount = p.weaponSkill === "spread" ? Math.floor(bulletCount * config.countMultiplier) : bulletCount;

  if (skillCount <= 1) {
    bullets.push({ ...base, x: p.x });
    return;
  }

  for (let i = 0; i < skillCount; i += 1) {
    const ratio = i / (skillCount - 1);
    const offset = -skillSpread * (skillCount - 1) / 2 + ratio * skillSpread * (skillCount - 1);
    if (bullets.length < MAX_BULLETS) {
      bullets.push({ ...base, x: p.x + offset });
    }
  }
}

function addExplosion(x, y, color, count = 10) {
  const room = MAX_PARTICLES - particles.length;
  if (room <= 0) return;
  const actualCount = Math.min(count, room);
  for (let i = 0; i < actualCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.35,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

function rectHit(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
    Math.abs(a.y - b.y) * 2 < (a.h + b.h)
  );
}

function applyBuffToPlayer(p, type) {
  if (!p || !p.alive) return;
  if (type === "double") {
    p.doubleFireLevel = Math.min(3, p.doubleFireLevel + 1);
  } else if (type === "shield") {
    p.hasShield = true;
  } else if (type === "heal") {
    p.hp = Math.min(p.maxHp, p.hp + 1);
  } else if (type === "rapid") {
    p.autoShootInterval = Math.max(0.12, p.autoShootInterval - 0.03);
  } else if (type === "power") {
    p.bulletDamage = Math.min(5, p.bulletDamage + 1);
  } else if (type === "maxhp") {
    p.maxHp = Math.min(10, p.maxHp + 1);
    p.hp = Math.min(p.maxHp, p.hp + 1);
  } else if (type === "pierce") {
    p.hasPierce = true;
    p.pierceTimer = 5;
  } else if (type === "homing") {
    p.hasHoming = true;
    p.homingTimer = 5;
  } else if (type === "barrage") {
    fireScreenBarrage(p);
  }
}

/** 场上拾取的道具：只强化吃到的那名玩家 */
function applyPowerupPickup(p, type) {
  if (type === "score") {
    score += 120;
    p.personalScore += 120;
    return;
  }
  applyBuffToPlayer(p, type);
}

/** 分数里程碑奖励：分数只加一次；其余效果给所有存活玩家；弹幕每人各放一轮 */
function applyMilestoneReward(type) {
  if (type === "score") {
    score += 120;
    return;
  }
  if (type === "barrage") {
    for (const pl of players) {
      if (pl.alive) fireScreenBarrage(pl);
    }
    return;
  }
  for (const pl of players) {
    if (pl.alive) applyBuffToPlayer(pl, type);
  }
}

function showRewardOptions() {
  if (blockMilestone || gameState === "victory" || gameState === "victory_done") return;
  const rewards = [
    { type: "double", name: "双发升级", desc: "增加武器数量" },
    { type: "shield", name: "护盾", desc: "抵挡一次伤害" },
    { type: "heal", name: "治疗", desc: "恢复1点生命值" },
    { type: "rapid", name: "攻速提升", desc: "减少射击间隔" },
    { type: "power", name: "火力提升", desc: "增加子弹伤害" },
    { type: "maxhp", name: "最大生命", desc: "增加1点最大生命值" },
    { type: "pierce", name: "穿透弹", desc: "子弹可以穿透敌人（5秒）" },
    { type: "homing", name: "追踪弹", desc: "子弹自动追踪敌人（5秒）" },
    { type: "barrage", name: "弹幕", desc: "全屏弹幕攻击" }
  ];

  // 后期减少奖励数量：随着等级提升，选择的奖励选项会从 3 -> 2 -> 1
  const curLevel = getLevel();
  let rewardCount = 3;
  if (curLevel >= 18) rewardCount = 1;
  else if (curLevel >= 14) rewardCount = 2;

  // 随机选择指定数量的不同奖励
  const selectedRewards = [];
  while (selectedRewards.length < rewardCount) {
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    if (!selectedRewards.includes(randomReward)) {
      selectedRewards.push(randomReward);
    }
  }

  // 清空奖励选项
  rewardOptions.innerHTML = "";

  // 添加奖励按钮
  selectedRewards.forEach(reward => {
    const button = document.createElement("button");
    button.textContent = `${reward.name}: ${reward.desc}`;
    button.addEventListener("click", () => {
      applyMilestoneReward(reward.type);
      rewardPanel.classList.remove("visible");
      gameState = "playing";
      for (const p of players) {
        grantInvincibility(p, INVINCIBLE_AFTER_REWARD);
      }
      statusTextEl.textContent = playerMode === 3 ? "状态：战斗中（三人）" : "状态：战斗中";
    });
    rewardOptions.appendChild(button);
  });

  rewardPanel.classList.add("visible");
  gameState = "reward";
}

function update(dt) {
  elapsed += dt;
  for (const p of players) {
    p.manualShootCooldown = Math.max(0, p.manualShootCooldown - dt);
    if (p.invincibilityTimer > 0) {
      p.invincibilityTimer = Math.max(0, p.invincibilityTimer - dt);
    }
    p.skillCooldown = Math.max(0, p.skillCooldown - dt);
    
    if (p.rapidFireActive) {
      p.rapidFireTimer -= dt;
      if (p.rapidFireTimer <= 0) {
        p.rapidFireActive = false;
        p.rapidFireTimer = 0;
        p.autoShootInterval = 0.22;
      } else {
        p.autoShootInterval = 0.08;
      }
    }
  }
  
  comboTimer -= dt;
  if (comboTimer <= 0) {
    combo = 0;
  }
  
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dn = damageNumbers[i];
    dn.life -= dt;
    dn.y -= dt * 40;
    if (dn.life <= 0) {
      damageNumbers.splice(i, 1);
    }
  }

  if (monsterLevelUpTimer > 0) {
    monsterLevelUpTimer -= dt;
    statusTextEl.textContent = `状态：怪物升级！Lv${monster.level}`;
    if (monsterLevelUpTimer <= 0) {
      monsterLevelUpTimer = 0;
      statusTextEl.textContent = "状态：战斗中";
    }
  }

  for (const p of players) {
    if (p.hasHoming) {
      p.homingTimer -= dt;
      if (p.homingTimer <= 0) {
        p.hasHoming = false;
        p.homingTimer = 0;
      }
    }
    if (p.hasPierce) {
      p.pierceTimer -= dt;
      if (p.pierceTimer <= 0) {
        p.hasPierce = false;
        p.pierceTimer = 0;
      }
    }
  }

  // Boss生成计时（Boss存在期间不刷普通敌机）
  if (!bossOnField) {
    bossSpawnTimer -= dt;
    if (bossSpawnTimer <= 0 && enemies.length < MAX_ENEMIES) {
      const bossType = spawnBoss();
      bossSpawnTimer = bossNextInterval();
      const bossLabelMap = {
        scatter: "散射",
        aim: "瞄准",
        burst: "连射",
        summon: "召唤"
      };
      const bossLabel = bossLabelMap[bossType] || "Boss";
      statusTextEl.textContent = `状态：Boss来袭！（${bossLabel}）`;
    }
  }

  for (const p of players) {
    if (!p.alive) continue;
    if (playerMode === 1) {
      if (keys["arrowleft"] || keys["a"]) p.x -= p.speed * dt;
      if (keys["arrowright"] || keys["d"]) p.x += p.speed * dt;
      if (keys["arrowup"] || keys["w"]) p.y -= p.speed * dt;
      if (keys["arrowdown"] || keys["s"]) p.y += p.speed * dt;
    } else if (p.slot === 0) {
      if (keys["a"]) p.x -= p.speed * dt;
      if (keys["d"]) p.x += p.speed * dt;
      if (keys["w"]) p.y -= p.speed * dt;
      if (keys["s"]) p.y += p.speed * dt;
    } else if (p.slot === 1) {
      if (keys["arrowleft"]) p.x -= p.speed * dt;
      if (keys["arrowright"]) p.x += p.speed * dt;
      if (keys["arrowup"]) p.y -= p.speed * dt;
      if (keys["arrowdown"]) p.y += p.speed * dt;
    } else if (p.slot === 2) {
      if (keys["j"]) p.x -= p.speed * dt;
      if (keys["l"]) p.x += p.speed * dt;
      if (keys["i"]) p.y -= p.speed * dt;
      if (keys["k"]) p.y += p.speed * dt;
    }
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x));
    p.y = Math.max(p.h / 2, Math.min(H - p.h / 2, p.y));
  }

  for (const p of players) {
    if (!p.alive) continue;
    p.autoShootTimer += dt;
    if (p.autoShootTimer >= p.autoShootInterval) {
      p.autoShootTimer = 0;
      shoot(false, p);
    }
  }

  if (playerMode === 1) {
    const p0 = players[0];
    if (p0 && p0.alive && (keys[" "] || keys["enter"])) shoot(true, p0);
    if (p0 && p0.alive && keys["q"] && p0.skillCooldown <= 0) activateSkill(p0);
  } else {
    if (players[0] && players[0].alive && keys[" "]) shoot(true, players[0]);
    if (players[1] && players[1].alive && keys["enter"]) shoot(true, players[1]);
    if (players[2] && players[2].alive && keys["g"]) shoot(true, players[2]);
    if (players[0] && players[0].alive && keys["q"] && players[0].skillCooldown <= 0) activateSkill(players[0]);
    if (players[1] && players[1].alive && keys["1"] && players[1].skillCooldown <= 0) activateSkill(players[1]);
    if (players[2] && players[2].alive && keys["z"] && players[2].skillCooldown <= 0) activateSkill(players[2]);
  }

  spawnTimer += dt;
  if (spawnTimer >= enemySpawnInterval()) {
    spawnTimer = 0;
    if (!bossOnField && enemies.length < MAX_ENEMIES) spawnEnemy();
  }

  powerupTimer -= dt;
  if (powerupTimer <= 0) {
    spawnPowerup();
    powerupTimer = 8.5 + Math.random() * 6;
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    if (b.homing && enemies.length > 0) {
      b.aimTimer = (b.aimTimer || 0) - dt;
      if (b.aimTimer <= 0) {
        b.aimTimer = 0.06;
        let minDist = Infinity;
        let tx = 0;
        let ty = 0;
        for (const e of enemies) {
          const dx = e.x + e.w / 2 - b.x;
          const dy = e.y + e.h / 2 - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < minDist) {
            minDist = d2;
            tx = dx;
            ty = dy;
          }
        }
        b._tx = tx;
        b._ty = ty;
      }
      if (b._tx != null) {
        const len = Math.hypot(b._tx, b._ty) || 1;
        const targetVx = (b._tx / len) * b.speed;
        const targetVy = (b._ty / len) * b.speed;
        b.vx += (targetVx - b.vx) * 0.08;
        b.vy += (targetVy - b.vy) * 0.08;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -30 || b.x < -30 || b.x > W + 30 || b.y > H + 30) bullets.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    e.y += e.speed * dt;
    if (!e.boss && e.y > H + e.h) {
      enemies.splice(i, 1);
      continue;
    }

    const diff = getDifficultyLevel();
    if (e.boss) {
      e.shootTimer += dt;
      if (e.shootTimer >= e.shootInterval) {
        e.shootTimer = 0;

        const bx = e.x + e.w / 2;
        const by = e.y + e.h;
        const aim = getBossAimPoint(bx, by);
        const baseAngle = Math.atan2(aim.y - by, aim.x - bx);

        if (e.bossType === "scatter") {
          const count = 3;
          const spread = 0.55; // vx 打散幅度
          for (let k = 0; k < count; k += 1) {
            const ratio = count === 1 ? 0.5 : k / (count - 1);
            const vx = (ratio - 0.5) * (220 * spread);
            const vy = 330 + diff * 2.65;
            pushEnemyBullet({
              x: bx,
              y: by,
              vx,
              vy,
              speed: vy,
              w: 5,
              h: 14,
              damage: e.damage
            });
          }
        } else if (e.bossType === "aim") {
          const count = 2;
          const spread = 0.10; // 弧度
          const speed = 352 + diff * 1.45;
          for (let k = 0; k < count; k += 1) {
            const offsetAngle = (k - (count - 1) / 2) * spread;
            const angle = baseAngle + offsetAngle;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            if (enemyBullets.length < MAX_ENEMY_BULLETS) {
              pushEnemyBullet({
                x: bx,
                y: by,
                vx,
                vy,
                speed,
                w: 5,
                h: 14,
                damage: e.damage
              });
            }
          }
        } else if (e.bossType === "burst") {
          const count = 4;
          const fan = 0.26;
          const speed = 418 + diff * 1.22;
          for (let k = 0; k < count; k += 1) {
            const ratio = count === 1 ? 0.5 : k / (count - 1);
            const angle = baseAngle - fan / 2 + ratio * fan;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            if (enemyBullets.length < MAX_ENEMY_BULLETS) {
              pushEnemyBullet({
                x: bx,
                y: by,
                vx,
                vy,
                speed,
                w: 5,
                h: 14,
                damage: e.damage
              });
            }
          }
        } else {
          // summon：慢一点的三连“定向散射”
          const count = 3;
          const fan = 0.18;
          const speed = 288 + diff * 1.02;
          for (let k = 0; k < count; k += 1) {
            const ratio = count === 1 ? 0.5 : k / (count - 1);
            const angle = baseAngle - fan / 2 + ratio * fan;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            if (enemyBullets.length < MAX_ENEMY_BULLETS) {
              pushEnemyBullet({
                x: bx,
                y: by,
                vx,
                vy,
                speed,
                w: 5,
                h: 14,
                damage: e.damage
              });
            }
          }
        }
      }

      // summon 专属：周期性召唤精英小怪
      if (e.bossType === "summon") {
        e.summonTimer += dt;
        if (e.summonTimer >= e.summonInterval) {
          e.summonTimer = 0;
          spawnBossMinions(e, diff);
        }
      }
    } else if (e.elite || e.shooter) {
      e.shootTimer += dt;
      if (e.shootTimer >= e.shootInterval) {
        e.shootTimer = 0;
        const vy = 318 + diff * 2.1;
        pushEnemyBullet({
          x: e.x + e.w / 2,
          y: e.y + e.h,
          vx: 0,
          vy,
          speed: vy,
          w: 4,
          h: 12,
          damage: e.damage || 1
        });
      }
    }

    const enemyRect = { x: e.x + e.w / 2, y: e.y + e.h / 2, w: e.w, h: e.h };
    let hitPl = null;
    for (const pl of players) {
      if (!pl.alive) continue;
      const playerRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
      if (rectHit(enemyRect, playerRect)) {
        hitPl = pl;
        break;
      }
    }
    if (hitPl) {
      if (e.boss || e.elite) {
        if (hurtPlayer(hitPl, e.damage)) return;
        e.hp -= 3;
        screenShake = Math.min(0.15, screenShake + 0.06);
        if (e.hp <= 0) defeatEnemy(i, null);
      } else {
        addExplosion(hitPl.x, hitPl.y, "#7cd4ff", 6);
        screenShake = Math.min(0.12, screenShake + 0.05);
        if (hurtPlayer(hitPl, e.damage)) return;
        defeatEnemy(i, null);
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    b.x += (b.vx || 0) * dt;
    b.y += b.vy * dt;
    if (b.y > H + 30 || b.x < -30 || b.x > W + 30) {
      enemyBullets.splice(i, 1);
      continue;
    }

    const bulletRect = { x: b.x, y: b.y, w: b.w, h: b.h };
    let hitPl = null;
    for (const pl of players) {
      if (!pl.alive) continue;
      const playerRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
      if (rectHit(bulletRect, playerRect)) {
        hitPl = pl;
        break;
      }
    }
    if (hitPl) {
      enemyBullets.splice(i, 1);
      addExplosion(b.x, b.y, "#ff7f66", 4);
      screenShake = Math.min(0.12, screenShake + 0.04);
      if (hurtPlayer(hitPl, b.damage)) return;
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    const er = { x: e.x + e.w / 2, y: e.y + e.h / 2, w: e.w, h: e.h };
    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const b = bullets[j];
      const br = { x: b.x, y: b.y, w: b.w, h: b.h };
      if (rectHit(er, br)) {
        if (e.armor && e.armor > 0) {
          e.armor -= 1;
          addExplosion(b.x, b.y, "#88ccff", 6);
        } else {
          e.hp -= b.damage;
          addExplosion(b.x, b.y, "#ffef9c", 4);
          screenShake = Math.min(0.15, screenShake + 0.02);
          if (damageNumbers.length < MAX_DAMAGE_NUMBERS) {
            damageNumbers.push({ x: e.x + e.w / 2, y: e.y, value: b.damage, life: 0.6 });
          }
        }
        b.hitsLeft -= 1;
        if (b.hitsLeft <= 0) {
          bullets.splice(j, 1);
        }
        if (e.hp <= 0) {
          const owner = b.owner;
          defeatEnemy(i, owner);
          break;
        }
        if (!bullets[j]) break;
      }
    }
    if (gameState === "victory") break;
  }

  if (gameState === "victory") {
    updateHud();
    return;
  }

  for (let i = powerups.length - 1; i >= 0; i -= 1) {
    const p = powerups[i];
    p.y += p.speed * dt;
    if (p.y > H + 20) {
      powerups.splice(i, 1);
      continue;
    }
    const pRect = { x: p.x, y: p.y, w: p.r * 2, h: p.r * 2 };
    let taker = null;
    for (const pl of players) {
      if (!pl.alive) continue;
      const playerRect = { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
      if (rectHit(playerRect, pRect)) {
        taker = pl;
        break;
      }
    }
    if (taker) {
      applyPowerupPickup(taker, p.type);
      addExplosion(p.x, p.y, "#89ff9e", 10);
      powerups.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (!blockMilestone) {
    const milestone = Math.floor(score / 1500);
    if (milestone > lastScoreThreshold) {
      lastScoreThreshold = milestone;
      showRewardOptions();
    }
  }

  updateHud();
}

function awardMonsterXp(enemy) {
  monster.xp += enemy.xpValue || 0;

  while (monster.xp >= monster.nextXp && monster.level < 50) {
    monster.xp -= monster.nextXp;
    monster.level += 1;
    monster.nextXp = monsterNextXpForLevel(monster.level);
    monsterLevelUpTimer = 2.5;
  }
}

function drawBackground(dt) {
  starOffset += dt * 95;
  starOffsetFar += dt * 38;
  bgLayerFrame += 1;
  if (bgLayerFrame >= 3) {
    bgLayerFrame = 0;
    paintBgLayer();
  }
  ctx.drawImage(bgLayer, 0, 0);
}

function drawOnePlane(p) {
  const t = elapsed * 24 + p.slot * 2.1;
  const flame = 0.65 + Math.sin(t) * 0.12;
  const sx = p.w / 36;
  const sy = p.h / 44;
  const blink = p.invincibilityTimer <= 0 || Math.sin(elapsed * 24) > 0.3;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(sx, sy);
  if (!blink) ctx.globalAlpha = 0.4;

  withGlow(p.colorMain, 12, () => {
    ctx.fillStyle = p.colorMain;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(16, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(-16, 18);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = p.colorMid;
  ctx.fillRect(-4, -10, 8, 20);

  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(255, 180, 80, ${0.4 * flame})`;
  ctx.beginPath();
  ctx.moveTo(-5, 16);
  ctx.lineTo(0, 16 + 20 * flame);
  ctx.lineTo(5, 16);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  if (p.hasShield) {
    const pulse = 0.75 + Math.sin(elapsed * 6 + p.slot) * 0.25;
    withGlow("rgba(113, 255, 240, 0.85)", 10, () => {
      ctx.strokeStyle = `rgba(113, 255, 240, ${0.55 + pulse * 0.35})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawPlayers() {
  for (const p of players) {
    if (p.alive) drawOnePlane(p);
  }
}

function drawEnemies() {
  const bossColorMap = {
    scatter: "#7c3aed",
    aim: "#ff3d8a",
    burst: "#ffb020",
    summon: "#20c997"
  };
  for (const e of enemies) {
    const baseColor = e.boss
      ? (e.bossColor || bossColorMap[e.bossType] || "#7c3aed")
      : (e.elite ? "#ff7f66" : "#ffb347");
    const x = e.x;
    const y = e.y;

    const drawBody = () => {
      const bodyGrad = ctx.createLinearGradient(x, y, x + e.w, y + e.h);
      bodyGrad.addColorStop(0, baseColor);
      bodyGrad.addColorStop(1, e.elite || e.boss ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.35)");
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x, y, e.w, e.h);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(x + 4, y + 4, e.w - 8, e.h - 8);
    };

    if (e.boss) {
      withGlow(baseColor, 14, drawBody);
    } else {
      drawBody();
    }

    if (e.elite || e.boss) {
      const hpRatio = e.hp / e.maxHp;
      const barY = e.boss ? y - 14 : y - 8;
      const barH = e.boss ? 6 : 4;
      ctx.fillStyle = "#1a2332";
      ctx.fillRect(x + 3, barY, e.w - 6, barH);
      ctx.fillStyle = "#7dff6a";
      ctx.fillRect(x + 3, barY, (e.w - 6) * hpRatio, barH);
    }
  }
}

function drawBullets() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 8;
  for (const b of bullets) {
    const halfW = b.w / 2;
    const halfH = b.h / 2;
    ctx.shadowColor = b.homing ? "rgba(255, 140, 230, 0.9)" : "rgba(255, 245, 160, 0.9)";
    ctx.fillStyle = b.homing ? "#ff8be8" : "#ffe566";
    ctx.fillRect(b.x - halfW, b.y - halfH, b.w, b.h);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(b.x - halfW * 0.35, b.y - halfH, halfW * 0.7, b.h * 0.5);
  }
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawEnemyBullets() {
  ctx.save();
  ctx.shadowColor = "rgba(255, 100, 80, 0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ff6b4a";
  for (const b of enemyBullets) {
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

const powerupStyle = {
  double: { color: "#f8d66d", txt: "2x" },
  shield: { color: "#73ffe9", txt: "S" },
  heal: { color: "#8dff8d", txt: "H" },
  rapid: { color: "#ff9f6e", txt: "R" },
  power: { color: "#d68cff", txt: "P" },
  maxhp: { color: "#4dff7a", txt: "M" },
  score: { color: "#ffe085", txt: "$" },
  pierce: { color: "#9ad7ff", txt: "T" },
  homing: { color: "#ff8be8", txt: "Z" },
  barrage: { color: "#ffffff", txt: "B" }
};

function drawPowerups() {
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of powerups) {
    const style = powerupStyle[p.type] || { color: "#ffffff", txt: "?" };
    withGlow(style.color, 12, () => {
      const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, style.color);
      g.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(16, 32, 48, 0.92)";
    ctx.fillText(style.txt, p.x, p.y);
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const useGlow = particles.length <= 28;
  if (useGlow) ctx.shadowBlur = 8;
  for (const p of particles) {
    const a = Math.max(0, Math.min(1, p.life * 1.25));
    ctx.globalAlpha = a;
    if (useGlow) ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    const r = p.size * 0.65;
    ctx.beginPath();
    ctx.arc(p.x + p.size * 0.5, p.y + p.size * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawEffectsText() {
  ctx.save();
  ctx.font = playerMode === 3 ? "11px Arial" : "13px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  let line = 0;
  
  const skillNames = {
    spread: "散射",
    pierce: "穿透",
    homing: "追踪"
  };
  
  const secondarySkillNames = {
    rapidFire: "速射",
    shieldRegen: "护盾",
    lifeSteal: "汲取"
  };
  
  for (const p of players) {
    if (!p.alive) continue;
    const y = H - 10 - line * (playerMode === 3 ? 13 : 0);
    line += playerMode === 3 ? 1 : 0;
    let x = 10;
    const gap = 8;
    const prefix = playerMode === 3 ? `${p.tag} ` : "";
    const labels = [];
    const skillReady = p.skillCooldown <= 0;
    const cooldownText = p.skillCooldown > 0 ? `(${Math.ceil(p.skillCooldown)}s)` : "";
    labels.push({ t: `${prefix}主:${skillNames[p.weaponSkill] || p.weaponSkill}`, c: "#ffd700" });
    labels.push({ t: `${prefix}副:${secondarySkillNames[p.secondarySkill] || p.secondarySkill}${cooldownText}`, c: skillReady ? "#00ff88" : "#888888" });
    if (p.doubleFireLevel > 0) labels.push({ t: `${prefix}火力x${2 ** p.doubleFireLevel}`, c: "#ffe8a8" });
    if (p.hasShield) labels.push({ t: `${prefix}护盾`, c: "#7ffff0" });
    if (p.autoShootInterval < 0.22) labels.push({ t: `${prefix}攻速↑`, c: "#ffb38a" });
    if (p.bulletDamage > 1) labels.push({ t: `${prefix}火力+${p.bulletDamage - 1}`, c: "#e0c4ff" });
    if (p.hasPierce) labels.push({ t: `${prefix}穿透`, c: "#9ad7ff" });
    if (p.hasHoming) labels.push({ t: `${prefix}追踪`, c: "#ff9ee8" });
    for (const { t, c } of labels) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText(t, x + 1, y + 1);
      ctx.fillStyle = c;
      ctx.fillText(t, x, y);
      x += ctx.measureText(t).width + gap;
    }
    if (playerMode === 1) break;
  }
  ctx.restore();
}

function drawDamageNumbers() {
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff6b35";
  for (const dn of damageNumbers) {
    ctx.globalAlpha = dn.life / 0.6;
    ctx.fillText(`-${dn.value}`, dn.x, dn.y);
  }
  ctx.globalAlpha = 1;
}

function drawCombo() {
  if (combo <= 1) return;
  ctx.save();
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  const x = W / 2;
  const y = H * 0.15;
  const alpha = Math.min(1, comboTimer / 0.5);

  ctx.globalAlpha = alpha;
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffd700";
  ctx.fillText(`${combo} COMBO!`, x, y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawVictoryFlash() {
  if (victoryFlash <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(255, 220, 120, ${victoryFlash * 0.35})`;
  ctx.fillRect(0, 0, W, H);
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 18;
  ctx.fillStyle = `rgba(255, 240, 180, ${0.5 + victoryFlash * 0.5})`;
  ctx.fillText("BOSS 击败！", W / 2, H * 0.38);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function render(dt) {
  ctx.save();
  if (screenShake > 0) {
    const mag = screenShake * 12;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    screenShake = Math.max(0, screenShake - dt * 2.8);
  }

  drawBackground(dt);
  const inBattle =
    gameState === "playing" || gameState === "paused" || gameState === "reward" || gameState === "victory";
  if (inBattle) {
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawPowerups();
    drawPlayers();
    drawParticles();
    if (combo > 1) drawCombo();
    if (gameState === "playing" || gameState === "reward") drawEffectsText();
  }
  if (gameState === "victory") drawVictoryFlash();
  ctx.restore();
}

function loop(ts) {
  const now = ts / 1000;
  const dt = Math.min(0.033, now - (lastTime || now));
  lastTime = now;

  if (gameState === "playing") update(dt);
  else if (gameState === "victory") updateVictory(dt);
  else if (gameState === "menu") {
    starOffset += dt * 40;
    starOffsetFar += dt * 16;
  }
  render(dt);

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "p") {
    if (gameState === "playing") pauseGame();
    else if (gameState === "paused") resumeGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousedown", () => {
  if (gameState !== "playing") return;
  for (const p of players) {
    if (p.alive) shoot(true, p);
  }
});

startSoloBtn.addEventListener("click", () => {
  playerMode = 1;
  startGame();
});
startCoopBtn.addEventListener("click", () => {
  playerMode = 3;
  startGame();
});
resumeBtn.addEventListener("click", resumeGame);
restartBtn.addEventListener("click", () => {
  gameOverPanel.classList.remove("visible");
  startGame();
});
victoryRestartBtn.addEventListener("click", () => {
  victoryPanel.classList.remove("visible");
  blockMilestone = false;
  startGame();
});

resetMonster();
playerMode = 1;
rebuildPlayers();
updateHud(true);
requestAnimationFrame(loop);
