'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import roleAclsService from '../../services/roleAcls.service';
import type { RoleAcl } from '../../services/roleAcls.service';
import { Alert, showAlert, FiltersFieldArray } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
import { FormSkeleton } from '../../components/skeletons';

interface EditRoleAclFormData {
  add: boolean;
  edit: boolean;
  delete: boolean;
  elevated_role: boolean;
  filters: { field_name: string; field_value: string }[];
}

const EditRoleAcl = () => {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingAcl, setLoadingAcl] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roleAcl, setRoleAcl] = useState<RoleAcl | null>(null);

  const accessIds = getAccessIds('roles', 'role-acls');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
  } = useForm<EditRoleAclFormData>({
    defaultValues: {
      add: false,
      edit: false,
      delete: false,
      elevated_role: false,
      filters: [],
    },
  });

  useEffect(() => {
    const fetchRoleAcl = async () => {
      if (!id || !moduleId || !subModuleId) {
        setLoadingAcl(false);
        return;
      }

      try {
        const response = await roleAclsService.getRoleAcl(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          setRoleAcl(response.data);
          reset({
            add: response.data.add,
            edit: response.data.edit,
            delete: response.data.delete,
            elevated_role: response.data.elevated_role,
            filters: response.data.filters || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch role ACL:', err);
        setError('Failed to load role ACL details');
        showAlert('error-alert');
      } finally {
        setLoadingAcl(false);
      }
    };

    fetchRoleAcl();
  }, [id, moduleId, subModuleId, reset]);

  const onSubmit = async (data: EditRoleAclFormData) => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validFilters = (data.filters || []).filter(f => f.field_name.trim() && f.field_value.trim());
      const response = await roleAclsService.updateRoleAcl(
        {
          unique_id: id,
          add: data.add,
          edit: data.edit,
          delete: data.delete,
          elevated_role: data.elevated_role,
          ...(validFilters.length > 0 && { filters: validFilters }),
        },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (response.success) {
        setSuccessMessage('Role ACL updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          router.push('/dashboard/roles/acls');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update role ACL');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update role ACL'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAcl) {
    return (
      <div>
        <Navbar title="Edit Role ACL" subtitle="Modify role access permissions" />
        <div className="xui-py-1">
          <FormSkeleton fields={5} />
        </div>
      </div>
    );
  }

  if (!roleAcl) {
    return (
      <div>
        <Navbar title="Edit Role ACL" subtitle="Modify role access permissions" />
        <div className="xui-py-1">
          <a
            onClick={() => router.back()}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container"><ArrowLeft size={20} /></span>
          </a>
          <p className="xui-opacity-5">Role ACL not found or you do not have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Role ACL" subtitle="Modify role access permissions" />
      <div className="xui-py-1">
        <a
          onClick={() => router.back()}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-2" style={{ border: '1px solid var(--neutral-200)' }}>
          <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Role ACL Details</p>
          <div className="xui-d-grid xui-grid-col-2 xui-md-grid-col-3 xui-grid-gap-1 xui-font-sz-80">
            <div>
              <span className="xui-opacity-6 xui-d-block">Role</span>
              <span className="xui-font-w-500">{roleAcl.Role?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="xui-opacity-6 xui-d-block">Module</span>
              <span className="xui-badge xui-badge-blue">{roleAcl.Module?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="xui-opacity-6 xui-d-block">Sub Module</span>
              <span className="xui-font-w-500">{roleAcl.SubModule?.name || '—'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div style={{ maxWidth: '500px' }}>
            <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
              <p className="xui-font-w-600">Permissions</p>
              <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-80">
                <input
                  type="checkbox"
                  checked={watch('add') && watch('edit') && watch('delete') && watch('elevated_role')}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setValue('add', checked);
                    setValue('edit', checked);
                    setValue('delete', checked);
                    setValue('elevated_role', checked);
                  }}
                />
                <span className="xui-font-w-500">Check All</span>
              </label>
            </div>

            <div className="xui-p-1 xui-bg-light xui-bdr-rad-half xui-mb-1" style={{ border: '1px solid var(--neutral-200)' }}>
              <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ opacity: 0.6 }}>
                    <input type="checkbox" checked={true} disabled />
                    <div>
                      <span className="xui-font-w-500">View</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">View records (default)</span>
                    </div>
                  </label>

                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('add')} />
                    <div>
                      <span className="xui-font-w-500">Add</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Create new records</span>
                    </div>
                  </label>
                </div>

                <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-1">
                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('edit')} />
                    <div>
                      <span className="xui-font-w-500">Edit</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Modify records</span>
                    </div>
                  </label>

                  <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                    <input type="checkbox" {...register('delete')} />
                    <div>
                      <span className="xui-font-w-500">Delete</span>
                      <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Remove records</span>
                    </div>
                  </label>
                </div>

                <hr className="xui-my-half" />

                <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer">
                  <input type="checkbox" {...register('elevated_role')} />
                  <div>
                    <span className="xui-font-w-500">Elevated Role</span>
                    <span className="xui-d-block xui-font-sz-80 xui-opacity-5">Grant elevated administrative access</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <FiltersFieldArray control={control} register={register} />

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Role ACL...' : 'Update Role ACL'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditRoleAcl;
