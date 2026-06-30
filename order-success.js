function readJson(key, fallback){
  try{
    return JSON.parse(localStorage.getItem(key)) || fallback;
  }catch(error){
    return fallback;
  }
}

function formatDate(value){
  if(!value) return "Today";

  return new Date(value).toLocaleString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });
}

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0");
}

function normalizeOrder(order){
  const products = order?.products || order?.items || [];
  const firstProduct = products[0] || {};

  return {
    orderId: order?.orderId || order?.order_id || "PF-" + Date.now(),
    createdAt: order?.createdAt || order?.created_at || new Date().toISOString(),
    status: order?.status || "Placed",
    paymentMethod: order?.paymentMethod || order?.payment_method || "Not selected",
    paymentStatus: order?.paymentStatus || order?.payment_status || "Order Placed",
    customerName: order?.customerName || order?.customer_name || "Customer",
    customerPhone: order?.customerPhone || order?.customer_phone || "-",
    customerAddress: order?.customerAddress || order?.customer_address || "-",
    total: Number(order?.total || 0) || products.reduce((sum, item) => {
      return sum + parseMoney(item.price) * Number(item.quantity || 1);
    }, 0),
    products: products.length ? products : [{
      name: firstProduct.name || "Pooja Fashion Order",
      image: firstProduct.image || "images/banner.png",
      price: firstProduct.price || "Rs. 0",
      quantity: firstProduct.quantity || 1
    }]
  };
}

function canCancelOrder(order){
  const state = (order.status + " " + order.paymentStatus).toLowerCase();
  return !/cancel|shipped|delivered|refunded/i.test(state);
}

function getLatestOrder(){
  const lastOrder = readJson("lastOrder", null);
  if(lastOrder) return normalizeOrder(lastOrder);

  const orders = readJson("orders", []);
  if(orders.length) return normalizeOrder(orders[orders.length - 1]);

  return normalizeOrder(null);
}

function setText(id, value){
  const element = document.getElementById(id);
  if(element) element.innerText = value;
}

function renderProducts(order){
  const container = document.getElementById("successProducts");
  if(!container) return;

  container.innerHTML = order.products.map(product => {
    const price = String(product.price || "").includes("Rs.")
      ? product.price
      : "Rs. " + parseMoney(product.price);

    return `
      <article class="success-product-row">
        <img src="${product.image || "images/banner.png"}" alt="${product.name || "Pooja Fashion product"}">
        <div>
          <span>Premium Designer Collection</span>
          <h3>${product.name || "Pooja Fashion Product"}</h3>
          <p>${product.size ? "Size: " + product.size + " | " : ""}Qty: ${product.quantity || 1}</p>
        </div>
        <strong>${price}</strong>
      </article>
    `;
  }).join("");
}

function renderOrder(){
  const order = getLatestOrder();

  setText("successOrderId", order.orderId);
  setText("successOrderStatus", order.status);
  setText("successPaymentMethod", order.paymentMethod);
  setText("successPaymentStatus", order.paymentStatus);
  setText("successTotal", order.total);
  setText("successCustomerName", order.customerName);
  setText("successCustomerPhone", order.customerPhone);
  setText("successCustomerAddress", order.customerAddress);
  setText("successOrderDate", formatDate(order.createdAt));

  const message = order.paymentStatus === "Paid"
    ? "Payment received. Your order has been confirmed successfully."
    : "Your order has been placed. We will contact you soon for confirmation.";
  setText("successMessage", message);

  const supportLink = document.getElementById("successWhatsappLink");
  if(supportLink){
    const text = encodeURIComponent("Hello Pooja Fashion, I need help with order " + order.orderId);
    supportLink.href = "https://wa.me/917620986732?text=" + text;
  }

  renderProducts(order);

  const cancelOrderBtn = document.getElementById("cancelOrderBtn");
  if(cancelOrderBtn){
    cancelOrderBtn.hidden = !canCancelOrder(order);
  }
}

function saveLocalCancelledOrder(orderId, updatedOrder){
  const orders = readJson("orders", []);
  const updatedOrders = orders.map(order => {
    if(normalizeOrder(order).orderId !== orderId) return order;
    return updatedOrder || {
      ...order,
      status:"Cancelled",
      paymentStatus:"Cancelled",
      payment_status:"Cancelled",
      cancelledAt:new Date().toISOString()
    };
  });

  localStorage.setItem("orders", JSON.stringify(updatedOrders));
  localStorage.setItem("lastOrder", JSON.stringify(updatedOrder || {
    ...getLatestOrder(),
    status:"Cancelled",
    paymentStatus:"Cancelled",
    payment_status:"Cancelled",
    cancelledAt:new Date().toISOString()
  }));
}

async function cancelLatestOrder(){
  const order = getLatestOrder();
  if(!canCancelOrder(order)) return;

  const message = /paid/i.test(order.paymentStatus)
    ? "Paid order ke liye cancel request admin ko jayegi. Refund manually confirm hoga. Cancel request bhejni hai?"
    : "Is order ko cancel karna hai?";

  if(!confirm(message)) return;

  try{
    if(window.PoojaApi?.isEnabled() && window.PoojaApi.getToken()){
      const response = await window.PoojaApi.cancelOrder(order.orderId);
      saveLocalCancelledOrder(order.orderId, response.order);
    }else{
      saveLocalCancelledOrder(order.orderId);
    }

    renderOrder();
  }catch(error){
    alert(error.message);
  }
}

document.getElementById("printOrderBtn")?.addEventListener("click", () => {
  window.print();
});

document.getElementById("cancelOrderBtn")?.addEventListener("click", cancelLatestOrder);

renderOrder();
