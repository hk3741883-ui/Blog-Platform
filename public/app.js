let currentUser = null;
let allPosts = [];
let currentCategory = 'All';
let authMode = 'login';
let sessionSeconds = 0;
let videoObserver = null;

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('auragram_token');
  const userStr = localStorage.getItem('auragram_user');

  const savedTheme = localStorage.getItem('aura_theme') || 'pitch-black';
  const savedAccent = localStorage.getItem('aura_accent') || '#a855f7';
  setTheme(savedTheme);
  setAccent(savedAccent);

  if (token && userStr) {
    try {
      currentUser = JSON.parse(userStr);
      setupAuthenticatedUI();
    } catch (e) {
      localStorage.clear();
    }
  }

  loadPosts();
  startScreenTimer();
});

// Active Screen Time Counter
function startScreenTimer() {
  setInterval(() => {
    sessionSeconds++;
    const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
    const secs = String(sessionSeconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('activeTimer');
    if (timerEl) timerEl.textContent = `${mins}m ${secs}s`;
  }, 1000);
}

function setupAuthenticatedUI() {
  const guestGroup = document.getElementById('guestNavGroup');
  if (guestGroup) guestGroup.style.display = 'none';

  const profile = document.getElementById('userProfileNav');
  if (profile) profile.style.display = 'flex';

  const nameEl = document.getElementById('navUserName');
  if (nameEl) nameEl.textContent = currentUser.name;

  const avatarEl = document.getElementById('navUserAvatar');
  if (avatarEl) {
    avatarEl.src = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random&color=fff`;
  }

  const createBtn = document.getElementById('openCreateBtn');
  if (createBtn) createBtn.style.display = 'block';
}

function logout() {
  localStorage.clear();
  window.location.reload();
}

async function loadPosts() {
  try {
    const res = await fetch('/api/posts');
    allPosts = await res.json();
    renderFeed();
  } catch (err) {
    console.error('Failed to load posts', err);
  }
}

// ========================================================
// 🎬 SMART VIDEO SCROLL OBSERVER (AUTO PAUSE ON SCROLL OUT)
// ========================================================
function setupVideoScrollObserver() {
  if (videoObserver) {
    videoObserver.disconnect();
  }

  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // Video viewport ke center me hai -> Play
        video.play().catch(() => {});
      } else {
        // Video scroll se bahar gayi -> Turant Pause & Audio band
        video.pause();
      }
    });
  }, {
    threshold: [0, 0.5, 1.0]
  });

  document.querySelectorAll('video.feed-video').forEach(vid => {
    videoObserver.observe(vid);
  });
}

// Fallback Video Switcher - Guarantees NO Black Screen
function handleVideoError(videoElement) {
  const fallbackUrls = [
    "https://vjs.zencdn.net/v/oceans.mp4",
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  ];
  const randomFallback = fallbackUrls[Math.floor(Math.random() * fallbackUrls.length)];
  videoElement.onerror = null;
  videoElement.src = randomFallback;
  videoElement.load();
}

function renderFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) return;

  const filtered = currentCategory === 'All' 
    ? allPosts 
    : allPosts.filter(p => p.category === currentCategory || (currentCategory === 'Visuals' && p.type === 'video'));

  container.innerHTML = filtered.map(post => {
    const isLiked = currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.id);
    const avatarUrl = post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=random&color=fff`;

    return `
      <article class="post-card" id="card_${post._id}">
        <!-- Header -->
        <div class="post-header">
          <div class="user-meta" onclick="openUserProfile('${post.authorName}', '${avatarUrl}')">
            <img src="${avatarUrl}" alt="Avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=6366f1&color=fff'">
            <div>
              <b>${post.authorName}</b>
              <div class="time-tag">${new Date(post.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <span class="category-pill">${post.category}</span>
        </div>

        <!-- Media Box with Fail-Safe Video Autoplay & Auto-Pause -->
        <div class="media-box" ondblclick="handleDoubleTap('${post._id}')">
          ${post.type === 'video' ? `
            <video 
              class="feed-video"
              controls 
              muted
              loop 
              playsinline 
              preload="metadata"
              onerror="handleVideoError(this)"
              style="width: 100%; min-height: 260px; max-height: 520px; object-fit: cover; background: #000; display: block;"
              onclick="event.stopPropagation(); this.paused ? this.play() : this.pause();">
              <source src="${post.mediaUrl}" type="video/mp4">
              Your browser does not support HTML5 video playback.
            </video>
          ` : `
            <img src="${post.mediaUrl}" alt="Post Media" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80'">
          `}
          <div class="pop-heart" id="heart_${post._id}">❤️</div>
        </div>

        <!-- Action Strip with Instant Like Counter -->
        <div class="action-strip">
          <button class="strip-btn ${isLiked ? 'liked' : ''}" id="likeBtn_${post._id}" onclick="toggleLike('${post._id}')">
            <span id="heartIcon_${post._id}">${isLiked ? '❤️' : '🤍'}</span> 
            <span id="likeCount_${post._id}" style="font-weight:700;">${post.likes}</span>
          </button>
          <button class="strip-btn" onclick="focusCommentInput('${post._id}')">
            💬 <span>${(post.comments || []).length}</span>
          </button>
          <button class="strip-btn" onclick="shareToStory('${post._id}')" title="Share to Story">
            ⚡ <span style="font-size:0.75rem;">Story</span>
          </button>
          <button class="strip-btn" onclick="copyPostLink('${post._id}')" title="Copy Link" style="margin-left:auto;">
            🔗
          </button>
        </div>

        <!-- Caption (No Numbers) -->
        <div class="post-caption">
          <h4>${post.title}</h4>
          <p>${post.content}</p>
        </div>

        <!-- Comments -->
        <div class="post-comments">
          <div class="comments-stream" id="commList_${post._id}">
            ${(post.comments || []).map(c => `
              <div class="comment-line">
                <b>${c.userName}</b>
                <span>${c.text}</span>
              </div>
            `).join('')}
          </div>

          <form class="comment-input-bar" onsubmit="handleCommentSubmit(event, '${post._id}')">
            <input type="text" id="input_${post._id}" placeholder="Add a comment..." required>
            <button type="submit" class="btn-post-comment">Post</button>
          </form>
        </div>
      </article>
    `;
  }).join('');

  // Setup Observer so only active video plays
  setupVideoScrollObserver();
}

