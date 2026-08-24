// ============================================
// 恐怖解谜游戏系统 - 校园夜惊魂
// 扩展原有游戏功能，添加恐怖解谜元素
// ============================================

// 游戏状态管理
const gameState = {
    // 游戏阶段: 'start', 'early', 'mid', 'late', 'ending'
    stage: 'start',
    // 玩家生命值 (0-100)
    health: 100,
    // 被捕次数
    caughtCount: 0,
    // 是否通关
    isGameOver: false,
    // 是否胜利
    isWin: false,
    // 游戏时间
    gameTime: 0,
    // 当前任务提示
    currentHint: '你在学校门口醒来，需要找到进入学校的方法...',
    // 密码输入相关
    passwordInput: {
        active: false,
        puzzleId: '',
        input: '',
        maxLength: 4
    },
    // 笔记本查看相关
    notebook: {
        active: false,
        pages: [
            '老师们全都疯了。',
            '我要逃出去。',
            '他们来抓我了',
            '校园里有鬼。'
        ],
        currentPage: 0
    }
};

// 物品系统
const inventory = {
    items: [],
    maxSlots: 81,
    
    // 添加物品
    add(item) {
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            showMessage(`获得: ${item.name}`);
            return true;
        }
        showMessage('背包已满!');
        return false;
    },
    
    // 移除物品
    remove(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index > -1) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    },
    
    // 检查是否有某物品
    has(itemId) {
        return this.items.some(item => item.id === itemId);
    },
    
    // 检查是否有某类物品
    hasType(type) {
        return this.items.some(item => item.type === type);
    },
    
    // 获取某类物品数量
    countType(type) {
        return this.items.filter(item => item.type === type).length;
    }
};

// 物品定义
const ITEMS = {
    // 钥匙类
    KEY_CLASSROOM: { id: 'key_classroom', name: '教室钥匙', type: 'key', description: '可以打开教学楼的教室门', icon: '🔑' },
    KEY_LAB: { id: 'key_lab', name: '实验室钥匙', type: 'key', description: '可以打开化学实验室', icon: '🔑' },
    KEY_LIBRARY: { id: 'key_library', name: '图书馆钥匙', type: 'key', description: '可以打开图书馆的古籍室', icon: '🔑' },
    KEY_ROOFTOP: { id: 'key_rooftop', name: '天台钥匙', type: 'key', description: '可以打开天台入口', icon: '🔑' },
    KEY_GUARD_ROOM: { id: 'key_guard_room', name: '门卫室钥匙', type: 'key', description: '可以打开主教学楼的大门', icon: '🔑' },
    
    // 道具类
    FLASHLIGHT: { id: 'flashlight', name: '手电筒', type: 'tool', description: '照亮黑暗区域，需要电池', icon: '🔦', battery: 100 },
    BATTERY: { id: 'battery', name: '电池', type: 'consumable', description: '为手电筒充电', icon: '🔋' },
    NOTEBOOK: { id: 'notebook', name: '笔记本', type: 'tool', description: '记录线索和谜题答案', icon: '📓' },
    CHEMICAL: { id: 'chemical', name: '化学试剂', type: 'tool', description: '可以溶解某些障碍物', icon: '🧪' },
    CAMERA: { id: 'camera', name: '相机', type: 'tool', description: '拍摄鬼魂显现的瞬间', icon: '📷' },
    HYDROCHLORIC_ACID: { id: 'hydrochloric_acid', name: '浓盐酸', type: 'tool', description: '可以腐蚀金属门锁，打开物理实验室的门', icon: '🧪' },
    
    // 解谜物品
    STUDENT_ID_1: { id: 'student_id_1', name: '学生证(李明)', type: 'puzzle', description: '2013届学生，化学社成员', icon: '🪪' },
    STUDENT_ID_2: { id: 'student_id_2', name: '学生证(王芳)', type: 'puzzle', description: '2013届学生，图书馆管理员', icon: '🪪' },
    STUDENT_ID_3: { id: 'student_id_3', name: '学生证(张伟)', type: 'puzzle', description: '2013届学生，班长', icon: '🪪' },
    SCHOOL_NEWSPAPER: { id: 'school_newspaper', name: '校报', type: 'puzzle', description: '2013年10月13日的校报，记录了那场惨案', icon: '📰' },
    STUDENT_RECORD: { id: 'student_record', name: '学生档案', type: 'puzzle', description: '记录了2013届所有学生的信息', icon: '📁' },
    MYSTERY_SYMBOL: { id: 'mystery_symbol', name: '神秘符号', type: 'puzzle', description: '天台墙壁上的奇怪符号，似乎是某种密码', icon: '🔮' },
    PASSWORD_NOTE: { id: 'password_note', name: '密码纸条', type: 'puzzle', description: '上面写着：2026，这可能是某个密码', icon: '📝' },
    
    // 电脑
    COMPUTER: { id: 'computer', name: '电脑', type: 'interactive', description: '可以输入密码的电脑终端', icon: '💻' }
};

