const productImage = document.getElementById("productImage");
const productName = document.getElementById("productName");
const breadcrumbProductName = document.getElementById("breadcrumbProductName");
const productPrice = document.getElementById("productPrice");
const oldPrice = document.getElementById("oldPrice");
const thumbGallery = document.getElementById("thumbGallery");
const relatedProducts = document.getElementById("relatedProducts");
const wishlistBtn = document.getElementById("wishlistBtn");
const addToCartBtn = document.getElementById("addToCartBtn");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const productQty = document.getElementById("productQty");
const sizeGuideBtn = document.getElementById("sizeGuideBtn");
const sizePopup = document.getElementById("sizePopup");
const closeSizeGuide = document.getElementById("closeSizeGuide");
const backToTopBtn = document.getElementById("backToTopBtn");
const productMenuToggle = document.getElementById("productMenuToggle");
const productHeader = document.querySelector(".premium-product-header");
const productHeaderNav = document.getElementById("productHeaderNav");
const reviewGrid = document.getElementById("reviewGrid");
const reviewForm = document.getElementById("reviewForm");
const reviewName = document.getElementById("reviewName");
const reviewRating = document.getElementById("reviewRating");
const reviewComment = document.getElementById("reviewComment");
const reviewMessage = document.getElementById("reviewMessage");

const name = localStorage.getItem("productName") || "Premium Designer Gown";
const image = localStorage.getItem("productImage") || "images/banner.png";
const price = normalizePriceText(localStorage.getItem("productPrice") || "Rs. 5500");
const old = normalizePriceText(localStorage.getItem("productOldPrice") || "Rs. 11999");
const images = JSON.parse(localStorage.getItem("productImages") || "[]");
let selectedSize = localStorage.getItem("productSize") || "";
let selectedQuantity = Number(localStorage.getItem("productQuantity") || 1);

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return matches ? matches.join("") : "0";
}

function normalizePriceText(value){
  return "Rs. " + parseMoney(value);
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setQuantity(value){
  selectedQuantity = Math.max(1, Math.min(10, Number(value) || 1));
  localStorage.setItem("productQuantity", String(selectedQuantity));
  if(productQty) productQty.innerText = selectedQuantity;
}

function currentProductPayload(){
  return {
    name,
    image: productImage?.src || image,
    price,
    oldPrice: old,
    size: selectedSize,
    quantity: selectedQuantity
  };
}

const defaultReviews = [
  {
    customerName:"Priya S.",
    rating:5,
    comment:"Beautiful gown. Fabric quality is amazing and perfect for photoshoots."
  },
  {
    customerName:"Sneha K.",
    rating:5,
    comment:"Exactly same as shown in photos. Delivery was fast and packing was neat."
  },
  {
    customerName:"Aarti P.",
    rating:5,
    comment:"Very premium look and comfortable fitting for my event."
  }
];

function localReviewKey(){
  return "reviews_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function readLocalReviews(){
  return JSON.parse(localStorage.getItem(localReviewKey()) || "[]");
}

function saveLocalReview(review){
  const reviews = readLocalReviews();
  reviews.unshift(review);
  localStorage.setItem(localReviewKey(), JSON.stringify(reviews.slice(0, 30)));
}

function renderReviews(reviews){
  if(!reviewGrid) return;

  const visibleReviews = (reviews && reviews.length ? reviews : defaultReviews).slice(0, 9);

  reviewGrid.innerHTML = visibleReviews.map(review => {
    const rating = Number(review.rating || 5).toFixed(1);
    return `
      <div class="review-card">
        <strong>${rating}</strong>
        <p>${escapeHtml(review.comment)}</p>
        <h4>- ${escapeHtml(review.customerName || review.customer_name || "Customer")}</h4>
      </div>
    `;
  }).join("");
}

async function loadReviews(){
  const localReviews = readLocalReviews();

  try{
    if(window.PoojaApi?.isEnabled()){
      const response = await window.PoojaApi.request(
        "/api/reviews?productName=" + encodeURIComponent(name)
      );

      renderReviews([...(response.reviews || []), ...localReviews]);
      return;
    }
  }catch(error){
    console.warn(error.message);
  }

  renderReviews(localReviews);
}

if(productImage){
  productImage.src = image;
  productImage.alt = name;
}

if(productName) productName.innerText = name;
if(breadcrumbProductName) breadcrumbProductName.innerText = name;
if(productPrice) productPrice.innerText = price;
if(oldPrice) oldPrice.innerText = old;
setQuantity(selectedQuantity);

if(thumbGallery && productImage){
  thumbGallery.innerHTML = "";

  const galleryImages = images.length ? images : [image];

  galleryImages.forEach((img, index) => {
    const thumb = document.createElement("img");
    thumb.src = img;
    thumb.alt = name + " view " + (index + 1);

    if(index === 0){
      thumb.classList.add("active-thumb");
    }

    thumb.addEventListener("click", () => {
      productImage.src = img;

      document.querySelectorAll(".thumb-gallery img").forEach(item => {
        item.classList.remove("active-thumb");
      });

      thumb.classList.add("active-thumb");
    });

    thumbGallery.appendChild(thumb);
  });
}

document.querySelectorAll(".size-box button").forEach(button => {
  if(button.innerText.trim() === selectedSize){
    button.classList.add("active-size");
  }

  button.addEventListener("click", () => {
    document.querySelectorAll(".size-box button").forEach(item => {
      item.classList.remove("active-size");
    });

    button.classList.add("active-size");
    selectedSize = button.innerText.trim();
    localStorage.setItem("productSize", selectedSize);
  });
});

qtyMinus?.addEventListener("click", () => setQuantity(selectedQuantity - 1));
qtyPlus?.addEventListener("click", () => setQuantity(selectedQuantity + 1));

if(addToCartBtn){
  addToCartBtn.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(currentProductPayload());
    localStorage.setItem("cart", JSON.stringify(cart));
    addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added To Cart';

    setTimeout(() => {
      addToCartBtn.innerHTML = '<i class="fas fa-bag-shopping"></i> Add To Cart';
    }, 1400);
  });
}

