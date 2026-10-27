const products = [
  {
    id: "linen-shirt",
    name: "The Linen Shirt",
    category: "Women",
    price: 1890,
    sizes: ["S", "M", "L"],
    colors: ["White", "Sage", "Sand"],
    tag: "Bestseller",
    image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
    alt: "Relaxed white linen shirt",
  },
  {
    id: "everyday-tee",
    name: "Everyday Cotton Tee",
    category: "Men",
    price: 990,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Sage"],
    tag: "Everyday essential",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    alt: "Classic white cotton T-shirt",
  },
  {
    id: "weekend-trousers",
    name: "Weekend Trousers",
    category: "Women",
    price: 2190,
    sizes: ["S", "M", "L"],
    colors: ["Sand", "Olive"],
    tag: "",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    alt: "Neutral-toned trousers styled for the weekend",
  },
  {
    id: "easy-knit",
    name: "The Easy Knit",
    category: "Men",
    price: 2490,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Oatmeal", "Charcoal"],
    tag: "New",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
    alt: "Soft neutral knitwear",
  },
  {
    id: "everyday-tote",
    name: "Everyday Canvas Tote",
    category: "Accessories",
    price: 790,
    sizes: ["One size"],
    colors: ["Natural", "Black"],
    tag: "",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    alt: "Simple canvas everyday tote",
  },
  {
    id: "relaxed-dress",
    name: "Sunday Shirt Dress",
    category: "Women",
    price: 2790,
    sizes: ["S", "M", "L"],
    colors: ["Terracotta", "Black"],
    tag: "New",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=800&q=80",
    alt: "Relaxed everyday dress",
  },
  {
    id: "overshirt",
    name: "The Daily Overshirt",
    category: "Men",
    price: 2290,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Olive", "Navy"],
    tag: "",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    alt: "Casual overshirt in a muted color",
  },
  {
    id: "soft-scarf",
    name: "Soft Days Scarf",
    category: "Accessories",
    price: 890,
    sizes: ["One size"],
    colors: ["Cream", "Rust"],
    tag: "",
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
    alt: "Soft neutral scarf",
  },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const freeShippingThreshold = 2500;
const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const emptyState = document.querySelector("#empty-state");
const cartDrawer = document.querySelector("#cart-drawer");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartSummary = document.querySelector("#cart-summary");
const deliveryForm = document.querySelector("#delivery-form");
const toast = document.querySelector("#toast");

let activeCategory = "All";
let cart = {};
let featuredOrder = products.map((product) => product.id);
let toastTimer;
let isDeliveryStep = false;

function getVariantKey(productId, size, color) {
  return `${productId}::${size}::${color}`;
}

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("thread-form-cart") || "{}");
    if (!savedCart || typeof savedCart !== "object" || Array.isArray(savedCart)) return {};
    return Object.fromEntries(Object.entries(savedCart).flatMap(([key, quantity]) => {
      if (!Number.isInteger(quantity) || quantity <= 0) return [];
      const [productId, size, color] = key.split("::");
      const product = products.find((item) => item.id === productId);
      if (!product) return [];
      const variantSize = size || product.sizes[0];
      const variantColor = color || product.colors[0];
      if (!product.sizes.includes(variantSize) || !product.colors.includes(variantColor)) return [];
      return [[getVariantKey(product.id, variantSize, variantColor), quantity]];
    }));
  } catch {
    return {};
  }
}

cart = loadCart();

function saveCart() {
  localStorage.setItem("thread-form-cart", JSON.stringify(cart));
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedSize = document.querySelector("#size-filter").value;
  const selectedColor = document.querySelector("#color-filter").value;
  const minPrice = Number(document.querySelector("#min-price-filter").value) || 0;
  const maxPriceValue = document.querySelector("#max-price-filter").value;
  const maxPrice = maxPriceValue === "" ? Number.POSITIVE_INFINITY : Number(maxPriceValue);
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category} ${product.colors.join(" ")}`.toLowerCase().includes(query);
    const matchesSize = !selectedSize || product.sizes.includes(selectedSize);
    const matchesColor = !selectedColor || product.colors.includes(selectedColor);
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchesCategory && matchesSearch && matchesSize && matchesColor && matchesPrice;
  });

  const sortBy = document.querySelector("#sort-filter").value;
  if (sortBy === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
  if (sortBy === "name") visibleProducts.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "featured") visibleProducts.sort((a, b) => featuredOrder.indexOf(a.id) - featuredOrder.indexOf(b.id));

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy" />
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
        <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">Add to bag <span aria-hidden="true">+</span></button>
      </div>
      <div class="product-info">
        <div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-category">${product.category}</p>
        </div>
        <p class="product-price">${currency.format(product.price)}</p>
      </div>
      <div class="product-variants">
        <label><span>Size</span><select data-size-for="${product.id}" aria-label="Size for ${product.name}">${product.sizes.map((size) => `<option>${size}</option>`).join("")}</select></label>
        <label><span>Colour</span><select data-color-for="${product.id}" aria-label="Colour for ${product.name}">${product.colors.map((color) => `<option>${color}</option>`).join("")}</select></label>
      </div>
    </article>
  `).join("");
  document.querySelector("#result-count").textContent = `${visibleProducts.length} pieces`;
  emptyState.hidden = visibleProducts.length > 0;
}

