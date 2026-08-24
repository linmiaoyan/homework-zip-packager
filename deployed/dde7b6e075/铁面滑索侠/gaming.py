import pygame
import pymunk
import pymunk.pygame_util
import math
import random

# 初始化Pygame
pygame.init()

# 游戏设置
WIDTH, HEIGHT = 800, 600
FPS = 60
GRAVITY = (0, 900)
GROUND_HEIGHT = 50  # 增加地面高度

# 颜色定义
DEEP_BLUE = (0, 20, 40)
LIGHT_BLUE = (100, 150, 255)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)
PURPLE = (128, 0, 128)

# 游戏状态
START_POS = (100, 100)
END_POS = (700, 500)
COLLECTIBLES_COUNT = 5
OBSTACLES_COUNT = 8

# 绳子设置
ROPE_COLOR = (200, 200, 200)
ROPE_MAX_LENGTH = 300
ROPE_STIFFNESS = 5000  # 增加刚度，减少弹性
ROPE_DAMPING = 50      # 增加阻尼，减少振荡
MAX_ROPES = 3  # 最多同时存在的绳子数量

# 空格键向上力设置
SPACE_FORCE = 3000  # 空格键施加的向上力大小

# 创建屏幕（无边框窗口模式）
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Physics Ball Game")
clock = pygame.time.Clock()

# 创建物理空间
space = pymunk.Space()
space.gravity = GRAVITY

# 碰撞类型
COLLISION_TYPE_BALL = 1
COLLISION_TYPE_WALL = 2

# 创建玩家球体
def create_ball():
    mass = 5
    radius = 30
    moment = pymunk.moment_for_circle(mass, 0, radius)
    body = pymunk.Body(mass, moment)
    body.position = START_POS
    shape = pymunk.Circle(body, radius)
    shape.elasticity = 0.4
    shape.friction = 0.3
    shape.collision_type = COLLISION_TYPE_BALL
    space.add(body, shape)
    return body, shape

# 创建随机抓取点
def create_collectibles():
    collectibles = []
    for i in range(COLLECTIBLES_COUNT):
        x = random.randint(50, WIDTH - 50)
        y = random.randint(50, HEIGHT - 50)
        # 确保抓取点不在起点和终点附近
        while (abs(x - START_POS[0]) < 100 and abs(y - START_POS[1]) < 100) or \
              (abs(x - END_POS[0]) < 100 and abs(y - END_POS[1]) < 100):
            x = random.randint(50, WIDTH - 50)
            y = random.randint(50, HEIGHT - 50)
        collectibles.append((x, y))
    return collectibles

