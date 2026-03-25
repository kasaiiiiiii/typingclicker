// --- 巨大数フォーマット関数 ---
function formatNumber(num) {
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad"];
    const suffixNum = Math.floor(Math.log10(num) / 3);
    if (suffixNum >= suffixes.length) return num.toExponential(2).replace('+', '');
    let shortValue = num / Math.pow(10, suffixNum * 3);
    let formatted = shortValue >= 100 ? shortValue.toFixed(0) : shortValue >= 10 ? shortValue.toFixed(1) : shortValue.toFixed(2);
    return parseFloat(formatted) + suffixes[suffixNum];
}

// --- UI ヘルパー ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 'bg-gray-800/95 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    toast.className = `${bg} border px-4 py-3 rounded-lg shadow-xl font-bold text-sm transition-all duration-300 transform translate-y-10 opacity-0 flex items-center`;
    
    let icon = type === 'error' ? '<i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i>' : '';
    toast.innerHTML = `${icon}${message}`;
    container.appendChild(toast);
    lucide.createIcons();
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function showModal(title, body) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    overlay.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('modal-content').classList.remove('scale-95');
        document.getElementById('modal-content').classList.add('scale-100');
    }, 10);
}

window.closeModal = () => {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-content').classList.remove('scale-100');
    document.getElementById('modal-content').classList.add('scale-95');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
};

// --- ゲーム起動処理 ---
let isGameStarted = false;
let lastTime = performance.now();

function startGame() {
    const titleScreen = document.getElementById('title-screen');
    titleScreen.style.opacity = '0';
    titleScreen.style.pointerEvents = 'none';
    setTimeout(() => {
        titleScreen.style.display = 'none';
        isGameStarted = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        document.dispatchEvent(new CustomEvent('gameStarted'));
    }, 1000);
}

// --- ゲームデータ設定 ---
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const TIERS = {
    1: { name: 'ノーマル', color: 'text-gray-400', multi: 1, cost: 100, maxLevel: 25 },
    2: { name: 'ブロンズ', color: 'text-orange-400', multi: 2, cost: 1000, maxLevel: 50 },
    3: { name: 'シルバー', color: 'text-slate-300', multi: 5, cost: 5000, maxLevel: 100 },
    4: { name: 'ゴールド', color: 'text-yellow-400', multi: 15, cost: 25000, maxLevel: 250 },
    5: { name: 'プラチナ', color: 'text-cyan-300', multi: 50, cost: 150000, maxLevel: 999 }
};

const WORD_TIERS = {
    1: { name: 'ノーマル', color: 'text-gray-400', multi: 1, evolveCostMulti: 1000, maxLevel: 25 },
    2: { name: 'ブロンズ', color: 'text-orange-400', multi: 2, evolveCostMulti: 10000, maxLevel: 50 },
    3: { name: 'シルバー', color: 'text-slate-300', multi: 5, evolveCostMulti: 50000, maxLevel: 100 },
    4: { name: 'ゴールド', color: 'text-yellow-400', multi: 15, evolveCostMulti: 250000, maxLevel: 250 },
    5: { name: 'プラチナ', color: 'text-cyan-300', multi: 50, evolveCostMulti: null, maxLevel: 999 }
};

const WORD_DATA = {
    "CAT":          { baseBonus: 10,    isDefault: true,  rarity: 'N'  , skill: { type:'crit_chance',         value:5,    desc:'単語完成時5%でWP2倍クリティカル' }},
    "DOG":          { baseBonus: 10,    isDefault: true,  rarity: 'N'  , skill: { type:'chest_drop',          value:2,    desc:'宝箱ドロップ率+2%' }},
    "BAT":          { baseBonus: 10,    isDefault: true,  rarity: 'N'  , skill: { type:'heat_decay_reduction',value:4,    desc:'ヒート減衰-4/s' }},
    "SUN":          { baseBonus: 15,    isDefault: true,  rarity: 'N'  , skill: { type:'wp_bonus',            value:0.08, desc:'全WP獲得+8%' }},
    "TREE":         { baseBonus: 25,    isDefault: false, rarity: 'N'  , skill: { type:'crystal_convert',     value:0.12, desc:'Crystal変換コスト-12%' }},
    "MOON":         { baseBonus: 30,    isDefault: false, rarity: 'R'  , skill: { type:'crystal_rate',        value:0.15, desc:'Crystal獲得量+15%' }},
    "WATER":        { baseBonus: 45,    isDefault: false, rarity: 'R'  , skill: { type:'heat_recover_bonus',  value:0.1,  desc:'ヒート回復量+10%' }},
    "SWORD":        { baseBonus: 50,    isDefault: false, rarity: 'R'  , skill: { type:'type_power',          value:0.2,  desc:'文字入力WP+20%' }},
    "PLANET":       { baseBonus: 80,    isDefault: false, rarity: 'SR' , skill: { type:'stardust_drop',       value:0.3,  desc:'Stardust直ドロップ+0.3%' }},
    "DRAGON":       { baseBonus: 120,   isDefault: false, rarity: 'SR' , skill: { type:'heat_cap',            value:2,    desc:'ヒート倍率上限+2' }},
    "CRYSTAL":      { baseBonus: 180,   isDefault: false, rarity: 'SR' , skill: { type:'crystal_rate',        value:0.25, desc:'Crystal獲得量+25%' }},
    "BEAUTIFUL":    { baseBonus: 300,   isDefault: false, rarity: 'SSR', skill: { type:'wp_bonus',            value:0.15, desc:'全WP獲得+15%' }},
    "ADVENTURE":    { baseBonus: 400,   isDefault: false, rarity: 'SSR', skill: { type:'quest_reward',        value:0.25, desc:'クエスト報酬+25%' }},
    "ASTRONAUT":    { baseBonus: 550,   isDefault: false, rarity: 'SSR', skill: { type:'auto_speed_bonus',    value:0.15, desc:'自動入力速度+15%' }},
    "MASTERPIECE":  { baseBonus: 1000,  isDefault: false, rarity: 'UR' , skill: { type:'final_multi_bonus',   value:0.5,  desc:'最終倍率+0.5' }},
    "UNIVERSE":     { baseBonus: 2500,  isDefault: false, rarity: 'UR' , skill: { type:'wp_bonus',            value:0.3,  desc:'全WP獲得+30%' }},
    "OMNIPOTENCE":  { baseBonus: 10000, isDefault: false, rarity: 'LR' , skill: { type:'skill_amplifier',     value:2,    desc:'全スキル効果×2（自身除く）' }},
    // --- 追加単語 ---
    "GHOST":        { baseBonus: 18,    isDefault: false, rarity: 'N'  , skill: { type:'chest_drop',          value:1.5,  desc:'宝箱ドロップ率+1.5%' }},
    "OCEAN":        { baseBonus: 20,    isDefault: false, rarity: 'N'  , skill: { type:'heat_recover_bonus',  value:0.08, desc:'ヒート回復量+8%' }},
    "STAR":         { baseBonus: 35,    isDefault: false, rarity: 'R'  , skill: { type:'auto_speed_bonus',    value:0.12, desc:'自動入力速度+12%' }},
    "WIND":         { baseBonus: 42,    isDefault: false, rarity: 'R'  , skill: { type:'crystal_convert',     value:0.10, desc:'Crystal変換コスト-10%' }},
    "STORM":        { baseBonus: 110,   isDefault: false, rarity: 'SR' , skill: { type:'heat_cap',            value:3,    desc:'ヒート倍率上限+3' }},
    "KNIGHT":       { baseBonus: 160,   isDefault: false, rarity: 'SR' , skill: { type:'crit_chance',         value:8,    desc:'単語完成時8%でWP2倍クリティカル' }},
    "GALAXY":       { baseBonus: 480,   isDefault: false, rarity: 'SSR', skill: { type:'wp_bonus',            value:0.18, desc:'全WP獲得+18%' }},
    "THUNDER":      { baseBonus: 520,   isDefault: false, rarity: 'SSR', skill: { type:'crystal_rate',        value:0.28, desc:'Crystal獲得量+28%' }},
    "ETERNITY":     { baseBonus: 3500,  isDefault: false, rarity: 'UR' , skill: { type:'final_multi_bonus',   value:0.8,  desc:'最終倍率+0.8' }},
    "APOCALYPSE":   { baseBonus: 18000, isDefault: false, rarity: 'LR' , skill: { type:'wp_bonus',            value:0.5,  desc:'全WP獲得+50%' }}
};

// ヒート専用単語（手動タイピング専用、倍率維持・ブースト用）
const HEAT_WORDS = {
    "HOT":      { heatRecover: 15,  baseWp: 50,      isDefault: true,  rarity: 'N'  , skill: { type:'heat_decay_reduction', value:2,    desc:'ヒート減衰-2/s' }},
    "FIRE":     { heatRecover: 20,  baseWp: 200,     isDefault: true,  rarity: 'N'  , skill: { type:'wp_bonus',             value:0.05, desc:'全WP獲得+5%' }},
    "ASH":      { heatRecover: 18,  baseWp: 120,     isDefault: true,  rarity: 'N'  , skill: { type:'chest_drop',           value:1,    desc:'宝箱ドロップ率+1%' }},
    "BURN":     { heatRecover: 25,  baseWp: 1000,    isDefault: false, rarity: 'R'  , skill: { type:'heat_wp_multi',        value:0.15, desc:'ヒートWP+15%' }},
    "SMOKE":    { heatRecover: 22,  baseWp: 800,     isDefault: false, rarity: 'R'  , skill: { type:'crit_chance',          value:4,    desc:'クリティカル率+4%' }},
    "HEAT":     { heatRecover: 30,  baseWp: 5000,    isDefault: false, rarity: 'SR' , skill: { type:'heat_recover_bonus',   value:0.12, desc:'ヒート回復量+12%' }},
    "BLAZE":    { heatRecover: 40,  baseWp: 20000,   isDefault: false, rarity: 'SR' , skill: { type:'auto_speed_bonus',     value:0.12, desc:'自動入力速度+12%' }},
    "LAVA":     { heatRecover: 35,  baseWp: 12000,   isDefault: false, rarity: 'SR' , skill: { type:'crystal_rate',         value:0.18, desc:'Crystal獲得量+18%' }},
    "FLAME":    { heatRecover: 50,  baseWp: 80000,   isDefault: false, rarity: 'SSR', skill: { type:'heat_wp_multi',        value:0.25, desc:'ヒートWP+25%' }},
    "TORCH":    { heatRecover: 45,  baseWp: 60000,   isDefault: false, rarity: 'SSR', skill: { type:'crystal_rate',         value:0.22, desc:'Crystal獲得量+22%' }},
    "MAGMA":    { heatRecover: 70,  baseWp: 300000,  isDefault: false, rarity: 'UR' , skill: { type:'heat_cap',             value:2,    desc:'ヒート倍率上限+2' }},
    "VOLCANO":  { heatRecover: 75,  baseWp: 500000,  isDefault: false, rarity: 'UR' , skill: { type:'chest_drop',           value:3,    desc:'宝箱ドロップ率+3%' }},
    "INFERNO":  { heatRecover: 100, baseWp: 1500000, isDefault: false, rarity: 'LR' , skill: { type:'heat_wp_multi',        value:0.5,  desc:'ヒートWP+50%' }},
    "SUPERNOVA":{ heatRecover: 120, baseWp: 5000000, isDefault: false, rarity: 'LR' , skill: { type:'wp_bonus',             value:0.3,  desc:'全WP獲得+30%' }}
};

// --- ガチャ設定 ---
const RARITY_COLORS = {
    N:   { label: 'N',   color: 'text-gray-400',   bg: 'bg-gray-700',      border: 'border-gray-500'  },
    R:   { label: 'R',   color: 'text-blue-400',   bg: 'bg-blue-900/50',   border: 'border-blue-500'  },
    SR:  { label: 'SR',  color: 'text-purple-400', bg: 'bg-purple-900/50', border: 'border-purple-500'},
    SSR: { label: 'SSR', color: 'text-yellow-400', bg: 'bg-yellow-900/40', border: 'border-yellow-400'},
    UR:  { label: 'UR',  color: 'text-pink-400',   bg: 'bg-pink-900/40',   border: 'border-pink-400'  },
    LR:  { label: 'LR',  color: 'text-cyan-300',   bg: 'bg-cyan-900/40',   border: 'border-cyan-300'  },
};

const WORD_GACHA_POOLS = {
    wp: {
        name: 'ワードガチャ',   cost1: 3000,  cost10: 27000,  cost100: 270000,
        currency: 'wp', icon: 'coins', color: 'text-yellow-400',
        btnClass: 'bg-yellow-700 hover:bg-yellow-600 border-yellow-500',
        rates: { N: 45, R: 30, SR: 17, SSR: 6, UR: 2, LR: 0 },
        pool: null // filled after WORD_DATA defined
    },
    crystal: {
        name: 'プレミアムガチャ', cost1: 5,   cost10: 45,    cost100: 450,
        currency: 'crystal', icon: 'diamond', color: 'text-cyan-400',
        btnClass: 'bg-cyan-800 hover:bg-cyan-700 border-cyan-500',
        rates: { N: 0, R: 10, SR: 35, SSR: 35, UR: 18, LR: 2 },
        pool: null
    }
};
WORD_GACHA_POOLS.wp.pool = Object.keys(WORD_DATA).filter(k => ['N','R','SR','SSR','UR'].includes(WORD_DATA[k].rarity));
WORD_GACHA_POOLS.crystal.pool = Object.keys(WORD_DATA).filter(k => ['R','SR','SSR','UR','LR'].includes(WORD_DATA[k].rarity));

