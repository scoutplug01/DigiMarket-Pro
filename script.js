// ============================================
// FINAL FIXED script.js - PART 1 OF 2
// FIXES: Payment screenshot storage + Admin chat visibility
// ============================================

// Initialize AOS
AOS.init({ duration: 800, once: true });

// Global State
let currentUser = null;
let allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
let cart = [];
let notifications = [];
let allPayments = JSON.parse(localStorage.getItem('allPayments')) || [];
let allChats = JSON.parse(localStorage.getItem('allChats')) || [];

// Products Data
const products = [
    { id: 1, name: "E-Commerce Website Template", category: "websites", price: 149, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", description: "Professional e-commerce template", rating: 4.8, reviews: 124, featured: true, features: ["Responsive Design", "Shopping Cart", "Payment Integration"], downloadLink: "https://example.com/download/ecommerce" },
    { id: 2, name: "Mobile Banking App", category: "apps", price: 199, image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80", description: "Secure mobile banking", rating: 4.9, reviews: 89, featured: true, features: ["Secure Auth", "Transactions", "Budget Tracking"], downloadLink: "https://example.com/download/banking" },
    { id: 3, name: "Payment Gateway API", category: "apis", price: 129, image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", description: "Robust payment API", rating: 4.7, reviews: 156, featured: true, features: ["Multiple Methods", "Secure", "Webhooks"], downloadLink: "https://example.com/download/payment" },
    { id: 4, name: "AI Content Generator", category: "ai-tools", price: 179, image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", description: "AI-powered content", rating: 4.9, reviews: 203, featured: true, features: ["Multiple Types", "SEO", "Languages"], downloadLink: "https://example.com/download/ai" },
    { id: 5, name: "Web Development Course", category: "courses", price: 99, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80", description: "Complete bootcamp", rating: 4.8, reviews: 412, featured: true, features: ["50+ Hours", "Projects", "Certificate"], downloadLink: "https://example.com/download/course" },
    { id: 6, name: "WordPress SEO Plugin", category: "plugins", price: 89, image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80", description: "Advanced SEO plugin", rating: 4.6, reviews: 278, featured: true, features: ["On-Page SEO", "Schema", "Sitemaps"], downloadLink: "https://example.com/download/seo" }
];

// HELPER: Compress Image to reduce storage
function compressImage(base64, maxWidth = 800) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.6 quality
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            resolve(compressed);
        };
        img.src = base64;
    });
}

// Copy to Clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => alert('Copied!')).catch(() => alert('Copy: ' + text));
};

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        showMainWebsite();
        loadUserData();
    } else {
        showLoginPage();
    }
}

function loadUserData() {
    if (currentUser) {
        cart = currentUser.cart || [];
        notifications = currentUser.notifications || [];
        updateCartUI();
        updateNotificationUI();
        updateUIForUser();
    }
}

function saveCurrentUser() {
    if (currentUser) {
        // Don't save cart in currentUser to reduce size
        const userToSave = {...currentUser};
        delete userToSave.payments; // Payments stored separately
        localStorage.setItem('currentUser', JSON.stringify(userToSave));
        
        const index = allUsers.findIndex(u => u.email === currentUser.email);
        if (index !== -1) {
            allUsers[index] = {...currentUser};
            delete allUsers[index].payments; // Don't duplicate payments
            try {
                localStorage.setItem('allUsers', JSON.stringify(allUsers));
            } catch (e) {
                console.warn('Storage full, skipping allUsers save');
            }
        }
    }
}

// Register
document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const accountType = document.getElementById('accountType').value;
    
    if (allUsers.find(u => u.email === email)) {
        alert('Email already registered!');
        return;
    }
    
    const newUser = {
        name, email, password, accountType,
        isAdmin: false, cart: [], notifications: [],
        createdAt: Date.now()
    };
    
    allUsers.push(newUser);
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    alert('Account created! Please login.');
    showLoginPage();
    document.getElementById('registerForm').reset();
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainWebsite();
        loadUserData();
        document.getElementById('loginForm').reset();
        alert('Welcome, ' + user.name + '!');
    } else {
        alert('Invalid email or password!');
    }
});

// Logout
document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Logout?')) {
        saveCurrentUser();
        currentUser = null;
        cart = [];
        notifications = [];
        localStorage.removeItem('currentUser');
        showLoginPage();
        alert('Logged out!');
    }
});