// 可交互物品位置（在地图上的位置）
const worldItems = [
    // 门卫室物品
    { item: ITEMS.FLASHLIGHT, x: 100, y: 100, building: null, room: null, picked: false },
    { item: ITEMS.KEY_GUARD_ROOM, x: 150, y: 120, building: null, room: null, picked: false },
    
    // 教学楼物品
    { item: ITEMS.NOTEBOOK, x: 1700, y: 400, building: '教学楼', room: '101教室', picked: false },
    { item: ITEMS.KEY_CLASSROOM, x: 1750, y: 450, building: '教学楼', room: '101教室', picked: false },
    { item: ITEMS.PASSWORD_NOTE, x: 1800, y: 500, building: '教学楼', room: '101教室', picked: false }, // 密码纸条
    { item: ITEMS.BATTERY, x: 1850, y: 450, building: '教学楼', room: '101教室', picked: false }, // 电池
    { item: ITEMS.STUDENT_ID_1, x: 1800, y: 600, building: '教学楼', room: '102教室', picked: false },
    { item: ITEMS.CAMERA, x: 1900, y: 550, building: '教学楼', room: '102教室', picked: false }, // 相机
    { item: ITEMS.STUDENT_ID_2, x: 2200, y: 400, building: '教学楼', room: '201教室', picked: false },
    { item: ITEMS.BATTERY, x: 2250, y: 450, building: '教学楼', room: '201教室', picked: false }, // 电池
    
    // 实验室物品
    { item: ITEMS.KEY_LAB, x: 2150, y: 1300, building: '实验室', room: '生物实验室', picked: false }, // 化学实验室钥匙
    { item: ITEMS.CHEMICAL, x: 1900, y: 1350, building: '实验室', room: '化学实验室', picked: false },
    { item: ITEMS.CAMERA, x: 1700, y: 1300, building: '实验室', room: '物理实验室', picked: false },
    { item: ITEMS.HYDROCHLORIC_ACID, x: 1900, y: 1400, building: '实验室', room: '仪器室', picked: false }, // 浓盐酸
    
    // 行政楼物品
    { item: ITEMS.STUDENT_RECORD, x: 850, y: 1250, building: '行政楼', room: '教务处', picked: false },
    { item: ITEMS.STUDENT_ID_3, x: 900, y: 1300, building: '行政楼', room: '大会议室', picked: false },
    { item: ITEMS.KEY_ROOFTOP, x: 800, y: 1400, building: '行政楼', room: '校长室', picked: false },
    
    // 食堂物品
    { item: ITEMS.BATTERY, x: 700, y: 500, building: '食堂', room: '后厨A', picked: false },
    { item: ITEMS.BATTERY, x: 750, y: 550, building: '食堂', room: '后厨B', picked: false },
    
    // 图书馆物品
    { item: ITEMS.SCHOOL_NEWSPAPER, x: 3100, y: 400, building: '图书馆', room: '借阅大厅', picked: false },
    { item: ITEMS.BATTERY, x: 3200, y: 450, building: '图书馆', room: '阅览室A', picked: false },
    { item: ITEMS.CAMERA, x: 3400, y: 400, building: '图书馆', room: '阅览室B', picked: false },
    { item: ITEMS.COMPUTER, x: 3300, y: 500, building: '图书馆', room: '前台', picked: false },
    { item: ITEMS.STUDENT_ID_1, x: 3050, y: 600, building: '图书馆', room: '古籍室', picked: false },
    { item: ITEMS.COMPUTER, x: 3100, y: 620, building: '图书馆', room: '古籍室', picked: false, puzzleId: 'ancient_computer' },
    { item: ITEMS.BATTERY, x: 3300, y: 650, building: '图书馆', room: '自习室', picked: false },
    { item: ITEMS.PASSWORD_NOTE, x: 3100, y: 800, building: '图书馆', room: '档案室', picked: false },
    { item: ITEMS.CAMERA, x: 3400, y: 850, building: '图书馆', room: '书库', picked: false },
    
    // 宿舍楼物品
    { item: ITEMS.BATTERY, x: 3050, y: 1300, building: '宿舍楼', room: '101室', picked: false },
    { item: ITEMS.CAMERA, x: 3250, y: 1250, building: '宿舍楼', room: '102室', picked: false },
    { item: ITEMS.STUDENT_ID_2, x: 3450, y: 1300, building: '宿舍楼', room: '103室', picked: false },
    { item: ITEMS.BATTERY, x: 3650, y: 1250, building: '宿舍楼', room: '104室', picked: false },
    { item: ITEMS.CAMERA, x: 3050, y: 1500, building: '宿舍楼', room: '201室', picked: false },
    { item: ITEMS.BATTERY, x: 3250, y: 1450, building: '宿舍楼', room: '202室', picked: false },
    { item: ITEMS.STUDENT_ID_3, x: 3450, y: 1500, building: '宿舍楼', room: '203室', picked: false },
    { item: ITEMS.CAMERA, x: 3650, y: 1450, building: '宿舍楼', room: '204室', picked: false },
    { item: ITEMS.BATTERY, x: 3050, y: 1700, building: '宿舍楼', room: '301室', picked: false },
    { item: ITEMS.CAMERA, x: 3250, y: 1650, building: '宿舍楼', room: '302室', picked: false },
    { item: ITEMS.BATTERY, x: 3450, y: 1700, building: '宿舍楼', room: '303室', picked: false },
    { item: ITEMS.CAMERA, x: 3650, y: 1650, building: '宿舍楼', room: '304室', picked: false },
    
    // 体育馆物品
    { item: ITEMS.BATTERY, x: 4300, y: 400, building: '体育馆', room: '主场地', picked: false },
    { item: ITEMS.CAMERA, x: 4700, y: 450, building: '体育馆', room: '器材室', picked: false },
    { item: ITEMS.BATTERY, x: 4300, y: 600, building: '体育馆', room: '更衣室', picked: false },
    { item: ITEMS.CAMERA, x: 4700, y: 650, building: '体育馆', room: '储藏室', picked: false },
    
    // 花园物品
    { item: ITEMS.BATTERY, x: 4300, y: 1300, building: '花园', room: '花园区A', picked: false },
    { item: ITEMS.CAMERA, x: 4400, y: 1350, building: '花园', room: '花园区B', picked: false },
    { item: ITEMS.BATTERY, x: 4700, y: 1300, building: '花园', room: '花园区C', picked: false },
    { item: ITEMS.CAMERA, x: 4300, y: 1500, building: '花园', room: '休息区', picked: false },
    { item: ITEMS.BATTERY, x: 4400, y: 1550, building: '花园', room: '迷宫区', picked: false },
    { item: ITEMS.CAMERA, x: 4700, y: 1500, building: '花园', room: '凉亭区', picked: false }
];

