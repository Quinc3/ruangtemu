/** Nama ligature Material Symbols Outlined (https://fonts.google.com/icons) */
export const MATERIAL_ICONS = [
  'account_balance',
  'account_circle',
  'add',
  'add_circle',
  'alarm',
  'archive',
  'arrow_back',
  'arrow_forward',
  'assignment',
  'attach_money',
  'auto_stories',
  'badge',
  'book',
  'bookmark',
  'cake',
  'calendar_add_on',
  'calendar_month',
  'calendar_today',
  'camera',
  'card_giftcard',
  'celebration',
  'chat',
  'check',
  'check_circle',
  'checkroom',
  'child_care',
  'church',
  'close',
  'coffee',
  'comment',
  'contact_mail',
  'credit_card',
  'delete',
  'diamond',
  'directions',
  'diversity_3',
  'edit',
  'email',
  'emoji_events',
  'event',
  'event_available',
  'event_note',
  'event_seat',
  'family_restroom',
  'favorite',
  'favorite_border',
  'festival',
  'flight',
  'groups',
  'group_add',
  'handshake',
  'headphones',
  'history_edu',
  'home',
  'hotel',
  'how_to_reg',
  'image',
  'info',
  'inventory_2',
  'key',
  'lightbulb',
  'link',
  'local_activity',
  'local_bar',
  'local_cafe',
  'local_dining',
  'local_florist',
  'local_hospital',
  'local_library',
  'local_mall',
  'local_parking',
  'local_phone',
  'local_post_office',
  'location_city',
  'location_on',
  'lock',
  'logout',
  'lunch_dining',
  'mail',
  'map',
  'menu',
  'mic',
  'military_tech',
  'music_note',
  'notifications',
  'no_photography',
  'open_in_new',
  'palette',
  'park',
  'people',
  'person',
  'person_add',
  'photo_camera',
  'photo_library',
  'place',
  'public',
  'qr_code_2',
  'quiz',
  'redeem',
  'refresh',
  'restaurant',
  'restaurant_menu',
  'room',
  'schedule',
  'school',
  'science',
  'search',
  'security',
  'send',
  'settings',
  'share',
  'shopping_bag',
  'smartphone',
  'smile',
  'social_distance',
  'sports_soccer',
  'star',
  'store',
  'support_agent',
  'theater_comedy',
  'thumb_up',
  'timer',
  'train',
  'translate',
  'travel_explore',
  'trophy',
  'verified',
  'videocam',
  'visibility',
  'volunteer_activism',
  'warning',
  'watch',
  'wc',
  'wifi',
  'work',
  'workspace_premium',
].sort((a, b) => a.localeCompare(b))

let iconSelectDocBound = false

export function getIconOptions(selected, fallback = 'event') {
  const value = selected || fallback
  return [...new Set([value, ...MATERIAL_ICONS])].sort((a, b) => a.localeCompare(b))
}

function iconOptionButton(icon, selected) {
  const isSelected = icon === selected
  return `
    <li role="option" aria-selected="${isSelected}">
      <button
        type="button"
        data-icon-option="${icon}"
        class="icon-select-option group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low ${isSelected ? 'bg-primary-2/10' : ''}"
      >
        <span class="material-symbols-outlined shrink-0 text-xl text-primary-3">${icon}</span>
        <span class="min-w-0 flex-1 truncate font-medium">${icon}</span>
        <span class="material-symbols-outlined shrink-0 text-lg text-primary-2 ${isSelected ? 'opacity-100' : 'opacity-0'}">check</span>
      </button>
    </li>`
}

