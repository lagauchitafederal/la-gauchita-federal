import React from 'react';
import type { Metadata } from 'next';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña',
  description: 'Establecimiento de una nueva contraseña para La Gauchita Federal',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  );
}