// 鬼魂系统
const ghostSystem = {
    ghosts: [],
    maxGhosts: 3,
    spawnTimer: 0,
    spawnInterval: 300, // 5秒生成一次
    
    // 初始化
    init() {
        this.ghosts = [];
    },
    
    // 更新鬼魂
    update() {
        // 根据游戏阶段调整生成频率
        let currentInterval = this.spawnInterval;
        if (gameState.stage === 'mid') currentInterval = 200;
        if (gameState.stage === 'late') currentInterval = 100;
        
        this.spawnTimer++;
        if (this.spawnTimer >= currentInterval && this.ghosts.length < this.maxGhosts) {
            this.spawnTimer = 0;
            this.spawnGhost();
        }
        
        // 更新每个鬼魂
        for (let ghost of this.ghosts) {
            this.updateGhost(ghost);
        }
        
        // 移除死亡的鬼魂
        this.ghosts = this.ghosts.filter(g => g.active);
    },
    
    // 生成鬼魂
    spawnGhost() {
        // 只在特定阶段生成
        if (gameState.stage === 'start') return;
        
        // 在玩家附近生成
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        const ghost = {
            x: player.x + Math.cos(angle) * distance,
            y: player.y + Math.sin(angle) * distance,
            width: 20,
            height: 20,
            speed: gameState.stage === 'late' ? 3 : 2.5,
            active: true,
            state: 'wandering', // wandering, chasing, searching
            wanderTimer: 0,
            chaseTimer: 0,
            searchTimer: 0,
            lastKnownX: 0,
            lastKnownY: 0,
            color: `rgba(255, 0, 0, ${0.3 + Math.random() * 0.4})`
        };
        
        this.ghosts.push(ghost);
    },
    
    // 检查鬼魂与墙体碰撞
    checkWallCollision(ghost, newX, newY) {
        const ghostRect = { x: newX, y: newY, width: ghost.width, height: ghost.height };
        
        // 检查墙体碰撞
        for (let wall of walls) {
            if (checkCollision(ghostRect, wall)) {
                return true;
            }
        }
        
        // 检查关闭的门碰撞（门未打开或打开程度不足时视为障碍物）
        for (let door of doors) {
            if (door.openProgress < 0.5) {
                if (checkCollision(ghostRect, door)) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // 更新单个鬼魂
    updateGhost(ghost) {
        if (!ghost.active) return;
        
        const dx = player.x - ghost.x;
        const dy = player.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检测玩家（增大索敌范围）
        const detectionRange = keys.Shift ? 500 : 400; // 奔跑时更容易被发现，增大了索敌范围
        const canSeePlayer = distance < detectionRange && !player.isHiding;
        
        switch (ghost.state) {
            case 'wandering':
                // 游荡状态
                ghost.wanderTimer++;
                if (ghost.wanderTimer > 180) {
                    ghost.wanderTimer = 0;
                    // 随机改变方向
                    ghost.targetX = ghost.x + (Math.random() - 0.5) * 200;
                    ghost.targetY = ghost.y + (Math.random() - 0.5) * 200;
                }
                
                if (ghost.targetX !== undefined) {
                    const tdx = ghost.targetX - ghost.x;
                    const tdy = ghost.targetY - ghost.y;
                    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                    if (tdist > 5) {
                        const moveX = (tdx / tdist) * ghost.speed * 0.5;
                        const moveY = (tdy / tdist) * ghost.speed * 0.5;
                        const newX = ghost.x + moveX;
                        const newY = ghost.y + moveY;
                        
                        // 检查碰撞
                        if (!this.checkWallCollision(ghost, newX, newY)) {
                            ghost.x = newX;
                            ghost.y = newY;
                        }
                    }
                }
                
                if (canSeePlayer) {
                    ghost.state = 'chasing';
                    ghost.chaseTimer = 0;
                }
                break;
                
            case 'chasing':
                // 追击状态
                ghost.chaseTimer++;
                
                if (canSeePlayer) {
                    // 追击玩家
                    const moveX = (dx / distance) * ghost.speed;
                    const moveY = (dy / distance) * ghost.speed;
                    const newX = ghost.x + moveX;
                    const newY = ghost.y + moveY;
                    
                    // 检查碰撞
                    if (!this.checkWallCollision(ghost, newX, newY)) {
                        ghost.x = newX;
                        ghost.y = newY;
                    }
                    
                    ghost.lastKnownX = player.x;
                    ghost.lastKnownY = player.y;
                } else {
                    // 丢失目标，进入搜索状态
                    ghost.state = 'searching';
                    ghost.searchTimer = 0;
                }
                
                // 检查碰撞
                if (distance < 20) {
                    this.catchPlayer(ghost);
                }
                break;
                
            case 'searching':
                // 搜索状态
                ghost.searchTimer++;
                
                // 前往最后已知位置
                const sdx = ghost.lastKnownX - ghost.x;
                const sdy = ghost.lastKnownY - ghost.y;
                const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                
                if (sdist > 10) {
                    const moveX = (sdx / sdist) * ghost.speed * 0.7;
                    const moveY = (sdy / sdist) * ghost.speed * 0.7;
                    const newX = ghost.x + moveX;
                    const newY = ghost.y + moveY;
                    
                    // 检查碰撞
                    if (!this.checkWallCollision(ghost, newX, newY)) {
                        ghost.x = newX;
                        ghost.y = newY;
                    }
                } else {
                    // 在附近搜索
                    if (ghost.searchTimer > 300) {
                        ghost.state = 'wandering';
                        ghost.wanderTimer = 0;
                    }
                }
                
                if (canSeePlayer) {
                    ghost.state = 'chasing';
                    ghost.chaseTimer = 0;
                }
                break;
        }
        
        // 边界限制
        ghost.x = Math.max(0, Math.min(WORLD_WIDTH - ghost.width, ghost.x));
        ghost.y = Math.max(0, Math.min(WORLD_HEIGHT - ghost.height, ghost.y));
    },
    
    // 鬼魂抓到玩家
    catchPlayer(ghost) {
        ghost.active = false;
        gameState.caughtCount++;
        
        // 扣除生命值
        if (gameState.caughtCount === 1) {
            gameState.health = 70;
            showMessage('被鬼魂抓住了! 生命值: 70%');
            // 传送回安全点
            player.x = 300;
            player.y = 300;
        } else if (gameState.caughtCount === 2) {
            gameState.health = 20;
            showMessage('被鬼魂抓住了! 生命值: 20%');
            // 传送回学校入口
            player.x = 100;
            player.y = 100;
        } else {
            gameState.health = 0;
            gameState.isGameOver = true;
            showMessage('游戏结束! 你未能逃离学校...');
        }
        
        updateUI();
    },
    
    // 绘制鬼魂
    draw(ctx) {
        for (let ghost of this.ghosts) {
            if (!ghost.active) continue;
            
            const screenX = ghost.x - camera.x;
            const screenY = ghost.y - camera.y;
            
            // 绘制鬼魂主体
            ctx.fillStyle = ghost.color;
            ctx.beginPath();
            ctx.arc(screenX + ghost.width/2, screenY + ghost.height/2, ghost.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制鬼魂光晕
            const gradient = ctx.createRadialGradient(
                screenX + ghost.width/2, screenY + ghost.height/2, 0,
                screenX + ghost.width/2, screenY + ghost.height/2, 40
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX + ghost.width/2, screenY + ghost.height/2, 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// 谜题系统
const puzzleSystem = {
    puzzles: {
        computer: {
            solved: false,
            password: '2013',
            hint: '密码是惨案发生的年份',
            attempts: 0
        },
        ancient_computer: {
            solved: false,
            password: '2013',
            hint: '古籍室电脑的密码，与那场惨案有关',
            attempts: 0,
            reward: 'dormitory_connection'
        },
        altar: {
            solved: false,
            requiredItems: ['student_id_1', 'student_id_2', 'student_id_3'],
            hint: '需要收集3个学生的学生证才能开启'
        }
    },
    
    // 检查谜题是否可以解开
    canSolve(puzzleId) {
        const puzzle = this.puzzles[puzzleId];
        if (!puzzle) return false;
        if (puzzle.solved) return false;
        
        if (puzzleId === 'altar') {
            return puzzle.requiredItems.every(id => inventory.has(id));
        }
        
        return true;
    },
    
    // 解开谜题
    solve(puzzleId) {
        const puzzle = this.puzzles[puzzleId];
        if (!puzzle) return false;

        puzzle.solved = true;

        // 给予奖励
        if (puzzleId === 'computer') {
            inventory.add(ITEMS.KEY_LIBRARY);
            showMessage('密码正确! 获得图书馆钥匙');
        } else if (puzzleId === 'ancient_computer') {
            showMessage('密码正确! 已解锁宿舍楼房间通道连接系统');
            unlockDormitoryConnections();
        } else if (puzzleId === 'altar') {
            inventory.add(ITEMS.KEY_ROOFTOP);
            showMessage('仪式完成! 获得天台钥匙');
        }

        return true;
    }
};

// 解锁宿舍楼房间通道连接
function unlockDormitoryConnections() {
    const dormitory = buildings.find(b => b.name === '宿舍楼');
    if (!dormitory) return;

    // 在宿舍楼每个房间之间添加通道门
    // 第一层: 101-102, 102-103, 103-104
    // 第二层: 201-202, 202-203, 203-204
    // 第三层: 301-302, 302-303, 303-304
    // 垂直通道: 101-201-301, 102-202-302, 103-203-303, 104-204-304

    const roomConnections = [
        // 第一层横向连接
        { x: dormitory.x + 200, y: dormitory.y + 100, width: 15, height: 50, building: dormitory, name: '101-102通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 400, y: dormitory.y + 100, width: 15, height: 50, building: dormitory, name: '102-103通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 600, y: dormitory.y + 100, width: 15, height: 50, building: dormitory, name: '103-104通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        // 第二层横向连接
        { x: dormitory.x + 200, y: dormitory.y + 300, width: 15, height: 50, building: dormitory, name: '201-202通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 400, y: dormitory.y + 300, width: 15, height: 50, building: dormitory, name: '202-203通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 600, y: dormitory.y + 300, width: 15, height: 50, building: dormitory, name: '203-204通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        // 第三层横向连接
        { x: dormitory.x + 200, y: dormitory.y + 500, width: 15, height: 50, building: dormitory, name: '301-302通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 400, y: dormitory.y + 500, width: 15, height: 50, building: dormitory, name: '302-303通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        { x: dormitory.x + 600, y: dormitory.y + 500, width: 15, height: 50, building: dormitory, name: '303-304通道', isOpen: true, openProgress: 1, orientation: 'vertical', locked: false },
        // 垂直连接 (101-201, 201-301)
        { x: dormitory.x + 100, y: dormitory.y + 200, width: 50, height: 15, building: dormitory, name: '101-201通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        { x: dormitory.x + 100, y: dormitory.y + 400, width: 50, height: 15, building: dormitory, name: '201-301通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        // 垂直连接 (102-202, 202-302)
        { x: dormitory.x + 300, y: dormitory.y + 200, width: 50, height: 15, building: dormitory, name: '102-202通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        { x: dormitory.x + 300, y: dormitory.y + 400, width: 50, height: 15, building: dormitory, name: '202-302通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        // 垂直连接 (103-203, 203-303)
        { x: dormitory.x + 500, y: dormitory.y + 200, width: 50, height: 15, building: dormitory, name: '103-203通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        { x: dormitory.x + 500, y: dormitory.y + 400, width: 50, height: 15, building: dormitory, name: '203-303通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        // 垂直连接 (104-204, 204-304)
        { x: dormitory.x + 700, y: dormitory.y + 200, width: 50, height: 15, building: dormitory, name: '104-204通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false },
        { x: dormitory.x + 700, y: dormitory.y + 400, width: 50, height: 15, building: dormitory, name: '204-304通道', isOpen: true, openProgress: 1, orientation: 'horizontal', locked: false }
    ];

    // 添加通道门到doors数组
    for (const door of roomConnections) {
        // 检查是否已存在同名门
        const exists = doors.some(d => d.name === door.name && d.building === dormitory);
        if (!exists) {
            doors.push(door);
        }
    }

    showMessage('宿舍楼所有房间已互相连接！');
}

// 隐藏点系统
const hidingSystem = {
    hidingSpots: [],
    
    // 初始化隐藏点
    init() {
        // 在教室添加储物柜
        for (let building of buildings) {
            for (let room of building.rooms) {
                if (room.name.includes('教室') || room.name.includes('实验室')) {
                    this.hidingSpots.push({
                        x: room.x + 20,
                        y: room.y + 20,
                        width: 30,
                        height: 30,
                        type: 'locker',
                        name: '储物柜',
                        occupied: false
                    });
                }
            }
        }
    },
    
    // 检查玩家是否可以隐藏
    canHide() {
        for (let spot of this.hidingSpots) {
            const dx = player.x - spot.x;
            const dy = player.y - spot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 40) {
                return spot;
            }
        }
        return null;
    },
    
    // 绘制隐藏点
    draw(ctx) {
        for (let spot of this.hidingSpots) {
            const screenX = spot.x - camera.x;
            const screenY = spot.y - camera.y;
            
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(screenX, screenY, spot.width, spot.height);
            
            // 绘制储物柜门
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 2, screenY + 2, spot.width - 4, spot.height - 4);
            
            // 绘制把手
            ctx.fillStyle = '#888';
            ctx.fillRect(screenX + spot.width - 8, screenY + spot.height/2 - 3, 4, 6);
        }
    }
};

// UI系统
const uiSystem = {
    messages: [],
    messageTimer: 0,
    showInventory: false,
    
    // 显示消息
    showMessage(text, duration = 2000) {
        this.messages.push({ text, timer: duration });
    },
    
    // 更新UI
    update() {
        // 更新消息
        for (let msg of this.messages) {
            msg.timer -= 16; // 基于60fps，每次更新减少16ms
        }
        this.messages = this.messages.filter(m => m.timer > 0);
    },
    
    // 绘制UI
    draw(ctx) {
        // 绘制交互提示
        this.drawInteractionHint(ctx);
        
        // 绘制消息
        let yOffset = 100;
        for (let msg of this.messages) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvas.width/2 - 200, yOffset, 400, 40);
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(msg.text, canvas.width/2, yOffset + 25);
            
            yOffset += 50;
        }
        
        // 绘制背包
        if (this.showInventory) {
            this.drawInventory(ctx);
        }
        
        // 绘制游戏状态
        this.drawGameStatus(ctx);
        
        // 绘制密码输入界面
        this.drawPasswordInput(ctx);
        
        // 绘制笔记本
        this.drawNotebook(ctx);
    },
    
    // 绘制交互提示
    drawInteractionHint(ctx) {
        // 检查玩家是否靠近交互式物品
        for (let worldItem of worldItems) {
            if (worldItem.picked) continue;
            if (worldItem.item.type !== 'interactive') continue;
            
            // 检查是否在正确位置
            if (worldItem.building && player.currentBuilding?.name !== worldItem.building) continue;
            if (worldItem.room && player.currentRoom?.name !== worldItem.room) continue;
            
            const dx = player.x - worldItem.x;
            const dy = player.y - worldItem.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果在交互范围内，显示提示
            if (distance < 50) {
                const puzzleId = worldItem.puzzleId || 'computer';
                const puzzle = puzzleSystem.puzzles[puzzleId];
                
                if (puzzle && !puzzle.solved) {
                    // 绘制提示框
                    const hintX = canvas.width / 2 - 100;
                    const hintY = canvas.height / 2 + 50;
                    const hintWidth = 200;
                    const hintHeight = 40;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(hintX, hintY, hintWidth, hintHeight);
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(hintX, hintY, hintWidth, hintHeight);
                    
                    ctx.fillStyle = '#ffaa00';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('按 E 键输入密码', hintX + hintWidth/2, hintY + 25);
                }
            }
        }
    },
    
    // 绘制背包
    drawInventory(ctx) {
        const slotSize = 40;
        const padding = 5;
        const cols = 9;
        const rows = 9;
        const width = cols * (slotSize + padding) + padding;
        const height = rows * (slotSize + padding) + padding;
        // 将背包位置移到右下角
        const x = canvas.width - width - 20;
        const y = canvas.height - height - 20;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // 绘制格子
        for (let i = 0; i < inventory.maxSlots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const slotX = x + padding + col * (slotSize + padding);
            const slotY = y + padding + row * (slotSize + padding);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(slotX, slotY, slotSize, slotSize);
            ctx.strokeStyle = '#555';
            ctx.strokeRect(slotX, slotY, slotSize, slotSize);
            
            // 绘制物品
            if (i < inventory.items.length) {
                const item = inventory.items[i];
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.icon, slotX + slotSize/2, slotY + slotSize/2 + 6);
            }
        }
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('背包 (Tab关闭)', x + width/2, y - 10);
    },
    
    // 绘制游戏状态
    drawGameStatus(ctx) {
        const x = 20;
        const y = canvas.height - 100;
        
        // 生命值
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 200, 80);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 200, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`生命值: ${gameState.health}%`, x + 10, y + 20);
        
        // 生命值条
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 30, 180, 10);
        ctx.fillStyle = gameState.health > 50 ? '#0f0' : gameState.health > 20 ? '#ff0' : '#f00';
        ctx.fillRect(x + 10, y + 30, 180 * (gameState.health / 100), 10);
        
        // 被捕次数
        ctx.fillStyle = '#fff';
        ctx.fillText(`被捕次数: ${gameState.caughtCount}/3`, x + 10, y + 60);
        
        // 当前任务
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(x, y + 90, 300, 30);
        ctx.fillStyle = '#ff0';
        ctx.fillText(`任务: ${gameState.currentHint}`, x + 10, y + 110);
    },
    
    // 绘制密码输入界面
    drawPasswordInput(ctx) {
        console.log('drawPasswordInput 被调用, active:', gameState.passwordInput.active);
        if (!gameState.passwordInput.active) return;
        
        const x = canvas.width / 2 - 150;
        const y = canvas.height / 2 - 120;
        const width = 300;
        const height = 240;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // 标题
        ctx.fillStyle = '#ff4444';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('输入密码', x + width/2, y + 50);
        
        // 提示信息
        const puzzle = puzzleSystem.puzzles[gameState.passwordInput.puzzleId];
        console.log('puzzleId:', gameState.passwordInput.puzzleId, 'puzzle:', puzzle);
        if (puzzle) {
            ctx.fillStyle = '#cccccc';
            ctx.font = '14px Arial';
            // 简化显示，不使用 wrapText
            ctx.fillText(puzzle.hint, x + width/2, y + 80);
        } else {
            ctx.fillStyle = '#cccccc';
            ctx.font = '14px Arial';
            ctx.fillText('请输入密码', x + width/2, y + 80);
        }
        
        // 密码输入
        ctx.fillStyle = '#fff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        let displayText = '';
        // 使用默认值确保至少显示4个下划线
        const length = gameState.passwordInput.maxLength || 4;
        console.log('maxLength:', gameState.passwordInput.maxLength, '使用长度:', length);
        for (let i = 0; i < length; i++) {
            if (i < gameState.passwordInput.input.length) {
                displayText += '*';
            } else {
                displayText += '_';
            }
        }
        console.log('displayText:', displayText);
        ctx.fillText(displayText, x + width/2, y + 130);
        
        // 操作提示
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.fillText('按数字键输入密码，按Backspace删除，按Enter确认', x + width/2, y + 170);
        ctx.fillText('或点击下方数字按钮输入', x + width/2, y + 190);
        
        // 绘制虚拟数字键盘
        this.drawVirtualKeypad(ctx, x, y, width, height);
    },
    
    // 绘制虚拟数字键盘
    drawVirtualKeypad(ctx, dialogX, dialogY, dialogWidth, dialogHeight) {
        const buttonSize = 40;
        const buttonGap = 5;
        const keypadWidth = buttonSize * 3 + buttonGap * 2;
        const keypadHeight = buttonSize * 4 + buttonGap * 3;
        const keypadX = dialogX + (dialogWidth - keypadWidth) / 2;
        // 从对话框底部向上预留足够空间
        const keypadStartY = dialogY + dialogHeight - keypadHeight - 10;
        
        const buttons = [
            { num: '1', x: 0, y: 0 },
            { num: '2', x: 1, y: 0 },
            { num: '3', x: 2, y: 0 },
            { num: '4', x: 0, y: 1 },
            { num: '5', x: 1, y: 1 },
            { num: '6', x: 2, y: 1 },
            { num: '7', x: 0, y: 2 },
            { num: '8', x: 1, y: 2 },
            { num: '9', x: 2, y: 2 },
            { num: 'C', x: 0, y: 3 },
            { num: '0', x: 1, y: 3 },
            { num: 'OK', x: 2, y: 3 }
        ];
        
        for (const btn of buttons) {
            const btnX = keypadX + btn.x * (buttonSize + buttonGap);
            const btnY = keypadStartY + btn.y * (buttonSize + buttonGap);
            
            // 绘制按钮背景
            ctx.fillStyle = btn.num === 'OK' ? '#44aa44' : btn.num === 'C' ? '#aa4444' : '#4444aa';
            ctx.fillRect(btnX, btnY, buttonSize, buttonSize);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, buttonSize, buttonSize);
            
            // 绘制按钮文字
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.num, btnX + buttonSize/2, btnY + buttonSize/2);
        }
    },
    
    // 绘制笔记本
    drawNotebook(ctx) {
        if (!gameState.notebook.active) return;
        
        const width = 500;
        const height = 600;
        const x = canvas.width / 2 - width / 2;
        const y = canvas.height / 2 - height / 2;
        
        // 绘制笔记本背景
        ctx.fillStyle = 'rgba(80, 50, 30, 0.95)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = 'rgba(120, 80, 50, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        
        // 绘制笔记本页面
        ctx.fillStyle = 'rgba(240, 230, 210, 0.9)';
        ctx.fillRect(x + 20, y + 20, width - 40, height - 40);
        
        // 绘制标题
        ctx.font = '24px Arial';
        ctx.fillStyle = 'rgba(80, 50, 30, 1)';
        ctx.textAlign = 'center';
        ctx.fillText('笔记本', x + width / 2, y + 50);
        
        // 绘制血红色文字
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const page = gameState.notebook.pages[gameState.notebook.currentPage];
        const textX = x + 40;
        const textY = y + 100;
        
        // 绘制页面内容
        ctx.fillText(page, textX, textY);
        
        // 绘制页码
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(80, 50, 30, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(`${gameState.notebook.currentPage + 1}/${gameState.notebook.pages.length}`, x + width / 2, y + height - 40);
        
        // 绘制提示
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(120, 80, 50, 0.8)';
        ctx.fillText('按C键关闭笔记本', x + width / 2, y + height - 20);
    }
};

// 显示消息的全局函数
function showMessage(text) {
    uiSystem.showMessage(text);
}

// 更新UI的全局函数
function updateUI() {
    // 更新游戏阶段
    updateGameStage();
    
    // 更新坐标显示
    let locationText = `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    if (player.currentRoom) {
        locationText += ` - ${player.currentRoom.name}`;
    } else if (player.currentBuilding) {
        locationText += ` - ${player.currentBuilding.name}(走廊)`;
    }
    coordsDisplay.textContent = locationText;
}

// 任务提示系统
const questSystem = {
    // 当前主线任务
    currentQuest: null,
    // 任务历史
    questHistory: [],
    // 任务提示显示时间
    hintDisplayTime: 0,
    
    // 任务定义
    quests: {
        'find_flashlight': {
            id: 'find_flashlight',
            title: '寻找光源',
            description: '你在学校门口醒来，周围一片漆黑。需要找到手电筒才能看清道路。',
            hint: '在学校门口附近寻找手电筒',
            target: 'flashlight',
            completed: false
        },
        'find_guard_key': {
            id: 'find_guard_key',
            title: '进入学校',
            description: '学校大门被锁住了，需要找到门卫室钥匙才能进入。',
            hint: '在门卫室附近寻找钥匙',
            target: 'key_guard_room',
            completed: false
        },
        'enter_teaching_building': {
            id: 'enter_teaching_building',
            title: '探索教学楼',
            description: '进入主教学楼，寻找教室钥匙。小心，里面可能有危险...',
            hint: '前往教学楼，找到教室钥匙',
            target: 'key_classroom',
            completed: false
        },
        'solve_microscope': {
            id: 'solve_microscope',
            title: '实验室探索',
            description: '生物实验室中可能有重要的物品。',
            hint: '在生物实验室找到化学实验室钥匙',
            target: 'key_lab',
            completed: false
        },
        'get_chemical': {
            id: 'get_chemical',
            title: '获取化学试剂',
            description: '化学试剂可以溶解某些障碍物，帮助你进入图书馆。',
            hint: '进入化学实验室获取试剂',
            target: 'chemical',
            completed: false
        },
        'find_library_key': {
            id: 'find_library_key',
            title: '打开图书馆',
            description: '图书馆前台电脑的密码是2013，那是惨案发生的年份。',
            hint: '输入密码2013打开图书馆古籍室',
            target: 'key_library',
            completed: false
        },
        'collect_student_ids': {
            id: 'collect_student_ids',
            title: '收集学生证',
            description: '需要收集3个学生的学生证才能开启天台。',
            hint: '在各教室寻找学生证',
            target: 'student_ids',
            targetCount: 3,
            completed: false
        },
        'get_rooftop_key': {
            id: 'get_rooftop_key',
            title: '前往教务处',
            description: '用3个学生证在教务处换取天台钥匙。',
            hint: '前往行政楼教务处换取天台钥匙',
            target: 'key_rooftop',
            completed: false
        },
        'escape': {
            id: 'escape',
            title: '最终逃脱',
            description: '前往天台，解开神秘符号的谜题，逃离这个恐怖的学校！',
            hint: '前往天台，解开最终谜题',
            target: 'escape',
            completed: false
        }
    },
    
    // 更新当前任务
    updateQuest() {
        const hasFlashlight = inventory.has('flashlight');
        const hasGuardKey = inventory.has('key_guard_room');
        const hasClassroomKey = inventory.has('key_classroom');
        const hasLabKey = inventory.has('key_lab');
        const hasLibraryKey = inventory.has('key_library');
        const hasRooftopKey = inventory.has('key_rooftop');
        const hasChemical = inventory.has('chemical');
        const studentIdCount = inventory.countType('puzzle');
        
        // 确定当前任务
        let newQuest = null;
        
        if (!hasFlashlight) {
            newQuest = this.quests['find_flashlight'];
            gameState.stage = 'start';
        } else if (!hasGuardKey) {
            newQuest = this.quests['find_guard_key'];
            gameState.stage = 'start';
        } else if (!hasClassroomKey) {
            newQuest = this.quests['enter_teaching_building'];
            gameState.stage = 'early';
        } else if (!hasLabKey) {
            newQuest = this.quests['solve_microscope'];
            gameState.stage = 'early';
        } else if (!hasChemical) {
            newQuest = this.quests['get_chemical'];
            gameState.stage = 'mid';
        } else if (!hasLibraryKey) {
            newQuest = this.quests['find_library_key'];
            gameState.stage = 'mid';
        } else if (studentIdCount < 3) {
            newQuest = this.quests['collect_student_ids'];
            gameState.stage = 'mid';
            newQuest.currentCount = studentIdCount;
        } else if (!hasRooftopKey) {
            newQuest = this.quests['get_rooftop_key'];
            gameState.stage = 'late';
        } else {
            newQuest = this.quests['escape'];
            gameState.stage = 'ending';
        }
        
        // 如果任务发生变化，显示提示
        if (newQuest && newQuest.id !== this.currentQuest?.id) {
            this.currentQuest = newQuest;
            this.hintDisplayTime = 300; // 显示5秒
            showMessage(`新任务: ${newQuest.title}`);
        }
        
        // 更新任务提示文本
        if (this.currentQuest) {
            if (this.currentQuest.id === 'collect_student_ids') {
                gameState.currentHint = `${this.currentQuest.hint} (${studentIdCount}/3)`;
            } else {
                gameState.currentHint = this.currentQuest.hint;
            }
        }
    },
    
    // 绘制任务提示
    drawQuestHint(ctx) {
        if (!this.currentQuest) return;
        
        const x = canvas.width / 2;
        const y = 40; // 提高位置，避免重叠
        
        // 绘制任务提示框
        const padding = 15;
        const maxWidth = 500;
        ctx.font = 'bold 18px Arial';
        const titleWidth = ctx.measureText(this.currentQuest.title).width;
        ctx.font = '14px Arial';
        const descWidth = ctx.measureText(this.currentQuest.description).width;
        const hintWidth = ctx.measureText('💡 ' + gameState.currentHint).width;
        const boxWidth = Math.min(Math.max(titleWidth, descWidth, hintWidth) + padding * 2, maxWidth);
        const boxHeight = 110; // 增加高度，避免文字重叠
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x - boxWidth/2, y - 30, boxWidth, boxHeight);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - boxWidth/2, y - 30, boxWidth, boxHeight);
        
        // 标题
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`📋 ${this.currentQuest.title}`, x, y);
        
        // 描述
        ctx.fillStyle = '#cccccc';
        ctx.font = '14px Arial';
        this.wrapText(ctx, this.currentQuest.description, x, y + 30, boxWidth - 30, 18);
        
        // 提示
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`💡 ${gameState.currentHint}`, x, y + 75);
        
        // 阶段指示器
        const stageNames = {
            'start': '初始阶段',
            'early': '早期阶段',
            'mid': '中期阶段',
            'late': '后期阶段',
            'ending': '最终阶段'
        };
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(`[${stageNames[gameState.stage]}]`, x, y + 85);
    },
    
    // 自动换行文本
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let testLine = '';
        let lineArray = [];
        
        for (let n = 0; n < words.length; n++) {
            testLine += words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lineArray.push(line);
                line = words[n];
                testLine = words[n];
            } else {
                line = testLine;
            }
        }
        lineArray.push(line);
        
        for (let k = 0; k < lineArray.length; k++) {
            ctx.fillText(lineArray[k], x, y + k * lineHeight);
        }
    }
};

// 更新游戏阶段
function updateGameStage() {
    // 使用任务系统更新
    questSystem.updateQuest();
}

// 检查物品拾取
function checkItemPickup() {
    for (let worldItem of worldItems) {
        if (worldItem.picked) continue;
        
        const dx = player.x - worldItem.x;
        const dy = player.y - worldItem.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检查玩家是否在物品附近
        if (distance < 30) {
            // 检查是否在正确的建筑和房间内
            const inCorrectBuilding = !worldItem.building || player.currentBuilding?.name === worldItem.building;
            const inCorrectRoom = !worldItem.room || player.currentRoom?.name === worldItem.room;
            
            console.log('检测到物品:', worldItem.item.name, '距离:', distance.toFixed(1), '建筑匹配:', inCorrectBuilding, '房间匹配:', inCorrectRoom);
            
            if (inCorrectBuilding && inCorrectRoom) {
                // 交互类物品（如电脑）不能被拾取，触发交互逻辑
                if (worldItem.item.type === 'interactive') {
                    // 电脑触发密码输入
                    if (worldItem.item.id === 'computer') {
                        // 检查是否有特定的puzzleId
                        const puzzleId = worldItem.puzzleId || 'computer';
                        const puzzle = puzzleSystem.puzzles[puzzleId];
                        if (puzzle && !puzzle.solved) {
                            gameState.passwordInput.active = true;
                            gameState.passwordInput.puzzleId = puzzleId;
                            gameState.passwordInput.input = '';
                            console.log('密码输入已激活，谜题ID:', puzzleId);
                            showMessage(`发现了${worldItem.room}的电脑，需要输入密码...`);
                        } else if (puzzle && puzzle.solved) {
                            showMessage('电脑已经破解完成');
                        }
                    }
                } else {
                    // 普通物品可以拾取
                    if (inventory.add(worldItem.item)) {
                        worldItem.picked = true;
                    }
                }
            }
        }
    }
}

// 检查谜题交互
function checkPuzzleInteraction() {
    // 行政楼电脑 (原电脑谜题)
    if (player.currentRoom && player.currentRoom.name === '校长室') {
        const dx = player.x - 800;
        const dy = player.y - 1400;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            const puzzle = puzzleSystem.puzzles.computer;
            if (!puzzle.solved) {
                // 打开密码输入界面
                gameState.passwordInput.active = true;
                gameState.passwordInput.puzzleId = 'computer';
                gameState.passwordInput.input = '';
                showMessage('发现了校长室的电脑，需要输入密码...');
            }
        }
    }
    
    // 图书馆前台电脑
    if (player.currentRoom && player.currentRoom.name === '前台') {
        const dx = player.x - 3300;
        const dy = player.y - 500;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            const puzzle = puzzleSystem.puzzles.computer;
            if (!puzzle.solved) {
                // 打开密码输入界面
                gameState.passwordInput.active = true;
                gameState.passwordInput.puzzleId = 'computer';
                gameState.passwordInput.input = '';
                showMessage('发现了前台的电脑，需要输入密码...');
            } else {
                showMessage('电脑已经破解完成');
            }
        }
    }
}

// 检查门锁
function checkDoorLock() {
    for (let door of doors) {
        if (!door.locked) continue;
        
        const doorCenterX = door.x + door.width / 2;
        const doorCenterY = door.y + door.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt(
            Math.pow(doorCenterX - playerCenterX, 2) + 
            Math.pow(doorCenterY - playerCenterY, 2)
        );
        
        if (distance < 50) {
            if (door.lockType === 'key' && door.requiredKey) {
                if (inventory.has(door.requiredKey)) {
                    door.locked = false;
                    door.isOpen = true;
                    showMessage(`使用${ITEMS[door.requiredKey.toUpperCase()]?.name || door.requiredKey}打开了门`);
                } else {
                    showMessage('这扇门需要钥匙才能打开');
                }
            } else if (door.lockType === 'acid') {
                showMessage('这扇门的锁被腐蚀了，需要浓盐酸才能打开');
            }
        }
    }
}

// 使用浓盐酸
function useHydrochloricAcid() {
    if (!inventory.has('hydrochloric_acid')) {
        showMessage('你没有浓盐酸');
        return;
    }
    
    for (let door of doors) {
        if (door.locked && door.lockType === 'acid') {
            const doorCenterX = door.x + door.width / 2;
            const doorCenterY = door.y + door.height / 2;
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const distance = Math.sqrt(
                Math.pow(doorCenterX - playerCenterX, 2) + 
                Math.pow(doorCenterY - playerCenterY, 2)
            );
            
            if (distance < 50) {
                door.locked = false;
                inventory.remove('hydrochloric_acid');
                showMessage('使用浓盐酸腐蚀了门锁，门打开了');
                return;
            }
        }
    }
    
    showMessage('附近没有需要使用浓盐酸的门');
}

// 扩展玩家对象
player.isHiding = false;
player.hideTimer = 0;

// 初始化恐怖游戏系统
function initHorrorGame() {
    ghostSystem.init();
    hidingSystem.init();
    
    // 添加键盘监听
    window.addEventListener('keydown', (e) => {
        // 密码输入模式
        if (gameState.passwordInput.active) {
            // 阻止默认行为
            e.preventDefault();
            
            // 检测数字键 (包括小键盘和主键盘)
            const isNumber = (e.key >= '0' && e.key <= '9');
            // 使用默认值确保数字输入正常工作
            const maxLength = gameState.passwordInput.maxLength || 4;
            
            if (isNumber && gameState.passwordInput.input.length < maxLength) {
                gameState.passwordInput.input += e.key;
                console.log('输入数字:', e.key, '当前密码:', gameState.passwordInput.input);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                gameState.passwordInput.input = gameState.passwordInput.input.slice(0, -1);
                console.log('删除字符，当前密码:', gameState.passwordInput.input);
            } else if (e.key === 'Enter' || e.key === 'Escape') {
                const puzzleId = gameState.passwordInput.puzzleId;
                const puzzle = puzzleSystem.puzzles[puzzleId];
                if (puzzle && gameState.passwordInput.input === puzzle.password) {
                    puzzleSystem.solve(puzzleId);
                    showMessage('密码正确! 谜题解开了!');
                } else {
                    showMessage('密码错误! 请再试一次');
                    puzzle.attempts++;
                }
                gameState.passwordInput.active = false;
                gameState.passwordInput.input = '';
                console.log('密码输入结束');
            }
            return;
        }
        
        if (e.key === 'e' || e.key === 'E') {
            // 互动键
            console.log('E键被按下');
            checkItemPickup();
            
            // 检查隐藏
            const hidingSpot = hidingSystem.canHide();
            if (hidingSpot) {
                player.isHiding = !player.isHiding;
                showMessage(player.isHiding ? '你躲进了储物柜' : '你离开了储物柜');
            }
            
            // 检查谜题交互
            checkPuzzleInteraction();
            
            // 检查门锁
            checkDoorLock();
        }
        
        if (e.key === 'f' || e.key === 'F') {
            // 使用浓盐酸
            useHydrochloricAcid();
        }
        
        if (e.key === 'c' || e.key === 'C') {
            // 打开/关闭笔记本
            if (inventory.has('notebook')) {
                gameState.notebook.active = !gameState.notebook.active;
                if (gameState.notebook.active) {
                    showMessage('打开了笔记本');
                }
            } else {
                showMessage('你没有笔记本');
            }
        }
        
        if (e.key === 'Tab') {
            e.preventDefault();
            uiSystem.showInventory = !uiSystem.showInventory;
        }
        
        if (e.key === 'Shift') {
            keys.Shift = true;
            player.speed = 10; // 奔跑速度
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            keys.Shift = false;
            player.speed = 3; // 正常速度
        }
    });
    
    // 添加鼠标点击事件处理虚拟键盘
    window.addEventListener('click', (e) => {
        if (!gameState.passwordInput.active) return;
        
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // 检查是否点击了虚拟键盘按钮
        const dialogX = canvas.width / 2 - 150;
        const dialogY = canvas.height / 2 - 120;
        const dialogWidth = 300;
        const dialogHeight = 240;
        
        const keypadStartY = dialogY + dialogHeight - 50;
        const buttonSize = 40;
        const buttonGap = 5;
        const keypadWidth = buttonSize * 3 + buttonGap * 2;
        const keypadX = dialogX + (dialogWidth - keypadWidth) / 2;
        
        const buttons = [
            { num: '1', x: 0, y: 0 },
            { num: '2', x: 1, y: 0 },
            { num: '3', x: 2, y: 0 },
            { num: '4', x: 0, y: 1 },
            { num: '5', x: 1, y: 1 },
            { num: '6', x: 2, y: 1 },
            { num: '7', x: 0, y: 2 },
            { num: '8', x: 1, y: 2 },
            { num: '9', x: 2, y: 2 },
            { num: 'C', x: 0, y: 3 },
            { num: '0', x: 1, y: 3 },
            { num: 'OK', x: 2, y: 3 }
        ];
        
        for (const btn of buttons) {
            const btnX = keypadX + btn.x * (buttonSize + buttonGap);
            const btnY = keypadStartY + btn.y * (buttonSize + buttonGap);
            
            // 检查点击是否在按钮范围内
            if (clickX >= btnX && clickX <= btnX + buttonSize &&
                clickY >= btnY && clickY <= btnY + buttonSize) {
                
                if (btn.num === 'C') {
                    // 清除输入
                    gameState.passwordInput.input = '';
                } else if (btn.num === 'OK') {
                    // 确认密码
                    const puzzleId = gameState.passwordInput.puzzleId;
                    const puzzle = puzzleSystem.puzzles[puzzleId];
                    if (puzzle && gameState.passwordInput.input === puzzle.password) {
                        puzzleSystem.solve(puzzleId);
                        showMessage('密码正确! 谜题解开了!');
                    } else {
                        showMessage('密码错误! 请再试一次');
                        puzzle.attempts++;
                    }
                    gameState.passwordInput.active = false;
                    gameState.passwordInput.input = '';
                } else if (gameState.passwordInput.input.length < gameState.passwordInput.maxLength) {
                    // 输入数字
                    gameState.passwordInput.input += btn.num;
                }
                
                e.preventDefault();
                return;
            }
        }
    });
}

// 扩展游戏主循环
const originalGameLoop = gameLoop;
gameLoop = function() {
    // 如果游戏结束，不更新
    if (gameState.isGameOver) {
        // 绘制游戏结束画面
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = gameState.isWin ? '#0f0' : '#f00';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            gameState.isWin ? '恭喜通关!' : '游戏结束',
            canvas.width/2,
            canvas.height/2
        );
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(
            gameState.isWin ? '你成功逃离了学校' : '你未能逃离学校...',
            canvas.width/2,
            canvas.height/2 + 50
        );
        
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // 隐藏时不能移动
    if (player.isHiding) {
        player.vx = 0;
        player.vy = 0;
        player.hideTimer++;
    }
    
    // 原有的游戏循环
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updatePlayer();
    updateCamera();
    updateDoors();
    
    // 更新恐怖游戏系统
    ghostSystem.update();
    uiSystem.update();
    checkItemPickup();
    updateUI();
    
    // 绘制
    drawGrid();
    drawBuildings();
    hidingSystem.draw(ctx);
    drawWalls();
    drawDoors();
    
    // 绘制普通世界物品（非交互式）
    for (let worldItem of worldItems) {
        if (worldItem.picked) continue;
        if (worldItem.item.type === 'interactive') continue; // 交互式物品稍后绘制
        
        // 检查是否在正确位置
        if (worldItem.building && player.currentBuilding?.name !== worldItem.building) continue;
        if (worldItem.room && player.currentRoom?.name !== worldItem.room) continue;
        
        const screenX = worldItem.x - camera.x;
        const screenY = worldItem.y - camera.y;
        
        // 绘制物品光晕
        const gradient = ctx.createRadialGradient(
            screenX + 10, screenY + 10, 0,
            screenX + 10, screenY + 10, 20
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 10, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制物品图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(worldItem.item.icon, screenX + 10, screenY + 15);
    }
    
    // 绘制鬼魂
    ghostSystem.draw(ctx);
    
    // 绘制玩家（如果不在隐藏状态）
    if (!player.isHiding) {
        drawPlayer();
    } else {
        // 绘制隐藏提示
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('[隐藏中]', canvas.width/2, canvas.height/2 + 50);
    }
    
    // 绘制交互式物品（电脑）- 在玩家之后绘制，避免被玩家遮挡
    for (let worldItem of worldItems) {
        if (worldItem.picked) continue;
        if (worldItem.item.type !== 'interactive') continue; // 只绘制交互式物品
        
        // 检查是否在正确位置
        if (worldItem.building && player.currentBuilding?.name !== worldItem.building) continue;
        if (worldItem.room && player.currentRoom?.name !== worldItem.room) continue;
        
        const screenX = worldItem.x - camera.x;
        const screenY = worldItem.y - camera.y;
        
        // 绘制物品光晕
        const gradient = ctx.createRadialGradient(
            screenX + 10, screenY + 10, 0,
            screenX + 10, screenY + 10, 20
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 10, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制物品图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(worldItem.item.icon, screenX + 10, screenY + 15);
    }
    
    drawLighting();
    drawMinimap();
    
    // 绘制任务提示
    questSystem.drawQuestHint(ctx);
    
    // 绘制UI
    uiSystem.draw(ctx);
    
    // 游戏时间
    gameState.gameTime++;
    
    requestAnimationFrame(gameLoop);
};

// 初始化
initHorrorGame();
