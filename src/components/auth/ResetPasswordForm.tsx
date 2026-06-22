'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabase/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // session validation state: null (checking), true (valid), false (invalid/expired)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      // 1. Check if there's a session already parsed
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!active) return;
      if (session) {
        setIsValidSession(true);
        return;
      }

      // 2. Listen to state changes (handles the parsing delay of hash parameters by Supabase)
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
        if (!active) return;
        if (event === 'PASSWORD_RECOVERY' || currentSession) {
          setIsValidSession(true);
        }
      });

      // 3. Fallback timeout of 2 seconds before declaring it invalid
      const timeout = setTimeout(async () => {
        if (!active) return;
        const finalSession = await supabaseClient.auth.getSession();
        if (!finalSession.data.session) {
          setIsValidSession(false);
        }
      }, 2000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    };

    checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Error updating password:', error);
        setErrorMsg(error.message || 'No se pudo actualizar la contraseña. El enlace puede haber vencido.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Log out to clear the recovery session
      await supabaseClient.auth.signOut();

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      console.error('Unexpected error in password reset:', err);
      setErrorMsg('Ocurrió un error inesperado al actualizar la contraseña.');
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg shadow-sm p-8 text-center flex flex-col gap-4 items-center">
        <div className="w-6 h-6 border-2 border-earth-red border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-stone-500 font-mono">Verificando enlace de recuperación...</p>
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg shadow-sm p-8 flex flex-col gap-6 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-serif font-black text-charcoal">Enlace Inválido</h2>
          <p className="text-xs text-stone-600 leading-relaxed font-mono">
            El enlace de recuperación es inválido o venció. Solicita uno nuevo.
          </p>
        </div>
        <div className="border-t border-stone-beige/80 pt-4 flex flex-col gap-2">
          <Link
            href="/recuperar-contrasena"
            className="text-xs font-bold text-earth-red hover:underline font-mono uppercase tracking-wider"
          >
            Solicitar nuevo enlace
          </Link>
          <Link
            href="/login"
            className="text-[11px] text-stone-500 hover:underline font-mono"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg shadow-sm p-8 flex flex-col gap-6">
      
      <div className="text-center flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
          Nueva Contraseña
        </span>
        <h2 className="text-2xl font-serif font-black text-charcoal">
          Restablecer Contraseña
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          Ingrese su nueva clave de acceso administrador
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            {errorMsg}
          </p>
        </div>
      )}

      {success ? (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md flex flex-col gap-2">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            ¡Contraseña restablecida con éxito!
          </p>
          <p className="text-[10px] text-stone-500 font-mono">
            Redirigiendo a la página de inicio de sesión...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Nueva Contraseña (mínimo 6 caracteres)
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
              Repetir Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center px-5 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      )}

      <div className="border-t border-stone-beige/80 pt-4 text-center">
        <Link
          href="/login"
          className="text-xs font-bold text-stone-500 hover:text-earth-red transition-colors duration-200 font-mono"
        >
          Volver al Inicio de Sesión
        </Link>
      </div>

    </div>
  );
}
