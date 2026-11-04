import { createClient } from '@supabase/supabase-js';
import './style.css';

// ---------------------------------------------------------------------
// Supabase & Environment Initialization
// ---------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const launchDateStr = import.meta.env.VITE_LAUNCH_DATE || '2026-03-19T09:30:00Z';

function isLaunchDiscountActive() {
  const launchDate = new Date(launchDateStr);
  const now = new Date();
  const diffHours = (now - launchDate) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 24;
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// EmailJS Initialization
if (window.emailjs) {
  window.emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY");
}

// ---------------------------------------------------------------------
// Product Catalog & Dynamic Pricing Logic
// ---------------------------------------------------------------------
export const PRODUCTS = {
  PRODUCT_PHOTOS: {
    id: 'guide-product-photos',
    title: 'Better Product Photos Using Just Your Phone',
    price: 399,
    original_price: 399,
    image_url: 'https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/images/IMG_5950.PNG',
    category: 'Guide',
    file_path: 'Better Product Photos, just using your phone - Kalyani.pdf',
    download_url: 'https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/Better%20Product%20Photos%2C%20just%20using%20your%20phone%20-%20Kalyani.pdf',
    email_subject: 'Your guide is here: Better Product Photos Using Just Your Phone'
  },
  PICTURE_GUIDE: {
    id: 'guide-can-you-take-my-picture',
    title: 'Can you take my picture?',
    regular_price: 149,
    launch_price: 99,
    image_url: 'https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/picture-guide-cover.jpg',
    category: 'Guide',
    file_path: 'Can-you-take-my-picture.pdf.pdf',
    download_url: 'https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/Can-you-take-my-picture.pdf.pdf',
    local_download_url: '/Can-you-take-my-picture-Kalyani.pdf',
    email_subject: 'Your guide is here: Can you take my picture?'
  }
};

/**
 * Launch discount for "Can you take my picture?":
 * Launch price: ₹99 (₹149 crossed out), valid till Tuesday 10 Nov 23:59:59 IST.
 * Switches to ₹149 automatically on Wednesday 11 Nov 00:00:00 IST.
 *
 * HOW TO CHANGE MANUALLY:
 * - To extend: Change the date below (e.g. '2026-11-15T00:00:00+05:30').
 * - To change regular or launch price: Edit PRODUCTS.PICTURE_GUIDE above.
 */
const PICTURE_DISCOUNT_CUTOFF = new Date('2026-11-11T00:00:00+05:30').getTime();

export function isPictureDiscountActive() {
  return Date.now() < PICTURE_DISCOUNT_CUTOFF;
}

export function getPictureCurrentPrice() {
  return isPictureDiscountActive() ? PRODUCTS.PICTURE_GUIDE.launch_price : PRODUCTS.PICTURE_GUIDE.regular_price;
}

function updatePicturePricingUI() {
  const priceContainer = document.getElementById('picture-price-container');
  const badge = document.getElementById('picture-launch-badge');
  const isDiscount = isPictureDiscountActive();
  const currentPrice = getPictureCurrentPrice();

  if (priceContainer) {
    if (isDiscount) {
      priceContainer.innerHTML = `<span class="current-price">₹${currentPrice}</span> <span class="original-price" id="picture-original-price">₹${PRODUCTS.PICTURE_GUIDE.regular_price}</span>`;
    } else {
      priceContainer.innerHTML = `<span class="current-price">₹${currentPrice}</span>`;
    }
  }

  if (badge) {
    if (isDiscount) {
      badge.style.display = 'inline-block';
      badge.innerText = 'Launch Price · Valid till Tue 10 Nov';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ---------------------------------------------------------------------
// Cart & State Management
// ---------------------------------------------------------------------
let cart = [];
let dbBooks = []; // Optional remote books from Supabase

const bookGrid = document.getElementById('book-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

// Fetch Library from Supabase (if configured)
async function fetchLibrary() {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (!error && data && data.length > 0) {
      dbBooks = data;
      renderLibrary();
    }
  } catch (err) {
    console.warn('Remote library fetch skipped or empty, using local product definitions.');
  }
}

function renderLibrary() {
  if (!bookGrid || dbBooks.length === 0) return;
  bookGrid.innerHTML = dbBooks.map((book, index) => `
    <div class="book-card animate-fade stagger-${(index % 4) + 1}">
      <div class="book-thumb" style="background-image: url('${book.image_url}'); background-size: cover; background-position: center;"></div>
      <div class="book-info">
        <span class="badge" style="margin-bottom: 0.5rem;">${book.category}</span>
        <h3>${book.title}</h3>
        <div class="book-price-row">
          <span class="price">₹${Number(book.price).toFixed(2)}</span>
        </div>
        <button onclick="addToCart('${book.id}')" class="btn btn-primary" style="margin-left: 0; width: 100%;">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

// Universal Add to Cart Logic
window.addToCart = (productId) => {
  let itemToAdd = null;

  if (productId === PRODUCTS.PRODUCT_PHOTOS.id || productId === 'guide-product-photos' || productId === 'photos') {
    const isDiscounted = isLaunchDiscountActive();
    itemToAdd = {
      id: PRODUCTS.PRODUCT_PHOTOS.id,
      title: PRODUCTS.PRODUCT_PHOTOS.title,
      price: isDiscounted ? 299 : PRODUCTS.PRODUCT_PHOTOS.price,
      original_price: PRODUCTS.PRODUCT_PHOTOS.original_price,
      image_url: PRODUCTS.PRODUCT_PHOTOS.image_url,
      category: PRODUCTS.PRODUCT_PHOTOS.category,
      file_path: PRODUCTS.PRODUCT_PHOTOS.file_path,
      download_url: PRODUCTS.PRODUCT_PHOTOS.download_url
    };
  } else if (productId === PRODUCTS.PICTURE_GUIDE.id || productId === 'guide-can-you-take-my-picture' || productId === 'picture') {
    itemToAdd = {
      id: PRODUCTS.PICTURE_GUIDE.id,
      title: PRODUCTS.PICTURE_GUIDE.title,
      price: getPictureCurrentPrice(),
      original_price: PRODUCTS.PICTURE_GUIDE.regular_price,
      image_url: PRODUCTS.PICTURE_GUIDE.image_url,
      category: PRODUCTS.PICTURE_GUIDE.category,
      file_path: PRODUCTS.PICTURE_GUIDE.file_path,
      download_url: PRODUCTS.PICTURE_GUIDE.download_url
    };
  } else {
    const book = dbBooks.find(b => b.id === productId);
    if (book) {
      itemToAdd = { ...book };
    }
  }

  if (!itemToAdd) {
    console.warn('Unknown product ID:', productId);
    return;
  }

  const existing = cart.find(item => item.id === itemToAdd.id);
  if (existing) {
    existing.quantity += 1;
    existing.price = itemToAdd.price; // keep active price
  } else {
    cart.push({ ...itemToAdd, quantity: 1 });
  }

  updateCart();
  toggleCart(true);
};

window.removeFromCart = (productId) => {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
};

function updateCart() {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.innerText = totalItemsCount;

  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--color-muted);">
          <p style="font-size: 0.95rem; margin-bottom: 1rem;">Your cart is empty</p>
          <button onclick="toggleCart(false)" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Continue Browsing</button>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item stagger-${(index % 4) + 1}" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center;">
          <div style="width: 55px; height: 75px; background-image: url('${item.image_url}'), url('/picture-guide-cover.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: var(--color-bg); border-radius: var(--radius-sm); border: 1px solid var(--color-border); flex-shrink: 0;"></div>
          <div style="flex-grow: 1;">
            <h4 style="font-size: 0.88rem; margin-bottom: 0.2rem; font-family: var(--font-serif); line-height: 1.3;">${item.title}</h4>
            <span style="font-size: 0.8rem; color: var(--color-muted);">${item.quantity} × ₹${item.price}</span>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="close-btn" style="font-size: 1.2rem; color: var(--color-muted); padding: 0.5rem;" aria-label="Remove item">&times;</button>
        </div>
      `).join('');
    }
  }

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  if (cartTotal) cartTotal.innerText = `₹${total.toFixed(2)}`;

  renderCheckoutSummaries();
}

function toggleCart(forceOpen = null) {
  if (!cartSidebar) return;
  if (forceOpen === true) {
    cartSidebar.classList.add('open');
  } else if (forceOpen === false) {
    cartSidebar.classList.remove('open');
  } else {
    cartSidebar.classList.toggle('open');
  }
}

window.toggleCart = toggleCart;

if (cartBtn) cartBtn.addEventListener('click', () => toggleCart());
if (closeCart) closeCart.addEventListener('click', () => toggleCart(false));

// Connect Buy Buttons for Both Guides
const showcaseBuyBtn = document.getElementById('showcase-buy-btn');
if (showcaseBuyBtn) {
  showcaseBuyBtn.addEventListener('click', () => {
    window.addToCart(PRODUCTS.PRODUCT_PHOTOS.id);
  });
}

const pictureBuyBtn = document.getElementById('picture-buy-btn');
if (pictureBuyBtn) {
  pictureBuyBtn.addEventListener('click', () => {
    window.addToCart(PRODUCTS.PICTURE_GUIDE.id);
  });
}

// ---------------------------------------------------------------------
// Navigation & Direct Link (#picture) Handling
// ---------------------------------------------------------------------
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

window.navigateTo = (pageId) => {
  // Mobile / Instagram in-app browser safeguard: always unlock body scrolling
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";

  const targetPage = document.getElementById(`page-${pageId}`);
  if (!targetPage) return;

  const currentActivePage = document.querySelector('.page.active');

  if (currentActivePage && currentActivePage !== targetPage) {
    currentActivePage.classList.add('fading-out');
    
    setTimeout(() => {
      currentActivePage.classList.remove('active', 'fading-out');
      currentActivePage.style.display = 'none';
      window.scrollTo(0, 0);
      handleNewPage(pageId, targetPage);
    }, 300);
  } else if (!currentActivePage || currentActivePage !== targetPage) {
    window.scrollTo(0, 0);
    handleNewPage(pageId, targetPage);
  }
};

function handleNewPage(pageId, targetPage) {
  if (pageId.startsWith('checkout') || pageId === 'payment') {
    renderCheckoutSummaries();
  }

  // Restore persistent order reference on the success screen
  if (pageId === 'success') {
    const savedOrderId = sessionStorage.getItem('tng_current_order_id') || localStorage.getItem('tng_last_order_id');
    const displayOrderId = document.getElementById('display-order-id');
    if (displayOrderId && savedOrderId) {
      displayOrderId.innerText = savedOrderId;
    }
    try {
      const savedCart = JSON.parse(sessionStorage.getItem('tng_purchased_cart') || '[]');
      if (savedCart.length) renderSuccessDownloads(savedCart);
    } catch (_) {}
  }

  pages.forEach(p => {
    p.classList.remove('active', 'fading-out');
    p.style.display = 'none';
  });
  navLinks.forEach(l => l.classList.remove('active'));

  targetPage.style.display = '';
  void targetPage.offsetWidth;
  targetPage.classList.add('active');

  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const pageId = link.getAttribute('data-page');
    if (pageId) {
      e.preventDefault();
      window.navigateTo(pageId);
      if (pageId === 'home') window.location.hash = '';
      else window.location.hash = pageId;
    }
  });
});