const HEAT_GACHA_POOL = {
    name: 'ヒートガチャ', cost1: 5000, cost10: 45000, cost100: 450000,
    currency: 'wp', icon: 'flame', color: 'text-orange-400',
    btnClass: 'bg-orange-800 hover:bg-orange-700 border-orange-500',
    rates: { N: 40, R: 30, SR: 20, SSR: 7, UR: 2.5, LR: 0.5 },
    pool: Object.keys(HEAT_WORDS)
};
const GACHA_PITY_LIMIT = 100;
// ===== 転生ポイントショップ =====
const PRESTIGE_UPGRADES = {
    wpMulti:      { id:'wpMulti',      name:'WP獲得倍率',       icon:'zap',          color:'text-yellow-400', desc:'全WP獲得に倍率をかける',        baseCost:1, costMult:1.15, maxLevel:50, valuePerLevel:0.15, unit:'x' },
    baseWp:       { id:'baseWp',       name:'基礎WP増加',        icon:'coins',        color:'text-green-400',  desc:'文字入力の基礎WPを増加する',     baseCost:1, costMult:1.12, maxLevel:50, valuePerLevel:30,   unit:'+' },
    chestDrop:    { id:'chestDrop',    name:'宝箱ドロップ率',    icon:'box',          color:'text-amber-400',  desc:'宝箱のドロップ率を増加する',     baseCost:2, costMult:1.18, maxLevel:30, valuePerLevel:1.0,  unit:'%+' },
    heatMulti:    { id:'heatMulti',    name:'ヒート倍率上限',    icon:'flame',        color:'text-orange-400', desc:'ヒートMAX時の倍率上限を増加する', baseCost:2, costMult:1.18, maxLevel:30, valuePerLevel:1,    unit:'+' },
    crystalBonus: { id:'crystalBonus', name:'Crystal獲得量',     icon:'diamond',      color:'text-cyan-400',   desc:'Crystal獲得倍率を増加する',       baseCost:2, costMult:1.18, maxLevel:30, valuePerLevel:0.1,  unit:'x+' },
    stardustDrop: { id:'stardustDrop', name:'Stardust直ドロップ',icon:'sparkles',     color:'text-pink-400',   desc:'Stardust直接ドロップ率を増加する',baseCost:3, costMult:1.20, maxLevel:20, valuePerLevel:0.2,  unit:'%+' },
    gachaDiscount:{ id:'gachaDiscount',name:'ガチャコスト割引',  icon:'ticket',       color:'text-purple-400', desc:'全ガチャのコストを削減する',       baseCost:2, costMult:1.20, maxLevel:20, valuePerLevel:0.03, unit:'%-' },
    // === 上限解放系 ===
    relicCap:     { id:'relicCap',     name:'宝箱強化上限解放',  icon:'box',          color:'text-amber-400',  desc:'全宝箱強化の上限を+10する（最大100）', baseCost:3, costMult:1.40, maxLevel:9,  valuePerLevel:10,   unit:'cap' },
    artifactCap:  { id:'artifactCap',  name:'上位強化上限解放',  icon:'sparkles',     color:'text-cyan-400',   desc:'上位強化（自動入力以外）の上限を+3する', baseCost:4, costMult:1.20, maxLevel:30, valuePerLevel:3,    unit:'cap' },
    ultimateCap:  { id:'ultimateCap',  name:'究極強化上限解放',  icon:'crown',        color:'text-pink-400',   desc:'究極強化の上限を+3する',         baseCost:5, costMult:1.22, maxLevel:30, valuePerLevel:3,    unit:'cap' },
    wordLevelCap: { id:'wordLevelCap', name:'単語レベル上限解放',icon:'book-open',    color:'text-green-400',  desc:'全ティアの単語最大レベルを+5する', baseCost:3, costMult:1.18, maxLevel:30, valuePerLevel:5,    unit:'cap' },
};

// ===== クエストテンプレート =====
const QUEST_TEMPLATES = [
    { id:'w50',   stat:'words',   target:50,     reward:{crystal:30},           label:'単語を50回完成させる',      icon:'book-open',   color:'text-green-400'  },
    { id:'w200',  stat:'words',   target:200,    reward:{crystal:120},          label:'単語を200回完成させる',     icon:'book-open',   color:'text-green-400'  },
    { id:'w1k',   stat:'words',   target:1000,   reward:{crystal:600},          label:'単語を1000回完成させる',    icon:'book-open',   color:'text-green-400'  },
    { id:'w5k',   stat:'words',   target:5000,   reward:{stardust:1},           label:'単語を5000回完成させる',    icon:'book-open',   color:'text-green-400'  },
    { id:'h20',   stat:'heat',    target:20,     reward:{crystal:50},           label:'ヒートを20回完成させる',    icon:'flame',       color:'text-orange-400' },
    { id:'h100',  stat:'heat',    target:100,    reward:{stardust:1},           label:'ヒートを100回完成させる',   icon:'flame',       color:'text-orange-400' },
    { id:'h500',  stat:'heat',    target:500,    reward:{stardust:3},           label:'ヒートを500回完成させる',   icon:'flame',       color:'text-orange-400' },
    { id:'g5',    stat:'gacha',   target:5,      reward:{chest:2},              label:'ガチャを5回引く',           icon:'sparkles',    color:'text-purple-400' },
    { id:'g30',   stat:'gacha',   target:30,     reward:{crystal:100},          label:'ガチャを30回引く',          icon:'sparkles',    color:'text-purple-400' },
    { id:'g100',  stat:'gacha',   target:100,    reward:{stardust:1},           label:'ガチャを100回引く',         icon:'sparkles',    color:'text-purple-400' },
    { id:'wp1m',  stat:'wp',      target:1e6,    reward:{crystal:20},           label:'WPを100万稼ぐ',             icon:'coins',       color:'text-yellow-400' },
    { id:'wp100m',stat:'wp',      target:1e8,    reward:{crystal:200},          label:'WPを1億稼ぐ',               icon:'coins',       color:'text-yellow-400' },
    { id:'wp10b', stat:'wp',      target:1e10,   reward:{stardust:2},           label:'WPを100億稼ぐ',             icon:'coins',       color:'text-yellow-400' },
    { id:'chest3',stat:'chests',  target:3,      reward:{deckEditItems:5},      label:'宝箱を3個入手する',         icon:'box',         color:'text-amber-400'  },
    { id:'p1',    stat:'prestige',target:1,      reward:{stardust:5},           label:'転生する',                  icon:'refresh-cw',  color:'text-rose-400'   },
    { id:'p3',    stat:'prestige',target:3,      reward:{stardust:15},          label:'3回転生する',               icon:'refresh-cw',  color:'text-rose-400'   },
];

// ===== 実績定義 =====
const ACHIEVEMENT_DEFS = [
    { id:'first_word',  label:'最初の一言',       desc:'初めて単語を完成させた',          check:s=>s.words>=1,          reward:{crystal:5}     },
    { id:'words_100',   label:'タイパー',          desc:'単語を100回完成させた',           check:s=>s.words>=100,        reward:{crystal:20}    },
    { id:'words_1k',    label:'打鍵の使い手',      desc:'単語を1000回完成させた',          check:s=>s.words>=1000,       reward:{crystal:100}   },
    { id:'words_10k',   label:'タイピングマスター', desc:'単語を10000回完成させた',         check:s=>s.words>=10000,      reward:{crystal:500}   },
    { id:'collect_5',   label:'コレクター',         desc:'5種類の単語を解放した',           check:s=>s.unlockedWords>=5,  reward:{chest:1}       },
    { id:'collect_all', label:'単語の覇者',         desc:'全メイン単語を解放した',          check:s=>s.unlockedWords>=27, reward:{stardust:3}    },
    { id:'gacha_50',    label:'ガチャ中毒',         desc:'累計50回ガチャを引いた',          check:s=>s.gacha>=50,         reward:{crystal:50}    },
    { id:'gacha_500',   label:'ガチャの覇者',       desc:'累計500回ガチャを引いた',         check:s=>s.gacha>=500,        reward:{stardust:2}    },
    { id:'heat_max',    label:'炎の使い手',         desc:'ヒートゲージを100まで上げた',     check:s=>s.reachedHeatMax,    reward:{crystal:30}    },
    { id:'wp_billion',  label:'ビリオネア',         desc:'総獲得WP10億を突破した',          check:s=>s.totalWp>=1e9,      reward:{stardust:1}    },
    { id:'prestige_1',  label:'転生者',             desc:'初めて転生した',                  check:s=>s.prestige>=1,       reward:{stardust:5}    },
    { id:'prestige_5',  label:'古き者',             desc:'5回転生した',                     check:s=>s.prestige>=5,       reward:{stardust:20}   },
    { id:'omnipotence', label:'全知全能',            desc:'OMNIPOTENCEを解放した',           check:s=>s.hasOmnipotence,    reward:{stardust:10}   },
    { id:'crit_10',     label:'クリティカルマスター',desc:'クリティカルを10回発生させた',    check:s=>s.crits>=10,         reward:{crystal:40}    },
    { id:'game_master', label:'⚡ ゲーム覇者',        desc:'全上限解放・全要素をレベルMAXにした',check:s=>s.gameMaster===true, reward:{stardust:100}  },
];


const ARTIFACTS = {
    autoType: { id: 'autoType', name: '自動書記のペン', desc: '一定間隔でメイン単語を自動入力。', baseCost: 10, maxLevel: 10 },
    crystalYield: { id: 'crystalYield', name: '豊穣のプリズム', desc: '1回でドロップするクリスタルの基礎個数が増加する。', baseCost: 1, maxLevel: 10 },
    bonusMulti: { id: 'bonusMulti', name: '知識のルーペ', desc: '単語完成時のボーナスWPが増加する。', baseCost: 2, maxLevel: 5 },
    dropRate: { id: 'dropRate', name: '幸運のクローバー', desc: '単語完成時のクリスタル発見率が上がる。', baseCost: 3, maxLevel: 5 },
    typePower: { id: 'typePower', name: '黄金のキーボード', desc: '文字入力時の獲得WPが増加する。', baseCost: 5, maxLevel: 5 },
    limitBreak: { id: 'limitBreak', name: '(非表示)', desc: '', baseCost: 999, maxLevel: 0 }
};

const ULTIMATES = {
    basePower: { id: 'basePower', name: '星の刻印', desc: '文字の獲得WP基礎値を+50する。', baseCost: 1, maxLevel: 20 },
    finalMulti: { id: 'finalMulti', name: '宇宙の真理', desc: '最終的な獲得WP総量に強力な倍率をかける。', baseCost: 3, maxLevel: 10 },
    eternalFlame: { id: 'eternalFlame', name: '永遠の炎',     desc: 'ヒートの減衰速度を大幅に下げる。最大Lvでほぼ0にできる。',   baseCost: 5,  maxLevel: 10 },
    fusionHeart:  { id: 'fusionHeart',  name: '核融合の心臓', desc: 'ヒートMAX時の倍率上限を引き上げる。最大Lvで20倍に到達できる。', baseCost: 8,  maxLevel: 10 },
    limitBreak: { id: 'limitBreak', name: '(非表示)', desc: '', baseCost: 999, maxLevel: 0 }
};

const TABS = [
    { id: 'letters', icon: 'arrow-up-circle', label: '文字強化', activeClass: 'border-blue-400 text-blue-400 bg-blue-400/10' },
    { id: 'words', icon: 'sparkle', label: '単語ガチャ', activeClass: 'border-green-400 text-green-400 bg-green-400/10' },
    { id: 'artifacts', icon: 'sparkles', label: '上位強化', activeClass: 'border-cyan-400 text-cyan-400 bg-cyan-400/10' },
    { id: 'ultimates', icon: 'crown', label: '究極強化', activeClass: 'border-pink-400 text-pink-400 bg-pink-400/10' },
    { id: 'relics', icon: 'box', label: '宝箱', activeClass: 'border-amber-400 text-amber-400 bg-amber-400/10' },
    { id: 'quests', icon: 'scroll-text', label: 'クエスト', activeClass: 'border-emerald-400 text-emerald-400 bg-emerald-400/10' },
    { id: 'prestige', icon: 'refresh-cw', label: '転生', activeClass: 'border-rose-400 text-rose-400 bg-rose-400/10' },
    { id: 'deck', icon: 'list-checks', label: 'デッキ', activeClass: 'border-yellow-400 text-yellow-400 bg-yellow-400/10' }
];

// --- グローバルステート ---
let wp = 0;
let crystal = 0;
let stardust = 0;
let letters = {};
ALPHABET.forEach(char => letters[char] = { level: 1, tier: 1 });

let wordsState = {};
Object.keys(WORD_DATA).forEach(word => {
    wordsState[word] = { unlocked: WORD_DATA[word].isDefault, inDeck: WORD_DATA[word].isDefault, level: 1, tier: 1, overflowBonus: 0 };
});

// ガチャ天井カウンター
let wordGachaPityWp = 0;
let wordGachaPityCrystal = 0;
let heatGachaPity = 0;

let heatWordsState = {};
Object.keys(HEAT_WORDS).forEach(word => {
    heatWordsState[word] = { unlocked: HEAT_WORDS[word].isDefault, inDeck: HEAT_WORDS[word].isDefault, overflowBonus: 0 };
});

let artifacts = { autoType: 0, crystalYield: 0, bonusMulti: 0, dropRate: 0, typePower: 0, limitBreak: 0 };
let ultimates = { basePower: 0, finalMulti: 0, limitBreak: 0 , eternalFlame: 0, fusionHeart: 0 };

let heat = 0; // 0 ~ 100
let chestCount = 0;
let deckEditItems = 0; // デッキ編成チケット

let relics = {
    wpMulti: 0,
    heatKeep: 0,
    crystalMulti: 0,
    autoSpeed: 0,
    stardustDrop: 0,
    heatOn: false
};


// ===== 転生・クエスト・スキル用ステート =====
let prestigeCount = 0;
let prestigePoints = 0;          // 未使用の残りPP
let prestigeUpgrades = { wpMulti:0, baseWp:0, chestDrop:0, heatMulti:0, crystalBonus:0, stardustDrop:0, gachaDiscount:0, relicCap:0, artifactCap:0, ultimateCap:0, wordLevelCap:0 };
let totalWpEarned = 0;           // ライフタイム累計WP

// ライフタイム統計（転生でリセットしない）
let lifetimeStats = {
    words: 0,
    gacha: 0,
    prestige: 0,
    reachedHeatMax: false,
    totalWp: 0,
    unlockedWords: 4,   // デフォルト4語
    hasOmnipotence: false,
    crits: 0,
};

// クエスト進捗（値は「クエスト生成時点からの差分」で計算）
let questProgress = { words:0, heat:0, gacha:0, wp:0, chests:0, prestige:0 };
// アクティブクエスト: [{templateId, startValues:{stat:val}, claimed:bool}]
let activeQuests = [];
// 実績: {id: 'claimed'|'unlocked'}
let achievementState = {};
// メインワード状態
let currentWordKey = "CAT";
let typedCount = 0;

// ヒートワード状態
let currentHeatWordKey = "HOT";
let heatTypedCount = 0;

let activeTab = 'letters';
let buyMode = '1';
let autoTypeProgress = 0;

let heatBarEl, heatMultiEl, typingBoxEl;


// ===== 単語スキル計算 =====
function getActiveSkillEffects() {
    const deckWords = getActiveDeck();
    const hasOmnipotence = deckWords.includes('OMNIPOTENCE') && wordsState['OMNIPOTENCE']?.unlocked;
    const amp = hasOmnipotence ? 2 : 1;
    const e = { wp_bonus:0, crystal_rate:0, heat_decay_reduction:0, heat_recover_bonus:0,
                crit_chance:0, chest_drop:0, type_power:0, stardust_drop:0,
                heat_cap:0, final_multi_bonus:0, auto_speed_bonus:0, quest_reward:0,
                crystal_convert:0, heat_wp_multi:0 };
    // メインデッキのスキル
    deckWords.forEach(k => {
        const skill = WORD_DATA[k]?.skill;
        if (!skill || !wordsState[k]?.unlocked || k === 'OMNIPOTENCE') return;
        e[skill.type] = (e[skill.type] || 0) + skill.value * amp;
    });
    // ヒートデッキのスキル
    getActiveHeatDeck().forEach(k => {
        const skill = HEAT_WORDS[k]?.skill;
        if (!skill || !heatWordsState[k]?.unlocked) return;
        e[skill.type] = (e[skill.type] || 0) + skill.value * amp;
    });
    return e;
}


