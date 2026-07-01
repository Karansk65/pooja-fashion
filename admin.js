const adminOrders = document.getElementById("adminOrders");
const adminStatus = document.getElementById("adminStatus");
const adminSearch = document.getElementById("adminSearch");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const adminTotalOrders = document.getElementById("adminTotalOrders");
const adminPaidOrders = document.getElementById("adminPaidOrders");
const adminCodOrders = document.getElementById("adminCodOrders");
const adminUpdatedAt = document.getElementById("adminUpdatedAt");
const adminRevenue = document.getElementById("adminRevenue");
const adminPendingOrders = document.getElementById("adminPendingOrders");
const adminCancelledOrders = document.getElementById("adminCancelledOrders");
const adminFilterAll = document.getElementById("adminFilterAll");
const adminFilterPaid = document.getElementById("adminFilterPaid");
const adminFilterCod = document.getElementById("adminFilterCod");
const adminFilterPending = document.getElementById("adminFilterPending");
const adminFilterCancelled = document.getElementById("adminFilterCancelled");
const adminFilterTabs = document.querySelectorAll("[data-admin-filter]");
const adminPinPanel = document.getElementById("adminPinPanel");
const adminPinForm = document.getElementById("adminPinForm");
const adminPinInput = document.getElementById("adminPinInput");
const clearAdminPinBtn = document.getElementById("clearAdminPinBtn");

let allOrders = [];
let adminPin = localStorage.getItem("poojaAdminPin") || "";
let activeFilter = "all";

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

function parseAdminAmount(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0") || 0;
}

function formatMoney(value){
  const amount = parseAdminAmount(value);
  return "Rs. " + amount.toLocaleString("en-IN");
}

function moneyNumber(value){
  return parseAdminAmount(value);
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

function orderStatus(order){
  return order.status || order.order_status || order.orderStatus || "Placed";
}

function isCancelled(order){
  return /cancel/i.test(orderStatus(order) + " " + paymentStatus(order));
}

function isPaid(order){
  return /paid|confirmed|success|captured/i.test(paymentStatus(order)) && !isCancelled(order);
}

function isCod(order){
  return /cash|cod|delivery/i.test(paymentMethod(order) + " " + paymentStatus(order)) && !isCancelled(order);
}

function isPending(order){
  return !isPaid(order) && !isCod(order) && !isCancelled(order);
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
  const paidCount = orders.filter(isPaid).length;
  const codCount = orders.filter(isCod).length;
  const pendingCount = orders.filter(isPending).length;
  const cancelledCount = orders.filter(isCancelled).length;
  const revenue = orders
    .filter(order => !isCancelled(order))
    .reduce((sum, order) => sum + moneyNumber(orderTotal(order)), 0);

  adminTotalOrders.innerText = orders.length;
  adminPaidOrders.innerText = paidCount;
  adminCodOrders.innerText = codCount;
  if(adminRevenue) adminRevenue.innerText = formatMoney(revenue);
  if(adminPendingOrders) adminPendingOrders.innerText = pendingCount;
  if(adminCancelledOrders) adminCancelledOrders.innerText = cancelledCount;
  if(adminFilterAll) adminFilterAll.innerText = orders.length;
  if(adminFilterPaid) adminFilterPaid.innerText = paidCount;
  if(adminFilterCod) adminFilterCod.innerText = codCount;
  if(adminFilterPending) adminFilterPending.innerText = pendingCount;
  if(adminFilterCancelled) adminFilterCancelled.innerText = cancelledCount;
  if(adminUpdatedAt) adminUpdatedAt.innerText = new Date().toLocaleTimeString("en-IN", {
    hour:"2-digit",
    minute:"2-digit"
  });
}

function setFilterBadgeCounts(orders){
  if(adminFilterAll) adminFilterAll.innerText = orders.length;
  if(adminFilterPaid) adminFilterPaid.innerText = orders.filter(isPaid).length;
  if(adminFilterCod) adminFilterCod.innerText = orders.filter(isCod).length;
  if(adminFilterPending) adminFilterPending.innerText = orders.filter(isPending).length;
  if(adminFilterCancelled) adminFilterCancelled.innerText = orders.filter(isCancelled).length;
}

function currentFilteredOrders(){
  const query = (adminSearch?.value || "").trim().toLowerCase();

  return allOrders.filter(order => {
    const filterMatch =
      activeFilter === "all" ||
      (activeFilter === "paid" && isPaid(order)) ||
      (activeFilter === "cod" && isCod(order)) ||
      (activeFilter === "pending" && isPending(order)) ||
      (activeFilter === "cancelled" && isCancelled(order));

    if(!filterMatch) return false;
    if(!query) return true;

    return [
      orderId(order),
      customerName(order),
      customerPhone(order),
      customerAddress(order),
      paymentMethod(order),
      paymentStatus(order),
      orderStatus(order)
    ].join(" ").toLowerCase().includes(query);
  });
}

function renderOrders(orders){
  renderSummary(allOrders.length ? allOrders : orders);
  setFilterBadgeCounts(allOrders.length ? allOrders : orders);

  if(!orders.length){
    adminOrders.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No matching orders</h3>
        <p>Customer checkout ke baad orders yahan appear honge. Search/filter clear karke dobara dekho.</p>
      </div>
    `;
    return;
  }

  adminOrders.innerHTML = orders.map(order => {
    const products = orderProducts(order);
    const address = customerAddress(order);
    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
    const phone = customerPhone(order);
    const cleanPhone = String(phone || "").replace(/[^\d]/g, "");
    const whatsappText = encodeURIComponent(`Hello ${customerName(order) || "Customer"}, your Pooja Fashion order ${orderId(order)} is received. We will contact you shortly.`);
    const whatsappUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${whatsappText}` : "";
    const status = paymentStatus(order);
    const lifecycle = orderStatus(order);

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
            <span class="admin-status-pill ${statusClass(status)}">${escapeHtml(status)}</span>
          </div>
        </div>

        <div class="admin-order-info-grid">
          <div>
            <small><i class="fas fa-phone"></i> Mobile</small>
            <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone || "-")}</a>
          </div>
          <div>
            <small><i class="fas fa-wallet"></i> Payment</small>
            <strong>${escapeHtml(paymentMethod(order) || "-")}</strong>
          </div>
          <div>
            <small><i class="fas fa-clipboard-check"></i> Order Status</small>
            <strong>${escapeHtml(lifecycle)}</strong>
          </div>
        </div>

        <div class="admin-address-box">
          <small><i class="fas fa-location-dot"></i> Customer Location / Address</small>
          <p>${escapeHtml(address || "Address not added")}</p>
          <div class="admin-action-row">
            ${phone ? `<a href="tel:${escapeHtml(phone)}"><i class="fas fa-phone"></i> Call</a>` : ""}
            ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : ""}
            ${address ? `<a href="${mapsUrl}" target="_blank" rel="noopener"><i class="fas fa-map-location-dot"></i> Maps</a>` : ""}
          </div>
        </div>

        <div class="admin-products-list">
          <h4>Items in this order</h4>
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
  renderOrders(currentFilteredOrders());
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
      filterOrders();
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
  filterOrders();
}

refreshOrdersBtn?.addEventListener("click", loadAdminOrders);
adminSearch?.addEventListener("input", filterOrders);
adminFilterTabs.forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.adminFilter || "all";
    adminFilterTabs.forEach(item => item.classList.toggle("active", item === button));
    filterOrders();
  });
});
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
