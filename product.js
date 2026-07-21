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
const productAuthModal = document.getElementById("productAuthModal");
const productAuthClose = document.getElementById("productAuthClose");
const productLoginForm = document.getElementById("productLoginForm");
const productRegisterForm = document.getElementById("productRegisterForm");
const productAuthMessage = document.getElementById("productAuthMessage");
const productForgotBtn = document.getElementById("productForgotBtn");
const productForgotPanel = document.getElementById("productForgotPanel");
const productSendOtpBtn = document.getElementById("productSendOtpBtn");
const productVerifyOtpBtn = document.getElementById("productVerifyOtpBtn");
const shareProductBtn = document.getElementById("shareProductBtn");
const sizeRequiredNote = document.getElementById("sizeRequiredNote");
let pendingCheckoutUrl = "";

let name = localStorage.getItem("productName") || "Premium Designer Gown";
let image = localStorage.getItem("productImage") || "images/banner.png";
let price = normalizePriceText(localStorage.getItem("productPrice") || "Rs. 5500");
let old = normalizePriceText(localStorage.getItem("productOldPrice") || "Rs. 11999");
let images = JSON.parse(localStorage.getItem("productImages") || "[]");
let selectedSize = localStorage.getItem("productSize") || "";
let selectedQuantity = Number(localStorage.getItem("productQuantity") || 1);

function parseMoney(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return matches ? matches.join("") : "0";
}

function normalizePriceText(value){
  return "Rs. " + parseMoney(value);
}

function applyProductData(product){
  name = product.name;
  image = product.image;
  price = normalizePriceText(product.price);
  old = normalizePriceText(product.oldPrice || 11999);
  images = product.images || [product.image];

  localStorage.setItem("productName", name);
  localStorage.setItem("productImage", image);
  localStorage.setItem("productPrice", price);
  localStorage.setItem("productOldPrice", old);
  localStorage.setItem("productImages", JSON.stringify(images));
  localStorage.setItem("allProducts", JSON.stringify(POOJA_CATALOG.allProducts));
}

function initProductFromUrl(){
  const slug = new URLSearchParams(window.location.search).get("p");
  if(!slug || !window.PoojaProductUtils) return false;

  const product = PoojaProductUtils.findProductBySlug(slug);
  if(!product) return false;

  applyProductData(product);
  selectedSize = "";
  selectedQuantity = 1;
  localStorage.removeItem("productSize");
  localStorage.setItem("productQuantity", "1");
  return true;
}

function currentProductRecord(){
  return {
    name,
    image: productImage?.src || image,
    price: parseMoney(price),
    oldPrice: parseMoney(old),
    images
  };
}

function updatePageMeta(){
  const product = currentProductRecord();
  const canonicalUrl = "https://poojafashionstore.com/product.html?p=" + encodeURIComponent(product.slug || PoojaProductUtils.productSlugFromName(product.name));
  document.title = product.name + " | Pooja Fashion";

  const ogTitle = document.getElementById("ogTitle");
  const ogDescription = document.getElementById("ogDescription");
  const ogImage = document.getElementById("ogImage");
  const ogUrl = document.getElementById("ogUrl");

  if(ogTitle) ogTitle.content = product.name + " | Pooja Fashion";
  if(ogDescription){
    ogDescription.content = PoojaProductUtils.productShareText({
      name: product.name,
      price: product.price
    });
  }
  if(ogImage) ogImage.content = new URL(product.image, window.location.href).href;
  if(ogUrl) ogUrl.content = PoojaProductUtils.productShareUrl(product);
  const canonical = document.getElementById("canonicalUrl");
  if(canonical) canonical.href = canonicalUrl;
  const metaDescription = document.getElementById("metaDescription");
  if(metaDescription) metaDescription.content = product.name + " - premium designer gown at Pooja Fashion. Price Rs. " + product.price + ".";
}

function showProductImage(source){
  if(!productImage) return;

  const fallbackImage = "images/banner.png";
  productImage.onerror = () => {
    if(productImage.getAttribute("src") !== fallbackImage){
      productImage.src = fallbackImage;
    }
  };
  productImage.src = source || fallbackImage;
}