# 创建随机障碍物
def create_obstacles(collectibles):
    """创建障碍物，确保不与奖励点和其他障碍物重叠"""
    obstacles = []
    max_attempts = 100  # 最大尝试次数，避免无限循环
    
    for i in range(OBSTACLES_COUNT):
        attempts = 0
        valid_position = False
        
        while not valid_position and attempts < max_attempts:
            attempts += 1
            
            # 随机选择障碍物类型：矩形或圆形
            obstacle_type = random.choice(['rect', 'circle'])
            
            if obstacle_type == 'rect':
                # 矩形障碍物 - 优化大小范围
                width = random.randint(40, 120)
                height = random.randint(40, 120)
                x = random.randint(50, WIDTH - width - 50)
                y = random.randint(50, HEIGHT - height - 50)
                
                # 计算障碍物中心位置和边界
                center_x = x + width/2
                center_y = y + height/2
                
            else:
                # 圆形障碍物 - 优化大小范围
                radius = random.randint(25, 70)
                x = random.randint(50, WIDTH - radius - 50)
                y = random.randint(50, HEIGHT - radius - 50)
                center_x, center_y = x, y
            
            # 检查是否在起点和终点安全距离外
            start_distance = math.sqrt((center_x - START_POS[0])**2 + (center_y - START_POS[1])**2)
            end_distance = math.sqrt((center_x - END_POS[0])**2 + (center_y - END_POS[1])**2)
            
            if start_distance < 200 or end_distance < 200:
                continue  # 距离太近，重新生成
            
            # 检查与奖励点的间距（确保不重叠）
            too_close_to_collectible = False
            for collectible in collectibles:
                cx, cy = collectible
                distance = math.sqrt((center_x - cx)**2 + (center_y - cy)**2)
                
                # 障碍物与奖励点之间至少保持50像素距离
                if obstacle_type == 'rect':
                    min_distance = max(width, height) / 2 + 25
                else:
                    min_distance = radius + 25
                
                if distance < min_distance:
                    too_close_to_collectible = True
                    break
            
            if too_close_to_collectible:
                continue  # 距离奖励点太近，重新生成
            
            # 检查与其他障碍物的间距
            too_close = False
            for existing_obstacle in obstacles:
                if existing_obstacle['type'] == 'rect':
                    existing_center_x = existing_obstacle['x'] + existing_obstacle['width']/2
                    existing_center_y = existing_obstacle['y'] + existing_obstacle['height']/2
                    existing_radius = max(existing_obstacle['width'], existing_obstacle['height']) / 2
                else:
                    existing_center_x = existing_obstacle['x']
                    existing_center_y = existing_obstacle['y']
                    existing_radius = existing_obstacle['radius']
                
                distance = math.sqrt((center_x - existing_center_x)**2 + (center_y - existing_center_y)**2)
                
                # 计算两个障碍物之间的最小距离
                if obstacle_type == 'rect':
                    current_radius = max(width, height) / 2
                else:
                    current_radius = radius
                
                min_distance = existing_radius + current_radius + 30  # 额外30像素间距
                
                if distance < min_distance:
                    too_close = True
                    break
            
            if too_close:
                continue  # 距离太近，重新生成
            
            # 检查是否在主要路径上（从起点到终点的直线路径）
            path_distance = point_to_line_distance(center_x, center_y, START_POS[0], START_POS[1], END_POS[0], END_POS[1])
            
            # 如果太靠近主要路径，但不在起点终点附近，可以接受（增加挑战性）
            if path_distance < 80 and start_distance > 250 and end_distance > 250:
                # 可以接受，但有一定概率重新生成
                if random.random() < 0.3:  # 30%概率重新生成
                    continue
            
            # 位置有效，创建障碍物
            valid_position = True
            
            if obstacle_type == 'rect':
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = (center_x, center_y)
                shape = pymunk.Poly.create_box(body, (width, height))
                shape.elasticity = 0.8
                shape.friction = 0.5
                space.add(body, shape)
                obstacles.append({'type': 'rect', 'body': body, 'shape': shape, 'x': x, 'y': y, 'width': width, 'height': height})
            
            else:
                body = pymunk.Body(body_type=pymunk.Body.STATIC)
                body.position = (center_x, center_y)
                shape = pymunk.Circle(body, radius)
                shape.elasticity = 0.8
                shape.friction = 0.5
                space.add(body, shape)
                obstacles.append({'type': 'circle', 'body': body, 'shape': shape, 'x': x, 'y': y, 'radius': radius})
    
    return obstacles

# 计算点到直线的距离
def point_to_line_distance(px, py, x1, y1, x2, y2):
    """计算点(px, py)到直线(x1,y1)-(x2,y2)的距离"""
    if x1 == x2 and y1 == y2:
        return math.sqrt((px - x1)**2 + (py - y1)**2)
    
    # 使用向量方法计算距离
    numerator = abs((y2 - y1)*px - (x2 - x1)*py + x2*y1 - y2*x1)
    denominator = math.sqrt((y2 - y1)**2 + (x2 - x1)**2)
    
    return numerator / denominator if denominator != 0 else 0

