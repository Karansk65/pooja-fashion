const params = new URLSearchParams(window.location.search);

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return matches ? matches.join("") : "0";
}

const productName = params.get("name") || localStorage.getItem("productName") || "Product";
const rawPrice = params.get("price") || localStorage.getItem("productPrice") || "0";
const productPrice = parseMoney(rawPrice);
const productSize = localStorage.getItem("productSize") || "";
const productQuantity = Math.max(1, Number(localStorage.getItem("productQuantity") || 1));
const productTotal = String(Number(productPrice || 0) * productQuantity);
const productImage = localStorage.getItem("productImage") || "";
const merchantUpiId = "YOUR_UPI_ID@BANK";
const merchantName = "Pooja Fashion";
const hasUpiId = merchantUpiId !== "YOUR_UPI_ID@BANK";
let isGatewayReady = false;
let razorpayScriptPromise = null;

const productNameEl = document.getElementById("productName");
const productPriceEl = document.getElementById("productPrice");
const finalTotalEl = document.getElementById("finalCheckoutTotal");
const productImageEl = document.getElementById("checkoutProductImage");
const checkoutProductMeta = document.getElementById("checkoutProductMeta");
const paymentMethodEl = document.getElementById("paymentMethod");
const paymentNoteEl = document.getElementById("paymentNote");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const merchantUpiText = document.getElementById("merchantUpiText");
const upiIdBox = document.getElementById("upiIdBox");
const checkoutForm = document.getElementById("checkoutForm");
const copyUpiBtn = document.getElementById("copyUpiBtn");
const paymentStatusPill = document.getElementById("paymentStatusPill");
const selectedPaymentTitle = document.getElementById("selectedPaymentTitle");
const saveDeliveryInfo = document.getElementById("saveDeliveryInfo");

function readStoredDeliveryInfo(){
  const saved = JSON.parse(localStorage.getItem("deliveryInfo") || "null");
  if(saved) return saved;

  const profile = JSON.parse(localStorage.getItem("customerProfile") || "null");
  if(!profile) return null;

  const nameParts = String(profile.name || "").trim().split(/\s+/);
  return {
    country:"India",
    firstName:nameParts.shift() || "",
    lastName:nameParts.join(" "),
    phone:profile.phone || "",
    addressLine1:profile.address || "",
    addressLine2:"",
    city:"",
    state:"Maharashtra",
    pinCode:""
  };
}

function setFieldValue(id, value){
  const field = document.getElementById(id);
  if(field) field.value = value || "";
}

function fillDeliveryForm(){
  const saved = readStoredDeliveryInfo();
  if(!saved) return;

  setFieldValue("deliveryCountry", saved.country || "India");
  setFieldValue("firstName", saved.firstName);
  setFieldValue("lastName", saved.lastName);
  setFieldValue("addressLine1", saved.addressLine1);
  setFieldValue("addressLine2", saved.addressLine2);
  setFieldValue("city", saved.city);
  setFieldValue("state", saved.state || "Maharashtra");
  setFieldValue("pinCode", saved.pinCode);
  setFieldValue("customerPhone", saved.phone);
  if(saveDeliveryInfo) saveDeliveryInfo.checked = true;
}

function collectDeliveryInfo(){
  const info = {
    country:document.getElementById("deliveryCountry")?.value.trim() || "India",
    firstName:document.getElementById("firstName")?.value.trim() || "",
    lastName:document.getElementById("lastName")?.value.trim() || "",
    addressLine1:document.getElementById("addressLine1")?.value.trim() || "",
    addressLine2:document.getElementById("addressLine2")?.value.trim() || "",
    city:document.getElementById("city")?.value.trim() || "",
    state:document.getElementById("state")?.value.trim() || "",
    pinCode:document.getElementById("pinCode")?.value.trim() || "",
    phone:document.getElementById("customerPhone")?.value.trim() || ""
  };

  const customerName = [info.firstName, info.lastName].filter(Boolean).join(" ");
  const customerAddress = [
    info.addressLine1,
    info.addressLine2,
    info.city,
    info.state,
    info.pinCode ? "PIN " + info.pinCode : "",
    info.country
  ].filter(Boolean).join(", ");

  return {
    ...info,
    customerName,
    customerPhone:info.phone,
    customerAddress
  };
}

