const products = [
  { name: "Black Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-black-.png.png" },
  { name: "Sky Blue Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-blue.png.png" },
  { name: "Chocolate Brown Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-brown.png.png" },
  { name: "Orange Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-dress.png.png" },
  { name: "Emerald Green Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-green.png.png" },
  { name: "Wine Red Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-red.png.png" },
  { name: "White Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-white.png.png" },
  { name: "Yellow Princess Gown", oldPrice: 11999, price: 5500, image: "images/orange-yellow.png.png" }
];

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id")) || 0;
const product = products[id];

document.getElementById("productImage").src = product.image;
document.getElementById("productName").innerText = product.name;
document.getElementById("oldPrice").innerText = "₹" + product.oldPrice;
document.getElementById("productPrice").innerText = "₹" + product.price;

document.getElementById("checkoutBtn").addEventListener("click", function(){
  window.location.href = `checkout.html?name=${encodeURIComponent(product.name)}&price=${product.price}`;
});

const relatedProducts = document.getElementById("relatedProducts");

products.forEach((item, index) => {
  if(index !== id){
    relatedProducts.innerHTML += `
      <div class="product-card">
        <a href="product.html?id=${index}">
          <img src="${item.image}" alt="${item.name}">
        </a>

        <div class="product-info">
          <h3>${item.name}</h3>

          <div class="price-box">
            <div class="discount">54% OFF</div>
            <span class="old-price">₹${item.oldPrice}</span>
            <span class="new-price">₹${item.price}</span>
          </div>
        </div>
      </div>
    `;
  }
});