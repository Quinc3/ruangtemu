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

export function getIconOptions(selected, fallback = 'event') {
  const value = selected || fallback
  const icons = [...new Set([value, ...MATERIAL_ICONS])].sort((a, b) => a.localeCompare(b))
  return icons
}

export function iconSelectField(name, selected, fallback = 'event', label = 'Icon') {
  const value = selected || fallback
  const icons = getIconOptions(value, fallback)

  const options = icons
    .map(
      (icon) =>
        `<option value="${icon}" ${value === icon ? 'selected' : ''}>${icon}</option>`
    )
    .join('')

  return `
    <div class="icon-select-wrap">
      <label class="text-xs text-on-surface-variant">${label}</label>
      <select name="${name}" class="icon-select mt-1 w-full max-h-40 border border-outline-variant rounded-lg py-2 px-2 text-sm bg-white outline-none focus:border-tertiary">
        ${options}
      </select>
      <div class="mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
        <span class="material-symbols-outlined text-2xl text-tertiary icon-preview">${value}</span>
        <span class="text-xs text-on-surface-variant icon-preview-label">${value}</span>
      </div>
    </div>`
}

export function bindIconSelectPreview(container = document) {
  const select = container.querySelector('.icon-select')
  const preview = container.querySelector('.icon-preview')
  const label = container.querySelector('.icon-preview-label')
  if (!select || !preview) return

  const update = () => {
    preview.textContent = select.value
    if (label) label.textContent = select.value
  }
  select.removeEventListener('change', select._iconPreviewHandler)
  select._iconPreviewHandler = update
  select.addEventListener('change', update)
}
