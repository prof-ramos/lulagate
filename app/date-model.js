// Preserve the precision supplied by the source; never supply a missing day.
export function formatDate(value) {
  if (!value) return 'não informada';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('pt-BR', {timeZone:'UTC', day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date(`${value}T00:00:00Z`));
  }
  if (/^\d{4}-\d{2}$/.test(value)) return `${value.slice(5)}/${value.slice(0,4)}`;
  return value;
}
