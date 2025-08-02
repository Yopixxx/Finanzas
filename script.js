const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT59-2QUk2P48yEbSPQt8_2FQSMGDBABpr7d2G2-PbPs0LVuebZz73Z0Qy5E532VLpFcZRD7wr0TYbp/pub?gid=0&single=true&output=csv";

let allData = [];

function parseCSV(text) {
  const rows = text.trim().split('\n').map(r => r.split(','));
  const headers = rows[0];
  const data = rows.slice(1).map(row =>
    Object.fromEntries(row.map((val, i) => [headers[i].trim(), val.trim()]))
  );
  return data.map(entry => {
    const parts = entry['Fecha'].split('/');
    const fecha = new Date(+parts[2], parts[1] - 1, +parts[0]); // dd/mm/yyyy
    return { ...entry, Fecha: fecha };
  });
}

function getMesString(fecha) {
  return fecha.toLocaleString('es-PE', { month: 'long', year: 'numeric' });
}

function initMesSelector(data) {
  const mesesUnicos = [...new Set(data.map(d => getMesString(d.Fecha)))];
  const selector = document.getElementById('mes-selector');

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

  // Render por defecto al primero
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

  // Acumulado ahorro desde meses anteriores
  ahorroAcumulado = allData
  .filter(item =>
    item['Tipo'].toLowerCase() === 'egreso fijo' &&
    item['Descripción'].toLowerCase().includes('ahorro')
  )
  .reduce((acc, item) => acc + parseFloat(item['Monto']), 0);

  dataMes.forEach(item => {
    const tipo = item['Tipo'].toLowerCase();
    const monto = parseFloat(item['Monto']);
    const descripcion = item['Descripción'] || 'Sin descripción';

    const li = document.createElement('li');
    li.textContent = `${descripcion}: S/ ${monto.toFixed(2)}`;

    if (tipo === 'ingreso') {
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
    }
  });

  document.getElementById('ingresos').textContent = `Saldo disponible: S/ ${(totalIngresos - totalEgresos).toFixed(2)}`;
  document.getElementById('egresos').textContent = `Ahorro acumulado: S/ ${ahorroAcumulado.toFixed(2)}`;
  document.getElementById('resumen').textContent = `Fondo de emergencias: S/ ${fondoEmergenciaMes.toFixed(2)}`;
}

fetch(CSV_URL)
  .then(res => res.text())
  .then(text => {
    allData = parseCSV(text);
    initMesSelector(allData);
  })
  .catch(err => console.error("Error al leer el CSV:", err));
