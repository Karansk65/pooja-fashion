// URL se product details lena
const params = new URLSearchParams(window.location.search);

const name = params.get("name");
const price = params.get("price");

document.getElementById("productName").innerText = name || "Product";
document.getElementById("productPrice").innerText = price || "0";

function placeOrder() {
  const customerName = document.getElementById("customerName").value;
  const customerPhone = document.getElementById("customerPhone").value;
  const customerAddress = document.getElementById("customerAddress").value;

  if (!customerName || !customerPhone || !customerAddress) {
    alert("Please fill all details.");
    return;
  }

  alert(
    "Order Placed Successfully!\n\n" +
    "Product: " + name +
    "\nPrice: ₹" + price +
    "\nCustomer: " + customerName
  );
}