// 游戏数据
let gameData = {
    age: 0,
    wealth: 1000,
    health: 100,
    happiness: 80,
    traits: [],
    achievements: [],
    eventHistory: []
};

// 特质卡片数据
const traitCards = [
    // 正面特质
    { name: "聪明伶俐", description: "学习能力强，更容易获得好工作", buff: { wealth: 500, happiness: 10 } },
    { name: "身体健康", description: "体质好，不容易生病", buff: { health: 20, happiness: 5 } },
    { name: "乐观开朗", description: "心态好，面对困难更积极", buff: { happiness: 20, health: 10 } },
    { name: "家境优渥", description: "出生在富裕家庭", buff: { wealth: 2000 } },
    { name: "创造力强", description: "思维活跃，容易有创新想法", buff: { wealth: 300, happiness: 15 } },
    // 负面特质（带有部分正面效果）
    { name: "急躁易怒", description: "容易发脾气，但做事雷厉风行，效率高", buff: { happiness: -15, wealth: 300 } },
    { name: "体弱多病", description: "体质较差，但更加珍惜生命，心态平和", buff: { health: -20, happiness: 15 } },
    { name: "优柔寡断", description: "做决定困难，但考虑周全，减少错误", buff: { wealth: -200, health: 10 } },
    { name: "家境贫寒", description: "出生在贫困家庭，但更加努力，意志力强", buff: { wealth: -1000, health: 20, happiness: 5 } },
    { name: "消极悲观", description: "心态消极，但更加谨慎，避免风险", buff: { happiness: -20, wealth: 400 } }
];

