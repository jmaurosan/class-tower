export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

export const validatePassword = (password: string) => {
  return {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength,
    upper: PASSWORD_REQUIREMENTS.hasUpperCase.test(password),
    number: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    special: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
  };
};

export const isPasswordValid = (password: string) => {
  const validation = validatePassword(password);
  return validation.length && validation.upper && validation.number && validation.special;
};