function updateBuyNowState(){
  const hasSize = Boolean(selectedSize);

  document.querySelectorAll(".buy-now-btn, .mobile-buy-now").forEach(button => {
    button.disabled = false;
    button.setAttribute("aria-disabled", "false");
    button.title = hasSize ? "" : "Please select a size first";
  });

  if(sizeRequiredNote){
    sizeRequiredNote.hidden = hasSize;
    if(!hasSize) sizeRequiredNote.innerText = "Please select a size before Buy Now.";
  }
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

function openProductAuthModal(checkoutUrl){
  pendingCheckoutUrl = checkoutUrl;
  if(productAuthMessage) productAuthMessage.innerText = "";
  if(productForgotPanel) productForgotPanel.hidden = true;
  productAuthModal?.classList.add("active");
  productAuthModal?.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("productOtpPhone")?.focus(), 50);
}

function closeProductAuthModal(){
  productAuthModal?.classList.remove("active");
  productAuthModal?.setAttribute("aria-hidden", "true");
}

function switchAuthTab(tabName){
  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.authTab === tabName);
  });

  productLoginForm?.classList.toggle("active", tabName === "login");
  productRegisterForm?.classList.toggle("active", tabName === "register");
  if(productAuthMessage) productAuthMessage.innerText = "";
}

function continuePendingCheckout(){
  window.location.href = pendingCheckoutUrl || "checkout.html";
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
    comment:"Exactly same as shown in photos. Delivery timeline was clear and packing was neat."
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

initProductFromUrl();
updatePageMeta();
window.PoojaAnalytics?.track("product_view", {
  productName:name,
  productSlug:PoojaProductUtils?.productSlugFromName(name)
});

if(productImage){
  showProductImage(image);
  productImage.alt = name;
}

if(productName) productName.innerText = name;
if(breadcrumbProductName) breadcrumbProductName.innerText = name;
if(productPrice) productPrice.innerText = price;
if(oldPrice) oldPrice.innerText = old;
setQuantity(selectedQuantity);
updateBuyNowState();

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
      showProductImage(img);

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
    updateBuyNowState();
  });
});

qtyMinus?.addEventListener("click", () => setQuantity(selectedQuantity - 1));
qtyPlus?.addEventListener("click", () => setQuantity(selectedQuantity + 1));

if(addToCartBtn){
  addToCartBtn.addEventListener("click", () => {
    window.PoojaAnalytics?.track("add_to_cart", {
      productName:name,
      productSlug:PoojaProductUtils?.productSlugFromName(name)
    });
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
  if(!selectedSize){
    if(sizeRequiredNote){
      sizeRequiredNote.hidden = false;
      sizeRequiredNote.innerText = "Please select a size before Buy Now.";
    }
    document.getElementById("sizeBox")?.scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }

  window.PoojaAnalytics?.track("buy_now", {
    productName:name,
    productSlug:PoojaProductUtils?.productSlugFromName(name)
  });

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

shareProductBtn?.addEventListener("click", async () => {
  const result = await PoojaProductUtils.shareProduct(currentProductRecord());
  if(result.ok && result.method === "clipboard"){
    PoojaProductUtils.showShareFeedback(shareProductBtn, '<i class="fas fa-check"></i> Link copied');
  }
});

async function handleRelatedShare(product, button){
  const result = await PoojaProductUtils.shareProduct(product);
  if(result.ok && result.method === "clipboard"){
    PoojaProductUtils.showShareFeedback(button, '<i class="fas fa-check"></i> Link copied');
  }
}

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

document.querySelectorAll("[data-auth-tab]").forEach(button => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

document.querySelectorAll("[data-auth-switch]").forEach(button => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authSwitch));
});

productAuthClose?.addEventListener("click", closeProductAuthModal);
productAuthModal?.addEventListener("click", event => {
  if(event.target === productAuthModal) closeProductAuthModal();
});

productForgotBtn?.addEventListener("click", () => {
  if(productForgotPanel) productForgotPanel.hidden = !productForgotPanel.hidden;
});

productLoginForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if(!window.PoojaApi?.isEnabled()){
    if(productAuthMessage) productAuthMessage.innerText = "Backend is not connected.";
    return;
  }

  try{
    if(productAuthMessage) productAuthMessage.innerText = "Logging in...";
    await window.PoojaApi.login({
      identifier: document.getElementById("productLoginIdentifier").value.trim(),
      password: document.getElementById("productLoginPassword").value
    });
    if(productAuthMessage) productAuthMessage.innerText = "Login successful. Opening checkout...";
    continuePendingCheckout();
  }catch(error){
    if(productAuthMessage) productAuthMessage.innerText = error.message;
  }
});

productRegisterForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if(!window.PoojaApi?.isEnabled()){
    if(productAuthMessage) productAuthMessage.innerText = "Backend is not connected.";
    return;
  }

  try{
    if(productAuthMessage) productAuthMessage.innerText = "Creating account...";
    await window.PoojaApi.register({
      name: document.getElementById("productRegisterName").value.trim(),
      phone: document.getElementById("productRegisterPhone").value.trim(),
      email: document.getElementById("productRegisterEmail").value.trim(),
      password: document.getElementById("productRegisterPassword").value,
      address: ""
    });
    if(productAuthMessage) productAuthMessage.innerText = "Account created. Opening checkout...";
    continuePendingCheckout();
  }catch(error){
    if(productAuthMessage) productAuthMessage.innerText = error.message;
  }
});

productSendOtpBtn?.addEventListener("click", async () => {
  if(!window.PoojaApi?.isEnabled()){
    if(productAuthMessage) productAuthMessage.innerText = "Backend is not connected.";
    return;
  }

  try{
    if(productAuthMessage) productAuthMessage.innerText = "Sending OTP...";
    const response = await window.PoojaApi.sendOtp({
      phone: document.getElementById("productOtpPhone").value.trim(),
      purpose: "checkout"
    });
    if(productAuthMessage){
      productAuthMessage.innerText = response.devOtp
        ? response.message + " Testing OTP: " + response.devOtp
        : response.message;
    }
  }catch(error){
    if(productAuthMessage) productAuthMessage.innerText = error.message;
  }
});

productVerifyOtpBtn?.addEventListener("click", async () => {
  if(!window.PoojaApi?.isEnabled()){
    if(productAuthMessage) productAuthMessage.innerText = "Backend is not connected.";
    return;
  }

  try{
    if(productAuthMessage) productAuthMessage.innerText = "Verifying OTP...";
    await window.PoojaApi.verifyOtp({
      phone: document.getElementById("productOtpPhone").value.trim(),
      otp: document.getElementById("productOtpCode").value.trim()
    });
    if(productAuthMessage) productAuthMessage.innerText = "OTP verified. Opening checkout...";
    continuePendingCheckout();
  }catch(error){
    if(productAuthMessage) productAuthMessage.innerText = error.message;
  }
});

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

const allProducts = JSON.parse(localStorage.getItem("allProducts") || "[]").length
  ? JSON.parse(localStorage.getItem("allProducts") || "[]")
  : (POOJA_CATALOG?.allProducts || []);

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
            <p class="delivery-timeline"><i class="fas fa-truck-fast"></i> Delivery in 10 days</p>
            <div class="product-card-actions">
              <button type="button" class="card-share-btn related-share-btn" data-related-index="${index}" aria-label="Share ${product.name}">
                <i class="fas fa-share-nodes"></i> Share
              </button>
              <button type="button" class="card-buy-btn">View Details</button>
            </div>
          </div>
        </article>
      `;
    });

  relatedProducts.querySelectorAll("[data-related-index]").forEach((card, index) => {
    card.addEventListener("click", event => {
      if(event.target.closest(".related-share-btn")) return;
      const product = allProducts.filter(item => item.name !== name).slice(0, 8)[index];
      openRelatedProduct(product);
    });
  });

  relatedProducts.querySelectorAll(".related-share-btn").forEach((button, index) => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const product = allProducts.filter(item => item.name !== name).slice(0, 8)[index];
      handleRelatedShare(product, button);
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

  window.location.href = "product.html?p=" + encodeURIComponent(product.slug || PoojaProductUtils.productSlugFromName(product.name));
}
