const productImage = document.getElementById("productImage");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const oldPrice = document.getElementById("oldPrice");
const thumbGallery = document.getElementById("thumbGallery");
const relatedProducts = document.getElementById("relatedProducts");
const wishlistBtn = document.getElementById("wishlistBtn");
const addToCartBtn = document.getElementById("addToCartBtn");

const name = localStorage.getItem("productName") || "Product";
const image = localStorage.getItem("productImage") || "";
const price = localStorage.getItem("productPrice") || "₹0";
const old = localStorage.getItem("productOldPrice") || "₹11999";
const images = JSON.parse(localStorage.getItem("productImages") || "[]");

if(productImage) productImage.src = image;
if(productName) productName.innerText = name;
if(productPrice) productPrice.innerText = price;
if(oldPrice) oldPrice.innerText = old;

/* Thumbnail Gallery */
if(thumbGallery && productImage){
  thumbGallery.innerHTML = "";

  const galleryImages = images.length ? images : [image];

  galleryImages.forEach((img, index) => {
    const thumb = document.createElement("img");
    thumb.src = img;

    if(index === 0){
      thumb.classList.add("active-thumb");
    }

    thumb.onclick = function(){
      productImage.src = img;

      document.querySelectorAll(".thumb-gallery img").forEach(t => {
        t.classList.remove("active-thumb");
      });

      thumb.classList.add("active-thumb");
    };

    thumb.onmouseover = function(){
      productImage.src = img;
    };

    thumbGallery.appendChild(thumb);
  });
}

/* Big Image Open */
if(productImage){
  productImage.onclick = function(){
    if(productImage.src){
      window.open(productImage.src, "_blank");
    }
  };
}

/* Size Select */
document.querySelectorAll(".size-box button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".size-box button").forEach(b => {
      b.classList.remove("active-size");
    });

    btn.classList.add("active-size");
  });
});

/* Add To Cart */
if(addToCartBtn){
  addToCartBtn.onclick = function(){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
      name: name,
      image: productImage.src,
      price: price
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Added to Cart");
  };
}

function buyNow(){
  const checkoutUrl = "checkout.html?name=" +
    encodeURIComponent(name) +
    "&price=" +
    encodeURIComponent(price.replace(/[^\d.]/g, ""));

  window.location.href = checkoutUrl;
}

/* Wishlist */
if(wishlistBtn){
  wishlistBtn.addEventListener("click", () => {
    wishlistBtn.innerHTML = "❤️ Added to Wishlist";

    localStorage.setItem(
      "wishlist_" + name,
      JSON.stringify({ name, image, price })
    );
  });
}

/* You May Also Like */
const allProducts = JSON.parse(localStorage.getItem("allProducts") || "[]");

if(relatedProducts){
  relatedProducts.innerHTML = "";

  allProducts.forEach((product, index) => {
    relatedProducts.innerHTML += `
      <div class="product-card" onclick="openRelatedProduct(${index})">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="price-box">
          <span class="new-price">₹${product.price}</span>
        </div>
      </div>
    `;
  });
}

function openRelatedProduct(index){
  const product = allProducts[index];

  if(!product) return;

  localStorage.setItem("productName", product.name);
  localStorage.setItem("productImage", product.image);
  localStorage.setItem("productPrice", "₹" + product.price);
  localStorage.setItem("productOldPrice", "₹" + (product.oldPrice || 11999));
  localStorage.setItem("productImages", JSON.stringify(product.images || [product.image]));

  window.location.href = "product.html";
}
