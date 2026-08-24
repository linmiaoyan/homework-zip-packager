let player = {
    age: 0,
    intelligence: 50,
    strength: 50,
    charm: 50,
    wealth: 50,
    health: 50,
    luck: 50,
    traits: [],
    career: '无',
    careerLevel: 1,
    married: false,
    spouse: '',
    children: 0,
    achievements: [],
    eventLog: [],
    phase: '婴儿期',
    alive: true
};

let selectedTalents = [];
let selectedFlaws = [];
let currentEvent = null;
let eventQueue = [];

// 属性阶段定义
const statStages = {
    intelligence: [
        { min: 0, max: 29, name: '愚笨', icon: '😵', color: '#e74c3c', description: '反应迟钝，学习困难' },
        { min: 30, max: 49, name: '普通', icon: '😐', color: '#95a5a6', description: '智商平平，需要努力' },
        { min: 50, max: 69, name: '聪慧', icon: '🧐', color: '#3498db', description: '思维敏捷，领悟力强' },
        { min: 70, max: 89, name: '天才', icon: '🧠', color: '#9b59b6', description: '过目不忘，才华横溢' },
        { min: 90, max: 100, name: '旷世奇才', icon: '💡', color: '#f39c12', description: '百年难遇，天赋异禀' }
    ],
    strength: [
        { min: 0, max: 29, name: '体弱', icon: '🦴', color: '#e74c3c', description: '弱不禁风' },
        { min: 30, max: 49, name: '普通', icon: '💪', color: '#95a5a6', description: '身体尚可' },
        { min: 50, max: 69, name: '健壮', icon: '🏋️', color: '#3498db', description: '体格强健' },
        { min: 70, max: 89, name: '强壮', icon: '💪', color: '#9b59b6', description: '力大无穷' },
        { min: 90, max: 100, name: '绝世猛将', icon: '⚔️', color: '#f39c12', description: '万人敌' }
    ],
    charm: [
        { min: 0, max: 29, name: '丑陋', icon: '👺', color: '#e74c3c', description: '相貌平平' },
        { min: 30, max: 49, name: '普通', icon: '🙂', color: '#95a5a6', description: '相貌端正' },
        { min: 50, max: 69, name: '清秀', icon: '😊', color: '#3498db', description: '眉清目秀' },
        { min: 70, max: 89, name: '英俊/美丽', icon: '😍', color: '#9b59b6', description: '俊男美女' },
        { min: 90, max: 100, name: '倾国倾城', icon: '👑', color: '#f39c12', description: '绝世容颜' }
    ],
    wealth: [
        { min: 0, max: 29, name: '赤贫', icon: '🪹', color: '#e74c3c', description: '家徒四壁' },
        { min: 30, max: 49, name: '普通', icon: '💰', color: '#95a5a6', description: '小康之家' },
        { min: 50, max: 69, name: '富裕', icon: '💵', color: '#3498db', description: '衣食无忧' },
        { min: 70, max: 89, name: '富豪', icon: '💎', color: '#9b59b6', description: '家财万贯' },
        { min: 90, max: 100, name: '首富', icon: '👑', color: '#f39c12', description: '富可敌国' }
    ],
    health: [
        { min: 0, max: 29, name: '病危', icon: '💀', color: '#e74c3c', description: '生命垂危' },
        { min: 30, max: 49, name: '虚弱', icon: '🤒', color: '#95a5a6', description: '体弱多病' },
        { min: 50, max: 69, name: '健康', icon: '😊', color: '#3498db', description: '身体健康' },
        { min: 70, max: 89, name: '强壮', icon: '💪', color: '#9b59b6', description: '精力充沛' },
        { min: 90, max: 100, name: '金刚不坏', icon: '🦸', color: '#f39c12', description: '百毒不侵' }
    ],
    luck: [
        { min: 0, max: 29, name: '霉运', icon: '💩', color: '#e74c3c', description: '祸不单行' },
        { min: 30, max: 49, name: '普通', icon: '☘️', color: '#95a5a6', description: '平平无奇' },
        { min: 50, max: 69, name: '好运', icon: '🍀', color: '#3498db', description: '运气不错' },
        { min: 70, max: 89, name: '福运', icon: '🌈', color: '#9b59b6', description: '福星高照' },
        { min: 90, max: 100, name: '天命之子', icon: '🌟', color: '#f39c12', description: '天选之人' }
    ]
};

// 获取属性阶段
function getStatStage(statName, value) {
    const stages = statStages[statName];
    for (let stage of stages) {
        if (value >= stage.min && value <= stage.max) {
            return stage;
        }
    }
    return stages[stages.length - 1];
}

const traits = [
    { name: '天才少年', icon: '🧠', positive: '智力+20', negative: '健康-8', apply: (p) => { p.intelligence += 20; p.health -= 8; }, type: 'talent' },
    { name: '运动健将', icon: '💪', positive: '体力+20', negative: '智力-8', apply: (p) => { p.strength += 20; p.intelligence -= 8; }, type: 'talent' },
    { name: '万人迷', icon: '✨', positive: '魅力+20', negative: '体力-8', apply: (p) => { p.charm += 20; p.strength -= 8; }, type: 'talent' },
    { name: '富二代', icon: '💰', positive: '财富+25', negative: '幸运-10', apply: (p) => { p.wealth += 25; p.luck -= 10; }, type: 'talent' },
    { name: '强壮体魄', icon: '❤️', positive: '健康+20', negative: '魅力-8', apply: (p) => { p.health += 20; p.charm -= 8; }, type: 'talent' },
    { name: '好运连连', icon: '🍀', positive: '幸运+25', negative: '财富-8', apply: (p) => { p.luck += 25; p.wealth -= 8; }, type: 'talent' },
    { name: '学霸', icon: '📖', positive: '智力+15', negative: '魅力-5', apply: (p) => { p.intelligence += 15; p.charm -= 5; }, type: 'talent' },
    { name: '社交达人', icon: '🤝', positive: '魅力+15', negative: '智力-5', apply: (p) => { p.charm += 15; p.intelligence -= 5; }, type: 'talent' },
    { name: '吃苦耐劳', icon: '🛡️', positive: '体力+15', negative: '健康-5', apply: (p) => { p.strength += 15; p.health -= 5; }, type: 'talent' },
    { name: '艺术家', icon: '🎨', positive: '魅力+15', negative: '财富-5', apply: (p) => { p.charm += 15; p.wealth -= 5; }, type: 'talent' },
    { name: '早慧', icon: '👶', positive: '智力+10, 魅力+5', negative: '健康-5', apply: (p) => { p.intelligence += 10; p.charm += 5; p.health -= 5; }, type: 'talent' },
    { name: '乐天派', icon: '😄', positive: '幸运+10, 健康+5', negative: '智力-5', apply: (p) => { p.luck += 10; p.health += 5; p.intelligence -= 5; }, type: 'talent' },
    { name: '体弱多病', icon: '🤒', positive: '智力+5', negative: '健康-18', apply: (p) => { p.intelligence += 5; p.health -= 18; }, type: 'flaw' },
    { name: '家境贫寒', icon: '🏚️', positive: '体力+10', negative: '财富-22', apply: (p) => { p.strength += 10; p.wealth -= 22; }, type: 'flaw' },
    { name: '急躁易怒', icon: '😤', positive: '体力+5', negative: '魅力-12, 幸运-6', apply: (p) => { p.strength += 5; p.charm -= 12; p.luck -= 6; }, type: 'flaw' },
    { name: '优柔寡断', icon: '😰', positive: '魅力+5', negative: '智力-8, 幸运-10', apply: (p) => { p.charm += 5; p.intelligence -= 8; p.luck -= 10; }, type: 'flaw' },
    { name: '消极悲观', icon: '😞', positive: '智力+5', negative: '魅力-12, 健康-8', apply: (p) => { p.intelligence += 5; p.charm -= 12; p.health -= 8; }, type: 'flaw' },
    { name: '笨手笨脚', icon: '🤕', positive: '幸运+5', negative: '体力-18', apply: (p) => { p.luck += 5; p.strength -= 18; }, type: 'flaw' },
    { name: '不善言辞', icon: '🤐', positive: '智力+8', negative: '魅力-10', apply: (p) => { p.intelligence += 8; p.charm -= 10; }, type: 'flaw' },
    { name: '花钱大手', icon: '💸', positive: '魅力+8', negative: '财富-15', apply: (p) => { p.charm += 8; p.wealth -= 15; }, type: 'flaw' }
];

const birthFamilies = [
    { text: '你出生在一个普通的工薪家庭，父母勤劳朴实。', wealthMod: 0 },
    { text: '你出生在一个富裕的商人家庭，从小衣食无忧。', wealthMod: 15 },
    { text: '你出生在一个书香门第，父母都是知识分子。', wealthMod: 5, intMod: 5 },
    { text: '你出生在一个农村家庭，虽然不富裕但充满温暖。', wealthMod: -10, healthMod: 5 },
    { text: '你出生在一个单亲家庭，母亲独自抚养你长大。', wealthMod: -5 },
    { text: '你出生在一个医生家庭，从小耳濡目染医学知识。', wealthMod: 5, healthMod: 5 },
    { text: '你出生在一个艺术世家，家里充满了音乐和绘画。', wealthMod: 0, charmMod: 5 },
    { text: '你出生在一个体育世家，父母都是运动员。', wealthMod: 0, strengthMod: 5 }
];

const lifeEvents = {
    baby: [
        {
            age: 0, title: '呱呱坠地',
            text: '你来到了这个世界，发出了第一声响亮的啼哭。父母满怀期待地看着你，你的人生故事从此开始。',
            choices: [
                { text: '大声啼哭，中气十足', effects: { health: 3, strength: 2 } },
                { text: '安静地观察这个世界', effects: { intelligence: 2, charm: 2 } }
            ]
        },
        {
            age: 1, title: '蹒跚学步',
            text: '你开始学习走路，摇摇晃晃地迈出了人生的第一步。虽然摔了好几次，但你总是爬起来继续尝试。',
            choices: [
                { text: '勇敢地迈出每一步', effects: { strength: 3, health: 2 } },
                { text: '小心翼翼地慢慢走', effects: { intelligence: 2, luck: 2 } }
            ]
        },
        {
            age: 2, title: '牙牙学语',
            text: '你开始学习说话，从简单的"妈妈""爸爸"开始，每天都能学会新的词语，小嘴巴不停念叨着。',
            choices: [
                { text: '不停地模仿大人说话', effects: { intelligence: 3, charm: 2 } },
                { text: '更喜欢用手指东西表达', effects: { strength: 2, intelligence: 2 } }
            ]
        }
    ],
    childhood: [
        {
            age: 3, title: '幼儿园初体验',
            text: '你第一次离开家，来到幼儿园。面对陌生的环境和小朋友，你既紧张又有些期待。',
            choices: [
                { text: '主动和小朋友们一起玩', effects: { charm: 3, health: 1 } },
                { text: '安静地在角落看绘本', effects: { intelligence: 3, charm: -1 } },
                { text: '找老师寻求安慰', effects: { luck: 2, charm: 1 } }
            ]
        },
        {
            age: 4, title: '第一次画画',
            text: '幼儿园老师教你们画画，你用蜡笔在纸上涂鸦，画出了一个五颜六色的太阳。',
            choices: [
                { text: '认真跟着老师学', effects: { intelligence: 2, charm: 2 } },
                { text: '自由发挥画自己的', effects: { charm: 3, luck: 1 } }
            ]
        },
        {
            age: 5, title: '兴趣启蒙',
            text: '你对很多事物都产生了浓厚的兴趣，画画、唱歌、搭积木……你都想尝试。',
            choices: [
                { text: '学习画画和手工', effects: { intelligence: 2, charm: 2 } },
                { text: '参加体育活动', effects: { strength: 3, health: 2 } },
                { text: '听故事学儿歌', effects: { charm: 3, intelligence: 1 } }
            ]
        },
        {
            age: 6, title: '小学入学',
            text: '你背上崭新的书包走进了小学的大门，开始了正式的学习生涯。新的同学、新的老师，一切都让你感到新鲜。',
            choices: [
                { text: '认真听课，积极举手回答问题', effects: { intelligence: 4, charm: 1 } },
                { text: '课间和同学们打成一片', effects: { charm: 3, strength: 2 } },
                { text: '主动帮老师做事', effects: { luck: 2, charm: 2 } }
            ]
        },
        {
            age: 7, title: '第一次考试',
            text: '你迎来了人生中的第一次正式考试。看着试卷上的题目，你有些紧张但还是认真地作答。',
            choices: [
                { text: '仔细检查，确保正确', effects: { intelligence: 2, luck: 2 } },
                { text: '快速做完，出去玩', effects: { strength: 2, intelligence: -1 } }
            ]
        },
        {
            age: 8, title: '课余爱好',
            text: '学习之余，你有了更多自己的时间。你开始发展自己的课余爱好。',
            choices: [
                { text: '报名参加奥数班', effects: { intelligence: 5, charm: -1 } },
                { text: '加入学校运动队', effects: { strength: 4, health: 2 } },
                { text: '学习一门乐器', effects: { charm: 4, intelligence: 2 } }
            ]
        },
        {
            age: 9, title: '交到好朋友',
            text: '你在班上交到了一个志同道合的好朋友，你们一起上学、一起玩耍、一起分享小秘密。',
            choices: [
                { text: '和好朋友一起学习', effects: { intelligence: 2, charm: 2 } },
                { text: '和好朋友一起玩耍', effects: { health: 2, strength: 1 } }
            ]
        },
        {
            age: 10, title: '童年趣事',
            text: '你和几个好朋友在放学后偷偷去小溪边捉蝌蚪，结果弄得满身是泥回家。妈妈又好气又好笑。',
            choices: [
                { text: '向妈妈保证下次不会再弄脏衣服', effects: { charm: 2, intelligence: 1 } },
                { text: '拉着妈妈一起去看小蝌蚪', effects: { charm: 3, luck: 2 } }
            ]
        },
        {
            age: 11, title: '竞选班干部',
            text: '班里开始竞选班干部，你有些犹豫要不要参加。这是一个锻炼自己的好机会。',
            choices: [
                { text: '勇敢参加竞选', effects: { charm: 3, intelligence: 1 } },
                { text: '支持好朋友竞选', effects: { luck: 2, charm: 1 } },
                { text: '不想参与，专心学习', effects: { intelligence: 2, health: 1 } }
            ]
        }
    ],
    adolescence: [
        {
            age: 12, title: '小升初',
            text: '你小学毕业了，即将升入初中。告别了熟悉的同学和老师，对未来既期待又有些不安。',
            choices: [
                { text: '提前预习初中课程', effects: { intelligence: 3, health: -1 } },
                { text: '暑假尽情玩耍', effects: { health: 3, strength: 2 } },
                { text: '参加兴趣班', effects: { charm: 2, intelligence: 2 } }
            ]
        },
        {
            age: 13, title: '青春期变化',
            text: '你的身体开始发生变化，个子长高了，声音也变了。情绪也变得不太稳定，有时候会莫名地感到烦躁。',
            choices: [
                { text: '和父母沟通交流', effects: { charm: 2, health: 2 } },
                { text: '通过运动释放压力', effects: { strength: 3, health: 2 } },
                { text: '把心事写在日记里', effects: { intelligence: 2, charm: 1 } }
            ]
        },
        {
            age: 14, title: '懵懂心动',
            text: '你发现自己总是不自觉地看向班上那个特别的人，心跳加速，面红耳赤。这是你第一次体会到心动的感觉。',
            choices: [
                { text: '把这份心意默默藏在心底', effects: { intelligence: 2, charm: 1 } },
                { text: '鼓起勇气递一张小纸条', effects: { charm: 3, luck: 2 } },
                { text: '专心学习，不想这些', effects: { intelligence: 3, health: 1 } }
            ]
        },
        {
            age: 15, title: '中考冲刺',
            text: '中考临近了，每天都是做不完的试卷和背不完的知识点。你感到压力山大，但也在努力坚持。',
            choices: [
                { text: '拼命刷题，冲刺高分', effects: { intelligence: 5, health: -3 } },
                { text: '合理安排时间，稳步复习', effects: { intelligence: 3, health: 1 } },
                { text: '适当放松，保持状态', effects: { health: 2, luck: 2 } }
            ]
        },
        {
            age: 16, title: '高中新生活',
            text: '你进入了高中，课程难度大幅提升。你开始思考自己未来的方向，是文科还是理科？',
            choices: [
                { text: '选择理科，探索科学奥秘', effects: { intelligence: 4, wealth: 2 } },
                { text: '选择文科，感受人文之美', effects: { charm: 3, intelligence: 2 } },
                { text: '先观察一段时间再决定', effects: { luck: 3, intelligence: 1 } }
            ]
        },
        {
            age: 17, title: '社团活动',
            text: '学校社团招新了，各种有趣的社团让你眼花缭乱。你决定加入一个自己感兴趣的社团。',
            choices: [
                { text: '加入学生会，锻炼领导力', effects: { charm: 4, intelligence: 1 } },
                { text: '加入文学社，提升写作能力', effects: { intelligence: 3, charm: 2 } },
                { text: '加入体育社团，强健体魄', effects: { strength: 4, health: 2 } }
            ]
        },
        {
            age: 18, title: '成人礼',
            text: '你年满18岁了，学校为你们举办了成人礼。站在台上，你意识到自己已经是一个成年人了。',
            choices: [
                { text: '认真思考未来方向', effects: { intelligence: 3, luck: 2 } },
                { text: '和朋友们庆祝', effects: { charm: 3, health: 1 } },
                { text: '给父母写一封信', effects: { charm: 4, health: 1 } }
            ]
        },
        {
            age: 18, title: '高考',
            text: '高考来了！这是你人生中第一次重大考验。三天的考试决定了你未来四年的去向。',
            choices: [
                { text: '全力以赴，背水一战', effects: { intelligence: 5, health: -3, luck: 2 } },
                { text: '保持平常心，正常发挥', effects: { intelligence: 3, health: 1 } }
            ]
        }
    ],
    youth: [
        {
            age: 19, title: '大学生活',
            text: '你进入了大学，全新的环境让你既兴奋又迷茫。自由的课程安排、丰富的社团活动，你的人生翻开了新的一页。',
            choices: [
                { text: '积极参加社团，拓展人脉', effects: { charm: 4, luck: 2 } },
                { text: '泡在图书馆，钻研学术', effects: { intelligence: 5, charm: -1 } },
                { text: '开始尝试兼职，积累社会经验', effects: { wealth: 3, strength: 2 } }
            ]
        },
        {
            age: 20, title: '恋爱季节',
            text: '在大学里，你遇到了一个让你心动的人。你们一起上课、一起吃饭、一起在校园散步，甜蜜的感觉让你觉得整个世界都变得美好。',
            choices: [
                { text: '勇敢表白，追求幸福', effects: { charm: 4, luck: 3 } },
                { text: '享受暧昧，顺其自然', effects: { charm: 2, intelligence: 1 } },
                { text: '专注学业，暂时不考虑恋爱', effects: { intelligence: 3, wealth: 2 } }
            ]
        },
        {
            age: 21, title: '社会实践',
            text: '大学期间，学校组织了社会实践活动。你可以选择去偏远山区支教，或者去企业实习。',
            choices: [
                { text: '去山区支教', effects: { charm: 4, health: -1, intelligence: 1 } },
                { text: '去企业实习', effects: { wealth: 2, intelligence: 3, charm: 1 } },
                { text: '留在学校做研究', effects: { intelligence: 4, health: 1 } }
            ]
        },
        {
            age: 22, title: '毕业抉择',
            text: '大学毕业了，你站在人生的十字路口。是继续深造还是步入社会？每条路都有不同的风景。',
            choices: [
                { text: '考研深造，提升学历', effects: { intelligence: 5, wealth: -2 } },
                { text: '直接就业，开始赚钱', effects: { wealth: 5, strength: 1 } },
                { text: '自主创业，闯出一片天', effects: { luck: 3, wealth: -2, charm: 2 } },
                { text: 'gap year，环游世界', effects: { luck: 3, health: 2, wealth: -3 } }
            ]
        },
        {
            age: 23, title: '租房生活',
            text: '你开始独自生活，租了一间小公寓。这是你第一次真正独立，需要学会打理自己的生活。',
            choices: [
                { text: '精心布置房间', effects: { charm: 2, health: 2 } },
                { text: '努力工作，攒钱买房', effects: { wealth: 3, intelligence: 1 } },
                { text: '和朋友合租', effects: { charm: 3, wealth: -1 } }
            ]
        },
        {
            age: 24, title: '职场新人',
            text: '你进入职场已经一段时间了，从最初的懵懂到逐渐上手，你开始适应社会的节奏。',
            choices: [
                { text: '加班加点，争取表现', effects: { wealth: 4, health: -3 } },
                { text: '稳扎稳打，注重积累', effects: { wealth: 2, intelligence: 2 } },
                { text: '主动向同事学习', effects: { charm: 2, intelligence: 3 } }
            ]
        },
        {
            age: 25, title: '朋友聚会',
            text: '大学同学组织了一次聚会，大家好久没见了。你有些犹豫要不要参加。',
            choices: [
                { text: '积极参加，叙旧聊天', effects: { charm: 3, health: 1 } },
                { text: '有事不去，下次再聚', effects: { intelligence: 2, wealth: 1 } }
            ]
        },
        {
            age: 26, title: '职场进阶',
            text: '你在工作中崭露头角，得到了上司的赏识。一个晋升的机会摆在你面前，但竞争也很激烈。',
            choices: [
                { text: '全力争取晋升', effects: { wealth: 5, health: -2, charm: 2 } },
                { text: '保持现状，享受生活', effects: { health: 3, charm: 2 } },
                { text: '跳槽去更好的公司', effects: { luck: 3, wealth: 3 } }
            ]
        },
        {
            age: 27, title: '买房压力',
            text: '看着不断上涨的房价，你开始考虑要不要买房。这是一笔巨大的开销，但也是一个重要的投资。',
            choices: [
                { text: '贷款买房，成为房奴', effects: { wealth: -5, luck: 2 } },
                { text: '继续租房，灵活生活', effects: { health: 2, charm: 1, wealth: 2 } },
                { text: '努力攒钱，全款买房', effects: { wealth: 3, intelligence: 2 } }
            ]
        },
        {
            age: 28, title: '婚姻抉择',
            text: '你遇到了一个想要共度一生的人，是时候考虑是否步入婚姻的殿堂了。',
            choices: [
                { text: '步入婚姻，组建家庭', effects: { charm: 3, health: 2, wealth: -3 }, setMarried: true },
                { text: '保持单身，专注事业', effects: { wealth: 4, intelligence: 2 } },
                { text: '先订婚，观察一段时间', effects: { charm: 2, luck: 3 } }
            ]
        },
        {
            age: 29, title: '而立前夕',
            text: '即将步入三十岁，你开始思考自己的人生目标。事业、家庭、梦想，什么才是最重要的？',
            choices: [
                { text: '设定五年计划', effects: { intelligence: 3, luck: 2 } },
                { text: '享受当下，顺其自然', effects: { health: 3, charm: 2 } }
            ]
        }
    ],
    middleAge: [
        {
            age: 30, title: '而立之年',
            text: '三十而立，你开始更加深刻地思考人生的意义。回顾过去，展望未来，你有了更多的感悟。',
            choices: [
                { text: '制定新的人生目标', effects: { intelligence: 3, luck: 2 } },
                { text: '珍惜当下，享受生活', effects: { health: 3, charm: 2 } }
            ]
        },
        {
            age: 32, title: '职业转型',
            text: '你在当前领域已经积累了丰富的经验，但一个全新的行业机会出现了。转型意味着风险，也意味着可能的新高度。',
            choices: [
                { text: '勇敢转型，迎接新挑战', effects: { luck: 3, wealth: -2, intelligence: 3 } },
                { text: '深耕现有领域，稳步发展', effects: { wealth: 4, health: 1 } }
            ]
        },
        {
            age: 35, title: '家庭与事业',
            text: '家庭和事业的天平需要你来平衡。孩子的教育、父母的养老、工作的压力，每一项都需要你的关注。',
            choices: [
                { text: '以家庭为重，多陪伴家人', effects: { health: 3, charm: 2, wealth: -2 } },
                { text: '以事业为重，努力拼搏', effects: { wealth: 5, health: -2, charm: -1 } }
            ]
        },
        {
            age: 38, title: '投资机遇',
            text: '一个朋友向你推荐了一个投资机会，回报看起来很诱人，但风险也不小。',
            choices: [
                { text: '大胆投资，搏一把', effects: { luck: 3, wealth: -3 }, riskInvest: true },
                { text: '谨慎观望，不冒险', effects: { wealth: 1, intelligence: 2 } }
            ]
        },
        {
            age: 40, title: '不惑之年',
            text: '四十不惑，你开始对人生有了更深的理解。曾经困扰你的问题，现在似乎都有了答案。',
            choices: [
                { text: '豁达面对，坦然接受', effects: { health: 3, charm: 3 } },
                { text: '仍有不甘，继续奋斗', effects: { wealth: 3, strength: 2, health: -2 } }
            ]
        }
    ],
    middleLate: [
        {
            age: 42, title: '健康警钟',
            text: '体检报告上出现了一些异常指标，医生建议你注意生活方式。健康不再是理所当然的事了。',
            choices: [
                { text: '开始规律运动和健康饮食', effects: { health: 5, wealth: -1 } },
                { text: '太忙了，以后再说', effects: { wealth: 3, health: -4 } }
            ]
        },
        {
            age: 45, title: '事业巅峰',
            text: '你在事业上达到了一个高峰，多年的努力终于有了回报。但高处不胜寒，新的挑战也随之而来。',
            choices: [
                { text: '乘胜追击，更上一层', effects: { wealth: 5, health: -3 } },
                { text: '适当放慢脚步，享受成果', effects: { health: 3, charm: 2 } }
            ]
        },
        {
            age: 48, title: '子女成长',
            text: '你的孩子渐渐长大了，开始有了自己的想法和追求。看着他们，你想起了自己年轻时的模样。',
            choices: [
                { text: '尊重孩子的选择，给予支持', effects: { charm: 3, health: 2 } },
                { text: '严格管教，为孩子规划未来', effects: { intelligence: 2, charm: -2, wealth: 2 } }
            ]
        },
        {
            age: 50, title: '知天命',
            text: '五十知天命，你开始接受自己无法改变的事情，也更加珍惜能够把握的一切。',
            choices: [
                { text: '学会放下，心态平和', effects: { health: 3, luck: 3 } },
                { text: '发挥余热，继续贡献', effects: { wealth: 3, intelligence: 2 } }
            ]
        }
    ],
    senior: [
        {
            age: 55, title: '退休规划',
            text: '退休的日子越来越近了，你开始认真规划退休后的生活。是继续工作还是享受天伦之乐？',
            choices: [
                { text: '提前规划，储备养老金', effects: { wealth: 4, intelligence: 1 } },
                { text: '顺其自然，活在当下', effects: { charm: 2, health: 2 } }
            ]
        },
        {
            age: 58, title: '含饴弄孙',
            text: '孙辈们的到来给家庭带来了新的欢乐。看着他们天真无邪的笑脸，你感到无比幸福。',
            choices: [
                { text: '享受天伦之乐', effects: { health: 3, charm: 2 } },
                { text: '发挥余热，做些力所能及的事', effects: { wealth: 2, intelligence: 1 } }
            ]
        },
        {
            age: 60, title: '花甲之年',
            text: '六十花甲，你正式退休了。回首往事，你的人生经历了无数风雨，也收获了无数彩虹。',
            choices: [
                { text: '培养新的兴趣爱好', effects: { charm: 3, health: 2 } },
                { text: '周游世界，看看外面的风景', effects: { luck: 3, wealth: -2 } }
            ]
        },
        {
            age: 65, title: '夕阳无限好',
            text: '你进入了晚年生活，每天的日子平静而充实。和老伴一起散步、和老友下棋聊天，生活简单而幸福。',
            choices: [
                { text: '享受宁静的晚年生活', effects: { health: 3, charm: 2 } },
                { text: '写回忆录，记录人生故事', effects: { intelligence: 3, charm: 2 } }
            ]
        },
        {
            age: 70, title: '古稀之年',
            text: '七十古稀，你已经走过了漫长的人生路。回望来时路，有欢笑也有泪水，但每一步都值得。',
            choices: [
                { text: '心怀感恩，知足常乐', effects: { health: 3, luck: 3 } },
                { text: '还有些心愿未了，继续努力', effects: { strength: 2, health: -2 } }
            ]
        }
    ]
};

