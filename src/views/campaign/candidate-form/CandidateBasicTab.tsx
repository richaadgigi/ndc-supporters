'use client';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CandidateFormData } from './types';
import type { Position } from '../../../services/positions.service';
import type { MemberRole } from '../../../services/memberRoles.service';
import type { Candidate } from '../../../services/candidates.service';
import { ImageUpload, DateOfBirthSelect } from '../../../components/common';

interface Props {
  register: UseFormRegister<CandidateFormData>;
  errors: FieldErrors<CandidateFormData>;
  dobValue: string;
  onDobChange: (val: string) => void;
  positions: Position[];
  memberRoles: MemberRole[];
  allCandidates: Candidate[];
  currentCandidateId?: string;
  image: string;
  imagePublicId: string;
  onImageFileSelect: (file: File, previewUrl: string) => void;
  onImageChange: (url: string, pubId: string) => void;
  onImageError: (msg: string) => void;
  genderRequired?: boolean;
  positionRequired?: boolean;
}

const CandidateBasicTab = ({
  register, errors, dobValue, onDobChange, positions, memberRoles, allCandidates,
  currentCandidateId, image, imagePublicId,
  onImageFileSelect, onImageChange, onImageError,
  genderRequired = false, positionRequired = false,
}: Props) => (
  <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
    <div>
      <div className="xui-form-box" {...(errors.name && { 'xui-error': 'true' })}>
        <label htmlFor="name">Name *</label>
        <input type="text" id="name" placeholder="Enter candidate name" {...register('name', { required: 'Name is required' })} />
        {errors.name && <span className="message">{errors.name.message}</span>}
      </div>
      <div className="xui-form-box" {...(errors.gender && { 'xui-error': 'true' })}>
        <label htmlFor="gender">Gender{genderRequired && ' *'}</label>
        <select id="gender" {...register('gender', genderRequired ? { required: 'Gender is required' } : {})}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && <span className="message">{errors.gender.message}</span>}
      </div>
      <div className="xui-form-box">
        <DateOfBirthSelect label="Date of Birth" value={dobValue} onChange={onDobChange} />
        <input type="hidden" {...register('dob')} />
      </div>
      <div className="xui-form-box">
        <label htmlFor="slogan">Slogan</label>
        <input type="text" id="slogan" placeholder="Enter slogan" {...register('slogan')} />
      </div>
      <div className="xui-form-box" {...(errors.position_unique_id && { 'xui-error': 'true' })}>
        <label htmlFor="position_unique_id">Position{positionRequired && ' *'}</label>
        <select id="position_unique_id" {...register('position_unique_id', positionRequired ? { required: 'Position is required' } : {})}>
          <option value="">Select position</option>
          {positions.map(p => <option key={p.unique_id} value={p.unique_id}>{p.name}</option>)}
        </select>
        {errors.position_unique_id && <span className="message">{errors.position_unique_id.message}</span>}
      </div>
      <div className="xui-form-box">
        <label htmlFor="member_role_unique_id">Member Role</label>
        <select id="member_role_unique_id" {...register('member_role_unique_id')}>
          <option value="">Select member role</option>
          {memberRoles.map(r => <option key={r.unique_id} value={r.unique_id}>{r.name}</option>)}
        </select>
      </div>
      <div className="xui-form-box">
        <label htmlFor="running_mate_unique_id">Running Mate</label>
        {allCandidates.filter(c => c.unique_id !== currentCandidateId).length === 0 ? (
          <select id="running_mate_unique_id" disabled>
            <option value="">No other candidates available</option>
          </select>
        ) : (
          <select id="running_mate_unique_id" {...register('running_mate_unique_id')}>
            <option value="">Select running mate</option>
            {allCandidates.filter(c => c.unique_id !== currentCandidateId).map(c => (
              <option key={c.unique_id} value={c.unique_id}>{c.name}{c.Position?.name ? ` (${c.Position.name})` : c.state ? ` - ${c.state}` : ''}</option>
            ))}
          </select>
        )}
      </div>
    </div>
    <div>
      <ImageUpload
        label="Profile Image"
        value={image}
        publicId={imagePublicId}
        onFileSelect={onImageFileSelect}
        onChange={onImageChange}
        onError={onImageError}
        folder="ndccampaign/candidates"
      />
      <div className="xui-form-box xui-mt-1">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" placeholder="Enter bio" rows={8} {...register('bio')} />
      </div>
    </div>
  </div>
);

export default CandidateBasicTab;
