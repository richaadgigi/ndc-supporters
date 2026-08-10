 'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_SHORT_NAME } from '../../Globals';
import {
  Dashboard,
  UserMultiple,
  Settings,
  Logout,
  Report,
  UserAdmin,
  Security,
  Checkmark,
  DataBase,
  ChevronDown,
  ChevronUp,
  Document,
  Folder,
  SidePanelCloseFilled,
  SidePanelOpenFilled,
  Blog,
  EventSchedule,
  Help,
  FolderOpen,
  Category,
  Image,
  Notebook,
  Email,
  Bullhorn,
  Group,
  GroupPresentation,
  Person,
} from '@carbon/icons-react';
import { useState, useMemo, useEffect } from 'react';
import { useGeneral } from '../../context/GeneralContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  end?: boolean;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const moduleIcons: Record<string, React.ReactNode> = {
  'supporter-portal': <GroupPresentation size={20} />,
  'supporter': <Group size={20} />,
  'roles': <UserAdmin size={20} />,
  'acls': <Security size={20} />,
  'approvals': <Checkmark size={20} />,
  'logs': <DataBase size={20} />,
  'administration': <Settings size={20} />,
};

const subModuleIcons: Record<string, React.ReactNode> = {
  'supporter-portal-overview': <Dashboard size={16} />,
  'support-group-profile': <Person size={16} />,
  'announcements': <Bullhorn size={16} />,
  'categories': <Category size={16} />,
  'enquiries': <Help size={16} />,
  'events': <EventSchedule size={16} />,
  'faqs': <Help size={16} />,
  'file-storage': <FolderOpen size={16} />,
  'gallery': <Image size={16} />,
  'members': <UserMultiple size={16} />,
  'newsletter': <Email size={16} />,
  'posts': <Blog size={16} />,

  'supporter-overview': <Dashboard size={16} />,
  'support-group-types': <Notebook size={16} />,
  'support-groups': <Group size={16} />,
  'support-group-members': <UserMultiple size={16} />,
  'member-roles': <UserAdmin size={16} />,
  'member-role-acls': <Security size={16} />,

  'all-roles': <UserAdmin size={16} />,
  'roles-overview': <Dashboard size={16} />,
  'role-acls': <Security size={16} />,
  'all-acls': <Security size={16} />,
  'acls-overview': <Dashboard size={16} />,
  'all-approvals': <Checkmark size={16} />,
  'approvals-overview': <Dashboard size={16} />,
  'all-logs': <Report size={16} />,
  'logs-overview': <Dashboard size={16} />,
  'administration-overview': <Dashboard size={16} />,
  'users': <UserMultiple size={16} />,
};

const modulePaths: Record<string, string> = {
  'supporter-portal': '/dashboard/supporter-portal',
  'supporter': '/dashboard/supporter',
  'roles': '/dashboard/roles',
  'acls': '/dashboard/acls',
  'approvals': '/dashboard/approvals',
  'logs': '/dashboard/logs',
  'administration': '/dashboard/admin',
};

const subModulePaths: Record<string, string> = {
  'supporter-portal-overview': '/overview',
  'support-group-profile': '/profile',
  'announcements': '/announcements',
  'categories': '/categories',
  'enquiries': '/enquiries',
  'events': '/events',
  'faqs': '/faqs',
  'file-storage': '/file-storage',
  'gallery': '/gallery',
  'members': '/members',
  'newsletter': '/newsletter',
  'posts': '/posts',

  'supporter-overview': '/overview',
  'support-group-types': '/support-group-types',
  'support-groups': '/support-groups',
  'support-group-members': '/support-group-members',
  'member-roles': '/member-roles',
  'member-role-acls': '/member-role-acls',

  'all-roles': '',
  'roles-overview': '/overview',
  'role-acls': '/acls',
  'all-acls': '',
  'acls-overview': '/overview',
  'all-approvals': '',
  'approvals-overview': '/overview',
  'all-logs': '',
  'logs-overview': '/overview',
  'administration-overview': '/overview',
  'users': '/users',
};

const moduleGroups: Record<string, string> = {
  'supporter-portal': 'Support Group',
  'supporter': 'Administration',
  'roles': 'Administration',
  'acls': 'Administration',
  'approvals': 'Administration',
  'logs': 'Administration',
  'administration': 'Administration',
};