const randomEvents = [
    {
        minAge: 5, maxAge: 12, title: '校园霸凌',
        text: '你在学校被几个高年级的同学欺负了，他们抢走了你的零食还推了你一把。',
        choices: [
            { text: '告诉老师和家长', effects: { intelligence: 2, charm: 1 } },
            { text: '自己勇敢面对', effects: { strength: 3, health: -2 } }
        ]
    },
    {
        minAge: 6, maxAge: 14, title: '宠物情缘',
        text: '你在路边发现了一只受伤的小猫/小狗，它可怜巴巴地看着你。',
        choices: [
            { text: '带它回家照顾', effects: { charm: 3, health: 1 } },
            { text: '帮它找到主人', effects: { intelligence: 2, luck: 2 } }
        ]
    },
    {
        minAge: 8, maxAge: 15, title: '竞赛机会',
        text: '学校选拔学生参加市级竞赛，老师推荐了你。这是一个展示自己能力的好机会。',
        choices: [
            { text: '认真准备，全力参赛', effects: { intelligence: 4, health: -1 } },
            { text: '不想太累，放弃参赛', effects: { health: 2, charm: 1 } }
        ]
    },
    {
        minAge: 13, maxAge: 18, title: '网络世界',
        text: '你开始接触网络世界，各种信息和娱乐让你目不暇接。你需要学会合理安排时间。',
        choices: [
            { text: '利用网络学习新知识', effects: { intelligence: 3, wealth: 1 } },
            { text: '沉迷网络游戏', effects: { intelligence: -2, health: -2, charm: -1 } },
            { text: '适度娱乐，不影响学习', effects: { charm: 2, intelligence: 1 } }
        ]
    },
    {
        minAge: 16, maxAge: 22, title: '友情考验',
        text: '你最好的朋友因为误会和你闹翻了，你们已经好几天没说话了。',
        choices: [
            { text: '主动找朋友和解', effects: { charm: 3, luck: 2 } },
            { text: '等对方先来道歉', effects: { intelligence: 1, charm: -1 } }
        ]
    },
    {
        minAge: 20, maxAge: 35, title: '意外之财',
        text: '你意外获得了一笔小钱，虽然不多，但也让你开心了好一阵子。',
        choices: [
            { text: '存起来以备不时之需', effects: { wealth: 3, intelligence: 1 } },
            { text: '犒劳自己，好好消费', effects: { charm: 2, health: 1 } }
        ]
    },
    {
        minAge: 25, maxAge: 45, title: '职场危机',
        text: '公司经营不善，开始裁员。你感到前所未有的职业危机。',
        choices: [
            { text: '提升技能，增加竞争力', effects: { intelligence: 3, wealth: 1 } },
            { text: '寻找新的工作机会', effects: { luck: 3, charm: 2 } }
        ]
    },
    {
        minAge: 30, maxAge: 50, title: '健康体检',
        text: '你去做了一次全面体检，结果让你有些担忧。医生建议你改变一些不良习惯。',
        choices: [
            { text: '严格遵医嘱，改善生活习惯', effects: { health: 5, wealth: -1 } },
            { text: '觉得没什么大问题，照旧生活', effects: { wealth: 2, health: -3 } }
        ]
    },
    {
        minAge: 35, maxAge: 55, title: '家庭矛盾',
        text: '你和家人因为一些琐事产生了矛盾，气氛变得有些紧张。',
        choices: [
            { text: '主动沟通，化解矛盾', effects: { charm: 3, health: 2 } },
            { text: '各自冷静，等时间冲淡一切', effects: { intelligence: 1, health: -1 } }
        ]
    },
    {
        minAge: 40, maxAge: 60, title: '老友重逢',
        text: '你在街上偶遇了多年未见的老朋友，两人相见甚欢，聊起了过去的美好时光。',
        choices: [
            { text: '约好以后常联系', effects: { charm: 3, luck: 2 } },
            { text: '感慨时光飞逝，珍惜眼前人', effects: { health: 2, intelligence: 1 } }
        ]
    },
    // 新增事件类型
    // 突发意外事件
    {
        minAge: 8, maxAge: 65, title: '突发暴雨',
        text: '你在户外突然遇到了一场暴雨，全身都被淋湿了。',
        choices: [
            { text: '找地方躲雨，等待雨停', effects: { intelligence: 1, luck: 1 } },
            { text: '冒雨跑回家', effects: { strength: 1, health: -2 } }
        ]
    },
    {
        minAge: 18, maxAge: 50, title: '钱包丢失',
        text: '你发现钱包不见了，里面有不少现金和证件。',
        choices: [
            { text: '立即报警并挂失', effects: { intelligence: 2, wealth: -2 } },
            { text: '自认倒霉，重新补办', effects: { luck: -2, wealth: -3 } }
        ]
    },
    // 机遇事件
    {
        minAge: 18, maxAge: 60, title: '投资机会',
        text: '一位朋友向你推荐了一个看起来很有前景的投资项目。',
        choices: [
            { text: '谨慎投资一小部分', effects: { luck: 2, wealth: 1 } },
            { text: '全力投入，追求高回报', effects: { luck: -1, riskInvest: true } },
            { text: '不感兴趣，专注本职', effects: { intelligence: 1, wealth: 1 } }
        ]
    },
    {
        minAge: 16, maxAge: 40, title: '意外中奖',
        text: '你买的彩票中了一个小奖！虽然不是大奖，但也让你开心了一整天。',
        choices: [
            { text: '继续买，争取中大奖', effects: { luck: 1, wealth: -1 } },
            { text: '见好就收，把奖金存起来', effects: { wealth: 4, intelligence: 1 } }
        ]
    },
    // 人际关系事件
    {
        minAge: 12, maxAge: 35, title: '生日派对',
        text: '你的生日快到了，朋友们提议办一个派对。',
        choices: [
            { text: '举办盛大派对，邀请所有朋友', effects: { charm: 4, wealth: -2 } },
            { text: '只和最亲密的朋友一起庆祝', effects: { charm: 2, wealth: -1 } },
            { text: '低调度过，不办派对', effects: { intelligence: 1, health: 1 } }
        ]
    },
    {
        minAge: 25, maxAge: 60, title: '家庭聚会',
        text: '周末家人提议一起聚餐，增进感情。',
        choices: [
            { text: '积极参与，准备拿手好菜', effects: { charm: 3, health: 2 } },
            { text: '参加但不太投入', effects: { charm: 1, wealth: 1 } }
        ]
    },
    // 健康事件
    {
        minAge: 5, maxAge: 70, title: '感冒发烧',
        text: '你不小心感冒了，身体感到不舒服。',
        choices: [
            { text: '好好休息，按时吃药', effects: { health: 2, intelligence: -1 } },
            { text: '坚持工作/学习', effects: { health: -3, wealth: 1 } }
        ]
    },
    {
        minAge: 30, maxAge: 65, title: '健身热潮',
        text: '身边的朋友都开始健身，你也想尝试一下。',
        choices: [
            { text: '办健身卡，规律锻炼', effects: { health: 4, wealth: -2 } },
            { text: '在家做简单运动', effects: { health: 2, strength: 1 } },
            { text: '觉得麻烦，不想动', effects: { strength: -1, health: -1 } }
        ]
    },
    // 学习/成长事件
    {
        minAge: 10, maxAge: 50, title: '学习新技能',
        text: '你想学习一项新技能，提升自己。',
        choices: [
            { text: '学习一门外语', effects: { intelligence: 4, charm: 1 } },
            { text: '学习编程', effects: { intelligence: 3, wealth: 1 } },
            { text: '学习乐器', effects: { charm: 3, intelligence: 1 } }
        ]
    },
    {
        minAge: 18, maxAge: 60, title: '阅读书籍',
        text: '你在书店看到一本很有意思的书，决定买下来阅读。',
        choices: [
            { text: '读一本经典文学', effects: { intelligence: 3, charm: 1 } },
            { text: '读一本专业书籍', effects: { intelligence: 2, wealth: 1 } },
            { text: '读一本励志书', effects: { luck: 2, charm: 1 } }
        ]
    },
    // 旅行/冒险事件
    {
        minAge: 18, maxAge: 60, title: '说走就走的旅行',
        text: '你突然想出去走走，放松一下心情。',
        choices: [
            { text: '去海边度假', effects: { health: 3, charm: 2, wealth: -3 } },
            { text: '去山区徒步', effects: { strength: 3, health: 2, wealth: -2 } },
            { text: '去城市观光', effects: { charm: 3, intelligence: 1, wealth: -3 } }
        ]
    },
    // 文化娱乐事件
    {
        minAge: 10, maxAge: 70, title: '看电影',
        text: '新上映了一部口碑很好的电影，你想去看看。',
        choices: [
            { text: '一个人去看', effects: { intelligence: 2, charm: 1 } },
            { text: '约朋友一起看', effects: { charm: 3, health: 1 } }
        ]
    },
    {
        minAge: 16, maxAge: 65, title: '音乐会',
        text: '你喜欢的歌手要来开演唱会了。',
        choices: [
            { text: '买最贵的票，近距离感受', effects: { charm: 4, wealth: -4 } },
            { text: '买普通票，感受现场氛围', effects: { charm: 2, wealth: -2 } },
            { text: '不去，太贵了', effects: { wealth: 1, charm: -1 } }
        ]
    },
    // 社区/公益事件
    {
        minAge: 16, maxAge: 65, title: '志愿者活动',
        text: '社区组织了一次志愿者活动，帮助需要帮助的人。',
        choices: [
            { text: '积极参与', effects: { charm: 3, luck: 2 } },
            { text: '没时间，不去了', effects: { wealth: 1, charm: -1 } }
        ]
    },
    // 科技相关事件
    {
        minAge: 10, maxAge: 60, title: '数码产品更新',
        text: '新款手机/电脑发布了，你很想换一个。',
        choices: [
            { text: '立即购买最新款', effects: { intelligence: 2, wealth: -4 } },
            { text: '等降价再买', effects: { intelligence: 1, wealth: 1 } },
            { text: '继续用旧的，还能用', effects: { wealth: 2, intelligence: -1 } }
        ]
    },
    // 天气相关事件
    {
        minAge: 5, maxAge: 70, title: '下雪天',
        text: '今天下起了大雪，整个世界都银装素裹。',
        choices: [
            { text: '出去堆雪人、打雪仗', effects: { strength: 2, health: -1, charm: 2 } },
            { text: '在家烤火，喝热饮', effects: { health: 2, intelligence: 1 } }
        ]
    },
    // 宠物事件
    {
        minAge: 8, maxAge: 60, title: '宠物生病',
        text: '你养的宠物生病了，需要带去看兽医。',
        choices: [
            { text: '立即带去最好的宠物医院', effects: { charm: 3, wealth: -3 } },
            { text: '带去普通宠物诊所', effects: { charm: 1, wealth: -1, luck: 1 } }
        ]
    },
    // 节日事件
    {
        minAge: 5, maxAge: 70, title: '春节来临',
        text: '春节快到了，家里要准备年货和大扫除。',
        choices: [
            { text: '积极参与准备工作', effects: { charm: 3, strength: 2 } },
            { text: '帮忙但不主动', effects: { charm: 1, health: 1 } }
        ]
    },
    // 职场相关事件
    {
        minAge: 22, maxAge: 55, title: '同事聚餐',
        text: '同事们提议下班后一起聚餐，增进感情。',
        choices: [
            { text: '积极参加，融入集体', effects: { charm: 3, wealth: -1 } },
            { text: '找借口不去', effects: { intelligence: 1, charm: -2 } }
        ]
    },
    // 家庭责任事件
    {
        minAge: 25, maxAge: 60, title: '照顾父母',
        text: '父母年纪大了，需要更多的照顾和关心。',
        choices: [
            { text: '搬去和父母一起住', effects: { charm: 4, wealth: -2 } },
            { text: '经常回家看望', effects: { charm: 2, wealth: -1 } },
            { text: '太忙了，只能偶尔打电话', effects: { wealth: 1, charm: -2 } }
        ]
    },
    // 自我提升事件
    {
        minAge: 18, maxAge: 50, title: '考证热潮',
        text: '身边很多人都在考各种证书，你也想考一个。',
        choices: [
            { text: '选择一个有用的证书，认真备考', effects: { intelligence: 4, wealth: -1 } },
            { text: '随大流，考一个热门证书', effects: { intelligence: 2, wealth: -2 } },
            { text: '觉得没必要，不考', effects: { wealth: 1, luck: 1 } }
        ]
    },
    // 幸运事件 - 拾金不昧
    {
        minAge: 8, maxAge: 70, title: '拾金不昧',
        text: '你在路上捡到一个钱包，里面有不少现金和证件。',
        choices: [
            { text: '原地等待失主', effects: { charm: 5, luck: 3 } },
            { text: '交给警察', effects: { charm: 4, intelligence: 1 } },
            { text: '据为己有', effects: { wealth: 5, charm: -3, luck: -2 } }
        ]
    },
    // 幸运事件 - 获得灵感
    {
        minAge: 10, maxAge: 60, title: '灵光一闪',
        text: '你突然想到一个绝妙的创意/解决方案！',
        choices: [
            { text: '立刻记录下来并实施', effects: { intelligence: 4, luck: 2 } },
            { text: '觉得只是空想，算了', effects: { intelligence: 1, luck: -1 } }
        ]
    },
    // 幸运事件 - 贵人相助
    {
        minAge: 18, maxAge: 60, title: '贵人相助',
        text: '一位前辈/贵人主动向你伸出援手，给你提供了宝贵的机会。',
        choices: [
            { text: '抓住机会，努力表现', effects: { luck: 5, charm: 3 } },
            { text: '谦虚推辞', effects: { charm: 2, intelligence: 1 } }
        ]
    },
    // 幸运事件 - 健康改善
    {
        minAge: 15, maxAge: 70, title: '身体变好',
        text: '最近你感觉精力充沛，身体状态特别好！',
        choices: [
            { text: '坚持锻炼，保持状态', effects: { health: 5, strength: 2 } },
            { text: '趁机多做些事情', effects: { wealth: 3, health: 2 } }
        ]
    },
    // 幸运事件 - 意外收获
    {
        minAge: 18, maxAge: 65, title: '意外收获',
        text: '你之前帮助过的人突然给你送来了一份厚礼表示感谢！',
        choices: [
            { text: '欣然接受', effects: { wealth: 6, charm: 2 } },
            { text: '婉言谢绝', effects: { charm: 4, luck: 2 } }
        ]
    },
    // 幸运事件 - 学习机会
    {
        minAge: 10, maxAge: 50, title: '学习良机',
        text: '一个免费参加高端培训/讲座的机会摆在你面前！',
        choices: [
            { text: '积极参加', effects: { intelligence: 5, charm: 2 } },
            { text: '没时间，放弃', effects: { wealth: 1, intelligence: -1 } }
        ]
    },
    // 幸运事件 - 人际关系提升
    {
        minAge: 12, maxAge: 60, title: '友谊升温',
        text: '你和朋友的关系变得更加亲密了！',
        choices: [
            { text: '经常联系，加深友谊', effects: { charm: 4, luck: 2 } },
            { text: '顺其自然', effects: { charm: 2, health: 1 } }
        ]
    },
    // 幸运事件 - 财运亨通
    {
        minAge: 20, maxAge: 65, title: '财运亨通',
        text: '你的投资/理财获得了不错的回报！',
        choices: [
            { text: '继续稳健投资', effects: { wealth: 5, intelligence: 1 } },
            { text: '取出一部分享受生活', effects: { wealth: 3, health: 3 } }
        ]
    },
    // 幸运事件 - 技能提升
    {
        minAge: 10, maxAge: 55, title: '突飞猛进',
        text: '你在某个领域的技能水平突然有了大幅提升！',
        choices: [
            { text: '继续深造，精益求精', effects: { intelligence: 4, strength: 2 } },
            { text: '分享经验，帮助他人', effects: { charm: 4, intelligence: 1 } }
        ]
    },
    // 幸运事件 - 家庭和睦
    {
        minAge: 5, maxAge: 70, title: '家庭和睦',
        text: '最近家庭氛围特别好，大家相处融洽。',
        choices: [
            { text: '组织家庭活动', effects: { charm: 4, health: 2 } },
            { text: '珍惜当下，享受时光', effects: { health: 4, luck: 2 } }
        ]
    },
    // 幸运事件 - 意外之喜
    {
        minAge: 18, maxAge: 65, title: '意外之喜',
        text: '你收到了一份意想不到的礼物/惊喜！',
        choices: [
            { text: '非常开心，好好享受', effects: { charm: 3, health: 3, luck: 2 } },
            { text: '保持平常心', effects: { intelligence: 2, luck: 3 } }
        ]
    }
];

