
import React, { useState, useEffect } from 'react';
import MonthCalendar from './MonthCalendar';
import BarcodeScanner from './BarcodeScanner';
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
    // Save to backend, using selectedDate with current local time for the entry's date
    const now = new Date();
    const timeStr = now.toTimeString().slice(0,8); // HH:MM:SS
    const entryWithDate = { ...entry, date: `${selectedDate}T${timeStr}` };
    try {
      const res = await fetch('http://localhost:4000/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(entryWithDate),
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

  // Filter entries by selected date (YYYY-MM-DD)
  const filteredEntries = entries.filter(e => {
    if (!e.date) return false;
    return e.date.slice(0, 10) === selectedDate;
  });
  const total = filteredEntries.reduce(
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
