const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const initialProducts = [
  { id: 1, name: "Camiseta premium", price: 89.9, cost: 39.5, stock: 18 },
  { id: 2, name: "Boné bordado", price: 69.9, cost: 31.0, stock: 9 },
  { id: 3, name: "Moletom básico", price: 159.9, cost: 86.0, stock: 5 },
  { id: 4, name: "Ecobag personalizada", price: 49.9, cost: 18.0, stock: 14 },
];

const productSelect = document.querySelector("#productSelect");
const stockTable = document.querySelector("#stockTable");
const salesHistory = document.querySelector("#salesHistory");
const ranking = document.querySelector("#ranking");
const feedback = document.querySelector("#feedback");

function getProducts() {
  return JSON.parse(localStorage.getItem("products") || JSON.stringify(initialProducts));
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

function getSales() {
  return JSON.parse(localStorage.getItem("sales") || "[]");
}

function saveSales(sales) {
  localStorage.setItem("sales", JSON.stringify(sales));
}

function renderProductOptions(products) {
  productSelect.innerHTML = "";
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} - estoque: ${product.stock}`;
    productSelect.appendChild(option);
  });
}

function renderMetrics(products, sales) {
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const avgTicket = sales.length ? revenue / sales.length : 0;

  document.querySelector("#revenue").textContent = currency.format(revenue);
  document.querySelector("#profit").textContent = currency.format(profit);
  document.querySelector("#avgTicket").textContent = currency.format(avgTicket);
  document.querySelector("#salesCount").textContent = sales.length;

  const lowStock = products.filter((product) => product.stock <= 6).length;
  if (lowStock > 0) {
    feedback.textContent = `${lowStock} produto(s) precisam de atenção no estoque.`;
  }
}

function renderStock(products) {
  stockTable.innerHTML = "";

  products.forEach((product) => {
    const isLow = product.stock <= 6;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>${currency.format(product.price)}</td>
      <td>${currency.format(product.cost)}</td>
      <td>${product.stock}</td>
      <td><span class="badge ${isLow ? "low" : "ok"}">${isLow ? "Repor" : "OK"}</span></td>
    `;
    stockTable.appendChild(tr);
  });
}

function renderRanking(sales) {
  const totals = {};

  sales.forEach((sale) => {
    totals[sale.productName] = (totals[sale.productName] || 0) + sale.quantity;
  });

  const rows = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  ranking.innerHTML = "";

  if (rows.length === 0) {
    ranking.innerHTML = '<p class="feedback">Nenhuma venda registrada ainda.</p>';
    return;
  }

  const max = rows[0][1];
  rows.forEach(([name, qty]) => {
    const row = document.createElement("div");
    row.className = "rank-row";
    row.innerHTML = `
      <div>
        <strong>${name}</strong>
        <div class="bar"><span style="width: ${(qty / max) * 100}%"></span></div>
      </div>
      <strong>${qty}</strong>
    `;
    ranking.appendChild(row);
  });
}

function renderSales(sales) {
  salesHistory.innerHTML = "";

  if (sales.length === 0) {
    salesHistory.innerHTML = '<p class="feedback">Nenhuma venda registrada ainda.</p>';
    return;
  }

  sales.slice(0, 9).forEach((sale) => {
    const card = document.createElement("article");
    card.className = "sale-card";
    card.innerHTML = `
      <strong>${sale.productName}</strong>
      <span>Quantidade: ${sale.quantity}</span>
      <span>Total: ${currency.format(sale.total)}</span>
      <span>${sale.date}</span>
    `;
    salesHistory.appendChild(card);
  });
}

function render() {
  const products = getProducts();
  const sales = getSales();

  renderProductOptions(products);
  renderMetrics(products, sales);
  renderStock(products);
  renderRanking(sales);
  renderSales(sales);
}

document.querySelector("#saleForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const products = getProducts();
  const sales = getSales();
  const productId = Number(productSelect.value);
  const quantity = Number(document.querySelector("#quantity").value || 1);
  const product = products.find((item) => item.id === productId);

  if (!product || quantity <= 0) {
    feedback.textContent = "Informe uma quantidade válida.";
    return;
  }

  if (product.stock < quantity) {
    feedback.textContent = "Estoque insuficiente para esta venda.";
    return;
  }

  product.stock -= quantity;
  sales.unshift({
    productId,
    productName: product.name,
    quantity,
    total: product.price * quantity,
    profit: (product.price - product.cost) * quantity,
    date: new Date().toLocaleString("pt-BR"),
  });

  saveProducts(products);
  saveSales(sales);
  document.querySelector("#quantity").value = "1";
  feedback.textContent = "Venda registrada com sucesso.";
  render();
});

document.querySelector("#resetData").addEventListener("click", () => {
  saveProducts(initialProducts);
  saveSales([]);
  feedback.textContent = "Dados restaurados.";
  render();
});

if (!localStorage.getItem("products")) {
  saveProducts(initialProducts);
}

render();
