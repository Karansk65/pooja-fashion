const galleryImages = image => [image, image, image];

const products = [
  { name:"Black Princess Gown", oldPrice:11999, price:5500, image:"images/orange-black-.png.png", images:galleryImages("images/orange-black-.png.png") },
  { name:"Sky Blue Princess Gown", oldPrice:11999, price:5500, image:"images/orange-blue.png.png", images:galleryImages("images/orange-blue.png.png") },
  { name:"Chocolate Brown Princess Gown", oldPrice:11999, price:5500, image:"images/orange-brown.png.png", images:galleryImages("images/orange-brown.png.png") },
  { name:"Orange Princess Gown", oldPrice:11999, price:5500, image:"images/orange-dress.png.png", images:galleryImages("images/orange-dress.png.png") },
  { name:"Emerald Green Princess Gown", oldPrice:11999, price:5500, image:"images/orange-green.png.png", images:galleryImages("images/orange-green.png.png") },
  { name:"Wine Red Princess Gown", oldPrice:11999, price:5500, image:"images/orange-red.png.png", images:galleryImages("images/orange-red.png.png") },
  { name:"White Princess Gown", oldPrice:11999, price:5500, image:"images/orange-white.png.png", images:galleryImages("images/orange-white.png.png") },
  { name:"Yellow Princess Gown", oldPrice:11999, price:5500, image:"images/yellow-1.png", images:["images/yellow-1.png","images/yellow-2.png","images/yellow-3.png"] }
];

const maternityProducts = [
  { name:"Royal Blue Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-blue.png", images:galleryImages("images/maternity-blue.png") },
  { name:"Orange Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-orange.png", images:galleryImages("images/maternity-orange.png") },
  { name:"White Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-white.png", images:galleryImages("images/maternity-white.png") },
  { name:"Black Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-black.png", images:galleryImages("images/maternity-black.png") },
  { name:"Mint Green Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-green.png", images:galleryImages("images/maternity-green.png") },
  { name:"Parrot Green Maternity Gown", oldPrice:11999, price:6500, image:"images/parrot.png", images:galleryImages("images/parrot.png") },
  { name:"Dark Red Maternity Gown", oldPrice:11999, price:6500, image:"images/darkred.png", images:galleryImages("images/darkred.png") },
  { name:"Faint Green Maternity Gown", oldPrice:11999, price:6500, image:"images/faintgreen.png", images:galleryImages("images/faintgreen.png") },
  { name:"Yellow Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-yellow.png", images:galleryImages("images/maternity-yellow.png") },
  { name:"Red Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-red.png", images:galleryImages("images/maternity-red.png") }
];

const allProducts = [...products, ...maternityProducts];
localStorage.setItem("allProducts", JSON.stringify(allProducts));

function openProductFromData(product){
  localStorage.setItem("productName", product.name);
  localStorage.setItem("productImage", product.image);
  localStorage.setItem("productPrice", "₹" + product.price);
  localStorage.setItem("productOldPrice", "₹" + product.oldPrice);
  localStorage.setItem("productImages", JSON.stringify(product.images));
  window.location.href = "product.html";
}

function renderProducts(list, containerId){
  const container = document.getElementById(containerId);
  if(!container) return;

  container.innerHTML = "";

  list.forEach(product => {
    container.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="price-box">
          <div class="discount">54% OFF</div>
          <span class="old-price">₹${product.oldPrice}</span>
          <span class="new-price">₹${product.price}</span>
        </div>
      </div>
    `;
  });

  container.querySelectorAll(".product-card").forEach((card, index) => {
    card.onclick = () => openProductFromData(list[index]);
  });
}

renderProducts(products, "productList");

const trendingList = document.getElementById("trendingList");
if(trendingList){
  trendingList.innerHTML = "";
  [...products, ...products].forEach(product => {
    trendingList.innerHTML += `
      <div class="trending-card">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="price-box">
          <span class="new-price">₹${product.price}</span>
        </div>
      </div>
    `;
  });

  trendingList.querySelectorAll(".trending-card").forEach((card, index) => {
    card.onclick = () => openProductFromData(products[index % products.length]);
  });
}
document.querySelectorAll(".maternity-section .product-card").forEach((card, index) => {
  card.onclick = function(){
    openProductFromData(maternityProducts[index]);
  };
});
function toggleMenu(){
  document.querySelector(".nav").classList.toggle("active");
}
function filterProducts(category){

  const cards = document.querySelectorAll(".product-card");

  cards.forEach(card => {

    const name = card.querySelector("h3").innerText.toLowerCase();

    if(category === "all"){
      card.style.display = "block";
    }
    else if(name.includes(category)){
      card.style.display = "block";
    }
    else{
      card.style.display = "none";
    }

  });
}
function filterProducts(category){
  const shop = document.getElementById("shop");
  if(shop){
    shop.scrollIntoView({ behavior:"smooth" });
  }

  const cards = document.querySelectorAll(".product-card, .trending-card");

  cards.forEach(card => {
    const name = card.querySelector("h3")?.innerText.toLowerCase();

    if(category === "all"){
      card.style.display = "block";
    }
    else if(name && name.includes(category.toLowerCase())){
      card.style.display = "block";
    }
    else{
      card.style.display = "none";
    }
  });
}
const addToCartBtn = document.getElementById("addToCartBtn");

if(addToCartBtn){

  addToCartBtn.onclick = function(){

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
      name:name,
      image:image,
      price:price
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Added to Cart");
  };

}
function updateCartCount(){
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cartCount");

  if(cartCount){
    cartCount.innerText = cart.length;
  }
}

updateCartCount();