// ============================================
// PAGES & NAVIGATION
// ============================================

function showLoginPage() {
    document.getElementById('loginPage')?.classList.remove('hidden');
    document.getElementById('registerPage')?.classList.add('hidden');
    document.getElementById('mainWebsite')?.classList.add('hidden');
}

function showRegisterPage() {
    document.getElementById('loginPage')?.classList.add('hidden');
    document.getElementById('registerPage')?.classList.remove('hidden');
    document.getElementById('mainWebsite')?.classList.add('hidden');
}

function showMainWebsite() {
    document.getElementById('loginPage')?.classList.add('hidden');
    document.getElementById('registerPage')?.classList.add('hidden');
    document.getElementById('mainWebsite')?.classList.remove('hidden');
    showHomePage();
    initializeSwiper();
}

function showHomePage() {
    document.getElementById('homePage')?.classList.remove('hidden');
    document.getElementById('browsePage')?.classList.add('hidden');
    document.getElementById('dashboardPage')?.classList.add('hidden');
    loadFeaturedProducts();
}

function showBrowsePage() {
    document.getElementById('homePage')?.classList.add('hidden');
    document.getElementById('browsePage')?.classList.remove('hidden');
    document.getElementById('dashboardPage')?.classList.add('hidden');
    loadBrowseProducts();
}

function showDashboardPage(section = 'overview') {
    document.getElementById('homePage')?.classList.add('hidden');
    document.getElementById('browsePage')?.classList.add('hidden');
    document.getElementById('dashboardPage')?.classList.remove('hidden');
    loadDashboardSection(section);
}

// Navigation Links
document.getElementById('showRegister')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterPage(); });
document.getElementById('showLogin')?.addEventListener('click', (e) => { e.preventDefault(); showLoginPage(); });
document.getElementById('logoLink')?.addEventListener('click', (e) => { e.preventDefault(); showHomePage(); });
document.getElementById('homeLink')?.addEventListener('click', (e) => { e.preventDefault(); showHomePage(); });
document.getElementById('browseLink')?.addEventListener('click', (e) => { e.preventDefault(); showBrowsePage(); });
document.getElementById('dashboardLink')?.addEventListener('click', (e) => { e.preventDefault(); showDashboardPage('overview'); });

document.getElementById('becomeSellerLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser && currentUser.accountType === 'buyer') {
        if (confirm('Upgrade to Seller?')) {
            currentUser.accountType = 'seller';
            saveCurrentUser();
            alert('You are now a Seller!');
            updateUIForUser();
            showDashboardPage('products');
        }
    }
});

function updateUIForUser() {
    const link = document.getElementById('becomeSellerLink');
    if (currentUser && currentUser.accountType === 'seller') {
        if (link) link.style.display = 'none';
    } else {
        if (link) link.style.display = 'block';
    }
}

// ============================================
// PRODUCTS & CART
// ============================================

function loadFeaturedProducts() {
    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    products.filter(p => p.featured).forEach(product => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                    <span class="product-badge">Featured</span>
                </div>
                <div class="product-body">
                    <h5 class="product-title">${product.name}</h5>
                    <span class="product-category">${product.category}</span>
                    <p class="product-description">${product.description}</p>
                    <div class="product-rating">
                        <span class="stars-display">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                        <span class="rating-text">${product.rating} (${product.reviews})</span>
                    </div>
                    <div class="product-price">$${product.price}</div>
                    <button class="btn btn-primary-custom w-100 add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.appendChild(slide);
    });
    attachProductListeners();
}

function initializeSwiper() {
    setTimeout(() => {
        new Swiper('.productsSwiper', {
            slidesPerView: 1, spaceBetween: 30, loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
        });
    }, 100);
}

document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        showBrowsePage();
        document.getElementById('categoryFilter').value = category;
        filterProducts();
    });
});

document.getElementById('searchBtn')?.addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    showBrowsePage();
    filterProducts(query);
});

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        showBrowsePage();
        filterProducts(e.target.value);
    }
});

