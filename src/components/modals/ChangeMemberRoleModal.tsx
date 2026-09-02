'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import membersService from '../../services/members.service';
import memberRolesService from '../../services/memberRoles.service';
import type { MemberRole } from '../../services/memberRoles.service';
import { showAlert } from '../common';
import { extractErrorMessage } from '../../utils/formatters';

interface ChangeMemberRoleFormData {
  member_role_unique_id: string;
}

interface ChangeMemberRoleModalProps {
  accessIds: { module_unique_id: string; sub_module_unique_id: string } | null;
  roleAccessIds: { module_unique_id: string; sub_module_unique_id: string } | null;
  member: { unique_id: string; code?: string; MemberRole?: { unique_id: string; name: string } | null } | null;
  memberName: string;
  onSuccess: () => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

const ChangeMemberRoleModal = ({ accessIds, roleAccessIds, member, memberName, onSuccess, setError, setSuccessMessage }: ChangeMemberRoleModalProps) => {
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<MemberRole[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ChangeMemberRoleFormData>({
    defaultValues: { member_role_unique_id: '' },
  });

  useEffect(() => {
    if (!roleAccessIds) return;
    memberRolesService.getAll({ size: 200, module_unique_id: roleAccessIds.module_unique_id, sub_module_unique_id: roleAccessIds.sub_module_unique_id })
      .then(res => {
        if (res.success && res.data) {
          setRoles(Array.isArray(res.data) ? res.data : (res.data as any).rows || []);
        }
      })
      .catch(() => {});
  }, [roleAccessIds?.module_unique_id]);

  useEffect(() => {
    setValue('member_role_unique_id', member?.MemberRole?.unique_id || '');
  }, [member?.unique_id, setValue]);

  const closeModal = () => {
    reset();
    modalHide('change-member-role-modal');
  };

  const onSubmit = async (data: ChangeMemberRoleFormData) => {
    if (!accessIds || !member) return;

    setSaving(true);
    try {
      const response = await membersService.editRole(
        { unique_id: member.unique_id, member_role_unique_id: data.member_role_unique_id },
        { module_unique_id: accessIds.module_unique_id, sub_module_unique_id: accessIds.sub_module_unique_id },
      );

      if (response.success) {
        setSuccessMessage('Member role updated successfully');
        showAlert('success-alert');
        modalHide('change-member-role-modal');
        onSuccess();
      } else {
        setError(response.message || 'Failed to update member role');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update member role'));
      showAlert('error-alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="xui-modal" xui-modal="change-member-role-modal">
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">Change Member Role</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-85 xui-opacity-6 xui-mb-1">
          {memberName}{member?.MemberRole?.name ? ` is currently ${member.MemberRole.name}` : ''}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-form-box" {...(errors.member_role_unique_id && { 'xui-error': 'true' })}>
            <label htmlFor="member_role_unique_id">Member Role *</label>
            <select
              id="member_role_unique_id"
              {...register('member_role_unique_id', { required: 'Select a member role' })}
            >
              <option value="">Select a member role</option>
              {roles.map((r) => (
                <option key={r.unique_id} value={r.unique_id}>{r.name}</option>
              ))}
            </select>
            {errors.member_role_unique_id && (
              <span className="message">{errors.member_role_unique_id.message}</span>
            )}
          </div>
          <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
            <button
              type="button"
              className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="xui-btn xui-btn-block xui-bdr-rad-[8px]"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Change Role'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ChangeMemberRoleModal;