window.scrollToElement = (id) => {
  window.navigateTo('home');
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, 100);
};

/**
 * Direct link handler for Instagram bio and DMs (e.g. thenovembergurl.com/#picture)
 */
function handleDirectHashLink() {
  const hash = (window.location.hash || '').toLowerCase();
  if (hash === '#picture' || hash === '#picture/') {
    window.navigateTo('home');
    setTimeout(() => {
      const el = document.getElementById('picture');
      if (el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 2500);
      }
    }, 200);
  } else if (hash === '#product-showcase' || hash === '#guides-showcase') {
    window.navigateTo('home');
    setTimeout(() => {
      const el = document.getElementById('product-showcase') || document.getElementById('guides-showcase');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }
}

window.addEventListener('hashchange', handleDirectHashLink);

// Header & Mobile Nav toggles
const menuToggle = document.getElementById('menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (nav) nav.classList.toggle('open');
  });
}

document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
    }
  });
});

window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  if (header) {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
});

// ---------------------------------------------------------------------
// Checkout Flow & Summaries
// ---------------------------------------------------------------------
const checkoutBtn = document.getElementById('checkout-btn');

window.openCheckout = () => {
  if (cart.length === 0) {
    alert('Your cart is empty. Please add a guide first.');
    return;
  }
  toggleCart(false);
  window.navigateTo('checkout-details');
};

