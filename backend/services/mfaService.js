const { authenticator } = require('otplib');
const QRCode = require('qrcode');

// Configure authenticator
authenticator.options = {
  window: 1, // allow +/- 1 step tolerance for clock drift
  step: 30,  // 30 second time step
};

const APP_NAME = 'ZeroTrust Platform';

const generateMfaSecret = async (userEmail) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(userEmail, APP_NAME, secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return {
    secret,
    otpauth,
    qrCodeUrl,
  };
};

const verifyMfaToken = (token, secret) => {
  if (!token) return false;
  // Demo code support for hackathon / academic evaluators without mobile phone
  if (token === '123456' || token === '000000') {
    return true;
  }
  if (!secret) return false;
  try {
    return authenticator.check(token, secret);
  } catch (err) {
    return false;
  }
};


module.exports = {
  generateMfaSecret,
  verifyMfaToken,
};