# 创建边界墙壁
def create_walls():
    walls = []
    # 地面（增加高度）
    ground = pymunk.Body(body_type=pymunk.Body.STATIC)
    ground_shape = pymunk.Segment(ground, (0, HEIGHT - GROUND_HEIGHT), (WIDTH, HEIGHT - GROUND_HEIGHT), 10)
    ground_shape.elasticity = 0.6
    ground_shape.collision_type = COLLISION_TYPE_WALL
    space.add(ground, ground_shape)
    walls.append(ground_shape)
    
    # 天花板
    ceiling = pymunk.Body(body_type=pymunk.Body.STATIC)
    ceiling_shape = pymunk.Segment(ceiling, (0, 0), (WIDTH, 0), 10)
    ceiling_shape.elasticity = 0.6
    ceiling_shape.collision_type = COLLISION_TYPE_WALL
    space.add(ceiling, ceiling_shape)
    walls.append(ceiling_shape)
    
    # 左侧墙壁
    left_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
    left_wall_shape = pymunk.Segment(left_wall, (0, 0), (0, HEIGHT - GROUND_HEIGHT), 10)
    left_wall_shape.elasticity = 0.6
    left_wall_shape.collision_type = COLLISION_TYPE_WALL
    space.add(left_wall, left_wall_shape)
    walls.append(left_wall_shape)
    
    # 右侧墙壁
    right_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
    right_wall_shape = pymunk.Segment(right_wall, (WIDTH, 0), (WIDTH, HEIGHT - GROUND_HEIGHT), 10)
    right_wall_shape.elasticity = 0.6
    right_wall_shape.collision_type = COLLISION_TYPE_WALL
    space.add(right_wall, right_wall_shape)
    walls.append(right_wall_shape)
    
    return walls

# 检查点击位置是否在障碍物上
def is_on_obstacle(pos, obstacles):
    """检查给定位置是否在障碍物上"""
    x, y = pos
    
    for obstacle in obstacles:
        if obstacle['type'] == 'rect':
            # 检查矩形障碍物
            ox, oy, ow, oh = obstacle['x'], obstacle['y'], obstacle['width'], obstacle['height']
            if ox <= x <= ox + ow and oy <= y <= oy + oh:
                return True
        else:
            # 检查圆形障碍物
            cx, cy, cr = obstacle['x'], obstacle['y'], obstacle['radius']
            distance = math.sqrt((x - cx)**2 + (y - cy)**2)
            if distance <= cr:
                return True
    
    return False

# 创建绳子（只能收缩，不能拉伸，只能设置在障碍物上）
def create_rope(ball_body, anchor_pos):
    """在球体和锚点之间创建只能收缩的绳子（锚点为静态物体）"""
    # 创建锚点（静态物体，不受重力影响）
    anchor_body = pymunk.Body(body_type=pymunk.Body.STATIC)
    anchor_body.position = anchor_pos
    
    # 计算当前距离
    ball_pos = ball_body.position
    current_distance = math.sqrt((ball_pos.x - anchor_pos[0])**2 + (ball_pos.y - anchor_pos[1])**2)
    
    # 使用刚性弹簧来模拟只能收缩的绳子
    rope_joint = pymunk.DampedSpring(
        ball_body, anchor_body, 
        (0, 0), (0, 0),  # 两个连接点相对于各自物体的位置
        min(current_distance, ROPE_MAX_LENGTH),  # 静止长度设为当前距离或最大长度
        ROPE_STIFFNESS * 10,   # 大幅增加刚度，减少弹性
        ROPE_DAMPING * 5       # 大幅增加阻尼，快速消除振荡
    )
    
    space.add(anchor_body, rope_joint)
    return rope_joint, anchor_body

# 删除绳子
def remove_rope(rope_joint, anchor_body):
    """从物理空间中移除绳子"""
    space.remove(rope_joint, anchor_body)

