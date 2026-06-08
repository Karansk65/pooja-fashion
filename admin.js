const adminOrders = document.getElementById("adminOrders");
const order = JSON.parse(localStorage.getItem("lastOrder"));

if(!order){
  adminOrders.innerHTML = "<p>No orders found.</p>";
}else{
  adminOrders.innerHTML = `
    <div class="admin-card">
      <h2>Customer Details</h2>
      <p><b>Name:</b> ${order.customerName}</p>
      <p><b>Phone:</b> ${order.customerPhone}</p>
      <p><b>Address:</b> ${order.customerAddress}</p>

      <h2>Products</h2>
      ${order.products.map(item => `
        <div class="admin-product">
          <img src="${item.image}">
          <div>
            <h3>${item.name}</h3>
            <p>${item.price}</p>
          </div>
        </div>
      `).join("")}

      <h2>Total: ${order.total}</h2>
    </div>
  `;
}