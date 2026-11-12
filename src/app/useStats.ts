// src/app/useStats.ts
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PublicStats {
  tailors: number;
  customers: number;
  sellers: number;
}

const EMPTY: PublicStats = { tailors: 0, customers: 0, sellers: 0 };

// Public counters kept in stats/public (readable without login).
export function usePublicStats() {
  const [stats, setStats] = useState<PublicStats>(EMPTY);

  useEffect(() => {
    getDoc(doc(db, 'stats', 'public'))
      .then(snap => {
        const d = snap.data();
        if (!d) return;
        setStats({
          tailors: Number(d.tailors) || 0,
          customers: Number(d.customers) || 0,
          sellers: Number(d.sellers) || 0,
        });
      })
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return stats;
}
