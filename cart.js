const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let total = 0;
let couponDiscount = 0;

function showCart(){
  cartItems.innerHTML = "";
  total = 0;

  if(cart.length === 0){
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.innerText = "₹0";
    updateSummary();
    return;
  }

  cart.forEach((item, index) => {
    const priceNumber = Number(item.price.replace("₹",""));
    total += priceNumber;

    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}">
        <div>
          <h3>${item.name}</h3>
          <p>${item.price}</p>
          <button onclick="removeItem(${index})">Remove</button>
        </div>
      </div>
    `;
  });

  cartTotal.innerText = "₹" + total;
  updateSummary();
}

function removeItem(index){
  cart.splice(index,1);
  localStorage.setItem("cart", JSON.stringify(cart));
  showCart();
}

function applyCoupon(){
  const code = document.getElementById("couponCode").value.trim().toUpperCase();

  if(code === "POOJA500" && total >= 6500){
    couponDiscount = 500;
    alert("Coupon Applied ₹500 OFF");
  }else{
    couponDiscount = 0;
    alert("Coupon not valid for this order");
  }

  updateSummary();
}

function updateSummary(){
  const productsTotal = document.getElementById("productsTotal");
  const discountAmount = document.getElementById("discountAmount");
  const finalTotal = document.getElementById("finalTotal");

  if(productsTotal) productsTotal.innerText = "₹" + total;
  if(discountAmount) discountAmount.innerText = "₹" + couponDiscount;
  if(finalTotal) finalTotal.innerText = "₹" + (total - couponDiscount);
}

function placeOrder(){
  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const address = document.getElementById("customerAddress").value;
  const payment = document.getElementById("paymentMethod").value;

  if(!name || !phone || !address || !payment){
    alert("Please fill all details");
    return;
  }

  alert("Order placed successfully!");
  localStorage.removeItem("cart");
  window.location.href = "order-success.html";
}

showCart();