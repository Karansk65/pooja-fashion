(function(){
  const phone = "917620986732";
  const productName = document.getElementById("productName")?.textContent?.trim();
  const message = productName
    ? "Hello Pooja Fashion, I want to know more about " + productName + ". Please send real video and size details."
    : "Hello Pooja Fashion, I want to know about your gowns. Please send real video and size details.";
  const link = document.createElement("a");
  link.className = "whatsapp-order-float";
  link.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Chat with Pooja Fashion on WhatsApp");
  link.innerHTML = '<i class="fab fa-whatsapp"></i><span>WhatsApp for real video</span>';
  document.body.appendChild(link);
})();
