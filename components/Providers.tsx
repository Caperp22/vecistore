'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase'; // Conexión a la BD

interface AppContextType {
  cart: any[];
  addToCart: (product: any) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  favorites: any[];
  toggleFavorite: (product: any) => void;
  user: any | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);
  
  // Usamos esta bandera para saber cuándo ya cargamos los datos guardados
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. RECUPERAR DATOS: Al entrar a la app, buscamos si había algo guardado
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('veciStore_cart');
    const favoritosGuardados = localStorage.getItem('veciStore_favorites');
    
    if (carritoGuardado) setCart(JSON.parse(carritoGuardado));
    if (favoritosGuardados) setFavorites(JSON.parse(favoritosGuardados));
    
    setIsInitialized(true);
  }, []);

  // 2. GUARDAR DATOS: Cada vez que el carrito o favoritos cambian, los guardamos
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('veciStore_cart', JSON.stringify(cart));
      localStorage.setItem('veciStore_favorites', JSON.stringify(favorites));
    }
  }, [cart, favorites, isInitialized]);

  // 3. SESIÓN DE USUARIO (Se mantiene intacto)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existe = prev.find((p) => p.id === product.id);
      if (existe) {
        return prev.map((p) => p.id === product.id ? { ...p, cantidad: (p.cantidad || 1) + 1 } : p);
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
    toast.success(`${product.title} agregado al carrito 🛒`);
  };

  const updateQuantity = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: nuevaCantidad } : p)));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
    toast.info('Producto eliminado del carrito');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('veciStore_cart'); // Limpiamos también la memoria
  };

  const toggleFavorite = (product: any) => {
    setFavorites((prev) => {
      const existe = prev.find((p) => p.id === product.id);
      if (existe) {
        toast.info(`${product.title} eliminado de favoritos`);
        return prev.filter((p) => p.id !== product.id);
      }
      toast.success(`${product.title} guardado en favoritos ❤️`);
      return [...prev, product];
    });
  };

  return (
    <AppContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, favorites, toggleFavorite, user }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext debe usarse dentro de Providers');
  return context;
};