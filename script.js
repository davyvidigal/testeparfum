
const defaultProducts = [
  {
    id: 1,
    name: "Asad Bourbon",
    price: 370.00,
    category: "masculino",
    image: "https://goldglow.com.br/cdn/shop/files/0083f8eacaca1a6a99b0eb27eb1b8d5a.webp?v=1784690390&width=1024"
  },
  {
    id: 2,
    name: "Club de Nuit Intense Man",
    price: 400.00,
    category: "masculino",
    image: "https://m.media-amazon.com/images/I/61YMRxr1DZL._AC_UF350,350_QL80_.jpg"
  },
  {
    id: 3,
    name: "Asad",
    price: 340.00,
    category: "masculino",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQojK_pCC1pkWBZWLOzPFUoqwXYoFRQfk97C6Z5xKhK6YyknZzbxdixK5NC&s=10"
  },
  {
    id: 4,
    name: "Odyssey Mandarin Sky",
    price: 340.00,
    category: "unissex",
    image: "https://images.tcdn.com.br/img/img_prod/1458875/90_odyssey_mandarin_sky_1_20260326232643_b9997364d805.jpg"
  },
  {
    id: 5,
    name: "His Confession",
    price: 420.00,
    category: "masculino",
    image: "https://cdn.shoppub.io/cdn-cgi/image/w=1000,h=1000,q=80,f=auto/forman/media/uploads/produtos/foto/kigxplcw/48ee02e9-a5e9-463c-867a-c289e8a6ea3e.jpeg"
  },
  {
    id: 6,
    name: "Vulcan Feu",
    price: 450.00,
    category: "unissex",
    image: "https://epocacosmeticos.vteximg.com.br/arquivos/ids/1152648-800-800/17609927102414.jpg?v=638968247392170000"
  },
  {
    id: 7,
    name: "9pm",
    price: 350.00,
    category: "masculino",
    image: "https://goldglow.com.br/cdn/shop/files/2c8a05f2a929ed50d18d506bb3852d11.png?v=1784689489&width=1024"
  },
  {
    id: 8,
    name: "Supremacy Collector's",
    price: 490.00,
    category: "masculino",
    image: "https://www.giraofertas.com.br/wp-content/uploads/2025/03/supremacy-collectors-edition-pour-homme-afnan-4.webp"
  },
  {
    id: 9,
    name: "Yara Rose",
    price: 299.00,
    category: "feminino",
    image: "https://beijonapele.com.br/wp-content/uploads/2025/10/lattafa-yara-elixir-eau-de-parfum-perfume-feminino-6290362346531-bnp-02-800x800.webp"
  }
];

// CONFIGURAÇÕES
const PRODUCT_KEY = "parfumvidigal_products";
const CART_KEY = "parfumvidigal_cart";
const INTEREST_KEY = "parfumvidigal_product_interest";

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch (error) {
    console.warn("Erro ao ler armazenamento:", key, error);
    return fallback;
  }
}

let products = readStorage(PRODUCT_KEY, defaultProducts);
if (!Array.isArray(products)) products = defaultProducts;

let cart = readStorage(CART_KEY, []);
if (!Array.isArray(cart)) cart = [];

const searchTermsRecorded = new Set();

const money = value =>
  Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

// PROTEGER TEXTOS EXIBIDOS NO HTML
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// SALVAR CARRINHO
function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Não foi possível salvar o carrinho.", error);
  }
}

// ESTATÍSTICAS DE INTERESSE
function getInterestStats() {
  const stats = readStorage(INTEREST_KEY, {});
  return stats && typeof stats === "object" ? stats : {};
}