function getCartQuantity() {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function getCartSubtotal() {
  return Object.entries(cart).reduce((total, [key, quantity]) => {
    const [productId] = key.split("::");
    const product = products.find((item) => item.id === productId);
    return total + (product ? product.price * quantity : 0);
  }, 0);
}

function renderCart() {
  const quantity = getCartQuantity();
  const subtotal = getCartSubtotal();
  document.querySelector("#cart-count").textContent = quantity;
  document.querySelector("#drawer-count").textContent = quantity ? `(${quantity})` : "";
  setDeliveryStep(isDeliveryStep && quantity > 0);
  cartItems.innerHTML = Object.entries(cart)
    .map(([key, itemQuantity]) => {
      const [productId, size, color] = key.split("::");
      const product = products.find((item) => item.id === productId);
      if (!product) return "";
      return `
      <article class="cart-item">
        <img src="${product.image}" alt="${product.alt}" />
        <div class="cart-item-info">
          <strong>${product.name}</strong>
          <span>${size} · ${color}</span>
          <div class="quantity-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-change="${key}" data-delta="-1" aria-label="Remove one ${product.name}">−</button>
            <span>${itemQuantity}</span>
            <button type="button" data-change="${key}" data-delta="1" aria-label="Add one ${product.name}">+</button>
          </div>
        </div>
        <span class="cart-item-price">${currency.format(product.price * itemQuantity)}</span>
      </article>`;
    }).join("");

  const isEmpty = quantity === 0;
  cartEmpty.style.display = isEmpty ? "flex" : "none";
  cartSummary.hidden = isEmpty || isDeliveryStep;
  if (subtotal >= freeShippingThreshold) {
    document.querySelector("#shipping-note").textContent = "Lovely — your order qualifies for free shipping.";
  } else {
    document.querySelector("#shipping-note").textContent =
      `Add ${currency.format(freeShippingThreshold - subtotal)} more for free shipping.`;
  }
  document.querySelector("#cart-subtotal").textContent = currency.format(subtotal);
}

function setDeliveryStep(isOpen) {
  isDeliveryStep = isOpen;
  cartItems.hidden = isOpen;
  deliveryForm.hidden = !isOpen;
  cartSummary.hidden = isOpen || getCartQuantity() === 0;
  document.querySelector("#drawer-eyebrow").textContent = isOpen ? "Delivery" : "Your picks";
  document.querySelector("#drawer-title").textContent = isOpen ? "Delivery details" : "Your bag";
  document.querySelector("#drawer-count").hidden = isOpen;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setCartOpen(isOpen) {
  cartDrawer.classList.toggle("open", isOpen);
  cartDrawer.setAttribute("aria-hidden", String(!isOpen));
  drawerBackdrop.hidden = !isOpen;
  document.body.classList.toggle("drawer-open", isOpen || !document.querySelector("#confirmation-backdrop").hidden);
  if (isOpen) document.querySelector("#close-cart").focus();
}

function setConfirmationOpen(isOpen) {
  const backdrop = document.querySelector("#confirmation-backdrop");
  backdrop.hidden = !isOpen;
  document.body.classList.toggle("drawer-open", isOpen || cartDrawer.classList.contains("open"));
  if (isOpen) document.querySelector("#close-confirmation").focus();
}

document.querySelector(".filter-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".filter-button").forEach((filter) => {
    const isActive = filter === button;
    filter.classList.toggle("active", isActive);
    filter.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
});

const sizeFilter = document.querySelector("#size-filter");
const colorFilter = document.querySelector("#color-filter");
for (const size of [...new Set(products.flatMap((product) => product.sizes))].sort()) {
  sizeFilter.add(new Option(size, size));
}
for (const color of [...new Set(products.flatMap((product) => product.colors))].sort()) {
  colorFilter.add(new Option(color, color));
}

document.querySelector(".filter-controls").addEventListener("input", renderProducts);
document.querySelector(".filter-controls").addEventListener("change", renderProducts);
document.querySelector("#clear-filters").addEventListener("click", () => {
  sizeFilter.value = "";
  colorFilter.value = "";
  document.querySelector("#min-price-filter").value = "";
  document.querySelector("#max-price-filter").value = "";
  document.querySelector("#sort-filter").value = "featured";
  activeCategory = "All";
  document.querySelectorAll(".filter-button").forEach((filter) => {
    const isActive = filter.dataset.category === "All";
    filter.classList.toggle("active", isActive);
    filter.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.add);
  if (!product) return;
  const card = button.closest(".product-card");
  const size = card.querySelector(`[data-size-for="${product.id}"]`).value;
  const color = card.querySelector(`[data-color-for="${product.id}"]`).value;
  const key = getVariantKey(product.id, size, color);
  cart[key] = (cart[key] || 0) + 1;
  saveCart();
  renderCart();
  showToast(`${product.name} added to your bag`);
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-change]");
  if (!button) return;
  const id = button.dataset.change;
  const nextQuantity = (cart[id] || 0) + Number(button.dataset.delta);
  if (nextQuantity <= 0) delete cart[id];
  else cart[id] = nextQuantity;
  saveCart();
  renderCart();
});

document.querySelector("#open-cart").addEventListener("click", () => setCartOpen(true));
document.querySelector("#close-cart").addEventListener("click", () => setCartOpen(false));
drawerBackdrop.addEventListener("click", () => setCartOpen(false));
document.querySelector("#continue-shopping").addEventListener("click", () => setCartOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) setCartOpen(false);
  if (event.key === "Escape" && !document.querySelector("#confirmation-backdrop").hidden) setConfirmationOpen(false);
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  setDeliveryStep(true);
  document.querySelector("#delivery-name").focus();
});
document.querySelector("#back-to-bag").addEventListener("click", () => setDeliveryStep(false));

deliveryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const details = new FormData(deliveryForm);
  const orderLines = Object.entries(cart).map(([key, quantity]) => {
    const [productId, size, color] = key.split("::");
    const product = products.find((item) => item.id === productId);
    return product
      ? `- ${product.name} (${size}, ${color}) x ${quantity} — ${currency.format(product.price * quantity)}`
      : "";
  }).filter(Boolean);
  const deliveryAddress = [
    details.get("address"),
    details.get("city"),
    details.get("state"),
    `PIN ${details.get("postalCode")}`,
  ].join(", ");
  const message = [
    "Hello! I'd like to place an order from Thread & Form.",
    "",
    ...orderLines,
    "",
    `Subtotal: ${currency.format(getCartSubtotal())}`,
    "",
    `Name: ${details.get("name")}`,
    `Mobile: +91 ${details.get("phone")}`,
    `Delivery address: ${deliveryAddress}`,
    `Payment preference: ${details.get("payment")}`,
    details.get("payment") === "UPI"
      ? "Please share your verified UPI details on WhatsApp. I will confirm them before paying."
      : "",
    details.get("deliveryNote") ? `Delivery instructions: ${details.get("deliveryNote")}` : "",
    "",
    "Please confirm availability, delivery charges, payment instructions, and estimated delivery.",
  ].filter(Boolean).join("\n");
  const whatsappUrl = `https://wa.me/918762532371?text=${encodeURIComponent(message)}`;
  document.querySelector("#whatsapp-link").href = whatsappUrl;
  document.querySelector("#confirmation-whatsapp").href = whatsappUrl;
  document.querySelector("#whatsapp-fallback").hidden = false;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  setConfirmationOpen(true);
});

function dismissConfirmation() {
  setConfirmationOpen(false);
  setCartOpen(false);
}

document.querySelector("#close-confirmation").addEventListener("click", dismissConfirmation);
document.querySelector("#dismiss-confirmation").addEventListener("click", dismissConfirmation);
document.querySelector("#confirmation-backdrop").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setConfirmationOpen(false);
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-feedback").textContent = "Thanks for stopping by — newsletter signup isn't connected yet.";
  event.currentTarget.reset();
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
document.querySelectorAll(".filter-button").forEach((filter) => {
  filter.setAttribute("aria-pressed", String(filter.classList.contains("active")));
});
