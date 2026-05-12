const LS_KEY = 'pokedex_cards';

function lsGetAll() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}

function lsSaveAll(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

let cards     = [];
let editingId = null;
let deleteId  = null;

const cardsGrid        = document.getElementById('cardsGrid');
const emptyState       = document.getElementById('emptyState');
const cardCount        = document.getElementById('cardCount');

const modalOverlay     = document.getElementById('modalOverlay');
const modal            = document.getElementById('modal');
const modalTitle       = document.getElementById('modalTitle');
const btnOpenModal     = document.getElementById('btnOpenModal');
const btnCloseModal    = document.getElementById('btnCloseModal');
const btnCancel        = document.getElementById('btnCancel');
const btnSave          = document.getElementById('btnSave');

const inputName        = document.getElementById('inputName');
const inputUrl         = document.getElementById('inputUrl');
const inputAtk         = document.getElementById('inputAtk');
const inputDef         = document.getElementById('inputDef');
const inputDesc        = document.getElementById('inputDesc');
const previewImg       = document.getElementById('previewImg');

const deleteOverlay    = document.getElementById('deleteOverlay');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const btnCancelDelete  = document.getElementById('btnCancelDelete');

function init() {
  cards = lsGetAll();
  renderCards();
  initCanvas();
  initParallax();
  initEvents();
}

function renderCards() {

  [...cardsGrid.querySelectorAll('.poke-card')].forEach(c => c.remove());
  cardCount.textContent = cards.length;

  if (cards.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  cards.forEach((card, i) => {
    const el = buildCard(card);
    el.style.animationDelay = `${i * 0.06}s`;
    cardsGrid.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fills = el.querySelectorAll('.stat-fill');
        fills[0].style.width = Math.min((card.atk / 999) * 100, 100) + '%';
        fills[1].style.width = Math.min((card.def / 999) * 100, 100) + '%';
      });
    });
  });
}

function buildCard(card) {
  const div = document.createElement('div');
  div.className = 'poke-card';
  div.dataset.id = card.id;

  const imgHTML = card.url
    ? `<img src="${esc(card.url)}" alt="${esc(card.name)}"
            onload="this.style.display='block'"
            onerror="this.parentElement.innerHTML='<div class=card-img-fallback>🎴</div>'" />`
    : `<div class="card-img-fallback">🎴</div>`;

  div.innerHTML = `
    <div class="card-img-wrap">${imgHTML}</div>
    <div class="card-body">
      <div class="card-name">${esc(card.name)}</div>
      <div class="card-stats">
        <div class="stat">
          <div class="stat-label">ATK</div>
          <span class="stat-value">${card.atk}</span>
          <div class="stat-bar"><div class="stat-fill"></div></div>
        </div>
        <div class="stat">
          <div class="stat-label">DEF</div>
          <span class="stat-value">${card.def}</span>
          <div class="stat-bar"><div class="stat-fill"></div></div>
        </div>
      </div>
      <div class="card-desc">${esc(card.desc)}</div>
    </div>
    <div class="card-actions">
      <button class="btn-edit" data-id="${card.id}"> Editar</button>
      <button class="btn-del"  data-id="${card.id}"> Remover</button>
    </div>
  `;
  return div;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function saveCard() {
  const name = inputName.value.trim();
  if (!name) { shake(inputName); return; }

  const card = {
    id:   editingId || Date.now().toString(),
    name,
    url:  inputUrl.value.trim(),
    atk:  parseInt(inputAtk.value) || 0,
    def:  parseInt(inputDef.value) || 0,
    desc: inputDesc.value.trim()
  };

  if (editingId) {
    const idx = cards.findIndex(c => c.id === editingId);
    if (idx !== -1) cards[idx] = card;
  } else {
    cards.push(card);
  }

  lsSaveAll(cards);
  closeModal();
  renderCards();
}

function deleteCard() {
  if (!deleteId) return;

  cards = cards.filter(c => c.id !== deleteId);
  lsSaveAll(cards);
  deleteId = null;
  closeDeleteModal();
  renderCards();
}

function openModal(id = null) {
  editingId = id;

  if (id) {
    const card = cards.find(c => c.id === id);
    modalTitle.textContent = 'Editar Card';
    inputName.value = card.name;
    inputUrl.value  = card.url;
    inputAtk.value  = card.atk;
    inputDef.value  = card.def;
    inputDesc.value = card.desc;
    updatePreview(card.url);
  } else {
    modalTitle.textContent = 'Novo Card';
    clearForm();
  }

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  inputName.focus();
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  clearForm();
}

function clearForm() {
  inputName.value = inputUrl.value = inputAtk.value = inputDef.value = inputDesc.value = '';
  previewImg.src  = '';
  previewImg.classList.remove('loaded');
  editingId = null;
}

function updatePreview(url) {
  if (!url) { previewImg.classList.remove('loaded'); return; }
  previewImg.onload  = () => previewImg.classList.add('loaded');
  previewImg.onerror = () => previewImg.classList.remove('loaded');
  previewImg.src = url;
}

function openDeleteModal(id) {
  deleteId = id;
  deleteOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('active');
  document.body.style.overflow = '';
  deleteId = null;
}

function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect(); 
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => el.style.animation = '', { once: true });
  el.focus();
}

function initEvents() {
  btnOpenModal.addEventListener('click',  () => openModal());
  btnCloseModal.addEventListener('click', closeModal);
  btnCancel.addEventListener('click',     closeModal);
  btnSave.addEventListener('click',       saveCard);

  btnConfirmDelete.addEventListener('click', deleteCard);
  btnCancelDelete.addEventListener('click',  closeDeleteModal);

  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDeleteModal(); });

  inputUrl.addEventListener('input', () => updatePreview(inputUrl.value.trim()));

  cardsGrid.addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn  = e.target.closest('.btn-del');
    if (editBtn) openModal(editBtn.dataset.id);
    if (delBtn)  openDeleteModal(delBtn.dataset.id);
  });

  modal.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault(); saveCard();
    }
    if (e.key === 'Escape') closeModal();
  });
  deleteOverlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDeleteModal();
  });
}

function initParallax() {
  const hero = document.getElementById('parallaxHero');
  const bg   = document.getElementById('parallaxBg');

  window.addEventListener('scroll', () => {
    if (window.scrollY < hero.offsetHeight + 100) {
      bg.style.transform = `translateY(${window.scrollY * 0.35}px)`;
    }
  }, { passive: true });
}

function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  const balls  = [];
  const COUNT  = 12;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    balls.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 18 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.01,
    });
  }

  function drawBall(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);

    ctx.beginPath();
    ctx.arc(0, 0, b.r, Math.PI, 0);
    ctx.fillStyle = '#CC0000';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(-b.r, -b.r * 0.12, b.r * 2, b.r * 0.24);
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = b.r * 0.14;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();

    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balls.forEach(b => {
      b.x += b.vx; b.y += b.vy; b.rot += b.vrot;
      if (b.x < -b.r)                b.x = canvas.width  + b.r;
      if (b.x > canvas.width  + b.r) b.x = -b.r;
      if (b.y < -b.r)                b.y = canvas.height + b.r;
      if (b.y > canvas.height + b.r) b.y = -b.r;
      drawBall(b);
    });
    requestAnimationFrame(loop);
  }
  loop();
}

init();