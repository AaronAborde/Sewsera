// src/app/useNotifications.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { useApp } from './context/AppContext';

// Live counts shared by the header bell and the sidebar badges.
export function useNotificationCounts() {
  const { currentUser, userRole } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
    return onSnapshot(
      q,
      (snapshot) => {
        let total = 0;
        snapshot.forEach((d) => {
          total += Number(d.data().unreadCount?.[uid]) || 0;
        });
        setUnreadMessages(total);
      },
      () => setUnreadMessages(0)
    );
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || userRole !== 'seller') {
      setPendingOrders(0);
      return;
    }
    const q = query(collection(db, 'fabricOrders'), where('sellerId', '==', currentUser.uid));
    return onSnapshot(
      q,
      (snapshot) => setPendingOrders(snapshot.docs.filter((d) => d.data().status === 'pending').length),
      () => setPendingOrders(0)
    );
  }, [currentUser?.uid, userRole]);

  return { unreadMessages, pendingOrders };
}
