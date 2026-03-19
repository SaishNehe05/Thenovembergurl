import { createClient } from '@supabase/supabase-js';
import './style.css';

// Supabase Initialization
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

let cart = [];
let dbBooks = []; // Store real books from Supabase

const bookGrid = document.getElementById('book-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

// Initialize Library from Supabase
async function fetchLibrary() {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    dbBooks = data || [];
    
    // Apply launch discount
    if (isLaunchDiscountActive()) {
      dbBooks = dbBooks.map(book => ({
        ...book,
        original_price: book.price,
        price: 299
      }));
    }
    
    renderLibrary();
    updateHeroButton();
    updateShowcasePrice();
  } catch (err) {
    console.error('Error fetching books:', err);
  }
}

function updateHeroButton() {
  const heroBtn = document.getElementById('hero-add-to-cart');
  if (heroBtn && dbBooks.length > 0) {
    const firstBook = dbBooks[0];
    heroBtn.innerText = `Add to Cart - ₹${Number(firstBook.price).toFixed(2)}`;
    heroBtn.onclick = () => window.addToCart(firstBook.id);
  }
}

function renderLibrary() {
  if (!bookGrid || dbBooks.length === 0) return;
  
  const isDiscounted = isLaunchDiscountActive();
  
  bookGrid.innerHTML = dbBooks.map((book, index) => {
    const originalPrice = book.original_price || book.price;
    return `
      <div class="book-card animate-fade stagger-${(index % 4) + 1}">
        <div class="book-thumb" style="background-image: url('${book.image_url}'); background-size: cover; background-position: center;">
          ${isDiscounted ? '<span class="discount-badge">Launch Special</span>' : ''}
        </div>
        <div class="book-info">
          <span class="badge" style="margin-bottom: 0.5rem;">${book.category}</span>
          <h3>${book.title}</h3>
          <div class="book-price-row">
            <span class="price">₹${Number(book.price).toFixed(2)}</span>
            ${isDiscounted ? `<span class="original-price">₹${Number(originalPrice).toFixed(2)}</span>` : ''}
          </div>
          <button onclick="addToCart('${book.id}')" class="btn btn-primary" style="margin-left: 0; width: 100%;">Add to Cart</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateShowcasePrice() {
  const showcasePrice = document.querySelector('.showcase-price');
  if (showcasePrice && isLaunchDiscountActive()) {
    showcasePrice.innerHTML = `₹299 <span class="original-price">₹399</span> <span class="discount-badge" style="margin-left: 0.5rem; vertical-align: middle;">Launch Special</span>`;
  }
}

// Cart Logic
window.addToCart = (uuid) => {
  const book = dbBooks.find(b => b.id === uuid);
  if (!book) return console.warn('Book not found in library:', uuid);
  
  const existing = cart.find(item => item.id === uuid);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...book, quantity: 1 });
  }
  
  updateCart();
  toggleCart(true);
};

function updateCart() {
  if (cartCount) cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = cart.map((item, index) => `
      <div class="cart-item stagger-${(index % 4) + 1}" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center;">
        <div style="width: 60px; height: 80px; background-image: url('${item.image_url}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: var(--color-bg); border-radius: var(--radius-sm);"></div>
        <div style="flex-grow: 1;">
          <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem; font-family: var(--font-serif);">${item.title}</h4>
          <span style="font-size: 0.8rem; color: var(--color-muted);">${item.quantity} x ₹${item.price}</span>
        </div>
        <button onclick="removeFromCart('${item.id}')" class="close-btn" style="font-size: 1.2rem;">&times;</button>
      </div>
    `).join('');
  }
  
  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  if (cartTotal) cartTotal.innerText = `₹${total.toFixed(2)}`;
}

window.removeFromCart = (uuid) => {
  cart = cart.filter(item => item.id !== uuid);
  updateCart();
};

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

if (cartBtn) cartBtn.addEventListener('click', () => toggleCart());
if (closeCart) closeCart.addEventListener('click', () => toggleCart(false));

// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (nav) nav.classList.toggle('open');
  });
}

// Close mobile menu when clicking a link
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      // Subtle delay can be added here if needed, but the cross-fade mostly handles it
    }
  });
});

// Scroll effect for header
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

// Checkout Logic
const checkoutBtn = document.getElementById('checkout-btn');
const showcaseBuyBtn = document.getElementById('showcase-buy-btn');

window.openCheckout = () => {
  if (cart.length === 0) return alert('Your cart is empty');
  window.navigateTo('checkout-details');
  toggleCart(false);
};

if (checkoutBtn) checkoutBtn.addEventListener('click', window.openCheckout);

// Connect Showcase Buy Button to Cart & Checkout
if (showcaseBuyBtn) {
  showcaseBuyBtn.addEventListener('click', () => {
    // Check if we have the book in the remote library
    const guideItem = dbBooks.find(b => b.title.includes('Better Product Photos'));
    
    if (guideItem) {
      window.addToCart(guideItem.id);
    } else {
      // Fallback if DB doesn't have it explicitly matched yet
      const tempId = 'guide-' + Date.now();
      const isDiscounted = isLaunchDiscountActive();
      const mockGuide = {
        id: tempId,
        title: 'Better Product Photos Using Just Your Phone',
        price: isDiscounted ? 299 : 399,
        original_price: 399,
        image_url: 'https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/images/IMG_5950.PNG',
        category: 'Guide'
      };
      
      cart.push({ ...mockGuide, quantity: 1 });
      updateCart();
      toggleCart(true);
    }
  });
}

function renderCheckoutSummaries() {
  const detailsSummary = document.getElementById('details-summary-items');
  const paymentSummary = document.getElementById('payment-summary-items');
  const sharedTotals = document.querySelectorAll('.shared-total');
  const sharedSubtotals = document.querySelectorAll('.shared-subtotal');
  
  if (!detailsSummary && !paymentSummary) return;

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  
  const itemsHtml = cart.map(item => `
    <div class="summary-item">
      <div class="summary-item-img" style="background-image: url('${item.image_url}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
      <div class="summary-item-info">
        <h4>${item.title}</h4>
        <p>Qty: ${item.quantity}</p>
      </div>
      <div class="summary-item-price">₹${(Number(item.price) * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  if (detailsSummary) detailsSummary.innerHTML = itemsHtml;
  if (paymentSummary) paymentSummary.innerHTML = itemsHtml;
  
  sharedTotals.forEach(el => el.innerText = `₹${total.toFixed(2)}`);
  sharedSubtotals.forEach(el => el.innerText = `₹${total.toFixed(2)}`);
}

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

// Cache verification results to avoid repeated API calls
const emailVerifyCache = {};

async function verifyEmailDeliverability(email) {
  if (emailVerifyCache[email] !== undefined) return emailVerifyCache[email];
  const apiKey = import.meta.env.VITE_ABSTRACT_EMAIL_KEY;
  if (!apiKey) {
    // No API key configured — fall back to allowing through
    return { deliverable: true };
  }
  try {
    const res = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    // Abstract API returns:
    //  is_valid_format.value, is_mx_found.value, deliverability ("DELIVERABLE" / "UNDELIVERABLE" / "UNKNOWN")
    const deliverable = data.deliverability === 'DELIVERABLE';
    const hasMx = data.is_mx_found?.value === true;
    const validFormat = data.is_valid_format?.value === true;

    const result = {
      // Only block if the domain provably has NO mail server — avoids false positives
      // on real emails that Abstract API marks UNDELIVERABLE (common with privacy-protected/corporate)
      deliverable: data.is_mx_found?.value !== false,
      hasMx: data.is_mx_found?.value === true,
      deliverability: data.deliverability,
      validFormat: data.is_valid_format?.value === true
    };
    emailVerifyCache[email] = result;
    return result;
  } catch {
    // Network error — fail open so genuine users aren't blocked
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

// Debounced real-time check
let verifyDebounceTimer = null;
async function updateEmailValidationUI(email) {
  const container = document.getElementById('email-error-container');
  const emailInput = document.getElementById('email');
  if (!container || !emailInput) return;

  // Always cancel any pending check first — prevents stale timers from overriding current state
  clearTimeout(verifyDebounceTimer);

  if (email === '') {
    container.innerHTML = '';
    emailInput.classList.remove('input-invalid', 'input-valid');
    return;
  }

  // Step 1: Format + typo check (instant)
  const formatResult = validateEmailFormat(email);
  if (!formatResult.valid) {
    showEmailError(container, emailInput, formatResult.message, formatResult.suggestion);
    return;
  }

  // Step 2: Abstract API deliverability check (async, debounced 800ms)
  showEmailChecking(container, emailInput);
  verifyDebounceTimer = setTimeout(async () => {
    const result = await verifyEmailDeliverability(email);
    if (!result.deliverable) {
      showEmailError(container, emailInput, `This email address doesn't appear to be deliverable. Please use a real email.`);
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
    
    // Step 1: Format check (instant)
    const formatResult = validateEmailFormat(data.email);
    if (!formatResult.valid) {
      updateEmailValidationUI(data.email);
      const emailField = document.getElementById('email');
      if (emailField) { emailField.scrollIntoView({ behavior: 'smooth', block: 'center' }); emailField.focus(); }
      const submitBtn = detailsForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.classList.add('btn-shake'); setTimeout(() => submitBtn.classList.remove('btn-shake'), 600); }
      return;
    }

    // Step 2: Abstract API deliverability check
    const container = document.getElementById('email-error-container');
    const emailInput = document.getElementById('email');
    showEmailChecking(container, emailInput);
    const submitBtn = detailsForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const result = await verifyEmailDeliverability(data.email);

    if (submitBtn) submitBtn.disabled = false;

    if (!result.deliverable) {
      showEmailError(container, emailInput, `This email address doesn't appear to be deliverable. Please check it and try again.`);
      if (emailInput) { emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); emailInput.focus(); }
      if (submitBtn) { submitBtn.classList.add('btn-shake'); setTimeout(() => submitBtn.classList.remove('btn-shake'), 600); }
      return;
    }

    showEmailValid(container, emailInput);
    window.customerDetails = data;
    window.navigateTo('payment');
  });
}

// Real-time validation
document.getElementById('email')?.addEventListener('input', (e) => {
  updateEmailValidationUI(e.target.value);
});

document.getElementById('email')?.addEventListener('blur', (e) => {
  updateEmailValidationUI(e.target.value);
});

const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

const finalPayBtn = document.getElementById('final-pay-btn');
if (finalPayBtn) {
  finalPayBtn.addEventListener('click', () => {
    const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    
    if (totalAmount <= 0) return alert('Your cart is empty');

    const options = {
      "key": razorpayKey,
      "amount": (totalAmount * 100).toString(), // Razorpay expects paise
      "currency": "INR",
      "name": "The November Gurl",
      "description": "Premium Digital Sanctuary Purchase",
      "image": "https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/images/logo.jpeg",
      "handler": async function (response) {
        // This is the success callback
        finalPayBtn.innerText = 'Finalizing Order...';
        finalPayBtn.disabled = true;

        try {
          // 1. Insert Order
          const orderData = {
            customer_name: `${window.customerDetails.firstName} ${window.customerDetails.lastName}`,
            customer_email: window.customerDetails.email,
            total_amount: totalAmount,
            status: 'paid',
            created_at: new Date().toISOString()
          };

          const { data: orderResponse, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select();

          if (orderError) throw orderError;
          const orderId = orderResponse[0].id;

          // 2. Insert Order Items (Aligned with all possible schema versions)
          const orderItemsData = cart.map(item => ({
            order_id: orderId,
            product_id: item.id.toString(),
            book_id: item.id.toString(), // Legacy support
            product_name: item.title,
            price: Number(item.price),
            price_at_purchase: Number(item.price), // Legacy support
            quantity: item.quantity,
            image_url: item.image_url
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsData);

          if (itemsError) {
            console.error('Supabase Order Items Error:', itemsError);
            throw new Error(`Failed to save items: ${itemsError.message}`);
          }
          
          // 3. Send Personalized Email via EmailJS
          try {
            console.log('Attempting to send email with:', orderData.customer_email);
            const emailResult = await sendOrderEmail(orderData, cart);
            if (emailResult) {
              alert("Payment successful! Your branded delivery email has been sent to " + orderData.customer_email);
            }
          } catch (emailErr) {
            console.error('EmailJS Send Error:', emailErr);
            alert("Payment successful and order saved, but we couldn't send the automated email (Error: " + emailErr.text || emailErr.message || emailErr + "). Please contact support.");
          }

          // Success State
          const displayOrderId = document.getElementById('display-order-id');
          if (displayOrderId) displayOrderId.innerText = `#TNG-${orderId.toString().slice(0, 8)}`;
          
          cart = [];
          updateCart();
          window.navigateTo('success');
          
        } catch (err) {
          console.error('Payment Success Handler Error:', err);
          alert(`Order was paid but there was an error: ${err.message}. Please contact support with your Payment ID: ${response.razorpay_payment_id}`);
        } finally {
          finalPayBtn.innerText = 'Pay Now';
          finalPayBtn.disabled = false;
        }
      },
      "prefill": {
        "name": `${window.customerDetails.firstName} ${window.customerDetails.lastName}`,
        "email": window.customerDetails.email
      },
      "theme": { "color": "#7B5E91" } // Accent color
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert(`Payment Failed: ${response.error.description}`);
    });
    rzp.open();
  });
}

// Routing Logic
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

window.navigateTo = (pageId) => {
  // Reset overflow to fix scrolling locks (e.g. from Razorpay or other overlays)
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
      
      // Immediate jump to top
      window.scrollTo(0, 0);
      handleNewPage(pageId, targetPage);
    }, 400); // Wait for the start of the fade-out
  } else if (!currentActivePage || currentActivePage !== targetPage) {
    window.scrollTo(0, 0);
    handleNewPage(pageId, targetPage);
  }
};

function handleNewPage(pageId, targetPage) {
  if (pageId.startsWith('checkout') || pageId === 'payment') {
    renderCheckoutSummaries();
  }

  // Clear all states
  pages.forEach(p => {
    p.classList.remove('active', 'fading-out');
    p.style.display = 'none';
  });
  navLinks.forEach(l => l.classList.remove('active'));
  
  targetPage.style.display = '';
  // Trigger layout
  void targetPage.offsetWidth; 
  targetPage.classList.add('active');

  const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageId = link.getAttribute('data-page');
    window.navigateTo(pageId);
    if (pageId === 'home') window.location.hash = '';
    else window.location.hash = pageId;
  });
});

window.scrollToElement = (id) => {
  window.navigateTo('home');
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};


/**
 * Generates a unique, time-limited Supabase Storage signed URL for a file.
 * Expires in 48 hours (172800 seconds).
 * The file must exist inside the private 'guides' bucket in Supabase Storage.
 */
async function generateSignedDownloadUrl(filePath) {
  if (!filePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from('book')
      .createSignedUrl(filePath, 172800); // 48 hours in seconds
    if (error) {
      console.error('Signed URL error:', error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return null;
  }
}

async function sendOrderEmail(orderData, cartItems) {
  if (!window.emailjs) {
    console.error('EmailJS not loaded');
    return;
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  // Combine product titles for the email
  const productNames = cartItems.map(item => item.title).join(', ');
  
  const firstItem = cartItems[0];
  let downloadLink = 'https://thenovembergurl.com/library'; // default fallback

  if (firstItem?.title?.includes('Better Product Photos')) {
    // Verified public URL for the guide
    downloadLink = `https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/book/${encodeURIComponent(firstItem.file_path || 'Better Product Photos, just using your phone - Kalyani.pdf')}`;
  } else if (firstItem?.file_path) {
    const signedUrl = await generateSignedDownloadUrl(firstItem.file_path);
    if (signedUrl) downloadLink = signedUrl;
  } else {
    // Final fallback
    downloadLink = firstItem?.download_url || 'https://thenovembergurl.com/library';
  }

  const templateParams = {
    to_email: orderData.customer_email,
    to_name: orderData.customer_name,
    customer_name: orderData.customer_name,
    customer_email: orderData.customer_email,
    product_name: productNames,
    download_link: downloadLink,
    order_id: `TNG-${Date.now().toString().slice(-6)}`,
    logo_url: "https://uwegkwbqxeqrvxryxtsf.supabase.co/storage/v1/object/public/images/logo.jpeg" // Expected public URL
  };

  try {
    const result = await window.emailjs.send(serviceId, templateId, templateParams);
    console.log('EmailJS Success:', result);
    return true;
  } catch (error) {
    console.error('EmailJS Error Object:', error);
    throw error;
  }
}

// Initialize
fetchLibrary();
updateCart();
