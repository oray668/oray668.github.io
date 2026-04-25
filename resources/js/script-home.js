// Wait for everything to load
window.addEventListener('load', function() {
	console.log('Page loaded, initializing scroll filter...');
	
	const scrollContainer = document.querySelector('.scroll-container');
	
	if (!scrollContainer) {
		console.error('ERROR: Scroll container not found!');
		return;
	}
	
	console.log('✓ Scroll container found');
	
	// Get all the labels
	const labels = document.querySelectorAll('.container-new');
	console.log('✓ Found', labels.length, 'filter labels');
	
	// Function to check which label is centered
	function updateCheckedRadio() {
		const containerRect = scrollContainer.getBoundingClientRect();
		const containerCenter = containerRect.top + (containerRect.height / 2);
		
		let closestLabel = null;
		let closestDistance = Infinity;
		
		labels.forEach(label => {
			const labelRect = label.getBoundingClientRect();
			const labelCenter = labelRect.top + (labelRect.height / 2);
			const distance = Math.abs(containerCenter - labelCenter);
			
			if (distance < closestDistance) {
				closestDistance = distance;
				closestLabel = label;
			}
		});
		
		if (closestLabel) {
			const input = closestLabel.querySelector('input');
			if (input && !input.checked) {
				console.log('→ Checking:', input.id);
				input.checked = true;
			}
		}
	}
	
	// Update on scroll — handles trackpad momentum snapping
	scrollContainer.addEventListener('scroll', function() {
		updateCheckedRadio();
	});

	// Wheel handler — splits behaviour by input device
	const itemHeight = 20; // must match --itemHeight in CSS
	const itemGap = 10;    // must match --itemGap in CSS
	const step = itemHeight + itemGap;

	let lastMouseWheelTime = 0;

	scrollContainer.addEventListener('wheel', function(e) {
		const isTrackpad = Math.abs(e.deltaY) < 50;

		if (isTrackpad) {
			// Trackpad: let native scroll + CSS snap handle it naturally
			// The scroll listener above will call updateCheckedRadio when it settles
			return;
		}

		// Mouse wheel: step exactly one item at a time, no throttle
		e.preventDefault();

		const direction = e.deltaY > 0 ? 1 : -1;
		const items = Array.from(labels);
		const currentIndex = items.findIndex(l => l.querySelector('input').checked);
		const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));
		if (nextIndex === currentIndex) return;

		items[nextIndex].querySelector('input').checked = true;
		scrollContainer.scrollTop = nextIndex * step;
	}, { passive: false });

	// Initial check
	updateCheckedRadio();
	
	console.log('✓ Scroll filter initialized successfully!');
});


function initSlider(wrapperId, total) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const track = wrapper.querySelector('.slider-track-container');
  const dots = wrapper.querySelectorAll('.dot');
  const label = wrapper.querySelector('.slide-label');
  let current = 0;

  function goTo(i) {
    current = (i + total) % total;
    track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    if (label) label.textContent = `${current + 1} / ${total}`;
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
        if (label) label.textContent = `${i + 1} / ${total}`;
      }
      ticking = false;
    });
    ticking = true;
  });
}

// Initialise sliders — first argument is the wrapper ID, second is the slide count
initSlider('slider-mobile', 5);
initSlider('slider-2', 5); 




// MAKE PROJECT TABLE DRAGGABLE //


// Make the DIV element draggable:
dragElement(document.getElementById("project-table"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
    
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
  
  
}