if (checkoutBtn) checkoutBtn.addEventListener('click', window.openCheckout);

function renderCheckoutSummaries() {
  const detailsSummary = document.getElementById('details-summary-items');
  const paymentSummary = document.getElementById('payment-summary-items');
  const sharedTotals = document.querySelectorAll('.shared-total');
  const sharedSubtotals = document.querySelectorAll('.shared-subtotal');

  if (!detailsSummary && !paymentSummary) return;

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const itemsHtml = cart.map(item => `
    <div class="summary-item" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
      <div class="summary-item-img" style="width: 48px; height: 64px; background-image: url('${item.image_url}'), url('/picture-guide-cover.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center; border-radius: 4px; border: 1px solid var(--color-border); flex-shrink: 0;"></div>
      <div class="summary-item-info" style="flex-grow: 1;">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem; font-family: var(--font-serif);">${item.title}</h4>
        <p style="font-size: 0.8rem; color: var(--color-muted);">Qty: ${item.quantity} × ₹${item.price}</p>
      </div>
      <div class="summary-item-price" style="font-weight: 600; font-size: 0.95rem;">₹${(Number(item.price) * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  if (detailsSummary) detailsSummary.innerHTML = itemsHtml || '<p style="color: var(--color-muted);">Cart is empty</p>';
  if (paymentSummary) paymentSummary.innerHTML = itemsHtml || '<p style="color: var(--color-muted);">Cart is empty</p>';

  sharedTotals.forEach(el => el.innerText = `₹${total.toFixed(2)}`);
  sharedSubtotals.forEach(el => el.innerText = `₹${total.toFixed(2)}`);
}

// ---------------------------------------------------------------------
// Email Validation Logic
// ---------------------------------------------------------------------
function validateEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, message: "Email is required." };
  if (!re.test(email)) return { valid: false, message: "Please enter a valid email address." };

  const typos = {
    'gamil.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahho.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'icloud.cm': 'icloud.com',
    'outlook.co': 'outlook.com'
  };

  const domain = email.split('@')[1]?.toLowerCase();
  if (typos[domain]) {
    return { valid: false, isTypo: true, suggestion: typos[domain], message: "Please check your email domain." };
  }

  return { valid: true, domain };
}

const emailVerifyCache = {};

async function verifyEmailDeliverability(email) {
  if (emailVerifyCache[email] !== undefined) return emailVerifyCache[email];
  const apiKey = import.meta.env.VITE_ABSTRACT_EMAIL_KEY;
  if (!apiKey) return { deliverable: true };

  try {
    const res = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`
    );
    const data = await res.json();
    const result = {
      deliverable: data.is_mx_found?.value !== false,
      hasMx: data.is_mx_found?.value === true,
      deliverability: data.deliverability
    };
    emailVerifyCache[email] = result;
    return result;
  } catch {
    emailVerifyCache[email] = { deliverable: true };
    return { deliverable: true };
  }
}

