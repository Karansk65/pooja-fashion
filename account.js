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
const authPanel = document.getElementById("authPanel");
const authIntro = document.getElementById("authIntro");
const accountDashboard = document.getElementById("accountDashboard");
const accountLogoutBtn = document.getElementById("accountLogoutBtn");
const accountParams = new URLSearchParams(window.location.search);
const redirectAfterAuth = accountParams.get("redirect") || "";
const authReason = accountParams.get("reason") || "";

function isLoggedIn(){
  return Boolean(window.PoojaApi?.getToken());
}

function goToRedirect(){
  if(!redirectAfterAuth) return false;
  window.location.href = redirectAfterAuth;
  return true;
}

function readProfile(){
  return JSON.parse(localStorage.getItem("customerProfile")) || {
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
    name:"",
    phone: profilePhone.value.trim(),
    address: profileAddress.value.trim()
  };

  if(!profile.phone){
    profileMessage.innerText = "Please add mobile number.";
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
    goToRedirect();
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
    goToRedirect();
  }catch(error){
    authMessage.innerText = error.message;
  }
}

async function sendAccountOtp(){
  if(!window.PoojaApi?.isEnabled()){
    authMessage.innerText = "Backend API URL is not configured in config.js.";
    return;
  }

  try{
    const response = await window.PoojaApi.sendOtp({
      phone: document.getElementById("otpPhone").value.trim(),
      purpose: "account"
    });
    authMessage.innerText = response.devOtp
      ? response.message + " Testing OTP: " + response.devOtp
      : response.message;
  }catch(error){
    authMessage.innerText = error.message;
  }
}

async function verifyAccountOtp(){
  if(!window.PoojaApi?.isEnabled()){
    authMessage.innerText = "Backend API URL is not configured in config.js.";
    return;
  }

  try{
    await window.PoojaApi.verifyOtp({
      phone: document.getElementById("otpPhone").value.trim(),
      otp: document.getElementById("otpCode").value.trim()
    });
    authMessage.innerText = "OTP verified. Login successful.";
    await renderAccount();
    goToRedirect();
  }catch(error){
    authMessage.innerText = error.message;
  }
}

async function logoutAccount(){
  window.PoojaApi?.logout();
  localStorage.removeItem("customerProfile");
  authMessage.innerText = "Logged out.";
  await renderAccount();
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
          <h3>${firstProduct.name || "Dipali Fashion Order"}</h3>
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
  const loggedIn = isLoggedIn();

  if(authPanel) authPanel.hidden = loggedIn;
  if(accountDashboard) accountDashboard.hidden = !loggedIn;
  if(accountLogoutBtn) accountLogoutBtn.hidden = !loggedIn;
  if(authIntro){
    authIntro.innerText = authReason === "checkout"
      ? "Verify your mobile number before checkout. We will bring you back to your order."
      : "Use mobile OTP to track orders, save address and checkout faster.";
  }

  if(window.PoojaApi?.isEnabled() && loggedIn){
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

  if(profilePhone) profilePhone.value = currentProfile.phone || "";
  if(profileAddress) profileAddress.value = currentProfile.address || "";

  if(accountName){
    accountName.innerText = loggedIn ? "Customer" : "Guest";
  }
  accountPhone.innerText = loggedIn
    ? currentProfile.phone
      ? "Mobile: " + currentProfile.phone
      : "Add your mobile number to track your orders."
    : "Please login or create an account to continue.";

  totalOrders.innerText = orders.length;
  cartItemsCount.innerText = cart.length;
  savedAddressStatus.innerText = currentProfile.address ? "Yes" : "No";

  renderOrders(orders);
}

renderAccount();