// Double Tap Animation
function handleDoubleTap(postId) {
  const heart = document.getElementById(`heart_${postId}`);
  if (heart) {
    heart.classList.add('animate');
    setTimeout(() => heart.classList.remove('animate'), 650);
  }
  toggleLike(postId, true);
}

// Real-Time Like / Unlike with Exact +1 / -1
async function toggleLike(postId, forceOnlyLike = false) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const token = localStorage.getItem('auragram_token');
  const post = allPosts.find(p => p._id === postId);
  if (!post) return;

  if (!Array.isArray(post.likedBy)) post.likedBy = [];
  const isCurrentlyLiked = post.likedBy.includes(currentUser.id);

  if (forceOnlyLike && isCurrentlyLiked) return;

  const likeBtn = document.getElementById(`likeBtn_${postId}`);
  const heartIcon = document.getElementById(`heartIcon_${postId}`);
  const countEl = document.getElementById(`likeCount_${postId}`);

  if (isCurrentlyLiked) {
    post.likes = Math.max(0, post.likes - 1);
    post.likedBy = post.likedBy.filter(id => id !== currentUser.id);
    if (likeBtn) likeBtn.classList.remove('liked');
    if (heartIcon) heartIcon.textContent = '🤍';
  } else {
    post.likes += 1;
    post.likedBy.push(currentUser.id);
    if (likeBtn) likeBtn.classList.add('liked');
    if (heartIcon) heartIcon.textContent = '❤️';
  }

  if (countEl) countEl.textContent = post.likes;

  try {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      post.likes = data.likes;
      if (countEl) countEl.textContent = data.likes;
    }
  } catch (err) {
    console.error('Like error:', err);
  }
}

