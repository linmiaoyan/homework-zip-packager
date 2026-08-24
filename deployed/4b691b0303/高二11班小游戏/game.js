// 游戏变量
let canvas, ctx;
let player;
let enemies = [];
let bullets = [];
enemyBullets = [];
let rooms = [];
let currentRoom = 0;
let score = 0;
let gameOver = false;
let powerUps = [];
let selectedLevel = 0;

// 屏幕震动效果
let shakeAmount = 0;
let shakeDuration = 0;
let shakeStartTime = 0;

// 受击特效
let hitEffects = [];

// 背景图片
let classroomBg = null;
let bgLoaded = false;

// 缓动函数
function easeOutQuad(t) {
    return t * (2 - t);
}

// 触发屏幕震动
function triggerShake(amount = 8, duration = 300) {
    shakeAmount = amount;
    shakeDuration = duration;
    shakeStartTime = Date.now();
}

// 添加受击特效
function addHitEffect(x, y) {
    for(let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        hitEffects.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            life: 1,
            size: 8 + Math.random() * 6
        });
    }
}

// 键盘状态
let keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
};

// 场景障碍物
let obstacles = [];

// 出生点安全区域
let safeZone = {
    x: 0,
    y: 0,
    radius: 100,
    active: true
};

// 初始化游戏
function initGame(startRoom = 0) {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 加载教室背景图
    if (!bgLoaded) {
        classroomBg = new Image();
        classroomBg.src = 'classroom_bg.png';
        classroomBg.onload = function() {
            bgLoaded = true;
        };
    }
    
    // 创建玩家
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 30,
        height: 30,
        health: 100,
        speed: 5,
        fireRate: 200,
        lastFire: 0,
        power: 1,
        // 位移技能属性
        dashCooldown: 7000,
        lastDash: 0,
        isDashing: false,
        dashDuration: 250,
        dashStart: 0,
        dashDirection: { x: 0, y: 0 },
        dashDistance: 200,
        isInvincible: false,
        invincibleDuration: 300,
        invincibleStart: 0,
        // 武器系统
        currentWeapon: 0, // 0: 普通射击, 1: 霰弹, 2: 近战
        weaponNames: ['普通射击', '霰弹枪', '近战攻击'],
        bulletSize: 1, // 子弹大小倍数
        // 近战攻击属性
        isMeleeAttacking: false,
        meleeAttackDuration: 200,
        meleeAttackStart: 0,
        meleeRange: 80,
        meleeDamage: 50, // 翻倍
        // 碰撞伤害免疫
        isCollisionImmune: false,
        collisionImmuneTime: 0
    };
    
    // 设置出生点安全区域
    safeZone.x = canvas.width / 2;
    safeZone.y = canvas.height / 2;
    safeZone.radius = 100;
    safeZone.active = true;
    
    // 生成场景障碍物
    generateObstacles();
    
    // 设置起始关卡
    currentRoom = startRoom;
    
    // 生成当前房间的敌人
    generateEnemies();
    
    // 绑定事件监听
    bindEventListeners();
    
    // 开始游戏循环
    gameLoop();
}

// 键盘按下事件
function keyDown(e) {
    const key = e.key.toLowerCase();
    switch(key) {
        case 'w': keys.up = true; break;
        case 's': keys.down = true; break;
        case 'a': keys.left = true; break;
        case 'd': keys.right = true; break;
        case ' ': keys.space = true; break;
        case '1': player.currentWeapon = 0; break;
        case '2': player.currentWeapon = 1; break;
        case '3': player.currentWeapon = 2; break;
        case 'q': player.currentWeapon = (player.currentWeapon + 1) % 3; break;
    }
}

// 键盘释放事件
function keyUp(e) {
    const key = e.key.toLowerCase();
    switch(key) {
        case 'w': keys.up = false; break;
        case 's': keys.down = false; break;
        case 'a': keys.left = false; break;
        case 'd': keys.right = false; break;
        case ' ': keys.space = false; break;
    }
}

// 事件监听是否已绑定
let eventListenersBound = false;

// 绑定事件监听
function bindEventListeners() {
    if(eventListenersBound) return;
    
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
    canvas.addEventListener('click', handleMouseClick);
    canvas.addEventListener('contextmenu', handleRightClick);
    
    eventListenersBound = true;
}

// 生成房间
function generateRooms() {
    const roomThemes = [
        "教室", "操场", "图书馆", "实验室", "食堂",
        "体育馆", "艺术室", "计算机室", "音乐室", "毕业大厅"
    ];
    
    for(let i = 0; i < 10; i++) {
        rooms.push({
            enemies: Math.floor(Math.random() * 5) + 3 + i, // 随着房间增加敌人数量
            type: Math.floor(Math.random() * 3), // 0: 普通, 1: 精英, 2: BOSS
            theme: roomThemes[i]
        });
    }
}

// 生成场景障碍物
function generateObstacles() {
    obstacles = [];
    
    // 房间角落的大障碍物
    const cornerPositions = [
        { x: 50, y: 50 },
        { x: canvas.width - 100, y: 50 },
        { x: 50, y: canvas.height - 100 },
        { x: canvas.width - 100, y: canvas.height - 100 }
    ];
    
    cornerPositions.forEach(pos => {
        obstacles.push({
            x: pos.x,
            y: pos.y,
            width: 60,
            height: 60,
            type: 'solid'
        });
    });
    
    // 随机生成一些中型障碍物
    const obstacleCount = 4 + Math.floor(Math.random() * 3);
    for(let i = 0; i < obstacleCount; i++) {
        let obstacleX, obstacleY;
        let attempts = 0;
        do {
            obstacleX = Math.random() * (canvas.width - 80) + 40;
            obstacleY = Math.random() * (canvas.height - 80) + 40;
            attempts++;
        } while (
            Math.sqrt(Math.pow(obstacleX + 40 - safeZone.x, 2) + 
                      Math.pow(obstacleY + 40 - safeZone.y, 2)) < safeZone.radius + 50 &&
            attempts < 100
        );
        
        obstacles.push({
            x: obstacleX,
            y: obstacleY,
            width: 50 + Math.random() * 30,
            height: 50 + Math.random() * 30,
            type: 'solid'
        });
    }
}

// 生成敌人
function generateEnemies() {
    enemies = [];
    powerUps = [];
    const room = rooms[currentRoom];
    
    // 检查是否是5的倍数关卡（第5、10关等）
    const isBossRoom = (currentRoom + 1) % 5 === 0;
    
    // 出生点安全区域半径
    const safeZoneRadius = 120;
    // 玩家初始位置
    const playerSpawnX = canvas.width / 2;
    const playerSpawnY = canvas.height / 2;
    
    if(isBossRoom) {
        // 只生成一个强大的boss
        const bossTypes = [
            { name: '升学压力BOSS', health: 800, speed: 3, size: 80, damage: 20, fireRate: 400 },
            { name: '考试魔王', health: 1000, speed: 2.5, size: 85, damage: 25, fireRate: 350 },
            { name: '作业巨怪', health: 1200, speed: 2, size: 90, damage: 30, fireRate: 300 }
        ];
        
        // 随机选择一个boss类型
        const bossData = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        
        enemies.push({
            x: canvas.width / 2 - bossData.size / 2,
            y: 100,
            width: bossData.size,
            height: bossData.size,
            health: bossData.health,
            maxHealth: bossData.health,
            speed: bossData.speed,
            type: 'boss',
            name: bossData.name,
            damage: bossData.damage,
            fireRate: bossData.fireRate,
            lastFire: 0,
            phase: 1,
            attackPattern: 0,
            attackTimer: 0,
            moveDirection: 1
        });
    } else {
        // 生成普通敌人 - 分为近战和远程两种
        const enemyTypes = [
            // 近战敌人
            { name: '作业怪兽', attackType: 'melee', health: 60, speed: 3.5, size: 40, damage: 10, chargeSpeed: 8 },
            { name: '考试恶魔', attackType: 'melee', health: 80, speed: 4, size: 45, damage: 15, chargeSpeed: 10 },
            // 远程敌人
            { name: '数学题怪', attackType: 'ranged', health: 40, speed: 1.5, size: 35, damage: 5, fireRate: 1200 },
            { name: '英语单词怪', attackType: 'ranged', health: 50, speed: 2, size: 38, damage: 8, fireRate: 1000 }
        ];
        
        for(let i = 0; i < room.enemies; i++) {
            // 随机选择敌人类型：50%近战，50%远程
            const enemyData = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // 确保敌人不会在出生点附近生成，也不会在障碍物中生成
            let enemyX, enemyY;
            let attempts = 0;
            let validPosition = false;
            do {
                enemyX = Math.random() * (canvas.width - enemyData.size) + 20;
                enemyY = Math.random() * (canvas.height - enemyData.size) + 20;
                attempts++;
                
                // 检查位置是否有效：不在安全区，也不与障碍物碰撞
                const inSafeZone = Math.sqrt(Math.pow(enemyX + enemyData.size / 2 - playerSpawnX, 2) + 
                                           Math.pow(enemyY + enemyData.size / 2 - playerSpawnY, 2)) < safeZoneRadius;
                
                const tempEnemy = { x: enemyX, y: enemyY, width: enemyData.size, height: enemyData.size };
                const inObstacle = checkObstacleCollision(tempEnemy);
                
                validPosition = !inSafeZone && !inObstacle;
            } while (!validPosition && attempts < 100);
            
            enemies.push({
                x: enemyX,
                y: enemyY,
                width: enemyData.size,
                height: enemyData.size,
                health: enemyData.health,
                maxHealth: enemyData.health,
                speed: enemyData.speed,
                type: enemyData.attackType,
                name: enemyData.name,
                damage: enemyData.damage,
                fireRate: enemyData.fireRate || 0,
                lastFire: 0,
                chargeSpeed: enemyData.chargeSpeed || 0,
                isCharging: false,
                chargeDirection: { x: 0, y: 0 },
                chargeCooldown: 0
            });
        }
    }
    
    // 生成道具（同样避开出生点）
    if(Math.random() > 0.5) {
        let powerUpX, powerUpY;
        let attempts = 0;
        do {
            powerUpX = Math.random() * (canvas.width - 30) + 15;
            powerUpY = Math.random() * (canvas.height - 30) + 15;
            attempts++;
        } while (
            Math.sqrt(Math.pow(powerUpX + 15 - playerSpawnX, 2) + 
                      Math.pow(powerUpY + 15 - playerSpawnY, 2)) < safeZoneRadius &&
            attempts < 100
        );
        
        const rand = Math.random();
        let type;
        if(rand < 0.4) {
            type = 'health';
        } else if(rand < 0.7) {
            type = 'power';
        } else {
            type = 'bulletSize';
        }
        
        powerUps.push({
            x: powerUpX,
            y: powerUpY,
            width: 30,
            height: 30,
            type: type
        });
    }
}

