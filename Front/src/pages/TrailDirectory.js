import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';
import ReviewsSection from './ReviewsSection';
import ReturnTimeModal from '../components/ReturnTimeModal';
import CreateGroupForm from '../components/CreateGroupForm';
// Obtener la URL base desde las variables de entorno
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TrailDirectory = () => {
  const [searchParams] = useSearchParams();
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState({
    date: '',
    time: ''
  });
  const [selectedHourlyWeather, setSelectedHourlyWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drfToken, setDrfToken] = useState(null);  const [trails, setTrails] = useState([]);
  const [loadingTrails, setLoadingTrails] = useState(true);
  
  // Estados para el sistema de grupos simplificado
  const [goingSolo, setGoingSolo] = useState(true); // true = solo, false = con grupo
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // En el estado del componente TrailDirectory
  const [showReturnTimeModal, setShowReturnTimeModal] = useState(false);
  const [lastAppointmentId, setLastAppointmentId] = useState(null);

  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const leafletLoadedRef = useRef(false);

  // Función mejorada para obtener rutas desde el backend
  const fetchTrailsFromBackend = async () => {
    try {
      console.log(' Obteniendo rutas desde el backend...');
      const response = await fetch(`${API_BASE_URL}/trail/rutas/`);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const rutasData = await response.json();
      console.log('Rutas obtenidas:', rutasData);

      // Verificar si hay datos y mapearlos correctamente
      if (rutasData && Array.isArray(rutasData)) {
        const formattedTrails = rutasData.map(ruta => ({
          id: ruta.id,
          nombre: ruta.nombre || 'Ruta sin nombre',
          lat: parseFloat(ruta.lat) || 32.525045,
          lon: parseFloat(ruta.lon) || -117.018443,
          fotos: ["/images/default-trail.jpg"],
          descripcion: ruta.descripcion || "Descripción no disponible",
          recomendaciones: ruta.recomendaciones || "Recomendaciones no disponibles",
          nivel_experiencia: ruta.nivel_experiencia || "Intermedio"
        }));

        setTrails(formattedTrails);
        return formattedTrails;
      } else {
        throw new Error('Formato de datos inválido');
      }

    } catch (error) {
      console.error(' Error obteniendo rutas:', error);
      // Datos de ejemplo como fallback
      const fallbackTrails = [
        {
          id: 1,
          nombre: "Cerro de la Silla",
          lat: 25.6047,
          lon: -100.2511,
          fotos: ["/images/Cerro_de_la_silla.png"],
          descripcion: "Un ícono de Monterrey, ruta exigente pero con vistas espectaculares.",
          recomendaciones: "Lleva agua, bloqueador y ropa ligera.",
          nivel_experiencia: "Avanzado"
        },
        {
          id: 2,
          nombre: "Cerro Colorado",
          lat: 25.6500,
          lon: -100.3000,
          fotos: ["/images/default-trail.jpg"],
          descripcion: "Ruta moderada con vistas panorámicas de la ciudad.",
          recomendaciones: "Ideal para principiantes, llevar zapatos cómodos.",
          nivel_experiencia: "Intermedio"
        }
      ];
      setTrails(fallbackTrails);
      return fallbackTrails;
    } finally {
      setLoadingTrails(false);
    }
  };

  // Función para obtener los grupos del usuario
  const fetchUserGroups = async () => {
    try {
      setLoadingGroups(true);
      console.log('🔄 Obteniendo grupos del usuario...');
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/?user_email=${user?.email || ''}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const groupsData = await response.json();
      console.log('✅ Grupos obtenidos:', groupsData);

      setGroups(groupsData || []);

    } catch (error) {
      console.error('❌ Error obteniendo grupos:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };
  // Función para seleccionar un grupo y abrir modal de miembros
  const selectGroup = async (group) => {
    try {
      setSelectedGroup(group);
      console.log('🔄 Seleccionando grupo:', group.nombre);
      
      // Inicializar miembros vacío y mostrar modal para agregar miembros
      setSelectedGroupMembers([]);
      setShowGroupSelector(false);
      setShowMembersModal(true);
      
      // Obtener usuarios disponibles para invitar
      await fetchAvailableUsers();

    } catch (error) {
      console.error('❌ Error seleccionando grupo:', error);
      setSelectedGroupMembers([]);
    }
  };  // Función para obtener usuarios disponibles
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('🔄 Obteniendo usuarios disponibles...');
      
      const response = await fetch(`${API_BASE_URL}/users/`);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const usersData = await response.json();
      console.log('✅ Usuarios obtenidos:', usersData);
      
      // Verificar que usersData sea un array, si no, convertirlo o usar array vacío
      let usersList = [];
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && typeof usersData === 'object' && usersData.results) {
        // Si viene con paginación (results)
        usersList = usersData.results;
      } else if (usersData && typeof usersData === 'object') {
        // Si es un objeto individual, convertir a array
        usersList = [usersData];
      }
      
      // Filtrar usuarios para no incluir al usuario actual
      // Usar tanto email como correo para compatibilidad
      const filteredUsers = usersList.filter(u => 
        u.email !== user?.email && u.correo !== user?.email
      );
      
      console.log('📋 Usuarios filtrados:', filteredUsers);
      setAvailableUsers(filteredUsers || []);

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };
  // Función para agregar miembro al grupo
  const addMemberToGroup = async (userToAdd) => {
    try {
      const userEmail = userToAdd.correo || userToAdd.email;
      console.log('🔄 Agregando miembro al grupo:', userEmail);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${selectedGroup.id}/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: userEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      // Agregar usuario a la lista de miembros seleccionados
      setSelectedGroupMembers(prev => [...prev, userToAdd]);
      console.log('✅ Miembro agregado exitosamente');

    } catch (error) {
      console.error('❌ Error agregando miembro:', error);
      alert('Error agregando miembro al grupo');
    }
  };

  // Función para remover miembro del grupo
  const removeMemberFromGroup = (memberEmail) => {
    setSelectedGroupMembers(prev => prev.filter(member => 
      (member.correo || member.email) !== memberEmail
    ));
  };

  // Función para crear un nuevo grupo
  const createNewGroup = async (groupData) => {
    try {
      console.log('🔄 Creando nuevo grupo:', groupData);
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...groupData,
          user_email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const newGroup = await response.json();
      console.log('✅ Grupo creado:', newGroup);

      // Actualizar la lista de grupos
      await fetchUserGroups();
      
      // Seleccionar automáticamente el nuevo grupo
      await selectGroup(newGroup);
      
      setShowCreateGroupModal(false);
      
      return newGroup;

    } catch (error) {
      console.error('❌ Error creando grupo:', error);
      throw error;
    }
  };  // FUNCIÓN MEJORADA para inicializar el mapa
  const initializeMap = async (rutas) => {
    if (typeof window === 'undefined' || !mapRef.current || rutas.length === 0) {
      console.log('⚠️ Condiciones no cumplidas para inicializar mapa');
      return;
    }

    try {
      // Evitar múltiples inicializaciones
      if (leafletLoadedRef.current && mapInstanceRef.current) {
        console.log('✅ Mapa ya está inicializado');
        return;
      }

      // Limpiar mapa existente si hay uno
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (cleanupError) {
          console.warn('⚠️ Error limpiando mapa anterior:', cleanupError);
        }
      }

      // Cargar Leaflet solo una vez
      if (!leafletLoadedRef.current) {
        // Cargar CSS de Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
        }

        // Esperar a que el CSS se cargue
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Importar Leaflet
      const L = await import('leaflet');

      // Configurar iconos por defecto
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Limpiar mapa existente
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }      // Crear nuevo mapa con timeout y validaciones mejoradas
      setTimeout(() => {
        try {
          // Verificar que el elemento DOM esté disponible
          if (!mapRef.current) {
            console.error('❌ Elemento del mapa no disponible');
            return;
          }

          // Crear el mapa con manejo de errores
          mapInstanceRef.current = L.map(mapRef.current, {
            preferCanvas: true,
            zoomControl: true
          }).setView([32.525045, -117.018443], 10);

          // Agregar la capa de tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
          }).addTo(mapInstanceRef.current);

          // Limpiar marcadores anteriores
          markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current) {
              try {
                mapInstanceRef.current.removeLayer(marker);
              } catch (err) {
                console.warn('⚠️ Error removiendo marcador:', err);
              }
            }
          });
          markersRef.current = [];

          // Agregar marcadores para cada ruta con manejo de errores
          rutas.forEach((trail, index) => {
            if (trail.lat && trail.lon) {
              try {
                const marker = L.marker([trail.lat, trail.lon])
                  .addTo(mapInstanceRef.current)
                  .on('click', () => {
                    // Usar setTimeout para evitar problemas de sincronización
                    setTimeout(() => {
                      handleTrailSelect(trail);
                    }, 100);
                  })
                  .bindPopup(`
                    <div style="min-width: 200px;">
                      <b>${trail.nombre}</b><br>
                      <small>${trail.descripcion}</small><br>
                      <em>Nivel: ${trail.nivel_experiencia}</em>
                    </div>
                  `);
                markersRef.current.push(marker);
              } catch (markerError) {
                console.warn(`⚠️ Error creando marcador para ${trail.nombre}:`, markerError);
              }
            }
          });

          // Evento cuando el mapa termine de cargar
          mapInstanceRef.current.whenReady(() => {
            leafletLoadedRef.current = true;
            console.log('🗺️ Mapa completamente inicializado con', rutas.length, 'rutas');
          });

        } catch (mapError) {
          console.error('❌ Error creando el mapa:', mapError);
          leafletLoadedRef.current = false;
        }
      }, 500);

    } catch (error) {
      console.error(' Error loading Leaflet:', error);
    }
  };

  // FUNCIÓN SIMPLIFICADA - Ya no necesitamos token JWT para citas
  const obtenerTokenJWT = async () => {
    try {
      console.log(' Configurando autenticación...');
      const auth0Token = await getAccessTokenSilently();
      console.log(' Token Auth0 obtenido (para futuros usos)');

      setDrfToken(auth0Token);
      localStorage.setItem('drf_token', auth0Token);

      return auth0Token;

    } catch (error) {
      console.error(' Error obteniendo token:', error);
      throw error;
    }
  };

  // Interpretar código del clima
  const interpretWeatherCode = (code) => {
    if (code === 0) return { text: "Despejado", icon: "/images/climaIcon/sun.png" };
    if (code === 1 || code === 2 || code === 3) return { text: "Parcialmente nublado", icon: "/images/climaIcon/nublado.png" };
    if (code === 45 || code === 48) return { text: "Niebla", icon: "/images/climaIcon/foggy.png" };
    if (code >= 51 && code <= 67) return { text: "Lluvia ligera a moderada", icon: "/images/climaIcon/cloudy.png" };
    if (code >= 71 && code <= 77) return { text: "Nieve", icon: "/images/climaIcon/snow.png" };
    if (code >= 80 && code <= 86) return { text: "Lluvia con tormenta", icon: "/images/climaIcon/storm.png" };
    if (code >= 95 && code <= 99) return { text: "Tormenta severa", icon: "/images/climaIcon/strongstorm.png" };
    return { text: "Desconocido", icon: "" };
  };

  // Obtener clima actual
  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh&timezone=America/Monterrey`
      );
      const data = await res.json();
      const weatherInfo = interpretWeatherCode(data.current_weather.weathercode);
      return {
        descripcion: weatherInfo,
        temperatura: data.current_weather.temperature,
        viento: data.current_weather.windspeed
      };
    } catch (err) {
      console.error(err);
      return { descripcion: { text: "No disponible", icon: "" }, temperatura: "N/A", viento: "N/A" };
    }
  };

  // Obtener clima por hora
  const fetchHourlyWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=America/Monterrey`
      );
      const data = await res.json();
      return data.hourly;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // FUNCIÓN SIMPLIFICADA para enviar cita solo con grupos
  const enviarCitaAlBackend = async (appointmentData) => {
    try {
      console.log('🔄 Enviando cita al backend...');

      // Datos simplificados: solo grupo o individual
      const dataConUsuario = {
        ...appointmentData,
        user_email: user?.email,
        compania: goingSolo ? null : selectedGroup?.id  // Solo enviar grupo o null
      };

      console.log('📤 Datos completos:', dataConUsuario);

      const response = await fetch(`${API_BASE_URL}/trail/agendar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataConUsuario)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const responseData = await response.json();
      console.log('✅ Cita creada exitosamente:', responseData);
      return responseData;

    } catch (error) {
      console.error('❌ Error enviando cita:', error);
      throw error;
    }
  };

  // Obtener token JWT cuando el usuario se autentique
  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated && user) {
        try {
          const savedToken = localStorage.getItem('drf_token');
          if (savedToken) {
            setDrfToken(savedToken);
            console.log(' Usando token guardado');
          } else {
            await obtenerTokenJWT();
          }
        } catch (error) {
          console.error(' Error inicializando autenticación:', error);
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, user]);

  //  Cargar rutas cuando el componente se monte
  useEffect(() => {
    const loadTrails = async () => {
      const rutas = await fetchTrailsFromBackend();
      await initializeMap(rutas);
    };

    loadTrails();
  }, []);

  //  Cargar TODOS los usuarios cuando el usuario se autentique
  // Auto-seleccionar ruta si viene desde RutasSenderismo (query params lat/lon o id)
  useEffect(() => {
    if (trails.length > 0) {
      const paramId = searchParams.get('id');
      const paramLat = searchParams.get('lat');
      const paramLon = searchParams.get('lon');

      let matchedTrail = null;

      // Buscar por ID primero (más preciso)
      if (paramId) {
        matchedTrail = trails.find(t => t.id === parseInt(paramId));
      }

      // Si no encuentra por ID, buscar por proximidad lat/lon
      if (!matchedTrail && paramLat && paramLon) {
        const targetLat = parseFloat(paramLat);
        const targetLon = parseFloat(paramLon);
        const threshold = 0.01; // ~1 km de tolerancia

        matchedTrail = trails.find(t =>
          Math.abs(t.lat - targetLat) < threshold &&
          Math.abs(t.lon - targetLon) < threshold
        );
      }

      // Auto-seleccionar la ruta encontrada
      if (matchedTrail && !selectedTrail) {
        handleTrailSelect(matchedTrail);
      }
    }
  }, [trails, searchParams, selectedTrail]);  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserGroups();
    }
  }, [isAuthenticated, user]);

  // Limpiar el mapa cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          console.log('🧹 Limpiando mapa...');
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          leafletLoadedRef.current = false;
        } catch (error) {
          console.warn('⚠️ Error limpiando mapa:', error);
        }
      }
    };
  }, []);
  // Manejar selección de ruta
  const handleTrailSelect = async (trail) => {
    try {
      console.log('🔄 Seleccionando ruta:', trail.nombre);
      setSelectedTrail(trail);

      const weather = await fetchWeather(trail.lat, trail.lon);
      setWeatherData(weather);

      const hourly = await fetchHourlyWeather(trail.lat, trail.lon);
      setHourlyWeather(hourly);

      // Validación robusta del mapa antes de intentar cambiar la vista
      if (mapInstanceRef.current && 
          typeof mapInstanceRef.current.setView === 'function' && 
          mapInstanceRef.current._container && 
          mapInstanceRef.current._loaded) {
        try {
          mapInstanceRef.current.setView([trail.lat, trail.lon], 12);
          console.log('✅ Vista del mapa actualizada');
        } catch (mapError) {
          console.warn('⚠️ Error actualizando vista del mapa:', mapError);
        }
      } else {
        console.warn('⚠️ Mapa no está completamente inicializado');
      }
    } catch (error) {
      console.error('❌ Error en handleTrailSelect:', error);
    }
  };

  // Manejar consulta de clima por hora
  const handleWeatherCheck = () => {
    const { date, time } = selectedDateTime;
    if (!date || !time) {
      alert("Selecciona fecha y hora");
      return;
    }

    if (!hourlyWeather) {
      alert("No hay datos de clima disponibles");
      return;
    }

    const datetimeSel = new Date(`${date}T${time}:00`);
    let closestIndex = 0;
    let minDiff = Infinity;

    hourlyWeather.time.forEach((t, i) => {
      const diff = Math.abs(new Date(t) - datetimeSel);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    const weatherInfo = interpretWeatherCode(hourlyWeather.weathercode[closestIndex]);
    const temp = hourlyWeather.temperature_2m[closestIndex];

    setSelectedHourlyWeather({
      text: `${weatherInfo.text}, Temp: ${temp}°C`,
      icon: weatherInfo.icon
    });
  };

  //  Manejar agendamiento de cita ACTUALIZADO
  const handleScheduleAppointment = async () => {
    if (!isAuthenticated) {
      alert(" Primero debes iniciar sesión antes de agendar una cita.");
      loginWithRedirect();
      return;
    }

    const { date, time } = selectedDateTime;
    if (!date || !time || !selectedHourlyWeather) {
      alert("Selecciona fecha, hora y consulta el clima antes de agendar.");
      return;
    }

    if (!selectedTrail) {
      alert("No hay ninguna ruta seleccionada.");
      return;
    }

    setIsLoading(true);

    try {
      const appointmentData = {
        ruta: selectedTrail.id,
        fecha_visita: `${date}T${time}:00`,
        clima: selectedHourlyWeather.text,
        recomendaciones: selectedTrail.recomendaciones,
        compania: null
      };

      console.log(' Datos de la cita:', appointmentData);     const result = await enviarCitaAlBackend(appointmentData);

     setLastAppointmentId(result.id);

      // Mensaje personalizado según modalidad
      const mensaje = goingSolo 
        ? "✅ Cita agendada correctamente - Modo individual!" 
        : `✅ Cita agendada correctamente - Con grupo "${selectedGroup?.nombre}"!`;
      
      alert(mensaje);// Resetear formulario
      setSelectedDateTime({ date: '', time: '' });
      setSelectedHourlyWeather(null);
      setSelectedGroup(null);
      setSelectedGroupMembers([]);
      setShowGroupSelector(false);

       // Mostrar modal para horario de retorno
    setTimeout(() => {
      setShowReturnTimeModal(true);
    }, 1000);

    } catch (err) {
      console.error(' Error al agendar cita:', err);
      alert(` Error al agendar cita: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el éxito del horario de retorno
const handleReturnTimeSuccess = (result) => {
  console.log('Horario de retorno guardado:', result);
};

  return (
    <div>
      {/* Header reducido */}
      <div className='py-2 px-4' style={{ marginBottom: '1.5rem' }}>
        <h1 className='text-start my-2' style={{
          fontFamily: 'Kalam, cursive',
          color: '#388e3c',
          fontWeight: '700',
          fontSize: '2rem',
          marginBottom: '0.25rem'
        }}>
          Mapa de Rutas
        </h1>
        <p className='text-start' style={{
          color: '#1b1b1b',
          fontWeight: '500',
          marginBottom: '0.5rem',
          fontSize: '0.95rem'
        }}>
          {loadingTrails ? 'Cargando rutas...' : `Selecciona una de las ${trails.length} rutas disponibles`}
        </p>
        <hr style={{
          borderColor: '#c2a200',
          opacity: 0.5,
          margin: '0.5rem 0'
        }} />
      </div>

      <Container fluid>
        <Row>
          <Col className="p-0">
            <div className="container-mapa">
              <div
                ref={mapRef}
                id="map"
                style={{
                  height: 'calc(100vh - 150px)',
                  width: '70%',
                  zIndex: 1,
                  borderRadius: '12px',
                  margin: '4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              />

              <div
                id="detalleRuta"
                className="panel-ruta"
                style={{
                  width: '30%',
                  background: 'rgb(255, 251, 243)',
                  borderLeft: '1px solid #e0e0e0',
                  boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.03)',
                  padding: '16px',
                  overflowY: 'auto',
                  height: 'calc(100vh - 150px)',
                  borderRadius: '0 12px 12px 0',
                  margin: '4px 4px 4px 0'
                }}
              >
                {loadingTrails ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 16px',
                    color: '#1b1b1b'
                  }}>
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p style={{
                      marginTop: '12px',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      Cargando rutas disponibles...
                    </p>
                  </div>
                ) : selectedTrail ? (
                  <>
                    <h2 style={{
                      fontFamily: 'Kalam, cursive',
                      color: '#388e3c',
                      marginBottom: '12px',
                      fontWeight: '700',
                      fontSize: '1.5rem'
                    }}>
                      {selectedTrail.nombre}
                    </h2>

                    {selectedTrail.fotos.map((foto, index) => (
                      <img
                        key={index}
                        src={foto}
                        alt={selectedTrail.nombre}
                        style={{
                          width: '100%',
                          borderRadius: '8px',
                          margin: '8px 0',
                          border: '1px solid #e0e0e0'
                        }}
                      />
                    ))}

                    <div className="contenido">
                      <div className="info" style={{ marginBottom: '12px' }}>
                        <p style={{
                          color: '#1b1b1b',
                          lineHeight: '1.5',
                          fontWeight: '500',
                          marginBottom: '8px',
                          fontSize: '0.9rem'
                        }}>
                          <b style={{ color: '#2e7d32', fontWeight: '600' }}>Descripción:</b> {selectedTrail.descripcion}
                        </p>
                        <p style={{
                          color: '#1b1b1b',
                          lineHeight: '1.5',
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <b style={{ color: '#2e7d32', fontWeight: '600' }}>Nivel de experiencia:</b> {selectedTrail.nivel_experiencia}
                        </p>
                        <p style={{
                          color: '#1b1b1b',
                          lineHeight: '1.5',
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}>
                          <b style={{ color: '#2e7d32', fontWeight: '600' }}>Recomendaciones:</b> {selectedTrail.recomendaciones}
                        </p>
                      </div>

                      {weatherData && (
                        <div className="clima-box" style={{
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #dee2e6',
                          marginBottom: '12px'
                        }}>
                          <img
                            className="clima-icon"
                            src={weatherData.descripcion.icon}
                            alt="icono"
                            style={{
                              width: '40px',
                              height: '40px',
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                            }}
                          />
                          <div style={{ marginLeft: '10px' }}>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#1b1b1b',
                              fontWeight: '500',
                              fontSize: '0.85rem'
                            }}>
                              <b style={{ color: '#2e7d32', fontWeight: '600' }}>Clima:</b> {weatherData.descripcion.text}
                            </p>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#1b1b1b',
                              fontWeight: '500',
                              fontSize: '0.85rem'
                            }}>
                              <b style={{ color: '#2e7d32', fontWeight: '600' }}>Temperatura:</b> {weatherData.temperatura}°C
                            </p>
                            <p style={{
                              margin: '0',
                              color: '#1b1b1b',
                              fontWeight: '500',
                              fontSize: '0.85rem'
                            }}>
                              <b style={{ color: '#2e7d32', fontWeight: '600' }}>Viento:</b> {weatherData.viento} km/h
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sección del formulario */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
                      borderRadius: '10px',
                      padding: '14px',
                      border: '1px solid #e0e0e0',
                      marginTop: '16px'
                    }}>
                      <p style={{
                        color: '#1b1b1b',
                        fontWeight: '600',
                        marginBottom: '12px',
                        fontSize: '1rem'
                      }}>
                        Consultar clima por fecha/hora:
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <input
                          type="date"
                          id="fechaClima"
                          value={selectedDateTime.date}
                          onChange={(e) => setSelectedDateTime(prev => ({
                            ...prev,
                            date: e.target.value
                          }))}
                          style={{
                            width: '48%',
                            padding: '8px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            backgroundColor: 'white',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            fontWeight: '500'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                        <input
                          type="time"
                          id="horaClima"
                          value={selectedDateTime.time}
                          onChange={(e) => setSelectedDateTime(prev => ({
                            ...prev,
                            time: e.target.value
                          }))}
                          style={{
                            width: '48%',
                            padding: '8px',
                            border: '2px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            backgroundColor: 'white',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            fontWeight: '500'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#2e7d32'}
                          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                      </div>

                      <button
                        id="verClimaHora"
                        onClick={handleWeatherCheck}
                        style={{
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          width: '100%',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(46, 125, 50, 0.3)',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1b5e20'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2e7d32'}
                      >
                        Ver clima
                      </button>

                      {selectedHourlyWeather && (
                        <div id="climaSeleccionado" style={{
                          marginTop: '12px',
                          animation: 'fadeIn 0.5s ease-in'
                        }}>
                          <div className="clima-box" style={{
                            background: 'linear-gradient(135deg, #e8f5e8 0%, #d0e8d0 100%)',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '2px solid #2e7d32',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <img
                              className="clima-icon"
                              src={selectedHourlyWeather.icon}
                              alt="icono"
                              style={{
                                width: '35px',
                                height: '35px',
                                marginRight: '10px'
                              }}
                            />
                            <p style={{
                              margin: '0',
                              color: '#1b1b1b',
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}>
                              <b>{selectedHourlyWeather.text}</b>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ✅ NUEVA SECCIÓN: Selección de amigos (todos los usuarios) */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
                      borderRadius: '10px',
                      padding: '14px',
                      border: '1px solid #e0e0e0',
                      marginTop: '16px'
                    }}>                      {/* Sistema simplificado: Solo vs Con grupo */}
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{
                          color: '#1b1b1b',
                          fontWeight: '600',
                          margin: '0 0 12px 0',
                          fontSize: '1rem'
                        }}>
                          Modalidad del sendero:
                        </p>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
                            <input
                              type="radio"
                              name="modalidad"
                              checked={goingSolo}
                              onChange={() => setGoingSolo(true)}
                              style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: '500' }}>Ir solo 🚶‍♂️</span>
                          </label>
                          
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="modalidad"
                              checked={!goingSolo}
                              onChange={() => setGoingSolo(false)}
                              style={{ marginRight: '8px' }}
                            />
                            <span style={{ fontWeight: '500' }}>Con mi grupo 👥</span>
                          </label>
                        </div>

                        {/* Selector de grupo cuando no va solo */}
                        {!goingSolo && (
                          <div style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: '#f8f9fa'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                Seleccionar grupo:
                              </span>
                              <div>
                                <button
                                  onClick={() => setShowGroupSelector(!showGroupSelector)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    color: '#2e7d32',
                                    border: '1px solid #2e7d32',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    marginRight: '6px'
                                  }}
                                >
                                  {showGroupSelector ? 'Ocultar' : 'Ver grupos'}
                                </button>
                                <button
                                  onClick={() => setShowCreateGroupModal(true)}
                                  style={{
                                    backgroundColor: '#2e7d32',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Crear grupo
                                </button>
                              </div>
                            </div>

                            {selectedGroup && (
                              <div style={{
                                backgroundColor: '#e8f5e8',
                                padding: '8px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                              }}>
                                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                  ✅ {selectedGroup.nombre}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                  {selectedGroup.descripcion || 'Sin descripción'}
                                </div>
                                {selectedGroupMembers.length > 0 && (
                                  <div style={{ fontSize: '0.75rem', color: '#2e7d32', marginTop: '4px' }}>
                                    👥 {selectedGroupMembers.length} miembro(s)
                                  </div>
                                )}
                              </div>
                            )}

                            {showGroupSelector && (
                              <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                              }}>
                                {loadingGroups ? (
                                  <div style={{ textAlign: 'center', padding: '12px' }}>
                                    <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                                    <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Cargando grupos...</span>
                                  </div>
                                ) : groups.length > 0 ? (
                                  groups.map(group => (
                                    <div
                                      key={group.id}
                                      onClick={() => selectGroup(group)}
                                      style={{
                                        padding: '8px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        backgroundColor: selectedGroup?.id === group.id ? '#e8f5e8' : 'transparent'
                                      }}
                                    >
                                      <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                                        {group.nombre}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                        {group.descripcion || 'Sin descripción'}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: '#666' }}>
                                    No tienes grupos. ¡Crea tu primer grupo!
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      id="agendarCita"
                      onClick={handleScheduleAppointment}
                      disabled={isLoading || !drfToken}
                      style={{
                        backgroundColor: isLoading ? '#6c757d' : (drfToken ? '#2e7d32' : '#adb5bd'),
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginTop: '16px',
                        cursor: (isLoading || !drfToken) ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        width: '100%',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(46, 125, 50, 0.3)',
                        fontSize: '1rem',
                        opacity: isLoading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && drfToken) {
                          e.target.style.backgroundColor = '#1b5e20';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading && drfToken) {
                          e.target.style.backgroundColor = '#2e7d32';
                        }
                      }}
                    >
                      {!drfToken ? 'Configurando...' : (isLoading ? 'Agendando...' : 'Agendar cita')}
                    </button>

                    {!drfToken && isAuthenticated && (
                      <p style={{
                        color: '#dc3545',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        marginTop: '8px'
                      }}>
                        Problema de autenticación. Recarga la página.
                      </p>
                    )}
                    <ReviewsSection
                      trailId={selectedTrail.id}
                      trailName={selectedTrail.nombre}
                    />
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 16px',
                    color: '#1b1b1b'
                  }}>
                    <h2 style={{
                      fontFamily: 'Kalam, cursive',
                      color: '#388e3c',
                      marginBottom: '12px',
                      fontWeight: '700',
                      fontSize: '1.5rem'
                    }}>
                      {trails.length > 0 ? 'Selecciona una ruta' : 'No hay rutas disponibles'}
                    </h2>
                    <p style={{
                      color: '#666',
                      fontStyle: 'italic',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}>
                      {trails.length > 0
                        ? 'Haz clic en cualquier marcador del mapa para ver los detalles de la ruta'
                        : 'No se pudieron cargar las rutas. Intenta recargar la página.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
<ReturnTimeModal
  isOpen={showReturnTimeModal}
  toggle={() => setShowReturnTimeModal(false)}
  citaId={lastAppointmentId}
  userEmail={user?.email}
  onSuccess={handleReturnTimeSuccess}
  appointmentDateTime={selectedDateTime.date && selectedDateTime.time ? 
    `${selectedDateTime.date}T${selectedDateTime.time}:00` : null}
/>

      <style jsx>{`
        .container-mapa {
          display: flex;
          height: calc(100vh - 150px);
          overflow: hidden;
          border-radius: 12px;
          boxShadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background: rgb(255, 251, 243);
          padding: 2px;
        }
        
        .clima-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f0f2f5;
          padding: 8px;
          border-radius: 6px;
          margin: 8px 0;
        }
        
        .contenido {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
        }
        
        #verClimaHora:hover {
          background-color: #1b5e20 !important;
        }
        
        #agendarCita:hover:not(:disabled) {
          background-color: #1b5e20 !important;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        :global(.leaflet-container) {
          border-radius: 10px;
          font-family: 'Roboto', sans-serif;
        }
        
        :global(.leaflet-popup-content-wrapper) {
          border-radius: 6px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.1);
        }
        
        :global(.leaflet-popup-content) {
          font-weight: 500;
          color: #1b1b1b;
          font-size: 0.85rem;        }
      `}</style>

      {/* Modal para crear grupo */}      {showCreateGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#2e7d32' }}>Crear Nuevo Grupo</h3>
            <CreateGroupForm
              onSubmit={createNewGroup}
              onCancel={() => setShowCreateGroupModal(false)}
              userEmail={user?.email}
            />
          </div>
        </div>
      )}

      {/* Modal para agregar miembros al grupo */}
      {showMembersModal && selectedGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#2e7d32', margin: 0 }}>
                Miembros del grupo "{selectedGroup.nombre}"
              </h3>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedGroup(null);
                  setSelectedGroupMembers([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>

            {/* Sección para mostrar miembros actuales */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#333', marginBottom: '12px' }}>
                Miembros seleccionados ({selectedGroupMembers.length})
              </h4>
              {selectedGroupMembers.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No hay miembros seleccionados aún
                </p>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  marginBottom: '16px'
                }}>                  {selectedGroupMembers.map((member, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#e8f5e8',
                        color: '#2e7d32',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {member.nombre || member.username || (member.correo || member.email)}
                      <button
                        onClick={() => removeMemberFromGroup(member.correo || member.email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2e7d32',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0',
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección para agregar nuevos miembros */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '12px' }}>
                Agregar miembros
              </h4>
              
              {/* SECCIÓN COMENTADA PARA FUTURA FUNCIONALIDAD DE AMIGOS */}
              {/* 
              TODO: Cuando la funcionalidad de amigos esté implementada, 
              reemplazar la lista de todos los usuarios por una lista de amigos del usuario actual.
              
              Funcionalidades pendientes:
              - Sistema de amistad (enviar/aceptar solicitudes)
              - Lista de amigos del usuario
              - Búsqueda de amigos por nombre/email
              - Estado de amistad (pendiente, aceptado, bloqueado)
              
              const fetchUserFriends = async () => {
                const response = await fetch(`${API_BASE_URL}/users/${user.id}/friends/`);
                const friends = await response.json();
                setAvailableUsers(friends);
              };
              */}

              {loadingUsers ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#666',
                  padding: '20px'
                }}>
                  Cargando usuarios...
                </div>
              ) : availableUsers.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No hay usuarios disponibles
                </p>
              ) : (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px'
                }}>                  {availableUsers.map((user_item, index) => {
                    // Usar correo como campo principal de email, con fallback a email
                    const userEmail = user_item.correo || user_item.email;
                    const isAlreadyMember = selectedGroupMembers.some(
                      member => (member.correo || member.email) === userEmail
                    );
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: index < availableUsers.length - 1 ? '1px solid #f0f0f0' : 'none',
                          backgroundColor: isAlreadyMember ? '#f5f5f5' : 'white'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', color: '#333' }}>
                            {user_item.nombre || user_item.username || user_item.first_name || 'Usuario'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            {userEmail}
                          </div>
                        </div>
                        <button
                          onClick={() => addMemberToGroup(user_item)}
                          disabled={isAlreadyMember}
                          style={{
                            backgroundColor: isAlreadyMember ? '#ccc' : '#2e7d32',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: isAlreadyMember ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          {isAlreadyMember ? 'Agregado' : 'Agregar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedGroup(null);
                  setSelectedGroupMembers([]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ccc',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  // El grupo ya está seleccionado y los miembros están en selectedGroupMembers
                }}
                style={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Confirmar ({selectedGroupMembers.length} miembros)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailDirectory;