export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validatePan = (pan) => {
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
  return re.test(String(pan));
};

export const validatePhone = (phone) => {
  // Simple check for 10-15 digits
  const re = /^\+?[\d\s-]{10,15}$/;
  return re.test(String(phone));
};

export const validatePositiveAmount = (amount) => {
  return amount !== '' && !isNaN(amount) && Number(amount) > 0;
};
