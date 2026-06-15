const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const contactForm = document.querySelector(".contact-form");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("figcaption");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");
const photoFeed = document.querySelector("[data-photo-feed]");
const projectGrid = document.querySelector("[data-project-grid]");
let projectCards = [];
let lightboxItems = [];
let lightboxIndex = 0;

const normalizeAssetPath = (path) => {
  if (!path) {
    return "";
  }

  if (/^(https?:|data:|\/\/)/.test(path)) {
    return path;
  }

  return path.startsWith("/") ? "." + path : path;
};

const createImage = ({ image, alt }) => {
  const img = document.createElement("img");
  img.src = normalizeAssetPath(image);
  img.alt = alt || "BEGIN.S DESIGN project image";
  return img;
};

const renderPhotos = (photos = []) => {
  photoFeed.innerHTML = "";

  photos.forEach((photo) => {
    const article = document.createElement("article");
    article.className = photo.blackAndWhite ? "photo-card is-bw" : "photo-card";
    article.dataset.title = photo.title || "BEGIN.S DESIGN";
    article.append(createImage(photo));
    photoFeed.append(article);
  });
};

const renderProjects = (projects = []) => {
  projectGrid.innerHTML = "";

  projects.forEach((project) => {
    const article = document.createElement("article");
    article.className = project.featured ? "work-card featured" : "work-card";
    article.append(createImage(project));

    if (project.gallery?.length) {
      const gallery = document.createElement("div");
      gallery.className = "project-gallery";
      gallery.hidden = true;
      project.gallery.forEach((item) => gallery.append(createImage(item)));
      article.append(gallery);
    }

    const info = document.createElement("div");
    info.className = "work-info";
    const title = document.createElement("h3");
    title.textContent = project.title || "PROJECT";
    info.append(title);
    article.append(info);
    projectGrid.append(article);
  });

  projectCards = Array.from(projectGrid.querySelectorAll(".work-card"));
};

const syncHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

const closeLightbox = () => {
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
  document.body.style.overflow = "";
};

const getImageTitle = (image) => {
  const card = image.closest(".work-card, .photo-card");
  return card.querySelector("h3")?.textContent || card.dataset.title || image.alt;
};

const getImageSource = (image) => image.currentSrc || image.src;

const uniqueImagesBySource = (images) => {
  const seen = new Set();
  return images.filter((image) => {
    const source = getImageSource(image);
    if (seen.has(source)) {
      return false;
    }

    seen.add(source);
    return true;
  });
};

const showLightboxItem = (index) => {
  if (!lightboxItems.length) {
    return;
  }

  lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const image = lightboxItems[lightboxIndex];
  lightboxImage.src = getImageSource(image);
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = getImageTitle(image);
};

const openLightbox = (image) => {
  const card = image.closest(".work-card, .photo-card");

  if (card.classList.contains("work-card")) {
    const cardGallery = card.querySelector(".project-gallery");
    const cardMainImage = card.querySelector(":scope > img");
    lightboxItems = uniqueImagesBySource([cardMainImage, ...Array.from(cardGallery?.querySelectorAll("img") || [])]);
    lightboxIndex = 0;
    showLightboxItem(lightboxIndex);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    return;
  }

  const scope = image.closest(".photo-feed, .works-grid");
  lightboxItems = Array.from(scope.querySelectorAll("img")).filter((item) => !item.closest(".is-hidden"));
  lightboxIndex = lightboxItems.indexOf(image);
  showLightboxItem(lightboxIndex);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
};

const bindGalleryClicks = () => {
  document.querySelectorAll(".work-card > img, .photo-card > img").forEach((image) => {
    image.addEventListener("click", () => {
      openLightbox(image);
    });
  });
};

const loadSiteContent = async () => {
  try {
    const response = await fetch("./data/site-content.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Content file could not be loaded");
    }

    const content = await response.json();
    renderPhotos(content.photos);
    renderProjects(content.projects);
    bindGalleryClicks();
  } catch (error) {
    console.error(error);
    photoFeed.innerHTML = '<p class="content-error">콘텐츠를 불러오지 못했습니다.</p>';
    projectGrid.innerHTML = '<p class="content-error">프로젝트를 불러오지 못했습니다.</p>';
  }
};

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu.hidden = isOpen;
});

mobileMenu.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  }
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => showLightboxItem(lightboxIndex - 1));
lightboxNext.addEventListener("click", () => showLightboxItem(lightboxIndex + 1));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }

  if (event.key === "ArrowLeft" && !lightbox.hidden) {
    showLightboxItem(lightboxIndex - 1);
  }

  if (event.key === "ArrowRight" && !lightbox.hidden) {
    showLightboxItem(lightboxIndex + 1);
  }
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  button.textContent = "문의가 접수되었습니다";
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = "문의하기";
    button.disabled = false;
    contactForm.reset();
  }, 2200);
});

loadSiteContent();