// 人生事件数据 - 按年份组织
const lifeEvents = [
    // 1-10岁
    { age: 1, title: "出生", description: "在一个平凡的日子里，你来到了这个世界。你的父母对你充满了期待，希望你能健康快乐地成长。", choices: [{ text: "健康成长", effects: { health: 5, happiness: 5 } }] },
    { age: 3, title: "学走路", description: "你开始学习走路，摇摇晃晃的样子逗得家人哈哈大笑。虽然摔倒了几次，但你依然坚持不懈地尝试。", choices: [{ text: "勇敢尝试", effects: { health: 3, happiness: 10 } }] },
    { age: 5, title: "幼儿园入学", description: "你到了上幼儿园的年龄，父母送你去了附近的幼儿园。面对陌生的环境和小朋友，你感到既紧张又兴奋。", choices: [{ text: "积极参与活动，结交新朋友", effects: { happiness: 10, health: 5 } }, { text: "比较害羞，喜欢自己玩", effects: { happiness: -5, health: 0 } }] },
    { age: 7, title: "小学入学", description: "你开始上小学，正式开始了学习生涯。课堂上的知识让你感到新鲜，课间的玩耍让你交到了更多朋友。", choices: [{ text: "认真学习", effects: { happiness: 5, wealth: 50 } }, { text: "贪玩好动", effects: { happiness: 10, health: 5, wealth: -20 } }] },
    { age: 10, title: "童年时光", description: "你度过了快乐的童年时光，开始有了自己的兴趣爱好。无论是画画、弹琴还是运动，都让你的生活充满了色彩。", choices: [{ text: "培养兴趣爱好", effects: { happiness: 15, health: 5 } }, { text: "专注学习", effects: { wealth: 100, happiness: 5 } }] },

    // 11-20岁
    { age: 12, title: "青春期开始", description: "你进入了青春期，身体和心理都开始发生变化。你开始对自己的未来有了更多的思考，也对周围的世界有了不同的看法。", choices: [{ text: "积极面对变化", effects: { happiness: 10, health: 5 } }, { text: "感到困惑不安", effects: { happiness: -10, health: -5 } }] },
    { age: 15, title: "中考", description: "你参加了中考，面临升学压力。每天的复习让你感到疲惫，但想到未来的高中生活，你又充满了动力。", choices: [{ text: "努力备考", effects: { wealth: 200, happiness: 5 } }, { text: "轻松应对", effects: { happiness: 10, health: 5, wealth: -50 } }] },
    { age: 18, title: "高考", description: "你参加了高考，这是人生的重要转折点。考场外的父母对你充满了期待，而你也希望能考出理想的成绩，进入心仪的大学。", choices: [{ text: "全力冲刺", effects: { wealth: 500, happiness: 10 } }, { text: "顺其自然", effects: { happiness: 15, health: 10, wealth: -100 } }] },
    { age: 19, title: "大学入学", description: "你进入了大学，开始了新的学习生活。大学校园的自由氛围让你感到兴奋，你可以选择自己喜欢的课程和社团活动。", choices: [{ text: "积极参与社团活动", effects: { happiness: 15, wealth: -100 } }, { text: "专注学术研究", effects: { wealth: 300, happiness: 5 } }] },
    { age: 20, title: "经济新闻", description: "全球经济出现波动，影响了就业市场。你开始关注经济动态，思考自己未来的职业规划。", choices: [{ text: "关注经济动态，调整职业规划", effects: { wealth: 200, happiness: 5 } }, { text: "不关心外界变化，专注自身发展", effects: { happiness: 10, wealth: -100 } }] },

    // 21-30岁
    { age: 22, title: "大学毕业", description: "你大学毕业了，面临就业选择。是选择稳定的工作，还是追求自己的梦想？这个决定将影响你未来的人生轨迹。", choices: [{ text: "选择稳定的工作", effects: { wealth: 1000, happiness: 10 } }, { text: "追求自己的梦想", effects: { happiness: 20, wealth: -500 } }] },
    { age: 25, title: "职业发展", description: "你在工作中表现出色，有机会晋升。但晋升意味着更大的责任和压力，你需要在事业和生活之间找到平衡。", choices: [{ text: "争取晋升机会", effects: { wealth: 2000, health: -10 } }, { text: "保持现状，注重生活平衡", effects: { health: 15, happiness: 15, wealth: -500 } }] },
    { age: 27, title: "国际政治事件", description: "国际局势紧张，影响了全球经济。你开始关注国际形势，思考如何调整自己的投资策略以应对可能的风险。", choices: [{ text: "关注国际形势，调整投资策略", effects: { wealth: 1500, happiness: 5 } }, { text: "不关心政治，专注个人生活", effects: { happiness: 10, wealth: -500 } }] },
    { age: 28, title: "婚姻选择", description: "你面临婚姻选择，需要决定是否步入婚姻殿堂。是选择稳定的伴侣组建家庭，还是继续专注于自己的事业？", choices: [{ text: "选择结婚，组建家庭", effects: { happiness: 25, wealth: -1000 } }, { text: "保持单身，专注事业", effects: { wealth: 1500, happiness: -10 } }] },
    { age: 30, title: "经济危机", description: "全球经济危机爆发，很多公司裁员。你所在的公司也受到了影响，你需要谨慎理财，度过这个艰难时期。", choices: [{ text: "谨慎理财，减少开支", effects: { wealth: 500, happiness: -5 } }, { text: "保持乐观，继续投资", effects: { wealth: -1000, happiness: 10 } }] },

    // 31-40岁
    { age: 32, title: "职业转型", description: "你考虑职业转型，寻找新的发展机会。虽然离开熟悉的领域有些冒险，但你渴望挑战自己，追求更大的发展空间。", choices: [{ text: "勇敢尝试新领域", effects: { happiness: 20, wealth: -1000 } }, { text: "保持现有职业，稳步发展", effects: { wealth: 1500, happiness: 5 } }] },
    { age: 35, title: "子女教育", description: "你的孩子到了上学年龄，教育问题成为家庭重点。你希望给孩子最好的教育，但也担心过度的压力会影响孩子的身心健康。", choices: [{ text: "注重孩子的全面发展", effects: { happiness: 15, wealth: -1500 } }, { text: "严格要求，注重学业成绩", effects: { wealth: 500, happiness: -10, health: -5 } }] },
    { age: 37, title: "国际冲突", description: "地区冲突升级，影响了全球安全局势。你开始担心家人的安全，同时也思考如何在动荡的环境中保护自己的财产。", choices: [{ text: "关注局势发展，做好风险防范", effects: { health: 10, happiness: -5 } }, { text: "相信和平，保持正常生活", effects: { happiness: 15, health: 5 } }] },
    { age: 40, title: "中年危机", description: "你进入中年，开始反思人生的意义。你回顾过去的选择，思考自己是否实现了年轻时的梦想，同时也为未来的生活感到迷茫。", choices: [{ text: "积极调整心态，重新规划人生", effects: { happiness: 20, health: 10 } }, { text: "陷入焦虑，难以自拔", effects: { happiness: -20, health: -15 } }] },

    // 41-50岁
    { age: 42, title: "健康问题", description: "你开始出现一些健康问题，需要注意保养。繁忙的工作让你忽视了自己的身体，现在是时候调整生活方式，关注自己的健康了。", choices: [{ text: "积极锻炼，注重养生", effects: { health: 20, wealth: -1000 } }, { text: "继续忙碌，忽视健康", effects: { wealth: 1000, health: -25, happiness: -10 } }] },
    { age: 45, title: "事业巅峰", description: "你在事业上达到了巅峰，面临新的挑战。你可以选择继续追求更高的目标，也可以选择功成身退，享受生活。", choices: [{ text: "继续追求更高的目标", effects: { wealth: 3000, health: -15, happiness: 10 } }, { text: "功成身退，享受生活", effects: { happiness: 25, health: 20, wealth: -1000 } }] },
    { age: 48, title: "经济繁荣", description: "全球经济进入繁荣期，投资机会增多。你需要决定是抓住机会扩大财富，还是保持谨慎，稳健理财。", choices: [{ text: "积极投资，扩大财富", effects: { wealth: 5000, happiness: 15 } }, { text: "保持谨慎，稳健理财", effects: { wealth: 1000, happiness: 10 } }] },
    { age: 50, title: "人生反思", description: "你回顾自己的人生，思考过去的选择。你为自己的成就感到骄傲，也为一些错过的机会感到遗憾，但总体来说，你对自己的人生感到满意。", choices: [{ text: "满意现状，珍惜当下", effects: { happiness: 30, health: 10 } }, { text: "后悔过去，渴望重来", effects: { happiness: -20, health: -10 } }] },

    // 51-60岁
    { age: 55, title: "退休规划", description: "你开始考虑退休后的生活，需要提前规划。你希望退休后能过上舒适的生活，同时也希望能有足够的时间和精力去做自己喜欢的事情。", choices: [{ text: "提前规划，储蓄养老金", effects: { wealth: 2000, happiness: 10 } }, { text: "享受当下，不太考虑未来", effects: { happiness: 15, wealth: -1500 } }] },
    { age: 58, title: "国际合作", description: "各国加强合作，全球局势趋于稳定。你看到了世界的希望，也为自己的未来感到乐观。", choices: [{ text: "关注国际合作，寻找投资机会", effects: { wealth: 1500, happiness: 10 } }, { text: "专注个人生活，不关心国际事务", effects: { happiness: 15, health: 5 } }] },
    { age: 60, title: "正式退休", description: "你正式退休，开始了新的生活阶段。不再有工作的压力，你可以自由支配自己的时间，做自己喜欢的事情。", choices: [{ text: "参加各种活动，丰富生活", effects: { happiness: 25, health: 15 } }, { text: "在家休息，享受宁静", effects: { health: 10, happiness: 10 } }] },

    // 61-70岁
    { age: 65, title: "夕阳红", description: "你进入了晚年，回顾自己的一生。你有了更多的时间与家人相处，也开始享受生活的乐趣。", choices: [{ text: "与家人共度时光", effects: { happiness: 30, health: 5 } }, { text: "追求年轻时的梦想", effects: { happiness: 20, health: -10 } }] },
    { age: 70, title: "人生总结", description: "你已经度过了大部分人生，开始总结自己的经历。你为自己的人生感到满足，也希望能给后人留下一些有意义的东西。", choices: [{ text: "满足于自己的人生", effects: { happiness: 40 } }, { text: "遗憾过去的选择", effects: { happiness: -20, health: -10 } }] }
];