// 玩家射击
function playerShoot() {
    const now = Date.now();
    
    if(player.currentWeapon === 2) {
        // 近战攻击
        if(!player.isMeleeAttacking && now - player.lastFire > 400) {
            player.isMeleeAttacking = true;
            player.meleeAttackStart = now;
            player.lastFire = now;
            
            // 检测近战范围内的敌人
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            
            enemies.forEach((enemy, index) => {
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const distance = Math.sqrt(
                    Math.pow(enemyCenterX - playerCenterX, 2) +
                    Math.pow(enemyCenterY - playerCenterY, 2)
                );
                
                if(distance < player.meleeRange) {
                    enemy.health -= player.meleeDamage;
                    addHitEffect(enemyCenterX, enemyCenterY);
                    
                    if(enemy.health <= 0) {
                        enemies.splice(index, 1);
                        score += enemy.type === 'boss' ? 500 : 50;
                    }
                }
            });
        }
    } else if(player.currentWeapon === 1) {
        // 霰弹枪 - 攻击间隔变长
        if(now - player.lastFire > 1000) {
            const bulletWidth = 4 * player.bulletSize;
            const bulletHeight = 10 * player.bulletSize;
            const bulletSpeed = 8;
            const centerX = player.x + player.width / 2;
            const centerY = player.y;
            const angles = [-0.4, -0.2, 0, 0.2, 0.4]; // 散射角度
            
            angles.forEach(angle => {
                bullets.push({
                    x: centerX - bulletWidth / 2,
                    y: centerY,
                    width: bulletWidth,
                    height: bulletHeight,
                    speed: bulletSpeed,
                    directionX: Math.sin(angle),
                    directionY: -Math.cos(angle),
                    damage: 8
                });
            });
            
            player.lastFire = now;
        }
    } else if(now - player.lastFire > player.fireRate) {
        // 普通射击
        const bulletWidth = 4 * player.bulletSize;
        const bulletHeight = 10 * player.bulletSize;
        const bulletSpeed = 8;
        
        if(player.power === 1) {
            bullets.push({
                x: player.x + player.width / 2 - bulletWidth / 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
        } else if(player.power === 2) {
            bullets.push({
                x: player.x + player.width / 2 - bulletWidth - 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
            bullets.push({
                x: player.x + player.width / 2 + 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
        } else {
            bullets.push({
                x: player.x + player.width / 2 - bulletWidth * 1.5 - 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
            bullets.push({
                x: player.x + player.width / 2 - bulletWidth / 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
            bullets.push({
                x: player.x + player.width / 2 + bulletWidth / 2 + 2,
                y: player.y,
                width: bulletWidth,
                height: bulletHeight,
                speed: bulletSpeed,
                direction: 'up',
                damage: 20
            });
        }
        
        player.lastFire = now;
    }
}

// 障碍物碰撞检测
function checkObstacleCollision(obj) {
    for(let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        if(obj.x < obstacle.x + obstacle.width &&
           obj.x + obj.width > obstacle.x &&
           obj.y < obstacle.y + obstacle.height &&
           obj.y + obj.height > obstacle.y) {
            return true;
        }
    }
    return false;
}

// 敌人射击
function enemyShoot(enemy) {
    const now = Date.now();
    if(now - enemy.lastFire > enemy.fireRate) {
        if(enemy.type === 'boss') {
            // Boss攻击模式切换
            enemy.attackTimer++;
            
            // 每3秒切换一次攻击模式
            if(enemy.attackTimer % 180 === 0) {
                enemy.attackPattern = (enemy.attackPattern + 1) % 3;
            }
            
            // 攻击模式1：螺旋弹幕
            if(enemy.attackPattern === 0) {
                const spiralAngle = (enemy.attackTimer * 0.1) % (Math.PI * 2);
                for(let i = 0; i < 8; i++) {
                    const angle = spiralAngle + (i * Math.PI / 4);
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 4,
                        y: enemy.y + enemy.height / 2 - 4,
                        width: 8,
                        height: 8,
                        speed: 4,
                        directionX: Math.cos(angle),
                        directionY: Math.sin(angle),
                        damage: enemy.damage / 3,
                        boss: true
                    });
                }
            }
            // 攻击模式2：追踪玩家弹幕
            else if(enemy.attackPattern === 1) {
                const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const directionX = dx / distance;
                const directionY = dy / distance;
                
                // 发射3发追踪弹
                for(let i = -1; i <= 1; i++) {
                    const angleOffset = i * 0.2;
                    const currentAngle = Math.atan2(dy, dx) + angleOffset;
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 4,
                        y: enemy.y + enemy.height / 2 - 4,
                        width: 8,
                        height: 8,
                        speed: 5,
                        directionX: Math.cos(currentAngle),
                        directionY: Math.sin(currentAngle),
                        damage: enemy.damage / 2,
                        boss: true
                    });
                }
            }
            // 攻击模式3：环形弹幕
            else if(enemy.attackPattern === 2) {
                for(let i = 0; i < 16; i++) {
                    const angle = (i * Math.PI / 8) + (enemy.attackTimer * 0.05);
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 3,
                        y: enemy.y + enemy.height / 2 - 3,
                        width: 6,
                        height: 6,
                        speed: 3,
                        directionX: Math.cos(angle),
                        directionY: Math.sin(angle),
                        damage: enemy.damage / 4,
                        boss: true
                    });
                }
            }
            
            // 阶段2额外攻击：随机散射
            if(enemy.phase === 2 && enemy.attackTimer % 60 === 0) {
                for(let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI / 6) + Math.random() * 0.5;
                    enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 3,
                        y: enemy.y + enemy.height / 2 - 3,
                        width: 6,
                        height: 6,
                        speed: 6,
                        directionX: Math.cos(angle),
                        directionY: Math.sin(angle),
                        damage: enemy.damage / 3,
                        boss: true
                    });
                }
            }
        } else {
            // 只有远程敌人可以发射弹幕
            if(enemy.type === 'ranged') {
                // 计算敌人到玩家的方向
                const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 归一化方向向量
                const directionX = dx / distance;
                const directionY = dy / distance;
                
                // 远程敌人发射单发子弹，对准玩家
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 2,
                    y: enemy.y + enemy.height / 2 - 4,
                    width: 4,
                    height: 8,
                    speed: 5,
                    directionX: directionX,
                    directionY: directionY,
                    damage: enemy.damage
                });
            }
            // 近战敌人不发射弹幕，通过冲撞攻击
        }
        enemy.lastFire = now;
    }
}

