
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  hasUpperCase: /[A-Z]/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

export const validatePassword = (password: string) => {
  return {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength,
    upper: PASSWORD_REQUIREMENTS.hasUpperCase.test(password),
    special: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
  };
};

export const isPasswordValid = (password: string) => {
  const validation = validatePassword(password);
  return validation.length && validation.upper && validation.special;
};