/** Custom select (Tailwind UI listbox) — ikon di trigger & tiap opsi */
export function iconSelectField(name, selected, fallback = 'event', label = 'Icon') {
  const value = selected || fallback
  const icons = getIconOptions(value, fallback)
  const options = icons.map((icon) => iconOptionButton(icon, value)).join('')

  return `
    <div class="icon-select-wrap relative mt-1" data-icon-select>
      <label class="text-xs text-on-surface-variant">${label}</label>
      <input type="hidden" name="${name}" value="${value}" data-icon-input />
      <button
        type="button"
        data-icon-trigger
        aria-haspopup="listbox"
        aria-expanded="false"
        class="icon-select-trigger relative mt-1 grid w-full cursor-pointer grid-cols-1 rounded-lg border border-outline-variant bg-white py-2.5 pl-3 pr-10 text-left shadow-sm outline-none hover:border-primary-3/50 focus:border-primary-3 focus:ring-2 focus:ring-primary-3/20"
      >
        <span class="flex min-w-0 items-center gap-2.5">
          <span class="material-symbols-outlined shrink-0 text-2xl text-primary-3" data-icon-trigger-icon>${value}</span>
          <span class="block truncate text-sm font-medium text-on-surface" data-icon-trigger-label>${value}</span>
        </span>
        <span class="material-symbols-outlined pointer-events-none absolute inset-y-0 right-2 my-auto text-xl text-on-surface-variant icon-select-chevron transition-transform">expand_more</span>
      </button>
      <ul
        data-icon-list
        role="listbox"
        class="icon-select-list absolute z-[260] mt-1 hidden max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        ${options}
      </ul>
    </div>`
}

function setIconSelectValue(wrap, icon) {
  const input = wrap.querySelector('[data-icon-input]')
  const triggerIcon = wrap.querySelector('[data-icon-trigger-icon]')
  const triggerLabel = wrap.querySelector('[data-icon-trigger-label]')
  if (input) input.value = icon
  if (triggerIcon) triggerIcon.textContent = icon
  if (triggerLabel) triggerLabel.textContent = icon

  wrap.querySelectorAll('[data-icon-option]').forEach((btn) => {
    const active = btn.dataset.iconOption === icon
    btn.classList.toggle('bg-primary-2/10', active)
    const check = btn.querySelector('.material-symbols-outlined:last-child')
    if (check) check.classList.toggle('opacity-0', !active)
    check?.classList.toggle('opacity-100', active)
    btn.closest('[role="option"]')?.setAttribute('aria-selected', String(active))
  })
}

function closeIconSelect(wrap) {
  if (!wrap) return
  wrap.dataset.open = 'false'
  const trigger = wrap.querySelector('[data-icon-trigger]')
  const list = wrap.querySelector('[data-icon-list]')
  trigger?.setAttribute('aria-expanded', 'false')
  list?.classList.add('hidden')
  wrap.querySelector('.icon-select-chevron')?.classList.remove('rotate-180')
}

function openIconSelect(wrap) {
  document.querySelectorAll('[data-icon-select][data-open="true"]').forEach((other) => {
    if (other !== wrap) closeIconSelect(other)
  })
  wrap.dataset.open = 'true'
  const trigger = wrap.querySelector('[data-icon-trigger]')
  const list = wrap.querySelector('[data-icon-list]')
  trigger?.setAttribute('aria-expanded', 'true')
  list?.classList.remove('hidden')
  wrap.querySelector('.icon-select-chevron')?.classList.add('rotate-180')
  list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}

function bindIconSelectWrap(wrap) {
  if (wrap.dataset.bound) return
  wrap.dataset.bound = '1'

  const trigger = wrap.querySelector('[data-icon-trigger]')
  const list = wrap.querySelector('[data-icon-list]')

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation()
    if (wrap.dataset.open === 'true') closeIconSelect(wrap)
    else openIconSelect(wrap)
  })

  list?.querySelectorAll('[data-icon-option]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      setIconSelectValue(wrap, btn.dataset.iconOption)
      closeIconSelect(wrap)
      wrap.dispatchEvent(new CustomEvent('icon-select-change', { bubbles: true, detail: { value: btn.dataset.iconOption } }))
    })
  })
}

function bindIconSelectDocument() {
  if (iconSelectDocBound) return
  iconSelectDocBound = true

  document.addEventListener('click', () => {
    document.querySelectorAll('[data-icon-select][data-open="true"]').forEach(closeIconSelect)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[data-icon-select][data-open="true"]').forEach(closeIconSelect)
    }
  })
}

export function bindIconSelectPreview(container = document) {
  bindIconSelectDocument()
  container.querySelectorAll('[data-icon-select]').forEach(bindIconSelectWrap)
}
