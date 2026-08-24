// 测试游戏 - 简化版本
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 玩家
const player = {
    x: 100,
    y: 300,
    width: 30,
    height: 50
};

// 键盘状态
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// 初始化
function init() {
    console.log('游戏初始化');
    gameLoop();
}

// 游戏循环
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 处理输入
    handleInput();
    
    // 绘制玩家
    drawPlayer();
    
    // 继续循环
    requestAnimationFrame(gameLoop);
}

// 处理输入
function handleInput() {
    if (keys.a) player.x -= 5;
    if (keys.d) player.x += 5;
    if (keys.w) player.y -= 5;
    if (keys.s) player.y += 5;
    
    // 边界检查
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// 绘制玩家
function drawPlayer() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制头部
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();
}

// 键盘事件
document.addEventListener('keydown', (e) => {
    console.log('Key down:', e.key);
    switch(e.key) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
        case ' ': keys.space = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
        case ' ': keys.space = false; break;
    }
});

// 启动
document.addEventListener('DOMContentLoaded', init);