// 成就数据
const achievements = [
    { id: "rich", name: "百万富翁", description: "财富超过10000", condition: (data) => data.wealth >= 10000 },
    { id: "healthy", name: "健康长寿", description: "健康值保持在90以上", condition: (data) => data.health >= 90 },
    { id: "happy", name: "快乐人生", description: "幸福值保持在90以上", condition: (data) => data.happiness >= 90 },
    { id: "balanced", name: "平衡人生", description: "各项属性都在60以上", condition: (data) => data.wealth >= 600 && data.health >= 60 && data.happiness >= 60 },
    { id: "lucky", name: "幸运儿", description: "抽到了幸运儿特质", condition: (data) => data.traits.some(trait => trait.name === "幸运儿") },
    { id: "social", name: "社交达人", description: "抽到了社交达人特质", condition: (data) => data.traits.some(trait => trait.name === "社交达人") },
    { id: "creative", name: "创意天才", description: "抽到了创造力强特质", condition: (data) => data.traits.some(trait => trait.name === "创造力强") },
    { id: "persistent", name: "坚韧不拔", description: "抽到了坚韧不拔特质", condition: (data) => data.traits.some(trait => trait.name === "坚韧不拔") }
];

// DOM元素
const startScreen = document.getElementById('start-screen');
const cardScreen = document.getElementById('card-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const startBtn = document.getElementById('start-btn');
const confirmCardsBtn = document.getElementById('confirm-cards-btn');
const restartBtn = document.getElementById('restart-btn');

const cardContainer = document.getElementById('card-container');
const ageElement = document.getElementById('age');
const wealthElement = document.getElementById('wealth');
const healthElement = document.getElementById('health');
const happinessElement = document.getElementById('happiness');
const eventTitleElement = document.getElementById('event-title');
const eventDescriptionElement = document.getElementById('event-description');
const choicesElement = document.getElementById('choices');
const endMessageElement = document.getElementById('end-message');
const achievementsElement = document.getElementById('achievements');

// 游戏状态
let selectedCards = [];
let currentEventIndex = 0;

// 初始化游戏
function initGame() {
    // 重置游戏数据
    gameData = {
        age: 0,
        wealth: 1000,
        health: 100,
        happiness: 80,
        traits: [],
        achievements: [],
        eventHistory: []
    };
    selectedCards = [];
    currentEventIndex = 0;

    // 显示开始界面
    startScreen.style.display = 'block';
    cardScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'none';
}

// 开始游戏
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    cardScreen.style.display = 'block';
    generateCards();
});

