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

const productList = document.getElementById("productList");

function showProducts(){
  productList.innerHTML = "";

  products.forEach((product, index) => {
    productList.innerHTML += `
      <div class="product-card">

        <a href="product.html?id=${index}">
          <img src="${product.image}" alt="${product.name}">
        </a>

        <div class="product-info">

          <h3 onclick="openProduct(${index})" style="cursor:pointer;">
            ${product.name}
          </h3>

          <div class="price-box" onclick="openProduct(${index})" style="cursor:pointer;">
            <div class="discount">54% OFF</div>
            <span class="old-price">₹${product.oldPrice}</span>
            <span class="new-price">₹${product.price}</span>
          </div>

        </div>

      </div>
    `;
  });
}

function openProduct(index){
  window.location.href = `product.html?id=${index}`;
}

function openVideo(video){
  const popup = document.getElementById("videoPopup");
  const popupVideo = document.getElementById("popupVideo");
  const source = video.querySelector("source").src;

  popupVideo.src = source;
  popup.style.display = "flex";
  popupVideo.play();
}

function closeVideo(){
  const popup = document.getElementById("videoPopup");
  const popupVideo = document.getElementById("popupVideo");

  popupVideo.pause();
  popupVideo.src = "";
  popup.style.display = "none";
}

showProducts();