export const isValidINN = (inn: string): boolean => {
  // Проверка длины ИНН
  if (!/^\d{10}$/.test(inn)) return false;

  // Коэффициенты для контрольной суммы
  const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  let sum = 0;

  // Расчет контрольной суммы
  for (let i = 0; i < 9; i++) {
    sum += parseInt(inn[i]) * weights[i];
  }

  const checkDigit = (sum % 11) % 10;
  return checkDigit === parseInt(inn[9]);
};
