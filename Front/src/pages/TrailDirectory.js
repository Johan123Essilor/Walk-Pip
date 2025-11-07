import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { useAuth0 } from '@auth0/auth0-react';

const TrailDirectory = () => {
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState({
    date: '',
    time: ''
  });
  const [selectedHourlyWeather, setSelectedHourlyWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drfToken, setDrfToken] = useState(null);
  const [trails, setTrails] = useState([]);
  const [loadingTrails, setLoadingTrails] = useState(true);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  
  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const leafletLoadedRef = useRef(false);

  // ✅ Función mejorada para obtener rutas desde el backend
  const fetchTrailsFromBackend = async () => {
    try {
      console.log('🔄 Obteniendo rutas desde el backend...');
      const response = await fetch('http://localhost:8000/trail/rutas/');
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      
      const rutasData = await response.json();
      console.log('✅ Rutas obtenidas:', rutasData);
      
      // Verificar si hay datos y mapearlos correctamente
      if (rutasData && Array.isArray(rutasData)) {
        const formattedTrails = rutasData.map(ruta => ({
          id: ruta.id,
          nombre: ruta.nombre || 'Ruta sin nombre',
          lat: parseFloat(ruta.lat) || 25.6047,
          lon: parseFloat(ruta.lon) || -100.2511,
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
      console.error('❌ Error obteniendo rutas:', error);
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


  // ✅ Función para obtener TODOS los usuarios registrados (usando el endpoint existente)
  const fetchAllUsers = async () => {
    try {
      setLoadingFriends(true);
      console.log('🔄 Obteniendo todos los usuarios...');
      
      const response = await fetch(`http://localhost:8000/trail/agendar/mis-amigos/?user_email=${user?.email || ''}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      
      const usersData = await response.json();
      console.log('✅ Usuarios obtenidos:', usersData);
      
      setFriends(usersData || []);
      
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };
  // ✅ FUNCIÓN MEJORADA para inicializar el mapa
  const initializeMap = async (rutas) => {
    if (typeof window === 'undefined' || !mapRef.current || rutas.length === 0) {
      return;
    }

    try {
      // Evitar múltiples inicializaciones
      if (leafletLoadedRef.current && mapInstanceRef.current) {
        return;
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
      }

      // Crear nuevo mapa con timeout para asegurar que el DOM esté listo
      setTimeout(() => {
        try {
          mapInstanceRef.current = L.map(mapRef.current).setView([25.6345, -100.5528], 10);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapInstanceRef.current);

          // Limpiar marcadores anteriores
          markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(marker);
            }
          });
          markersRef.current = [];

          // Agregar marcadores para cada ruta
          rutas.forEach(trail => {
            if (trail.lat && trail.lon) {
              const marker = L.marker([trail.lat, trail.lon])
                .addTo(mapInstanceRef.current)
                .on('click', async () => {
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
            }
          });

          leafletLoadedRef.current = true;
          console.log('🗺️ Mapa inicializado con', rutas.length, 'rutas');

        } catch (mapError) {
          console.error('❌ Error creando el mapa:', mapError);
        }
      }, 500);

    } catch (error) {
      console.error('❌ Error loading Leaflet:', error);
    }
  };

  // ✅ FUNCIÓN SIMPLIFICADA - Ya no necesitamos token JWT para citas
  const obtenerTokenJWT = async () => {
    try {
      console.log('🔑 Configurando autenticación...');
      const auth0Token = await getAccessTokenSilently();
      console.log('✅ Token Auth0 obtenido (para futuros usos)');
      
      setDrfToken(auth0Token);
      localStorage.setItem('drf_token', auth0Token);
      
      return auth0Token;
      
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
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

  // ✅ Manejar selección/deselección de amigos
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // ✅ FUNCIÓN ACTUALIZADA para enviar cita con amigos
  const enviarCitaAlBackend = async (appointmentData) => {
    try {
      console.log('📤 Enviando cita al backend...');
      
      // Agregar el email del usuario y los amigos seleccionados
      const dataConUsuario = {
        ...appointmentData,
        user_email: user?.email,
        amigos_ids: selectedFriends
      };

      console.log('📝 Datos completos:', dataConUsuario);

      const response = await fetch('http://localhost:8000/trail/agendar/', {
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
            console.log('✅ Usando token guardado');
          } else {
            await obtenerTokenJWT();
          }
        } catch (error) {
          console.error('❌ Error inicializando autenticación:', error);
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, user]);

  // ✅ Cargar rutas cuando el componente se monte
  useEffect(() => {
    const loadTrails = async () => {
      const rutas = await fetchTrailsFromBackend();
      await initializeMap(rutas);
    };

    loadTrails();
  }, []);

  // ✅ Cargar TODOS los usuarios cuando el usuario se autentique
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllUsers();
    }
  }, [isAuthenticated, user]);

  // Manejar selección de ruta
  const handleTrailSelect = async (trail) => {
    setSelectedTrail(trail);
    
    const weather = await fetchWeather(trail.lat, trail.lon);
    setWeatherData(weather);
    
    const hourly = await fetchHourlyWeather(trail.lat, trail.lon);
    setHourlyWeather(hourly);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([trail.lat, trail.lon], 12);
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

  // ✅ Manejar agendamiento de cita ACTUALIZADO
  const handleScheduleAppointment = async () => {
    if (!isAuthenticated) {
      alert("⚠️ Primero debes iniciar sesión antes de agendar una cita.");
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

      console.log('📝 Datos de la cita:', appointmentData);

      await enviarCitaAlBackend(appointmentData);
      
      // Mensaje personalizado según si hay amigos invitados
      const mensaje = selectedFriends.length > 0 
        ? `✅ Cita agendada correctamente con ${selectedFriends.length} amigo(s)!` 
        : "✅ Cita agendada correctamente!";
      
      alert(mensaje);
      
      // Resetear formulario
      setSelectedDateTime({ date: '', time: '' });
      setSelectedHourlyWeather(null);
      setSelectedFriends([]);
      setShowFriendSelector(false);
      
    } catch (err) {
      console.error('❌ Error al agendar cita:', err);
      alert(`❌ Error al agendar cita: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
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
                    }}>
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
                          Invitar compañeros:
                        </p>
                        <button 
                          onClick={() => setShowFriendSelector(!showFriendSelector)}
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
                          {showFriendSelector ? 'Ocultar' : 'Seleccionar'}
                        </button>
                      </div>

                      {showFriendSelector && (
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          padding: '8px',
                          backgroundColor: 'white'
                        }}>
                          {loadingFriends ? (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <div className="spinner-border spinner-border-sm text-success" role="status">
                                <span className="visually-hidden">Cargando...</span>
                              </div>
                              <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Cargando usuarios...</span>
                            </div>
                          ) : friends.length > 0 ? (
                            friends.map(friend => (
                              <div 
                                key={friend.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '8px',
                                  borderBottom: '1px solid #f0f0f0',
                                  cursor: 'pointer',
                                  backgroundColor: selectedFriends.includes(friend.id) ? '#e8f5e8' : 'transparent',
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => toggleFriendSelection(friend.id)}
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
                                  {friend.nombre ? friend.nombre.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                    {friend.nombre || 'Usuario'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    {friend.correo}
                                  </div>
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                  {selectedFriends.includes(friend.id) ? '✅' : '⚪'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '0.8rem' }}>
                              No hay otros usuarios registrados.
                            </div>
                          )}
                        </div>
                      )}

                      {selectedFriends.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: '600', margin: '0' }}>
                            ✅ {selectedFriends.length} compañero(s) seleccionado(s)
                          </p>
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
                        ⚠️ Problema de autenticación. Recarga la página.
                      </p>
                    )}
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