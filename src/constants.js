export const ROOM_GRADES = [
  { id: 1, name: 'ボロ部屋', cost: 500000, baseRent: 50000, maxSatisfaction: 50, color: '#94a3b8' },
  { id: 2, name: '木造アパート', cost: 2000000, baseRent: 80000, maxSatisfaction: 60, color: '#8b5cf6' },
  { id: 3, name: '一般マンション', cost: 5000000, baseRent: 150000, maxSatisfaction: 70, color: '#3b82f6' },
  { id: 4, name: 'デザイナーズ物件', cost: 15000000, baseRent: 300000, maxSatisfaction: 80, color: '#06b6d4' },
  { id: 5, name: '高級マンション', cost: 50000000, baseRent: 800000, maxSatisfaction: 90, color: '#10b981' },
  { id: 6, name: 'プレミアムレジデンス', cost: 150000000, baseRent: 2000000, maxSatisfaction: 95, color: '#84cc16' },
  { id: 7, name: 'タワーマンション低層', cost: 400000000, baseRent: 5000000, maxSatisfaction: 100, color: '#f59e0b' },
  { id: 8, name: 'タワーマンション高層', cost: 1000000000, baseRent: 15000000, maxSatisfaction: 120, color: '#f97316' },
  { id: 9, name: 'ペントハウス', cost: 3000000000, baseRent: 50000000, maxSatisfaction: 150, color: '#ef4444' },
  { id: 10, name: '超VIPルーム', cost: 8000000000, baseRent: 200000000, maxSatisfaction: 200, color: '#ec4899' },
];

export const INITIAL_FUNDS = 50000000;
export const INITIAL_DEBT = 10000000000;

export const FLOOR_COST_BASE = 20000000; // 階層増築の基本コスト
export const ROOMS_PER_FLOOR = 4; // 1フロアあたりの部屋数

// テナントの名字リスト
export const TENANT_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', 
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', 
  'スミス', 'ジョンソン', 'ウィリアムズ', 'ブラウン', 'ジョーンズ'
];

// 耐久値減少のベース（3600秒で100減る = 1秒あたり約0.0277）
export const BASE_DURABILITY_DECAY = 100 / 3600;

// 修繕費用のベース係数（修繕費 ＝ グレード建設費 × 減少割合 × 0.05）
export const REPAIR_COST_MULTIPLIER = 0.05;
