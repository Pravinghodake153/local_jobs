// AROVIA - Production Multi-Page Application Router & Views
// Zero Emojis. Theme: Light, Dark, Saffron. Pure SVG Icons. BookMyShow Elements.

let currentUser = null;
let currentPricing = null;
let cachedWorkers = [];
let cachedJobs = [];
let searchKeyword = "";
let selectedTradeFilter = "All";
let activeResetPhone = "";

// Trade Poster Imagery
const tradeImages = {
  Electrician: "/images/electrician.jpg",
  Plumber: "/images/plumber.jpg",
  Carpenter: "/images/carpenter.jpg",
  Mason: "/images/mason.jpg",
  Painter: "/images/painter.jpg",
  default: "/images/electrician.jpg",
};

// Pure SVG Icon Helpers (Zero Emojis)
const icons = {
  check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  star: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#EA580C" stroke="#EA580C" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  shield: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  video: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
  mapPin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  user: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  share: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  briefcase: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
};

// UI Notification System
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icons.shield}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// API Request Wrapper
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "An error occurred");
  }
  return data;
}

// ========================================================
// MULTI-PAGE ROUTER (History API with Sub-Domain-Like Paths)
// ========================================================
function navigateRoute(path, pushState = true) {
  if (pushState) {
    history.pushState(null, "", path);
  }
  handleCurrentRoute();
}

window.addEventListener("popstate", () => {
  handleCurrentRoute();
});

// Intercept local links for seamless SPA navigation
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (href && href.startsWith("/") && !href.startsWith("//") && !link.hasAttribute("download") && link.getAttribute("target") !== "_blank") {
    e.preventDefault();
    navigateRoute(href);
  }
});

async function initApp() {
  try {
    const authData = await api("/api/auth/me");
    currentUser = authData.user;
    currentPricing = await api("/api/pricing-corridor");
    cachedWorkers = await api("/api/workers");
  } catch (err) {
    console.error("Init error:", err);
  }
  renderNav();
  handleCurrentRoute();
}

function handleCurrentRoute() {
  const path = window.location.pathname;
  updateBreadcrumbsAndNav(path);

  // 1. Auth Paths (/auth/*)
  if (path === "/auth/login") return renderLoginPage();
  if (path === "/auth/signup") return renderSignupPage();
  if (path === "/auth/forgot-password") return renderForgotPasswordPage();
  if (path === "/auth/demo") return renderDemoPortalPage();

  // 2. Worker Role Paths (/worker/*)
  if (path === "/worker/dashboard" || path === "/worker") return renderWorkerDashboardPage();
  if (path === "/worker/skills") return renderWorkerSkillsPage();
  if (path === "/worker/jobs") return renderWorkerJobsPage();
  if (path === "/worker/pricing") return renderWorkerPricingPage();
  if (path === "/worker/profile") return renderWorkerProfilePage();

  // 3. Customer Role Paths (/customer/*)
  if (path === "/customer/dashboard" || path === "/customer") return renderCustomerDashboardPage();
  if (path === "/customer/workers") return renderCustomerWorkersPage();
  if (path === "/customer/post-job") return renderCustomerPostJobPage();
  if (path === "/customer/bookings") return renderCustomerBookingsPage();
  if (path === "/customer/reviews") return renderCustomerReviewsPage();

  // 4. Contractor Role Paths (/contractor/*)
  if (path === "/contractor/dashboard" || path === "/contractor") return renderContractorDashboardPage();
  if (path === "/contractor/post-contract") return renderContractorPostContractPage();

  // 5. Trades Dynamic Path (/trades/:trade)
  if (path.startsWith("/trades/")) {
    const tradeSlug = path.split("/")[2] || "all";
    return renderTradeLandingPage(tradeSlug);
  }

  // 6. Public Profile Dynamic Path (/profile/:id)
  if (path.startsWith("/profile/")) {
    const workerId = Number(path.split("/")[2]);
    return renderPublicWorkerProfilePage(workerId);
  }

  // 7. Root Path / Default
  return renderHomePage();
}

// Update Breadcrumbs and Role Sub-Navigation
function updateBreadcrumbsAndNav(path) {
  const breadcrumbContainer = document.getElementById("breadcrumb-container");
  const roleNavStrip = document.getElementById("role-nav-strip");
  const roleNavContainer = document.getElementById("role-nav-container");

  // Breadcrumbs builder
  const segments = path.split("/").filter(Boolean);
  let breadcrumbHTML = `<a href="/" class="breadcrumb-link" onclick="navigateRoute('/'); return false;">Home</a>`;

  if (segments.length > 0) {
    let accumulated = "";
    segments.forEach((seg, idx) => {
      accumulated += "/" + seg;
      const isLast = idx === segments.length - 1;
      const cleanTitle = seg.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      breadcrumbHTML += ` <span class="breadcrumb-separator">></span> `;
      if (isLast) {
        breadcrumbHTML += `<span class="breadcrumb-current">${cleanTitle}</span>`;
      } else {
        breadcrumbHTML += `<a href="${accumulated}" class="breadcrumb-link" onclick="navigateRoute('${accumulated}'); return false;">${cleanTitle}</a>`;
      }
    });
  }
  breadcrumbContainer.innerHTML = breadcrumbHTML;

  // Role Sub-Nav builder
  const isWorkerRoute = path.startsWith("/worker");
  const isCustomerRoute = path.startsWith("/customer");
  const isContractorRoute = path.startsWith("/contractor");
  const isAuthRoute = path.startsWith("/auth");

  if (isWorkerRoute || (currentUser && currentUser.role === "worker" && path === "/")) {
    roleNavStrip.style.display = "block";
    roleNavContainer.innerHTML = `
      <div class="role-tabs">
        <span style="font-size: 0.725rem; font-weight: 800; color: #EA580C; margin-right: 0.5rem; text-transform: uppercase;">Worker Suite:</span>
        <a href="/worker/dashboard" class="role-tab-link ${path === '/worker/dashboard' || path === '/worker' ? 'active' : ''}">Overview</a>
        <a href="/worker/skills" class="role-tab-link ${path === '/worker/skills' ? 'active' : ''}">AI Skill Proof</a>
        <a href="/worker/jobs" class="role-tab-link ${path === '/worker/jobs' ? 'active' : ''}">Nearby Jobs</a>
        <a href="/worker/pricing" class="role-tab-link ${path === '/worker/pricing' ? 'active' : ''}">Price Corridor</a>
        <a href="/worker/profile" class="role-tab-link ${path === '/worker/profile' ? 'active' : ''}">My Profile & QR</a>
      </div>
      <div>
        <span class="badge badge-verified">${icons.shield} AI-Verified Active</span>
      </div>
    `;
  } else if (isCustomerRoute || (currentUser && currentUser.role === "customer" && path === "/")) {
    roleNavStrip.style.display = "block";
    roleNavContainer.innerHTML = `
      <div class="role-tabs">
        <span style="font-size: 0.725rem; font-weight: 800; color: #EA580C; margin-right: 0.5rem; text-transform: uppercase;">Customer Suite:</span>
        <a href="/customer/dashboard" class="role-tab-link ${path === '/customer/dashboard' || path === '/customer' ? 'active' : ''}">Overview</a>
        <a href="/customer/workers" class="role-tab-link ${path === '/customer/workers' ? 'active' : ''}">Browse Workers</a>
        <a href="/customer/post-job" class="role-tab-link ${path === '/customer/post-job' ? 'active' : ''}">Post Request</a>
        <a href="/customer/bookings" class="role-tab-link ${path === '/customer/bookings' ? 'active' : ''}">My Bookings</a>
        <a href="/customer/reviews" class="role-tab-link ${path === '/customer/reviews' ? 'active' : ''}">Two-Way Reviews</a>
      </div>
      <div>
        <a href="/customer/post-job" class="btn btn-primary btn-sm">+ Post Job</a>
      </div>
    `;
  } else if (isContractorRoute) {
    roleNavStrip.style.display = "block";
    roleNavContainer.innerHTML = `
      <div class="role-tabs">
        <span style="font-size: 0.725rem; font-weight: 800; color: #0F172A; margin-right: 0.5rem; text-transform: uppercase;">Contractor Suite:</span>
        <a href="/contractor/dashboard" class="role-tab-link ${path === '/contractor/dashboard' || path === '/contractor' ? 'active' : ''}">Site Roster</a>
        <a href="/contractor/post-contract" class="role-tab-link ${path === '/contractor/post-contract' ? 'active' : ''}">Broadcast Contract</a>
        <a href="/customer/workers" class="role-tab-link">Verified Technicians Directory</a>
      </div>
      <div>
        <span class="badge badge-muted">Commercial Supervisor</span>
      </div>
    `;
  } else if (isAuthRoute) {
    roleNavStrip.style.display = "block";
    roleNavContainer.innerHTML = `
      <div class="role-tabs">
        <span style="font-size: 0.725rem; font-weight: 800; color: #EA580C; margin-right: 0.5rem; text-transform: uppercase;">Account Access:</span>
        <a href="/auth/login" class="role-tab-link ${path === '/auth/login' ? 'active' : ''}">Login</a>
        <a href="/auth/signup" class="role-tab-link ${path === '/auth/signup' ? 'active' : ''}">Sign Up</a>
        <a href="/auth/forgot-password" class="role-tab-link ${path === '/auth/forgot-password' ? 'active' : ''}">Forgot Password</a>
        <a href="/auth/demo" class="role-tab-link ${path === '/auth/demo' ? 'active' : ''}">1-Click Evaluator Demo</a>
      </div>
    `;
  } else {
    roleNavStrip.style.display = "none";
  }
}

