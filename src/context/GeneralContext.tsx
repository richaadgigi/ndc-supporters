'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import membersService from '../services/members.service';
import type { ACL } from '../services/auth.service';
import { checkUserAccess, type AccessType, type CheckUserAccessResult } from '../utils/checkUserAccess';

interface User {
  fullname: string;
  email?: string;
  profile_image?: string | null;
}

interface AccessIds {
  module_unique_id: string;
  sub_module_unique_id: string;
}

export type UserType = 'admin' | 'portal';

interface GeneralContextType {
  user: User | null;
  acls: ACL[];
  token: string | null;
  supportGroupId: string | null;
  userType: UserType | null;
  isPortalUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, acls: ACL[], supportGroupId?: string | null, rememberMe?: boolean, userType?: UserType) => void;
  logout: () => void;
  hasAccess: (moduleStripped: string, subModuleStripped?: string) => boolean;
  getAccessIds: (moduleStripped: string, subModuleStripped: string) => AccessIds | null;
  checkAccess: (moduleUniqueId: string, subModuleUniqueId?: string, accessType?: AccessType) => CheckUserAccessResult;
}

const GeneralContext = createContext<GeneralContextType | undefined>(undefined);

interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider = ({ children }: GeneralProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [acls, setAcls] = useState<ACL[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [supportGroupId, setSupportGroupId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('ndc-supporter-token');
    const savedUser = Cookies.get('ndc-supporter-user');
    const savedAcls = localStorage.getItem('ndc-supporter-acls');
    const savedGroupId = Cookies.get('ndc-supporter-group-id');

    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('ndc-supporter-user');
      }
    }
    if (savedAcls) {
      try {
        setAcls(JSON.parse(savedAcls));
      } catch {
        localStorage.removeItem('ndc-supporter-acls');
      }
    }
    if (savedGroupId) setSupportGroupId(savedGroupId);

    const savedUserType = Cookies.get('ndc-supporter-user-type');
    if (savedUserType === 'admin' || savedUserType === 'portal') setUserType(savedUserType);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading || !token || supportGroupId || userType === 'admin') return;
    let cancelled = false;
    membersService.portalGetProfile()
      .then(res => {
        const resolved = res.data?.support_group_unique_id || res.data?.SupportGroup?.unique_id;
        if (!cancelled && resolved) {
          setSupportGroupId(resolved);
          Cookies.set('ndc-supporter-group-id', resolved);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoading, token, supportGroupId, userType]);

  const login = (newToken: string, newUser: User, newAcls: ACL[], newSupportGroupId?: string | null, rememberMe = false, newUserType: UserType = 'portal') => {
    const cookieOptions = rememberMe ? { expires: 7 } : undefined;

    setToken(newToken);
    setUser(newUser);
    setAcls(newAcls);
    setSupportGroupId(newSupportGroupId ?? null);
    setUserType(newUserType);

    const slimAcls = newAcls.map(a => ({
      module_unique_id: a.module_unique_id,
      sub_module_unique_id: a.sub_module_unique_id,
      acl_expiring: a.acl_expiring,
      status: a.status,
      view: a.view,
      add: a.add,
      edit: a.edit,
      delete: a.delete,
      elevated_role: a.elevated_role,
      Module: a.Module ? { stripped: a.Module.stripped, name: a.Module.name } : null,
      SubModule: a.SubModule ? { stripped: a.SubModule.stripped, name: a.SubModule.name } : null,
    }));

    Cookies.set('ndc-supporter-token', newToken, cookieOptions);
    Cookies.set('ndc-supporter-user', JSON.stringify(newUser), cookieOptions);
    localStorage.setItem('ndc-supporter-acls', JSON.stringify(slimAcls));
    Cookies.set('ndc-supporter-user-type', newUserType, cookieOptions);
    if (newSupportGroupId) {
      Cookies.set('ndc-supporter-group-id', newSupportGroupId, cookieOptions);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAcls([]);
    setSupportGroupId(null);
    setUserType(null);

    Cookies.remove('ndc-supporter-token');
    Cookies.remove('ndc-supporter-user');
    Cookies.remove('ndc-supporter-group-id');
    Cookies.remove('ndc-supporter-user-type');
    localStorage.removeItem('ndc-supporter-acls');
  };

  const hasAccess = (moduleStripped: string, subModuleStripped?: string): boolean => {
    if (!acls.length) return false;
    return acls.some((acl) => {
      const moduleMatch = acl.Module?.stripped === moduleStripped;
      if (!subModuleStripped) return moduleMatch;
      return moduleMatch && acl.SubModule?.stripped === subModuleStripped;
    });
  };

  const getAccessIds = (moduleStripped: string, subModuleStripped: string): AccessIds | null => {
    const acl = acls.find(
      (a) => a.Module?.stripped === moduleStripped && a.SubModule?.stripped === subModuleStripped
    );
    if (!acl) return null;
    return {
      module_unique_id: acl.module_unique_id,
      sub_module_unique_id: acl.sub_module_unique_id,
    };
  };

  const checkAccess = useCallback(
    (moduleUniqueId: string, subModuleUniqueId?: string, accessType?: AccessType): CheckUserAccessResult => {
      return checkUserAccess(acls, moduleUniqueId, subModuleUniqueId, accessType);
    },
    [acls]
  );

  const isAuthenticated = !!token && !!user;
  const isPortalUser = acls.length > 0;

  return (
    <GeneralContext.Provider
      value={{
        user,
        acls,
        token,
        supportGroupId,
        userType,
        isPortalUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasAccess,
        getAccessIds,
        checkAccess,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneral = (): GeneralContextType => {
  const context = useContext(GeneralContext);
  if (context === undefined) {
    throw new Error('useGeneral must be used within a GeneralProvider');
  }
  return context;
};

export default GeneralContext;