if(productNameEl) productNameEl.innerText = productName;
if(productPriceEl) productPriceEl.innerText = productQuantity > 1 ? productPrice + " x " + productQuantity : productPrice;
if(finalTotalEl) finalTotalEl.innerText = productTotal;
if(checkoutProductMeta){
  checkoutProductMeta.innerText = [
    productSize ? "Size: " + productSize : "",
    "Qty: " + productQuantity,
    "Quality checked before dispatch"
  ].filter(Boolean).join(" | ");
}

if(productImageEl){
  if(productImage){
    productImageEl.src = productImage;
  }else{
    productImageEl.style.display = "none";
  }
}

fillDeliveryForm();

if(paymentMethodEl) paymentMethodEl.value = "UPI";
if(merchantUpiText){
  merchantUpiText.innerText = !hasUpiId
    ? "UPI ID not added"
    : merchantUpiId;
}
if(paymentNoteEl && !hasUpiId){
  paymentNoteEl.innerText = "UPI is selected. Razorpay checkout will show QR and UPI apps.";
}

function setPlaceOrderLabel(text){
  if(!placeOrderBtn) return;

  if(placeOrderBtn.querySelector("span")){
    placeOrderBtn.querySelector("span").innerText = text;
  }else{
    placeOrderBtn.innerText = text;
  }
}

function setPaymentUi(paymentMethod){
  const isCod = paymentMethod === "Cash On Delivery";
  const isOnlinePayment = !isCod;

  if(selectedPaymentTitle){
    selectedPaymentTitle.innerText = isCod
      ? "Cash On Delivery selected"
      : paymentMethod + " selected";
  }

  if(paymentNoteEl){
    paymentNoteEl.innerText = isCod
      ? "Pay in cash when your order is delivered."
      : isGatewayReady
      ? "Secure Razorpay checkout will open for " + paymentMethod + "."
      : "Online payment needs Razorpay keys or shop UPI ID setup.";
  }

  setPlaceOrderLabel(isOnlinePayment ? "Pay & Place Order" : "Place COD Order");
}

async function refreshPaymentStatus(){
  if(!window.PoojaApi?.isEnabled()) return;

  try{
    const config = await window.PoojaApi.request("/api/config");
    isGatewayReady = Boolean(config.gatewayReady);

    if(config.gatewayReady){
      if(paymentStatusPill){
        paymentStatusPill.innerText = "Gateway ready";
        paymentStatusPill.classList.add("ready");
      }

      if(paymentNoteEl){
        paymentNoteEl.innerText = "Razorpay is ready. Customers can pay using UPI, cards, EMI, netbanking, wallet or pay later.";
      }

      if(upiIdBox){
        upiIdBox.style.display = "none";
      }

      setPaymentUi(paymentMethodEl?.value || "UPI");
    }
  }catch(error){
    if(paymentStatusPill){
      paymentStatusPill.innerText = "Backend offline";
      paymentStatusPill.classList.remove("ready");
    }

    if(paymentNoteEl){
      paymentNoteEl.innerText = error.message;
    }
  }
}

function loadRazorpayCheckout(){
  if(typeof Razorpay !== "undefined") return Promise.resolve();
  if(razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const finishIfReady = () => {
      if(typeof Razorpay !== "undefined"){
        resolve();
      }
    };

    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    const script = existingScript || document.createElement("script");

    script.addEventListener("load", finishIfReady, { once:true });
    script.addEventListener("error", () => {
      reject(new Error("Razorpay checkout could not load. Check internet connection and refresh the page."));
    }, { once:true });

    if(!existingScript){
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.head.appendChild(script);
    }

    setTimeout(() => {
      if(typeof Razorpay !== "undefined"){
        resolve();
      }else{
        reject(new Error("Razorpay checkout could not load. Check internet connection and refresh the page."));
      }
    }, 8000);
  });

  return razorpayScriptPromise;
}

document.querySelectorAll(".payment-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".payment-option").forEach(item => {
      item.classList.remove("active");
    });

    option.classList.add("active");
    paymentMethodEl.value = option.dataset.payment;

    const isUpiPayment = option.dataset.payment !== "Cash On Delivery";
    setPaymentUi(option.dataset.payment);
  });
});

document.querySelectorAll("[data-upi-app]").forEach(appChip => {
  appChip.addEventListener("click", event => {
    event.stopPropagation();

    document.querySelectorAll(".payment-option").forEach(item => {
      item.classList.remove("active");
    });

    const upiOption = appChip.closest(".payment-option");
    upiOption?.classList.add("active");
    paymentMethodEl.value = appChip.dataset.upiApp;
    setPaymentUi(appChip.dataset.upiApp);

    if(paymentNoteEl){
      paymentNoteEl.innerText = appChip.dataset.upiApp + " will open from secure Razorpay checkout on mobile.";
    }
  });
});

