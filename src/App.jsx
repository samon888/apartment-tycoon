import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { ROOM_GRADES, FLOOR_COST_BASE } from './constants';
import './index.css';

function RoomCard({ room, funds, upgradeRoom, selectTenant, repairRoom, changeRent, evictTenant }) {
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
    borderTop: `4px solid ${gradeColor}`,
    boxShadow: grade ? `0 4px 12px ${gradeColor}20` : undefined
  };

  return (
    <div className="room-card" style={cardStyle}>
      <div className="room-header">
        <div className="room-title" style={{ color: gradeColor }}>第{room.id}号室</div>
        <div className={`status-badge ${room.gradeId === null ? '' : (room.isOccupied ? 'occupied' : 'vacant')}`}>
          {room.gradeId === null ? '未設定' : (room.isOccupied ? '入居中' : '募集中')}
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
                  {g.name} ({g.cost.toLocaleString()}円) {funds < g.cost ? ' - 資金不足' : ''}
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
                <button className="rent-btn" onClick={() => handleRentChange(-1000)}>-1k</button>
                <input 
                  type="number" 
                  className="rent-input" 
                  value={room.rent} 
                  onChange={(e) => changeRent(room.id, Number(e.target.value))}
                />
                <button className="rent-btn" onClick={() => handleRentChange(1000)}>+1k</button>
              </div>
            </div>

            {/* 入居者ありの場合 */}
            {room.isOccupied && room.tenant && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <div className="detail-row">
                  <span style={{ fontWeight: 'bold' }}>👤 {room.tenant.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                  <span>滞納率: {room.tenant.delinquencyRate}%</span>
                  <span>破壊率: {room.tenant.destructionRate}x</span>
                  <span>騒音度: {room.tenant.noiseLevel}</span>
                  <span>マナー: {room.tenant.mannersLevel}</span>
                </div>

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
                  style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '0.875rem' }} 
                  onClick={() => evictTenant(room.id)}
                >
                  🚪 強制退去させる
                </button>
              </div>
            )}

            {/* 空室の場合（オーディション） */}
            {!room.isOccupied && room.candidates && room.candidates.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>入居者オーディション</span>
                <div className="candidates-list">
                  {room.candidates.map(c => (
                    <div key={c.id} className="candidate-card">
                      <div className="candidate-name">{c.name}</div>
                      <div className="candidate-stats">
                        <span>滞納: {c.delinquencyRate}%</span>
                        <span>破壊: {c.destructionRate}x</span>
                        <span>騒音: {c.noiseLevel}</span>
                        <span>ﾏﾅｰ: {c.mannersLevel}</span>
                      </div>
                      <button className="candidate-btn" onClick={() => selectTenant(room.id, c)}>
                        この人を入居させる
                      </button>
                    </div>
                  ))}
                </div>
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
    funds, debt, floors, rooms, events, 
    buildFloor, upgradeRoom, selectTenant, repairRoom, changeRent, repayDebt, evictTenant 
  } = useGameEngine();

  // 階層ごとに部屋をグループ化
  const floorsMap = {};
  for (let i = 1; i <= floors; i++) {
    floorsMap[i] = rooms.filter(r => r.floor === i);
  }

  return (
    <div className="app-container">
      <div className="dashboard">
        <div className="stat-box">
          <span className="stat-label">現在の資金</span>
          <span className="stat-value funds">{funds.toLocaleString()} 円</span>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">借金残高</span>
          <span className="stat-value debt">{debt.toLocaleString()} 円</span>
        </div>

        <div className="actions">
          <button onClick={() => buildFloor()}>
            🏢 {floors + 1}階を増築 ({(FLOOR_COST_BASE * floors).toLocaleString()}円)
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
