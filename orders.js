let activeOrderFilter = "all";
let allOrders = [];

function readJson(key, fallback){
  try{
    return JSON.parse(localStorage.getItem(key)) || fallback;
  }catch(error){
    return fallback;
  }
}

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0");
}

function formatDate(value){
  if(!value) return "Today";

  return new Date(value).toLocaleDateString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric"
  });
}

function orderTotal(order){
  if(order.total) return Number(order.total);

  return (order.products || []).reduce((sum, product) => {
    return sum + parseMoney(product.price) * Number(product.quantity || 1);
  }, 0);
}

function normalizeOrder(order){
  const products = order.products || order.items || [];

  return {
    orderId: order.orderId || order.order_id || "PF-" + Date.now(),
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    status: order.status || "Placed",
    paymentMethod: order.paymentMethod || order.payment_method || "Not selected",
    paymentStatus: order.paymentStatus || order.payment_status || "Order Placed",
    customerName: order.customerName || order.customer_name || "Customer",
    customerPhone: order.customerPhone || order.customer_phone || "-",
    customerAddress: order.customerAddress || order.customer_address || "-",
    total: orderTotal({ ...order, products }),
    products: products.length ? products : [{
      name:"Pooja Fashion Order",
      image:"images/banner.png",
      price:"Rs. 0",
      quantity:1,
      size:""
    }]
  };
}

function canCancelOrder(order){
  const state = (order.status + " " + order.paymentStatus).toLowerCase();
  return !/cancel|shipped|delivered|refunded/i.test(state);
}

function readLocalOrders(){
  const orders = readJson("orders", []).map(normalizeOrder);
  const lastOrder = readJson("lastOrder", null);

  if(lastOrder){
    const normalizedLastOrder = normalizeOrder(lastOrder);
    const exists = orders.some(order => order.orderId === normalizedLastOrder.orderId);
    if(!exists) orders.push(normalizedLastOrder);
  }

  return orders;
}

function statusGroup(order){
  const status = (order.status + " " + order.paymentStatus + " " + order.paymentMethod).toLowerCase();

  if(status.includes("cancel")) return "cancelled";
  if(status.includes("paid")) return "paid";
  if(status.includes("cash on delivery")) return "cod";
  if(status.includes("pending")) return "pending";
  return "all";
}

function filteredOrders(){
  if(activeOrderFilter === "all") return allOrders;
  return allOrders.filter(order => statusGroup(order) === activeOrderFilter);
}

function setText(id, value){
  const element = document.getElementById(id);
  if(element) element.innerText = value;
}

function renderStats(){
  setText("ordersTotalCount", allOrders.length);
  setText("ordersPaidCount", allOrders.filter(order => statusGroup(order) === "paid").length);
  setText("ordersCodCount", allOrders.filter(order => statusGroup(order) === "cod").length);
}