function buildUpiPaymentUrl(paymentMethod) {
  const params = new URLSearchParams({
    pa: merchantUpiId,
    pn: merchantName,
    am: productPrice,
    cu: "INR",
    tn: productName + " - " + paymentMethod
  });

  return "upi://pay?" + params.toString();
}

function copyUpiId(){
    if(!hasUpiId){
      alert("Please add your real UPI ID first.");
    return;
  }

  navigator.clipboard.writeText(merchantUpiId)
    .then(() => alert("UPI ID copied."))
    .catch(() => alert("UPI ID: " + merchantUpiId));
}

function readLocalOrders(){
  return JSON.parse(localStorage.getItem("orders")) || [];
}

function normalizeStoredProduct(item){
  const priceValue = item.price || item.amount || productPrice;
  return {
    name: item.name || productName,
    image: item.image || productImage,
    price: String(priceValue).includes("Rs.") ? String(priceValue) : "Rs. " + parseMoney(priceValue),
    quantity: Number(item.quantity || 1),
    size: item.size || productSize
  };
}

function buildOrderSnapshot(order, fallback = {}){
  const products = (order.products || fallback.products || [{
    name: productName,
    image: productImage,
    price: productPrice,
    quantity: productQuantity,
    size: productSize
  }]).map(normalizeStoredProduct);

  return {
    orderId: order.order_id || order.orderId || fallback.orderId || "PF-" + Date.now(),
    createdAt: order.created_at || order.createdAt || new Date().toISOString(),
    customerName: order.customer_name || fallback.customerName || "",
    customerPhone: order.customer_phone || fallback.customerPhone || "",
    customerAddress: order.customer_address || fallback.customerAddress || "",
    deliveryInfo: order.delivery_info || fallback.deliveryInfo || null,
    paymentMethod: order.payment_method || fallback.paymentMethod || paymentMethodEl.value,
    paymentStatus: fallback.paymentStatus || order.payment_status || "Order Placed",
    status: order.status || fallback.status || "Placed",
    total: Number(order.total || fallback.total || productTotal),
    products,
    paymentId: fallback.paymentId || order.paymentId || ""
  };
}

function saveOrderSnapshot(orderSnapshot){
  localStorage.setItem("lastOrder", JSON.stringify(orderSnapshot));

  const orders = readLocalOrders();
  const orderIndex = orders.findIndex(order => {
    return (order.orderId || order.order_id) === orderSnapshot.orderId;
  });

  if(orderIndex >= 0){
    orders[orderIndex] = { ...orders[orderIndex], ...orderSnapshot };
  }else{
    orders.push(orderSnapshot);
  }

  localStorage.setItem("orders", JSON.stringify(orders));
}

refreshPaymentStatus();

if(checkoutForm){
  checkoutForm.addEventListener("submit", placeOrder);
}

if(copyUpiBtn){
  copyUpiBtn.addEventListener("click", copyUpiId);
}