function loadBrowseProducts(filter = {}) {
    const container = document.getElementById('browseProductsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let filtered = [...products];
    if (filter.category && filter.category !== 'all') filtered = filtered.filter(p => p.category === filter.category);
    if (filter.priceRange) {
        const [min, max] = filter.priceRange.split('-').map(Number);
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }
    if (filter.search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            p.description.toLowerCase().includes(filter.search.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">No products found.</div></div>';
        return;
    }
    
    filtered.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';
        col.innerHTML = `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                </div>
                <div class="product-body">
                    <h5 class="product-title">${product.name}</h5>
                    <span class="product-category">${product.category}</span>
                    <p class="product-description">${product.description}</p>
                    <div class="product-rating">
                        <span class="stars-display">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                        <span class="rating-text">${product.rating}</span>
                    </div>
                    <div class="product-price">$${product.price}</div>
                    <button class="btn btn-primary-custom w-100 add-to-cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
    attachProductListeners();
}

function filterProducts(search = '') {
    const category = document.getElementById('categoryFilter')?.value;
    const priceRange = document.getElementById('priceFilter')?.value;
    loadBrowseProducts({ category, priceRange: priceRange !== 'all' ? priceRange : null, search });
}

document.getElementById('categoryFilter')?.addEventListener('change', () => filterProducts());
document.getElementById('priceFilter')?.addEventListener('change', () => filterProducts());

function attachProductListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(parseInt(e.target.closest('.add-to-cart-btn').dataset.productId));
        });
    });
    
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart-btn')) {
                showProductDetail(parseInt(card.dataset.productId));
            }
        });
    });
}

function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = `
        <div class="modal fade show" id="productDetailModal" style="display: block;" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${product.name}</h5>
                        <button type="button" class="btn-close" onclick="closeProductDetail()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${product.image}" alt="${product.name}" class="product-detail-img">
                            </div>
                            <div class="col-md-6">
                                <span class="product-category">${product.category}</span>
                                <h3>${product.name}</h3>
                                <p>${product.description}</p>
                                <div class="product-features">
                                    <h6>Features:</h6>
                                    <ul>${product.features.map(f => `<li><i class="fas fa-check text-success me-2"></i>${f}</li>`).join('')}</ul>
                                </div>
                                <div class="price-section">
                                    <h2 class="text-primary">$${product.price}</h2>
                                </div>
                                <button class="btn btn-primary-custom btn-lg w-100 mt-3" onclick="addToCart(${product.id}); closeProductDetail();">
                                    <i class="fas fa-shopping-cart"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

window.closeProductDetail = function() {
    document.getElementById('productDetailModal')?.remove();
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
};

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (cart.find(item => item.id === productId)) {
        alert('Already in cart!');
        return;
    }
    cart.push({...product, quantity: 1});
    updateCartUI();
    currentUser.cart = cart;
    saveCurrentUser();
    addNotification(`Added "${product.name}" to cart`, 'success');
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    if (count) count.textContent = cart.length;
}

document.getElementById('cartIcon')?.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const modal = `
        <div class="modal fade show" id="cartModal" style="display: block;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5><i class="fas fa-shopping-cart"></i> Your Cart</h5>
                        <button class="btn-close btn-close-white" onclick="closeCartModal()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="cart-items">
                            ${cart.map(item => `
                                <div class="cart-item">
                                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                                    <div class="cart-item-details">
                                        <h6>${item.name}</h6>
                                        <p class="text-muted">${item.category}</p>
                                    </div>
                                    <div class="cart-item-price">$${item.price}</div>
                                    <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="cart-summary">
                            <div class="summary-row total">
                                <span>Total:</span>
                                <span>$${total}</span>
                            </div>
                        </div>
                        <button class="btn btn-primary-custom btn-lg w-100 mt-3" onclick="proceedToCheckout()">
                            <i class="fas fa-lock"></i> Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
});

window.closeCartModal = function() {
    document.getElementById('cartModal')?.remove();
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    currentUser.cart = cart;
    saveCurrentUser();
    closeCartModal();
    if (cart.length > 0) document.getElementById('cartIcon').click();
};

window.proceedToCheckout = function() {
    closeCartModal();
    if (cart.length === 0) return;
    
    const product = cart[0];
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    document.getElementById('paymentProductImage').src = product.image;
    document.getElementById('paymentProductName').textContent = product.name;
    document.getElementById('paymentProductCategory').textContent = product.category;
    document.getElementById('paymentProductPrice').textContent = `$${product.price}`;
    document.getElementById('payerProduct').value = product.name;
    document.getElementById('payerAmount').value = product.price;
    document.getElementById('payerName').value = currentUser.name;
    modal.show();
};

// ============================================
// END OF PART 1 - CONTINUE WITH PART 2
// ============================================