const careerPaths = [
    // 传统职业
    {
        name: '程序员', icon: '💻', req: { intelligence: 60 }, wealthBonus: 5,
        description: '与代码为伴，用技术改变世界', type: 'traditional',
        stages: [
            { level: 1, name: '初级程序员', req: {}, wealthBonus: 3 },
            { level: 2, name: '中级程序员', req: { intelligence: 70 }, wealthBonus: 5 },
            { level: 3, name: '高级程序员', req: { intelligence: 80, charm: 50 }, wealthBonus: 8 },
            { level: 4, name: '技术总监', req: { intelligence: 90, charm: 70 }, wealthBonus: 12 },
            { level: 5, name: 'CTO', req: { intelligence: 95, charm: 80, wealth: 60 }, wealthBonus: 18 }
        ]
    },
    {
        name: '医生', icon: '👩⚕️', req: { intelligence: 65, health: 40 }, wealthBonus: 6,
        description: '救死扶伤，守护生命', type: 'traditional',
        stages: [
            { level: 1, name: '住院医师', req: {}, wealthBonus: 3 },
            { level: 2, name: '主治医师', req: { intelligence: 70, health: 50 }, wealthBonus: 6 },
            { level: 3, name: '副主任医师', req: { intelligence: 80, charm: 50 }, wealthBonus: 10 },
            { level: 4, name: '主任医师', req: { intelligence: 85, charm: 70 }, wealthBonus: 15 },
            { level: 5, name: '知名专家', req: { intelligence: 95, charm: 80, health: 60 }, wealthBonus: 22 }
        ]
    },
    {
        name: '教师', icon: '👨🏫', req: { intelligence: 55, charm: 40 }, wealthBonus: 3,
        description: '传道授业，教书育人', type: 'traditional',
        stages: [
            { level: 1, name: '实习教师', req: {}, wealthBonus: 2 },
            { level: 2, name: '初级教师', req: { intelligence: 60, charm: 50 }, wealthBonus: 3 },
            { level: 3, name: '中级教师', req: { intelligence: 70, charm: 60 }, wealthBonus: 5 },
            { level: 4, name: '高级教师', req: { intelligence: 75, charm: 70 }, wealthBonus: 8 },
            { level: 5, name: '特级教师', req: { intelligence: 85, charm: 80 }, wealthBonus: 12 }
        ]
    },
    {
        name: '商人', icon: '💰', req: { charm: 50, wealth: 40 }, wealthBonus: 7,
        description: '商场博弈，创造财富', type: 'traditional',
        stages: [
            { level: 1, name: '小商贩', req: {}, wealthBonus: 2 },
            { level: 2, name: '个体户', req: { charm: 60, wealth: 50 }, wealthBonus: 5 },
            { level: 3, name: '小企业主', req: { charm: 70, wealth: 70 }, wealthBonus: 9 },
            { level: 4, name: '企业家', req: { charm: 80, wealth: 90 }, wealthBonus: 15 },
            { level: 5, name: '商业巨头', req: { charm: 85, wealth: 120 }, wealthBonus: 25 }
        ]
    },
    {
        name: '运动员', icon: '🏃', req: { strength: 65, health: 50 }, wealthBonus: 4,
        description: '挑战极限，追求卓越', type: 'traditional',
        stages: [
            { level: 1, name: '业余运动员', req: {}, wealthBonus: 2 },
            { level: 2, name: '职业运动员', req: { strength: 70, health: 60 }, wealthBonus: 4 },
            { level: 3, name: '国家级运动员', req: { strength: 80, health: 70 }, wealthBonus: 8 },
            { level: 4, name: '洲际冠军', req: { strength: 85, charm: 60 }, wealthBonus: 14 },
            { level: 5, name: '世界冠军', req: { strength: 95, charm: 75 }, wealthBonus: 22 }
        ]
    },
    {
        name: '艺术家', icon: '🎨', req: { charm: 55, intelligence: 40 }, wealthBonus: 3,
        description: '用艺术表达灵魂', type: 'traditional',
        stages: [
            { level: 1, name: '艺术爱好者', req: {}, wealthBonus: 1 },
            { level: 2, name: '青年艺术家', req: { charm: 60, intelligence: 50 }, wealthBonus: 3 },
            { level: 3, name: '职业艺术家', req: { charm: 70, intelligence: 60 }, wealthBonus: 6 },
            { level: 4, name: '知名艺术家', req: { charm: 80, intelligence: 70 }, wealthBonus: 11 },
            { level: 5, name: '艺术大师', req: { charm: 90, intelligence: 80 }, wealthBonus: 18 }
        ]
    },
    {
        name: '公务员', icon: '👔', req: { intelligence: 50, charm: 40 }, wealthBonus: 4,
        description: '为人民服务，稳定体面', type: 'traditional',
        stages: [
            { level: 1, name: '科员', req: {}, wealthBonus: 3 },
            { level: 2, name: '副科级', req: { intelligence: 60, charm: 50 }, wealthBonus: 5 },
            { level: 3, name: '正科级', req: { intelligence: 70, charm: 60 }, wealthBonus: 8 },
            { level: 4, name: '处级干部', req: { intelligence: 75, charm: 70 }, wealthBonus: 12 },
            { level: 5, name: '厅级干部', req: { intelligence: 85, charm: 80 }, wealthBonus: 18 }
        ]
    },
    {
        name: '自由职业者', icon: '🖥️', req: { luck: 50 }, wealthBonus: 3,
        description: '自由灵活，掌控时间', type: 'traditional',
        stages: [
            { level: 1, name: '新手接单', req: {}, wealthBonus: 2 },
            { level: 2, name: '熟练接单', req: { luck: 60 }, wealthBonus: 4 },
            { level: 3, name: '资深自由职业', req: { luck: 70, charm: 50 }, wealthBonus: 6 },
            { level: 4, name: '行业专家', req: { luck: 75, intelligence: 60 }, wealthBonus: 10 },
            { level: 5, name: '自由职业大师', req: { luck: 85, charm: 70 }, wealthBonus: 15 }
        ]
    },
    {
        name: '普通职员', icon: '📋', req: {}, wealthBonus: 2,
        description: '脚踏实地，稳步前行', type: 'traditional',
        stages: [
            { level: 1, name: '实习生', req: {}, wealthBonus: 1 },
            { level: 2, name: '初级职员', req: { intelligence: 40 }, wealthBonus: 2 },
            { level: 3, name: '中级职员', req: { intelligence: 50, charm: 40 }, wealthBonus: 4 },
            { level: 4, name: '高级职员', req: { intelligence: 60, charm: 50 }, wealthBonus: 6 },
            { level: 5, name: '部门主管', req: { intelligence: 70, charm: 60 }, wealthBonus: 10 }
        ]
    },
    // 新兴职业
    {
        name: '网红博主', icon: '📱', req: { charm: 60, luck: 45 }, wealthBonus: 6,
        description: '记录生活，分享美好，收获百万粉丝', type: 'modern',
        stages: [
            { level: 1, name: '新手博主', req: {}, wealthBonus: 2 },
            { level: 2, name: '小网红', req: { charm: 65, luck: 50 }, wealthBonus: 4 },
            { level: 3, name: '中V博主', req: { charm: 75, luck: 60 }, wealthBonus: 8 },
            { level: 4, name: '大V博主', req: { charm: 80, luck: 70 }, wealthBonus: 14 },
            { level: 5, name: '顶流网红', req: { charm: 90, luck: 80 }, wealthBonus: 22 }
        ]
    },
    {
        name: '游戏主播', icon: '🎮', req: { charm: 55, luck: 50 }, wealthBonus: 5,
        description: '直播游戏，与观众互动，成为电竞明星', type: 'modern',
        stages: [
            { level: 1, name: '新手主播', req: {}, wealthBonus: 2 },
            { level: 2, name: '人气主播', req: { charm: 60, luck: 55 }, wealthBonus: 5 },
            { level: 3, name: '知名主播', req: { charm: 70, luck: 65 }, wealthBonus: 9 },
            { level: 4, name: '头部主播', req: { charm: 80, luck: 75 }, wealthBonus: 15 },
            { level: 5, name: '电竞明星', req: { charm: 85, luck: 85 }, wealthBonus: 22 }
        ]
    },
    {
        name: 'AI工程师', icon: '🤖', req: { intelligence: 70 }, wealthBonus: 7,
        description: '研发人工智能，引领科技未来', type: 'modern',
        stages: [
            { level: 1, name: 'AI助理工程师', req: {}, wealthBonus: 4 },
            { level: 2, name: 'AI工程师', req: { intelligence: 75 }, wealthBonus: 7 },
            { level: 3, name: '高级AI工程师', req: { intelligence: 85 }, wealthBonus: 12 },
            { level: 4, name: 'AI技术专家', req: { intelligence: 90, charm: 50 }, wealthBonus: 18 },
            { level: 5, name: 'AI科学家', req: { intelligence: 98, charm: 60 }, wealthBonus: 28 }
        ]
    },
    {
        name: '区块链开发者', icon: '⛓️', req: { intelligence: 65 }, wealthBonus: 6,
        description: '构建去中心化应用，探索Web3世界', type: 'modern',
        stages: [
            { level: 1, name: '区块链开发助理', req: {}, wealthBonus: 3 },
            { level: 2, name: '区块链开发者', req: { intelligence: 70 }, wealthBonus: 6 },
            { level: 3, name: '高级区块链开发者', req: { intelligence: 80 }, wealthBonus: 10 },
            { level: 4, name: '区块链架构师', req: { intelligence: 88, charm: 50 }, wealthBonus: 16 },
            { level: 5, name: '区块链技术领袖', req: { intelligence: 95, charm: 70 }, wealthBonus: 25 }
        ]
    },
    {
        name: '短视频创作者', icon: '🎬', req: { charm: 50, intelligence: 45 }, wealthBonus: 4,
        description: '创作精彩内容，传递创意与快乐', type: 'modern',
        stages: [
            { level: 1, name: '新手创作者', req: {}, wealthBonus: 2 },
            { level: 2, name: '活跃创作者', req: { charm: 55, intelligence: 50 }, wealthBonus: 4 },
            { level: 3, name: '优质创作者', req: { charm: 65, intelligence: 60 }, wealthBonus: 7 },
            { level: 4, name: '头部创作者', req: { charm: 75, intelligence: 70 }, wealthBonus: 12 },
            { level: 5, name: '创作达人', req: { charm: 85, intelligence: 75 }, wealthBonus: 18 }
        ]
    },
    {
        name: '电商主播', icon: '🛒', req: { charm: 55, wealth: 30 }, wealthBonus: 5,
        description: '直播带货，创造商业奇迹', type: 'modern',
        stages: [
            { level: 1, name: '带货新人', req: {}, wealthBonus: 3 },
            { level: 2, name: '带货主播', req: { charm: 60, wealth: 40 }, wealthBonus: 5 },
            { level: 3, name: '金牌主播', req: { charm: 70, wealth: 60 }, wealthBonus: 9 },
            { level: 4, name: '超级主播', req: { charm: 80, wealth: 80 }, wealthBonus: 15 },
            { level: 5, name: '直播一哥/一姐', req: { charm: 90, wealth: 100 }, wealthBonus: 24 }
        ]
    },
    {
        name: '数据科学家', icon: '📊', req: { intelligence: 65 }, wealthBonus: 6,
        description: '从数据中挖掘价值，洞察未来趋势', type: 'modern',
        stages: [
            { level: 1, name: '数据分析员', req: {}, wealthBonus: 3 },
            { level: 2, name: '数据分析师', req: { intelligence: 70 }, wealthBonus: 6 },
            { level: 3, name: '高级数据分析师', req: { intelligence: 80 }, wealthBonus: 10 },
            { level: 4, name: '数据科学家', req: { intelligence: 88, charm: 50 }, wealthBonus: 16 },
            { level: 5, name: '首席数据官', req: { intelligence: 95, charm: 70 }, wealthBonus: 25 }
        ]
    },
    {
        name: '虚拟现实设计师', icon: '🥽', req: { intelligence: 55, charm: 50 }, wealthBonus: 5,
        description: '打造沉浸式虚拟体验，定义元宇宙', type: 'modern',
        stages: [
            { level: 1, name: 'VR设计助理', req: {}, wealthBonus: 3 },
            { level: 2, name: 'VR设计师', req: { intelligence: 60, charm: 55 }, wealthBonus: 5 },
            { level: 3, name: '高级VR设计师', req: { intelligence: 70, charm: 65 }, wealthBonus: 9 },
            { level: 4, name: 'VR设计总监', req: { intelligence: 80, charm: 75 }, wealthBonus: 15 },
            { level: 5, name: '元宇宙架构师', req: { intelligence: 90, charm: 85 }, wealthBonus: 24 }
        ]
    }
];