async function placeOrder(event) {
  if(event) event.preventDefault();

  const deliveryInfo = collectDeliveryInfo();
  const customerName = deliveryInfo.customerName;
  const customerPhone = deliveryInfo.customerPhone;
  const customerAddress = deliveryInfo.customerAddress;
  const paymentMethod = paymentMethodEl.value;

  if(!customerName || !customerPhone || !customerAddress || !paymentMethod){
    alert("Please fill delivery details.");
    return;
  }

  if(!deliveryInfo.addressLine1 || !deliveryInfo.city || !deliveryInfo.state || !/^\d{6}$/.test(deliveryInfo.pinCode)){
    alert("Please enter address, city, state and a valid 6 digit PIN code.");
    return;
  }

  if(!/^[6-9]\d{9}$/.test(customerPhone)){
    alert("Please enter a valid 10 digit mobile number.");
    return;
  }

  if(window.PoojaApi?.isEnabled()){
    try{
      placeOrderBtn.disabled = true;
      setPlaceOrderLabel("Creating Order...");

      if(paymentMethod !== "Cash On Delivery"){
        const gatewayConfig = await window.PoojaApi.request("/api/config");

        if(!gatewayConfig.gatewayReady){
          paymentNoteEl.innerText = "Razorpay payment keys are not added yet. Add keys in backend .env or select Cash On Delivery.";
          placeOrderBtn.disabled = false;
          setPlaceOrderLabel("Pay & Place Order");
          return;
        }

        isGatewayReady = true;
      }

      if(saveDeliveryInfo?.checked){
        localStorage.setItem("deliveryInfo", JSON.stringify(deliveryInfo));
        localStorage.setItem("customerProfile", JSON.stringify({
          name: customerName,
          phone: customerPhone,
          address: customerAddress
        }));
      }

      const orderResponse = await window.PoojaApi.createOrder({
        customerName,
        customerPhone,
        customerAddress,
        deliveryInfo,
        paymentMethod,
        items: [{
          name: productName,
          image: productImage,
          price: productPrice,
          quantity: productQuantity,
          size: productSize
        }]
      });

      let orderSnapshot = buildOrderSnapshot(orderResponse.order, {
        customerName,
        customerPhone,
        customerAddress,
        deliveryInfo,
        paymentMethod,
        paymentStatus: paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending",
        total: productTotal
      });

      saveOrderSnapshot(orderSnapshot);

      if(paymentMethod === "Cash On Delivery"){
        window.location.href = "order-success.html";
        return;
      }

      try{
        await loadRazorpayCheckout();
      }catch(error){
        paymentNoteEl.innerText = error.message;
        placeOrderBtn.disabled = false;
        setPlaceOrderLabel("Pay & Place Order");
        return;
      }

      const paymentResponse = await window.PoojaApi.createRazorpayOrder(orderResponse.order.order_id);

      const checkout = new Razorpay({
        key: paymentResponse.keyId,
        amount: paymentResponse.razorpayOrder.amount,
        currency: paymentResponse.razorpayOrder.currency,
        name: "Pooja Fashion",
        description: productName,
        order_id: paymentResponse.razorpayOrder.id,
        prefill: {
          name: customerName,
          contact: customerPhone
        },
        theme: {
          color: "#111111"
        },
        handler: async function(response){
          try{
            await window.PoojaApi.verifyRazorpayPayment({
              orderId: orderResponse.order.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            orderSnapshot = {
              ...orderSnapshot,
              paymentStatus: "Paid",
              status: "Confirmed",
              paymentId: response.razorpay_payment_id
            };
            saveOrderSnapshot(orderSnapshot);
            window.location.href = "order-success.html";
          }catch(error){
            paymentNoteEl.innerText = error.message;
          }
        },
        modal: {
          ondismiss: function(){
            placeOrderBtn.disabled = false;
            setPlaceOrderLabel("Pay & Place Order");
          }
        }
      });

      checkout.open();
      return;
    }catch(error){
      paymentNoteEl.innerText = error.message;
      placeOrderBtn.disabled = false;
      setPlaceOrderLabel(paymentMethod === "Cash On Delivery" ? "Place COD Order" : "Pay & Place Order");
      return;
    }
  }

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const isUpiPayment = paymentMethod !== "Cash On Delivery";

  if(isUpiPayment && !hasUpiId){
    paymentNoteEl.innerText = "Online payment is selected, but shop UPI ID is not added yet.";
    document.getElementById("upiIdBox").scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }

  if(saveDeliveryInfo?.checked){
    localStorage.setItem("deliveryInfo", JSON.stringify(deliveryInfo));
    localStorage.setItem("customerProfile", JSON.stringify({
      name: customerName,
      phone: customerPhone,
      address: customerAddress
    }));
  }

  orders.push({
    orderId: "PF-" + Date.now(),
    createdAt: new Date().toISOString(),
    customerName,
    customerPhone,
    customerAddress,
    deliveryInfo,
    paymentMethod,
    paymentStatus: isUpiPayment ? "Payment Started" : "Cash On Delivery",
    total: Number(productTotal),
    products: [{
      name: productName,
      image: productImage,
      price: "Rs. " + productPrice,
      quantity: productQuantity,
      size: productSize
    }]
  });

  localStorage.setItem("orders", JSON.stringify(orders));
  saveOrderSnapshot(orders[orders.length - 1]);

  if(isUpiPayment){
    window.location.href = buildUpiPaymentUrl(paymentMethod);
    setTimeout(() => {
      window.location.href = "order-success.html";
    }, 1200);
    return;
  }

  window.location.href = "order-success.html";
}
