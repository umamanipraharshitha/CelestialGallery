document.addEventListener("DOMContentLoaded", function() {
  fetch('/api/images')
    .then(res => res.json())
    .then(({ images, userId }) => {
      const gallery = document.getElementById('gallery');
      gallery.innerHTML = '';
      images.forEach(img => {
        const div = document.createElement('div');
        div.className = 'image-card';
        // Disable report button if user already reported
        let reported = img.reportedBy && userId && img.reportedBy.includes(userId);
        div.innerHTML = `
          <h3>${img.title || 'Untitled'}</h3>
          <img src="/uploads/${img.filename}" alt="Astro Image">
          <p>${img.description || ''}</p>
          <div>Uploader: ${img.uploaderName || 'Anonymous'}</div>
          <div>Likes: <span>${img.likes}</span> <button class="like-btn" data-id="${img._id}">Like</button></div>
          <div>Reports: <span>${img.reports}</span> <button class="report-btn" data-id="${img._id}" ${reported ? 'disabled' : ''}>Report</button></div>
         
        `;
        gallery.appendChild(div);
      });

      // Hide/show nav links
      if (userId) {
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('registerLink').style.display = 'none';
        document.getElementById('logoutForm').style.display = '';
        document.getElementById('myUploadsLink').style.display = '';
      } else {
        document.getElementById('loginLink').style.display = '';
        document.getElementById('registerLink').style.display = '';
        document.getElementById('logoutForm').style.display = 'none';
        document.getElementById('myUploadsLink').style.display = 'none';
      }

      // Add button listeners
      document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = function() {
          fetch('/like/' + btn.dataset.id, { method: 'POST' }).then(() => location.reload());
        };
      });
      document.querySelectorAll('.report-btn').forEach(btn => {
        btn.onclick = function() {
          fetch('/report/' + btn.dataset.id, { method: 'POST' }).then(() => location.reload());
        };
      });
      
      
    });
});
