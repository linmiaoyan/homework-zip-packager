// 游戏画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
let score = 0;
let health = 100;
let coins = 0;
let currentLevel = 1;
let monstersKilled = 0;
let monstersToNextLevel = 10; // 每关需要击杀的怪物数量
let inShop = false;

// 场景设置
const scene = {
    x: 0,
    width: 2000 // 场景总宽度
};

// 玩家属性
const playerStats = {
    attackPower: 10,
    maxHealth: 100
};

// 金币掉落
const coinsArray = [];

// 商店物品
const shopItems = [
    { id: 1, name: '加血瓶', price: 50, type: 'health', effect: 30 },
    { id: 2, name: '攻击提升', price: 100, type: 'attack', effect: 5 },
    { id: 3, name: '生命上限', price: 150, type: 'maxHealth', effect: 20 }
];

// 图片资源
const images = {
    background: new Image()
};

// 加载图片
images.background.src = 'assets/background.png';

// 球的残影
const ballTrails = [];

// 主角设置
const player = {
    x: 100,
    y: 300,
    width: 30,
    height: 50,
    speed: 5,
    jumpForce: 15,
    gravity: 0.8,
    velocityY: 0,
    isJumping: false,
    isAttacking: false,
    attackCooldown: 0,
    maxAttackCooldown: 60,
    direction: 'right' // 角色方向
};

// 球的设置
const ball = {
    x: 0,
    y: 0,
    radius: 15,
    speed: 10,
    isFlying: false,
    direction: 'right',
    distance: 0,
    maxDistance: 200,
    returnSpeed: 8,
    velocityY: 0,
    gravity: 0.2,
    initialY: 0
};

// 怪物设置
const monsters = [];
const monsterSpawnRate = 45; // 每45帧生成一个怪物
let spawnTimer = 0;

// 怪物类型
const monsterTypes = [
    { type: 'normal', width: 30, height: 50, speed: 2, color: '#f00', maxHealth: 20, damage: 20, coinDrop: 10 },
    { type: 'fast', width: 25, height: 40, speed: 4, color: '#ff0', maxHealth: 10, damage: 20, coinDrop: 15 },
    { type: 'large', width: 40, height: 60, speed: 1, color: '#0f0', maxHealth: 40, damage: 20, coinDrop: 25 },
    { type: 'tank', width: 50, height: 70, speed: 1, color: '#8B4513', maxHealth: 60, damage: 20, coinDrop: 35 },
    { type: 'ghost', width: 25, height: 50, speed: 3, color: '#8888ff', maxHealth: 15, damage: 20, coinDrop: 20 },
    { type: 'fire', width: 35, height: 55, speed: 2.5, color: '#ff4500', maxHealth: 25, damage: 20, coinDrop: 30 }
];

// 键盘控制
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// 初始化游戏
function init() {
    updateScore();
    updateHealth();
    gameLoop();
}

// 游戏主循环
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 如果在商店中，只绘制商店
    if (inShop) {
        drawShop();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // 处理输入
    handleInput();
    
    // 更新游戏状态
    updatePlayer();
    updateMonsters();
    checkCollisions();
    spawnMonsters();
    
    // 场景移动：根据角色位置调整场景
    if (player.x > canvas.width * 0.7 && scene.x < scene.width - canvas.width) {
        scene.x += player.speed;
        player.x -= player.speed;
    } else if (player.x < canvas.width * 0.3 && scene.x > 0) {
        scene.x -= player.speed;
        player.x += player.speed;
    }
    
    // 绘制游戏元素
    drawBackground();
    drawGround();
    drawPlayer();
    drawBall();
    drawBallTrails();
    drawMonsters();
    drawCoins();
    drawPlayerHealthBar();
    
    // 检查游戏结束
    if (health <= 0) {
        gameOver();
        return;
    }
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 处理输入
function handleInput() {
    // 移动
    if (keys.a) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys.d) {
        player.x += player.speed;
        player.direction = 'right';
    }
    
    // 跳跃
    if (keys.space && !player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
    }
    
    // 攻击
    if (keys.w && player.attackCooldown === 0) {
        player.isAttacking = true;
        player.attackCooldown = player.maxAttackCooldown;
        // 开始攻击，球飞出（永远向前，向右）
        ball.isFlying = true;
        ball.direction = 'right'; // 攻击永远向前（向右）
        ball.x = player.x + player.width; // 从玩家右侧抛出
        ball.y = player.y + player.height / 2;
        ball.initialY = ball.y;
        ball.velocityY = -5; // 初始向上速度，产生弧形
        ball.distance = 0;
        // 清空残影
        ballTrails.length = 0;
    }
    
    // 攻击冷却
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }
    
    // 攻击状态重置
    if (player.isAttacking && player.attackCooldown === 0) {
        player.isAttacking = false;
    }
}