const getPrestigeUpgradeCost = (id) => {
    const u = PRESTIGE_UPGRADES[id];
    return Math.ceil(u.baseCost * Math.pow(u.costMult, prestigeUpgrades[id]));
};
const getPrestigeUpgradeValue = (id) => PRESTIGE_UPGRADES[id].valuePerLevel * prestigeUpgrades[id];
const getPrestigeWpMulti    = () => 1 + getPrestigeUpgradeValue('wpMulti');
const getPrestigeBaseWp     = () => getPrestigeUpgradeValue('baseWp');
const getPrestigeChestBonus = () => getPrestigeUpgradeValue('chestDrop');
const getPrestigeHeatBonus  = () => getPrestigeUpgradeValue('heatMulti');
const getPrestigeCrystalMult= () => 1 + getPrestigeUpgradeValue('crystalBonus');
const getPrestigeStarBonus  = () => getPrestigeUpgradeValue('stardustDrop');
const getPrestigeGachaDisc  = () => getPrestigeUpgradeValue('gachaDiscount');


// 転生閾値
function getPrestigeThreshold(count) {
    return Math.floor(1e9 * Math.pow(2, count));
}

// クエスト: 現在の進捗を取得（クエストの起点値との差分）
function getQuestCurrent(q) {
    const t = QUEST_TEMPLATES.find(t => t.id === q.templateId);
    if (!t) return 0;
    const cur = questProgress[t.stat] || 0;
    return Math.min(t.target, cur - (q.startValues[t.stat] || 0));
}

// クエスト生成（5つランダム）
function generateQuests() {
    const pool = QUEST_TEMPLATES.slice();
    activeQuests = [];
    const used = new Set();
    // 既にクレーム済みのクエストも除外しない（繰り返せる）
    for (let i = 0; i < 5 && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const t = pool.splice(idx, 1)[0];
        activeQuests.push({
            templateId: t.id,
            startValues: { [t.stat]: questProgress[t.stat] || 0 },
            claimed: false
        });
    }
}


function checkGameMaster() {
    // 全転生上限解放がMAX
    const capMaxed =
        prestigeUpgrades.relicCap    >= 9  &&
        prestigeUpgrades.artifactCap >= 30 &&
        prestigeUpgrades.ultimateCap >= 30 &&
        prestigeUpgrades.wordLevelCap>= 30;

    // 全宝箱強化がMAX(100)
    const relicMaxed =
        relics.wpMulti    >= 100 &&
        relics.crystalMulti >= 100 &&
        relics.autoSpeed  >= 100 &&
        relics.heatKeep   >= 100 &&
        relics.stardustDrop >= 100;

    // 全上位強化がMAX（autoType・limitBreak除く）
    const artifactMaxed = ['crystalYield','bonusMulti','dropRate','typePower'].every(
        id => artifacts[id] >= getArtifactMaxLevel(id)
    ) && artifacts.autoType >= ARTIFACTS.autoType.maxLevel;

    // 全究極強化がMAX（limitBreak除く）
    const ultimateMaxed = ['basePower','finalMulti','eternalFlame','fusionHeart'].every(
        id => ultimates[id] >= getUltimateMaxLevel(id)
    );

    // 全文字がTier5・Lv999
    const lettersMaxed = ALPHABET.every(
        c => letters[c].tier >= 5 && letters[c].level >= TIERS[5].maxLevel
    );

    // 全単語がTier5・最大Lv
    const wordsMaxed = Object.keys(WORD_DATA).every(k => {
        const s = wordsState[k];
        return s.unlocked && s.tier >= 5 && s.level >= getWordTierMaxLevel(5);
    });

    // 全転生PPショップがMAX
    const prestigeShopMaxed = Object.values(PRESTIGE_UPGRADES).every(
        u => prestigeUpgrades[u.id] >= u.maxLevel
    );

    lifetimeStats.gameMaster =
        capMaxed && relicMaxed && artifactMaxed && ultimateMaxed &&
        lettersMaxed && wordsMaxed && prestigeShopMaxed;
}
// 実績チェック（毎回呼ぶ）
function checkAchievements() {
    checkGameMaster();
    let anyNew = false;
    ACHIEVEMENT_DEFS.forEach(def => {
        if (achievementState[def.id]) return;
        if (def.check(lifetimeStats)) {
            achievementState[def.id] = 'unlocked';
            anyNew = true;
            // 自動クレーム
            claimAchievement(def.id, true);
        }
    });
    return anyNew;
}

function claimAchievement(id, silent = false) {
    const def = ACHIEVEMENT_DEFS.find(d => d.id === id);
    if (!def || achievementState[id] === 'claimed') return;
    achievementState[id] = 'claimed';
    const r = def.reward;
    if (r.crystal)       crystal += r.crystal;
    if (r.stardust)      stardust += r.stardust;
    if (r.chest)         chestCount += r.chest;
    if (r.deckEditItems) deckEditItems += r.deckEditItems;
    if (!silent) showToast(`🏆 実績解除: ${def.label}`, 'success');
}
// --- 計算関数 ---
const getActiveDeck = () => Object.keys(wordsState).filter(w => wordsState[w].inDeck);
const getActiveHeatDeck = () => Object.keys(heatWordsState).filter(w => heatWordsState[w].inDeck);

const getLetterUpgradeCost = (level) => 10 + level * 5;
const getWordTierMaxLevel = (tier) => {
    const base = WORD_TIERS[tier].maxLevel;
    return base + prestigeUpgrades.wordLevelCap * 5;
};
const getWordBonus = (wordKey) => {
    const base = WORD_DATA[wordKey].baseBonus * wordsState[wordKey].level * WORD_TIERS[wordsState[wordKey].tier].multi;
    const overflow = wordsState[wordKey].overflowBonus || 0;
    return base * (1 + overflow * 0.02); // overflow 1回につき+2%
};
const getWordUpgradeCost = (wordKey) => WORD_DATA[wordKey].baseBonus * 10 * wordsState[wordKey].level * WORD_TIERS[wordsState[wordKey].tier].multi;
const getWordEvolveCost = (wordKey) => {
    const tierInfo = WORD_TIERS[wordsState[wordKey].tier];
    return tierInfo.evolveCostMulti ? WORD_DATA[wordKey].baseBonus * tierInfo.evolveCostMulti : Infinity;
};

const getHeatWordBonus = (wordKey) => {
    const overflow = (heatWordsState[wordKey] && heatWordsState[wordKey].overflowBonus) || 0;
    const sfx = getActiveSkillEffects();
    const effectiveWp = HEAT_WORDS[wordKey].baseWp * (1 + overflow * 0.02) * (1 + sfx.heat_wp_multi);
    return Math.floor(effectiveWp * getBonusMultiplier() * getUltimateFinalMulti() * getRelicWpMulti() * getHeatMultiplier());
};

const getArtifactMaxLevel = (id) => {
    if (id === 'autoType') return ARTIFACTS.autoType.maxLevel; // 自動入力は転生無関係
    if (id === 'limitBreak') return 0; // 非表示（limitBreakは廃止）
    return ARTIFACTS[id].maxLevel + prestigeUpgrades.artifactCap * 3;
};
const getUltimateMaxLevel = (id) => {
    if (id === 'limitBreak') return 0; // 非表示（limitBreakは廃止）
    return ULTIMATES[id].maxLevel + prestigeUpgrades.ultimateCap * 3;
};

const getHeatMultiplier = () => {
    const skillFx = getActiveSkillEffects();
    return 1 + (heat / 100) * (9 + ultimates.fusionHeart + skillFx.heat_cap + getPrestigeHeatBonus());
};
const getRelicCapBase = () => 10 + prestigeUpgrades.relicCap * 10; // 10〜100
const getRelicMaxLevel = (stat) => Math.min(100, getRelicCapBase());
const getRelicWpMulti = () => 1 + (relics.wpMulti * 0.2);
const getRelicCrystalMulti = () => (1 + (relics.crystalMulti * 0.1)) * getPrestigeCrystalMult();
const getRelicStardustDropRate = () => relics.stardustDrop * 0.5 + getPrestigeStarBonus();
const getRelicAutoSpeedMulti = () => {
    const skillFx = getActiveSkillEffects();
    return 1 + (relics.autoSpeed * 0.2) + skillFx.auto_speed_bonus;
};

const getBonusMultiplier = () => 1 + (artifacts.bonusMulti * 0.5);
const getDropRateBonus = () => artifacts.dropRate * 5;
const getTypeMultiplier = () => {
    const skillFx = getActiveSkillEffects();
    return 1 + (artifacts.typePower * 0.2) + skillFx.type_power;
};
const getUltimateBasePower = () => ultimates.basePower * 50 + getPrestigeBaseWp();
const getUltimateFinalMulti = () => {
    const skillFx = getActiveSkillEffects();
    return 1 + ultimates.finalMulti + skillFx.final_multi_bonus;
};


// --- ゲームループ (自動入力・ヒート減衰) ---
function gameLoop(time) {
    if (!isGameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }
    const dt = time - lastTime;
    lastTime = time;

    // ヒート減衰処理 (毎秒)
    const _skillFxLoop = getActiveSkillEffects();
    let decayRate = 15; // 基本減衰
    decayRate -= relics.heatKeep * 1.0;
    decayRate -= ultimates.eternalFlame * 1.5;
    decayRate -= _skillFxLoop.heat_decay_reduction;
    decayRate = Math.max(0.5, decayRate); // 最低0.5

    if (heat > 0) {
        heat -= (decayRate * dt) / 1000;
        if (heat < 0) heat = 0;
        updateHeatUI();
    }

    // 自動入力処理 (メイン単語のみ進める)
    if (artifacts.autoType > 0) {
        const autoSpeedBase = artifacts.autoType;
        const autoSpeedMulti = getRelicAutoSpeedMulti();
        const charsPerSecond = autoSpeedBase * autoSpeedMulti;

        autoTypeProgress += charsPerSecond * (dt / 1000);
        while (autoTypeProgress >= 1) {
            autoTypeProgress -= 1;
            // 自動入力はメインのみ。ヒートは上がらない
            processMainWordType(currentWordKey[typedCount], false);
            partialRender();
        }
    }

    requestAnimationFrame(gameLoop);
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    heatBarEl = document.getElementById('heat-bar');
    heatMultiEl = document.getElementById('heat-multi-display');
    typingBoxEl = document.getElementById('typing-box');
    generateQuests();
    checkAchievements();
    drawWord();
    drawHeatWord();
    fullRender();
});

// --- レンダー関数 ---
function fullRender() {
    updateLeftPane();
    updateHeatUI();
    updateTabNav();
    updateBuyModeButton();
    updateRightPaneContent();
    lucide.createIcons();
}

function partialRender() {
    updateLeftPane();
    updateRightPaneButtons();
}

function updateHeatUI() {
    if(!heatBarEl) return;
    heatBarEl.style.width = `${heat}%`;
    const multi = getHeatMultiplier();
    heatMultiEl.textContent = `x${multi.toFixed(2)}`;
    
    if (heat > 80) {
        typingBoxEl.classList.add('heat-glow');
    } else {
        typingBoxEl.classList.remove('heat-glow');
    }
}

function updateBuyModeButton() {
    const btn = document.getElementById('btn-buy-mode');
    if (buyMode === '1') {
        btn.innerHTML = `<i data-lucide="mouse-pointer-click" class="w-4 h-4 mr-1"></i> 1回ずつ`;
        btn.className = "bg-blue-600 hover:bg-blue-500 border border-blue-400 rounded px-4 py-1.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-inner flex items-center";
    } else {
        btn.innerHTML = `<i data-lucide="zap" class="w-4 h-4 mr-1 text-yellow-300"></i> MAX一括`;
        btn.className = "bg-purple-700 hover:bg-purple-600 border border-purple-400 rounded px-4 py-1.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-inner flex items-center";
    }
}

function updateLeftPane() {
    document.getElementById('wp-display').textContent = formatNumber(wp);
    document.getElementById('crystal-display').textContent = formatNumber(crystal);
    document.getElementById('stardust-display').textContent = formatNumber(stardust);

    const finalMultiContainer = document.getElementById('final-multi-display');
    const _sfxLeft = getActiveSkillEffects();
    const hasAnyBonus = ultimates.finalMulti > 0 || relics.wpMulti > 0 || prestigeUpgrades.wpMulti > 0 || _sfxLeft.wp_bonus > 0;
    if (hasAnyBonus) {
        finalMultiContainer.classList.remove('hidden');
        let text = [];
        if (ultimates.finalMulti > 0) text.push(`真理 <span class="text-white">x${getUltimateFinalMulti().toFixed(1)}</span>`);
        if (relics.wpMulti > 0)       text.push(`宝箱 <span class="text-white">x${getRelicWpMulti().toFixed(1)}</span>`);
        if (prestigeUpgrades.wpMulti > 0) text.push(`転生WP <span class="text-rose-300">×${getPrestigeWpMulti().toFixed(2)}</span>`);
        if (_sfxLeft.wp_bonus > 0)    text.push(`スキル <span class="text-purple-300">+${(_sfxLeft.wp_bonus*100).toFixed(0)}%</span>`);
        finalMultiContainer.innerHTML = `
            <span class="text-pink-300 text-xs sm:text-sm font-bold flex items-center justify-center flex-wrap gap-1">
                <i data-lucide="zap" class="w-4 h-4"></i> ${text.join(' / ')}
            </span>
        `;
    } else {
        finalMultiContainer.classList.add('hidden');
    }

    // メインワード表示
    const wordContainer = document.getElementById('word-display');
    wordContainer.innerHTML = currentWordKey.split('').map((char, index) => {
        let colorClass = "text-gray-600";
        if (index < typedCount) colorClass = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
        else if (index === typedCount) colorClass = "text-white border-b-4 border-yellow-400 pb-1";
        return `<span class="${colorClass} transition-all duration-75">${char}</span>`;
    }).join('');

    const baseBonus = getWordBonus(currentWordKey);
    const actualBonus = Math.floor((baseBonus * getBonusMultiplier()) * getUltimateFinalMulti() * getHeatMultiplier() * getRelicWpMulti());
    document.getElementById('bonus-display').textContent = `+${formatNumber(actualBonus)} WP`;

    // ヒートワード表示
    const heatWordContainer = document.getElementById('heat-word-display');
    heatWordContainer.innerHTML = currentHeatWordKey.split('').map((char, index) => {
        let colorClass = "text-gray-700";
        if (index < heatTypedCount) colorClass = "text-orange-500";
        else if (index === heatTypedCount) colorClass = "text-orange-200 border-b-4 border-orange-500 pb-1";
        return `<span class="${colorClass} transition-all duration-75">${char}</span>`;
    }).join('');

    const heatData = HEAT_WORDS[currentHeatWordKey];
    document.getElementById('heat-recover-display').textContent = `ヒート回復: +${heatData.heatRecover}`;
    document.getElementById('heat-bonus-display').textContent = `WPボーナス: +${formatNumber(getHeatWordBonus(currentHeatWordKey))}`;
}

