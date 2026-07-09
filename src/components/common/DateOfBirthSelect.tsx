import { useState, useEffect } from 'react';

interface DateOfBirthSelectProps {
  value: string;
  onChange: (dateString: string) => void;
  minAge?: number;
  label?: string;
  required?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DateOfBirthSelect({ value, onChange, minAge = 0, label, required }: DateOfBirthSelectProps) {
  const parsed = value ? new Date(value) : null;

  const [day, setDay] = useState(parsed ? parsed.getUTCDate().toString() : '');
  const [month, setMonth] = useState(parsed ? parsed.getUTCMonth().toString() : '');
  const [year, setYear] = useState(parsed ? parsed.getUTCFullYear().toString() : '');

  const maxYear = new Date().getFullYear() - minAge;

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDay(d.getUTCDate().toString());
      setMonth(d.getUTCMonth().toString());
      setYear(d.getUTCFullYear().toString());
    }
  }, [value]);

  useEffect(() => {
    if (day && month !== '' && year) {
      const date = new Date(Date.UTC(Number(year), Number(month), Number(day)));
      const iso = date.toISOString().split('T')[0];
      if (iso !== value) onChange(iso);
    }
  }, [day, month, year]);

  return (
    <div>
      {label && <label>{label}{required ? ' *' : ''}</label>}
      <div className="xui-d-grid xui-grid-col-3 xui-grid-gap-half">
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {Array.from({ length: 100 }, (_, i) => maxYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
