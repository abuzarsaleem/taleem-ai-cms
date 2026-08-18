import { BusinessException } from '../exceptions';

export function assertPasswordStrength(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new BusinessException(
      'Password must be between 8 and 128 characters',
    );
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new BusinessException(
      'Password must include letters and numbers',
    );
  }
  if (!/[A-Z]/.test(password)) {
    throw new BusinessException(
      'Password must include at least 1 uppercase letter',
    );
  }
  if (!/[0-9]/.test(password)) {
    throw new BusinessException('Password must include at least 1 number');
  }
}
