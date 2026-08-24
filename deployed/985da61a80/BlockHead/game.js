const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = 0.6;
const GROUND_Y = GAME_HEIGHT - 80;

class Player {
    constructor() {
        this.x = 100;
        this.y = GROUND_Y;
        this.width = 40;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = -14;
        this.isJumping = false;
        this.facingRight = true;
        this.health = 100; // 5颗心 × 20点/心
        this.maxHealth = 100;
        this.isDashing = false;
        this.dashSpeed = 20;
        this.dashDuration = 150;
        this.dashCooldown = 500;
        this.lastDashTime = 0;
        this.isInvincible = false;
        this.invincibleDuration = 500;
        this.lastHitTime = 0;
        this.color = '#e94560';
        this.bullets = [];
        this.shootCooldown = 300;
        this.lastShootTime = 0;
        this.bulletType = 'normal';
        this.aimUp = false;

        // 技能相关
        this.skillLasers = [];

        // 狂暴技能相关
        this.isRaging = false;
        this.rageEndTime = 0;
        this.lastRageAttackTime = 0;
        this.rageAttackCooldown = 250; // 0.25秒攻击间隔
        this.rageDamageMultiplier = 1.5; // 50%伤害加成
        this.rageHealMultiplier = 1.5; // 50%回血加成
        this.rageDuration = 5000; // 5秒狂暴时间
        this.rageHitPenalty = 2500; // 被击中减少2.5秒
        this.rageSlash = null; // 当前劈砍特效

        // 冰冻和减速效果
        this.isSlowed = false;
        this.isFrozen = false;
        this.slowEndTime = 0;
        this.freezeEndTime = 0;
        this.slowStacks = 0;
        this.originalSpeed = this.speed;
        this.originalShootCooldown = this.shootCooldown;
    }

    update(keys, currentTime, boss) {
        this.aimUp = keys['ArrowUp'];

        if (this.isDashing) {
            this.velocityX = this.facingRight ? this.dashSpeed : -this.dashSpeed;
            this.velocityY = 0;
        } else {
            this.velocityX = 0;
            if (keys['KeyA'] || keys['ArrowLeft']) {
                this.velocityX = -this.speed;
                this.facingRight = false;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                this.velocityX = this.speed;
                this.facingRight = true;
            }
            if (keys['KeyZ'] && !this.isJumping) {
                this.velocityY = this.jumpForce;
                this.isJumping = true;
            }
        }

        if (keys['KeyX']) {
            if (this.isRaging) {
                this.rageAttack(currentTime, boss);
            } else {
                this.shoot(currentTime, boss);
            }
        }

        this.updateRage(currentTime);
        this.updateRageSlash();
        this.updateSlowAndFreeze(currentTime);

        this.velocityY += GRAVITY;
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.y >= GROUND_Y) {
            this.y = GROUND_Y;
            this.velocityY = 0;
            this.isJumping = false;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;

        this.bullets = this.bullets.filter(bullet => {
            bullet.update(boss);
            return bullet.x > -50 && bullet.x < GAME_WIDTH + 50 && bullet.y > -50 && bullet.y < GAME_HEIGHT + 50;
        });
    }

    dash(currentTime) {
        if (currentTime - this.lastDashTime >= this.dashCooldown) {
            this.isDashing = true;
            this.isInvincible = true;
            this.lastDashTime = currentTime;
            setTimeout(() => {
                this.isDashing = false;
                this.isInvincible = false;
            }, this.dashDuration);
        }
    }

    toggleBulletType() {
        this.bulletType = this.bulletType === 'normal' ? 'homing' : 'normal';
    }

    useSkillOne(currentTime) {
        this.releaseHeavyBullet();
        this.takeDamage(10, currentTime);
    }

    useSkillTwo(currentTime) {
        this.releaseLaser();
        this.takeDamage(20, currentTime);
    }

    useSkillThree(currentTime) {
        this.isRaging = true;
        this.rageEndTime = currentTime + this.rageDuration;
        this.lastRageAttackTime = currentTime;
        this.takeDamage(30, currentTime); // 扣除30点血量
    }

    updateRage(currentTime) {
        if (this.isRaging) {
            if (currentTime >= this.rageEndTime) {
                this.isRaging = false;
            }
        }
    }

    rageAttack(currentTime, boss) {
        if (!this.isRaging) return;
        if (currentTime - this.lastRageAttackTime < this.rageAttackCooldown) return;

        this.lastRageAttackTime = currentTime;

        const attackRange = 80;
        const attackHitbox = {
            x: this.facingRight ? this.x + this.width : this.x - attackRange,
            y: this.y - this.height,
            width: attackRange,
            height: this.height
        };

        // 创建剑气特效（类似于空洞骑士的劈砍）
        this.rageSlash = {
            x: this.facingRight ? this.x + this.width : this.x,
            y: this.y - this.height / 2,
            width: attackRange,
            height: 40,
            direction: this.facingRight ? 1 : -1,
            life: 8,
            maxLife: 8,
            update: function () {
                this.x += this.direction * 6;
                this.life--;
            },
            draw: function (ctx) {
                ctx.save();

                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;

                // 发光效果
                ctx.shadowColor = '#e74c3c';
                ctx.shadowBlur = 20;

                // 绘制剑气主体（类似空洞骑士的弧形剑气）
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();

                const startX = this.x;
                const startY = this.y;
                const endX = this.x + this.direction * this.width;

                // 绘制弧形剑气
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(
                    startX + this.direction * this.width * 0.3,
                    startY - this.height * 0.5,
                    startX + this.direction * this.width * 0.6,
                    startY
                );
                ctx.quadraticCurveTo(
                    startX + this.direction * this.width * 0.8,
                    startY + this.height * 0.3,
                    startX + this.direction * this.width,
                    startY
                );
                ctx.lineTo(startX + this.direction * this.width * 0.8, startY + this.height * 0.4);
                ctx.lineTo(startX, startY + this.height * 0.2);
                ctx.closePath();
                ctx.fill();

                // 剑气边缘
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }
        };

        let hit = false;
        if (boss && checkCollision(attackHitbox, boss.getHitbox())) {
            const damage = Math.floor(20 * this.rageDamageMultiplier); // 基础伤害20，乘以1.5倍
            boss.takeDamage(damage);
            const healAmount = Math.floor(1 * this.rageHealMultiplier); // 基础回血1，乘以1.5倍
            this.heal(healAmount);
            hit = true;
        }

        return hit;
    }

    getRageRemainingTime(currentTime) {
        if (!this.isRaging) return 0;
        return Math.max(0, this.rageEndTime - currentTime);
    }

    updateRageSlash() {
        if (this.rageSlash) {
            this.rageSlash.update();
            if (this.rageSlash.life <= 0) {
                this.rageSlash = null;
            }
        }
    }

    drawRageSlash(ctx) {
        if (this.rageSlash) {
            this.rageSlash.draw(ctx);
        }
    }

    onHitDuringRage(currentTime) {
        if (this.isRaging) {
            this.rageEndTime -= this.rageHitPenalty;
            if (this.rageEndTime < currentTime) {
                this.isRaging = false;
            }
        }
    }

    applySlow(currentTime) {
        this.slowStacks++;
        this.isSlowed = true;
        this.slowEndTime = currentTime + 5000; // 5秒减速

        // 应用减速效果
        this.speed = this.originalSpeed * 0.5;
        this.shootCooldown = this.originalShootCooldown * 2;

        // 如果累计3层减速，触发冰冻
        if (this.slowStacks >= 3) {
            this.isFrozen = true;
            this.freezeEndTime = currentTime + 3000; // 3秒冰冻
            this.isSlowed = false;
            this.slowStacks = 0;
        }
    }

    updateSlowAndFreeze(currentTime) {
        // 处理冰冻效果
        if (this.isFrozen) {
            if (currentTime >= this.freezeEndTime) {
                this.isFrozen = false;
                // 恢复速度
                this.speed = this.originalSpeed;
                this.shootCooldown = this.originalShootCooldown;
            } else {
                // 冰冻时无法移动和攻击
                this.velocityX = 0;
                this.velocityY = 0;
                return;
            }
        }

        // 处理减速效果
        if (this.isSlowed) {
            if (currentTime >= this.slowEndTime) {
                this.isSlowed = false;
                this.slowStacks = 0;
                // 恢复速度
                this.speed = this.originalSpeed;
                this.shootCooldown = this.originalShootCooldown;
            }
        }
    }

    releaseHeavyBullet() {
        const bulletX = this.x + this.width / 2;
        const bulletY = this.y - this.height / 2;
        this.bullets.push(new HeavyBullet(bulletX, bulletY, this.facingRight));
    }

    releaseLaser() {
        const laserX = this.x + this.width / 2;
        const laserY = this.y - this.height / 2;
        this.skillLasers.push(new Laser(laserX, laserY, this.facingRight));
    }

    updateLasers(boss) {
        this.skillLasers = this.skillLasers.filter(laser => {
            laser.update(boss);
            return laser.active;
        });
    }

    drawLasers(ctx) {
        this.skillLasers.forEach(laser => laser.draw(ctx));
    }

