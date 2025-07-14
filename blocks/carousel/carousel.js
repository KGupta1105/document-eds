export default function decorate(block) {
  const rows = [...block.children];

  // Default single arrow symbols
  let btnPre = '<';
  let btnNxt = '>';

  console.log("Using default arrow buttons:", btnPre, btnNxt);

  // Get actual slide rows (exclude first and last)
  const slideRows = rows.slice(1, -1);

  console.log("Found", slideRows.length, "slides");

  if (slideRows.length === 0) {
    console.warn("No slides found after removing button rows");
    return;
  }

  // Clear the block
  block.innerHTML = '';

  // Create navigation buttons
  const navContainer = document.createElement('div');
  navContainer.classList.add('carousel-nav');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('btn', 'btn-prev');
  prevBtn.textContent = btnPre;
  prevBtn.setAttribute('aria-label', 'Previous slide');

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('btn', 'btn-next');
  nextBtn.textContent = btnNxt;
  nextBtn.setAttribute('aria-label', 'Next slide');

  // Create slides container
  const slidesContainer = document.createElement('div');
  slidesContainer.classList.add('carousel-slides');

  // Process actual slide rows
  slideRows.forEach((row, index) => {
    row.classList.add('slide');
    row.setAttribute('data-slide', index);

    // Style columns within each slide
    [...row.children].forEach((col, colIndex) => {
      if (colIndex === 0) {
        col.classList.add('slide-image');
      } else if (colIndex === 1) {
        col.classList.add('slide-text');
      }
    });

    // Set initial position
    row.style.transform = `translateX(${index * 100}%)`;
    slidesContainer.appendChild(row);
  });

  // Assemble the carousel
  navContainer.appendChild(prevBtn);
  navContainer.appendChild(nextBtn);

  block.appendChild(navContainer);
  block.appendChild(slidesContainer);

  // Add carousel functionality
  setupCarouselNavigation(nextBtn, prevBtn, slideRows);

  console.log("Carousel initialized with", slideRows.length, "slides");
}

function setupCarouselNavigation(nextBtn, prevBtn, slides) {
  let currentSlide = 0;
  const maxSlide = slides.length - 1;

  // Update slide positions
  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.style.transform = `translateX(${100 * (index - currentSlide)}%)`;
    });
  }

  // Next button functionality
  nextBtn.addEventListener('click', () => {
    if (currentSlide === maxSlide) {
      currentSlide = 0;
    } else {
      currentSlide++;
    }
    updateSlides();
  });

  // Previous button functionality
  prevBtn.addEventListener('click', () => {
    if (currentSlide === 0) {
      currentSlide = maxSlide;
    } else {
      currentSlide--;
    }
    updateSlides();
  });

  // Optional: Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
    }
  });
}