// 碰撞检测
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// 更新游戏状态
function update() {
    if(gameOver) return;
    
    // 更新玩家位置
    if(!player.isDashing) {
        const originalX = player.x;
        const originalY = player.y;
        
        if(keys.up && player.y > 0) player.y -= player.speed;
        if(keys.down && player.y < canvas.height - player.height) player.y += player.speed;
        if(keys.left && player.x > 0) player.x -= player.speed;
        if(keys.right && player.x < canvas.width - player.width) player.x += player.speed;
        
        // 检测障碍物碰撞
        if(checkObstacleCollision(player)) {
            player.x = originalX;
            player.y = originalY;
        }
    }
    
    // 处理位移技能
    if(player.isDashing) {
        const now = Date.now();
        const elapsed = now - player.dashStart;
        
        if(elapsed < player.dashDuration) {
            // 位移中
            const progress = elapsed / player.dashDuration;
            const distance = player.dashDistance * easeOutQuad(progress);
            
            const newX = player.x + player.dashDirection.x * distance * (1/16);
            const newY = player.y + player.dashDirection.y * distance * (1/16);
            
            // 边界检测
            const boundedX = Math.max(0, Math.min(canvas.width - player.width, newX));
            const boundedY = Math.max(0, Math.min(canvas.height - player.height, newY));
            
            // 障碍物碰撞检测
            const tempPlayer = { x: boundedX, y: boundedY, width: player.width, height: player.height };
            if(!checkObstacleCollision(tempPlayer)) {
                player.x = boundedX;
                player.y = boundedY;
            } else {
                // 碰到障碍物，停止位移
                player.isDashing = false;
            }
        } else {
            player.isDashing = false;
        }
    }
    
    // 处理近战攻击状态
    if(player.isMeleeAttacking) {
        const now = Date.now();
        const elapsed = now - player.meleeAttackStart;
        
        if(elapsed > player.meleeAttackDuration) {
            player.isMeleeAttacking = false;
        }
    }
    
    // 处理无敌帧
    if(player.isInvincible) {
        const now = Date.now();
        if(now - player.invincibleStart > player.invincibleDuration) {
            player.isInvincible = false;
        }
    }
    
    // 检查玩家是否在安全区域内
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const distanceToCenter = Math.sqrt(
        Math.pow(playerCenterX - safeZone.x, 2) + 
        Math.pow(playerCenterY - safeZone.y, 2)
    );
    
    // 如果玩家离开安全区域，安全区域直接消失
    if(safeZone.active && distanceToCenter > safeZone.radius + player.width) {
        safeZone.active = false;
    }
    
    // 玩家射击（只有不在安全区域内时才能射击）
    if(keys.space && !safeZone.active) {
        playerShoot();
    }
    
    // 更新子弹
    bullets.forEach((bullet, index) => {
        const originalX = bullet.x;
        const originalY = bullet.y;
        
        if(bullet.directionX !== undefined && bullet.directionY !== undefined) {
            // 鼠标点击发射的子弹
            bullet.x += bullet.directionX * bullet.speed;
            bullet.y += bullet.directionY * bullet.speed;
        } else if(bullet.direction === 'up') {
            // 空格键发射的子弹
            bullet.y -= bullet.speed;
        }
        // 检查子弹是否出界或碰到障碍物
        if(bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height ||
           checkObstacleCollision(bullet)) {
            bullets.splice(index, 1);
        }
    });
    
    // 更新敌人子弹
    enemyBullets.forEach((bullet, index) => {
        if(bullet.directionX !== undefined && bullet.directionY !== undefined) {
            // Boss子弹
            bullet.x += bullet.directionX * bullet.speed;
            bullet.y += bullet.directionY * bullet.speed;
        } else if(bullet.direction === 'down') {
            // 普通敌人子弹
            bullet.y += bullet.speed;
        }
        // 检查子弹是否出界或碰到障碍物
        if(bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height ||
           checkObstacleCollision(bullet)) {
            enemyBullets.splice(index, 1);
        }
    });
    
    // 更新受击特效
    hitEffects.forEach((effect, index) => {
        effect.x += effect.vx;
        effect.y += effect.vy;
        effect.life -= 0.04;
        effect.vx *= 0.95;
        effect.vy *= 0.95;
        
        if(effect.life <= 0) {
            hitEffects.splice(index, 1);
        }
    });
    
    // 更新敌人
    enemies.forEach((enemy, enemyIndex) => {
        const originalX = enemy.x;
        const originalY = enemy.y;
        
        if(enemy.type === 'boss') {
            // Boss特殊行为
            // 阶段变化
            if(enemy.health < enemy.maxHealth * 0.5 && enemy.phase === 1) {
                enemy.phase = 2;
                enemy.speed += 0.5;
                enemy.fireRate *= 0.8;
            }
            
            // Boss移动模式：左右移动并向玩家方向靠近
            if(enemy.x < 50 || enemy.x > canvas.width - enemy.width - 50) {
                enemy.speed = -enemy.speed;
            }
            enemy.x += enemy.speed;
            
            if(enemy.y < canvas.height / 2) {
                enemy.y += enemy.speed * 0.3;
            }
        } else {
            // 普通敌人移动
            if(enemy.type === 'melee') {
                // 近战敌人逻辑
                if(enemy.chargeCooldown > 0) {
                    enemy.chargeCooldown--;
                }
                
                // 计算与玩家的距离
                const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if(enemy.isCharging) {
                    // 冲撞状态：快速移动
                    enemy.x += enemy.chargeDirection.x * enemy.chargeSpeed;
                    enemy.y += enemy.chargeDirection.y * enemy.chargeSpeed;
                    
                    // 检查是否撞墙或冲撞时间过长
                    if(enemy.x < 0 || enemy.x > canvas.width - enemy.width || 
                       enemy.y < 0 || enemy.y > canvas.height - enemy.height) {
                        enemy.isCharging = false;
                        enemy.chargeCooldown = 60;
                    }
                } else if(distance < 200 && enemy.chargeCooldown === 0) {
                    // 距离玩家近且冷却完毕，开始冲撞
                    enemy.isCharging = true;
                    const chargeDx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                    const chargeDy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
                    const chargeDistance = Math.sqrt(chargeDx * chargeDx + chargeDy * chargeDy);
                    enemy.chargeDirection = {
                        x: chargeDx / chargeDistance,
                        y: chargeDy / chargeDistance
                    };
                } else {
                    // 正常追踪玩家
                    if(enemy.x < player.x) enemy.x += enemy.speed * 0.5;
                    if(enemy.x > player.x) enemy.x -= enemy.speed * 0.5;
                    if(enemy.y < player.y) enemy.y += enemy.speed * 0.5;
                    if(enemy.y > player.y) enemy.y -= enemy.speed * 0.5;
                }
            } else if(enemy.type === 'ranged') {
                // 远程敌人：保持距离，缓慢移动
                const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                const dy = player.y + player.height / 2 - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if(distance > 300) {
                    // 距离太远，靠近玩家
                    if(enemy.x < player.x) enemy.x += enemy.speed * 0.3;
                    if(enemy.x > player.x) enemy.x -= enemy.speed * 0.3;
                    if(enemy.y < player.y) enemy.y += enemy.speed * 0.3;
                    if(enemy.y > player.y) enemy.y -= enemy.speed * 0.3;
                } else if(distance < 150) {
                    // 距离太近，远离玩家
                    if(enemy.x < player.x) enemy.x -= enemy.speed * 0.3;
                    if(enemy.x > player.x) enemy.x += enemy.speed * 0.3;
                    if(enemy.y < player.y) enemy.y -= enemy.speed * 0.3;
                    if(enemy.y > player.y) enemy.y += enemy.speed * 0.3;
                }
            }
        }
        
        // 敌人移动后检测障碍物碰撞
        if(checkObstacleCollision(enemy)) {
            enemy.x = originalX;
            enemy.y = originalY;
            if(enemy.isCharging) {
                enemy.isCharging = false;
                enemy.chargeCooldown = 60;
            }
        }
        
        // 敌人射击
        enemyShoot(enemy);
        
        // 检测子弹碰撞
        bullets.forEach((bullet, bulletIndex) => {
            if(checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage || 20;
                bullets.splice(bulletIndex, 1);
                
                if(enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += enemy.type === 'boss' ? 500 : enemy.type === 'elite' ? 50 : 20;
                }
            }
        });
    });
    
    // 检测敌人子弹碰撞玩家（无敌时或在安全区内不受伤）
    enemyBullets.forEach((bullet, index) => {
        if(checkCollision(bullet, player) && !player.isInvincible && !safeZone.active) {
            let damage = bullet.damage || 10;
            // 使用3号武器时，伤害减少50%
            if(player.currentWeapon === 2) {
                damage = Math.floor(damage * 0.5);
            }
            player.health -= damage;
            triggerShake(8, 300);
            addHitEffect(player.x + player.width / 2, player.y + player.height / 2);
            enemyBullets.splice(index, 1);
        }
    });
    
    // 检测敌人碰撞玩家（无敌时或在安全区内不受伤）
    enemies.forEach(enemy => {
        const now = Date.now();
        // 检查是否在碰撞免疫时间内
        if(player.isCollisionImmune && now - player.collisionImmuneTime < 500) {
            return; // 跳过碰撞伤害
        }
        
        if(checkCollision(enemy, player) && !player.isInvincible && !safeZone.active) {
            let damage = enemy.damage || 5;
            // 使用3号武器时，伤害减少50%
            if(player.currentWeapon === 2) {
                damage = Math.floor(damage * 0.5);
            }
            player.health -= damage;
            triggerShake(10, 350);
            addHitEffect(player.x + player.width / 2, player.y + player.height / 2);
            
            // 获得0.5s碰撞伤害免疫
            player.isCollisionImmune = true;
            player.collisionImmuneTime = now;
        }
    });
    
    // 检查玩家生命值
    if(player.health <= 0) {
        gameOver = true;
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOver').innerHTML = '<h2>游戏结束</h2><p>最终分数: <span id="finalScore">' + score + '</span></p><button onclick="restartGame()">重新开始</button><button id="backToMenuBtn" onclick="backToLevelSelect()">返回关卡选择</button>';
        document.getElementById('gameOver').style.display = 'block';
    }
    
    // 检测道具碰撞
    powerUps.forEach((powerUp, index) => {
        if(checkCollision(powerUp, player)) {
            if(powerUp.type === 'health') {
                player.health = Math.min(100, player.health + 30);
            } else if(powerUp.type === 'power') {
                player.power = Math.min(3, player.power + 1);
            } else if(powerUp.type === 'bulletSize') {
                player.bulletSize = Math.min(2.5, player.bulletSize + 0.5);
            }
            powerUps.splice(index, 1);
        }
    });
    
    // 检查房间是否清理完毕
    if(enemies.length === 0) {
        currentRoom++;
        if(currentRoom < rooms.length) {
            // 重置玩家到安全区中心
            player.x = canvas.width / 2 - player.width / 2;
            player.y = canvas.height / 2 - player.height / 2;
            
            // 重置安全区，范围每关减小
            safeZone.x = canvas.width / 2;
            safeZone.y = canvas.height / 2;
            safeZone.radius = Math.max(40, 100 - currentRoom * 8);
            safeZone.active = true;
            
            // 重新生成障碍物
            obstacles = [];
            generateObstacles();
            
            // 生成敌人
            generateEnemies();
        } else {
            // 游戏胜利
            gameOver = true;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').innerHTML = '<h2>高二11班胜利!</h2><p>最终分数: <span id="finalScore">' + score + '</span></p><p>你成功完成了所有挑战!</p><button onclick="restartGame()">重新开始</button><button id="backToMenuBtn" onclick="backToLevelSelect()">返回关卡选择</button>';
            document.getElementById('gameOver').style.display = 'block';
        }
    }
}