    shoot(currentTime, boss) {
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            const bulletX = this.x + this.width / 2;
            const bulletY = this.y - this.height / 2;

            if (this.bulletType === 'homing') {
                this.bullets.push(new HomingBullet(bulletX, bulletY, this.facingRight, this.aimUp, boss));
            } else {
                this.bullets.push(new Bullet(bulletX, bulletY, this.facingRight, this.aimUp));
            }
            this.lastShootTime = currentTime;
        }
    }

    takeDamage(amount, currentTime) {
        if (this.isInvincible) return;
        if (currentTime - this.lastHitTime < this.invincibleDuration) return;

        this.health -= amount;
        this.lastHitTime = currentTime;
        if (this.health < 0) this.health = 0;

        this.onHitDuringRage(currentTime);
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    draw(ctx) {
        ctx.save();

        if (this.isInvincible || this.isDashing) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }

        // 狂暴状态红光特效
        if (this.isRaging) {
            const currentTime = Date.now();
            const remainingTime = this.getRageRemainingTime(currentTime);

            // 红光发光效果
            ctx.shadowColor = '#e74c3c';

            // 最后1秒闪烁提示
            if (remainingTime <= 1000) {
                const flashIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                ctx.shadowBlur = 30 + flashIntensity * 20;
                ctx.globalAlpha = 0.7 + flashIntensity * 0.3;
            } else {
                ctx.shadowBlur = 30;
            }
        }

        // 减速效果：蓝色色调
        if (this.isSlowed) {
            ctx.shadowColor = '#3498db';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.8;
        }

        // 冰冻效果：深蓝色色调和冰块纹理
        if (this.isFrozen) {
            ctx.shadowColor = '#2980b9';
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.6;
            // 添加冰块纹理效果
            ctx.fillStyle = '#87ceeb';
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y - this.height + 10, 5, 0, Math.PI * 2);
            ctx.arc(this.x + 30, this.y - this.height + 20, 8, 0, Math.PI * 2);
            ctx.arc(this.x + 25, this.y - this.height + 40, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y - this.height, this.width, this.height, 8);
        ctx.fill();

        // 狂暴状态下添加红色边缘
        if (this.isRaging) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        const eyeX = this.facingRight ? this.x + 25 : this.x + 10;
        ctx.beginPath();
        ctx.arc(eyeX, this.y - this.height + 20, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX + (this.facingRight ? 2 : -2), this.y - this.height + 20, 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.isDashing) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            for (let i = 1; i <= 3; i++) {
                const trailX = this.facingRight ? this.x - i * 15 : this.x + this.width + i * 15 - 10;
                ctx.globalAlpha = 0.3 - i * 0.1;
                ctx.beginPath();
                ctx.roundRect(trailX, this.y - this.height, this.width, this.height, 8);
                ctx.fill();
            }
        }

        ctx.restore();

        this.drawRageSlash(ctx);
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };
    }
}

class Bullet {
    constructor(x, y, facingRight, aimUp = false) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 8;
        this.speed = 18;
        this.facingRight = facingRight;
        this.aimUp = aimUp;

        if (aimUp) {
            this.velocityX = 0;
            this.velocityY = -this.speed;
        } else {
            this.velocityX = facingRight ? this.speed : -this.speed;
            this.velocityY = 0;
        }

        this.damage = 10;
        this.color = '#f39c12';
    }

    update(boss) {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - this.velocityX * 0.3, this.y - this.velocityY * 0.3, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class HeavyBullet {
    constructor(x, y, facingRight) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        this.speed = 12;
        this.facingRight = facingRight;
        this.velocityX = facingRight ? this.speed : -this.speed;
        this.velocityY = 0;
        this.damage = 80; // 普通子弹的8倍
        this.color = '#e74c3c';
    }

    update(boss) {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - this.velocityX * 0.3, this.y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class Laser {
    constructor(x, y, facingRight) {
        this.x = x;
        this.y = y;
        this.width = 800;
        this.height = 40;
        this.facingRight = facingRight;
        this.active = true;
        this.duration = 1000;
        this.startTime = Date.now();
        this.damagePerHit = 5;
        this.hitCooldown = 50;
        this.lastHitTime = 0;
    }

    update(boss) {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#f39c12';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 30;

        const startX = this.facingRight ? this.x : this.x - this.width;
        ctx.fillRect(startX, this.y - this.height / 2, this.width, this.height);

        // 添加渐变效果
        const gradient = ctx.createLinearGradient(startX, this.y, startX + this.width * (this.facingRight ? 1 : -1), this.y);
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(0.5, '#f1c40f');
        gradient.addColorStop(1, '#f39c12');
        ctx.fillStyle = gradient;
        ctx.fillRect(startX, this.y - this.height / 2, this.width, this.height);

        ctx.restore();
    }

    getHitbox() {
        const startX = this.facingRight ? this.x : this.x - this.width;
        return {
            x: startX,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class HomingBullet {
    constructor(x, y, facingRight, aimUp, target) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.speed = 8;
        this.turnSpeed = 0.15;
        this.damage = 3;
        this.color = '#2ecc71';
        this.target = target;

        if (aimUp) {
            this.velocityX = 0;
            this.velocityY = -this.speed;
        } else {
            this.velocityX = facingRight ? this.speed : -this.speed;
            this.velocityY = 0;
        }
    }

    update(boss) {
        if (boss && boss.health > 0) {
            const targetX = boss.x + boss.width / 2;
            const targetY = boss.y - boss.height / 2;

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const targetVX = (dx / dist) * this.speed;
                const targetVY = (dy / dist) * this.speed;

                this.velocityX += (targetVX - this.velocityX) * this.turnSpeed;
                this.velocityY += (targetVY - this.velocityY) * this.turnSpeed;

                const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                if (currentSpeed > this.speed) {
                    this.velocityX = (this.velocityX / currentSpeed) * this.speed;
                    this.velocityY = (this.velocityY / currentSpeed) * this.speed;
                }
            }
        }

        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class Boss {
    constructor(type = 0) {
        this.type = type;
        this.x = GAME_WIDTH - 200;
        this.y = GROUND_Y;
        this.width = 100;
        this.height = 120;
        this.health = 1000;
        this.maxHealth = 1000;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 3;
        this.attackCooldown = 3000;
        this.lastAttackTime = 0;
        this.currentAttack = null;
        this.attackPattern = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.projectiles = [];
        this.slashes = [];
        this.afterimages = [];
        this.facingRight = false;
        this.color = '#9b59b6';
        this.name = this.getBossName();
        this.lastChargeHitTime = 0;
        this.chargeHitCooldown = 500;
        this.isFlashing = false;
        this.flashStartTime = 0;
        this.flashDuration = 100;
        this.attackCount = 0;
        this.hasSummonedHeart = false;
        this.heart = null;
        this.heartLastAttackTime = 0;
        this.heartAttackCooldown = 5000;
        this.lastMoveTime = 0;
        this.moveCooldown = 2000;

        // 阶段相关
        this.currentPhase = 1;
        this.phase2Triggered = false;
        this.phase3Triggered = false;
    }

    getBossName() {
        const names = ['暗影骑士', '火焰恶魔', '冰霜巨人'];
        return names[this.type] || '未知Boss';
    }

    update(player, currentTime, timeScale = 1) {
        this.facingRight = player.x < this.x;

        // 心脏逻辑
        if (this.heart) {
            this.heart.update();
            if (this.heart.health <= 0) {
                this.heart = null;
            } else {
                // 每秒恢复1%血量
                if (currentTime % 1000 < 50) {
                    this.health = Math.min(this.health + this.maxHealth * 0.01, this.maxHealth);
                }
                // 心脏攻击
                if (currentTime - this.heartLastAttackTime >= this.heartAttackCooldown) {
                    this.heartAttack(player);
                    this.heartLastAttackTime = currentTime;
                }
            }
        }

        // 检查是否需要召唤心脏 - 只有暗影骑士会召唤心脏
        if (this.type === 0 && !this.hasSummonedHeart && this.health <= this.maxHealth * 0.3) {
            this.summonHeart();
            this.hasSummonedHeart = true;
        }

        // 检查阶段变化
        this.checkPhaseChanges();

        // 随机走动
        if (!this.isAttacking && currentTime - this.lastMoveTime >= this.moveCooldown) {
            if (this.type === 1) {
                // 火焰恶魔：小范围随机走动
                this.smallRandomMove();
            } else {
                // 其他Boss：正常随机走动
                this.randomMove();
            }
            this.lastMoveTime = currentTime;
        }

        if (!this.isAttacking && currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.chooseAttack(player, currentTime);
        }

        if (this.isAttacking) {
            this.executeAttack(player, currentTime);
        }

        this.projectiles = this.projectiles.filter(proj => {
            let shouldKeep = true;
            if (proj.update.length > 1) {
                shouldKeep = proj.update(timeScale, player);
            } else {
                proj.update(timeScale);
                // 默认保留规则
                shouldKeep = proj.x > -50 && proj.x < GAME_WIDTH + 50 && proj.y > -50 && proj.y < GAME_HEIGHT + 50;
            }
            return shouldKeep;
        });

        // 更新剑气特效
        this.slashes = this.slashes.filter(slash => {
            slash.update();
            return slash.life > 0;
        });

        // 更新残影效果
        this.afterimages = this.afterimages.filter(image => {
            image.opacity -= 0.1;
            return image.opacity > 0;
        });

        // 更新小恶魔
        if (this.minions) {
            this.minions = this.minions.filter(imp => {
                if (imp.health > 0) {
                    imp.update(timeScale);
                }
                return imp.health > 0;
            });
        }
    }

    chooseAttack(player, currentTime) {
        this.attackCount++;

        // 先创建残影
        this.createAfterimage(this.x, this.y);

        // 0.5秒后释放技能
        setTimeout(() => {
            if (!this.isAttacking) {
                // 根据Boss类型选择不同技能
                const attackIndex = this.attackCount % 3;

                switch (this.type) {
                    case 0: // 暗影骑士
                        this.currentAttack = this.getShadowKnightAttack(attackIndex);
                        break;
                    case 1: // 火焰恶魔
                        this.currentAttack = this.getFireDemonAttack(attackIndex);
                        break;
                    case 2: // 冰霜巨人
                        this.currentAttack = this.getIceGiantAttack(attackIndex);
                        break;
                }

                this.isAttacking = true;
                this.attackTimer = Date.now();
                this.lastAttackTime = Date.now();
            }
        }, 500);
    }

    getShadowKnightAttack(index) {
        const attacks = ['teleport_slam', 'teleport_slash', 'triple_bullet_barrage'];
        return attacks[index];
    }

    getFireDemonAttack(index) {
        const attacks = ['fire_breath', 'fire_rain', 'summon_imps'];
        return attacks[index];
    }

    getIceGiantAttack(index) {
        const attacks = ['ice_spike', 'ice_nova', 'blizzard'];
        return attacks[index];
    }

    executeAttack(player, currentTime) {
        const elapsed = currentTime - this.attackTimer;

        switch (this.currentAttack) {
            case 'teleport_slam':
                if (elapsed < 300) {
                    // 闪烁效果
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 350) {
                    // 清除闪烁
                    this.isFlashing = false;
                    // 记录当前位置作为残影
                    this.createAfterimage(this.x, this.y);
                    // 瞬移到玩家上方
                    this.x = player.x;
                    this.y = 150;
                    this.velocityY = 0;
                    // 在目标位置创建残影
                    this.createAfterimage(this.x, this.y);
                } else if (elapsed < 800) {
                    // 等待0.5秒
                } else if (elapsed < 1300) {
                    // 下砸
                    this.velocityY += GRAVITY * 2;
                    this.y += this.velocityY;
                }

                if (this.y >= GROUND_Y) {
                    this.y = GROUND_Y;
                    this.velocityY = 0;
                    // 释放三道冲击波
                    this.createShockwaves();
                    this.isAttacking = false;
                }
                break;

            case 'teleport_slash':
                if (elapsed < 300) {
                    // 闪烁效果
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 350) {
                    // 清除闪烁
                    this.isFlashing = false;
                    // 记录当前位置作为残影
                    this.createAfterimage(this.x, this.y);
                    // 瞬移到玩家背后
                    const direction = player.facingRight ? -1 : 1;
                    this.x = player.x + direction * (player.width + this.width / 2);
                    this.y = GROUND_Y;
                    // 在目标位置创建残影
                    this.createAfterimage(this.x, this.y);
                } else if (elapsed >= 300 && elapsed < 1000) {
                    // 释放三道斩击（近战攻击）
                    // 攻击检测由Game类处理
                    if (elapsed % 200 < 50) {
                        const slashCount = Math.floor((elapsed - 300) / 200);
                        if (slashCount < 3) {
                            this.createSlash(player);
                        }
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            case 'triple_bullet_barrage':
                if (elapsed < 300) {
                    // 闪烁效果
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 350) {
                    // 清除闪烁
                    this.isFlashing = false;
                    // 记录当前位置作为残影
                    this.createAfterimage(this.x, this.y);
                    // 瞬移到屏幕正上方中心位置
                    this.x = GAME_WIDTH / 2 - this.width / 2;
                    this.y = 150;
                    // 在目标位置创建残影
                    this.createAfterimage(this.x, this.y);
                } else if (elapsed < 3300) {
                    // 发射三次，每次间隔1秒
                    const shotIndex = Math.floor((elapsed - 300) / 1000);
                    if (shotIndex < 3 && (elapsed - 300) % 1000 < 100) {
                        this.createBulletBarrage(player);
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            // 火焰恶魔技能
            case 'fire_breath':
                if (elapsed < 200) {
                    this.isFlashing = true;
                } else if (elapsed >= 200 && elapsed < 1200) {
                    this.isFlashing = false;
                    // 发射火焰
                    if (elapsed % 50 < 10) {
                        this.createFireball(player);
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            case 'fire_rain':
                if (elapsed < 300) {
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 1500) {
                    this.isFlashing = false;
                    // 火焰雨
                    if (elapsed % 150 < 20) {
                        this.createFireRain();
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            case 'summon_imps':
                if (elapsed < 300) {
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 800) {
                    this.isFlashing = false;
                    // 召唤两只小恶魔
                    if (elapsed === 300) {
                        this.summonImps(player);
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            // 冰霜巨人技能
            case 'ice_spike':
                if (elapsed < 500) {
                    this.isFlashing = true;
                    // 预警效果：生成3组位置，每组3个冰刺位置
                    if (elapsed > 200) {
                        this.iceSpikePositions = [];
                        // 生成3组发射位置，每组3个冰刺
                        for (let wave = 0; wave < 3; wave++) {
                            const wavePositions = [];
                            for (let i = 0; i < 3; i++) {
                                const warningX = Math.random() * (GAME_WIDTH - 60) + 30;
                                const warningY = GROUND_Y - 20;
                                wavePositions.push({ x: warningX, y: warningY });
                                this.projectiles.push({
                                    x: warningX,
                                    y: warningY,
                                    radius: 20,
                                    color: 'rgba(52, 152, 219, 0.3)',
                                    life: 60, // 约1秒（60帧）后消失
                                    startTime: Date.now(),
                                    duration: 1000, // 1秒
                                    update: function () {
                                        this.life--;
                                        // 1秒后强制消失
                                        if (Date.now() - this.startTime >= this.duration) {
                                            this.life = 0;
                                        }
                                    },
                                    draw: function (ctx) {
                                        ctx.save();
                                        const elapsed = Date.now() - this.startTime;
                                        const alpha = elapsed < this.duration ? (this.life / 60) : 0;
                                        ctx.globalAlpha = alpha;
                                        ctx.fillStyle = this.color;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.restore();
                                    },
                                    getHitbox: function () {
                                        return { x: -100, y: -100, width: 0, height: 0 };
                                    }
                                });
                            }
                            this.iceSpikePositions.push(wavePositions);
                        }
                    }
                } else if (elapsed >= 500 && elapsed < 2500) {
                    this.isFlashing = false;
                    // 每隔600秒发射一组冰刺，共3组
                    const waveIndex = Math.floor((elapsed - 500) / 600);
                    if (waveIndex < 3 && (elapsed - 500) % 600 < 50) {
                        // 发射对应组的3个冰刺
                        if (this.iceSpikePositions && this.iceSpikePositions[waveIndex]) {
                            this.iceSpikePositions[waveIndex].forEach(pos => {
                                const spawnX = pos.x;
                                const spawnY = GROUND_Y + 10;

                                this.projectiles.push({
                                    x: spawnX,
                                    y: spawnY,
                                    velocityX: 0,
                                    velocityY: -8, // 向上发射
                                    width: 15,
                                    height: 30,
                                    damage: 15,
                                    color: '#3498db',
                                    life: 60,
                                    update: function (timeScale) {
                                        this.y += this.velocityY * timeScale;
                                        this.life--;

                                        // 到达顶点后开始下落
                                        if (this.life < 40) {
                                            this.velocityY += 0.2 * timeScale;
                                        }
                                    },
                                    draw: function (ctx) {
                                        ctx.save();
                                        ctx.fillStyle = this.color;
                                        ctx.shadowColor = this.color;
                                        ctx.shadowBlur = 15;

                                        ctx.beginPath();
                                        ctx.moveTo(this.x, this.y - this.height / 2);
                                        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                                        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
                                        ctx.closePath();
                                        ctx.fill();

                                        ctx.fillStyle = '#87ceeb';
                                        ctx.beginPath();
                                        ctx.moveTo(this.x, this.y - this.height / 3);
                                        ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
                                        ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
                                        ctx.closePath();
                                        ctx.fill();
                                        ctx.restore();
                                    },
                                    getHitbox: function () {
                                        return {
                                            x: this.x - this.width / 2,
                                            y: this.y - this.height / 2,
                                            width: this.width,
                                            height: this.height
                                        };
                                    }
                                });
                            });
                        }
                    }
                } else {
                    this.isAttacking = false;
                    this.iceSpikePositions = null; // 清理位置记录
                }
                break;

            case 'ice_nova':
                if (elapsed < 400) {
                    this.isFlashing = true;
                } else if (elapsed >= 400 && elapsed < 800) {
                    this.isFlashing = false;
                    // 冰爆
                    if (elapsed === 400) {
                        this.createIceNova();
                    }
                } else {
                    this.isAttacking = false;
                }
                break;

            case 'blizzard':
                if (elapsed < 300) {
                    this.isFlashing = true;
                } else if (elapsed >= 300 && elapsed < 2500) {
                    this.isFlashing = false;
                    // 暴风雪
                    if (elapsed % 80 < 20) {
                        this.createBlizzard(player);
                    }
                } else {
                    this.isAttacking = false;
                }
                break;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.isFlashing = true;
        this.flashStartTime = Date.now();
    }

    createShockwaves() {
        // 向左释放三道冲击波
        for (let i = 0; i < 3; i++) {
            this.projectiles.push(new BossProjectile(
                this.x + this.width / 2,
                this.y - this.height / 2,
                -8 - i * 2,
                0
            ));
        }
        // 向右释放三道冲击波
        for (let i = 0; i < 3; i++) {
            this.projectiles.push(new BossProjectile(
                this.x + this.width / 2,
                this.y - this.height / 2,
                8 + i * 2,
                0
            ));
        }
    }

    createSlash(player) {
        // 创建剑气特效（类似空洞骑士风格）
        // 计算攻击方向：如果Boss在玩家左边，应该向右攻击；如果在玩家右边，应该向左攻击
        const attackDirection = this.x < player.x ? 1 : -1;

        const slash = {
            x: this.x + this.width / 2,
            y: this.y - this.height / 2,
            width: 180,
            height: 60,
            direction: attackDirection,
            life: 15,
            opacity: 1,
            update: function () {
                this.x += this.direction * 8;
                this.life--;
                this.opacity = this.life / 15;
            },
            draw: function (ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity;

                // 绘制发光效果
                ctx.shadowColor = '#3498db';
                ctx.shadowBlur = 30;

                // 绘制剑气主体
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                // 尖锐的剑气形状
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.direction * this.width * 0.8, this.y - this.height * 0.6);
                ctx.lineTo(this.x + this.direction * this.width, this.y);
                ctx.lineTo(this.x + this.direction * this.width * 0.8, this.y + this.height * 0.6);
                ctx.closePath();
                ctx.fill();

                // 绘制剑气边缘
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.direction * this.width * 0.8, this.y - this.height * 0.6);
                ctx.lineTo(this.x + this.direction * this.width, this.y);
                ctx.lineTo(this.x + this.direction * this.width * 0.8, this.y + this.height * 0.6);
                ctx.closePath();
                ctx.stroke();

                ctx.restore();
            }
        };

        this.slashes.push(slash);
    }

    // 火焰恶魔技能
    createFireball(player) {
        const dx = player.x - this.x;
        const dy = (player.y - player.height / 2) - (this.y - this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 8;

        this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y - this.height / 2,
            velocityX: (dx / dist) * speed,
            velocityY: (dy / dist) * speed,
            radius: 15,
            damage: 15,
            color: '#e74c3c',
            update: function (timeScale) {
                this.x += this.velocityX * timeScale;
                this.y += this.velocityY * timeScale;
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x - 3, this.y - 3, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x - this.radius,
                    y: this.y - this.radius,
                    width: this.radius * 2,
                    height: this.radius * 2
                };
            }
        });
    }

    createFireRain() {
        const x = Math.random() * GAME_WIDTH;

        this.projectiles.push({
            x: x,
            y: -20,
            velocityX: 0,
            velocityY: 10,
            radius: 12,
            damage: 12,
            color: '#e74c3c',
            update: function (timeScale) {
                this.y += this.velocityY * timeScale;
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x - this.radius,
                    y: this.y - this.radius,
                    width: this.radius * 2,
                    height: this.radius * 2
                };
            }
        });
    }

    summonImps(player) {
        // 创建左边的小恶魔
        const leftImp = {
            x: -50,
            y: GROUND_Y - 60,
            width: 40,
            height: 50,
            health: 30,
            maxHealth: 30,
            speedX: 2,
            speedY: 0,
            attackCooldown: 3000,
            lastAttackTime: Date.now(),
            directionChangeTimer: 0,
            directionChangeInterval: 2000 + Math.random() * 2000,
            update: function (timeScale) {
                // 重力效果
                this.speedY += GRAVITY * 0.5 * timeScale;
                this.y += this.speedY * timeScale;

                // 落地检测
                if (this.y > GROUND_Y) {
                    this.y = GROUND_Y;
                    this.speedY = 0;
                    // 落地时可能改变方向
                    this.directionChangeTimer += timeScale * 1000;
                    if (this.directionChangeTimer >= this.directionChangeInterval) {
                        this.speedX = (Math.random() - 0.5) * 4; // 随机左右移动
                        this.directionChangeTimer = 0;
                        this.directionChangeInterval = 2000 + Math.random() * 2000;
                    }
                }

                // 水平移动
                this.x += this.speedX * timeScale;

                // 限制在屏幕内
                if (this.x < 0) {
                    this.x = 0;
                    this.speedX = Math.abs(this.speedX); // 反弹
                }
                if (this.x > GAME_WIDTH - this.width) {
                    this.x = GAME_WIDTH - this.width;
                    this.speedX = -Math.abs(this.speedX); // 反弹
                }
            },
            draw: function (ctx) {
                ctx.save();

                // 小恶魔形状
                ctx.fillStyle = '#8b4513';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y - this.height / 2, 15, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#8b4513';
                ctx.fillRect(this.x + 10, this.y - 20, 20, 30);

                // 翅膀
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y - 10);
                ctx.quadraticCurveTo(this.x - 5, this.y - 15, this.x + 10, this.y - 20);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(this.x + 30, this.y - 10);
                ctx.quadraticCurveTo(this.x + 45, this.y - 15, this.x + 30, this.y - 20);
                ctx.fill();

                // 眼睛
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + 18, this.y - 25, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 22, this.y - 25, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x + 18, this.y - 25, 1, 0, Math.PI * 2);
                ctx.arc(this.x + 22, this.y - 25, 1, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x,
                    y: this.y - this.height,
                    width: this.width,
                    height: this.height
                };
            },
            attack: function (player, projectiles) {
                if (Date.now() - this.lastAttackTime >= this.attackCooldown) {
                    this.lastAttackTime = Date.now();
                    const dx = player.x - this.x;
                    const dy = (player.y - player.height / 2) - (this.y - this.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const speed = 5;

                    projectiles.push({
                        x: this.x + this.width / 2,
                        y: this.y - this.height / 2,
                        velocityX: (dx / dist) * speed,
                        velocityY: (dy / dist) * speed,
                        radius: 6,
                        damage: 5,
                        color: '#e74c3c',
                        update: function (timeScale) {
                            this.x += this.velocityX * timeScale;
                            this.y += this.velocityY * timeScale;
                        },
                        draw: function (ctx) {
                            ctx.save();
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        },
                        getHitbox: function () {
                            return {
                                x: this.x - this.radius,
                                y: this.y - this.radius,
                                width: this.radius * 2,
                                height: this.radius * 2
                            };
                        }
                    });
                }
            }
        };

        // 创建右边的小恶魔
        const rightImp = {
            x: GAME_WIDTH + 50,
            y: GROUND_Y - 60,
            width: 40,
            height: 50,
            health: 30,
            maxHealth: 30,
            speedX: -2,
            speedY: 0,
            attackCooldown: 3000,
            lastAttackTime: Date.now(),
            directionChangeTimer: 0,
            directionChangeInterval: 2000 + Math.random() * 2000,
            update: function (timeScale) {
                // 重力效果
                this.speedY += GRAVITY * 0.5 * timeScale;
                this.y += this.speedY * timeScale;

                // 落地检测
                if (this.y > GROUND_Y) {
                    this.y = GROUND_Y;
                    this.speedY = 0;
                    // 落地时可能改变方向
                    this.directionChangeTimer += timeScale * 1000;
                    if (this.directionChangeTimer >= this.directionChangeInterval) {
                        this.speedX = (Math.random() - 0.5) * 4; // 随机左右移动
                        this.directionChangeTimer = 0;
                        this.directionChangeInterval = 2000 + Math.random() * 2000;
                    }
                }

                // 水平移动
                this.x += this.speedX * timeScale;

                // 限制在屏幕内
                if (this.x < 0) {
                    this.x = 0;
                    this.speedX = Math.abs(this.speedX); // 反弹
                }
                if (this.x > GAME_WIDTH - this.width) {
                    this.x = GAME_WIDTH - this.width;
                    this.speedX = -Math.abs(this.speedX); // 反弹
                }
            },
            draw: function (ctx) {
                ctx.save();

                // 小恶魔形状
                ctx.fillStyle = '#8b4513';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y - this.height / 2, 15, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#8b4513';
                ctx.fillRect(this.x + 10, this.y - 20, 20, 30);

                // 翅膀
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y - 10);
                ctx.quadraticCurveTo(this.x - 5, this.y - 15, this.x + 10, this.y - 20);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(this.x + 30, this.y - 10);
                ctx.quadraticCurveTo(this.x + 45, this.y - 15, this.x + 30, this.y - 20);
                ctx.fill();

                // 眼睛
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + 18, this.y - 25, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 22, this.y - 25, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x + 18, this.y - 25, 1, 0, Math.PI * 2);
                ctx.arc(this.x + 22, this.y - 25, 1, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x,
                    y: this.y - this.height,
                    width: this.width,
                    height: this.height
                };
            },
            attack: function (player, projectiles) {
                if (Date.now() - this.lastAttackTime >= this.attackCooldown) {
                    this.lastAttackTime = Date.now();
                    const dx = player.x - this.x;
                    const dy = (player.y - player.height / 2) - (this.y - this.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const speed = 5;

                    projectiles.push({
                        x: this.x + this.width / 2,
                        y: this.y - this.height / 2,
                        velocityX: (dx / dist) * speed,
                        velocityY: (dy / dist) * speed,
                        radius: 6,
                        damage: 5,
                        color: '#e74c3c',
                        update: function (timeScale) {
                            this.x += this.velocityX * timeScale;
                            this.y += this.velocityY * timeScale;
                        },
                        draw: function (ctx) {
                            ctx.save();
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        },
                        getHitbox: function () {
                            return {
                                x: this.x - this.radius,
                                y: this.y - this.radius,
                                width: this.radius * 2,
                                height: this.radius * 2
                            };
                        }
                    });
                }
            }
        };

        // 将小恶魔添加到Boss的子实体列表
        if (!this.minions) {
            this.minions = [];
        }
        this.minions.push(leftImp, rightImp);

        // 启动小恶魔的攻击循环
        const impAttackLoop = () => {
            if (this.minions && this.minions.length > 0) {
                this.minions.forEach(imp => {
                    if (imp.health > 0) {
                        imp.attack(player, this.projectiles);
                    }
                });
                setTimeout(impAttackLoop, 100);
            }
        };
        impAttackLoop();
    }

    // 冰霜巨人技能
    createIceSpike(player) {
        const dx = player.x - this.x;
        const dy = (player.y - player.height / 2) - (this.y - this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 6;

        this.projectiles.push({
            x: this.x + this.width / 2,
            y: this.y - this.height / 2,
            velocityX: (dx / dist) * speed,
            velocityY: (dy / dist) * speed,
            width: 12,
            height: 25,
            damage: 12,
            color: '#3498db',
            update: function (timeScale) {
                this.x += this.velocityX * timeScale;
                this.y += this.velocityY * timeScale;
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height / 2);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#87ceeb';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height / 3);
                ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
                ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x - this.width / 2,
                    y: this.y - this.height / 2,
                    width: this.width,
                    height: this.height
                };
            }
        });
    }

    createIceSpikeFromPlayer(player, index) {
        // 从玩家脚下生成冰刺，每次位置有微小偏移
        const offsetX = (index - 2) * 15; // 左右偏移
        const spawnX = player.x + player.width / 2 + offsetX;
        const spawnY = GROUND_Y + 10;

        this.projectiles.push({
            x: spawnX,
            y: spawnY,
            velocityX: 0,
            velocityY: -8, // 向上发射
            width: 15,
            height: 30,
            damage: 15,
            color: '#3498db',
            life: 60,
            update: function (timeScale) {
                this.y += this.velocityY * timeScale;
                this.life--;

                // 到达顶点后开始下落
                if (this.life < 40) {
                    this.velocityY += 0.2 * timeScale;
                }
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height / 2);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#87ceeb';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.height / 3);
                ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
                ctx.lineTo(this.x - this.width / 4, this.y + this.height / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x - this.width / 2,
                    y: this.y - this.height / 2,
                    width: this.width,
                    height: this.height
                };
            }
        });
    }

    createIceNova() {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 5;

            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y - this.height / 2,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                radius: 10,
                damage: 12,
                color: '#3498db',
                trackingTime: 3000, // 3秒追踪时间
                startTime: Date.now(),
                hasSwitchedToLinear: false,
                update: function (timeScale) {
                    const now = Date.now();

                    // 前3秒追踪玩家
                    if (!this.hasSwitchedToLinear && now - this.startTime < this.trackingTime) {
                        // 简单的追踪逻辑：向玩家当前位置移动
                        if (window.player) {
                            const dx = window.player.x + window.player.width / 2 - this.x;
                            const dy = (window.player.y - window.player.height / 2) - this.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist > 0) {
                                // 逐渐转向玩家
                                const turnSpeed = 0.05 * timeScale;
                                const targetVX = (dx / dist) * speed;
                                const targetVY = (dy / dist) * speed;

                                this.velocityX += (targetVX - this.velocityX) * turnSpeed;
                                this.velocityY += (targetVY - this.velocityY) * turnSpeed;

                                // 限制速度
                                const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                                if (currentSpeed > speed) {
                                    this.velocityX = (this.velocityX / currentSpeed) * speed;
                                    this.velocityY = (this.velocityY / currentSpeed) * speed;
                                }
                            }
                        }
                    } else {
                        this.hasSwitchedToLinear = true;
                        // 3秒后保持当前方向直线飞行
                    }

                    this.x += this.velocityX * timeScale;
                    this.y += this.velocityY * timeScale;
                },
                draw: function (ctx) {
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;

                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#87ceeb';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
                    ctx.fill();

                    // 追踪状态下显示额外的光效
                    if (!this.hasSwitchedToLinear) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(this.x - 2, this.y - 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                },
                getHitbox: function () {
                    return {
                        x: this.x - this.radius,
                        y: this.y - this.radius,
                        width: this.radius * 2,
                        height: this.radius * 2
                    };
                }
            });
        }
    }

    createBlizzard(player) {
        const x = Math.random() * GAME_WIDTH;

        this.projectiles.push({
            x: x,
            y: -10,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: 3 + Math.random() * 2,
            radius: 6,
            damage: 5,
            color: '#87ceeb',
            isSlowEffect: true,
            update: function (timeScale) {
                this.x += this.velocityX * timeScale;
                this.y += this.velocityY * timeScale;
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x - this.radius,
                    y: this.y - this.radius,
                    width: this.radius * 2,
                    height: this.radius * 2
                };
            }
        });
    }

    drawBossShape(ctx, x, y, width, height) {
        switch (this.type) {
            case 0: // 暗影骑士 - 尖顶骑士形状
                ctx.beginPath();
                ctx.moveTo(x + width / 2, y - height);
                ctx.lineTo(x + width, y - height * 0.3);
                ctx.lineTo(x + width * 0.8, y);
                ctx.lineTo(x + width * 0.2, y);
                ctx.lineTo(x, y - height * 0.3);
                ctx.closePath();
                ctx.fill();
                break;

            case 1: // 火焰恶魔 - 火焰形状
                ctx.beginPath();
                ctx.moveTo(x + width / 2, y - height);
                ctx.lineTo(x + width * 0.8, y - height * 0.6);
                ctx.lineTo(x + width, y - height * 0.3);
                ctx.lineTo(x + width * 0.7, y);
                ctx.lineTo(x + width * 0.3, y);
                ctx.lineTo(x, y - height * 0.3);
                ctx.lineTo(x + width * 0.2, y - height * 0.6);
                ctx.closePath();
                ctx.fill();

                // 添加火焰细节
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.moveTo(x + width / 2, y - height * 0.3);
                ctx.lineTo(x + width * 0.6, y - height * 0.5);
                ctx.lineTo(x + width * 0.55, y);
                ctx.lineTo(x + width * 0.45, y);
                ctx.lineTo(x + width * 0.4, y - height * 0.5);
                ctx.closePath();
                ctx.fill();
                break;

            case 2: // 冰霜巨人 - 冰块形状
                ctx.beginPath();
                ctx.moveTo(x + width * 0.3, y - height);
                ctx.lineTo(x + width * 0.7, y - height);
                ctx.lineTo(x + width, y - height * 0.5);
                ctx.lineTo(x + width * 0.8, y);
                ctx.lineTo(x + width * 0.2, y);
                ctx.lineTo(x, y - height * 0.5);
                ctx.closePath();
                ctx.fill();

                // 添加冰块细节
                ctx.fillStyle = '#87ceeb';
                ctx.beginPath();
                ctx.moveTo(x + width * 0.4, y - height * 0.3);
                ctx.lineTo(x + width * 0.6, y - height * 0.3);
                ctx.lineTo(x + width * 0.7, y - height * 0.7);
                ctx.lineTo(x + width * 0.5, y - height * 0.9);
                ctx.lineTo(x + width * 0.3, y - height * 0.7);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }

    drawBossFace(ctx) {
        const eyeOffsetX = this.facingRight ? -10 : 10;

        switch (this.type) {
            case 0: // 暗影骑士
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 15, this.y - this.height * 0.6, 10, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 15, this.y - this.height * 0.6, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 15, this.y - this.height * 0.6, 5, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 15, this.y - this.height * 0.6, 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 1: // 火焰恶魔
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 12, this.y - this.height * 0.55, 12, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 12, this.y - this.height * 0.55, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 12, this.y - this.height * 0.55, 6, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 12, this.y - this.height * 0.55, 6, 0, Math.PI * 2);
                ctx.fill();

                // 火焰眉毛
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2 + eyeOffsetX - 20, this.y - this.height * 0.7);
                ctx.lineTo(this.x + this.width / 2 + eyeOffsetX - 5, this.y - this.height * 0.65);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2 + eyeOffsetX + 20, this.y - this.height * 0.7);
                ctx.lineTo(this.x + this.width / 2 + eyeOffsetX + 5, this.y - this.height * 0.65);
                ctx.stroke();
                break;

            case 2: // 冰霜巨人
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 14, this.y - this.height * 0.55, 14, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 14, this.y - this.height * 0.55, 14, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2 + eyeOffsetX - 14, this.y - this.height * 0.55, 7, 0, Math.PI * 2);
                ctx.arc(this.x + this.width / 2 + eyeOffsetX + 14, this.y - this.height * 0.55, 7, 0, Math.PI * 2);
                ctx.fill();

                // 冰霜胡须
                ctx.strokeStyle = '#87ceeb';
                ctx.lineWidth = 2;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.width / 2 + i * 8, this.y - this.height * 0.4);
                    ctx.lineTo(this.x + this.width / 2 + i * 6, this.y - this.height * 0.1);
                    ctx.stroke();
                }
                break;
        }
    }

    createBulletBarrage(player) {
        const dx = player.x - this.x;
        const dy = (player.y - player.height / 2) - (this.y - this.height / 2);
        const angle = Math.atan2(dy, dx);

        // 发射5颗子弹，每颗之间夹角15度
        for (let i = -2; i <= 2; i++) {
            const currentAngle = angle + (i * Math.PI / 12); // 15度 = π/12
            const speed = 6;
            const projectile = new BossProjectile(
                this.x + this.width / 2,
                this.y - this.height / 2,
                Math.cos(currentAngle) * speed,
                Math.sin(currentAngle) * speed
            );
            // 暗影骑士的子弹改为紫色
            projectile.color = '#9b59b6';
            this.projectiles.push(projectile);
        }
    }

    randomMove() {
        // 记录当前位置作为残影
        this.createAfterimage(this.x, this.y);

        // 随机选择移动方向和距离
        const direction = Math.random() > 0.5 ? 1 : -1;
        const distance = Math.random() * 100 + 50;

        // 计算目标位置
        let targetX = this.x + direction * distance;

        // 确保不会移出屏幕
        targetX = Math.max(0, Math.min(targetX, GAME_WIDTH - this.width));

        // 移动到目标位置
        this.x = targetX;

        // 在目标位置创建残影
        this.createAfterimage(this.x, this.y);
    }

    createAfterimage(x, y) {
        this.afterimages.push({
            x: x,
            y: y,
            width: this.width,
            height: this.height,
            opacity: 0.7
        });
    }

    smallRandomMove() {
        // 记录当前位置作为残影
        this.createAfterimage(this.x, this.y);

        // 小范围随机移动（±50像素）
        const direction = Math.random() > 0.5 ? 1 : -1;
        const distance = Math.random() * 30 + 20; // 20-50像素

        // 计算目标位置
        let targetX = this.x + direction * distance;

        // 确保不会移出屏幕，且保持在初始位置的±100像素范围内
        const initialX = GAME_WIDTH - 200; // 初始位置
        targetX = Math.max(initialX - 100, Math.min(targetX, initialX + 100));
        targetX = Math.max(0, Math.min(targetX, GAME_WIDTH - this.width));

        // 移动到目标位置
        this.x = targetX;

        // 在目标位置创建残影
        this.createAfterimage(this.x, this.y);
    }

    summonHeart() {
        this.heart = {
            x: 500 - 25,
            y: 300,
            width: 50,
            height: 50,
            health: 50,
            maxHealth: 50,
            update: function () {
                // 心脏的更新逻辑
            },
            draw: function (ctx) {
                ctx.save();
                ctx.fillStyle = '#e74c3c';
                ctx.shadowColor = '#e74c3c';
                ctx.shadowBlur = 20;

                // 绘制心脏
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.bezierCurveTo(this.x + this.width, this.y + this.height / 3, this.x + this.width, this.y + this.height, this.x + this.width / 2, this.y + this.height * 0.75);
                ctx.bezierCurveTo(this.x, this.y + this.height, this.x, this.y + this.height / 3, this.x + this.width / 2, this.y);
                ctx.fill();

                // 绘制预警线
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(GAME_WIDTH / 2, GROUND_Y - 30);
                ctx.stroke();

                ctx.restore();
            },
            getHitbox: function () {
                return {
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height
                };
            }
        };
    }

    heartAttack(player) {
        // 心脏发射一串5发子弹
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.heart) {
                    const dx = player.x - this.heart.x;
                    const dy = (player.y - player.height / 2) - (this.heart.y + this.heart.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const speed = 5;
                    this.projectiles.push(new BossProjectile(
                        this.heart.x + this.heart.width / 2,
                        this.heart.y + this.heart.height / 2,
                        (dx / dist) * speed,
                        (dy / dist) * speed
                    ));
                }
            }, i * 100);
        }
    }

    checkPhaseChanges() {
        // 阶段2：60%血量
        if (this.health <= this.maxHealth * 0.6 && !this.phase2Triggered) {
            this.phase2Triggered = true;
            this.currentPhase = 2;
            this.enterPhase2();
        }

        // 阶段3：30%血量
        if (this.health <= this.maxHealth * 0.3 && !this.phase3Triggered) {
            this.phase3Triggered = true;
            this.currentPhase = 3;
            this.enterPhase3();
        }
    }

    enterPhase2() {
        switch (this.type) {
            case 1: // 火焰恶魔
                this.attackCooldown = 2000; // 攻击间隔缩短
                this.speed = 4; // 移动速度增加
                // 释放火焰爆炸
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const speed = 6;
                    this.projectiles.push({
                        x: this.x + this.width / 2,
                        y: this.y - this.height / 2,
                        velocityX: Math.cos(angle) * speed,
                        velocityY: Math.sin(angle) * speed,
                        radius: 10,
                        damage: 10,
                        color: '#e74c3c',
                        update: function (timeScale) {
                            this.x += this.velocityX * timeScale;
                            this.y += this.velocityY * timeScale;
                        },
                        draw: function (ctx) {
                            ctx.save();
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 15;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        },
                        getHitbox: function () {
                            return {
                                x: this.x - this.radius,
                                y: this.y - this.radius,
                                width: this.radius * 2,
                                height: this.radius * 2
                            };
                        }
                    });
                }
                break;

            case 2: // 冰霜巨人
                this.attackCooldown = 2200; // 攻击间隔缩短
                this.speed = 3.5; // 移动速度增加
                // 释放冰爆
                this.createIceNova();
                break;
        }
    }

    enterPhase3() {
        switch (this.type) {
            case 1: // 火焰恶魔
                this.attackCooldown = 1500; // 攻击间隔进一步缩短
                this.color = '#e74c3c'; // 颜色变深
                // 红圈膨胀效果：4个随机位置的红圈，3秒膨胀+2秒等待后爆炸
                const boss = this;

                // 添加屏幕震动方法
                if (!this.screenShake) {
                    this.screenShake = function (duration, intensity) {
                        const startTime = Date.now();
                        const originalX = this.x;
                        const originalY = this.y;

                        const shakeInterval = setInterval(() => {
                            const elapsed = Date.now() - startTime;
                            if (elapsed >= duration) {
                                clearInterval(shakeInterval);
                                this.x = originalX;
                                this.y = originalY;
                                return;
                            }

                            const offsetX = (Math.random() - 0.5) * intensity * 2;
                            const offsetY = (Math.random() - 0.5) * intensity * 2;
                            this.x = originalX + offsetX;
                            this.y = originalY + offsetY;
                        }, 50);
                    };
                }

                // 创建4个红圈预警
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        // 随机位置（屏幕内）
                        const randomX = Math.random() * (GAME_WIDTH - 100) + 50;
                        const randomY = Math.random() * (GROUND_Y - 100) + 50;
                        // 随机大小（100-200像素）
                        const randomSize = 100 + Math.random() * 100;

                        const warningCircle = {
                            x: randomX,
                            y: randomY,
                            radius: 0,
                            maxRadius: randomSize,
                            damage: 20,
                            color: '#e74c3c',
                            startTime: Date.now(),
                            expansionDuration: 3000, // 3秒膨胀时间
                            waitDuration: 2000, // 2秒等待时间
                            hasExploded: false,
                            explosionEffect: null,
                            update: function (timeScale, player) {
                                const elapsed = Date.now() - this.startTime;

                                if (!this.hasExploded) {
                                    // 第一阶段：3秒膨胀
                                    if (elapsed < this.expansionDuration) {
                                        const progress = elapsed / this.expansionDuration;
                                        this.radius = progress * this.maxRadius;
                                    }
                                    // 第二阶段：2秒等待
                                    else if (elapsed < this.expansionDuration + this.waitDuration) {
                                        // 保持最大半径
                                        this.radius = this.maxRadius;
                                    }
                                    // 第三阶段：爆炸
                                    else {
                                        this.hasExploded = true;
                                        // 检测玩家是否在爆炸范围内
                                        if (player) {
                                            const playerCenterX = player.x + player.width / 2;
                                            const playerCenterY = player.y - player.height / 2;
                                            const dx = playerCenterX - this.x;
                                            const dy = playerCenterY - this.y;
                                            const distance = Math.sqrt(dx * dx + dy * dy);

                                            if (distance <= this.maxRadius && !player.isInvincible) {
                                                player.takeDamage(this.damage, Date.now());
                                            }
                                        }

                                        // 添加爆炸特效
                                        this.explosionEffect = {
                                            x: this.x,
                                            y: this.y,
                                            radius: this.maxRadius,
                                            maxRadius: this.maxRadius * 1.5,
                                            life: 30,
                                            update: function () {
                                                this.radius += this.maxRadius * 0.02;
                                                this.life--;
                                            },
                                            draw: function (ctx) {
                                                ctx.save();
                                                const alpha = this.life / 30;
                                                ctx.globalAlpha = alpha * 0.6;
                                                ctx.fillStyle = '#ff6b6b';
                                                ctx.shadowColor = '#ff6b6b';
                                                ctx.shadowBlur = 30;
                                                ctx.beginPath();
                                                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                                ctx.fill();

                                                // 爆炸中心亮点
                                                ctx.globalAlpha = alpha;
                                                ctx.fillStyle = '#fff';
                                                ctx.beginPath();
                                                ctx.arc(this.x, this.y, this.radius * 0.2, 0, Math.PI * 2);
                                                ctx.fill();
                                                ctx.restore();
                                            }
                                        };

                                        // 屏幕震动
                                        boss.screenShake(500, 5); // 震动500ms，幅度5px
                                    }
                                }

                                // 更新爆炸特效
                                if (this.explosionEffect) {
                                    this.explosionEffect.update();
                                    if (this.explosionEffect.life <= 0) {
                                        this.explosionEffect = null;
                                    }
                                }

                                // 爆炸后特效消失后移除
                                return !this.hasExploded || this.explosionEffect !== null;
                            },
                            draw: function (ctx) {
                                ctx.save();
                                const elapsed = Date.now() - this.startTime;

                                if (!this.hasExploded) {
                                    if (elapsed < this.expansionDuration) {
                                        // 膨胀阶段：半透明红色边框 + 脉动
                                        const progress = elapsed / this.expansionDuration;
                                        ctx.strokeStyle = this.color;
                                        ctx.lineWidth = 4;
                                        ctx.globalAlpha = 0.6;
                                        ctx.shadowColor = this.color;
                                        ctx.shadowBlur = 20;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                        ctx.stroke();

                                        // 内部脉动效果
                                        const pulseAlpha = 0.2 + Math.sin(elapsed * 0.005) * 0.1;
                                        ctx.globalAlpha = pulseAlpha;
                                        ctx.fillStyle = this.color;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                        ctx.fill();
                                    } else {
                                        // 等待阶段：实心红圈，闪烁提示
                                        const flash = Math.sin(Date.now() * 0.01) > 0 ? 0.6 : 0.3;
                                        ctx.globalAlpha = flash;
                                        ctx.fillStyle = this.color;
                                        ctx.shadowColor = this.color;
                                        ctx.shadowBlur = 25;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                                        ctx.fill();
                                    }
                                }

                                // 绘制爆炸特效
                                if (this.explosionEffect) {
                                    this.explosionEffect.draw(ctx);
                                }

                                ctx.restore();
                            },
                            getHitbox: function () {
                                return { x: -100, y: -100, width: 0, height: 0 };
                            }
                        };

                        boss.projectiles.push(warningCircle);
                    }, i * 500); // 每个红圈间隔0.5秒出现
                }
                break;

            case 2: // 冰霜巨人
                this.attackCooldown = 1800; // 攻击间隔进一步缩短
                this.color = '#2980b9'; // 颜色变深
                // 冻结地面，产生减速区域
                this.projectiles.push({
                    x: 0,
                    y: GROUND_Y - 40,
                    width: GAME_WIDTH,
                    height: 40,
                    damage: 5,
                    color: 'rgba(52, 152, 219, 0.3)',
                    life: 3000,
                    startTime: Date.now(),
                    update: function (timeScale) {
                        if (Date.now() - this.startTime >= this.life) {
                            this.active = false;
                        }
                    },
                    draw: function (ctx) {
                        ctx.save();
                        const elapsed = Date.now() - this.startTime;
                        const alpha = elapsed < 1000 ? elapsed / 1000 : 1 - (elapsed - 1000) / 2000;
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                        ctx.restore();
                    },
                    getHitbox: function () {
                        return { x: this.x, y: this.y, width: this.width, height: this.height };
                    }
                });
                break;
        }
    }

    draw(ctx) {
        ctx.save();

        // 绘制残影
        this.afterimages.forEach(image => {
            ctx.globalAlpha = image.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            this.drawBossShape(ctx, image.x, image.y, image.width, image.height);
        });

        if (this.isFlashing) {
            const elapsed = Date.now() - this.flashStartTime;
            if (elapsed < this.flashDuration) {
                ctx.globalAlpha = 0.5 + Math.sin(elapsed * 0.1) * 0.5;
            } else {
                this.isFlashing = false;
            }
        }

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // 根据类型绘制不同的Boss模型
        this.drawBossShape(ctx, this.x, this.y, this.width, this.height);
        this.drawBossFace(ctx);

        if (this.isAttacking) {
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // 绘制心脏
        if (this.heart) {
            this.heart.draw(ctx);
        }

        // 绘制小恶魔
        if (this.minions) {
            this.minions.forEach(imp => {
                if (imp.health > 0) {
                    imp.draw(ctx);
                }
            });
        }

        this.projectiles.forEach(proj => proj.draw(ctx));

        // 绘制剑气特效
        this.slashes.forEach(slash => slash.draw(ctx));
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };
    }
}

