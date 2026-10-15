import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex flex-col min-h-[calc(100vh-4rem)]">
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