// 绘制游戏
function draw() {
    // 应用屏幕震动
    ctx.save();
    if(shakeDuration > 0) {
        const elapsed = Date.now() - shakeStartTime;
        if(elapsed < shakeDuration) {
            const progress = elapsed / shakeDuration;
            const currentShake = shakeAmount * (1 - progress);
            ctx.translate(
                (Math.random() - 0.5) * currentShake,
                (Math.random() - 0.5) * currentShake
            );
        }
    }
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景：如果是教室关卡且背景图已加载，则绘制背景图
    const currentTheme = rooms[currentRoom]?.theme || '教室';
    if (currentTheme === '教室' && bgLoaded && classroomBg) {
        ctx.drawImage(classroomBg, 0, 0, canvas.width, canvas.height);
        // 添加半透明遮罩，使前景元素更清晰
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // 默认背景网格
        ctx.strokeStyle = 'rgba(26, 35, 126, 0.1)';
        ctx.lineWidth = 1;
        for(let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for(let i = 0; i < canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }
    
    // 绘制当前房间主题
    ctx.fillStyle = '#1a237e';
    ctx.font = '24px "Microsoft YaHei", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`高二11班 - ${rooms[currentRoom]?.theme || '教室'}`, canvas.width / 2, 40);
    
    // 绘制出生点安全区域
    if(safeZone.active) {
        ctx.beginPath();
        ctx.arc(safeZone.x, safeZone.y, safeZone.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制安全区域提示文字
        ctx.fillStyle = '#4CAF50';
        ctx.font = '16px "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('安全区域 - 离开后无法返回', safeZone.x, safeZone.y + safeZone.radius + 25);
    }
    
    // 绘制场景障碍物
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.type === 'wall' ? '#795548' : '#607D8B';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // 绘制玩家血条
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(20, 20, 200, 10);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(20, 20, (player.health / 100) * 200, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 200, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText(`生命值: ${Math.max(0, Math.round(player.health))}`, 120, 32);
    
    // 绘制玩家增益显示栏
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(20, 40, 200, 30);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 40, 200, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText(`威力等级: ${player.power}`, 120, 60);
    
    // 绘制玩家
    if(player.isInvincible) {
        // 无敌状态闪烁效果
        ctx.fillStyle = '#00bcd4';
        ctx.shadowColor = '#00bcd4';
        ctx.shadowBlur = 20;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // 绘制玩家眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width * 0.3, player.y + player.height * 0.3, 3, 0, Math.PI * 2);
    ctx.arc(player.x + player.width * 0.7, player.y + player.height * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
    // 绘制玩家嘴巴
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height * 0.7, 5, 0, Math.PI);
    ctx.stroke();
    
    // 绘制近战攻击效果
    if(player.isMeleeAttacking) {
        const now = Date.now();
        const elapsed = now - player.meleeAttackStart;
        const progress = elapsed / player.meleeAttackDuration;
        const alpha = 1 - progress;
        const size = player.meleeRange * (0.5 + progress * 0.5);
        
        ctx.strokeStyle = `rgba(255, 193, 7, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            size,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        
        ctx.fillStyle = `rgba(255, 193, 7, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // 绘制敌人
    enemies.forEach(enemy => {
        if(enemy.type === 'boss') {
            // Boss特殊绘制
            // 绘制boss身体
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 绘制boss发光效果
            ctx.shadowColor = '#FF5722';
            ctx.shadowBlur = 20;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.shadowBlur = 0;
            
            // 绘制boss眼睛
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.3, 6, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制boss嘴巴
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height * 0.7, 10, 0, Math.PI);
            ctx.stroke();
            
            // 绘制boss生命值条
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(enemy.x - 20, enemy.y - 20, enemy.width + 40, 10);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(enemy.x - 20, enemy.y - 20, (enemy.health / enemy.maxHealth) * (enemy.width + 40), 10);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(enemy.x - 20, enemy.y - 20, enemy.width + 40, 10);
            
            // 绘制boss名称
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name, enemy.x + enemy.width / 2, enemy.y - 25);
            
            // 绘制boss阶段
            ctx.fillStyle = '#FFEB3B';
            ctx.font = '14px "Microsoft YaHei", Arial, sans-serif';
            ctx.fillText(`阶段: ${enemy.phase}`, enemy.x + enemy.width / 2, enemy.y + enemy.height + 20);
            
            // 绘制当前攻击模式
            const attackPatterns = ['螺旋弹幕', '追踪弹幕', '环形弹幕'];
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Microsoft YaHei", Arial, sans-serif';
            ctx.fillText(`攻击: ${attackPatterns[enemy.attackPattern]}`, enemy.x + enemy.width / 2, enemy.y + enemy.height + 35);
        } else {
            // 普通敌人绘制
            // 根据类型设置颜色
            if(enemy.type === 'melee') {
                // 近战敌人 - 红色系
                ctx.fillStyle = '#FF5722';
                if(enemy.isCharging) {
                    // 冲撞时发光
                    ctx.shadowColor = '#FF5722';
                    ctx.shadowBlur = 15;
                }
            } else if(enemy.type === 'ranged') {
                // 远程敌人 - 蓝色系
                ctx.fillStyle = '#2196F3';
            } else {
                // 默认颜色
                ctx.fillStyle = '#9C27B0';
            }
            
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.shadowBlur = 0;
            
            // 绘制敌人眼睛
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.3, 4, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制敌人嘴巴
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if(enemy.type === 'melee') {
                // 近战敌人嘴巴更大更凶
                ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height * 0.7, 8, 0, Math.PI);
            } else {
                ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height * 0.7, 6, 0, Math.PI);
            }
            ctx.stroke();
            
            // 绘制敌人生命值
            ctx.fillStyle = '#FF5722';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(enemy.x, enemy.y - 10, (enemy.health / enemy.maxHealth) * enemy.width, 5);
            
            // 绘制敌人名称
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name, enemy.x + enemy.width / 2, enemy.y - 15);
        }
    });
    
    // 绘制道具
    powerUps.forEach(powerUp => {
        if(powerUp.type === 'health') {
            ctx.fillStyle = '#4CAF50';
        } else if(powerUp.type === 'power') {
            ctx.fillStyle = '#FF9800';
        } else {
            ctx.fillStyle = '#9C27B0';
        }
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制道具图标
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '?';
        if(powerUp.type === 'health') icon = '+';
        else if(powerUp.type === 'power') icon = 'P';
        else if(powerUp.type === 'bulletSize') icon = '●';
        ctx.fillText(icon, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
    });
    
    // 绘制子弹（黄色）
    ctx.fillStyle = '#FFD700';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // 绘制敌人子弹
    ctx.fillStyle = '#FF5722';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // 更新UI
    document.getElementById('health').textContent = player.health;
    document.getElementById('score').textContent = score;
    document.getElementById('room').textContent = currentRoom + 1;
    document.getElementById('currentWeapon').textContent = player.weaponNames[player.currentWeapon];
    
    // 更新位移技能冷却显示
    const now = Date.now();
    const dashRemaining = player.dashCooldown - (now - player.lastDash);
    if(dashRemaining > 0) {
        document.getElementById('dashCooldown').textContent = `${(dashRemaining / 1000).toFixed(1)}s`;
    } else {
        document.getElementById('dashCooldown').textContent = '就绪';
    }
    
    // 绘制受击特效
    hitEffects.forEach(effect => {
        ctx.fillStyle = `rgba(255, 100, 100, ${effect.life})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.size * effect.life, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 恢复画布状态
    ctx.restore();
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 处理鼠标点击
function handleMouseClick(e) {
    if(safeZone.active) return;
    
    if(player.currentWeapon === 2) {
        // 近战攻击
        const now = Date.now();
        if(!player.isMeleeAttacking && now - player.lastFire > 400) {
            player.isMeleeAttacking = true;
            player.meleeAttackStart = now;
            player.lastFire = now;
            
            // 检测近战范围内的敌人
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            
            enemies.forEach((enemy, index) => {
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const distance = Math.sqrt(
                    Math.pow(enemyCenterX - playerCenterX, 2) +
                    Math.pow(enemyCenterY - playerCenterY, 2)
                );
                
                if(distance < player.meleeRange) {
                    enemy.health -= player.meleeDamage;
                    addHitEffect(enemyCenterX, enemyCenterY);
                    
                    if(enemy.health <= 0) {
                        enemies.splice(index, 1);
                        score += enemy.type === 'boss' ? 500 : 50;
                    }
                }
            });
        }
    } else {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算射击方向
        const dx = mouseX - (player.x + player.width / 2);
        const dy = mouseY - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 归一化方向向量
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        // 发射子弹
        const now = Date.now();
        if(now - player.lastFire > player.fireRate) {
            const bulletSize = 4 * player.bulletSize;
            
            if(player.currentWeapon === 0) {
                // 普通射击
                if(player.power === 1) {
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: directionX,
                        directionY: directionY
                    });
                } else if(player.power === 2) {
                    // 发射两发子弹，稍微分散
                    const angle1 = Math.atan2(dy, dx) - 0.1;
                    const angle2 = Math.atan2(dy, dx) + 0.1;
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle1),
                        directionY: Math.sin(angle1)
                    });
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle2),
                        directionY: Math.sin(angle2)
                    });
                } else {
                    // 发射三发子弹，呈扇形
                    const angle1 = Math.atan2(dy, dx) - 0.2;
                    const angle2 = Math.atan2(dy, dx);
                    const angle3 = Math.atan2(dy, dx) + 0.2;
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle1),
                        directionY: Math.sin(angle1)
                    });
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle2),
                        directionY: Math.sin(angle2)
                    });
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle3),
                        directionY: Math.sin(angle3)
                    });
                }
            } else if(player.currentWeapon === 1) {
                // 霰弹枪
                const baseAngle = Math.atan2(dy, dx);
                const angles = [-0.3, -0.15, 0, 0.15, 0.3];
                
                angles.forEach(offset => {
                    const angle = baseAngle + offset;
                    bullets.push({
                        x: player.x + player.width / 2 - bulletSize / 2,
                        y: player.y + player.height / 2 - bulletSize / 2,
                        width: bulletSize,
                        height: bulletSize,
                        speed: 8,
                        directionX: Math.cos(angle),
                        directionY: Math.sin(angle)
                    });
                });
            }
            
            player.lastFire = now;
        }
    }
}

// 鼠标右键触发位移技能
function handleRightClick(e) {
    e.preventDefault(); // 阻止右键菜单
    
    const now = Date.now();
    
    // 检查冷却时间
    if(now - player.lastDash > player.dashCooldown) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算位移方向（从玩家指向鼠标）
        const dx = mouseX - (player.x + player.width / 2);
        const dy = mouseY - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if(distance > 0) {
            // 归一化方向向量
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            // 开始位移
            player.isDashing = true;
            player.dashStart = now;
            player.dashDirection = { x: directionX, y: directionY };
            player.lastDash = now;
            
            // 激活无敌帧
            player.isInvincible = true;
            player.invincibleStart = now;
        }
    }
}

// 重新开始游戏
function restartGame() {
    gameOver = false;
    score = 0;
    currentRoom = selectedLevel;
    player.health = 100;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.power = 1;
    player.currentWeapon = 0;
    player.bulletSize = 1;
    player.isMeleeAttacking = false;
    player.meleeDamage = 50; // 确保重置近战伤害
    player.isCollisionImmune = false;
    player.collisionImmuneTime = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerUps = [];
    obstacles = [];
    hitEffects = [];
    
    // 重置安全区
    safeZone.x = canvas.width / 2;
    safeZone.y = canvas.height / 2;
    safeZone.radius = 100;
    safeZone.active = true;
    
    generateObstacles();
    generateEnemies();
    
    document.getElementById('gameOver').style.display = 'none';
}

// 初始化关卡选择界面
function initLevelSelect() {
    // 提前获取canvas元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 绑定事件监听（确保一开始就绑定）
    bindEventListeners();
    
    generateRooms();
    
    const levelsContainer = document.getElementById('levelsContainer');
    const levelInfo = document.getElementById('levelInfo');
    
    rooms.forEach((room, index) => {
        const levelBtn = document.createElement('button');
        levelBtn.className = `level-btn ${getLevelClass(index)}`;
        levelBtn.innerHTML = `${index + 1}<div class="level-theme">${room.theme}</div>`;
        levelBtn.dataset.level = index;
        
        levelBtn.addEventListener('click', () => {
            // 移除所有选中状态
            document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('selected'));
            
            // 添加当前选中状态
            levelBtn.classList.add('selected');
            selectedLevel = index;
            
            // 显示关卡信息
            levelInfo.style.display = 'block';
            document.getElementById('selectedLevelName').textContent = `关卡 ${index + 1}`;
            document.getElementById('levelTheme').textContent = `主题: ${room.theme}`;
            document.getElementById('levelType').textContent = `类型: ${getLevelTypeName(index)}`;
            document.getElementById('levelEnemies').textContent = `敌人数量: ${room.enemies}`;
        });
        
        levelsContainer.appendChild(levelBtn);
    });
    
    // 默认选中第一关
    document.querySelector('.level-btn').click();
    
    // 开始游戏按钮事件
    document.getElementById('startGameBtn').addEventListener('click', startGameFromLevel);
}

// 获取关卡样式类
function getLevelClass(index) {
    if ((index + 1) % 5 === 0) {
        return 'boss';
    } else if (Math.random() > 0.7) {
        return 'elite';
    }
    return 'normal';
}

// 获取关卡类型名称
function getLevelTypeName(index) {
    if ((index + 1) % 5 === 0) {
        return 'BOSS战';
    } else if (Math.random() > 0.7) {
        return '精英挑战';
    }
    return '普通关卡';
}

// 从选择的关卡开始游戏
function startGameFromLevel() {
    // 隐藏关卡选择界面
    document.getElementById('levelSelect').style.display = 'none';
    
    // 显示游戏界面
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('gameUI').style.display = 'block';
    
    // 初始化游戏
    initGame(selectedLevel);
}

// 返回关卡选择界面
function backToLevelSelect() {
    // 隐藏游戏界面
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    // 显示关卡选择界面
    document.getElementById('levelSelect').style.display = 'block';
}

// 启动游戏 - 显示关卡选择界面
window.onload = initLevelSelect;