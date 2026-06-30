const profileName = document.getElementById("profileName");
const profilePhone = document.getElementById("profilePhone");
const profileAddress = document.getElementById("profileAddress");
const profileMessage = document.getElementById("profileMessage");
const accountName = document.getElementById("accountName");
const accountPhone = document.getElementById("accountPhone");
const accountOrders = document.getElementById("accountOrders");
const totalOrders = document.getElementById("totalOrders");
const cartItemsCount = document.getElementById("cartItemsCount");
const savedAddressStatus = document.getElementById("savedAddressStatus");
const authMessage = document.getElementById("authMessage");

function readProfile(){
  return JSON.parse(localStorage.getItem("customerProfile")) || {
    name:"",
    phone:"",
    address:""
  };
}

function readOrders(){
  return JSON.parse(localStorage.getItem("orders")) || [];
}

function readCart(){
  return JSON.parse(localStorage.getItem("cart")) || [];
}

async function saveProfile(){
  const profile = {
    name: profileName.value.trim(),
    phone: profilePhone.value.trim(),
    address: profileAddress.value.trim()
  };

  if(!profile.name || !profile.phone){
    profileMessage.innerText = "Please add name and mobile number.";
    return;
  }

  if(window.PoojaApi?.isEnabled() && window.PoojaApi.getToken()){
    try{
      const response = await window.PoojaApi.updateProfile(profile);
      localStorage.setItem("customerProfile", JSON.stringify(response.user));
      profileMessage.innerText = "Profile saved to your account.";
      renderAccount();
      return;
    }catch(error){
      profileMessage.innerText = error.message;
      return;
    }
  }

  localStorage.setItem("customerProfile", JSON.stringify(profile));
  profileMessage.innerText = "Profile saved successfully.";
  renderAccount();
}

async function loginAccount(){
  if(!window.PoojaApi?.isEnabled()){
    authMessage.innerText = "Backend API URL is not configured in config.js.";
    return;
  }

  try{
    await window.PoojaApi.login({
      identifier: document.getElementById("loginIdentifier").value.trim(),
      password: document.getElementById("loginPassword").value
    });
    authMessage.innerText = "Login successful.";
    await renderAccount();
  }catch(error){
    authMessage.innerText = error.message;
  }
}

async function registerAccount(){
  if(!window.PoojaApi?.isEnabled()){
    authMessage.innerText = "Backend API URL is not configured in config.js.";
    return;
  }

  try{
    await window.PoojaApi.register({
      name: document.getElementById("registerName").value.trim(),
      phone: document.getElementById("registerPhone").value.trim(),
      email: document.getElementById("registerEmail").value.trim(),
      password: document.getElementById("registerPassword").value,
      address: profileAddress.value.trim()
    });
    authMessage.innerText = "Account created successfully.";
    await renderAccount();
  }catch(error){
    authMessage.innerText = error.message;
  }
}

function logoutAccount(){
  window.PoojaApi?.logout();
  authMessage.innerText = "Logged out.";
}

function formatDate(value){
  if(!value) return "Today";
  return new Date(value).toLocaleDateString("en-IN", {
    day:"2-digit",
    month:"short",
    year:"numeric"
  });
}

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0");
}

function orderTotal(order){
  return (order.products || []).reduce((sum, item) => {
    return sum + parseMoney(item.price);
  }, 0);
}

function renderOrders(orders){
  if(!accountOrders) return;

  if(!orders.length){
    accountOrders.innerHTML = `
      <div class="empty-account">
        <h3>No orders yet</h3>
        <p>Your orders will appear here after checkout.</p>
        <a href="index.html#shop">Start Shopping</a>
      </div>
    `;
    return;
  }

  accountOrders.innerHTML = orders.slice().reverse().map(order => {
    const products = order.products || [];
    const firstProduct = products[0] || {};
    const orderId = order.orderId || order.order_id || "PF-" + String(Math.floor(Math.random() * 90000) + 10000);
    const paymentStatus = order.paymentStatus || order.payment_status || "Order Placed";
    const paymentMethod = order.paymentMethod || order.payment_method || "Payment method not selected";
    const createdAt = order.createdAt || order.created_at;

    return `
      <article class="account-order-card">
        <img src="${firstProduct.image || "images/banner.png"}" alt="${firstProduct.name || "Order"}">
        <div>
          <div class="order-meta">
            <span>${orderId}</span>
            <strong>${paymentStatus}</strong>
          </div>
          <h3>${firstProduct.name || "Pooja Fashion Order"}</h3>
          <p>${products.length} item(s) - Rs. ${order.total || orderTotal(order)}</p>
          <small>${formatDate(createdAt)} - ${paymentMethod}</small>
        </div>
      </article>
    `;
  }).join("");
}

async function renderAccount(){
  const profile = readProfile();
  let orders = readOrders();
  const cart = readCart();

  if(window.PoojaApi?.isEnabled() && window.PoojaApi.getToken()){
    try{
      const [meResponse, ordersResponse] = await Promise.all([
        window.PoojaApi.getMe(),
        window.PoojaApi.getOrders()
      ]);
      localStorage.setItem("customerProfile", JSON.stringify(meResponse.user));
      orders = ordersResponse.orders || [];
    }catch(error){
      authMessage.innerText = error.message;
    }
  }

  const currentProfile = readProfile();

  if(profileName) profileName.value = currentProfile.name || "";
  if(profilePhone) profilePhone.value = currentProfile.phone || "";
  if(profileAddress) profileAddress.value = currentProfile.address || "";

  accountName.innerText = currentProfile.name || "Customer";
  accountPhone.innerText = currentProfile.phone
    ? "Mobile: " + currentProfile.phone
    : "Add your mobile number to track your orders.";

  totalOrders.innerText = orders.length;
  cartItemsCount.innerText = cart.length;
  savedAddressStatus.innerText = currentProfile.address ? "Yes" : "No";

  renderOrders(orders);
}

renderAccount();
