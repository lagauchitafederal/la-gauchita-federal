import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../lib/supabase/env';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { supabaseUrl, supabaseAnonKey } = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  // 1. Check if token cookie exists
  if (!token) {
    redirect('/login');
  }

  // 2. Initialize Supabase with user's access token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  // 3. Get Auth User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 4. Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg p-8 flex flex-col gap-6 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-serif font-black text-charcoal">Perfil no encontrado</h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Su cuenta de usuario existe pero no se pudo encontrar un perfil activo en la plataforma.
            </p>
          </div>
          <div className="border-t border-stone-beige/80 pt-4 flex flex-col gap-2">
            <Link href="/" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ir al sitio público
            </Link>
            <Link href="/login" className="text-[11px] text-stone-500 hover:underline">
              Cerrar sesión e intentar de nuevo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile is active
  if (profile.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg p-8 flex flex-col gap-6 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-serif font-black text-charcoal">Cuenta Inactiva</h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Su perfil administrativo se encuentra actualmente en estado: <span className="font-bold">{profile.status}</span>.
            </p>
          </div>
          <div className="border-t border-stone-beige/80 pt-4 flex flex-col gap-2">
            <Link href="/" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ir al sitio público
            </Link>
            <Link href="/login" className="text-[11px] text-stone-500 hover:underline">
              Cerrar sesión e intentar de nuevo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Fetch User Roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_id, roles(code)')
    .eq('profile_id', profile.id);

  if (rolesError) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg p-8 flex flex-col gap-6 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-serif font-black text-charcoal">Error de verificación</h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Ocurrió un error al intentar verificar sus privilegios administrativos.
            </p>
          </div>
          <div className="border-t border-stone-beige/80 pt-4 flex flex-col gap-2">
            <Link href="/" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ir al sitio público
            </Link>
            <Link href="/login" className="text-[11px] text-stone-500 hover:underline">
              Volver a intentar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map roles code
  const roleCodes: string[] = (userRoles || [])
    .map((ur: any) => {
      if (ur.roles) {
        return Array.isArray(ur.roles) ? ur.roles[0]?.code : ur.roles.code;
      }
      return null;
    })
    .filter(Boolean);

  const adminRoles = ['super_admin', 'general_admin', 'federal_editor'];
  const hasAdminRole = roleCodes.some(code => adminRoles.includes(code));

  // 6. Check if user has admin permissions
  if (!hasAdminRole) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg p-8 flex flex-col gap-6 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-serif font-black text-charcoal">Acceso no autorizado</h1>
            <p className="text-sm text-stone-600 leading-relaxed font-medium">
              Su cuenta no posee los privilegios de rol requeridos para ingresar al panel de administración.
            </p>
          </div>
          <div className="border-t border-stone-beige/80 pt-4 flex flex-col gap-2">
            <Link href="/" className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider">
              Ir al sitio público
            </Link>
            <Link href="/login" className="text-[11px] text-stone-500 hover:underline">
              Cerrar sesión e ingresar con otra cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 7. Grant access
  return <>{children}</>;
}
