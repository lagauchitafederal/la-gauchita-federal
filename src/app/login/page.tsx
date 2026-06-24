import React from 'react';
import type { Metadata } from 'next';
import LoginForm from '../../components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Acceso administrativo para La Gauchita Federal',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