function renderOrders(){
  const ordersList = document.getElementById("ordersList");
  if(!ordersList) return;

  const orders = filteredOrders().slice().sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if(!orders.length){
    ordersList.innerHTML = `
      <div class="orders-empty-state">
        <i class="fas fa-receipt"></i>
        <h3>No orders found</h3>
        <p>Your placed orders will appear here.</p>
        <a href="index.html#shop">Start Shopping</a>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders.map(order => {
    const product = order.products[0] || {};
    const itemsCount = order.products.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    const badgeClass = statusGroup(order);
    const statusText = /cancel/i.test(order.status)
      ? order.status
      : order.paymentStatus;

    return `
      <article class="orders-history-card">
        <img src="${product.image || "images/banner.png"}" alt="${product.name || "Pooja Fashion order"}">
        <div class="orders-history-info">
          <div class="orders-card-top">
            <span>${order.orderId}</span>
            <strong class="${badgeClass}">${statusText}</strong>
          </div>
          <h3>${product.name || "Pooja Fashion Order"}</h3>
          <p>${itemsCount} item(s)${product.size ? " - Size " + product.size : ""} - ${formatDate(order.createdAt)}</p>
          <div class="orders-card-meta">
            <span><i class="fas fa-credit-card"></i> ${order.paymentMethod}</span>
            <span><i class="fas fa-indian-rupee-sign"></i> ${order.total}</span>
          </div>
        </div>
        <div class="orders-card-actions">
          <button type="button" data-order-id="${order.orderId}">View Details</button>
          ${canCancelOrder(order) ? `<button type="button" class="cancel-order-btn" data-cancel-order-id="${order.orderId}">Cancel Order</button>` : ""}
          <a href="https://wa.me/917620986732?text=${encodeURIComponent("Hello Pooja Fashion, I need help with order " + order.orderId)}" target="_blank" rel="noreferrer">Support</a>
        </div>
      </article>
    `;
  }).join("");

  ordersList.querySelectorAll("[data-order-id]").forEach(button => {
    button.addEventListener("click", () => {
      const order = allOrders.find(item => item.orderId === button.dataset.orderId);
      if(order){
        localStorage.setItem("lastOrder", JSON.stringify(order));
        window.location.href = "order-success.html";
      }
    });
  });

  ordersList.querySelectorAll("[data-cancel-order-id]").forEach(button => {
    button.addEventListener("click", () => cancelOrder(button.dataset.cancelOrderId));
  });
}

function saveLocalCancelledOrder(orderId, updatedOrder){
  const orders = readJson("orders", []);
  const updatedOrders = orders.map(order => {
    const normalized = normalizeOrder(order);
    if(normalized.orderId !== orderId) return order;
    return updatedOrder || {
      ...order,
      status:"Cancelled",
      paymentStatus:"Cancelled",
      payment_status:"Cancelled",
      cancelledAt:new Date().toISOString()
    };
  });

  localStorage.setItem("orders", JSON.stringify(updatedOrders));

  const lastOrder = readJson("lastOrder", null);
  if(lastOrder && normalizeOrder(lastOrder).orderId === orderId){
    localStorage.setItem("lastOrder", JSON.stringify(updatedOrder || {
      ...lastOrder,
      status:"Cancelled",
      paymentStatus:"Cancelled",
      payment_status:"Cancelled",
      cancelledAt:new Date().toISOString()
    }));
  }
}

async function cancelOrder(orderId){
  const order = allOrders.find(item => item.orderId === orderId);
  if(!order || !canCancelOrder(order)) return;

  const message = /paid/i.test(order.paymentStatus)
    ? "Paid order ke liye cancel request admin ko jayegi. Refund manually confirm hoga. Cancel request bhejni hai?"
    : "Is order ko cancel karna hai?";

  if(!confirm(message)) return;

  try{
    if(window.PoojaApi?.isEnabled() && window.PoojaApi.getToken()){
      const response = await window.PoojaApi.cancelOrder(orderId);
      const normalized = normalizeOrder(response.order);
      allOrders = allOrders.map(item => item.orderId === orderId ? normalized : item);
      saveLocalCancelledOrder(orderId, response.order);
    }else{
      const updated = {
        ...order,
        status:"Cancelled",
        paymentStatus:"Cancelled"
      };
      allOrders = allOrders.map(item => item.orderId === orderId ? updated : item);
      saveLocalCancelledOrder(orderId, updated);
    }

    renderStats();
    renderOrders();
  }catch(error){
    alert(error.message);
  }
}

function setupFilters(){
  document.querySelectorAll("[data-order-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeOrderFilter = button.dataset.orderFilter;
      document.querySelectorAll("[data-order-filter]").forEach(item => {
        item.classList.toggle("active", item === button);
      });
      renderOrders();
    });
  });
}

async function loadOrders(){
  allOrders = readLocalOrders();

  if(window.PoojaApi?.isEnabled() && window.PoojaApi.getToken()){
    try{
      const response = await window.PoojaApi.getOrders();
      allOrders = (response.orders || []).map(normalizeOrder);
    }catch(error){
      allOrders = readLocalOrders();
    }
  }

  renderStats();
  renderOrders();
}

setupFilters();
loadOrders();
