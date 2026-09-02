'use client';
import { useState, useEffect } from 'react';
import { Filter, Close, Calendar, Renew } from '@carbon/icons-react';
import { modalShow, modalHide } from '@richaadgigi/stylexui';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: FilterOption[];
  placeholder?: string;
  /** Key of another filter field that this depends on (cascading) */
  dependsOn?: string;
  /** Function to filter options based on parent value */
  filterOptions?: (parentValue: string, allOptions: FilterOption[]) => FilterOption[];
  /** Optional refresh callback - shows a refresh icon next to the field label */
  onRefresh?: () => void;
  /** Whether the field is currently refreshing */
  refreshing?: boolean;
}

export type FilterValues = Record<string, string>;

interface FilterModalProps {
  id: string;
  fields: FilterField[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
  /** Text for the trigger button (default: "Filters") */
  buttonText?: string;
  /** Called when a field value changes inside the modal (for loading dependent data) */
  onFieldChange?: (key: string, value: string) => void;
}

const FilterModal = ({ id, fields, values, onApply, onClear, buttonText = 'Filters', onFieldChange }: FilterModalProps) => {
  const modalId = `filter-modal-${id}`;
  const [localValues, setLocalValues] = useState<FilterValues>({});

  const activeCount = Object.values(values).filter((v) => v !== '').length;

  useEffect(() => {
    setLocalValues({ ...values });
  }, [values]);

  const openModal = () => {
    setLocalValues({ ...values });
    modalShow(modalId);
  };

  const closeModal = () => {
    modalHide(modalId);
  };

  const handleChange = (key: string, value: string) => {
    const updated = { ...localValues, [key]: value };
    // Clear dependent fields when parent changes
    fields.forEach((f) => {
      if (f.dependsOn === key) {
        updated[f.key] = '';
        // Also clear fields that depend on THIS dependent field (nested cascading)
        fields.forEach((nested) => {
          if (nested.dependsOn === f.key) updated[nested.key] = '';
        });
      }
    });
    setLocalValues(updated);
    onFieldChange?.(key, value);
  };

  const handleApply = () => {
    onApply(localValues);
    closeModal();
  };

  const handleClear = () => {
    const cleared: FilterValues = {};
    fields.forEach((f) => { cleared[f.key] = ''; });
    setLocalValues(cleared);
    onClear();
    closeModal();
  };

  const getFieldOptions = (field: FilterField): FilterOption[] => {
    if (!field.options) return [];
    if (field.dependsOn && field.filterOptions) {
      const parentValue = localValues[field.dependsOn] || '';
      if (!parentValue) return [];
      return field.filterOptions(parentValue, field.options);
    }
    return field.options;
  };

  const isFieldDisabled = (field: FilterField): boolean => {
    if (field.dependsOn) {
      return !localValues[field.dependsOn];
    }
    return false;
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
        style={{
          border: activeCount > 0 ? '1px solid var(--primary-600)' : '1px solid var(--neutral-300)',
          color: activeCount > 0 ? 'var(--primary-600)' : 'var(--neutral-700)',
          backgroundColor: activeCount > 0 ? 'var(--primary-50, #F2FAF6)' : 'transparent',
        }}
      >
        <span className="icon-container"><Filter size={16} /></span>
        {buttonText}
        {activeCount > 0 && (
          <span
            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-[16px] xui-h-[16px] xui-bdr-rad-circle"
            style={{ backgroundColor: 'var(--primary-600)', color: 'white', fontSize: '10px' }}
          >
            {activeCount}
          </span>
        )}
      </button>

      <section className="xui-modal" xui-modal={modalId}>
        <div className="xui-modal-content xui-max-w-[500px] xui-bdr-rad-[8px]">
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <h3 className="xui-font-sz-[18px]">Filter Records</h3>
            <div
              className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              onClick={closeModal}
            >
              <Close />
            </div>
          </div>
          <hr className="xui-my-1" />

          <div className="xui-form">
            {fields.map((field) => {
              const disabled = isFieldDisabled(field);
              const options = getFieldOptions(field);

              return (
                <div className="xui-form-box" key={field.key}>
                  <label className="xui-w-fluid-100 xui-flex-ai-center xui-flex-jc-space-between" style={{display: 'flex'}}>
                    {field.type === 'date' ? (
                      <span className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                        <Calendar size={16} />
                        {field.label}
                      </span>
                    ) : (
                      <span>{field.label}</span>
                    )}
                    {field.onRefresh && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); field.onRefresh!(); }}
                        disabled={field.refreshing}
                        className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
                        style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '12px', padding: '0' }}
                        title="Refresh polling units"
                      >
                        <Renew size={14} className={field.refreshing ? 'xui-animate-spin' : ''} />
                        {field.refreshing ? 'Loading...' : 'Refresh'}
                      </button>
                    )}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={localValues[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={disabled}
                    >
                      <option value="">{disabled ? `Select ${fields.find((f) => f.key === field.dependsOn)?.label?.toLowerCase() || 'parent'} first` : field.placeholder || `All`}</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={localValues[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <input
                      type="text"
                      value={localValues[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
            <button
              type="button"
              className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
              onClick={handleClear}
            >
              Clear All
            </button>
            <button
              type="button"
              className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              onClick={handleApply}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FilterModal;
