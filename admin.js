const adminOrders = document.getElementById("adminOrders");
const adminStatus = document.getElementById("adminStatus");
const adminSearch = document.getElementById("adminSearch");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const adminTotalOrders = document.getElementById("adminTotalOrders");
const adminPaidOrders = document.getElementById("adminPaidOrders");
const adminCodOrders = document.getElementById("adminCodOrders");
const adminUpdatedAt = document.getElementById("adminUpdatedAt");
const adminPinPanel = document.getElementById("adminPinPanel");
const adminPinForm = document.getElementById("adminPinForm");
const adminPinInput = document.getElementById("adminPinInput");
const clearAdminPinBtn = document.getElementById("clearAdminPinBtn");

let allOrders = [];
let adminPin = localStorage.getItem("poojaAdminPin") || "";

if(adminPinInput) adminPinInput.value = adminPin;

function setPinPanelVisible(visible){
  if(adminPinPanel) adminPinPanel.hidden = !visible;
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value){
  if(!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });
}

function formatMoney(value){
  const amount = Number(String(value || "0").replace(/[^\d.]/g, "")) || 0;
  return "Rs. " + amount.toLocaleString("en-IN");
}

function orderId(order){
  return order.order_id || order.orderId || order.id || "Local order";
}

function customerName(order){
  return order.customer_name || order.customerName || order.name || "";
}

function customerPhone(order){
  return order.customer_phone || order.customerPhone || order.phone || "";
}

function customerAddress(order){
  return order.customer_address || order.customerAddress || order.address || "";
}

function orderProducts(order){
  return order.products || order.items || [];
}

function orderTotal(order){
  return order.total || order.amount || 0;
}

function paymentMethod(order){
  return order.payment_method || order.paymentMethod || order.payment || "";
}

function paymentStatus(order){
  return order.payment_status || order.paymentStatus || "Pending";
}

