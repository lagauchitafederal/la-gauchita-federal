'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabase/client';

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });

      if (error) {
        // We show the success message anyway to prevent email enumeration,
        // but if it's a structural error (like network down), we can log/handle it.
        console.error('Error resetPasswordForEmail:', error);
        if (error.status === 429) {
          setErrorMsg('Demasiadas solicitudes. Por favor intente más tarde.');
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Unexpected error in recovery request:', err);
      setErrorMsg('Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-stone-beige rounded-lg shadow-sm p-8 flex flex-col gap-6">
      
      <div className="text-center flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-earth-red">
          Recuperación
        </span>
        <h2 className="text-2xl font-serif font-black text-charcoal">
          Restablecer Contraseña
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          Ingrese su correo para recibir el enlace de recuperación
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
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md flex flex-col gap-3">
          <p className="text-xs text-emerald-800 font-bold font-mono">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-[11px] text-stone-500 font-mono">
            Por favor revise su bandeja de entrada y su carpeta de correo no deseado (spam).
          </p>
        </div>
      ) : (
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center px-5 py-3 bg-earth-red text-white text-xs uppercase tracking-wider font-bold rounded-md hover:bg-earth-red/90 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}

      <div className="border-t border-stone-beige/80 pt-4 text-center flex flex-col gap-2">
        <Link
          href="/login"
          className="text-xs font-bold text-earth-red hover:underline transition-colors duration-200 font-mono uppercase tracking-wider"
        >
          Volver a Iniciar Sesión
        </Link>
        <Link
          href="/"
          className="text-[11px] font-bold text-stone-500 hover:text-earth-red transition-colors duration-200 font-mono"
        >
          &larr; Volver al sitio público
        </Link>
      </div>

    </div>
  );
}
