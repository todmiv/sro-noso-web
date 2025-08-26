export const isValidINN = (inn: string): boolean => {
  // Проверка ИНН (10 или 12 цифр)
  if (!/^\d{10}$|^\d{12}$/.test(inn)) return false;

  // Дополнительная валидация контрольных сумм
  return validateINNChecksum(inn);
};

const validateINNChecksum = (inn: string): boolean => {
  if (inn.length === 10) {
    // Коэффициенты для контрольной суммы 10-значного ИНН
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum = 0;

    // Расчет контрольной суммы
    for (let i = 0; i < 9; i++) {
      sum += parseInt(inn[i]) * weights[i];
    }

    const checkDigit = (sum % 11) % 10;
    return checkDigit === parseInt(inn[9]);
  } else if (inn.length === 12) {
    // Коэффициенты для контрольных сумм 12-значного ИНН
    const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

    // Первая контрольная сумма
    let sum1 = 0;
    for (let i = 0; i < 10; i++) {
      sum1 += parseInt(inn[i]) * weights1[i];
    }
    const checkDigit1 = (sum1 % 11) % 10;

    // Вторая контрольная сумма
    let sum2 = 0;
    for (let i = 0; i < 11; i++) {
      sum2 += parseInt(inn[i]) * weights2[i];
    }
    const checkDigit2 = (sum2 % 11) % 10;

    return checkDigit1 === parseInt(inn[10]) && checkDigit2 === parseInt(inn[11]);
  }

  return false;
};

