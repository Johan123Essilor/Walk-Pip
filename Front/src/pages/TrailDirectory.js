import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'reactstrap';

const TrailDirectory = () => {
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyWeather, setHourlyWeather] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState({
    date: '',
    time: ''
  });
  const [selectedHourlyWeather, setSelectedHourlyWeather] = useState(null);
  const [user] = useState(''); // Aquí puedes conectar con tu sistema de autenticación
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Datos de ejemplo de rutas - puedes reemplazar con tus propios datos
  const trails = [
    {
      id: 1,
      nombre: "Cerro de la Silla",
      lat: 25.6047,
      lon: -100.2511,
      fotos: ["https://upload.wikimedia.org/wikipedia/commons/6/64/Cerro_de_la_Silla.jpg"],
      descripcion: "Un ícono de Monterrey, ruta exigente pero con vistas espectaculares.",
      recomendaciones: "Lleva agua, bloqueador y ropa ligera."
    },
    {
      id: 2,
      nombre: "Nevado de Toluca",
      lat: 19.1080,
      lon: -99.7586,
      fotos: ["https://upload.wikimedia.org/wikipedia/commons/f/fc/Nevado_de_Toluca.jpg"],
      descripcion: "Volcán imponente con lagunas en su cráter.",
      recomendaciones: "Sube temprano y lleva abrigo, hace mucho frío."
    }
  ];

  // Interpretar código del clima
  const interpretWeatherCode = (code) => {
    if (code === 0) return { text: "Despejado", icon: "https://i.ibb.co/7QpKsCX/sun.png" };
    if (code === 1 || code === 2 || code === 3) return { text: "Parcialmente nublado", icon: "https://i.ibb.co/3C0FJ7b/cloud-sun.png" };
    if (code === 45 || code === 48) return { text: "Niebla", icon: "https://i.ibb.co/YkDbV4P/fog.png" };
    if (code >= 51 && code <= 67) return { text: "Lluvia ligera a moderada", icon: "https://i.ibb.co/yY3g2Nf/rain.png" };
    if (code >= 71 && code <= 77) return { text: "Nieve", icon: "https://i.ibb.co/0XvGv3X/snow.png" };
    if (code >= 80 && code <= 86) return { text: "Lluvia con tormenta", icon: "https://i.ibb.co/yY3g2Nf/rain.png" };
    if (code >= 95 && code <= 99) return { text: "Tormenta severa", icon: "https://i.ibb.co/0jLsvvF/storm.png" };
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

  // Inicializar mapa
  useEffect(() => {
    // Cargar Leaflet dinámicamente solo en el cliente
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Cargar CSS de Leaflet
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(leafletCSS);

          // Cargar Leaflet
          const L = await import('https://cdn.skypack.dev/leaflet@1.7.1');
          
          // Fix para iconos de markers
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          // Inicializar mapa
          mapInstanceRef.current = L.map(mapRef.current).setView([23.6345, -102.5528], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapInstanceRef.current);

          // Agregar markers
          trails.forEach(trail => {
            const marker = L.marker([trail.lat, trail.lon])
              .addTo(mapInstanceRef.current)
              .on('click', async () => {
                await handleTrailSelect(trail);
              });
            markersRef.current.push(marker);
          });

          setMapLoaded(true);
        } catch (error) {
          console.error('Error loading Leaflet:', error);
        }
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Manejar selección de ruta
  const handleTrailSelect = async (trail) => {
    setSelectedTrail(trail);
    
    const weather = await fetchWeather(trail.lat, trail.lon);
    setWeatherData(weather);
    
    const hourly = await fetchHourlyWeather(trail.lat, trail.lon);
    setHourlyWeather(hourly);
    
    // Centrar mapa en la ruta seleccionada
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

  // Manejar agendamiento de cita
  const handleScheduleAppointment = async () => {
    if (!user) {
      alert("⚠️ Primero debes iniciar sesión antes de agendar una cita.");
      return;
    }

    const { date, time } = selectedDateTime;
    if (!date || !time || !selectedHourlyWeather) {
      alert("Selecciona fecha, hora y consulta el clima antes de agendar.");
      return;
    }

    const fechaVisitaISO = `${date}T${time}:00`;

    const appointment = {
      usuario: user,
      ruta: selectedTrail.id,
      fecha_visita: fechaVisitaISO,
      hora_retorno: fechaVisitaISO,
      clima: selectedHourlyWeather.text,
      recomendaciones: selectedTrail.recomendaciones,
      compania: "N/A"
    };

    try {
      // Aquí iría tu llamada a la API para agendar
      console.log('Appointment data:', appointment);
      alert("✅ Cita agendada correctamente.");
    } catch (err) {
      console.error(err);
      alert("❌ Error al agendar cita.");
    }
  };

  return (
    <div>
      <div className='mb-5 py-3 px-4'>
        <h1 className='text-start fw-bold my-3'>Mapa de Rutas</h1>
        <p className='text-start lead fst-italic'>Selecciona una ruta en el mapa para ver detalles y clima</p>
        <hr />
      </div>

      <Container fluid>
        <Row>
          <Col className="p-0">
            <div className="container-mapa">
              <div 
                ref={mapRef} 
                id="map" 
                style={{ 
                  height: 'calc(100vh - 200px)', 
                  width: '70%',
                  zIndex: 1,
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!mapLoaded && (
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>Cargando mapa...</p>
                    <p>Si el mapa no carga, ejecuta: npm install leaflet</p>
                  </div>
                )}
              </div>
              
              <div 
                id="detalleRuta" 
                className="panel-ruta"
                style={{
                  width: '30%',
                  background: '#fff',
                  borderLeft: '2px solid #e0e0e0',
                  boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.05)',
                  padding: '20px',
                  overflowY: 'auto',
                  height: 'calc(100vh - 200px)'
                }}
              >
                {selectedTrail ? (
                  <>
                    <h2>{selectedTrail.nombre}</h2>
                    {selectedTrail.fotos.map((foto, index) => (
                      <img 
                        key={index}
                        src={foto} 
                        alt={selectedTrail.nombre}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          margin: '10px 0'
                        }}
                      />
                    ))}
                    
                    <div className="contenido">
                      <div className="info">
                        <p><b>Descripción:</b> {selectedTrail.descripcion}</p>
                        <p><b>Recomendaciones:</b> {selectedTrail.recomendaciones}</p>
                      </div>
                      
                      {weatherData && (
                        <div className="clima-box">
                          <img 
                            className="clima-icon" 
                            src={weatherData.descripcion.icon} 
                            alt="icono"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <div>
                            <p><b>Clima:</b> {weatherData.descripcion.text}</p>
                            <p><b>Temperatura:</b> {weatherData.temperatura}°C</p>
                            <p><b>Viento:</b> {weatherData.viento} km/h</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <hr />
                    <p><b>Consultar clima por fecha/hora:</b></p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
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
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
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
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    
                    <button 
                      id="verClimaHora"
                      onClick={handleWeatherCheck}
                      style={{
                        backgroundColor: '#198754',
                        color: 'white',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginTop: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Ver clima
                    </button>
                    
                    {selectedHourlyWeather && (
                      <div id="climaSeleccionado" style={{ marginTop: '10px' }}>
                        <div className="clima-box">
                          <img 
                            className="clima-icon" 
                            src={selectedHourlyWeather.icon} 
                            alt="icono"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <p><b>{selectedHourlyWeather.text}</b></p>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      id="agendarCita"
                      onClick={handleScheduleAppointment}
                      style={{
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginTop: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      Agendar cita
                    </button>
                  </>
                ) : (
                  <h2>Selecciona una ruta en el mapa</h2>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .container-mapa {
          display: flex;
          height: calc(100vh - 200px);
          overflow: hidden;
        }
        
        .clima-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f2f5;
          padding: 10px;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .contenido {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        #verClimaHora:hover {
          background-color: #157347 !important;
        }
        
        #agendarCita:hover {
          background-color: #0b5ed7 !important;
        }
      `}</style>
    </div>
  );
};

export default TrailDirectory;