// 更新主角状态
function updatePlayer() {
    // 应用重力
    player.velocityY += player.gravity;
    player.y += player.velocityY;
    
    // 地面碰撞
    if (player.y >= 300) {
        player.y = 300;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // 边界检查
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }
    
    // 更新球的状态
    updateBall();
}

// 更新球的状态
function updateBall() {
    if (ball.isFlying) {
        if (ball.distance < ball.maxDistance) {
            // 球飞出，带弧形
            if (ball.direction === 'right') {
                ball.x += ball.speed;
            } else {
                ball.x -= ball.speed;
            }
            // 应用重力，产生弧形
            ball.velocityY += ball.gravity;
            ball.y += ball.velocityY;
            ball.distance += ball.speed;
            
            // 添加残影
            ballTrails.push({
                x: ball.x,
                y: ball.y,
                radius: ball.radius,
                alpha: 0.8
            });
        } else {
            // 球返回（永远回到玩家右侧）
            const targetX = player.x + player.width; // 永远回到玩家右侧
            const targetY = player.y + player.height / 2;
            
            // 球向角色移动
            if (Math.abs(ball.x - targetX) < ball.returnSpeed) {
                ball.x = targetX;
            } else {
                ball.x += (targetX - ball.x) > 0 ? ball.returnSpeed : -ball.returnSpeed;
            }
            
            if (Math.abs(ball.y - targetY) < ball.returnSpeed) {
                ball.y = targetY;
            } else {
                ball.y += (targetY - ball.y) > 0 ? ball.returnSpeed : -ball.returnSpeed;
            }
            
            // 添加残影
            ballTrails.push({
                x: ball.x,
                y: ball.y,
                radius: ball.radius,
                alpha: 0.5
            });
            
            // 球回到角色手中
            if (ball.x === targetX && ball.y === targetY) {
                ball.isFlying = false;
            }
        }
    }
    
    // 更新残影
    for (let i = ballTrails.length - 1; i >= 0; i--) {
        const trail = ballTrails[i];
        trail.alpha -= 0.05;
        if (trail.alpha <= 0) {
            ballTrails.splice(i, 1);
        }
    }
}

// 生成怪物
function spawnMonsters() {
    spawnTimer++;
    if (spawnTimer >= monsterSpawnRate) {
        // 根据关卡难度选择怪物类型
        const maxTypeIndex = Math.min(currentLevel, monsterTypes.length);
        const monsterType = monsterTypes[Math.floor(Math.random() * maxTypeIndex)];
        
        // 根据关卡增加怪物属性
        const levelMultiplier = 1 + (currentLevel - 1) * 0.2;
        
        monsters.push({
            x: canvas.width + scene.x,
            y: 300 - monsterType.height + 50,
            width: monsterType.width,
            height: monsterType.height,
            speed: monsterType.speed,
            color: monsterType.color,
            type: monsterType.type,
            health: Math.floor(monsterType.maxHealth * levelMultiplier),
            maxHealth: Math.floor(monsterType.maxHealth * levelMultiplier),
            damage: monsterType.damage,
            coinDrop: monsterType.coinDrop,
            lastDamageTime: 0 // 上次造成伤害的时间
        });
        spawnTimer = 0;
    }
}

