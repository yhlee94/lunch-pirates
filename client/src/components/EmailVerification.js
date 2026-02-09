// client/src/components/EmailVerification.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

function EmailVerification() {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('이메일 인증 중...');
    const location = useLocation();

    useEffect(() => {
        const verifyEmail = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('유효하지 않은 인증 링크입니다.');
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/auth/verify-email?token=${token}`
                );

                if (response.ok) {
                    setStatus('success');
                    setMessage('이메일 인증이 완료되었습니다! 🎉');

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage('인증에 실패했습니다. 링크가 만료되었거나 유효하지 않습니다.');
                }
            } catch (error) {
                console.error('인증 오류:', error);
                setStatus('error');
                setMessage('서버와 연결할 수 없습니다.');
            }
        };

        verifyEmail();
    }, [location]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                        <h2>{message}</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
                        <h2 style={{ color: '#4CAF50' }}>{message}</h2>
                        <p style={{ color: '#666', marginTop: '10px' }}>
                            잠시 후 로그인 페이지로 이동합니다...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                        <h2 style={{ color: '#f44336' }}>{message}</h2>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            로그인 페이지로 이동
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default EmailVerification;