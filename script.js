const products = POOJA_CATALOG.products;
const maternityProducts = POOJA_CATALOG.maternityProducts;
const allProducts = POOJA_CATALOG.allProducts;
let activeFilter = "all";
let activeSort = "featured";
let searchTerm = "";
let quickViewProduct = null;

localStorage.setItem("allProducts", JSON.stringify(allProducts));

function openProductFromData(product){
  localStorage.setItem("productName", product.name);
  localStorage.setItem("productImage", product.image);
  localStorage.setItem("productPrice", "Rs. " + product.price);
  localStorage.setItem("productOldPrice", "Rs. " + product.oldPrice);
  localStorage.setItem("productImages", JSON.stringify(product.images));
  localStorage.removeItem("productSize");
  localStorage.setItem("productQuantity", "1");
  window.location.href = "product.html?p=" + encodeURIComponent(product.slug);
}

async function handleProductShare(product, button){
  const result = await PoojaProductUtils.shareProduct(product);
  if(result.ok && result.method === "clipboard"){
    PoojaProductUtils.showShareFeedback(button, '<i class="fas fa-check"></i> Link copied');
  }
}

function discountPercent(product){
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function productMatches(product){
  const filterMatch =
    activeFilter === "all" ||
    activeFilter === "sale" ||
    product.category === activeFilter ||
    product.color === activeFilter ||
    product.name.toLowerCase().includes(activeFilter);

  const searchMatch =
    !searchTerm ||
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.includes(searchTerm) ||
    product.color.includes(searchTerm);

  return filterMatch && searchMatch;
}

function sortedProducts(list){
  const sorted = [...list];

  if(activeSort === "price-low") sorted.sort((a, b) => a.price - b.price);
  if(activeSort === "price-high") sorted.sort((a, b) => b.price - a.price);
  if(activeSort === "name-az") sorted.sort((a, b) => a.name.localeCompare(b.name));

  return sorted;
}

function renderProducts(){
  const container = document.getElementById("productList");
  const productCount = document.getElementById("productCount");
  if(!container) return;

  const visibleProducts = sortedProducts(allProducts.filter(productMatches));
  container.innerHTML = "";

  if(productCount){
    productCount.innerText = visibleProducts.length + " products";
  }

  if(!visibleProducts.length){
    container.innerHTML = `<p class="empty-products">No products found.</p>`;
    return;
  }

  visibleProducts.forEach((product, index) => {
    container.innerHTML += `
      <article class="product-card premium-card" data-index="${allProducts.indexOf(product)}">
        <div class="product-media">
          <div class="product-badges">
            ${product.badges.map(badge => `<span>${badge}</span>`).join("")}
          </div>
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <button type="button" class="quick-view-btn" data-index="${allProducts.indexOf(product)}">Quick view</button>
        </div>
        <div class="product-card-info">
          <p class="product-rating">5.0 reviews</p>
          <h3>${product.name}</h3>
          <div class="price-box">
            <span class="new-price">Rs. ${product.price}</span>
            <span class="old-price">Rs. ${product.oldPrice}</span>
            <span class="discount">${discountPercent(product)}% off</span>
          </div>
          <p class="delivery-timeline"><i class="fas fa-truck-fast"></i> Delivery in 10 days</p>
          <div class="product-card-actions">
            <button type="button" class="card-share-btn" data-index="${allProducts.indexOf(product)}" aria-label="Share ${product.name}">
              <i class="fas fa-share-nodes"></i> Share
            </button>
            <button type="button" class="card-buy-btn" data-index="${allProducts.indexOf(product)}">View Details</button>
          </div>
        </div>
      </article>
    `;
  });

  container.querySelectorAll(".premium-card").forEach(card => {
    card.addEventListener("click", event => {
      if(event.target.closest("button")) return;
      openProductFromData(allProducts[Number(card.dataset.index)]);
    });
  });

  container.querySelectorAll(".card-buy-btn").forEach(button => {
    button.addEventListener("click", () => {
      openProductFromData(allProducts[Number(button.dataset.index)]);
    });
  });

  container.querySelectorAll(".card-share-btn").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      handleProductShare(allProducts[Number(button.dataset.index)], button);
    });
  });

  container.querySelectorAll(".quick-view-btn").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      openQuickView(allProducts[Number(button.dataset.index)]);
    });
  });
}