class BossProjectile {
    constructor(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = 10;
        this.color = '#e74c3c';
    }

    update(timeScale = 1) {
        this.x += this.velocityX * timeScale;
        this.y += this.velocityY * timeScale;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

class Game {
    constructor(bossIndex = 0) {
        this.player = new Player();
        window.player = this.player; // 设置全局变量让冰弹可以访问
        this.boss = new Boss(bossIndex);
        this.keys = {};
        this.isRunning = true;
        this.gameState = 'playing';
        this.currentBossIndex = bossIndex;
        this.particles = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTime = 0;

        // 技能冷却相关
        this.skillCooldown = 1000;
        this.lastSkillTime = 0;

        // 背景相关
        this.stars = [];
        this.initStars();

        this.setupControls();
        this.gameLoop();
    }

    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GROUND_Y,
                size: Math.random() * 2 + 1,
                brightness: Math.random()
            });
        }
    }

    getBackgroundColors() {
        const colors = {
            0: { bg: '#1a1a2e', ground: '#16213e', stars: '#fff' },
            1: { bg: '#2c1810', ground: '#4a2c23', stars: '#ff6b35' },
            2: { bg: '#0a1628', ground: '#1a3a5c', stars: '#87ceeb' }
        };
        return colors[this.currentBossIndex] || colors[0];
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyC') {
                this.player.dash(Date.now());
            }
            if (e.code === 'Space') {
                this.player.toggleBulletType();
                e.preventDefault();
            }
            if (e.code === 'KeyV') {
                const currentTime = Date.now();
                if (currentTime - this.lastSkillTime >= this.skillCooldown) {
                    if (this.keys['ArrowUp']) {
                        // ↑+V 释放技能一（重型子弹）
                        this.player.useSkillOne(currentTime);
                    } else if (this.keys['ArrowDown']) {
                        // ↓+V 释放技能三（狂暴）
                        this.player.useSkillThree(currentTime);
                    } else {
                        // 直接按V释放技能二（激光）
                        this.player.useSkillTwo(currentTime);
                    }
                    this.lastSkillTime = currentTime;
                }
            }

            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        const currentTime = Date.now();
        const timeScale = 1;

        this.player.update(this.keys, currentTime, this.boss);
        this.boss.update(this.player, currentTime, timeScale);

        // 更新激光
        this.player.updateLasers(this.boss);

        // 检测激光对boss的伤害
        this.player.skillLasers.forEach(laser => {
            if (checkCollision(laser.getHitbox(), this.boss.getHitbox())) {
                const now = Date.now();
                if (now - laser.lastHitTime >= laser.hitCooldown) {
                    this.boss.takeDamage(laser.damagePerHit);
                    laser.lastHitTime = now;
                }
            }

            // 检测激光是否击中心脏
            if (this.boss.heart && checkCollision(laser.getHitbox(), this.boss.heart.getHitbox())) {
                const now = Date.now();
                if (now - laser.lastHitTime >= laser.hitCooldown) {
                    this.boss.heart.health -= laser.damagePerHit;
                    laser.lastHitTime = now;
                }
            }

            // 检测激光是否击中恶魔
            if (this.boss.minions) {
                this.boss.minions.forEach(imp => {
                    if (checkCollision(laser.getHitbox(), imp.getHitbox())) {
                        const now = Date.now();
                        if (now - laser.lastHitTime >= laser.hitCooldown) {
                            imp.health -= laser.damagePerHit;
                            laser.lastHitTime = now;
                        }
                    }
                });
            }
        });

        this.player.bullets.forEach(bullet => {
            if (checkCollision(bullet.getHitbox(), this.boss.getHitbox())) {
                this.boss.takeDamage(bullet.damage);
                // 击中boss回复1点血量
                this.player.heal(1);
                const particleX = bullet.x;
                const particleY = bullet.y;
                bullet.x = -1000;
                this.createParticles(particleX, particleY, '#f39c12', 5);
                this.shakeScreen(5, 100);
            }

            // 检测子弹是否击中心脏
            if (this.boss.heart && checkCollision(bullet.getHitbox(), this.boss.heart.getHitbox())) {
                this.boss.heart.health -= bullet.damage;
                const particleX = bullet.x;
                const particleY = bullet.y;
                bullet.x = -1000;
                this.createParticles(particleX, particleY, '#e74c3c', 5);
                this.shakeScreen(3, 50);
            }

            // 检测子弹是否击中恶魔
            if (this.boss.minions) {
                this.boss.minions.forEach(imp => {
                    if (checkCollision(bullet.getHitbox(), imp.getHitbox())) {
                        imp.health -= bullet.damage;
                        const particleX = bullet.x;
                        const particleY = bullet.y;
                        bullet.x = -1000;
                        this.createParticles(particleX, particleY, '#8b4513', 5);
                        this.shakeScreen(2, 30);
                    }
                });
            }
        });

        const playerHitbox = this.player.getHitbox();

        this.boss.projectiles.forEach(proj => {
            if (checkCollision(proj.getHitbox(), playerHitbox)) {
                this.player.takeDamage(proj.damage, currentTime);

                // 触发减速效果
                if (proj.isSlowEffect) {
                    this.player.applySlow(currentTime);
                }

                const particleX = this.player.x + this.player.width / 2;
                const particleY = this.player.y - this.player.height / 2;
                proj.x = -1000;
                this.createParticles(particleX, particleY, '#e94560', 8);
                this.shakeScreen(8, 200);
            }
        });

        if (this.boss.isAttacking && this.boss.currentAttack === 'charge') {
            if (checkCollision(playerHitbox, this.boss.getHitbox())) {
                if (currentTime - this.boss.lastChargeHitTime >= this.boss.chargeHitCooldown) {
                    this.player.takeDamage(10, currentTime);
                    this.boss.lastChargeHitTime = currentTime;
                    this.shakeScreen(8, 200);
                }
            }
        }

        // 检测Boss的近战攻击
        if (this.boss.isAttacking && this.boss.currentAttack === 'teleport_slash') {
            const slashHitbox = {
                x: this.boss.x,
                y: this.boss.y - this.boss.height,
                width: this.boss.width * 2,
                height: this.boss.height
            };
            if (checkCollision(playerHitbox, slashHitbox)) {
                this.player.takeDamage(15, currentTime);
                this.createParticles(this.player.x + this.player.width / 2, this.player.y - this.player.height / 2, '#e74c3c', 8);
                this.shakeScreen(5, 100);
            }
        }

        this.particles = this.particles.filter(p => {
            p.update();
            return p.life > 0;
        });

        this.updateUI();

        if (this.player.health <= 0) {
            this.gameState = 'gameover';
            document.getElementById('gameOver').style.display = 'block';
        }

        if (this.boss.health <= 0) {
            this.gameState = 'victory';
            document.getElementById('victory').style.display = 'block';
        }
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 30,
                update: function () {
                    this.x += this.velocityX;
                    this.y += this.velocityY;
                    this.life--;
                }
            });
        }
    }

    shakeScreen(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTime = Date.now();
    }

    updateUI() {
        // 更新红心显示
        const hearts = document.querySelectorAll('.heart');
        const healthPerHeart = this.player.maxHealth / hearts.length;
        hearts.forEach((heart, index) => {
            const healthThreshold = (index + 1) * healthPerHeart;
            const partialHealth = healthThreshold - healthPerHeart;
            const currentHealth = this.player.health;

            if (currentHealth >= healthThreshold) {
                heart.style.color = '#e74c3c';
                heart.style.textShadow = '0 0 10px #e74c3c';
            } else if (currentHealth > partialHealth) {
                // 显示半心
                heart.style.color = '#f39c12';
                heart.style.textShadow = '0 0 10px #f39c12';
            } else {
                heart.style.color = '#333';
                heart.style.textShadow = 'none';
            }
        });

        const bossHealthPercent = (this.boss.health / this.boss.maxHealth) * 100;
        document.getElementById('bossHealth').style.width = bossHealthPercent + '%';
        document.getElementById('bossName').textContent = this.boss.name;

        const currentTime = Date.now();
        const dashProgress = Math.min((currentTime - this.player.lastDashTime) / this.player.dashCooldown, 1);
        document.getElementById('dashCooldownFill').style.width = (dashProgress * 100) + '%';

        const bulletTypeText = this.player.bulletType === 'homing' ? '追踪弹' : '普通弹';
        const bulletTypeEl = document.getElementById('bulletType');
        if (bulletTypeEl) {
            bulletTypeEl.textContent = bulletTypeText;
            bulletTypeEl.style.color = this.player.bulletType === 'homing' ? '#2ecc71' : '#f39c12';
        }
    }

    draw() {
        ctx.save();

        if (this.shakeDuration > 0) {
            const elapsed = Date.now() - this.shakeTime;
            if (elapsed < this.shakeDuration) {
                const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
                const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
                ctx.translate(shakeX, shakeY);
            } else {
                this.shakeDuration = 0;
            }
        }

        const bgColors = this.getBackgroundColors();

        ctx.fillStyle = bgColors.bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 根据Boss类型绘制背景特效
        this.drawBackgroundEffects(ctx);

        ctx.fillStyle = bgColors.ground;
        ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

        // 根据Boss类型绘制地面特效
        this.drawGroundEffects(ctx);

        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(GAME_WIDTH, GROUND_Y);
        ctx.stroke();

        // 根据Boss类型绘制不同的背景粒子
        this.stars.forEach(star => {
            const twinkle = Math.sin(Date.now() * 0.002 + star.brightness * 10) * 0.3 + 0.7;
            ctx.fillStyle = bgColors.stars;
            ctx.globalAlpha = twinkle * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 更新并绘制背景粒子
        this.updateBackgroundParticles();
        this.drawBackgroundParticles(ctx);

        this.player.draw(ctx);
        this.boss.draw(ctx);

        // 绘制激光
        this.player.drawLasers(ctx);

        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        ctx.restore();
    }

    gameLoop() {
        if (this.isRunning) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    drawBackgroundEffects(ctx) {
        switch (this.currentBossIndex) {
            case 0: // 暗影骑士 - 紫色烟雾效果
                // 绘制一些漂浮的暗影粒子
                break;

            case 1: // 火焰恶魔 - 熔岩背景
                // 绘制熔岩纹理
                ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
                for (let i = 0; i < 5; i++) {
                    const x = (Date.now() * 0.1 + i * 200) % GAME_WIDTH;
                    const y = 200 + Math.sin(Date.now() * 0.001 + i) * 50;
                    ctx.beginPath();
                    ctx.arc(x, y, 30 + Math.sin(Date.now() * 0.002 + i) * 10, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 2: // 冰霜巨人 - 雪花背景
                // 绘制冰锥装饰
                ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
                for (let i = 0; i < 3; i++) {
                    const x = 50 + i * 300;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + 20, 100);
                    ctx.lineTo(x - 20, 100);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
        }
    }

    drawGroundEffects(ctx) {
        switch (this.currentBossIndex) {
            case 0: // 暗影骑士 - 暗色地面
                // 添加一些暗色岩石
                break;

            case 1: // 火焰恶魔 - 燃烧地面
                ctx.fillStyle = '#c0392b';
                for (let i = 0; i < 8; i++) {
                    const x = 50 + i * 120;
                    const width = 30 + Math.sin(Date.now() * 0.002 + i) * 10;
                    ctx.fillRect(x, GROUND_Y - 10, width, 10);
                }
                // 添加火焰效果
                ctx.fillStyle = '#e74c3c';
                for (let i = 0; i < 5; i++) {
                    const x = 80 + i * 150;
                    const height = 15 + Math.sin(Date.now() * 0.003 + i) * 5;
                    ctx.beginPath();
                    ctx.moveTo(x, GROUND_Y - 10);
                    ctx.lineTo(x + 5, GROUND_Y - 10 - height);
                    ctx.lineTo(x - 5, GROUND_Y - 10 - height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;

            case 2: // 冰霜巨人 - 冰雪地面
                ctx.fillStyle = '#87ceeb';
                for (let i = 0; i < 6; i++) {
                    const x = 60 + i * 140;
                    const height = 8 + Math.sin(i) * 3;
                    ctx.beginPath();
                    ctx.moveTo(x, GROUND_Y);
                    ctx.lineTo(x + 8, GROUND_Y - height);
                    ctx.lineTo(x - 8, GROUND_Y - height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
        }
    }

    updateBackgroundParticles() {
        // 根据Boss类型更新背景粒子
    }

    drawBackgroundParticles(ctx) {
        // 根据Boss类型绘制背景粒子
    }

    restart() {
        this.currentBossIndex = (this.currentBossIndex + 1) % 3;
        this.player = new Player();
        this.boss = new Boss(this.currentBossIndex);
        this.gameState = 'playing';
        this.particles = [];
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('victory').style.display = 'none';
    }
}

let game;

function restartGame() {
    game.restart();
}

function startGame(bossIndex) {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'none';
    game = new Game(bossIndex);
}

function showLevelSelect() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'block';
}

function showMainMenu() {
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
}

window.onload = () => {
    // 初始状态只显示主菜单，不自动开始游戏
};