# 删除最早的绳子（当绳子数量超过限制时）
def remove_oldest_rope(ropes):
    """删除列表中最先创建的绳子"""
    if ropes:
        oldest_rope = ropes.pop(0)  # 移除第一个元素（最早创建的）
        remove_rope(oldest_rope['joint'], oldest_rope['anchor'])
        return True
    return False

# 重置球体位置
def reset_ball(body):
    body.position = START_POS
    body.velocity = (0, 0)
    body.angular_velocity = 0

# 检查球体是否掉落到底部以下（考虑新的地面高度）
def check_ball_fallen(ball_pos):
    return ball_pos[1] > HEIGHT - GROUND_HEIGHT + 100

# 检查抓取点收集
def check_collectible_collision(ball_pos, collectibles, collected):
    ball_radius = 20
    new_collected = collected.copy()
    
    for i, (cx, cy) in enumerate(collectibles):
        if i not in collected:
            distance = math.sqrt((ball_pos[0] - cx)**2 + (ball_pos[1] - cy)**2)
            if distance < ball_radius + 15:  # 抓取点半径为15
                new_collected.add(i)
    
    return new_collected

# 检查是否到达终点
def check_end_collision(ball_pos):
    ball_radius = 20
    distance = math.sqrt((ball_pos[0] - END_POS[0])**2 + (ball_pos[1] - END_POS[1])**2)
    return distance < ball_radius + 25  # 终点区域半径为25

# 绘制绳子
def draw_rope(screen, rope_joint, anchor_body, ball_body):
    if rope_joint and anchor_body:
        # 获取绳子的两个端点位置
        anchor_pos = int(anchor_body.position.x), int(anchor_body.position.y)
        ball_pos = int(ball_body.position.x), int(ball_body.position.y)
        
        # 绘制绳子
        pygame.draw.line(screen, ROPE_COLOR, anchor_pos, ball_pos, 3)
        
        # 绘制锚点
        pygame.draw.circle(screen, WHITE, anchor_pos, 5)

# 绘制多根绳子
def draw_ropes(screen, ropes, ball_body):
    """绘制所有绳子"""
    for rope in ropes:
        draw_rope(screen, rope['joint'], rope['anchor'], ball_body)

