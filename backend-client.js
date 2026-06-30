(function(){
  const config = window.POOJA_CONFIG || {};
  const apiBaseUrl = (config.API_BASE_URL || "").replace(/\/$/, "");

  function isEnabled(){
    return Boolean(apiBaseUrl);
  }

  function getToken(){
    return localStorage.getItem("customerToken") || "";
  }

  function setSession(data){
    if(data.token) localStorage.setItem("customerToken", data.token);
    if(data.user) localStorage.setItem("customerProfile", JSON.stringify(data.user));
  }

  function logout(){
    localStorage.removeItem("customerToken");
  }

  async function request(path, options = {}){
    if(!isEnabled()){
      throw new Error("Backend API URL is not configured");
    }

    const token = getToken();
    let response;

    try{
      response = await fetch(apiBaseUrl + path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(options.headers || {})
        }
      });
    }catch(error){
      throw new Error("Backend is not running. Start it with: npm.cmd start");
    }

    const data = await response.json().catch(() => ({}));

    if(!response.ok){
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  window.PoojaApi = {
    isEnabled,
    getToken,
    setSession,
    logout,
    request,
    register: payload => request("/api/auth/register", {
      method:"POST",
      body: JSON.stringify(payload)
    }).then(data => {
      setSession(data);
      return data;
    }),
    login: payload => request("/api/auth/login", {
      method:"POST",
      body: JSON.stringify(payload)
    }).then(data => {
      setSession(data);
      return data;
    }),
    getMe: () => request("/api/account/me"),
    updateProfile: payload => request("/api/account/profile", {
      method:"PUT",
      body: JSON.stringify(payload)
    }).then(data => {
      if(data.user) localStorage.setItem("customerProfile", JSON.stringify(data.user));
      return data;
    }),
    getOrders: () => request("/api/orders"),
    createOrder: payload => request("/api/orders", {
      method:"POST",
      body: JSON.stringify(payload)
    }),
    createRazorpayOrder: orderId => request("/api/payments/razorpay/create-order", {
      method:"POST",
      body: JSON.stringify({ orderId })
    }),
    verifyRazorpayPayment: payload => request("/api/payments/razorpay/verify", {
      method:"POST",
      body: JSON.stringify(payload)
    })
  };
})();
