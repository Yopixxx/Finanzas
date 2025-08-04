const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT59-2QUk2P48yEbSPQt8_2FQSMGDBABpr7d2G2-PbPs0LVuebZz73Z0Qy5E532VLpFcZRD7wr0TYbp/pub?gid=0&single=true&output=csv";

let allData = [];
let chartInstance;

function parseCSV(text) {
  const rows = text.trim().split('\n').map(r => r.split(','));
  const headers = rows[0];
  const data = rows.slice(1).map(row =>
    Object.fromEntries(row.map((val, i) => [headers[i].trim(), val.trim()]))
  );
  return data.map(entry => {
    const parts = entry['Fecha'].split('/');
    const fecha = new Date(+parts[2], parts[1] - 1, +parts[0]);
    return { ...entry, Fecha: fecha };
  });
}

function getMesString(fecha) {
  return fecha.toLocaleString('es-PE', { month: 'long', year: 'numeric' });
}

function initMesSelector(data) {
  const mesesUnicos = [...new Set(data.map(d => getMesString(d.Fecha)))];
  const selector = document.getElementById('mes-selector');
  selector.innerHTML = '';

  mesesUnicos.forEach(mes => {
    const option = document.createElement('option');
    option.value = mes;
    option.textContent = mes.charAt(0).toUpperCase() + mes.slice(1);
    selector.appendChild(option);
  });

  selector.addEventListener('change', () => {
    const mesSeleccionado = selector.value;
    const filtrado = allData.filter(d => getMesString(d.Fecha) === mesSeleccionado);
    renderData(filtrado, mesSeleccionado);
  });

  selector.value = mesesUnicos[0];
  const inicial = allData.filter(d => getMesString(d.Fecha) === mesesUnicos[0]);
  renderData(inicial, mesesUnicos[0]);
}

function renderData(dataMes, mesSeleccionado) {
  let totalIngresos = 0;
  let totalEgresos = 0;
  let ahorroAcumulado = 0;
  let fondoEmergenciaMes = 0;

  const listaIngresos = document.getElementById('lista-ingresos');
  const listaFijos = document.getElementById('lista-fijos');
  const listaVariables = document.getElementById('lista-variables');

  listaIngresos.innerHTML = '';
  listaFijos.innerHTML = '';
  listaVariables.innerHTML = '';

  ahorroAcumulado = allData
    .filter(item =>
      item['Tipo'].toLowerCase() === 'egreso fijo' &&
      item['Descripción'].toLowerCase().includes('ahorro')
    )
    .reduce((acc, item) => acc + parseFloat(item['Monto']), 0);

  const categorias = {};

  dataMes.forEach(item => {
    const tipo = item['Tipo'].toLowerCase();
    const monto = parseFloat(item['Monto']);
    const descripcion = item['Descripción'] || 'Sin descripción';
    const categoria = item['Categoría'] || 'Sin categoría';

    // if (!categorias[categoria]) categorias[categoria] = 0;
    // categorias[categoria] += monto;

    const li = document.createElement('li');
    li.textContent = `${descripcion}: S/ ${monto.toFixed(2)}`;

    if (tipo === 'ingreso') {
      const li = document.createElement('li');

      // 🔒 Si la categoría contiene "sueldo", ocultar el monto
      const montoOculto = /sueldo/i.test(categoria) ? '****' : `S/ ${monto.toFixed(2)}`;

      li.textContent = `${descripcion}: ${montoOculto}`;
      listaIngresos.appendChild(li);
      
      totalIngresos += monto;
    } else if (tipo === 'egreso fijo') {
      listaFijos.appendChild(li);
      totalEgresos += monto;
      if (descripcion.toLowerCase().includes('fondo')) {
        fondoEmergenciaMes += monto;
      }
    } else if (tipo === 'egreso variable') {
      listaVariables.appendChild(li);
      totalEgresos += monto;

      if (!categorias[categoria]) categorias[categoria] = 0;
      categorias[categoria] += monto;
    }
  });

  document.getElementById('ingresos').textContent = `Saldo disponible: S/ ${(totalIngresos - totalEgresos).toFixed(2)}`;
  document.getElementById('egresos').textContent = `Ahorro acumulado: S/ ${ahorroAcumulado.toFixed(2)}`;
  document.getElementById('resumen').textContent = `Fondo de emergencias: S/ ${fondoEmergenciaMes.toFixed(2)}`;

  renderChart(totalIngresos, totalEgresos);
  renderCategoriaTable(categorias);
}

function renderChart(ingresos, egresos) {
  const ctx = document.getElementById('graficoCircular').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const total = ingresos + egresos;

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Ingresos', 'Egresos'],
      datasets: [{
        data: [ingresos, egresos],
        backgroundColor: ['#4caf50', '#f44336'],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          formatter: (value, context) => {
            const porcentaje = ((value / total) * 100).toFixed(1);
            return `S/ ${value.toFixed(2)}\n${porcentaje}%`;
          },
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          }
        },
        legend: {
          position: 'bottom'
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function renderCategoriaTable(categorias) {
  const tbody = document.querySelector('#tabla-categorias tbody');
  tbody.innerHTML = '';

  // Aplicar estilo alternado por fila
  let colorIndex = 0;

  for (let categoria in categorias) {
    const fila = document.createElement('tr');
    const tdCat = document.createElement('td');
    const tdMonto = document.createElement('td');

    tdCat.textContent = categoria;
    
    tdMonto.textContent = `S/ ${categorias[categoria].toFixed(2)}`;

    fila.appendChild(tdCat);
    fila.appendChild(tdMonto);
    tbody.appendChild(fila);

    colorIndex++;
  }
}


fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    allData = parseCSV(text);
    initMesSelector(allData);
  })
  .catch(err => console.error("Error al leer el CSV:", err));