// 生成特质卡片
function generateCards() {
    cardContainer.innerHTML = '';
    selectedCards = [];
    confirmCardsBtn.style.display = 'none';

    // 显示所有10张卡片
    const shuffledCards = [...traitCards].sort(() => Math.random() - 0.5);

    shuffledCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;

        // 为负面特质添加特殊样式
        const isNegative = Object.values(card.buff).some(value => value < 0);
        if (isNegative) {
            cardElement.classList.add('negative');
        }

        cardElement.innerHTML = `
            <h3>${card.name}</h3>
            <p>${card.description}</p>
            <p class="buff ${isNegative ? 'negative-buff' : ''}">
                ${Object.entries(card.buff).map(([key, value]) => {
            const keyMap = {
                wealth: '财富',
                health: '健康',
                happiness: '幸福'
            };
            return `${keyMap[key]}: ${value > 0 ? '+' : ''}${value}`;
        }).join(', ')}
            </p>
        `;

        cardElement.addEventListener('click', () => toggleCardSelection(cardElement, card));
        cardContainer.appendChild(cardElement);
    });
}

// 切换卡片选择状态
function toggleCardSelection(cardElement, card) {
    const isSelected = cardElement.classList.contains('selected');

    if (isSelected) {
        // 取消选择
        cardElement.classList.remove('selected');
        selectedCards = selectedCards.filter(c => c.name !== card.name);
    } else {
        // 选择卡片，最多选择3张
        if (selectedCards.length < 3) {
            cardElement.classList.add('selected');
            selectedCards.push(card);
        }
    }

    // 显示/隐藏确认按钮
    confirmCardsBtn.style.display = selectedCards.length === 3 ? 'block' : 'none';
}

