import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import API_BASE_URL from '../apiConfig';

const GachaPage = () => {
    const navigate = useNavigate();
    const [ticketCount, setTicketCount] = useState(0);
    const [isCoinInserted, setIsCoinInserted] = useState(false);
    const [isLeverPulled, setIsLeverPulled] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [showCoinAnim, setShowCoinAnim] = useState(false);
    const [showSuccessEffect, setShowSuccessEffect] = useState(false);
    const holdTimerRef = useRef(null);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '', type: 'info' });

    const showAlert = (message, type = 'info') => {
        setAlertConfig({ isOpen: true, message, type });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    };

    // 가챠 상태 및 티켓 수 가져오기
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tickets/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTicketCount(data.status.ticket_count);
                setIsCoinInserted(data.status.is_coin_inserted === 'Y');
                setIsLeverPulled(data.status.is_lever_pulled === 'Y');
            }
        } catch (error) {
            console.error('상태 조회 에러:', error);
        }
    };

    // 1단계: 동전 넣기
    const handleInsertCoin = async () => {
        if (isCoinInserted) {
            showAlert('이미 티켓(코인)을 넣었습니다. 레버를 돌려주세요!', 'info');
            return;
        }
        if (ticketCount <= 0) {
            showAlert('보유한 티켓이 없습니다!', 'error');
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tickets/insert-coin`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setShowCoinAnim(true);
                setTimeout(() => {
                    setIsCoinInserted(true);
                    setTicketCount(prev => prev - 1);
                    setShowCoinAnim(false);
                }, 800);
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('코인 투입 에러:', error);
        }
    };

    // 2단계: 레버 돌리기 완료
    const handleLeverComplete = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/tickets/pull-lever`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setIsLeverPulled(true);
                setShowSuccessEffect(true);
                // 1초 후 효과 제거
                setTimeout(() => setShowSuccessEffect(false), 1000);
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('레버 조작 에러:', error);
        } finally {
            setIsPulling(false);
        }
    };

    // 3단계: 최종 푸시 버튼 (애니메이션 페이지로 이동)
    const handlePushButton = async () => {
        if (!isCoinInserted || !isLeverPulled) {
            showAlert('코인 투입과 레버 조작을 먼저 완료해주세요!', 'info');
            return;
        }
        // 최종 지급은 다음 페이지의 몬스터볼 클릭 시 이루어집니다.
        navigate('/gacha/result');
    };

    const startHold = () => {
        if (!isCoinInserted) {
            showAlert('먼저 티켓(코인)을 넣어주세요!', 'info');
            return;
        }
        if (isLeverPulled) {
            showAlert('이미 레버를 돌렸습니다. 하단의 PUSH 버튼을 눌러주세요!', 'info');
            return;
        }
        setIsPulling(true);
        holdTimerRef.current = setTimeout(() => {
            handleLeverComplete();
        }, 2000);
    };

    const endHold = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (isPulling) {
            setIsPulling(false);
        }
    };

    return (
        <div className="">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&family=Inter:wght@400;500;700&display=swap');
                
                .plastic-shine {
                    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%);
                }
                .pattern-dots {
                    background-image: radial-gradient(#ffffff 1px, transparent 1px);
                    background-size: 10px 10px;
                    opacity: 0.15;
                }
                .digital-display {
                    font-family: 'Courier New', Courier, monospace;
                    text-shadow: 0 0 2px rgba(37, 99, 235, 0.5);
                }
                .lever-container {
                    perspective: 1000px;
                }
                .lever-handle {
                    transform: rotate(0deg);
                    transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                .lever-container.is-pulling .lever-handle {
                    transform: rotate(360deg);
                    transition: transform 2s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                .progress-path {
                    stroke-dasharray: 535;
                    stroke-dashoffset: 535;
                    transition: stroke-dashoffset 2s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.1s;
                }
                .lever-container.is-pulling .progress-path {
                    stroke-dashoffset: 0;
                    opacity: 1;
                }
                .arrow-rotate-group {
                    transform: rotate(0deg);
                    opacity: 0;
                    transition: transform 2s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.1s;
                }
                .lever-container.is-pulling .arrow-rotate-group {
                    transform: rotate(360deg);
                    opacity: 1;
                }
                .knob-face {
                    background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%);
                }
                .dark .knob-face {
                    background: radial-gradient(circle at 30% 30%, #4b5563 0%, #374151 60%, #1f2937 100%);
                }
                @keyframes coin-insert {
                    0% { transform: translateX(40px) scale(1) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateX(0) scale(0.8) rotate(-15deg); opacity: 0; }
                }
                .coin-animation {
                    animation: coin-insert 0.8s ease-in forwards;
                }
                @keyframes dotted-blink {
                    0%, 100% { stroke: #CBD5E1; opacity: 0.4; }
                    50% { stroke: #2563EB; opacity: 1; stroke-width: 3; }
                }
                .lever-dots-blink {
                    animation: dotted-blink 1s infinite;
                }
                @keyframes return-light-blink {
                    0%, 100% { background-color: #1f2937; }
                    50% { background-color: #2563EB; }
                }
                .return-light-active {
                    animation: return-light-blink 1.5s infinite;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translate(-50%, 0%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
                .animate-instruction {
                    animation: fade-in-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes lever-snap {
                    0% { transform: scale(1); }
                    30% { transform: scale(1.15) rotate(5deg); }
                    60% { transform: scale(0.95) rotate(-3deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .lever-success-snap {
                    animation: lever-snap 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes spark-burst {
                    0% { transform: scale(0) translate(0, 0); opacity: 0; }
                    20% { opacity: 1; transform: scale(1.5) translate(0, 0); }
                    100% { transform: scale(0.5) translate(var(--tw-translate-x), var(--tw-translate-y)); opacity: 0; }
                }
                @keyframes central-flash {
                    0% { transform: scale(0); opacity: 0; }
                    20% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes lightning-particle-move {
                    0% { transform: scale(0) translate(0, 0) rotate(var(--bolt-rot)); opacity: 0; }
                    15% { opacity: 1; transform: scale(1.5) translate(0, 0) rotate(var(--bolt-rot)); }
                    100% { transform: scale(0) translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(calc(var(--bolt-rot) + 40deg)); opacity: 0; }
                }
                .lever-flash {
                    position: absolute;
                    inset: -10px;
                    background: radial-gradient(circle, #fff 0%, #fbbf24 30%, transparent 70%);
                    border-radius: 50%;
                    z-index: 45;
                    pointer-events: none;
                    animation: central-flash 0.3s ease-out forwards;
                }
                .lightning-particle {
                    position: absolute;
                    width: 2px;
                    height: 10px;
                    background: #fbbf24;
                    filter: drop-shadow(0 0 4px #fbbf24);
                    z-index: 50;
                    pointer-events: none;
                    transform-origin: center;
                }
                .bolt-1 { --tw-translate-x: -80px; --tw-translate-y: -80px; --bolt-rot: -45deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-2 { --tw-translate-x: 80px; --tw-translate-y: -80px; --bolt-rot: 45deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-3 { --tw-translate-x: -80px; --tw-translate-y: 80px; --bolt-rot: -135deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-4 { --tw-translate-x: 80px; --tw-translate-y: 80px; --bolt-rot: 135deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-5 { --tw-translate-x: 0px; --tw-translate-y: -110px; --bolt-rot: 0deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-6 { --tw-translate-x: 0px; --tw-translate-y: 110px; --bolt-rot: 180deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-7 { --tw-translate-x: -110px; --tw-translate-y: 0px; --bolt-rot: -90deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-8 { --tw-translate-x: 110px; --tw-translate-y: 0px; --bolt-rot: 90deg; animation: lightning-particle-move 0.4s ease-out forwards; }
                .bolt-9 { --tw-translate-x: -50px; --tw-translate-y: -100px; --bolt-rot: -20deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-10 { --tw-translate-x: 50px; --tw-translate-y: -100px; --bolt-rot: 20deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-11 { --tw-translate-x: -50px; --tw-translate-y: 100px; --bolt-rot: -160deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-12 { --tw-translate-x: 50px; --tw-translate-y: 100px; --bolt-rot: 160deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-13 { --tw-translate-x: -100px; --tw-translate-y: -50px; --bolt-rot: -70deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-14 { --tw-translate-x: 100px; --tw-translate-y: -50px; --bolt-rot: 70deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-15 { --tw-translate-x: -100px; --tw-translate-y: 50px; --bolt-rot: -110deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                .bolt-16 { --tw-translate-x: 100px; --tw-translate-y: 50px; --bolt-rot: 110deg; animation: lightning-particle-move 0.45s ease-out forwards; }
                @keyframes flap {
                    0%, 100% { transform: perspective(1000px) rotateX(0deg); }
                    50% { transform: perspective(1000px) rotateX(-15deg); }
                }
                .push-flap {
                    transform-origin: top;
                    animation: flap 0.6s ease-in-out infinite;
                }
            `}</style>

            <div className="bg-[#E5E7EB] dark:bg-[#111827] min-h-screen flex items-center justify-center p-4 font-['Inter',_sans-serif] text-gray-800 dark:text-gray-100 transition-colors duration-300 relative">



                <main className="w-full max-w-[400px] h-[800px] bg-[#f0f4f8] dark:bg-[#1e293b] rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col border-[6px] border-white dark:border-gray-700 ring-1 ring-gray-200 dark:ring-gray-800">
                    <div className="h-[38%] relative overflow-hidden flex flex-col rounded-b-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] z-20 bg-gray-900 border-x-4 border-b-4 border-t-0 border-gray-200 dark:border-gray-600">
                        {/* Glass Glare & Reflection */}
                        <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-b from-transparent via-white/5 to-transparent rotate-45 z-30 pointer-events-none"></div>

                        {/* Inner Bevel/Shadow */}
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-20 pointer-events-none"></div>

                        <img
                            src={process.env.PUBLIC_URL + '/assets/Common/gacha.png'}
                            alt="Gacha Machine Display"
                            className="w-full h-full object-cover object-top"
                        />

                        {/* Instruction Guide Overlay */}
                        {isCoinInserted && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-blue-100 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.3)] flex items-center justify-center min-w-[320px] animate-instruction">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="material-symbols-outlined text-[#2563EB] text-sm animate-pulse">info</span>
                                        <span className="text-[10px] font-black text-[#2563EB]/60 uppercase tracking-[0.2em]">Instruction</span>
                                    </div>
                                    <p className="text-[#2563EB] text-[13px] font-bold text-center leading-relaxed whitespace-pre-line">
                                        {isLeverPulled
                                            ? "준비된 캡슐이 있습니다.\nPUSH를 눌러 보상을 획득하세요."
                                            : "재화가 투입되었습니다.\n레버를 조작하여 뽑기를 진행하십시오."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative flex flex-col p-6 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-gray-800/50">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">남은 코인</span>
                                <div className="bg-gray-800 dark:bg-black rounded border-2 border-gray-600 shadow-inner px-3 py-1.5 flex items-center gap-2 w-fit">
                                    <span className="material-symbols-outlined text-gray-400 text-sm">monetization_on</span>
                                    <span className="digital-display text-[#2563EB] font-bold text-xl leading-none tracking-widest">
                                        {ticketCount.toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Insert</span>
                                    <span className={`text-[9px] font-bold uppercase ${isCoinInserted ? 'text-green-500' : 'text-[#2563EB]'}`}>
                                        {isCoinInserted ? 'DONE' : 'COIN'}
                                    </span>
                                </div>
                                <div className="relative group cursor-pointer" onClick={handleInsertCoin}>
                                    <div className={`w-10 h-14 bg-gray-300 dark:bg-gray-600 rounded border-2 border-gray-400 dark:border-gray-500 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3),0_4px_6px_-2px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center relative overflow-hidden active:scale-95 transition-transform ${isCoinInserted ? 'opacity-50' : ''}`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-400 opacity-50"></div>
                                        <div className="w-1.5 h-8 bg-gray-900 rounded-full shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)] z-10 border border-gray-600"></div>
                                        <div className="absolute top-0 right-0 w-full h-1/2 bg-white/30 skew-y-12"></div>

                                        {/* Coin Animation Object */}
                                        {showCoinAnim && (
                                            <div className="absolute z-50 coin-animation">
                                                <div className="w-10 h-10 bg-[#2563EB] rounded-full border-2 border-blue-400 shadow-lg flex items-center justify-center">
                                                    <div className="w-5 h-5 border border-white/50 rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!isCoinInserted && (
                                        <div className="absolute -bottom-6 w-full text-center">
                                            <span className="material-symbols-outlined text-[#2563EB] text-lg font-black animate-bounce">north</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className={`flex-1 flex flex-col items-center justify-center relative -mt-4 lever-container cursor-pointer select-none ${isPulling ? 'is-pulling' : ''}`}
                            onMouseDown={startHold}
                            onMouseUp={endHold}
                            onMouseLeave={endHold}
                            onTouchStart={startHold}
                            onTouchEnd={endHold}
                        >
                            <div className="absolute w-64 h-64 flex items-center justify-center pointer-events-none z-0">
                                <svg className="w-full h-full" viewBox="0 0 200 200">
                                    <circle
                                        className={`opacity-40 dark:opacity-20 ${isCoinInserted && !isLeverPulled ? 'lever-dots-blink' : ''}`}
                                        cx="100" cy="100" fill="none" r="85" stroke="#CBD5E1" strokeDasharray="2 6" strokeWidth="2"
                                    ></circle>
                                </svg>
                            </div>
                            <div className="absolute w-64 h-64 flex items-center justify-center pointer-events-none z-10">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                                    <defs>
                                        <filter id="glow-blue">
                                            <feGaussianBlur result="coloredBlur" stdDeviation="2.5"></feGaussianBlur>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"></feMergeNode>
                                                <feMergeNode in="SourceGraphic"></feMergeNode>
                                            </feMerge>
                                        </filter>
                                        <linearGradient id="arrowGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }}></stop>
                                            <stop offset="100%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }}></stop>
                                        </linearGradient>
                                    </defs>
                                    <circle className="progress-path opacity-0" cx="100" cy="100" fill="none" r="85" stroke="url(#arrowGradient)" strokeLinecap="round" strokeWidth="6" style={{ filter: 'url(#glow-blue)' }}>
                                    </circle>
                                </svg>
                            </div>
                            <div className="arrow-rotate-group absolute w-64 h-64 pointer-events-none z-10 opacity-0 flex items-center justify-center">
                                <div className="absolute right-[19px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-blue-500 rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                                    </div>
                                </div>
                            </div>
                            <button
                                aria-label="Turn dial"
                                className={`lever-handle relative w-44 h-44 rounded-full bg-white dark:bg-gray-700 shadow-[0_25px_30px_-5px_rgba(0,0,0,0.4),0_10px_10px_-5px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_4px_rgba(0,0,0,0.1)] z-20 flex items-center justify-center border-4 border-gray-100 dark:border-gray-600 focus:outline-none group transform-gpu ${isLeverPulled ? 'lever-success-snap' : ''}`}
                            >
                                <div className={`absolute inset-0 rounded-full knob-face opacity-100 transition-colors duration-500 ${isLeverPulled ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}></div>
                                <div className={`absolute inset-0 rounded-full border border-gray-300 dark:border-gray-500 opacity-50 ${isLeverPulled ? 'border-blue-400' : ''}`}></div>
                                <div className={`w-36 h-12 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-600 dark:to-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-500 relative flex items-center justify-between px-3 z-20 ${isLeverPulled ? 'border-blue-300/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}>
                                    <div className="w-1.5 h-1.5 bg-gray-400/50 rounded-full shadow-inner"></div>
                                    <div className="w-24 h-2 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner flex justify-between items-center px-4 opacity-50">
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-gray-400/50 rounded-full shadow-inner"></div>
                                </div>
                                <div className={`absolute w-14 h-14 bg-gray-50 dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_6px_rgba(0,0,0,0.1)] z-30 flex items-center justify-center transition-all ${isLeverPulled ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}`}>
                                    <div className={`w-5 h-5 rounded-full shadow-inner transition-colors duration-500 ${isLeverPulled ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-gray-200 dark:bg-gray-500'}`}></div>
                                </div>

                                {/* Lightning Particles when pulled */}
                                {showSuccessEffect && (
                                    <>
                                        <div className="lever-flash"></div>
                                        <div className="lightning-particle bolt-1" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-2" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-3" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-4" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-5" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-6" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-7" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-8" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-9" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-10" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-11" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-12" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-13" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-14" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-15" style={{ top: '50%', left: '50%' }}></div>
                                        <div className="lightning-particle bolt-16" style={{ top: '50%', left: '50%' }}></div>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="h-24 w-full mt-auto flex gap-4">
                            <div className="flex-1 relative" onClick={handlePushButton}>
                                <div className={`absolute inset-0 bg-slate-800 dark:bg-slate-900 rounded-t-2xl rounded-b-lg shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)] border-x-2 border-t-2 border-white/30 dark:border-white/10 overflow-hidden group cursor-pointer transition-all ${isLeverPulled ? 'hover:border-blue-400/50' : 'opacity-50'}`}>
                                    <div className="absolute inset-0 bg-black/20 z-0"></div>
                                    <div className={`absolute inset-x-3 bottom-0 top-3 bg-gradient-to-b from-blue-900/60 to-slate-900 backdrop-blur-md rounded-t-xl border-t border-white/20 flex flex-col items-center justify-center transition-all duration-300 z-10 shadow-lg ${isLeverPulled ? 'push-flap' : ''}`}>
                                        <span className={`font-['Poppins',_sans-serif] font-black text-3xl tracking-[0.3em] select-none transition-colors ${isLeverPulled ? 'text-blue-400/80' : 'text-white/10'}`}>PUSH</span>
                                        {isLeverPulled && <div className="w-8 h-1 bg-blue-400/50 rounded-full mt-2 animate-pulse"></div>}
                                    </div>
                                </div>
                            </div>
                            <div className="w-16 h-20 self-end bg-gray-200 dark:bg-gray-700 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border border-gray-300 dark:border-gray-600 flex flex-col items-center justify-end p-2 relative">
                                <div className={`absolute top-2 w-8 h-8 rounded-full shadow-inner border-b border-white/20 transition-colors duration-500 ${isLeverPulled ? 'return-light-active' : 'bg-gray-800'}`}></div>
                                <span className="text-[8px] font-bold text-gray-400 mt-auto uppercase tracking-tighter">STATUS</span>
                            </div>
                        </div>

                        <div className="mt-4 px-2 flex justify-between items-end">
                            <div className="text-[8px] text-gray-400 leading-tight w-2/3">
                                Use approved tokens only. <br />
                                Bandai Namco Amusement Inc.
                            </div>
                            <div className="text-[9px] font-mono text-gray-300">
                                V2.1-BLUE
                            </div>
                        </div>
                    </div>
                </main>


                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#1e293b] text-white rounded-full p-2 shadow-2xl flex items-center justify-around z-50 backdrop-blur-lg bg-opacity-90 border border-slate-700 max-w-[400px]">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">home</span>
                    </button>
                    <button
                        onClick={() => navigate('/rankings')}
                        className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">emoji_events</span>
                    </button>
                    <button className="p-3 rounded-full text-primary bg-white/10 relative">
                        <span className="material-symbols-outlined text-[24px] text-[#2b8cee] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>local_activity</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-800"></span>
                    </button>
                    <button
                        onClick={() => navigate('/my-room')}
                        className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">face</span>
                    </button>
                </nav>

                <CustomAlert
                    isOpen={alertConfig.isOpen}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={closeAlert}
                />
            </div>
        </div>
    );
};

export default GachaPage;
