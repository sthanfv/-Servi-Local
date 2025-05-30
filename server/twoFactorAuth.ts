
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { storage } from './storage';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export const generate2FASecret = async (userId: string, email: string): Promise<TwoFactorSetup> => {
  const secret = speakeasy.generateSecret({
    name: `ServiLocal (${email})`,
    issuer: 'ServiLocal',
  });

  // Generar códigos de respaldo
  const backupCodes = Array.from({ length: 8 }, () => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  // Generar QR Code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Guardar temporalmente (no activar hasta verificación)
  await storage.saveTempTwoFactorSecret(userId, {
    secret: secret.base32,
    backupCodes,
    isActive: false,
  });

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
};

export const verify2FAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Permite ±2 periodos de tiempo
  });
};

export const enable2FA = async (userId: string, token: string): Promise<boolean> => {
  const tempData = await storage.getTempTwoFactorSecret(userId);
  if (!tempData) return false;

  const isValid = verify2FAToken(tempData.secret, token);
  if (!isValid) return false;

  // Activar 2FA permanentemente
  await storage.activateTwoFactor(userId, tempData);
  await storage.deleteTempTwoFactorSecret(userId);

  return true;
};

export const validate2FALogin = async (userId: string, token: string): Promise<boolean> => {
  const user2FA = await storage.getUserTwoFactor(userId);
  if (!user2FA?.isActive) return true; // No tiene 2FA activado

  // Verificar token TOTP
  if (verify2FAToken(user2FA.secret, token)) {
    return true;
  }

  // Verificar códigos de respaldo
  if (user2FA.backupCodes.includes(token.toUpperCase())) {
    // Remover código usado
    await storage.removeUsedBackupCode(userId, token.toUpperCase());
    return true;
  }

  return false;
};

export const disable2FA = async (userId: string, password: string): Promise<boolean> => {
  const user = await storage.getUser(userId);
  if (!user) return false;

  const { comparePassword } = await import('./auth');
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) return false;

  await storage.deactivateTwoFactor(userId);
  return true;
};
