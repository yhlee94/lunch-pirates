// server/src/utils/email.js
const nodemailer = require('nodemailer');

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// 이메일 인증 링크 발송
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"점심 해적단" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '점심 해적단 이메일 인증',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">환영합니다, 해적님! ⚓</h1>
        <p style="font-size: 16px; color: #666;">
          점심 해적단에 가입해주셔서 감사합니다!<br>
          아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
        </p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                  background-color: #4CAF50; color: white; text-decoration: none; 
                  border-radius: 4px; font-weight: bold;">
          이메일 인증하기
        </a>
        <p style="font-size: 14px; color: #999;">
          링크는 24시간 동안 유효합니다.<br>
          본인이 요청하지 않았다면 이 메일을 무시하세요.
        </p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('인증 이메일 발송 성공:', email);
    } catch (error) {
        console.error('이메일 발송 실패:', error);
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">비밀번호 재설정</h1>
        <p style="font-size: 16px; color: #666;">
          비밀번호 재설정 요청이 접수되었습니다.<br>
          아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
        </p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                  background-color: #2196F3; color: white; text-decoration: none; 
                  border-radius: 4px; font-weight: bold;">
          비밀번호 재설정하기
        </a>
        <p style="font-size: 14px; color: #999;">
          링크는 1시간 동안 유효합니다.<br>
          본인이 요청하지 않았다면 이 메일을 무시하세요.
        </p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('비밀번호 재설정 이메일 발송 성공:', email);
    } catch (error) {
        console.error('이메일 발송 실패:', error);
        throw new Error('이메일 발송에 실패했습니다');
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};