// ============= DARK MODE ============= 

const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  updateThemeToggle();
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggle();
  });
}

function updateThemeToggle() {
  if (themeToggle) {
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }
}

// ============= SEARCH FUNCTIONALITY ============= 

const searchInput = document.querySelector('.search-input');
const postsGrid = document.querySelector('.posts-grid');

if (searchInput && postsGrid) {
  searchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      // Reset to show all posts
      location.href = '/';
      return;
    }

    try {
      const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        renderPosts(data.posts);
      } else {
        postsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-light);">No posts found</p>';
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300));
}

function renderPosts(posts) {
  postsGrid.innerHTML = posts.map(post => {
    const dateObj = new Date(post.created_at);
    const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const thumbnail = post.images && post.images.length > 0 ? post.images[0] : null;

    return `
      <a href="/post/${post.slug}" class="post-card">
        ${thumbnail ? `<img src="${thumbnail}" alt="${post.title}" class="post-card-thumbnail">` : ''}
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        <p class="post-card-excerpt">${escapeHtml(post.excerpt || post.content.substring(0, 150))}</p>
        <div class="post-card-meta">
          <span class="post-date">${date}</span>
          <span class="reading-time">${post.readingTime} min read</span>
        </div>
      </a>
    `;
  }).join('');
}

// ============= ADMIN PANEL ============= 

// Editor state
let currentPostId = null;
let mediaFiles = {
  images: [],
  videos: [],
  audio: []
};

// Initialize admin panel
function initAdmin() {
  const editor = document.getElementById('postEditor');
  const postsList = document.getElementById('postsList');

  if (editor) {
    initEditor();
  }

  if (postsList) {
    loadPostsList();
  }
}

// Rich text editor (simple implementation)
function initEditor() {
  const contentEditor = document.getElementById('postContent');
  const titleInput = document.getElementById('postTitle');
  const excerptInput = document.getElementById('postExcerpt');
  const publishCheckbox = document.getElementById('postPublished');
  const saveButton = document.getElementById('savePostButton');
  const deleteButton = document.getElementById('deletePostButton');
  const charCounter = document.getElementById('charCounter');
  const editId = document.getElementById('postEditId');

  currentPostId = editId ? editId.value : null;

  // Character counter
  if (contentEditor && charCounter) {
    const updateCounter = () => {
      const length = contentEditor.value.length;
      charCounter.textContent = `${length.toLocaleString()} characters`;
      charCounter.classList.remove('warning', 'error');
      if (length > 50000) {
        charCounter.classList.add('error');
      } else if (length > 40000) {
        charCounter.classList.add('warning');
      }
    };

    contentEditor.addEventListener('input', updateCounter);
    updateCounter();
  }

  // Autosave
  if (contentEditor && titleInput) {
    let autoSaveTimeout;
    const autoSave = () => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        saveDraft();
      }, 2000);
    };

    contentEditor.addEventListener('input', autoSave);
    titleInput.addEventListener('input', autoSave);
    if (excerptInput) {
      excerptInput.addEventListener('input', autoSave);
    }
  }

  // Save post
  if (saveButton) {
    saveButton.addEventListener('click', () => savePost());
  }

  // Delete post
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      if (currentPostId && confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        deletePost(currentPostId);
      }
    });
  }

  // Media upload
  setupMediaUpload();
}

function setupMediaUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const uploadInput = document.getElementById('uploadInput');

  if (!uploadArea || !uploadInput) return;

  uploadArea.addEventListener('click', () => uploadInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  uploadInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

async function handleFiles(files) {
  for (const file of files) {
    await uploadFile(file);
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/admin/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      const type = data.type;
      if (!mediaFiles[type + 's']) {
        mediaFiles[type + 's'] = [];
      }
      mediaFiles[type + 's'].push({
        url: data.url,
        filename: data.filename
      });
      renderMediaList();
      showNotification('File uploaded successfully', 'success');
    } else {
      showNotification('Upload failed: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Upload error: ' + error.message, 'error');
  }
}

function renderMediaList() {
  const container = document.getElementById('mediaContainer');
  if (!container) return;

  let html = '';

  ['images', 'videos', 'audio'].forEach(type => {
    if (mediaFiles[type] && mediaFiles[type].length > 0) {
      html += `<h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>`;
      html += '<div class="media-list">';
      mediaFiles[type].forEach((file, idx) => {
        const preview = type === 'images'
          ? `<img src="${file.url}" alt="Media">`
          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--color-medium-grey);">🎬</div>`;

        html += `
          <div class="media-item">
            ${preview}
            <button class="media-remove" onclick="removeMedia('${type}', ${idx})">×</button>
          </div>
        `;
      });
      html += '</div>';
    }
  });

  container.innerHTML = html;
}