// Render Top Navigation
function renderNav() {
  const navActions = document.getElementById("nav-actions");
  if (!currentUser) {
    navActions.innerHTML = `
      <a href="/auth/demo" class="btn btn-saffron-soft btn-sm" onclick="navigateRoute('/auth/demo'); return false;">
        ${icons.shield} Demo Access
      </a>
      <a href="/auth/login" class="btn btn-primary btn-sm" onclick="navigateRoute('/auth/login'); return false;">
        ${icons.user} Sign In
      </a>
    `;
    return;
  }

  const roleHome = currentUser.role === "worker" ? "/worker/dashboard" : "/customer/dashboard";
  navActions.innerHTML = `
    <a href="${roleHome}" class="user-pill" style="text-decoration:none; color:inherit;" onclick="navigateRoute('${roleHome}'); return false;">
      <span>${currentUser.name}</span>
      <span class="badge ${currentUser.role === 'worker' ? 'badge-verified' : 'badge-muted'}" style="text-transform:uppercase; font-size:0.65rem;">${currentUser.role}</span>
    </a>
    <a href="/auth/demo" class="btn btn-secondary btn-sm" onclick="navigateRoute('/auth/demo'); return false;">
      ${icons.refresh} Switch Demo
    </a>
    <button class="btn btn-secondary btn-sm" onclick="handleLogout()">
      Logout
    </button>
  `;
}

// Global Search
function handleGlobalSearch(e) {
  searchKeyword = e.target.value.toLowerCase().trim();
  if (window.location.pathname !== "/customer/workers") {
    navigateRoute("/customer/workers");
  } else {
    renderCustomerWorkersPage();
  }
}

