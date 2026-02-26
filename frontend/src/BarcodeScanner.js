import React, { useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef();
  const codeReader = useRef();
  const [error, setError] = React.useState('');

  useEffect(() => {
    let scanned = false;
    setError('');
    codeReader.current = new BrowserMultiFormatReader();
    // Wait for video element to be ready
    const startScanner = () => {
      codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result && !scanned) {
          scanned = true;
          onDetected(result.getText());
          if (codeReader.current) {
            if (typeof codeReader.current.reset === 'function') {
              codeReader.current.reset();
            } else if (typeof codeReader.current.stopDecoding === 'function') {
              codeReader.current.stopDecoding();
            }
          }
          // Auto-close modal after scan
          if (onClose) onClose();
        }
        if (err && err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access.');
        } else if (err && err.name === 'NotFoundError') {
          setError('No camera found.');
        } else if (err && err.message) {
          setError('Error: ' + err.message);
        }
      }).catch(e => {
        setError('Failed to start camera: ' + (e.message || e));
      });
    };
    // If videoRef is ready, start scanner, else wait for it
    if (videoRef.current) {
      startScanner();
    } else {
      setTimeout(startScanner, 100);
    }
    return () => {
      if (codeReader.current) {
        if (typeof codeReader.current.reset === 'function') {
          codeReader.current.reset();
        } else if (typeof codeReader.current.stopDecoding === 'function') {
          codeReader.current.stopDecoding();
        }
      }
    };
  }, [onDetected, onClose]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000a', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272b', borderRadius: 16, padding: 16, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        <video ref={videoRef} style={{ width: 320, height: 240, borderRadius: 8, background: '#000' }} autoPlay muted playsInline />
        <div style={{ color: '#aaa', marginTop: 8, textAlign: 'center' }}>Point your camera at a barcode</div>
        {error && <div style={{ color: '#ef4444', marginTop: 8, textAlign: 'center' }}>{error}</div>}
      </div>
    </div>
  );
}