// ============================================
// FINAL FIXED script.js - PART 2 OF 2
// PAYMENT WITH COMPRESSED IMAGES + ADMIN CHAT
// ============================================

// ============================================
// PAYMENT SUBMISSION - FIXED WITH COMPRESSION
// ============================================

document.getElementById('paymentProofForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('💳 Payment form submitted!');
    
    const payerName = document.getElementById('payerName').value.trim();
    const product = document.getElementById('payerProduct').value.trim();
    const amount = document.getElementById('payerAmount').value;
    const bank = document.getElementById('paymentBank').value;
    const screenshotFile = document.getElementById('paymentScreenshot').files[0];
    
    // Validation
    if (!payerName || !product || !amount || !bank) {
        alert('❌ Please fill all fields!');
        return;
    }
    
    if (!screenshotFile) {
        alert('❌ Please upload payment screenshot!');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    try {
        // Read and compress image
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                console.log('📸 Compressing image...');
                
                // Compress image to reduce size
                const compressedImage = await compressImage(event.target.result, 600);
                
                console.log('Original size:', event.target.result.length);
                console.log('Compressed size:', compressedImage.length);
                
                const payment = {
                    id: 'PAY' + Date.now(),
                    userId: currentUser.email,
                    userName: currentUser.name,
                    payerName: payerName,
                    product: product,
                    amount: parseFloat(amount),
                    bank: bank,
                    screenshot: compressedImage, // Use compressed image
                    status: 'pending',
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString()
                };
                
                console.log('✅ Payment object created');
                
                // Save to allPayments
                allPayments.push(payment);
                try {
                    localStorage.setItem('allPayments', JSON.stringify(allPayments));
                    console.log('✅ Saved to allPayments');
                } catch (storageError) {
                    console.error('Storage error:', storageError);
                    // If storage full, keep only last 20 payments
                    allPayments = allPayments.slice(-20);
                    localStorage.setItem('allPayments', JSON.stringify(allPayments));
                }
                
                // Don't save full payment in user object, just reference
                if (!currentUser.paymentIds) currentUser.paymentIds = [];
                currentUser.paymentIds.push(payment.id);
                saveCurrentUser();
                
                console.log('✅ Payment saved successfully!');
                
                // Remove from cart
                const productInCart = cart.find(p => p.name === product);
                if (productInCart) {
                    cart = cart.filter(p => p.id !== productInCart.id);
                    updateCartUI();
                }
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                if (modal) modal.hide();
                
                // Success alert
                alert('✅ PAYMENT SUBMITTED!\n\n' +
                      '📋 Order ID: ' + payment.id + '\n' +
                      '💰 Amount: $' + payment.amount + '\n' +
                      '📦 Product: ' + payment.product + '\n\n' +
                      '⏳ Status: Pending Review\n\n' +
                      'Admin will confirm your payment soon!\n' +
                      'Check Dashboard > Orders for updates.');
                
                // Reset form
                document.getElementById('paymentProofForm').reset();
                document.getElementById('screenshotPreview').innerHTML = '';
                
                // Restore button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                console.error('❌ Processing error:', error);
                alert('❌ Error: ' + error.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
        
        reader.onerror = function() {
            alert('❌ Error reading file');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        };
        
        reader.readAsDataURL(screenshotFile);
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        alert('❌ Error: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Screenshot Preview
document.getElementById('paymentScreenshot')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5000000) { // 5MB limit
            alert('⚠️ Image too large! Please use a smaller image (under 5MB)');
            e.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('screenshotPreview').innerHTML = 
                `<img src="${e.target.result}" style="max-width: 100%; border-radius: 10px; margin-top: 1rem;">`;
        };
        reader.readAsDataURL(file);
    }
});

// ============================================
// NOTIFICATIONS
// ============================================

function addNotification(message, type = 'info') {
    notifications.unshift({ id: Date.now(), message, type, timestamp: Date.now(), read: false });
    updateNotificationUI();
    saveCurrentUser();
}

function updateNotificationUI() {
    const badge = document.getElementById('notificationBadge');
    if (badge) badge.textContent = notifications.filter(n => !n.read).length;
}

document.getElementById('notificationIcon')?.addEventListener('click', () => {
    document.getElementById('notificationDropdown').classList.toggle('hidden');
});

// ============================================
// LIVE CHAT - ADMIN CAN SEE ALL MESSAGES
// ============================================

let chatOpen = false;

document.getElementById('liveChatBtn')?.addEventListener('click', () => {
    if (chatOpen) {
        closeLiveChat();
    } else {
        openLiveChat();
    }
});

function openLiveChat() {
    chatOpen = true;
    
    const chatModal = `
        <div class="chat-modal" id="chatModal">
            <div class="chat-header">
                <h5><i class="fas fa-comments"></i> Live Support</h5>
                <button class="chat-close-btn" onclick="closeLiveChat()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-messages" id="chatMessagesContainer">
                <div class="chat-empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Chat with our support team!</p>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type your message...">
                <button class="chat-send-btn" onclick="sendChatMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatModal);
    loadUserChatMessages();
    
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function loadUserChatMessages() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;
    
    const userChats = allChats.filter(chat => chat.userId === currentUser.email);
    
    if (userChats.length === 0) {
        container.innerHTML = `
            <div class="chat-empty-state">
                <i class="fas fa-comments"></i>
                <p>Chat with our support team!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userChats.map(chat => `
        <div class="chat-message ${chat.sender}">
            <div class="message-sender">${chat.sender === 'user' ? 'You' : 'Support Team'}</div>
            <div class="message-bubble" style="background: ${chat.sender === 'user' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'white'}; color: ${chat.sender === 'user' ? 'white' : '#1e293b'};">
                ${chat.message}
            </div>
            <div class="message-time">${new Date(chat.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) {
        alert('Please type a message!');
        return;
    }
    
    console.log('💬 Sending:', message);
    
    // Save message to allChats
    const chatMessage = {
        id: 'CHAT' + Date.now(),
        userId: currentUser.email,
        userName: currentUser.name,
        userEmail: currentUser.email,
        message: message,
        sender: 'user',
        timestamp: Date.now(),
        read: false
    };
    
    allChats.push(chatMessage);
    localStorage.setItem('allChats', JSON.stringify(allChats));
    
    console.log('✅ Message saved! Total chats:', allChats.length);
    
    input.value = '';
    loadUserChatMessages();
    
    // Auto reply
    setTimeout(() => {
        const autoReply = {
            id: 'CHAT' + Date.now(),
            userId: currentUser.email,
            userName: 'Support',
            userEmail: currentUser.email,
            message: 'Thank you! Our support team will respond shortly. 😊',
            sender: 'support',
            timestamp: Date.now(),
            read: false
        };
        
        allChats.push(autoReply);
        localStorage.setItem('allChats', JSON.stringify(allChats));
        loadUserChatMessages();
    }, 1500);
};

window.closeLiveChat = function() {
    chatOpen = false;
    document.getElementById('chatModal')?.remove();
};

// ============================================
// DASHBOARD
// ============================================

function loadDashboardSection(section) {
    const content = document.getElementById('dashboardContent');
    if (!content) return;
    
    document.querySelectorAll('.dashboard-menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) item.classList.add('active');
    });
    
    switch(section) {
        case 'overview': loadOverview(content); break;
        case 'products': loadMyProducts(content); break;
        case 'purchases': loadMyPurchases(content); break;
        case 'orders': loadOrders(content); break;
        case 'sales': loadSales(content); break;
        case 'messages': loadMessages(content); break;
        case 'settings': loadSettings(content); break;
    }
}

document.querySelectorAll('.dashboard-menu-item').forEach(item => {
    item.addEventListener('click', () => loadDashboardSection(item.dataset.section));
});

function loadOverview(content) {
    const userPayments = allPayments.filter(p => p.userId === currentUser.email);
    const confirmed = userPayments.filter(p => p.status === 'confirmed').length;
    const pending = userPayments.filter(p => p.status === 'pending').length;
    const spent = userPayments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
    
    content.innerHTML = `
        <h2><i class="fas fa-chart-line"></i> Dashboard Overview</h2>
        <div class="row mt-4">
            <div class="col-md-4 mb-3">
                <div class="stat-card">
                    <i class="fas fa-check-circle fa-2x mb-3"></i>
                    <div class="stat-value">${confirmed}</div>
                    <div>Confirmed Purchases</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="stat-card">
                    <i class="fas fa-clock fa-2x mb-3"></i>
                    <div class="stat-value">${pending}</div>
                    <div>Pending Orders</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="stat-card">
                    <i class="fas fa-dollar-sign fa-2x mb-3"></i>
                    <div class="stat-value">$${spent}</div>
                    <div>Total Spent</div>
                </div>
            </div>
        </div>
    `;
}

function loadMyProducts(content) {
    if (currentUser.accountType !== 'seller') {
        content.innerHTML = `
            <div class="dashboard-card">
                <h4>Seller Account Required</h4>
                <p>Upgrade to start selling!</p>
                <button class="btn btn-primary-custom" onclick="upgradeToSeller()">
                    <i class="fas fa-user-tie"></i> Become Seller
                </button>
            </div>
        `;
        return;
    }
    content.innerHTML = `
        <h2><i class="fas fa-box"></i> My Products</h2>
        <div class="dashboard-card">
            <p>Product management coming soon!</p>
        </div>
    `;
}

function loadMyPurchases(content) {
    const purchases = allPayments.filter(p => p.userId === currentUser.email && p.status === 'confirmed');
    
    content.innerHTML = `
        <h2><i class="fas fa-shopping-bag"></i> My Purchases</h2>
        ${purchases.length === 0 ? 
            '<div class="dashboard-card"><p>No confirmed purchases yet.</p></div>' :
            `<div class="table-responsive mt-4">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.map(p => `
                            <tr>
                                <td>${p.date}</td>
                                <td>${p.product}</td>
                                <td>$${p.amount}</td>
                                <td><span class="status-confirmed">Confirmed</span></td>
                                <td>
                                    <button class="btn btn-download btn-sm" onclick="downloadProduct('${p.product}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`
        }
    `;
}

window.downloadProduct = function(productName) {
    const product = products.find(p => p.name === productName);
    if (product) {
        alert('🎉 Downloading: ' + productName + '\n\nDownload link: ' + product.downloadLink);
        window.open(product.downloadLink, '_blank');
    }
};

function loadOrders(content) {
    const orders = allPayments.filter(p => p.userId === currentUser.email);
    
    content.innerHTML = `
        <h2><i class="fas fa-shopping-cart"></i> My Orders</h2>
        ${orders.length === 0 ? 
            '<div class="dashboard-card"><p>No orders yet.</p></div>' :
            `<div class="table-responsive mt-4">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.slice().reverse().map(order => `
                            <tr>
                                <td><small>#${order.id}</small></td>
                                <td>${order.date}</td>
                                <td>${order.product}</td>
                                <td>$${order.amount}</td>
                                <td><span class="status-${order.status}">${order.status.toUpperCase()}</span></td>
                                <td>
                                    ${order.status === 'confirmed' ? 
                                        `<button class="btn btn-sm btn-download" onclick="downloadProduct('${order.product}')">
                                            <i class="fas fa-download"></i> Download
                                        </button>` :
                                      order.status === 'pending' ? 
                                        '<small class="text-muted">⏳ Awaiting confirmation</small>' :
                                        '<small class="text-danger">❌ Rejected</small>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`
        }
    `;
}

function loadSales(content) {
    content.innerHTML = `
        <h2><i class="fas fa-dollar-sign"></i> Sales</h2>
        <div class="dashboard-card"><p>Sales tracking coming soon!</p></div>
    `;
}

function loadMessages(content) {
    const userChats = allChats.filter(c => c.userId === currentUser.email);
    
    content.innerHTML = `
        <h2><i class="fas fa-envelope"></i> Messages</h2>
        <div class="dashboard-card">
            <p>You have ${userChats.length} message(s)</p>
            <button class="btn btn-primary-custom" onclick="openLiveChat()">
                <i class="fas fa-comments"></i> Open Live Chat
            </button>
        </div>
    `;
}

function loadSettings(content) {
    content.innerHTML = `
        <h2><i class="fas fa-cog"></i> Settings</h2>
        <div class="dashboard-card">
            <h4>Account Information</h4>
            <div class="mb-3">
                <strong>Name:</strong> ${currentUser.name}
            </div>
            <div class="mb-3">
                <strong>Email:</strong> ${currentUser.email}
            </div>
            <div class="mb-3">
                <strong>Account Type:</strong> ${currentUser.accountType}
            </div>
            <div class="mb-3">
                <strong>Admin:</strong> ${currentUser.isAdmin ? 'Yes' : 'No'}
            </div>
        </div>
        
        <div class="dashboard-card mt-4">
            <h4>Actions</h4>
            ${currentUser.accountType === 'buyer' ? `
                <button class="btn btn-primary-custom mb-2" onclick="upgradeToSeller()">
                    <i class="fas fa-user-tie"></i> Upgrade to Seller
                </button><br>
            ` : ''}
            ${!currentUser.isAdmin ? `
                <button class="btn btn-warning" onclick="makeAdmin()">
                    <i class="fas fa-shield-alt"></i> Make Me Admin
                </button>
            ` : '<p class="text-success">✅ You are an Admin</p>'}
        </div>
    `;
}

window.upgradeToSeller = function() {
    if (confirm('Upgrade to Seller account?')) {
        currentUser.accountType = 'seller';
        saveCurrentUser();
        alert('✅ You are now a Seller!');
        updateUIForUser();
        loadDashboardSection('products');
    }
};

window.makeAdmin = function() {
    if (confirm('Make yourself an Admin?\n\nYou will be able to:\n- View all payments\n- Confirm/reject orders\n- View all user chats\n- Reply to users')) {
        currentUser.isAdmin = true;
        saveCurrentUser();
        alert('✅ You are now an Admin!\n\nRefresh the page to see Admin menus.');
        location.reload();
    }
};

// ============================================
// ADMIN: VIEW ALL PAYMENTS
// ============================================

window.viewAllPayments = function() {
    if (!currentUser || !currentUser.isAdmin) {
        alert('❌ Admin access required!');
        return;
    }
    
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <h2><i class="fas fa-shield-alt"></i> Admin: All Payments</h2>
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i> <strong>Admin View</strong> - You can see all user payments
        </div>
        
        ${allPayments.length === 0 ? 
            '<div class="dashboard-card"><p>No payments yet.</p></div>' :
            `<div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Product</th>
                            <th>Amount</th>
                            <th>Bank</th>
                            <th>Status</th>
                            <th>Screenshot</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allPayments.slice().reverse().map(pay => `
                            <tr>
                                <td><small>${pay.date}</small></td>
                                <td>
                                    <strong>${pay.userName}</strong><br>
                                    <small class="text-muted">${pay.userEmail}</small>
                                </td>
                                <td>${pay.product}</td>
                                <td><strong>$${pay.amount}</strong></td>
                                <td>${pay.bank}</td>
                                <td><span class="status-${pay.status}">${pay.status.toUpperCase()}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewScreenshot('${pay.screenshot}', '${pay.userName}')">
                                        <i class="fas fa-image"></i> View
                                    </button>
                                </td>
                                <td>
                                    ${pay.status === 'pending' ? `
                                        <button class="btn btn-sm btn-success me-1" onclick="confirmPayment('${pay.id}')">
                                            <i class="fas fa-check"></i> Confirm
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="rejectPayment('${pay.id}')">
                                            <i class="fas fa-times"></i> Reject
                                        </button>
                                    ` : '<small class="text-muted">Processed</small>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`
        }
    `;
};

window.viewScreenshot = function(screenshot, userName) {
    const modal = `
        <div class="modal fade show" id="screenshotModal" style="display: block; background: rgba(0,0,0,0.8);">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <h5><i class="fas fa-image"></i> Payment Screenshot - ${userName}</h5>
                        <button class="btn-close btn-close-white" onclick="closeScreenshotModal()"></button>
                    </div>
                    <div class="modal-body text-center p-4">
                        <img src="${screenshot}" style="max-width: 100%; max-height: 70vh; border-radius: 10px;" alt="Payment Screenshot">
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
};

window.closeScreenshotModal = function() {
    document.getElementById('screenshotModal')?.remove();
};

window.confirmPayment = function(paymentId) {
    if (!confirm('✅ Confirm this payment?')) return;
    
    const payment = allPayments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'confirmed';
        localStorage.setItem('allPayments', JSON.stringify(allPayments));
        
        alert('✅ Payment Confirmed!\n\nUser: ' + payment.userName + '\nProduct: ' + payment.product);
        viewAllPayments();
    }
};

window.rejectPayment = function(paymentId) {
    const reason = prompt('❌ Rejection reason:');
    if (!reason) return;
    
    const payment = allPayments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'rejected';
        payment.rejectionReason = reason;
        localStorage.setItem('allPayments', JSON.stringify(allPayments));
        
        alert('❌ Payment Rejected\n\nReason: ' + reason);
        viewAllPayments();
    }
};

// ============================================
// ADMIN: VIEW ALL CHATS
// ============================================

window.viewAllChats = function() {
    if (!currentUser || !currentUser.isAdmin) {
        alert('❌ Admin access required!');
        return;
    }
    
    const content = document.getElementById('dashboardContent');
    
    // Group by user
    const chatsByUser = {};
    allChats.forEach(chat => {
        if (!chatsByUser[chat.userId]) {
            chatsByUser[chat.userId] = [];
        }
        chatsByUser[chat.userId].push(chat);
    });
    
    const userCount = Object.keys(chatsByUser).length;
    
    content.innerHTML = `
        <h2><i class="fas fa-comments"></i> Admin: All Chats</h2>
        <div class="alert alert-info">
            <i class="fas fa-users"></i> <strong>${userCount} user(s)</strong> have sent messages
        </div>
        
        ${userCount === 0 ? 
            '<div class="dashboard-card"><p>No chat messages yet.</p></div>' :
            Object.keys(chatsByUser).map(userId => {
                const userChats = chatsByUser[userId];
                const userName = userChats[0].userName;
                const userEmail = userChats[0].userEmail || userId;
                const unread = userChats.filter(c => !c.read && c.sender === 'user').length;
                
                return `
                    <div class="dashboard-card mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h5>
                                    <i class="fas fa-user-circle"></i> ${userName}
                                    ${unread > 0 ? `<span class="badge bg-danger">${unread} NEW</span>` : ''}
                                </h5>
                                <small class="text-muted">${userEmail}</small>
                            </div>
                            <button class="btn btn-primary" onclick="replyToUser('${userId}', '${userName}')">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                        </div>
                        
                        <div style="max-height: 400px; overflow-y: auto; background: #f8fafc; padding: 1.5rem; border-radius: 10px;">
                            ${userChats.map(chat => `
                                <div class="mb-3" style="text-align: ${chat.sender === 'user' ? 'right' : 'left'};">
                                    <div style="display: inline-block; max-width: 70%; padding: 1rem; border-radius: 15px; 
                                         background: ${chat.sender === 'user' ? '#6366f1' : '#ffffff'}; 
                                         color: ${chat.sender === 'user' ? 'white' : '#1e293b'};
                                         box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.5rem; font-weight: 600;">
                                            ${chat.sender === 'user' ? '👤 ' + userName : '💬 Support'}
                                        </div>
                                        <div style="word-wrap: break-word;">${chat.message}</div>
                                        <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.5rem;">
                                            ${new Date(chat.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')
        }
    `;
};

window.replyToUser = function(userId, userName) {
    const message = prompt(`💬 Reply to ${userName}:`);
    if (!message || !message.trim()) return;
    
    const reply = {
        id: 'CHAT' + Date.now(),
        userId: userId,
        userName: 'Admin Support',
        userEmail: userId,
        message: message.trim(),
        sender: 'support',
        timestamp: Date.now(),
        read: false
    };
    
    allChats.push(reply);
    localStorage.setItem('allChats', JSON.stringify(allChats));
    
    alert('✅ Reply sent to ' + userName + '!');
    viewAllChats();
};

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DigiMarket Pro Initialized!');
    console.log('👥 Users:', allUsers.length);
    console.log('💳 Payments:', allPayments.length);
    console.log('💬 Chats:', allChats.length);
    
    checkAuth();
    
    // Add admin menus
    setTimeout(() => {
        if (currentUser && currentUser.isAdmin) {
            const sidebar = document.querySelector('.dashboard-sidebar');
            if (sidebar && !document.querySelector('[onclick="viewAllPayments()"]')) {
                
                // Admin: Payments
                const paymentsMenu = document.createElement('div');
                paymentsMenu.className = 'dashboard-menu-item';
                paymentsMenu.innerHTML = '<i class="fas fa-shield-alt me-2"></i> Admin: Payments';
                paymentsMenu.onclick = viewAllPayments;
                sidebar.appendChild(paymentsMenu);
                
                // Admin: Chats
                const chatsMenu = document.createElement('div');
                chatsMenu.className = 'dashboard-menu-item';
                chatsMenu.innerHTML = '<i class="fas fa-comments me-2"></i> Admin: Chats';
                chatsMenu.onclick = viewAllChats;
                sidebar.appendChild(chatsMenu);
                
                console.log('✅ Admin menus added!');
            }
        }
    }, 500);
});

console.log('🚀 System Ready!');
console.log('📝 Register or Login to get started');

// ============================================
// END OF PART 2 - COMPLETE!
// ============================================