# 绘制游戏元素
def draw_game_elements(screen, ball_body, ball_shape, collectibles, obstacles, collected, font, ropes=None, ball_image=None, collectible_images=None, background_image=None):
    # 绘制背景
    if background_image:
        screen.blit(background_image, (0, 0))
    else:
        screen.fill(DEEP_BLUE)
    
    # 绘制地面（可视化）
    pygame.draw.rect(screen, (100, 100, 100), (0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT))
    
    # 绘制起点和终点
    pygame.draw.circle(screen, GREEN, START_POS, 30, 3)
    pygame.draw.circle(screen, RED, END_POS, 30, 3)
    
    # 绘制抓取点（使用图片）
    if collectible_images:
        for i, (cx, cy) in enumerate(collectibles):
            if i in collected:
                # 已收集的奖励点
                image_rect = collectible_images[1].get_rect(center=(cx, cy))
                screen.blit(collectible_images[1], image_rect)
            else:
                # 未收集的奖励点
                image_rect = collectible_images[0].get_rect(center=(cx, cy))
                screen.blit(collectible_images[0], image_rect)
    else:
        # 如果没有图片，使用默认绘制
        for i, (cx, cy) in enumerate(collectibles):
            if i in collected:
                pygame.draw.circle(screen, GREEN, (cx, cy), 15)
            else:
                pygame.draw.circle(screen, YELLOW, (cx, cy), 15)
    
    # 绘制障碍物
    for obstacle in obstacles:
        if obstacle['type'] == 'rect':
            pygame.draw.rect(screen, ORANGE, (obstacle['x'], obstacle['y'], obstacle['width'], obstacle['height']))
        else:
            pygame.draw.circle(screen, PURPLE, (obstacle['x'], obstacle['y']), obstacle['radius'])
    
    # 绘制绳子（如果有）
    if ropes:
        draw_ropes(screen, ropes, ball_body)
    
    # 绘制球体（使用图片）
    ball_pos = int(ball_body.position.x), int(ball_body.position.y)
    radius = int(ball_shape.radius)
    
    if ball_image:
        # 计算图片绘制位置（使图片中心与球体中心对齐）
        image_rect = ball_image.get_rect(center=ball_pos)
        # 旋转图片（减慢转速，使用1/4的角度）
        slow_angle = ball_body.angle * 0.25  # 减慢到原来的1/4速度
        rotated_image = pygame.transform.rotate(ball_image, -math.degrees(slow_angle))
        rotated_rect = rotated_image.get_rect(center=ball_pos)
        screen.blit(rotated_image, rotated_rect)
    else:
        # 如果没有图片，使用默认绘制
        # 绘制发光效果
        for i in range(5, 0, -1):
            glow_radius = radius + i * 3
            glow_color = (100 + i * 20, 150 + i * 20, 255)
            pygame.draw.circle(screen, glow_color, ball_pos, glow_radius, 1)
        
        # 绘制球体
        pygame.draw.circle(screen, LIGHT_BLUE, ball_pos, radius)
        
        # 绘制旋转标记
        angle = ball_body.angle
        mark_length = radius - 5
        mark_end = (
            ball_pos[0] + mark_length * math.cos(angle),
            ball_pos[1] + mark_length * math.sin(angle)
        )
        pygame.draw.line(screen, WHITE, ball_pos, mark_end, 2)
    
    # 绘制游戏状态
    collected_text = font.render(f'Collected: {len(collected)}/{COLLECTIBLES_COUNT}', True, WHITE)
    screen.blit(collected_text, (10, 10))
    
    # 绘制控制说明
    control_text1 = font.render('Left Click: Create rope on obstacles (max 3)', True, WHITE)
    control_text2 = font.render('Right Click: Remove all ropes SPACE: Jump', True, WHITE)
    screen.blit(control_text1, (10, 50))
    screen.blit(control_text2, (10, 80))
    
    # 如果收集完所有抓取点，显示提示
    if len(collected) == COLLECTIBLES_COUNT:
        complete_text = font.render('All collectibles collected! Go to finish!', True, GREEN)
        screen.blit(complete_text, (WIDTH//2 - 150, 40))

# 主游戏循环
def main():
    ball_body, ball_shape = create_ball()
    walls = create_walls()
    collectibles = create_collectibles()
    obstacles = create_obstacles(collectibles)
    
    # 游戏状态
    collected = set()
    
    # 绳子状态（支持多根绳子）
    ropes = []  # 存储所有绳子的列表，每个绳子是一个字典：{'joint': rope_joint, 'anchor': anchor_body}
    
    # 创建字体
    font = pygame.font.Font(None, 36)
    
    # 加载小球图片
    ball_image = pygame.image.load('gggg.png').convert_alpha()
    # 调整图片大小（根据球体半径）
    image_size = int(ball_shape.radius * 2)
    ball_image = pygame.transform.scale(ball_image, (image_size, image_size))
    
    # 加载奖励点图片
    collectible_image_uncollected = pygame.image.load('mz2.png').convert_alpha()
    collectible_image_collected = pygame.image.load('mz.png').convert_alpha()
    # 调整图片大小（奖励点半径为 15）
    collectible_size = 30  # 直径
    collectible_image_uncollected = pygame.transform.scale(collectible_image_uncollected, (collectible_size, collectible_size))
    collectible_image_collected = pygame.transform.scale(collectible_image_collected, (collectible_size, collectible_size))
    
    # 加载背景图片
    background_image = pygame.image.load('bg.png').convert()
    # 调整背景图片大小以匹配屏幕
    background_image = pygame.transform.scale(background_image, (WIDTH, HEIGHT))
    
    # 启用Pygame绘图
    draw_options = pymunk.pygame_util.DrawOptions(screen)
    
    running = True
    while running:
        # 事件处理
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:  # 按R键重置游戏
                    reset_ball(ball_body)
                    collected = set()
                    # 删除所有绳子
                    for rope in ropes:
                        remove_rope(rope['joint'], rope['anchor'])
                    ropes = []
                elif event.key == pygame.K_n:  # 按N键重新生成关卡
                    # 删除所有绳子
                    for rope in ropes:
                        remove_rope(rope['joint'], rope['anchor'])
                    
                    space.remove(ball_body, ball_shape)
                    for wall in walls:
                        space.remove(wall.body, wall)
                    for obstacle in obstacles:
                        space.remove(obstacle['body'], obstacle['shape'])
                    
                    ball_body, ball_shape = create_ball()
                    walls = create_walls()
                    collectibles = create_collectibles()
                    obstacles = create_obstacles(collectibles)
                    collected = set()
                    ropes = []
                elif event.key == pygame.K_SPACE:  # 按空格键 - 施加向上力
                    # 施加一次性的向上力（使用世界坐标）
                    ball_body.apply_impulse_at_world_point((0, -SPACE_FORCE), ball_body.position)
            
            # 鼠标事件处理 - 绳子功能
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # 左键点击 - 创建绳子
                    # 检查点击位置是否在障碍物上
                    if not is_on_obstacle(event.pos, obstacles):
                        continue  # 不在障碍物上，不创建绳子
                    
                    # 检查绳子数量限制
                    if len(ropes) >= MAX_ROPES:
                        # 删除最早的绳子
                        remove_oldest_rope(ropes)
                    
                    # 在鼠标位置创建新绳子
                    rope_joint, anchor_body = create_rope(ball_body, event.pos)
                    ropes.append({'joint': rope_joint, 'anchor': anchor_body})
                    
                elif event.button == 3:  # 右键点击 - 删除所有绳子
                    # 删除所有绳子
                    for rope in ropes:
                        remove_rope(rope['joint'], rope['anchor'])
                    ropes = []
        
        # 检查球体是否掉落到底部以下（考虑新的地面高度）
        ball_pos = (ball_body.position.x, ball_body.position.y)
        if check_ball_fallen(ball_pos):
            reset_ball(ball_body)
            # 删除所有绳子
            for rope in ropes:
                remove_rope(rope['joint'], rope['anchor'])
            ropes = []
        
        # 检查抓取点收集
        collected = check_collectible_collision(ball_pos, collectibles, collected)
        
        # 检查是否收集完所有奖励点并到达终点（自动进入下一关）
        if len(collected) == COLLECTIBLES_COUNT and check_end_collision(ball_pos):
            # 自动进入下一关
            # 删除所有绳子
            for rope in ropes:
                remove_rope(rope['joint'], rope['anchor'])
            ropes = []
            
            # 删除现有物体
            space.remove(ball_body, ball_shape)
            for wall in walls:
                space.remove(wall.body, wall)
            for obstacle in obstacles:
                space.remove(obstacle['body'], obstacle['shape'])
            
            # 创建新关卡
            ball_body, ball_shape = create_ball()
            walls = create_walls()
            collectibles = create_collectibles()
            obstacles = create_obstacles(collectibles)
            collected = set()
        
        # 物理步进
        space.step(1 / FPS)
        
        # 绘制游戏元素
        draw_game_elements(screen, ball_body, ball_shape, collectibles, obstacles, collected, font, ropes, ball_image, [collectible_image_uncollected, collectible_image_collected], background_image)
        
        # 绘制绳子数量信息
        rope_count_text = font.render(f'绳子数量: {len(ropes)}/{MAX_ROPES}', True, WHITE)
        screen.blit(rope_count_text, (10, 110))
        
        # 更新屏幕
        pygame.display.flip()
        clock.tick(FPS)
    
    pygame.quit()

if __name__ == "__main__":
    main()