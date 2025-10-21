const datos = [];
  const etiquetas = [];
  let ritmoReposo = 75;   // valor actual
  let rangoMin = 70;      // rango inicial mínimo
  let rangoMax = 80;      // rango inicial máximo
  const maxPuntos = 10;
  let startIndex = 0;

  function generarRitmo() {
    if (ritmoReposo < rangoMin) {
      ritmoReposo += 1; // subir poco a poco hasta entrar al rango
    } else if (ritmoReposo > rangoMax) {
      ritmoReposo -= 1; // bajar poco a poco hasta entrar al rango
    } else {
      // Si ya está dentro del rango → fluctuación aleatoria suave
      const cambio = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
      let nuevo = ritmoReposo + cambio;

      // mantener dentro del rango
      if (nuevo < rangoMin) nuevo = rangoMin;
      if (nuevo > rangoMax) nuevo = rangoMax;

      ritmoReposo = nuevo;
    }

    // Mostrar el valor
   // document.getElementById("resultado").innerText = `💓 ${ritmoReposo} lpm`;

    // Guardar datos para la gráfica
    const ahora = new Date();
    etiquetas.push(ahora.toLocaleTimeString());
    datos.push(ritmoReposo);

  // Controlar el número de puntos visibles sin usar shift()
    if (etiquetas.length > maxPuntos * 2) {
      // Cuando tenemos demasiados datos, reiniciamos los arrays
      // pero conservamos los últimos maxPuntos valores
      const nuevosDatos = datos.slice(-maxPuntos);
      const nuevasEtiquetas = etiquetas.slice(-maxPuntos);
      
      datos.length = 0;
      etiquetas.length = 0;
      
      nuevosDatos.forEach(valor => datos.push(valor));
      nuevasEtiquetas.forEach(etiqueta => etiquetas.push(etiqueta));
      
      startIndex = 0;
    } else if (etiquetas.length > maxPuntos) {
      // Ajustamos el índice inicial para mostrar solo los últimos maxPuntos
      startIndex = etiquetas.length - maxPuntos;
    }

    // Actualizar gráfica si existe
    if (window.miGrafica) {
      window.miGrafica.data.labels = etiquetas;
      window.miGrafica.data.datasets[0].data = datos;
      const datosVisibles = datos.slice(startIndex);
      const etiquetasVisibles = etiquetas.slice(startIndex);
      
      window.miGrafica.data.labels = etiquetasVisibles;
      window.miGrafica.data.datasets[0].data = datosVisibles;
      window.miGrafica.update();
    }
  }

  function dormir() {
    console.log("Simulando sueño...");
    rangoMin = 55;
    rangoMax = 65;
  }

  function caminar() {
    console.log("Simulando caminata...");
    rangoMin = 90;
    rangoMax = 110;
  }

  function susto() {
    console.log("Simulando susto...");
    rangoMin = 120;
    rangoMax = 150;
  }

  // Ejecutar cada segundo (puedes cambiar a 500ms para más rápido)
  setInterval(generarRitmo, 1000);

  // Primer valor
  generarRitmo();

  function abrirGrafica() {
    document.getElementById("graficaContainer").style.display = "block";
    if (!window.miGrafica) {
      const ctx = document.getElementById('grafica').getContext('2d');
      window.miGrafica = new Chart(ctx, {
        type: 'line',
        data: {
          labels: etiquetas,
          datasets: [{
            label: 'Ritmo Cardíaco (lpm)',
            data: datos,
            borderColor: 'crimson',
            backgroundColor: 'rgba(220,20,60,0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          animation: { duration: 500 },
          scales: {
             x: {
      ticks: {
        autoSkip: true,  
        maxTicksLimit: 6,
        maxRotation: 0,   
        minRotation: 0
      }
    },
         y: {
      min: 40,
      max: 160
    }
  }
}
      });
    }
  }