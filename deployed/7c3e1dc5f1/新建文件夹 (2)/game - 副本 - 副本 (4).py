import pygame
import random
import math

pygame.init()
WIDTH, HEIGHT = 1200, 800
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("元气骑士 - Roguelike版")

try:
    font_path = "C:/Windows/Fonts/simhei.ttf"
    chinese_font = pygame.font.Font(font_path, 20)
    chinese_font_large = pygame.font.Font(font_path, 36)
    chinese_font_small = pygame.font.Font(font_path, 24)
except:
    chinese_font = pygame.font.Font(None, 20)
    chinese_font_large = pygame.font.Font(None, 36)
    chinese_font_small = pygame.font.Font(None, 24)

clock = pygame.time.Clock()
FPS = 60

WHITE = (255,255,255)
RED = (255,60,60)
GREEN = (60,255,60)
BLUE = (60,120,255)
BLACK = (0,0,0)
GRAY = (40,40,40)
BROWN = (139,69,19)
YELLOW = (255,220,0)
PURPLE = (180,60,255)
CYAN = (60,255,255)
ORANGE = (255,140,0)

ROOM_W = 1100
ROOM_H = 750
ROOM_X = (WIDTH - ROOM_W) // 2
ROOM_Y = (HEIGHT - ROOM_H) // 2



