from fastapi import Depends, HTTPException, status
from typing import List, Optional
from models import User
from oauth2 import get_current_user

def require_module(module_name: str):
    """
    Dependency factory to enforce that the current user has access to a specific module.
    Usage: Depends(require_module("academico"))
    """
    def check_module_access(current_user: User = Depends(get_current_user)) -> User:
        user_modules = current_user.modules or []
        
        # Strict Check: The user MUST have the module.
        # Exception: 'organizacion' module (Admin) usually implies access to most management features
        # BUT the user explicitly said "ningun usuario puede tener acceso a un modulo que no se le asigno".
        # This implies we should NOT allow 'organizacion' to bypass, UNLESS 'organizacion' is the module being requested.
        
        # However, for practical purposes, SuperAdmins (organizacion) often need to view other modules.
        # Let's start with STRICT check as requested.
        
        has_access = module_name in user_modules
        
        # If strict check fails, check for super-admin/organizacion override IF appropriate
        # For now, adhering to strict request:
        if not has_access:
             # Just in case 'admin' role legacy exists
             if "organizacion" in user_modules and "admin" in (current_user.roles or []):
                 pass # Allow superadmins? Let's NOT allow them implicitly to be safe given the prompt.
             
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: No tienes acceso al módulo '{module_name}'."
            )
            
        return current_user
        
    return check_module_access

def require_role(role_name: str):
    def check_role_access(current_user: User = Depends(get_current_user)) -> User:
        if role_name not in (current_user.roles or []) and current_user.eventRole != role_name:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: Se requiere el rol '{role_name}'."
            )
        return current_user
    return check_role_access

def require_any_module(module_names: List[str]):
    """
    Dependency factory to enforce that the current user has access to AT LEAST ONE of the specified modules.
    Usage: Depends(require_any_module(["investigacion", "academico"]))
    """
    def check_module_access(current_user: User = Depends(get_current_user)) -> User:
        user_modules = current_user.modules or []
        
        has_access = any(m in user_modules for m in module_names)
        
        if not has_access:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: Requiere uno de los siguientes módulos: {', '.join(module_names)}."
            )
            
        return current_user
        
    return check_module_access
