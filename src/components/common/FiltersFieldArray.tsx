'use client';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormRegister } from 'react-hook-form';
import { Add, TrashCan } from '@carbon/icons-react';

type FilterItem = { field_name: string; field_value: string };

type RHFMode = {
  control: Control<any>;
  register: UseFormRegister<any>;
  name?: string;
  value?: never;
  onChange?: never;
};

type ControlledMode = {
  value: FilterItem[];
  onChange: (filters: FilterItem[]) => void;
  control?: never;
  register?: never;
  name?: never;
};

type FiltersFieldArrayProps = RHFMode | ControlledMode;

const FiltersFieldArray = (props: FiltersFieldArrayProps) => {
  if (props.control && props.register) {
    return <RHFFilters control={props.control} register={props.register} name={props.name || 'filters'} />;
  }
  return <ControlledFilters value={props.value} onChange={props.onChange} />;
};

const RHFFilters = ({ control, register, name }: { control: Control<any>; register: UseFormRegister<any>; name: string }) => {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <FiltersUI
      items={fields}
      onAdd={() => append({ field_name: '', field_value: '' })}
      onRemove={(index) => remove(index)}
      renderInputs={(index) => (
        <>
          <div className="xui-form-box xui-flex-1" style={{ marginBottom: 0 }}>
            <input type="text" placeholder="Field name (e.g. ward_name)" {...register(`${name}.${index}.field_name`)} />
          </div>
          <div className="xui-form-box xui-flex-1" style={{ marginBottom: 0 }}>
            <input type="text" placeholder="Field value (e.g. Ward 9)" {...register(`${name}.${index}.field_value`)} />
          </div>
        </>
      )}
    />
  );
};

const ControlledFilters = ({ value, onChange }: { value: FilterItem[]; onChange: (filters: FilterItem[]) => void }) => {
  return (
    <FiltersUI
      items={value}
      onAdd={() => onChange([...value, { field_name: '', field_value: '' }])}
      onRemove={(index) => onChange(value.filter((_, i) => i !== index))}
      renderInputs={(index) => (
        <>
          <div className="xui-form-box xui-flex-1" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Field name (e.g. ward_name)"
              value={value[index].field_name}
              onChange={(e) => {
                const updated = [...value];
                updated[index] = { ...updated[index], field_name: e.target.value };
                onChange(updated);
              }}
            />
          </div>
          <div className="xui-form-box xui-flex-1" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Field value (e.g. Ward 9)"
              value={value[index].field_value}
              onChange={(e) => {
                const updated = [...value];
                updated[index] = { ...updated[index], field_value: e.target.value };
                onChange(updated);
              }}
            />
          </div>
        </>
      )}
    />
  );
};

const FiltersUI = ({
  items,
  onAdd,
  onRemove,
  renderInputs,
}: {
  items: any[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderInputs: (index: number) => React.ReactNode;
}) => {
  return (
    <div className="xui-mt-2">
      <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
        <div>
          <p className="xui-font-w-600">Data Filters</p>
          <p className="xui-font-sz-80 xui-opacity-5">Restrict data access by field values (e.g. only show records for a specific ward)</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
          style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
        >
          <span className="icon-container"><Add size={16} /></span>
          Add Filter
        </button>
      </div>

      {items.length === 0 ? (
        <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-text-center" style={{ border: '1px solid var(--neutral-200)' }}>
          <p className="xui-font-sz-80 xui-opacity-5">No filters configured. Click "Add Filter" to restrict data access.</p>
        </div>
      ) : (
        <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
          {items.map((item, index) => (
            <div key={item.id || index} className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
              {renderInputs(index)}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)', flexShrink: 0 }}
                title="Remove filter"
              >
                <TrashCan size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FiltersFieldArray;