function registerProductInterest(productId, type) {
  if (!["views", "searches", "clicks"].includes(type)) return;

  const stats = getInterestStats();
  const key = String(productId);

  if (!stats[key]) {
    stats[key] = {
      views: 0,
      searches: 0,
      clicks: 0
    };
  }

  stats[key][type] = (Number(stats[key][type]) || 0) + 1;

  try {
    localStorage.setItem(INTEREST_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("Erro ao registrar interesse.", error);
  }
}

// MOSTRAR PRODUTOS
function renderProducts() {
  const searchInput = document.getElementById("search");
  const categoryInput = document.getElementById("category");
  const productList = document.getElementById("product-list");

  if (!productList) {
    console.error("Elemento #product-list não encontrado.");
    return;
  }

  const search = searchInput
    ? searchInput.value.trim().toLocaleLowerCase("pt-BR")
    : "";

  const category = categoryInput
    ? categoryInput.value
    : "todos";

  const filtered = products.filter(product =>
    (String(product.name).toLocaleLowerCase("pt-BR").includes(search) || String(product.id) === search) &&
    (category === "todos" || product.category === category)
  );

  filtered.forEach(product => {
    registerProductInterest(product.id, "views");
  });

  if (search.length >= 2 && !searchTermsRecorded.has(search)) {
    searchTermsRecorded.add(search);

    products.forEach(product => {
      if (String(product.name).toLocaleLowerCase("pt-BR").includes(search)) {
        registerProductInterest(product.id, "searches");
      }
    });
  }

  productList.innerHTML = filtered.map(product => `
    <div class="product-card">
      <img
        src="${escapeHTML(product.image)}"
        alt="${escapeHTML(product.name)}"
        loading="lazy"
      >

      <h3>${escapeHTML(product.name)}</h3>
      <small class="product-id">Código: ${escapeHTML(product.id)}</small>

      <p>${money(product.price)}</p>

      <button
        type="button"
        data-add-cart="${escapeHTML(product.id)}"
      >
        ADICIONAR AO CARRINHO
      </button>
    </div>
  `).join("") || "<p>Nenhum perfume encontrado.</p>";
}

// ADICIONAR AO CARRINHO
function addToCart(id) {
  const product = products.find(p => String(p.id) === String(id));

  if (!product) {
    alert("Produto não encontrado!");
    return;
  }

  registerProductInterest(product.id, "clicks");

  const item = cart.find(p => String(p.id) === String(id));

  if (item) {
    item.quantity = Number(item.quantity) + 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  updateCart();
}

// REMOVER DO CARRINHO
function removeFromCart(id) {
  cart = cart.filter(p => String(p.id) !== String(id));

  saveCart();
  updateCart();
}

// AUMENTAR QUANTIDADE
function increaseQuantity(id) {
  const item = cart.find(p => String(p.id) === String(id));

  if (!item) return;

  item.quantity = Number(item.quantity) + 1;

  saveCart();
  updateCart();
}

// DIMINUIR QUANTIDADE
function decreaseQuantity(id) {
  const item = cart.find(p => String(p.id) === String(id));

  if (!item) return;

  item.quantity = Number(item.quantity) - 1;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  updateCart();
}

// ATUALIZAR CARRINHO
function updateCart() {
  const count = cart.reduce(
    (sum, p) => sum + Number(p.quantity),
    0
  );

  const total = cart.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0
  );

  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");
  const cartItems = document.getElementById("cart-items");

  if (cartCount) cartCount.textContent = count;
  if (cartTotal) cartTotal.textContent = money(total);

  if (!cartItems) {
    console.warn("Elemento #cart-items não encontrado.");
    return;
  }

  cartItems.innerHTML = cart.map(p => `
    <div class="cart-item">
      <div>
        <strong>${escapeHTML(p.name)}</strong>
        <p>${money(p.price)}</p>

        <div class="quantity-controls">
          <button type="button" data-decrease="${escapeHTML(p.id)}">−</button>

          <span>${Number(p.quantity)}</span>

          <button type="button" data-increase="${escapeHTML(p.id)}">+</button>
        </div>

        <p>Subtotal: ${money(Number(p.price) * Number(p.quantity))}</p>
      </div>

      <button
        type="button"
        data-remove="${escapeHTML(p.id)}"
      >
        Remover
      </button>
    </div>
  `).join("") || "<p>Seu carrinho está vazio.</p>";
}

// ABRIR E FECHAR CARRINHO
function toggleCart() {
  const cartElement = document.getElementById("cart");
  const overlay = document.getElementById("overlay");

  if (!cartElement) {
    console.error("Elemento #cart não encontrado no HTML.");
    return;
  }

  cartElement.classList.toggle("active");

  if (overlay) {
    overlay.classList.toggle("active");
  }
}

// FINALIZAR COMPRA PELO WHATSAPP
function checkout() {
  if (cart.length === 0) {
    alert("Adicione algum perfume ao carrinho!");
    return;
  }

  const items = cart.map(p =>
    `${p.name} - ${p.quantity}x - ${money(Number(p.price) * Number(p.quantity))}`
  ).join("\n");

  const total = cart.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0
  );

  const message =
    `Olá! Gostaria de fazer um pedido na PARFUMVIDIGAL:\n\n` +
    `${items}\n\nTotal: ${money(total)}`;

  const whatsapp = "5527998908720";

  const url =
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

// INICIAR LOJA
function initStore() {
  const searchInput = document.getElementById("search");
  const categoryInput = document.getElementById("category");

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (categoryInput) {
    categoryInput.addEventListener("change", renderProducts);
  }

  // Eventos dos botões de produtos e carrinho
  document.addEventListener("click", function(event) {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.hasAttribute("data-add-cart")) {
      addToCart(button.getAttribute("data-add-cart"));
    }

    if (button.hasAttribute("data-remove")) {
      removeFromCart(button.getAttribute("data-remove"));
    }

    if (button.hasAttribute("data-increase")) {
      increaseQuantity(button.getAttribute("data-increase"));
    }

    if (button.hasAttribute("data-decrease")) {
      decreaseQuantity(button.getAttribute("data-decrease"));
    }
  });

  renderProducts();
  updateCart();
}

function reloadStoreProducts() {
  const updated = readStorage(PRODUCT_KEY, defaultProducts);
  products = Array.isArray(updated) ? updated : defaultProducts;
  renderProducts();
}
window.addEventListener("storage", event => {
  if (event.key === PRODUCT_KEY) reloadStoreProducts();
});
window.addEventListener("pageshow", reloadStoreProducts);
window.addEventListener("focus", reloadStoreProducts);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStore);
} else {
  initStore();
}
