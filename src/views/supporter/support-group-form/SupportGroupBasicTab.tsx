'use client';
import { useState, useEffect } from 'react';
import { useWatch, type UseFormRegister, type FieldErrors, type UseFormSetValue, type Control } from 'react-hook-form';
import type { SupportGroupFormData } from './types';
import supportGroupTypesService from '../../../services/supportGroupTypes.service';
import statesService from '../../../services/states.service';
import type { SupportGroupType } from '../../../services/supportGroupTypes.service';
import type { State } from '../../../services/states.service';
import { SCOPE_OPTIONS } from '../../../services/supportGroups.service';
import { ImageUpload } from '../../../components/common';
import { Close } from '@carbon/icons-react';
import { sortAlphabetically } from '../../../utils/formatters';

const unwrap = (res: any): any[] => (res?.success && res.data ? (Array.isArray(res.data) ? res.data : res.data.rows || []) : []);

interface Props {
  register: UseFormRegister<SupportGroupFormData>;
  errors: FieldErrors<SupportGroupFormData>;
  control?: Control<SupportGroupFormData>;
  setValue?: UseFormSetValue<SupportGroupFormData>;
  accessIds: { module_unique_id: string; sub_module_unique_id: string } | null;
  scopeOption: string;
  statesCovered: string[];
  onToggleStateCovered: (name: string) => void;
  image: string;
  imagePublicId: string;
  onImageChange: (url: string, publicId: string) => void;
  onImageError: (message: string) => void;
}

const SupportGroupBasicTab = ({
  register, errors, control, setValue, accessIds, scopeOption, statesCovered,
  onToggleStateCovered, image, imagePublicId, onImageChange, onImageError,
}: Props) => {
  const [types, setTypes] = useState<SupportGroupType[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const typeValue = useWatch({ control, name: 'support_group_type_unique_id' });

  useEffect(() => {
    if (!accessIds) return;
    const fetchTypes = async () => {
      try {
        const res = await supportGroupTypesService.getAll({ size: 200, module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id });
        setTypes(sortAlphabetically(unwrap(res), 'title'));
      } catch (err) { console.error('Failed to fetch support group types:', err); }
    };
    fetchTypes();
  }, [accessIds?.module_unique_id]);

  useEffect(() => {
    if (scopeOption !== 'National' || states.length > 0) return;
    const fetchStates = async () => {
      try {
        const res = await statesService.publicGetAll({ size: 1000 });
        setStates(sortAlphabetically(unwrap(res), 'name'));
      } catch (err) { console.error('Failed to fetch states:', err); }
    };
    fetchStates();
  }, [scopeOption]);

  useEffect(() => {
    if (!typeValue || types.length === 0 || !setValue) return;
    setValue('support_group_type_unique_id', typeValue);
  }, [typeValue, types]);

  return (
  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Group Details</p>

      <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}>
        <label htmlFor="name">Name *</label>
        <input type="text" id="name" placeholder="Enter support group name" {...register('name', { required: 'Name is required', maxLength: { value: 300, message: 'Maximum 300 characters' } })} />
        {errors.name && <span className="message">{errors.name.message}</span>}
      </div>

      <div className="xui-form-box" {...(errors.support_group_type_unique_id && { 'xui-error': 'true' })}>
        <label htmlFor="support_group_type_unique_id">Type *</label>
        <select id="support_group_type_unique_id" {...register('support_group_type_unique_id', { required: 'Type is required' })}>
          <option value="">Select a type</option>
          {types.map(t => <option key={t.unique_id} value={t.unique_id}>{t.title}</option>)}
        </select>
        {errors.support_group_type_unique_id && <span className="message">{errors.support_group_type_unique_id.message}</span>}
      </div>

      <div className="xui-form-box" {...(errors.scope_option && { 'xui-error': 'true' })}>
        <label htmlFor="scope_option">Scope *</label>
        <select id="scope_option" {...register('scope_option', { required: 'Scope is required' })}>
          <option value="">Select a scope</option>
          {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.scope_option && <span className="message">{errors.scope_option.message}</span>}
      </div>

      {scopeOption === 'National' && (
        <div className="xui-form-box">
          <label>States Covered</label>
          <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap" style={{ maxHeight: '160px', overflowY: 'auto' }}>
            {states.map(s => {
              const active = statesCovered.includes(s.name);
              return (
                <button
                  key={s.unique_id}
                  type="button"
                  onClick={() => onToggleStateCovered(s.name)}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    border: active ? 'none' : '1px solid var(--neutral-300)',
                    backgroundColor: active ? 'var(--primary-600)' : 'white',
                    color: active ? 'var(--secondary-700)' : 'var(--neutral-600)',
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          {statesCovered.length > 0 && (
            <div className="xui-d-flex xui-grid-gap-half xui-flex-wrap xui-mt-half">
              {statesCovered.map(s => (
                <span key={s} className="xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half xui-font-sz-70 xui-font-w-500" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '4px 10px', borderRadius: '4px' }}>
                  {s}
                  <Close size={12} className="xui-cursor-pointer" onClick={() => onToggleStateCovered(s)} />
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    <div>
      <p className="xui-font-sz-85 xui-font-w-bold xui-mb-1 xui-opacity-6">Logo</p>
      <ImageUpload
        label="Logo"
        value={image}
        publicId={imagePublicId}
        onChange={onImageChange}
        onError={onImageError}
        folder="ndcsupporters/support-groups"
      />
    </div>
  </div>
  );
};

export default SupportGroupBasicTab;