const PUBLIC_MEMBER_ITEMS: NavItem[] = [
  { label: 'Announcements', path: '/dashboard/announcements', icon: <Bullhorn size={20} /> },
  { label: 'Events', path: '/dashboard/events', icon: <EventSchedule size={20} /> },
  { label: 'Gallery', path: '/dashboard/gallery', icon: <Image size={20} /> },
  { label: 'Posts', path: '/dashboard/posts', icon: <Blog size={20} /> },
];

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { acls, isPortalUser, userType } = useGeneral();
  const pathname = usePathname();

  const toggleExpand = (label: string) => {
    if (collapsed) return;
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const navGroups = useMemo(() => {
    const groups: Record<string, NavItem[]> = {
      'Overview': [{ label: 'Dashboard', path: '/dashboard', icon: <Dashboard size={20} /> }],
      'My Group': [],
      'Support Group': [],
      'Administration': [],
    };

    if (!isPortalUser) {
      groups['My Group'] = PUBLIC_MEMBER_ITEMS;
    } else {
      const aclsByModule: Record<string, { moduleName: string; moduleStripped: string; subModules: { name: string; stripped: string }[] }> = {};

      acls.forEach((acl) => {
        const moduleStripped = acl.Module?.stripped;
        const moduleName = acl.Module?.name;
        const subModuleStripped = acl.SubModule?.stripped;
        const subModuleName = acl.SubModule?.name;

        if (moduleStripped && moduleName) {
          if (!aclsByModule[moduleStripped]) {
            aclsByModule[moduleStripped] = { moduleName, moduleStripped, subModules: [] };
          }
          if (subModuleStripped && subModuleName) {
            const exists = aclsByModule[moduleStripped].subModules.some(s => s.stripped === subModuleStripped);
            if (!exists) {
              aclsByModule[moduleStripped].subModules.push({ name: subModuleName, stripped: subModuleStripped });
            }
          }
        }
      });

      Object.values(aclsByModule).forEach((module) => {
        const groupName = moduleGroups[module.moduleStripped] || 'Support Group';

        if (userType === 'admin' && groupName === 'Support Group') return;
        if (userType === 'portal' && groupName === 'Administration') return;

        const basePath = modulePaths[module.moduleStripped] || `/dashboard/${module.moduleStripped}`;
        const moduleIcon = moduleIcons[module.moduleStripped] || <Folder size={20} />;

        const children: NavItem[] = module.subModules.map((subModule) => {
          const subPath = subModulePaths[subModule.stripped] ?? `/${subModule.stripped}`;
          const subIcon = subModuleIcons[subModule.stripped] || <Document size={16} />;
          return {
            label: subModule.name,
            path: `${basePath}${subPath}`,
            icon: subIcon,
            end: subPath === '',
          };
        });

        if (children.length > 0) {
          groups[groupName].push({
            label: module.moduleName,
            path: basePath,
            icon: moduleIcon,
            children,
          });
        }
      });
    }

    const result: NavGroup[] = [];
    const groupOrder = isPortalUser
      ? ['Overview', 'Support Group', 'Administration']
      : ['Overview', 'My Group'];

    groupOrder.forEach((groupLabel) => {
      if (groups[groupLabel]?.length > 0) {
        result.push({ label: groupLabel, items: groups[groupLabel] });
      }
    });

    return result;
  }, [acls, isPortalUser, userType]);

  useEffect(() => {
    const activeLabels: string[] = [];
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (child) => pathname === child.path || pathname.startsWith(child.path + '/')
          );
          if (hasActiveChild) activeLabels.push(item.label);
        }
      });
    });
    if (activeLabels.length > 0) {
      setExpandedItems((prev) => {
        const merged = new Set([...prev, ...activeLabels]);
        return merged.size !== prev.length ? Array.from(merged) : prev;
      });
    }
  }, [pathname, navGroups]);

  const getIsActive = (item: NavItem, siblings?: NavItem[]) => {
    if (item.path === '/dashboard') return pathname === '/dashboard';
    if (item.end && siblings) {
      const siblingPaths = siblings.filter(s => s.path !== item.path).map(s => s.path);
      return pathname === item.path ||
        (pathname.startsWith(item.path + '/') && !siblingPaths.some(sp => pathname.startsWith(sp)));
    }
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  const renderNavItem = (item: NavItem, isChild = false, siblings?: NavItem[]) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label) && !collapsed;

    if (hasChildren) {
      return (
        <div key={item.label} className={`sidebar-dropdown ${isExpanded ? 'open' : ''}`}>
          <div
            className="sidebar-link sidebar-link-parent"
            onClick={() => toggleExpand(item.label)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-text">{item.label}</span>
            <span className="sidebar-link-chevron">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
          {isExpanded && (
            <div className="sidebar-dropdown-menu">
              {item.children?.map((child) => renderNavItem(child, true, item.children))}
            </div>
          )}
        </div>
      );
    }

    const isActive = getIsActive(item, siblings);

    return (
      <Link
        key={item.path}
        href={item.path}
        className={`sidebar-link ${isChild ? 'sidebar-link-child' : ''} ${isActive ? 'active' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="sidebar-link-icon">{item.icon}</span>
        <span className="sidebar-link-text">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className={`navigator ${collapsed ? 'collapsed' : ''} xui-pos-relative`}>
      <div className="brand">
        <div className={`xui-w-fluid-100 xui-d-flex xui-flex-ai-center ${collapsed ? 'xui-flex-jc-center' : 'xui-flex-jc-space-between'}`}>
          {!collapsed ? (
            <>
              <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                <img src="/ndc-logo2.jpeg" alt="NDC" className="xui-img-[40px]" />
                <span className="xui-font-sz-[14px] xui-font-w-700 xui-text-white">{APP_SHORT_NAME}</span>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="sidebar-collapse-btn xui-d-none xui-lg-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                title="Collapse sidebar"
              >
                <SidePanelCloseFilled size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-collapse-btn xui-d-none xui-lg-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
              title="Expand sidebar"
            >
              <SidePanelOpenFilled size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="links xui-font-1">
        <div>
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              {!collapsed && <span className="sidebar-group-label">{group.label}</span>}
              {group.items.map((item) => renderNavItem(item))}
            </div>
          ))}
        </div>

        <div className="bottom-fixed">
          <div
            className="sidebar-link xui-cursor-pointer"
            title={collapsed ? 'Log out' : undefined}
            xui-modal-open="logout-modal"
          >
            <span className="sidebar-link-icon"><Logout size={18} /></span>
            {!collapsed && <span className="sidebar-link-text">Log out</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