const careerEvents = {
    '程序员': [
        {
            title: '项目上线',
            text: '你负责的项目终于上线了，用户反馈非常好！',
            choices: [
                { text: '继续优化功能', effects: { intelligence: 3, wealth: 2 } },
                { text: '申请加薪', effects: { charm: -1, wealth: 3 } }
            ]
        },
        {
            title: '代码bug',
            text: '线上出现了严重的bug，需要紧急修复。',
            choices: [
                { text: '熬夜加班修复', effects: { intelligence: 2, health: -3 } },
                { text: '第二天再处理', effects: { charm: -2, wealth: -1 } }
            ]
        },
        {
            title: '技术分享',
            text: '公司邀请你做技术分享，这是展示实力的好机会。',
            choices: [
                { text: '认真准备，精彩分享', effects: { charm: 4, intelligence: 1 } },
                { text: '婉言拒绝', effects: { charm: -1, intelligence: 1 } }
            ]
        }
    ],
    '医生': [
        {
            title: '成功手术',
            text: '你主刀的手术非常成功，患者家属非常感激。',
            choices: [
                { text: '继续钻研医术', effects: { intelligence: 3, charm: 2 } },
                { text: '接受患者感谢', effects: { charm: 3, wealth: 1 } }
            ]
        },
        {
            title: '医疗纠纷',
            text: '一位患者对治疗结果不满意，提出了投诉。',
            choices: [
                { text: '耐心沟通解释', effects: { charm: 2, intelligence: 1 } },
                { text: '交由医院处理', effects: { health: -2, charm: -1 } }
            ]
        },
        {
            title: '学术会议',
            text: '你收到了国际学术会议的邀请。',
            choices: [
                { text: '参加会议交流', effects: { intelligence: 4, wealth: -2 } },
                { text: '专注临床工作', effects: { health: 2, intelligence: 1 } }
            ]
        }
    ],
    '教师': [
        {
            title: '学生获奖',
            text: '你的学生在竞赛中获得了优异成绩！',
            choices: [
                { text: '举办庆祝活动', effects: { charm: 3, wealth: -1 } },
                { text: '鼓励学生继续努力', effects: { intelligence: 2, charm: 2 } }
            ]
        },
        {
            title: '家长投诉',
            text: '一位家长对你的教学方式提出了质疑。',
            choices: [
                { text: '耐心沟通改进', effects: { charm: 2, intelligence: 1 } },
                { text: '坚持自己的方式', effects: { charm: -2, intelligence: 1 } }
            ]
        },
        {
            title: '职称评定',
            text: '学校开始职称评定了，你符合申报条件。',
            choices: [
                { text: '积极准备材料', effects: { intelligence: 3, wealth: -1 } },
                { text: '顺其自然', effects: { health: 2, charm: 1 } }
            ]
        }
    ],
    '商人': [
        {
            title: '商业谈判',
            text: '一个重要的商业合作谈判即将开始。',
            choices: [
                { text: '全力以赴争取最优条件', effects: { charm: 3, wealth: 4 } },
                { text: '寻求双赢方案', effects: { charm: 2, wealth: 2 } }
            ]
        },
        {
            title: '市场危机',
            text: '市场突然发生变化，你的生意受到了影响。',
            choices: [
                { text: '及时调整策略', effects: { intelligence: 3, wealth: -1 } },
                { text: '静观其变', effects: { luck: 2, wealth: -3 } }
            ]
        },
        {
            title: '投资机会',
            text: '一个高风险高回报的投资项目摆在你面前。',
            choices: [
                { text: '果断投资', effects: { luck: -1, riskInvest: true } },
                { text: '谨慎观望', effects: { intelligence: 2, wealth: 1 } }
            ]
        }
    ],
    '运动员': [
        {
            title: '重要比赛',
            text: '一场重要的比赛即将到来，你需要做出选择。',
            choices: [
                { text: '加倍训练', effects: { strength: 3, health: -2 } },
                { text: '保持平常心', effects: { health: 2, luck: 2 } }
            ]
        },
        {
            title: '运动损伤',
            text: '你在训练中不慎受伤了。',
            choices: [
                { text: '积极康复治疗', effects: { health: 2, strength: -1 } },
                { text: '带伤坚持训练', effects: { strength: 1, health: -3 } }
            ]
        },
        {
            title: '代言机会',
            text: '一个知名品牌邀请你担任代言人。',
            choices: [
                { text: '接受代言', effects: { charm: 3, wealth: 4 } },
                { text: '专注训练', effects: { strength: 2, intelligence: 1 } }
            ]
        }
    ],
    '艺术家': [
        {
            title: '画展邀请',
            text: '一家知名画廊邀请你举办个人画展。',
            choices: [
                { text: '精心准备画展', effects: { charm: 4, wealth: -2 } },
                { text: '暂时不办', effects: { health: 2, intelligence: 1 } }
            ]
        },
        {
            title: '灵感枯竭',
            text: '你遇到了创作瓶颈，很久没有灵感了。',
            choices: [
                { text: '外出寻找灵感', effects: { charm: 2, intelligence: 2 } },
                { text: '强迫自己创作', effects: { intelligence: 1, health: -2 } }
            ]
        },
        {
            title: '作品获奖',
            text: '你的作品获得了重要奖项！',
            choices: [
                { text: '举办庆祝派对', effects: { charm: 3, wealth: -2 } },
                { text: '继续努力创作', effects: { intelligence: 3, charm: 1 } }
            ]
        }
    ],
    '公务员': [
        {
            title: '晋升机会',
            text: '一个晋升的机会摆在你面前。',
            choices: [
                { text: '积极争取', effects: { charm: 3, intelligence: 1 } },
                { text: '顺其自然', effects: { health: 2, luck: 1 } }
            ]
        },
        {
            title: '工作压力',
            text: '最近工作压力很大，经常需要加班。',
            choices: [
                { text: '努力完成任务', effects: { intelligence: 2, health: -3 } },
                { text: '合理安排时间', effects: { health: 1, charm: 1 } }
            ]
        },
        {
            title: '群众来访',
            text: '有群众来访反映问题。',
            choices: [
                { text: '耐心接待解决', effects: { charm: 3, intelligence: 1 } },
                { text: '按流程处理', effects: { intelligence: 2, charm: 1 } }
            ]
        }
    ],
    '自由职业者': [
        {
            title: '新客户',
            text: '一个大客户找上门来，项目报酬丰厚但要求很高。',
            choices: [
                { text: '接下项目', effects: { wealth: 5, health: -2 } },
                { text: '量力而行', effects: { wealth: 2, health: 1 } }
            ]
        },
        {
            title: '淡季来临',
            text: '最近业务比较少，收入受到影响。',
            choices: [
                { text: '主动开拓市场', effects: { charm: 3, wealth: 1 } },
                { text: '趁此学习提升', effects: { intelligence: 3, wealth: -1 } }
            ]
        },
        {
            title: '远程办公',
            text: '你习惯了自由的工作方式，但家人希望你找一份稳定工作。',
            choices: [
                { text: '坚持自由职业', effects: { charm: -1, luck: 2 } },
                { text: '考虑转型', effects: { intelligence: 2, wealth: 1 } }
            ]
        }
    ],
    '普通职员': [
        {
            title: '工作考核',
            text: '公司要进行年度工作考核了。',
            choices: [
                { text: '认真准备汇报', effects: { intelligence: 2, wealth: 2 } },
                { text: '按部就班', effects: { health: 1, charm: 1 } }
            ]
        },
        {
            title: '同事竞争',
            text: '一个晋升机会出现，同事之间竞争激烈。',
            choices: [
                { text: '努力表现自己', effects: { charm: 2, intelligence: 1 } },
                { text: '做好本职工作', effects: { health: 2, wealth: 1 } }
            ]
        },
        {
            title: '公司团建',
            text: '公司组织团建活动。',
            choices: [
                { text: '积极参与', effects: { charm: 3, health: 1 } },
                { text: '请假休息', effects: { health: 2, charm: -1 } }
            ]
        }
    ],
    // 新兴职业事件
    '网红博主': [
        {
            title: '涨粉突破',
            text: '你的粉丝数突破了100万！各大品牌开始主动联系你合作。',
            choices: [
                { text: '接高质量广告', effects: { wealth: 5, charm: 2 } },
                { text: '保持内容质量，谨慎接广告', effects: { charm: 4, wealth: 2 } }
            ]
        },
        {
            title: '黑粉攻击',
            text: '你的一条视频引发争议，黑粉开始在评论区攻击你。',
            choices: [
                { text: '正面回应，澄清事实', effects: { charm: 3, health: -2 } },
                { text: '无视黑粉，专注创作', effects: { intelligence: 2, health: 1 } }
            ]
        },
        {
            title: '品牌代言',
            text: '一个知名品牌邀请你成为形象代言人。',
            choices: [
                { text: '接受代言', effects: { wealth: 6, charm: 3 } },
                { text: '考察品牌口碑后再决定', effects: { intelligence: 2, charm: 1 } }
            ]
        }
    ],
    '游戏主播': [
        {
            title: '直播人气飙升',
            text: '你的直播人气突破了10万在线，平台邀请你签约独家。',
            choices: [
                { text: '签约独家，获得更多资源', effects: { wealth: 5, charm: 3 } },
                { text: '保持自由，多平台发展', effects: { luck: 3, wealth: 2 } }
            ]
        },
        {
            title: '技术瓶颈',
            text: '你遇到了技术瓶颈，操作水平停滞不前，粉丝开始流失。',
            choices: [
                { text: '刻苦训练，突破瓶颈', effects: { strength: 3, health: -2 } },
                { text: '转型娱乐主播', effects: { charm: 3, intelligence: 1 } }
            ]
        },
        {
            title: '线下活动邀请',
            text: '你收到了大型电竞活动的邀请，将与职业选手同台竞技。',
            choices: [
                { text: '积极准备，展现实力', effects: { strength: 2, charm: 4 } },
                { text: '以娱乐心态参与', effects: { luck: 3, health: 2 } }
            ]
        }
    ],
    'AI工程师': [
        {
            title: '模型突破',
            text: '你研发的AI模型在国际比赛中获得了第一名！',
            choices: [
                { text: '申请专利，创办公司', effects: { wealth: 6, intelligence: 2 } },
                { text: '继续深耕学术', effects: { intelligence: 4, charm: 2 } }
            ]
        },
        {
            title: '伦理争议',
            text: '你的AI研究引发了伦理争议，媒体开始质疑你的研究方向。',
            choices: [
                { text: '公开回应，解释研究价值', effects: { charm: 3, intelligence: 2 } },
                { text: '专注研究，用成果说话', effects: { intelligence: 3, health: 1 } }
            ]
        },
        {
            title: '资本青睐',
            text: '知名风投机构向你抛出橄榄枝，希望投资你的AI项目。',
            choices: [
                { text: '接受投资，加速发展', effects: { wealth: 7, luck: 2 } },
                { text: '保持独立，稳步发展', effects: { intelligence: 2, wealth: 2 } }
            ]
        }
    ],
    '区块链开发者': [
        {
            title: '代币上线',
            text: '你参与开发的加密货币项目成功上线主流交易所！',
            choices: [
                { text: '持有代币，长期投资', effects: { luck: 3, riskInvest: true } },
                { text: '及时套现，落袋为安', effects: { wealth: 4, intelligence: 1 } }
            ]
        },
        {
            title: '安全漏洞',
            text: '你发现了一个严重的智能合约安全漏洞。',
            choices: [
                { text: '公开披露，提醒社区', effects: { charm: 4, intelligence: 2 } },
                { text: '私下联系项目方', effects: { wealth: 3, luck: 1 } }
            ]
        },
        {
            title: 'DAO提案',
            text: '你提交的DAO治理提案获得了社区的广泛支持。',
            choices: [
                { text: '积极推动提案落地', effects: { charm: 3, intelligence: 2 } },
                { text: '继续观察，保持谨慎', effects: { intelligence: 2, luck: 2 } }
            ]
        }
    ],
    '短视频创作者': [
        {
            title: '爆款视频',
            text: '你发布的一条视频获得了1000万播放量！',
            choices: [
                { text: '乘胜追击，持续更新', effects: { charm: 3, health: -2 } },
                { text: '沉淀思考，提升质量', effects: { intelligence: 3, charm: 1 } }
            ]
        },
        {
            title: '创作灵感枯竭',
            text: '你已经一周没有想出好的创意了，粉丝开始催更。',
            choices: [
                { text: '外出采风寻找灵感', effects: { charm: 2, intelligence: 2 } },
                { text: '回顾经典，寻求突破', effects: { intelligence: 3, health: 1 } }
            ]
        },
        {
            title: 'MCN签约',
            text: '一家知名MCN机构邀请你签约。',
            choices: [
                { text: '签约MCN，获得专业运营', effects: { wealth: 4, charm: 2 } },
                { text: '保持独立，自己运营', effects: { luck: 2, wealth: 1 } }
            ]
        }
    ],
    '电商主播': [
        {
            title: '直播带货破亿',
            text: '你的一场直播销售额突破了1亿元！',
            choices: [
                { text: '扩大团队，规模化运营', effects: { wealth: 6, charm: 2 } },
                { text: '保持小而美，专注选品', effects: { intelligence: 3, wealth: 3 } }
            ]
        },
        {
            title: '产品质量问题',
            text: '你推荐的一款产品被曝出质量问题，粉丝要求你道歉。',
            choices: [
                { text: '公开道歉，赔偿消费者', effects: { charm: 3, wealth: -3 } },
                { text: '推卸责任，甩锅供应商', effects: { charm: -5, luck: -2 } }
            ]
        },
        {
            title: '品牌合作',
            text: '一家国际大牌邀请你合作独家直播。',
            choices: [
                { text: '接受合作，提升档次', effects: { wealth: 5, charm: 3 } },
                { text: '坚持国货，支持本土品牌', effects: { charm: 4, wealth: 2 } }
            ]
        }
    ],
    '数据科学家': [
        {
            title: '数据发现',
            text: '你从海量数据中发现了一个重要的商业洞察！',
            choices: [
                { text: '申请专利，转化价值', effects: { wealth: 5, intelligence: 2 } },
                { text: '发表论文，学术交流', effects: { intelligence: 4, charm: 2 } }
            ]
        },
        {
            title: '数据隐私争议',
            text: '你的数据分析项目涉及用户隐私问题，引发了公众讨论。',
            choices: [
                { text: '优化隐私保护方案', effects: { intelligence: 3, charm: 2 } },
                { text: '暂停项目，重新评估', effects: { intelligence: 2, health: 1 } }
            ]
        },
        {
            title: '算法改进',
            text: '你优化的算法将模型准确率提升了20%！',
            choices: [
                { text: '开源算法，造福行业', effects: { charm: 4, intelligence: 1 } },
                { text: '申请商业保密', effects: { wealth: 3, intelligence: 2 } }
            ]
        }
    ],
    '虚拟现实设计师': [
        {
            title: 'VR游戏上线',
            text: '你设计的VR游戏获得了玩家的一致好评！',
            choices: [
                { text: '开发续作，乘胜追击', effects: { intelligence: 3, wealth: 4 } },
                { text: '探索新方向，尝试不同类型', effects: { charm: 3, intelligence: 2 } }
            ]
        },
        {
            title: '晕动症问题',
            text: '部分玩家反馈你的VR体验会导致晕动症。',
            choices: [
                { text: '优化交互设计', effects: { intelligence: 3, health: 1 } },
                { text: '添加舒适度设置', effects: { charm: 2, intelligence: 2 } }
            ]
        },
        {
            title: '元宇宙合作',
            text: '一家科技巨头邀请你参与他们的元宇宙项目。',
            choices: [
                { text: '加入合作，共创未来', effects: { wealth: 5, charm: 3 } },
                { text: '保持独立，自主研发', effects: { intelligence: 3, luck: 2 } }
            ]
        }
    ]
};

// 基于属性阶段的事件
const statStageEvents = {
    intelligence: {
        '天才': [
            {
                title: '🧠 神童之名',
                text: '你的聪明才智远近闻名，当地的学校邀请你去做演讲。',
                choices: [
                    { text: '欣然接受，分享学习心得', effects: { charm: 3, intelligence: 2 } },
                    { text: '低调拒绝，专注学业', effects: { intelligence: 3, luck: 1 } }
                ]
            },
            {
                title: '🎯 奥数竞赛',
                text: '你代表学校参加全国奥数竞赛，获得了一等奖！',
                choices: [
                    { text: '再接再厉，冲击国际赛事', effects: { intelligence: 4, wealth: 2 } },
                    { text: '功成身退，享受荣誉', effects: { charm: 3, luck: 2 } }
                ]
            }
        ],
        '旷世奇才': [
            {
                title: '💡 重大发明',
                text: '你提出了一个革命性的理论/发明，震惊了学术界！',
                choices: [
                    { text: '申请专利，造福人类', effects: { wealth: 6, intelligence: 3 } },
                    { text: '公开分享，推动进步', effects: { charm: 5, intelligence: 2 } }
                ]
            },
            {
                title: '🏆 诺贝尔奖提名',
                text: '你获得了诺贝尔奖提名，成为史上最年轻的候选人！',
                choices: [
                    { text: '专心研究，志在必得', effects: { intelligence: 5, health: -2 } },
                    { text: '平常心对待，顺其自然', effects: { luck: 4, health: 2 } }
                ]
            }
        ],
        '愚笨': [
            {
                title: '📚 学习困难',
                text: '你发现学习越来越吃力，成绩一落千丈。',
                choices: [
                    { text: '加倍努力，勤能补拙', effects: { intelligence: 3, health: -2 } },
                    { text: '寻找其他出路', effects: { strength: 3, charm: 1 } }
                ]
            },
            {
                title: '😔 智力测试',
                text: '你参加了智力测试，结果不尽如人意。',
                choices: [
                    { text: '接受现实，努力提升', effects: { intelligence: 2, luck: 1 } },
                    { text: '怀疑测试，保持自信', effects: { charm: 2, health: 2 } }
                ]
            }
        ]
    },
    strength: {
        '强壮': [
            {
                title: '💪 体能挑战',
                text: '你参加了体能挑战赛，轻松打破了多项纪录！',
                choices: [
                    { text: '继续挑战极限', effects: { strength: 3, health: -1 } },
                    { text: '功成身退，享受生活', effects: { charm: 3, health: 2 } }
                ]
            },
            {
                title: '🏋️ 健身房邀约',
                text: '一家知名健身房邀请你成为形象代言人。',
                choices: [
                    { text: '签约代言', effects: { wealth: 4, charm: 2 } },
                    { text: '专注训练，暂不考虑', effects: { strength: 2, health: 2 } }
                ]
            }
        ],
        '绝世猛将': [
            {
                title: '⚔️ 武术大师',
                text: '你已经达到了武术的最高境界，成为一代宗师！',
                choices: [
                    { text: '开宗立派，传承武学', effects: { charm: 5, wealth: 3 } },
                    { text: '隐退江湖，修身养性', effects: { health: 5, luck: 2 } }
                ]
            },
            {
                title: '🏆 世界冠军',
                text: '你赢得了世界武术锦标赛冠军！',
                choices: [
                    { text: '卫冕冠军，再创辉煌', effects: { strength: 4, wealth: 3 } },
                    { text: '转型教练，培养新人', effects: { charm: 4, intelligence: 2 } }
                ]
            }
        ],
        '体弱': [
            {
                title: '🦴 体弱多病',
                text: '你经常生病，身体虚弱不堪。',
                choices: [
                    { text: '坚持锻炼，增强体质', effects: { strength: 3, health: 2 } },
                    { text: '注重养生，调理身体', effects: { health: 3, luck: 1 } }
                ]
            },
            {
                title: '😷 体育课困扰',
                text: '体育课对你来说是一种折磨，每次都感到力不从心。',
                choices: [
                    { text: '咬牙坚持，慢慢提升', effects: { strength: 2, health: -1 } },
                    { text: '申请免修，专注学习', effects: { intelligence: 2, strength: -1 } }
                ]
            }
        ]
    },
    charm: {
        '英俊/美丽': [
            {
                title: '😍 星探发现',
                text: '一位星探发现了你，邀请你进入娱乐圈发展。',
                choices: [
                    { text: '抓住机会，进军演艺圈', effects: { charm: 4, wealth: 3 } },
                    { text: '保持低调，专注学业', effects: { intelligence: 2, luck: 2 } }
                ]
            },
            {
                title: '💑 追求者众多',
                text: '你的追求者越来越多，让你有些烦恼。',
                choices: [
                    { text: '认真选择，开始恋爱', effects: { charm: 3, luck: 3 } },
                    { text: '专心事业，暂时单身', effects: { intelligence: 3, wealth: 1 } }
                ]
            }
        ],
        '倾国倾城': [
            {
                title: '👑 国民偶像',
                text: '你成为了国民级偶像，走到哪里都备受瞩目！',
                choices: [
                    { text: '利用影响力做公益', effects: { charm: 5, luck: 3 } },
                    { text: '保持神秘感，专注作品', effects: { wealth: 5, intelligence: 2 } }
                ]
            },
            {
                title: '🎬 好莱坞邀请',
                text: '好莱坞导演邀请你出演一部大片的主角！',
                choices: [
                    { text: '进军国际，挑战自我', effects: { charm: 4, wealth: 5 } },
                    { text: '扎根本土，回馈粉丝', effects: { charm: 3, luck: 4 } }
                ]
            }
        ],
        '丑陋': [
            {
                title: '👺 外貌困扰',
                text: '你因为外貌问题感到自卑，影响了社交生活。',
                choices: [
                    { text: '提升内在，自信面对', effects: { intelligence: 3, charm: 2 } },
                    { text: '注重打扮，提升气质', effects: { charm: 3, wealth: -1 } }
                ]
            },
            {
                title: '😔 求职受挫',
                text: '你因为外貌原因求职屡屡受挫。',
                choices: [
                    { text: '提升能力，用实力说话', effects: { intelligence: 4, charm: 1 } },
                    { text: '创业当老板', effects: { wealth: 2, luck: 3 } }
                ]
            }
        ]
    },
    wealth: {
        '富豪': [
            {
                title: '💎 投资机会',
                text: '一个高风险高回报的投资机会摆在你面前。',
                choices: [
                    { text: '大胆投资，追求高收益', effects: { wealth: 6, luck: -2 } },
                    { text: '谨慎行事，稳健投资', effects: { wealth: 3, luck: 2 } }
                ]
            },
            {
                title: '🏰 慈善晚宴',
                text: '你受邀参加一场高端慈善晚宴，结识了许多名流。',
                choices: [
                    { text: '慷慨捐款，回馈社会', effects: { charm: 4, wealth: -3 } },
                    { text: '拓展人脉，寻找商机', effects: { charm: 2, wealth: 3 } }
                ]
            }
        ],
        '首富': [
            {
                title: '👑 商业帝国',
                text: '你的商业帝国已经称霸全球，成为世界首富！',
                choices: [
                    { text: '继续扩张，追求更大成就', effects: { wealth: 8, intelligence: 2 } },
                    { text: '功成身退，享受生活', effects: { health: 5, charm: 4 } }
                ]
            },
            {
                title: '🌍 全球影响力',
                text: '各国政要都想与你建立联系，你的影响力遍布全球。',
                choices: [
                    { text: '参与国际事务', effects: { charm: 5, luck: 3 } },
                    { text: '保持低调，专注商业', effects: { wealth: 5, intelligence: 2 } }
                ]
            }
        ],
        '赤贫': [
            {
                title: '🪹 生活困境',
                text: '家里实在太穷了，连基本生活都成问题。',
                choices: [
                    { text: '勤工俭学，努力改变', effects: { wealth: 3, health: -2 } },
                    { text: '寻求帮助，度过难关', effects: { luck: 3, charm: 1 } }
                ]
            },
            {
                title: '🍞 温饱问题',
                text: '你经常吃不饱饭，身体越来越虚弱。',
                choices: [
                    { text: '打零工赚钱', effects: { wealth: 2, strength: -1 } },
                    { text: '申请救助', effects: { wealth: 3, charm: -2 } }
                ]
            }
        ]
    },
    health: {
        '强壮': [
            {
                title: '🦸 精力充沛',
                text: '你感觉精力无限，可以完成任何挑战！',
                choices: [
                    { text: '挑战极限运动', effects: { strength: 3, health: 1 } },
                    { text: '高效工作，事半功倍', effects: { intelligence: 3, wealth: 2 } }
                ]
            },
            {
                title: '💪 体检报告',
                text: '你的体检报告显示身体状况完美！',
                choices: [
                    { text: '保持健康习惯', effects: { health: 3, luck: 1 } },
                    { text: '尝试新的健身方式', effects: { strength: 2, health: 2 } }
                ]
            }
        ],
        '金刚不坏': [
            {
                title: '🌟 健康奇迹',
                text: '你创造了医学奇迹，身体机能远超常人！',
                choices: [
                    { text: '参与科学研究', effects: { intelligence: 4, health: 2 } },
                    { text: '享受生活，保持神秘', effects: { charm: 4, luck: 3 } }
                ]
            },
            {
                title: '🏃 长寿秘诀',
                text: '大家都想知道你的长寿秘诀。',
                choices: [
                    { text: '分享养生之道', effects: { charm: 5, health: 1 } },
                    { text: '保持低调，不透露', effects: { luck: 3, intelligence: 2 } }
                ]
            }
        ],
        '病危': [
            {
                title: '💀 生命垂危',
                text: '你的身体状况非常糟糕，医生建议你立即住院治疗。',
                choices: [
                    { text: '积极治疗，战胜病魔', effects: { health: 5, wealth: -5 } },
                    { text: '坦然面对，珍惜时光', effects: { charm: 3, luck: 2 } }
                ]
            },
            {
                title: '😢 绝望时刻',
                text: '你感到非常绝望，不知道未来会怎样。',
                choices: [
                    { text: '寻求心理帮助', effects: { health: 2, charm: 2 } },
                    { text: '与家人共度时光', effects: { charm: 3, health: 1 } }
                ]
            }
        ]
    },
    luck: {
        '福运': [
            {
                title: '🌈 意外之喜',
                text: '你走在路上捡到了一个装满现金的钱包！',
                choices: [
                    { text: '拾金不昧，物归原主', effects: { charm: 4, luck: 2 } },
                    { text: '据为己有', effects: { wealth: 5, luck: -2 } }
                ]
            },
            {
                title: '🍀 好运连连',
                text: '今天真是你的幸运日，好事接二连三！',
                choices: [
                    { text: '买彩票试试运气', effects: { wealth: 6, luck: -1 } },
                    { text: '保持平常心', effects: { luck: 4, intelligence: 1 } }
                ]
            }
        ],
        '天命之子': [
            {
                title: '🌟 天选之人',
                text: '你仿佛受到了命运的眷顾，心想事成！',
                choices: [
                    { text: '抓住机遇，成就伟业', effects: { wealth: 7, charm: 3 } },
                    { text: '低调行事，感恩生活', effects: { health: 5, luck: 4 } }
                ]
            },
            {
                title: '✨ 奇迹发生',
                text: '一个几乎不可能实现的愿望竟然成真了！',
                choices: [
                    { text: '许愿更多', effects: { luck: 5, intelligence: -1 } },
                    { text: '知足常乐', effects: { health: 4, charm: 3 } }
                ]
            }
        ],
        '霉运': [
            {
                title: '💩 祸不单行',
                text: '今天真是倒霉透顶，坏事一件接一件。',
                choices: [
                    { text: '乐观面对，相信否极泰来', effects: { luck: 3, health: 1 } },
                    { text: '宅在家里避避风头', effects: { intelligence: 2, luck: 1 } }
                ]
            },
            {
                title: '😤 诸事不顺',
                text: '无论做什么都不顺利，让人抓狂。',
                choices: [
                    { text: '冷静分析，找出问题', effects: { intelligence: 3, luck: 1 } },
                    { text: '放松心情，重新开始', effects: { health: 3, luck: 2 } }
                ]
            }
        ]
    }
};

const setbacks = [
    {
        title: '💰 投资失败',
        text: '你投资的项目失败了，损失了一大笔钱。',
        effects: { wealth: -10 },
        minAge: 25
    },
    {
        title: '💔 感情破裂',
        text: '你和伴侣的关系出现了裂痕，最终分手了。',
        effects: { charm: -5, health: -5 },
        minAge: 18
    },
    {
        title: '🏥 重病缠身',
        text: '你生了一场大病，身体变得非常虚弱。',
        effects: { health: -15, wealth: -5 },
        minAge: 10
    },
    {
        title: '🚗 意外事故',
        text: '你遭遇了一场意外事故，虽然保住了性命，但身体受到了伤害。',
        effects: { health: -10, wealth: -8 },
        minAge: 16
    },
    {
        title: '😤 职场失意',
        text: '你在工作中犯了一个严重错误，被降职处理。',
        effects: { wealth: -5, charm: -5 },
        minAge: 22
    },
    {
        title: '🏠 家庭变故',
        text: '家里发生了变故，让你备受打击。',
        effects: { health: -8, intelligence: -3 },
        minAge: 5
    },
    {
        title: '📉 股市崩盘',
        text: '股市突然崩盘，你的投资损失惨重。',
        effects: { wealth: -15, luck: -5 },
        minAge: 25
    },
    {
        title: '🎭 朋友背叛',
        text: '你发现最好的朋友在背后说你坏话。',
        effects: { charm: -5, luck: -3 },
        minAge: 10
    },
    {
        title: '💻 数据丢失',
        text: '你辛苦工作的重要数据意外丢失了。',
        effects: { intelligence: -3, health: -5 },
        minAge: 18
    },
    {
        title: '🌪️ 自然灾害',
        text: '一场自然灾害席卷了你所在的城市，你的财产受到了损失。',
        effects: { wealth: -12, health: -3 },
        minAge: 5
    },
    {
        title: '⚖️ 法律纠纷',
        text: '你卷入了一场法律纠纷，需要花费大量精力和金钱解决。',
        effects: { wealth: -8, intelligence: -3 },
        minAge: 18
    },
    {
        title: '🎓 考试失利',
        text: '你准备已久的重要考试失败了。',
        effects: { intelligence: -5, health: -3 },
        minAge: 8
    }
];

// 检测并触发属性阶段事件
function checkStatStageEvents() {
    const statNames = ['intelligence', 'strength', 'charm', 'wealth', 'health', 'luck'];

    for (let statName of statNames) {
        const currentStage = getStatStage(statName, player[statName]);
        const stageEvents = statStageEvents[statName]?.[currentStage.name];

        if (stageEvents && stageEvents.length > 0 && Math.random() < 0.15) {
            let randomEvent = stageEvents[Math.floor(Math.random() * stageEvents.length)];
            showEventModal(randomEvent.title, randomEvent.text, randomEvent.choices);
            return true;
        }
    }
    return false;
}

function checkCareerPromotion() {
    if (player.career === '无') return;

    let career = careerPaths.find(c => c.name === player.career);
    if (!career || !career.stages) return;

    let currentStage = career.stages.find(s => s.level === player.careerLevel);
    if (!currentStage) return;

    let nextStage = career.stages.find(s => s.level === player.careerLevel + 1);
    if (!nextStage) return;

    let meetsRequirements = true;
    for (let key in nextStage.req) {
        if (player[key] < nextStage.req[key]) {
            meetsRequirements = false;
            break;
        }
    }

    if (meetsRequirements) {
        let prevBonus = currentStage.wealthBonus;
        let newBonus = nextStage.wealthBonus;
        let bonusDiff = newBonus - prevBonus;

        player.careerLevel = nextStage.level;
        player.wealth = clampStat(player.wealth + bonusDiff);

        showEventModal(`🎊 职业晋升！`, `恭喜你从【${currentStage.name}】晋升为【${nextStage.name}】！财富永久+${bonusDiff}！`);
    }
}

function getPhase(age) {
    if (age <= 2) return '婴儿期';
    if (age <= 6) return '幼年期';
    if (age <= 12) return '童年期';
    if (age <= 18) return '青少年期';
    if (age <= 30) return '青年期';
    if (age <= 45) return '中年期';
    if (age <= 60) return '中老年期';
    return '老年期';
}

function clampStat(value) {
    return Math.max(0, Math.min(100, value));
}

function applyEffects(effects, showPopup = true) {
    let changes = [];

    if (effects.intelligence) {
        let oldVal = player.intelligence;
        player.intelligence = clampStat(player.intelligence + effects.intelligence);
        changes.push({ attr: '智力', change: effects.intelligence, oldVal, newVal: player.intelligence });
    }
    if (effects.strength) {
        let oldVal = player.strength;
        player.strength = clampStat(player.strength + effects.strength);
        changes.push({ attr: '力量', change: effects.strength, oldVal, newVal: player.strength });
    }
    if (effects.charm) {
        let oldVal = player.charm;
        player.charm = clampStat(player.charm + effects.charm);
        changes.push({ attr: '魅力', change: effects.charm, oldVal, newVal: player.charm });
    }
    if (effects.wealth) {
        let oldVal = player.wealth;
        player.wealth = clampStat(player.wealth + effects.wealth);
        changes.push({ attr: '财富', change: effects.wealth, oldVal, newVal: player.wealth });
    }
    if (effects.health) {
        let oldVal = player.health;
        player.health = clampStat(player.health + effects.health);
        changes.push({ attr: '健康', change: effects.health, oldVal, newVal: player.health });
    }
    if (effects.luck) {
        let oldVal = player.luck;
        player.luck = clampStat(player.luck + effects.luck);
        changes.push({ attr: '运气', change: effects.luck, oldVal, newVal: player.luck });
    }

    if (showPopup && changes.length > 0) {
        showStatsChangeModal(changes);
    }

    return changes;
}

function showStatsChangeModal(changes) {
    updateGameUI();
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('traitSelection').style.display = 'block';
    generateTraitCards();
}

function generateTraitCards() {
    selectedTalents = [];

    let shuffledTraits = [...traits].sort(() => Math.random() - 0.5).slice(0, 8);

    let container = document.getElementById('talentCards');
    container.innerHTML = '';

    let traitHeader = document.createElement('h3');
    traitHeader.textContent = '✨ 选择你的特质（选择3个）';
    traitHeader.style.cssText = 'color: #f39c12; font-size: 24px; margin-bottom: 25px; text-align: center; font-weight: 600;';
    container.appendChild(traitHeader);

    let traitGrid = document.createElement('div');
    traitGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;';
    shuffledTraits.forEach((trait, index) => {
        let card = document.createElement('div');
        card.className = 'trait-card';
        card.dataset.type = trait.type;
        card.innerHTML = `
            <div class="trait-header">
                <span class="trait-icon">${trait.icon}</span>
                <span class="trait-name">${trait.name}</span>
            </div>
            <div class="trait-effect">
                <span style="color: #2ecc71; font-size: 14px; display: block; margin-bottom: 5px;">${trait.positive}</span>
                <span style="color: #e74c3c; font-size: 14px;">${trait.negative}</span>
            </div>
        `;
        card.addEventListener('click', () => toggleTrait(card, trait));
        traitGrid.appendChild(card);
    });
    container.appendChild(traitGrid);

    let hintText = document.createElement('p');
    hintText.textContent = '� 每个特质都有正反效果，权衡利弊后再做选择吧！';
    hintText.style.cssText = 'text-align: center; color: #aaa; font-size: 16px; margin-top: 25px;';
    container.appendChild(hintText);
}

function toggleTrait(card, trait) {
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        selectedTalents = selectedTalents.filter(t => t.name !== trait.name);
    } else {
        if (selectedTalents.length < 3) {
            card.classList.add('selected');
            selectedTalents.push(trait);
        }
    }
}

function confirmTraits() {
    if (selectedTalents.length !== 3) {
        alert('请选择3个特质！');
        return;
    }

    player.traits = selectedTalents.map(t => t.name);

    selectedTalents.forEach(t => t.apply(player));

    player.intelligence = clampStat(player.intelligence);
    player.strength = clampStat(player.strength);
    player.charm = clampStat(player.charm);
    player.wealth = clampStat(player.wealth);
    player.health = clampStat(player.health);
    player.luck = clampStat(player.luck);

    showCharacterCreation();
}

function rerollTraits() {
    generateTraitCards();
}

function showCharacterCreation() {
    document.getElementById('traitSelection').style.display = 'none';
    document.getElementById('characterCreation').style.display = 'block';

    document.getElementById('attr-intelligence').textContent = player.intelligence;
    document.getElementById('attr-strength').textContent = player.strength;
    document.getElementById('attr-charm').textContent = player.charm;
    document.getElementById('attr-wealth').textContent = player.wealth;
    document.getElementById('attr-health').textContent = player.health;
    document.getElementById('attr-luck').textContent = player.luck;

    let family = birthFamilies[Math.floor(Math.random() * birthFamilies.length)];
    if (family.wealthMod) player.wealth = clampStat(player.wealth + family.wealthMod);
    if (family.intMod) player.intelligence = clampStat(player.intelligence + family.intMod);
    if (family.healthMod) player.health = clampStat(player.health + family.healthMod);
    if (family.charmMod) player.charm = clampStat(player.charm + family.charmMod);
    if (family.strengthMod) player.strength = clampStat(player.strength + family.strengthMod);

    let traitsText = player.traits.join('、');

    document.getElementById('birthText').innerHTML = `
        ${family.text}<br><br>
        <span class="trait-text">特质：${traitsText}</span>
    `;
}

function startLife() {
    document.getElementById('characterCreation').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    buildEventQueue();
    updateGameUI();
    showNextEvent();
}

function buildEventQueue() {
    eventQueue = [];

    let allPhases = ['baby', 'childhood', 'adolescence', 'youth', 'middleAge', 'middleLate', 'senior'];
    allPhases.forEach(phase => {
        lifeEvents[phase].forEach(event => {
            eventQueue.push({ ...event, phase: phase });
        });
    });

    eventQueue.sort((a, b) => a.age - b.age);
}

function updateGameUI() {
    player.phase = getPhase(player.age);

    document.getElementById('currentAge').textContent = player.age;
    document.getElementById('phaseDisplay').textContent = player.phase;
    document.getElementById('yearNumber').textContent = player.age + 1;

    let stats = ['intelligence', 'strength', 'charm', 'wealth', 'health', 'luck'];
    stats.forEach(stat => {
        let val = player[stat];
        document.getElementById('stat-' + stat).style.width = val + '%';
        document.getElementById('val-' + stat).textContent = val;
    });
}

function showNextEvent() {
    if (!player.alive) {
        showEnding();
        return;
    }

    if (player.health <= 0) {
        player.alive = false;
        showEnding();
        return;
    }

    if (eventQueue.length === 0) {
        player.alive = false;
        showEnding();
        return;
    }

    let nextEvent = eventQueue[0];

    if (nextEvent.age > 70) {
        player.alive = false;
        showEnding();
        return;
    }

    // 检测属性阶段事件
    let hasStatStageEvent = checkStatStageEvents();
    if (hasStatStageEvent) {
        return;
    }

    let mightInsertRandom = Math.random() < 0.3;
    if (mightInsertRandom) {
        let eligible = randomEvents.filter(re =>
            player.age >= re.minAge && player.age <= re.maxAge
        );
        if (eligible.length > 0 && nextEvent.age > player.age) {
            let randomEvent = eligible[Math.floor(Math.random() * eligible.length)];
            currentEvent = { ...randomEvent, age: player.age, isRandom: true };
            displayEvent(currentEvent);
            return;
        }
    }

    currentEvent = eventQueue.shift();
    player.age = currentEvent.age;
    displayEvent(currentEvent);
}

function displayEvent(event) {
    updateGameUI();

    let titleDiv = document.createElement('div');
    titleDiv.innerHTML = `<div style="text-align: center; margin-bottom: 35px;">
        <span style="display: inline-block; padding: 12px 35px; background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(233, 69, 96, 0.2)); border-radius: 30px; font-size: 20px; color: #f39c12; font-weight: 600; border: 1px solid rgba(243, 156, 18, 0.3);">
            📖 ${event.title}
        </span>
        <div style="font-size: 16px; color: #888; margin-top: 12px;">${player.age}岁</div>
    </div>`;

    let storyPanel = document.getElementById('storyPanel');
    storyPanel.innerHTML = '';
    storyPanel.appendChild(titleDiv);

    let textDiv = document.createElement('div');
    textDiv.id = 'storyText';
    textDiv.textContent = event.text;
    textDiv.style.cssText = `
        font-size: 26px;
        line-height: 2.4;
        margin-bottom: 50px;
        color: #f0f0f0;
        text-align: center;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        font-weight: 500;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    `;
    storyPanel.appendChild(textDiv);

    let choicesPanel = document.createElement('div');
    choicesPanel.id = 'choicesPanel';
    choicesPanel.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;';

    event.choices.forEach((choice, index) => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => makeChoice(choice));
        choicesPanel.appendChild(btn);
    });
    storyPanel.appendChild(choicesPanel);
}

