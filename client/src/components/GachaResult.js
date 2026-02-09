import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from './CustomAlert';

const GachaResult = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [step, setStep] = useState('rolling'); // 'rolling' -> 'burst' -> 'result'
    const [resultData, setResultData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', type: 'info' });

    const showAlert = (message, type = 'info') => {
        setAlertConfig({ isOpen: true, message, type });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    };

    // 몬스터볼(캡슐) 클릭 시 상점 지급 API 호출
    const handleCapsuleClick = async () => {
        if (isLoading || step !== 'rolling') return;

        setIsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tickets/push-button`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setResultData(data);
                setStep('burst');
            } else {
                showAlert(data.message, 'error');
                setTimeout(() => navigate('/gacha'), 2000);
            }
        } catch (error) {
            console.error('푸시 버튼 에러:', error);
            showAlert('아이템 지급 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'Mythic': return '#ef4444'; // Red
            case 'Legend': return '#f59e0b'; // Amber
            case 'Epic': return '#a855f7';  // Purple
            case 'Rare': return '#3b82f6';  // Blue
            default: return '#256af4';      // Primary
        }
    };

    const renderRolling = () => (
        <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
            </div>

            <div
                className="relative z-10 size-64 flex items-center justify-center perspective-[1000px] cursor-pointer group active:scale-95 transition-transform"
                onClick={handleCapsuleClick}
            >
                {/* Rolling Ball Image */}
                <div className="relative size-56 flex items-center justify-center ball-complex-anim">
                    {/* Blue Light Leak Effect */}
                    <div className="absolute inset-0 bg-primary/40 blur-[40px] rounded-full blue-glow-sync pointer-events-none"></div>

                    <img
                        src={process.env.PUBLIC_URL + '/assets/Common/ball.png'}
                        alt="Gacha Ball"
                        className="w-full h-full object-contain drop-shadow-2xl ball-sparkle"
                    />
                </div>

                <div className="absolute -bottom-8 w-32 h-4 bg-black/10 blur-xl rounded-[100%]"></div>
            </div>

            <div className="mt-16 relative z-10 flex flex-col items-center gap-3">
                <p className="text-primary text-5xl font-black tracking-tighter animate-pulse text-center">
                    TAP THE BALL!
                </p>
                <p className="text-white/80 text-sm font-bold text-center">
                    보유하신 캡슐을 사용하여 획득 유닛을 확인하시기 바랍니다.
                </p>
            </div>
        </div>
    );

    const renderBurst = () => (
        <div className="relative flex-1 flex flex-col items-center justify-center w-full bg-black overflow-hidden text-white">
            <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={() => {
                        if (videoRef.current) {
                            videoRef.current.currentTime = 1;
                        }
                    }}
                    onEnded={() => setStep('result')}
                    className="w-full h-full object-cover scale-[1.0]"
                >
                    <source src={process.env.PUBLIC_URL + '/assets/Common/ball.mp4'} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            {/* Watermark Cover Layer */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-black z-50 pointer-events-none"></div>
        </div>
    );

    const renderResult = () => {
        const rarity = resultData?.item.rarity;
        const glowColor = (rarity === 'Common' || !rarity) ? 'transparent' : getRarityColor(rarity);

        return (
            <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-2 pb-32 bg-white text-gray-900">
                <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                    style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 40%)` }}></div>

                <div className="relative z-10 w-full max-w-lg aspect-square flex items-center justify-center p-2 mb-[-60px]">
                    {/* Refined Rarity Glow */}
                    <div
                        className="absolute inset-0 blur-[45px] rounded-full scale-[0.65] animate-pulse"
                        style={{ backgroundColor: `${glowColor}66` }} // 40% opacity
                    ></div>

                    <img
                        src={process.env.PUBLIC_URL + (resultData?.item.image_url || '/assets/Character/basicFoam.png')}
                        alt={resultData?.item.name}
                        className="relative w-80 h-80 object-contain transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-20"
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
                    {/* Rarity & Type Chips (Move to Top) */}
                    <div className="flex flex-wrap justify-center gap-3 mb-1">
                        <span
                            className="px-5 py-2 border rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{
                                backgroundColor: `${getRarityColor(resultData?.item.rarity)}15`,
                                borderColor: `${getRarityColor(resultData?.item.rarity)}40`,
                                color: getRarityColor(resultData?.item.rarity)
                            }}
                        >
                            {resultData?.item.rarity}
                        </span>
                        <span
                            className="px-5 py-2 border rounded-full text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border-gray-200"
                        >
                            {resultData?.item.type}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center px-6 py-2.5 rounded-full border bg-primary/10 border-primary/20 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-base mr-2">auto_awesome</span>
                        <span className="text-primary text-sm font-black tracking-widest uppercase">
                            {resultData?.isNewItem ? '새로운 획득!' : '이미 보유 중인 아이템입니다.'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-gray-900 text-5xl font-black leading-tight uppercase drop-shadow-sm">
                            {resultData?.item.name}
                        </h1>
                    </div>
                </div>

                <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-12">
                    <div className="flex flex-col gap-3 max-w-[400px] mx-auto w-full">
                        <button
                            onClick={() => navigate('/gacha')}
                            className="relative flex items-center justify-center w-full h-14 rounded-full bg-primary hover:bg-blue-600 text-white font-bold transition-all shadow-lg hover:scale-[1.03] active:scale-95 overflow-hidden group"
                        >
                            <span className="material-symbols-outlined mr-2">refresh</span>
                            다시 뽑기
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center w-full h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-all hover:scale-[1.03] active:scale-95"
                        >
                            메인으로
                        </button>
                    </div>
                </footer>
            </main>
        );
    };

    return (
        <div className="bg-black font-['Spline_Sans',_sans-serif] min-h-screen flex flex-col overflow-hidden text-white">
            <style>{`
                @keyframes fadeOutLeft {
                    from { opacity: 1; transform: translate(-50%, -50%) rotate(0deg); }
                    to { opacity: 0; transform: translate(-150%, -80%) rotate(-45deg); }
                }
                @keyframes fadeOutRight {
                    from { opacity: 1; transform: translate(-50%, -50%) rotate(0deg); }
                    to { opacity: 0; transform: translate(50%, -80%) rotate(45deg); }
                }
                @keyframes white-glimmer {
                    0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(255,255,255,0)); }
                    50% { filter: brightness(1.3) drop-shadow(0 0 25px rgba(255,255,255,0.8)); }
                }
                @keyframes ball-sway {
                    from { transform: rotate(-12deg); }
                    to { transform: rotate(12deg); }
                }
                .ball-sparkle {
                    animation: white-glimmer 2s ease-in-out infinite;
                }
                .ball-complex-anim {
                    transform-origin: 50% 90%;
                    animation: ball-sway 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
                    will-change: transform;
                }
                @keyframes blue-light-burst {
                    0%, 100% { opacity: 0; transform: scale(0.6); }
                    20%, 65% { opacity: 0.8; transform: scale(1.6); }
                }
                .blue-glow-sync {
                    animation: blue-light-burst 2s ease-in-out infinite;
                }

            `}</style>

            {step === 'rolling' && renderRolling()}
            {step === 'burst' && renderBurst()}
            {step === 'result' && renderResult()}

            <CustomAlert
                isOpen={alertConfig.isOpen}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
            />
        </div>
    );
};

export default GachaResult;
