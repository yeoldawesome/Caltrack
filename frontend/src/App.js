import React, { useState, useEffect } from 'react';
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

  // Load calorie limit from backend on mount
  useEffect(() => {
    fetch('http://localhost:4000/api/calorie-limit')
      .then(res => res.json())
      .then(data => {
        const limit = (data && (data.calorieLimit || data.dailyLimit)) || 2000;
        setSettings({ dailyLimit: limit });
        setDailyLimit(limit);
      })
      .catch(() => {
        // keep default if fetch fails
      });
  }, []);

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
      await fetch(`http://localhost:4000/api/entry/${entryToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      // Refetch entries
      const entriesRes = await fetch('http://localhost:4000/api/entries', { credentials: 'include' });
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
        await fetch(`http://localhost:4000/api/entry/${entryToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(entry)
        });
        // Refetch entries
        const entriesRes = await fetch('http://localhost:4000/api/entries', { credentials: 'include' });
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
      date: new Date(selectedDate).toISOString()
    };
    // Try to save to backend, fallback to local-only
    try {
      const res = await fetch('http://localhost:4000/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        const saved = await res.json();
        setEntries(prev => [saved, ...prev]);
      } else {
        // fallback local
        setEntries(prev => [newEntry, ...prev]);
      }
    } catch (err) {
      setEntries(prev => [newEntry, ...prev]);
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
  // Fetch entries from backend on mount
  useEffect(() => {
    fetch('http://localhost:4000/api/entries', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEntries(data);
        else setEntries([]);
      })
      .catch(() => setEntries([]));
  }, []);

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
      {/* Settings modal */}
      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          setSettings={updateSettings}
        />
      )}
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 24,
        }}
      >
        {/* Barcode scan button and modal */}
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
            marginRight: 8,
            cursor: 'pointer',
            boxShadow: '0 1px 4px #0003',
          }}
          onClick={() => setBarcodeOpen(true)}
        >
          Scan Barcode
        </button>
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
          Logs
        </button>
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
          <h1 style={{ color: accent, letterSpacing: 1, fontWeight: 700, marginBottom: 0 }}>Caltrack</h1>
        </div>
        <div
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: `1px solid ${border}`,
            boxShadow: '0 2px 8px #0002',
          }}
        >
          <label style={{ fontWeight: 500 }}>
            Daily Calorie Limit:{' '}
            <span style={{ marginLeft: 8, color: textColor, fontWeight: 600 }}>{dailyLimit}</span>
          </label>
        </div>
        {/* Image upload for nutrition label */}
        <div 
          style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${border}` }}
          tabIndex={0}
          onPaste={handlePaste}
        >
          <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Upload or Paste Nutrition Label Image:</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ color: textColor, marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
            Or paste an image here (Ctrl+V)
          </div>
          {ocrLoading && <div style={{ color: accent, marginTop: 8 }}>Reading nutrition label...</div>}
          {ocrError && <div style={{ color: '#f87171', marginTop: 8 }}>{ocrError}</div>}
          {ocrText && (
            <pre style={{ color: '#aaa', marginTop: 8, fontSize: 13, whiteSpace: 'pre-wrap' }}>{ocrText}</pre>
          )}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="submit" style={{ background: accent, color: darkBg, border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Add</button>
            </div>
          </div>
        </form>
        <div
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: `1px solid ${border}`,
            boxShadow: '0 2px 8px #0002',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 18, color: accent }}>
            Calories left: {dailyLimit - total.calories}
          </div>
          <div style={{ marginTop: 6, fontSize: 15 }}>
            Consumed: <span style={{ color: '#fbbf24' }}>{total.calories} kcal</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 15 }}>
            Protein: <span style={{ color: '#63e6be' }}>{total.protein}g</span> |
            Carbs: <span style={{ color: '#60a5fa' }}>{total.carbs}g</span> |
            Fat: <span style={{ color: '#f87171' }}>{total.fat}g</span>
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
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
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
