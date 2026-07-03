const cartItems = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const productsTotal = document.getElementById("productsTotal");
const shippingAmount = document.getElementById("shippingAmount");
const discountAmount = document.getElementById("discountAmount");
const finalTotal = document.getElementById("finalTotal");
const couponCode = document.getElementById("couponCode");
const couponMessage = document.getElementById("couponMessage");
const paymentMethodEl = document.getElementById("paymentMethod");
const cartPaymentStatus = document.getElementById("cartPaymentStatus");
const cartPaymentNote = document.getElementById("cartPaymentNote");
const cartCheckoutForm = document.getElementById("cartCheckoutForm");
const cartPlaceOrderBtn = document.getElementById("cartPlaceOrderBtn");
const saveDeliveryInfo = document.getElementById("saveDeliveryInfo");

let cart = normalizeCart(JSON.parse(localStorage.getItem("cart")) || []);
let subtotal = 0;
let couponDiscount = 0;
let activeCoupon = "";
let isGatewayReady = false;

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

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0") || 0;
}

function formatMoney(value){
  return "Rs. " + Math.max(0, Number(value || 0)).toLocaleString("en-IN");
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeCart(items){
  return items.map(item => ({
    name:item.name || "Pooja Fashion Product",
    image:item.image || "images/banner.png",
    price:String(item.price || item.amount || "Rs. 0").includes("Rs.")
      ? String(item.price || item.amount || "Rs. 0")
      : "Rs. " + parseMoney(item.price || item.amount),
    oldPrice:item.oldPrice || "",
    size:item.size || "",
    quantity:Math.max(1, Number(item.quantity || 1))
  }));
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

function cartCount(){
  return cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
}

function calculateSubtotal(){
  return cart.reduce((sum, item) => {
    return sum + parseMoney(item.price) * Number(item.quantity || 1);
  }, 0);
}

function calculateDiscount(){
  if(activeCoupon === "POOJA500" && subtotal >= 6500){
    return 500;
  }

  return 0;
}

function finalAmount(){
  return Math.max(0, subtotal - couponDiscount);
}

function setButtonLabel(text){
  const label = cartPlaceOrderBtn?.querySelector("span");
  if(label) label.innerText = text;
}

function isOnlineMethod(paymentMethod){
  return paymentMethod !== "Cash On Delivery";
}

function selectPaymentMethod(paymentMethod){
  document.querySelectorAll(".cart-payment-options .payment-option").forEach(item => {
    item.classList.toggle("active", item.dataset.payment === paymentMethod);
  });

  if(paymentMethodEl) paymentMethodEl.value = paymentMethod;
  setPaymentUi(paymentMethod);
}

function applyGatewayAvailability(){
  document.querySelectorAll(".cart-payment-options .payment-option").forEach(option => {
    const isOnlineOption = isOnlineMethod(option.dataset.payment);
    const shouldDisable = isOnlineOption && !isGatewayReady;
    option.disabled = shouldDisable;
    option.classList.toggle("disabled", shouldDisable);
    option.title = shouldDisable
      ? "Online payment will be enabled after Razorpay live setup."
      : "";
  });

  if(!isGatewayReady && isOnlineMethod(paymentMethodEl?.value || "")){
    selectPaymentMethod("Cash On Delivery");
  }
}

function updateSummary(){
  subtotal = calculateSubtotal();
  couponDiscount = calculateDiscount();

  if(productsTotal) productsTotal.innerText = formatMoney(subtotal);
  if(shippingAmount) shippingAmount.innerText = subtotal >= 6500 || subtotal === 0 ? "Free" : "Free";
  if(discountAmount) discountAmount.innerText = "- " + formatMoney(couponDiscount);
  if(finalTotal) finalTotal.innerText = formatMoney(finalAmount());
  if(cartItemCount){
    const count = cartCount();
    cartItemCount.innerText = count + (count === 1 ? " item selected" : " items selected");
  }
}

function renderEmptyCart(){
  cartItems.innerHTML = `
    <div class="premium-empty-cart">
      <i class="fas fa-bag-shopping"></i>
      <h3>Your cart is empty</h3>
      <p>Add designer gowns to your cart and complete checkout here.</p>
      <a href="index.html#shop">Start Shopping</a>
    </div>
  `;
}

function renderCart(){
  updateSummary();

  if(!cart.length){
    renderEmptyCart();
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => {
    const unitPrice = parseMoney(item.price);
    const itemTotal = unitPrice * Number(item.quantity || 1);

    return `
      <article class="premium-cart-item">
        <div class="cart-item-image">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        </div>
        <div class="cart-item-info">
          <span>Premium Designer Collection</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${item.size ? "Size: " + escapeHtml(item.size) + " | " : ""}Delivery in 10 days after confirmation</p>
          <div class="cart-item-price-line">
            <strong>${formatMoney(unitPrice)}</strong>
            ${item.oldPrice ? `<del>${escapeHtml(item.oldPrice)}</del>` : ""}
          </div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-qty-stepper" aria-label="Quantity">
            <button type="button" data-qty-minus="${index}">-</button>
            <b>${Number(item.quantity || 1)}</b>
            <button type="button" data-qty-plus="${index}">+</button>
          </div>
          <strong>${formatMoney(itemTotal)}</strong>
          <button type="button" class="cart-remove-btn" data-remove="${index}">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function updateQuantity(index, amount){
  if(!cart[index]) return;

  cart[index].quantity = Math.max(1, Math.min(10, Number(cart[index].quantity || 1) + amount));
  saveCart();
  renderCart();
}

function removeItem(index){
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function applyCoupon(){
  activeCoupon = (couponCode?.value || "").trim().toUpperCase();
  updateSummary();

  if(!activeCoupon){
    if(couponMessage) couponMessage.innerText = "Use POOJA500 on orders above Rs. 6500.";
    return;
  }

  if(couponDiscount > 0){
    if(couponMessage) couponMessage.innerText = "Coupon applied. Rs. 500 saved on this order.";
  }else{
    if(couponMessage) couponMessage.innerText = "Coupon works on orders above Rs. 6500.";
  }
}

function setPaymentUi(paymentMethod){
  const isCod = paymentMethod === "Cash On Delivery";

  if(cartPaymentNote){
    cartPaymentNote.innerText = isCod
      ? "Pay at delivery. We confirm every order by call or WhatsApp before dispatch."
      : isGatewayReady
      ? "Secure Razorpay checkout will open after order creation."
      : "Online payment will be enabled after Razorpay live setup. Please choose Cash On Delivery for now.";
  }

  setButtonLabel(isOnlineMethod(paymentMethod) ? "Pay & Place Order" : "Place COD Order");
}

async function refreshGatewayStatus(){
  try{
    if(window.PoojaApi?.isEnabled()){
      const config = await window.PoojaApi.request("/api/config");
      isGatewayReady = Boolean(config.gatewayReady);
      applyGatewayAvailability();

      if(cartPaymentStatus){
        cartPaymentStatus.innerText = isGatewayReady ? "Gateway ready" : "COD available";
        cartPaymentStatus.classList.toggle("ready", isGatewayReady);
      }

      setPaymentUi(paymentMethodEl?.value || "Cash On Delivery");
      return;
    }
  }catch(error){
    isGatewayReady = false;
    applyGatewayAvailability();

    if(cartPaymentStatus){
      cartPaymentStatus.innerText = "COD available";
      cartPaymentStatus.classList.remove("ready");
    }

    if(cartPaymentNote) cartPaymentNote.innerText = "Online payment is not available right now. Please place a COD order.";
  }
}

function buildOrderSnapshot(order, fallback){
  return {
    orderId: order.order_id || fallback.orderId || "PF-" + Date.now(),
    createdAt: order.created_at || new Date().toISOString(),
    customerName: order.customer_name || fallback.customerName,
    customerPhone: order.customer_phone || fallback.customerPhone,
    customerAddress: order.customer_address || fallback.customerAddress,
    deliveryInfo: order.delivery_info || fallback.deliveryInfo || null,
    paymentMethod: order.payment_method || fallback.paymentMethod,
    paymentStatus: fallback.paymentStatus || order.payment_status || "Order Placed",
    status: order.status || fallback.status || "Placed",
    total: Number(order.total || fallback.total || finalAmount()),
    products:(order.products || fallback.products || cart).map(item => ({
      name:item.name,
      image:item.image,
      price:String(item.price).includes("Rs.") ? item.price : formatMoney(item.price),
      quantity:Number(item.quantity || 1),
      size:item.size || ""
    })),
    couponCode:activeCoupon,
    discount:couponDiscount,
    paymentId:fallback.paymentId || ""
  };
}

function saveOrderSnapshot(orderSnapshot){
  localStorage.setItem("lastOrder", JSON.stringify(orderSnapshot));

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const existingIndex = orders.findIndex(order => {
    return (order.orderId || order.order_id) === orderSnapshot.orderId;
  });

  if(existingIndex >= 0){
    orders[existingIndex] = { ...orders[existingIndex], ...orderSnapshot };
  }else{
    orders.push(orderSnapshot);
  }

  localStorage.setItem("orders", JSON.stringify(orders));
}

function cartItemsForApi(){
  return cart.map(item => ({
    name:item.name,
    image:item.image,
    price:item.price,
    quantity:item.quantity,
    size:item.size
  }));
}

async function placeOrder(event){
  event.preventDefault();

  if(!cart.length){
    alert("Your cart is empty.");
    return;
  }

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

  cartPlaceOrderBtn.disabled = true;
  setButtonLabel("Creating Order...");

  if(window.PoojaApi?.isEnabled()){
    try{
      if(paymentMethod !== "Cash On Delivery"){
        const gatewayConfig = await window.PoojaApi.request("/api/config");

        if(!gatewayConfig.gatewayReady){
          cartPaymentNote.innerText = "Razorpay keys are not ready yet. Select Cash On Delivery or add live keys.";
          cartPlaceOrderBtn.disabled = false;
          setPaymentUi(paymentMethod);
          return;
        }
      }

      if(saveDeliveryInfo?.checked){
        localStorage.setItem("deliveryInfo", JSON.stringify(deliveryInfo));
        localStorage.setItem("customerProfile", JSON.stringify({
          name:customerName,
          phone:customerPhone,
          address:customerAddress
        }));
      }

      const orderResponse = await window.PoojaApi.createOrder({
        customerName,
        customerPhone,
        customerAddress,
        deliveryInfo,
        paymentMethod,
        couponCode:activeCoupon,
        items:cartItemsForApi()
      });

      let orderSnapshot = buildOrderSnapshot(orderResponse.order, {
        customerName,
        customerPhone,
        customerAddress,
        deliveryInfo,
        paymentMethod,
        products:cart,
        total:finalAmount(),
        paymentStatus:paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending"
      });

      saveOrderSnapshot(orderSnapshot);

      if(paymentMethod === "Cash On Delivery"){
        localStorage.removeItem("cart");
        window.location.href = "order-success.html";
        return;
      }

      setButtonLabel("Opening Payment...");
      const paymentResponse = await window.PoojaApi.createRazorpayOrder(orderResponse.order.order_id);
      const checkout = new Razorpay({
        key:paymentResponse.keyId,
        amount:paymentResponse.razorpayOrder.amount,
        currency:paymentResponse.razorpayOrder.currency,
        name:"Pooja Fashion",
        description:"Cart Order",
        order_id:paymentResponse.razorpayOrder.id,
        prefill:{
          name:customerName,
          contact:customerPhone
        },
        theme:{
          color:"#111111"
        },
        handler:async function(response){
          try{
            await window.PoojaApi.verifyRazorpayPayment({
              orderId:orderResponse.order.order_id,
              razorpay_order_id:response.razorpay_order_id,
              razorpay_payment_id:response.razorpay_payment_id,
              razorpay_signature:response.razorpay_signature
            });

            orderSnapshot = {
              ...orderSnapshot,
              paymentStatus:"Paid",
              status:"Confirmed",
              paymentId:response.razorpay_payment_id
            };
            saveOrderSnapshot(orderSnapshot);
            localStorage.removeItem("cart");
            window.location.href = "order-success.html";
          }catch(error){
            cartPaymentNote.innerText = error.message;
            cartPlaceOrderBtn.disabled = false;
            setPaymentUi(paymentMethod);
          }
        },
        modal:{
          ondismiss:function(){
            cartPlaceOrderBtn.disabled = false;
            setPaymentUi(paymentMethod);
          }
        }
      });

      checkout.open();
      return;
    }catch(error){
      cartPaymentNote.innerText = error.message;
      cartPlaceOrderBtn.disabled = false;
      setPaymentUi(paymentMethod);
      return;
    }
  }

  const orderSnapshot = buildOrderSnapshot({}, {
    orderId:"PF-" + Date.now(),
    customerName,
    customerPhone,
    customerAddress,
    deliveryInfo,
    paymentMethod,
    paymentStatus:paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Payment Selected",
    total:finalAmount(),
    products:cart
  });

  if(saveDeliveryInfo?.checked){
    localStorage.setItem("deliveryInfo", JSON.stringify(deliveryInfo));
    localStorage.setItem("customerProfile", JSON.stringify({
      name:customerName,
      phone:customerPhone,
      address:customerAddress
    }));
  }
  saveOrderSnapshot(orderSnapshot);
  localStorage.removeItem("cart");
  window.location.href = "order-success.html";
}

cartItems?.addEventListener("click", event => {
  const removeIndex = event.target.closest("[data-remove]")?.dataset.remove;
  const plusIndex = event.target.closest("[data-qty-plus]")?.dataset.qtyPlus;
  const minusIndex = event.target.closest("[data-qty-minus]")?.dataset.qtyMinus;

  if(removeIndex !== undefined) removeItem(Number(removeIndex));
  if(plusIndex !== undefined) updateQuantity(Number(plusIndex), 1);
  if(minusIndex !== undefined) updateQuantity(Number(minusIndex), -1);
});

document.getElementById("applyCouponBtn")?.addEventListener("click", applyCoupon);
cartCheckoutForm?.addEventListener("submit", placeOrder);

document.querySelectorAll(".cart-payment-options .payment-option").forEach(option => {
  option.addEventListener("click", () => {
    if(option.disabled || (isOnlineMethod(option.dataset.payment) && !isGatewayReady)){
      selectPaymentMethod("Cash On Delivery");
      return;
    }

    selectPaymentMethod(option.dataset.payment);
  });
});

document.querySelectorAll(".cart-payment-options [data-upi-app]").forEach(appChip => {
  appChip.addEventListener("click", event => {
    event.stopPropagation();

    if(!isGatewayReady){
      selectPaymentMethod("Cash On Delivery");
      return;
    }

    document.querySelectorAll(".cart-payment-options .payment-option").forEach(item => {
      item.classList.remove("active");
    });

    const upiOption = appChip.closest(".payment-option");
    upiOption?.classList.add("active");
    paymentMethodEl.value = appChip.dataset.upiApp;
    setPaymentUi(appChip.dataset.upiApp);

    if(cartPaymentNote){
      cartPaymentNote.innerText = appChip.dataset.upiApp + " will open from secure Razorpay checkout on mobile.";
    }
  });
});

fillDeliveryForm();
renderCart();
applyGatewayAvailability();
refreshGatewayStatus();