// 确认选择卡片
confirmCardsBtn.addEventListener('click', () => {
    // 应用卡片buff
    selectedCards.forEach(card => {
        gameData.traits.push(card);
        Object.entries(card.buff).forEach(([key, value]) => {
            gameData[key] += value;
        });
    });

    // 显示游戏界面
    cardScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    updateStatus();
    loadNextEvent();
});

// 更新状态显示
function updateStatus() {
    ageElement.textContent = gameData.age;
    wealthElement.textContent = gameData.wealth;
    healthElement.textContent = gameData.health;
    happinessElement.textContent = gameData.happiness;
}

// 加载下一个事件
function loadNextEvent() {
    if (currentEventIndex < lifeEvents.length) {
        const event = lifeEvents[currentEventIndex];
        gameData.age = event.age;
        eventTitleElement.textContent = event.title;
        eventDescriptionElement.textContent = event.description;

        // 生成选择按钮
        choicesElement.innerHTML = '';
        event.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.addEventListener('click', () => makeChoice(choice));
            choicesElement.appendChild(button);
        });

        updateStatus();
        currentEventIndex++;
    } else {
        // 游戏结束
        endGame();
    }
}

// 做出选择
function makeChoice(choice) {
    // 应用选择效果
    Object.entries(choice.effects).forEach(([key, value]) => {
        gameData[key] += value;
        // 确保属性值在合理范围内
        if (gameData[key] < 0) gameData[key] = 0;
        if (key !== 'wealth' && gameData[key] > 100) gameData[key] = 100;
    });

    // 记录事件
    gameData.eventHistory.push({
        age: gameData.age,
        choice: choice.text
    });

    // 检查成就
    checkAchievements();

    // 加载下一个事件
    setTimeout(loadNextEvent, 1000);
}

// 检查成就
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!gameData.achievements.includes(achievement.id) && achievement.condition(gameData)) {
            gameData.achievements.push(achievement.id);
        }
    });
}

// 游戏结束
function endGame() {
    // 显示结局界面
    gameScreen.style.display = 'none';
    endScreen.style.display = 'block';

    // 生成结局信息
    let endMessage = '';
    if (gameData.wealth >= 10000 && gameData.health >= 80 && gameData.happiness >= 80) {
        endMessage = '恭喜你！你度过了一个完美的人生，财富、健康和幸福都达到了巅峰。';
    } else if (gameData.wealth >= 5000) {
        endMessage = '你成为了一个成功的人，拥有可观的财富。';
    } else if (gameData.health >= 80) {
        endMessage = '你拥有健康的身体，这是最宝贵的财富。';
    } else if (gameData.happiness >= 80) {
        endMessage = '你度过了一个快乐的人生，充满了美好回忆。';
    } else {
        endMessage = '你的人生起起伏伏，有欢笑也有泪水。';
    }

    endMessageElement.textContent = endMessage;

    // 显示成就
    achievementsElement.innerHTML = '<h3>获得的成就</h3>';
    if (gameData.achievements.length > 0) {
        gameData.achievements.forEach(achievementId => {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
                const achievementElement = document.createElement('div');
                achievementElement.className = 'achievement-item';
                achievementElement.innerHTML = `
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                `;
                achievementsElement.appendChild(achievementElement);
            }
        });
    } else {
        achievementsElement.innerHTML += '<p>没有获得任何成就</p>';
    }
}

// 重新开始游戏
restartBtn.addEventListener('click', initGame);

// 初始化游戏
initGame();