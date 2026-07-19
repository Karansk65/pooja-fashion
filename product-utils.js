(function(global){
  function productSlugFromName(name){
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function productShareUrl(product){
    const slug = product.slug || productSlugFromName(product.name);
    const path = window.location.pathname.replace(/[^/]*$/, "");
    return window.location.origin + path + "product.html?p=" + encodeURIComponent(slug);
  }

  function findProductBySlug(slug){
    const stored = JSON.parse(localStorage.getItem("allProducts") || "[]");
    const catalog = stored.length ? stored : (global.POOJA_CATALOG?.allProducts || []);
    return catalog.find(product => (product.slug || productSlugFromName(product.name)) === slug);
  }

  function productShareText(product){
    const price = typeof product.price === "number"
      ? product.price
      : String(product.price || "").replace(/\D/g, "");
    return "Check out " + product.name + " at Dipali Fashion - Rs. " + price;
  }

  async function shareProduct(product){
    const url = productShareUrl(product);
    const shareData = {
      title: product.name + " | Dipali Fashion",
      text: productShareText(product),
      url
    };

    if(navigator.share){
      try{
        await navigator.share(shareData);
        return { ok:true, method:"native" };
      }catch(error){
        if(error.name === "AbortError") return { ok:false, cancelled:true };
      }
    }

    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(url);
      return { ok:true, method:"clipboard", url };
    }

    window.prompt("Copy this product link:", url);
    return { ok:true, method:"prompt", url };
  }

  function showShareFeedback(button, message){
    if(!button) return;
    const original = button.innerHTML;
    button.innerHTML = message;
    setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  }

  global.PoojaProductUtils = {
    productSlugFromName,
    productShareUrl,
    findProductBySlug,
    shareProduct,
    showShareFeedback
  };
})(window);
