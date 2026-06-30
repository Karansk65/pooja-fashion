const galleryImages = image => [image, image, image];

const products = [
  { name:"Black Princess Gown", oldPrice:11999, price:5500, image:"images/orange-black-.png.png", images:galleryImages("images/orange-black-.png.png"), category:"princess", color:"black", badges:["Sale", "Bestseller"] },
  { name:"Sky Blue Princess Gown", oldPrice:11999, price:5500, image:"images/orange-blue.png.png", images:galleryImages("images/orange-blue.png.png"), category:"princess", color:"blue", badges:["Sale", "Ready to Ship"] },
  { name:"Chocolate Brown Princess Gown", oldPrice:11999, price:5500, image:"images/orange-brown.png.png", images:galleryImages("images/orange-brown.png.png"), category:"princess", color:"brown", badges:["Sale"] },
  { name:"Orange Princess Gown", oldPrice:11999, price:5500, image:"images/orange-dress.png.png", images:galleryImages("images/orange-dress.png.png"), category:"princess", color:"orange", badges:["Sale", "New"] },
  { name:"Emerald Green Princess Gown", oldPrice:11999, price:5500, image:"images/orange-green.png.png", images:galleryImages("images/orange-green.png.png"), category:"princess", color:"green", badges:["Sale"] },
  { name:"Wine Red Princess Gown", oldPrice:11999, price:5500, image:"images/orange-red.png.png", images:galleryImages("images/orange-red.png.png"), category:"princess", color:"red", badges:["Sale", "Ready to Ship"] },
  { name:"White Princess Gown", oldPrice:11999, price:5500, image:"images/orange-white.png.png", images:galleryImages("images/orange-white.png.png"), category:"princess", color:"white", badges:["Sale", "New"] },
  { name:"Yellow Princess Gown", oldPrice:11999, price:5500, image:"images/yellow-1.png", images:["images/yellow-1.png","images/yellow-2.png","images/yellow-3.png"], category:"princess", color:"yellow", badges:["Sale", "Bestseller"] }
];

const maternityProducts = [
  { name:"Royal Blue Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-blue.png", images:galleryImages("images/maternity-blue.png"), category:"maternity", color:"blue", badges:["New"] },
  { name:"Orange Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-orange.png", images:galleryImages("images/maternity-orange.png"), category:"maternity", color:"orange", badges:["Ready to Ship"] },
  { name:"White Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-white.png", images:galleryImages("images/maternity-white.png"), category:"maternity", color:"white", badges:["Bestseller"] },
  { name:"Black Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-black.png", images:galleryImages("images/maternity-black.png"), category:"maternity", color:"black", badges:["New"] },
  { name:"Mint Green Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-green.png", images:galleryImages("images/maternity-green.png"), category:"maternity", color:"green", badges:["Sale"] },
  { name:"Parrot Green Maternity Gown", oldPrice:11999, price:6500, image:"images/parrot.png", images:galleryImages("images/parrot.png"), category:"maternity", color:"green", badges:["Ready to Ship"] },
  { name:"Dark Red Maternity Gown", oldPrice:11999, price:6500, image:"images/darkred.png", images:galleryImages("images/darkred.png"), category:"maternity", color:"red", badges:["Sale"] },
  { name:"Faint Green Maternity Gown", oldPrice:11999, price:6500, image:"images/faintgreen.png", images:galleryImages("images/faintgreen.png"), category:"maternity", color:"green", badges:["New"] },
  { name:"Yellow Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-yellow.png", images:galleryImages("images/maternity-yellow.png"), category:"maternity", color:"yellow", badges:["Bestseller"] },
  { name:"Red Maternity Gown", oldPrice:11999, price:6500, image:"images/maternity-red.png", images:galleryImages("images/maternity-red.png"), category:"maternity", color:"red", badges:["Sale"] }
];

const allProducts = [...products, ...maternityProducts];
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
  window.location.href = "product.html";
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
          <button type="button" class="card-buy-btn" data-index="${allProducts.indexOf(product)}">View Details</button>
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

document.getElementById("quickViewModal")?.addEventListener("click", event => {
  if(event.target.id === "quickViewModal") closeQuickView();
});

document.getElementById("quickViewClose")?.addEventListener("click", closeQuickView);

document.getElementById("mobileMenuBtn")?.addEventListener("click", toggleMenu);

document.querySelector(".newsletter-band form")?.addEventListener("submit", event => {
  event.preventDefault();
  const input = event.currentTarget.querySelector("input");
  if(input) input.value = "";
  alert("Thank you for subscribing to Pooja Fashion updates.");
});

function updateCartCount(){
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cartCount");
  if(cartCount) cartCount.innerText = cart.length;
}

renderProducts();
renderTrending();
updateCartCount();
