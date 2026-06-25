export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) {
    return '07**********';
  }

  const visible = digits.slice(0, 2);
  const hiddenCount = Math.max(10, digits.length - 2);
  return `${visible}${'*'.repeat(hiddenCount)}`;
}
