function initSlider(wrapperId, total) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const track = wrapper.querySelector('.slider-track-container');
  const dots = wrapper.querySelectorAll('.dot');
  const labels = wrapper.querySelectorAll('.slide-label');
  let current = 0;

  function goTo(i) {
    current = (i + total) % total;
    track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    labels.forEach((l, idx) => l.classList.toggle('active', idx === current));
  }

  wrapper.querySelector('.prev').onclick = () => goTo(current - 1);
  wrapper.querySelector('.next').onclick = () => goTo(current + 1);
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) requestAnimationFrame(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== current) {
        current = i;
        dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
        labels.forEach((l, idx) => l.classList.toggle('active', idx === i));
      }
      ticking = false;
    });
    ticking = true;
  });
}

// Initialise sliders — first argument is the wrapper ID, second is the slide count
initSlider('slider-student-work', 13);
initSlider('slider-mobile', 5);