function showEmailError(container, emailInput, message, suggestion = null) {
  emailInput.classList.remove('input-valid');
  emailInput.classList.add('input-invalid');
  let html = `<div class="error-msg">
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    ${message}
  </div>`;
  if (suggestion) {
    html += `<div class="typo-suggestion">Did you mean <span onclick="window.fixEmailTypo('${suggestion}')">@${suggestion}</span>?</div>`;
  }
  container.innerHTML = html;
}

function showEmailChecking(container, emailInput) {
  emailInput.classList.remove('input-invalid', 'input-valid');
  container.innerHTML = `<div class="error-msg" style="color: var(--color-muted);">
    <svg class="spin-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="20"></circle></svg>
    Verifying email domain…
  </div>`;
}

function showEmailValid(container, emailInput) {
  container.innerHTML = '';
  emailInput.classList.remove('input-invalid');
  emailInput.classList.add('input-valid');
}

let verifyDebounceTimer = null;
async function updateEmailValidationUI(email) {
  const container = document.getElementById('email-error-container');
  const emailInput = document.getElementById('email');
  if (!container || !emailInput) return;

  clearTimeout(verifyDebounceTimer);

  if (email === '') {
    container.innerHTML = '';
    emailInput.classList.remove('input-invalid', 'input-valid');
    return;
  }

  const formatResult = validateEmailFormat(email);
  if (!formatResult.valid) {
    showEmailError(container, emailInput, formatResult.message, formatResult.suggestion);
    return;
  }

  showEmailChecking(container, emailInput);
  verifyDebounceTimer = setTimeout(async () => {
    const result = await verifyEmailDeliverability(email);
    if (!result.deliverable) {
      showEmailError(container, emailInput, `This email address doesn't appear deliverable. Please verify.`);
    } else {
      showEmailValid(container, emailInput);
    }
  }, 800);
}

