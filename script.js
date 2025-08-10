// ===== LOGIN PAGE =====
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const resp = await fetch('auth.php', { method: 'POST', body: formData });
    const data = await resp.json();
    const msg = document.getElementById('msg');
    if (data.success) {
      sessionStorage.setItem('loggedIn', 'true');
      msg.style.color = 'lime';
      msg.textContent = 'Login berhasil! Mengalihkan...';
      setTimeout(() => window.location.href = 'index.html', 1500);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.error || 'Login gagal';
    }
  });

  // ==== Efek Partikel + Laser ====
  const canvas = document.getElementById('holoCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let lasers = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Partikel
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.8,
      dy: (Math.random() - 0.5) * 0.8,
      color: Math.random() > 0.5 ? 'cyan' : 'magenta'
    });
  }

  // Laser
  for (let i = 0; i < 10; i++) {
    lasers.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 200 + 100,
      speed: (Math.random() - 0.5) * 2,
      color: 'rgba(0,255,255,0.5)'
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Partikel
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    // Laser
    lasers.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.length, l.y);
      ctx.strokeStyle = l.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'cyan';
      ctx.lineWidth = 2;
      ctx.stroke();

      l.y += l.speed;
      if (l.y < 0) l.y = canvas.height;
      if (l.y > canvas.height) l.y = 0;
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// ===== CHAT PAGE =====
if (document.getElementById('sendBtn')) {
  if (!sessionStorage.getItem('loggedIn')) {
    window.location.href = 'login.html';
  }
  document.getElementById('logoutBtn').onclick = () => {
    sessionStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
  };

  document.getElementById('sendBtn').addEventListener('click', async () => {
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;
    const chatOutput = document.getElementById('chatOutput');
    chatOutput.innerHTML += `<p><b>Kamu:</b> ${input}</p>`;
    document.getElementById('userInput').value = '';

    const resp = await fetch('ai.php', {
      method: 'POST',
      body: new URLSearchParams({ prompt: input })
    });
    const data = await resp.json();
    chatOutput.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  });
}