function renderTrending(){
  const trendingList = document.getElementById("trendingList");
  if(!trendingList) return;

  const featured = [...products.slice(0, 5), ...maternityProducts.slice(0, 5)];
  trendingList.innerHTML = "";

  [...featured, ...featured].forEach(product => {
    trendingList.innerHTML += `
      <div class="trending-card" data-index="${allProducts.indexOf(product)}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <div class="price-box">
          <span class="new-price">Rs. ${product.price}</span>
        </div>
        <p class="delivery-timeline compact"><i class="fas fa-truck-fast"></i> 10 days delivery</p>
      </div>
    `;
  });

  trendingList.querySelectorAll(".trending-card").forEach(card => {
    card.addEventListener("click", () => {
      openProductFromData(allProducts[Number(card.dataset.index)]);
    });
  });
}

function setFilter(filter){
  activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderProducts();
  document.getElementById("shop")?.scrollIntoView({ behavior:"smooth" });
}

function filterProducts(category){
  setFilter(category.toLowerCase());
}

function toggleMenu(){
  document.querySelector(".nav")?.classList.toggle("active");
}

function openQuickView(product){
  quickViewProduct = product;
  document.getElementById("quickViewImage").src = product.image;
  document.getElementById("quickViewImage").alt = product.name;
  document.getElementById("quickViewName").innerText = product.name;
  document.getElementById("quickViewPrice").innerText = "Rs. " + product.price;
  document.getElementById("quickViewModal").classList.add("active");
  document.getElementById("quickViewModal").setAttribute("aria-hidden", "false");
}

function closeQuickView(){
  document.getElementById("quickViewModal").classList.remove("active");
  document.getElementById("quickViewModal").setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    setFilter(button.dataset.filter);
  });
});

document.getElementById("sortSelect")?.addEventListener("change", event => {
  activeSort = event.target.value;
  renderProducts();
});

document.getElementById("searchInput")?.addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
});

document.getElementById("filterToggle")?.addEventListener("click", () => {
  document.getElementById("filterPanel")?.classList.toggle("active");
});

document.getElementById("quickViewOpen")?.addEventListener("click", () => {
  if(quickViewProduct) openProductFromData(quickViewProduct);
});

document.getElementById("quickViewShare")?.addEventListener("click", async () => {
  if(!quickViewProduct) return;
  const button = document.getElementById("quickViewShare");
  await handleProductShare(quickViewProduct, button);
});

document.getElementById("quickViewModal")?.addEventListener("click", event => {
  if(event.target.id === "quickViewModal") closeQuickView();
});

document.getElementById("quickViewClose")?.addEventListener("click", closeQuickView);

document.getElementById("mobileMenuBtn")?.addEventListener("click", toggleMenu);

document.querySelector(".newsletter-band form")?.addEventListener("submit", event => {
  event.preventDefault();
  const input = event.currentTarget.querySelector("input");
  if(input) input.value = "";
  alert("Thank you for subscribing to Dipali Fashion updates.");
});

function updateCartCount(){
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cartCount");
  if(cartCount) cartCount.innerText = cart.length;
}

function startMobileOfferMarquee(){
  const track = document.querySelector(".offer-track");
  if(!track) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");
  let frameId = null;
  let position = 0;
  let lastTime = 0;
  let loopWidth = 0;
  let cloned = false;

  function stop(){
    if(frameId) cancelAnimationFrame(frameId);
    frameId = null;
    track.style.transform = "";
  }

  function step(time){
    if(!lastTime) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;
    position -= delta * 0.045;

    if(loopWidth && Math.abs(position) >= loopWidth){
      position = 0;
    }

    track.style.transform = "translateX(" + position + "px)";
    frameId = requestAnimationFrame(step);
  }

  function start(){
    stop();

    if(!mobileQuery.matches){
      lastTime = 0;
      return;
    }

    if(!cloned){
      track.innerHTML = track.innerHTML + track.innerHTML;
      cloned = true;
    }

    loopWidth = Math.max(1, track.scrollWidth / 2);
    position = 0;
    lastTime = 0;
    track.style.willChange = "transform";
    frameId = requestAnimationFrame(step);
  }

  mobileQuery.addEventListener?.("change", start);
  window.addEventListener("resize", start);
  start();
}

renderProducts();
renderTrending();
updateCartCount();
startMobileOfferMarquee();