function updateTabNav() {
    const navContainer = document.getElementById('tab-nav');
    navContainer.innerHTML = TABS.map(tab => {
        const isActive = activeTab === tab.id;
        let colorClass = isActive ? tab.activeClass : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800';
        
        let badge = '';
        if (tab.id === 'relics' && chestCount > 0) {
            badge = `<span class="absolute top-1 right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>`;
        }
        if (tab.id === 'deck' && deckEditItems > 0) {
            badge = `<span class="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-bold px-1 rounded-full">${deckEditItems}</span>`;
        }
        if (tab.id === 'quests') {
            const claimable = activeQuests.filter(q => !q.claimed && getQuestCurrent(q) >= (QUEST_TEMPLATES.find(t=>t.id===q.templateId)?.target||1)).length;
            const unclaimedAch = ACHIEVEMENT_DEFS.filter(d => achievementState[d.id] === 'unlocked').length;
            const total = claimable + unclaimedAch;
            if (total > 0) badge = `<span class="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1 rounded-full">${total}</span>`;
        }
        if (tab.id === 'prestige') {
            const threshold = getPrestigeThreshold(prestigeCount);
            if (totalWpEarned >= threshold) badge = `<span class="absolute top-1 right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>`;
        }

        return `
            <button onclick="setActiveTab('${tab.id}')" class="relative flex-1 py-3 px-1 flex flex-col items-center justify-center border-b-2 transition-colors ${colorClass}">
                ${badge}
                <i data-lucide="${tab.icon}" class="w-5 h-5"></i>
                <span class="text-[10px] sm:text-xs mt-1 font-bold whitespace-nowrap">${tab.label}</span>
            </button>
        `;
    }).join('');
}