function statusClass(value){
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function readLocalOrders(){
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const lastOrder = JSON.parse(localStorage.getItem("lastOrder") || "null");

  if(lastOrder && !orders.some(order => orderId(order) === orderId(lastOrder))){
    orders.push(lastOrder);
  }

  return orders;
}

function renderSummary(orders){
  const paidCount = orders.filter(order => /paid|confirmed/i.test(paymentStatus(order))).length;
  const codCount = orders.filter(order => /cash|cod/i.test(paymentMethod(order) + " " + paymentStatus(order))).length;

  adminTotalOrders.innerText = orders.length;
  adminPaidOrders.innerText = paidCount;
  adminCodOrders.innerText = codCount;
  adminUpdatedAt.innerText = new Date().toLocaleTimeString("en-IN", {
    hour:"2-digit",
    minute:"2-digit"
  });
}

function renderOrders(orders){
  renderSummary(orders);

  if(!orders.length){
    adminOrders.innerHTML = `
      <div class="admin-empty-state">
        <h3>No orders yet</h3>
        <p>Customer checkout ke baad orders yahan appear honge.</p>
      </div>
    `;
    return;
  }

  adminOrders.innerHTML = orders.map(order => {
    const products = orderProducts(order);
    const address = customerAddress(order);
    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
    const phone = customerPhone(order);

    return `
      <article class="admin-order-card">
        <div class="admin-order-top">
          <div>
            <span class="admin-order-id">${escapeHtml(orderId(order))}</span>
            <h3>${escapeHtml(customerName(order) || "Customer")}</h3>
            <p>${formatDate(order.created_at || order.createdAt || order.date)}</p>
          </div>
          <div class="admin-order-total">
            <strong>${formatMoney(orderTotal(order))}</strong>
            <span class="admin-status-pill ${statusClass(paymentStatus(order))}">${escapeHtml(paymentStatus(order))}</span>
          </div>
        </div>

        <div class="admin-order-info-grid">
          <div>
            <small>Mobile</small>
            <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone || "-")}</a>
          </div>
          <div>
            <small>Payment</small>
            <strong>${escapeHtml(paymentMethod(order) || "-")}</strong>
          </div>
          <div>
            <small>Order Status</small>
            <strong>${escapeHtml(order.status || "Placed")}</strong>
          </div>
        </div>

        <div class="admin-address-box">
          <small>Customer Location / Address</small>
          <p>${escapeHtml(address || "Address not added")}</p>
          ${address ? `<a href="${mapsUrl}" target="_blank" rel="noopener">Open Location in Maps</a>` : ""}
        </div>

        <div class="admin-products-list">
          ${products.map(product => `
            <div class="admin-product-row">
              <img src="${escapeHtml(product.image || "images/banner.png")}" alt="${escapeHtml(product.name || "Product")}">
              <div>
                <strong>${escapeHtml(product.name || "Product")}</strong>
                <span>${product.size ? "Size: " + escapeHtml(product.size) + " | " : ""}Qty: ${escapeHtml(product.quantity || 1)}</span>
              </div>
              <b>${formatMoney(product.price)}</b>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function filterOrders(){
  const query = adminSearch.value.trim().toLowerCase();

  if(!query){
    renderOrders(allOrders);
    return;
  }

  const filtered = allOrders.filter(order => {
    return [
      orderId(order),
      customerName(order),
      customerPhone(order),
      customerAddress(order),
      paymentMethod(order),
      paymentStatus(order)
    ].join(" ").toLowerCase().includes(query);
  });

  renderOrders(filtered);
}

async function loadAdminOrders(){
  adminStatus.innerText = "Loading orders...";

  try{
    if(window.PoojaApi?.isEnabled()){
      if(!adminPin){
        setPinPanelVisible(true);
        adminStatus.innerText = "Enter Admin PIN to view latest backend orders.";
        renderSummary([]);
        adminOrders.innerHTML = `
          <div class="admin-empty-state">
            <h3>Admin PIN required</h3>
            <p>Orders are protected. Enter the PIN above to view customer details.</p>
          </div>
        `;
        return;
      }

      const response = await window.PoojaApi.request("/api/admin/orders", {
        headers:{
          "x-admin-pin": adminPin
        }
      });

      allOrders = response.orders || [];
      setPinPanelVisible(false);
      adminStatus.innerText = "Showing latest backend orders. Auto refresh is on.";
      renderOrders(allOrders);
      return;
    }
  }catch(error){
    if(/pin|401/i.test(error.message)){
      localStorage.removeItem("poojaAdminPin");
      adminPin = "";
      if(adminPinInput) adminPinInput.value = "";
      setPinPanelVisible(true);
      adminStatus.innerText = "Wrong Admin PIN. Enter the correct PIN below.";
      adminOrders.innerHTML = `
        <div class="admin-empty-state">
          <h3>Admin PIN required</h3>
          <p>Customer phone aur address safe rakhne ke liye orders PIN ke bina nahi dikhenge.</p>
        </div>
      `;
      renderSummary([]);
      return;
    }

    adminStatus.innerText = "Backend orders nahi mile. Local orders dikha raha hoon.";
  }

  allOrders = readLocalOrders().sort((a, b) => {
    return new Date(b.created_at || b.createdAt || b.date || 0) -
      new Date(a.created_at || a.createdAt || a.date || 0);
  });
  renderOrders(allOrders);
}

refreshOrdersBtn?.addEventListener("click", loadAdminOrders);
adminSearch?.addEventListener("input", filterOrders);
adminPinForm?.addEventListener("submit", event => {
  event.preventDefault();
  adminPin = adminPinInput.value.trim();
  localStorage.setItem("poojaAdminPin", adminPin);
  loadAdminOrders();
});
clearAdminPinBtn?.addEventListener("click", () => {
  adminPin = "";
  localStorage.removeItem("poojaAdminPin");
  if(adminPinInput) adminPinInput.value = "";
  setPinPanelVisible(true);
  loadAdminOrders();
});

loadAdminOrders();
setInterval(loadAdminOrders, 30000);
