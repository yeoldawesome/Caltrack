import React, { useState } from 'react';

const Settings = ({ onClose, settings, setSettings, user, handleLogout }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch calorie limit for logged-in user
  React.useEffect(() => {
    fetch((process.env.REACT_APP_API_URL || 'http://localhost:4000') + '/api/calorie-limit', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setLocalSettings({ dailyLimit: data.calorieLimit });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings({ ...localSettings, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:4000') + '/api/calorie-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ calorieLimit: localSettings.dailyLimit })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSettings(localSettings);
      onClose();
    } catch (err) {
      setError('Failed to save calorie limit');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000a', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272b', borderRadius: 16, padding: 24, minWidth: 320, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h3 style={{ color: '#4fd1c5', marginBottom: 12 }}>Settings</h3>
        {user && (
          <div style={{ marginBottom: 16, color: '#4fd1c5', fontWeight: 600, fontSize: 16 }}>
            {user.email}
            <button onClick={handleLogout} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Logout</button>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#f5f6fa', fontWeight: 500, marginRight: 8 }}>Daily Calorie Limit:</label>
          <input
            type="number"
            name="dailyLimit"
            value={localSettings.dailyLimit || ''}
            onChange={handleChange}
            style={{ width: 80, background: '#23272b', color: '#f5f6fa', border: '1px solid #353b41', borderRadius: 6, padding: '4px 8px' }}
            disabled={saving}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button onClick={handleSave} disabled={saving} style={{ background: '#4fd1c5', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
};

export default Settings;