// 更新怪物状态
function updateMonsters() {
    for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];
        monster.x -= monster.speed;
        
        // 移除出界的怪物
        if (monster.x < scene.x - monster.width) {
            monsters.splice(i, 1);
            // 怪物逃脱，减少生命值
            health -= 10;
            updateHealth();
        }
    }
}

// 检查碰撞
function checkCollisions() {
    // 球攻击怪物
    if (ball.isFlying) {
        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            // 球与怪物的碰撞检测
            if (ball.x > monster.x && 
                ball.x < monster.x + monster.width && 
                ball.y > monster.y && 
                ball.y < monster.y + monster.height) {
                // 减少怪物生命值（使用玩家攻击力）
                monster.health -= playerStats.attackPower;
                if (monster.health <= 0) {
                    // 怪物死亡，掉落金币
                    coinsArray.push({
                        x: monster.x,
                        y: monster.y + monster.height / 2,
                        value: monster.coinDrop,
                        collected: false
                    });
                    monsters.splice(i, 1);
                    score += 10;
                    monstersKilled++;
                    updateScore();
                    checkLevelUp();
                }
            }
        }
    }
    
    // 获取当前时间（毫秒）
    const currentTime = Date.now();
    
    // 怪物碰撞主角 - 每个怪物每秒最多造成20点伤害
    for (const monster of monsters) {
        if (player.x < monster.x + monster.width && 
            player.x + player.width > monster.x && 
            player.y < monster.y + monster.height && 
            player.y + player.height > monster.y) {
            // 检查是否超过1秒(1000毫秒)
            if (currentTime - monster.lastDamageTime >= 1000) {
                health -= monster.damage;
                monster.lastDamageTime = currentTime;
                updateHealth();
            }
        }
    }
    
    // 金币自动飞向玩家并拾取
    for (let i = coinsArray.length - 1; i >= 0; i--) {
        const coin = coinsArray[i];
        const coinScreenX = coin.x - scene.x;
        
        // 计算金币到玩家的距离
        const dx = player.x + player.width / 2 - coinScreenX;
        const dy = player.y + player.height / 2 - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            // 金币到达玩家，自动拾取
            coins += coin.value;
            coinsArray.splice(i, 1);
        } else {
            // 金币向玩家移动
            const speed = 3;
            coin.x += (dx / distance) * speed;
            coin.y += (dy / distance) * speed;
        }
    }
}

// 检查升级
function checkLevelUp() {
    if (monstersKilled >= monstersToNextLevel) {
        currentLevel++;
        monstersKilled = 0;
        monstersToNextLevel = Math.floor(10 * Math.pow(1.5, currentLevel - 1));
        // 进入商店
        inShop = true;
    }
}