function updateRightPaneContent() {
    const tabContent = document.getElementById('tab-content');
    const scrollPos = tabContent.scrollTop;
    let html = '';
    const isMaxMode = buyMode === 'MAX';

    if (activeTab === 'letters') {
        html += '<div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">';
        ALPHABET.forEach(char => {
            const data = letters[char];
            const tierInfo = TIERS[data.tier];
            const nextTierInfo = TIERS[data.tier + 1];
            const lvCost = getLetterUpgradeCost(data.level);
            const basePower = getUltimateBasePower();
            
            const baseWp = Math.floor(((data.level * tierInfo.multi) + basePower) * getTypeMultiplier() * getUltimateFinalMulti() * getRelicWpMulti());
            const isMaxLevel = data.level >= tierInfo.maxLevel;

            html += `
                <div class="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 flex flex-col">
                    <div class="flex justify-between items-end mb-3">
                        <div class="flex items-baseline">
                            <span class="text-2xl sm:text-3xl font-bold mr-2 ${tierInfo.color}">${char}</span>
                            <span class="text-xs text-gray-400">Lv.${data.level}/${tierInfo.maxLevel}</span>
                        </div>
                    </div>
                    <div class="text-green-400 text-xs sm:text-sm font-bold mb-3">+${formatNumber(baseWp)} WP <span class="text-[10px] text-gray-500">(基本)</span></div>
                    <div class="space-y-2 mt-auto">
                        <button id="btn-level-${char}" onclick="buyLetterLevel('${char}')" ${wp < lvCost || isMaxLevel ? 'disabled' : ''} class="w-full flex justify-between items-center px-2 py-2 ${isMaxMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50 rounded text-xs sm:text-sm transition-colors">
                            <span>${isMaxLevel ? '上限到達' : (isMaxMode ? '一括UP' : 'レベルUP')}</span>
                            ${!isMaxLevel ? `<span class="flex items-center text-yellow-400"><i data-lucide="coins" class="w-3 h-3 mr-1"></i>${formatNumber(lvCost)}</span>` : ''}
                        </button>
            `;
            if (nextTierInfo) {
                html += `
                        <button id="btn-tier-${char}" onclick="buyLetterTier('${char}')" ${wp < tierInfo.cost || !isMaxLevel ? 'disabled' : ''} class="w-full flex justify-between items-center px-2 py-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 disabled:opacity-50 rounded text-xs sm:text-sm transition-colors">
                            <span class="${nextTierInfo.color}">進化 (解放)</span>
                            <span class="flex items-center text-yellow-400"><i data-lucide="coins" class="w-3 h-3 mr-1"></i>${formatNumber(tierInfo.cost)}</span>
                        </button>
                `;
            } else {
                html += `<div class="w-full text-center px-2 py-2 bg-gray-900/50 rounded text-xs sm:text-sm text-gray-500 border border-gray-800">最終進化形態</div>`;
            }
            html += `</div></div>`;
        });
        html += '</div>';

    } else if (activeTab === 'words') {
        // === ガチャタブ ===
        const unlockedWords = Object.keys(wordsState).filter(k => wordsState[k].unlocked);
        const unlockedHeat = Object.keys(heatWordsState).filter(k => heatWordsState[k].unlocked);

        // --- ガチャパネル ---
        const renderGachaBox = (poolId, pool, pity) => {
            const canAfford1 = pool.currency === 'wp' ? wp >= pool.cost1 : crystal >= pool.cost1;
            const canAfford10 = pool.currency === 'wp' ? wp >= pool.cost10 : crystal >= pool.cost10;
            const pityBar = Math.min(100, Math.floor(pity / GACHA_PITY_LIMIT * 100));
            const currencyIcon = pool.currency === 'wp' ? 'coins' : (pool.currency === 'crystal' ? 'diamond' : 'flame');
            const currencyColor = pool.currency === 'wp' ? 'text-yellow-400' : (pool.currency === 'crystal' ? 'text-cyan-400' : 'text-orange-400');
            return `
            <div class="bg-gray-800 rounded-2xl border border-gray-700 p-4 mb-4 shadow-lg">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-base font-black text-white flex items-center gap-2">
                        <i data-lucide="${pool.icon}" class="w-5 h-5 ${pool.color}"></i>
                        ${pool.name}
                    </h3>
                    <div class="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-700">
                        天井: ${pity} / ${GACHA_PITY_LIMIT}
                    </div>
                </div>
                <div class="grid grid-cols-5 gap-1 text-[10px] text-center mb-3">
                    ${Object.entries(pool.rates).filter(([,v])=>v>0).map(([r,v]) =>
                        `<div class="rounded px-1 py-0.5 ${RARITY_COLORS[r].bg} ${RARITY_COLORS[r].color} font-bold border ${RARITY_COLORS[r].border}">${r}<br>${v}%</div>`
                    ).join('')}
                </div>
                <div class="w-full bg-gray-900 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-yellow-500 to-pink-500 transition-all" style="width:${pityBar}%"></div>
                </div>
                <div class="flex gap-2">
                    <button onclick="pullGacha('${poolId}',1)" ${!canAfford1 ? 'disabled' : ''} class="flex-1 py-2.5 ${pool.btnClass} border disabled:opacity-40 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-1">
                        1回引く <i data-lucide="${currencyIcon}" class="w-3.5 h-3.5 ${currencyColor}"></i><span class="${currencyColor}">${formatNumber(pool.cost1)}</span>
                    </button>
                    <button onclick="pullGacha('${poolId}',10)" ${!canAfford10 ? 'disabled' : ''} class="flex-1 py-2.5 ${pool.btnClass} border disabled:opacity-40 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-1">
                        10連 <i data-lucide="${currencyIcon}" class="w-3.5 h-3.5 ${currencyColor}"></i><span class="${currencyColor}">${formatNumber(pool.cost10)}</span>
                    </button>
                </div>
                <div class="flex gap-2 mt-2">
                    ${(() => {
                        const canAfford100 = pool.currency === 'wp' ? wp >= pool.cost100 : crystal >= pool.cost100;
                        const disc = Math.min(0.5, getPrestigeGachaDisc());
                        const adjCost100 = Math.ceil(pool.cost100 * (1 - disc));
                        return `<button onclick="pullGacha('${poolId}',100)" ${!canAfford100 ? 'disabled' : ''} class="w-full py-2.5 ${pool.btnClass} border disabled:opacity-40 rounded-xl font-black text-sm text-white transition-all flex items-center justify-center gap-1 relative overflow-hidden">
                            <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></span>
                            <i data-lucide="zap" class="w-4 h-4 text-yellow-300"></i>100連 <i data-lucide="${currencyIcon}" class="w-3.5 h-3.5 ${currencyColor}"></i><span class="${currencyColor}">${formatNumber(adjCost100)}</span>
                            ${disc > 0 ? `<span class="text-[10px] text-green-300 ml-1">-${(disc*100).toFixed(0)}%</span>` : ''}
                        </button>`;
                    })()}

                </div>
            </div>`;
        };

        html += `<div class="max-w-2xl mx-auto space-y-2">`;
        html += renderGachaBox('wp',      WORD_GACHA_POOLS.wp,      wordGachaPityWp);
        html += renderGachaBox('crystal', WORD_GACHA_POOLS.crystal,  wordGachaPityCrystal);
        html += renderGachaBox('heat',    HEAT_GACHA_POOL,           heatGachaPity);

        // --- 所持単語一覧 (メイン) ---
        html += `
            <div class="mt-4">
                <h3 class="text-sm font-bold text-green-400 mb-2 flex items-center border-b border-gray-700 pb-2">
                    <i data-lucide="book-open" class="w-4 h-4 mr-2"></i>所持メイン単語 (${unlockedWords.length}/${Object.keys(WORD_DATA).length})
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        `;
        Object.keys(WORD_DATA).forEach((wordKey) => {
            const data = WORD_DATA[wordKey];
            const state = wordsState[wordKey];
            if (!state.unlocked) return; // 未解放は非表示
            const rInfo = RARITY_COLORS[data.rarity];
            const tierInfo = WORD_TIERS[state.tier];
            const nextTierInfo = WORD_TIERS[state.tier + 1];
            const baseBonus = Math.floor((getWordBonus(wordKey) * getBonusMultiplier()) * getUltimateFinalMulti() * getRelicWpMulti());
            const isMaxLevel = state.level >= getWordTierMaxLevel(state.tier);
            const overflow = state.overflowBonus || 0;
            {
                const upCost = getWordUpgradeCost(wordKey);
                html += `
                <div class="p-3 rounded-xl border ${rInfo.border}/40 bg-gray-800 flex flex-col gap-1.5">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-1.5 py-0.5 rounded ${rInfo.bg} ${rInfo.color} border ${rInfo.border}">${data.rarity}</span>
                        <span class="font-black tracking-widest ${tierInfo.color} text-base">${wordKey}</span>
                        <span class="ml-auto text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">Lv.${state.level}/${getWordTierMaxLevel(state.tier)}</span>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="text-green-400">+${formatNumber(baseBonus)} WP</span>
                        <span class="text-gray-500">${tierInfo.name}${overflow>0 ? ` <span class="text-cyan-400">+${overflow}限突</span>` : ''}</span>
                    </div>
                    ${WORD_DATA[wordKey].skill ? `<div class="text-[10px] text-purple-300 bg-purple-900/20 border border-purple-700/30 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <i data-lucide="sparkles" class="w-2.5 h-2.5"></i>${WORD_DATA[wordKey].skill.desc}
                    </div>` : ''}
                    <div class="flex gap-1.5 mt-0.5">
                        <button onclick="buyWordLevel('${wordKey}')" ${wp < upCost || isMaxLevel ? 'disabled' : ''} 
                            class="flex-1 py-1 ${isMaxMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-blue-700 hover:bg-blue-600'} disabled:opacity-40 rounded text-xs font-bold text-white transition-colors">
                            ${isMaxLevel ? '上限' : (isMaxMode ? '一括強化' : '強化')} ${!isMaxLevel ? `<span class="text-yellow-300">${formatNumber(upCost)}</span>` : ''}
                        </button>
                        ${nextTierInfo ? `<button onclick="buyWordTier('${wordKey}')" ${wp < getWordEvolveCost(wordKey) || !isMaxLevel ? 'disabled' : ''}
                            class="flex-1 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 border border-gray-600 rounded text-xs font-bold ${nextTierInfo.color} transition-colors">
                            進化 <span class="text-yellow-300">${formatNumber(getWordEvolveCost(wordKey))}</span>
                        </button>` : `<div class="flex-1 py-1 text-center text-xs text-gray-600 bg-gray-900/50 rounded border border-gray-800">最終形態</div>`}
                    </div>
                </div>`;
            }
        });
        html += `</div></div>`;

        // --- 所持ヒート単語一覧 ---
        html += `
            <div class="mt-4">
                <h3 class="text-sm font-bold text-orange-400 mb-2 flex items-center border-b border-gray-700 pb-2">
                    <i data-lucide="flame" class="w-4 h-4 mr-2"></i>所持ヒート単語 (${unlockedHeat.length}/${Object.keys(HEAT_WORDS).length})
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        `;
        Object.keys(HEAT_WORDS).forEach((wordKey) => {
            const data = HEAT_WORDS[wordKey];
            const state = heatWordsState[wordKey];
            if (!state.unlocked) return; // 未解放は非表示
            const rInfo = RARITY_COLORS[data.rarity];
            {
                html += `
                <div class="p-3 rounded-xl border ${rInfo.border}/40 bg-gray-800 flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-1.5 py-0.5 rounded ${rInfo.bg} ${rInfo.color} border ${rInfo.border}">${data.rarity}</span>
                        <span class="font-black tracking-widest text-orange-300 text-base">${wordKey}</span>
                        <span class="ml-auto text-[10px] text-green-400 bg-gray-900 px-1.5 py-0.5 rounded border border-green-800">解放済み</span>
                    </div>
                    <div class="text-[11px] text-gray-400 flex gap-3 flex-wrap">
                        <span class="text-red-400">回復 +${data.heatRecover}</span>
                        <span class="text-yellow-400">基礎WP ${formatNumber(data.baseWp)}</span>
                    </div>
                    ${HEAT_WORDS[wordKey].skill ? `<div class="text-[10px] text-orange-300 bg-orange-900/20 border border-orange-700/30 rounded px-1.5 py-0.5 flex items-center gap-1 mt-0.5">
                        <i data-lucide="sparkles" class="w-2.5 h-2.5"></i>${HEAT_WORDS[wordKey].skill.desc}
                    </div>` : ''}
                </div>`;
            }
        });
        html += `</div></div></div>`;

        html += `</div></div>`;

    } else if (activeTab === 'artifacts') {
        html += `
            <div class="max-w-3xl mx-auto">
                <div class="bg-cyan-900/10 p-4 sm:p-6 rounded-xl border border-cyan-800/30 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-bold text-cyan-400 flex items-center mb-1"><i data-lucide="refresh-cw" class="w-5 h-5 mr-2"></i>クリスタル生成</h3>
                        <p class="text-xs sm:text-sm text-gray-400">WPを圧縮してクリスタルを生成します。</p>
                    </div>
                    <button id="btn-gen-crystal" onclick="convertWpToCrystal()" ${wp < 5000 ? 'disabled' : ''} class="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-3 ${isMaxMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-700'} disabled:opacity-50 rounded-lg font-bold border border-gray-600 transition-colors whitespace-nowrap">
                        ${isMaxMode ? '一括生成 (最大)' : '<i data-lucide="coins" class="w-4 h-4 mr-1 text-yellow-400"></i> 5K <span class="mx-2">→</span> <i data-lucide="diamond" class="w-4 h-4 mr-1 text-cyan-400"></i> 1'}
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        `;
        Object.values(ARTIFACTS).filter(a => a.id !== 'limitBreak').forEach(artifact => {
            const currentLevel = artifacts[artifact.id];
            const maxLevel = getArtifactMaxLevel(artifact.id);
            const cost = artifact.baseCost * (currentLevel + 1);
            const isMax = currentLevel >= maxLevel;

            html += `
                <div class="bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden flex flex-col">
                    ${isMax ? '<div class="absolute top-2 right-2 text-xs font-bold text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">MAX</div>' : ''}
                    <h4 class="text-lg sm:text-xl font-bold text-cyan-300 mb-2 flex items-center">
                        ${artifact.id === 'limitBreak' ? '<i data-lucide="hourglass" class="w-5 h-5 mr-2 text-yellow-500"></i>' : ''}
                        ${artifact.id === 'autoType' ? '<i data-lucide="pen-tool" class="w-5 h-5 mr-2 text-purple-400"></i>' : ''}
                        ${artifact.name}
                    </h4>
                    <p class="text-[11px] sm:text-xs text-gray-400 mb-4 h-12 leading-tight">${artifact.desc}</p>
                    <div class="flex justify-between items-center mb-4 text-xs sm:text-sm bg-gray-900 p-2 rounded mt-auto border border-gray-700">
                        <span class="text-gray-300">Lv: ${currentLevel} / ${maxLevel}</span>
                        ${artifact.id === 'limitBreak' ? `<span class="text-yellow-400">上限: +${artifacts.limitBreak * 5}</span>` : ''}
                        ${artifact.id === 'autoType' ? `<span class="text-purple-400">固定</span>` : ''}
                    </div>
                    <button id="btn-artifact-${artifact.id}" onclick="buyArtifact('${artifact.id}')" ${crystal < cost || isMax ? 'disabled' : ''} class="w-full flex justify-center items-center px-4 py-2 ${isMaxMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-cyan-800 hover:bg-cyan-700'} disabled:opacity-50 rounded-lg font-bold transition-colors">
                        ${isMax ? '強化完了' : `${isMaxMode ? '一括強化' : '強化'} <i data-lucide="diamond" class="w-4 h-4 ml-2 mr-1 text-cyan-300"></i> ${formatNumber(cost)}`}
                    </button>
                </div>
            `;
        });
        html += `</div></div>`;

    } else if (activeTab === 'ultimates') {
        html += `
            <div class="max-w-3xl mx-auto">
                <div class="bg-pink-900/10 p-4 sm:p-6 rounded-xl border border-pink-800/50 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_15px_rgba(244,114,182,0.1)]">
                    <div>
                        <h3 class="text-lg font-bold text-pink-400 flex items-center mb-1"><i data-lucide="star" class="w-5 h-5 mr-2 fill-pink-400"></i>スターダスト抽出</h3>
                        <p class="text-xs sm:text-sm text-pink-200/60">膨大なクリスタルを凝縮し、宇宙の欠片を生み出します。</p>
                    </div>
                    <button id="btn-gen-stardust" onclick="convertCrystalToStardust()" ${crystal < 5000 ? 'disabled' : ''} class="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-3 ${isMaxMode ? 'bg-purple-800 border-purple-600' : 'bg-gray-900 border-pink-700/50'} disabled:opacity-50 rounded-lg font-bold border transition-colors shadow-inner text-pink-100">
                        ${isMaxMode ? '一括抽出 (最大)' : '<i data-lucide="diamond" class="w-4 h-4 mr-1 text-cyan-400"></i> 5K <span class="mx-2">→</span> <i data-lucide="star" class="w-4 h-4 mr-1 text-pink-400 fill-pink-400"></i> 1'}
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        Object.values(ULTIMATES).filter(u => u.id !== 'limitBreak').forEach(ultimate => {
            const currentLevel = ultimates[ultimate.id];
            const maxLevel = getUltimateMaxLevel(ultimate.id);
            const cost = ultimate.baseCost * (currentLevel + 1);
            const isMax = currentLevel >= maxLevel;

            // アイコン選択
            let iconHtml = '<i data-lucide="crown" class="w-5 h-5 mr-2"></i>';
            if (ultimate.id === 'limitBreak')   iconHtml = '<i data-lucide="infinity" class="w-5 h-5 mr-2 text-yellow-500"></i>';
            if (ultimate.id === 'eternalFlame') iconHtml = '<i data-lucide="flame" class="w-5 h-5 mr-2 text-orange-400"></i>';
            if (ultimate.id === 'fusionHeart')  iconHtml = '<i data-lucide="zap" class="w-5 h-5 mr-2 text-red-400"></i>';

            // ステータス表示
            let statHtml = '';
            if (ultimate.id === 'basePower')    statHtml = `<span class="font-bold text-green-400">現在: +${getUltimateBasePower()}</span>`;
            if (ultimate.id === 'finalMulti')   statHtml = `<span class="font-bold text-yellow-400">現在: x${getUltimateFinalMulti()}</span>`;
            if (ultimate.id === 'limitBreak')   statHtml = `<span class="text-yellow-400">上限: +${ultimates.limitBreak * 5}</span>`;
            if (ultimate.id === 'eternalFlame') statHtml = `<span class="font-bold text-orange-400">減衰削減: ${(ultimates.eternalFlame * 1.5).toFixed(1)}/sec</span>`;
            if (ultimate.id === 'fusionHeart')  statHtml = `<span class="font-bold text-red-400">最大倍率: x${10 + ultimates.fusionHeart}</span>`;

            html += `<div class="bg-gray-900 p-5 rounded-xl border border-pink-900/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group">
                <div class="absolute inset-0 bg-gradient-to-br from-pink-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                ${isMax ? '<div class="absolute top-2 right-2 text-xs font-bold text-pink-400 bg-pink-400/20 px-2 py-1 rounded z-10">MAX</div>' : ''}
                <h4 class="text-xl font-bold text-pink-300 mb-2 relative z-10 flex items-center">${iconHtml}${ultimate.name}</h4>
                <p class="text-sm text-pink-200/70 mb-4 h-12 relative z-10">${ultimate.desc}</p>
                <div class="flex justify-between items-center mb-4 text-sm bg-black/50 p-2 rounded relative z-10 border border-pink-900/30">
                    <span class="text-pink-300">Lv: ${currentLevel} / ${maxLevel}</span>
                    ${statHtml}
                </div>
                <button id="btn-ultimate-${ultimate.id}" onclick="buyUltimate('${ultimate.id}')" ${stardust < cost || isMax ? 'disabled' : ''} class="w-full flex justify-center items-center px-4 py-3 ${isMaxMode ? 'bg-purple-700/60' : 'bg-pink-700/50'} disabled:opacity-50 rounded-lg font-bold border ${isMaxMode ? 'border-purple-500/50' : 'border-pink-500/50'} transition-colors relative z-10">
                    ${isMax ? '真理到達' : `${isMaxMode ? '一括覚醒' : '覚醒'} <i data-lucide="star" class="w-4 h-4 ml-2 mr-1 text-pink-300 fill-pink-300"></i> ${formatNumber(cost)}`}
                </button>
            </div>`;
        });
        html += `</div></div>`;


    } else if (activeTab === 'quests') {
        // クエストが空なら生成
        if (activeQuests.length === 0) generateQuests();

        const allDone = activeQuests.every(q => q.claimed || getQuestCurrent(q) >= (QUEST_TEMPLATES.find(t=>t.id===q.templateId)?.target||1));
        html += `<div class="max-w-2xl mx-auto space-y-4">`;

        // ヘッダー
        html += `
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-black text-emerald-400 flex items-center gap-2">
                <i data-lucide="scroll-text" class="w-5 h-5"></i>アクティブクエスト
            </h2>
            <button onclick="refreshQuests()" ${crystal < 10 ? 'disabled' : ''} class="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 disabled:opacity-40 rounded-lg text-gray-300 flex items-center gap-1">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-cyan-400"></i>更新 <i data-lucide="diamond" class="w-3 h-3 text-cyan-400 ml-1"></i>10
            </button>
        </div>`;

        // クエストカード
        activeQuests.forEach((q, qi) => {
            const t = QUEST_TEMPLATES.find(t => t.id === q.templateId);
            if (!t) return;
            const cur = getQuestCurrent(q);
            const pct = Math.min(100, Math.floor(cur / t.target * 100));
            const isComplete = cur >= t.target;
            const isClaimed = q.claimed;
            const skillFx = getActiveSkillEffects();
            const questBonus = 1 + (skillFx.quest_reward || 0);

            const rewardStr = Object.entries(t.reward).map(([k,v]) => {
                const adj = k==='crystal'||k==='stardust' ? Math.floor(v*questBonus) : v;
                const icons = {crystal:'💎',stardust:'✨',chest:'📦',deckEditItems:'🎟️'};
                return `${icons[k]||''}×${adj}`;
            }).join(' ');

            html += `
            <div class="p-4 rounded-xl border ${isClaimed ? 'border-gray-700 opacity-50' : isComplete ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]' : 'border-gray-700 bg-gray-800'} transition-all">
                <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${t.icon}" class="w-4 h-4 ${t.color} shrink-0"></i>
                        <span class="font-bold text-sm text-gray-100">${t.label}</span>
                    </div>
                    <span class="text-xs ${t.color} font-bold bg-gray-900 px-2 py-0.5 rounded shrink-0">${rewardStr}</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-900 rounded-full h-2 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs text-gray-400 w-24 text-right">${formatNumber(cur)} / ${formatNumber(t.target)}</span>
                    ${isComplete && !isClaimed
                        ? `<button onclick="claimQuest(${qi})" class="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors">受取！</button>`
                        : isClaimed ? `<span class="ml-2 text-xs text-gray-500">受取済</span>` : ''
                    }
                </div>
            </div>`;
        });

        // 全完了時のメッセージ
        if (allDone) {
            html += `<div class="text-center py-4 text-emerald-400 font-bold text-sm bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
                🎉 全クエスト完了！更新ボタンで新しいクエストを受け取ろう
            </div>`;
        }

        html += `</div>`;

        // ===== 実績セクション =====
        html += `<div class="max-w-2xl mx-auto mt-6">
            <h2 class="text-lg font-black text-amber-400 flex items-center gap-2 mb-3 border-t border-gray-800 pt-4">
                <i data-lucide="trophy" class="w-5 h-5"></i>実績
                <span class="text-xs text-gray-500 font-normal ml-2">
                    ${Object.values(achievementState).filter(v=>v==='claimed').length} / ${ACHIEVEMENT_DEFS.length}
                </span>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        `;
        ACHIEVEMENT_DEFS.forEach(def => {
            const state = achievementState[def.id];
            const isClaimed = state === 'claimed';
            const isUnlocked = state === 'unlocked' || isClaimed;
            const rewardStr = Object.entries(def.reward).map(([k,v])=>{
                const icons={crystal:'💎',stardust:'✨',chest:'📦'};
                return `${icons[k]||''}×${v}`;
            }).join(' ');
            html += `
            <div class="p-3 rounded-xl border ${isClaimed ? 'border-amber-500/40 bg-amber-900/10' : isUnlocked ? 'border-yellow-500 bg-yellow-900/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'border-gray-800 bg-gray-900/50 opacity-50'} flex items-center gap-3">
                <i data-lucide="trophy" class="w-5 h-5 shrink-0 ${isClaimed ? 'text-amber-400' : isUnlocked ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}"></i>
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}">${def.label}</div>
                    <div class="text-xs text-gray-500 truncate">${isClaimed || isUnlocked ? def.desc : '???'}</div>
                </div>
                <span class="text-xs text-gray-400 shrink-0">${rewardStr}</span>
            </div>`;
        });
        html += `</div></div>`;
    } else if (activeTab === 'relics') {
        html += `
            <div class="max-w-3xl mx-auto">
                <div class="bg-gradient-to-b from-amber-900/30 to-gray-900 border border-amber-500/30 p-6 sm:p-8 rounded-2xl text-center mb-8 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"></div>
                    
                    <i data-lucide="box" class="w-20 h-20 mx-auto text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] ${chestCount > 0 ? 'animate-bounce' : 'opacity-50'} relative z-10"></i>
                    <h3 class="text-3xl font-black text-amber-300 mb-2 relative z-10 tracking-widest">レリック宝箱 <span class="text-white ml-2 bg-amber-600/30 px-3 py-1 rounded border border-amber-500/50">x ${formatNumber(chestCount)}</span></h3>
                    <p class="text-sm text-gray-300 mb-8 relative z-10">単語完成時にごく稀にドロップします。<br>開けると強力なパッシブ能力や「編成チケット」が手に入ります。</p>
                    
                    <div class="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                        <button onclick="openChest(1)" ${chestCount < 1 ? 'disabled' : ''} class="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 text-white font-bold rounded-lg border border-amber-400 transition-all shadow-lg hover:shadow-amber-500/50 flex items-center justify-center">
                            <i data-lucide="unlock" class="w-5 h-5 mr-2"></i>1個開ける
                        </button>
                        <button onclick="openChest(10)" ${chestCount < 10 ? 'disabled' : ''} class="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 text-white font-bold rounded-lg border border-red-400 transition-all shadow-lg hover:shadow-red-500/50 flex items-center justify-center">
                            <i data-lucide="sparkles" class="w-5 h-5 mr-2"></i>10個開ける
                        </button>
                        <button onclick="openChest(100)" ${chestCount < 100 ? 'disabled' : ''} class="px-8 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 text-white font-black rounded-lg border border-purple-400 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2 relative overflow-hidden">
                            <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></span>
                            <i data-lucide="zap" class="w-5 h-5 text-yellow-300"></i>100個開ける
                        </button>
                    </div>
                </div>

                <h3 class="text-xl font-bold text-gray-200 mb-4 flex items-center border-b border-gray-700 pb-2"><i data-lucide="award" class="w-5 h-5 mr-2 text-amber-400"></i>獲得済みレリック効果</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center">
                        <div class="bg-blue-900/50 p-3 rounded-lg mr-4 border border-blue-500/30"><i data-lucide="trending-up" class="w-6 h-6 text-blue-400"></i></div>
                        <div>
                            <div class="text-sm text-gray-400">WP獲得倍率UP</div>
                            <div class="text-lg font-bold text-white">Lv.${relics.wpMulti}<span class="text-gray-500 text-xs ml-1">/ ${getRelicMaxLevel('wpMulti')}</span> <span class="text-green-400 text-sm ml-2">x${getRelicWpMulti().toFixed(2)}</span>${relics.wpMulti >= getRelicMaxLevel('wpMulti') ? '<span class="text-xs text-yellow-400 ml-2 font-bold">MAX</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center">
                        <div class="bg-cyan-900/50 p-3 rounded-lg mr-4 border border-cyan-500/30"><i data-lucide="gem" class="w-6 h-6 text-cyan-400"></i></div>
                        <div>
                            <div class="text-sm text-gray-400">Crystal獲得倍率</div>
                            <div class="text-lg font-bold text-white">Lv.${relics.crystalMulti}<span class="text-gray-500 text-xs ml-1">/ ${getRelicMaxLevel('crystalMulti')}</span> <span class="text-green-400 text-sm ml-2">x${getRelicCrystalMulti().toFixed(2)}</span>${relics.crystalMulti >= getRelicMaxLevel('crystalMulti') ? '<span class="text-xs text-yellow-400 ml-2 font-bold">MAX</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center">
                        <div class="bg-purple-900/50 p-3 rounded-lg mr-4 border border-purple-500/30"><i data-lucide="zap" class="w-6 h-6 text-purple-400"></i></div>
                        <div>
                            <div class="text-sm text-gray-400">自動入力速度UP</div>
                            <div class="text-lg font-bold text-white">Lv.${relics.autoSpeed}<span class="text-gray-500 text-xs ml-1">/ ${getRelicMaxLevel('autoSpeed')}</span> <span class="text-green-400 text-sm ml-2">x${getRelicAutoSpeedMulti().toFixed(2)}</span>${relics.autoSpeed >= getRelicMaxLevel('autoSpeed') ? '<span class="text-xs text-yellow-400 ml-2 font-bold">MAX</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center">
                        <div class="bg-red-900/50 p-3 rounded-lg mr-4 border border-red-500/30"><i data-lucide="thermometer" class="w-6 h-6 text-red-400"></i></div>
                        <div>
                            <div class="text-sm text-gray-400">ヒート保持力UP</div>
                            <div class="text-lg font-bold text-white">Lv.${relics.heatKeep}<span class="text-gray-500 text-xs ml-1">/ ${getRelicMaxLevel('heatKeep')}</span> <span class="text-green-400 text-sm ml-2">減衰低下</span>${relics.heatKeep >= getRelicMaxLevel('heatKeep') ? '<span class="text-xs text-yellow-400 ml-2 font-bold">MAX</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center md:col-span-2 lg:col-span-1">
                        <div class="bg-pink-900/50 p-3 rounded-lg mr-4 border border-pink-500/30"><i data-lucide="sparkles" class="w-6 h-6 text-pink-400"></i></div>
                        <div>
                            <div class="text-sm text-gray-400">Stardust直接ドロップ</div>
                            <div class="text-lg font-bold text-white">Lv.${relics.stardustDrop}<span class="text-gray-500 text-xs ml-1">/ ${getRelicMaxLevel('stardustDrop')}</span> <span class="text-green-400 text-sm ml-2">${getRelicStardustDropRate().toFixed(1)}%</span>${relics.stardustDrop >= getRelicMaxLevel('stardustDrop') ? '<span class="text-xs text-yellow-400 ml-2 font-bold">MAX</span>' : ''}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } else if (activeTab === 'prestige') {
        const threshold = getPrestigeThreshold(prestigeCount);
        const canPrestige = totalWpEarned >= threshold;
        const pct = Math.min(100, (totalWpEarned / threshold) * 100);
        const nextPP = (prestigeCount + 1) * 15;

        html += `<div class="max-w-xl mx-auto space-y-4">`;

        // ── 転生ボタンカード ──
        html += `
        <div class="bg-gray-800 rounded-2xl border ${canPrestige ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-gray-700'} p-5">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-lg font-black text-rose-400 flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>転生
                </h2>
                <div class="text-right">
                    <div class="text-xl font-black text-white">${prestigeCount}<span class="text-sm text-gray-400 ml-1">回転生</span></div>
                    <div class="text-xs text-yellow-300 font-bold">残りPP: ${prestigePoints}</div>
                </div>
            </div>
            <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-400">累計WP進捗</span>
                <span class="${canPrestige ? 'text-rose-400 font-bold' : 'text-gray-400'}">${formatNumber(totalWpEarned)} / ${formatNumber(threshold)}</span>
            </div>
            <div class="w-full bg-gray-900 rounded-full h-2.5 border border-gray-700 overflow-hidden mb-3">
                <div class="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-orange-400 transition-all"
                    style="width:${pct.toFixed(1)}%"></div>
            </div>
            <div class="bg-rose-900/20 border border-rose-700/30 rounded-lg p-2.5 mb-3 text-xs text-gray-300 flex justify-between">
                <span>転生後に獲得PP: <span class="text-yellow-400 font-bold">+${nextPP}</span></span>
                <span>※レリック含む全進行リセット</span>
            </div>
            <button onclick="doPrestige()" ${!canPrestige ? 'disabled' : ''}
                class="w-full py-3 ${canPrestige ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500' : 'bg-gray-700 opacity-40'} text-white font-black rounded-xl border ${canPrestige ? 'border-rose-400' : 'border-gray-600'} flex items-center justify-center gap-2 transition-all">
                <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                ${canPrestige ? '転生する' : 'WP不足'}
            </button>
        </div>`;

        // ── PPショップ ──
        html += `
        <div class="bg-gray-800 rounded-2xl border border-yellow-600/30 p-4">
            <h3 class="text-base font-black text-yellow-400 flex items-center gap-2 mb-3">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>転生PPショップ
                <span class="text-xs text-gray-400 font-normal ml-auto">残り <span class="text-yellow-400 font-bold">${prestigePoints} PP</span></span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        `;

        // 通常強化系
        html += `<div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 mt-1 px-1">⚡ 能力強化</div>`;
        Object.values(PRESTIGE_UPGRADES).filter(u => u.unit !== 'cap').forEach(u => {
            const lv = prestigeUpgrades[u.id];
            const isMax = lv >= u.maxLevel;
            const cost = getPrestigeUpgradeCost(u.id);
            const canBuy = prestigePoints >= cost && !isMax;
            const val = getPrestigeUpgradeValue(u.id);

            // 現在値の表示
            let valStr = '';
            if (u.unit === 'x')  valStr = `×${(1+val).toFixed(2)}`;
            else if (u.unit === '+')  valStr = `+${val.toFixed(0)}`;
            else if (u.unit === '%+') valStr = `+${val.toFixed(1)}%`;
            else if (u.unit === 'x+') valStr = `×${(1+val).toFixed(2)}`;
            else if (u.unit === '%-') valStr = `-${(val*100).toFixed(0)}%`;

            html += `
            <div class="p-3 rounded-xl border ${canBuy ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-gray-700 bg-gray-900/40'} flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                    <i data-lucide="${u.icon}" class="w-4 h-4 ${u.color} shrink-0"></i>
                    <span class="font-bold text-sm text-gray-100 flex-1">${u.name}</span>
                    <span class="text-[10px] text-gray-500">Lv.${lv}/${u.maxLevel}</span>
                </div>
                <div class="text-[11px] text-gray-400">${u.desc}</div>
                <div class="flex items-center justify-between mt-0.5">
                    <span class="${u.color} font-black text-base">${lv > 0 ? valStr : '—'}</span>
                    <button onclick="buyPrestigeUpgrade('${u.id}')" ${!canBuy ? 'disabled' : ''}
                        class="px-3 py-1 ${canBuy ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 opacity-40'} text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                        ${isMax ? 'MAX' : `<i data-lucide="coins" class="w-3 h-3 text-yellow-300"></i>${cost}PP`}
                    </button>
                </div>
                ${lv < u.maxLevel ? `<div class="text-[10px] text-gray-600">次Lv: ${u.unit==='x'?'×'+(1+(lv+1)*u.valuePerLevel).toFixed(2):u.unit==='%+'?'+'+(((lv+1)*u.valuePerLevel)).toFixed(1)+'%':u.unit==='x+'?'×'+(1+(lv+1)*u.valuePerLevel).toFixed(2)+'':'+'+((lv+1)*u.valuePerLevel).toFixed(0)}</div>` : ''}
            </div>`;
        });

        // 上限解放系
        html += `</div>`; // close grid
        html += `<div class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 mt-3 px-1">🔓 上限解放</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
        Object.values(PRESTIGE_UPGRADES).filter(u => u.unit === 'cap').forEach(u => {
            const lv = prestigeUpgrades[u.id];
            const isMax = lv >= u.maxLevel;
            const cost = getPrestigeUpgradeCost(u.id);
            const canBuy = prestigePoints >= cost && !isMax;
            let currentCapStr = '';
            if (u.id === 'relicCap')      currentCapStr = `上限 ${10 + lv*10}/100`;
            else if (u.id === 'artifactCap') currentCapStr = `+${lv*3} Lv`;
            else if (u.id === 'ultimateCap') currentCapStr = `+${lv*3} Lv`;
            else if (u.id === 'wordLevelCap') currentCapStr = `+${lv*5} Lv/ティア`;
            html += `
            <div class="p-3 rounded-xl border ${canBuy ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-gray-700 bg-gray-900/40'} flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                    <i data-lucide="${u.icon}" class="w-4 h-4 ${u.color} shrink-0"></i>
                    <span class="font-bold text-sm text-gray-100 flex-1">${u.name}</span>
                    <span class="text-[10px] text-gray-500">Lv.${lv}/${u.maxLevel}</span>
                </div>
                <div class="text-[11px] text-gray-400">${u.desc}</div>
                <div class="flex items-center justify-between mt-0.5">
                    <span class="${u.color} font-black text-sm">${lv > 0 ? currentCapStr : '—'}</span>
                    <button onclick="buyPrestigeUpgrade('${u.id}')" ${!canBuy ? 'disabled' : ''}
                        class="px-3 py-1 ${canBuy ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 opacity-40'} text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                        ${isMax ? 'MAX' : `<i data-lucide="coins" class="w-3 h-3 text-yellow-300"></i>${cost}PP`}
                    </button>
                </div>
            </div>`;
        });
        html += `</div></div>`; // close shop card
        html += `</div>`;

    } else if (activeTab === 'deck') {
        const deckKeys = getActiveDeck();
        const heatDeckKeys = getActiveHeatDeck();
        const canEdit = deckEditItems > 0;
        
        html += `
            <div class="max-w-3xl mx-auto space-y-8">
                <!-- 共通ヘッダー -->
                <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div>
                        <!-- アクティブスキルサマリー -->
                        ${(() => {
                            const sfx = getActiveSkillEffects();
                            const active = Object.entries(sfx).filter(([,v]) => v > 0);
                            if (active.length === 0) return '';
                            const lines = active.map(([k,v]) => {
                                const labels = {
                                    wp_bonus:'WP+', crystal_rate:'Crystal+', heat_decay_reduction:'ヒート減衰-',
                                    heat_recover_bonus:'ヒート回復+', crit_chance:'クリティカル+', chest_drop:'宝箱ドロップ+',
                                    type_power:'タイプWP+', stardust_drop:'星屑ドロップ+', heat_cap:'ヒート上限+',
                                    final_multi_bonus:'最終倍率+', auto_speed_bonus:'自動速度+',
                                    quest_reward:'クエスト報酬+', crystal_convert:'変換コスト-'
                                };
                                const fmt = v < 1 ? (v*100).toFixed(0)+'%' : v.toFixed(1).replace('.0','');
                                return `<span class="text-[10px] bg-purple-900/30 text-purple-300 border border-purple-700/30 px-1.5 py-0.5 rounded">${labels[k]||k}${fmt}</span>`;
                            }).join('');
                            return `<div class="mb-3 p-2 bg-gray-900/60 rounded-xl border border-purple-700/20">
                                <div class="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><i data-lucide="sparkles" class="w-3 h-3 text-purple-400"></i>アクティブスキル効果</div>
                                <div class="flex flex-wrap gap-1">${lines}</div>
                            </div>`;
                        })()}
                        <h3 class="text-xl font-bold text-gray-200 mb-1 flex items-center"><i data-lucide="list-checks" class="w-5 h-5 mr-2 text-yellow-400"></i>デッキ編成</h3>
                        <p class="text-xs sm:text-sm text-gray-400">メイン・ヒートそれぞれの出現単語をオン/オフします。</p>
                    </div>
                    <div class="flex flex-col items-end bg-gray-900 p-3 rounded-lg border border-gray-700">
                        <span class="text-xs text-gray-400 mb-1">所持 編成チケット</span>
                        <div class="flex items-center text-xl font-bold ${canEdit ? 'text-yellow-400' : 'text-red-400'}">
                            <i data-lucide="ticket" class="w-5 h-5 mr-2"></i> ${formatNumber(deckEditItems)} 枚
                        </div>
                        ${!canEdit ? '<span class="text-[10px] text-red-400 mt-1">※チケット不足のため編集できません</span>' : '<span class="text-[10px] text-gray-500 mt-1">※切替1回につき1枚消費</span>'}
                    </div>
                </div>

                <!-- メインデッキ -->
                <div>
                    <h4 class="text-lg font-bold text-green-400 mb-3 flex items-center border-b border-gray-700 pb-2"><i data-lucide="book-open" class="w-5 h-5 mr-2"></i>メインデッキ (${deckKeys.length}語)</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        `;
        
        Object.keys(wordsState).filter(k => wordsState[k].unlocked).forEach(wordKey => {
            const state = wordsState[wordKey];
            const baseBonus = Math.floor((getWordBonus(wordKey) * getBonusMultiplier()) * getUltimateFinalMulti() * getRelicWpMulti());
            const isLastOne = state.inDeck && deckKeys.length === 1;
            const disabledState = isLastOne || !canEdit;

            html += `
                <div class="bg-gray-800 p-3 rounded-xl border ${state.inDeck ? 'border-green-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-gray-700 opacity-60'} flex justify-between items-center transition-all">
                    <div class="flex flex-col">
                        <span class="text-base font-bold tracking-widest mb-1 ${state.inDeck ? 'text-white' : 'text-gray-500'}">${wordKey}</span>
                        <span class="text-[10px] text-yellow-400 bg-gray-900 border border-yellow-400/30 px-2 py-0.5 rounded-full w-fit">
                            +${formatNumber(baseBonus)} WP
                        </span>
                    </div>
                    <label for="toggle-${wordKey}" class="relative inline-flex items-center ${disabledState ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}">
                        <input type="checkbox" id="toggle-${wordKey}" onclick="toggleDeckWord('${wordKey}')" ${state.inDeck ? 'checked' : ''} ${disabledState ? 'disabled' : ''} class="sr-only peer"/>
                        <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
            `;
        });
        
        html += `</div></div>`;

        // ヒートデッキ
        html += `
                <div>
                    <h4 class="text-lg font-bold text-orange-400 mb-3 flex items-center border-b border-gray-700 pb-2"><i data-lucide="flame" class="w-5 h-5 mr-2"></i>ヒートデッキ (${heatDeckKeys.length}語)</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        `;
        
        Object.keys(heatWordsState).filter(k => heatWordsState[k].unlocked).forEach(wordKey => {
            const state = heatWordsState[wordKey];
            const isLastOne = state.inDeck && heatDeckKeys.length === 1;
            const disabledState = isLastOne || !canEdit;

            html += `
                <div class="bg-gray-800 p-3 rounded-xl border ${state.inDeck ? 'border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'border-gray-700 opacity-60'} flex justify-between items-center transition-all">
                    <div class="flex flex-col">
                        <span class="text-base font-bold tracking-widest mb-1 ${state.inDeck ? 'text-white' : 'text-gray-500'}">${wordKey}</span>
                        <span class="text-[10px] text-red-400 bg-gray-900 border border-red-400/30 px-2 py-0.5 rounded-full w-fit">
                            回復 +${HEAT_WORDS[wordKey].heatRecover}
                        </span>
                    </div>
                    <label for="toggle-heat-${wordKey}" class="relative inline-flex items-center ${disabledState ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}">
                        <input type="checkbox" id="toggle-heat-${wordKey}" onclick="toggleHeatDeckWord('${wordKey}')" ${state.inDeck ? 'checked' : ''} ${disabledState ? 'disabled' : ''} class="sr-only peer"/>
                        <div class="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>
            `;
        });
        html += `</div></div></div>`;
    }

    tabContent.innerHTML = html;
    tabContent.scrollTop = scrollPos; 
}

function updateRightPaneButtons() {
    if (activeTab === 'letters') {
        ALPHABET.forEach(char => {
            const btnLevel = document.getElementById(`btn-level-${char}`);
            const tierInfo = TIERS[letters[char].tier];
            const isMax = letters[char].level >= tierInfo.maxLevel;
            if (btnLevel) btnLevel.disabled = wp < getLetterUpgradeCost(letters[char].level) || isMax;
            
            const btnTier = document.getElementById(`btn-tier-${char}`);
            if (btnTier) btnTier.disabled = wp < tierInfo.cost || !isMax;
        });
    } else if (activeTab === 'words') {
        Object.keys(WORD_DATA).forEach((wordKey) => {
            const state = wordsState[wordKey];
            if(state.unlocked) {
                const tierInfo = WORD_TIERS[state.tier];
                const isMax = state.level >= getWordTierMaxLevel(state.tier);
                const btnUp = document.getElementById(`btn-word-up-${wordKey}`);
                if (btnUp) btnUp.disabled = wp < getWordUpgradeCost(wordKey) || isMax;
                const btnEvolve = document.getElementById(`btn-word-evolve-${wordKey}`);
                if (btnEvolve) btnEvolve.disabled = wp < getWordEvolveCost(wordKey) || !isMax;
            }
        });
    } else if (activeTab === 'artifacts') {
        const btnGen = document.getElementById('btn-gen-crystal');
        if (btnGen) btnGen.disabled = wp < 5000;
        Object.values(ARTIFACTS).filter(a => a.id !== 'limitBreak').forEach(artifact => {
            const btn = document.getElementById(`btn-artifact-${artifact.id}`);
            if (btn) btn.disabled = crystal < (artifact.baseCost * (artifacts[artifact.id] + 1)) || artifacts[artifact.id] >= getArtifactMaxLevel(artifact.id);
        });
    } else if (activeTab === 'ultimates') {
        const btnGen = document.getElementById('btn-gen-stardust');
        if (btnGen) btnGen.disabled = crystal < 5000;
        Object.values(ULTIMATES).filter(u => u.id !== 'limitBreak').forEach(ultimate => {
            const btn = document.getElementById(`btn-ultimate-${ultimate.id}`);
            if (btn) btn.disabled = stardust < (ultimate.baseCost * (ultimates[ultimate.id] + 1)) || ultimates[ultimate.id] >= getUltimateMaxLevel(ultimate.id);
        });
    }
}

// --- タイピングロジック ---
document.addEventListener('keydown', (e) => {
    if (!isGameStarted) return;
    const key = e.key.toUpperCase();
    if (ALPHABET.includes(key)) {
        // 手動入力時、メインとヒートをそれぞれ判定
        let hitSomething = false;

        // ヒート単語の判定
        if (key === currentHeatWordKey[heatTypedCount]) {
            processHeatWordType(key);
            hitSomething = true;
        }
        
        // メイン単語の判定
        if (key === currentWordKey[typedCount]) {
            processMainWordType(key, true); // 手動
            hitSomething = true;
        }

        if (hitSomething) partialRender();
    }
});

function processMainWordType(key, isManual = false) {
    if (isManual) {
        // メイン単語を手動で打っても微量のヒート上昇(+1)
        heat = Math.min(100, heat + 1);
        updateHeatUI();
    }
    

    const letterData = letters[key];
    const typeMulti = getTypeMultiplier();
    const ultimateBase = getUltimateBasePower();
    const finalMulti = getUltimateFinalMulti();
    const heatMulti = getHeatMultiplier();
    const relicMulti = getRelicWpMulti();

    const _skillFxMain = getActiveSkillEffects();
    const _wpBonus = 1 + _skillFxMain.wp_bonus;
    let earnedWp = Math.floor(((letterData.level * TIERS[letterData.tier].multi) + ultimateBase) * typeMulti * finalMulti * heatMulti * relicMulti * _wpBonus * getPrestigeWpMulti());
    wp += earnedWp;
    totalWpEarned += earnedWp;
    lifetimeStats.totalWp += earnedWp;
    questProgress.wp += earnedWp;
    typedCount++;

    if (typedCount === currentWordKey.length) {
        // メイン単語完成
        const _sfxW = getActiveSkillEffects();
        const bonusMulti = getBonusMultiplier();
        const baseBonus = getWordBonus(currentWordKey);
        let bonusWp = Math.floor((baseBonus * bonusMulti) * finalMulti * heatMulti * relicMulti * (1 + _sfxW.wp_bonus) * getPrestigeWpMulti());

        // クリティカル判定 (crit_chance スキル)
        let isCrit = false;
        if (_sfxW.crit_chance > 0 && Math.random() * 100 < _sfxW.crit_chance) {
            bonusWp *= 2;
            isCrit = true;
            lifetimeStats.crits++;
            showToast(`💥 CRITICAL! +${formatNumber(bonusWp)} WP`);
        }

        wp += bonusWp;
        totalWpEarned += bonusWp;
        lifetimeStats.totalWp += bonusWp;
        questProgress.wp += bonusWp;

        // 統計更新
        questProgress.words++;
        lifetimeStats.words++;

        // ドロップ判定
        const baseDropRate = currentWordKey.length * 2;
        const finalDropRate = baseDropRate + getDropRateBonus();
        if (Math.random() * 100 < finalDropRate) {
            let actualCrystalDrop = Math.floor((1 + artifacts.crystalYield) * getRelicCrystalMulti() * (1 + _sfxW.crystal_rate));
            if(actualCrystalDrop < 1) actualCrystalDrop = 1;
            crystal += actualCrystalDrop;
            lifetimeStats.crystalEarned = (lifetimeStats.crystalEarned||0) + actualCrystalDrop;
        }

        const stardustRate = getRelicStardustDropRate() + _sfxW.stardust_drop;
        if (stardustRate > 0 && Math.random() * 100 < stardustRate) {
            stardust += 1;
            showToast("✨ 星屑(Stardust)が直接ドロップしました！", "success");
        }

        const chestDropRate = 2 + (currentWordKey.length * 0.5) + _sfxW.chest_drop + getPrestigeChestBonus();
        if (Math.random() * 100 < chestDropRate) {
            chestCount++;
            questProgress.chests++;
            showToast("📦 レリック宝箱を獲得！");
            if (activeTab === 'relics') fullRender();
        }

        // ヒートMAX実績
        if (heat >= 99) lifetimeStats.reachedHeatMax = true;
        // OMNIPOTENCE実績
        if (wordsState['OMNIPOTENCE']?.unlocked) lifetimeStats.hasOmnipotence = true;
        // 解放単語数更新
        lifetimeStats.unlockedWords = Object.values(wordsState).filter(s=>s.unlocked).length;

        checkAchievements();
        drawWord();
    }
}

function processHeatWordType(key) {
    // ヒート単語を手動で打つとヒート上昇 (+3)
    heat = Math.min(100, heat + 3);
    updateHeatUI();

    heatTypedCount++;

    if (heatTypedCount === currentHeatWordKey.length) {
        // ヒート単語完成
        const heatData = HEAT_WORDS[currentHeatWordKey];
        const _sfxH = getActiveSkillEffects();
        
        // ヒート大幅回復 (heat_recover_bonus スキル)
        const recoverAmt = Math.floor(heatData.heatRecover * (1 + _sfxH.heat_recover_bonus));
        heat = Math.min(100, heat + recoverAmt);
        updateHeatUI();

        // WPボーナス獲得
        const heatWpGained = getHeatWordBonus(currentHeatWordKey);
        wp += heatWpGained;
        totalWpEarned += heatWpGained;
        lifetimeStats.totalWp += heatWpGained;
        questProgress.wp += heatWpGained;

        // 統計更新
        questProgress.heat++;
        lifetimeStats.heat = (lifetimeStats.heat||0) + 1;
        if (heat >= 99) lifetimeStats.reachedHeatMax = true;

        checkAchievements();
        drawHeatWord();
    }
}

function drawWord() {
    const deckKeys = getActiveDeck();
    if(deckKeys.length === 0) {
        currentWordKey = "CAT";
    } else {
        currentWordKey = deckKeys[Math.floor(Math.random() * deckKeys.length)];
    }
    typedCount = 0;
}

function drawHeatWord() {
    const deckKeys = getActiveHeatDeck();
    if(deckKeys.length === 0) {
        currentHeatWordKey = "HOT";
    } else {
        currentHeatWordKey = deckKeys[Math.floor(Math.random() * deckKeys.length)];
    }
    heatTypedCount = 0;
    if(!relics.heatOn){
        heatTypedCount = -1;
    }
}

// --- ガチャ処理 ---
window.openChest = (count = 1) => {
    if (chestCount < count) return;
    chestCount -= count;

    let resultsMap = {};

    for (let i = 0; i < count; i++) {
        const r = Math.random();
        
        if (r < 0.25) {
            const ticketCount = Math.floor(Math.random() * 3) + 1;
            deckEditItems += ticketCount;
            resultsMap['🎟️ 編成チケット'] = (resultsMap['🎟️ 編成チケット'] || 0) + ticketCount;
        } else if (r < 0.45) { // 20%
            const _cap = getRelicMaxLevel('wpMulti');
            if (relics.wpMulti < _cap) { relics.wpMulti++; resultsMap['⭐ WP獲得倍率UP'] = (resultsMap['⭐ WP獲得倍率UP'] || 0) + 1; }
            else { deckEditItems += 2; resultsMap['🎟️ 編成チケット(代替)'] = (resultsMap['🎟️ 編成チケット(代替)'] || 0) + 2; }
        } else if (r < 0.65) { // 20%
            const _cap = getRelicMaxLevel('crystalMulti');
            if (relics.crystalMulti < _cap) { relics.crystalMulti++; resultsMap['💎 Crystal獲得倍率UP'] = (resultsMap['💎 Crystal獲得倍率UP'] || 0) + 1; }
            else { deckEditItems += 2; resultsMap['🎟️ 編成チケット(代替)'] = (resultsMap['🎟️ 編成チケット(代替)'] || 0) + 2; }
        } else if (r < 0.85) { // 20%
            const _capAs = getRelicMaxLevel('autoSpeed');
            if (relics.autoSpeed < _capAs) { relics.autoSpeed++; resultsMap['⚡ 自動入力速度UP'] = (resultsMap['⚡ 自動入力速度UP'] || 0) + 1; }
            else { deckEditItems += 2; resultsMap['🎟️ 編成チケット(代替)'] = (resultsMap['🎟️ 編成チケット(代替)'] || 0) + 2; }
        } else if (r < 0.90) { // 10%
            const _capHk = getRelicMaxLevel('heatKeep');
            if (relics.heatKeep < _capHk) { relics.heatKeep++; resultsMap['🌡️ ヒート保持力UP'] = (resultsMap['🌡️ ヒート保持力UP'] || 0) + 1; }
            else { deckEditItems += 3; resultsMap['🎟️ 編成チケット(代替)'] = (resultsMap['🎟️ 編成チケット(代替)'] || 0) + 3; }
        } else if (r < 0.95) { // 5%
            const _capSd = getRelicMaxLevel('stardustDrop');
            if (relics.stardustDrop < _capSd) { relics.stardustDrop++; resultsMap['✨ Stardustドロップ率UP'] = (resultsMap['✨ Stardustドロップ率UP'] || 0) + 1; }
            else { stardust++; resultsMap['✨ Stardust直接(代替)'] = (resultsMap['✨ Stardust直接(代替)'] || 0) + 1; }
        } else if (!relics.heatOn) {
            relics.heatOn = true;
            heatTypedCount = 0;
            resultsMap['🔥 Heat Target解放'] = (resultsMap['🔥 Heat Target解放'] || 0) + 1;
        }
    }

    let resultHtml = Object.keys(resultsMap).map(key => {
        const cnt = resultsMap[key];
        const highlight = key.includes('チケット') ? 'text-yellow-400 font-bold' : 'text-gray-200';
        return `<div class="${highlight} py-1">${key} <span class="text-gray-400 text-sm ml-2">x${cnt}</span></div>`;
    }).join('');

    showModal("宝箱を開封しました！", resultHtml);
    fullRender();
};

// --- 各種操作・購入関数 ---

// ===== 転生・クエスト・実績 window関数 =====


window.buyPrestigeUpgrade = (id) => {
    const u = PRESTIGE_UPGRADES[id];
    if (!u) return;
    if (prestigeUpgrades[id] >= u.maxLevel) return;
    const cost = getPrestigeUpgradeCost(id);
    if (prestigePoints < cost) return;
    prestigePoints -= cost;
    prestigeUpgrades[id]++;
    fullRender();
};
window.doPrestige = () => {
    const threshold = getPrestigeThreshold(prestigeCount);
    if (totalWpEarned < threshold) return;

    const earnedPP = (prestigeCount + 1) * 15;
    prestigeCount++;
    prestigePoints += earnedPP;   // 消費可能PPを加算
    lifetimeStats.prestige = prestigeCount;
    questProgress.prestige++;

    // フルリセット（レリックも含む）
    wp = 0; crystal = 0; stardust = 0; heat = 0;
    chestCount = 0; deckEditItems = 0;
    autoTypeProgress = 0;
    totalWpEarned = 0;  // 転生後はリセット（次の転生条件用）

    ALPHABET.forEach(char => { letters[char] = { level: 1, tier: 1 }; });

    Object.keys(WORD_DATA).forEach(word => {
        wordsState[word] = { unlocked: WORD_DATA[word].isDefault, inDeck: WORD_DATA[word].isDefault, level: 1, tier: 1, overflowBonus: 0 };
    });
    Object.keys(HEAT_WORDS).forEach(word => {
        heatWordsState[word] = { unlocked: HEAT_WORDS[word].isDefault, inDeck: HEAT_WORDS[word].isDefault, overflowBonus: 0 };
    });

    artifacts = { autoType: 0, crystalYield: 0, bonusMulti: 0, dropRate: 0, typePower: 0, limitBreak: 0 };
    ultimates = { basePower: 0, finalMulti: 0, limitBreak: 0, eternalFlame: 0, fusionHeart: 0 };

    // レリックもリセット
    relics = { wpMulti:0, heatKeep:0, crystalMulti:0, autoSpeed:0, stardustDrop:0, heatOn:false };

    currentWordKey = 'CAT'; typedCount = 0;
    currentHeatWordKey = 'HOT'; heatTypedCount = -1;

    generateQuests();
    checkAchievements();
    fullRender();
    showToast(`🌟 転生完了！PP+${earnedPP}獲得（残り${prestigePoints}PP）`, 'success');
    setActiveTab('prestige');
};

window.claimQuest = (qi) => {
    const q = activeQuests[qi];
    if (!q || q.claimed) return;
    const t = QUEST_TEMPLATES.find(t => t.id === q.templateId);
    if (!t || getQuestCurrent(q) < t.target) return;

    q.claimed = true;
    const skillFx = getActiveSkillEffects();
    const bonus = 1 + (skillFx.quest_reward || 0);

    const r = t.reward;
    if (r.crystal)       crystal += Math.floor(r.crystal * bonus);
    if (r.stardust)      stardust += Math.floor(r.stardust * bonus);
    if (r.chest)         { chestCount += r.chest; }
    if (r.deckEditItems) deckEditItems += r.deckEditItems;

    const rewardStr = Object.entries(r).map(([k,v])=>{
        const adj = k==='crystal'||k==='stardust' ? Math.floor(v*bonus) : v;
        const icons={crystal:'💎',stardust:'✨',chest:'📦',deckEditItems:'🎟️'};
        return `${icons[k]||k}×${adj}`;
    }).join(' ');

    showToast(`✅ クエスト完了！${rewardStr}`);

    // 全完了チェック → 次回更新時まで待つ
    fullRender();
};

window.refreshQuests = () => {
    if (crystal < 10) return;
    crystal -= 10;
    generateQuests();
    showToast('🔄 クエストを更新しました！');
    fullRender();
};
window.setActiveTab = (id) => {
    activeTab = id;
    fullRender();
};

window.toggleBuyMode = () => {
    buyMode = buyMode === '1' ? 'MAX' : '1';
    fullRender();
};

window.buyLetterLevel = (char) => {
    const maxLevel = TIERS[letters[char].tier].maxLevel;
    if (buyMode === '1') {
        const cost = getLetterUpgradeCost(letters[char].level);
        if (wp >= cost && letters[char].level < maxLevel) {
            wp -= cost;
            letters[char].level++;
            fullRender();
        }
    } else {
        let cost = getLetterUpgradeCost(letters[char].level);
        let count = 0;
        while (wp >= cost && letters[char].level < maxLevel) {
            wp -= cost;
            letters[char].level++;
            cost = getLetterUpgradeCost(letters[char].level);
            count++;
        }
        if (count > 0) fullRender();
    }
};

window.buyLetterTier = (char) => {
    const currentTier = letters[char].tier;
    if (currentTier >= 5) return;
    const tierInfo = TIERS[currentTier];
    if (letters[char].level < tierInfo.maxLevel) return;

    const cost = tierInfo.cost;
    if (wp >= cost) {
        wp -= cost;
        letters[char].tier++;
        fullRender();
    }
};

// --- ガチャロジック ---
function selectGachaWord(pool, rates) {
    const r = Math.random() * 100;
    let acc = 0;
    let selectedRarity = 'N';
    for (const [rarity, rate] of Object.entries(rates)) {
        acc += rate;
        if (r < acc) { selectedRarity = rarity; break; }
    }
    const rarityPool = pool.filter(k => {
        const data = WORD_DATA[k] || HEAT_WORDS[k];
        return data && data.rarity === selectedRarity;
    });
    if (rarityPool.length === 0) {
        // Fallback: pick any from pool
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return rarityPool[Math.floor(Math.random() * rarityPool.length)];
}

function processWordGachaResult(wordKey) {
    const state = wordsState[wordKey];
    const tierInfo = WORD_TIERS[state.tier];
    if (!state.unlocked) {
        state.unlocked = true;
        state.inDeck = true;
        return { type: 'new', label: '✨ 新規解放！' };
    } else if (state.level < getWordTierMaxLevel(state.tier)) {
        state.level++;
        return { type: 'enhance', label: `⬆ 強化 Lv.${state.level}` };
    } else if (state.tier < 5) {
        state.tier++;
        state.level = 1;
        return { type: 'evolve', label: `🌟 進化 → ${WORD_TIERS[state.tier].name}` };
    } else {
        state.overflowBonus = (state.overflowBonus || 0) + 1;
        return { type: 'overflow', label: `💫 限界突破 +2%` };
    }
}

function processHeatGachaResult(wordKey) {
    const state = heatWordsState[wordKey];
    if (!state.unlocked) {
        state.unlocked = true;
        state.inDeck = true;
        return { type: 'new', label: '🔥 新規解放！' };
    } else {
        // Heat words have no level, so just give overflow bonus (WP boost flag)
        state.overflowBonus = (state.overflowBonus || 0) + 1;
        return { type: 'overflow', label: `💫 限界突破 +2%` };
    }
}

function getHeatWordEffectiveWp(wordKey) {
    const overflow = (heatWordsState[wordKey] && heatWordsState[wordKey].overflowBonus) || 0;
    return HEAT_WORDS[wordKey].baseWp * (1 + overflow * 0.02);
}

window.pullGacha = (poolId, count) => {
    let pool, rates, pityGetter, pitySetter, processor, costKey, currencyCheck;

    if (poolId === 'wp') {
        pool = WORD_GACHA_POOLS.wp;
        processor = processWordGachaResult;
        pityGetter = () => wordGachaPityWp;
        pitySetter = (v) => { wordGachaPityWp = v; };
    } else if (poolId === 'crystal') {
        pool = WORD_GACHA_POOLS.crystal;
        processor = processWordGachaResult;
        pityGetter = () => wordGachaPityCrystal;
        pitySetter = (v) => { wordGachaPityCrystal = v; };
    } else { // heat
        pool = HEAT_GACHA_POOL;
        processor = processHeatGachaResult;
        pityGetter = () => heatGachaPity;
        pitySetter = (v) => { heatGachaPity = v; };
    }

    const _gachaDisc = Math.min(0.5, getPrestigeGachaDisc()); // 最大50%割引
    const _rawCost = count === 1 ? pool.cost1 : count === 10 ? pool.cost10 : pool.cost100;
    const totalCost = Math.ceil(_rawCost * (1 - _gachaDisc));
    const currency = pool.currency;
    const hasFunds = currency === 'wp' ? wp >= totalCost : crystal >= totalCost;
    if (!hasFunds) return;

    if (currency === 'wp') wp -= totalCost;
    else crystal -= totalCost;

    // 統計更新
    questProgress.gacha += count;
    lifetimeStats.gacha += count;
    // OMNIPOTENCE実績チェック
    if (wordsState['OMNIPOTENCE']?.unlocked) lifetimeStats.hasOmnipotence = true;
    lifetimeStats.unlockedWords = Object.values(wordsState).filter(s=>s.unlocked).length;

    const results = [];
    for (let i = 0; i < count; i++) {
        let pity = pityGetter();
        let rates = { ...pool.rates };

        // 天井: 100連でSSR確定
        if (pity >= GACHA_PITY_LIMIT - 1) {
            rates = { N: 0, R: 0, SR: 0, SSR: 60, UR: 30, LR: 10 };
            pitySetter(0);
        } else {
            pitySetter(pity + 1);
        }

        const wordKey = selectGachaWord(pool.pool, rates);
        const result = processor(wordKey);
        const rarity = (WORD_DATA[wordKey] || HEAT_WORDS[wordKey]).rarity;
        results.push({ wordKey, result, rarity });
    }

    // モーダル表示
    const rInfo = (r) => RARITY_COLORS[r];
    const resultHtml = results.map(({ wordKey, result, rarity }) => {
        const ri = rInfo(rarity);
        const typeColor = result.type === 'overflow' ? 'text-cyan-300' :
                          result.type === 'evolve'   ? 'text-yellow-400' :
                          result.type === 'new'      ? 'text-green-400' : 'text-blue-300';
        return `<div class="flex items-center justify-between py-1.5 border-b border-gray-800">
            <span class="text-xs font-bold px-1.5 py-0.5 rounded ${ri.bg} ${ri.color} border ${ri.border}">${rarity}</span>
            <span class="font-bold tracking-widest ${ri.color} mx-2">${wordKey}</span>
            <span class="text-xs ${typeColor} font-bold">${result.label}</span>
        </div>`;
    }).join('');

    showModal('ガチャ結果', resultHtml);
    lifetimeStats.unlockedWords = Object.values(wordsState).filter(s=>s.unlocked).length;
    if (wordsState['OMNIPOTENCE']?.unlocked) lifetimeStats.hasOmnipotence = true;
    checkAchievements();
    fullRender();
};

window.unlockWord = (wordKey) => {}; // legacy stub
window.unlockHeatWord = (wordKey) => {}; // legacy stub

window.buyWordLevel = (wordKey) => {
    const maxLevel = getWordTierMaxLevel(wordsState[wordKey].tier);
    if (buyMode === '1') {
        const cost = getWordUpgradeCost(wordKey);
        if (wp >= cost && wordsState[wordKey].level < maxLevel) {
            wp -= cost;
            wordsState[wordKey].level++;
            fullRender();
        }
    } else {
        let count = 0;
        let cost = getWordUpgradeCost(wordKey);
        while (wp >= cost && wordsState[wordKey].level < maxLevel && count < 1000) {
            wp -= cost;
            wordsState[wordKey].level++;
            cost = getWordUpgradeCost(wordKey);
            count++;
        }
        if (count > 0) fullRender();
    }
};

window.buyWordTier = (wordKey) => {
    const state = wordsState[wordKey];
    const currentTier = state.tier;
    if (currentTier >= 5) return;
    
    const tierInfo = WORD_TIERS[currentTier];
    if (state.level < getWordTierMaxLevel(state.tier)) return;

    const cost = getWordEvolveCost(wordKey);
    if (wp >= cost) {
        wp -= cost;
        state.tier++;
        fullRender();
    }
};

window.toggleDeckWord = (wordKey) => {
    if (deckEditItems <= 0) {
        showToast('編成チケットが足りません。宝箱から入手してください。', 'error');
        return;
    }
    const state = wordsState[wordKey];
    const activeDeck = getActiveDeck();
    
    if (state.inDeck) {
        if (activeDeck.length > 1) {
            state.inDeck = false;
            deckEditItems--;
            if (currentWordKey === wordKey) drawWord();
            fullRender();
        } else {
            showToast('最低でも1つの単語は編成に残す必要があります', 'error');
        }
    } else {
        state.inDeck = true;
        deckEditItems--;
        fullRender();
    }
};

window.toggleHeatDeckWord = (wordKey) => {
    if (deckEditItems <= 0) {
        showToast('編成チケットが足りません。宝箱から入手してください。', 'error');
        return;
    }
    const state = heatWordsState[wordKey];
    const activeDeck = getActiveHeatDeck();
    
    if (state.inDeck) {
        if (activeDeck.length > 1) {
            state.inDeck = false;
            deckEditItems--;
            if (currentHeatWordKey === wordKey) drawHeatWord();
            fullRender();
        } else {
            showToast('最低でも1つのヒート単語は編成に残す必要があります', 'error');
        }
    } else {
        state.inDeck = true;
        deckEditItems--;
        fullRender();
    }
};

window.buyArtifact = (id) => {
    if (id === 'limitBreak') return;
    const artifact = ARTIFACTS[id];
    let currentLevel = artifacts[id];
    const maxLevel = getArtifactMaxLevel(id);

    if (buyMode === '1') {
        if (currentLevel >= maxLevel) return;
        const cost = artifact.baseCost * (currentLevel + 1);
        if (crystal >= cost) {
            crystal -= cost;
            artifacts[id]++;
            fullRender();
        }
    } else {
        let count = 0;
        while (currentLevel < maxLevel) {
            const cost = artifact.baseCost * (currentLevel + 1);
            if (crystal >= cost) {
                crystal -= cost;
                currentLevel++;
                artifacts[id] = currentLevel;
                count++;
            } else {
                break;
            }
        }
        if (count > 0) fullRender();
    }
};

window.buyUltimate = (id) => {
    if (id === 'limitBreak') return;
    const ultimate = ULTIMATES[id];
    let currentLevel = ultimates[id];
    const maxLevel = getUltimateMaxLevel(id);

    if (buyMode === '1') {
        if (currentLevel >= maxLevel) return;
        const cost = ultimate.baseCost * (currentLevel + 1);
        if (stardust >= cost) {
            stardust -= cost;
            ultimates[id]++;
            fullRender();
        }
    } else {
        let count = 0;
        while (currentLevel < maxLevel) {
            const cost = ultimate.baseCost * (currentLevel + 1);
            if (stardust >= cost) {
                stardust -= cost;
                currentLevel++;
                ultimates[id] = currentLevel;
                count++;
            } else {
                break;
            }
        }
        if (count > 0) fullRender();
    }
};

window.convertWpToCrystal = () => {
    const skillFx = getActiveSkillEffects();
    const convertCost = Math.floor(5000 * (1 - (skillFx.crystal_convert || 0)));
    if (buyMode === '1') {
        if (wp >= convertCost) {
            wp -= convertCost;
            crystal++;
            fullRender();
        }
    } else {
        const amount = Math.floor(wp / convertCost);
        if (amount > 0) {
            wp -= amount * convertCost;
            crystal += amount;
            fullRender();
        }
    }
};

window.convertCrystalToStardust = () => {
    if (buyMode === '1') {
        if (crystal >= 5000) {
            crystal -= 5000;
            stardust++;
            fullRender();
        }
    } else {
        const amount = Math.floor(crystal / 5000);
        if (amount > 0) {
            crystal -= amount * 5000;
            stardust += amount;
            fullRender();
        }
    }
};