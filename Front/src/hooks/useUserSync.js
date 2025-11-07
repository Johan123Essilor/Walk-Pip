// src/hooks/useUserSync.js - VERSIÓN SIN TOKEN
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

export const useUserSync = () => {
  const { user, isAuthenticated } = useAuth0(); // ✅ Quitamos getAccessTokenSilently
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [djangoUser, setDjangoUser] = useState(null);

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (!isAuthenticated || !user) return;

      const storedUser = localStorage.getItem('django_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.auth0_id === user.sub) {
          setDjangoUser(parsedUser);
          return;
        }
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        console.log('🔄 Sincronizando usuario con Django...', user.email);

        // ✅ SIN TOKEN - solo enviamos los datos básicos
        const response = await fetch('http://localhost:8000/users/auth0/sync/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // ❌ QUITAMOS Authorization header
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            sub: user.sub, // ID único de Auth0
            picture: user.picture,
            nickname: user.nickname
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const userData = await response.json();
        console.log('✅ Usuario sincronizado exitosamente:', userData);
        
        localStorage.setItem('django_user', JSON.stringify(userData.user || userData));
        setDjangoUser(userData.user || userData);
        
      } catch (error) {
        console.error('❌ Error sincronizando usuario:', error);
        setSyncError(error.message);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUserWithBackend();
  }, [isAuthenticated, user]); // ✅ Quitamos getAccessTokenSilently de las dependencias

  return { isSyncing, syncError, djangoUser };
};