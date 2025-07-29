let transacciones = [];

function agregarTransaccion() {
  const desc = document.getElementById("desc").value.trim();
  const monto = parseFloat(document.getElementById("amount").value);

  if (!desc || isNaN(monto)) {
    alert("Por favor, completa ambos campos correctamente.");
    return;
  }

  const transaccion = {
    id: Date.now(),
    desc: desc,
    monto: monto
  };

  transacciones.push(transaccion);
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";

  actualizarUI();
}

function actualizarUI() {
  const lista = document.getElementById("lista-transacciones");
  const balance = document.getElementById("balance");

  lista.innerHTML = "";

  let total = 0;

  transacciones.forEach(t => {
    total += t.monto;

    const li = document.createElement("li");
    li.className = t.monto >= 0 ? "ingreso" : "egreso";
    li.innerHTML = `
      ${t.desc}
      <span>S/ ${t.monto.toFixed(2)}</span>
    `;
    lista.appendChild(li);
  });

  balance.textContent = `S/ ${total.toFixed(2)}`;
}
