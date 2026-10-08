/**
 * Golden Curvy Waves Background Animation
 * Renders glowing, flowing golden wave ribbons across both the Auth screen and Main Dashboard.
 */
(function() {
  const waves = [
    {
      amplitude: 55,
      frequency: 0.0015,
      speed: 0.0022,
      offsetY: 0.28,
      color: 'rgba(212, 175, 55, 0.38)',
      lineWidth: 2.2,
      glow: 14
    },
    {
      amplitude: 75,
      frequency: 0.0011,
      speed: 0.0016,
      offsetY: 0.45,
      color: 'rgba(197, 160, 89, 0.42)',
      lineWidth: 2.6,
      glow: 16
    },
    {
      amplitude: 45,
      frequency: 0.0018,
      speed: 0.0028,
      offsetY: 0.62,
      color: 'rgba(230, 190, 110, 0.32)',
      lineWidth: 1.8,
      glow: 10
    },
    {
      amplitude: 65,
      frequency: 0.0013,
      speed: 0.0018,
      offsetY: 0.80,
      color: 'rgba(184, 134, 11, 0.30)',
      lineWidth: 2.0,
      glow: 12
    }
  ];

  let time = 0;

  function resizeCanvas(canvas) {
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = canvas.id === 'dashboard-waves-canvas' 
      ? (window.innerWidth - (window.innerWidth > 900 ? 280 : 0)) 
      : (parent ? parent.clientWidth : window.innerWidth);
    const h = canvas.id === 'dashboard-waves-canvas' 
      ? window.innerHeight 
      : (parent ? parent.clientHeight : window.innerHeight);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function handleResize() {
    const authCanvas = document.getElementById('auth-waves-canvas');
    const dashCanvas = document.getElementById('dashboard-waves-canvas');
    if (authCanvas) resizeCanvas(authCanvas);
    if (dashCanvas) resizeCanvas(dashCanvas);
  }

  window.addEventListener('resize', handleResize);
  document.addEventListener('DOMContentLoaded', handleResize);
  setTimeout(handleResize, 150);

  function renderWaves(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.clientWidth || (canvas.width / (window.devicePixelRatio || 1));
    const h = canvas.clientHeight || (canvas.height / (window.devicePixelRatio || 1));
    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);

    waves.forEach((wave) => {
      ctx.save();
      ctx.beginPath();

      const baseY = h * wave.offsetY;
      const currentSpeed = time * wave.speed;

      ctx.moveTo(-20, baseY + Math.sin(currentSpeed) * wave.amplitude);

      for (let x = -20; x <= w + 20; x += 10) {
        const y = baseY +
          Math.sin(x * wave.frequency + currentSpeed) * wave.amplitude +
          Math.cos(x * wave.frequency * 0.6 + currentSpeed * 0.8) * (wave.amplitude * 0.35);

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = wave.color;
      ctx.lineWidth = wave.lineWidth;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
      ctx.shadowBlur = wave.glow;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    });
  }

  function animate() {
    // 1. Render on Auth Screen canvas (if visible)
    const authCanvas = document.getElementById('auth-waves-canvas');
    if (authCanvas && authCanvas.offsetParent !== null) {
      if (authCanvas.width === 0 || authCanvas.height === 0) {
        resizeCanvas(authCanvas);
      }
      renderWaves(authCanvas);
    }

    // 2. Render on Main Dashboard canvas
    const dashCanvas = document.getElementById('dashboard-waves-canvas');
    if (dashCanvas) {
      if (dashCanvas.width === 0 || dashCanvas.height === 0) {
        resizeCanvas(dashCanvas);
      }
      renderWaves(dashCanvas);
    }

    time += 1;
    requestAnimationFrame(animate);
  }

  animate();
})();