function removeMedia(type, index) {
  const file = mediaFiles[type][index];
  if (confirm('Delete this file?')) {
    fetch(`/admin/upload/${file.filename}`, { method: 'DELETE' })
      .then(() => {
        mediaFiles[type].splice(index, 1);
        renderMediaList();
      })
      .catch(error => console.error('Error deleting file:', error));
  }
}

async function savePost() {
  const titleInput = document.getElementById('postTitle');
  const contentEditor = document.getElementById('postContent');
  const excerptInput = document.getElementById('postExcerpt');
  const publishCheckbox = document.getElementById('postPublished');
  const saveButton = document.getElementById('savePostButton');

  if (!titleInput.value.trim() || !contentEditor.value.trim()) {
    showNotification('Title and content are required', 'error');
    return;
  }

  const postData = {
    id: currentPostId || null,
    title: titleInput.value.trim(),
    content: contentEditor.value.trim(),
    excerpt: excerptInput.value.trim(),
    images: JSON.stringify(mediaFiles.images.map(f => f.url)),
    videos: JSON.stringify(mediaFiles.videos.map(f => f.url)),
    audio: JSON.stringify(mediaFiles.audio.map(f => f.url)),
    published: publishCheckbox.checked
  };

  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';

  try {
    const response = await fetch('/admin/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    const data = await response.json();
    if (data.success) {
      currentPostId = data.id;
      showNotification(data.message, 'success');
      
      // Redirect to edit the post
      if (!postData.id) {
        setTimeout(() => {
          window.location.href = `/admin/post/${data.id}`;
        }, 1500);
      }
    } else {
      showNotification('Error saving post', 'error');
    }
  } catch (error) {
    console.error('Save error:', error);
    showNotification('Error: ' + error.message, 'error');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save Post';
  }
}

function saveDraft() {
  const titleInput = document.getElementById('postTitle');
  const contentEditor = document.getElementById('postContent');

  if (!titleInput || !contentEditor) return;

  const draft = {
    title: titleInput.value,
    content: contentEditor.value,
    timestamp: Date.now()
  };

  localStorage.setItem('postDraft', JSON.stringify(draft));
}

function loadDraft() {
  const draft = localStorage.getItem('postDraft');
  if (draft) {
    const data = JSON.parse(draft);
    const titleInput = document.getElementById('postTitle');
    const contentEditor = document.getElementById('postContent');

    if (!titleInput.value && !contentEditor.value) {
      // Only load if empty
      titleInput.value = data.title;
      contentEditor.value = data.content;
    }
  }
}

async function deletePost(id) {
  try {
    const response = await fetch(`/admin/post/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      showNotification('Post deleted', 'success');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    }
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Error deleting post', 'error');
  }
}

async function loadPostsList() {
  try {
    const response = await fetch('/admin');
    // Posts are rendered server-side
  } catch (error) {
    console.error('Error loading posts list:', error);
  }
}

function editPost(id) {
  window.location.href = `/admin?edit=${id}`;
}

// ============= UTILITY FUNCTIONS ============= 

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 500;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
  `;

  if (type === 'success') {
    notification.style.backgroundColor = '#e8f5e9';
    notification.style.color = '#2e7d32';
    notification.style.border = '1px solid #2e7d32';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#ffebee';
    notification.style.color = '#c62828';
    notification.style.border = '1px solid #c62828';
  } else {
    notification.style.backgroundColor = 'var(--color-light-grey)';
    notification.style.color = 'var(--color-text)';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// ============= PAGE INITIALIZATION ============= 

document.addEventListener('DOMContentLoaded', () => {
  // Load theme toggle emoji
  updateThemeToggle();

  // Initialize admin features
  if (document.body.classList.contains('admin-page')) {
    initAdmin();
    loadDraft();
  }

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
});

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
  // Uncomment to enable
  // navigator.serviceWorker.register('/sw.js').catch(() => {});
}
