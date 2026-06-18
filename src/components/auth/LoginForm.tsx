'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabase/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Set the token cookie for server-side auth check
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax; Secure`;
        router.push('/admin');
      } else {
        setErrorMsg('Error al iniciar sesión. Por favor intente nuevamente.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg shadow-sm p-8 flex flex-col gap-6">
      
      <div className="text-center flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
          Acceso Restringido
        </span>
        <h2 className="text-2xl font-serif font-black text-charcoal">
          La Gauchita Federal
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          Ingrese sus credenciales de administrador
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <p className="text-xs text-red-800 font-bold font-mono">
            {errorMsg}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            disabled={loading}
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-earth-red focus:border-earth-red transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
            Contraseña
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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center px-5 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="border-t border-stone-beige/80 pt-4 text-center">
        <Link
          href="/"
          className="text-xs font-bold text-stone-500 hover:text-earth-red transition-colors duration-200 font-mono"
        >
          &larr; Volver al sitio público
        </Link>
      </div>

    </div>
  );
}
