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
    <div style={{ marginTop:'0.5rem', marginBottom:'0.5rem', background:'rgba(255,255,255,0.03)', padding:'0.8rem', borderRadius:'8px' }}>
      <label className="label" style={{ marginBottom:'0.5rem', display:'block', fontSize:'0.85rem' }}>
        Schedule ({schedule.length}x daily)
      </label>
      
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {schedule.map((time, index) => (
          <div key={index} style={{ display:'flex', gap:'0.5rem' }}>
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
                style={{ background:'rgba(239,68,68,0.2)', color:'#ef4444', border:'none', borderRadius:'8px', width:'40px', cursor:'pointer' }}
              >✕</button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddTime}
        style={{ marginTop:'0.5rem', width:'100%', background:'transparent', border:'1px dashed var(--text-muted)', color:'var(--text-muted)', padding:'6px', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}
      >
        + Add Time
      </button>
    </div>
  );
};

export default TimeScheduleInput;