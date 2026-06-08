const params = new URLSearchParams(window.location.search);

const productName = params.get("name") || localStorage.getItem("productName") || "Product";
const rawPrice = params.get("price") || localStorage.getItem("productPrice") || "0";
const productPrice = rawPrice.replace(/[^\d.]/g, "") || "0";
const productImage = localStorage.getItem("productImage") || "";
const merchantUpiId = "YOUR_UPI_ID@BANK";
const merchantName = "Pooja Fashion";
const hasUpiId = merchantUpiId !== "YOUR_UPI_ID@BANK";

const productNameEl = document.getElementById("productName");
const productPriceEl = document.getElementById("productPrice");
const finalTotalEl = document.getElementById("finalCheckoutTotal");
const productImageEl = document.getElementById("checkoutProductImage");
const paymentMethodEl = document.getElementById("paymentMethod");
const paymentNoteEl = document.getElementById("paymentNote");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const merchantUpiText = document.getElementById("merchantUpiText");

if(productNameEl) productNameEl.innerText = productName;
if(productPriceEl) productPriceEl.innerText = productPrice;
if(finalTotalEl) finalTotalEl.innerText = productPrice;

if(productImageEl){
  if(productImage){
    productImageEl.src = productImage;
  }else{
    productImageEl.style.display = "none";
  }
}

if(paymentMethodEl) paymentMethodEl.value = "PhonePe";
if(placeOrderBtn) placeOrderBtn.innerText = "Pay & Place Order";
if(merchantUpiText){
  merchantUpiText.innerText = !hasUpiId
    ? "UPI ID not added"
    : merchantUpiId;
}
if(paymentNoteEl && !hasUpiId){
  paymentNoteEl.innerText = "PhonePe is selected. Add shop UPI ID to accept online payment.";
}

document.querySelectorAll(".payment-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".payment-option").forEach(item => {
      item.classList.remove("active");
    });

    option.classList.add("active");
    paymentMethodEl.value = option.dataset.payment;

    const isUpiPayment = option.dataset.payment !== "Cash On Delivery";
    placeOrderBtn.innerText = isUpiPayment ? "Pay & Place Order" : "Place COD Order";
    paymentNoteEl.innerText = isUpiPayment && !hasUpiId
      ? "This option is selected. Add shop UPI ID to accept online payment."
      : isUpiPayment
      ? "You will be redirected to your UPI app to complete payment."
      : "Pay in cash when your order is delivered.";
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

function placeOrder(event) {
  if(event) event.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const customerAddress = document.getElementById("customerAddress").value.trim();
  const paymentMethod = paymentMethodEl.value;

  if(!customerName || !customerPhone || !customerAddress || !paymentMethod){
    alert("Please fill all details.");
    return;
  }

  if(!/^[6-9]\d{9}$/.test(customerPhone)){
    alert("Please enter a valid 10 digit mobile number.");
    return;
  }

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const isUpiPayment = paymentMethod !== "Cash On Delivery";

  if(isUpiPayment && !hasUpiId){
    paymentNoteEl.innerText = "Online payment is selected, but shop UPI ID is not added yet.";
    document.getElementById("upiIdBox").scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }

  orders.push({
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    paymentStatus: isUpiPayment ? "Payment Started" : "Cash On Delivery",
    products: [{
      name: productName,
      image: productImage,
      price: "Rs. " + productPrice
    }]
  });

  localStorage.setItem("orders", JSON.stringify(orders));

  if(isUpiPayment){
    window.location.href = buildUpiPaymentUrl(paymentMethod);
    setTimeout(() => {
      window.location.href = "order-success.html";
    }, 1200);
    return;
  }

  window.location.href = "order-success.html";
}