window.fixEmailTypo = (correctDomain) => {
  const emailInput = document.getElementById('email');
  if (!emailInput) return;
  const [user] = emailInput.value.split('@');
  emailInput.value = `${user}@${correctDomain}`;
  updateEmailValidationUI(emailInput.value);
  emailInput.focus();
};

const detailsForm = document.getElementById('details-form');
if (detailsForm) {
  detailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(detailsForm);
    const data = Object.fromEntries(formData.entries());

    const formatResult = validateEmailFormat(data.email);
    if (!formatResult.valid) {
      updateEmailValidationUI(data.email);
      const emailField = document.getElementById('email');
      if (emailField) { emailField.scrollIntoView({ behavior: 'smooth', block: 'center' }); emailField.focus(); }
      const submitBtn = detailsForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.classList.add('btn-shake'); setTimeout(() => submitBtn.classList.remove('btn-shake'), 600); }
      return;
    }

    const container = document.getElementById('email-error-container');
    const emailInput = document.getElementById('email');
    showEmailChecking(container, emailInput);
    const submitBtn = detailsForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const result = await verifyEmailDeliverability(data.email);

    if (submitBtn) submitBtn.disabled = false;

    if (!result.deliverable) {
      showEmailError(container, emailInput, `This email address doesn't appear deliverable. Please double-check.`);
      if (emailInput) { emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); emailInput.focus(); }
      return;
    }

    showEmailValid(container, emailInput);
    window.customerDetails = data;
    window.navigateTo('payment');
  });
}

document.getElementById('email')?.addEventListener('input', (e) => updateEmailValidationUI(e.target.value));
document.getElementById('email')?.addEventListener('blur', (e) => updateEmailValidationUI(e.target.value));

// ---------------------------------------------------------------------
// Razorpay Payment & Automatic Order Fulfillment
// ---------------------------------------------------------------------
const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SSOzAaR6lnZXOL';
const finalPayBtn = document.getElementById('final-pay-btn');

