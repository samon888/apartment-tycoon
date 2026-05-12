import { useState, useEffect, useCallback } from 'react';
import { 
  ROOM_GRADES, INITIAL_FUNDS, INITIAL_DEBT, 
  FLOOR_COST_BASE, ROOMS_PER_FLOOR, TENANT_NAMES, 
  BASE_DURABILITY_DECAY, REPAIR_COST_MULTIPLIER 
} from '../constants';

const generateCandidates = () => {
  return Array.from({ length: 3 }).map(() => ({
    id: Math.random().toString(36).substr(2, 9),
    name: TENANT_NAMES[Math.floor(Math.random() * TENANT_NAMES.length)],
    delinquencyRate: Math.floor(Math.random() * 30), // 0%〜30%
    destructionRate: Number((Math.random() * 2.0 + 0.5).toFixed(2)), // 0.5x〜2.5x
    noiseLevel: Math.floor(Math.random() * 100), // 0〜100
    mannersLevel: Math.floor(Math.random() * 100) // 0〜100
  }));
};

const createRoomsForFloor = (floorNumber) => {
  return Array.from({ length: ROOMS_PER_FLOOR }).map((_, idx) => ({
    id: `${floorNumber}0${idx + 1}`,
    floor: floorNumber,
    gradeId: null,
    rent: 0,
    durability: 100,
    isOccupied: false,
    satisfaction: 100,
    tenant: null,
    candidates: []
  }));
};

