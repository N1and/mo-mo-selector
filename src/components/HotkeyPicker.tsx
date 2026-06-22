import { useState, useEffect, useCallback } from 'react';

interface HotkeyPickerProps {
  value: string;
  onChange: (hotkey: string) => void;
}

export function HotkeyPicker({ value, onChange }: HotkeyPickerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatKey = (e: KeyboardEvent): string => {
    const parts: string[] = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    
    const key = e.key.toLowerCase();
    const specialKeys: Record<string, string> = {
      'control': 'Ctrl',
      'alt': 'Alt',
      'shift': 'Shift',
      'meta': 'Meta',
      ' ': 'Space',
      'escape': 'Esc',
      'enter': 'Enter',
      'backspace': 'Backspace',
      'delete': 'Delete',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
    };
    
    if (!specialKeys[key] && !['ctrl', 'alt', 'shift', 'meta'].includes(key)) {
      parts.push(specialKeys[key] || e.key.toUpperCase());
    }
    
    return parts.join('+');
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isCapturing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      setIsCapturing(false);
      setDisplayValue(value);
      return;
    }
    
    const hotkey = formatKey(e);
    if (hotkey && !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(hotkey)) {
      setDisplayValue(hotkey);
      onChange(hotkey);
      setIsCapturing(false);
    }
  }, [isCapturing, value, onChange]);

  useEffect(() => {
    if (isCapturing) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCapturing, handleKeyDown]);

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={isCapturing ? '请按下快捷键...' : displayValue}
        readOnly
        onClick={() => setIsCapturing(true)}
        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
          isCapturing 
            ? 'border-green-500 bg-green-50 text-green-700' 
            : 'border-gray-300 bg-gray-50'
        }`}
        placeholder="点击后按下快捷键"
      />
      {isCapturing && (
        <button
          onClick={() => {
            setIsCapturing(false);
            setDisplayValue(value);
          }}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          取消
        </button>
      )}
    </div>
  );
}
