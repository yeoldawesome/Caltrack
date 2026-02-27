import React, { useState, useEffect, useRef } from 'react';
import MonthCalendar from './MonthCalendar';
import BarcodeScanner from './BarcodeScanner';
import Tesseract from 'tesseract.js';
import Settings from './Settings';

const darkBg = '#181c20';
const cardBg = '#23272b';
const accent = '#4fd1c5';
const textColor = '#f5f6fa';
const border = '#2d3237';
const inputBg = '#23272b';
const inputBorder = '#353b41';
const placeholder = '#7b848b';

function App() {
  // User auth state
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Check session on mount
  useEffect(() => {
    fetch('https://caltrack-k6yb.vercel.app/auth/user', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d && d.user) {
          setUser(d.user);
          setAuthModal(false);
        } else {
          setUser(null);
          setAuthModal(true);
        }
      })
      .catch(() => {
        setUser(null);
        setAuthModal(true);
      });
  }, []);

  // Auth handlers
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError('');
    const url = authMode === 'login' ? 'https://caltrack-k6yb.vercel.app/auth/login' : 'https://caltrack-k6yb.vercel.app/auth/signup';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error');
    }
  }

  async function handleLogout() {
    await fetch('https://caltrack-k6yb.vercel.app/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setAuthModal(true);
  }
  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ dailyLimit: 2000 });

  // Wrapper to update settings and keep dailyLimit in sync
  const updateSettings = (newSettings) => {
    const parsedLimit = newSettings && newSettings.dailyLimit !== undefined ? Number(newSettings.dailyLimit) : settings.dailyLimit;
    const merged = { ...newSettings, dailyLimit: parsedLimit };
    setSettings(merged);
    setDailyLimit(parsedLimit);
  };

  // ref for hidden file input used by Upload Image button
  const inputRef = useRef(null);

  // Load calorie limit for logged-in user
  useEffect(() => {
    if (!user) return;
    fetch('https://caltrack-k6yb.vercel.app/api/calorie-limit', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const limit = (data && (data.calorieLimit || data.dailyLimit)) || 2000;
        setSettings({ dailyLimit: limit });
        setDailyLimit(limit);
      })
      .catch(() => {
        // keep default if fetch fails
      });
  }, [user]);

  // Entry state for editing
  const [editIndex, setEditIndex] = useState(null);

  // Edit handler: populate entry form with selected entry
  function handleEditEntry(idx) {
    setEditIndex(idx);
    setEntry({ ...filteredEntries[idx] });
  }

  // Delete handler: always try to remove entry from backend if it has an id
  async function handleDeleteEntry(idx) {
    const entryToDelete = filteredEntries[idx];
    if (entryToDelete.id) {
      await fetch(`https://caltrack-k6yb.vercel.app/api/entry/${entryToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      // Refetch entries
      const entriesRes = await fetch('https://caltrack-k6yb.vercel.app/api/entries', { credentials: 'include' });
      const data = await entriesRes.json();
      setEntries(data);
    } else {
      // If no id, just remove locally
      setEntries(entries => entries.filter(e => e !== entryToDelete));
    }
  }

  // Save handler: update entry if editing, otherwise add new
  async function handleSaveEntry() {
    if (editIndex !== null) {
      // Update entry in backend if it has an id
      const entryToUpdate = filteredEntries[editIndex];
      if (entryToUpdate.id) {
        await fetch(`https://caltrack-8mwo.onrender.com/api/entry/${entryToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(entry)
        });
        // Refetch entries
        const entriesRes = await fetch('https://caltrack-8mwo.onrender.com/api/entries', { credentials: 'include' });
        const data = await entriesRes.json();
        setEntries(data);
      } else {
        // Update locally if no id
        setEntries(entries => entries.map(e => e === entryToUpdate ? entry : e));
      }
      setEditIndex(null);
      setEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    } else {
      // ...existing save logic...
    }
  }
  // Nutrition options modal state
  const [nutritionOptions, setNutritionOptions] = useState(null);
  const [servingsInput, setServingsInput] = useState(1);

  function roundVal(val) {
    return val === '' || val === undefined ? '' : Math.round(Number(val) * 100) / 100;
  }

  function handleSelectNutritionOption(option) {
    const servings = parseFloat(servingsInput) || 1;
    setEntry(e => ({
      ...e,
      name: nutritionOptions.name,
      calories: roundVal(option.calories * servings),
      protein: roundVal(option.protein * servings),
      carbs: roundVal(option.carbs * servings),
      fat: roundVal(option.fat * servings),
    }));
    setNutritionOptions(null);
    setServingsInput(1);
  }
  // Calendar state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrText, setOcrText] = useState('');

  // Parse nutrition info from OCR text
  function parseNutrition(text) {
    // Normalize text for easier matching
    const norm = text.replace(/[,|\t]/g, ' ').replace(/\s+/g, ' ');
    // Helper to match a label and extract the first number (with or without unit)
    const extract = (labels, units = ['g', 'kcal', 'cal', 'mg', '%', '']) => {
      for (const label of labels) {
        // Try to match: label ... number [unit]
        const regex = new RegExp(label + '[^\n\r0-9]*([0-9]+(?:\.[0-9]+)?)\s*(' + units.join('|') + ')?', 'i');
        const match = norm.match(regex);
        if (match) return match[1];
      }
      return '';
    };

    return {
      name: '',
      calories: extract(['calories', 'energy'], ['kcal', 'cal', '']),
      protein: extract(['protein']),
      carbs: extract(['total carbohydrate', 'carbohydrates', 'carbohydrate', 'carbs', 'carb']),
      fat: extract(['total fat', 'fat']),
    };
  }

  // Handle paste event for images
  // ...existing code...

  // Handle file input image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setOcrError('');
    setOcrText('');
    setOcrLoading(true);
    try {
      await processImage(file);
    } catch (err) {
      setOcrError('Failed to read image.');
      setOcrLoading(false);
    }
  };

  // Handle adding a new entry (submit form)
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!entry || !entry.name) return;
    const newEntry = {
      ...entry,
      // keep date as YYYY-MM-DD so optimistic entry matches filtered date
      date: selectedDate
    };
    // optimistic UI: add a temp entry immediately so the user sees it
    const tempId = `temp-${Date.now()}`;
    const tempEntry = { ...newEntry, tempId };
    setEntries(prev => [tempEntry, ...prev]);

    // Try to save to backend, replace temp entry with saved response when available
    try {
      const res = await fetch('https://caltrack-8mwo.onrender.com/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        const saved = await res.json();
        // Build a saved entry object client-side using returned id so it appears immediately
        const savedEntry = { ...newEntry, id: (saved && saved.id) ? saved.id : undefined };
        setEntries(prev => prev.map(e => e.tempId === tempId ? savedEntry : e));
        // Then refresh full list from backend to ensure UI matches DB
        try {
          const entriesRes = await fetch('https://caltrack-8mwo.onrender.com/api/entries', { credentials: 'include' });
          const data = await entriesRes.json();
          if (Array.isArray(data)) setEntries(data);
          // refresh recent meals so the Recent modal shows newly added meals
          fetchRecent(10);
        } catch (err) {
          // ignore refresh error
        }
      } else {
        // leave temp entry as-is if server rejected
      }
    } catch (err) {
      // network error: leave temp entry and optionally show error later
    }

    setEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  // Shared image processing for upload and paste
  const processImage = async (file) => {
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      setOcrText(text);
      const parsed = parseNutrition(text);
      setEntry((prev) => ({ ...prev, ...parsed }));
    } catch (err) {
      setOcrError('OCR failed. Try a clearer image.');
    }
    setOcrLoading(false);
  };
  // Login/signup removed
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [entry, setEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });


  const [entries, setEntries] = useState([]);
  // Fetch entries for logged-in user
  useEffect(() => {
    if (!user) return;
    fetch('https://caltrack-8mwo.onrender.com/api/entries', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEntries(data);
        else setEntries([]);
      })
      .catch(() => setEntries([]));
  }, [user]);

  // Recent and favorites state
  const [recentOpen, setRecentOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [recentMeals, setRecentMeals] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Fetch favorites for logged-in user
  useEffect(() => {
    if (!user) return;
    fetch('https://caltrack-8mwo.onrender.com/api/favorites', { credentials: 'include' })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setFavorites(d) : setFavorites([]))
      .catch(() => setFavorites([]));
  }, [user]);

  async function fetchRecent(limit = 10) {
    try {
      const res = await fetch(`https://caltrack-8mwo.onrender.com/api/recent?limit=${limit}`, { credentials: 'include' });
      const data = await res.json();
      setRecentMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecentMeals([]);
    }
  }

  async function addFavoriteFromEntry(entryObj) {
    try {
      await fetch('https://caltrack-8mwo.onrender.com/api/favorites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: entryObj.name, calories: entryObj.calories, protein: entryObj.protein, carbs: entryObj.carbs, fat: entryObj.fat })
      });
      const res = await fetch('https://caltrack-8mwo.onrender.com/api/favorites', { credentials: 'include' });
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore
    }
  }

  async function addMealFromTemplate(template) {
    try {
      const newEntry = { ...template, date: selectedDate };
      const res = await fetch('https://caltrack-8mwo.onrender.com/api/entry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        // refresh entries
        const entriesRes = await fetch('https://caltrack-8mwo.onrender.com/api/entries', { credentials: 'include' });
        const data = await entriesRes.json();
        if (Array.isArray(data)) setEntries(data);
      }
    } catch (err) {
      // ignore
    }
  }

  async function removeFavorite(id) {
    try {
      await fetch(`https://caltrack-8mwo.onrender.com/api/favorites/${id}`, { method: 'DELETE', credentials: 'include' });
      const res = await fetch('https://caltrack-8mwo.onrender.com/api/favorites', { credentials: 'include' });
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      // ignore
    }
  }

  function findFavoriteForEntry(entryObj) {
    if (!entryObj || !favorites) return null;
    return favorites.find(f => String(f.name) === String(entryObj.name) && String(f.calories) === String(entryObj.calories));
  }

  async function toggleFavoriteForEntry(entryObj) {
    const existing = findFavoriteForEntry(entryObj);
    if (existing) {
      await removeFavorite(existing.id);
    } else {
      await addFavoriteFromEntry(entryObj);
    }
  }

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          setOcrError('');
          setOcrText('');
          setOcrLoading(true);
          (async () => {
            await processImage(file);
          })();
          e.preventDefault();
          break;
        }
      }
    }
  };
        // ...existing code...

  // Filter entries by selected date (YYYY-MM-DD)
  const filteredEntries = entries.filter(e => {
    if (!e.date) return false;
    return e.date.slice(0, 10) === selectedDate;
  });
  const total = filteredEntries.reduce(
    (acc, e) => {
      return {
        calories: acc.calories + Number(e.calories),
        protein: acc.protein + Number(e.protein),
        carbs: acc.carbs + Number(e.carbs),
        fat: acc.fat + Number(e.fat)
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Compute macro calories and unknown calories
  const macroKcal = {
    protein: total.protein * 4,
    carbs: total.carbs * 4,
    fat: total.fat * 9,
  };
  const sumMacroKcal = macroKcal.protein + macroKcal.carbs + macroKcal.fat;
  let unknownKcal = Number(total.calories) - sumMacroKcal;
  if (isNaN(unknownKcal) || unknownKcal < 0) unknownKcal = 0;

  // Simple SVG PieChart component
  function PieChart({ segments, size = 140 }) {
    const radius = size / 2;
    const viewBox = `0 0 ${size} ${size}`;
    const cx = radius;
    const cy = radius;

    const totalVal = segments.reduce((s, seg) => s + seg.value, 0);
    if (totalVal === 0) {
      return (
        <svg width={size} height={size} viewBox={viewBox}>
          <circle cx={cx} cy={cy} r={radius - 2} fill="#111" stroke="#2d3237" strokeWidth="2" />
          <text x={cx} y={cy} fill="#aaa" fontSize={12} textAnchor="middle" dy="4">No data</text>
        </svg>
      );
    }

    let startAngle = -90; // start at top
    const paths = segments.map((seg, i) => {
      const angle = (seg.value / totalVal) * 360;
      const endAngle = startAngle + angle;
      const largeArc = angle > 180 ? 1 : 0;
      const start = polarToCartesian(cx, cy, radius - 2, endAngle);
      const end = polarToCartesian(cx, cy, radius - 2, startAngle);
      const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius - 2} ${radius - 2} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
      startAngle = endAngle;
      return <path key={i} d={d} fill={seg.color} />;
    });

    return (
      <svg width={size} height={size} viewBox={viewBox}>
        {paths}
      </svg>
    );
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(angleRad)), y: cy + (r * Math.sin(angleRad)) };
  }

  // Only allow numbers for numeric fields in entry editing
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["calories", "protein", "carbs", "fat"].includes(name)) {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setEntry({ ...entry, [name]: value });
      }
    } else {
      setEntry({ ...entry, [name]: value });
    }
  };

  // Show login/signup modal if not authenticated
  if (authModal) {
    return (
      <div style={{ minHeight: '100vh', background: darkBg, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: cardBg, borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 2px 8px #0003' }}>
          <h2 style={{ color: accent, marginBottom: 16 }}>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h2>
          <form onSubmit={handleAuthSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 6, border: `1px solid ${inputBorder}`, background: inputBg, color: textColor, fontSize: 16 }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 6, border: `1px solid ${inputBorder}`, background: inputBg, color: textColor, fontSize: 16 }}
              required
            />
            {authError && <div style={{ color: '#ef4444', marginBottom: 8 }}>{authError}</div>}
            <button type="submit" style={{ width: '100%', background: accent, color: darkBg, border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 18, marginBottom: 8, cursor: 'pointer' }}>{authMode === 'login' ? 'Log In' : 'Sign Up'}</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            {authMode === 'login' ? (
              <span style={{ color: '#aaa' }}>Don't have an account? <button style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontWeight: 600 }} onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Sign Up</button></span>
            ) : (
              <span style={{ color: '#aaa' }}>Already have an account? <button style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontWeight: 600 }} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Log In</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Always show tracker UI
  return (
    <div
      style={{
        minHeight: '100vh',
        background: darkBg,
        color: textColor,
        fontFamily: 'system-ui, sans-serif',
        padding: 0,
        margin: 0,
        position: 'relative',
      }}
    >
      {/* Gear icon for settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#aaa', fontSize: 28, cursor: 'pointer', zIndex: 4100 }}
        aria-label="Settings"
      >
        <span role="img" aria-label="settings">&#9881;</span>
      </button>
      {/* User info and logout moved to Settings modal */}
      {/* Settings modal */}
      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          setSettings={updateSettings}
          user={user}
          handleLogout={handleLogout}
        />
      )}
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 24,
        }}
      >
        {/* Barcode modal trigger moved to Upload box; top button removed */}
        {barcodeOpen && (
          <BarcodeScanner
            onDetected={async (barcode) => {
              setBarcodeOpen(false);
              setBarcodeError('');
              try {
                const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
                const data = await res.json();
                if (data.status === 1 && data.product) {
                  const p = data.product;
                  const n = p.nutriments || {};
                  const servingSize = n['serving_size'] || p.serving_size || '';
                  // Parse serving size in grams if possible
                  let servingGrams = null;
                  if (servingSize) {
                    const match = servingSize.match(/([0-9.]+)\s*g/);
                    if (match) servingGrams = parseFloat(match[1]);
                  }
                  // Per 100g values
                  const per100g = {
                    calories: parseFloat(n['energy-kcal_100g']) || 0,
                    protein: parseFloat(n['protein_100g'] || n['proteins_100g']) || 0,
                    carbs: parseFloat(n['carbohydrates_100g'] || n['carbs_100g']) || 0,
                    fat: parseFloat(n['fat_100g']) || 0,
                  };
                  // Per serving values (may be missing or wrong)
                  let perServing = {
                    calories: parseFloat(n['energy-kcal_serving']) || '',
                    protein: '',
                    carbs: '',
                    fat: '',
                  };
                  // Combine: calories from perServing, macros from per100g (not scaled)
                  perServing.protein = per100g.protein;
                  perServing.carbs = per100g.carbs;
                  perServing.fat = per100g.fat;
                  // Gather all options
                  const options = [];
                  if (perServing.calories || perServing.protein || perServing.carbs || perServing.fat) {
                    options.push({
                      label: 'Per Serving',
                      calories: perServing.calories,
                      protein: perServing.protein,
                      carbs: perServing.carbs,
                      fat: perServing.fat,
                      servingSize: servingSize || ''
                    });
                  }
                  if (per100g.calories || per100g.protein || per100g.carbs || per100g.fat) {
                    options.push({
                      label: 'Per 100g',
                      calories: per100g.calories,
                      protein: per100g.protein,
                      carbs: per100g.carbs,
                      fat: per100g.fat,
                      servingSize: '100g'
                    });
                  }
                  // Always allow custom
                  options.push({
                    label: 'Custom',
                    calories: '', protein: '', carbs: '', fat: '', servingSize: ''
                  });
                  setNutritionOptions({
                    name: p.product_name || '',
                    options,
                    servingSize: servingSize || ''
                  });
                } else {
                  setBarcodeError('No nutrition info found for this barcode.');
                }
              } catch {
                setBarcodeError('Failed to fetch nutrition info.');
              }
            }}
            onClose={() => setBarcodeOpen(false)}
          />
        )}


        {/* Nutrition options modal */}
        {nutritionOptions && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#000a', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 24, minWidth: 320, position: 'relative' }}>
              <button onClick={() => setNutritionOptions(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
              <h3 style={{ color: accent, marginBottom: 12 }}>Choose Nutrition Values</h3>
              <div style={{ marginBottom: 16, color: textColor, fontWeight: 500 }}>{nutritionOptions.name}</div>
              {nutritionOptions.servingSize && <div style={{ color: '#aaa', marginBottom: 8 }}>Serving size: {nutritionOptions.servingSize}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: textColor, fontWeight: 500, marginRight: 8 }}>Servings:</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={servingsInput}
                  onChange={e => setServingsInput(e.target.value)}
                  style={{ width: 60, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '4px 8px' }}
                />
              </div>
              {nutritionOptions.options.map((opt, i) => (
                <button key={i} onClick={() => handleSelectNutritionOption(opt)} style={{
                  display: 'block', width: '100%', marginBottom: 10, padding: 12, borderRadius: 8,
                  background: '#23272b', color: textColor, border: `1px solid ${border}`, fontWeight: 500, fontSize: 16, cursor: 'pointer'
                }}>
                  {opt.label}<br />
                  <span style={{ fontSize: 14, color: '#aaa' }}>
                    {opt.calories !== '' && `Calories: ${opt.calories} kcal`}<br />
                    {opt.protein !== '' && `Protein: ${opt.protein}g`}<br />
                    {opt.carbs !== '' && `Carbs: ${opt.carbs}g`}<br />
                    {opt.fat !== '' && `Fat: ${opt.fat}g`}
                  </span>
                  {opt.servingSize && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>({opt.servingSize})</div>}
                </button>
              ))}
            </div>
          </div>
        )}
        {barcodeError && <div style={{ color: '#ef4444', marginBottom: 8 }}>{barcodeError}</div>}
        <button
          style={{
            background: accent,
            color: darkBg,
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 16,
            cursor: 'pointer',
            boxShadow: '0 1px 4px #0003',
          }}
          onClick={() => setCalendarOpen(true)}
        >
          Calander
        </button>
        {/* Cook Book buttons moved under Upload box */}

        {recentOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000a', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: cardBg, borderRadius: 12, padding: 16, minWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ color: accent, margin: 0 }}>Recent Meals</h3>
                <button onClick={() => setRecentOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 18 }}>&times;</button>
              </div>
              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {recentMeals.length === 0 && <div style={{ color: '#aaa' }}>No recent meals</div>}
                {recentMeals.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: '#aaa', fontSize: 13 }}>{r.calories} kcal</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => { addMealFromTemplate(r); setRecentOpen(false); }} style={{ background: accent, color: darkBg, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Add</button>
                      {(() => {
                        const fav = findFavoriteForEntry(r);
                        const isFav = !!fav;
                        return (
                          <button onClick={() => toggleFavoriteForEntry(r)} aria-label={isFav ? 'Unfavorite' : 'Favorite'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: isFav ? '#f6c600' : '#7b848b', padding: 4 }}>
                            {isFav ? '★' : '☆'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {favoritesOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000a', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: cardBg, borderRadius: 12, padding: 16, minWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ color: accent, margin: 0 }}>Favorites</h3>
                <button onClick={() => setFavoritesOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 18 }}>&times;</button>
              </div>
              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {favorites.length === 0 && <div style={{ color: '#aaa' }}>No favorites yet</div>}
                {favorites.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      <div style={{ color: '#aaa', fontSize: 13 }}>{f.calories} kcal</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { addMealFromTemplate(f); setFavoritesOpen(false); }} style={{ background: accent, color: darkBg, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Add</button>
                      <button onClick={() => removeFavorite(f.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {calendarOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#000a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
            onClick={() => setCalendarOpen(false)}
          >
            <div style={{ position: 'relative', background: cardBg, borderRadius: 16, padding: 24, minWidth: 360 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setCalendarOpen(false)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
              <MonthCalendar
                year={calendarMonth.year}
                month={calendarMonth.month}
                selectedDate={selectedDate}
                onSelect={date => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                onPrev={() => setCalendarMonth(m => {
                  const prev = new Date(m.year, m.month - 1, 1);
                  return { year: prev.getFullYear(), month: prev.getMonth() };
                })}
                onNext={() => setCalendarMonth(m => {
                  const next = new Date(m.year, m.month + 1, 1);
                  return { year: next.getFullYear(), month: next.getMonth() };
                })}
                entries={entries}
                dailyLimit={dailyLimit}
              />
              {/* Removed entries list from calendar modal for cleaner UI */}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ color: accent, letterSpacing: 1, fontWeight: 700, marginBottom: 0 }}>CalTrack</h1>
        </div>
        {/* Cook Book section moved under Upload box */}
        <div
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: `1px solid ${border}`,
            boxShadow: '0 2px 8px #0002',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <label style={{ fontWeight: 500 }}>
              Daily Calorie Limit:{' '}
              <span style={{ marginLeft: 8, color: textColor, fontWeight: 600 }}>{dailyLimit}</span>
            </label>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#aaa' }}>Calories Remaining</div>
            <div style={{ fontWeight: 700, color: accent, fontSize: 18 }}>{Math.max(0, Math.round(dailyLimit - total.calories))} kcal</div>
          </div>
        </div>
        {/* Upload */}
        <div
          style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${border}` }}
          tabIndex={0}
          onPaste={handlePaste}
        >
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', color: textColor }}>Upload</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setBarcodeOpen(true)}
              style={{
                background: accent,
                color: darkBg,
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 1px 4px #0003',
              }}
            >
              Scan Barcode
            </button>

            <button
              type="button"
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                background: accent,
                color: darkBg,
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 1px 4px #0003',
              }}
            >
              Upload Image
            </button>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>
            Or paste an image here (Ctrl+V)
          </div>
          {ocrLoading && <div style={{ color: accent, marginTop: 8 }}>Reading nutrition label...</div>}
          {ocrError && <div style={{ color: '#f87171', marginTop: 8 }}>{ocrError}</div>}
          {ocrText && (
            <pre style={{ color: '#aaa', marginTop: 8, fontSize: 13, whiteSpace: 'pre-wrap' }}>{ocrText}</pre>
          )}
        </div>
        {/* Cook Book section with Recent + Favorites buttons */}
        <div style={{ background: cardBg, borderRadius: 12, padding: 12, marginBottom: 16, border: `1px solid ${border}` }}>
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', color: textColor }}>Cook Book</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => { fetchRecent(10); setRecentOpen(true); }}
              style={{
                background: accent,
                color: darkBg,
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 1px 4px #0003',
              }}
            >
              Recent
            </button>
            <button
              onClick={() => { setFavoritesOpen(true); }}
              style={{
                background: accent,
                color: darkBg,
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 1px 4px #0003',
              }}
            >
              Favorites
            </button>
          </div>
        </div>

        <form onSubmit={handleAdd} style={{ background: cardBg, borderRadius: 8, padding: 12, marginBottom: 16, border: `1px solid ${border}`, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ color: textColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Food</label>
              <input
                name="name"
                placeholder="e.g., Chicken salad"
                value={entry.name}
                onChange={handleChange}
                style={{ background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '8px 10px', outline: 'none', fontSize: 14, boxSizing: 'border-box', maxWidth: '100%' }}
                autoComplete="off"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ color: textColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Calories</label>
              <input
                name="calories"
                type="number"
                placeholder="kcal"
                value={entry.calories}
                onChange={handleChange}
                style={{ background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '8px 10px', outline: 'none', fontSize: 14, boxSizing: 'border-box', maxWidth: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ color: '#aaa', fontSize: 11, marginBottom: 6, display: 'block' }}>Protein (g)</label>
                <input
                  name="protein"
                  type="number"
                  placeholder="0"
                  value={entry.protein}
                  onChange={handleChange}
                  style={{ width: '100%', background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '6px 8px', outline: 'none', fontSize: 13, boxSizing: 'border-box', maxWidth: '100%' }}
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: 11, marginBottom: 6, display: 'block' }}>Carbs (g)</label>
                <input
                  name="carbs"
                  type="number"
                  placeholder="0"
                  value={entry.carbs}
                  onChange={handleChange}
                  style={{ width: '100%', background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '6px 8px', outline: 'none', fontSize: 13, boxSizing: 'border-box', maxWidth: '100%' }}
                />
              </div>
              <div>
                <label style={{ color: '#aaa', fontSize: 11, marginBottom: 6, display: 'block' }}>Fat (g)</label>
                <input
                  name="fat"
                  type="number"
                  placeholder="0"
                  value={entry.fat}
                  onChange={handleChange}
                  style={{ width: '100%', background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 6, padding: '6px 8px', outline: 'none', fontSize: 13, boxSizing: 'border-box', maxWidth: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
              <button type="submit" style={{ background: accent, color: darkBg, border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Add</button>
            </div>
          </div>
        </form>
        <div
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            border: `1px solid ${border}`,
            boxShadow: '0 2px 8px #0002',
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}
        >
          <div style={{ width: 140, flex: '0 0 140px' }}>
            <PieChart
              segments={[
                { label: 'Protein', value: macroKcal.protein, color: '#63e6be' },
                { label: 'Carbs', value: macroKcal.carbs, color: '#60a5fa' },
                { label: 'Fat', value: macroKcal.fat, color: '#f87171' },
                { label: 'Unknown', value: unknownKcal, color: '#9ca3af' },
              ]}
              size={140}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: accent }}>
              Calories left: {dailyLimit - total.calories}
            </div>
            <div style={{ marginTop: 6, fontSize: 15 }}>
              Consumed: <span style={{ color: '#fbbf24' }}>{total.calories} kcal</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}>
              <div style={{ color: '#63e6be' }}>Protein: <strong style={{ color: textColor }}>{total.protein}g</strong> (<strong style={{ color: textColor }}>{Math.round(macroKcal.protein)} kcal</strong>)</div>
              <div style={{ color: '#60a5fa' }}>Carbs: <strong style={{ color: textColor }}>{total.carbs}g</strong> (<strong style={{ color: textColor }}>{Math.round(macroKcal.carbs)} kcal</strong>)</div>
              <div style={{ color: '#f87171' }}>Fat: <strong style={{ color: textColor }}>{total.fat}g</strong> (<strong style={{ color: textColor }}>{Math.round(macroKcal.fat)} kcal</strong>)</div>
            </div>
            <div style={{ marginTop: 8, color: '#aaa', fontSize: 13 }}>Unknown calories from entries without macro breakdown: <strong style={{ color: textColor }}>{Math.round(unknownKcal)} kcal</strong></div>
          </div>
        </div>
        <h3 style={{ color: accent, marginTop: 24, marginBottom: 12, fontWeight: 600 }}>Entries for {selectedDate}</h3>
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {filteredEntries.map((e, i) => (
            <li
              key={i}
              style={{
                marginBottom: 10,
                borderRadius: 8,
                background: cardBg,
                border: `1px solid ${border}`,
                padding: '10px 12px',
                boxShadow: '0 1px 4px #0002',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {editIndex === i ? (
                <>
                  <input
                    style={{ fontWeight: 500, fontSize: 16, marginBottom: 4, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 4, padding: '2px 8px' }}
                    value={entry.name}
                    name="name"
                    onChange={handleChange}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <input
                      style={{ width: 70, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 4, padding: '2px 8px' }}
                      value={entry.calories}
                      name="calories"
                      onChange={handleChange}
                    />
                    <span style={{ color: '#fbbf24' }}>kcal</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#aaa', marginTop: 2, marginBottom: 4 }}>
                    <span>Protein:</span>
                    <input
                      style={{ width: 50, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 4, padding: '2px 8px' }}
                      value={entry.protein}
                      name="protein"
                      onChange={handleChange}
                    />
                    <span>g | Carbs:</span>
                    <input
                      style={{ width: 50, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 4, padding: '2px 8px' }}
                      value={entry.carbs}
                      name="carbs"
                      onChange={handleChange}
                    />
                    <span>g | Fat:</span>
                    <input
                      style={{ width: 50, background: inputBg, color: textColor, border: `1px solid ${inputBorder}`, borderRadius: 4, padding: '2px 8px' }}
                      value={entry.fat}
                      name="fat"
                      onChange={handleChange}
                    />
                    <span>g</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleSaveEntry} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 4, padding: '2px 12px', cursor: 'pointer', fontSize: 13 }}>Save</button>
                    <button onClick={() => { setEditIndex(null); setEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' }); }} style={{ background: '#aaa', color: '#222', border: 'none', borderRadius: 4, padding: '2px 12px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 500, fontSize: 16 }}>{e.name}</span>
                  <span style={{ fontSize: 14, color: '#fbbf24' }}>{e.calories} kcal</span>
                  <span style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
                    {e.protein && `Protein: ${e.protein}g`}
                    {e.carbs && ` | Carbs: ${e.carbs}g`}
                    {e.fat && ` | Fat: ${e.fat}g`}
                  </span>
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Star favorite button */}
                    {(() => {
                      const fav = findFavoriteForEntry(e);
                      const isFav = !!fav;
                      return (
                        <button onClick={() => toggleFavoriteForEntry(e)} aria-label={isFav ? 'Unfavorite' : 'Favorite'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: isFav ? '#f6c600' : '#7b848b', padding: 4 }}>
                          {isFav ? '★' : '☆'}
                        </button>
                      );
                    })()}
                    <button onClick={() => handleEditEntry(i)} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}>Edit</button>
                    <button onClick={() => handleDeleteEntry(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