export const useGameEngine = () => {
  const [funds, setFunds] = useState(INITIAL_FUNDS);
  const [debt, setDebt] = useState(INITIAL_DEBT);
  const [floors, setFloors] = useState(1);
  const [rooms, setRooms] = useState(createRoomsForFloor(1));
  const [events, setEvents] = useState([]);
  
  const addEvent = useCallback((message, type = 'info') => {
    setEvents(prev => [{ id: Date.now() + Math.random(), message, type, time: new Date() }, ...prev].slice(0, 50));
  }, []);

  // 1秒ごとのゲームループ
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms(prevRooms => {
        let newFundsDelta = 0;
        let newRooms = [...prevRooms];
        let newEvents = [];
        let noiseFloors = new Set(); // 騒音が発生したフロア

        // --- 個別部屋の処理 ---
        newRooms = newRooms.map(room => {
          if (room.gradeId === null) return room; // グレード未設定はスキップ
          
          let updatedRoom = { ...room };
          const grade = ROOM_GRADES.find(g => g.id === room.gradeId);

          if (!updatedRoom.isOccupied) {
            // 空室の場合、候補者がいなければ生成
            if (!updatedRoom.candidates || updatedRoom.candidates.length === 0) {
              updatedRoom.candidates = generateCandidates();
            }
          } else {
            // 入居中の場合
            const tenant = updatedRoom.tenant;
            
            // 1. 家賃の回収（滞納率の判定）
            const isDelinquent = Math.random() < (tenant.delinquencyRate / 100);
            if (!isDelinquent) {
              newFundsDelta += updatedRoom.rent;
            } else if (Math.random() < 0.05) {
              // 滞納イベントをたまにログに出す
              newEvents.push({ message: `第${updatedRoom.id}号室の${tenant.name}さんが家賃を滞納しています…`, type: 'warning' });
            }

            // 2. 耐久値の減少
            updatedRoom.durability -= BASE_DURABILITY_DECAY * tenant.destructionRate;
            if (updatedRoom.durability <= 0) {
              updatedRoom.durability = 0;
              updatedRoom.isOccupied = false;
              updatedRoom.tenant = null;
              updatedRoom.candidates = [];
              newEvents.push({ message: `第${updatedRoom.id}号室がボロボロになり、住人が退去しました！早急に改修してください。`, type: 'error' });
            }

            // 3. 騒音トラブルの判定（noiseLevel% の確率で5分(300秒)に1回発生）
            if (Math.random() < (tenant.noiseLevel / 100) / 300) {
              noiseFloors.add(updatedRoom.floor);
              newEvents.push({ message: `第${updatedRoom.id}号室からひどい騒音が発生し、${updatedRoom.floor}階の住人の満足度が低下しました！`, type: 'error' });
            }

            // 4. 家賃による満足度変動
            if (updatedRoom.isOccupied) {
              const rentRatio = updatedRoom.rent / grade.baseRent;
              let satisfactionDelta = 0;
              if (rentRatio > 1.5) satisfactionDelta = -5;
              else if (rentRatio > 1.2) satisfactionDelta = -2;
              else if (rentRatio < 0.8) satisfactionDelta = 1;
              
              updatedRoom.satisfaction = Math.min(100, Math.max(0, updatedRoom.satisfaction + satisfactionDelta));

              // 満足度0による退去
              if (updatedRoom.satisfaction <= 0) {
                updatedRoom.isOccupied = false;
                updatedRoom.tenant = null;
                updatedRoom.candidates = [];
                newEvents.push({ message: `第${updatedRoom.id}号室の${tenant.name}さんが不満を爆発させて退去しました…`, type: 'error' });
              }
            }
          }
          return updatedRoom;
        });

        // --- 騒音による同階の満足度低下を適用 ---
        if (noiseFloors.size > 0) {
          newRooms = newRooms.map(room => {
            if (room.isOccupied && noiseFloors.has(room.floor)) {
              return { ...room, satisfaction: Math.max(0, room.satisfaction - 15) };
            }
            return room;
          });
        }

        // --- グローバルイベント（火事・空き巣）の判定 ---
        // 10分(600秒)に1回の確率
        if (Math.random() < 1 / 600) {
          const occupiedRooms = newRooms.filter(r => r.isOccupied);
          if (occupiedRooms.length > 0) {
            const targetRoom = occupiedRooms[Math.floor(Math.random() * occupiedRooms.length)];
            
            // 50%で火事、50%で空き巣
            if (Math.random() < 0.5) {
              // 火事：グレードリセット、全焼
              newRooms = newRooms.map(r => {
                if (r.id === targetRoom.id) {
                  newEvents.push({ message: `🔥 大惨事！第${targetRoom.id}号室で火事が発生し、全焼しました！グレードが初期化されます。`, type: 'error' });
                  return { ...r, gradeId: null, rent: 0, durability: 100, isOccupied: false, tenant: null, candidates: [] };
                }
                return r;
              });
            } else {
              // 空き巣：満足度激減、資金を少し失う
              newRooms = newRooms.map(r => {
                if (r.id === targetRoom.id) {
                  const stolenAmount = Math.floor(targetRoom.rent * 2);
                  newFundsDelta -= stolenAmount;
                  newEvents.push({ message: `🥷 事件！第${targetRoom.id}号室に空き巣が入り、住人が怯えています！（被害額: ${stolenAmount}円）`, type: 'warning' });
                  return { ...r, satisfaction: Math.max(0, r.satisfaction - 40) };
                }
                return r;
              });
            }
          }
        }

        if (newFundsDelta !== 0) {
          setFunds(prev => prev + newFundsDelta);
        }
        
        if (newEvents.length > 0) {
          newEvents.forEach(ev => addEvent(ev.message, ev.type));
        }

        return newRooms;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addEvent]);

  // アクション: 階層の増築
  const buildFloor = () => {
    const cost = FLOOR_COST_BASE * floors;
    if (funds >= cost) {
      setFunds(prev => prev - cost);
      setFloors(prev => prev + 1);
      setRooms(prev => [...prev, ...createRoomsForFloor(floors + 1)]);
      addEvent(`${floors + 1}階を増築しました！各部屋のグレードを設定してください。`, 'success');
    } else {
      addEvent('増築費用が足りません！', 'error');
    }
  };

  // アクション: グレードアップ（改装）
  const upgradeRoom = (roomId, targetGradeId) => {
    const targetGrade = ROOM_GRADES.find(g => g.id === targetGradeId);
    if (!targetGrade) return;

    if (funds >= targetGrade.cost) {
      setFunds(prev => prev - targetGrade.cost);
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            gradeId: targetGradeId,
            rent: targetGrade.baseRent,
            durability: 100,
            isOccupied: false,
            tenant: null,
            candidates: [],
            satisfaction: 100
          };
        }
        return room;
      }));
      addEvent(`第${roomId}号室を「${targetGrade.name}」に改装しました！`, 'success');
    } else {
      addEvent('改装費用が足りません！', 'error');
    }
  };

  // アクション: 入居者の選択（オーディション合格）
  const selectTenant = (roomId, candidate) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        addEvent(`第${roomId}号室に ${candidate.name} さんが入居しました！`, 'success');
        return {
          ...room,
          isOccupied: true,
          satisfaction: 100,
          tenant: candidate,
          candidates: []
        };
      }
      return room;
    }));
  };

  // アクション: 部屋の修繕
  const repairRoom = (roomId) => {
    setRooms(prev => {
      const room = prev.find(r => r.id === roomId);
      if (!room || room.gradeId === null || room.durability >= 100) return prev;

      const grade = ROOM_GRADES.find(g => g.id === room.gradeId);
      const missingDurability = 100 - room.durability;
      const repairCost = Math.floor(grade.cost * REPAIR_COST_MULTIPLIER * (missingDurability / 100));

      if (funds >= repairCost) {
        setFunds(f => f - repairCost);
        addEvent(`第${roomId}号室を修繕しました！（費用: ${repairCost.toLocaleString()}円）`, 'success');
        return prev.map(r => r.id === roomId ? { ...r, durability: 100 } : r);
      } else {
        addEvent('修繕費用が足りません！', 'error');
        return prev;
      }
    });
  };

  // アクション: 家賃変更
  const changeRent = (roomId, newRent) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, rent: Number(newRent) } : r));
  };

  // アクション: 強制退去
  const evictTenant = (roomId) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId && room.isOccupied) {
        addEvent(`第${roomId}号室の入居者を強制退去させました。`, 'warning');
        return { ...room, isOccupied: false, satisfaction: 100, tenant: null, candidates: [] };
      }
      return room;
    }));
  };

  // アクション: 借金返済
  const repayDebt = (amount) => {
    if (funds >= amount && debt > 0) {
      const repayAmount = Math.min(amount, debt);
      setFunds(prev => prev - repayAmount);
      setDebt(prev => prev - repayAmount);
      addEvent(`${repayAmount.toLocaleString()}円の借金を返済しました！`, 'success');
    } else if (debt <= 0) {
      addEvent('借金はすでに完済しています！', 'info');
    } else {
      addEvent('資金が足りません！', 'error');
    }
  };

  return {
    funds,
    debt,
    floors,
    rooms,
    events,
    buildFloor,
    upgradeRoom,
    selectTenant,
    repairRoom,
    changeRent,
    repayDebt,
    evictTenant
  };
};