// ========================================================
// PAGE 1: ROOT HOME (/ - Public Landing & Overview)
// ========================================================
function renderHomePage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <!-- Hero Billboard -->
    <div class="hero-billboard">
      <img src="/images/banner.jpg" alt="Skilled Craftsmen at Work" class="hero-bg-img">
      <div class="hero-overlay-scrim"></div>
      
      <div class="hero-content">
        <div class="hero-tag">
          ${icons.shield} wHACKiest 2026 · Mystery Track 4 (UnlockED)
        </div>
        <h1 class="hero-title">Proof First, Trust Both Ways.</h1>
        <p class="hero-subtitle">
          AROVIA empowers 250M+ blue-collar workers in India to prove practical trade skills via 30-sec AI video demonstrations. Verified local hiring with balanced price corridors and bilateral ratings.
        </p>

        <div class="hero-chips-row">
          <div class="hero-chip">${icons.shield} 250M+ Workforce</div>
          <div class="hero-chip">${icons.mapPin} 5–15 km Geofenced Circle</div>
          <div class="hero-chip">${icons.star} Bilateral Ratings Sealed to Completed Jobs</div>
          <div class="hero-chip">${icons.check} Worker Controls Rate Inside Fair Range</div>
        </div>

        <div style="display: flex; gap: 0.85rem; flex-wrap: wrap;">
          <a href="/auth/demo" class="btn btn-primary" onclick="navigateRoute('/auth/demo'); return false;">
            ${icons.shield} 1-Click Evaluator Demo Access
          </a>
          <a href="/customer/workers" class="btn btn-dark" onclick="navigateRoute('/customer/workers'); return false;">
            ${icons.play} Explore Verified Pros
          </a>
          <a href="/worker/skills" class="btn btn-secondary" onclick="navigateRoute('/worker/skills'); return false;">
            ${icons.video} Take AI Skill Demonstration
          </a>
        </div>
      </div>
    </div>

    <!-- Role Quick-Launch Portals Grid (BMS Style Cards) -->
    <div class="section-header">
      <div>
        <h2 class="section-title">Explore Dedicated Role Portals</h2>
        <div class="section-subtitle">Dedicated multi-page workflows for workers, customers, and contractors</div>
      </div>
    </div>
    <div class="role-launch-grid">
      <!-- Worker Portal Card -->
      <a href="/worker/dashboard" class="role-launch-card" onclick="navigateRoute('/worker/dashboard'); return false;">
        <img src="/images/electrician.jpg" alt="Worker Portal" class="role-launch-bg">
        <div class="role-launch-gradient"></div>
        <div class="role-launch-content">
          <div class="role-launch-tag">Worker Suite (/worker/*)</div>
          <div class="role-launch-title">Skilled Worker Portal</div>
          <div class="role-launch-desc">AI skill proof, geofenced job feeds, pricing corridors, and portable QR card.</div>
        </div>
      </a>

      <!-- Customer Portal Card -->
      <a href="/customer/workers" class="role-launch-card" onclick="navigateRoute('/customer/workers'); return false;">
        <img src="/images/avatar_priya.jpg" alt="Customer Portal" class="role-launch-bg">
        <div class="role-launch-gradient"></div>
        <div class="role-launch-content">
          <div class="role-launch-tag">Customer Suite (/customer/*)</div>
          <div class="role-launch-title">Service Customer Portal</div>
          <div class="role-launch-desc">Book verified tradespeople, post service requests, and review with evidence.</div>
        </div>
      </a>

      <!-- Contractor Portal Card -->
      <a href="/contractor/dashboard" class="role-launch-card" onclick="navigateRoute('/contractor/dashboard'); return false;">
        <img src="/images/mason.jpg" alt="Contractor Portal" class="role-launch-bg">
        <div class="role-launch-gradient"></div>
        <div class="role-launch-content">
          <div class="role-launch-tag">Contractor Suite (/contractor/*)</div>
          <div class="role-launch-title">Site Contractor Portal</div>
          <div class="role-launch-desc">Multi-technician roster sourcing, bulk site requests, and ITI trainee links.</div>
        </div>
      </a>
    </div>

    <!-- Cast & Crew Strip -->
    <div class="cast-strip-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Top Verified Masters in Bengaluru</h2>
          <div class="section-subtitle">Professionals with verified video demonstrations & bilateral ratings</div>
        </div>
        <a href="/customer/workers" class="breadcrumb-link" onclick="navigateRoute('/customer/workers'); return false;">View All Posters ></a>
      </div>
      <div class="cast-row">
        <div class="cast-card" onclick="quickDemoLoginAndRedirect('9876543210', '/worker/dashboard')">
          <div class="cast-avatar-box"><img src="/images/avatar_ravi.jpg" alt="Ravi Kumar" class="cast-avatar-img"></div>
          <div class="cast-name">Ravi Kumar</div>
          <div class="cast-role">Electrician</div>
          <div style="font-size:0.7rem; color:#EA580C; font-weight:700;">${icons.star} 4.9 (48)</div>
        </div>
        <div class="cast-card" onclick="quickDemoLoginAndRedirect('9876543211', '/worker/dashboard')">
          <div class="cast-avatar-box"><img src="/images/avatar_suresh.jpg" alt="Suresh M" class="cast-avatar-img"></div>
          <div class="cast-name">Suresh M.</div>
          <div class="cast-role">Plumber</div>
          <div style="font-size:0.7rem; color:#EA580C; font-weight:700;">${icons.star} 4.8 (35)</div>
        </div>
        <div class="cast-card" onclick="quickDemoLoginAndRedirect('9876543212', '/worker/dashboard')">
          <div class="cast-avatar-box"><img src="/images/carpenter.jpg" alt="Manjunath R" class="cast-avatar-img"></div>
          <div class="cast-name">Manjunath R.</div>
          <div class="cast-role">Carpenter</div>
          <div style="font-size:0.7rem; color:#EA580C; font-weight:700;">${icons.star} 4.7 (22)</div>
        </div>
        <div class="cast-card" onclick="quickDemoLoginAndRedirect('9876543220', '/customer/dashboard')">
          <div class="cast-avatar-box"><img src="/images/avatar_priya.jpg" alt="Priya Sharma" class="cast-avatar-img"></div>
          <div class="cast-name">Priya Sharma</div>
          <div class="cast-role" style="color:#64748B;">Homeowner</div>
          <div style="font-size:0.7rem; color:#EA580C; font-weight:700;">${icons.star} 5.0 (14)</div>
        </div>
        <div class="cast-card" onclick="quickDemoLoginAndRedirect('9876543221', '/contractor/dashboard')">
          <div class="cast-avatar-box"><img src="/images/avatar_rajesh.jpg" alt="Rajesh Verma" class="cast-avatar-img"></div>
          <div class="cast-name">Rajesh Verma</div>
          <div class="cast-role" style="color:#64748B;">Contractor</div>
          <div style="font-size:0.7rem; color:#EA580C; font-weight:700;">${icons.star} 4.8 (31)</div>
        </div>
      </div>
    </div>

    <!-- Verified Posters Showcase -->
    <div class="section-header">
      <div>
        <h2 class="section-title">Verified Tradespeople Posters</h2>
        <div class="section-subtitle">Click on any card to view video proof, AI checklist, or book service</div>
      </div>
      <a href="/customer/workers" class="btn btn-secondary btn-sm" onclick="navigateRoute('/customer/workers'); return false;">Browse All (${cachedWorkers.length})</a>
    </div>
    <div class="poster-grid">
      ${renderWorkerPosterCards(cachedWorkers)}
    </div>
  `;
}

// ========================================================
// PAGE 2: AUTH - LOGIN (/auth/login)
// ========================================================
function renderLoginPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Sign In to AROVIA</h1>
            <div class="card-subtitle">Access your verified worker or customer account</div>
          </div>
        </div>

        <form onsubmit="handleLoginSubmit(event)">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="login-phone" class="form-control" placeholder="10-digit mobile number" required value="9876543210">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="Account password" required value="demo123">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <a href="/auth/forgot-password" class="breadcrumb-link" style="color: #EA580C; font-weight: 700;" onclick="navigateRoute('/auth/forgot-password'); return false;">
              Forgot Password?
            </a>
            <a href="/auth/signup" class="breadcrumb-link" onclick="navigateRoute('/auth/signup'); return false;">
              Create New Account
            </a>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            ${icons.arrowRight} Sign In
          </button>
        </form>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--color-light-border); text-align: center;">
          <span style="font-size: 0.8rem; color: #64748B;">Testing the platform? </span>
          <a href="/auth/demo" class="breadcrumb-link" style="color: #EA580C; font-weight: 700;" onclick="navigateRoute('/auth/demo'); return false;">
            Use 1-Click Evaluator Demo
          </a>
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 3: AUTH - SIGN UP (/auth/signup)
// ========================================================
function renderSignupPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Create AROVIA Account</h1>
            <div class="card-subtitle">Join the trusted hyper-local trade network</div>
          </div>
        </div>

        <form onsubmit="handleSignupSubmit(event)">
          <div class="form-group">
            <label class="form-label">I want to join as</label>
            <div style="display: flex; gap: 0.75rem;">
              <label style="flex: 1; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700;">
                <input type="radio" name="signup-role" value="worker" checked onchange="toggleSignupFields('worker')">
                Skilled Worker
              </label>
              <label style="flex: 1; display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700;">
                <input type="radio" name="signup-role" value="customer" onchange="toggleSignupFields('customer')">
                Service Customer
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="signup-name" class="form-control" placeholder="e.g. Ramesh Chandra" required>
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="signup-phone" class="form-control" placeholder="10-digit mobile number" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="signup-password" class="form-control" placeholder="Create secure password" required minlength="4">
          </div>

          <div id="worker-specific-fields">
            <div class="form-group">
              <label class="form-label">Primary Trade</label>
              <select id="signup-trade" class="form-control">
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Mason">Mason</option>
                <option value="Painter">Painter</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Base Hourly Rate (INR)</label>
              <input type="number" id="signup-rate" class="form-control" placeholder="e.g. 400" value="400">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">City / Region</label>
            <input type="text" id="signup-city" class="form-control" value="Bengaluru" required>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
            ${icons.check} Create Account
          </button>
        </form>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--color-light-border); text-align: center;">
          <span style="font-size: 0.8rem; color: #64748B;">Already have an account? </span>
          <a href="/auth/login" class="breadcrumb-link" style="color: #EA580C; font-weight: 700;" onclick="navigateRoute('/auth/login'); return false;">
            Sign In
          </a>
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 4: AUTH - FORGOT PASSWORD (/auth/forgot-password)
// ========================================================
function renderForgotPasswordPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Reset Password</h1>
            <div class="card-subtitle">Recover access via registered mobile number</div>
          </div>
        </div>

        <div id="forgot-step-1">
          <p style="font-size: 0.825rem; color: #475569; margin-bottom: 1rem;">
            Enter your registered phone number. A 6-digit verification code will be generated to reset your password.
          </p>
          <form onsubmit="handleForgotRequest(event)">
            <div class="form-group">
              <label class="form-label">Registered Phone Number</label>
              <input type="tel" id="forgot-phone" class="form-control" placeholder="10-digit registered number" required value="9876543210">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              ${icons.arrowRight} Send Verification Code
            </button>
          </form>
        </div>

        <div id="forgot-step-2" style="display: none;">
          <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #EA580C; text-transform: uppercase;">Verification Code Generated</div>
            <div id="forgot-code-display" style="font-size: 1.25rem; font-weight: 800; letter-spacing: 0.2em; color: #0F172A; margin: 0.25rem 0;"></div>
            <div style="font-size: 0.75rem; color: #475569;">Enter this 6-digit code below along with your new password.</div>
          </div>

          <form onsubmit="handleForgotReset(event)">
            <div class="form-group">
              <label class="form-label">6-Digit Code</label>
              <input type="text" id="reset-code" class="form-control" placeholder="Enter code" required maxlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" id="reset-new-password" class="form-control" placeholder="Enter new password" required minlength="4">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              ${icons.check} Update Password
            </button>
          </form>
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--color-light-border); text-align: center;">
          <a href="/auth/login" class="breadcrumb-link" onclick="navigateRoute('/auth/login'); return false;">
            Return to Sign In
          </a>
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 5: AUTH - DEMO PORTAL (/auth/demo)
// ========================================================
function renderDemoPortalPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div class="card" style="border-left: 4px solid var(--color-saffron);">
        <div class="card-header">
          <div>
            <h1 class="card-title">1-Click Evaluator Demo Portal</h1>
            <div class="card-subtitle">Instant authentication across worker, customer, and contractor roles</div>
          </div>
          <span class="badge badge-verified">Pre-Seeded Dataset</span>
        </div>

        <p style="font-size: 0.85rem; color: #475569; margin-bottom: 1.5rem; line-height: 1.5;">
          Select any verified persona to instantly explore real-time two-way booking, AI video verification rubrics, algorithmic price corridors, and bilateral review mechanisms.
        </p>

        <div class="grid-2">
          <!-- Worker Demo 1 -->
          <div style="border: 1px solid var(--color-light-border); border-radius: 12px; padding: 1.15rem; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.65rem;">
                <img src="/images/avatar_ravi.jpg" style="width: 50px; height: 50px; border-radius: 99px; object-fit: cover; border: 2px solid #EA580C;">
                <div>
                  <strong style="font-size: 1rem;">Ravi Kumar</strong>
                  <div style="font-size: 0.775rem; color: #EA580C; font-weight: 700;">Electrician · 8 Yrs Exp</div>
                </div>
              </div>
              <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
                From ideathon presentation case study. Has verified Bedrock AI video skill proof and 48 completed jobs.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="quickDemoLoginAndRedirect('9876543210', '/worker/dashboard')">
              Login as Worker Ravi >
            </button>
          </div>

          <!-- Worker Demo 2 -->
          <div style="border: 1px solid var(--color-light-border); border-radius: 12px; padding: 1.15rem; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.65rem;">
                <img src="/images/avatar_suresh.jpg" style="width: 50px; height: 50px; border-radius: 99px; object-fit: cover; border: 2px solid #EA580C;">
                <div>
                  <strong style="font-size: 1rem;">Suresh M.</strong>
                  <div style="font-size: 0.775rem; color: #EA580C; font-weight: 700;">Plumber · PPR Specialist</div>
                </div>
              </div>
              <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
                Specialist in concealed pipeline leaks and sanitary installations. 35 completed jobs, verified Pro badge.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="quickDemoLoginAndRedirect('9876543211', '/worker/dashboard')">
              Login as Worker Suresh >
            </button>
          </div>

          <!-- Customer Demo 1 -->
          <div style="border: 1px solid var(--color-light-border); border-radius: 12px; padding: 1.15rem; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.65rem;">
                <img src="/images/avatar_priya.jpg" style="width: 50px; height: 50px; border-radius: 99px; object-fit: cover; border: 2px solid #0F172A;">
                <div>
                  <strong style="font-size: 1rem;">Priya Sharma</strong>
                  <div style="font-size: 0.775rem; color: #64748B; font-weight: 700;">Homeowner · Indiranagar</div>
                </div>
              </div>
              <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
                Apartment resident with active service requests, quote acceptance controls, and bilateral review history.
              </p>
            </div>
            <button class="btn btn-dark btn-sm" onclick="quickDemoLoginAndRedirect('9876543220', '/customer/dashboard')">
              Login as Customer Priya >
            </button>
          </div>

          <!-- Contractor Demo 1 -->
          <div style="border: 1px solid var(--color-light-border); border-radius: 12px; padding: 1.15rem; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.65rem;">
                <img src="/images/avatar_rajesh.jpg" style="width: 50px; height: 50px; border-radius: 99px; object-fit: cover; border: 2px solid #0F172A;">
                <div>
                  <strong style="font-size: 1rem;">Rajesh Verma</strong>
                  <div style="font-size: 0.775rem; color: #64748B; font-weight: 700;">Site Contractor · Koramangala</div>
                </div>
              </div>
              <p style="font-size: 0.8rem; color: #64748B; margin-bottom: 0.75rem;">
                Commercial site supervisor hiring multiple trade technicians for short-term renovation contracts.
              </p>
            </div>
            <button class="btn btn-dark btn-sm" onclick="quickDemoLoginAndRedirect('9876543221', '/contractor/dashboard')">
              Login as Contractor Rajesh >
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Quick login & redirect
async function quickDemoLoginAndRedirect(phone, targetPath) {
  try {
    const data = await api("/api/auth/demo-login", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    currentUser = data.user;
    showToast(`Logged in as ${currentUser.name} (${currentUser.role})`);
    renderNav();
    navigateRoute(targetPath);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ========================================================
// PAGE 6: WORKER DASHBOARD (/worker/dashboard)
// ========================================================
async function renderWorkerDashboardPage() {
  if (!ensureAuth("worker")) return;

  const main = document.getElementById("main-content");
  const [workerData, jobsList] = await Promise.all([
    api(`/api/workers/${currentUser.id}`),
    api(`/api/jobs`),
  ]);

  const corridor = currentPricing[currentUser.trade] || { min: 300, max: 700, standard: 450 };

  main.innerHTML = `
    <!-- Top Cockpit Summary Banner -->
    <div class="card" style="border-left: 4px solid var(--color-saffron);">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 class="card-title" style="font-size: 1.35rem;">${currentUser.name}</h1>
            ${currentUser.verified ? `<span class="badge badge-verified">${icons.shield} AI-Verified Pro</span>` : `<span class="badge badge-muted">Unverified</span>`}
          </div>
          <div style="font-size: 0.85rem; color: #475569; display: flex; align-items: center; gap: 0.75rem;">
            <span><strong>Trade:</strong> ${currentUser.trade}</span>
            <span>·</span>
            <span><strong>City:</strong> ${currentUser.city}</span>
            <span>·</span>
            <span><strong>Service Radius:</strong> ${currentUser.radius_km} km Geofenced Circle</span>
          </div>
        </div>

        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: #475569; text-transform: uppercase;">Trust Score</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 0.25rem; justify-content: flex-end;">
              ${icons.star} ${currentUser.trust_score} / 5.0
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: #475569; text-transform: uppercase;">Verified Jobs</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A;">
              ${currentUser.jobs_completed} Done
            </div>
          </div>
          <a href="/worker/profile" class="btn btn-secondary btn-sm" onclick="navigateRoute('/worker/profile'); return false;">
            ${icons.share} Share Profile & QR
          </a>
        </div>
      </div>
    </div>

    <!-- Quick Suite Navigation Tiles -->
    <div class="grid-2" style="margin-bottom: 1.25rem;">
      <a href="/worker/skills" class="role-launch-card" style="height: 140px;" onclick="navigateRoute('/worker/skills'); return false;">
        <img src="/images/video_demo.jpg" class="role-launch-bg">
        <div class="role-launch-gradient"></div>
        <div class="role-launch-content">
          <div class="role-launch-tag">Skill Verification Studio</div>
          <div class="role-launch-title">AI Video Demo Rubric</div>
          <div class="role-launch-desc">Submit 30-sec task video evaluated by Bedrock multi-modal checklists.</div>
        </div>
      </a>

      <a href="/worker/jobs" class="role-launch-card" style="height: 140px;" onclick="navigateRoute('/worker/jobs'); return false;">
        <img src="${tradeImages[currentUser.trade] || tradeImages.default}" class="role-launch-bg">
        <div class="role-launch-gradient"></div>
        <div class="role-launch-content">
          <div class="role-launch-tag">Geofenced Job Feed</div>
          <div class="role-launch-title">Nearby Service Requests</div>
          <div class="role-launch-desc">${jobsList.length} local requests available within your ${currentUser.radius_km} km radius.</div>
        </div>
      </a>
    </div>

    <!-- Fair Pricing Corridor Banner -->
    <div class="corridor-box">
      <div>
        <div class="corridor-label">Algorithmic Fair Price Corridor (${currentUser.trade} · ${currentUser.city})</div>
        <div style="font-size: 0.8rem; color: #475569;">You control your own rate inside this corridor. Eliminates arbitrary bargaining while keeping hiring fair.</div>
      </div>
      <div style="text-align: right;">
        <div class="corridor-value">INR ${corridor.min} - ${corridor.max} / task</div>
        <a href="/worker/pricing" class="breadcrumb-link" style="font-size: 0.775rem; color: #EA580C; font-weight: 700;" onclick="navigateRoute('/worker/pricing'); return false;">
          Adjust My Base Rate (INR ${currentUser.hourly_rate}) >
        </a>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 7: WORKER - SKILLS STUDIO (/worker/skills)
// ========================================================
async function renderWorkerSkillsPage() {
  if (!ensureAuth("worker")) return;

  const main = document.getElementById("main-content");
  const workerData = await api(`/api/workers/${currentUser.id}`);
  const proofs = workerData.proofs || [];

  main.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h1 class="card-title">AI Video Skill Verification Studio</h1>
          <div class="card-subtitle">30-second task demonstration evaluated via Amazon Bedrock multi-modal rubrics</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openSkillVerificationModal()">
          ${icons.video} Take New 30-Sec Skill Demo
        </button>
      </div>

      <!-- Video Scanner HUD Frame -->
      <div class="video-preview-wrapper" style="height: 260px;">
        <img src="/images/video_demo.jpg" alt="Video Skill Demo" class="video-frame-img">
        <div class="video-hud-overlay">
          <div class="hud-top-bar">
            <span>${icons.video} AMAZON BEDROCK HUD EVALUATOR · MULTI-MODAL STREAM</span>
            <span style="color: #EA580C;">REC 00:24 / 00:30</span>
          </div>
          <div class="hud-box-sample" style="top: 30%; left: 35%; width: 140px; height: 85px;">
            <span class="hud-box-tag">INSULATED GLOVES & TOOLS (98%)</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.85); padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.775rem;">
            <span>Trade Rubric: <strong>${currentUser.trade} Benchmark</strong></span>
            <strong style="color: #22C55E;">Verified Pass Rate: 96%</strong>
          </div>
        </div>
      </div>

      <div class="section-header" style="margin-top: 1.5rem;">
        <div>
          <h2 class="section-title">Verified Demonstrations on File</h2>
          <div class="section-subtitle">Evaluated benchmarks displayed on your public verified credential</div>
        </div>
      </div>

      ${proofs.length === 0 ? `
        <div style="text-align: center; padding: 2rem 1rem; background: #F8FAFC; border: 1px dashed #E2E8F0; border-radius: 8px;">
          <div style="font-weight: 700; color: #475569; margin-bottom: 0.35rem;">No verified video proof on file</div>
          <div style="font-size: 0.825rem; color: #64748B; margin-bottom: 1rem;">Complete a quick 30-second trade demonstration to earn your verified pro credential.</div>
          <button class="btn btn-primary btn-sm" onclick="openSkillVerificationModal()">
            ${icons.video} Upload Demonstration
          </button>
        </div>
      ` : proofs.map(p => {
        const checklist = JSON.parse(p.checklist_json || "{}");
        return `
          <div style="border: 1px solid #E2E8F0; border-radius: 10px; padding: 1.15rem; margin-bottom: 1rem; background: #FFFFFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 1rem;">${p.task_title}</strong>
              <span class="badge badge-success">${icons.check} AI Rubric Score: ${p.ai_score}%</span>
            </div>
            <div style="font-size: 0.75rem; color: #64748B; margin-bottom: 0.75rem;">
              Source: <code>${p.video_name}</code> · Verified on ${new Date(p.verified_at).toLocaleDateString()}
            </div>
            <div class="checklist-box">
              <div class="checklist-item"><span class="check-icon">${icons.check}</span><div><strong>Safety Gear:</strong> ${checklist.safety_gear || "Verified"}</div></div>
              <div class="checklist-item"><span class="check-icon">${icons.check}</span><div><strong>Tooling:</strong> ${checklist.tools_used || "Standard tools detected"}</div></div>
              <div class="checklist-item"><span class="check-icon">${icons.check}</span><div><strong>Technique:</strong> ${checklist.technique || "Adheres to trade specification"}</div></div>
              <div class="checklist-item"><span class="check-icon">${icons.check}</span><div><strong>Load & Quality Test:</strong> ${checklist.testing || "Passed"}</div></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// ========================================================
// PAGE 8: WORKER - NEARBY JOBS (/worker/jobs)
// ========================================================
async function renderWorkerJobsPage() {
  if (!ensureAuth("worker")) return;

  const main = document.getElementById("main-content");
  const jobsList = await api("/api/jobs");

  main.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h1 class="card-title">Geofenced Job Requests (${currentUser.radius_km} km Circle)</h1>
          <div class="card-subtitle">Active service requests matching ${currentUser.trade} in ${currentUser.city}</div>
        </div>
        <span class="badge badge-verified">${jobsList.length} Active</span>
      </div>

      ${jobsList.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem; color: #64748B;">No open job requests in your radius currently.</div>
      ` : jobsList.map(j => {
        const isAssignedToMe = j.worker_id === currentUser.id;
        return `
          <div class="ticket-card" style="background: ${isAssignedToMe ? '#FFF7ED' : '#FFFFFF'};">
            <div class="ticket-header">
              <div class="ticket-title">${j.title}</div>
              <span class="badge ${j.status === 'completed' ? 'badge-success' : 'badge-verified'}">${j.status.toUpperCase()}</span>
            </div>
            <p style="font-size: 0.825rem; color: #475569; margin: 0.5rem 0;">${j.description}</p>
            <div class="ticket-details-grid">
              <div><strong>Locality:</strong> ${j.locality}</div>
              <div><strong>Corridor:</strong> INR ${j.price_range_min} - ${j.price_range_max}</div>
              <div><strong>Customer:</strong> ${j.customer_name}</div>
              <div><strong>Service Radius:</strong> Within 10 km</div>
            </div>

            ${j.status === 'open' ? `
              <div style="display: flex; gap: 0.5rem; align-items: center; background: #FFFFFF; padding: 0.5rem; border: 1px solid #E2E8F0; border-radius: 8px; margin-top: 0.5rem;">
                <input type="number" id="quote-price-${j.id}" class="form-control" style="max-width: 140px; font-size: 0.8rem; padding: 0.35rem 0.6rem;" value="${currentUser.hourly_rate}">
                <button class="btn btn-primary btn-sm" onclick="submitQuote(${j.id})">
                  ${icons.check} Submit Quote Inside Corridor
                </button>
              </div>
            ` : ''}

            ${isAssignedToMe && (j.status === 'quoted' || j.status === 'in_progress') ? `
              <div style="background: #FFFFFF; border: 1px solid #FDBA74; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #EA580C; margin-bottom: 0.25rem;">
                  Your Quote: INR ${j.offered_price} · Status: ${j.status}
                </div>
                ${j.status === 'in_progress' ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                    <span style="font-size: 0.775rem; color: #475569;">
                      Worker Confirmation: ${j.worker_confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                    <button class="btn btn-primary btn-sm" ${j.worker_confirmed ? 'disabled' : ''} onclick="confirmJob(${j.id})">
                      ${icons.check} ${j.worker_confirmed ? 'You Confirmed' : 'Confirm Job Finished'}
                    </button>
                  </div>
                ` : `
                  <span style="font-size: 0.75rem; color: #64748B;">Waiting for customer to accept your quote.</span>
                `}
              </div>
            ` : ''}

            ${j.status === 'completed' ? `
              <div style="font-size: 0.775rem; color: #047857; font-weight: 700; margin-top: 0.5rem;">
                ${icons.check} Job concluded and mutually confirmed.
              </div>
            ` : ''}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// ========================================================
// PAGE 9: WORKER - PRICING CORRIDOR (/worker/pricing)
// ========================================================
function renderWorkerPricingPage() {
  if (!ensureAuth("worker")) return;

  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Algorithmic Fair Price Corridor Calculator</h1>
            <div class="card-subtitle">Transparent pricing benchmarks calibrated for ${currentUser.city}</div>
          </div>
        </div>

        <p style="font-size: 0.825rem; color: #475569; margin-bottom: 1.25rem; line-height: 1.5;">
          AROVIA calculates dynamic price corridors for each trade based on city cost-of-living and skill levels. Workers have full autonomy to select their rate inside the corridor, shielding technicians from predatory bargaining.
        </p>

        <div style="margin-bottom: 1.5rem;">
          ${Object.entries(currentPricing || {}).map(([trade, corr]) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 0.5rem; background: ${trade === currentUser.trade ? '#FFF7ED' : '#FFFFFF'};">
              <div>
                <strong style="font-size: 0.95rem; color: #0F172A;">${trade}</strong>
                ${trade === currentUser.trade ? `<span class="badge badge-verified" style="margin-left: 0.5rem;">Your Active Trade</span>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 800; color: #EA580C;">INR ${corr.min} - ${corr.max}</div>
                <div style="font-size: 0.75rem; color: #64748B;">Benchmark standard: INR ${corr.standard}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="card" style="background: #F8FAFC; border: 1px solid #E2E8F0;">
          <h2 class="card-title" style="font-size: 1rem; margin-bottom: 0.75rem;">Update Your Personal Base Rate</h2>
          <form onsubmit="handleUpdateWorkerRate(event)">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Base Rate per Task (INR)</label>
                <input type="number" id="worker-new-rate" class="form-control" value="${currentUser.hourly_rate}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Geofenced Radius (km)</label>
                <input type="number" id="worker-new-radius" class="form-control" value="${currentUser.radius_km}" min="5" max="25" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">
              ${icons.check} Save Updated Rate
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

async function handleUpdateWorkerRate(e) {
  e.preventDefault();
  const hourly_rate = Number(document.getElementById("worker-new-rate").value);
  const radius_km = Number(document.getElementById("worker-new-radius").value);

  try {
    const res = await api("/api/workers/profile", {
      method: "PUT",
      body: JSON.stringify({ hourly_rate, radius_km }),
    });
    currentUser.hourly_rate = hourly_rate;
    currentUser.radius_km = radius_km;
    showToast("Profile rate and service radius updated.");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ========================================================
// PAGE 10: WORKER - PROFILE & QR CARD (/worker/profile)
// ========================================================
async function renderWorkerProfilePage() {
  if (!ensureAuth("worker")) return;

  const main = document.getElementById("main-content");
  const workerData = await api(`/api/workers/${currentUser.id}`);

  const qrSvg = `
    <svg width="160" height="160" viewBox="0 0 100 100" style="background:#FFF; padding:6px; border:1px solid #E2E8F0; border-radius:8px;">
      <rect x="0" y="0" width="30" height="30" fill="#0F172A"/>
      <rect x="5" y="5" width="20" height="20" fill="#FFF"/>
      <rect x="10" y="10" width="10" height="10" fill="#EA580C"/>
      <rect x="70" y="0" width="30" height="30" fill="#0F172A"/>
      <rect x="75" y="5" width="20" height="20" fill="#FFF"/>
      <rect x="80" y="10" width="10" height="10" fill="#EA580C"/>
      <rect x="0" y="70" width="30" height="30" fill="#0F172A"/>
      <rect x="5" y="75" width="20" height="20" fill="#FFF"/>
      <rect x="10" y="80" width="10" height="10" fill="#EA580C"/>
      <rect x="40" y="10" width="15" height="15" fill="#0F172A"/>
      <rect x="40" y="40" width="20" height="20" fill="#EA580C"/>
      <rect x="15" y="45" width="15" height="10" fill="#0F172A"/>
      <rect x="70" y="45" width="20" height="15" fill="#0F172A"/>
      <rect x="45" y="75" width="15" height="20" fill="#0F172A"/>
      <rect x="75" y="75" width="20" height="20" fill="#EA580C"/>
    </svg>
  `;

  const shareUrl = `${window.location.origin}/profile/${currentUser.id}`;
  const whatsappText = encodeURIComponent(`Check out verified ${currentUser.trade} ${currentUser.name} on AROVIA. Trust Score: ${currentUser.trust_score}/5.0. Verified Video Proof: ${shareUrl}`);

  main.innerHTML = `
    <div style="max-width: 680px; margin: 0 auto;">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Shareable Verifiable Credential</h1>
            <div class="card-subtitle">Digital profile card with scannable QR and WhatsApp share link</div>
          </div>
        </div>

        <div class="qr-preview">
          ${qrSvg}
          <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin-top: 0.85rem;">${currentUser.name}</div>
          <div style="font-size: 0.9rem; color: #EA580C; font-weight: 700;">${currentUser.trade} · ${currentUser.city}</div>
          <div style="font-size: 0.825rem; color: #475569; margin: 0.35rem 0;">
            ${icons.star} <strong>${currentUser.trust_score} / 5.0</strong> (${currentUser.jobs_completed} Verified Jobs Done)
          </div>
          <span class="badge badge-verified" style="margin-top: 0.25rem;">
            ${icons.shield} AI Video Verified Professional
          </span>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
          <a href="https://api.whatsapp.com/send?text=${whatsappText}" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center;">
            Share on WhatsApp
          </a>
          <button class="btn btn-secondary" style="flex: 1;" onclick="navigator.clipboard.writeText('${shareUrl}'); showToast('Direct credential link copied to clipboard!');">
            Copy Profile Link
          </button>
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 11: CUSTOMER DASHBOARD (/customer/dashboard)
// ========================================================
async function renderCustomerDashboardPage() {
  if (!ensureAuth("customer")) return;

  const main = document.getElementById("main-content");
  const jobsList = await api("/api/jobs?filter=mine");

  main.innerHTML = `
    <div class="card" style="border-left: 4px solid var(--color-saffron);">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <h1 class="card-title" style="font-size: 1.35rem;">Customer Portal: ${currentUser.name}</h1>
          <div style="font-size: 0.85rem; color: #475569;">
            ${currentUser.city} · Discover verified tradespeople in 5–15 km geofenced circle
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <a href="/customer/post-job" class="btn btn-primary btn-sm" onclick="navigateRoute('/customer/post-job'); return false;">
            + Post Service Request
          </a>
          <a href="/customer/workers" class="btn btn-dark btn-sm" onclick="navigateRoute('/customer/workers'); return false;">
            Browse Verified Workers
          </a>
        </div>
      </div>
    </div>

    <div class="section-header">
      <div>
        <h2 class="section-title">Active Service Requests (${jobsList.length})</h2>
        <div class="section-subtitle">Manage quotes, confirmation checkpoints, and bilateral reviews</div>
      </div>
      <a href="/customer/bookings" class="breadcrumb-link" onclick="navigateRoute('/customer/bookings'); return false;">View Detailed Bookings ></a>
    </div>

    ${jobsList.length === 0 ? `
      <div style="text-align: center; padding: 2.5rem 1rem; background: #FFFFFF; border: 1px dashed var(--color-light-border); border-radius: var(--radius-lg); margin-bottom: 2rem;">
        <div style="font-weight: 700; color: #475569; margin-bottom: 0.35rem;">No active bookings found</div>
        <div style="font-size: 0.825rem; color: #64748B; margin-bottom: 1rem;">Broadcast a service request within algorithmic price corridors to receive quotes from verified technicians.</div>
        <a href="/customer/post-job" class="btn btn-primary btn-sm" onclick="navigateRoute('/customer/post-job'); return false;">
          + Post Service Request
        </a>
      </div>
    ` : jobsList.map(j => `
      <div class="ticket-card">
        <div class="ticket-header">
          <div>
            <div class="ticket-title">${j.title}</div>
            <div style="font-size: 0.775rem; color: #64748B; margin-top: 0.15rem;">
              Trade: <strong>${j.trade}</strong> · Locality: ${j.locality} · Corridor: INR ${j.price_range_min} - ${j.price_range_max}
            </div>
          </div>
          <span class="badge ${j.status === 'completed' ? 'badge-success' : 'badge-verified'}">${j.status.toUpperCase()}</span>
        </div>

        <p style="font-size: 0.825rem; color: #334155; margin: 0.5rem 0;">${j.description}</p>

        ${j.status === 'quoted' ? `
          <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.85rem; color: #EA580C;">Quote Received: INR ${j.offered_price}</strong>
              <div style="font-size: 0.75rem; color: #475569;">From ${j.worker_name} (Phone: ${j.worker_phone || 'Protected'})</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="acceptWorkerQuote(${j.id})">
              ${icons.check} Accept Quote
            </button>
          </div>
        ` : ''}

        ${j.status === 'in_progress' ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.85rem;">Work in Progress with ${j.worker_name}</strong>
              <div style="font-size: 0.75rem; color: #475569;">
                Customer Confirmation: ${j.customer_confirmed ? 'Confirmed' : 'Pending'} · Worker: ${j.worker_confirmed ? 'Confirmed' : 'Pending'}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" ${j.customer_confirmed ? 'disabled' : ''} onclick="confirmJob(${j.id})">
              ${icons.check} ${j.customer_confirmed ? 'You Confirmed' : 'Confirm Job Finished'}
            </button>
          </div>
        ` : ''}

        ${j.status === 'completed' ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #F1F5F9;">
            <span style="font-size: 0.775rem; color: #047857; font-weight: 700;">${icons.check} Both parties confirmed completion.</span>
            <button class="btn btn-secondary btn-sm" onclick="openReviewModal(${j.id}, '${j.worker_name}')">
              ${icons.star} Submit Review with Evidence
            </button>
          </div>
        ` : ''}
      </div>
    `).join("")}
  `;
}

// ========================================================
// PAGE 12: CUSTOMER - BROWSE WORKERS POSTERS (/customer/workers)
// ========================================================
function renderCustomerWorkersPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div class="section-header">
      <div>
        <h1 class="section-title">Verified Nearby Tradespeople Directory</h1>
        <div class="section-subtitle">BookMyShow poster format with video proofs and live trust scores</div>
      </div>
      <a href="/customer/post-job" class="btn btn-primary btn-sm" onclick="navigateRoute('/customer/post-job'); return false;">
        + Post Service Request
      </a>
    </div>

    <!-- Category Filter Pills -->
    ${renderCategoryPills()}

    <!-- Poster Grid -->
    <div class="poster-grid">
      ${renderWorkerPosterCards(cachedWorkers)}
    </div>
  `;
}

// ========================================================
// PAGE 13: CUSTOMER - POST JOB WIZARD (/customer/post-job)
// ========================================================
function renderCustomerPostJobPage() {
  if (!ensureAuth("customer")) return;

  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div style="max-width: 680px; margin: 0 auto;">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Post Service Request</h1>
            <div class="card-subtitle">Dispatched inside 5–15 km geofenced circle</div>
          </div>
        </div>

        <form onsubmit="handlePostJobSubmit(event)">
          <div class="form-group">
            <label class="form-label">Service Title</label>
            <input type="text" id="job-title" class="form-control" placeholder="e.g. Ceiling Fan Bearing & Regulator Replacement" required>
          </div>

          <div class="form-group">
            <label class="form-label">Trade Required</label>
            <select id="job-trade" class="form-control" onchange="updateCorridorHelper()">
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Mason">Mason</option>
              <option value="Painter">Painter</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Description</label>
            <textarea id="job-description" class="form-control" rows="3" placeholder="Describe the issue, symptoms, and required materials..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Locality / Address</label>
            <input type="text" id="job-locality" class="form-control" value="Indiranagar, Stage 2" required>
          </div>

          <div class="grid-2" style="margin-bottom: 0.5rem;">
            <div class="form-group">
              <label class="form-label">Budget Min (INR)</label>
              <input type="number" id="job-budget-min" class="form-control" value="300" required>
            </div>
            <div class="form-group">
              <label class="form-label">Budget Max (INR)</label>
              <input type="number" id="job-budget-max" class="form-control" value="650" required>
            </div>
          </div>

          <div id="corridor-helper-text" style="font-size: 0.775rem; color: #EA580C; margin-bottom: 1rem; font-weight: 700;">
            Algorithmic Corridor for Electrician in Bengaluru: INR 300 - 700
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            ${icons.arrowRight} Broadcast to Verified Local Workers
          </button>
        </form>
      </div>
    </div>
  `;
}

// ========================================================
// PAGE 14: CUSTOMER - BOOKINGS (/customer/bookings)
// ========================================================
async function renderCustomerBookingsPage() {
  if (!ensureAuth("customer")) return;

  const main = document.getElementById("main-content");
  const jobsList = await api("/api/jobs?filter=mine");

  main.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h1 class="card-title">My Bookings Ticket Summary</h1>
          <div class="card-subtitle">Detailed service tickets with quotes and confirmation checkpoints</div>
        </div>
        <a href="/customer/post-job" class="btn btn-primary btn-sm" onclick="navigateRoute('/customer/post-job'); return false;">+ New Request</a>
      </div>

      ${jobsList.length === 0 ? `
        <div style="text-align: center; padding: 2rem; color: #64748B;">No bookings recorded yet.</div>
      ` : jobsList.map(j => `
        <div class="ticket-card">
          <div class="ticket-header">
            <div>
              <div class="ticket-title">${j.title}</div>
              <div style="font-size: 0.775rem; color: #64748B;">Trade: ${j.trade} · Locality: ${j.locality}</div>
            </div>
            <span class="badge ${j.status === 'completed' ? 'badge-success' : 'badge-verified'}">${j.status.toUpperCase()}</span>
          </div>

          <p style="font-size: 0.825rem; color: #334155; margin: 0.5rem 0;">${j.description}</p>

          <div class="ticket-details-grid">
            <div><strong>Assigned Pro:</strong> ${j.worker_name || 'Awaiting quote'}</div>
            <div><strong>Price Corridor:</strong> INR ${j.price_range_min} - ${j.price_range_max}</div>
            <div><strong>Agreed Price:</strong> ${j.offered_price ? `INR ${j.offered_price}` : 'Pending quote'}</div>
            <div><strong>Status:</strong> ${j.status}</div>
          </div>

          ${j.status === 'quoted' ? `
            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button class="btn btn-primary btn-sm" onclick="acceptWorkerQuote(${j.id})">
                ${icons.check} Accept Quote of INR ${j.offered_price}
              </button>
            </div>
          ` : ''}

          ${j.status === 'in_progress' ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
              <span style="font-size: 0.775rem; color: #475569;">Customer Confirmed: ${j.customer_confirmed ? 'Yes' : 'No'}</span>
              <button class="btn btn-primary btn-sm" ${j.customer_confirmed ? 'disabled' : ''} onclick="confirmJob(${j.id})">
                ${icons.check} ${j.customer_confirmed ? 'You Confirmed' : 'Confirm Job Finished'}
              </button>
            </div>
          ` : ''}

          ${j.status === 'completed' ? `
            <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="openReviewModal(${j.id}, '${j.worker_name}')">
                ${icons.star} Submit Review
              </button>
            </div>
          ` : ''}
        </div>
      `).join("")}
    </div>
  `;
}

// ========================================================
// PAGE 15: CUSTOMER - REVIEWS (/customer/reviews)
// ========================================================
async function renderCustomerReviewsPage() {
  if (!ensureAuth("customer")) return;

  const main = document.getElementById("main-content");
  const jobsList = await api("/api/jobs?filter=mine");
  const completedJobs = jobsList.filter(j => j.status === "completed");

  main.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h1 class="card-title">Bilateral Customer Reviews</h1>
          <div class="card-subtitle">Verified feedback sealed to completed transactions</div>
        </div>
      </div>

      <p style="font-size: 0.825rem; color: #475569; margin-bottom: 1.25rem;">
        AROVIA restricts reviews strictly to confirmed completed transactions to protect tradespeople and customers from artificial reputation abuse.
      </p>

      ${completedJobs.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem; color: #64748B;">You have no completed jobs ready for review. Complete a job to unlock review submission.</div>
      ` : completedJobs.map(j => `
        <div style="border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; background: #FFFFFF;">
          <div>
            <strong style="font-size: 0.95rem;">${j.title}</strong>
            <div style="font-size: 0.775rem; color: #64748B;">Technician: ${j.worker_name} (${j.trade}) · Locality: ${j.locality}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openReviewModal(${j.id}, '${j.worker_name}')">
            ${icons.star} Submit Verified Review
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

// ========================================================
// PAGE 16: CONTRACTOR DASHBOARD (/contractor/dashboard)
// ========================================================
function renderContractorDashboardPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <!-- Top Contractor Cockpit Banner -->
    <div class="card" style="border-left: 4px solid var(--color-dark-bg);">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <h1 class="card-title" style="font-size: 1.35rem;">Commercial Site Contractor Cockpit</h1>
          <div style="font-size: 0.85rem; color: #475569;">
            Koramangala Construction Zone · Sourcing verified technicians and ITI certified trainees
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <a href="/contractor/post-contract" class="btn btn-primary btn-sm" onclick="navigateRoute('/contractor/post-contract'); return false;">
            + Broadcast Multi-Worker Contract
          </a>
        </div>
      </div>
    </div>

    <!-- Contractor Stats Grid -->
    <div class="grid-3" style="margin-bottom: 1.5rem;">
      <div class="card" style="margin-bottom: 0;">
        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase;">Active Site Projects</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">4 Sites</div>
        <div style="font-size: 0.75rem; color: #EA580C; font-weight: 700;">Commercial & Residential</div>
      </div>
      <div class="card" style="margin-bottom: 0;">
        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase;">Verified Pros On Site</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">18 Technicians</div>
        <div style="font-size: 0.75rem; color: #15803D; font-weight: 700;">100% Video Skill Verified</div>
      </div>
      <div class="card" style="margin-bottom: 0;">
        <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase;">Average Task Rating</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0.25rem 0;">4.85 / 5.0</div>
        <div style="font-size: 0.75rem; color: #64748B;">Bilateral Inspection Reports</div>
      </div>
    </div>

    <!-- Verified Talent Pool Ready for Site Dispatch -->
    <div class="section-header">
      <div>
        <h2 class="section-title">Verified Tradespeople for Site Contracts</h2>
        <div class="section-subtitle">Pre-vetted via AI video rubrics for immediate site dispatch</div>
      </div>
      <a href="/customer/workers" class="breadcrumb-link" onclick="navigateRoute('/customer/workers'); return false;">View Full Directory ></a>
    </div>
    <div class="poster-grid">
      ${renderWorkerPosterCards(cachedWorkers)}
    </div>
  `;
}

// ========================================================
// PAGE 17: CONTRACTOR - POST CONTRACT (/contractor/post-contract)
// ========================================================
function renderContractorPostContractPage() {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <div style="max-width: 680px; margin: 0 auto;">
      <div class="card">
        <div class="card-header">
          <div>
            <h1 class="card-title">Broadcast Multi-Worker Site Contract</h1>
            <div class="card-subtitle">Sourcing verified technicians and ITI trainees for commercial projects</div>
          </div>
        </div>

        <form onsubmit="handleContractorPostSubmit(event)">
          <div class="form-group">
            <label class="form-label">Project / Contract Name</label>
            <input type="text" id="contract-title" class="form-control" value="Commercial Floor Wiring & Sanitary Conduit Installation" required>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Primary Trade</label>
              <select id="contract-trade" class="form-control">
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Mason">Mason</option>
                <option value="Painter">Painter</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Number of Workers Required</label>
              <input type="number" id="contract-workers-count" class="form-control" value="4" min="1" max="25" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Project Scope & Scope of Work</label>
            <textarea id="contract-description" class="form-control" rows="3" required>Surface casing capping and 3-phase distribution box install for video conferencing setup and server rack room.</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Commercial Site Location</label>
            <input type="text" id="contract-locality" class="form-control" value="Koramangala 5th Block, Bengaluru" required>
          </div>

          <div class="grid-2" style="margin-bottom: 0.5rem;">
            <div class="form-group">
              <label class="form-label">Budget per Worker / Day (INR)</label>
              <input type="number" id="contract-budget-min" class="form-control" value="800" required>
            </div>
            <div class="form-group">
              <label class="form-label">Max Budget per Worker / Day (INR)</label>
              <input type="number" id="contract-budget-max" class="form-control" value="1400" required>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            ${icons.arrowRight} Broadcast Contract to Verified Roster
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleContractorPostSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("contract-title").value.trim();
  const trade = document.getElementById("contract-trade").value;
  const description = document.getElementById("contract-description").value.trim();
  const locality = document.getElementById("contract-locality").value.trim();
  const price_range_min = Number(document.getElementById("contract-budget-min").value);
  const price_range_max = Number(document.getElementById("contract-budget-max").value);

  try {
    const res = await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ title, trade, description, locality, price_range_min, price_range_max, radius_km: 15 }),
    });
    showToast("Commercial contract broadcasted successfully to verified workers.");
    navigateRoute("/contractor/dashboard");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ========================================================
// PAGE 18: DYNAMIC TRADE LANDING (/trades/:trade)
// ========================================================
function renderTradeLandingPage(tradeSlug) {
  const tradeTitle = tradeSlug.charAt(0).toUpperCase() + tradeSlug.slice(1);
  const corr = currentPricing[tradeTitle] || { min: 300, max: 700, standard: 450 };
  const filteredWorkers = cachedWorkers.filter(w => w.trade.toLowerCase() === tradeSlug.toLowerCase());

  const main = document.getElementById("main-content");
  main.innerHTML = `
    <!-- Trade Hero Header -->
    <div class="hero-billboard" style="min-height: 280px; margin-bottom: 1.5rem;">
      <img src="${tradeImages[tradeTitle] || tradeImages.default}" alt="${tradeTitle}" class="hero-bg-img">
      <div class="hero-overlay-scrim"></div>
      <div class="hero-content">
        <div class="hero-tag">${icons.shield} Verified Trade Hub</div>
        <h1 class="hero-title">${tradeTitle}s in Bengaluru</h1>
        <p class="hero-subtitle">
          AI video verified ${tradeTitle.toLowerCase()}s within 5–15 km circle. Algorithmic fair pricing corridor: <strong>INR ${corr.min} - ${corr.max} / task</strong>.
        </p>
        <div style="display: flex; gap: 0.75rem;">
          <a href="/customer/post-job" class="btn btn-primary btn-sm" onclick="navigateRoute('/customer/post-job'); return false;">
            + Post ${tradeTitle} Request
          </a>
          <a href="/worker/skills" class="btn btn-secondary btn-sm" onclick="navigateRoute('/worker/skills'); return false;">
            ${icons.video} Verify as ${tradeTitle}
          </a>
        </div>
      </div>
    </div>

    <!-- Category Pills -->
    ${renderCategoryPills()}

    <!-- Trade Poster Grid -->
    <div class="section-header">
      <div>
        <h2 class="section-title">Verified ${tradeTitle} Posters</h2>
        <div class="section-subtitle">${filteredWorkers.length} verified professionals ready for local dispatch</div>
      </div>
    </div>
    <div class="poster-grid">
      ${renderWorkerPosterCards(filteredWorkers)}
    </div>
  `;
}

// ========================================================
// PAGE 19: PUBLIC WORKER CREDENTIAL (/profile/:id)
// ========================================================
async function renderPublicWorkerProfilePage(workerId) {
  const main = document.getElementById("main-content");
  try {
    const worker = await api(`/api/workers/${workerId}`);
    const corridor = currentPricing[worker.trade] || { min: 300, max: 700 };

    main.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <!-- Worker Header Card -->
        <div class="card" style="border-left: 4px solid var(--color-saffron);">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
            <div style="display: flex; gap: 1rem; align-items: center;">
              <img src="${tradeImages[worker.trade] || tradeImages.default}" style="width: 72px; height: 72px; border-radius: 99px; object-fit: cover; border: 2px solid #EA580C;">
              <div>
                <h1 class="card-title" style="font-size: 1.35rem; margin-bottom: 0.15rem;">${worker.name}</h1>
                <div style="font-size: 0.85rem; color: #EA580C; font-weight: 700;">${worker.trade} · ${worker.city}</div>
                <div style="font-size: 0.775rem; color: #64748B; margin-top: 0.2rem;">
                  Service Radius: ${worker.radius_km} km Geofenced Circle
                </div>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: #64748B; text-transform: uppercase;">Trust Score</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: #0F172A; display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem;">
                ${icons.star} ${worker.trust_score} / 5.0
              </div>
              <div style="font-size: 0.75rem; color: #64748B;">${worker.jobs_completed} Verified Jobs Done</div>
            </div>
          </div>
        </div>

        <!-- Video Proof Verification Showcase -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Verified 30-Sec Video Demonstration</h2>
              <div class="card-subtitle">AI Multi-Modal Rubric Benchmark (Amazon Bedrock)</div>
            </div>
            <span class="badge badge-success">${icons.check} AI Score: ${worker.proofs[0]?.ai_score || 95}%</span>
          </div>

          <div class="video-preview-wrapper" style="height: 240px;">
            <img src="/images/video_demo.jpg" alt="Video Skill Demo" class="video-frame-img">
            <div class="video-hud-overlay">
              <div class="hud-top-bar">
                <span>${icons.video} MULTIMODAL VERIFICATION STREAM</span>
                <span style="color: #22C55E;">VERIFIED PRO</span>
              </div>
              <div class="hud-box-sample">
                <span class="hud-box-tag">PPE & TECHNIQUE PASSED</span>
              </div>
            </div>
          </div>

          ${worker.proofs && worker.proofs.length > 0 ? `
            <div class="checklist-box">
              <strong style="font-size: 0.85rem; color: #0F172A; display: block; margin-bottom: 0.5rem;">${worker.proofs[0].task_title}</strong>
              <div style="font-size: 0.775rem; color: #475569; line-height: 1.4;">
                Demonstration validated across insulated protective equipment, calibrated trade tooling, and live load specifications.
              </div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
            <a href="/customer/post-job" class="btn btn-primary" style="flex: 1; text-align: center;" onclick="navigateRoute('/customer/post-job'); return false;">
              Book / Request Quote from ${worker.name}
            </a>
            <button class="btn btn-secondary" style="flex: 1;" onclick="showShareProfileModal(${worker.id})">
              ${icons.share} Share Profile & QR
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="card"><div style="text-align: center; padding: 2rem; color: #64748B;">Worker profile not found.</div></div>`;
  }
}

// Helper: Ensure user role authentication
function ensureAuth(requiredRole) {
  if (!currentUser) {
    showToast("Please sign in to access this portal");
    navigateRoute("/auth/login");
    return false;
  }
  return true;
}

// Category Pills Renderer
function renderCategoryPills() {
  const trades = ["All", "Electrician", "Plumber", "Carpenter", "Mason", "Painter"];
  return `
    <div class="category-strip">
      ${trades.map(t => `
        <button class="category-pill ${selectedTradeFilter === t ? 'active' : ''}" onclick="filterByTrade('${t}')">
          ${t === 'All' ? 'All Verified Trades' : t + 's'}
        </button>
      `).join("")}
    </div>
  `;
}

function filterByTrade(trade) {
  selectedTradeFilter = trade;
  if (trade === "All") {
    navigateRoute("/customer/workers");
  } else {
    navigateRoute(`/trades/${trade.toLowerCase()}`);
  }
}

// Poster cards renderer
function renderWorkerPosterCards(workers) {
  let filtered = workers;
  if (selectedTradeFilter !== "All") {
    filtered = filtered.filter(w => w.trade.toLowerCase() === selectedTradeFilter.toLowerCase());
  }
  if (searchKeyword) {
    filtered = filtered.filter(w => 
      w.name.toLowerCase().includes(searchKeyword) ||
      (w.trade && w.trade.toLowerCase().includes(searchKeyword)) ||
      (w.city && w.city.toLowerCase().includes(searchKeyword))
    );
  }

  if (filtered.length === 0) {
    return `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; background: #FFFFFF; border: 1px dashed var(--color-light-border); border-radius: var(--radius-lg);">
        <div style="font-size: 1rem; font-weight: 700; color: #0F172A; margin-bottom: 0.35rem;">No verified technicians found</div>
        <div style="font-size: 0.825rem; color: #64748B;">Try selecting "All Verified Trades" or clearing your search term.</div>
      </div>
    `;
  }

  return filtered.map(w => {
    const posterImg = tradeImages[w.trade] || tradeImages.default;
    const corridor = currentPricing ? (currentPricing[w.trade] || { min: 300, max: 700 }) : { min: 300, max: 700 };

    return `
      <div class="poster-card" onclick="navigateRoute('/profile/${w.id}')">
        <!-- Poster Image Box with Text Overlays -->
        <div class="poster-image-box">
          <img src="${posterImg}" alt="${w.name} - ${w.trade}" class="poster-img">
          <div class="poster-gradient"></div>

          <!-- Top Overlays -->
          <div class="poster-badge-top-left">
            ${icons.mapPin} ${w.radius_km || 10} km circle
          </div>
          <div class="poster-badge-top-right">
            ${icons.shield} ${w.verified ? 'AI Verified' : 'Registered'}
          </div>

          <!-- Bottom Text Over Image -->
          <div class="poster-text-overlay">
            <div class="poster-rating-pill">
              ${icons.star} ${w.trust_score} / 5.0 · ${w.jobs_completed} Jobs Done
            </div>
            <div class="poster-name">${w.name}</div>
            <div class="poster-trade">${w.trade} · ${w.city}</div>
          </div>
        </div>

        <!-- Poster Bottom Details & CTA -->
        <div class="poster-details">
          <div class="poster-meta-row">
            <span>Fair Corridor: <strong>INR ${corridor.min} - ${corridor.max}</strong></span>
            <span class="poster-rate">INR ${w.hourly_rate}</span>
          </div>

          <div style="font-size: 0.775rem; color: #475569; margin-bottom: 0.85rem; line-height: 1.35; max-height: 38px; overflow: hidden; text-overflow: ellipsis;">
            ${w.bio || 'Experienced verified technician.'}
          </div>

          <button class="btn btn-primary btn-sm" style="width: 100%;">
            ${icons.play} View Video Proof & Book
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Global Form Submissions
async function handleLoginSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById("login-phone").value.trim();
  const password = document.getElementById("login-password").value.trim();
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    currentUser = data.user;
    showToast(`Welcome back, ${currentUser.name}`);
    renderNav();
    if (currentUser.role === "worker") navigateRoute("/worker/dashboard");
    else navigateRoute("/customer/dashboard");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const roleInput = document.querySelector("input[name='signup-role']:checked");
  const role = roleInput ? roleInput.value : "worker";
  const name = document.getElementById("signup-name").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const city = document.getElementById("signup-city").value.trim();

  let trade = null;
  let hourly_rate = 0;
  if (role === "worker") {
    trade = document.getElementById("signup-trade").value;
    hourly_rate = Number(document.getElementById("signup-rate").value) || 400;
  }

  try {
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ phone, name, role, password, trade, city, hourly_rate }),
    });
    currentUser = data.user;
    showToast("Registration successful! Welcome to AROVIA.");
    renderNav();
    if (currentUser.role === "worker") navigateRoute("/worker/dashboard");
    else navigateRoute("/customer/dashboard");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleForgotRequest(e) {
  e.preventDefault();
  const phone = document.getElementById("forgot-phone").value.trim();
  try {
    const data = await api("/api/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    activeResetPhone = phone;
    document.getElementById("forgot-step-1").style.display = "none";
    document.getElementById("forgot-step-2").style.display = "block";
    document.getElementById("forgot-code-display").textContent = data.demo_code;
    document.getElementById("reset-code").value = data.demo_code;
    showToast("Verification code generated successfully.");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleForgotReset(e) {
  e.preventDefault();
  const code = document.getElementById("reset-code").value.trim();
  const new_password = document.getElementById("reset-new-password").value.trim();

  try {
    const data = await api("/api/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify({ phone: activeResetPhone, code, new_password }),
    });
    showToast(data.message);
    navigateRoute("/auth/login");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleLogout() {
  await api("/api/auth/logout", { method: "POST" });
  currentUser = null;
  showToast("Logged out successfully");
  renderNav();
  navigateRoute("/");
}

function toggleSignupFields(role) {
  const workerFields = document.getElementById("worker-specific-fields");
  if (workerFields) {
    workerFields.style.display = role === "worker" ? "block" : "none";
  }
}

// Global Job Actions
async function submitQuote(jobId) {
  const priceInput = document.getElementById(`quote-price-${jobId}`);
  const price = priceInput ? Number(priceInput.value) : 400;

  try {
    const res = await api(`/api/jobs/${jobId}/quote`, {
      method: "POST",
      body: JSON.stringify({ offered_price: price }),
    });
    showToast(res.message);
    renderWorkerJobsPage();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function acceptWorkerQuote(jobId) {
  try {
    const res = await api(`/api/jobs/${jobId}/accept-quote`, { method: "POST" });
    showToast(res.message);
    renderCustomerDashboardPage();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function confirmJob(jobId) {
  try {
    const res = await api(`/api/jobs/${jobId}/confirm`, { method: "POST" });
    showToast(res.message);
    if (currentUser.role === "worker") renderWorkerJobsPage();
    else renderCustomerDashboardPage();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Modal Helpers
function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function openSkillVerificationModal() {
  const trade = currentUser?.trade || "Electrician";
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <div class="card-title">30-Second Task Demonstration</div>
            <div class="card-subtitle">AI Skill Verification Rubric (${trade})</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">${icons.close}</button>
        </div>

        <div class="video-preview-wrapper" style="height: 200px;">
          <img src="/images/video_demo.jpg" alt="Video Skill Demo" class="video-frame-img">
          <div class="video-hud-overlay">
            <div class="hud-top-bar">
              <span>${icons.video} AMAZON BEDROCK HUD EVALUATOR</span>
              <span style="color: #EA580C;">STANDBY</span>
            </div>
            <div class="hud-box-sample" style="top: 25%; left: 30%; width: 120px; height: 75px;">
              <span class="hud-box-tag">PPE & TOOLS PASS</span>
            </div>
          </div>
        </div>

        <form onsubmit="handleSkillVerificationSubmit(event)">
          <div class="form-group">
            <label class="form-label">Task Benchmark Title</label>
            <input type="text" id="demo-task-title" class="form-control" value="${trade === 'Electrician' ? 'Dual-Phase MCB Breaker Wiring & Continuity Test' : 'Standard Practical Demonstration'}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Recorded Demonstration File</label>
            <input type="text" id="demo-video-name" class="form-control" value="worker_demo_stream_30s.mp4" required>
          </div>

          <button type="submit" id="submit-verify-btn" class="btn btn-primary" style="width: 100%;">
            ${icons.shield} Run AI Verification & Award Pro Badge
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleSkillVerificationSubmit(e) {
  e.preventDefault();
  const task_title = document.getElementById("demo-task-title").value.trim();
  const video_name = document.getElementById("demo-video-name").value.trim();

  try {
    const res = await api("/api/workers/verify-skill", {
      method: "POST",
      body: JSON.stringify({ task_title, video_name }),
    });

    showToast(`Verification complete: AI Score ${res.ai_score}%`);
    currentUser.verified = 1;
    closeModal();
    if (window.location.pathname === "/worker/skills") renderWorkerSkillsPage();
    else renderWorkerDashboardPage();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openReviewModal(jobId, counterpartyName) {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <div class="card-title">Submit Two-Way Review</div>
            <div class="card-subtitle">Reviewing: ${counterpartyName || 'Participant'}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">${icons.close}</button>
        </div>

        <form onsubmit="handleReviewSubmit(event, ${jobId})">
          <div class="form-group">
            <label class="form-label">Rating</label>
            <select id="review-rating" class="form-control">
              <option value="5">5 - Outstanding Professionalism & Quality</option>
              <option value="4">4 - Good Workmanship, Met Terms</option>
              <option value="3">3 - Satisfactory</option>
              <option value="2">2 - Substandard</option>
              <option value="1">1 - Severe Issues / Unprofessional</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Feedback</label>
            <textarea id="review-comment" class="form-control" rows="3" placeholder="Provide accurate comments on punctuality, pricing adherence, and safety..." required></textarea>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.825rem; font-weight: 700; cursor: pointer;">
              <input type="checkbox" id="review-evidence-check">
              Attach Verification Evidence (Job receipt / Photo note)
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            ${icons.check} Submit Bilateral Review
          </button>
        </form>
      </div>
    </div>
  `;
}

async function handleReviewSubmit(e, jobId) {
  e.preventDefault();
  const rating = Number(document.getElementById("review-rating").value);
  const comment = document.getElementById("review-comment").value.trim();
  const has_evidence = document.getElementById("review-evidence-check").checked;

  try {
    const res = await api("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, rating, comment, has_evidence }),
    });
    showToast(res.message);
    closeModal();
    if (window.location.pathname.startsWith("/customer")) renderCustomerDashboardPage();
    else renderWorkerDashboardPage();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function showShareProfileModal(workerId) {
  try {
    const worker = await api(`/api/workers/${workerId}`);
    const modalRoot = document.getElementById("modal-root");

    const qrSvg = `
      <svg width="150" height="150" viewBox="0 0 100 100" style="background:#FFF; padding:6px; border:1px solid #E2E8F0; border-radius:8px;">
        <rect x="0" y="0" width="30" height="30" fill="#0F172A"/>
        <rect x="5" y="5" width="20" height="20" fill="#FFF"/>
        <rect x="10" y="10" width="10" height="10" fill="#EA580C"/>
        <rect x="70" y="0" width="30" height="30" fill="#0F172A"/>
        <rect x="75" y="5" width="20" height="20" fill="#FFF"/>
        <rect x="80" y="10" width="10" height="10" fill="#EA580C"/>
        <rect x="0" y="70" width="30" height="30" fill="#0F172A"/>
        <rect x="5" y="75" width="20" height="20" fill="#FFF"/>
        <rect x="10" y="80" width="10" height="10" fill="#EA580C"/>
        <rect x="40" y="10" width="15" height="15" fill="#0F172A"/>
        <rect x="40" y="40" width="20" height="20" fill="#EA580C"/>
        <rect x="15" y="45" width="15" height="10" fill="#0F172A"/>
        <rect x="70" y="45" width="20" height="15" fill="#0F172A"/>
        <rect x="45" y="75" width="15" height="20" fill="#0F172A"/>
        <rect x="75" y="75" width="20" height="20" fill="#EA580C"/>
      </svg>
    `;

    const shareUrl = `${window.location.origin}/profile/${worker.id}`;
    const whatsappText = encodeURIComponent(`Check out verified ${worker.trade} ${worker.name} on AROVIA. Trust Score: ${worker.trust_score}/5.0. Verified Video Proof: ${shareUrl}`);

    modalRoot.innerHTML = `
      <div class="modal-overlay" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="card-title">Verified Profile Card</div>
              <div class="card-subtitle">Shareable via WhatsApp & QR code</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="closeModal()">${icons.close}</button>
          </div>

          <div class="qr-preview">
            ${qrSvg}
            <div style="font-size: 1.15rem; font-weight: 800; color: #0F172A; margin-top: 0.75rem;">${worker.name}</div>
            <div style="font-size: 0.85rem; color: #EA580C; font-weight: 700;">${worker.trade} · ${worker.city}</div>
            <div style="font-size: 0.8rem; color: #475569; margin: 0.25rem 0;">
              ${icons.star} <strong>${worker.trust_score} / 5.0</strong> (${worker.jobs_completed} Verified Jobs Done)
            </div>
            <span class="badge badge-verified" style="margin-top: 0.25rem;">
              ${icons.shield} AI Video Verified Pro
            </span>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
            <a href="https://api.whatsapp.com/send?text=${whatsappText}" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center;">
              Share on WhatsApp
            </a>
            <button class="btn btn-secondary" style="flex: 1;" onclick="navigator.clipboard.writeText('${shareUrl}'); showToast('Profile link copied to clipboard!');">
              Copy Profile Link
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Global start
window.addEventListener("DOMContentLoaded", initApp);
