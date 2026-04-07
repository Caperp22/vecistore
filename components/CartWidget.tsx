'use client';

import Link from 'next/link';
import { useAppContext } from './Providers';

export default function CartWidget() {
  const { cart } = useAppContext();

  if (cart.length === 0) {
    return (
      <Link href="/carrito" className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </Link>
    );
  }

  return (
    <Link href="/carrito" className="relative p-2 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 group flex items-center">
      <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      
      {/* El contador premium */}
      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-md border-2 border-white dark:border-[#0A0A0A] transform group-hover:scale-110 transition-transform duration-300">
        {cart.length}
      </span>
    </Link>
  );
}