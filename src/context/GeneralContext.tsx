'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import Cookies from 'js-cookie';
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

interface GeneralContextType {
  user: User | null;
  acls: ACL[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, acls: ACL[], rememberMe?: boolean) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('ndc-campaign-token');
    const savedUser = Cookies.get('ndc-campaign-user');
    const savedAcls = localStorage.getItem('ndc-campaign-acls');

    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('ndc-campaign-user');
      }
    }
    if (savedAcls) {
      try {
        setAcls(JSON.parse(savedAcls));
      } catch {
        localStorage.removeItem('ndc-campaign-acls');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newAcls: ACL[], rememberMe = false) => {
    const cookieOptions = rememberMe ? { expires: 7 } : undefined;

    setToken(newToken);
    setUser(newUser);
    setAcls(newAcls);

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

    Cookies.set('ndc-campaign-token', newToken, cookieOptions);
    Cookies.set('ndc-campaign-user', JSON.stringify(newUser), cookieOptions);
    localStorage.setItem('ndc-campaign-acls', JSON.stringify(slimAcls));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAcls([]);

    Cookies.remove('ndc-campaign-token');
    Cookies.remove('ndc-campaign-user');
    localStorage.removeItem('ndc-campaign-acls');
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

  return (
    <GeneralContext.Provider
      value={{
        user,
        acls,
        token,
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