class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        # 优化玩家形象为像素风格
        self.org_img = pygame.Surface((40, 40), pygame.SRCALPHA)
        # 绘制头部（黄色）
        pygame.draw.rect(self.org_img, (255, 200, 0), (10, 5, 20, 20))
        # 绘制面部
        pygame.draw.rect(self.org_img, (255, 255, 200), (12, 7, 16, 16))
        # 绘制眼睛
        pygame.draw.circle(self.org_img, (0, 0, 0), (17, 12), 2)
        pygame.draw.circle(self.org_img, (0, 0, 0), (23, 12), 2)
        # 绘制嘴巴
        pygame.draw.line(self.org_img, (0, 0, 0), (17, 17), (23, 17), 1)
        # 绘制腮红
        pygame.draw.circle(self.org_img, (255, 150, 150), (15, 15), 2)
        pygame.draw.circle(self.org_img, (255, 150, 150), (25, 15), 2)
        # 绘制身体（红色）
        pygame.draw.rect(self.org_img, (200, 0, 0), (10, 25, 20, 15))
        # 绘制手臂
        pygame.draw.rect(self.org_img, (255, 200, 0), (5, 25, 5, 10))
        pygame.draw.rect(self.org_img, (255, 200, 0), (30, 25, 5, 10))
        # 绘制腿部
        pygame.draw.rect(self.org_img, (0, 0, 200), (12, 35, 8, 5))
        pygame.draw.rect(self.org_img, (255, 200, 0), (20, 35, 8, 5))
        self.image = self.org_img
        self.rect = self.image.get_rect(center=(WIDTH//2, HEIGHT//2))
        self.speed = 5.5
        # 加速度系统 - 优化手感参数
        self.velocity_x = 0
        self.velocity_y = 0
        self.acceleration = 0.4  # 更快的加速响应
        self.friction = 0.18     # 更顺滑的减速
        self.move_animation_timer = 0  # 移动动画计时器
        self.max_hp = 100
        self.hp = self.max_hp
        self.max_mp = 100
        self.mp = self.max_mp
        self.mp_regen = 0.05  # 降低回蓝速度，避免魔力无限滥用
        self.max_shield = 100
        self.shield = self.max_shield
        self.invincible = False
        self.invincible_timer = 0
        self.stealth = False
        self.stealth_timer = 0
        self.damage_buff = False
        self.damage_buff_timer = 0
        self.damage_multiplier = 1.0
        self.speed_buff = False
        self.speed_buff_timer = 0
        self.speed_multiplier = 1.0
        self.weapons = ['手枪', '剑', '霰弹枪']
        self.attack_count = {}
        self.skills = ['翻滚', '守护者', '雷电', '冰封领域', '镜像', '时间减缓', '治疗领域', '影遁']
        self.current_weapon = 0
        self.current_skill = 0
        self.is_shooting_laser = False  # 是否正在发射持续激光
        self.last_skill_use = 0  # 技能冷却计时器
        self.in_boss_room = False  # 是否在BOSS房间内

        
        self.weapon_data = {
            '手枪': {'cooldown': 100, 'damage': 25, 'bullet_speed': 12, 'spread': 0, 'count': 1, 'mp_cost': 0, 'type': 'ranged', 'unique': 'reload', 'recoil': 0.4},
            '霰弹枪': {'cooldown': 450, 'damage': 20, 'bullet_speed': 10, 'spread': 0.4, 'count': 6, 'mp_cost': 4, 'type': 'ranged', 'unique': 'spread', 'recoil': 1.8},
            '剑': {'cooldown': 160, 'damage': 45, 'range': 150, 'mp_cost': 0, 'type': 'melee', 'unique': 'basic', 'recoil': 0.2},
            '圣剑': {'cooldown': 300, 'damage': 60, 'range': 160, 'mp_cost': 0, 'type': 'swing_charge', 'unique': 'golden_wave', 'recoil': 0.6},
            '黑骑士的剑': {'cooldown': 330, 'damage': 70, 'range': 150, 'mp_cost': 0, 'type': 'black_knight', 'unique': 'ground_sword', 'recoil': 0.8},
            '咖喱棒': {'cooldown': 260, 'damage': 45, 'range': 160, 'mp_cost': 0, 'type': 'curry_wave', 'unique': 'wave_attack', 'recoil': 0.5},
            '步枪': {'cooldown': 50, 'damage': 8, 'bullet_speed': 25, 'spread': 0.05, 'count': 1, 'mp_cost': 2, 'type': 'ranged', 'unique': 'rapid_fire', 'recoil': 0.2},
            '狙击枪': {'cooldown': 600, 'damage': 80, 'bullet_speed': 40, 'spread': 0, 'count': 1, 'mp_cost': 12, 'type': 'ranged', 'pierce': True, 'unique': 'high_damage', 'recoil': 2.0},
            '火箭炮': {'cooldown': 1200, 'damage': 150, 'bullet_speed': 6, 'spread': 0.15, 'count': 1, 'mp_cost': 30, 'type': 'ranged', 'explosion': True, 'unique': 'explosion', 'recoil': 3.0},
            '回旋镖': {'cooldown': 600, 'damage': 30, 'bullet_speed': 10, 'spread': 0, 'count': 1, 'mp_cost': 5, 'type': 'ranged', 'boomerang': True, 'unique': 'return', 'recoil': 0.3},
            '手里剑': {'cooldown': 160, 'damage': 18, 'bullet_speed': 18, 'spread': 0.5, 'count': 5, 'mp_cost': 4, 'type': 'ranged', 'unique': 'multi_projectile', 'recoil': 0.1},
            '冰锥': {'cooldown': 220, 'damage': 30, 'bullet_speed': 25, 'spread': 0, 'count': 1, 'mp_cost': 4, 'type': 'ranged', 'freeze': True, 'unique': 'freeze', 'recoil': 0.3},
            '火球': {'cooldown': 900, 'damage': 120, 'bullet_speed': 8, 'spread': 0, 'count': 1, 'mp_cost': 18, 'type': 'ranged', 'explosion': True, 'unique': 'burn', 'recoil': 1.0},
            '毒云': {'cooldown': 1200, 'damage': 45, 'bullet_speed': 5, 'spread': 0.25, 'count': 1, 'mp_cost': 15, 'type': 'ranged', 'poison_cloud': True, 'unique': 'poison', 'recoil': 0.4},
            '双枪': {'cooldown': 60, 'damage': 15, 'bullet_speed': 18, 'spread': 0.08, 'count': 2, 'mp_cost': 3, 'type': 'ranged', 'recoil': 0.3},
            '战斧': {'cooldown': 330, 'damage': 85, 'range': 140, 'mp_cost': 0, 'type': 'melee', 'unique': 'axe_swing', 'knockback': True, 'aoe': True, 'recoil': 1.2},
            '飞刀': {'cooldown': 100, 'damage': 22, 'bullet_speed': 22, 'spread': 0.15, 'count': 3, 'mp_cost': 3, 'type': 'ranged', 'pierce': True, 'unique': 'throwing_knife', 'pierce_count': 3, 'recoil': 0.1},
            '能量剑': {'cooldown': 180, 'damage': 55, 'range': 160, 'mp_cost': 0, 'type': 'melee', 'unique': 'energy_blade', 'energy_wave': True, 'wave_damage': 30, 'recoil': 0.5},
            '激光剑': {'cooldown': 140, 'damage': 45, 'range': 150, 'mp_cost': 0, 'type': 'melee', 'unique': 'laser_blade', 'laser_beam': True, 'beam_damage': 35, 'recoil': 0.4},
            '蓄力弓': {'cooldown': 600, 'damage': 35, 'bullet_speed': 25, 'spread': 0, 'count': 1, 'mp_cost': 6, 'type': 'bow_charge', 'unique': 'charge_bow', 'recoil': 0.8, 'max_charge': 3, 'chargeable': True},
            '瞬光刺': {'cooldown': 40, 'damage': 25, 'mp_cost': 0.2, 'type': 'laser_pierce', 'unique': 'pierce_laser', 'recoil': 0.1},  # 大幅降低蓝耗，加快攻速
            '炽焰流': {'cooldown': 0, 'damage': 12, 'mp_cost': 0.08, 'type': 'laser_continuous', 'unique': 'continuous_laser', 'recoil': 0.05},  # 极低蓝耗，支持持续输出
            '灭核裁决': {'cooldown': 800, 'damage': 60, 'mp_cost': 12, 'type': 'laser_charge', 'unique': 'nuclear_laser', 'max_charge': 3, 'chargeable': True, 'recoil': 2.5},  # 降低蓝耗，缩短冷却
            '链刃': {'cooldown': 420, 'damage': 60, 'range': 200, 'mp_cost': 0, 'type': 'melee', 'unique': 'chain_blade', 'grapple': True, 'pull_enemy': True, 'recoil': 0.6},
            '双节棍': {'cooldown': 100, 'damage': 25, 'range': 100, 'mp_cost': 0, 'type': 'melee', 'unique': 'nunchaku', 'hit_count': 3, 'angle_offset': 0.5, 'recoil': 0.15},
            '暗影刃': {'cooldown': 400, 'damage': 80, 'range': 180, 'mp_cost': 0, 'type': 'melee', 'unique': 'shadow_step', 'teleport_range': 180, 'recoil': 0.8}
        }
        
        self.skill_data = {
            '守护者': {
                'cooldown': 5000,
                'mp_cost': 50,
                'type': 'invincible',
                'duration': 5000,
                'description': '获得5秒无敌效果'
            },
            '雷电': {
                'cooldown': 1500,
                'mp_cost': 45,
                'type': 'lightning',
                'damage': 80,
                'range': 150,
                'chain_count': 3,
                'description': '召唤雷电打击敌人，可连锁'
            },
            '冰封领域': {
                'cooldown': 2500,
                'mp_cost': 40,
                'type': 'freeze_field',
                'damage': 15,
                'range': 200,
                'duration': 2000,
                'slow_factor': 0.3,
                'description': '创造冰封领域，减速并冻结敌人'
            },
            '镜像': {
                'cooldown': 6000,
                'mp_cost': 60,
                'type': 'clone',
                'clone_count': 5,
                'damage': 45,
                'duration': 10000,
                'speed': 2.5,
                'attack_range': 100,
                'description': '召唤镜像协助战斗，镜像会使用玩家武器攻击敌人'
            },
            '时间减缓': {
                'cooldown': 8000,
                'mp_cost': 70,
                'type': 'time_slow',
                'duration': 6000,
                'slow_factor': 0.3,
                'description': '减缓周围敌人的时间流速'
            },
            '治疗领域': {
                'cooldown': 3000,
                'mp_cost': 45,
                'type': 'heal_field',
                'heal_amount': 40,
                'range': 150,
                'duration': 2500,
                'tick_interval': 500,
                'description': '创造治疗领域，持续恢复生命'
            },
            '影遁': {
                'cooldown': 4000,
                'mp_cost': 60,
                'type': 'shadow_dash',
                'duration': 5000,
                'speed_bonus': 2.0,
                'damage_multiplier': 3.0,
                'buff_duration': 3000,
                'exit_speed_bonus': 1.3,
                'exit_speed_duration': 3000,
                'description': '进入隐身状态5秒，无敌且移动速度提升，破隐后3秒内伤害3倍且移速提升'
            },
            '翻滚': {
                'cooldown': 800,
                'mp_cost': 0,
                'type': 'roll',
                'distance': 150,
                'duration': 200,
                'description': '向鼠标方向翻滚一段距离，翻滚期间无敌'
            }
        }
        self.last_shot = 0
        self.charging = False
        self.charge_start = 0
        self.charge_weapon = None
        self.rainbow_laser_active = False
        self.rainbow_laser_angle = 0
        self.rainbow_laser_data = None
        self.rainbow_laser_timer = 0
        self.score = 0
        self.gold = 0
        self.attack_speed = 1.0  # 基础攻速
        self.attack_speed_bonus = 0.0  # 攻速加成
        self.shield_regen = 0.5  # 护盾每秒恢复量
        self.hurt_timer = 0  # 受伤红光效果计时器

    def take_damage(self, damage):
        if self.invincible:
            return
        if self.shield > 0:
            if self.shield >= damage:
                self.shield -= damage
                return
            else:
                damage -= self.shield
                self.shield = 0
        self.hp -= damage
        
        # 受伤红光效果
        self.hurt_timer = 15  # 15帧的受伤效果
        # 创建受伤粒子
        for i in range(8):
            angle = random.uniform(0, math.pi * 2)
            speed = random.uniform(3, 6)
            particle = Particle(
                self.rect.centerx,
                self.rect.centery,
                (255, 100, 100),
                random.uniform(2, 4),
                speed,
                random.randint(10, 20)
            )
            particles.add(particle)

    def update(self):
        keys = pygame.key.get_pressed()
        
        # 使用加速度系统
        target_vel_x = 0
        target_vel_y = 0
        
        if keys[pygame.K_w]: target_vel_y = -self.speed
        if keys[pygame.K_s]: target_vel_y = self.speed
        if keys[pygame.K_a]: target_vel_x = -self.speed
        if keys[pygame.K_d]: target_vel_x = self.speed

        # 斜向速度归一化 - 使用更精确的sqrt(2)/2
        if target_vel_x != 0 and target_vel_y != 0:
            target_vel_x *= 0.70710678118
            target_vel_y *= 0.70710678118

        # 应用加速度 - 添加平滑过渡
        self.velocity_x += (target_vel_x - self.velocity_x) * self.acceleration
        self.velocity_y += (target_vel_y - self.velocity_y) * self.acceleration

        # 如果没有输入，应用摩擦力减速 - 优化为指数衰减
        if target_vel_x == 0:
            self.velocity_x *= (1 - self.friction)
            # 速度很小时直接归零，避免抖动
            if abs(self.velocity_x) < 0.05:
                self.velocity_x = 0
        if target_vel_y == 0:
            self.velocity_y *= (1 - self.friction)
            if abs(self.velocity_y) < 0.05:
                self.velocity_y = 0

        # 限制速度
        max_vel = self.speed
        self.velocity_x = max(-max_vel, min(max_vel, self.velocity_x))
        self.velocity_y = max(-max_vel, min(max_vel, self.velocity_y))

        # 更新位置
        self.rect.x += self.velocity_x
        self.rect.y += self.velocity_y

        # 边界碰撞反馈
        hit_wall = False
        if self.rect.left < ROOM_X: 
            self.rect.left = ROOM_X
            self.velocity_x = -self.velocity_x * 0.3  # 轻微反弹
            hit_wall = True
        if self.rect.right > ROOM_X+ROOM_W: 
            self.rect.right = ROOM_X+ROOM_W
            self.velocity_x = -self.velocity_x * 0.3
            hit_wall = True
        if self.rect.top < ROOM_Y: 
            self.rect.top = ROOM_Y
            self.velocity_y = -self.velocity_y * 0.3
            hit_wall = True
        if self.rect.bottom > ROOM_Y+ROOM_H: 
            self.rect.bottom = ROOM_Y+ROOM_H
            self.velocity_y = -self.velocity_y * 0.3
            hit_wall = True
        
        # 移动动画计时
        if target_vel_x != 0 or target_vel_y != 0:
            self.move_animation_timer = min(10, self.move_animation_timer + 1)
            # 移动粒子效果 - 增加手感反馈
            if self.move_animation_timer % 3 == 0:
                for _ in range(2):
                    offset_x = random.uniform(-8, 8)
                    offset_y = random.uniform(-8, 8)
                    particle = Particle(
                        self.rect.centerx + offset_x,
                        self.rect.centery + offset_y + 15,  # 脚下位置
                        (100, 100, 100),
                        random.uniform(2, 4),
                        random.uniform(1, 2),
                        random.randint(8, 12)
                    )
                    particles.add(particle)
        else:
            self.move_animation_timer = max(0, self.move_animation_timer - 1)

        mx, my = pygame.mouse.get_pos()
        angle = math.degrees(math.atan2(my - self.rect.centery, mx - self.rect.centerx))
        
        if self.stealth:
            stealth_img = pygame.Surface((40, 40), pygame.SRCALPHA)
            pygame.draw.rect(stealth_img, (50, 50, 100, 128), (10, 5, 20, 20))
            pygame.draw.rect(stealth_img, (80, 80, 120, 128), (12, 7, 16, 16))
            pygame.draw.circle(stealth_img, (200, 200, 255, 128), (17, 12), 2)
            pygame.draw.circle(stealth_img, (200, 200, 255, 128), (23, 12), 2)
            pygame.draw.line(stealth_img, (150, 150, 200, 128), (17, 17), (23, 17), 1)
            pygame.draw.rect(stealth_img, (30, 30, 80, 128), (10, 25, 20, 15))
            pygame.draw.rect(stealth_img, (50, 50, 100, 128), (5, 25, 5, 10))
            pygame.draw.rect(stealth_img, (50, 50, 100, 128), (30, 25, 5, 10))
            pygame.draw.rect(stealth_img, (20, 20, 60, 128), (12, 35, 8, 5))
            pygame.draw.rect(stealth_img, (50, 50, 100, 128), (20, 35, 8, 5))
            self.image = pygame.transform.rotate(stealth_img, -angle)
        else:
            self.image = pygame.transform.rotate(self.org_img, -angle)
            
        self.rect = self.image.get_rect(center=self.rect.center)

        # 有限蓝量恢复机制
        if self.mp < self.max_mp:
            self.mp = min(self.max_mp, self.mp + self.mp_regen)
        
        # 护盾自动恢复（BOSS房间内限制恢复上限）
        if self.shield < self.max_shield:
            if hasattr(self, 'in_boss_room') and self.in_boss_room and hasattr(self, 'boss_room_shield'):
                self.shield = min(self.boss_room_shield, self.shield + self.shield_regen * 0.05)
            else:
                self.shield = min(self.max_shield, self.shield + self.shield_regen * 0.05)
            
        # 伤害buff计时器更新
        if self.damage_buff:
            self.damage_buff_timer -= 50
            if self.damage_buff_timer <= 0:
                self.damage_buff = False
                self.damage_buff_timer = 0
                self.damage_multiplier = 1.0
        
        # 处理持续激光发射器 - 炽焰流
        if self.is_shooting_laser:
            weapon = self.weapons[self.current_weapon]
            data = self.weapon_data[weapon]
            if self.mp >= data['mp_cost']:
                self.mp -= data['mp_cost']
                mx, my = pygame.mouse.get_pos()
                base_angle = math.atan2(my - self.rect.centery, mx - self.rect.centerx)
                effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, data['damage'], length=1000, width=20)
                all_sprites.add(effect)

    def shoot(self, charge_level=1):
        weapon = self.weapons[self.current_weapon]
        data = self.weapon_data[weapon]
        now = pygame.time.get_ticks()
        
        # 计算有效冷却时间，考虑攻速影响
        effective_cooldown = data['cooldown'] / (self.attack_speed + self.attack_speed_bonus)
        if now - self.last_shot > effective_cooldown and self.mp >= data['mp_cost']:
            self.last_shot = now
            self.mp -= data['mp_cost']
            
            mx, my = pygame.mouse.get_pos()
            base_angle = math.atan2(my - self.rect.centery, mx - self.rect.centerx)
            
            # 生成武器使用粒子效果
            for i in range(3):
                angle_recoil = base_angle + math.pi + random.uniform(-0.3, 0.3)
                speed = random.uniform(3, 6)
                particle = Particle(
                    self.rect.centerx + math.cos(base_angle) * 15,
                    self.rect.centery + math.sin(base_angle) * 15,
                    (200, 200, 255),
                    random.uniform(2, 4),
                    speed,
                    random.randint(10, 15)
                )
                particles.add(particle)
            
            # 后坐力效果
            recoil_strength = data.get('recoil', 0.5) * charge_level
            self.velocity_x -= math.cos(base_angle) * recoil_strength
            self.velocity_y -= math.sin(base_angle) * recoil_strength
            
            wtype = data.get('type', 'ranged')
            
            if wtype == 'ranged':
                    for i in range(data['count']):
                        if weapon == '霰弹枪':
                            # 霰弹枪特殊散布：呈现扇形分布，中间密集边缘稀疏
                            # 使用三角分布实现中间密集边缘稀疏的效果
                            t = i / (data['count'] - 1) if data['count'] > 1 else 0.5
                            # 转换为对称分布 (-1, 1)
                            t = t * 2 - 1
                            # 使用立方使其更集中在中心
                            spread = t * t * t * data['spread']
                        else:
                            spread = (random.random() - 0.5) * data['spread'] * 2
                            
                        angle = base_angle + spread
                        damage = data['damage'] * charge_level * self.damage_multiplier
                        bullet = Bullet(self.rect.centerx, self.rect.centery, angle, damage, data['bullet_speed'], weapon)
                        
                        if data.get('pierce'):
                            bullet.pierce = True
                            bullet.pierce_count = data.get('pierce_count', 3)
                        if data.get('explosion'):
                            bullet.explosion = True
                        if data.get('freeze'):
                            bullet.freeze = True
                        if data.get('poison'):
                            bullet.poison = True
                        if data.get('boomerang'):
                            bullet.boomerang = True
                        if data.get('laser'):
                            bullet.laser = True
                        if data.get('electro'):
                            bullet.electro = True
                        if data.get('half_screen'):
                            bullet.half_screen = True
                        if data.get('ion'):
                            bullet.ion = True
                        if data.get('bounce'):
                            bullet.bounce = True
                            bullet.bounce_count = data.get('bounce_count', 2)
                        if data.get('timed'):
                            bullet.timed = True
                            bullet.timer = 120
                        if data.get('homing'):
                            bullet.homing = True
                        if data.get('plasma'):
                            bullet.plasma = True
                        
                        bullet.charge_level = charge_level
                        all_sprites.add(bullet)
                        bullets.add(bullet)
            elif wtype == 'bow_charge':
                # 蓄力弓 - 根据蓄力等级发射不同数量的箭
                max_charge = data.get('max_charge', 3)
                actual_charge = min(charge_level, max_charge)
                
                # 蓄力等级效果：1级单发，2级三发散射，3级五发散射
                if actual_charge == 1:
                    # 1级蓄力：单发箭
                    damage = data['damage'] * 1.0
                    bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, int(damage), data['bullet_speed'], weapon)
                    bullet.charge_level = 1
                    all_sprites.add(bullet)
                    bullets.add(bullet)
                elif actual_charge == 2:
                    # 2级蓄力：三发散射
                    for i in range(3):
                        spread = (i - 1) * 0.15
                        damage = data['damage'] * 1.3
                        bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle + spread, int(damage), data['bullet_speed'] * 1.1, weapon)
                        bullet.charge_level = 2
                        all_sprites.add(bullet)
                        bullets.add(bullet)
                else:
                    # 3级蓄力：五发散射
                    for i in range(5):
                        spread = (i - 2) * 0.12
                        damage = data['damage'] * 1.8
                        bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle + spread, int(damage), data['bullet_speed'] * 1.3, weapon)
                        bullet.charge_level = 3
                        bullet.pierce = True
                        bullet.pierce_count = 2
                        all_sprites.add(bullet)
                        bullets.add(bullet)
            elif wtype == 'charge_cannon':
                max_charge = data.get('max_charge', 3)
                actual_charge = max(1, min(charge_level, max_charge))
                
                if actual_charge == 1:
                    damage = data['damage'] * 1.0
                    bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, int(damage), data['bullet_speed'], weapon)
                    bullet.charge_level = 1
                    all_sprites.add(bullet)
                    bullets.add(bullet)
                elif actual_charge == 2:
                    damage = data['damage'] * 1.5
                    bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, int(damage), data['bullet_speed'] * 1.2, weapon)
                    bullet.charge_level = 2
                    bullet.gravity_aoe = True
                    all_sprites.add(bullet)
                    bullets.add(bullet)
                else:
                    damage = data['damage'] * 2.5
                    bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, int(damage), data['bullet_speed'] * 1.5, weapon)
                    bullet.charge_level = 3
                    bullet.gravity_aoe = True
                    bullet.large_explosion = True
                    all_sprites.add(bullet)
                    bullets.add(bullet)
            elif wtype == 'homing':
                bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, data['damage'], data['bullet_speed'], weapon)
                bullet.homing = True
                all_sprites.add(bullet)
                bullets.add(bullet)
            elif wtype == 'gravity':
                effect = GravityEffect(self.rect.centerx, self.rect.centery, data['damage'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 200:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 200:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'timed_bomb':
                bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, data['damage'], data['bullet_speed'], weapon)
                bullet.timed_bomb = True
                bullet.timer = 180
                all_sprites.add(bullet)
                bullets.add(bullet)
            elif wtype == 'split':
                bullet = Bullet(self.rect.centerx, self.rect.centery, base_angle, data['damage'], data['bullet_speed'], weapon)
                bullet.split = True
                all_sprites.add(bullet)
                bullets.add(bullet)
            elif wtype == 'spin':
                effect = SpinEffect(self.rect.centerx, self.rect.centery, data['damage'], data['range'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'rain':
                for i in range(data['count']):
                    offset_x = random.randint(-200, 200)
                    offset_y = random.randint(-200, 200)
                    bullet = Bullet(self.rect.centerx + offset_x, self.rect.centery + offset_y, math.pi/2, data['damage'], data['bullet_speed'], weapon)
                    all_sprites.add(bullet)
                    bullets.add(bullet)
            elif wtype == 'laser':
                effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, data['damage'])
                all_sprites.add(effect)
            elif wtype == 'laser_pierce':
                effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, data['damage'], length=1000, width=20)
                all_sprites.add(effect)
            elif wtype == 'laser_charge':
                max_charge = data.get('max_charge', 3)
                actual_charge = max(1, min(charge_level, max_charge))
                
                if actual_charge == 1:
                    damage = data['damage'] * 1.0
                    effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, damage, length=1000, width=20)
                    all_sprites.add(effect)
                elif actual_charge == 2:
                    damage = data['damage'] * 1.8
                    effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, damage, length=1200, width=50)
                    all_sprites.add(effect)
                else:
                    damage = data['damage'] * 3.0
                    effect = LaserEffect(self.rect.centerx, self.rect.centery, base_angle, damage, length=1500, width=100)
                    all_sprites.add(effect)
            elif wtype == 'chain':
                effect = ChainEffect(self.rect.centerx, self.rect.centery, base_angle, data['damage'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 300:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 300:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'aoe':
                effect = AOEEffect(self.rect.centerx, self.rect.centery, base_angle, data['damage'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 200:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 200:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'blackhole':
                effect = BlackHoleEffect(self.rect.centerx, self.rect.centery, data['damage'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 250:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 250:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'aura':
                effect = AuraEffect(self.rect.centerx, self.rect.centery, data['damage'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 150:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 150:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'thunder':
                mx, my = pygame.mouse.get_pos()
                effect = ThunderEffect(mx, my, data['damage'], data['range'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - mx
                    dy = mob.rect.centery - my
                    dist = math.hypot(dx, dy)
                    if dist < 80:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - mx
                    dy = boss.rect.centery - my
                    dist = math.hypot(dx, dy)
                    if dist < 80:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'ice_field':
                effect = IceFieldEffect(self.rect.centerx, self.rect.centery, data['damage'], data['range'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        mob.speed = max(0.5, mob.speed * 0.3)
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        boss.speed = max(0.3, boss.speed * 0.3)
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif wtype == 'clone':
                for _ in range(data['count']):
                    clone = CloneEffect(self.rect.centerx + random.randint(-100, 100), 
                                       self.rect.centery + random.randint(-100, 100), data['damage'])
                    all_sprites.add(clone)
            elif wtype == 'time_slow':
                effect = TimeSlowEffect(self.rect.centerx, self.rect.centery, data['range'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        mob.speed = mob.speed * 0.3
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        boss.speed = boss.speed * 0.3
                for bullet in enemy_bullets:
                    dx = bullet.rect.centerx - self.rect.centerx
                    dy = bullet.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        if not hasattr(bullet, 'base_speed'):
                            bullet.base_speed = bullet.speed
                        bullet.speed = bullet.base_speed * 0.3
            elif wtype == 'heal_field':
                effect = HealFieldEffect(self.rect.centerx, self.rect.centery, data['range'])
                all_sprites.add(effect)
                self.hp = min(self.max_hp, self.hp + data['heal_amount'])
            elif wtype == 'swing':
                self.swing_attack(base_angle, data)
            elif wtype == 'black_knight':
                self.black_knight_attack(base_angle, data)
            elif wtype == 'curry_wave':
                self.curry_wave_attack(base_angle, data, 0)
            elif wtype == 'flame_sword':
                self.flame_sword_attack(base_angle, data)
            elif wtype == 'frost_sword':
                self.frost_sword_attack(base_angle, data)
            elif wtype == 'poison_sword':
                self.poison_sword_attack(base_angle, data)
            elif wtype == 'flame_thrower':
                self.flame_thrower_attack(base_angle, data)
            elif data.get('unique') == 'spin_attack':
                self.spin_attack(data)
            elif data.get('unique') == 'grapple_hook':
                self.grapple_hook_attack(base_angle, data)
            elif data.get('unique') == 'nunchaku':
                self.nunchaku_attack(base_angle, data)
            elif data.get('unique') == 'shadow_step':
                self.shadow_step_attack(base_angle, data)
            else:
                # 根据unique属性选择不同的近战效果颜色
                unique_type = data.get('unique', 'basic')
                if unique_type == 'light':
                    self.melee_attack(base_angle, data, 'light')
                elif unique_type == 'shadow':
                    self.melee_attack(base_angle, data, 'shadow')
                elif unique_type == 'laser_blade':
                    self.melee_attack(base_angle, data, 'laser')
                else:
                    self.melee_attack(base_angle, data, 'normal')

    def create_hit_effect(self, x, y, color_type='normal'):
        colors = {
            'normal': (255, 100, 100),
            'light': (255, 255, 100),
            'shadow': (150, 100, 255),
            'laser': (100, 255, 255),
            'axe': (200, 150, 100),
            'energy': (150, 200, 255),
            'golden_wave': (255, 200, 100),
            'frost': (100, 200, 255),
            'flame': (255, 100, 50),
            'poison': (100, 200, 100),
            'black_knight': (100, 100, 100)
        }
        color = colors.get(color_type, (255, 100, 100))
        
        # 击中闪光效果
        for i in range(3):
            hit_surface = pygame.Surface((30 + i * 20, 30 + i * 20), pygame.SRCALPHA)
            alpha = int(200 - i * 60)
            pygame.draw.circle(hit_surface, color + (alpha,), 
                              (15 + i * 10, 15 + i * 10), 15 + i * 10)
            screen.blit(hit_surface, (x - 15 - i * 10, y - 15 - i * 10))
        
        # 击中粒子
        for i in range(8):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(2, 5)
            particle = Particle(x, y, color, random.uniform(3, 6), speed, random.randint(8, 12))
            particle.dx = math.cos(angle) * speed
            particle.dy = math.sin(angle) * speed
            particles.add(particle)
    
    def melee_attack(self, angle, data, color_type='normal'):
        global wave_completed, room_cleared
        
        if data.get('unique') == 'axe_swing':
            effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'axe')
        elif data.get('unique') == 'energy_blade':
            effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'energy')
        else:
            effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], color_type)
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        angle_range = 2.0 if data.get('aoe') else 1.5
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < angle_range:
                    mob.hp -= data['damage']
                    # 添加击中特效
                    self.create_hit_effect(mob.rect.centerx, mob.rect.centery, color_type)
                    if data.get('knockback'):
                        knockback_force = 15
                        mob.rect.x += math.cos(mob_angle) * knockback_force
                        mob.rect.y += math.sin(mob_angle) * knockback_force
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < angle_range:
                    boss.hp -= data['damage']
                    # 添加击中特效
                    self.create_hit_effect(boss.rect.centerx, boss.rect.centery, color_type)
                    if data.get('knockback'):
                        knockback_force = 8
                        boss.rect.x += math.cos(boss_angle) * knockback_force
                        boss.rect.y += math.sin(boss_angle) * knockback_force
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        if data.get('energy_wave'):
            wave_effect = EnergyWave(self.rect.centerx, self.rect.centery, angle, data.get('wave_damage', 30))
            all_sprites.add(wave_effect)
            bullets.add(wave_effect)
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()

    def spin_attack(self, data):
        global wave_completed, room_cleared
        effect = SpinEffect(self.rect.centerx, self.rect.centery, data['spin_radius'])
        all_sprites.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['spin_radius']:
                mob.hp -= data['spin_damage']
                knockback_force = 8
                mob_angle = math.atan2(dy, dx)
                mob.rect.x += math.cos(mob_angle) * knockback_force
                mob.rect.y += math.sin(mob_angle) * knockback_force
                if mob.hp <= 0:
                    player.score += 10
                    spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                    mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['spin_radius']:
                boss.hp -= data['spin_damage']
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
                    wave_completed = True
                    room_cleared = True

    def grapple_hook_attack(self, angle, data):
        global wave_completed, room_cleared
        hook_effect = GrappleHookEffect(self.rect.centerx, self.rect.centery, angle, data['range'])
        all_sprites.add(hook_effect)
        
        closest_mob = None
        closest_dist = float('inf')
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 0.5 and dist < closest_dist:
                    closest_dist = dist
                    closest_mob = mob
        
        if closest_mob:
            closest_mob.hp -= data['damage']
            pull_direction = math.atan2(self.rect.centery - closest_mob.rect.centery, 
                                      self.rect.centerx - closest_mob.rect.centerx)
            closest_mob.rect.x += math.cos(pull_direction) * data['pull_distance']
            closest_mob.rect.y += math.sin(pull_direction) * data['pull_distance']
            if closest_mob.hp <= 0:
                player.score += 10
                spawn_pickups(closest_mob.rect.centerx, closest_mob.rect.centery, 1)
                closest_mob.kill()
        else:
            for boss in bosses:
                dx = boss.rect.centerx - self.rect.centerx
                dy = boss.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist <= data['range']:
                    boss_angle = math.atan2(dy, dx)
                    angle_diff = abs(angle - boss_angle)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < 0.5:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True

    def nunchaku_attack(self, angle, data):
        global wave_completed, room_cleared
        
        for i in range(data['hit_count']):
            hit_angle = angle + (i - 1) * data['angle_offset']
            effect = MeleeEffect(self.rect.centerx, self.rect.centery, hit_angle, data['range'], 'normal')
            all_sprites.add(effect)
            melee_effects.add(effect)
            
            for mob in mobs:
                dx = mob.rect.centerx - self.rect.centerx
                dy = mob.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist <= data['range']:
                    mob_angle = math.atan2(dy, dx)
                    angle_diff = abs(hit_angle - mob_angle)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < 1.2:
                        mob.hp -= data['damage']
                        # 添加击中特效
                        self.create_hit_effect(mob.rect.centerx, mob.rect.centery, 'normal')
                        if mob.hp <= 0:
                            player.score += 10
                            spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                            mob.kill()
            
            for boss in bosses:
                dx = boss.rect.centerx - self.rect.centerx
                dy = boss.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist <= data['range']:
                    boss_angle = math.atan2(dy, dx)
                    angle_diff = abs(hit_angle - boss_angle)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < 1.2:
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True

    def shadow_step_attack(self, angle, data):
        global wave_completed, room_cleared
        
        teleport_x = self.rect.centerx + math.cos(angle) * data['teleport_range']
        teleport_y = self.rect.centery + math.sin(angle) * data['teleport_range']
        
        teleport_x = max(ROOM_X + 20, min(ROOM_X + ROOM_W - 20, teleport_x))
        teleport_y = max(ROOM_Y + 20, min(ROOM_Y + ROOM_H - 20, teleport_y))
        
        effect = ShadowStepEffect(self.rect.centerx, self.rect.centery, teleport_x, teleport_y)
        all_sprites.add(effect)
        
        self.rect.centerx = teleport_x
        self.rect.centery = teleport_y
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob.hp -= data['damage']
                if mob.hp <= 0:
                    player.score += 10
                    spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                    mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss.hp -= data['damage']
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
                    wave_completed = True
                    room_cleared = True

    def teleport_slash_attack(self, angle, data):
        global wave_completed, room_cleared
        
        teleport_x = self.rect.centerx + math.cos(angle) * data['tele_distance']
        teleport_y = self.rect.centery + math.sin(angle) * data['tele_distance']
        
        teleport_x = max(ROOM_X + 20, min(ROOM_X + ROOM_W - 20, teleport_x))
        teleport_y = max(ROOM_Y + 20, min(ROOM_Y + ROOM_H - 20, teleport_y))
        
        effect = TeleportSlashEffect(self.rect.centerx, self.rect.centery, teleport_x, teleport_y)
        all_sprites.add(effect)
        
        self.rect.centerx = teleport_x
        self.rect.centery = teleport_y
        
        effect2 = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'light')
        all_sprites.add(effect2)
        melee_effects.add(effect2)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    mob.hp -= data['damage']
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    boss.hp -= data['damage']
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True

    def swing_attack(self, angle, data):
        global wave_completed, room_cleared
        effect = SwingEffect(self.rect.centerx, self.rect.centery, angle, data['range'])
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.2:
                    mob.hp -= data['damage']
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.2:
                    boss.hp -= data['damage']
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()

    def swing_charge_attack(self, angle, data, charge_level):
        global wave_completed, room_cleared
        damage = int(data['damage'] * (1 + charge_level * 0.5))
        range_mult = 1 + charge_level * 0.3
        
        effect = SwingChargeEffect(self.rect.centerx, self.rect.centery, angle, data['range'] * range_mult, charge_level)
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        num_waves = 2 + charge_level
        for i in range(num_waves):
            wave = GoldenWave(self.rect.centerx, self.rect.centery, angle, damage, 99999, charge_level, i * 5)
            all_sprites.add(wave)
            bullets.add(wave)
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range'] * range_mult:
                bullet.kill()

    def curry_wave_attack(self, angle, data, charge_level=0):
        global wave_completed, room_cleared
        
        if charge_level == 0:
            self.swing_attack(angle, data)
            return
        
        radius = 180 + charge_level * 30
        wave = CurryWave(self.rect.centerx, self.rect.centery, angle, data['damage'], 99999, radius)
        all_sprites.add(wave)
        bullets.add(wave)
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()

    def black_knight_attack(self, angle, data):
        global wave_completed, room_cleared
        
        if '黑骑士的剑' not in self.attack_count:
            self.attack_count['黑骑士的剑'] = 0
        self.attack_count['黑骑士的剑'] += 1
        
        effect = BlackKnightEffect(self.rect.centerx, self.rect.centery, angle, data['range'])
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        num_orbs = 3
        for i in range(num_orbs):
            orb_angle = angle + (i - 1) * 0.3
            orb = BlackOrb(self.rect.centerx, self.rect.centery, orb_angle, data['damage'])
            all_sprites.add(orb)
            bullets.add(orb)
        
        if self.attack_count['黑骑士的剑'] % 3 == 0:
            for mob in mobs:
                ground_sword = GroundSword(mob.rect.centerx, mob.rect.centery, data['damage'] * 2)
                all_sprites.add(ground_sword)
                melee_effects.add(ground_sword)
            for boss in bosses:
                ground_sword = GroundSword(boss.rect.centerx, boss.rect.centery, data['damage'] * 2)
                all_sprites.add(ground_sword)
                melee_effects.add(ground_sword)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    mob.hp -= data['damage']
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    boss.hp -= data['damage']
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()

    def rainbow_horse_attack(self, angle, data):
        global wave_completed, room_cleared
        
        laser = RainbowHorseLaser(self.rect.centerx, self.rect.centery, angle, data['damage'], data['range'])
        all_sprites.add(laser)
        bullets.add(laser)

    def flame_sword_attack(self, angle, data):
        global wave_completed, room_cleared
        effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'fire')
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    mob.hp -= data['damage']
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    boss.hp -= data['damage']
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()
        
        for i in range(3):
            flame = FlameEffect(self.rect.centerx, self.rect.centery, angle + (i - 1) * 0.2, data['damage'])
            all_sprites.add(flame)
            bullets.add(flame)

    def frost_sword_attack(self, angle, data):
        global wave_completed, room_cleared
        effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'frost')
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    mob.hp -= data['damage']
                    mob.frozen = 30
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    boss.hp -= data['damage']
                    # 添加冰冻效果
                    boss.frozen = 20
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()
        
        for i in range(3):
            frost = FrostEffect(self.rect.centerx, self.rect.centery, angle + (i - 1) * 0.2, data['damage'])
            all_sprites.add(frost)
            bullets.add(frost)

    def poison_sword_attack(self, angle, data):
        global wave_completed, room_cleared
        effect = MeleeEffect(self.rect.centerx, self.rect.centery, angle, data['range'], 'poison')
        all_sprites.add(effect)
        melee_effects.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    mob.hp -= data['damage']
                    # 添加中毒效果
                    if not hasattr(mob, 'poisoned'):
                        mob.poisoned = 0
                    mob.poisoned = 15
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 1.5:
                    boss.hp -= data['damage']
                    # 添加中毒效果
                    if not hasattr(boss, 'poisoned'):
                        boss.poisoned = 0
                    boss.poisoned = 15
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()
        
        for i in range(3):
            poison = PoisonEffect(self.rect.centerx, self.rect.centery, angle + (i - 1) * 0.2, data['damage'])
            all_sprites.add(poison)
            bullets.add(poison)

    def flame_thrower_attack(self, angle, data):
        global wave_completed, room_cleared
        
        # 火焰喷射器效果
        effect = FlameThrowerEffect(self.rect.centerx, self.rect.centery, angle, data['range'], data['damage'])
        all_sprites.add(effect)
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                mob_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - mob_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 0.8:
                    mob.hp -= data['damage']
                    # 添加燃烧效果
                    if not hasattr(mob, 'burning'):
                        mob.burning = 0
                    mob.burning = 15
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                boss_angle = math.atan2(dy, dx)
                angle_diff = abs(angle - boss_angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < 0.8:
                    boss.hp -= data['damage']
                    # 添加燃烧效果
                    if not hasattr(boss, 'burning'):
                        boss.burning = 0
                    boss.burning = 15
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - self.rect.centerx
            dy = bullet.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= data['range']:
                bullet.kill()

    def switch_weapon(self):
        self.current_weapon = (self.current_weapon + 1) % len(self.weapons)

    def switch_skill(self):
        self.current_skill = (self.current_skill + 1) % len(self.skills)

    def use_skill(self):
        if not self.skills:
            return
        skill = self.skills[self.current_skill]
        data = self.skill_data[skill]
        now = pygame.time.get_ticks()
        if now - self.last_skill_use > data['cooldown']:
            self.last_skill_use = now
            
            mx, my = pygame.mouse.get_pos()
            
            skill_type = data.get('type', 'shield')
            
            if skill_type == 'invincible':
                effect = InvincibleEffect(self.rect.centerx, self.rect.centery, data['duration'])
                all_sprites.add(effect)
                self.invincible = True
                self.invincible_timer = data['duration']
            elif skill_type == 'lightning':
                effect = ThunderEffect(mx, my, data['damage'], data['range'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - mx
                    dy = mob.rect.centery - my
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        mob.hp -= data['damage']
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - mx
                    dy = boss.rect.centery - my
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        boss.hp -= data['damage'] * 0.5
            elif skill_type == 'freeze_field':
                effect = IceFieldEffect(self.rect.centerx, self.rect.centery, data['damage'], data['range'], data['duration'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        mob.hp -= data['damage']
                        mob.freeze_timer = data['duration'] // 50
                        mob.speed = mob.base_speed * data['slow_factor']
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < data['range']:
                        boss.speed = max(0.3, boss.speed * 0.3)
                        boss.hp -= data['damage']
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
            elif skill_type == 'clone':
                for _ in range(data['clone_count']):
                    clone = CloneEffect(
                        self.rect.centerx + random.randint(-100, 100), 
                        self.rect.centery + random.randint(-100, 100), 
                        data['damage'], 
                        data['duration'],
                        data.get('speed', 2.5),
                        data.get('attack_range', 80)
                    )
                    all_sprites.add(clone)
            elif skill_type == 'time_slow':
                effect = TimeSlowEffect(self.rect.centerx, self.rect.centery, data['duration'], data['slow_factor'])
                all_sprites.add(effect)
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 350:
                        mob.speed = mob.base_speed * data['slow_factor']
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 350:
                        boss.speed = max(0.3, boss.speed * data['slow_factor'])
                for bullet in enemy_bullets:
                    dx = bullet.rect.centerx - self.rect.centerx
                    dy = bullet.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < 350:
                        if hasattr(bullet, 'dx') and hasattr(bullet, 'dy'):
                            if not hasattr(bullet, 'base_dx'):
                                bullet.base_dx = bullet.dx
                                bullet.base_dy = bullet.dy
                            bullet.dx = bullet.base_dx * data['slow_factor']
                            bullet.dy = bullet.base_dy * data['slow_factor']
                        elif hasattr(bullet, 'speed'):
                            if not hasattr(bullet, 'base_speed'):
                                bullet.base_speed = bullet.speed
                            bullet.speed = bullet.base_speed * data['slow_factor']
            elif skill_type == 'heal_field':
                effect = HealFieldEffect(self.rect.centerx, self.rect.centery, data['range'], data['duration'], data['heal_amount'], data['tick_interval'])
                all_sprites.add(effect)
                self.hp = min(self.max_hp, self.hp + data['heal_amount'] // 2)
            elif skill_type == 'shadow_dash':
                effect = ShadowDashEffect(self.rect.centerx, self.rect.centery, data['duration'], data['speed_bonus'], data['damage_multiplier'], data['buff_duration'])
                all_sprites.add(effect)
                self.stealth = True
                self.stealth_timer = data['duration']
                self.invincible = True
            elif skill_type == 'roll':
                angle = math.atan2(my - self.rect.centery, mx - self.rect.centerx)
                dx = math.cos(angle) * data['distance']
                dy = math.sin(angle) * data['distance']
                new_x = max(ROOM_X + 20, min(ROOM_X + ROOM_W - 20, self.rect.centerx + dx))
                new_y = max(ROOM_Y + 20, min(ROOM_Y + ROOM_H - 20, self.rect.centery + dy))
                effect = RollEffect(self.rect.centerx, self.rect.centery, new_x, new_y, data['duration'])
                all_sprites.add(effect)
                self.rect.centerx = new_x
                self.rect.centery = new_y
                self.invincible = True
                self.invincible_timer = data['duration']

    def draw_bars(self, surface=None):
        # 如果没有提供表面，使用默认的屏幕表面
        if surface is None:
            surface = screen
        
        hp_bar_width = 150
        hp_bar_height = 15
        hp_x = 20
        hp_y = HEIGHT - 70
        
        pygame.draw.rect(surface, BLACK, (hp_x-2, hp_y-2, hp_bar_width+4, hp_bar_height*3+12))
        pygame.draw.rect(surface, RED, (hp_x, hp_y, hp_bar_width * (self.hp/self.max_hp), hp_bar_height))
        pygame.draw.rect(surface, BLUE, (hp_x, hp_y+hp_bar_height+2, hp_bar_width * (self.mp/self.max_mp), hp_bar_height))
        pygame.draw.rect(surface, (100, 200, 255), (hp_x, hp_y+hp_bar_height*2+4, hp_bar_width * (self.shield/self.max_shield), hp_bar_height))
        
        hp_text = chinese_font.render(f"生命: {int(self.hp)}/{self.max_hp}", True, WHITE)
        mp_text = chinese_font.render(f"魔法: {int(self.mp)}/{self.max_mp}", True, WHITE)
        shield_text = chinese_font.render(f"护盾: {int(self.shield)}/{self.max_shield}", True, WHITE)
        surface.blit(hp_text, (hp_x + hp_bar_width + 10, hp_y))
        surface.blit(mp_text, (hp_x + hp_bar_width + 10, hp_y + hp_bar_height + 2))
        surface.blit(shield_text, (hp_x + hp_bar_width + 10, hp_y + hp_bar_height*2 + 4))
        
        if self.charging:
            charge_time = pygame.time.get_ticks() - self.charge_start
            charge_level = min(charge_time // 200, 5)
            charge_bar_width = 100
            charge_x = WIDTH // 2 - 50
            charge_y = HEIGHT - 60
            pygame.draw.rect(surface, BLACK, (charge_x - 2, charge_y - 2, charge_bar_width + 4, 18))
            pygame.draw.rect(surface, YELLOW, (charge_x, charge_y, charge_bar_width * (charge_level / 5), 14))
            charge_text = chinese_font.render(f"蓄力: {charge_level}/5", True, WHITE)
            text_rect = charge_text.get_rect(center=(charge_x + charge_bar_width // 2, charge_y + 7))
            surface.blit(charge_text, text_rect)

class Bullet(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, speed, weapon_type):
        super().__init__()
        self.weapon_type = weapon_type
        size = 12 if weapon_type == '步枪' else (8 if weapon_type == '手枪' else 6)
        self.image = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x,y))
        self.dx = math.cos(angle) * speed
        self.dy = math.sin(angle) * speed
        self.damage = damage
        self.pierce = False
        self.explosion = False
        self.freeze = False
        self.poison = False
        self.boomerang = False
        self.boomerang_returning = False
        self.homing = False
        self.timed_bomb = False
        self.timer = 0
        self.split = False
        self.charge = False
        self.delay = 0
        self.start_x = x
        self.start_y = y
        self.max_dist = 400
        self.hit_mobs = []
        self.trail = []
        self.trail_length = 10
        self.life = 1.0
        self.laser = False
        self.electro = False
        self.half_screen = False
        self.ion = False
        self.bounce = False
        self.timed = False
        self.bounce_count = 0
        self.max_bounces = 3
        self.plasma = False
        
        # 生命周期管理
        self.spawn_time = pygame.time.get_ticks()
        self.max_lifetime = 3000  # 最大存活时间3秒
        
        # 绘制子弹外观
        self.draw_bullet()
    
    def draw_bullet(self):
        self.image.fill((0, 0, 0, 0))
        size = self.rect.width // 2
        
        # 根据武器类型绘制独特的视觉效果
        if self.weapon_type == '手枪':
            # 手枪子弹
            pygame.draw.circle(self.image, WHITE, (size, size), size//2)
            pygame.draw.circle(self.image, (200, 200, 200), (size, size), size//4)
            # 添加弹壳效果
            pygame.draw.rect(self.image, (100, 100, 100), (size//2, size//2, size//4, size//2))
        elif self.weapon_type == '霰弹枪':
            # 霰弹枪子弹
            for i in range(5):
                angle = i * math.pi * 2 / 5
                x = size + math.cos(angle) * size//4
                y = size + math.sin(angle) * size//4
                pygame.draw.circle(self.image, (255, 200, 100), (int(x), int(y)), size//4)
            pygame.draw.circle(self.image, (255, 150, 50), (size, size), size//2)
        elif self.weapon_type == '剑':
            # 剑攻击效果已在MeleeEffect中处理
            pass
        elif self.weapon_type == '圣剑':
            # 圣剑子弹
            pygame.draw.circle(self.image, (255, 215, 0), (size, size), size)
            pygame.draw.circle(self.image, (255, 255, 100), (size, size), size//2, 2)
            # 添加金色光芒
            for i in range(8):
                angle = i * math.pi * 2 / 8
                x = size + math.cos(angle) * size
                y = size + math.sin(angle) * size
                pygame.draw.line(self.image, (255, 215, 0), (size, size), (int(x), int(y)), 2)
        elif self.weapon_type == '黑骑士的剑':
            # 黑骑士的剑攻击效果已在BlackKnightEffect中处理
            pass
        elif self.weapon_type == '咖喱棒':
            # 咖喱棒攻击效果已在CurryWave中处理
            pass
        elif self.weapon_type == '步枪':
            # 步枪子弹
            pygame.draw.rect(self.image, CYAN, (size//2, size//2, size, size))
            pygame.draw.circle(self.image, (0, 255, 255), (size, size), size//2, 1)
            # 添加高速效果
            pygame.draw.line(self.image, (0, 255, 255), (size//4, size), (size*3//4, size), 2)
        elif self.weapon_type == '狙击枪':
            # 狙击枪子弹
            pygame.draw.rect(self.image, (150, 150, 150), (size//4, size//2, size*1.5, size//4))
            pygame.draw.polygon(self.image, (150, 150, 150), [(size//4, size//2), (size*1.5 + size//4, size//2), (size*1.5 + size//4, size*3//2), (size//4, size*3//2)])
            # 添加瞄准效果
            pygame.draw.circle(self.image, (255, 0, 0), (size, size), size//2, 1)
        elif self.weapon_type == '火箭炮':
            # 火箭炮子弹
            pygame.draw.rect(self.image, ORANGE, (size//2, size//2, size, size//2))
            pygame.draw.polygon(self.image, ORANGE, [(size//2, size//2), (size*3//2, size//2), (size, 0)])
            # 添加火焰尾迹
            pygame.draw.rect(self.image, (255, 100, 0), (size//2, size, size, size//4))
        elif self.weapon_type == '回旋镖':
            # 回旋镖
            pygame.draw.polygon(self.image, (200, 150, 100), [(size, 0), (size*2, size), (size, size*2), (0, size)])
            pygame.draw.line(self.image, (150, 100, 50), (0, size), (size*2, size), 2)
        elif self.weapon_type == '手里剑':
            # 手里剑
            pygame.draw.polygon(self.image, (100, 100, 100), [(size, 0), (size*2, size), (size, size*2), (0, size)])
            pygame.draw.line(self.image, (50, 50, 50), (0, 0), (size*2, size*2), 2)
            pygame.draw.line(self.image, (50, 50, 50), (size*2, 0), (0, size*2), 2)
        elif self.weapon_type == '冰锥':
            # 冰锥
            pygame.draw.polygon(self.image, BLUE, [(size, 0), (size*2, size), (size, size*2), (0, size)])
            pygame.draw.circle(self.image, (100, 200, 255), (size, size), size//3)
            # 添加冰霜效果
            for i in range(6):
                angle = i * math.pi * 2 / 6
                x = size + math.cos(angle) * size//2
                y = size + math.sin(angle) * size//2
                pygame.draw.line(self.image, (100, 200, 255), (size, size), (int(x), int(y)), 1)
        elif self.weapon_type == '火球':
            # 火球
            pygame.draw.circle(self.image, (255, 100, 0), (size, size), size)
            pygame.draw.circle(self.image, (255, 200, 0), (size, size), size//2)
            # 添加火焰效果
            for i in range(8):
                angle = i * math.pi * 2 / 8
                x = size + math.cos(angle) * size
                y = size + math.sin(angle) * size
                pygame.draw.line(self.image, (255, 100, 0), (size, size), (int(x), int(y)), 2)
        elif self.weapon_type == '毒云':
            # 毒云
            pygame.draw.ellipse(self.image, (0, 200, 100), (size//2, size//2, size, size))
            pygame.draw.circle(self.image, (0, 150, 50), (size, size), size//3)
            # 添加毒气效果
            for i in range(4):
                angle = i * math.pi * 2 / 4
                x = size + math.cos(angle) * size//2
                y = size + math.sin(angle) * size//2
                pygame.draw.line(self.image, (0, 200, 100), (size, size), (int(x), int(y)), 2)
        elif self.weapon_type == '火焰剑':
            # 火焰剑攻击效果已在flame_sword_attack中处理
            pass
        elif self.weapon_type == '冰霜剑':
            # 冰霜剑攻击效果已在frost_sword_attack中处理
            pass
        elif self.weapon_type == '毒剑':
            # 毒剑攻击效果已在poison_sword_attack中处理
            pass
        elif self.weapon_type == '等离子炮':
            # 等离子子弹
            pygame.draw.circle(self.image, (0, 255, 255), (size, size), size)
            pygame.draw.circle(self.image, (0, 200, 200), (size, size), size//2)
            # 等离子效果
            for i in range(5):
                angle = i * math.pi * 2 / 5
                x = size + math.cos(angle) * size//2
                y = size + math.sin(angle) * size//2
                pygame.draw.line(self.image, (0, 255, 255), (size, size), (x, y), 2)
        elif self.weapon_type == '双枪':
            # 双枪子弹
            pygame.draw.circle(self.image, (100, 150, 255), (size, size), size//2)
            pygame.draw.circle(self.image, (150, 200, 255), (size, size), size//4)
        elif self.weapon_type == '战斧':
            # 战斧攻击效果已在melee_attack中处理
            pass
        elif self.weapon_type == '炸弹':
            # 炸弹
            pygame.draw.circle(self.image, (100, 100, 100), (size, size), size)
            pygame.draw.circle(self.image, (200, 200, 200), (size, size), size//2)
            pygame.draw.circle(self.image, (255, 0, 0), (size, size), size//4)
        elif self.weapon_type == '飞刀':
            # 飞刀
            pygame.draw.polygon(self.image, (150, 150, 150), [(size*2, size), (size, 0), (0, size), (size, size*2)])
            pygame.draw.line(self.image, (100, 100, 100), (size, 0), (size, size*2), 1)
        elif self.weapon_type == '能量剑':
            # 能量剑攻击效果已在melee_attack中处理
            pass
        else:
            # 默认子弹
            pygame.draw.circle(self.image, WHITE, (size, size), size//2)
            pygame.draw.circle(self.image, (200, 200, 200), (size, size), size//4)

    def update(self):
        # 生命周期检查
        if pygame.time.get_ticks() - self.spawn_time > self.max_lifetime:
            self.kill()
            return
        
        if self.delay > 0:
            self.delay -= 1
            return
        
        # 绘制激光效果
        if self.laser:
            # 计算激光终点
            if self.half_screen:
                # 半个画面的激光
                laser_length = max(WIDTH, HEIGHT) * 2  # 增加激光长度，使其更加明显
            else:
                laser_length = 1000
            # 计算单位向量
            length = math.hypot(self.dx, self.dy)
            if length > 0:
                unit_dx = self.dx / length
                unit_dy = self.dy / length
                end_x = self.rect.centerx + unit_dx * laser_length
                end_y = self.rect.centery + unit_dy * laser_length
            else:
                end_x = self.rect.centerx
                end_y = self.rect.centery
            
            # 根据蓄力等级调整激光效果
            charge_level = getattr(self, 'charge_level', 1)
            # 增加激光宽度，使其更加明显
            width = 200 + charge_level * 4
            outer_width = 15 + charge_level * 6
            alpha = min(200 + charge_level * 20, 255)  # 确保alpha值不超过255
            
            # 绘制激光
            laser_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            pygame.draw.line(laser_surface, (0, 255, 255, alpha), (self.rect.centerx, self.rect.centery), (end_x, end_y), width)
            pygame.draw.line(laser_surface, (100, 255, 255, alpha // 2), (self.rect.centerx, self.rect.centery), (end_x, end_y), outer_width)
            screen.blit(laser_surface, (0, 0))
        elif self.electro:
            # 绘制电磁轨迹效果
            self.trail.append((self.rect.centerx, self.rect.centery, self.life))
            if len(self.trail) > self.trail_length:
                self.trail.pop(0)
            
            # 绘制电磁轨迹
            for i, (x, y, life) in enumerate(self.trail):
                alpha = int(200 * life * (i / len(self.trail)))
                size = int(self.rect.width // 2 * life * (i / len(self.trail)))
                if size > 0:
                    trail_surface = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
                    pygame.draw.circle(trail_surface, (255, 255, 0, alpha), (size, size), size)
                    screen.blit(trail_surface, (x - size, y - size))
                    # 绘制电磁火花
                    for j in range(2):
                        spark_x = x + (random.random() - 0.5) * size
                        spark_y = y + (random.random() - 0.5) * size
                        pygame.draw.line(trail_surface, (255, 255, 100, alpha // 2), (size, size), (spark_x - x + size, spark_y - y + size), 1)
                    screen.blit(trail_surface, (x - size, y - size))
        elif self.ion:
            # 绘制离子轨迹效果
            self.trail.append((self.rect.centerx, self.rect.centery, self.life))
            if len(self.trail) > self.trail_length:
                self.trail.pop(0)
            
            # 绘制离子轨迹
            for i, (x, y, life) in enumerate(self.trail):
                alpha = int(200 * life * (i / len(self.trail)))
                size = int(self.rect.width // 2 * life * (i / len(self.trail)))
                if size > 0:
                    trail_surface = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
                    pygame.draw.circle(trail_surface, (255, 0, 255, alpha), (size, size), size)
                    screen.blit(trail_surface, (x - size, y - size))
                    # 绘制离子粒子
                    for j in range(3):
                        particle_x = x + (random.random() - 0.5) * size
                        particle_y = y + (random.random() - 0.5) * size
                        pygame.draw.circle(trail_surface, (255, 100, 255, alpha // 2), (particle_x - x + size, particle_y - y + size), 2)
                    screen.blit(trail_surface, (x - size, y - size))
        elif self.plasma:
            # 绘制等离子轨迹效果
            self.trail.append((self.rect.centerx, self.rect.centery, self.life))
            if len(self.trail) > self.trail_length:
                self.trail.pop(0)
            
            # 绘制等离子轨迹
            for i, (x, y, life) in enumerate(self.trail):
                alpha = int(200 * life * (i / len(self.trail)))
                size = int(self.rect.width // 2 * life * (i / len(self.trail)))
                if size > 0:
                    trail_surface = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
                    # 绘制等离子轨迹
                    pygame.draw.circle(trail_surface, (0, 255, 255, alpha), (size, size), size)
                    # 绘制等离子粒子
                    for j in range(4):
                        particle_x = x + (random.random() - 0.5) * size
                        particle_y = y + (random.random() - 0.5) * size
                        pygame.draw.circle(trail_surface, (0, 200, 200, alpha // 2), (particle_x - x + size, particle_y - y + size), 2)
                    screen.blit(trail_surface, (x - size, y - size))
        else:
            # 更新轨迹
            self.trail.append((self.rect.centerx, self.rect.centery, self.life))
            if len(self.trail) > self.trail_length:
                self.trail.pop(0)
            
            # 绘制轨迹
            for i, (x, y, life) in enumerate(self.trail):
                alpha = int(200 * life * (i / len(self.trail)))
                size = int(self.rect.width // 2 * life * (i / len(self.trail)))
                if size > 0:
                    trail_surface = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
                    pygame.draw.circle(trail_surface, (255, 255, 255, alpha), (size, size), size)
                    screen.blit(trail_surface, (x - size, y - size))
        
        if self.timed_bomb or self.timed:
            self.timer -= 1
            # 炸弹闪烁效果
            if self.timer % 5 == 0:
                size = self.rect.width // 2
                self.image.fill((0, 0, 0, 0))
                # 定时炸弹外观
                pygame.draw.circle(self.image, (255, 100, 0), (size, size), size)
                pygame.draw.circle(self.image, (255, 0, 0), (size, size), size//2)
            if self.timer <= 0:
                # 爆炸效果
                explosion_size = 100
                explosion_surface = pygame.Surface((explosion_size*2, explosion_size*2), pygame.SRCALPHA)
                for i in range(5):
                    alpha = int(200 * (1 - i/5))
                    radius = explosion_size * (i/5)
                    pygame.draw.circle(explosion_surface, (255, 100, 0, alpha), (explosion_size, explosion_size), int(radius))
                screen.blit(explosion_surface, (self.rect.centerx - explosion_size, self.rect.centery - explosion_size))
                
                for mob in mobs:
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    if math.hypot(dx, dy) < 80:
                        mob.hp -= self.damage
                        if mob.hp <= 0:
                            player.score += 10
                            mob.kill()
                for boss in bosses:
                    dx = boss.rect.centerx - self.rect.centerx
                    dy = boss.rect.centery - self.rect.centery
                    if math.hypot(dx, dy) < 80:
                        boss.hp -= self.damage
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
                self.kill()
                return
        
        if self.homing:
            nearest = None
            min_dist = 9999
            for mob in mobs:
                dx = mob.rect.centerx - self.rect.centerx
                dy = mob.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist < min_dist:
                    min_dist = dist
                    nearest = mob
            if nearest:
                angle = math.atan2(nearest.rect.centery - self.rect.centery, nearest.rect.centerx - self.rect.centerx)
                # 平滑转向
                current_angle = math.atan2(self.dy, self.dx)
                angle_diff = angle - current_angle
                if angle_diff > math.pi:
                    angle_diff -= 2 * math.pi
                elif angle_diff < -math.pi:
                    angle_diff += 2 * math.pi
                angle_diff = max(-0.1, min(0.1, angle_diff))
                new_angle = current_angle + angle_diff
                speed = math.hypot(self.dx, self.dy)
                self.dx = math.cos(new_angle) * speed
                self.dy = math.sin(new_angle) * speed
        
        if self.split:
            if not hasattr(self, 'split_count'):
                self.split_count = 0
            if self.split_count == 0 and self.rect.x < ROOM_X + 50:
                self.split_count = 1
                for angle in [math.pi/4, math.pi*3/4]:
                    b = Bullet(self.rect.centerx, self.rect.centery, angle, self.damage, 10, self.weapon_type)
                    all_sprites.add(b)
                    bullets.add(b)
            elif self.split_count == 0 and self.rect.right > ROOM_X + ROOM_W - 50:
                self.split_count = 1
                for angle in [math.pi*3/4, math.pi*5/4]:
                    b = Bullet(self.rect.centerx, self.rect.centery, angle, self.damage, 10, self.weapon_type)
                    all_sprites.add(b)
                    bullets.add(b)
            elif self.split_count == 0 and self.rect.y < ROOM_Y + 50:
                self.split_count = 1
                for angle in [math.pi/4, -math.pi/4]:
                    b = Bullet(self.rect.centerx, self.rect.centery, angle, self.damage, 10, self.weapon_type)
                    all_sprites.add(b)
                    bullets.add(b)
            elif self.split_count == 0 and self.rect.bottom > ROOM_Y + ROOM_H - 50:
                self.split_count = 1
                for angle in [-math.pi/4, math.pi*5/4]:
                    b = Bullet(self.rect.centerx, self.rect.centery, angle, self.damage, 10, self.weapon_type)
                    all_sprites.add(b)
                    bullets.add(b)
        
        if self.boomerang:
            if not self.boomerang_returning:
                dx = self.start_x - self.rect.centerx
                dy = self.start_y - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist > self.max_dist:
                    self.boomerang_returning = True
            else:
                angle = math.atan2(player.rect.centery - self.rect.centery, player.rect.centerx - self.rect.centerx)
                self.dx = math.cos(angle) * 15
                self.dy = math.sin(angle) * 15
                dx = player.rect.centerx - self.rect.centerx
                dy = player.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist < 40:
                    self.kill()
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 碰撞检测
        hit = False
        if self.laser:
            # 激光碰撞检测
            if self.half_screen:
                # 半个画面的激光
                laser_length = max(WIDTH, HEIGHT) * 2  # 增加激光长度，使其更加明显
            else:
                laser_length = 1000
            # 计算单位向量
            length = math.hypot(self.dx, self.dy)
            if length > 0:
                unit_dx = self.dx / length
                unit_dy = self.dy / length
                laser_end = (self.rect.centerx + unit_dx * laser_length, 
                            self.rect.centery + unit_dy * laser_length)
            else:
                laser_end = (self.rect.centerx, self.rect.centery)
            laser_start = (self.rect.centerx, self.rect.centery)
            # 计算激光角度
            laser_angle = math.atan2(laser_end[1] - laser_start[1], laser_end[0] - laser_start[0])
            
            # 根据蓄力等级调整激光宽度
            charge_level = getattr(self, 'charge_level', 1)
            # 增加角度阈值，使其能够击中更多的敌人
            if self.half_screen:
                # 巨型激光炮的角度阈值更大
                angle_threshold = 0.3 + charge_level * 0.05  # 蓄力等级越高，角度阈值越大
            else:
                angle_threshold = 0.15 + charge_level * 0.03  # 蓄力等级越高，角度阈值越大
            angle_threshold = max(0.1, angle_threshold)  # 最小角度阈值
            
            for mob in mobs:
                if mob not in self.hit_mobs:
                    # 检查敌人是否在激光路径上
                    dx = mob.rect.centerx - self.rect.centerx
                    dy = mob.rect.centery - self.rect.centery
                    dist = math.hypot(dx, dy)
                    if dist < laser_length:
                        angle_to_mob = math.atan2(dy, dx)
                        angle_diff = abs(laser_angle - angle_to_mob)
                        if angle_diff > math.pi:
                            angle_diff = 2 * math.pi - angle_diff
                        if angle_diff < angle_threshold:
                            mob.hp -= self.damage
                            if mob.hp <= 0:
                                player.score += 10
                                spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                                mob.kill()
                            self.hit_mobs.append(mob)
            
            for boss in bosses:
                # 检查Boss是否在激光路径上
                dx = boss.rect.centerx - self.rect.centerx
                dy = boss.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist < laser_length:
                    angle_to_boss = math.atan2(dy, dx)
                    angle_diff = abs(laser_angle - angle_to_boss)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < angle_threshold:
                        boss.hp -= self.damage
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
        else:
            for mob in mobs:
                if self.rect.colliderect(mob.rect) and mob not in self.hit_mobs:
                    mob.hp -= self.damage
                    if self.freeze:
                        mob.frozen = 30
                    if self.poison:
                        if not hasattr(mob, 'poisoned'):
                            mob.poisoned = 0
                        mob.poisoned = 15
                    if self.weapon_type == '火焰剑':
                        if not hasattr(mob, 'burning'):
                            mob.burning = 0
                        mob.burning = 10
                    # 添加命中效果
                    effect = HitEffect(mob.rect.centerx, mob.rect.centery, self.damage)
                    all_sprites.add(effect)
                    hit_effects.add(effect)
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
                    if not self.pierce:
                        hit = True
                        break
                    else:
                        self.hit_mobs.append(mob)
            
            for boss in bosses:
                if self.rect.colliderect(boss.rect):
                    boss.hp -= self.damage
                    if self.freeze:
                        boss.frozen = 30
                    if self.poison:
                        if not hasattr(boss, 'poisoned'):
                            boss.poisoned = 0
                        boss.poisoned = 15
                    if self.weapon_type == '火焰剑':
                        if not hasattr(boss, 'burning'):
                            boss.burning = 0
                        boss.burning = 10
                    # 添加命中效果
                    effect = HitEffect(boss.rect.centerx, boss.rect.centery, self.damage)
                    all_sprites.add(effect)
                    hit_effects.add(effect)
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True
                    if not self.pierce:
                        hit = True
                        break
        
        if hit:
            self.kill()
            return
        
        # 激光子弹的生命周期
        if self.laser:
            # 激光持续时间较短
            self.life -= 0.05
            if self.life <= 0:
                self.kill()
                return
        
        if self.boomerang:
            return
        
        if hasattr(self, 'infinite_range') and self.infinite_range:
            return
        
        if (self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W or 
            self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H):
            if self.bounce and self.bounce_count < self.max_bounces:
                # 反弹逻辑
                self.bounce_count += 1
                # 计算反弹方向
                if self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W:
                    # 水平反弹
                    self.dx = -self.dx
                if self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H:
                    # 垂直反弹
                    self.dy = -self.dy
                # 调整位置，避免卡在墙内
                if self.rect.left < ROOM_X:
                    self.rect.left = ROOM_X
                elif self.rect.right > ROOM_X+ROOM_W:
                    self.rect.right = ROOM_X+ROOM_W
                if self.rect.top < ROOM_Y:
                    self.rect.top = ROOM_Y
                elif self.rect.bottom > ROOM_Y+ROOM_H:
                    self.rect.bottom = ROOM_Y+ROOM_H
            else:
                if self.explosion:
                    # 爆炸效果
                    explosion_size = 80
                    explosion_surface = pygame.Surface((explosion_size*2, explosion_size*2), pygame.SRCALPHA)
                    for i in range(3):
                        alpha = int(200 * (1 - i/3))
                        radius = explosion_size * (i/3)
                        pygame.draw.circle(explosion_surface, (255, 100, 0, alpha), (explosion_size, explosion_size), int(radius))
                    screen.blit(explosion_surface, (self.rect.centerx - explosion_size, self.rect.centery - explosion_size))
                    
                    for mob in mobs:
                        dx = mob.rect.centerx - self.rect.centerx
                        dy = mob.rect.centery - self.rect.centery
                        if math.hypot(dx, dy) < 80:
                            mob.hp -= self.damage
                            if mob.hp <= 0:
                                player.score += 10
                                spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                                mob.kill()
                self.kill()

class Mob(pygame.sprite.Sprite):
    def __init__(self, mob_type='melee', level=1):
        super().__init__()
        self.mob_type = mob_type
        scale = 1 + (level - 1) * 0.2
        
        if mob_type == 'melee':
            # 优化近战怪物形象为像素风格
            self.image = pygame.Surface((30, 30), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (200, 0, 0), (5, 5, 20, 15))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 0, 0), (10, 10), 2)
            pygame.draw.circle(self.image, (0, 0, 0), (20, 10), 2)
            # 绘制嘴巴
            pygame.draw.line(self.image, (0, 0, 0), (10, 15), (20, 15), 1)
            # 绘制身体
            pygame.draw.rect(self.image, (150, 0, 0), (5, 20, 20, 10))
            # 绘制手臂
            pygame.draw.rect(self.image, (200, 0, 0), (0, 20, 5, 5))
            pygame.draw.rect(self.image, (200, 0, 0), (25, 20, 5, 5))
            self.max_hp = int(150 * scale)  # 调整为合适血量
            self.speed = 2 + (level - 1) * 0.1
            self.base_speed = self.speed
            self.damage = int(10 * scale)
            self.attack_range = 40
            self.attack_cooldown = max(300, 650 - (level - 1) * 30)
        elif mob_type == 'ranged':
            # 绿弹速射怪 - 攻速快、伤害低、远距离射击
            self.image = pygame.Surface((22, 22), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (0, 150, 50), (4, 4, 14, 9))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 0, 0), (8, 7), 2)
            pygame.draw.circle(self.image, (0, 0, 0), (14, 7), 2)
            # 绘制身体
            pygame.draw.rect(self.image, (0, 120, 40), (4, 13, 14, 9))
            # 绘制双枪
            pygame.draw.line(self.image, (100, 100, 100), (0, 15), (-8, 13), 2)
            pygame.draw.line(self.image, (100, 100, 100), (22, 15), (30, 13), 2)
            self.max_hp = int(18 * scale)
            self.speed = 1.8 + (level - 1) * 0.1  # 降低移速
            self.base_speed = self.speed
            self.damage = int(5 * scale)
            self.attack_range = 280  # 增加攻击范围，远距离射击
            self.attack_cooldown = max(150, 350 - (level - 1) * 25)
            self.bullet_color = (0, 255, 100)
        elif mob_type == 'piercer':
            # 黄弹穿透怪 - 子弹可穿透敌人，弹道平直，射程极远
            self.image = pygame.Surface((26, 26), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (150, 150, 0), (5, 5, 16, 10))
            # 绘制眼睛
            pygame.draw.circle(self.image, (255, 255, 255), (9, 8), 2)
            pygame.draw.circle(self.image, (255, 255, 255), (17, 8), 2)
            # 绘制身体
            pygame.draw.rect(self.image, (120, 120, 0), (5, 15, 16, 11))
            # 绘制狙击枪
            pygame.draw.line(self.image, (80, 80, 80), (21, 18), (40, 18), 3)
            pygame.draw.circle(self.image, (255, 200, 0), (40, 18), 4)
            self.max_hp = int(22 * scale)
            self.speed = 1.2 + (level - 1) * 0.08
            self.base_speed = self.speed
            self.damage = int(12 * scale)
            self.attack_range = 500
            self.attack_cooldown = max(600, 1200 - (level - 1) * 50)
            self.bullet_color = (255, 255, 0)
        elif mob_type == 'tracker':
            # 蓝弹追踪怪 - 发射追踪子弹，自动尾随玩家，难躲避
            self.image = pygame.Surface((24, 24), pygame.SRCALPHA)
            # 绘制头部（圆形）
            pygame.draw.circle(self.image, (0, 100, 200), (12, 10), 9)
            # 绘制眼睛（发光蓝色）
            pygame.draw.circle(self.image, (0, 255, 255), (8, 9), 3)
            pygame.draw.circle(self.image, (0, 255, 255), (16, 9), 3)
            # 绘制身体
            pygame.draw.rect(self.image, (0, 80, 160), (6, 19, 12, 5))
            # 绘制发射装置
            pygame.draw.rect(self.image, (0, 150, 255), (12, 15, 8, 4))
            self.max_hp = int(20 * scale)
            self.speed = 1.4 + (level - 1) * 0.1
            self.base_speed = self.speed
            self.damage = int(10 * scale)
            self.attack_range = 280
            self.attack_cooldown = max(800, 1500 - (level - 1) * 60)
            self.bullet_color = (0, 150, 255)
        elif mob_type == 'purple':
            # 紫色弹幕怪 - 喷射大量弹幕
            self.image = pygame.Surface((28, 28), pygame.SRCALPHA)
            # 绘制头部（六边形风格）
            pygame.draw.polygon(self.image, (120, 50, 180), [(14, 2), (24, 8), (24, 20), (14, 26), (4, 20), (4, 8)])
            # 绘制眼睛（紫色发光）
            pygame.draw.circle(self.image, (200, 100, 255), (10, 10), 3)
            pygame.draw.circle(self.image, (200, 100, 255), (18, 10), 3)
            # 绘制身体
            pygame.draw.rect(self.image, (100, 40, 150), (6, 22, 16, 6))
            # 绘制弹幕发射器
            pygame.draw.rect(self.image, (150, 70, 200), (10, 18, 8, 8))
            self.max_hp = int(25 * scale)
            self.speed = 1.3 + (level - 1) * 0.08
            self.base_speed = self.speed
            self.damage = int(6 * scale)
            self.attack_range = 350
            self.attack_cooldown = max(500, 1000 - (level - 1) * 40)
            self.bullet_color = (180, 80, 220)
            self.bullet_pattern = 0  # 弹幕模式切换
        elif mob_type == 'tank':
            # 优化坦克怪物形象为像素风格
            self.image = pygame.Surface((40, 40), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (100, 100, 100), (10, 5, 20, 15))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 0, 0), (15, 10), 3)
            pygame.draw.circle(self.image, (0, 0, 0), (25, 10), 3)
            # 绘制身体
            pygame.draw.rect(self.image, (80, 80, 80), (5, 20, 30, 20))
            # 绘制护甲
            pygame.draw.rect(self.image, (120, 120, 120), (8, 22, 24, 16))
            self.max_hp = int(60 * scale)  # 调整为合适血量
            self.speed = 1.2 + (level - 1) * 0.05
            self.base_speed = self.speed
            self.damage = int(15 * scale)
            self.attack_range = 50
            self.attack_cooldown = max(500, 800 - (level - 1) * 30)
        elif mob_type == 'fast':
            # 优化快速怪物形象为像素风格
            self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (255, 200, 100), (3, 2, 14, 8))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 0, 0), (7, 5), 1)
            pygame.draw.circle(self.image, (0, 0, 0), (13, 5), 1)
            # 绘制身体
            pygame.draw.rect(self.image, (255, 180, 80), (3, 10, 14, 8))
            # 绘制翅膀
            pygame.draw.polygon(self.image, (255, 200, 100), [(0, 12), (3, 10), (3, 14)])
            pygame.draw.polygon(self.image, (255, 200, 100), [(20, 12), (17, 10), (17, 14)])
            self.max_hp = int(15 * scale)  # 调整为合适血量
            self.speed = 3.5 + (level - 1) * 0.2
            self.base_speed = self.speed
            self.damage = int(6 * scale)
            self.attack_range = 35
            self.attack_cooldown = max(200, 500 - (level - 1) * 25)
        elif mob_type == 'laser':
            # 激光怪物
            self.image = pygame.Surface((30, 30), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (0, 100, 200), (5, 5, 20, 15))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 255, 255), (10, 10), 3)
            pygame.draw.circle(self.image, (0, 255, 255), (20, 10), 3)
            # 绘制身体
            pygame.draw.rect(self.image, (0, 80, 150), (5, 20, 20, 10))
            # 绘制激光炮
            pygame.draw.rect(self.image, (0, 200, 255), (10, 15, 10, 5))
            self.max_hp = int(25 * scale)  # 调整为合适血量
            self.speed = 1.0 + (level - 1) * 0.05
            self.base_speed = self.speed
            self.damage = int(12 * scale)
            self.attack_range = 800
            self.attack_cooldown = max(600, 1300 - (level - 1) * 60)
        elif mob_type == 'grenadier':
            # 投掷手怪物 - 爆炸攻击
            self.image = pygame.Surface((28, 28), pygame.SRCALPHA)
            # 绘制头部
            pygame.draw.rect(self.image, (150, 80, 30), (6, 4, 16, 12))
            # 绘制眼睛
            pygame.draw.circle(self.image, (0, 0, 0), (10, 8), 2)
            pygame.draw.circle(self.image, (0, 0, 0), (18, 8), 2)
            # 绘制身体
            pygame.draw.rect(self.image, (120, 60, 20), (6, 16, 16, 12))
            # 绘制背包
            pygame.draw.rect(self.image, (180, 100, 40), (4, 18, 20, 8))
            self.max_hp = int(30 * scale)
            self.speed = 1.3 + (level - 1) * 0.1
            self.base_speed = self.speed
            self.damage = int(15 * scale)
            self.attack_range = 280
            self.attack_cooldown = max(500, 1200 - (level - 1) * 50)
            self.attack_mode = 'normal'  # normal, charged
            self.charge_timer = 0
            self.charging = False
        elif mob_type == 'hunter':
            # 猎人怪物 - 追踪弹攻击
            self.image = pygame.Surface((26, 26), pygame.SRCALPHA)
            # 绘制头部（戴帽子）
            pygame.draw.rect(self.image, (80, 50, 30), (4, 3, 18, 8))
            pygame.draw.polygon(self.image, (60, 40, 20), [(4, 7), (13, 0), (22, 7)])
            # 绘制眼睛
            pygame.draw.circle(self.image, (255, 255, 255), (10, 7), 2)
            pygame.draw.circle(self.image, (255, 255, 255), (16, 7), 2)
            # 绘制身体
            pygame.draw.rect(self.image, (70, 45, 25), (6, 11, 14, 12))
            # 绘制弓箭
            pygame.draw.line(self.image, (100, 80, 60), (20, 15), (32, 15), 2)
            pygame.draw.circle(self.image, (255, 0, 0), (32, 15), 3)
            self.max_hp = int(22 * scale)
            self.speed = 1.6 + (level - 1) * 0.1
            self.base_speed = self.speed
            self.damage = int(10 * scale)
            self.attack_range = 350
            self.attack_cooldown = max(600, 1400 - (level - 1) * 60)
            self.attack_mode = 'normal'  # normal, spread
        
        self.rect = self.image.get_rect()
        self.frozen = 0
        self.rect.x = random.randint(ROOM_X, ROOM_X+ROOM_W-40)
        self.rect.y = random.randint(ROOM_Y, ROOM_Y+ROOM_H-40)
        self.hp = self.max_hp
        self.last_attack = pygame.time.get_ticks()
        self.patrol_target = None
        self.patrol_timer = 0
        self.state = 'patrol'
        # 生命周期管理
        self.spawn_time = pygame.time.get_ticks()
        self.max_lifetime = 30000  # 最大存活时间30秒
        if self.mob_type == 'laser':
            self.aggro_range = 800
        else:
            self.aggro_range = 250
        if self.mob_type == 'laser':
            self.retreat_range = 900
        else:
            self.retreat_range = 350
        
        # 激光攻击相关变量
        self.laser_state = 'idle'  # idle, charging, firing
        self.laser_timer = 0
        self.laser_angle = 0
        self.laser_start = (0, 0)
        self.laser_end = (0, 0)
        self.laser_damage = False
        self.attack_pattern = 0

    def update(self):
        # 生命周期检查
        if pygame.time.get_ticks() - self.spawn_time > self.max_lifetime:
            self.kill()
            return
        
        if self.frozen > 0:
            self.frozen -= 1
            return
        
        # 处理燃烧效果
        if hasattr(self, 'burning') and self.burning > 0:
            self.burning -= 1
            self.hp -= 2  # 燃烧持续伤害
            if self.hp <= 0:
                player.score += 10
                self.kill()
        
        # 处理中毒效果
        if hasattr(self, 'poisoned') and self.poisoned > 0:
            self.poisoned -= 1
            self.hp -= 1  # 中毒持续伤害
            if self.hp <= 0:
                player.score += 10
                self.kill()
        
        # 处理激光攻击状态
        if hasattr(self, 'laser_state') and self.laser_state != 'idle':
            self.laser_timer += 1
            
            if self.laser_state == 'charging':
                # 前摇动画 - 30帧（约0.5秒）
                if self.laser_timer < 30:
                    # 前摇粒子效果
                    if self.laser_timer % 3 == 0:
                        particle = Particle(self.rect.centerx, self.rect.centery, (0, 255, 255), 2, 3, 10)
                        particles.add(particle)
                else:
                    # 进入发射状态
                    self.laser_state = 'firing'
                    self.laser_timer = 0
                    self.laser_damage = True
                    
                    # 激光粒子效果
                    laser_length = 400
                    for i in range(10):
                        particle_x = self.rect.centerx + math.cos(self.laser_angle) * random.randint(0, laser_length)
                        particle_y = self.rect.centery + math.sin(self.laser_angle) * random.randint(0, laser_length)
                        particle = Particle(particle_x, particle_y, (0, 200, 255), 2, 3, 15)
                        particles.add(particle)
            elif self.laser_state == 'firing':
                # 激光发射 - 5帧
                if self.laser_timer >= 5:
                    # 结束激光攻击
                    self.laser_state = 'idle'
                    self.laser_timer = 0
                    self.laser_damage = False
        
        dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx, 
                                    player.rect.centery - self.rect.centery)
        
        # 状态转换
        if dist_to_player < self.aggro_range:
            self.state = 'chase'
        elif dist_to_player > self.retreat_range:
            self.state = 'patrol'
        
        if self.state == 'chase' and (not hasattr(self, 'laser_state') or self.laser_state == 'idle'):
            # 不同类型敌人的追击行为
            if self.mob_type == 'ranged':
                # 远程敌人保持距离
                if dist_to_player < 150:
                    # 后退
                    dx = self.rect.centerx - player.rect.centerx
                    dy = self.rect.centery - player.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.8
                    self.rect.y += dy * self.speed * 0.8
                elif dist_to_player > 250:
                    # 前进
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.6
                    self.rect.y += dy * self.speed * 0.6
            elif self.mob_type == 'tank':
                # 坦克敌人直接冲锋
                dx = player.rect.centerx - self.rect.centerx
                dy = player.rect.centery - self.rect.centery
                if dist_to_player != 0:
                    dx /= dist_to_player
                    dy /= dist_to_player
                self.rect.x += dx * self.speed * 1.2
                self.rect.y += dy * self.speed * 1.2
            elif self.mob_type == 'fast':
                # 快速敌人围绕玩家移动
                angle = math.atan2(player.rect.centery - self.rect.centery, player.rect.centerx - self.rect.centerx)
                circle_angle = angle + math.pi/2
                dx = math.cos(circle_angle) * 100
                dy = math.sin(circle_angle) * 100
                target_x = player.rect.centerx + dx
                target_y = player.rect.centery + dy
                
                dx = target_x - self.rect.centerx
                dy = target_y - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist != 0:
                    dx /= dist
                    dy /= dist
                self.rect.x += dx * self.speed * 1.5
                self.rect.y += dy * self.speed * 1.5
            elif self.mob_type == 'laser':
                # 激光敌人保持距离并攻击
                if dist_to_player > self.attack_range:
                    # 当距离大于攻击范围时，向玩家移动
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed
                    self.rect.y += dy * self.speed
                # 当距离小于等于攻击范围时，停止移动并准备攻击
            elif self.mob_type == 'ranged':
                # 绿弹速射怪 - 保持远距离攻击
                if dist_to_player < 180:
                    # 后退，保持距离
                    dx = self.rect.centerx - player.rect.centerx
                    dy = self.rect.centery - player.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.8
                    self.rect.y += dy * self.speed * 0.8
                elif dist_to_player > 280:
                    # 缓慢前进到攻击范围
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.4
                    self.rect.y += dy * self.speed * 0.4
            elif self.mob_type == 'grenadier':
                # 投掷手保持中等距离
                if dist_to_player < 180:
                    # 后退
                    dx = self.rect.centerx - player.rect.centerx
                    dy = self.rect.centery - player.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.7
                    self.rect.y += dy * self.speed * 0.7
                elif dist_to_player > 280:
                    # 前进
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.5
                    self.rect.y += dy * self.speed * 0.5
            elif self.mob_type == 'hunter':
                # 猎人保持较远的攻击距离
                if dist_to_player < 200:
                    # 后退
                    dx = self.rect.centerx - player.rect.centerx
                    dy = self.rect.centery - player.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.8
                    self.rect.y += dy * self.speed * 0.8
                elif dist_to_player > 350:
                    # 前进
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.6
                    self.rect.y += dy * self.speed * 0.6
            elif self.mob_type == 'purple':
                # 紫色弹幕怪 - 保持中等距离发射弹幕
                if dist_to_player < 200:
                    # 后退
                    dx = self.rect.centerx - player.rect.centerx
                    dy = self.rect.centery - player.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.7
                    self.rect.y += dy * self.speed * 0.7
                elif dist_to_player > 350:
                    # 前进
                    dx = player.rect.centerx - self.rect.centerx
                    dy = player.rect.centery - self.rect.centery
                    if dist_to_player != 0:
                        dx /= dist_to_player
                        dy /= dist_to_player
                    self.rect.x += dx * self.speed * 0.5
                    self.rect.y += dy * self.speed * 0.5
            else:
                # 普通近战敌人
                dx = player.rect.centerx - self.rect.centerx
                dy = player.rect.centery - self.rect.centery
                if dist_to_player != 0:
                    dx /= dist_to_player
                    dy /= dist_to_player
                self.rect.x += dx * self.speed
                self.rect.y += dy * self.speed
            
            if dist_to_player < self.attack_range:
                self.attack()
        
        elif dist_to_player >= self.attack_range:
            self.patrol()
        
        # 边界碰撞检测 - 防止怪物穿过墙体
        if self.rect.left < ROOM_X:
            self.rect.left = ROOM_X
        if self.rect.right > ROOM_X + ROOM_W:
            self.rect.right = ROOM_X + ROOM_W
        if self.rect.top < ROOM_Y:
            self.rect.top = ROOM_Y
        if self.rect.bottom > ROOM_Y + ROOM_H:
            self.rect.bottom = ROOM_Y + ROOM_H

    def patrol(self):
        self.patrol_timer += 1
        if self.patrol_timer > 120 or self.patrol_target is None:
            self.patrol_target = (random.randint(ROOM_X, ROOM_X+ROOM_W),
                                  random.randint(ROOM_Y, ROOM_Y+ROOM_H))
            self.patrol_timer = 0
        
        dx = self.patrol_target[0] - self.rect.centerx
        dy = self.patrol_target[1] - self.rect.centery
        dist = math.hypot(dx, dy)
        if dist > 0:
            dx /= dist
            dy /= dist
        self.rect.x += dx * self.speed * 0.5
        self.rect.y += dy * self.speed * 0.5

    def attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldown:
            self.last_attack = now
            self.attack_pattern = (self.attack_pattern + 1) % 3
            
            if self.mob_type == 'melee':
                # 近战攻击
                player.take_damage(self.damage)
                # 添加攻击特效
                attack_effect = MeleeEffect(self.rect.centerx, self.rect.centery, 
                                          math.atan2(player.rect.centery - self.rect.centery, 
                                                     player.rect.centerx - self.rect.centerx),
                                          self.attack_range)
                all_sprites.add(attack_effect)
                melee_effects.add(attack_effect)
            elif self.mob_type == 'ranged':
                # 绿弹速射怪 - 贴脸疯狂扫射
                angle = math.atan2(player.rect.centery - self.rect.centery,
                                   player.rect.centerx - self.rect.centerx)
                # 三连发速射
                for i in range(3):
                    spread_angle = angle + (i - 1) * 0.1
                    bullet = EnemyBullet(self.rect.centerx, self.rect.centery, spread_angle, self.damage)
                    bullet.color = self.bullet_color
                    bullet.speed = 12
                    all_sprites.add(bullet)
                    enemy_bullets.add(bullet)
            elif self.mob_type == 'piercer':
                # 黄弹穿透怪 - 子弹可穿透敌人，弹道平直，射程极远
                angle = math.atan2(player.rect.centery - self.rect.centery,
                                   player.rect.centerx - self.rect.centerx)
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                bullet.color = self.bullet_color
                bullet.speed = 18  # 极快速度
                bullet.pierce = True
                bullet.pierce_count = 999  # 几乎无限穿透
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            elif self.mob_type == 'tracker':
                # 蓝弹追踪怪 - 发射追踪子弹，自动尾随玩家
                angle = math.atan2(player.rect.centery - self.rect.centery,
                                   player.rect.centerx - self.rect.centerx)
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                bullet.color = self.bullet_color
                bullet.homing = True
                bullet.speed = 5  # 较慢但持续追踪
                bullet.homing_strength = 0.15  # 更强的追踪能力
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            elif self.mob_type == 'purple':
                # 紫色弹幕怪 - 喷射大量弹幕
                self.bullet_pattern = (self.bullet_pattern + 1) % 3
                
                if self.bullet_pattern == 0:
                    # 圆形弹幕 - 向四周发射
                    for i in range(12):
                        angle = i * math.pi * 2 / 12
                        bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                        bullet.color = self.bullet_color
                        bullet.speed = 7
                        all_sprites.add(bullet)
                        enemy_bullets.add(bullet)
                elif self.bullet_pattern == 1:
                    # 螺旋弹幕 - 顺时针旋转发射
                    base_angle = math.atan2(player.rect.centery - self.rect.centery,
                                           player.rect.centerx - self.rect.centerx)
                    for i in range(8):
                        angle = base_angle + i * math.pi / 4 + self.attack_pattern * 0.2
                        bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                        bullet.color = self.bullet_color
                        bullet.speed = 6
                        all_sprites.add(bullet)
                        enemy_bullets.add(bullet)
                else:
                    # 扇形弹幕 - 朝向玩家方向发射扇形弹幕
                    base_angle = math.atan2(player.rect.centery - self.rect.centery,
                                           player.rect.centerx - self.rect.centerx)
                    for i in range(10):
                        angle = base_angle + (i - 5) * 0.12
                        bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                        bullet.color = self.bullet_color
                        bullet.speed = 8
                        all_sprites.add(bullet)
                        enemy_bullets.add(bullet)
            elif self.mob_type == 'tank':
                # 坦克攻击
                player.take_damage(self.damage)
                # 添加冲击波效果
                for i in range(8):
                    angle = i * math.pi / 4
                    bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.5)
                    bullet.speed = 8
                    all_sprites.add(bullet)
                    enemy_bullets.add(bullet)
            elif self.mob_type == 'fast':
                # 快速攻击
                player.take_damage(self.damage)
                # 添加快速攻击特效
                attack_effect = MeleeEffect(self.rect.centerx, self.rect.centery, 
                                          math.atan2(player.rect.centery - self.rect.centery, 
                                                     player.rect.centerx - self.rect.centerx),
                                          self.attack_range)
                attack_effect.max_timer = 5
                all_sprites.add(attack_effect)
                melee_effects.add(attack_effect)
            elif self.mob_type == 'grenadier':
                # 投掷手攻击 - 两种攻击模式
                if self.attack_pattern == 0:
                    # 普通炸弹投掷
                    angle = math.atan2(player.rect.centery - self.rect.centery,
                                       player.rect.centerx - self.rect.centerx)
                    bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                    bullet.explosion = True
                    bullet.speed = 5
                    all_sprites.add(bullet)
                    enemy_bullets.add(bullet)
                else:
                    # 蓄力炸弹（攻击模式切换）
                    angle = math.atan2(player.rect.centery - self.rect.centery,
                                       player.rect.centerx - self.rect.centerx)
                    # 发射三颗炸弹呈扇形
                    for i in range(3):
                        spread_angle = angle + (i - 1) * 0.3
                        bullet = EnemyBullet(self.rect.centerx, self.rect.centery, spread_angle, self.damage * 0.8)
                        bullet.explosion = True
                        bullet.speed = 4
                        all_sprites.add(bullet)
                        enemy_bullets.add(bullet)
            elif self.mob_type == 'hunter':
                # 猎人攻击 - 两种攻击模式
                if self.attack_pattern == 0:
                    # 单发追踪箭
                    angle = math.atan2(player.rect.centery - self.rect.centery,
                                       player.rect.centerx - self.rect.centerx)
                    bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage)
                    bullet.homing = True
                    bullet.speed = 7
                    all_sprites.add(bullet)
                    enemy_bullets.add(bullet)
                else:
                    # 散射射击
                    base_angle = math.atan2(player.rect.centery - self.rect.centery,
                                           player.rect.centerx - self.rect.centerx)
                    for i in range(5):
                        spread_angle = base_angle + (i - 2) * 0.15
                        bullet = EnemyBullet(self.rect.centerx, self.rect.centery, spread_angle, self.damage * 0.6)
                        bullet.speed = 10
                        all_sprites.add(bullet)
                        enemy_bullets.add(bullet)
            elif self.mob_type == 'laser':
                # 激光攻击 - 改为状态机模式，避免阻塞主循环
                angle = math.atan2(player.rect.centery - self.rect.centery, 
                                 player.rect.centerx - self.rect.centerx)
                
                # 开始充电状态
                self.laser_state = 'charging'
                self.laser_timer = 0
                self.laser_angle = angle
                self.laser_start = (self.rect.centerx, self.rect.centery)
                laser_length = 800  # 增加激光长度，从400改为800
                self.laser_end = (self.rect.centerx + math.cos(angle) * laser_length, 
                                self.rect.centery + math.sin(angle) * laser_length)
                self.laser_damage = False

class EnemyBullet(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((10, 10), pygame.SRCALPHA)
        self.color = (200, 100, 200)  # 默认紫色
        pygame.draw.circle(self.image, self.color, (5, 5), 4)
        pygame.draw.circle(self.image, (255, 150, 255), (5, 5), 2)
        self.rect = self.image.get_rect(center=(x,y))
        self.angle = angle  # 保存初始角度
        self.speed = 6  # 默认速度
        self.dx = math.cos(angle) * self.speed
        self.dy = math.sin(angle) * self.speed
        self.damage = damage
        self.homing = False
        self.homing_strength = 0.08  # 默认追踪强度
        self.trail = []
        self.trail_length = 8
        self.pierce = False
        self.pierce_count = 1

    def update(self):
        # 更新轨迹
        self.trail.append((self.rect.centerx, self.rect.centery))
        if len(self.trail) > self.trail_length:
            self.trail.pop(0)
        
        # 绘制轨迹 - 使用自定义颜色
        for i, (x, y) in enumerate(self.trail):
            alpha = int(150 * (i / len(self.trail)))
            size = int(4 * (i / len(self.trail)))
            if size > 0:
                trail_surface = pygame.Surface((size*2, size*2), pygame.SRCALPHA)
                pygame.draw.circle(trail_surface, (self.color[0], self.color[1], self.color[2], alpha), (size, size), size)
                screen.blit(trail_surface, (x - size, y - size))
        
        # 追踪逻辑
        if self.homing:
            if not hasattr(self, 'homing_timer'):
                self.homing_timer = 0
            self.homing_timer += 1
            
            # 半追踪模式：追踪强度随时间递减
            max_homing_frames = 120  # 最大追踪帧数
            if self.homing_timer < max_homing_frames:
                # 计算当前追踪强度（从1.0递减到0）
                strength_ratio = 1.0 - (self.homing_timer / max_homing_frames)
                current_homing_strength = self.homing_strength * strength_ratio
                
                dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx, 
                                           player.rect.centery - self.rect.centery)
                if dist_to_player < 600:
                    angle = math.atan2(player.rect.centery - self.rect.centery, 
                                       player.rect.centerx - self.rect.centerx)
                    current_angle = math.atan2(self.dy, self.dx)
                    angle_diff = angle - current_angle
                    if angle_diff > math.pi:
                        angle_diff -= 2 * math.pi
                    elif angle_diff < -math.pi:
                        angle_diff += 2 * math.pi
                    angle_diff = max(-current_homing_strength, min(current_homing_strength, angle_diff))
                    new_angle = current_angle + angle_diff
                    self.dx = math.cos(new_angle) * self.speed
                    self.dy = math.sin(new_angle) * self.speed
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 碰撞检测 - 使用圆形碰撞更精确，增大范围以检测快速移动的弹幕
        dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                   player.rect.centery - self.rect.centery)
        # 增大碰撞范围到40像素，确保快速弹幕能正确检测到玩家
        collision_range = 40
        if dist_to_player < collision_range:
            if player.stealth or player.invincible:
                return
            player.take_damage(self.damage)
            # 受伤特效
            for i in range(5):
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 100, 100), 2, 4, 10)
                particles.add(particle)
            if not self.pierce:
                self.kill()
            return
        
        # 更新子弹颜色显示
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, self.color, (5, 5), 4)
        pygame.draw.circle(self.image, (255, 255, 255), (5, 5), 2)
        
        if (self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W or 
            self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H):
            self.kill()

class Door(pygame.sprite.Sprite):
    def __init__(self, pos, direction, room_type):
        super().__init__()
        self.direction = direction
        self.room_type = room_type
        self.image = pygame.Surface((60,20))
        if room_type == 'battle':
            self.image.fill(YELLOW)
        elif room_type == 'treasure':
            self.image.fill(GREEN)
        else:
            self.image.fill(CYAN)
        self.rect = self.image.get_rect(center=pos)

    def check_enter(self):
        if self.rect.colliderect(player.rect):
            return True
        return False

class MeleeEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, radius, color_type='normal'):
        super().__init__()
        self.x = x
        self.y = y
        self.radius = radius
        self.angle = angle
        self.timer = 0
        self.max_timer = 20
        self.image = pygame.Surface((radius*3, radius*3), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.particles = []
        
        self.colors = {
            'normal': {'main': (255, 200, 100), 'medium': (255, 230, 150), 'glow': (255, 255, 255), 'blade': (255, 255, 255), 'trail': (200, 150, 50)},
            'fire': {'main': (255, 100, 0), 'medium': (255, 150, 50), 'glow': (255, 200, 100), 'blade': (255, 100, 0), 'trail': (200, 50, 0)},
            'frost': {'main': (100, 200, 255), 'medium': (150, 220, 255), 'glow': (200, 240, 255), 'blade': (100, 200, 255), 'trail': (50, 150, 200)},
            'poison': {'main': (150, 255, 100), 'medium': (180, 255, 150), 'glow': (200, 255, 180), 'blade': (150, 255, 100), 'trail': (100, 200, 50)},
            'light': {'main': (255, 255, 200), 'medium': (255, 255, 230), 'glow': (255, 255, 255), 'blade': (255, 255, 255), 'trail': (255, 255, 150)},
            'shadow': {'main': (150, 100, 200), 'medium': (180, 150, 220), 'glow': (200, 180, 240), 'blade': (150, 100, 200), 'trail': (100, 50, 150)},
            'laser': {'main': (0, 200, 255), 'medium': (50, 220, 255), 'glow': (100, 240, 255), 'blade': (0, 200, 255), 'trail': (0, 150, 200)},
            'axe': {'main': (180, 100, 50), 'medium': (200, 130, 80), 'glow': (220, 150, 100), 'blade': (255, 180, 100), 'trail': (150, 80, 30)},
            'energy': {'main': (100, 150, 255), 'medium': (130, 180, 255), 'glow': (150, 200, 255), 'blade': (50, 100, 255), 'trail': (50, 100, 200)}
        }
        self.color = self.colors.get(color_type, self.colors['normal'])
        
        # 生成攻击粒子
        for i in range(25):
            particle_angle = angle + (i - 7) * 0.22
            particle_speed = random.uniform(6, 12)
            self.particles.append({
                'x': 0,
                'y': 0,
                'dx': math.cos(particle_angle) * particle_speed,
                'dy': math.sin(particle_angle) * particle_speed,
                'life': 1.0,
                'size': random.uniform(3, 7),
                'trail': []
            })
    def update(self):
        self.timer += 1
        alpha = int(200 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        
        center_x = self.x - self.rect.left
        center_y = self.y - self.rect.top
        
        # 计算挥砍进度（从0到1）
        swing_progress = self.timer / self.max_timer
        
        # 绘制挥砍轨迹 - 带有动态效果
        for i in range(6):
            # 动态调整角度范围，让挥砍看起来更流畅
            angle_offset = -1.2 + swing_progress * 2.4 + i * 0.25
            current_angle = self.angle + angle_offset
            end_x = center_x + math.cos(current_angle) * self.radius
            end_y = center_y + math.sin(current_angle) * self.radius
            
            # 根据进度调整透明度，让轨迹更加自然
            trail_alpha = int(alpha * (1 - i * 0.15))
            
            # 使用对应武器颜色
            main_color = self.color['main'] + (trail_alpha,)
            medium_color = self.color['medium'] + (trail_alpha // 2,)
            glow_color = self.color['glow'] + (trail_alpha // 4,)
            
            pygame.draw.line(self.image, glow_color, (center_x, center_y), (end_x, end_y), 14 - i)
            pygame.draw.line(self.image, medium_color, (center_x, center_y), (end_x, end_y), 10 - i)
            pygame.draw.line(self.image, main_color, (center_x, center_y), (end_x, end_y), 6 - i)
        
        # 绘制剑刃光芒效果（在攻击中点时最亮）
        if swing_progress > 0.3 and swing_progress < 0.7:
            blade_alpha = int(255 * (1 - abs(swing_progress - 0.5) * 2))
            blade_angle = self.angle - 1.2 + swing_progress * 2.4
            blade_end_x = center_x + math.cos(blade_angle) * self.radius
            blade_end_y = center_y + math.sin(blade_angle) * self.radius
            blade_color = self.color['blade'] + (blade_alpha,)
            pygame.draw.line(self.image, blade_color, (center_x, center_y), (blade_end_x, blade_end_y), 3)
        
        # 绘制粒子效果
        for particle in self.particles:
            particle['x'] += particle['dx']
            particle['y'] += particle['dy']
            particle['life'] -= 0.05
            
            # 添加粒子拖尾效果
            particle['trail'].append((particle['x'], particle['y']))
            if len(particle['trail']) > 5:
                particle['trail'].pop(0)
            
            if particle['life'] > 0:
                size = int(particle['size'] * particle['life'])
                particle_alpha = int(200 * particle['life'])
                particle_x = center_x + int(particle['x'])
                particle_y = center_y + int(particle['y'])
                
                # 绘制粒子拖尾
                for j, (tx, ty) in enumerate(particle['trail']):
                    trail_x = center_x + int(tx)
                    trail_y = center_y + int(ty)
                    trail_size = int(size * (j + 1) / len(particle['trail']))
                    trail_alpha = int(particle_alpha * (j + 1) / len(particle['trail']))
                    glow_color = self.color['glow'] + (trail_alpha // 3,)
                    pygame.draw.circle(self.image, glow_color, (trail_x, trail_y), trail_size + 1)
                
                # 粒子外圈光晕和核心
                glow_color = self.color['glow'] + (particle_alpha // 2,)
                main_color = self.color['main'] + (particle_alpha,)
                pygame.draw.circle(self.image, glow_color, (particle_x, particle_y), size + 2)
                pygame.draw.circle(self.image, main_color, (particle_x, particle_y), size)
        
        # 绘制中心光芒
        if self.timer < 8:
            glow_radius = int(20 * (1 - self.timer / 8))
            main_color = self.color['main'] + (alpha // 2,)
            pygame.draw.circle(self.image, main_color, (center_x, center_y), glow_radius)
        
        # 近战攻击挡子弹功能
        if swing_progress > 0.2 and swing_progress < 0.8:  # 攻击挥砍过程中可以挡子弹
            for bullet in enemy_bullets:
                # 计算子弹到攻击中心的距离
                dx = bullet.rect.centerx - self.x
                dy = bullet.rect.centery - self.y
                dist = math.hypot(dx, dy)
                
                # 检查子弹是否在攻击范围内
                if dist < self.radius + 10:
                    # 计算子弹与攻击方向的角度差
                    bullet_angle = math.atan2(dy, dx)
                    angle_diff = abs(bullet_angle - self.angle)
                    # 标准化角度差
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    
                    # 在攻击角度范围内可以挡住子弹
                    if angle_diff < 1.5:  # 约86度范围
                        # 挡子弹成功，销毁子弹并产生特效
                        bullet.kill()
                        
                        # 生成亮光特效 - 类似双节棍的挡弹效果
                        # 中心亮光
                        for i in range(3):
                            glow_surface = pygame.Surface((40 + i * 20, 40 + i * 20), pygame.SRCALPHA)
                            alpha = int(200 - i * 60)
                            pygame.draw.circle(glow_surface, (255, 255, 255, alpha), 
                                              (20 + i * 10, 20 + i * 10), 20 + i * 10)
                            screen.blit(glow_surface, (bullet.rect.centerx - 20 - i * 10, 
                                                      bullet.rect.centery - 20 - i * 10))
                        
                        # 生成反弹粒子
                        for i in range(10):
                            angle = random.uniform(0, 2 * math.pi)
                            speed = random.uniform(3, 6)
                            particle = Particle(
                                bullet.rect.centerx,
                                bullet.rect.centery,
                                (255, 255, 200),
                                random.uniform(4, 8),
                                speed,
                                random.randint(10, 15)
                            )
                            particle.dx = math.cos(angle) * speed
                            particle.dy = math.sin(angle) * speed
                            particles.add(particle)
        
        if self.timer >= self.max_timer:
            self.kill()

class SpinEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, radius):
        super().__init__()
        self.x = x
        self.y = y
        self.radius = radius
        self.timer = 0
        self.max_timer = 25
        self.image = pygame.Surface((radius*2.8, radius*2.8), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.particles = []
        for _ in range(15):
            self.particles.append({
                'angle': random.uniform(0, math.pi * 2),
                'distance': random.uniform(0.3, 0.9) * radius,
                'speed': random.uniform(2, 4),
                'size': random.uniform(3, 6),
                'life': 1.0
            })
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        progress = self.timer / self.max_timer
        alpha = int(255 * (1 - progress * 0.7))
        rotation = self.timer * 0.4
        pulse_scale = 1 + math.sin(self.timer * 0.3) * 0.1
        
        center_x = self.image.get_width() // 2
        center_y = self.image.get_height() // 2
        
        for i in range(4):
            ring_radius = self.radius * (0.4 + i * 0.25) * pulse_scale
            ring_alpha = int(alpha * (1 - i * 0.2))
            
            pygame.draw.circle(self.image, (50, 100, 200, ring_alpha // 4), (center_x, center_y), int(ring_radius), 12)
            pygame.draw.circle(self.image, (100, 150, 255, ring_alpha // 3), (center_x, center_y), int(ring_radius), 8)
            pygame.draw.circle(self.image, (150, 200, 255, ring_alpha // 2), (center_x, center_y), int(ring_radius), 4)
            pygame.draw.circle(self.image, (200, 230, 255, ring_alpha), (center_x, center_y), int(ring_radius), 2)
        
        for i in range(12):
            spike_angle = rotation + i * (math.pi * 2 / 12)
            spike_length = self.radius * (0.7 + progress * 0.3) * pulse_scale
            end_x = center_x + math.cos(spike_angle) * spike_length
            end_y = center_y + math.sin(spike_angle) * spike_length
            mid_x = center_x + math.cos(spike_angle) * spike_length * 0.5
            mid_y = center_y + math.sin(spike_angle) * spike_length * 0.5
            
            spike_alpha = int(alpha * (1 - progress * 0.4))
            pygame.draw.line(self.image, (255, 180, 50, spike_alpha), (center_x, center_y), (end_x, end_y), 5)
            pygame.draw.line(self.image, (255, 220, 100, spike_alpha // 2), (center_x, center_y), (end_x, end_y), 3)
            pygame.draw.line(self.image, (255, 255, 255, spike_alpha // 3), (mid_x, mid_y), (end_x, end_y), 2)
            
            tip_alpha = int(alpha * 0.8)
            pygame.draw.circle(self.image, (255, 255, 255, tip_alpha), (int(end_x), int(end_y)), 4)
            pygame.draw.circle(self.image, (255, 200, 100, tip_alpha // 2), (int(end_x), int(end_y)), 7)
        
        for particle in self.particles:
            particle['angle'] += 0.05
            particle['distance'] += particle['speed']
            particle['life'] -= 0.03
            
            if particle['life'] > 0 and particle['distance'] < self.radius * 1.5:
                px = center_x + math.cos(particle['angle']) * particle['distance']
                py = center_y + math.sin(particle['angle']) * particle['distance']
                p_alpha = int(200 * particle['life'])
                p_size = int(particle['size'] * particle['life'])
                
                pygame.draw.circle(self.image, (200, 220, 255, p_alpha // 2), (int(px), int(py)), p_size + 3)
                pygame.draw.circle(self.image, (150, 180, 255, p_alpha), (int(px), int(py)), p_size)
        
        center_glow_radius = int(15 * (1 + progress * 0.5))
        center_alpha = int(200 * (1 - progress))
        pygame.draw.circle(self.image, (100, 150, 255, center_alpha // 3), (center_x, center_y), center_glow_radius)
        pygame.draw.circle(self.image, (150, 200, 255, center_alpha // 2), (center_x, center_y), center_glow_radius // 2)
        pygame.draw.circle(self.image, (200, 230, 255, center_alpha), (center_x, center_y), center_glow_radius // 4)
        
        if self.timer >= self.max_timer:
            self.kill()

class GrappleHookEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, range_val):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.range = range_val
        self.timer = 0
        self.max_timer = 12
        self.image = pygame.Surface((range_val * 2, range_val * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.hook_pos = 0
        self.trail_points = []
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        center_x = self.image.get_width() // 2
        center_y = self.image.get_height() // 2
        
        self.hook_pos = min(self.range, self.hook_pos + 25)
        
        hook_x = center_x + math.cos(self.angle) * self.hook_pos
        hook_y = center_y + math.sin(self.angle) * self.hook_pos
        
        self.trail_points.append((hook_x, hook_y))
        if len(self.trail_points) > 8:
            self.trail_points.pop(0)
        
        for i, (tx, ty) in enumerate(self.trail_points):
            trail_alpha = int(150 * (i / len(self.trail_points)))
            trail_width = 2 + i
            pygame.draw.circle(self.image, (200, 150, 100, trail_alpha), (int(tx), int(ty)), trail_width)
        
        pygame.draw.line(self.image, (80, 80, 80, 200), (center_x, center_y), (hook_x, hook_y), 4)
        pygame.draw.line(self.image, (120, 120, 120, 150), (center_x, center_y), (hook_x, hook_y), 2)
        pygame.draw.line(self.image, (180, 180, 180, 100), (center_x, center_y), (hook_x, hook_y), 1)
        
        hook_size = 14
        pygame.draw.circle(self.image, (80, 80, 80), (int(hook_x), int(hook_y)), hook_size + 4)
        pygame.draw.circle(self.image, (150, 150, 150), (int(hook_x), int(hook_y)), hook_size)
        pygame.draw.circle(self.image, (200, 200, 200), (int(hook_x), int(hook_y)), hook_size - 4)
        pygame.draw.circle(self.image, (255, 255, 255), (int(hook_x), int(hook_y)), 4)
        pygame.draw.circle(self.image, (255, 200, 100, 150), (int(hook_x), int(hook_y)), hook_size + 7)
        
        pygame.draw.circle(self.image, (255, 255, 255, 100), (int(hook_x), int(hook_y)), hook_size + 10)
        
        if self.timer >= self.max_timer:
            self.kill()

class ShadowStepEffect(pygame.sprite.Sprite):
    def __init__(self, start_x, start_y, end_x, end_y):
        super().__init__()
        self.start_x = start_x
        self.start_y = start_y
        self.end_x = end_x
        self.end_y = end_y
        self.timer = 0
        self.max_timer = 18
        self.image = pygame.Surface((120, 120), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(start_x, start_y))
        self.particles = []
        for _ in range(20):
            self.particles.append({
                'angle': random.uniform(0, math.pi * 2),
                'distance': random.uniform(10, 40),
                'speed': random.uniform(1, 3),
                'size': random.uniform(2, 5),
                'life': 1.0
            })
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        progress = self.timer / self.max_timer
        alpha = int(255 * (1 - progress * 0.8))
        pulse_scale = 1 + math.sin(self.timer * 0.5) * 0.15
        
        center_x = self.image.get_width() // 2
        center_y = self.image.get_height() // 2
        
        for i in range(5):
            ring_radius = int((25 + i * 12) * pulse_scale)
            ring_alpha = int(alpha * (1 - i * 0.18))
            
            pygame.draw.circle(self.image, (30, 10, 60, ring_alpha // 3), (center_x, center_y), ring_radius, 3)
            pygame.draw.circle(self.image, (60, 20, 100, ring_alpha // 2), (center_x, center_y), ring_radius, 2)
            pygame.draw.circle(self.image, (100, 40, 150, ring_alpha), (center_x, center_y), ring_radius, 1)
        
        for particle in self.particles:
            particle['distance'] += particle['speed']
            particle['life'] -= 0.04
            particle['angle'] += 0.02
            
            if particle['life'] > 0 and particle['distance'] < 70:
                px = center_x + math.cos(particle['angle']) * particle['distance']
                py = center_y + math.sin(particle['angle']) * particle['distance']
                p_alpha = int(180 * particle['life'])
                p_size = int(particle['size'] * particle['life'])
                
                pygame.draw.circle(self.image, (80, 40, 150, p_alpha // 2), (int(px), int(py)), p_size + 2)
                pygame.draw.circle(self.image, (120, 60, 200, p_alpha), (int(px), int(py)), p_size)
        
        if progress < 0.6:
            fade_alpha = int(200 * (1 - progress * 1.6))
            inner_radius = int(25 * (1 - progress * 0.5))
            
            pygame.draw.circle(self.image, (20, 10, 40, fade_alpha), (center_x, center_y), inner_radius + 15)
            pygame.draw.circle(self.image, (40, 20, 80, fade_alpha // 2), (center_x, center_y), inner_radius)
        
        glow_radius = int(40 * (1 + progress * 0.5))
        glow_alpha = int(100 * (1 - progress))
        pygame.draw.circle(self.image, (150, 100, 200, glow_alpha // 3), (center_x, center_y), glow_radius)
        
        if self.timer >= self.max_timer:
            self.kill()

class TeleportSlashEffect(pygame.sprite.Sprite):
    def __init__(self, start_x, start_y, end_x, end_y):
        super().__init__()
        self.start_x = start_x
        self.start_y = start_y
        self.end_x = end_x
        self.end_y = end_y
        self.timer = 0
        self.max_timer = 12
        self.image = pygame.Surface((100, 100), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(start_x, start_y))
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        progress = self.timer / self.max_timer
        alpha = int(255 * (1 - progress))
        
        center_x = self.image.get_width() // 2
        center_y = self.image.get_height() // 2
        
        for i in range(4):
            ring_radius = 20 + i * 10
            ring_alpha = int(alpha * (1 - i * 0.2))
            pygame.draw.circle(self.image, (200, 200, 255, ring_alpha // 2), (center_x, center_y), ring_radius, 2)
            pygame.draw.circle(self.image, (150, 150, 255, ring_alpha), (center_x, center_y), ring_radius, 1)
        
        if progress < 0.5:
            fade_alpha = int(200 * (1 - progress * 2))
            pygame.draw.circle(self.image, (100, 100, 200, fade_alpha), (center_x, center_y), 15)
        
        if self.timer >= self.max_timer:
            self.kill()

class BlackHole(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, speed, damage, attract_range):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.speed = speed
        self.damage = damage
        self.attract_range = attract_range
        self.timer = 0
        self.max_timer = 120
        self.image = pygame.Surface((attract_range * 2, attract_range * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        
    def update(self):
        self.timer += 1
        
        self.x += math.cos(self.angle) * self.speed
        self.y += math.sin(self.angle) * self.speed
        
        if self.x < ROOM_X or self.x > ROOM_X + ROOM_W or \
           self.y < ROOM_Y or self.y > ROOM_Y + ROOM_H:
            self.kill()
            return
        
        self.rect.center = (self.x, self.y)
        self.image.fill((0, 0, 0, 0))
        
        center_x = self.image.get_width() // 2
        center_y = self.image.get_height() // 2
        
        pulse_scale = 1 + math.sin(self.timer * 0.1) * 0.1
        
        for i in range(4):
            ring_radius = int((20 + i * 30) * pulse_scale)
            ring_alpha = int(100 - i * 20)
            pygame.draw.circle(self.image, (30, 10, 60, ring_alpha), (center_x, center_y), ring_radius, 2)
        
        pygame.draw.circle(self.image, (0, 0, 0), (center_x, center_y), 15)
        pygame.draw.circle(self.image, (20, 10, 40), (center_x, center_y), 12)
        pygame.draw.circle(self.image, (40, 20, 80), (center_x, center_y), 8)
        pygame.draw.circle(self.image, (255, 255, 255, 50), (center_x, center_y), 5)
        
        for mob in mobs:
            dx = self.x - mob.rect.centerx
            dy = self.y - mob.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= self.attract_range and dist > 15:
                force = (1 - dist / self.attract_range) * 2
                mob.rect.x += (dx / dist) * force
                mob.rect.y += (dy / dist) * force
                if dist < 50:
                    mob.hp -= self.damage * 0.1
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        for boss in bosses:
            dx = self.x - boss.rect.centerx
            dy = self.y - boss.rect.centery
            dist = math.hypot(dx, dy)
            if dist <= self.attract_range and dist > 15:
                force = (1 - dist / self.attract_range) * 0.5
                boss.rect.x += (dx / dist) * force
                boss.rect.y += (dy / dist) * force
        
        if self.timer >= self.max_timer:
            self.kill()

class SplitBullet(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, speed, split_count, split_angle):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.damage = damage
        self.speed = speed
        self.split_count = split_count
        self.split_angle = split_angle
        self.timer = 0
        self.split_timer = 60
        self.has_split = False
        self.size = 8
        self.image = pygame.Surface((self.size * 2, self.size * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        
    def update(self):
        self.timer += 1
        
        self.x += math.cos(self.angle) * self.speed
        self.y += math.sin(self.angle) * self.speed
        
        if self.x < ROOM_X - 50 or self.x > ROOM_X + ROOM_W + 50 or \
           self.y < ROOM_Y - 50 or self.y > ROOM_Y + ROOM_H + 50:
            self.kill()
            return
        
        self.rect.center = (self.x, self.y)
        self.image.fill((0, 0, 0, 0))
        
        pygame.draw.circle(self.image, (100, 150, 255), (self.size, self.size), self.size)
        pygame.draw.circle(self.image, (150, 200, 255), (self.size, self.size), self.size - 3)
        pygame.draw.circle(self.image, (200, 230, 255), (self.size, self.size), self.size - 5)
        
        if self.timer >= self.split_timer and not self.has_split:
            self.has_split = True
            for i in range(self.split_count):
                offset_angle = (i - (self.split_count - 1) / 2) * self.split_angle
                new_bullet = SplitBullet(self.x, self.y, self.angle + offset_angle, 
                                       self.damage * 0.7, self.speed, 0, 0)
                new_bullet.has_split = True
                all_sprites.add(new_bullet)
                bullets.add(new_bullet)
            self.kill()
        
        if self.timer >= 200:
            self.kill()

class SwingEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, radius):
        super().__init__()
        self.x = x
        self.y = y
        self.radius = radius
        self.angle = angle
        self.timer = 0
        self.max_timer = 18
        self.image = pygame.Surface((radius*3, radius*3), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.particles = []
        # 生成挥砍粒子
        for i in range(15):
            particle_angle = angle + (i - 7) * 0.2
            particle_speed = random.uniform(8, 15)
            self.particles.append({
                'x': 0,
                'y': 0,
                'dx': math.cos(particle_angle) * particle_speed,
                'dy': math.sin(particle_angle) * particle_speed,
                'life': 1.0,
                'size': random.uniform(4, 7)
            })
        
    def update(self):
        self.timer += 1
        alpha = int(200 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        
        center_x = self.x - self.rect.left
        center_y = self.y - self.rect.top
        
        # 绘制挥砍轨迹
        for i in range(5):
            swing_angle = self.angle - 1.0 + (self.timer / self.max_timer) * 2.0 + i * 0.3
            end_x = center_x + math.cos(swing_angle) * self.radius
            end_y = center_y + math.sin(swing_angle) * self.radius
            # 外层光晕
            pygame.draw.line(self.image, (255, 255, 255, alpha // 3), (center_x, center_y), (end_x, end_y), 12 - i)
            # 主攻击线
            pygame.draw.line(self.image, (255, 200, 100, alpha), (center_x, center_y), (end_x, end_y), 8 - i)
        
        # 绘制粒子效果
        for particle in self.particles:
            particle['x'] += particle['dx']
            particle['y'] += particle['dy']
            particle['life'] -= 0.05
            if particle['life'] > 0:
                size = int(particle['size'] * particle['life'])
                particle_alpha = int(200 * particle['life'])
                particle_x = center_x + int(particle['x'])
                particle_y = center_y + int(particle['y'])
                # 粒子外圈光晕
                pygame.draw.circle(self.image, (255, 255, 255, particle_alpha // 2), (particle_x, particle_y), size + 2)
                # 粒子核心
                pygame.draw.circle(self.image, (255, 200, 100, particle_alpha), (particle_x, particle_y), size)
        
        # 绘制中心光芒
        if self.timer < 6:
            glow_radius = int(25 * (1 - self.timer / 6))
            pygame.draw.circle(self.image, (255, 200, 100, alpha // 2), (center_x, center_y), glow_radius)
        
        if self.timer >= self.max_timer:
            self.kill()

class SwingChargeEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, radius, charge_level):
        super().__init__()
        self.x = x
        self.y = y
        self.radius = radius
        self.angle = angle
        self.charge_level = charge_level
        self.timer = 0
        self.max_timer = 20 + charge_level * 3
        self.image = pygame.Surface((radius*3, radius*3), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        
    def update(self):
        self.timer += 1
        alpha = int(220 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        
        gold_color = (255, 215, 0)
        for i in range(3 + self.charge_level):
            swing_angle = self.angle - 1.2 + (self.timer / self.max_timer) * 2.4 + i * 0.25
            start_x = self.x - self.rect.left
            start_y = self.y - self.rect.top
            end_x = start_x + math.cos(swing_angle) * self.radius
            end_y = start_y + math.sin(swing_angle) * self.radius
            width = 8 - i if i < 3 else 2
            pygame.draw.line(self.image, (*gold_color, alpha), (start_x, start_y), (end_x, end_y), width)
        
        for i in range(2 + self.charge_level):
            arc_angle = self.angle - 0.8 + (self.timer / self.max_timer) * 1.6
            arc_radius = self.radius * (0.5 + i * 0.2)
            center_arc_x = self.x - self.rect.left + math.cos(arc_angle) * arc_radius * 0.3
            center_arc_y = self.y - self.rect.top + math.sin(arc_angle) * arc_radius * 0.3
            pygame.draw.circle(self.image, (*gold_color, alpha // 2), (int(center_arc_x), int(center_arc_y)), 5 + i * 3, 2)
        
        if self.timer >= self.max_timer:
            self.kill()

class GoldenWave(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, max_dist, charge_level, delay):
        super().__init__()
        self.x = x
        self.y = y
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.damage = damage
        self.max_dist = max_dist
        self.charge_level = charge_level
        self.delay = delay
        self.timer = 0
        self.max_timer = 60
        self.speed = 12
        self.radius = 50 + charge_level * 12
        self.image = pygame.Surface((self.radius * 2 + 40, self.radius * 2 + 40), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.hit_mobs = []
        self.pierce = True
        self.infinite_range = True
        self.explosion = False
        
    def update(self):
        self.timer += 1
        if self.timer < self.delay:
            return
        
        travel_time = self.timer - self.delay
        self.x = self.start_x + math.cos(self.angle) * self.speed * travel_time
        self.y = self.start_y + math.sin(self.angle) * self.speed * travel_time
        self.rect.center = (self.x, self.y)
        
        self.image.fill((0, 0, 0, 0))
        
        alpha = int(200 * (1 - travel_time / 500))
        if alpha < 0:
            alpha = 0
        
        gold_color = (255, 215, 0)
        center = (self.image.get_width() // 2, self.image.get_height() // 2)
        
        start_angle = -self.angle - 1.2
        end_angle = -self.angle + 1.2
        arc_rect = pygame.Rect(0, 0, self.radius * 2, self.radius * 2)
        pygame.draw.arc(self.image, (*gold_color, alpha // 2), arc_rect, start_angle, end_angle, 8)
        pygame.draw.arc(self.image, (*gold_color, alpha), arc_rect, start_angle, end_angle, 4)
        
        for mob in mobs:
            if mob not in self.hit_mobs:
                dx = mob.rect.centerx - self.x
                dy = mob.rect.centery - self.y
                dist = math.hypot(dx, dy)
                angle_to_mob = math.atan2(dy, dx)
                angle_diff = abs(angle_to_mob - self.angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if dist < self.radius + mob.rect.width // 2 and angle_diff < 1.3:
                    mob.hp -= self.damage
                    self.hit_mobs.append(mob)
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        global wave_completed, room_cleared
        for boss in bosses:
            if boss not in self.hit_mobs:
                dx = boss.rect.centerx - self.x
                dy = boss.rect.centery - self.y
                dist = math.hypot(dx, dy)
                angle_to_boss = math.atan2(dy, dx)
                angle_diff = abs(angle_to_boss - self.angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if dist < self.radius + boss.rect.width // 2 and angle_diff < 1.3:
                    boss.hp -= self.damage
                    self.hit_mobs.append(boss)
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True

class EnergyWave(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.damage = damage
        self.timer = 0
        self.max_timer = 40
        self.speed = 15
        self.radius = 30
        self.image = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.hit_mobs = []
        self.pierce = True
        self.explosion = False
        self.infinite_range = True
        
    def update(self):
        self.timer += 1
        if self.timer >= self.max_timer:
            self.kill()
            return
        
        self.x = self.start_x + math.cos(self.angle) * self.speed * self.timer
        self.y = self.start_y + math.sin(self.angle) * self.speed * self.timer
        self.rect.center = (self.x, self.y)
        
        alpha = int(255 * (1 - self.timer / self.max_timer))
        
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (100, 150, 255, alpha), (self.radius, self.radius), self.radius)
        pygame.draw.circle(self.image, (150, 200, 255, alpha), (self.radius, self.radius), self.radius // 2)
        
        for mob in mobs:
            if mob not in self.hit_mobs:
                dx = mob.rect.centerx - self.x
                dy = mob.rect.centery - self.y
                dist = math.hypot(dx, dy)
                if dist < self.radius + mob.rect.width // 2:
                    mob.hp -= self.damage
                    self.hit_mobs.append(mob)
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        global wave_completed, room_cleared
        for boss in bosses:
            if boss not in self.hit_mobs:
                dx = boss.rect.centerx - self.x
                dy = boss.rect.centery - self.y
                dist = math.hypot(dx, dy)
                if dist < self.radius + boss.rect.width // 2:
                    boss.hp -= self.damage
                    self.hit_mobs.append(boss)
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True

class CurryWave(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, max_dist, radius=180):
        super().__init__()
        self.x = x
        self.y = y
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.damage = damage
        self.max_dist = max_dist
        self.timer = 0
        self.max_timer = 60
        self.speed = 8
        self.radius = radius
        self.image = pygame.Surface((self.radius * 2 + 40, self.radius * 2 + 40), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.hit_mobs = []
        self.pierce = True
        self.explosion = False
        self.infinite_range = True
        
    def update(self):
        self.timer += 1
        
        travel_time = self.timer
        self.x = self.start_x + math.cos(self.angle) * self.speed * travel_time
        self.y = self.start_y + math.sin(self.angle) * self.speed * travel_time
        self.rect.center = (self.x, self.y)
        
        dist = math.hypot(self.x - self.start_x, self.y - self.start_y)
        if dist > self.max_dist:
            self.kill()
            return
        
        self.image.fill((0, 0, 0, 0))
        
        alpha = int(200 * (1 - travel_time / 500))
        if alpha < 0:
            alpha = 0
        
        gold_color = (255, 215, 0)
        center = (self.image.get_width() // 2, self.image.get_height() // 2)
        
        start_angle = -self.angle - 1.2
        end_angle = -self.angle + 1.2
        arc_rect = pygame.Rect(0, 0, self.radius * 2, self.radius * 2)
        pygame.draw.arc(self.image, (*gold_color, alpha // 2), arc_rect, start_angle, end_angle, 8)
        pygame.draw.arc(self.image, (*gold_color, alpha), arc_rect, start_angle, end_angle, 4)
        
        for mob in mobs:
            if mob not in self.hit_mobs:
                dx = mob.rect.centerx - self.x
                dy = mob.rect.centery - self.y
                dist = math.hypot(dx, dy)
                angle_to_mob = math.atan2(dy, dx)
                angle_diff = abs(angle_to_mob - self.angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if dist < self.radius + mob.rect.width // 2 and angle_diff < 1.3:
                    mob.hp -= self.damage
                    self.hit_mobs.append(mob)
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
        
        global wave_completed, room_cleared
        for boss in bosses:
            if boss not in self.hit_mobs:
                dx = boss.rect.centerx - self.x
                dy = boss.rect.centery - self.y
                dist = math.hypot(dx, dy)
                angle_to_boss = math.atan2(dy, dx)
                angle_diff = abs(angle_to_boss - self.angle)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if dist < self.radius + boss.rect.width // 2 and angle_diff < 1.3:
                    boss.hp -= self.damage
                    self.hit_mobs.append(boss)
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
                        wave_completed = True
                        room_cleared = True

class BlackKnightEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, radius):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.radius = radius
        self.timer = 0
        self.max_timer = 15
        self.image = pygame.Surface((radius*2, radius*2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        
    def update(self):
        self.timer += 1
        alpha = int(180 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        
        center = (self.radius, self.radius)
        start_angle = self.angle - 1.0
        end_angle = self.angle + 1.0
        arc_rect = pygame.Rect(0, 0, self.radius * 2, self.radius * 2)
        pygame.draw.arc(self.image, (80, 80, 80, alpha), arc_rect, start_angle, end_angle, 10)
        
        for i in range(5):
            line_angle = self.angle - 0.8 + (self.timer / self.max_timer) * 1.6 + i * 0.2
            end_x = center[0] + math.cos(line_angle) * self.radius
            end_y = center[1] + math.sin(line_angle) * self.radius
            pygame.draw.line(self.image, (100, 100, 100, alpha), center, (end_x, end_y), 4)
        
        if self.timer >= self.max_timer:
            self.kill()

class BlackOrb(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.damage = damage
        self.speed = 15
        self.max_dist = 99999
        size = 25
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (30, 30, 30), (size//2, size//2), size//2)
        pygame.draw.circle(self.image, (60, 60, 60), (size//2, size//2), size//2 - 4)
        pygame.draw.circle(self.image, (100, 100, 100), (size//2, size//2), size//2 - 8)
        self.rect = self.image.get_rect(center=(x, y))
        self.hit_mobs = []
        self.pierce = True
        self.explosion = False
        self.infinite_range = True
        
    def update(self):
        self.x += math.cos(self.angle) * self.speed
        self.y += math.sin(self.angle) * self.speed
        self.rect.center = (self.x, self.y)
        
        for mob in mobs:
            if mob not in self.hit_mobs and self.rect.colliderect(mob.rect):
                mob.hp -= self.damage
                self.hit_mobs.append(mob)
                if mob.hp <= 0:
                    player.score += 10
                    spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                    mob.kill()
        
        for boss in bosses:
            if boss not in self.hit_mobs and self.rect.colliderect(boss.rect):
                boss.hp -= self.damage
                self.hit_mobs.append(boss)
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()

class GroundSword(pygame.sprite.Sprite):
    def __init__(self, x, y, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 30
        self.rise_start = 10
        width = 40
        height = 120
        self.image = pygame.Surface((width, height), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y - height//2))
        
    def update(self):
        self.timer += 1
        
        self.image.fill((0, 0, 0, 0))
        
        if self.timer >= self.rise_start:
            progress = (self.timer - self.rise_start) / (self.max_timer - self.rise_start)
            alpha = int(200 * (1 - progress))
            
            center_x = self.rect.width // 2
            base_y = self.rect.height
            
            pygame.draw.polygon(self.image, (40, 40, 40, alpha), [
                (center_x, 0),
                (center_x - 15, base_y),
                (center_x + 15, base_y)
            ])
            pygame.draw.polygon(self.image, (80, 80, 80, alpha), [
                (center_x, 10),
                (center_x - 10, base_y - 10),
                (center_x + 10, base_y - 10)
            ])
            
            for mob in mobs:
                dx = abs(mob.rect.centerx - self.x)
                dy = abs(mob.rect.centery - (self.y - self.rect.height // 2))
                if dx < 25 and dy < self.rect.height // 2:
                    mob.hp -= self.damage // 10
                    if mob.hp <= 0:
                        player.score += 10
                        spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                        mob.kill()
            
            for boss in bosses:
                dx = abs(boss.rect.centerx - self.x)
                dy = abs(boss.rect.centery - (self.y - self.rect.height // 2))
                if dx < 40 and dy < self.rect.height // 2:
                    boss.hp -= self.damage // 10
                    if boss.hp <= 0:
                        player.score += 500
                        player.gold += 200
                        spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                        boss.kill()
        
        if self.timer >= self.max_timer:
            self.kill()

class LaserEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, length=400, width=6):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.damage = damage
        self.length = length
        self.width = width
        self.timer = 0
        self.max_timer = 8
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        self.hit_mobs = []
        self.hit_bosses = []
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        end_x = self.x + math.cos(self.angle) * self.length
        end_y = self.y + math.sin(self.angle) * self.length
        alpha = int(180 * (1 - self.timer / self.max_timer))
        pygame.draw.line(self.image, (255, 0, 255, alpha), (self.x, self.y), (end_x, end_y), self.width)
        pygame.draw.line(self.image, (255, 255, 255, alpha), (self.x, self.y), (end_x, end_y), max(2, self.width // 3))
        
        width_factor = self.width / 6
        angle_threshold = 0.3 * width_factor
        
        for mob in mobs:
            if mob not in self.hit_mobs:
                dx = mob.rect.centerx - self.x
                dy = mob.rect.centery - self.y
                angle_to_mob = math.atan2(dy, dx)
                angle_diff = abs(self.angle - angle_to_mob)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < angle_threshold:
                    dist = math.hypot(dx, dy)
                    if dist < self.length:
                        mob.hp -= self.damage
                        self.hit_mobs.append(mob)
                        if mob.hp <= 0:
                            player.score += 10
                            spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                            mob.kill()
        
        for boss in bosses:
            if boss not in self.hit_bosses:
                dx = boss.rect.centerx - self.x
                dy = boss.rect.centery - self.y
                angle_to_boss = math.atan2(dy, dx)
                angle_diff = abs(self.angle - angle_to_boss)
                if angle_diff > math.pi:
                    angle_diff = 2 * math.pi - angle_diff
                if angle_diff < angle_threshold:
                    dist = math.hypot(dx, dy)
                    if dist < self.length:
                        # 护甲机制：破绽期护甲降低，常态护甲减伤
                        if boss.vulnerable:
                            # 破绽期：伤害翻倍
                            damage_dealt = self.damage * 2
                        else:
                            # 常态：护甲减伤30%
                            damage_dealt = int(self.damage * (1 - boss.armor))
                        boss.hp -= damage_dealt
                        self.hit_bosses.append(boss)
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            global wave_completed, room_cleared
                            wave_completed = True
                            room_cleared = True
        if self.timer >= self.max_timer:
            self.kill()

class RainbowHorseLaser(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage, max_dist):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.damage = damage
        self.max_dist = max_dist
        self.timer = 0
        self.max_timer = 6
        self.reflected = False
        self.reflect_x = None
        self.reflect_y = None
        self.reflect_angle = 0
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        self.hit_mobs = []
        self.hit_bosses = []
        self.pierce = True
        self.boomerang = False
        self.explosion = False
        self.wall_x = None
        self.wall_y = None
        
    def update(self):
        global wave_completed, room_cleared
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        colors = [(255, 0, 0), (255, 127, 0), (255, 255, 0), (0, 255, 0), (0, 0, 255), (148, 0, 211)]
        alpha = int(200 * (1 - self.timer / self.max_timer))
        
        laser_len = 2000
        end_x = self.x + math.cos(self.angle) * laser_len
        end_y = self.y + math.sin(self.angle) * laser_len
        
        wx, wy = None, None
        if end_x < 0:
            wy = self.y + (0 - self.x) * math.tan(self.angle)
            if 0 <= wy <= HEIGHT:
                wx, wy = 0, wy
        elif end_x > WIDTH:
            wy = self.y + (WIDTH - self.x) * math.tan(self.angle)
            if 0 <= wy <= HEIGHT:
                wx, wy = WIDTH, wy
        
        if wy is None:
            if end_y < 0:
                wx = self.x + (0 - self.y) / math.tan(self.angle) if math.tan(self.angle) != 0 else self.x
                if 0 <= wx <= WIDTH:
                    wx, wy = wx, 0
            elif end_y > HEIGHT:
                wx = self.x + (HEIGHT - self.y) / math.tan(self.angle) if math.tan(self.angle) != 0 else self.x
                if 0 <= wx <= WIDTH:
                    wx, wy = wx, HEIGHT
        
        if wx is not None and wy is not None:
            self.reflected = True
            self.wall_x, self.wall_y = wx, wy
            if wx == 0 or wx == WIDTH:
                self.reflect_angle = math.pi - self.angle
                self.reflect_x, self.reflect_y = wx, wy
            else:
                self.reflect_angle = -self.angle
                self.reflect_x, self.reflect_y = wx, wy
        
        if not self.reflected:
            # 绘制彩虹激光
            pygame.draw.line(self.image, (255, 255, 255, alpha // 2), (int(self.x), int(self.y)), (int(end_x), int(end_y)), 8)
            pygame.draw.line(self.image, (255, 127, 0, alpha), (int(self.x), int(self.y)), (int(end_x), int(end_y)), 4)
        else:
            # 绘制主激光
            pygame.draw.line(self.image, (255, 255, 255, alpha // 2), (int(self.x), int(self.y)), (int(self.wall_x), int(self.wall_y)), 8)
            pygame.draw.line(self.image, (255, 127, 0, alpha), (int(self.x), int(self.y)), (int(self.wall_x), int(self.wall_y)), 4)
            ref_end_x = self.reflect_x + math.cos(self.reflect_angle) * 2000
            ref_end_y = self.reflect_y + math.sin(self.reflect_angle) * 2000
            # 绘制反射激光
            pygame.draw.line(self.image, (255, 255, 255, alpha // 2), (int(self.reflect_x), int(self.reflect_y)), (int(ref_end_x), int(ref_end_y)), 8)
            pygame.draw.line(self.image, (255, 127, 0, alpha), (int(self.reflect_x), int(self.reflect_y)), (int(ref_end_x), int(ref_end_y)), 4)
        
        for mob in mobs:
            if mob not in self.hit_mobs:
                dx = mob.rect.centerx - self.x
                dy = mob.rect.centery - self.y
                dist = math.hypot(dx, dy)
                if dist < 2000:
                    angle_to_mob = math.atan2(dy, dx)
                    angle_diff = abs(angle_to_mob - self.angle)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < 0.3:
                        mob.hp -= self.damage
                        self.hit_mobs.append(mob)
                        if mob.hp <= 0:
                            player.score += 10
                            spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                            mob.kill()
                elif self.reflected:
                    dx_ref = mob.rect.centerx - self.reflect_x
                    dy_ref = mob.rect.centery - self.reflect_y
                    dist_ref = math.hypot(dx_ref, dy_ref)
                    if dist_ref < 2000:
                        angle_to_mob_ref = math.atan2(dy_ref, dx_ref)
                        angle_diff_ref = abs(angle_to_mob_ref - self.reflect_angle)
                        if angle_diff_ref > math.pi:
                            angle_diff_ref = 2 * math.pi - angle_diff_ref
                        if angle_diff_ref < 0.3:
                            mob.hp -= self.damage
                            self.hit_mobs.append(mob)
                            if mob.hp <= 0:
                                player.score += 10
                                spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                                mob.kill()
        
        for boss in bosses:
            if boss not in self.hit_bosses:
                dx = boss.rect.centerx - self.x
                dy = boss.rect.centery - self.y
                dist = math.hypot(dx, dy)
                if dist < 2000:
                    angle_to_boss = math.atan2(dy, dx)
                    angle_diff = abs(angle_to_boss - self.angle)
                    if angle_diff > math.pi:
                        angle_diff = 2 * math.pi - angle_diff
                    if angle_diff < 0.3:
                        boss.hp -= self.damage
                        self.hit_bosses.append(boss)
                        if boss.hp <= 0:
                            player.score += 500
                            player.gold += 200
                            spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                            boss.kill()
                            wave_completed = True
                            room_cleared = True
                elif self.reflected:
                    dx_ref = boss.rect.centerx - self.reflect_x
                    dy_ref = boss.rect.centery - self.reflect_y
                    dist_ref = math.hypot(dx_ref, dy_ref)
                    if dist_ref < 2000:
                        angle_to_boss_ref = math.atan2(dy_ref, dx_ref)
                        angle_diff_ref = abs(angle_to_boss_ref - self.reflect_angle)
                        if angle_diff_ref > math.pi:
                            angle_diff_ref = 2 * math.pi - angle_diff_ref
                        if angle_diff_ref < 0.3:
                            boss.hp -= self.damage
                            self.hit_bosses.append(boss)
                            if boss.hp <= 0:
                                player.score += 500
                                player.gold += 200
                                spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                                boss.kill()
                                wave_completed = True
                                room_cleared = True
        
        if self.timer >= self.max_timer:
            self.kill()

class ChainEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.damage = damage
        self.timer = 0
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        self.max_timer = 15
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        for _ in range(5):
            rx = self.x + random.randint(-150, 150)
            ry = self.y + random.randint(-150, 150)
            alpha = int(200 * (1 - self.timer / self.max_timer))
            pygame.draw.line(self.image, (0, 255, 255, alpha), (self.x, self.y), (rx, ry), 2)
        if self.timer >= self.max_timer:
            self.kill()

class AOEEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.damage = damage
        self.timer = 0
        self.max_timer = 20
        self.radius = 0
        self.max_radius = 200
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        self.radius = self.max_radius * (self.timer / self.max_timer)
        alpha = int(150 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (255, 165, 0, alpha), (self.x, self.y), int(self.radius), 3)
        if self.timer >= self.max_timer:
            self.kill()

class GravityEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 30
        self.radius = 0
        self.max_radius = 200
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        self.radius = self.max_radius * (self.timer / self.max_timer)
        alpha = int(120 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (100, 50, 150, alpha), (self.x, self.y), int(self.radius), 3)
        if self.timer >= self.max_timer:
            self.kill()

class AuraEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, max_radius):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 30
        self.radius = 0
        self.max_radius = max_radius
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        self.radius = self.max_radius * (self.timer / self.max_timer)
        alpha = int(150 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (255, 215, 0, alpha), (self.x, self.y), int(self.radius), 3)
        if self.timer >= self.max_timer:
            self.kill()

class RollEffect(pygame.sprite.Sprite):
    def __init__(self, start_x, start_y, end_x, end_y, duration=200):
        super().__init__()
        self.start_x = start_x
        self.start_y = start_y
        self.end_x = end_x
        self.end_y = end_y
        self.timer = 0
        self.duration = duration
        self.max_timer = duration // 50
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        self.image.fill((0, 0, 0, 0))
        
        progress = self.timer / self.max_timer
        current_x = self.start_x + (self.end_x - self.start_x) * progress
        current_y = self.start_y + (self.end_y - self.start_y) * progress
        
        alpha = int(200 * (1 - progress))
        trail_length = 20
        for i in range(5):
            t = i / 5
            trail_x = self.start_x + (current_x - self.start_x) * t
            trail_y = self.start_y + (current_y - self.start_y) * t
            size = 8 + i * 2
            pygame.draw.circle(self.image, (100, 200, 255, alpha // (i + 1)), (int(trail_x), int(trail_y)), size)
        
        if self.timer >= self.max_timer:
            player.invincible = False
            player.invincible_timer = 0
            self.kill()

class ShadowDashEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, duration=5000, speed_bonus=1.5, damage_multiplier=3.0, buff_duration=3000, exit_speed_bonus=1.3, exit_speed_duration=3000):
        super().__init__()
        self.x = x
        self.y = y
        self.timer = 0
        self.duration = duration
        self.max_timer = duration // 50 if duration > 0 else float('inf')
        self.speed_bonus = speed_bonus
        self.damage_multiplier = damage_multiplier
        self.buff_duration = buff_duration
        self.exit_speed_bonus = exit_speed_bonus
        self.exit_speed_duration = exit_speed_duration
        self.original_speed = player.speed
        self.player_invisible = True
        
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        
        if player.stealth:
            player.speed = self.original_speed * self.speed_bonus
            
        if (self.duration > 0 and self.timer >= self.max_timer) or not player.stealth:
            player.stealth = False
            player.stealth_timer = 0
            player.invincible = False
            player.speed = self.original_speed
            
            if not player.damage_buff:
                player.damage_buff = True
                player.damage_buff_timer = self.buff_duration
                player.damage_multiplier = self.damage_multiplier
                
            self.kill()
            return
            
        self.image.fill((0, 0, 0, 0))
        
        center_x, center_y = player.rect.centerx, player.rect.centery
        alpha = int(80 * (0.5 + 0.5 * math.sin(self.timer * 0.1)))
        
        pygame.draw.circle(self.image, (50, 50, 80, alpha), (center_x, center_y), 45, 2)
        pygame.draw.circle(self.image, (30, 30, 60, alpha // 2), (center_x, center_y), 60, 1)

class InvincibleEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, duration=5000):
        super().__init__()
        self.x = x
        self.y = y
        self.timer = 0
        self.max_timer = duration // 50
        self.shield_radius = 50
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        if self.timer >= self.max_timer:
            player.invincible = False
            player.invincible_timer = 0
            self.kill()
            return
            
        alpha = int(180 * (1 - self.timer / self.max_timer))
        pulse = int(10 + 15 * math.sin(self.timer * 0.2))
        
        self.image.fill((0, 0, 0, 0))
        
        center_x, center_y = player.rect.centerx, player.rect.centery
        current_radius = self.shield_radius + pulse
        
        pygame.draw.circle(self.image, (0, 150, 255, alpha), (center_x, center_y), current_radius, 4)
        pygame.draw.circle(self.image, (50, 200, 255, alpha // 2), (center_x, center_y), current_radius + 8, 2)
        pygame.draw.circle(self.image, (100, 220, 255, alpha // 3), (center_x, center_y), current_radius + 16, 1)
        
        for bullet in enemy_bullets:
            dx = bullet.rect.centerx - center_x
            dy = bullet.rect.centery - center_y
            dist = math.hypot(dx, dy)
            if dist < current_radius + bullet.rect.width // 2:
                bullet.kill()

class ShieldEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, shield_amount, duration=3000):
        super().__init__()
        self.x = x
        self.y = y
        self.shield_amount = shield_amount
        self.timer = 0
        self.max_timer = duration // 50
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        alpha = int(100 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        radius = 40 + math.sin(self.timer * 0.1) * 10
        pygame.draw.circle(self.image, (255, 255, 200, alpha), (self.x, self.y), int(radius), 3)
        pygame.draw.circle(self.image, (200, 200, 150, alpha // 2), (self.x, self.y), int(radius * 1.3), 2)
        if self.timer >= self.max_timer:
            self.kill()

class ThunderEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, range_value):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.range = range_value
        self.timer = 0
        self.max_timer = 15
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        alpha = int(255 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        for i in range(5):  # 增加闪电数量
            offset_x = random.randint(-30, 30)
            # 增加闪电宽度和效果
            pygame.draw.line(self.image, (255, 255, 255, alpha), (self.x + offset_x, 0), (self.x + offset_x, self.y), 2)
            pygame.draw.line(self.image, (255, 255, 0, alpha), (self.x + offset_x, 0), (self.x + offset_x, self.y), 4)
            # 添加分支闪电
            if i % 2 == 0:
                for j in range(3):
                    branch_x = self.x + offset_x + random.randint(-20, 20)
                    branch_y = random.randint(0, self.y)
                    pygame.draw.line(self.image, (255, 255, 0, alpha // 2), (self.x + offset_x, branch_y), (branch_x, branch_y + random.randint(10, 50)), 2)
        if self.timer >= self.max_timer:
            self.kill()

class IceFieldEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, max_radius, duration=2000):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = duration // 50
        self.radius = 0
        self.max_radius = max_radius
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        if self.timer < self.max_timer // 2:
            self.radius = self.max_radius * (self.timer / (self.max_timer // 2))
        else:
            self.radius = self.max_radius
        alpha = int(120 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (100, 200, 255, alpha), (self.x, self.y), int(self.radius), 2)
        pygame.draw.circle(self.image, (50, 150, 255, alpha // 2), (self.x, self.y), int(self.radius * 0.7), 2)
        if self.timer >= self.max_timer:
            self.kill()

class CloneEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, duration=10000, speed=2.5, attack_range=100):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.speed = speed
        self.attack_range = attack_range
        self.timer = 0
        self.max_timer = duration // 50
        self.target = None
        weapon_name = player.weapons[player.current_weapon]
        self.weapon_type = weapon_name
        self.weapon_data = player.weapon_data[weapon_name]
        self.shoot_timer = 0
        
        self.image = pygame.Surface((36, 40), pygame.SRCALPHA)
        
        body_color = (120, 180, 255)
        glow_color = (180, 220, 255)
        
        pygame.draw.circle(self.image, body_color, (18, 10), 8)
        
        pygame.draw.polygon(self.image, body_color, [(18, 18), (8, 38), (28, 38)])
        
        pygame.draw.circle(self.image, glow_color, (18, 10), 5)
        pygame.draw.circle(self.image, (200, 240, 255), (18, 10), 2)
        
        pygame.draw.line(self.image, glow_color, (22, 14), (35, 8), 2)
        
        pygame.draw.circle(self.image, (200, 230, 255, 150), (18, 20), 12, 1)
        
        self.rect = self.image.get_rect(center=(x, y))
        
    def find_target(self):
        closest_dist = float('inf')
        self.target = None
        
        for mob in mobs:
            dx = mob.rect.centerx - self.rect.centerx
            dy = mob.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist < closest_dist:
                closest_dist = dist
                self.target = mob
                
        if self.target is None:
            for boss in bosses:
                dx = boss.rect.centerx - self.rect.centerx
                dy = boss.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                if dist < closest_dist:
                    closest_dist = dist
                    self.target = boss
        
    def shoot(self):
        if self.target:
            dx = self.target.rect.centerx - self.rect.centerx
            dy = self.target.rect.centery - self.rect.centery
            angle = math.atan2(dy, dx)
            
            data = self.weapon_data
            damage = data.get('damage', 20)
            bullet_speed = data.get('bullet_speed', 10)
            count = data.get('count', 1)
            spread = data.get('spread', 0)
            
            for i in range(count):
                bullet_angle = angle + (random.random() - 0.5) * spread * 2
                bullet = Bullet(
                    self.rect.centerx, 
                    self.rect.centery, 
                    bullet_angle, 
                    damage,
                    bullet_speed,
                    self.weapon_type
                )
                all_sprites.add(bullet)
                bullets.add(bullet)
        
    def update(self):
        self.timer += 1
        self.shoot_timer += 1
        
        if self.timer % 10 == 0:
            self.find_target()
        
        if self.target:
            if hasattr(self.target, 'hp') and self.target.hp > 0:
                dx = self.target.rect.centerx - self.rect.centerx
                dy = self.target.rect.centery - self.rect.centery
                dist = math.hypot(dx, dy)
                
                if dist > self.attack_range:
                    speed_factor = self.speed / dist
                    self.rect.x += dx * speed_factor
                    self.rect.y += dy * speed_factor
                else:
                    base_cooldown = self.weapon_data.get('cooldown', 500)
                    shoot_interval = max(100, base_cooldown // 4)
                    if self.shoot_timer >= shoot_interval:
                        self.shoot()
                        self.shoot_timer = 0
            else:
                self.find_target()
        
        for boss in bosses:
            dx = boss.rect.centerx - self.rect.centerx
            dy = boss.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist < self.attack_range:
                boss.hp -= self.damage / 5
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
        
        if self.timer >= self.max_timer:
            self.kill()

class TimeSlowEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, duration=3000, slow_factor=0.4):
        super().__init__()
        self.x = x
        self.y = y
        self.range = 350
        self.timer = 0
        self.max_timer = duration // 50
        self.slow_factor = slow_factor
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        alpha = int(80 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        # 绘制多层圆形效果
        for i in range(3):
            radius = self.range * (1 + i * 0.2)
            pygame.draw.circle(self.image, (200, 200, 255, alpha // (i + 1)), (self.x, self.y), int(radius), 2)
        # 添加脉动效果
        pulse = 1 + math.sin(self.timer * 0.2) * 0.1
        pygame.draw.circle(self.image, (100, 100, 255, alpha // 2), (self.x, self.y), int(self.range * pulse), 1)
        if self.timer >= self.max_timer:
            for mob in mobs:
                mob.speed = mob.base_speed
            for boss in bosses:
                boss.speed = boss.base_speed
            for bullet in enemy_bullets:
                if hasattr(bullet, 'base_dx') and hasattr(bullet, 'base_dy'):
                    bullet.dx = bullet.base_dx
                    bullet.dy = bullet.base_dy
                elif hasattr(bullet, 'base_speed'):
                    bullet.speed = bullet.base_speed
            self.kill()

class HealFieldEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, range_value, duration=2500, heal_amount=40, tick_interval=500):
        super().__init__()
        self.x = x
        self.y = y
        self.range = range_value
        self.timer = 0
        self.max_timer = duration // 50
        self.radius = 0
        self.max_radius = range_value
        self.heal_amount = heal_amount
        self.tick_interval = tick_interval // 50
        self.last_heal = 0
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        if self.timer < self.max_timer // 2:
            self.radius = self.max_radius * (self.timer / (self.max_timer // 2))
        else:
            self.radius = self.max_radius
        alpha = int(150 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        # 绘制多层圆形效果
        for i in range(3):
            radius = self.radius * (0.6 + i * 0.2)
            pygame.draw.circle(self.image, (0, 255, 100, alpha // (i + 1)), (self.x, self.y), int(radius), 3)
        # 添加脉动效果
        pulse = 1 + math.sin(self.timer * 0.3) * 0.1
        pygame.draw.circle(self.image, (0, 200, 80, alpha // 2), (self.x, self.y), int(self.radius * pulse), 2)
        # 添加治愈粒子效果
        if self.timer % 5 == 0:
            for i in range(3):
                angle = random.uniform(0, math.pi * 2)
                particle_x = self.x + math.cos(angle) * self.radius
                particle_y = self.y + math.sin(angle) * self.radius
                pygame.draw.circle(self.image, (0, 255, 150, alpha), (int(particle_x), int(particle_y)), 3)
        # 持续治疗效果
        if self.timer - self.last_heal >= self.tick_interval:
            self.last_heal = self.timer
            dx = player.rect.centerx - self.x
            dy = player.rect.centery - self.y
            dist = math.hypot(dx, dy)
            if dist < self.radius:
                player.hp = min(player.max_hp, player.hp + self.heal_amount // (self.max_timer // self.tick_interval))
        if self.timer >= self.max_timer:
            self.kill()

class Particle(pygame.sprite.Sprite):
    def __init__(self, x, y, color, size, speed, lifetime):
        super().__init__()
        self.image = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.color = color
        self.size = size
        self.speed = speed
        self.lifetime = lifetime
        self.timer = 0
        angle = random.uniform(0, math.pi * 2)
        self.dx = math.cos(angle) * speed
        self.dy = math.sin(angle) * speed
    
    def update(self):
        self.timer += 1
        if self.timer >= self.lifetime:
            self.kill()
            return
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 绘制粒子
        alpha = int(255 * (1 - self.timer / self.lifetime))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (self.color[0], self.color[1], self.color[2], alpha), (self.size, self.size), self.size)

class FlameEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.dx = math.cos(angle) * 15
        self.dy = math.sin(angle) * 15
        self.damage = damage
        self.timer = 30
        self.max_timer = 30
        self.size = 20
        self.hit_mobs = []
        self.pierce = False  # 添加pierce属性
        self.boomerang = False  # 添加boomerang属性
    def update(self):
        self.timer -= 1
        if self.timer <= 0:
            self.kill()
        
        # 绘制火焰效果
        self.image.fill((0, 0, 0, 0))
        alpha = int(255 * (self.timer / self.max_timer))
        size = int(self.size * (self.timer / self.max_timer))
        
        # 绘制火焰核心
        pygame.draw.circle(self.image, (255, 100, 0, alpha), (10, 10), size // 2)
        # 绘制火焰外层
        pygame.draw.circle(self.image, (255, 200, 0, alpha // 2), (10, 10), size)
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 碰撞检测
        for mob in mobs:
            if self.rect.colliderect(mob.rect) and mob not in self.hit_mobs:
                self.hit_mobs.append(mob)
                mob.hp -= self.damage
                # 添加燃烧效果
                if not hasattr(mob, 'burning'):
                    mob.burning = 0
                mob.burning = 10
                if mob.hp <= 0:
                    player.score += 10
                    mob.kill()
        
        for boss in bosses:
            if self.rect.colliderect(boss.rect) and boss not in self.hit_mobs:
                self.hit_mobs.append(boss)
                boss.hp -= self.damage
                # 添加燃烧效果
                if not hasattr(boss, 'burning'):
                    boss.burning = 0
                boss.burning = 10
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
                    wave_completed = True
                    room_cleared = True
        
        if (self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W or 
            self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H):
            self.kill()

class FrostEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.dx = math.cos(angle) * 15
        self.dy = math.sin(angle) * 15
        self.damage = damage
        self.timer = 30
        self.max_timer = 30
        self.size = 20
        self.hit_mobs = []
    def update(self):
        self.timer -= 1
        if self.timer <= 0:
            self.kill()
        
        # 绘制冰霜效果
        self.image.fill((0, 0, 0, 0))
        alpha = int(255 * (self.timer / self.max_timer))
        size = int(self.size * (self.timer / self.max_timer))
        
        # 绘制冰霜核心
        pygame.draw.circle(self.image, (0, 100, 255, alpha), (10, 10), size // 2)
        # 绘制冰霜外层
        pygame.draw.circle(self.image, (100, 200, 255, alpha // 2), (10, 10), size)
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 碰撞检测
        for mob in mobs:
            if self.rect.colliderect(mob.rect) and mob not in self.hit_mobs:
                self.hit_mobs.append(mob)
                mob.hp -= self.damage
                # 添加冰冻效果
                mob.frozen = 30
                if mob.hp <= 0:
                    player.score += 10
                    mob.kill()
        
        for boss in bosses:
            if self.rect.colliderect(boss.rect) and boss not in self.hit_mobs:
                self.hit_mobs.append(boss)
                boss.hp -= self.damage
                # 添加冰冻效果
                boss.frozen = 20
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
                    wave_completed = True
                    room_cleared = True
        
        if (self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W or 
            self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H):
            self.kill()

class PoisonEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.dx = math.cos(angle) * 15
        self.dy = math.sin(angle) * 15
        self.damage = damage
        self.timer = 30
        self.max_timer = 30
        self.size = 20
        self.hit_mobs = []
    def update(self):
        self.timer -= 1
        if self.timer <= 0:
            self.kill()
        
        # 绘制毒液效果
        self.image.fill((0, 0, 0, 0))
        alpha = int(255 * (self.timer / self.max_timer))
        size = int(self.size * (self.timer / self.max_timer))
        
        # 绘制毒液核心
        pygame.draw.circle(self.image, (0, 150, 100, alpha), (10, 10), size // 2)
        # 绘制毒液外层
        pygame.draw.circle(self.image, (0, 200, 150, alpha // 2), (10, 10), size)
        
        self.rect.x += self.dx
        self.rect.y += self.dy
        
        # 碰撞检测
        for mob in mobs:
            if self.rect.colliderect(mob.rect) and mob not in self.hit_mobs:
                self.hit_mobs.append(mob)
                mob.hp -= self.damage
                # 添加中毒效果
                if not hasattr(mob, 'poisoned'):
                    mob.poisoned = 0
                mob.poisoned = 15
                if mob.hp <= 0:
                    player.score += 10
                    mob.kill()
        
        for boss in bosses:
            if self.rect.colliderect(boss.rect) and boss not in self.hit_mobs:
                self.hit_mobs.append(boss)
                boss.hp -= self.damage
                # 添加中毒效果
                if not hasattr(boss, 'poisoned'):
                    boss.poisoned = 0
                boss.poisoned = 15
                if boss.hp <= 0:
                    player.score += 500
                    player.gold += 200
                    spawn_pickups(boss.rect.centerx, boss.rect.centery, 10)
                    boss.kill()
                    wave_completed = True
                    room_cleared = True
        
        if (self.rect.left < ROOM_X or self.rect.right > ROOM_X+ROOM_W or 
            self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y+ROOM_H):
            self.kill()

class FlameThrowerEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, range_value, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.angle = angle
        self.range = range_value
        self.damage = damage
        self.timer = 0
        self.max_timer = 10
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        self.particles = []
        # 生成火焰粒子
        for i in range(20):
            particle_angle = angle + (random.random() - 0.5) * 0.6
            particle_speed = random.uniform(5, 15)
            self.particles.append({
                'x': 0,
                'y': 0,
                'dx': math.cos(particle_angle) * particle_speed,
                'dy': math.sin(particle_angle) * particle_speed,
                'life': 1.0,
                'size': random.uniform(5, 15)
            })
    def update(self):
        self.timer += 1
        alpha = int(200 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        
        # 绘制火焰喷射效果
        end_x = self.x + math.cos(self.angle) * self.range
        end_y = self.y + math.sin(self.angle) * self.range
        
        # 绘制火焰主体
        flame_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        pygame.draw.line(flame_surface, (255, 100, 0, alpha), (self.x, self.y), (end_x, end_y), 30)
        pygame.draw.line(flame_surface, (255, 200, 0, alpha // 2), (self.x, self.y), (end_x, end_y), 15)
        screen.blit(flame_surface, (0, 0))
        
        # 绘制火焰粒子
        for particle in self.particles:
            particle['x'] += particle['dx']
            particle['y'] += particle['dy']
            particle['life'] -= 0.05
            if particle['life'] > 0:
                size = int(particle['size'] * particle['life'])
                particle_alpha = int(200 * particle['life'])
                particle_x = self.x + particle['x']
                particle_y = self.y + particle['y']
                pygame.draw.circle(flame_surface, (255, 150, 0, particle_alpha), (int(particle_x), int(particle_y)), size)
        screen.blit(flame_surface, (0, 0))
        
        if self.timer >= self.max_timer:
            self.kill()

class BlackHoleEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 60
        self.radius = 0
        self.max_radius = 250
        self.image = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        self.rect = self.image.get_rect()
        
    def update(self):
        self.timer += 1
        
        for mob in mobs:
            dx = mob.rect.centerx - self.x
            dy = mob.rect.centery - self.y
            dist = math.hypot(dx, dy)
            if dist < self.radius:
                pull_strength = (self.radius - dist) / self.radius * 3
                mob.rect.x += dx / dist * pull_strength
                mob.rect.y += dy / dist * pull_strength
                mob.hp -= self.damage / 10
                if mob.hp <= 0:
                    player.score += 10
                    mob.kill()
        
        if self.timer < 30:
            self.radius = self.max_radius * (self.timer / 30)
        else:
            self.radius = self.max_radius * (1 - (self.timer - 30) / 30)
        alpha = int(200 * (1 - self.timer / self.max_timer))
        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (50, 0, 50, alpha), (self.x, self.y), int(self.radius), 2)
        pygame.draw.circle(self.image, (100, 0, 100, alpha), (self.x, self.y), int(self.radius * 0.5), 3)
        if self.timer >= self.max_timer:
            self.kill()

class Pickup(pygame.sprite.Sprite):
    def __init__(self, x, y, pickup_type):
        super().__init__()
        self.pickup_type = pickup_type
        if pickup_type == 'gold':
            self.image = pygame.Surface((15,15))
            self.image.fill(YELLOW)
            self.value = 10
        elif pickup_type == 'health':
            self.image = pygame.Surface((15,15))
            self.image.fill(RED)
            self.value = 30
        elif pickup_type == 'mana':
            self.image = pygame.Surface((15,15))
            self.image.fill(BLUE)
            self.value = 30
        self.rect = self.image.get_rect(center=(x,y))

    def update(self):
        if self.rect.colliderect(player.rect):
            # 创建拾取闪光粒子效果
            for i in range(12):
                angle = random.uniform(0, math.pi * 2)
                speed = random.uniform(2, 5)
                color = YELLOW if self.pickup_type == 'gold' else (GREEN if self.pickup_type == 'health' else BLUE)
                particle = Particle(
                    self.rect.centerx,
                    self.rect.centery,
                    color,
                    random.uniform(2, 4),
                    speed,
                    random.randint(8, 15)
                )
                particles.add(particle)
            
            if self.pickup_type == 'gold':
                player.gold += self.value
                player.score += self.value
            elif self.pickup_type == 'health':
                player.hp = min(player.max_hp, player.hp + self.value)
            elif self.pickup_type == 'mana':
                player.mp = min(player.max_mp, player.mp + self.value)
            self.kill()

class Boss(pygame.sprite.Sprite):
    def __init__(self, boss_level=1):
        super().__init__()
        scale = 1 + (boss_level - 1) * 0.3
        
        # Boss 形象 - 像素风格
        self.image = pygame.Surface((100, 100), pygame.SRCALPHA)
        # 主体
        pygame.draw.rect(self.image, (80, 20, 100), (10, 20, 80, 70))
        # 眼睛
        pygame.draw.circle(self.image, (255, 0, 255), (35, 40), 10)
        pygame.draw.circle(self.image, (255, 0, 255), (65, 40), 10)
        pygame.draw.circle(self.image, (0, 0, 0), (35, 40), 5)
        pygame.draw.circle(self.image, (0, 0, 0), (65, 40), 5)
        # 角
        pygame.draw.polygon(self.image, (150, 50, 150), [(50, 0), (40, 15), (60, 15)])
        # 护甲
        pygame.draw.rect(self.image, (120, 80, 150), (20, 30, 60, 40), 3)
        # 发光效果
        glow_surface = pygame.Surface((100, 100), pygame.SRCALPHA)
        pygame.draw.circle(glow_surface, (150, 50, 200, 40), (50, 50), 50)
        self.image.blit(glow_surface, (0, 0))
        
        # 出生位置
        corners = [
            (ROOM_X + 80, ROOM_Y + 80),
            (ROOM_X + ROOM_W - 80, ROOM_Y + 80),
            (ROOM_X + 80, ROOM_Y + ROOM_H - 80),
            (ROOM_X + ROOM_W - 80, ROOM_Y + ROOM_H - 80)
        ]
        spawn_pos = random.choice(corners)
        self.rect = self.image.get_rect(center=spawn_pos)
        self.frozen = 0
        
        # Boss 属性 - 调整为慢速低伤害配置
        self.max_hp = int(1000 * scale)
        self.hp = self.max_hp
        self.speed = 1.2 + (boss_level - 1) * 0.1  # 降低基础速度
        self.base_speed = self.speed
        self.damage = int(4 * scale)  # 进一步降低基础伤害
        self.base_damage = self.damage
        self.attack_recovery = False  # 近战攻击后恢复状态
        self.attack_recovery_timer = 0  # 攻击后停顿计时器
        self.armor = 0.3  # 常态高护甲，破绽期降低
        self.base_armor = self.armor
        self.attack_mode = 'chase'
        self.last_attack = 0
        
        # 攻击冷却 - 大幅缩短，提升节奏
        self.attack_cooldowns = {
            'chase': 150,     # 近战攻击CD减半
            'shoot': 300,     # 弹幕CD大幅缩短
            'burst': 600,     # 爆发弹幕CD减半
            'laser': 1000,    # 激光CD缩短
            'slam': 800,      # 冲撞CD减半
            'homing': 500,    # 追踪弹CD减半
            'spin': 1200,     # 旋转攻击CD缩短
            'dash': 1500      # 闪现CD大幅缩短
        }
        
        # 阶段机制 - 快速转阶段
        self.phase = 1
        self.phase_thresholds = [0.6, 0.35, 0.1]  # 阶段阈值降低，更快转阶段
        self.phase_change_1 = int(self.max_hp * self.phase_thresholds[0])
        self.phase_change_2 = int(self.max_hp * self.phase_thresholds[1])
        self.phase_change_3 = int(self.max_hp * self.phase_thresholds[2])
        
        # 攻击模式权重（各阶段）- 减少chase，增加主动技能
        self.phase_attacks = {
            1: {'chase': 2, 'shoot': 4, 'burst': 3, 'slam': 2},
            2: {'chase': 1, 'shoot': 3, 'burst': 3, 'laser': 3, 'homing': 3, 'slam': 2},
            3: {'shoot': 3, 'burst': 4, 'laser': 4, 'homing': 4, 'spin': 3, 'dash': 2},
            4: {'burst': 5, 'laser': 5, 'homing': 5, 'spin': 4, 'dash': 3}  # 狂暴模式：无chase
        }
        
        # 状态管理
        self.mode_timer = 0
        self.mode_duration = 60  # 大幅缩短模式持续时间，加快技能切换
        self.vulnerable = False
        self.vulnerable_timer = 0
        self.stunned = False
        self.stun_timer = 0
        
        # 激光攻击 - 缩短前摇
        self.laser_charging = False
        self.laser_timer = 0
        self.laser_angle = 0
        
        # 闪现
        self.last_dash = 0
        self.dash_cooldown = 4000  # 增加闪现冷却时间
        
        # 旋转攻击
        self.spin_angle = 0
        self.spin_active = False
        self.spin_timer = 0
        
        # 组合技系统
        self.combo_active = False
        self.combo_timer = 0
        self.combo_sequence = []
        
        # 随机走位偏移
        self.move_offset_timer = 0
        self.move_offset_angle = 0
        
        # 阶段特效
        self.phase_particles = []

    def update(self):
        if self.frozen > 0:
            self.frozen -= 1
            return
        
        # 处理燃烧效果
        if hasattr(self, 'burning') and self.burning > 0:
            self.burning -= 1
            self.hp -= 5
            if self.hp <= 0:
                self.on_death()
        
        # 处理中毒效果
        if hasattr(self, 'poisoned') and self.poisoned > 0:
            self.poisoned -= 1
            self.hp -= 3
            if self.hp <= 0:
                self.on_death()
        
        # 眩晕状态
        if self.stunned:
            self.stun_timer -= 1
            if self.stun_timer <= 0:
                self.stunned = False
            return
        
        # 攻击后恢复状态 - 近战攻击后停顿3秒
        if self.attack_recovery:
            self.attack_recovery_timer -= 1
            if self.attack_recovery_timer <= 0:
                self.attack_recovery = False
            return
        
        # 阶段检查
        self.check_phases()
        
        # 破绽期 - 缩短到0.8秒
        if self.vulnerable:
            self.vulnerable_timer -= 1
            if self.vulnerable_timer <= 0:
                self.vulnerable = False
                self.armor = self.base_armor  # 恢复护甲
        
        # 旋转攻击进行中
        if self.spin_active:
            self.update_spin()
            return
        
        # 激光蓄力
        if self.laser_charging:
            self.update_laser_charge()
            return
        
        # 组合技执行
        if self.combo_active:
            self.execute_combo()
            return
        
        # 模式切换 - 更快切换
        self.mode_timer += 1
        if self.mode_timer >= self.mode_duration:
            self.select_attack_mode()
        
        # 持续高速移动逼近玩家 + 小幅走位
        self.continuous_movement()
        
        # 移动和攻击
        self.execute_attack()
        
        # 边界检查
        self.rect.clamp_ip(pygame.Rect(ROOM_X, ROOM_Y, ROOM_W, ROOM_H))
    
    def continuous_movement(self):
        # 持续高速逼近玩家，永不发呆
        dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                    player.rect.centery - self.rect.centery)
        
        if dist_to_player > 30:
            # 基础追击方向
            base_dx = (player.rect.centerx - self.rect.centerx) / dist_to_player
            base_dy = (player.rect.centery - self.rect.centery) / dist_to_player
            
            # 小幅走位偏移 - 打乱玩家瞄准
            self.move_offset_timer += 1
            if self.move_offset_timer >= 30:  # 每0.5秒更新偏移
                self.move_offset_timer = 0
                self.move_offset_angle = random.uniform(-0.3, 0.3)
            
            # 应用偏移
            move_angle = math.atan2(base_dy, base_dx) + self.move_offset_angle
            current_speed = self.speed * (1.2 if self.phase >= 4 else 1.0)  # 狂暴模式加速
            
            self.rect.x += math.cos(move_angle) * current_speed
            self.rect.y += math.sin(move_angle) * current_speed
    
    def take_damage(self, damage):
        # 护甲减伤
        if not self.vulnerable:
            damage = int(damage * (1 - self.armor))
        else:
            # 破绽期：伤害翻倍
            damage = int(damage * 2)
        
        self.hp -= damage
        
        # 受伤特效
        for i in range(8):
            angle = random.uniform(0, math.pi * 2)
            speed = random.uniform(3, 6)
            particle = Particle(
                self.rect.centerx,
                self.rect.centery,
                (255, 100, 150),
                random.uniform(3, 6),
                speed,
                random.randint(10, 20)
            )
            particles.add(particle)
        
        if self.hp <= 0:
            self.on_death()
    
    def on_death(self):
        player.score += 500
        player.gold += 200
        spawn_pickups(self.rect.centerx, self.rect.centery, 10)
        self.kill()
        global wave_completed, room_cleared
        wave_completed = True
        room_cleared = True
    
    def check_phases(self):
        if self.hp <= self.phase_change_3 and self.phase < 4:
            self.enter_phase(4)
        elif self.hp <= self.phase_change_2 and self.phase < 3:
            self.enter_phase(3)
        elif self.hp <= self.phase_change_1 and self.phase < 2:
            self.enter_phase(2)
    
    def enter_phase(self, new_phase):
        self.phase = new_phase
        
        # 阶段速度加成 - 更快提速
        self.speed = self.base_speed * (1 + (new_phase - 1) * 0.4)
        
        # 阶段伤害加成
        self.damage = int(self.base_damage * (1 + (new_phase - 1) * 0.3))
        
        # 狂暴模式额外强化
        if new_phase >= 4:
            self.speed *= 1.5  # 狂暴模式移速再翻倍
            # 狂暴模式攻击CD再减半
            for key in self.attack_cooldowns:
                self.attack_cooldowns[key] = int(self.attack_cooldowns[key] * 0.5)
        
        # 阶段变化特效 - 更快更密集
        for i in range(20 + new_phase * 10):
            angle = i * math.pi / (3 + new_phase)
            bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.4)
            bullet.speed = 15 + new_phase * 3
            all_sprites.add(bullet)
            enemy_bullets.add(bullet)
        
        for i in range(20 + new_phase * 10):
            particle = Particle(self.rect.centerx, self.rect.centery, 
                              (100 + new_phase * 30, 50, 150 + new_phase * 20), 
                              4, 8, 20)
            particles.add(particle)
        
        # 破绽期 - 缩短到0.8秒，护甲大幅降低
        self.vulnerable = True
        self.vulnerable_timer = 48  # 0.8秒破绽期
        self.armor = 0.05  # 破绽期护甲大幅降低，鼓励爆发
    
    def select_attack_mode(self):
        dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                    player.rect.centery - self.rect.centery)
        
        weights = self.phase_attacks.get(self.phase, self.phase_attacks[1]).copy()
        
        # 根据距离调整攻击模式权重
        if dist_to_player > 150:
            # 远距离时增加追踪弹和激光的权重，减少普通射击
            if 'homing' in weights:
                weights['homing'] = weights.get('homing', 0) + 3
            if 'laser' in weights:
                weights['laser'] = weights.get('laser', 0) + 2
            if 'shoot' in weights:
                weights['shoot'] = max(1, weights.get('shoot', 0) - 1)
            # 远距离时强制加入homing攻击
            if 'homing' not in weights and self.phase >= 2:
                weights['homing'] = 2
        elif dist_to_player < 80:
            # 近距离时增加近战和冲刺攻击
            if 'chase' in weights:
                weights['chase'] = weights.get('chase', 0) + 2
            if 'slam' in weights:
                weights['slam'] = weights.get('slam', 0) + 1
        
        attack_list = []
        for mode, weight in weights.items():
            attack_list.extend([mode] * weight)
        
        self.attack_mode = random.choice(attack_list)
        self.mode_timer = 0
        
        # 阶段越后，模式持续时间越短
        base_duration = 180
        self.mode_duration = random.randint(base_duration - self.phase * 20, 
                                          base_duration + self.phase * 10)
    
    def execute_attack(self):
        dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                    player.rect.centery - self.rect.centery)
        now = pygame.time.get_ticks()
        
        # 闪现
        if now - self.last_dash > self.dash_cooldown and dist_to_player > 120:
            if random.random() < 0.01:
                self.dash()
        
        if self.attack_mode == 'chase':
            self.chase(dist_to_player)
        elif self.attack_mode == 'shoot':
            self.shoot()
        elif self.attack_mode == 'burst':
            self.burst()
        elif self.attack_mode == 'laser':
            self.start_laser()
        elif self.attack_mode == 'slam':
            self.slam(dist_to_player)
        elif self.attack_mode == 'homing':
            self.homing_attack()
        elif self.attack_mode == 'spin':
            self.start_spin()
    
    def chase(self, dist):
        if dist > 0:
            dx = (player.rect.centerx - self.rect.centerx) / dist
            dy = (player.rect.centery - self.rect.centery) / dist
            self.rect.x += dx * self.speed
            self.rect.y += dy * self.speed
        
        if dist < 50:
            self.melee_attack()
    
    def melee_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['chase']:
            self.last_attack = now
            player.take_damage(self.damage * 1.5)  # 降低近战伤害倍数
            self.attack_recovery = True  # 进入攻击后恢复状态
            self.attack_recovery_timer = 180  # 停顿3秒（60帧/秒 * 3秒）
    
    def shoot(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['shoot']:
            self.last_attack = now
            
            dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                       player.rect.centery - self.rect.centery)
            
            base_angle = math.atan2(player.rect.centery - self.rect.centery,
                               player.rect.centerx - self.rect.centerx)
            
            # 添加随机偏移，增加弹幕变化性
            angle_offset = (random.random() - 0.5) * 0.4  # -0.2 到 +0.2 的随机偏移
            angle = base_angle + angle_offset
            
            # 根据距离调整弹幕数量和扩散范围
            if dist_to_player > 150:
                # 远距离时增加弹幕数量和扩散范围
                bullet_count = 6 + random.randint(0, 4)
                spread_base = 0.12 + random.random() * 0.08
            else:
                # 近距离时减少弹幕数量和扩散
                bullet_count = 4 + random.randint(0, 3)
                spread_base = 0.1 + random.random() * 0.05
            
            # 高频连发弹幕 - 更快更密集，带有随机扩散
            for i in range(bullet_count):
                spread = (i - (bullet_count - 1) / 2) * spread_base
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle + spread, self.damage * 0.6)
                bullet.speed = 16 + random.randint(0, 4)  # 随机速度
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            
            # 技能衔接：30帧后触发弧形弹幕
            if self.phase >= 2:
                self.combo_sequence = ['arc_bullet']
                self.combo_timer = 30
                self.combo_active = True
    
    def arc_bullet(self):
        # 弧形弹幕 - 快速连续发射，增加随机性
        base_angle = math.atan2(player.rect.centery - self.rect.centery,
                           player.rect.centerx - self.rect.centerx)
        
        # 添加随机偏移
        angle_offset = (random.random() - 0.5) * 0.3
        angle = base_angle + angle_offset
        
        # 随机弹幕数量和弧度
        bullet_count = 6 + random.randint(0, 4)
        arc_width = 0.6 + random.random() * 0.4
        
        for i in range(bullet_count):
            arc_angle = angle + math.sin(i * 0.5 + random.random() * 0.3) * arc_width
            bullet = EnemyBullet(self.rect.centerx, self.rect.centery, arc_angle, self.damage * 0.5)
            bullet.speed = 14 + random.randint(0, 4)
            all_sprites.add(bullet)
            enemy_bullets.add(bullet)
    
    def burst(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['burst']:
            self.last_attack = now
            
            dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                       player.rect.centery - self.rect.centery)
            
            base_angle = math.atan2(player.rect.centery - self.rect.centery,
                                    player.rect.centerx - self.rect.centerx)
            
            # 随机起始角度偏移
            start_offset = random.random() * math.pi / 6
            
            # 根据距离调整弹幕数量
            if dist_to_player > 150:
                # 远距离时增加弹幕数量并缩小分布范围，更集中朝向玩家
                bullet_count = 28 + random.randint(0, 6)
                spread_range = 0.8  # 80%的弹幕集中在玩家方向
            else:
                # 近距离时正常分布
                bullet_count = 20 + random.randint(0, 8)
                spread_range = 1.0  # 全向分布
            
            # 高频爆发弹幕 - 更多子弹，更快速度，增加随机性
            for i in range(bullet_count):
                # 根据距离调整弹幕分布
                if dist_to_player > 150:
                    # 远距离时弹幕更集中朝向玩家
                    angle_ratio = i / (bullet_count - 1)
                    normalized_angle = (angle_ratio - 0.5) * 2 * spread_range
                    angle = base_angle + normalized_angle * math.pi * 0.8 + (random.random() - 0.5) * 0.1
                else:
                    # 近距离时全向分布
                    angle = base_angle + start_offset + (i * 2 * math.pi / bullet_count) + (random.random() - 0.5) * 0.15
                
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.35)
                bullet.speed = 13 + self.phase * 2 + random.randint(0, 4)  # 随阶段加速并随机
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            
            # 高阶段触发组合技
            if self.phase >= 3:
                self.combo_sequence = ['slam', 'laser_quick']
                self.combo_timer = 15
                self.combo_active = True
    
    def start_laser(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['laser']:
            self.last_attack = now
            self.laser_charging = True
            self.laser_timer = 0
            self.laser_angle = math.atan2(player.rect.centery - self.rect.centery,
                                          player.rect.centerx - self.rect.centerx)
    
    def update_laser_charge(self):
        self.laser_timer += 1
        laser_length = 1000
        
        # 大幅缩短前摇 - 20帧（约0.33秒）
        if self.laser_timer < 20:
            # 快速蓄力效果
            if self.laser_timer % 2 == 0:
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 255, 255), 5, 8, 15)
                particles.add(particle)
            
            # 瞄准线效果 - 快速变亮
            charge_progress = self.laser_timer / 20
            alpha = int(100 + charge_progress * 155)
            line_width = int(3 + charge_progress * 5)
            
            aim_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            pygame.draw.line(aim_surface, (255, 0, 0, alpha), 
                           (self.rect.centerx, self.rect.centery), 
                           (self.rect.centerx + math.cos(self.laser_angle) * laser_length, 
                            self.rect.centery + math.sin(self.laser_angle) * laser_length), line_width)
            screen.blit(aim_surface, (0, 0))
        else:
            # 发射激光
            self.laser_charging = False
            
            effect = LaserEffect(self.rect.centerx, self.rect.centery, self.laser_angle, 
                               self.damage * 2, laser_length, 15)
            all_sprites.add(effect)
            
            for i in range(20):
                particle_x = self.rect.centerx + math.cos(self.laser_angle) * random.randint(0, laser_length)
                particle_y = self.rect.centery + math.sin(self.laser_angle) * random.randint(0, laser_length)
                particle = Particle(particle_x, particle_y, (255, 100, 0), 5, 8, 20)
                particles.add(particle)
    
    def laser_quick(self):
        # 瞬发激光 - 无蓄力，直接发射
        angle = math.atan2(player.rect.centery - self.rect.centery,
                          player.rect.centerx - self.rect.centerx)
        effect = LaserEffect(self.rect.centerx, self.rect.centery, angle, 
                           self.damage * 1.5, 800, 10)
        all_sprites.add(effect)
        
        for i in range(10):
            particle = Particle(self.rect.centerx, self.rect.centery, (255, 200, 0), 4, 6, 15)
            particles.add(particle)
    
    def execute_combo(self):
        self.combo_timer -= 1
        if self.combo_timer <= 0 and self.combo_sequence:
            skill = self.combo_sequence.pop(0)
            
            if skill == 'arc_bullet':
                self.arc_bullet()
            elif skill == 'slam':
                self.slam_quick()
            elif skill == 'laser_quick':
                self.laser_quick()
            
            # 继续下一个技能或结束组合
            if self.combo_sequence:
                self.combo_timer = 10  # 快速衔接
            else:
                self.combo_active = False
    
    def slam_quick(self):
        # 快速冲撞 - 无蓄力直接突进
        dist = math.hypot(player.rect.centerx - self.rect.centerx,
                         player.rect.centery - self.rect.centery)
        if dist > 0:
            dx = (player.rect.centerx - self.rect.centerx) / dist
            dy = (player.rect.centery - self.rect.centery) / dist
            jump_dist = min(dist - 20, 200)
            self.rect.x += dx * jump_dist
            self.rect.y += dy * jump_dist
        
        # 落地冲击波
        for i in range(6):
            angle = i * math.pi / 3
            bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.7)
            bullet.speed = 12
            all_sprites.add(bullet)
            enemy_bullets.add(bullet)
        
        if dist < 100:
            player.take_damage(self.damage * 1.2)
    
    def slam(self, dist):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['slam']:
            self.last_attack = now
            if dist > 0:
                dx = (player.rect.centerx - self.rect.centerx) / dist
                dy = (player.rect.centery - self.rect.centery) / dist
                jump_dist = min(dist - 30, 180)
                self.rect.x += dx * jump_dist
                self.rect.y += dy * jump_dist
            
            for i in range(8):
                angle = i * math.pi / 4
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.8)
                bullet.speed = 8
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            
            if dist < 120:
                player.take_damage(self.damage * 1.3)
    
    def homing_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['homing']:
            self.last_attack = now
            angle = math.atan2(player.rect.centery - self.rect.centery,
                               player.rect.centerx - self.rect.centerx)
            
            # 多发追踪弹 - 更快更密集
            for i in range(3):
                spread = (i - 1) * 0.15
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle + spread, self.damage * 0.5)
                bullet.homing = True
                bullet.homing_strength = 0.15  # 更强追踪
                bullet.speed = 6  # 更快速度
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
    
    def start_spin(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['spin']:
            self.last_attack = now
            self.spin_active = True
            self.spin_timer = 0
            self.spin_angle = 0
    
    def update_spin(self):
        self.spin_timer += 1
        self.spin_angle += 0.15
        
        if self.spin_timer % 3 == 0:
            bullet = EnemyBullet(self.rect.centerx, self.rect.centery, self.spin_angle, self.damage * 0.5)
            bullet.speed = 12
            all_sprites.add(bullet)
            enemy_bullets.add(bullet)
        
        if self.spin_timer >= 80:
            self.spin_active = False
    
    def dash(self):
        now = pygame.time.get_ticks()
        if now - self.last_dash > self.dash_cooldown:
            self.last_dash = now
            dist = math.hypot(player.rect.centerx - self.rect.centerx,
                             player.rect.centery - self.rect.centery)
            if dist > 50:
                dx = (player.rect.centerx - self.rect.centerx) / dist
                dy = (player.rect.centery - self.rect.centery) / dist
                new_x = self.rect.centerx + dx * min(dist - 80, 150)
                new_y = self.rect.centery + dy * min(dist - 80, 150)
                
                new_x = max(ROOM_X + 50, min(new_x, ROOM_X + ROOM_W - 50))
                new_y = max(ROOM_Y + 50, min(new_y, ROOM_Y + ROOM_H - 50))
                
                for i in range(10):
                    particle = Particle(self.rect.centerx, self.rect.centery, (100, 150, 255), 3, 5, 15)
                    particles.add(particle)
                
                self.rect.center = (new_x, new_y)
                
                for i in range(10):
                    particle = Particle(self.rect.centerx, self.rect.centery, (100, 150, 255), 3, 5, 15)
                    particles.add(particle)

    def shoot_projectile(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['shoot']:
            self.last_attack = now
            angle = math.atan2(player.rect.centery - self.rect.centery, 
                               player.rect.centerx - self.rect.centerx)
            # 增加弹幕数量
            for i in range(5):  # 发射5发子弹，增加密度
                spread = (i - 2) * 0.15  # 子弹散布
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle + spread, self.damage)
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)

    def burst_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['burst']:
            self.last_attack = now
            base_angle = math.atan2(player.rect.centery - self.rect.centery, 
                                    player.rect.centerx - self.rect.centerx)
            # 增加弹幕数量
            for i in range(24):  # 发射24发子弹，增加密度
                angle = base_angle + (i * math.pi / 12)
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.4)
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)

    def laser_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['laser']:
            self.last_attack = now
            # 激光攻击 - 改为状态机模式，避免阻塞主循环
            angle = math.atan2(player.rect.centery - self.rect.centery, 
                             player.rect.centerx - self.rect.centerx)
            
            # 开始充电状态
            self.laser_state = 'charging'
            self.laser_timer = 0
            self.laser_angle = angle
            self.laser_start = (self.rect.centerx, self.rect.centery)
            laser_length = 1000
            self.laser_end = (self.rect.centerx + math.cos(angle) * laser_length, 
                            self.rect.centery + math.sin(angle) * laser_length)
            self.laser_damage = False
            # 增加充电特效
            for i in range(10):
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 100, 0), 3, 5, 20)
                particles.add(particle)
    
    def dash(self):
        now = pygame.time.get_ticks()
        if now - self.last_dash > self.dash_cooldown:
            self.last_dash = now
            dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx,
                                        player.rect.centery - self.rect.centery)
            if dist_to_player > 50:
                dx = (player.rect.centerx - self.rect.centerx) / dist_to_player
                dy = (player.rect.centery - self.rect.centery) / dist_to_player
                # 闪现到距离玩家100像素的位置
                dash_distance = min(dist_to_player - 100, 200)
                new_x = self.rect.centerx + dx * dash_distance
                new_y = self.rect.centery + dy * dash_distance
                
                # 边界检查
                new_x = max(ROOM_X + 50, min(new_x, ROOM_X + ROOM_W - 50))
                new_y = max(ROOM_Y + 50, min(new_y, ROOM_Y + ROOM_H - 50))
                
                # 闪现特效
                for i in range(15):
                    particle = Particle(self.rect.centerx, self.rect.centery, (100, 200, 255), 3, 6, 20)
                    particles.add(particle)
                
                self.rect.center = (new_x, new_y)
                
                # 闪现后特效
                for i in range(15):
                    particle = Particle(self.rect.centerx, self.rect.centery, (100, 200, 255), 3, 6, 20)
                    particles.add(particle)
    
    def triple_shot_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['triple_shot']:
            self.last_attack = now
            base_angle = math.atan2(player.rect.centery - self.rect.centery,
                                    player.rect.centerx - self.rect.centerx)
            # 三连射，快速连发
            for i in range(3):
                spread = (i - 1) * 0.12
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, base_angle + spread, self.damage * 0.8)
                bullet.speed = 14
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)
            # 射击特效
            for i in range(5):
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 200, 0), 2, 4, 15)
                particles.add(particle)

    def summon_minions(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['summon']:
            self.last_attack = now
            # 召唤小怪
            for i in range(4):
                mob_types = ['melee', 'ranged', 'fast', 'grenadier', 'hunter']
                mob_type = random.choice(mob_types)
                mob = Mob(mob_type, self.phase)
                # 从Boss周围生成
                angle = i * math.pi / 2
                distance = 150
                mob.rect.centerx = self.rect.centerx + math.cos(angle) * distance
                mob.rect.centery = self.rect.centery + math.sin(angle) * distance
                all_sprites.add(mob)
                mobs.add(mob)

    def slam_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['slam']:
            self.last_attack = now
            # 跳跃攻击
            # 计算到玩家的方向
            dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx, 
                                      player.rect.centery - self.rect.centery)
            if dist_to_player != 0:
                dx = (player.rect.centerx - self.rect.centerx) / dist_to_player
                dy = (player.rect.centery - self.rect.centery) / dist_to_player
                # 跳跃到玩家位置
                jump_distance = min(dist_to_player, 200)
                self.rect.x += dx * jump_distance
                self.rect.y += dy * jump_distance
                # 震地效果
                for i in range(8):
                    angle = i * math.pi / 4
                    bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.8)
                    bullet.speed = 8
                    all_sprites.add(bullet)
                    enemy_bullets.add(bullet)
                # 伤害玩家
                if dist_to_player < 100:
                    player.take_damage(self.damage * 1.2)

    def fire_wall_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['fire_wall']:
            self.last_attack = now
            # 生成火墙
            # 随机选择火墙方向
            direction = random.choice(['horizontal', 'vertical'])
            if direction == 'horizontal':
                # 水平火墙
                y = random.randint(ROOM_Y + 100, ROOM_Y + ROOM_H - 100)
                for x in range(ROOM_X, ROOM_X + ROOM_W, 50):
                    fire = EnemyBullet(x, y, math.pi/2, self.damage * 0.3)
                    fire.speed = 0
                    fire.timer = 120
                    all_sprites.add(fire)
                    enemy_bullets.add(fire)
            else:
                # 垂直火墙
                x = random.randint(ROOM_X + 100, ROOM_X + ROOM_W - 100)
                for y in range(ROOM_Y, ROOM_Y + ROOM_H, 50):
                    fire = EnemyBullet(x, y, 0, self.damage * 0.3)
                    fire.speed = 0
                    fire.timer = 120
                    all_sprites.add(fire)
                    enemy_bullets.add(fire)

    def homing_missile_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['homing_missile']:
            self.last_attack = now
            # 发射追踪导弹
            for i in range(8):  # 发射8枚导弹，增加密度
                angle = math.atan2(player.rect.centery - self.rect.centery, 
                                   player.rect.centerx - self.rect.centerx)
                spread = (i - 3.5) * 0.18  # 导弹散布
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle + spread, self.damage * 0.6)
                bullet.homing = True
                bullet.speed = 6
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)

    def rain_attack(self):
        now = pygame.time.get_ticks()
        if now - self.last_attack > self.attack_cooldowns['rain']:
            self.last_attack = now
            # 弹幕雨攻击
            for i in range(40):  # 发射40发子弹，增加弹幕雨密度
                x = random.randint(ROOM_X, ROOM_X + ROOM_W)
                y = ROOM_Y - 50
                angle = math.pi / 2 + random.uniform(-0.3, 0.3)
                bullet = EnemyBullet(x, y, angle, self.damage * 0.5)
                bullet.speed = 12
                all_sprites.add(bullet)
                enemy_bullets.add(bullet)

    def spin_laser_attack(self):
        # 状态机模式：前摇 -> 攻击 -> 后摇
        if not hasattr(self, 'spin_laser_state'):
            self.spin_laser_state = 'charging'
            self.spin_laser_timer = 0
            self.spin_laser_angle = 0
        
        self.spin_laser_timer += 1
        
        laser_length = 350  # 减小攻击范围
        laser_start = (self.rect.centerx, self.rect.centery)
        
        if self.spin_laser_state == 'charging':
            # 前摇阶段：120帧（2秒）准备时间
            if self.spin_laser_timer < 120:
                # 显示蓄力特效
                charge_progress = self.spin_laser_timer / 120
                glow_radius = int(30 + charge_progress * 50)
                
                # 蓄力光环
                glow_surface = pygame.Surface((glow_radius * 2, glow_radius * 2), pygame.SRCALPHA)
                pygame.draw.circle(glow_surface, (0, 255, 255, int(100 * charge_progress)), 
                                  (glow_radius, glow_radius), glow_radius)
                screen.blit(glow_surface, (self.rect.centerx - glow_radius, self.rect.centery - glow_radius))
                
                # 提示线
                for angle in range(0, 360, 45):
                    rad_angle = math.radians(angle)
                    end_x = self.rect.centerx + math.cos(rad_angle) * laser_length
                    end_y = self.rect.centery + math.sin(rad_angle) * laser_length
                    pygame.draw.line(screen, (0, 200, 200), laser_start, (end_x, end_y), 2)
                
            else:
                # 前摇结束，进入攻击阶段
                self.spin_laser_state = 'attacking'
                self.spin_laser_timer = 0
                
        elif self.spin_laser_state == 'attacking':
            # 攻击阶段：激光旋转240帧（4秒）
            if self.spin_laser_timer < 240:
                # 旋转角度递增 - 降低旋转速度
                self.spin_laser_angle += 0.04  # 旋转速度降低50%
                
                # 绘制当前角度的激光
                for offset in [-0.1, 0, 0.1]:  # 三束激光
                    current_angle = self.spin_laser_angle + offset
                    laser_end = (self.rect.centerx + math.cos(current_angle) * laser_length, 
                                self.rect.centery + math.sin(current_angle) * laser_length)
                    
                    # 激光特效
                    for j in range(3):
                        width = 10 - j * 3
                        alpha = int(200 * (1 - j/3))
                        laser_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                        pygame.draw.line(laser_surface, (0, 255, 255, alpha), laser_start, laser_end, width)
                        screen.blit(laser_surface, (0, 0))
                
                # 伤害判定（每5帧检查一次）
                if self.spin_laser_timer % 5 == 0:
                    dist_to_player = math.hypot(player.rect.centerx - self.rect.centerx, 
                                               player.rect.centery - self.rect.centery)
                    if dist_to_player < laser_length:
                        player_angle = math.atan2(player.rect.centery - self.rect.centery, 
                                                 player.rect.centerx - self.rect.centerx)
                        angle_diff = abs(player_angle - self.spin_laser_angle)
                        if angle_diff > math.pi:
                            angle_diff = 2 * math.pi - angle_diff
                        if angle_diff < 0.15:
                            player.take_damage(self.damage * 1.2)
                
                # 旋转粒子效果
                if self.spin_laser_timer % 3 == 0:
                    angle = self.spin_laser_angle + random.uniform(-0.3, 0.3)
                    particle = Particle(
                        self.rect.centerx + math.cos(angle) * 80,
                        self.rect.centery + math.sin(angle) * 80,
                        (0, 255, 255),
                        2, 3, 20
                    )
                    particles.add(particle)
                    
            else:
                # 攻击结束，进入后摇阶段
                self.spin_laser_state = 'recovery'
                self.spin_laser_timer = 0
                
        elif self.spin_laser_state == 'recovery':
            # 后摇阶段：60帧（1秒）恢复时间
            if self.spin_laser_timer < 60:
                # 后摇特效
                for i in range(5):
                    angle = random.uniform(0, 2 * math.pi)
                    particle = Particle(
                        self.rect.centerx,
                        self.rect.centery,
                        (0, 200, 200),
                        3, 2, 15
                    )
                    particles.add(particle)
            else:
                # 攻击完全结束
                delattr(self, 'spin_laser_state')
                delattr(self, 'spin_laser_timer')
                delattr(self, 'spin_laser_angle')
                return
        
        # 阻止其他攻击
        return True

    def charge_attack(self):
        """冲锋攻击：Boss冲向玩家，并在到达后发射弹幕"""
        current_time = pygame.time.get_ticks()
        if current_time - self.last_attack > self.attack_cooldowns['charge']:
            # 计算冲向玩家的方向
            angle = math.atan2(player.rect.centery - self.rect.centery, 
                               player.rect.centerx - self.rect.centerx)
            
            # 计算冲锋距离
            distance = math.hypot(player.rect.centerx - self.rect.centerx, 
                                 player.rect.centery - self.rect.centery)
            charge_distance = min(distance - 100, 300)  # 冲到玩家附近100像素处
            
            # 冲锋效果
            charge_speed = 8  # 冲锋速度
            steps = int(charge_distance / charge_speed)
            
            for i in range(steps):
                # 计算当前位置
                progress = i / steps
                new_x = self.rect.centerx + math.cos(angle) * charge_distance * progress
                new_y = self.rect.centery + math.sin(angle) * charge_distance * progress
                
                # 确保位置在房间内
                new_x = max(ROOM_X + 50, min(ROOM_X + ROOM_W - 50, new_x))
                new_y = max(ROOM_Y + 50, min(ROOM_Y + ROOM_H - 50, new_y))
                
                # 更新位置
                self.rect.centerx = new_x
                self.rect.centery = new_y
                
                # 冲锋粒子效果
                for j in range(3):
                    particle = Particle(self.rect.centerx, self.rect.centery, (255, 100, 0), 2, 4, 10)
                    particles.add(particle)
                
                # 更新屏幕
                pygame.display.flip()
                clock.tick(FPS)
            
            # 到达后发射弹幕
            for i in range(8):
                angle = i * math.pi / 4
                bullet = EnemyBullet(self.rect.centerx, self.rect.centery, angle, self.damage * 0.8)
                enemy_bullets.add(bullet)
            
            # 冲锋结束的粒子效果
            for i in range(20):
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 150, 50), 3, 5, 20)
                particles.add(particle)
            
            self.last_attack = current_time

    def energy_orb_attack(self):
        """能量球攻击：Boss发射一个大型能量球，爆炸后分裂成多个小能量球"""
        current_time = pygame.time.get_ticks()
        if current_time - self.last_attack > self.attack_cooldowns['energy_orb']:
            # 计算朝向玩家的角度
            angle = math.atan2(player.rect.centery - self.rect.centery, 
                               player.rect.centerx - self.rect.centerx)
            
            # 发射大型能量球
            orb = EnergyOrb(self.rect.centerx, self.rect.centery, angle, self.damage * 1.5)
            energy_orbs.add(orb)
            
            self.last_attack = current_time

class EnergyOrb(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((30, 30), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (255, 0, 255), (15, 15), 15)
        pygame.draw.circle(self.image, (255, 255, 255), (15, 15), 5)
        self.rect = self.image.get_rect(center=(x, y))
        self.dx = math.cos(angle) * 3
        self.dy = math.sin(angle) * 3
        self.damage = damage
        self.lifetime = 120  # 生命周期
        self.size = 30
        
    def update(self):
        self.lifetime -= 1
        if self.lifetime <= 0:
            # 爆炸分裂成多个小能量球
            for i in range(6):
                angle = i * math.pi / 3
                small_orb = SmallEnergyOrb(self.rect.centerx, self.rect.centery, angle, self.damage * 0.5)
                small_energy_orbs.add(small_orb)
            # 爆炸效果
            for i in range(20):
                particle = Particle(self.rect.centerx, self.rect.centery, (255, 0, 255), 3, 5, 30)
                particles.add(particle)
            self.kill()
        else:
            # 移动
            self.rect.x += self.dx
            self.rect.y += self.dy
            
            # 检查与玩家碰撞
            if self.rect.colliderect(player.rect):
                player.take_damage(self.damage)
                # 爆炸效果
                for i in range(20):
                    particle = Particle(self.rect.centerx, self.rect.centery, (255, 0, 255), 3, 5, 30)
                    particles.add(particle)
                self.kill()
            
            # 检查与墙壁碰撞
            if self.rect.left < ROOM_X or self.rect.right > ROOM_X + ROOM_W or \
               self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y + ROOM_H:
                # 爆炸效果
                for i in range(20):
                    particle = Particle(self.rect.centerx, self.rect.centery, (255, 0, 255), 3, 5, 30)
                    particles.add(particle)
                self.kill()

class SmallEnergyOrb(pygame.sprite.Sprite):
    def __init__(self, x, y, angle, damage):
        super().__init__()
        self.image = pygame.Surface((15, 15), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (255, 100, 255), (7, 7), 7)
        self.rect = self.image.get_rect(center=(x, y))
        self.dx = math.cos(angle) * 5
        self.dy = math.sin(angle) * 5
        self.damage = damage
        self.lifetime = 60  # 生命周期
        
    def update(self):
        self.lifetime -= 1
        if self.lifetime <= 0:
            self.kill()
        else:
            # 移动
            self.rect.x += self.dx
            self.rect.y += self.dy
            
            # 检查与玩家碰撞
            if self.rect.colliderect(player.rect):
                player.take_damage(self.damage)
                # 爆炸效果
                for i in range(10):
                    particle = Particle(self.rect.centerx, self.rect.centery, (255, 100, 255), 2, 3, 20)
                    particles.add(particle)
                self.kill()
            
            # 检查与墙壁碰撞
            if self.rect.left < ROOM_X or self.rect.right > ROOM_X + ROOM_W or \
               self.rect.top < ROOM_Y or self.rect.bottom > ROOM_Y + ROOM_H:
                self.kill()

class Merchant(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((50, 80), pygame.SRCALPHA)
        pygame.draw.rect(self.image, (100, 50, 0), (10, 20, 30, 40))
        pygame.draw.circle(self.image, (255, 200, 150), (25, 15), 12)
        self.rect = self.image.get_rect(center=(WIDTH//2, HEIGHT//2))
        all_items = [
            {'name': '手枪', 'price': 50},
            {'name': '霰弹枪', 'price': 150},
            {'name': '剑', 'price': 100},
            {'name': '步枪', 'price': 200},
            {'name': '狙击枪', 'price': 300},
            {'name': '火箭炮', 'price': 500},
            {'name': '回旋镖', 'price': 180},
            {'name': '手里剑', 'price': 120},
            {'name': '冰锥', 'price': 150},
            {'name': '火球', 'price': 320},
            {'name': '毒云', 'price': 290},
            {'name': '圣剑', 'price': 280},
            {'name': '黑骑士的剑', 'price': 350},
            {'name': '咖喱棒', 'price': 300},
            {'name': '步枪', 'price': 120},
            {'name': '狙击枪', 'price': 300},
            {'name': '火箭炮', 'price': 400},
            {'name': '回旋镖', 'price': 150},
            {'name': '手里剑', 'price': 100},
            {'name': '双枪', 'price': 200},
            {'name': '战斧', 'price': 180},
            {'name': '飞刀', 'price': 80},
            {'name': '能量剑', 'price': 220},
            {'name': '激光剑', 'price': 180},
            {'name': '链刃', 'price': 250},
            {'name': '蓄力弓', 'price': 280},
            {'name': '瞬光刺', 'price': 200},
            {'name': '炽焰流', 'price': 260},
            {'name': '灭核裁决', 'price': 450},
            {'name': '双节棍', 'price': 100},
            {'name': '暗影刃', 'price': 220},
            {'name': '生命药水', 'price': 30},
            {'name': '魔法药水', 'price': 20}
        ]
        self.items = random.sample(all_items, 6)

    def update(self):
        pass

    def interact(self):
        return self.items

    def buy(self, index, player):
        if 0 <= index < len(self.items):
            item = self.items[index]
            if item['name'] in player.weapons:
                print("已拥有该武器")
                return
            if item['name'] in ['生命药水', '魔法药水']:
                if player.gold >= item['price']:
                    player.gold -= item['price']
                    if item['name'] == '生命药水':
                        player.hp = min(player.max_hp, player.hp + 50)
                    elif item['name'] == '魔法药水':
                        player.mp = min(player.max_mp, player.mp + 50)
                    print(f"购买了{item['name']}")
                else:
                    print("金币不足")
            else:
                if player.gold >= item['price']:
                    player.gold -= item['price']
                    player.weapons.append(item['name'])
                    player.current_weapon = len(player.weapons) - 1
                    print(f"购买了{item['name']}，已切换到该武器")
                else:
                    print("金币不足")

class Chest(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((30,30))
        self.image.fill(GREEN)
        pygame.draw.rect(self.image, YELLOW, (5, 5, 20, 20), 3)
        self.rect = self.image.get_rect(center=(x,y))
        self.opened = False
        self.weapon_reward = random.choice(['步枪', '狙击枪', '火箭炮', '回旋镖', '手里剑', '冰锥', '火球', '毒云', '圣剑', '黑骑士的剑', '咖喱棒', '双枪', '战斧', '飞刀', '能量剑', '激光剑', '链刃', '蓄力弓', '瞬光刺', '炽焰流', '灭核裁决', '双节棍', '暗影刃'])

    def open(self):
        if not self.opened:
            self.opened = True
            self.image.fill(GRAY)
            if self.weapon_reward not in player.weapons:
                player.weapons.append(self.weapon_reward)
                print(f"获得武器: {self.weapon_reward}")
            return True
        return False

class HitEffect(pygame.sprite.Sprite):
    def __init__(self, x, y, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 12
        self.image = pygame.Surface((60, 60), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.particles = []
        # 根据伤害值选择颜色
        if damage > 50:
            self.main_color = (255, 0, 0)  # 高伤害红色
        elif damage > 25:
            self.main_color = (255, 165, 0)  # 中等伤害橙色
        else:
            self.main_color = (255, 255, 0)  # 低伤害黄色
        # 生成命中粒子
        for i in range(10):
            angle = i * math.pi * 2 / 10
            speed = random.uniform(2, 5)
            self.particles.append({
                'x': 0,
                'y': 0,
                'dx': math.cos(angle) * speed,
                'dy': math.sin(angle) * speed,
                'life': 1.0,
                'size': random.uniform(2, 5),
                'color': self.main_color
            })
    def update(self):
        self.timer += 1
        if self.timer >= self.max_timer:
            self.kill()
            return
        
        self.image.fill((0, 0, 0, 0))
        alpha = int(255 * (1 - self.timer / self.max_timer))
        
        # 绘制命中效果
        pygame.draw.circle(self.image, (255, 255, 255, alpha), (30, 30), 20)
        pygame.draw.circle(self.image, (self.main_color[0], self.main_color[1], self.main_color[2], alpha), (30, 30), 12)
        # 绘制冲击波效果
        radius = 15 + self.timer * 2
        pygame.draw.circle(self.image, (255, 255, 255, alpha // 3), (30, 30), radius, 2)
        
        # 绘制粒子
        for particle in self.particles:
            particle['x'] += particle['dx']
            particle['y'] += particle['dy']
            particle['life'] -= 0.1
            if particle['life'] > 0:
                size = int(particle['size'] * particle['life'])
                particle_alpha = int(255 * particle['life'])
                particle_x = 30 + particle['x']
                particle_y = 30 + particle['y']
                pygame.draw.circle(self.image, (particle['color'][0], particle['color'][1], particle['color'][2], particle_alpha), (int(particle_x), int(particle_y)), size)

class DamageText(pygame.sprite.Sprite):
    def __init__(self, x, y, damage):
        super().__init__()
        self.x = x
        self.y = y
        self.damage = damage
        self.timer = 0
        self.max_timer = 35
        self.image = pygame.Surface((120, 60), pygame.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))
        self.velocity = -2.5  # 向上移动的速度
        # 根据伤害值选择颜色
        if damage > 50:
            self.color = (255, 0, 0)  # 高伤害红色
        elif damage > 25:
            self.color = (255, 165, 0)  # 中等伤害橙色
        else:
            self.color = (255, 255, 0)  # 低伤害黄色
    def update(self):
        self.timer += 1
        if self.timer >= self.max_timer:
            self.kill()
            return
        
        self.image.fill((0, 0, 0, 0))
        alpha = int(255 * (1 - self.timer / self.max_timer))
        
        # 绘制伤害数字
        damage_text = font.render(str(int(self.damage)), True, (self.color[0], self.color[1], self.color[2], alpha))
        # 绘制描边效果
        outline_text = font.render(str(int(self.damage)), True, (0, 0, 0, alpha))
        # 绘制描边
        text_rect = outline_text.get_rect(center=(60, 30))
        for dx, dy in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
            self.image.blit(outline_text, (text_rect.x + dx, text_rect.y + dy))
        # 绘制主文本
        self.image.blit(damage_text, text_rect)
        
        # 向上移动
        self.rect.y += self.velocity
        
        # 轻微左右晃动
        if self.timer % 2 == 0:
            self.rect.x += 1
        else:
            self.rect.x -= 1
        
        # 缩放效果，先放大后缩小
        if self.timer < 10:
            # 放大
            scale = 1 + self.timer / 30
        else:
            # 缩小
            scale = 1.3 - (self.timer - 10) / 50
        scaled_image = pygame.transform.scale(self.image, (int(self.image.get_width() * scale), int(self.image.get_height() * scale)))
        self.image = scaled_image
        self.rect = self.image.get_rect(center=self.rect.center)

all_sprites = pygame.sprite.Group()
bullets = pygame.sprite.Group()
enemy_bullets = pygame.sprite.Group()
mobs = pygame.sprite.Group()
bosses = pygame.sprite.Group()
doors = pygame.sprite.Group()
pickups = pygame.sprite.Group()
melee_effects = pygame.sprite.Group()
chests = pygame.sprite.Group()
merchants = pygame.sprite.Group()
hit_effects = pygame.sprite.Group()  # 命中效果组
particles = pygame.sprite.Group()  # 粒子效果精灵组
energy_orbs = pygame.sprite.Group()  # 能量球精灵组
small_energy_orbs = pygame.sprite.Group()  # 小能量球精灵组
damage_texts = pygame.sprite.Group()  # 伤害数字效果组

player = Player()
all_sprites.add(player)

level = 1
current_room_type = 'battle'
room_waves = 0
max_waves = 3
wave_mobs = 0
wave_completed = False
room_cleared = False

# BOSS战提示系统
boss_warning_timer = 0
show_boss_warning = False
weapon_hint_timer = 0
show_weapon_hint = False

# 屏幕震动效果
def create_room(room_type):
    doors.empty()
    door_types = ['battle', 'treasure', 'shop']
    random.shuffle(door_types)
    
    door_up = Door((WIDTH//2, ROOM_Y), "up", door_types[0])
    door_down = Door((WIDTH//2, ROOM_Y+ROOM_H), "down", door_types[1])
    door_left = Door((ROOM_X, HEIGHT//2), "left", door_types[2])
    door_right = Door((ROOM_X+ROOM_W, HEIGHT//2), "right", 'battle')
    
    doors.add(door_up, door_down, door_left, door_right)
    all_sprites.add(doors)

def spawn_mobs(count):
    global wave_mobs
    wave_mobs = count
    for _ in range(count):
        # 随机生成各种怪物类型
        rand = random.random()
        if rand < 0.20:  # 20% 概率生成近战怪物
            mob_type = 'melee'
        elif rand < 0.32:  # 12% 概率生成绿弹速射怪
            mob_type = 'ranged'
        elif rand < 0.44:  # 12% 概率生成黄弹穿透怪
            mob_type = 'piercer'
        elif rand < 0.56:  # 12% 概率生成蓝弹追踪怪
            mob_type = 'tracker'
        elif rand < 0.68:  # 12% 概率生成紫色弹幕怪
            mob_type = 'purple'
        elif rand < 0.80:  # 12% 概率生成激光怪物
            mob_type = 'laser'
        else:  # 20% 概率生成其他怪物
            mob_type = random.choice(['fast', 'tank', 'grenadier', 'hunter'])
        m = Mob(mob_type, level)
        all_sprites.add(m)
        mobs.add(m)

def spawn_pickups(x, y, count=1):
    pickup_types = ['gold', 'health', 'mana']
    for _ in range(count):
        pickup_type = random.choice(pickup_types)
        p = Pickup(x + random.randint(-20, 20), y + random.randint(-20, 20), pickup_type)
        all_sprites.add(p)
        pickups.add(p)

def enter_room(door):
    global level, current_room_type, room_waves, max_waves, wave_completed, room_cleared
    level += 1
    current_room_type = door.room_type
    room_waves = 0
    max_waves = 3
    wave_completed = False
    room_cleared = False
    
    player.rect.center = (WIDTH//2, HEIGHT//2)
    
    # 默认不在BOSS房间
    player.in_boss_room = False
    
    # 进入新房间时回满护盾
    player.shield = player.max_shield
    
    if level % 5 == 0:
        current_room_type = 'boss'
        mobs.empty()
        bosses.empty()
        for m in merchants:
            m.kill()
        boss = Boss(level)
        all_sprites.add(boss)
        bosses.add(boss)
        room_waves = 1
        max_waves = 1
        # 触发BOSS战警告
        global boss_warning_timer, show_boss_warning, weapon_hint_timer, show_weapon_hint
        boss_warning_timer = 120  # 2秒警告时间
        show_boss_warning = True
        weapon_hint_timer = 0
        show_weapon_hint = False
    
    if current_room_type == 'battle':
        mobs.empty()
        bosses.empty()
        for m in merchants:
            m.kill()
        room_waves += 1
        spawn_mobs(4 + level)
    elif current_room_type == 'treasure':
        chests.empty()
        mobs.empty()
        bosses.empty()
        for m in merchants:
            m.kill()
        chest = Chest(WIDTH//2, HEIGHT//2)
        all_sprites.add(chest)
        chests.add(chest)
        room_cleared = False
    elif current_room_type == 'shop':
        spawn_pickups(WIDTH//2, HEIGHT//2, 3)
        mobs.empty()
        bosses.empty()
        for m in merchants:
            m.kill()
        room_waves = 0
        max_waves = 0
        room_cleared = True
        merchant = Merchant()
        all_sprites.add(merchant)
        merchants.add(merchant)
    
    create_room(current_room_type)

def reset_game():
    global level, current_room_type, room_waves, max_waves, wave_completed, room_cleared
    level = 1
    current_room_type = 'battle'
    room_waves = 0
    max_waves = 3
    wave_completed = False
    room_cleared = False
    
    player.hp = player.max_hp
    player.mp = player.max_mp
    player.shield = player.max_shield
    player.score = 0
    player.gold = 0
    player.rect.center = (WIDTH//2, HEIGHT//2)
    player.current_weapon = 0
    player.current_skill = 0
    player.invincible = False
    player.invincible_timer = 0
    player.stealth = False
    player.stealth_timer = 0
    
    for m in mobs:
        m.kill()
    for b in bosses:
        b.kill()
    for m in merchants:
        m.kill()
    bullets.empty()
    enemy_bullets.empty()
    pickups.empty()
    
    room_waves += 1
    spawn_mobs(4 + level)
    create_room(current_room_type)

create_room(current_room_type)
room_waves += 1
spawn_mobs(4 + level)
for b in bosses:
    b.kill()
for m in merchants:
    m.kill()
for c in chests:
    c.kill()

running = True
game_over = False
waiting = False

font = chinese_font_large
small_font = chinese_font_small

while running:
    clock.tick(FPS)
    # 根据房间类型设置背景色
    if current_room_type == 'battle':
        bg_color = (30, 30, 30)  # 战斗房：深色背景
        border_color = (100, 50, 50)  # 红色边框
    elif current_room_type == 'treasure':
        bg_color = (40, 30, 20)  # 宝箱房：暖色调
        border_color = (150, 100, 50)  # 金色边框
    elif current_room_type == 'shop':
        bg_color = (30, 30, 50)  # 商店房：蓝色调
        border_color = (100, 100, 180)  # 紫色边框
    elif current_room_type == 'boss':
        bg_color = (20, 10, 30)  # Boss房：暗紫色调
        border_color = (150, 50, 150)  # 紫色边框
    else:
        bg_color = GRAY
        border_color = BROWN
    
    screen.fill(bg_color)
    
    pygame.draw.rect(screen, border_color, (ROOM_X-5, ROOM_Y-5, ROOM_W+10, ROOM_H+10), 10)
    
    # 处理蓄力效果
    if player.charging:
        weapon = player.charge_weapon
        data = player.weapon_data[weapon]
        charge_time = pygame.time.get_ticks() - player.charge_start
        charge_level = min(charge_time // 200, 5)
        
        # 绘制蓄力进度条
        charge_percentage = min(charge_time / 1000, 1.0)  # 1000ms 为最大蓄力时间
        bar_width = 200
        bar_height = 10
        bar_x = player.rect.centerx - bar_width // 2
        bar_y = player.rect.y - 30
        
        # 背景条
        pygame.draw.rect(screen, (50, 50, 50), (bar_x, bar_y, bar_width, bar_height))
        # 进度条
        fill_width = int(bar_width * charge_percentage)
        pygame.draw.rect(screen, data.get('color', (255, 255, 255)), (bar_x, bar_y, fill_width, bar_height))
        
        # 蓄力效果已简化，移除粒子生成
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.MOUSEBUTTONDOWN and not game_over:
            if event.button == 1:  # 只响应鼠标左键
                weapon = player.weapons[player.current_weapon]
                data = player.weapon_data[weapon]
                if data.get('type') == 'laser_continuous':
                    player.is_shooting_laser = True
                elif data.get('chargeable') or data.get('type') in ['charge_hold', 'swing_charge', 'curry_wave', 'rainbow_horse', 'rainbow_horse_hold', 'laser_charge']:
                    player.charging = True
                    player.charge_start = pygame.time.get_ticks()
                    player.charge_weapon = weapon
                    # 记录原始速度
                    player.original_speed = player.speed
                    # 如果武器有减慢移动的效果，降低速度
                    if data.get('slow_movement'):
                        player.speed = player.speed * 0.5
                else:
                    player.shoot()
        if event.type == pygame.MOUSEBUTTONUP and not game_over:
            player.is_shooting_laser = False
            if player.charging:
                weapon = player.charge_weapon
                data = player.weapon_data[weapon]
                charge_time = pygame.time.get_ticks() - player.charge_start
                charge_level = min(charge_time // 200, 5)
                
                if data.get('type') == 'swing_charge':
                    now = pygame.time.get_ticks()
                    # 计算有效冷却时间，考虑攻速影响
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        if charge_level >= 3:
                            player.swing_charge_attack(base_angle, data, charge_level)
                        else:
                            player.swing_attack(base_angle, data)
                elif data.get('type') == 'curry_wave':
                    now = pygame.time.get_ticks()
                    # 计算有效冷却时间，考虑攻速影响
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        player.curry_wave_attack(base_angle, data, charge_level)
                elif data.get('type') == 'rainbow_horse':
                    now = pygame.time.get_ticks()
                    # 计算有效冷却时间，考虑攻速影响
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        player.rainbow_horse_attack(base_angle, data)
                elif data.get('type') == 'rainbow_horse_hold':
                    pass
                elif data.get('type') == 'bow_charge':
                    now = pygame.time.get_ticks()
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        charge_level = min(charge_time // 200, data.get('max_charge', 3))
                        # 确保至少为1级蓄力（点射）
                        actual_charge = max(1, min(charge_level, data.get('max_charge', 3)))
                        
                        if actual_charge == 1:
                            damage = data['damage'] * 1.0
                            bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle, int(damage), data['bullet_speed'], weapon)
                            bullet.charge_level = 1
                            all_sprites.add(bullet)
                            bullets.add(bullet)
                        elif actual_charge == 2:
                            for i in range(3):
                                spread = (i - 1) * 0.15
                                damage = data['damage'] * 1.3
                                bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle + spread, int(damage), data['bullet_speed'] * 1.1, weapon)
                                bullet.charge_level = 2
                                all_sprites.add(bullet)
                                bullets.add(bullet)
                        else:
                            for i in range(5):
                                spread = (i - 2) * 0.12
                                damage = data['damage'] * 1.8
                                bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle + spread, int(damage), data['bullet_speed'] * 1.3, weapon)
                                bullet.charge_level = 3
                                bullet.pierce = True
                                bullet.pierce_count = 2
                                all_sprites.add(bullet)
                                bullets.add(bullet)
                elif data.get('type') == 'charge_cannon':
                    now = pygame.time.get_ticks()
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        charge_level = min(charge_time // 200, data.get('max_charge', 3))
                        actual_charge = max(1, min(charge_level, data.get('max_charge', 3)))
                        
                        if actual_charge == 1:
                            damage = data['damage'] * 1.0
                            bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle, int(damage), data['bullet_speed'], weapon)
                            bullet.charge_level = 1
                            all_sprites.add(bullet)
                            bullets.add(bullet)
                        elif actual_charge == 2:
                            damage = data['damage'] * 1.5
                            bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle, int(damage), data['bullet_speed'] * 1.2, weapon)
                            bullet.charge_level = 2
                            bullet.gravity_aoe = True
                            all_sprites.add(bullet)
                            bullets.add(bullet)
                        else:
                            damage = data['damage'] * 2.5
                            bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle, int(damage), data['bullet_speed'] * 1.5, weapon)
                            bullet.charge_level = 3
                            bullet.gravity_aoe = True
                            bullet.large_explosion = True
                            all_sprites.add(bullet)
                            bullets.add(bullet)
                elif data.get('type') == 'laser_charge':
                    charge_level = min(charge_time // 200, data.get('max_charge', 3))
                    actual_charge = max(1, min(charge_level, data.get('max_charge', 3)))
                    player.shoot(actual_charge)
                else:
                    now = pygame.time.get_ticks()
                    # 计算有效冷却时间，考虑攻速影响
                    effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                    if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                        player.last_shot = now
                        player.mp -= data['mp_cost']
                        
                        mx, my = pygame.mouse.get_pos()
                        base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                        
                        if data.get('unique') == 'burst_fire' or data.get('unique') == 'laser_burst':
                            burst_count = data.get('burst_count', 5)
                            burst_interval = data.get('burst_interval', 50)
                            for i in range(burst_count):
                                timer = pygame.time.get_ticks() + i * burst_interval
                                player.burst_shots.append({'time': timer, 'angle': base_angle, 'data': data, 'weapon': weapon})
                        elif data.get('chargeable'):
                            # 蓄力激光炮的特殊处理
                            charge_level = min(charge_time // 300, data.get('max_charge', 3)) + 1
                            # 直接创建子弹，避免重复检查
                            mx, my = pygame.mouse.get_pos()
                            base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                            for i in range(data['count']):
                                spread = (random.random() - 0.5) * data['spread'] * 2
                                angle = base_angle + spread
                                # 根据蓄力等级调整伤害
                                damage = data['damage'] * charge_level
                                bullet = Bullet(player.rect.centerx, player.rect.centery, angle, damage, data['bullet_speed'], weapon)
                                if data.get('pierce'):
                                    bullet.pierce = True
                                if data.get('explosion'):
                                    bullet.explosion = True
                                if data.get('freeze'):
                                    bullet.freeze = True
                                if data.get('poison'):
                                    bullet.poison = True
                                if data.get('boomerang'):
                                    bullet.boomerang = True
                                if data.get('laser'):
                                    bullet.laser = True
                                if data.get('electro'):
                                    bullet.electro = True
                                if data.get('half_screen'):
                                    bullet.half_screen = True
                                if data.get('ion'):
                                    bullet.ion = True
                                if data.get('bounce'):
                                    bullet.bounce = True
                                if data.get('timed'):
                                    bullet.timed = True
                                    bullet.timer = 120  # 2秒后爆炸
                                if data.get('homing'):
                                    bullet.homing = True
                                if data.get('plasma'):
                                    bullet.plasma = True
                                # 设置蓄力等级
                                bullet.charge_level = charge_level
                                all_sprites.add(bullet)
                                bullets.add(bullet)
                        elif charge_level >= 3:
                            for i in range(3):
                                spread = (i - 1) * 0.2
                                angle = base_angle + spread
                                damage_mult = 1 + charge_level * 0.5
                                bullet = Bullet(player.rect.centerx, player.rect.centery, angle, int(data['damage'] * damage_mult), data['bullet_speed'], weapon)
                                if data.get('pierce'):
                                    bullet.pierce = True
                                if data.get('explosion'):
                                    bullet.explosion = True
                                all_sprites.add(bullet)
                                bullets.add(bullet)
                        else:
                            damage_mult = 1 + charge_level * 0.3
                            bullet = Bullet(player.rect.centerx, player.rect.centery, base_angle, int(data['damage'] * damage_mult), data['bullet_speed'], weapon)
                            if data.get('pierce'):
                                bullet.pierce = True
                            if data.get('explosion'):
                                bullet.explosion = True
                            all_sprites.add(bullet)
                            bullets.add(bullet)
                
                player.charging = False
                player.charge_weapon = None
                player.is_shooting_laser = False
                # 恢复原始速度
                if hasattr(player, 'original_speed'):
                    player.speed = player.original_speed
                    delattr(player, 'original_speed')
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 3 and not game_over:  # 鼠标右键
                player.use_skill()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_q and not game_over:
                player.switch_weapon()
            if event.key == pygame.K_e and not game_over:
                player.switch_skill()
            if event.key == pygame.K_f and not game_over:
                chest_opened = False
                for chest in chests:
                    if chest.rect.colliderect(player.rect) and not chest.opened:
                        chest.open()
                        spawn_pickups(WIDTH//2, HEIGHT//2, 3)
                        chest_opened = True
                        break
                if not chest_opened:
                    for merchant in merchants:
                        if merchant.rect.colliderect(player.rect):
                            waiting = True
                            break
                while waiting:
                    screen.fill(GRAY)
                    pygame.draw.rect(screen, BROWN, (ROOM_X-5, ROOM_Y-5, ROOM_W+10, ROOM_H+10), 10)
                    all_sprites.draw(screen)
                    player.draw_bars()
                    
                    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    overlay.fill((0, 0, 0, 180))
                    screen.blit(overlay, (0, 0))
                    
                    gold_text = small_font.render(f"你的金币: {player.gold}", True, YELLOW)
                    screen.blit(gold_text, (20, 20))
                    
                    title = font.render("商人交易 - 按数字键购买,ESC退出", True, WHITE)
                    screen.blit(title, (WIDTH//2 - title.get_width()//2, 80))
                    
                    for i, item in enumerate(merchant.items):
                        color = WHITE
                        if item['name'] in player.weapons:
                            color = GRAY
                        item_text = small_font.render(f"{i+1}. {item['name']}: {item['price']}金币", True, color)
                        screen.blit(item_text, (WIDTH//2 - item_text.get_width()//2, 130 + i*30))
                    
                    pygame.display.flip()
                    
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            running = False
                            waiting = False
                        elif event.type == pygame.KEYDOWN:
                            if event.key == pygame.K_ESCAPE:
                                waiting = False
                            elif event.key == pygame.K_1:
                                merchant.buy(0, player)
                            elif event.key == pygame.K_2:
                                merchant.buy(1, player)
                            elif event.key == pygame.K_3:
                                merchant.buy(2, player)
                            elif event.key == pygame.K_4:
                                merchant.buy(3, player)
                            elif event.key == pygame.K_5:
                                merchant.buy(4, player)
                            elif event.key == pygame.K_6:
                                merchant.buy(5, player)
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r and game_over:
                    reset_game()
                    game_over = False
    
    if not game_over:
        if pygame.mouse.get_pressed()[0] and not game_over:
            weapon = player.weapons[player.current_weapon]
            data = player.weapon_data[weapon]
            if data.get('type') == 'rainbow_horse_hold':
                now = pygame.time.get_ticks()
                # 计算有效冷却时间，考虑攻速影响
                effective_cooldown = data['cooldown'] / (player.attack_speed + player.attack_speed_bonus)
                if now - player.last_shot > effective_cooldown and player.mp >= data['mp_cost']:
                    player.last_shot = now
                    player.mp -= data['mp_cost']
                    mx, my = pygame.mouse.get_pos()
                    base_angle = math.atan2(my - player.rect.centery, mx - player.rect.centerx)
                    player.rainbow_horse_attack(base_angle, data)
        
        all_sprites.update()
        hit_effects.update()  # 更新命中效果
        damage_texts.update()  # 更新伤害数字效果
        particles.update()  # 更新粒子效果
        energy_orbs.update()  # 更新能量球
        small_energy_orbs.update()  # 更新小能量球
        
        # 移除重复的碰撞检测，碰撞检测已在Bullet类的update方法中处理
        
        if player.hp <= 0:
            game_over = True
        
        # 波次管理
        if current_room_type == 'boss':
            if len(bosses) == 0 and not wave_completed:
                wave_completed = True
                room_cleared = True
        elif current_room_type == 'battle' or current_room_type == 'shop':
            if len(mobs) == 0 and not wave_completed:
                wave_completed = True
                if room_waves < max_waves:
                    room_waves += 1
                    spawn_mobs(4 + level + room_waves)
                else:
                    room_cleared = True
                    spawn_pickups(WIDTH//2, HEIGHT//2, 2 + room_waves)
            elif len(mobs) == 0 and wave_completed:
                room_cleared = True
                
        # 战斗结束后自动捡起房间内的小球
        
        offset_x = 0
        offset_y = 0
        if room_cleared and len(pickups) > 0:
            for pickup in pickups:
                pickup_type = pickup.pickup_type
                pickup_value = pickup.value
                pickup.kill()
                if pickup_type == 'gold':
                    player.gold += pickup_value
                    player.score += pickup_value
                elif pickup_type == 'health':
                    player.hp = min(player.max_hp, player.hp + pickup_value)
                elif pickup_type == 'mana':
                    player.mp = min(player.max_mp, player.mp + pickup_value)
            pickups.empty()
        
        # 只有房间清理完成才能离开
        for door in doors:
            can_leave = room_cleared or current_room_type == 'treasure'
            if current_room_type == 'treasure':
                for chest in chests:
                    if chest.opened:
                        can_leave = True
                        break
            if door.check_enter() and can_leave:
                enter_room(door)
                break
        
        # 处理激光伤害
        for mob in mobs:
            if hasattr(mob, 'laser_state') and mob.laser_state == 'firing' and mob.laser_damage:
                # 计算玩家是否在激光路径上
                dist_to_player = math.hypot(player.rect.centerx - mob.rect.centerx, 
                                           player.rect.centery - mob.rect.centery)
                laser_length = 800  # 增加激光长度，从400改为800
                if dist_to_player < laser_length:
                    dx = player.rect.centerx - mob.rect.centerx
                    dy = player.rect.centery - mob.rect.centery
                    dot_product = dx * math.cos(mob.laser_angle) + dy * math.sin(mob.laser_angle)
                    if dot_product > 0:
                        # 计算玩家到激光线的距离
                        cross_product = dx * math.sin(mob.laser_angle) - dy * math.cos(mob.laser_angle)
                        distance_to_laser = abs(cross_product)
                        if distance_to_laser < 20:  # 激光宽度
                            if not player.stealth:
                                player.take_damage(mob.damage)
                            # 标记已经造成伤害，避免重复伤害
                            mob.laser_damage = False
        
        # 处理Boss激光伤害
        for boss in bosses:
            if hasattr(boss, 'laser_state') and boss.laser_state == 'firing' and boss.laser_damage:
                # 计算玩家是否在激光路径上
                dist_to_player = math.hypot(player.rect.centerx - boss.rect.centerx, 
                                           player.rect.centery - boss.rect.centery)
                laser_length = 1000
                if dist_to_player < laser_length:
                    dx = player.rect.centerx - boss.rect.centerx
                    dy = player.rect.centery - boss.rect.centery
                    dot_product = dx * math.cos(boss.laser_angle) + dy * math.sin(boss.laser_angle)
                    if dot_product > 0:
                        # 计算玩家到激光线的距离
                        cross_product = dx * math.sin(boss.laser_angle) - dy * math.cos(boss.laser_angle)
                        distance_to_laser = abs(cross_product)
                        if distance_to_laser < 30:  # 激光宽度
                            if not player.stealth:
                                player.take_damage(boss.damage * 1.5)  # 恢复正常伤害，因为有前摇
                            # 标记已经造成伤害，避免重复伤害
                            boss.laser_damage = False
                
                # 伤害范围内的敌人
                for mob in mobs:
                    mob_dist = math.hypot(mob.rect.centerx - boss.rect.centerx, 
                                         mob.rect.centery - boss.rect.centery)
                    if mob_dist < laser_length:
                        # 计算敌人是否在激光路径上
                        dx = mob.rect.centerx - boss.rect.centerx
                        dy = mob.rect.centery - boss.rect.centery
                        dot_product = dx * math.cos(boss.laser_angle) + dy * math.sin(boss.laser_angle)
                        if dot_product > 0:
                            # 计算敌人到激光线的距离
                            cross_product = dx * math.sin(boss.laser_angle) - dy * math.cos(boss.laser_angle)
                            distance_to_laser = abs(cross_product)
                            if distance_to_laser < 30:  # 激光宽度
                                mob.hp -= boss.damage * 1.0  # 恢复正常伤害
                                if mob.hp <= 0:
                                    player.score += 10
                                    spawn_pickups(mob.rect.centerx, mob.rect.centery, 1)
                                    mob.kill()
    
    # 应用屏幕震动偏移
    if offset_x != 0 or offset_y != 0:
        # 创建一个临时表面用于绘制
        temp_surface = pygame.Surface((WIDTH, HEIGHT))
        temp_surface.fill(BLACK)
        
        # 在临时表面上绘制所有内容
        all_sprites.draw(temp_surface)
        particles.draw(temp_surface)  # 绘制粒子效果
        energy_orbs.draw(temp_surface)  # 绘制能量球
        small_energy_orbs.draw(temp_surface)  # 绘制小能量球
        player.draw_bars(temp_surface)
        
        score_text = font.render(f"关卡: {level}  分数: {player.score}  金币: {player.gold}", True, WHITE)
        temp_surface.blit(score_text, (20, 20))
        
        weapon_text = small_font.render(f"武器: {player.weapons[player.current_weapon]} (Q切换)", True, WHITE)
        temp_surface.blit(weapon_text, (20, 60))
        
        skill = player.skills[player.current_skill]
        skill_data = player.skill_data[skill]
        now = pygame.time.get_ticks()
        skill_cooldown = skill_data['cooldown']
        skill_remaining = max(0, skill_cooldown - (now - player.last_skill_use))
        skill_ready = skill_remaining == 0
        
        if skill_ready:
            skill_text = small_font.render(f"技能: {skill} (E切换,右键释放)", True, YELLOW)
        else:
            remaining_seconds = skill_remaining / 1000
            if remaining_seconds >= 1:
                skill_text = small_font.render(f"技能: {skill} ({int(remaining_seconds+0.5)}s)", True, RED)
            else:
                skill_text = small_font.render(f"技能: {skill} ({remaining_seconds:.1f}s)", True, RED)
        temp_surface.blit(skill_text, (20, 85))
        
        # 绘制技能冷却条（只有有冷却的技能才显示）
        if skill_cooldown > 0:
            cooldown_bar_width = 100
            cooldown_bar_height = 6
            cooldown_x = 20
            cooldown_y = 100
            pygame.draw.rect(temp_surface, BLACK, (cooldown_x, cooldown_y, cooldown_bar_width, cooldown_bar_height))
            remaining_ratio = skill_remaining / skill_cooldown
            pygame.draw.rect(temp_surface, (100, 100, 100), (cooldown_x, cooldown_y, cooldown_bar_width * remaining_ratio, cooldown_bar_height))
        
        # 绘制激光攻击效果
        for mob in mobs:
            if hasattr(mob, 'laser_state') and mob.laser_state != 'idle':
                if mob.laser_state == 'charging':
                    # 前摇光束效果
                    progress = mob.laser_timer / 30
                    width = int(1 + progress * 5)
                    alpha = int(30 + progress * 80)
                    
                    charge_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(charge_surface, (0, 255, 255, alpha), mob.laser_start, mob.laser_end, width)
                    temp_surface.blit(charge_surface, (0, 0))
                elif mob.laser_state == 'firing':
                    # 实际激光效果
                    # 中心光束
                    center_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(center_surface, (0, 255, 255, 255), mob.laser_start, mob.laser_end, 4)
                    temp_surface.blit(center_surface, (0, 0))
                    
                    # 外层光束
                    outer_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(outer_surface, (0, 150, 255, 200), mob.laser_start, mob.laser_end, 8)
                    temp_surface.blit(outer_surface, (0, 0))
        
        # 绘制Boss激光攻击效果
        for boss in bosses:
            if hasattr(boss, 'laser_state') and boss.laser_state != 'idle':
                if boss.laser_state == 'charging':
                    # 前摇光束效果
                    progress = boss.laser_timer / 30
                    width = int(2 + progress * 8)
                    alpha = int(50 + progress * 100)
                    
                    charge_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(charge_surface, (255, 255, 255, alpha), boss.laser_start, boss.laser_end, width)
                    temp_surface.blit(charge_surface, (0, 0))
                elif boss.laser_state == 'firing':
                    # 实际激光效果
                    # 中心光束
                    center_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(center_surface, (255, 255, 255, 255), boss.laser_start, boss.laser_end, 6)
                    temp_surface.blit(center_surface, (0, 0))
                    
                    # 外层光束
                    outer_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(outer_surface, (255, 100, 0, 200), boss.laser_start, boss.laser_end, 12)
                    temp_surface.blit(outer_surface, (0, 0))
                    
                    # 最外层光晕
                    glow_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(glow_surface, (255, 200, 100, 120), boss.laser_start, boss.laser_end, 20)
                    temp_surface.blit(glow_surface, (0, 0))
        
        # BOSS战警告提示
        if show_boss_warning:
            boss_warning_timer -= 1
            if boss_warning_timer <= 0:
                show_boss_warning = False
                show_weapon_hint = True
                weapon_hint_timer = 180
            
            flash = (boss_warning_timer // 8) % 2
            alpha = 255 if flash else 150
            
            warning_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            pygame.draw.rect(warning_surface, (255, 0, 0, 30), (0, 0, WIDTH, HEIGHT))
            temp_surface.blit(warning_surface, (0, 0))
            
            warning_text1 = font.render("警告：BOSS行动迅捷，技能连发！", True, (255, 0, 0))
            warning_text2 = small_font.render("做好全力应战准备！灵活切换激光武器，把握转瞬即逝的输出机会！", True, (255, 200, 0))
            
            temp_surface.blit(warning_text1, (WIDTH//2 - warning_text1.get_width()//2, HEIGHT//2 - 40))
            temp_surface.blit(warning_text2, (WIDTH//2 - warning_text2.get_width()//2, HEIGHT//2 + 10))
        
        # 武器适配提示
        if show_weapon_hint and current_room_type == 'boss':
            weapon_hint_timer -= 1
            if weapon_hint_timer <= 0:
                show_weapon_hint = False
            
            hint_text1 = small_font.render("高速缠斗时，持续激光可有效压制敌人攻势；", True, (0, 255, 255))
            hint_text2 = small_font.render("BOSS露出破绽瞬间，立刻释放蓄力激光打出致命伤害！", True, (255, 200, 0))
            
            temp_surface.blit(hint_text1, (WIDTH//2 - hint_text1.get_width()//2, HEIGHT - 60))
            temp_surface.blit(hint_text2, (WIDTH//2 - hint_text2.get_width()//2, HEIGHT - 35))
        
        # 波次信息和Boss血条
        if current_room_type == 'boss' and len(bosses) > 0:
            boss_text = small_font.render("BOSS战!", True, RED)
            temp_surface.blit(boss_text, (WIDTH - 120, 20))
            
            boss = bosses.sprites()[0]
            boss_hp_bar_width = 400
            boss_hp_bar_height = 30
            boss_hp_x = (WIDTH - boss_hp_bar_width) // 2
            boss_hp_y = 100
            
            pygame.draw.rect(temp_surface, BLACK, (boss_hp_x-2, boss_hp_y-2, boss_hp_bar_width+4, boss_hp_bar_height+4))
            pygame.draw.rect(temp_surface, (200, 0, 0), (boss_hp_x, boss_hp_y, boss_hp_bar_width * (boss.hp / boss.max_hp), boss_hp_bar_height))
            
            boss_hp_text = small_font.render(f"Boss: {int(boss.hp)}/{boss.max_hp}", True, WHITE)
            temp_surface.blit(boss_hp_text, (WIDTH//2 - boss_hp_text.get_width()//2, boss_hp_y - 30))
        elif current_room_type == 'battle' and not room_cleared:
            wave_text = small_font.render(f"波次: {room_waves}/{max_waves}", True, WHITE)
            temp_surface.blit(wave_text, (WIDTH - 120, 60))
            if len(mobs) > 0:
                mob_text = small_font.render(f"剩余怪物: {len(mobs)}", True, WHITE)
                temp_surface.blit(mob_text, (WIDTH - 120, 80))
        elif room_cleared:
            clear_text = small_font.render("房间已清理，可以离开", True, GREEN)
            temp_surface.blit(clear_text, (WIDTH - 180, 60))
        
        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            temp_surface.blit(overlay, (0, 0))
            
            game_over_text = font.render("游戏结束!", True, RED)
            final_score_text = font.render(f"最终分数: {player.score}", True, WHITE)
            restart_text = small_font.render("按 R 重新开始", True, WHITE)
            
            temp_surface.blit(game_over_text, (WIDTH//2 - game_over_text.get_width()//2, HEIGHT//2 - 60))
            temp_surface.blit(final_score_text, (WIDTH//2 - final_score_text.get_width()//2, HEIGHT//2))
            temp_surface.blit(restart_text, (WIDTH//2 - restart_text.get_width()//2, HEIGHT//2 + 60))
        
        # 将临时表面绘制到屏幕上，并应用偏移
        screen.blit(temp_surface, (offset_x, offset_y))
    else:
        # 正常绘制，无偏移
        all_sprites.draw(screen)
        particles.draw(screen)  # 绘制粒子效果
        energy_orbs.draw(screen)  # 绘制能量球
        small_energy_orbs.draw(screen)  # 绘制小能量球
        player.draw_bars()
        
        # 绘制激光攻击效果
        for mob in mobs:
            if hasattr(mob, 'laser_state') and mob.laser_state != 'idle':
                if mob.laser_state == 'charging':
                    # 前摇光束效果
                    progress = mob.laser_timer / 30
                    width = int(1 + progress * 5)
                    alpha = int(30 + progress * 80)
                    
                    charge_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(charge_surface, (0, 255, 255, alpha), mob.laser_start, mob.laser_end, width)
                    screen.blit(charge_surface, (0, 0))
                elif mob.laser_state == 'firing':
                    # 实际激光效果
                    # 中心光束
                    center_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(center_surface, (0, 255, 255, 255), mob.laser_start, mob.laser_end, 4)
                    screen.blit(center_surface, (0, 0))
                    
                    # 外层光束
                    outer_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(outer_surface, (0, 150, 255, 200), mob.laser_start, mob.laser_end, 8)
                    screen.blit(outer_surface, (0, 0))
        
        # 绘制Boss激光攻击效果
        for boss in bosses:
            if hasattr(boss, 'laser_state') and boss.laser_state != 'idle':
                if boss.laser_state == 'charging':
                    # 前摇光束效果
                    progress = boss.laser_timer / 30
                    width = int(2 + progress * 8)
                    alpha = int(50 + progress * 100)
                    
                    charge_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(charge_surface, (255, 255, 255, alpha), boss.laser_start, boss.laser_end, width)
                    screen.blit(charge_surface, (0, 0))
                elif boss.laser_state == 'firing':
                    # 实际激光效果
                    # 中心光束
                    center_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(center_surface, (255, 255, 255, 255), boss.laser_start, boss.laser_end, 6)
                    screen.blit(center_surface, (0, 0))
                    
                    # 外层光束
                    outer_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(outer_surface, (255, 100, 0, 200), boss.laser_start, boss.laser_end, 12)
                    screen.blit(outer_surface, (0, 0))
                    
                    # 最外层光晕
                    glow_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
                    pygame.draw.line(glow_surface, (255, 200, 100, 120), boss.laser_start, boss.laser_end, 20)
                    screen.blit(glow_surface, (0, 0))
        
        score_text = font.render(f"关卡: {level}  分数: {player.score}  金币: {player.gold}", True, WHITE)
        screen.blit(score_text, (20, 20))
        
        weapon_text = small_font.render(f"武器: {player.weapons[player.current_weapon]} (Q切换)", True, WHITE)
        screen.blit(weapon_text, (20, 60))
        
        skill = player.skills[player.current_skill]
        skill_data = player.skill_data[skill]
        now = pygame.time.get_ticks()
        skill_cooldown = skill_data['cooldown']
        skill_remaining = max(0, skill_cooldown - (now - player.last_skill_use))
        skill_ready = skill_remaining == 0
        
        if skill_ready:
            skill_text = small_font.render(f"技能: {skill} (E切换,右键释放)", True, YELLOW)
        else:
            remaining_seconds = skill_remaining / 1000
            if remaining_seconds >= 1:
                skill_text = small_font.render(f"技能: {skill} ({int(remaining_seconds+0.5)}s)", True, RED)
            else:
                skill_text = small_font.render(f"技能: {skill} ({remaining_seconds:.1f}s)", True, RED)
        screen.blit(skill_text, (20, 85))
        
        # 绘制技能冷却条（只有有冷却的技能才显示）
        if skill_cooldown > 0:
            cooldown_bar_width = 100
            cooldown_bar_height = 6
            cooldown_x = 20
            cooldown_y = 100
            pygame.draw.rect(screen, BLACK, (cooldown_x, cooldown_y, cooldown_bar_width, cooldown_bar_height))
            remaining_ratio = skill_remaining / skill_cooldown
            pygame.draw.rect(screen, (100, 100, 100), (cooldown_x, cooldown_y, cooldown_bar_width * remaining_ratio, cooldown_bar_height))
        
        # 波次信息和Boss血条
        if current_room_type == 'boss' and len(bosses) > 0:
            boss_text = small_font.render("BOSS战!", True, RED)
            screen.blit(boss_text, (WIDTH - 120, 20))
            
            boss = bosses.sprites()[0]
            boss_hp_bar_width = 400
            boss_hp_bar_height = 30
            boss_hp_x = (WIDTH - boss_hp_bar_width) // 2
            boss_hp_y = 100
            
            pygame.draw.rect(screen, BLACK, (boss_hp_x-2, boss_hp_y-2, boss_hp_bar_width+4, boss_hp_bar_height+4))
            pygame.draw.rect(screen, (200, 0, 0), (boss_hp_x, boss_hp_y, boss_hp_bar_width * (boss.hp / boss.max_hp), boss_hp_bar_height))
            
            boss_hp_text = small_font.render(f"Boss: {int(boss.hp)}/{boss.max_hp}", True, WHITE)
            screen.blit(boss_hp_text, (WIDTH//2 - boss_hp_text.get_width()//2, boss_hp_y - 30))
        elif current_room_type == 'battle' and not room_cleared:
            wave_text = small_font.render(f"波次: {room_waves}/{max_waves}", True, WHITE)
            screen.blit(wave_text, (WIDTH - 120, 60))
            if len(mobs) > 0:
                mob_text = small_font.render(f"剩余怪物: {len(mobs)}", True, WHITE)
                screen.blit(mob_text, (WIDTH - 120, 80))
        elif room_cleared:
            clear_text = small_font.render("房间已清理，可以离开", True, GREEN)
            screen.blit(clear_text, (WIDTH - 180, 60))
        
        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            screen.blit(overlay, (0, 0))
            
            game_over_text = font.render("游戏结束!", True, RED)
            final_score_text = font.render(f"最终分数: {player.score}", True, WHITE)
            restart_text = small_font.render("按 R 重新开始", True, WHITE)
            
            screen.blit(game_over_text, (WIDTH//2 - game_over_text.get_width()//2, HEIGHT//2 - 60))
            screen.blit(final_score_text, (WIDTH//2 - final_score_text.get_width()//2, HEIGHT//2))
            screen.blit(restart_text, (WIDTH//2 - restart_text.get_width()//2, HEIGHT//2 + 60))
    
    pygame.display.flip()

pygame.quit()
