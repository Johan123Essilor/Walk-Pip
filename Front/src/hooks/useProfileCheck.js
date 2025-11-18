// src/hooks/useProfileCheck.js
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const useProfileCheck = () => {
  const { user, isAuthenticated } = useAuth0();
  const [hasHealthData, setHasHealthData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealthData = async () => {
      if (!isAuthenticated || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Verificando datos de salud para:', user.email);
        
        const response = await fetch('http://localhost:8000/users/salud/mis_datos/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_email: user.email
          })
        });

        if (response.ok) {
          const saludData = await response.json();
          console.log('📊 Datos de salud encontrados:', saludData);
          
          // ✅ CORREGIDO: Solo verificar peso y altura (edad no viene en la respuesta)
          const hasData = saludData && 
                         saludData.peso && 
                         saludData.altura;
          
          console.log('✅ Tiene datos de salud:', hasData);
          setHasHealthData(hasData);
        } else if (response.status === 404) {
          // No hay datos de salud - PRIMERA VEZ
          console.log('❌ No hay datos de salud - Primera vez del usuario');
          setHasHealthData(false);
        } else {
          console.log('⚠️ Error en la respuesta, asumimos sin datos');
          setHasHealthData(false);
        }
      } catch (error) {
        console.error('❌ Error verificando datos de salud:', error);
        setHasHealthData(false);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      checkHealthData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  return { hasHealthData, loading };
};