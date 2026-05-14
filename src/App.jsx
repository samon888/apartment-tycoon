import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { ROOM_GRADES, FLOOR_COST_BASE } from './constants';
import './index.css';

// 万単位フォーマット
const formatMoney = (amount) => {
  if (amount <= 10000) return amount.toLocaleString() + '円';
  const man = Math.floor(amount / 10000);
  const remainder = amount % 10000;
  if (remainder === 0) return `${man.toLocaleString()}万円`;
  return `${man.toLocaleString()}万${remainder.toLocaleString()}円`;
};

// 棒グラフコンポーネント
const StatBar = ({ label, value, max, colorClass, displayValue }) => (
  <div style={{ marginBottom: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px', color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span>{displayValue ?? value}</span>
    </div>
    <div className="progress-bar" style={{ height: '4px' }}>
      <div className={`progress-fill ${colorClass}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }}></div>
    </div>
  </div>
);

// ミニゲームモーダル
const MiniGameModal = ({ room, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [clicks, setClicks] = useState(0);
  const [btnPos, setBtnPos] = useState({ top: '40%', left: '40%' });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      // 終了時の処理：本来の家賃をベースに、クリック数×5%（最大90%）を回収
      const recoveryRate = Math.min(0.9, clicks * 0.05);
      const recoveredAmount = Math.floor(room.delinquentAmount * recoveryRate);
      onComplete(room.id, recoveredAmount);
    }
  }, [timeLeft, clicks, onComplete, room]);

  const moveButton = () => {
    const top = Math.floor(Math.random() * 80) + 10;
    const left = Math.floor(Math.random() * 80) + 10;
    setBtnPos({ top: `${top}%`, left: `${left}%` });
  };

  const handleBtnClick = () => {
    setClicks(prev => prev + 1);
    moveButton();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ color: 'var(--error-color)', marginBottom: '8px' }}>滞納家賃の催促！</h2>
        <p>第{room.id}号室の {room.tenant.name} さんに催促して家賃を回収しましょう。</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '1.2rem' }}>残り: {timeLeft}秒</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--success-color)' }}>{clicks}回 成功</span>
        </div>
        
        <div className="game-area">
          <button 
            className="fleeing-btn" 
            style={{ top: btnPos.top, left: btnPos.left }}
            onClick={handleBtnClick}
          >
            家賃を払え！
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          ※ボタンを押した回数に応じて回収額が増加します。<br />
          （本来の回収予定額: {formatMoney(room.delinquentAmount)}）
        </p>
      </div>
    </div>
  );
};

function RoomCard({ room, funds, upgradeRoom, selectTenant, repairRoom, changeRent, evictTenant, openMiniGame }) {
  const grade = room.gradeId ? ROOM_GRADES.find(g => g.id === room.gradeId) : null;

  const handleRentChange = (amount) => {
    const newRent = Math.max(0, room.rent + amount);
    changeRent(room.id, newRent);
  };

  const handleUpgrade = (e) => {
    const newGradeId = Number(e.target.value);
    if (newGradeId && newGradeId !== room.gradeId) {
      upgradeRoom(room.id, newGradeId);
    }
  };

  // カラー判定
  let satColor = 'success';
  if (room.satisfaction < 30) satColor = 'danger';
  else if (room.satisfaction < 60) satColor = 'warning';

  let durColor = 'info';
  if (room.durability < 20) durColor = 'danger';
  else if (room.durability < 50) durColor = 'warning';

  const gradeColor = grade ? grade.color : '#475569';
  const cardStyle = {
    borderTop: `4px solid ${room.isDelinquent ? 'var(--error-color)' : gradeColor}`,
    boxShadow: room.isDelinquent ? '0 4px 12px rgba(239, 68, 68, 0.3)' : (grade ? `0 4px 12px ${gradeColor}20` : undefined)
  };

  return (
    <div className="room-card" style={cardStyle}>
      <div className="room-header">
        <div className="room-title" style={{ color: room.isDelinquent ? 'var(--error-color)' : gradeColor }}>第{room.id}号室</div>
        <div className={`status-badge ${room.gradeId === null ? '' : (room.isDelinquent ? 'vacant' : (room.isOccupied ? 'occupied' : 'vacant'))}`}>
          {room.gradeId === null ? '未設定' : (room.isDelinquent ? '滞納中' : (room.isOccupied ? '入居中' : '募集中'))}
        </div>
      </div>
      
      <div className="room-details">
        {room.gradeId === null ? (
          <div className="grade-selection">
            <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              入居者を募集する前にグレードを購入してください。
            </p>
            <select className="upgrade-select" value="" onChange={handleUpgrade}>
              <option value="" disabled>グレードを購入...</option>
              {ROOM_GRADES.map(g => (
                <option key={g.id} value={g.id} disabled={funds < g.cost}>
                  {g.name} ({formatMoney(g.cost)}) {funds < g.cost ? ' - 資金不足' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="detail-row">
              <span style={{ fontSize: '0.875rem' }}>グレード</span>
              <span style={{ fontWeight: 'bold', color: grade.color }}>{grade.name}</span>
            </div>

            {/* 耐久値バー */}
            <div className="progress-bar-container" style={{ marginTop: '12px' }}>
              <div className="progress-label">
                <span>耐久値</span>
                <span>{Math.floor(room.durability)}%</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${durColor}`} style={{ width: `${room.durability}%` }}></div>
              </div>
              {room.durability < 100 && (
                <button 
                  style={{ width: '100%', marginTop: '8px', padding: '4px', fontSize: '0.75rem' }} 
                  onClick={() => repairRoom(room.id)}
                >
                  🔧 改修する
                </button>
              )}
            </div>
            
            {/* 家賃コントロール */}
            <div className="detail-row" style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '0.875rem' }}>家賃 (月額)</span>
              <div className="rent-controls">
                <button className="rent-btn" onClick={() => handleRentChange(-100)}>-100</button>
                <input 
                  type="number" 
                  className="rent-input" 
                  value={room.rent} 
                  onChange={(e) => changeRent(room.id, Number(e.target.value))}
                />
                <button className="rent-btn" onClick={() => handleRentChange(100)}>+100</button>
              </div>
            </div>

            {/* 入居者ありの場合 */}
            {room.isOccupied && room.tenant && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <div className="detail-row">
                  <span style={{ fontWeight: 'bold', color: room.isDelinquent ? 'var(--error-color)' : 'inherit' }}>
                    👤 {room.tenant.name} {room.isDelinquent && '⚠️'}
                  </span>
                </div>
                
                {room.isDelinquent && (
                  <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--error-color)', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--error-color)', marginBottom: '8px' }}>
                      現在家賃を滞納しています！収入が得られません。
                    </p>
                    <button 
                      className="danger" 
                      style={{ width: '100%', padding: '6px', fontSize: '0.875rem' }}
                      onClick={() => openMiniGame(room)}
                    >
                      💢 家賃を催促する
                    </button>
                  </div>
                )}

                <div className="progress-bar-container">
                  <div className="progress-label">
                    <span>満足度</span>
                    <span>{Math.floor(room.satisfaction)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${satColor}`} style={{ width: `${room.satisfaction}%` }}></div>
                  </div>
                </div>

                <button 
                  className="danger" 
                  style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '0.875rem', backgroundColor: 'transparent', border: '1px solid var(--error-color)', color: 'var(--error-color)' }} 
                  onClick={() => evictTenant(room.id)}
                >
                  🚪 強制退去させる
                </button>
              </div>
            )}

            {/* 空室の場合（アップグレード ＆ オーディション） */}
            {!room.isOccupied && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>部屋の改装（アップグレード）</span>
                  <select className="upgrade-select" value="" onChange={handleUpgrade}>
                    <option value="" disabled>グレードを変更...</option>
                    {ROOM_GRADES.map(g => (
                      <option key={g.id} value={g.id} disabled={funds < g.cost || g.id === room.gradeId}>
                        {g.name} ({formatMoney(g.cost)}) {funds < g.cost ? ' - 資金不足' : (g.id === room.gradeId ? ' - 現在のグレード' : '')}
                      </option>
                    ))}
                  </select>
                </div>

                {room.candidates && room.candidates.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>入居者オーディション</span>
                    <div className="candidates-list">
                      {room.candidates.map(c => (
                    <div key={c.id} className="candidate-card">
                      <div className="candidate-name">{c.name}</div>
                      <div className="candidate-stats-bars" style={{ margin: '8px 0' }}>
                        <StatBar label="滞納リスク" value={c.delinquencyRate} max={100} colorClass={c.delinquencyRate > 20 ? 'danger' : 'warning'} displayValue={`${c.delinquencyRate}%`} />
                        <StatBar label="破壊リスク" value={c.destructionRate} max={2.5} colorClass={c.destructionRate > 1.5 ? 'danger' : 'warning'} displayValue={`${c.destructionRate}x`} />
                        <StatBar label="騒音リスク" value={c.noiseLevel} max={100} colorClass={c.noiseLevel > 60 ? 'danger' : 'warning'} displayValue={c.noiseLevel} />
                        <StatBar label="マナー良さ" value={c.mannersLevel} max={100} colorClass={c.mannersLevel > 60 ? 'success' : 'info'} displayValue={c.mannersLevel} />
                      </div>
                      <button className="candidate-btn" onClick={() => selectTenant(room.id, c)}>
                        この人を入居させる
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const { 
    funds, debt, floors, rooms, events, currentIncome,
    buildFloor, upgradeRoom, selectTenant, repairRoom, changeRent, repayDebt, evictTenant, resolveDelinquency 
  } = useGameEngine();

  const [miniGameRoom, setMiniGameRoom] = useState(null);

  const handleMiniGameComplete = (roomId, recoveredAmount) => {
    resolveDelinquency(roomId, recoveredAmount);
    setMiniGameRoom(null);
  };

  // 階層ごとに部屋をグループ化
  const floorsMap = {};
  for (let i = 1; i <= floors; i++) {
    floorsMap[i] = rooms.filter(r => r.floor === i);
  }

  return (
    <div className="app-container">
      {miniGameRoom && (
        <MiniGameModal 
          room={miniGameRoom} 
          onComplete={handleMiniGameComplete} 
          onClose={() => setMiniGameRoom(null)} 
        />
      )}

      <div className="dashboard">
        <div className="stat-box">
          <span className="stat-label">現在の資金</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="stat-value funds">{formatMoney(funds)}</span>
            <span style={{ fontSize: '1rem', color: 'var(--success-color)', fontWeight: 'bold' }}>
              (+{formatMoney(currentIncome)}/秒)
            </span>
          </div>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">借金残高</span>
          <span className="stat-value debt">{formatMoney(debt)}</span>
        </div>

        <div className="actions">
          <button onClick={() => buildFloor()}>
            🏢 {floors + 1}階を増築 ({formatMoney(FLOOR_COST_BASE * floors)})
          </button>
          <button className="danger" onClick={() => repayDebt(10000000)}>💰 1000万円返済</button>
          <button className="danger" onClick={() => repayDebt(100000000)}>💰 1億円返済</button>
        </div>
      </div>

      <div className="main-layout">
        <div className="apartment-container">
          {Object.keys(floorsMap).sort((a,b) => b - a).map(floorStr => {
            const floor = Number(floorStr);
            const floorRooms = floorsMap[floor];
            return (
              <div key={floor} className="floor-section">
                <div className="floor-title">{floor}F</div>
                <div className="apartment-view">
                  {floorRooms.map(room => (
                    <RoomCard 
                      key={room.id} 
                      room={room} 
                      funds={funds}
                      upgradeRoom={upgradeRoom}
                      selectTenant={selectTenant}
                      repairRoom={repairRoom}
                      changeRent={changeRent} 
                      evictTenant={evictTenant}
                      openMiniGame={setMiniGameRoom}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="event-log">
          <h3>📋 イベントログ</h3>
          {events.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>イベントはありません</p>}
          {events.map(ev => (
            <div key={ev.id} className={`log-item ${ev.type}`}>
              {ev.message}
              <span className="log-time">{ev.time.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