// Comment Submission
async function handleCommentSubmit(e, postId) {
  e.preventDefault();
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const input = document.getElementById(`input_${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const token = localStorage.getItem('auragram_token');
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const newComment = await res.json();
      const post = allPosts.find(p => p._id === postId);
      if (!post.comments) post.comments = [];
      post.comments.push(newComment);

      const commList = document.getElementById(`commList_${postId}`);
      if (commList) {
        const line = document.createElement('div');
        line.className = 'comment-line';
        line.innerHTML = `<b>${newComment.userName}</b> <span>${newComment.text}</span>`;
        commList.appendChild(line);
      }
      input.value = '';
    }
  } catch (err) {
    console.error('Comment error:', err);
  }
}

function focusCommentInput(postId) {
  const input = document.getElementById(`input_${postId}`);
  if (input) input.focus();
}

function filterFeed(category) {
  currentCategory = category;
  document.querySelectorAll('.story-bubble').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(category));
  });
  renderFeed();
}

// User Profile Inspector
function openUserProfile(name, avatar) {
  document.getElementById('profileModalName').textContent = `${name}'s Profile`;
  document.getElementById('profileModalHandle').textContent = `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  document.getElementById('profileModalAvatar').src = avatar;

  const authorPosts = allPosts.filter(p => p.authorName === name);
  const grid = document.getElementById('profilePostsGrid');
  grid.innerHTML = authorPosts.map(p => `
    <img src="${p.mediaUrl}" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80'">
  `).join('');

  openModal('profileModal');
}

// Settings & Themes
function toggleSettingsSidebar() {
  document.getElementById('settingsSidebar').classList.toggle('open');
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('aura_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(theme.replace('-', ' ')));
  });
}

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  localStorage.setItem('aura_accent', color);
}

function shareToStory(postId) {
  showToast("Added to your 24hr Aura Story! ⚡");
}

function copyPostLink(postId) {
  navigator.clipboard.writeText(`${window.location.origin}/#post_${postId}`);
  showToast("Post link copied to clipboard! 🔗");
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Help & Support
async function handleSupportSubmit(e) {
  e.preventDefault();
  const payload = {
    userEmail: document.getElementById('supportEmail').value,
    problemDescription: document.getElementById('supportDesc').value,
    screenshotUrl: document.getElementById('supportScreenshot').value
  };

  const res = await fetch('/api/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('helpSupportModal');
    e.target.reset();
    showToast('Ticket submitted directly to Hardeep Kumar! 🚀');
  }
}

// Create New Post
async function handleCreatePost(e) {
  e.preventDefault();
  const token = localStorage.getItem('auragram_token');
  const payload = {
    title: document.getElementById('postTitle').value,
    type: document.getElementById('postMediaType').value,
    category: document.getElementById('postCategory').value,
    mediaUrl: document.getElementById('postMediaUrl').value,
    content: document.getElementById('postContent').value
  };

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal('createPostModal');
    e.target.reset();
    loadPosts();
  }
}

// Authentication
function openAuthModal(mode) {
  switchAuthMode(mode);
  openModal('authModal');
}

function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('registerFields').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('authErrorMsg').textContent = '';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  const name = document.getElementById('authName').value.trim();

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const payload = authMode === 'login' ? { email, password } : { name, email, password };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    document.getElementById('authErrorMsg').textContent = data.message || 'Operation failed';
    return;
  }

  if (authMode === 'register') {
    switchAuthMode('login');
    document.getElementById('authEmail').value = email;
    showToast('Account created! Please Sign In.');
  } else {
    localStorage.setItem('auragram_token', data.token);
    localStorage.setItem('auragram_user', JSON.stringify(data.user));
    currentUser = data.user;
    closeModal('authModal');
    setupAuthenticatedUI();
    renderFeed();
  }
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }