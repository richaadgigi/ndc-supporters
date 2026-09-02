'use client';
import { Search, Menu, Logout, Renew, UserAvatar } from '@carbon/icons-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useGeneral } from '../../context/GeneralContext';
import { modalShow } from '@richaadgigi/stylexui';
import api from '../../services/api';
import usersService from '../../services/users.service';

const modulePaths: Record<string, string> = {
  'sales-customer-management': '/dashboard/sales',
  'procurement-vendor-management': '/dashboard/procurement',
  'inventory-stock-management': '/dashboard/inventory',
  'logistics-supply-chain': '/dashboard/logistics',
  'production-quality-control': '/dashboard/production',
  'roles': '/dashboard/roles',
  'acls': '/dashboard/acls',
  'approvals': '/dashboard/approvals',
  'logs': '/dashboard/logs',
  'administration': '/dashboard/users',
};

const subModulePaths: Record<string, string> = {
  'customers': '/customers',
  'products': '/products',
  'sales-orders': '/orders',
  'invoices': '/invoices',
  'block-creditors-report': '/creditors',
  'discounts': '/discounts',
  'vendors': '/vendors',
  'purchase-orders': '/orders',
  'vendor-payments': '/payments',
  'fuel-purchases': '/fuel',
  'expenses': '/expenses',
  'raw-materials': '/raw-materials',
  'raw-material-stock-logs': '/raw-material-logs',
  'finished-goods': '/finished-goods',
  'finished-goods-stock-logs': '/finished-goods-logs',
  'delivery-assignments': '/queue',
  'supply-logs': '/supply-log',
  'logistics-fuel-logs': '/fuel',
  'production-batches': '/daily',
  'production-teams': '/teams',
  'production-qc-logs': '/qc',
  'production-fuel-logs': '/fuel',
  'machine-maintenance-logs': '/maintenance',
  'stacking-logs': '/stacking',
  'users': '',
  'machines': '/machines',
  'vehicles': '/vehicles',
  'business-rules': '/rules',
  'all-roles': '',
  'roles-overview': '/overview',
  'role-acls': '/acls',
  'all-acls': '',
  'acls-overview': '/overview',
  'all-approvals': '',
  'approvals-overview': '/overview',
  'all-logs': '',
  'logs-overview': '/overview',
  'sales-customer-management-overview': '/overview',
  'procurement-vendor-management-overview': '/overview',
  'inventory-stock-management-overview': '/overview',
  'production-quality-control-overview': '/overview',
  'logistics-supply-chain-overview': '/overview',
  'administration-overview': '/overview',
};

interface SearchResult {
  type: 'module' | 'submodule';
  moduleName: string;
  moduleStripped: string;
  subModuleName?: string;
  subModuleStripped?: string;
  path: string;
}

interface NavbarProps {
  title?: string;
  subtitle?: string;
  heading?: ReactNode;
}

