import React from 'react';

const TimeScheduleInput = ({ schedule, setSchedule }) => {
  
  const handleAddTime = () => setSchedule([...schedule, "08:00"]);

  const handleRemoveTime = (index) => {
    if (schedule.length === 1) return;
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index, val) => {
    const updated = [...schedule];
    updated[index] = val;
    setSchedule(updated);
  };

  return (
    <div style={{ marginTop:'0.5rem', marginBottom:'0.5rem', background:'rgba(255,255,255,0.03)', padding:'0.8rem', borderRadius:'8px', border: '1px solid var(--border-color)' }}>
      <label className="label" style={{ marginBottom:'0.5rem', display:'block', fontSize:'0.85rem' }}>
        Schedule ({schedule.length}x daily)
      </label>
      
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {schedule.map((time, index) => (
          <div key={index} style={{ display:'flex', gap:'0.5rem', alignItems: 'center' }}>
            <span style={{fontSize: '0.8rem', opacity: 0.7, width: '20px'}}>{index + 1}.</span>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              className="input-modern"
              style={{ flex:1 }}
            />
            {schedule.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveTime(index)}
                style={{ background:'rgba(239,68,68,0.2)', color:'#ef4444', border:'none', borderRadius:'8px', width:'36px', height:'36px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              >✕</button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddTime}
        style={{ marginTop:'0.75rem', width:'100%', background:'transparent', border:'1px dashed var(--text-muted)', color:'var(--text-muted)', padding:'8px', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}
      >
        + Add Another Time
      </button>
    </div>
  );
};

export default TimeScheduleInput;