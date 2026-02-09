const nodemailer = require('nodemailer');

/**
 * 구글 앱 비밀번호를 사용하여 이메일을 발송합니다.
 * 포트 465 (SSL)를 사용하면 렌더(Render) 환경에서도 차단 없이 발송 가능합니다.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // 465 포트는 반드시 true여야 합니다.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // 타임아웃 설정 (렌더 환경 최적화)
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// 이메일 인증 링크 발송
const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  console.log('🔗 [이메일 인증 링크]:', verificationUrl);

  const mailOptions = {
    from: `"점심 해적단" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '점심 해적단 이메일 인증',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">🏴‍☠️ 점심 해적단 승선권</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          안녕하세요! 점심 해적단에 합류하신 것을 환영합니다.<br>
          아래 버튼을 눌러 승선 절차(이메일 인증)를 완료해 주세요!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            이메일 인증하고 시작하기
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">본 메일은 점심 해적단 서버에서 발송되었습니다.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 이메일 발송 성공:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ 이메일 발송 에러:', error.message);
    throw new Error('이메일 발송에 실패했습니다');
  }
};

module.exports = {
  sendVerificationEmail
};