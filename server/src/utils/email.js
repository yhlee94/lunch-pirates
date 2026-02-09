const nodemailer = require('nodemailer');

// Gmail SMTP 설정 (IPv4 강제, 연결 안정성 강화)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // 네트워크 연결 안정화 설정
  family: 4, // IPv4 강제 사용
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  debug: true, // 디버깅용 로그 활성화
  logger: true
});

// 이메일 인증 링크 발송
const sendVerificationEmail = async (email, token) => {
  // 이메일 인증은 서버에서 직접 처리하므로 BACKEND_URL을 기반으로 링크를 만듭니다.
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"점심 해적단" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🏴‍☠️ 점심 해적단 승선 확인',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h1 style="color: #2563eb; text-align: center;">환영합니다, 해적님! ⚓</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          점심 해적단에 가입해주셔서 감사합니다.<br>
          안전한 항해를 위해 아래 버튼을 눌러 이메일 인증을 완료해주세요.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; 
                    background-color: #2563eb; color: white; text-decoration: none; 
                    border-radius: 6px; font-weight: bold;">
            이메일 인증하기
          </a>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center;">
          링크는 24시간 동안 유효합니다.<br>
          본인이 요청하지 않았다면 이 메일을 무시하세요.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ 인증 이메일 발송 성공:', email);
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    throw new Error('이메일 발송에 실패했습니다');
  }
};

// 비밀번호 재설정 이메일 발송
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"점심 해적단" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 비밀번호 재설정 요청',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h1 style="color: #333; text-align: center;">비밀번호 재설정</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          비밀번호 재설정 요청이 접수되었습니다.<br>
          아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; 
                    background-color: #2563eb; color: white; text-decoration: none; 
                    border-radius: 6px; font-weight: bold;">
            비밀번호 재설정하기
          </a>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center;">
          링크는 1시간 동안 유효합니다.<br>
          본인이 요청하지 않았다면 이 메일을 무시하세요.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ 비밀번호 재설정 이메일 발송 성공:', email);
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    throw new Error('이메일 발송에 실패했습니다');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};