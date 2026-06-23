'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (!profile) return;

        const { data: userRoles } = await supabaseClient
          .from('user_roles')
          .select('roles(code)')
          .eq('profile_id', profile.id);

        if (userRoles) {
          const codes = userRoles.map((ur: any) => {
            if (ur.roles) {
              return Array.isArray(ur.roles) ? ur.roles[0]?.code : ur.roles.code;
            }
            return null;
          }).filter(Boolean);
          if (codes.includes('super_admin') || codes.includes('general_admin')) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error checking role in AdminShell:', err);
      }
    }
    checkRole();
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      // Clear the access token cookie
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
      router.push('/login');
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-charcoal font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-100 flex flex-col border-b md:border-b-0 md:border-r border-stone-800 shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-800 flex flex-col gap-1.5">
          <Link href="/" className="font-serif text-lg font-black tracking-tight text-white hover:text-earth-red transition-colors duration-200">
            LA GAUCHITA FEDERAL
          </Link>
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold">
            Panel de Control
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5">
          <Link
            href="/admin"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Inicio Admin
          </Link>
          
          <div className="h-px bg-stone-800 my-2" />

          <Link
            href="/admin/contenidos"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Contenidos
          </Link>

          <Link
            href="/admin/instituciones"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Instituciones
          </Link>

          <Link
            href="/admin/reconocimientos"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Reconocimientos
          </Link>

          <Link
            href="/admin/archivo"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Archivo Visual
          </Link>

          {isAdmin && (
            <Link
              href="/admin/actividad"
              className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-300 hover:bg-stone-800 hover:text-white transition-colors duration-200"
            >
              Actividad
            </Link>
          )}

          <div className="mt-auto h-px bg-stone-800 my-2" />

          <Link
            href="/"
            className="flex items-center px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-stone-400 hover:bg-stone-800 hover:text-white transition-colors duration-200"
          >
            Volver al portal público &rarr;
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2.5 rounded-md text-xs uppercase tracking-wider font-bold text-earth-red hover:bg-stone-800 hover:text-earth-red/90 transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-stone-800 text-[10px] text-stone-500 font-mono text-center md:text-left">
          <span>Versión 1.0 (Borrador)</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 sm:p-8 md:p-10 max-w-5xl mx-auto w-full gap-8">
        {children}
      </main>

    </div>
  );
}