// 绘制主角
function drawPlayer() {
    // 计算玩家在屏幕上的位置
    const screenX = player.x;
    
    // 绘制火柴人身体
    ctx.fillStyle = '#fff';
    ctx.fillRect(screenX, player.y, player.width, player.height);
    
    // 绘制头部
    ctx.beginPath();
    ctx.arc(screenX + player.width / 2, player.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制8号球（只有在球不飞行时）
    if (!ball.isFlying) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        if (player.direction === 'right') {
            ctx.arc(screenX + player.width + 10, player.y + player.height / 2, 15, 0, Math.PI * 2);
        } else {
            ctx.arc(screenX - 10, player.y + player.height / 2, 15, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // 绘制数字8
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (player.direction === 'right') {
            ctx.fillText('8', screenX + player.width + 10, player.y + player.height / 2);
        } else {
            ctx.fillText('8', screenX - 10, player.y + player.height / 2);
        }
    }
}

// 绘制背景
function drawBackground() {
    // 绘制天空
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, 350);
    
    // 绘制云朵
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, Math.PI * 2);
    ctx.arc(130, 100, 30, 0, Math.PI * 2);
    ctx.arc(160, 100, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(300, 150, 25, 0, Math.PI * 2);
    ctx.arc(330, 150, 25, 0, Math.PI * 2);
    ctx.arc(360, 150, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(500, 80, 35, 0, Math.PI * 2);
    ctx.arc(540, 80, 35, 0, Math.PI * 2);
    ctx.arc(580, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制远处的山
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(100, 250);
    ctx.lineTo(200, 350);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(200, 350);
    ctx.lineTo(300, 200);
    ctx.lineTo(400, 350);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(400, 350);
    ctx.lineTo(500, 280);
    ctx.lineTo(600, 350);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(600, 350);
    ctx.lineTo(700, 220);
    ctx.lineTo(800, 350);
    ctx.fill();
}

// 绘制球
function drawBall() {
    if (ball.isFlying) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ball.x - scene.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制数字8
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('8', ball.x - scene.x, ball.y);
    }
}

// 绘制球的残影
function drawBallTrails() {
    for (const trail of ballTrails) {
        ctx.globalAlpha = trail.alpha;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(trail.x - scene.x, trail.y, trail.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制数字8
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('8', trail.x - scene.x, trail.y);
    }
    ctx.globalAlpha = 1;
}

// 绘制血条
function drawHealthBar(x, y, width, height, currentHealth, maxHealth) {
    // 血条背景
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);
    
    // 血条
    const healthPercentage = currentHealth / maxHealth;
    ctx.fillStyle = healthPercentage > 0.5 ? '#0f0' : healthPercentage > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(x, y, width * healthPercentage, height);
    
    // 血条边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
}

// 绘制怪物
function drawMonsters() {
    for (const monster of monsters) {
        // 绘制怪物身体
        ctx.fillStyle = monster.color;
        ctx.fillRect(monster.x - scene.x, monster.y, monster.width, monster.height);
        
        // 绘制头部
        ctx.beginPath();
        ctx.arc(monster.x - scene.x + monster.width / 2, monster.y - 10, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制怪物血条
        const healthBarWidth = monster.width;
        const healthBarHeight = 5;
        const healthBarX = monster.x - scene.x;
        const healthBarY = monster.y - 15;
        drawHealthBar(healthBarX, healthBarY, healthBarWidth, healthBarHeight, monster.health, monster.maxHealth);
    }
}

// 绘制玩家血条
function drawPlayerHealthBar() {
    const x = 10;
    const y = 10;
    const width = 150;
    const height = 20;
    
    // 血条标签
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('生命值', x, y - 5);
    
    // 绘制血条
    drawHealthBar(x, y, width, height, health, playerStats.maxHealth);
    
    // 生命值文字
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${health}/${playerStats.maxHealth}`, x + width / 2, y + height / 2 + 4);
    
    // 金币显示
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`金币: ${coins}`, x, y + 40);
    
    // 关卡显示
    ctx.fillStyle = '#fff';
    ctx.fillText(`关卡: ${currentLevel}`, x, y + 60);
    
    // 击杀进度
    ctx.fillText(`击杀: ${monstersKilled}/${monstersToNextLevel}`, x, y + 80);
    
    // 攻击力显示
    ctx.fillText(`攻击力: ${playerStats.attackPower}`, x, y + 100);
}

// 绘制金币
function drawCoins() {
    for (const coin of coinsArray) {
        const screenX = coin.x - scene.x;
        
        // 绘制金币
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(screenX, coin.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 金币边框
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 金币符号
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', screenX, coin.y);
    }
}

// 绘制商店
function drawShop() {
    if (!inShop) return;
    
    // 商店背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 商店标题
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('商店', canvas.width / 2, 50);
    
    // 当前金币
    ctx.fillStyle = '#ffd700';
    ctx.font = '20px Arial';
    ctx.fillText(`当前金币: ${coins}`, canvas.width / 2, 90);
    
    // 商店物品
    const itemWidth = 200;
    const itemHeight = 80;
    const startX = (canvas.width - (itemWidth * shopItems.length + 20 * (shopItems.length - 1))) / 2;
    
    shopItems.forEach((item, index) => {
        const itemX = startX + (itemWidth + 20) * index;
        const itemY = 150;
        
        // 物品背景
        ctx.fillStyle = coins >= item.price ? '#222' : '#444';
        ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
        
        // 物品边框
        ctx.strokeStyle = coins >= item.price ? '#4af' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);
        
        // 物品名称
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, itemX + itemWidth / 2, itemY + 30);
        
        // 物品价格
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText(`${item.price} 金币`, itemX + itemWidth / 2, itemY + 55);
        
        // 物品效果
        ctx.fillStyle = '#0f0';
        ctx.font = '14px Arial';
        let effectText = '';
        if (item.type === 'health') effectText = `+${item.effect} 生命`;
        if (item.type === 'attack') effectText = `+${item.effect} 攻击`;
        if (item.type === 'maxHealth') effectText = `+${item.effect} 生命上限`;
        ctx.fillText(effectText, itemX + itemWidth / 2, itemY + 75);
    });
    
    // 继续按钮
    ctx.fillStyle = '#0a0';
    ctx.fillRect(canvas.width / 2 - 100, 300, 200, 50);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 100, 300, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('继续游戏', canvas.width / 2, 335);
    
    // 操作提示
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('按数字键1-3购买物品，按空格键继续', canvas.width / 2, 370);
}

// 购买物品
function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
        console.log('物品不存在:', itemId);
        return false;
    }
    if (coins < item.price) {
        console.log('金币不足:', coins, '/', item.price);
        return false;
    }
    
    coins -= item.price;
    console.log('购买成功:', item.name, '剩余金币:', coins);
    
    if (item.type === 'health') {
        health = Math.min(health + item.effect, playerStats.maxHealth);
        console.log('生命值:', health);
    } else if (item.type === 'attack') {
        playerStats.attackPower += item.effect;
    } else if (item.type === 'maxHealth') {
        playerStats.maxHealth += item.effect;
        health += item.effect;
    }
    
    updateHealth();
    return true;
}

// 绘制地面
function drawGround() {
    ctx.fillStyle = '#663300';
    ctx.fillRect(0, 350, canvas.width, 50);
    
    // 绘制地面纹理
    ctx.fillStyle = '#8b4513';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, 350, 10, 50);
    }
}

// 更新分数
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 更新生命值
function updateHealth() {
    document.getElementById('health').textContent = health;
}

// 游戏结束
function gameOver() {
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
}

// 键盘事件监听
document.addEventListener('keydown', (e) => {
    // 商店交互
    if (inShop) {
        switch (e.key) {
            case '1':
                buyItem(1);
                console.log('购买物品1');
                break;
            case '2':
                buyItem(2);
                console.log('购买物品2');
                break;
            case '3':
                buyItem(3);
                console.log('购买物品3');
                break;
            case ' ': // 空格键继续游戏
                e.preventDefault();
                inShop = false;
                // 重置场景位置
                scene.x = 0;
                player.x = 100;
                // 清空怪物，准备下一关
                monsters.length = 0;
                spawnTimer = 0;
                console.log('退出商店，开始第', currentLevel, '关');
                break;
        }
        return;
    }
    
    switch (e.key) {
        case 'w':
            keys.w = true;
            break;
        case 'a':
            keys.a = true;
            break;
        case 's':
            keys.s = true;
            break;
        case 'd':
            keys.d = true;
            break;
        case ' ': // 空格键
            keys.space = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            keys.w = false;
            break;
        case 'a':
            keys.a = false;
            break;
        case 's':
            keys.s = false;
            break;
        case 'd':
            keys.d = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
});

// 确保DOM加载完成后再初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    init();
});