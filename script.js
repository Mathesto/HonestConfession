let selectedColor = "#bfdbfe";

const modal = document.getElementById("modal");
const grid = document.getElementById("confessionGrid");
const toInput = document.getElementById("toInput");
const fromInput = document.getElementById("fromInput");
const messageInput = document.getElementById("messageInput");
const searchInput = document.getElementById("searchInput");

function openModal() {
  // Check if a user session exists before opening the submission drawer
  const userRaw = localStorage.getItem('currentUser');
  if (!userRaw) {
    alert("Please sign up or log in first to post a confession!");
    openAuthModal();
    return;
  }
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function setColor(color) {
  selectedColor = color;
}

// 1. FETCH ALL CONFESSIONS FROM THE NEW BACKEND
async function fetchConfessions() {
  try {
    const response = await fetch('/api/confessions');
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    renderConfessions(data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

// 2. SAVE A NEW CONFESSION TO THE NEW BACKEND
async function saveConfession() {
  const to = toInput.value.trim();
  const fromVal = fromInput ? fromInput.value.trim() : "";
  const msg = messageInput.value.trim();

  if (!to || !msg) {
    alert("Please fill in both fields!");
    return;
  }

  const userRaw = localStorage.getItem('currentUser');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!user) {
    alert("Authentication expired. Please log back in.");
    return;
  }

  try {
    const response = await fetch('/api/confessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        to: to, 
        msg: msg, 
        color: selectedColor,
        userId: user.id,
        fromUser: fromVal || null // Sends null if empty string
      })
    });

    if (!response.ok) throw new Error('Failed to post confession');

    closeModal();
    toInput.value = "";
    if(fromInput) fromInput.value = "";
    messageInput.value = "";
    fetchConfessions(); 
  } catch (err) {
    alert(err.message);
  }
}

// 3. RENDER THE CARDS WITH OWNER AND ADMIN PERMISSIONS
async function renderConfessions(data) {
  if (!data) return;

  const userRaw = localStorage.getItem('currentUser');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user && user.isAdmin === true;
  const currentUserId = user ? user.id : null;

  grid.innerHTML = data
    .map(
      (post) => {
        // Validation boundary: allow delete view if admin OR card owner matches current session ID
        const isOwner = currentUserId && post.user_id == currentUserId;
        const canDelete = isAdmin || isOwner;

        return `
          <div class="confession-card" style="background-color: ${post.color}; position: relative;">
              <div style="display: flex; flex-direction: column; gap: 0.25rem; border-bottom: 1px solid rgba(0, 0, 0, 0.1); padding-bottom: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                      <p class="card-to" style="border:none; padding:0;">To: ${post.to}</p>
                      ${post.is_pinned ? `<span style="font-size: 10px; font-weight: bold; background: black; color: white; padding: 2px 6px; border-radius: 4px;">📌 PINNED</span>` : ""}
                  </div>
                  ${post.from_user ? `<p style="font-size: 0.75rem; font-weight: 500; color: #3f3f46;">From: ${post.from_user}</p>` : `<p style="font-size: 0.75rem; font-style: italic; color: #71717a;">From: Anonymous</p>`}
              </div>
              <p class="card-msg" style="margin-top: 0.5rem;">${post.msg}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                  <div></div> <!-- Keeps the action items pushed cleanly to the right side -->
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                      ${isAdmin ? `
                        <button onclick="togglePin(${post.id}, ${post.is_pinned})" style="background:none; border:none; cursor:pointer; font-size: 16px;" title="${post.is_pinned ? 'Unpin' : 'Pin'}">
                          ${post.is_pinned ? '📍' : '📌'}
                        </button>
                      ` : ""}
                      ${canDelete ? `
                        <button onclick="deletePost(${post.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; display:flex; align-items:center;" title="Delete Post">
                          <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
                        </button>
                      ` : ""}
                  </div>
              </div>
          </div>
        `;
      }
    )
    .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

// 4. AUTHORIZED DELETE ACTION INTERACTION
async function deletePost(postId) {
  if (confirm("Are you sure you want to remove this confession?")) {
    const userRaw = localStorage.getItem('currentUser');
    const user = userRaw ? JSON.parse(userRaw) : null;
    
    const currentUserId = user ? user.id : "";
    const isAdmin = user ? user.isAdmin : false;

    try {
      const response = await fetch(`/api/confessions?id=${postId}&currentUserId=${currentUserId}&isAdmin=${isAdmin}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete message.');
      }

      fetchConfessions(); 
    } catch (err) {
      alert(err.message);
    }
  }
}

// 5. CLIENT SIDE SEARCHING / FILTERING
function filterConfessions() {
  const query = searchInput.value.trim().toLowerCase();
  const cards = document.querySelectorAll('.confession-card');

  cards.forEach(card => {
    const toText = card.querySelector('.card-to').innerText.toLowerCase();
    const msgText = card.querySelector('.card-msg').innerText.toLowerCase();

    if (toText.includes(query) || msgText.includes(query)) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

let isSignUpMode = false;
const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleLink = document.getElementById("authToggleLink");

function openAuthModal() {
  authModal.classList.remove("hidden");
}

function closeAuthModal() {
  authModal.classList.add("hidden");
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  authTitle.innerText = isSignUpMode ? "Sign Up" : "Login";
  authSubmitBtn.innerText = isSignUpMode ? "Create Account" : "Login";
  authToggleLink.innerText = isSignUpMode
    ? "Already have an account? Login"
    : "Don't have an account? Sign Up";
}

// 6. SECURE DATABASE AUTH HANDLING
async function handleAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password!");
    return;
  }

  const action = isSignUpMode ? 'signup' : 'login';

  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Authentication failed');
    }

    alert(result.message);
    
    if (action === 'signup') {
      // Switch back to login mode seamlessly after sign up
      toggleAuthMode();
    } else if (action === 'login' && result.user) {
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      closeAuthModal();
      updateUI();
    }

  } catch (err) {
    console.error("Auth Error:", err);
    alert(err.message);
  }
}

// 7. USER SESSION TRACKER
function updateUI() {
  const userRaw = localStorage.getItem('currentUser');
  const user = userRaw ? JSON.parse(userRaw) : null;
  
  const loginBtn = document.getElementById("loginBtn");

  if (user) {
    loginBtn.innerText = "Logout";
    loginBtn.onclick = handleLogout;
    console.log("Logged in session active:", user.email);
  } else {
    loginBtn.innerText = "Login";
    loginBtn.onclick = openAuthModal;
  }

  fetchConfessions(); 
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  alert("Logged out!");
  updateUI();
}

// 8. ADMIN TOGGLE PIN SERVER QUERY
async function togglePin(id, currentPinnedStatus) {
  try {
    const response = await fetch('/api/confessions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_pinned: !currentPinnedStatus }),
    });

    if (response.ok) {
      fetchConfessions(); 
    } else {
      alert('Failed to update pin status');
    }
  } catch (error) {
    console.error('Pinning Error:', error);
  }
}

updateUI();

// AUTOMATIC REAL-TIME POLLING (Checks for new confessions every 15 seconds)
setInterval(() => {
  fetchConfessions();
}, 15000);