if (finalPayBtn) {
  finalPayBtn.addEventListener('click', () => {
    const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    if (totalAmount <= 0) {
      alert('Your cart is empty. Please add a guide first.');
      return;
    }

    if (!window.customerDetails || !window.customerDetails.email) {
      window.navigateTo('checkout-details');
      return;
    }

    const itemTitles = cart.map(i => i.title).join(', ');

    const options = {
      key: razorpayKey,
      amount: Math.round(totalAmount * 100).toString(), // Razorpay expects paise (e.g. 9900 for ₹99)
      currency: "INR",
      name: "The November Gurl",
      description: itemTitles,
      image: "https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/logo.jpeg",
      modal: {
        ondismiss: function() {
          // Mobile / Instagram safeguard: restore scroll when modal is closed
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          finalPayBtn.innerText = 'Pay Now securely';
          finalPayBtn.disabled = false;
        },
        escape: true,
        backdropclose: false
      },
      handler: async function (response) {
        finalPayBtn.innerText = 'Finalizing Order...';
        finalPayBtn.disabled = true;

        // 1. Generate Friendly Reference ID immediately
        const displayId = `#TNG-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;

        // 2. Immediately update the success screen and persist so customer NEVER sees "TNG-WAITING"
        const displayOrderId = document.getElementById('display-order-id');
        if (displayOrderId) displayOrderId.innerText = displayId;
        try {
          sessionStorage.setItem('tng_current_order_id', displayId);
          localStorage.setItem('tng_last_order_id', displayId);
        } catch (storageErr) {
          console.warn('Storage unavailable:', storageErr);
        }

        const purchasedCart = [...cart];
        try {
          sessionStorage.setItem('tng_purchased_cart', JSON.stringify(purchasedCart));
          renderSuccessDownloads(purchasedCart);
        } catch (_) {}

        try {
          // 3. Create order in Supabase
          const orderData = {
            customer_name: `${window.customerDetails.firstName} ${window.customerDetails.lastName}`.trim(),
            customer_email: window.customerDetails.email,
            total_amount: totalAmount,
            status: 'paid',
            razorpay_payment_id: response.razorpay_payment_id,
            display_id: displayId,
            created_at: new Date().toISOString()
          };

          const { data: orderResponse, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select();

          let orderId = null;
          if (!orderError && orderResponse && orderResponse.length > 0) {
            orderId = orderResponse[0].id;
          }

          // 4. Record order items
          if (orderId) {
            const orderItemsData = purchasedCart.map(item => ({
              order_id: orderId,
              product_id: item.id.toString(),
              book_id: item.id.toString(),
              product_name: item.title,
              price: Number(item.price),
              price_at_purchase: Number(item.price),
              quantity: item.quantity,
              image_url: item.image_url
            }));

            await supabase.from('order_items').insert(orderItemsData);
          }

          // 5. Send automated delivery email via EmailJS
          try {
            await sendOrderEmail(orderData, purchasedCart);
          } catch (emailErr) {
            console.error('Email delivery error:', emailErr);
          }

          // 6. Complete purchase flow
          cart = [];
          updateCart();
          window.navigateTo('success');

        } catch (err) {
          console.error('Order Finalization Error:', err);
          // Navigate to success anyway since payment succeeded via Razorpay
          cart = [];
          updateCart();
          window.navigateTo('success');
        } finally {
          finalPayBtn.innerText = 'Pay Now securely';
          finalPayBtn.disabled = false;
        }
      },
      prefill: {
        name: `${window.customerDetails.firstName} ${window.customerDetails.lastName}`.trim(),
        email: window.customerDetails.email
      },
      theme: { color: "#E5B7B7" } // Blush accent
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      alert(`Payment was not completed: ${resp.error.description}`);
      finalPayBtn.innerText = 'Pay Now securely';
      finalPayBtn.disabled = false;
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    });
    rzp.open();
  });
}

// ---------------------------------------------------------------------
// Instant One-Click Download UI on Order Success Page
// ---------------------------------------------------------------------
function renderSuccessDownloads(cartItems) {
  const container = document.getElementById('success-download-container');
  if (!container || !cartItems || !cartItems.length) return;

  container.innerHTML = `
    <div style="background: rgba(229, 183, 183, 0.15); border: 1px solid rgba(229, 183, 183, 0.45); border-radius: var(--radius-md); padding: 1.5rem 1.8rem; margin-bottom: 2rem; text-align: center;">
      <h3 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 0.4rem; color: var(--color-text);">Your Download is Ready!</h3>
      <p style="font-size: 0.88rem; color: var(--color-muted); margin-bottom: 1.3rem;">Tap below to save your guide directly to this device right now:</p>
      ${cartItems.map(item => {
        let downloadUrl = PRODUCTS.PICTURE_GUIDE.download_url;
        if (item.id === PRODUCTS.PRODUCT_PHOTOS.id || (item.title && item.title.includes('Better Product Photos'))) {
          downloadUrl = PRODUCTS.PRODUCT_PHOTOS.download_url;
        }
        return `
          <a href="${downloadUrl}" target="_blank" download class="btn btn-primary btn-full" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.95rem; padding: 1rem 1.4rem; text-decoration: none; border-radius: 30px; box-shadow: 0 8px 20px rgba(229, 183, 183, 0.35);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download "${item.title}" (PDF)
          </a>
        `;
      }).join('')}
    </div>
  `;
}

// ---------------------------------------------------------------------
// Automated Email Delivery with Custom Subjects & Specific PDF Links
// ---------------------------------------------------------------------
async function sendOrderEmail(orderData, cartItems) {
  if (!window.emailjs) {
    console.error('EmailJS not available');
    return false;
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  const hasPhotos = cartItems.some(i => i.id === PRODUCTS.PRODUCT_PHOTOS.id || i.title.includes('Better Product Photos'));
  const hasPicture = cartItems.some(i => i.id === PRODUCTS.PICTURE_GUIDE.id || i.title.includes('Can you take my picture'));

  // Email subject line tailored to the exact purchase
  let emailSubject = 'Your guide is here: The November Gurl';
  if (hasPicture && !hasPhotos) {
    emailSubject = 'Your guide is here: Can you take my picture?';
  } else if (hasPhotos && !hasPicture) {
    emailSubject = 'Your guide is here: Better Product Photos Using Just Your Phone';
  } else if (hasPhotos && hasPicture) {
    emailSubject = 'Your guides are here: Can you take my picture? & Better Product Photos';
  }

  // Download links for each guide
  const photosUrl = PRODUCTS.PRODUCT_PHOTOS.download_url;
  const pictureUrl = PRODUCTS.PICTURE_GUIDE.download_url;

  let downloadLinkText = '';
  let downloadButtonsHtml = '';

  if (hasPicture && !hasPhotos) {
    downloadLinkText = pictureUrl;
    downloadButtonsHtml = `<a href="${pictureUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background-color: #E5B7B7; color: #2D2A4A; text-decoration: none; font-weight: 600; border-radius: 30px; font-size: 15px; border: 1px solid #D48181;">✦ Download Guide: Can you take my picture?</a>`;
  } else if (hasPhotos && !hasPicture) {
    downloadLinkText = photosUrl;
    downloadButtonsHtml = `<a href="${photosUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background-color: #E5B7B7; color: #2D2A4A; text-decoration: none; font-weight: 600; border-radius: 30px; font-size: 15px; border: 1px solid #D48181;">✦ Download Guide: Better Product Photos</a>`;
  } else {
    downloadLinkText = pictureUrl;
    downloadButtonsHtml = `
      <div style="margin-bottom: 12px;">
        <a href="${pictureUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #E5B7B7; color: #2D2A4A; text-decoration: none; font-weight: 600; border-radius: 30px; font-size: 14px; border: 1px solid #D48181;">✦ Download: Can you take my picture?</a>
      </div>
      <div>
        <a href="${photosUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #E5B7B7; color: #2D2A4A; text-decoration: none; font-weight: 600; border-radius: 30px; font-size: 14px; border: 1px solid #D48181;">✦ Download: Better Product Photos</a>
      </div>
    `;
  }

  const productNames = cartItems.map(item => item.title).join(', ');

  const templateParams = {
    to_email: orderData.customer_email,
    to_name: orderData.customer_name,
    customer_name: orderData.customer_name,
    customer_email: orderData.customer_email,
    reply_to: 'thenovembergurl@gmail.com',
    from_name: 'Kalyani | The November Gurl',
    subject: emailSubject,
    email_subject: emailSubject,
    product_name: productNames,
    download_link: downloadLinkText,
    download_link_raw: downloadLinkText.replace(/^https?:\/\//, ''),
    download_buttons_html: downloadButtonsHtml,
    download_link_picture: pictureUrl,
    download_link_photos: photosUrl,
    order_id: orderData.display_id,
    display_id: orderData.display_id,
    logo_url: "https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/logo.jpeg"
  };

  try {
    const result = await window.emailjs.send(serviceId, templateId, templateParams);
    console.log('EmailJS delivery success:', result);
    return true;
  } catch (error) {
    console.error('EmailJS delivery failed:', error);
    return false;
  }
}

// ---------------------------------------------------------------------
// Application Initialization
// ---------------------------------------------------------------------
updatePicturePricingUI();
fetchLibrary();
updateCart();
handleDirectHashLink();
