// Efek partikel hologram di halaman login/register
if (document.getElementById('loginForm') || document.querySelector('form[action="register.php"]')) {
  const canvas = document.getElementById('holoCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

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

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }
}

// Fungsi chat di halaman index.php
if (document.getElementById('sendBtn')) {
  document.getElementById('sendBtn').addEventListener('click', async () => {
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;
    const chatOutput = document.getElementById('chatOutput');
    chatOutput.innerHTML += `<p><b>Kamu:</b> ${input}</p>`;
    document.getElementById('userInput').value = '';

    // Panggil ai.php (kamu harus isi API key di sana)
    const resp = await fetch('ai.php', {
      method: 'POST',
      body: new URLSearchParams({ prompt: input })
    });
    const data = await resp.json();
    chatOutput.innerHTML += `<p><b>AI:</b> ${data.reply}</p>`;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  });
}
