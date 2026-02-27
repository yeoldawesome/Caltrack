import React, { useRef, useState } from 'react';

const defaultPic = 'https://ui-avatars.com/api/?name=User&background=4fd1c5&color=fff&rounded=true&size=64';

export default function ProfileMenu({ user, onLogout, onChangeUsername, onChangePassword, onChangeProfilePic, containerStyle }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // Close menu on outside click
  React.useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const pic = user?.profilePic || defaultPic;
  const username = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div style={containerStyle || { position: 'absolute', top: 16, left: 16, zIndex: 4200 }} ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0
        }}
        aria-label="Profile menu"
      >
        <img src={pic} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #4fd1c5', objectFit: 'cover', background: '#23272b' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 48, left: 0, background: '#23272b', border: '1px solid #353b41', borderRadius: 10, boxShadow: '0 2px 8px #0005', minWidth: 180, padding: 8 }}>
          <button onClick={onChangeProfilePic} style={menuBtnStyle}>Change Profile Picture</button>
          <button onClick={onChangeUsername} style={menuBtnStyle}>Change Username</button>
          <button onClick={onChangePassword} style={menuBtnStyle}>Change Password</button>
          <hr style={{ border: 'none', borderTop: '1px solid #353b41', margin: '8px 0' }} />
          <button onClick={onLogout} style={{ ...menuBtnStyle, color: '#ef4444' }}>Sign Out</button>
        </div>
      )}
    </div>
  );
}

const menuBtnStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#f5f6fa',
  fontWeight: 500,
  fontSize: 15,
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  marginBottom: 2,
};
