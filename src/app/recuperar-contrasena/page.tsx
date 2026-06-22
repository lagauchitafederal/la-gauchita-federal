import React from 'react';
import type { Metadata } from 'next';
import RecoverPasswordForm from '../../components/auth/RecoverPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña',
  description: 'Solicitud de recuperación de credenciales para La Gauchita Federal',
};

export default function RecoverPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <RecoverPasswordForm />
    </div>
  );
}
