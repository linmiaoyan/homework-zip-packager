const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coordsDisplay = document.getElementById('coords');

// 小地图
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');
const MINIMAP_SIZE = 200;

// 设置画布大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 大地图尺寸
const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 8000;

// 玩家（像素方块）
const player = {
    x: 300,
    y: 300,
    width: 16,
    height: 16,
    speed: 6,
    color: '#00ff00',
    vx: 0,
    vy: 0,
    currentBuilding: null,
    currentRoom: null
};

// 相机
const camera = {
    x: 0,
    y: 0
};

// 键盘输入
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false
};

// 建筑物定义
const buildings = [];
const walls = [];
const doors = [];

// 建筑物类
class Building {
    constructor(name, x, y, width, height, color, type) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
        this.rooms = [];
        this.lighting = 0.3;
    }

    addRoom(x, y, width, height, name) {
        const room = {
            x: this.x + x,
            y: this.y + y,
            width,
            height,
            name,
            building: this
        };
        this.rooms.push(room);
        return room;
    }

    contains(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    getRoomAt(px, py) {
        for (let room of this.rooms) {
            if (px >= room.x && px <= room.x + room.width &&
                py >= room.y && py <= room.y + room.height) {
                return room;
            }
        }
        return null;
    }
}

// 重新创建食堂区域
function createCanteen() {
    const canteen = new Building('食堂', 600, 400, 800, 600, '#2a2a1a', 'canteen');
    
    // 外墙
    walls.push(
        { x: canteen.x, y: canteen.y, width: canteen.width, height: 25, type: 'outer', building: canteen },
        { x: canteen.x, y: canteen.y + canteen.height - 25, width: canteen.width, height: 25, type: 'outer', building: canteen },
        { x: canteen.x, y: canteen.y, width: 25, height: canteen.height, type: 'outer', building: canteen },
        { x: canteen.x + canteen.width - 25, y: canteen.y, width: 25, height: canteen.height, type: 'outer', building: canteen }
    );

    // 重新设计内部隔断墙
    walls.push(
        // 横向隔断墙（分隔打饭区和就餐区/后厨）
        { x: canteen.x + 25, y: canteen.y + 350, width: 100, height: 15, type: 'inner', building: canteen }, // 左侧段（传菜口左侧）
        { x: canteen.x + 175, y: canteen.y + 350, width: 300, height: 15, type: 'inner', building: canteen }, // 中间段（传菜口右侧到门C左侧）
        { x: canteen.x + 525, y: canteen.y + 350, width: 250, height: 15, type: 'inner', building: canteen }, // 右侧段（门C右侧）
        
        // 纵向隔断墙（分隔打饭区）
        { x: canteen.x + 225, y: canteen.y + 25, width: 15, height: 140, type: 'inner', building: canteen }, // 打饭区A和B之间（门A上方）
        { x: canteen.x + 225, y: canteen.y + 210, width: 15, height: 140, type: 'inner', building: canteen }, // 打饭区A和B之间（门A下方）
        { x: canteen.x + 425, y: canteen.y + 25, width: 15, height: 140, type: 'inner', building: canteen }, // 打饭区B和C之间（门B上方）
        { x: canteen.x + 425, y: canteen.y + 210, width: 15, height: 140, type: 'inner', building: canteen }, // 打饭区B和C之间（门B下方）
        
        // 纵向隔断墙（分隔就餐区A和B）
        { x: canteen.x + 650, y: canteen.y + 25, width: 15, height: 320, type: 'inner', building: canteen }, // 就餐区A和B之间
        
        // 纵向隔断墙（分隔后厨）
        { x: canteen.x + 350, y: canteen.y + 365, width: 15, height: 210, type: 'inner', building: canteen }, // 后厨A和B之间
        
        // 后厨右侧墙
        { x: canteen.x + 575, y: canteen.y + 365, width: 25, height: 210, type: 'inner', building: canteen },
        
        // 就餐区B右侧墙（如果需要）
        { x: canteen.x + 775, y: canteen.y + 25, width: 25, height: 550, type: 'inner', building: canteen }
    );

    // 重新定义房间结构
    canteen.addRoom(40, 40, 165, 290, '打饭区A');
    canteen.addRoom(250, 40, 165, 290, '打饭区B');
    canteen.addRoom(450, 40, 180, 290, '打饭区C');
    canteen.addRoom(650, 40, 120, 290, '就餐区A');
    canteen.addRoom(650, 375, 120, 200, '就餐区B');
    canteen.addRoom(40, 375, 300, 200, '后厨A');
    canteen.addRoom(375, 375, 180, 200, '后厨B');

    // 外部门
    doors.push(
        { x: canteen.x + canteen.width / 2 - 60, y: canteen.y + canteen.height - 25, width: 120, height: 25, building: canteen, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: canteen.x + 25, y: canteen.y + 150, width: 25, height: 80, building: canteen, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    // 内部联通门
    doors.push(
        // 打饭区之间的门
        { x: canteen.x + 225, y: canteen.y + 150, width: 15, height: 60, building: canteen, name: '打饭区A-B门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        { x: canteen.x + 425, y: canteen.y + 150, width: 15, height: 60, building: canteen, name: '打饭区B-C门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        
        // 打饭区到就餐区的门
        { x: canteen.x + 550, y: canteen.y + 150, width: 15, height: 60, building: canteen, name: '打饭区C-就餐区A门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        
        // 就餐区A到B的门
        { x: canteen.x + 650, y: canteen.y + 330, width: 15, height: 60, building: canteen, name: '就餐区A-B门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        
        // 打饭区到后厨的传菜口
        { x: canteen.x + 125, y: canteen.y + 350, width: 50, height: 15, building: canteen, name: '传菜口', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        
        // 后厨A和B之间的门
        { x: canteen.x + 350, y: canteen.y + 450, width: 15, height: 60, building: canteen, name: '后厨A-B门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        
        // 后厨B到就餐区B的门
        { x: canteen.x + 500, y: canteen.y + 450, width: 60, height: 15, building: canteen, name: '后厨-就餐区门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        
        // 就餐区B的后门
        { x: canteen.x + 650, y: canteen.y + 540, width: 80, height: 25, building: canteen, name: '就餐区后门', isOpen: false, openProgress: 0, orientation: 'horizontal' }
    );

    buildings.push(canteen);
}

// 创建教学楼（放大版，4层）
function createTeachingBuilding() {
    const building = new Building('教学楼', 1600, 300, 900, 800, '#1a1a2a', 'teaching');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    const floorHeight = 190;
    const roomWidth = 200;
    
    for (let floor = 1; floor < 4; floor++) {
        walls.push({
            x: building.x + 25,
            y: building.y + floor * floorHeight,
            width: building.width - 50,
            height: 15,
            type: 'inner',
            building
        });
    }

    for (let floor = 0; floor < 4; floor++) {
        let floorY = building.y + 25 + floor * floorHeight;
        
        for (let i = 1; i <= 3; i++) {
            walls.push({
                x: building.x + 25 + i * roomWidth,
                y: floorY,
                width: 15,
                height: floorHeight - 15,
                type: 'inner',
                building
            });
        }

        for (let room = 0; room < 4; room++) {
            building.addRoom(
                40 + room * roomWidth,
                floor * floorHeight + 40,
                roomWidth - 15,
                floorHeight - 55,
                `${floor + 1}0${room + 1}教室`
            );
        }
    }

    doors.push(
        { x: building.x + building.width / 2 - 60, y: building.y + building.height - 25, width: 120, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 25, y: building.y + 100, width: 25, height: 60, building, name: '侧门1', isOpen: false, openProgress: 0, orientation: 'vertical' },
        { x: building.x + 25, y: building.y + 400, width: 25, height: 60, building, name: '侧门2', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    for (let floor = 0; floor < 4; floor++) {
        let floorY = building.y + 25 + floor * floorHeight;
        // 为每个房间添加门（每层楼4个房间，每个房间一个门）
        for (let room = 0; room < 4; room++) {
            // 每个房间的门开在走廊一侧（左侧）
            doors.push({
                x: building.x + 25,
                y: floorY + 40 + room * 35,
                width: 25,
                height: 40,
                building,
                name: `${floor + 1}0${room + 1}教室门`,
                isOpen: false,
                openProgress: 0,
                orientation: 'vertical'
            });
        }
        // 添加走廊之间的通道门
        for (let i = 1; i <= 3; i++) {
            doors.push({
                x: building.x + 25 + i * roomWidth,
                y: floorY + 60,
                width: 15,
                height: 50,
                building,
                name: `${floor + 1}楼通道${i}`,
                isOpen: false,
                openProgress: 0,
                orientation: 'vertical'
            });
        }
    }

    buildings.push(building);
}

// 创建行政楼（放大版）
function createAdminBuilding() {
    const building = new Building('行政楼', 600, 1200, 700, 500, '#2a1a1a', 'admin');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        { x: building.x + 230, y: building.y + 25, width: 15, height: 450, type: 'inner', building },
        { x: building.x + 460, y: building.y + 25, width: 15, height: 450, type: 'inner', building },
        { x: building.x + 25, y: building.y + 230, width: 650, height: 15, type: 'inner', building }
    );

    building.addRoom(40, 40, 175, 175, '校长室');
    building.addRoom(255, 40, 190, 175, '教务处');
    building.addRoom(485, 40, 190, 175, '财务室');
    building.addRoom(40, 255, 310, 220, '大会议室');
    building.addRoom(365, 255, 310, 220, '接待大厅');

    doors.push(
        { x: building.x + building.width / 2 - 55, y: building.y + building.height - 25, width: 110, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 25, y: building.y + 120, width: 25, height: 60, building, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    doors.push(
        // 上层房间门
        { x: building.x + 230, y: building.y + 100, width: 15, height: 50, building, name: '门1', isOpen: false, openProgress: 0, orientation: 'vertical' },
        { x: building.x + 460, y: building.y + 100, width: 15, height: 50, building, name: '门2', isOpen: false, openProgress: 0, orientation: 'vertical' },
        // 大会议室的门
        { x: building.x + 120, y: building.y + 230, width: 50, height: 15, building, name: '门3', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 230, y: building.y + 350, width: 15, height: 50, building, name: '会议室侧门', isOpen: false, openProgress: 0, orientation: 'vertical' },
        // 大会议室和接待大厅之间的门
        { x: building.x + 350, y: building.y + 230, width: 50, height: 15, building, name: '门4', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        // 接待大厅的门
        { x: building.x + 500, y: building.y + 230, width: 50, height: 15, building, name: '门5', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 460, y: building.y + 350, width: 15, height: 50, building, name: '大厅侧门', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    buildings.push(building);
}

// 创建实验室（放大版）
function createLabBuilding() {
    const building = new Building('实验室', 1600, 1200, 750, 650, '#1a2a1a', 'lab');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        { x: building.x + 240, y: building.y + 25, width: 15, height: 600, type: 'inner', building },
        { x: building.x + 480, y: building.y + 25, width: 15, height: 600, type: 'inner', building },
        { x: building.x + 25, y: building.y + 200, width: 700, height: 15, type: 'inner', building },
        { x: building.x + 25, y: building.y + 400, width: 700, height: 15, type: 'inner', building }
    );

    building.addRoom(40, 40, 185, 145, '物理实验室');
    building.addRoom(265, 40, 200, 145, '化学实验室');
    building.addRoom(505, 40, 220, 145, '生物实验室');
    building.addRoom(40, 225, 185, 160, '准备室A');
    building.addRoom(265, 225, 200, 160, '仪器室');
    building.addRoom(505, 225, 220, 160, '准备室B');
    building.addRoom(40, 425, 435, 200, '综合实验室');
    building.addRoom(495, 425, 230, 200, '储藏室');

    doors.push(
        { x: building.x + building.width / 2 - 50, y: building.y + building.height - 25, width: 100, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + building.width - 25, y: building.y + 100, width: 25, height: 60, building, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    doors.push(
        // 上层实验室之间的门
        { x: building.x + 240, y: building.y + 80, width: 15, height: 50, building, name: '物理实验室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: true, lockType: 'acid' },
        { x: building.x + 480, y: building.y + 80, width: 15, height: 50, building, name: '化学实验室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: true, lockType: 'key', requiredKey: 'key_lab' },
        // 中层准备室之间的门
        { x: building.x + 240, y: building.y + 280, width: 15, height: 50, building, name: '仪器室左门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: true, lockType: 'key', requiredKey: 'key_lab' },
        { x: building.x + 480, y: building.y + 280, width: 15, height: 50, building, name: '门D', isOpen: false, openProgress: 0, orientation: 'vertical' },
        // 横向通道门（上层）
        { x: building.x + 120, y: building.y + 200, width: 50, height: 15, building, name: '门E', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 350, y: building.y + 200, width: 50, height: 15, building, name: '仪器室下门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: true, lockType: 'key', requiredKey: 'key_lab' },
        { x: building.x + 580, y: building.y + 200, width: 50, height: 15, building, name: '生物实验室门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: true, lockType: 'key', requiredKey: 'key_lab' },
        // 综合实验室的门（多个入口）
        { x: building.x + 120, y: building.y + 400, width: 50, height: 15, building, name: '综合实验室门1', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        { x: building.x + 350, y: building.y + 400, width: 50, height: 15, building, name: '综合实验室门2', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        // 储藏室的门（在右侧墙上）
        { x: building.x + 700, y: building.y + 500, width: 50, height: 15, building, name: '储藏室门', isOpen: false, openProgress: 0, orientation: 'horizontal' },
        // 综合实验室和储藏室之间的门
        { x: building.x + 480, y: building.y + 500, width: 15, height: 50, building, name: '门H', isOpen: false, openProgress: 0, orientation: 'vertical' }
    );

    buildings.push(building);
}

// 创建图书馆
function createLibrary() {
    const building = new Building('图书馆', 3000, 300, 900, 700, '#2a2a3a', 'library');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        // 左侧垂直墙（带门空隙）
        { x: building.x + 200, y: building.y + 25, width: 15, height: 105, type: 'inner', building },  // 第一层上方
        { x: building.x + 200, y: building.y + 185, width: 15, height: 80, type: 'inner', building },  // 第一层下方到第二层上方
        { x: building.x + 200, y: building.y + 400, width: 15, height: 80, type: 'inner', building },  // 第二层下方到第三层上方
        { x: building.x + 200, y: building.y + 600, width: 15, height: 75, type: 'inner', building },  // 第三层下方
        
        // 右侧垂直墙（带门空隙）
        { x: building.x + 500, y: building.y + 25, width: 15, height: 105, type: 'inner', building },
        { x: building.x + 500, y: building.y + 185, width: 15, height: 80, type: 'inner', building },
        { x: building.x + 500, y: building.y + 400, width: 15, height: 80, type: 'inner', building },
        { x: building.x + 500, y: building.y + 600, width: 15, height: 75, type: 'inner', building },
        
        // 上层水平墙（带门空隙）
        { x: building.x + 25, y: building.y + 250, width: 50, height: 15, type: 'inner', building },   // 左侧段
        { x: building.x + 150, y: building.y + 250, width: 100, height: 15, type: 'inner', building }, // 阅览室A-古籍室门右侧
        { x: building.x + 300, y: building.y + 250, width: 100, height: 15, type: 'inner', building }, // 借阅大厅-前台门左侧
        { x: building.x + 450, y: building.y + 250, width: 100, height: 15, type: 'inner', building }, // 借阅大厅-前台门右侧
        { x: building.x + 600, y: building.y + 250, width: 100, height: 15, type: 'inner', building }, // 阅览室B-自习室门左侧
        { x: building.x + 750, y: building.y + 250, width: 125, height: 15, type: 'inner', building }, // 右侧段
        
        // 下层水平墙（带门空隙）
        { x: building.x + 25, y: building.y + 450, width: 50, height: 15, type: 'inner', building },
        { x: building.x + 150, y: building.y + 450, width: 100, height: 15, type: 'inner', building },
        { x: building.x + 300, y: building.y + 450, width: 100, height: 15, type: 'inner', building },
        { x: building.x + 450, y: building.y + 450, width: 100, height: 15, type: 'inner', building },
        { x: building.x + 600, y: building.y + 450, width: 100, height: 15, type: 'inner', building },
        { x: building.x + 750, y: building.y + 450, width: 125, height: 15, type: 'inner', building }
    );

    building.addRoom(40, 40, 145, 195, '阅览室A');
    building.addRoom(225, 40, 265, 195, '借阅大厅');
    building.addRoom(525, 40, 330, 195, '阅览室B');
    building.addRoom(40, 275, 145, 165, '古籍室');
    building.addRoom(225, 275, 265, 165, '前台');
    building.addRoom(525, 275, 330, 165, '自习室');
    building.addRoom(40, 475, 145, 200, '档案室');
    building.addRoom(225, 475, 265, 200, '书库');
    building.addRoom(525, 475, 330, 200, '阅览室C');

    doors.push(
        { x: building.x + building.width / 2 - 60, y: building.y + building.height - 25, width: 120, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 25, y: building.y + 100, width: 25, height: 60, building, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    doors.push(
        // 第一层水平门：阅览室A - 借阅大厅 - 阅览室B
        { x: building.x + 185, y: building.y + 130, width: 15, height: 50, building, name: '阅览室A-借阅大厅门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 485, y: building.y + 130, width: 15, height: 50, building, name: '借阅大厅-阅览室B门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        
        // 垂直门：连接各层
        { x: building.x + 100, y: building.y + 250, width: 50, height: 15, building, name: '阅览室A-古籍室门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 350, y: building.y + 250, width: 50, height: 15, building, name: '借阅大厅-前台门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 650, y: building.y + 250, width: 50, height: 15, building, name: '阅览室B-自习室门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        
        // 第二层水平门：古籍室 - 前台 - 自习室
        { x: building.x + 185, y: building.y + 350, width: 15, height: 50, building, name: '古籍室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: true, lockType: 'key', requiredKey: 'key_library' },
        { x: building.x + 485, y: building.y + 350, width: 15, height: 50, building, name: '前台-自习室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        
        // 垂直门：连接第二层和第三层
        { x: building.x + 100, y: building.y + 450, width: 50, height: 15, building, name: '古籍室-档案室门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 350, y: building.y + 450, width: 50, height: 15, building, name: '前台-书库门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 650, y: building.y + 450, width: 50, height: 15, building, name: '自习室-阅览室C门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        
        // 第三层水平门：档案室 - 书库 - 阅览室C
        { x: building.x + 185, y: building.y + 550, width: 15, height: 50, building, name: '档案室-书库门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 485, y: building.y + 550, width: 15, height: 50, building, name: '书库-阅览室C门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    buildings.push(building);
}

// 创建宿舍楼
function createDormitory() {
    const building = new Building('宿舍楼', 3000, 1200, 800, 600, '#3a2a2a', 'dormitory');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        { x: building.x + 25, y: building.y + 200, width: 750, height: 15, type: 'inner', building },
        { x: building.x + 25, y: building.y + 400, width: 750, height: 15, type: 'inner', building },
        { x: building.x + 200, y: building.y + 25, width: 15, height: 550, type: 'inner', building },
        { x: building.x + 400, y: building.y + 25, width: 15, height: 550, type: 'inner', building },
        { x: building.x + 600, y: building.y + 25, width: 15, height: 550, type: 'inner', building }
    );

    building.addRoom(40, 40, 145, 150, '101室');
    building.addRoom(225, 40, 165, 150, '102室');
    building.addRoom(425, 40, 165, 150, '103室');
    building.addRoom(625, 40, 150, 150, '104室');
    building.addRoom(40, 225, 145, 165, '201室');
    building.addRoom(225, 225, 165, 165, '202室');
    building.addRoom(425, 225, 165, 165, '203室');
    building.addRoom(625, 225, 150, 165, '204室');
    building.addRoom(40, 425, 145, 150, '301室');
    building.addRoom(225, 425, 165, 150, '302室');
    building.addRoom(425, 425, 165, 150, '303室');
    building.addRoom(625, 425, 150, 150, '304室');

    doors.push(
        { x: building.x + building.width / 2 - 60, y: building.y + building.height - 25, width: 120, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false }
    );

    doors.push(
        { x: building.x + 200, y: building.y + 100, width: 15, height: 50, building, name: '101-102门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 400, y: building.y + 100, width: 15, height: 50, building, name: '102-103门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 600, y: building.y + 100, width: 15, height: 50, building, name: '103-104门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 200, y: building.y + 300, width: 15, height: 50, building, name: '201-202门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 400, y: building.y + 300, width: 15, height: 50, building, name: '202-203门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 600, y: building.y + 300, width: 15, height: 50, building, name: '203-204门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 200, y: building.y + 500, width: 15, height: 50, building, name: '301-302门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 400, y: building.y + 500, width: 15, height: 50, building, name: '302-303门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 600, y: building.y + 500, width: 15, height: 50, building, name: '303-304门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    buildings.push(building);
}

// 创建体育馆
function createGymnasium() {
    const building = new Building('体育馆', 4200, 300, 1000, 800, '#2a3a2a', 'gymnasium');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        { x: building.x + 25, y: building.y + 400, width: 950, height: 15, type: 'inner', building },
        { x: building.x + 600, y: building.y + 25, width: 15, height: 750, type: 'inner', building }
    );

    building.addRoom(40, 40, 545, 345, '主场地');
    building.addRoom(625, 40, 330, 345, '器材室');
    building.addRoom(40, 425, 545, 350, '更衣室');
    building.addRoom(625, 425, 330, 350, '储藏室');

    doors.push(
        { x: building.x + building.width / 2 - 60, y: building.y + building.height - 25, width: 120, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 25, y: building.y + 200, width: 25, height: 60, building, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    doors.push(
        { x: building.x + 600, y: building.y + 100, width: 15, height: 50, building, name: '器材室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 600, y: building.y + 500, width: 15, height: 50, building, name: '储藏室门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    buildings.push(building);
}

// 创建花园
function createGarden() {
    const building = new Building('花园', 4200, 1200, 1200, 800, '#1a3a1a', 'garden');
    
    walls.push(
        { x: building.x, y: building.y, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y + building.height - 25, width: building.width, height: 25, type: 'outer', building },
        { x: building.x, y: building.y, width: 25, height: building.height, type: 'outer', building },
        { x: building.x + building.width - 25, y: building.y, width: 25, height: building.height, type: 'outer', building }
    );

    walls.push(
        { x: building.x + 400, y: building.y + 25, width: 15, height: 750, type: 'inner', building },
        { x: building.x + 800, y: building.y + 25, width: 15, height: 750, type: 'inner', building },
        { x: building.x + 25, y: building.y + 400, width: 1150, height: 15, type: 'inner', building }
    );

    building.addRoom(40, 40, 345, 345, '花园区A');
    building.addRoom(425, 40, 365, 345, '花园区B');
    building.addRoom(825, 40, 350, 345, '花园区C');
    building.addRoom(40, 425, 345, 350, '休息区');
    building.addRoom(425, 425, 365, 350, '迷宫区');
    building.addRoom(825, 425, 350, 350, '凉亭区');

    doors.push(
        { x: building.x + building.width / 2 - 60, y: building.y + building.height - 25, width: 120, height: 25, building, name: '正门', isOpen: false, openProgress: 0, orientation: 'horizontal', locked: false },
        { x: building.x + 25, y: building.y + 200, width: 25, height: 60, building, name: '侧门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    doors.push(
        { x: building.x + 400, y: building.y + 100, width: 15, height: 50, building, name: '花园区A-B门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 800, y: building.y + 100, width: 15, height: 50, building, name: '花园区B-C门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 400, y: building.y + 500, width: 15, height: 50, building, name: '休息区-迷宫门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false },
        { x: building.x + 800, y: building.y + 500, width: 15, height: 50, building, name: '迷宫-凉亭门', isOpen: false, openProgress: 0, orientation: 'vertical', locked: false }
    );

    buildings.push(building);
}

// 生成地图
function generateMap() {
    createCanteen();
    createTeachingBuilding();
    createAdminBuilding();
    createLabBuilding();
    createLibrary();
    createDormitory();
    createGymnasium();
    createGarden();

    for (let i = 0; i < 40; i++) {
        walls.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            width: 40 + Math.random() * 60,
            height: 40 + Math.random() * 60,
            type: 'decoration',
            building: null
        });
    }
}

generateMap();

// 键盘事件监听
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// 检查玩家在哪个建筑物内
function checkPlayerBuilding() {
    for (let building of buildings) {
        if (building.contains(player.x, player.y)) {
            return building;
        }
    }
    return null;
}

// 检查玩家在哪个房间内
function checkPlayerRoom() {
    if (!player.currentBuilding) return null;
    return player.currentBuilding.getRoomAt(player.x, player.y);
}

// 更新门动画
function updateDoors() {
    for (let door of doors) {
        // 检查玩家是否在门附近
        const doorCenterX = door.x + door.width / 2;
        const doorCenterY = door.y + door.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt(
            Math.pow(doorCenterX - playerCenterX, 2) + 
            Math.pow(doorCenterY - playerCenterY, 2)
        );

        const activationDistance = 60;
        const shouldOpen = distance < activationDistance;

        // 检查门锁
        let canOpen = true;
        if (door.locked) {
            canOpen = false;
            // 检查是否有钥匙
            if (door.lockType === 'key' && door.requiredKey) {
                // 这里会在game-horror.js中检查钥匙
            }
        }

        if (shouldOpen && !door.isOpen && canOpen) {
            door.isOpen = true;
        } else if (!shouldOpen && door.isOpen) {
            door.isOpen = false;
        }

        // 更新开门进度
        if (door.isOpen && door.openProgress < 1) {
            door.openProgress += 0.08;
            if (door.openProgress > 1) door.openProgress = 1;
        } else if (!door.isOpen && door.openProgress > 0) {
            door.openProgress -= 0.08;
            if (door.openProgress < 0) door.openProgress = 0;
        }
    }
}

// 更新玩家位置
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

    if (keys.w || keys.ArrowUp) player.vy = -player.speed;
    if (keys.s || keys.ArrowDown) player.vy = player.speed;
    if (keys.a || keys.ArrowLeft) player.vx = -player.speed;
    if (keys.d || keys.ArrowRight) player.vx = player.speed;

    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.707;
        player.vy *= 0.707;
    }

    let newX = player.x + player.vx;
    let newY = player.y + player.vy;

    newX = Math.max(0, Math.min(WORLD_WIDTH - player.width, newX));
    newY = Math.max(0, Math.min(WORLD_HEIGHT - player.height, newY));

    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
        if (checkCollision({ ...player, x: newX }, wall)) {
            canMoveX = false;
        }
        if (checkCollision({ ...player, y: newY }, wall)) {
            canMoveY = false;
        }
    }

    // 门碰撞检测（门打开时可以通过）
    for (let door of doors) {
        if (checkCollision({ ...player, x: newX, y: newY }, door)) {
            // 只有当门打开超过50%时才能通过
            if (door.openProgress > 0.5) {
                canMoveX = true;
                canMoveY = true;
            }
        }
    }

    if (canMoveX) player.x = newX;
    if (canMoveY) player.y = newY;

    // 更新当前建筑物和房间
    player.currentBuilding = checkPlayerBuilding();
    player.currentRoom = checkPlayerRoom();

    // 更新坐标显示
    let locationText = `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    if (player.currentRoom) {
        locationText += ` - ${player.currentRoom.name}`;
    } else if (player.currentBuilding) {
        locationText += ` - ${player.currentBuilding.name}(走廊)`;
    }
    coordsDisplay.textContent = locationText;
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 更新相机位置
function updateCamera() {
    let targetX = player.x + player.width / 2 - canvas.width / 2;
    let targetY = player.y + player.height / 2 - canvas.height / 2;

    targetX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetX));
    targetY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, targetY));

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
}

// 绘制网格背景
function drawGrid() {
    const gridSize = 50;
    const offsetX = -camera.x % gridSize;
    const offsetY = -camera.y % gridSize;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 绘制建筑物
function drawBuildings() {
    for (let building of buildings) {
        // 绘制建筑物主体
        ctx.fillStyle = building.color;
        ctx.fillRect(
            building.x - camera.x,
            building.y - camera.y,
            building.width,
            building.height
        );

        // 绘制房间
        for (let room of building.rooms) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(
                room.x - camera.x,
                room.y - camera.y,
                room.width,
                room.height
            );

            // 绘制房间边框
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                room.x - camera.x,
                room.y - camera.y,
                room.width,
                room.height
            );

            // 绘制房间名称
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                room.name,
                room.x + room.width / 2 - camera.x,
                room.y + room.height / 2 - camera.y
            );
        }
    }
}

// 绘制门（带动画效果）
function drawDoors() {
    for (let door of doors) {
        const screenX = door.x - camera.x;
        const screenY = door.y - camera.y;
        
        // 门框
        ctx.fillStyle = '#444';
        ctx.fillRect(screenX, screenY, door.width, door.height);

        // 门扇动画
        const progress = door.openProgress;
        
        if (door.orientation === 'horizontal') {
            // 水平门（左右开启）
            const doorWidth = door.width * (1 - progress * 0.8);
            const leftWidth = doorWidth / 2;
            const rightWidth = doorWidth / 2;
            
            // 左门扇
            ctx.fillStyle = progress > 0 ? '#8B4513' : '#654321';
            ctx.fillRect(screenX, screenY, leftWidth, door.height);
            
            // 右门扇
            ctx.fillRect(screenX + door.width - rightWidth, screenY, rightWidth, door.height);
            
            // 门缝效果
            if (progress > 0) {
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX + leftWidth, screenY, door.width - doorWidth, door.height);
            }
        } else {
            // 垂直门（上下开启）
            const doorHeight = door.height * (1 - progress * 0.8);
            const topHeight = doorHeight / 2;
            const bottomHeight = doorHeight / 2;
            
            // 上门扇
            ctx.fillStyle = progress > 0 ? '#8B4513' : '#654321';
            ctx.fillRect(screenX, screenY, door.width, topHeight);
            
            // 下门扇
            ctx.fillRect(screenX, screenY + door.height - bottomHeight, door.width, bottomHeight);
            
            // 门缝效果
            if (progress > 0) {
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX, screenY + topHeight, door.width, door.height - doorHeight);
            }
        }

        // 门把手
        if (progress < 0.5) {
            ctx.fillStyle = '#FFD700';
            if (door.orientation === 'horizontal') {
                ctx.beginPath();
                ctx.arc(screenX + door.width / 2, screenY + door.height / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(screenX + door.width / 2, screenY + door.height / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// 绘制墙壁
function drawWalls() {
    for (let wall of walls) {
        if (wall.type === 'outer') {
            ctx.fillStyle = '#555';
        } else if (wall.type === 'inner') {
            ctx.fillStyle = '#444';
        } else {
            ctx.fillStyle = '#333';
        }
        
        ctx.fillRect(
            wall.x - camera.x,
            wall.y - camera.y,
            wall.width,
            wall.height
        );
    }
}

// 绘制玩家
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(
        player.x - camera.x,
        player.y - camera.y,
        player.width,
        player.height
    );

    // 玩家光晕
    const gradient = ctx.createRadialGradient(
        player.x + player.width / 2 - camera.x,
        player.y + player.height / 2 - camera.y,
        0,
        player.x + player.width / 2 - camera.x,
        player.y + player.height / 2 - camera.y,
        30
    );
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(
        player.x - camera.x - 30,
        player.y - camera.y - 30,
        player.width + 60,
        player.height + 60
    );
}

// 绘制光照效果
function drawLighting() {
    // 创建遮罩层
    const lightingCanvas = document.createElement('canvas');
    lightingCanvas.width = canvas.width;
    lightingCanvas.height = canvas.height;
    const lightingCtx = lightingCanvas.getContext('2d');

    // 填充全黑
    lightingCtx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    lightingCtx.fillRect(0, 0, canvas.width, canvas.height);

    // 玩家位置
    const playerScreenX = player.x + player.width / 2 - camera.x;
    const playerScreenY = player.y + player.height / 2 - camera.y;

    // 如果在房间内，只显示当前房间
    if (player.currentRoom) {
        const room = player.currentRoom;
        const roomScreenX = room.x - camera.x;
        const roomScreenY = room.y - camera.y;

        // 在遮罩层上挖洞显示当前房间
        lightingCtx.globalCompositeOperation = 'destination-out';
        
        // 房间照明区域
        const roomGradient = lightingCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, Math.max(room.width, room.height) * 0.8
        );
        roomGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        roomGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
        roomGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        lightingCtx.fillStyle = roomGradient;
        lightingCtx.fillRect(
            roomScreenX - 50,
            roomScreenY - 50,
            room.width + 100,
            room.height + 100
        );

        // 门附近的照明（显示相邻房间入口）
        for (let door of doors) {
            const doorScreenX = door.x + door.width / 2 - camera.x;
            const doorScreenY = door.y + door.height / 2 - camera.y;
            const distanceToDoor = Math.sqrt(
                Math.pow(door.x + door.width / 2 - player.x - player.width / 2, 2) +
                Math.pow(door.y + door.height / 2 - player.y - player.height / 2, 2)
            );

            if (distanceToDoor < 150) {
                const doorGradient = lightingCtx.createRadialGradient(
                    doorScreenX, doorScreenY, 0,
                    doorScreenX, doorScreenY, 80
                );
                doorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                doorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                lightingCtx.fillStyle = doorGradient;
                lightingCtx.beginPath();
                lightingCtx.arc(doorScreenX, doorScreenY, 80, 0, Math.PI * 2);
                lightingCtx.fill();
            }
        }
    } else if (player.currentBuilding) {
        // 在建筑物内但不在房间内（走廊）
        lightingCtx.globalCompositeOperation = 'destination-out';
        
        const building = player.currentBuilding;
        const buildingScreenX = building.x - camera.x;
        const buildingScreenY = building.y - camera.y;

        // 走廊照明
        const corridorGradient = lightingCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, 200
        );
        corridorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        corridorGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        corridorGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        lightingCtx.fillStyle = corridorGradient;
        lightingCtx.fillRect(
            buildingScreenX,
            buildingScreenY,
            building.width,
            building.height
        );
    } else {
        // 室外视野限制
        lightingCtx.globalCompositeOperation = 'destination-out';
        
        const viewRadius = 180;
        const gradient = lightingCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, viewRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        lightingCtx.fillStyle = gradient;
        lightingCtx.beginPath();
        lightingCtx.arc(playerScreenX, playerScreenY, viewRadius, 0, Math.PI * 2);
        lightingCtx.fill();
    }

    // 绘制遮罩层
    ctx.drawImage(lightingCanvas, 0, 0);
}

// 绘制小地图
function drawMinimap() {
    // 清空小地图
    minimapCtx.fillStyle = '#111';
    minimapCtx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // 计算缩放比例
    const scaleX = MINIMAP_SIZE / WORLD_WIDTH;
    const scaleY = MINIMAP_SIZE / WORLD_HEIGHT;

    // 绘制建筑物
    for (let building of buildings) {
        minimapCtx.fillStyle = building.color;
        minimapCtx.fillRect(
            building.x * scaleX,
            building.y * scaleY,
            building.width * scaleX,
            building.height * scaleY
        );
    }

    // 绘制墙壁
    for (let wall of walls) {
        if (wall.type === 'outer' || wall.type === 'inner') {
            minimapCtx.fillStyle = '#666';
            minimapCtx.fillRect(
                wall.x * scaleX,
                wall.y * scaleY,
                Math.max(wall.width * scaleX, 1),
                Math.max(wall.height * scaleY, 1)
            );
        }
    }

    // 绘制玩家位置（绿色点）
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.beginPath();
    minimapCtx.arc(
        (player.x + player.width / 2) * scaleX,
        (player.y + player.height / 2) * scaleY,
        3,
        0,
        Math.PI * 2
    );
    minimapCtx.fill();

    // 绘制玩家视野范围框
    const viewWidth = canvas.width * scaleX;
    const viewHeight = canvas.height * scaleY;
    const viewX = (player.x + player.width / 2 - canvas.width / 2) * scaleX;
    const viewY = (player.y + player.height / 2 - canvas.height / 2) * scaleY;

    minimapCtx.strokeStyle = '#00ff00';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(viewX, viewY, viewWidth, viewHeight);

    // 绘制小地图边框
    minimapCtx.strokeStyle = '#444';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
}

// 游戏主循环
function gameLoop() {
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新
    updatePlayer();
    updateCamera();
    updateDoors();

    // 绘制
    drawGrid();
    drawBuildings();
    drawWalls();
    drawDoors();
    drawPlayer();
    drawLighting();
    drawMinimap();

    requestAnimationFrame(gameLoop);
}

// 启动游戏
gameLoop();
