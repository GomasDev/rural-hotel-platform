import { useState, useEffect } from 'react';

const KEY = 'ruralHot_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggle  = (id: string) =>
    setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const isFav   = (id: string) => favorites.includes(id);

  return { favorites, toggle, isFav };
}