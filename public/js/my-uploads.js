document.addEventListener("DOMContentLoaded", function() {
  fetch('/api/my-uploads')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch uploads');
      return res.json();
    })
    .then(images => {
      const gallery = document.getElementById('myGallery');
      gallery.innerHTML = '';
      if (!images.length) {
        gallery.innerHTML = '<p style="color:#888;">No uploads yet. Use the form above to add your first astronomy photo!</p>';
        return;
      }
      images.forEach(img => {
        const div = document.createElement('div');
        div.className = 'image-card';
        div.innerHTML = `
          <h3>${img.title || 'Untitled'}</h3>
          <img src="/uploads/${img.filename}" alt="${(img.title || 'Astro Image').replace(/"/g, '&quot;')}" loading="lazy" />
          <p>${img.description || ''}</p>
          <div>Uploader: ${img.uploaderName || 'Anonymous'}</div>
          <div>Likes: <span>${img.likes}</span></div>
          <div>Reports: <span>${img.reports}</span></div>
          <button class="delete-btn" data-id="${img._id}">Delete</button>
        `;
        gallery.appendChild(div);
      });
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = function() {
          if (confirm('Are you sure you want to delete this image?')) {
            fetch('/delete/' + btn.dataset.id, { method: 'POST' })
              .then(() => location.reload());
          }
        };
      });
    })
    .catch(err => {
      document.getElementById('myGallery').innerHTML = '<p style="color:red;">Failed to load your uploads. Please make sure you are logged in.</p>';
    });
});
