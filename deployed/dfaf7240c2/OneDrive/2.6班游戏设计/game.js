// 游戏背景故事
// 温科高级中学，一所建于1995年的老牌名校，以严格的校纪和优异的升学率闻名全市。
// 然而2018年10月17日，高三学生陈太郎在晚自习后离奇失踪，警方搜查多日无果，最终以"离家出走"结案。
// 此后学校接连发生怪事：旧三楼的教室深夜传来低语声、楼梯间出现循环迷宫、学生们频繁做噩梦梦见红色蜡烛。
// 校方封锁了旧三楼，但恐怖传说仍在校园蔓延，有人说陈太郎的冤魂被困在教学楼里，等待着真相大白的那天。
// 2026年9月，转学生吴贤家来到温科高，刚入学就被张老师指派了一项诡异的任务——去旧三楼301教室取回档案袋。
// 你将扮演吴贤家，在这所被诅咒的学校中探索真相，解开隐藏在黑暗中的秘密...

// 游戏核心逻辑
class Game {
    constructor() {
        // 游戏状态
        this.state = {
            chapter: 0, // 当前章节
            fearLevel: 0, // 恐惧值
            inventory: [], // 道具栏
            flags: {}, // 游戏标志（用于跟踪剧情进度）
            currentScene: 'classroom', // 当前场景
            currentDialog: 0, // 当前对话
        };
        
        // 场景配置 - 高清背景图片
        this.scenes = {
            classroom: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20high%20school%20classroom%2C%20students%20studying%2C%20sunlight%20through%20windows%2C%20blackboard%20with%20math%20equations&image_size=landscape_16_9',
            oldBuilding: 'https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d~tplv-k3u1fbpfcp-watermark.image',
            room301: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=haunted%20classroom%20301%2C%20red%20candle%20with%20green%20flame%2C%20floating%20chalk%2C%20bloodstains%20on%20desk%2C%20broken%20chair%2C%20horror%20atmosphere&image_size=landscape_16_9',
            room302: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=destroyed%20classroom%20302%2C%20overturned%20desks%2C%20shattered%20glass%2C%20red%20pen%20floating%20in%20air%2C%20blood%20splatters%2C%20horror%20atmosphere&image_size=landscape_16_9',
            staircase: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=endless%20circular%20staircase%2C%20walls%20covered%20in%20red%20writing%2C%20floating%20candles%2C%20echoing%20footsteps%2C%20horror%20atmosphere&image_size=landscape_16_9',
            office: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=messy%20teacher%27s%20office%2C%20cobwebs%20on%20bookshelves%2C%20locked%20red%20box%2C%20flickering%20table%20lamp%2C%20scattered%20papers%2C%20horror%20atmosphere&image_size=landscape_16_9',
            rooftop: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=school%20rooftop%20at%20midnight%2C%20full%20moon%2C%20city%20skyline%20in%20distance%2C%20red%20candle%20ritual%20circle%2C%20wind%20blowing%20papers%2C%20horror%20atmosphere&image_size=landscape_16_9',
            library: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20abandoned%20library%2C%20books%20flying%20off%20shelves%2C%20floating%20candles%2C%20cobwebs%20everywhere%2C%20horror%20atmosphere&image_size=landscape_16_9',
            bathroom: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creepy%20school%20bathroom%2C%20fog%20on%20mirror%2C%20dripping%20faucet%2C%20stall%20doors%20opening%20and%20closing%2C%20horror%20atmosphere&image_size=landscape_16_9'
        };
        
        // 对话数据
        this.dialogs = {
            // 序章：转学生的警告
            0: [
                {
                    character: '张老师',
                    text: '吴贤家，你是转来的新生，今晚晚自习结束后，去旧教学楼三楼的 301 教室，帮我把学生档案袋取回来。',
                    options: [
                        {
                            text: '好的老师，我现在就去。',
                            fearChange: 15,
                            nextDialog: 1,
                            flags: { unlockOldBuilding: true }
                        },
                        {
                            text: '老师，旧三楼不是不让进吗？我不敢去。',
                            fearChange: 20,
                            nextDialog: 1,
                            items: ['黄铜钥匙'],
                            flags: { unlockOldBuilding: true }
                        },
                        {
                            text: '为什么是我去？其他同学呢？',
                            fearChange: 25,
                            nextDialog: 1,
                            flags: { unlockOldBuilding: true, teacherShaking: true }
                        }
                    ]
                },
                {
                    character: '吴贤家',
                    text: '我走到教室后门，发现门被锁死，只有一扇破损的窗户可翻出。',
                    options: [
                        {
                            text: '翻窗离开教室',
                            action: 'puzzle',
                            puzzle: 'windowEscape'
                        },
                        {
                            text: '使用黄铜钥匙尝试开门',
                            fearChange: -10,
                            nextDialog: 1,
                            scene: 'oldBuilding',
                            condition: (game) => game.hasItem('黄铜钥匙'),
                            flags: { useBrassKey: true }
                        }
                    ]
                }
            ],
            
            // 第一章：301 教室的红烛
            1: [
                {
                    character: '系统',
                    text: '你翻出教室，走向旧教学楼。走廊的声控灯忽明忽暗，走到旧三楼入口时，发现大门上贴着一张泛黄的纸条，用红色钢笔写着："别碰 302 的红烛，别听陈太郎的话。" 纸条下方有一道浅浅的血手印。',
                    options: [
                        {
                            text: '进入旧教学楼三楼',
                            nextDialog: 2,
                            scene: 'room301'
                        },
                        {
                            text: '查看陈太郎的速写本',
                            fearChange: -5,
                            nextDialog: 1,
                            condition: (game) => game.hasItem('陈太郎的速写本'),
                            flags: { examinedSketchbook: true }
                        }
                    ]
                },
                {
                    character: '陈太郎',
                    text: '你终于来了。我等了你八年。',
                    options: [
                        {
                            text: '你认识我？我们见过吗？',
                            fearChange: -10,
                            nextDialog: 3,
                            flags: { pastConnection: true }
                        },
                        {
                            text: '你是谁？为什么在这里？',
                            fearChange: 20,
                            nextDialog: 3,
                            flags: { dangerScene: true }
                        },
                        {
                            text: '我是来拿档案袋的，不是来听你胡说的。',
                            fearChange: 15,
                            nextDialog: 3,
                            items: ['陈太郎的速写本']
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '讲台上的红烛突然熄灭，地面出现一道红色笔迹，指向课桌抽屉。你打开抽屉，发现里面有一个粉笔盒。',
                    options: [
                        {
                            text: '查看粉笔盒',
                            action: 'puzzle',
                            puzzle: 'findFile'
                        }
                    ]
                }
            ],
            
            // 第二章：302 教室的失踪案
            2: [
                {
                    character: '系统',
                    text: '你根据纸条的提示，来到302教室。教室比301更破败，课桌椅全部倒在地上，正中央的讲台上摆着一支和陈太郎手中一模一样的红色钢笔，旁边是一滩干涸的红色痕迹。',
                    options: [
                        {
                            text: '与幻影对话',
                            nextDialog: 1
                        }
                    ]
                },
                {
                    character: '幻影',
                    text: '吴贤家，你还记得吗？那天晚自习，我们来 302 教室找手绘工具，突然停电了……',
                    options: [
                        {
                            text: '我记得，你当时说要找一支红色钢笔，说它能 "看见" 东西。',
                            fearChange: -15,
                            nextDialog: 2,
                            items: ['红色钢笔'],
                            flags: { getRedPen: true }
                        },
                        {
                            text: '我不记得了，你到底是谁？',
                            fearChange: 25,
                            nextDialog: 2,
                            flags: { angryPhantom: true }
                        },
                        {
                            text: '你是陈太郎？2018 年失踪的是你？',
                            fearChange: 10,
                            nextDialog: 2,
                            flags: { branchStory: true }
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '幻影指向教室的储物柜。',
                    options: [
                        {
                            text: '破解储物柜密码',
                            action: 'puzzle',
                            puzzle: 'lockerPassword'
                        }
                    ]
                }
            ],
            
            // 第三章：循环楼梯的陷阱
            3: [
                {
                    character: '系统',
                    text: '你拿着红色钢笔和日记，想从楼梯间逃离旧三楼，却发现走到二楼后，再往上走，又回到了三楼。楼梯间的墙壁上，用红色钢笔写满了 "吴贤家，别走"。',
                    options: [
                        {
                            text: '继续探索',
                            nextDialog: 1
                        },
                        {
                            text: '使用手电筒照亮楼梯间',
                            fearChange: -15,
                            nextDialog: 1,
                            condition: (game) => game.hasItem('手电筒'),
                            flags: { usedFlashlight: true }
                        },
                        {
                            text: '用红色钢笔在墙上写字回应',
                            fearChange: 10,
                            nextDialog: 1,
                            condition: (game) => game.hasItem('红色钢笔'),
                            flags: { wroteOnWall: true }
                        },
                        {
                            text: '前往二楼卫生间',
                            nextDialog: 0,
                            chapter: 8
                        },
                        {
                            text: '查看陈太郎的日记寻找线索',
                            fearChange: -5,
                            nextDialog: 1,
                            condition: (game) => game.hasItem('陈太郎的日记')
                        }
                    ]
                },
                {
                    character: '神秘学生',
                    text: '别往上走，这是循环楼梯，张老师设的陷阱。',
                    options: [
                        {
                            text: '你是陈太郎的朋友？',
                            fearChange: -20,
                            nextDialog: 2,
                            items: ['手电筒'],
                            flags: { linHaoFriend: true }
                        },
                        {
                            text: '你是张老师的人？',
                            nextDialog: 2,
                            flags: { linHaoEnemy: true }
                        },
                        {
                            text: '我要去四楼天台，逃离这里。',
                            fearChange: 15,
                            nextDialog: 2,
                            flags: { rooftopGoal: true }
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '楼梯间传来有节奏的敲击声（一下、两下、三下……）。',
                    options: [
                        {
                            text: '破解循环楼梯',
                            action: 'puzzle',
                            puzzle: 'staircaseRiddle'
                        }
                    ]
                }
            ],
            
            // 第四章：张老师办公室的暗格
            4: [
                {
                    character: '系统',
                    text: '你从四楼天台翻窗，来到一楼的张老师办公室门口。办公室的门虚掩着，里面传来张老师的低语声："仪式只差最后一步，红色钢笔 + 吴贤家的血 + 陈太郎的信物。"',
                    options: [
                        {
                            text: '进入办公室',
                            nextDialog: 1
                        },
                        {
                            text: '偷听并收集证据',
                            nextDialog: 1,
                            items: ['张老师的录音'],
                            flags: { collectedEvidence: true }
                        }
                    ]
                },
                {
                    character: '张老师',
                    text: '贤家，你终于来了。快，把红色钢笔给我，我帮你解除诅咒。',
                    options: [
                        {
                            text: '什么诅咒？你把陈太郎怎么了？',
                            fearChange: 30,
                            nextDialog: 2,
                            flags: { ritualPrep: true }
                        },
                        {
                            text: '我不会给你钢笔，你休想仪式。',
                            nextDialog: 2,
                            flags: { fightZhang: true }
                        },
                        {
                            text: '陈太郎让我来拿信物，她要阻止你。',
                            fearChange: -25,
                            nextDialog: 2,
                            flags: { confuseZhang: true }
                        },
                        {
                            text: '我愿意加入你们，获得黑暗力量',
                            action: 'ending',
                            ending: 'accomplice'
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '办公室的书架突然移动，露出暗格。',
                    options: [
                        {
                            text: '阻止仪式',
                            action: 'puzzle',
                            puzzle: 'stopRitual'
                        }
                    ]
                }
            ],
            
            // 第六章：图书馆的禁忌书籍
            6: [
                {
                    character: '系统',
                    text: '你在旧教学楼的走廊尽头发现了一扇隐藏的门，上面写着"图书馆"。门缝里透出微弱的烛光，传来翻书的声音。',
                    options: [
                        {
                            text: '进入图书馆',
                            nextDialog: 1,
                            scene: 'library'
                        },
                        {
                            text: '继续前往天台',
                            nextDialog: 0,
                            chapter: 5
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '图书馆里弥漫着旧书和灰尘的味道，书架上摆满了泛黄的书籍。中央的桌子上放着一本打开的《温科高校史》，旁边点着一支红色蜡烛。',
                    options: [
                        {
                            text: '阅读校史书籍',
                            nextDialog: 2,
                            items: ['校史残页']
                        },
                        {
                            text: '搜索书架',
                            nextDialog: 3,
                            fearChange: 5
                        },
                        {
                            text: '离开图书馆',
                            nextDialog: 0,
                            chapter: 3
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '校史记载："1995年，学校建成时，校长在图书馆地下修建了秘密祭坛，用于举行祈福仪式。2018年10月，祭坛突然崩塌，造成一名学生失踪。"',
                    options: [
                        {
                            text: '寻找地下祭坛入口',
                            nextDialog: 4
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '你在书架后面发现了一个暗门，上面刻着奇怪的符号。需要找到对应的钥匙才能打开。',
                    options: [
                        {
                            text: '使用黄铜钥匙尝试开门',
                            nextDialog: 4,
                            condition: (game) => game.hasItem('黄铜钥匙')
                        },
                        {
                            text: '继续搜索图书馆',
                            fearChange: 10,
                            nextDialog: 2
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '你打开暗门，发现了通往地下的楼梯。楼梯下方传来低沉的 chanting 声。',
                    options: [
                        {
                            text: '进入地下祭坛',
                            nextDialog: 0,
                            chapter: 7
                        },
                        {
                            text: '返回地面',
                            nextDialog: 0,
                            chapter: 5
                        }
                    ]
                }
            ],
            
            // 第七章：地下祭坛的秘密
            7: [
                {
                    character: '系统',
                    text: '地下祭坛中央有一个石质祭坛，上面摆放着三个血红色的蜡烛。墙壁上画满了诡异的符号，地面刻着陈太郎的名字。',
                    options: [
                        {
                            text: '调查祭坛',
                            nextDialog: 1
                        },
                        {
                            text: '使用手电筒照亮四周',
                            nextDialog: 1,
                            fearChange: -10,
                            condition: (game) => game.hasItem('手电筒')
                        }
                    ]
                },
                {
                    character: '神秘声音',
                    text: '吴贤家，你终于来了。陈太郎的灵魂被困在这里，只有你能救她。',
                    options: [
                        {
                            text: '你是谁？为什么知道我的名字？',
                            fearChange: 15,
                            nextDialog: 2
                        },
                        {
                            text: '我该怎么救陈太郎？',
                            nextDialog: 2,
                            flags: { wantToSaveChen: true }
                        },
                        {
                            text: '我不想管这件事，我要离开！',
                            fearChange: 20,
                            nextDialog: 3
                        }
                    ]
                },
                {
                    character: '神秘声音',
                    text: '用红色钢笔在祭坛上画陈太郎的名字，然后滴一滴你的血在蜡烛上。仪式需要三样东西：红色钢笔、你的血、以及陈太郎的信物。',
                    options: [
                        {
                            text: '使用红色钢笔和日记进行仪式',
                            nextDialog: 4,
                            condition: (game) => game.hasItem('红色钢笔') && game.hasItem('陈太郎的日记')
                        },
                        {
                            text: '寻找其他方法',
                            fearChange: 10,
                            nextDialog: 3
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '祭坛开始震动，墙壁上的符号发出红光。你感到一股强大的力量将你困住。',
                    options: [
                        {
                            text: '奋力挣脱',
                            fearChange: 25,
                            nextDialog: 0,
                            chapter: 5
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '仪式成功了！陈太郎的灵魂从祭坛升起，她的幻影变得清晰可见。',
                    options: [
                        {
                            text: '与陈太郎对话',
                            nextDialog: 0,
                            chapter: 5
                        }
                    ]
                }
            ],
            
            // 第八章：卫生间的低语
            8: [
                {
                    character: '系统',
                    text: '你在旧二楼走廊听到卫生间传来哭泣声，隔间门半开着，里面没有灯光。',
                    options: [
                        {
                            text: '进入卫生间查看',
                            nextDialog: 1,
                            scene: 'bathroom'
                        },
                        {
                            text: '继续前往图书馆',
                            nextDialog: 0,
                            chapter: 6
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '卫生间里弥漫着消毒水和铁锈的味道，镜子上布满了雾气，写着"帮我"。最后一个隔间的门从里面反锁着，传来敲击声。',
                    options: [
                        {
                            text: '与隔间里的人对话',
                            nextDialog: 2
                        },
                        {
                            text: '尝试打开隔间门',
                            fearChange: 10,
                            nextDialog: 3
                        },
                        {
                            text: '离开卫生间',
                            nextDialog: 0,
                            chapter: 3
                        }
                    ]
                },
                {
                    character: '未知女生',
                    text: '救我...我被锁在这里了...张老师要杀我...',
                    options: [
                        {
                            text: '我来救你！',
                            nextDialog: 3,
                            flags: { wantToSaveGirl: true }
                        },
                        {
                            text: '你是谁？发生了什么事？',
                            nextDialog: 4
                        },
                        {
                            text: '我没办法救你，对不起！',
                            fearChange: 15,
                            nextDialog: 0,
                            chapter: 3
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '你用力撞开隔间门，里面空无一人，只有一双红色的鞋子放在马桶上。鞋子里有一张纸条。',
                    options: [
                        {
                            text: '查看纸条',
                            nextDialog: 5,
                            items: ['女生的纸条']
                        }
                    ]
                },
                {
                    character: '未知女生',
                    text: '我是李婷，2018年和陈太郎一起被张老师抓住了...他把我们关在地下室...',
                    options: [
                        {
                            text: '告诉我更多细节！',
                            nextDialog: 3
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '纸条上写着："张老师的办公室有密道，密码是陈太郎的生日：0520"。',
                    options: [
                        {
                            text: '前往张老师办公室',
                            nextDialog: 0,
                            chapter: 4
                        },
                        {
                            text: '继续探索卫生间',
                            fearChange: 5,
                            nextDialog: 6
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '你在洗手池下面发现了一个暗格，里面有一台旧手机。',
                    options: [
                        {
                            text: '查看手机内容',
                            nextDialog: 7,
                            items: ['李婷的手机']
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '手机里有一段录音："张老师和校长在计划什么仪式...需要活人的血..."',
                    options: [
                        {
                            text: '前往办公室阻止仪式',
                            nextDialog: 0,
                            chapter: 4
                        },
                        {
                            text: '前往天台找陈太郎',
                            nextDialog: 0,
                            chapter: 5
                        }
                    ]
                }
            ],
            
            // 第五章：天台的真相与抉择
            5: [
                {
                    character: '系统',
                    text: '你跟着陈太郎的幻影，从暗格的裂缝逃到天台。天台的风很大，远处的城市灯光闪烁，而陈太郎的幻影逐渐变得清晰。',
                    options: [
                        {
                            text: '与陈太郎对话',
                            nextDialog: 1
                        },
                        {
                            text: '先去图书馆探索',
                            nextDialog: 0,
                            chapter: 6
                        },
                        {
                            text: '不顾一切逃离学校',
                            action: 'ending',
                            ending: 'escape'
                        }
                    ]
                },
                {
                    character: '陈太郎',
                    text: '吴贤家，谢谢你帮我找到真相。现在，我有两个选择给你。',
                    options: [
                        {
                            text: '跟我走，我带你离开温科高，去新的城市生活。',
                            action: 'ending',
                            ending: 'regret'
                        },
                        {
                            text: '我帮你找到真正的凶手，让你安息。',
                            nextDialog: 2,
                            flags: { findMurderer: true }
                        },
                        {
                            text: '你自己走吧，我不想再被束缚了。',
                            action: 'ending',
                            ending: 'lonely'
                        },
                        {
                            text: '我愿意牺牲自己，让你和李婷安息',
                            action: 'ending',
                            ending: 'sacrifice',
                            condition: (game) => game.hasItem('李婷的手机') || game.hasItem('女生的纸条')
                        },
                        {
                            text: '我要成为侦探，揭露所有黑暗',
                            action: 'ending',
                            ending: 'detective',
                            condition: (game) => game.hasItem('校史残页') && game.hasItem('李婷的手机') && game.hasItem('陈太郎的日记')
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '天台的地面出现一道红色笔迹，指向你的口袋。',
                    options: [
                        {
                            text: '恢复录音，找到真凶',
                            action: 'puzzle',
                            puzzle: 'recoverRecording'
                        },
                        {
                            text: '询问陈太郎关于李婷的事',
                            nextDialog: 3,
                            condition: (game) => game.hasItem('李婷的手机') || game.hasItem('女生的纸条')
                        }
                    ]
                },
                {
                    character: '陈太郎',
                    text: '李婷是我的好朋友...我们一起发现了张老师的秘密...他把我们推下了祭坛...',
                    options: [
                        {
                            text: '我要找到李婷的尸骨，让她安息',
                            nextDialog: 4,
                            flags: { findLiTingBody: true }
                        },
                        {
                            text: '我们先找校长报仇',
                            nextDialog: 2
                        }
                    ]
                },
                {
                    character: '系统',
                    text: '陈太郎告诉你李婷的尸骨在图书馆地下室的密室里，需要用校史残页作为钥匙。',
                    options: [
                        {
                            text: '前往图书馆地下室',
                            nextDialog: 0,
                            chapter: 7
                        },
                        {
                            text: '先找校长报仇',
                            action: 'puzzle',
                            puzzle: 'recoverRecording'
                        }
                    ]
                }
            ]
        };
        
        // 解谜数据
        this.puzzles = {
            windowEscape: {
                title: '解谜：翻窗离开教室',
                content: '你发现教室后门被锁死，只有一扇破损的窗户可翻出。观察窗户破损处，用手指抠住窗框缝隙攀爬。',
                options: [
                    {
                        text: '挥手回应',
                        fearChange: -10,
                        flags: { chenYuIdentity: true }
                    },
                    {
                        text: '低头躲避',
                        fearChange: 10
                    }
                ],
                onSuccess: (game) => {
                    game.changeScene('oldBuilding');
                    game.showDialog(1, 0);
                }
            },
            
            findFile: {
                title: '解谜：找到完整的档案袋',
                content: '粉笔盒里有一张泛黄的纸条，上面写着："档案袋在302教室，但别进去，那里有危险。"',
                options: [
                    {
                        text: '查看粉笔盒',
                        fearChange: 10,
                        flags: { unlock302: true }
                    }
                ],
                onSuccess: (game) => {
                    game.changeScene('room302');
                    game.showDialog(2, 0);
                }
            },
            
            lockerPassword: {
                title: '解谜：破解储物柜密码',
                content: '储物柜的密码锁上刻着数字：5、1、7、0。幻影提示："失踪的日期，是我藏钢笔的日子。" 地面的红色痕迹旁，有一串数字：20181017（陈太郎失踪日期）。',
                options: [
                    {
                        text: '输入密码：101718',
                        items: ['陈太郎的日记'],
                        flags: { getDiary: true }
                    },
                    {
                        text: '尝试其他密码',
                        fearChange: 5
                    }
                ],
                onSuccess: (game) => {
                    game.changeScene('staircase');
                    game.showDialog(3, 0);
                }
            },
            
            staircaseRiddle: {
                title: '解谜：打破循环楼梯',
                content: '仔细听敲击声的节奏（共 7 下，节奏为：快、快、慢、快、慢、快、快）。用红色钢笔在楼梯的台阶上敲出相同节奏。',
                options: [
                    {
                        text: '敲出节奏：快、快、慢、快、慢、快、快',
                        flags: { breakStaircase: true }
                    },
                    {
                        text: '随意敲击',
                        fearChange: 10
                    }
                ],
                onSuccess: (game) => {
                    game.changeScene('office');
                    game.showDialog(4, 0);
                }
            },
            
            stopRitual: {
                title: '解谜：阻止仪式',
                content: '用红色钢笔在暗格的墙壁上画 "灭" 字，同时将陈太郎的信物扔向石槽，血槽会自动吸收陈太郎的幻影之力，毁掉仪式道具。',
                options: [
                    {
                        text: '画灭字',
                        flags: { stopRitual: true },
                        condition: (game) => game.hasItem('红色钢笔')
                    },
                    {
                        text: '尝试其他方法',
                        fearChange: 15
                    }
                ],
                onSuccess: (game) => {
                    game.changeScene('rooftop');
                    game.showDialog(5, 0);
                }
            },
            
            recoverRecording: {
                title: '解谜：恢复录音',
                content: '你的口袋里有一张小时候的照片，是你和陈太郎的合影，背面写着 "2010 年，温科高幼儿园，陈太郎的红色钢笔，是你送的"。红色钢笔的秘密：这支钢笔是 2010 年你送给陈太郎的，里面藏着当年的录音，能记录下当年的对话。',
                options: [
                    {
                        text: '使用红色钢笔',
                        flags: { findTruth: true },
                        condition: (game) => game.hasItem('红色钢笔')
                    },
                    {
                        text: '查看照片背面',
                        fearChange: 5
                    }
                ],
                onSuccess: (game) => {
                    game.showEnding('trueEnding');
                }
            }
        };
        
        // 结局数据
        this.endings = {
            // 基础结局
            death: {
                title: '死亡结局',
                text: '你被黑暗吞噬，永远困在了温科高的旧教学楼里...'
            },
            regret: {
                title: '遗憾结局・相伴',
                text: '你选择留在天台陪陈太郎，两人永远守在旧三楼，成为温科高的传说...'
            },
            lonely: {
                title: '孤独结局',
                text: '陈太郎的幻影逐渐消散，你独自离开天台，带着这段恐怖的记忆继续生活...'
            },
            trueEnding: {
                title: '真结局・真相大白',
                text: '你恢复了录音，找到了真正的凶手——校长。陈太郎的冤魂得以安息，温科高的诅咒被解除。你带着真相离开，成为了揭露黑暗的英雄...'
            },
            secretEnding: {
                title: '秘密结局・双重救赎',
                text: '你不仅找到了陈太郎的真相，还找到了李婷的尸骨。两人的冤魂得以安息，学校的诅咒被彻底解除。你成为了温科高历史上最伟大的守护者...'
            },
            
            // 新增结局
            sacrifice: {
                title: '牺牲结局・永恒守护',
                text: '你选择用自己的生命换取陈太郎和李婷的安息。你的灵魂永远守护着温科高，成为学校的守护神...'
            },
            madness: {
                title: '疯狂结局・迷失自我',
                text: '你无法承受真相的冲击，精神彻底崩溃。你被送进了精神病院，永远活在恐惧和幻觉中...'
            },
            accomplice: {
                title: '共犯结局・黑暗同行',
                text: '你选择加入张老师和校长的阵营，成为他们仪式的助手。你获得了黑暗的力量，但永远失去了人性...'
            },
            detective: {
                title: '侦探结局・职业调查',
                text: '你收集了所有证据，将校长和张老师绳之以法。你成为了一名著名的侦探，专门调查超自然案件...'
            },
            teacher: {
                title: '教师结局・传承希望',
                text: '你毕业后回到温科高成为一名老师。你用自己的经历教育学生，让学校的黑暗历史永远不再重演...'
            },
            ghost: {
                title: '幽灵结局・校园徘徊',
                text: '你在逃离过程中意外身亡，成为了温科高的另一个幽灵。你和陈太郎、李婷一起在校园里徘徊...'
            },
            escape: {
                title: '逃脱结局・彻底遗忘',
                text: '你不顾一切逃离了温科高，删除了所有相关记忆。你开始了新的生活，但永远无法摆脱内心的阴影...'
            }
        };
        
        // 初始化游戏
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.updateFearLevel();
        this.updateInventory();
        this.changeScene('classroom');
        this.showDialog(0, 0);
        
        // 绑定事件
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const optionIndex = parseInt(e.target.dataset.option) - 1;
                this.handleOption(optionIndex);
            });
        });
        
        document.getElementById('puzzle-close').addEventListener('click', () => {
            this.hidePuzzle();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    // 显示对话
    showDialog(chapter, dialogIndex) {
        this.state.chapter = chapter;
        this.state.currentDialog = dialogIndex;
        
        const dialog = this.dialogs[chapter][dialogIndex];
        const characterName = document.getElementById('character-name');
        const dialogText = document.getElementById('dialog-text');
        const optionsContainer = document.getElementById('options-container');
        
        if (characterName && dialogText && optionsContainer) {
            characterName.textContent = dialog.character;
            dialogText.textContent = dialog.text;
            
            optionsContainer.innerHTML = '';
            
            dialog.options.forEach((option, index) => {
                // 检查选项条件
                if (option.condition && !option.condition(this)) {
                    return;
                }
                
                const optionBtn = document.createElement('div');
                optionBtn.className = 'option-btn';
                optionBtn.dataset.option = index + 1;
                optionBtn.textContent = option.text;
                optionBtn.addEventListener('click', () => {
                    this.handleOption(index);
                });
                optionsContainer.appendChild(optionBtn);
            });
        }
    }
    
    // 处理选项
    handleOption(optionIndex) {
        const dialog = this.dialogs[this.state.chapter][this.state.currentDialog];
        const option = dialog.options[optionIndex];
        
        // 处理恐惧值变化
        if (option.fearChange) {
            this.state.fearLevel += option.fearChange;
            this.state.fearLevel = Math.max(0, Math.min(100, this.state.fearLevel));
            this.updateFearLevel();
            
            // 检查恐惧值是否满格
            if (this.state.fearLevel >= 100) {
                this.showFearEnding();
                return;
            }
        }
        
        // 处理道具获得
        if (option.items) {
            option.items.forEach(item => {
                if (!this.state.inventory.includes(item)) {
                    this.state.inventory.push(item);
                }
            });
            this.updateInventory();
        }
        
        // 处理标志设置
        if (option.flags) {
            Object.assign(this.state.flags, option.flags);
        }
        
        // 处理场景切换
        if (option.scene) {
            this.changeScene(option.scene);
        }
        
        // 处理对话跳转
        if (option.nextDialog !== undefined) {
            const targetChapter = option.chapter !== undefined ? option.chapter : this.state.chapter;
            this.showDialog(targetChapter, option.nextDialog);
        }
        
        // 处理解谜
        if (option.action === 'puzzle') {
            this.showPuzzle(option.puzzle);
        }
        
        // 处理结局
        if (option.action === 'ending') {
            this.showEnding(option.ending);
        }
    }
    
    // 显示解谜
    showPuzzle(puzzleId) {
        const puzzle = this.puzzles[puzzleId];
        document.getElementById('puzzle-title').textContent = puzzle.title;
        document.getElementById('puzzle-content').textContent = puzzle.content;
        
        // 动态添加选项
        const optionsContainer = document.getElementById('puzzle-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            puzzle.options.forEach((option, index) => {
                // 检查选项条件
                if (option.condition && !option.condition(this)) {
                    return;
                }
                
                const optionElement = document.createElement('div');
                optionElement.className = 'puzzle-option';
                optionElement.textContent = option.text;
                optionElement.addEventListener('click', () => {
                    this.handlePuzzleOption(index);
                });
                optionsContainer.appendChild(optionElement);
            });
        }
        
        // 存储当前解谜ID
        this.currentPuzzle = puzzleId;
        
        const puzzleContainer = document.getElementById('puzzle-container');
        if (puzzleContainer) {
            puzzleContainer.style.display = 'block';
        }
        
        // 初始化拖拽功能
        this.initDragAndDrop();
    }
    
    // 隐藏解谜
    hidePuzzle() {
        const puzzleContainer = document.getElementById('puzzle-container');
        if (puzzleContainer) {
            puzzleContainer.style.display = 'none';
        }
    }
    
    // 处理解谜选项
    handlePuzzleOption(optionIndex) {
        const puzzle = this.puzzles[this.currentPuzzle];
        const option = puzzle.options[optionIndex];
        
        // 处理恐惧值变化
        if (option.fearChange) {
            this.state.fearLevel += option.fearChange;
            this.state.fearLevel = Math.max(0, Math.min(100, this.state.fearLevel));
            this.updateFearLevel();
            
            // 检查恐惧值是否满格，满格直接结束游戏
            if (this.state.fearLevel >= 100) {
                this.showFearEnding();
                return;
            }
        }
        
        // 处理道具获得
        if (option.items) {
            option.items.forEach(item => {
                if (!this.state.inventory.includes(item)) {
                    this.state.inventory.push(item);
                }
            });
            this.updateInventory();
        }
        
        // 处理标志设置
        if (option.flags) {
            Object.assign(this.state.flags, option.flags);
        }
        
        // 处理解谜成功
        puzzle.onSuccess(this);
        this.hidePuzzle();
    }
    
    // 初始化拖拽功能
    initDragAndDrop() {
        const puzzleContainer = document.getElementById('puzzle-container');
        if (!puzzleContainer) return;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        puzzleContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - puzzleContainer.getBoundingClientRect().left;
            offsetY = e.clientY - puzzleContainer.getBoundingClientRect().top;
            puzzleContainer.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                puzzleContainer.style.left = `${e.clientX - offsetX}px`;
                puzzleContainer.style.top = `${e.clientY - offsetY}px`;
                puzzleContainer.style.transform = 'none';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            puzzleContainer.style.cursor = 'move';
        });
    }
    
    // 显示结局
    showEnding(endingId) {
        const ending = this.endings[endingId];
        const endingTitle = document.getElementById('ending-title');
        const endingText = document.getElementById('ending-text');
        const endingContainer = document.getElementById('ending-container');
        
        if (endingTitle && endingText && endingContainer) {
            endingTitle.textContent = ending.title;
            endingText.textContent = ending.text;
            endingContainer.style.display = 'flex';
        }
    }
    
    // 显示恐惧结局（图片背景+结局文字）
    showFearEnding() {
        const ending = this.endings['death'];
        
        // 创建恐怖背景图片
        const fearBackground = document.createElement('div');
        fearBackground.id = 'fear-background';
        fearBackground.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://i.imgur.com/9X7Z7QH.jpg') center/cover no-repeat;
            z-index: 9998;
            animation: flash 0.8s ease-in-out;
        `;
        
        // 创建结局内容容器
        const endingContainer = document.createElement('div');
        endingContainer.id = 'fear-ending-container';
        endingContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.4);
            color: #ffffff;
            text-align: center;
            padding: 20px;
        `;
        
        // 创建结局标题
        const endingTitle = document.createElement('h2');
        endingTitle.id = 'fear-ending-title';
        endingTitle.style.cssText = `
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            color: #ff4444;
            animation: shake 0.5s ease-in-out;
        `;
        endingTitle.textContent = ending.title;
        
        // 创建结局文字
        const endingText = document.createElement('p');
        endingText.id = 'fear-ending-text';
        endingText.style.cssText = `
            font-size: 1.2em;
            max-width: 600px;
            line-height: 1.6;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            background: rgba(0, 0, 0, 0.6);
            padding: 20px;
            border-radius: 10px;
        `;
        endingText.textContent = ending.text;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flash {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
        
        // 组装元素
        endingContainer.appendChild(endingTitle);
        endingContainer.appendChild(endingText);
        document.body.appendChild(fearBackground);
        document.body.appendChild(endingContainer);
        
        // 播放恐怖音效（如果有）
        if (this.sounds && this.sounds.scare) {
            this.sounds.scare.play();
        }
    }
    
    // 切换场景
    changeScene(sceneId) {
        this.state.currentScene = sceneId;
        const sceneContainer = document.getElementById('scene-container');
        if (sceneContainer) {
            sceneContainer.style.backgroundImage = `url(${this.scenes[sceneId]})`;
        }
    }
    
    // 更新恐惧值
    updateFearLevel() {
        const fearValue = document.getElementById('fear-value');
        const fearProgress = document.getElementById('fear-progress');
        
        fearValue.textContent = this.state.fearLevel;
        fearProgress.style.width = `${this.state.fearLevel}%`;
        
        // 添加恐怖效果
        if (this.state.fearLevel > 70) {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.add('red-glow');
            }
        } else {
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.remove('red-glow');
            }
        }
    }
    
    // 更新道具栏
    updateInventory() {
        const inventoryContainer = document.getElementById('inventory-container');
        if (inventoryContainer) {
            inventoryContainer.innerHTML = '';
            
            this.state.inventory.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.textContent = item;
                inventoryContainer.appendChild(itemElement);
            });
        }
    }
    
    // 检查是否拥有道具
    hasItem(item) {
        const inventory = this.state.inventory || [];
        return inventory.includes(item);
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});