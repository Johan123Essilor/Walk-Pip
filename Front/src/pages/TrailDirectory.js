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
  
  // Estados para gestión de grupos
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [goingSolo, setGoingSolo] = useState(true); // true = solo, false = con grupo
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
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

  // Función para cambiar entre ir solo o con grupo
  const toggleCompanyType = (isSolo) => {
    setGoingSolo(isSolo);
    if (isSolo) {
      // Limpiar selecciones de grupos si va solo
      setSelectedGroup(null);
      setSelectedGroupMembers([]);
      setShowGroupSelector(false);
    }
  };
  // Función para obtener grupos del usuario
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
  };  // Función para seleccionar un grupo y obtener sus miembros
  const selectGroup = async (groupId) => {
    try {
      console.log('🔄 Obteniendo miembros del grupo...');
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/${groupId}/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user?.email
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const membersData = await response.json();
      console.log('✅ Miembros del grupo obtenidos:', membersData);

      setSelectedGroup(groupId);
      // Los miembros vienen en formato UsuarioGrupo, necesitamos extraer los usuarios
      const usuarios = membersData.map(miembro => miembro.usuario || miembro);
      setSelectedGroupMembers(usuarios);

    } catch (error) {
      console.error('❌ Error obteniendo miembros del grupo:', error);
      setSelectedGroupMembers([]);
    }
  };
  // Función para crear un nuevo grupo
  const createNewGroup = async (groupData) => {
    try {
      console.log('🔄 Creando nuevo grupo...');
      
      const response = await fetch(`${API_BASE_URL}/groups/grupos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          nombre: groupData.name,
          descripcion: groupData.description,
          user_email: user?.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error creando grupo');
      }

      const newGroup = await response.json();
      console.log('✅ Grupo creado exitosamente:', newGroup);

      // Actualizar la lista de grupos
      setGroups(prev => [...prev, newGroup]);
      setShowCreateGroupModal(false);
      
      return newGroup;

    } catch (error) {
      console.error('❌ Error creando grupo:', error);
      throw error;
    }
  };
  // FUNCIÓN MEJORADA para inicializar el mapa con mejor manejo de errores
  const initializeMap = async (rutas) => {
    if (typeof window === 'undefined' || !mapRef.current || rutas.length === 0) {
      console.log('🚫 Condiciones no válidas para inicializar mapa');
      return;
    }

    try {
      // Evitar múltiples inicializaciones
      if (leafletLoadedRef.current && mapInstanceRef.current && mapInstanceRef.current._container) {
        console.log('✅ Mapa ya inicializado');
        return;
      }

      console.log('🗺️ Inicializando mapa...');

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
        await new Promise(resolve => setTimeout(resolve, 200));
        leafletLoadedRef.current = true;
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

      // Limpiar mapa existente de forma segura
      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error limpiando mapa anterior:', cleanupError);
        }
        mapInstanceRef.current = null;
      }

      // Limpiar marcadores existentes
      markersRef.current = [];

      // Verificar que el contenedor DOM esté disponible
      if (!mapRef.current || !mapRef.current.offsetParent) {
        console.warn('⚠️ Contenedor DOM no disponible, reintentando...');
        setTimeout(() => initializeMap(rutas), 500);
        return;
      }      // Crear nuevo mapa con timeout para asegurar que el DOM esté listo
      setTimeout(() => {
        try {
          // Verificar nuevamente que el contenedor esté disponible
          if (!mapRef.current) {
            console.error('❌ Contenedor del mapa no disponible al crear instancia');
            return;
          }

          // Crear instancia del mapa con validación
          const mapContainer = mapRef.current;
          mapInstanceRef.current = L.map(mapContainer, {
            center: [32.525045, -117.018443],
            zoom: 10,
            preferCanvas: true,
            renderer: L.canvas()
          });

          // Verificar que la instancia se creó correctamente
          if (!mapInstanceRef.current) {
            console.error('❌ No se pudo crear la instancia del mapa');
            return;
          }

          // Agregar capa de tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18
          }).addTo(mapInstanceRef.current);

          // Limpiar marcadores anteriores de forma segura
          markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current && marker.remove) {
              try {
                marker.remove();
              } catch (removeError) {
                console.warn('⚠️ Error removiendo marcador:', removeError);
              }
            }
          });
          markersRef.current = [];

          // Agregar marcadores para cada ruta
          rutas.forEach(trail => {
            if (trail.lat && trail.lon && mapInstanceRef.current) {
              try {
                const marker = L.marker([trail.lat, trail.lon])
                  .addTo(mapInstanceRef.current)
                  .on('click', async () => {
                    console.log('📍 Marcador clickeado:', trail.nombre);
                    await handleTrailSelect(trail);
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
                console.error('❌ Error creando marcador para:', trail.nombre, markerError);
              }
            }
          });

          console.log('✅ Mapa inicializado correctamente con', rutas.length, 'rutas');

        } catch (mapError) {
          console.error('❌ Error creando el mapa:', mapError);
          // Reintentar después de un tiempo si falló
          setTimeout(() => {
            console.log('🔄 Reintentando inicialización del mapa...');
            initializeMap(rutas);
          }, 2000);
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
  //  FUNCIÓN SIMPLIFICADA para enviar cita solo con grupos
  const enviarCitaAlBackend = async (appointmentData) => {
    try {
      console.log('🚀 Enviando cita al backend...');

      // Preparar datos - solo usar campo 'compania' para grupos
      const dataConUsuario = {
        ...appointmentData,
        user_email: user?.email,
        compania: goingSolo ? null : selectedGroup
      };

      console.log(' Datos completos:', dataConUsuario);

      const response = await fetch(`${API_BASE_URL}/trail/agendar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataConUsuario)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del backend:', errorData);
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const responseData = await response.json();
      console.log(' Cita creada exitosamente:', responseData);
      return responseData;

    } catch (error) {
      console.error(' Error enviando cita:', error);
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
  }, [trails, searchParams, selectedTrail]);

  // Manejar selección de ruta con validación mejorada del mapa
  const handleTrailSelect = async (trail) => {
    setSelectedTrail(trail);

    const weather = await fetchWeather(trail.lat, trail.lon);
    setWeatherData(weather);

    const hourly = await fetchHourlyWeather(trail.lat, trail.lon);
    setHourlyWeather(hourly);

    // Validación más robusta del mapa antes de intentar usar setView
    if (mapInstanceRef.current && 
        mapInstanceRef.current._container && 
        mapInstanceRef.current._loaded &&
        typeof mapInstanceRef.current.setView === 'function') {
      try {
        mapInstanceRef.current.setView([trail.lat, trail.lon], 12);
      } catch (error) {
        console.warn('⚠️ Error al cambiar vista del mapa:', error);
        // Intentar reinicializar el mapa si es necesario
        setTimeout(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.setView) {
            try {
              mapInstanceRef.current.setView([trail.lat, trail.lon], 12);
            } catch (retryError) {
              console.error('❌ Error al reintentar cambio de vista:', retryError);
            }
          }
        }, 100);
      }
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
  //  Manejar agendamiento de cita ACTUALIZADO con validaciones para grupos
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
    }    // Validaciones para grupos
    if (!goingSolo) {
      if (!selectedGroup) {
        alert("Debes seleccionar un grupo antes de agendar.");
        return;
      }
      if (selectedGroupMembers.length === 0) {
        alert("El grupo seleccionado no tiene miembros.");
        return;
      }
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

      console.log(' Datos de la cita:', appointmentData);     const result = await enviarCitaAlBackend(appointmentData);     setLastAppointmentId(result.id);

      // Mensaje personalizado según si va solo o en grupo
      let mensaje = "✅ Cita agendada correctamente!";
      if (!goingSolo && selectedGroup) {
        mensaje = `✅ Cita agendada correctamente para el grupo con ${selectedGroupMembers.length} miembro(s)!`;
      }
      
      alert(mensaje);

      // Resetear formulario
      setSelectedDateTime({ date: '', time: '' });
      setSelectedHourlyWeather(null);
      setSelectedGroup(null);      setSelectedGroupMembers([]);
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
                    </div>                    {/* ✅ SECCIÓN SIMPLIFICADA: Solo vs Grupo */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
                      borderRadius: '10px',
                      padding: '14px',
                      border: '1px solid #e0e0e0',
                      marginTop: '16px'
                    }}>

                      {/* Selector simplificado: Solo vs Grupo */}
                      <div style={{
                        marginBottom: '16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <p style={{
                          color: '#1b1b1b',
                          fontWeight: '600',
                          margin: '0 0 12px 0',
                          fontSize: '1rem'
                        }}>
                          ¿Cómo planeas hacer la caminata?
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button
                            onClick={() => toggleCompanyType(true)}
                            style={{
                              backgroundColor: goingSolo ? '#2e7d32' : 'transparent',
                              color: goingSolo ? 'white' : '#2e7d32',
                              border: '1px solid #2e7d32',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              transition: 'all 0.3s ease',
                              flex: 1
                            }}
                          >
                            🚶‍♂️ Ir solo
                          </button>
                          <button
                            onClick={() => toggleCompanyType(false)}
                            style={{
                              backgroundColor: !goingSolo ? '#2e7d32' : 'transparent',
                              color: !goingSolo ? 'white' : '#2e7d32',
                              border: '1px solid #2e7d32',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              transition: 'all 0.3s ease',
                              flex: 1
                            }}
                          >
                            👥 Con grupo
                          </button>
                        </div>
                      </div>                      {/* Selector de grupos */}
                      {!goingSolo && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <p style={{
                              color: '#1b1b1b',
                              fontWeight: '600',
                              margin: '0',
                              fontSize: '1rem'
                            }}>
                              Seleccionar grupo:
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setShowGroupSelector(!showGroupSelector);
                                  if (!showGroupSelector) {
                                    fetchUserGroups();
                                  }
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#2e7d32',
                                  border: '1px solid #2e7d32',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#2e7d32';
                                  e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#2e7d32';
                                }}
                              >
                                {showGroupSelector ? 'Ocultar' : 'Ver grupos'}
                              </button>
                              <button
                                onClick={() => setShowCreateGroupModal(true)}
                                style={{
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#388e3c';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#4caf50';
                                }}
                              >
                                + Crear grupo
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Modal de selección de grupos */}
                      {showGroupSelector && (
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          padding: '8px',
                          backgroundColor: 'white',
                          marginBottom: '12px'
                        }}>
                          {loadingGroups ? (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <div className="spinner-border spinner-border-sm text-success" role="status">
                                <span className="visually-hidden">Cargando...</span>
                              </div>
                              <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Cargando grupos...</span>
                            </div>
                          ) : groups.length > 0 ? (
                            groups.map(group => (
                              <div
                                key={group.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '8px',
                                  borderBottom: '1px solid #f0f0f0',
                                  cursor: 'pointer',
                                  backgroundColor: selectedGroup === group.id ? '#e8f5e8' : 'transparent',
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => selectGroup(group.id)}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: '#2e7d32',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  marginRight: '10px'
                                }}>
                                  👥
                                </div>                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                    {group.nombre || 'Grupo sin nombre'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    {group.members_count || 0} miembros • Creado: {group.fecha_creacion}
                                  </div>
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                  {selectedGroup === group.id ? '✅' : '⚪'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '0.8rem' }}>
                              No tienes grupos creados. <br />
                              <button
                                onClick={() => setShowCreateGroupModal(true)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#2e7d32',
                                  border: 'none',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  marginTop: '4px'
                                }}
                              >
                                Crear tu primer grupo
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Información del grupo seleccionado */}
                      {selectedGroup && selectedGroupMembers.length > 0 && (
                        <div style={{ 
                          marginTop: '12px',
                          border: '1px solid #e8f5e8',
                          borderRadius: '6px',
                          padding: '12px',
                          backgroundColor: '#f9fff9'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: '600', margin: '0 0 8px 0' }}>
                            ✅ Grupo seleccionado: {selectedGroupMembers.length} miembro(s)
                          </p>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '6px',
                            maxHeight: '80px',
                            overflowY: 'auto'
                          }}>
                            {selectedGroupMembers.map(member => (
                              <div
                                key={member.id}
                                style={{
                                  backgroundColor: '#2e7d32',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                {member.nombre || member.correo || 'Usuario'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Modal de creación de grupos */}
      {showCreateGroupModal && (
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
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90%',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#1b1b1b',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}>
                Crear Nuevo Grupo
              </h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <CreateGroupForm 
              onSubmit={createNewGroup}
              onCancel={() => setShowCreateGroupModal(false)}
              userEmail={user?.email}
            />
          </div>
        </div>
      )}

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
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default TrailDirectory;