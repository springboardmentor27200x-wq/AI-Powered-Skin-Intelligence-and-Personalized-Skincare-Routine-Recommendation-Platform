export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTime(timeString) {
  if (!timeString) return '--:--';
  return timeString;
}

export function formatMl(ml) {
  if (ml === undefined || ml === null) return '0 ml';
  return `${Number(ml).toLocaleString()} ml`;
}

export function formatRoleName(role) {
  if (!role) return 'User';
  switch (role) {
    case 'SKINCARE_CONSULTANT':
      return 'Skincare Consultant';
    case 'DERMATOLOGIST':
      return 'Dermatologist';
    case 'ADMINISTRATOR':
      return 'Administrator';
    case 'USER':
    default:
      return 'Standard User';
  }
}
