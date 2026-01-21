// client/src/components/Register.js
import React, { useState } from 'react';
import CompanySearchModal from './CompanySearchModal';
import '../styles/Register.css';

function Register({ onRegisterSuccess, onBackToLogin }) {
    const [formData, setFormData] = useState({
        companyName: '',
        companyAddress: '',
        companyLatitude: '',
        companyLongitude: '',
        email: '',
        password: '',
        passwordConfirm: '',
        nickname: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 회사 선택 핸들러 (추가!)
    const handleSelectCompany = (company) => {
        setFormData({
            ...formData,
            companyName: company.place_name,
            companyAddress: company.address_name || company.road_address_name,
            companyLatitude: company.y,
            companyLongitude: company.x
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // 회사명 선택 확인
        if (!formData.companyName) {
            setError('회사를 검색하여 선택해주세요');
            setLoading(false);
            return;
        }

        // 비밀번호 확인 검증
        if (formData.password !== formData.passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        if (formData.password.length < 4) {
            setError('비밀번호는 4자 이상이어야 합니다.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyName: formData.companyName,
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('회원가입 성공! 이메일을 확인해주세요 📧');
                setTimeout(() => {
                    onBackToLogin();
                }, 3000);
            } else {
                setError(data.message || '회원가입에 실패했습니다.');
            }
        } catch (err) {
            console.error('회원가입 오류:', err);
            setError('서버와 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            {/* 회사 검색 모달 (추가!) */}
            {showModal && (
                <CompanySearchModal
                    onSelectCompany={handleSelectCompany}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="register-card">
                <div className="logo-section">
                    <div className="logo">🏴‍☠️</div>
                    <h1 className="app-title">점심 해적단 가입</h1>
                    <p className="subtitle">새로운 해적이 되어보세요!</p>
                </div>

                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                {!successMessage && (
                    <form onSubmit={handleSubmit} className="register-form">
                        {/* 회사 검색 필드 (수정!) */}
                        <div className="company-field">
                            <input
                                type="text"
                                name="companyName"
                                placeholder="회사를 검색해주세요"
                                value={formData.companyName}
                                className="input-field"
                                readOnly
                                required
                            />
                            <button
                                type="button"
                                className="search-company-button"
                                onClick={() => setShowModal(true)}
                            >
                                🔍 검색
                            </button>
                        </div>

                        {formData.companyAddress && (
                            <div className="company-info">
                                📍 {formData.companyAddress}
                            </div>
                        )}

                        <input
                            type="email"
                            name="email"
                            placeholder="회사 이메일 (예: pirate@kakao.com)"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        <input
                            type="text"
                            name="nickname"
                            placeholder="닉네임 (예: 해적왕)"
                            value={formData.nickname}
                            onChange={handleChange}
                            className="input-field"
                            maxLength="50"
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="비밀번호 (4자 이상)"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        <input
                            type="password"
                            name="passwordConfirm"
                            placeholder="비밀번호 확인"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="register-button"
                            disabled={loading}
                        >
                            {loading ? '가입 중...' : '회원가입'}
                        </button>
                    </form>
                )}

                <div className="footer-links">
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onBackToLogin();
                    }}>
                        ← 로그인으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Register;