function makeChoice(choice) {
    applyEffects(choice.effects);

    if (choice.setMarried) {
        player.married = true;
        player.spouse = '爱人';
    }

    if (choice.riskInvest) {
        if (player.luck > 50 && Math.random() < 0.5) {
            player.wealth = clampStat(player.wealth + 10);
            showEventModal('投资成功！', '你的投资获得了丰厚回报，财富大幅增长！');
        } else {
            player.wealth = clampStat(player.wealth - 5);
            showEventModal('投资失败', '投资没有达到预期，你损失了一部分资金。');
        }
        return;
    }

    if (player.age >= 22 && player.career === '无') {
        showCareerSelection();
        return;
    }

    if (player.married && player.age >= 30 && player.children === 0 && Math.random() < 0.4) {
        player.children = 1;
        showEventModal('喜得贵子！', '你迎来了人生中的第一个孩子，初为父母的喜悦让你感到无比幸福！');
        return;
    }

    player.eventLog.push({
        age: player.age,
        title: currentEvent.title,
        choice: choice.text
    });

    checkCareerPromotion();
    checkAchievements();
    updateGameUI();

    if (player.health <= 0) {
        player.alive = false;
        showEnding();
        return;
    }

    showNextEvent();
}

function assignCareer() {
    let possible = careerPaths.filter(career => {
        for (let key in career.req) {
            if (player[key] < career.req[key]) return false;
        }
        return true;
    });

    possible.sort((a, b) => {
        let aScore = Object.values(a.req).reduce((sum, v) => sum + v, 0);
        let bScore = Object.values(b.req).reduce((sum, v) => sum + v, 0);
        return bScore - aScore;
    });

    player.career = possible[0].name;
    player.careerLevel = 1;
    player.wealth = clampStat(player.wealth + possible[0].wealthBonus);
}

function showCareerSelection() {
    let possible = careerPaths.filter(career => {
        for (let key in career.req) {
            if (player[key] < career.req[key]) return false;
        }
        return true;
    });

    possible.sort((a, b) => {
        let aScore = Object.values(a.req).reduce((sum, v) => sum + v, 0);
        let bScore = Object.values(b.req).reduce((sum, v) => sum + v, 0);
        return bScore - aScore;
    });

    let modal = document.createElement('div');
    modal.id = 'careerModal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.95);
        border: 2px solid #f39c12;
        border-radius: 15px;
        padding: 30px;
        z-index: 1000;
        text-align: center;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;

    let title = document.createElement('h2');
    title.textContent = '🎯 选择你的职业';
    title.style.cssText = 'color: #f39c12; margin-bottom: 20px; font-size: 24px;';

    let subtitle = document.createElement('p');
    subtitle.textContent = '根据你的属性，以下是适合你的职业：';
    subtitle.style.cssText = 'color: #aaa; margin-bottom: 20px;';

    modal.appendChild(title);
    modal.appendChild(subtitle);

    let careerGrid = document.createElement('div');
    careerGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;';

    possible.forEach(career => {
        let card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
        `;

        card.addEventListener('mouseover', () => {
            card.style.borderColor = '#f39c12';
            card.style.transform = 'scale(1.02)';
        });

        card.addEventListener('mouseout', () => {
            card.style.borderColor = 'rgba(255,255,255,0.1)';
            card.style.transform = 'scale(1)';
        });

        card.addEventListener('click', () => selectCareer(career));

        let header = document.createElement('div');
        header.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 8px;';

        let icon = document.createElement('span');
        icon.textContent = career.icon;
        icon.style.fontSize = '24px';

        let name = document.createElement('span');
        name.textContent = career.name;
        name.style.color = '#fff';
        name.style.fontWeight = 'bold';

        header.appendChild(icon);
        header.appendChild(name);

        let desc = document.createElement('p');
        desc.textContent = career.description;
        desc.style.cssText = 'color: #888; font-size: 14px; margin-bottom: 8px;';

        let reqDiv = document.createElement('div');
        reqDiv.style.cssText = 'font-size: 12px; color: #666;';

        let reqText = [];
        if (career.req.intelligence) reqText.push(`智力 ${career.req.intelligence}+`);
        if (career.req.strength) reqText.push(`力量 ${career.req.strength}+`);
        if (career.req.charm) reqText.push(`魅力 ${career.req.charm}+`);
        if (career.req.wealth) reqText.push(`财富 ${career.req.wealth}+`);
        if (career.req.health) reqText.push(`健康 ${career.req.health}+`);
        if (career.req.luck) reqText.push(`运气 ${career.req.luck}+`);

        if (reqText.length === 0) {
            reqDiv.textContent = '无特殊要求';
        } else {
            reqDiv.textContent = '要求: ' + reqText.join(', ');
        }

        let bonus = document.createElement('div');
        bonus.style.cssText = 'margin-top: 8px; color: #2ecc71; font-size: 14px;';
        bonus.textContent = `💰 财富加成: +${career.wealthBonus}`;

        card.appendChild(header);
        card.appendChild(desc);
        card.appendChild(reqDiv);
        card.appendChild(bonus);

        careerGrid.appendChild(card);
    });

    modal.appendChild(careerGrid);

    let overlay = document.createElement('div');
    overlay.id = 'careerOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function selectCareer(career) {
    player.career = career.name;
    player.careerLevel = 1;
    player.wealth = clampStat(player.wealth + career.wealthBonus);

    document.body.removeChild(document.getElementById('careerModal'));
    document.body.removeChild(document.getElementById('careerOverlay'));

    showEventModal(`🎉 职业选择成功！`, `你选择成为一名${career.icon} ${career.name}（${career.stages[0].name}）。${career.description}，初始财富+${career.wealthBonus}！`);
}

function showNextEvent() {
    if (!player.alive) {
        showEnding();
        return;
    }

    if (player.health <= 0) {
        player.alive = false;
        showEnding();
        return;
    }

    if (eventQueue.length === 0) {
        player.alive = false;
        showEnding();
        return;
    }

    let nextEvent = eventQueue[0];

    if (nextEvent.age > 70) {
        player.alive = false;
        showEnding();
        return;
    }

    let mightInsertCareerEvent = player.career !== '无' && Math.random() < 0.25;
    if (mightInsertCareerEvent) {
        let events = careerEvents[player.career];
        if (events && events.length > 0 && nextEvent.age > player.age) {
            let careerEvent = events[Math.floor(Math.random() * events.length)];
            currentEvent = { ...careerEvent, age: player.age, isCareerEvent: true };
            displayEvent(currentEvent);
            return;
        }
    }

    let mightInsertSetback = Math.random() < 0.08;
    if (mightInsertSetback && nextEvent.age > player.age) {
        let eligibleSetbacks = setbacks.filter(s => player.age >= (s.minAge || 0));
        if (eligibleSetbacks.length > 0) {
            let setback = eligibleSetbacks[Math.floor(Math.random() * eligibleSetbacks.length)];
            showSetbackModal(setback);
            return;
        }
    }

    let mightInsertRandom = Math.random() < 0.25;
    if (mightInsertRandom) {
        let eligible = randomEvents.filter(re =>
            player.age >= re.minAge && player.age <= re.maxAge
        );
        if (eligible.length > 0 && nextEvent.age > player.age) {
            let randomEvent = eligible[Math.floor(Math.random() * eligible.length)];
            currentEvent = { ...randomEvent, age: player.age, isRandom: true };
            displayEvent(currentEvent);
            return;
        }
    }

    currentEvent = eventQueue.shift();
    player.age = currentEvent.age;
    displayEvent(currentEvent);
}

function showSetbackModal(setback) {
    let modal = document.createElement('div');
    modal.id = 'setbackModal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 20, 20, 0.95);
        border: 2px solid #e74c3c;
        border-radius: 15px;
        padding: 30px;
        z-index: 1000;
        text-align: center;
        min-width: 300px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;

    let title = document.createElement('h2');
    title.textContent = setback.title;
    title.style.cssText = 'color: #e74c3c; margin-bottom: 15px; font-size: 22px;';

    let text = document.createElement('p');
    text.textContent = setback.text;
    text.style.cssText = 'color: #ddd; margin-bottom: 20px; line-height: 1.6;';

    let okBtn = document.createElement('button');
    okBtn.textContent = '接受现实';
    okBtn.style.cssText = `
        padding: 12px 40px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border: none;
        border-radius: 25px;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.2s;
    `;
    okBtn.addEventListener('click', () => {
        applyEffects(setback.effects);
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
        player.eventLog.push({
            age: player.age,
            title: setback.title,
            choice: '遭遇挫折'
        });
        checkAchievements();
        updateGameUI();
        if (player.health <= 0) {
            player.alive = false;
            showEnding();
            return;
        }
        showNextEvent();
    });
    okBtn.addEventListener('mouseover', () => okBtn.style.transform = 'scale(1.05)');
    okBtn.addEventListener('mouseout', () => okBtn.style.transform = 'scale(1)');

    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(okBtn);

    let overlay = document.createElement('div');
    overlay.id = 'setbackOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function showEventModal(title, description) {
    document.getElementById('eventTitle').textContent = title;
    document.getElementById('eventDescription').textContent = description;
    document.getElementById('eventModal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';

    player.eventLog.push({
        age: player.age,
        title: currentEvent.title,
        choice: '特殊事件'
    });

    checkAchievements();
    updateGameUI();

    if (player.health <= 0) {
        player.alive = false;
        showEnding();
        return;
    }

    showNextEvent();
}

function checkAchievements() {
    let newAchievements = [];

    if (player.wealth >= 90 && !player.achievements.includes('富甲一方')) {
        player.achievements.push('富甲一方');
        newAchievements.push('富甲一方');
    }
    if (player.intelligence >= 90 && !player.achievements.includes('学富五车')) {
        player.achievements.push('学富五车');
        newAchievements.push('学富五车');
    }
    if (player.charm >= 90 && !player.achievements.includes('魅力四射')) {
        player.achievements.push('魅力四射');
        newAchievements.push('魅力四射');
    }
    if (player.health >= 90 && !player.achievements.includes('身强体壮')) {
        player.achievements.push('身强体壮');
        newAchievements.push('身强体壮');
    }
    if (player.strength >= 90 && !player.achievements.includes('力拔山兮')) {
        player.achievements.push('力拔山兮');
        newAchievements.push('力拔山兮');
    }
    if (player.luck >= 90 && !player.achievements.includes('福星高照')) {
        player.achievements.push('福星高照');
        newAchievements.push('福星高照');
    }
    if (player.married && !player.achievements.includes('成家立业')) {
        player.achievements.push('成家立业');
        newAchievements.push('成家立业');
    }
    if (player.children > 0 && !player.achievements.includes('为人父母')) {
        player.achievements.push('为人父母');
        newAchievements.push('为人父母');
    }
    if (player.career !== '无' && !player.achievements.includes('职场精英')) {
        player.achievements.push('职场精英');
        newAchievements.push('职场精英');
    }
    let allAbove60 = player.intelligence >= 60 && player.strength >= 60 && player.charm >= 60 && player.wealth >= 60 && player.health >= 60 && player.luck >= 60;
    if (allAbove60 && !player.achievements.includes('六边形战士')) {
        player.achievements.push('六边形战士');
        newAchievements.push('六边形战士');
    }

    if (newAchievements.length > 0) {
        showEventModal('🏆 获得成就！', '你获得了新成就：' + newAchievements.join('、'));
    }
}

function showEnding() {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('endingScreen').style.display = 'block';

    let totalScore = player.intelligence + player.strength + player.charm + player.wealth + player.health + player.luck;
    let endingTitle, endingType, endingClass;

    if (totalScore >= 480) {
        endingTitle = '传奇人生';
        endingType = '传奇人生';
        endingClass = 'legendary';
    } else if (totalScore >= 380) {
        endingTitle = '圆满人生';
        endingType = '圆满人生';
        endingClass = 'fulfilling';
    } else if (totalScore >= 280) {
        endingTitle = '平凡人生';
        endingType = '平凡人生';
        endingClass = 'ordinary';
    } else if (totalScore >= 180) {
        endingTitle = '遗憾人生';
        endingType = '遗憾人生';
        endingClass = 'regretful';
    } else {
        endingTitle = '悲惨人生';
        endingType = '悲惨人生';
        endingClass = 'tragic';
    }

    document.getElementById('endingTitle').textContent = endingTitle;
    let typeEl = document.getElementById('endingType');
    typeEl.textContent = endingType;
    typeEl.className = 'ending-type ' + endingClass;

    document.getElementById('end-intelligence').textContent = player.intelligence;
    document.getElementById('end-strength').textContent = player.strength;
    document.getElementById('end-charm').textContent = player.charm;
    document.getElementById('end-wealth').textContent = player.wealth;
    document.getElementById('end-health').textContent = player.health;
    document.getElementById('end-career').textContent = player.career;
    document.getElementById('end-marriage').textContent = player.married ? '已婚' : '未婚';
    document.getElementById('end-children').textContent = player.children;
    document.getElementById('end-age').textContent = player.age;

    let achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    if (player.achievements.length > 0) {
        player.achievements.forEach(a => {
            let tag = document.createElement('div');
            tag.className = 'achievement-tag';
            tag.textContent = '🏆 ' + a;
            achievementsList.appendChild(tag);
        });
    } else {
        achievementsList.innerHTML = '<p style="color: #aaa;">没有获得任何成就</p>';
    }
}

function restartGame() {
    player = {
        age: 0,
        intelligence: 50,
        strength: 50,
        charm: 50,
        wealth: 50,
        health: 50,
        luck: 50,
        traits: [],
        career: '无',
        careerLevel: 1,
        married: false,
        spouse: '',
        children: 0,
        achievements: [],
        eventLog: [],
        phase: '婴儿期',
        alive: true
    };
    selectedTalents = [];
    selectedFlaws = [];
    currentEvent = null;
    eventQueue = [];

    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('traitSelection').style.display = 'none';
    document.getElementById('characterCreation').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('endingScreen').style.display = 'none';
    document.getElementById('eventModal').style.display = 'none';
}

function createParticles() {
    let container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        let particle = document.createElement('div');
        particle.className = 'particle';
        let size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 5 + 6) + 's';
        container.appendChild(particle);
    }

    for (let i = 0; i < 50; i++) {
        let star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(star);
    }
}

createParticles();

// 音乐控制
let isMusicPlaying = false;
const bgMusic = document.getElementById('bgMusic');

function toggleMusic() {
    const musicBtn = document.getElementById('musicBtn');

    if (isMusicPlaying) {
        bgMusic.pause();
        musicBtn.textContent = '🔇';
        isMusicPlaying = false;
    } else {
        bgMusic.play().catch(err => {
            console.log('音乐播放失败:', err);
        });
        musicBtn.textContent = '🔊';
        isMusicPlaying = true;
    }
}

// 页面加载完成后尝试播放音乐
document.addEventListener('DOMContentLoaded', () => {
    bgMusic.volume = 0.3;
});