function buyNow(){
  localStorage.setItem("productName", name);
  localStorage.setItem("productImage", productImage?.src || image);
  localStorage.setItem("productPrice", price);
  localStorage.setItem("productOldPrice", old);
  localStorage.setItem("productSize", selectedSize);
  localStorage.setItem("productQuantity", String(selectedQuantity));

  const checkoutUrl = "checkout.html?name=" +
    encodeURIComponent(name) +
    "&price=" +
    encodeURIComponent(parseMoney(price));

  window.location.href = checkoutUrl;
}

document.querySelectorAll(".buy-now-btn, .mobile-buy-now").forEach(button => {
  button.addEventListener("click", buyNow);
});

document.querySelectorAll(".mobile-add-cart").forEach(button => {
  button.addEventListener("click", () => {
    if(addToCartBtn) addToCartBtn.click();
  });
});

if(wishlistBtn){
  wishlistBtn.addEventListener("click", () => {
    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Added to Wishlist';

    localStorage.setItem(
      "wishlist_" + name,
      JSON.stringify(currentProductPayload())
    );
  });
}

sizeGuideBtn?.addEventListener("click", () => {
  if(sizePopup) sizePopup.style.display = "block";
});

closeSizeGuide?.addEventListener("click", () => {
  if(sizePopup) sizePopup.style.display = "none";
});

sizePopup?.addEventListener("click", event => {
  if(event.target === sizePopup){
    sizePopup.style.display = "none";
  }
});

backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top:0, behavior:"smooth" });
});

productMenuToggle?.addEventListener("click", () => {
  const isOpen = productHeader?.classList.toggle("menu-open");
  productMenuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  productMenuToggle.innerHTML = isOpen
    ? '<i class="fas fa-xmark"></i>'
    : '<i class="fas fa-bars"></i>';
});

productHeaderNav?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    productHeader?.classList.remove("menu-open");
    productMenuToggle?.setAttribute("aria-expanded", "false");
    if(productMenuToggle){
      productMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });
});

if(reviewForm){
  reviewForm.addEventListener("submit", async event => {
    event.preventDefault();

    const customerName = reviewName.value.trim();
    const rating = Number(reviewRating.value || 5);
    const comment = reviewComment.value.trim();

    if(!customerName || comment.length < 8){
      reviewMessage.innerText = "Please add your name and a proper review.";
      return;
    }

    const reviewPayload = {
      productName:name,
      productImage:productImage?.src || image,
      customerName,
      rating,
      comment
    };

    reviewMessage.innerText = "Saving review...";

    try{
      if(window.PoojaApi?.isEnabled()){
        const response = await window.PoojaApi.request("/api/reviews", {
          method:"POST",
          body:JSON.stringify(reviewPayload)
        });

        reviewForm.reset();
        reviewMessage.innerText = "Thank you. Your review has been added.";
        renderReviews([response.review, ...readLocalReviews()]);
        return;
      }
    }catch(error){
      console.warn(error.message);
    }

    saveLocalReview(reviewPayload);
    reviewForm.reset();
    reviewMessage.innerText = "Thank you. Your review has been added.";
    loadReviews();
  });
}

loadReviews();

const allProducts = JSON.parse(localStorage.getItem("allProducts") || "[]");

if(relatedProducts){
  relatedProducts.innerHTML = "";

  allProducts
    .filter(product => product.name !== name)
    .slice(0, 8)
    .forEach((product, index) => {
      relatedProducts.innerHTML += `
        <article class="product-card premium-card" data-related-index="${index}">
          <div class="product-media">
            <div class="product-badges">
              <span>New</span>
            </div>
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="product-card-info">
            <p class="product-rating">5.0 reviews</p>
            <h3>${product.name}</h3>
            <div class="price-box">
              <span class="new-price">Rs. ${product.price}</span>
              <span class="old-price">Rs. ${product.oldPrice || 11999}</span>
            </div>
            <button type="button" class="card-buy-btn">View Details</button>
          </div>
        </article>
      `;
    });

  relatedProducts.querySelectorAll("[data-related-index]").forEach((card, index) => {
    card.addEventListener("click", () => {
      const product = allProducts.filter(item => item.name !== name).slice(0, 8)[index];
      openRelatedProduct(product);
    });
  });
}

function openRelatedProduct(product){
  if(!product) return;

  localStorage.setItem("productName", product.name);
  localStorage.setItem("productImage", product.image);
  localStorage.setItem("productPrice", "Rs. " + product.price);
  localStorage.setItem("productOldPrice", "Rs. " + (product.oldPrice || 11999));
  localStorage.setItem("productImages", JSON.stringify(product.images || [product.image]));
  localStorage.removeItem("productSize");
  localStorage.setItem("productQuantity", "1");

  window.location.href = "product.html";
}
