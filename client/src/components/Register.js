// client/src/components/Register.js
import React, { useState, useEffect } from 'react';
import CompanySearchModal from './CompanySearchModal';

function Register({ onRegisterSuccess, onBackToLogin }) {
    const [formData, setFormData] = useState({
        companyName: '',
        companyAddress: '',
        companyLatitude: '',
        companyLongitude: '',
        email: '',
        password: '',
        passwordConfirm: '',
        name: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // 회사 선택 핸들러
    const handleSelectCompany = (company) => {
        setFormData({
            ...formData,
            companyName: company.place_name,
            companyAddress: company.address_name || company.road_address_name,
            companyLatitude: company.y,
            companyLongitude: company.x
        });
    };

    // 카카오 지도 표시
    useEffect(() => {
        if (formData.companyLatitude && formData.companyLongitude) {
            const container = document.getElementById('company-map');

            if (container && window.kakao && window.kakao.maps) {
                const options = {
                    center: new window.kakao.maps.LatLng(
                        formData.companyLatitude,
                        formData.companyLongitude
                    ),
                    level: 3
                };

                const map = new window.kakao.maps.Map(container, options);

                // 마커 표시
                const markerPosition = new window.kakao.maps.LatLng(
                    formData.companyLatitude,
                    formData.companyLongitude
                );
                const marker = new window.kakao.maps.Marker({
                    position: markerPosition
                });
                marker.setMap(map);
            }
        }
    }, [formData.companyLatitude, formData.companyLongitude]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
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

        // 비밀번호 자리 검증
        if (formData.password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            setLoading(false);
            return;
        }

        // 특수문자 포함 여부 확인
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharPattern.test(formData.password)) {
            setError('비밀번호에 특수문자를 포함해주세요.');
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
                    companyAddress: formData.companyAddress,
                    companyLatitude: formData.companyLatitude,
                    companyLongitude: formData.companyLongitude,
                    email: formData.email,
                    password: formData.password,
                    name: formData.name
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(
                    `회원가입 성공! 🎉\n\n` +
                    `인증 메일이 발송되었습니다.\n` +
                    `📧 ${formData.email}\n\n` +
                    `메일함을 확인해주세요.`
                );
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
        <div className="bg-white min-h-screen flex items-center justify-center p-4 font-sans text-slate-800 transition-colors duration-300">
            {/* 회사 검색 모달 */}
            {showModal && (
                <CompanySearchModal
                    onSelectCompany={handleSelectCompany}
                    onClose={() => setShowModal(false)}
                />
            )}

            <main className="w-full max-w-md mx-auto relative z-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative w-full h-64 mb-6">
                        <img
                            alt="Register Mascot"
                            className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white z-10 relative"
                            src="/assets/Common/register.png"
                        />

                    </div>
                    <h1 className="text-3xl font-black text-center text-primary mb-1 tracking-tight">
                        점심 해적단 가입
                    </h1>
                    <p className="text-slate-500 text-center text-sm font-medium">
                        새로운 해적이 되어보세요!
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-slate-100">
                    {successMessage ? (
                        <div className="success-message whitespace-pre-line text-center text-blue-600 font-medium leading-relaxed">
                            {successMessage}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* 회사 검색 및 지도 */}
                            <div className="flex gap-3">
                                <div className="relative flex-grow">
                                    <input
                                        className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder-gray-400 shadow-sm cursor-pointer"
                                        placeholder="회사를 검색해주세요"
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        readOnly
                                        onClick={() => setShowModal(true)}
                                    />
                                </div>
                                <button
                                    className="flex-none bg-primary hover:bg-opacity-90 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1 min-w-[80px]"
                                    type="button"
                                    onClick={() => setShowModal(true)}
                                >
                                    <span className="material-icons-round text-sm">search</span>
                                    검색
                                </button>
                            </div>

                            {formData.companyLatitude && formData.companyLongitude && (
                                <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-200 mb-4 shadow-sm relative">
                                    <div id="company-map" className="w-full h-full"></div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 text-xs font-medium text-slate-600 border-t border-slate-100">
                                        📍 {formData.companyAddress}
                                    </div>
                                </div>
                            )}

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-icons-round text-lg">mail</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="회사 이메일 (예: pirate@kakao.com)"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-icons-round text-lg">badge</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="실명 (예: 홍길동)"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    maxLength="50"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-icons-round text-lg">lock</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="비밀번호 (특수문자 포함 6자 이상)"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-icons-round text-lg">lock_reset</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="비밀번호 확인"
                                    type="password"
                                    name="passwordConfirm"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-400 pl-4 mt-1 flex items-center gap-1">
                                <span className="material-icons-round text-xs">security</span>
                                비밀번호는 암호화되어 안전하게 저장됩니다.
                            </p>

                            {error && (
                                <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    className="w-full bg-primary hover:bg-opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 transform transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md text-lg flex items-center justify-center gap-2"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? '가입 중...' : '회원가입 완료'}
                                    <span className="material-icons-round">arrow_forward</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <a
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors duration-200 font-medium text-sm cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            onBackToLogin();
                        }}
                    >
                        <span className="material-icons-round text-base">arrow_back</span>
                        로그인으로 돌아가기
                    </a>
                </div>
            </main>
        </div>
    );
}

export default Register;