const Navbar = ({ title, subtitle, heading }: NavbarProps) => {
  const router = useRouter();
  const { user, acls, getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const rolesAccessIds = getAccessIds('roles', 'all-roles');

  const userRole = acls[0]?.Role?.name || 'User';

  const searchableItems = useMemo(() => {
    const items: SearchResult[] = [];
    const addedModules = new Set<string>();
    const addedSubModules = new Set<string>();

    acls.forEach((acl) => {
      const moduleStripped = acl.Module?.stripped;
      const moduleName = acl.Module?.name;
      const subModuleStripped = acl.SubModule?.stripped;
      const subModuleName = acl.SubModule?.name;

      if (moduleStripped && moduleName) {
        if (!addedModules.has(moduleStripped)) {
          addedModules.add(moduleStripped);
          const basePath = modulePaths[moduleStripped] || `/dashboard/${moduleStripped}`;
          items.push({
            type: 'module',
            moduleName,
            moduleStripped,
            path: basePath,
          });
        }

        if (subModuleStripped && subModuleName) {
          const key = `${moduleStripped}:${subModuleStripped}`;
          if (!addedSubModules.has(key)) {
            addedSubModules.add(key);
            const basePath = modulePaths[moduleStripped] || `/dashboard/${moduleStripped}`;
            const subPath = subModulePaths[subModuleStripped] ?? `/${subModuleStripped}`;
            items.push({
              type: 'submodule',
              moduleName,
              moduleStripped,
              subModuleName,
              subModuleStripped,
              path: `${basePath}${subPath}`,
            });
          }
        }
      }
    });

    return items;
  }, [acls]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchableItems.filter((item) => {
      if (item.type === 'module') {
        return item.moduleName.toLowerCase().includes(query);
      }
      return (
        item.subModuleName?.toLowerCase().includes(query) ||
        item.moduleName.toLowerCase().includes(query)
      );
    }).slice(0, 10);
  }, [searchQuery, searchableItems]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleResetRole = async () => {
    if (!rolesAccessIds?.module_unique_id) return;
    if (!confirm('Reset administrator role? This will delete old ACLs and refresh with new tokens.')) return;
    setResetting(true);
    try {
      const params = new URLSearchParams({ module_unique_id: rolesAccessIds.module_unique_id });
      if (rolesAccessIds.sub_module_unique_id) params.append('sub_module_unique_id', rolesAccessIds.sub_module_unique_id);
      const res = await api.put(`/user/administrator/role/reset?${params.toString()}`);
      if (res.data?.success) {
        alert('Role reset successful! The page will reload.');
        window.location.reload();
      } else {
        alert(res.data?.message || 'Reset failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset role');
    } finally {
      setResetting(false);
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const res = await usersService.toggle2FA();
      if (res.success) {
        setTwoFactorEnabled((prev) => !prev);
        alert(res.message || '2FA updated successfully');
      } else {
        alert(res.message || 'Failed to update 2FA');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update 2FA');
    } finally {
      setToggling2FA(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{borderBottom: '1px solid lightgray'}}>
      <nav className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-py-1">
        {heading || (
          <div>
            <h1 className="xui-font-sz-150 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="xui-font-sz-85 xui-mt-half xui-d-none xui-lg-d-block" style={{ color: 'var(--neutral-500)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="xui-d-inline-flex xui-grid-gap-1 xui-flex-ai-center">
          <div ref={searchRef} className="xui-pos-relative xui-w-250 xui-d-none xui-lg-d-flex xui-flex-dir-column">
            <div className="xui-pos-relative">
              <span className="icon-container xui-pos-absolute" style={{ color: 'var(--neutral-400)', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search modules..."
                className="xui-form-input"
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
              />
            </div>

            {showSearchResults && filteredResults.length > 0 && (
              <div
                className="xui-pos-absolute xui-bg-white xui-bdr-rad-half xui-shadow-lg xui-w-fluid-100"
                style={{
                  top: '48px',
                  left: 0,
                  border: '1px solid var(--neutral-200)',
                  zIndex: 1000,
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                {filteredResults.map((result, index) => (
                  <div
                    key={`${result.moduleStripped}-${result.subModuleStripped || 'module'}-${index}`}
                    className="xui-p-half xui-cursor-pointer"
                    style={{
                      borderBottom: index < filteredResults.length - 1 ? '1px solid var(--neutral-100)' : 'none',
                    }}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {result.type === 'module' ? (
                      <div>
                        <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                          {result.moduleName}
                        </p>
                        <p className="xui-font-sz-75" style={{ color: 'var(--neutral-500)' }}>
                          Module
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-800)' }}>
                          {result.subModuleName}
                        </p>
                        <p className="xui-font-sz-75" style={{ color: 'var(--neutral-500)' }}>
                          {result.moduleName}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showSearchResults && searchQuery.trim() && filteredResults.length === 0 && (
              <div
                className="xui-pos-absolute xui-bg-white xui-bdr-rad-half xui-shadow-lg xui-w-fluid-100 xui-p-1"
                style={{
                  top: '48px',
                  left: 0,
                  border: '1px solid var(--neutral-200)',
                  zIndex: 1000,
                }}
              >
                <p className="xui-font-sz-85 xui-text-center" style={{ color: 'var(--neutral-500)' }}>
                  No modules found
                </p>
              </div>
            )}
          </div>

          <div className="xui-tooltip" xui-set="bottom-left">
            <div
              className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer"
              style={{
                border: '1px solid var(--neutral-200)',
                borderRadius: '40px',
                padding: '5px 12px 5px 5px',
              }}
            >
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" className="xui-bdr-rad-circle" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
              ) : (
                <div
                  className="xui-bdr-rad-circle xui-d-flex xui-flex-ai-center xui-flex-jc-center"
                  style={{ width: '30px', height: '30px', backgroundColor: '#111827' }}
                >
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                    {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="xui-font-sz-80 xui-font-w-600 xui-d-none xui-lg-d-inline" style={{ color: 'var(--neutral-800)' }}>
                {user?.fullname?.split(' ')[0] || 'User'}
              </span>
            </div>
            <div className="xui-tooltip-content" style={{ width: '220px' }}>
              <div className="xui-mb-half" style={{ borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>
                <p className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>
                  {user?.fullname || 'User'}
                </p>
                <p className="xui-font-sz-80" style={{ color: 'var(--neutral-400)' }}>
                  {user?.email || userRole}
                </p>
                <span className="xui-font-sz-75 xui-font-w-500 xui-d-inline-block xui-mt-half" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-600)', padding: '2px 8px', borderRadius: '4px' }}>
                  {userRole}
                </span>
              </div>
              {/* {rolesAccessIds?.module_unique_id && (
                <button
                  className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-w-fluid-100 xui-cursor-pointer xui-font-sz-80 xui-font-w-500"
                  style={{ backgroundColor: 'transparent', border: 'none', padding: '6px 0', color: 'var(--neutral-600)', marginBottom: '4px' }}
                  onClick={handleResetRole}
                  disabled={resetting}
                >
                  <Renew size={16} /> {resetting ? 'Resetting...' : 'Reset Role'}
                </button>
              )} */}
              <div
                className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-w-fluid-100"
                style={{ padding: '6px 0', marginBottom: '4px', opacity: toggling2FA ? 0.5 : 1 }}
              >
                <span className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--neutral-600)' }}>
                  2FA
                </span>
                <div className="xui-toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-2fa"
                    checked={twoFactorEnabled}
                    onChange={handleToggle2FA}
                    disabled={toggling2FA}
                  />
                  <div className="slider"></div>
                </div>
              </div>
              <button
                className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-w-fluid-100 xui-cursor-pointer xui-font-sz-85 xui-font-w-500"
                style={{ backgroundColor: 'transparent', border: 'none', padding: '6px 0', color: 'var(--neutral-600)', marginBottom: '4px' }}
                onClick={() => router.push('/dashboard/profile')}
              >
                <UserAvatar size={16} /> Profile
              </button>
              <button
                className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-w-fluid-100 xui-cursor-pointer xui-font-sz-85 xui-font-w-500"
                style={{ backgroundColor: 'transparent', border: 'none', padding: '6px 0', color: 'var(--error)' }}
                onClick={() => modalShow('logout-modal')}
              >
                <Logout size={16} /> Log out
              </button>
            </div>
          </div>

          <div className="xui-w-40 xui-h-40 xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-bg-light xui-bdr-rad-circle xui-bdr-w-1 xui-bdr-style-solid xui-bdr-fade xui-opacity-6 xui-cursor-pointer menu">
            <Menu size={20} />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
