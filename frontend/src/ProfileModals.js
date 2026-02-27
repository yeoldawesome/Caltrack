import React, { useState } from 'react';

export function ChangeUsernameModal({ onClose, onSubmit, loading, error, currentUsername }) {
  const [username, setUsername] = useState(currentUsername || '');
  return (
    <Modal onClose={onClose} title="Change Username">
      <form onSubmit={e => { e.preventDefault(); onSubmit(username); }}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="New username"
          style={inputStyle}
          autoFocus
        />
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={btnStyle} disabled={loading}>Save</button>
          <button type="button" style={btnStyle} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export function ChangePasswordModal({ onClose, onSubmit, loading, error }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  return (
    <Modal onClose={onClose} title="Change Password">
      <form onSubmit={e => { e.preventDefault(); onSubmit(oldPassword, newPassword); }}>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          placeholder="Current password"
          style={inputStyle}
          autoFocus
        />
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New password"
          style={inputStyle}
        />
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={btnStyle} disabled={loading}>Save</button>
          <button type="button" style={btnStyle} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export function ChangeProfilePicModal({ onClose, onSubmit, loading, error, currentPic }) {
  const [pic, setPic] = useState(currentPic || '');
  const [preview, setPreview] = useState(currentPic || '');
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPic(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }
  return (
    <Modal onClose={onClose} title="Change Profile Picture">
      <form onSubmit={e => { e.preventDefault(); onSubmit(pic); }}>
        <input type="file" accept="image/*" onChange={handleFile} style={{ marginBottom: 12 }} />
        {preview && <img src={preview} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12, objectFit: 'cover' }} />}
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={btnStyle} disabled={loading || !pic}>Save</button>
          <button type="button" style={btnStyle} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000a', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272b', borderRadius: 16, padding: 24, minWidth: 320, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <h3 style={{ color: '#4fd1c5', marginBottom: 12 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  marginBottom: 10,
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #353b41',
  background: '#23272b',
  color: '#f5f6fa',
  fontSize: 16,
};
const btnStyle = {
  background: '#4fd1c5',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
};
