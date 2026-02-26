
import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const darkBg = '#181c20';
const cardBg = '#23272b';
const accent = '#4fd1c5';
const textColor = '#f5f6fa';
const border = '#2d3237';
const inputBg = '#23272b';
const inputBorder = '#353b41';
const placeholder = '#7b848b';

function App() {
  const [ocrLoading, setOcrLoading] = useState(false);
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

  // Handle image upload and OCR
  const handleImageUpload = async (e) => {
    setOcrError('');
    setOcrText('');
    setOcrLoading(true);
    const file = e.target.files[0];
    if (!file) return;
    await processImage(file);
  };

  // Handle paste event for images
  const handlePaste = async (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          setOcrError('');
          setOcrText('');
          setOcrLoading(true);
          await processImage(file);
          e.preventDefault();
          break;
        }
      }
    }
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
    // (removed duplicate handleAdd)
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!entry.name || !entry.calories) return;
    // Save to backend
    try {
      const res = await fetch('http://localhost:4000/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        // Refetch entries after save
        const entriesRes = await fetch('http://localhost:4000/api/entries', { credentials: 'include' });
        const data = await entriesRes.json();
        setEntries(data);
        setEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      }
    } catch (err) {
      // Optionally show error
    }
  };

  const total = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein: acc.protein + Number(e.protein),
      carbs: acc.carbs + Number(e.carbs),
      fat: acc.fat + Number(e.fat)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
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
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: 24,
        }}
      >
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
            <input
              type="number"
              value={dailyLimit}
              min={0}
              onChange={e => setDailyLimit(Number(e.target.value))}
              style={{
                width: 100,
                background: inputBg,
                color: textColor,
                border: `1px solid ${inputBorder}`,
                borderRadius: 6,
                padding: '4px 8px',
                marginLeft: 8,
                outline: 'none',
              }}
            />
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
        <form
          onSubmit={handleAdd}
          style={{
            background: cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            border: `1px solid ${border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            name="name"
            placeholder="Food name"
            value={entry.name}
            onChange={handleChange}
            style={{
              background: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: 6,
              padding: '6px 10px',
              width: 110,
              outline: 'none',
            }}
            autoComplete="off"
          />
          <input
            name="calories"
            type="number"
            placeholder="Calories"
            value={entry.calories}
            onChange={handleChange}
            style={{
              background: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: 6,
              padding: '6px 10px',
              width: 80,
              outline: 'none',
            }}
          />
          <input
            name="protein"
            type="number"
            placeholder="Protein (g)"
            value={entry.protein}
            onChange={handleChange}
            style={{
              background: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: 6,
              padding: '6px 10px',
              width: 80,
              outline: 'none',
            }}
          />
          <input
            name="carbs"
            type="number"
            placeholder="Carbs (g)"
            value={entry.carbs}
            onChange={handleChange}
            style={{
              background: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: 6,
              padding: '6px 10px',
              width: 80,
              outline: 'none',
            }}
          />
          <input
            name="fat"
            type="number"
            placeholder="Fat (g)"
            value={entry.fat}
            onChange={handleChange}
            style={{
              background: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: 6,
              padding: '6px 10px',
              width: 80,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: accent,
              color: darkBg,
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 8,
              fontSize: 16,
              boxShadow: '0 1px 4px #0003',
              transition: 'background 0.2s',
            }}
          >
            Add
          </button>
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
        <h3 style={{ color: accent, marginTop: 24, marginBottom: 12, fontWeight: 600 }}>Entries</h3>
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {entries.map((e, i) => (
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
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 16 }}>{e.name}</span>
              <span style={{ fontSize: 14, color: '#fbbf24' }}>{e.calories} kcal</span>
              <span style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
                {e.protein && `Protein: ${e.protein}g`}
                {e.carbs && ` | Carbs: ${e.carbs}g`}
                {e.fat && ` | Fat: ${e.fat}g`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
