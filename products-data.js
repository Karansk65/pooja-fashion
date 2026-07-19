(function(global){
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

  function productSlugFromName(name){
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const allProducts = [...products, ...maternityProducts].map(product => ({
    ...product,
    slug: productSlugFromName(product.name)
  }));

  global.POOJA_CATALOG = {
    products,
    maternityProducts,
    allProducts,
    productSlugFromName
  };
})(window);
