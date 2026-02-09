import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [clicked, setClicked] = useState(false);
    const [stars, setStars] = useState([]);

    useEffect(() => {
        const updatePosition = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseDown = (e) => {
            setClicked(true);
            createStars(e.clientX, e.clientY);
        };
        const handleMouseUp = () => setClicked(false);

        window.addEventListener('mousemove', updatePosition);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // 기본 커서 숨기기
        document.body.style.cursor = 'none';

        // CSS 애니메이션 및 커서 스타일 주입
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                cursor: none !important;
            }
            @keyframes star-burst {
                0% { 
                    transform: translate(-50%, -50%) scale(0.5); 
                    opacity: 1; 
                }
                100% { 
                    transform: translate(var(--tx), var(--ty)) scale(0); 
                    opacity: 0; 
                }
            }
        `;
        document.head.appendChild(style);

        return () => {
            window.removeEventListener('mousemove', updatePosition);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'auto';
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const createStars = (x, y) => {
        const newStars = [];
        const count = 4 + Math.floor(Math.random() * 2); // 4~5 stars

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 30; // 퍼지는 거리
            const tx = Math.cos(angle) * distance + 'px';
            const ty = Math.sin(angle) * distance + 'px';

            newStars.push({
                id: Date.now() + i + Math.random(),
                x,
                y,
                tx,
                ty,
                color: ['#FFD700', '#FFA500', '#FFFACD'][Math.floor(Math.random() * 3)], // Gold, Orange, Lemon
                size: 16 + Math.random() * 10 + 'px'
            });
        }

        setStars(prev => [...prev, ...newStars]);

        // 애니메이션 후 제거 (600ms)
        setTimeout(() => {
            setStars(prev => prev.filter(star => !newStars.includes(star)));
        }, 600);
    };

    return (
        <>
            {/* 별 이펙트 */}
            {stars.map(star => (
                <div
                    key={star.id}
                    style={{
                        position: 'fixed',
                        top: star.y,
                        left: star.x,
                        color: star.color,
                        fontSize: star.size,
                        pointerEvents: 'none',
                        zIndex: 9998,
                        '--tx': star.tx,
                        '--ty': star.ty,
                        animation: 'star-burst 0.5s ease-out forwards',
                        textShadow: '0 0 5px rgba(255,255,0,0.5)',
                        userSelect: 'none'
                    }}
                >
                    ★
                </div>
            ))}

            {/* 커서 */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    width: '32px',
                    height: 'auto',
                    transition: 'transform 0.05s linear', // 반응속도 개선
                    willChange: 'transform'
                }}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/assets/Common/cursor1.png`}
                    alt="cursor"
                    style={{
                        width: '100%',
                        height: 'auto',
                        transform: clicked ? 'scale(0.8) rotate(-15deg)' : 'scale(1)',
                        transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', // 튕기는 효과
                        filter: 'drop-shadow(1px 0 0 black) drop-shadow(-1px 0 0 black) drop-shadow(0 1px 0 black) drop-shadow(0 -1px 0 black) drop-shadow(2px 2px 2px rgba(0,0,0,0.3))'
                    }}
                />
            </div>
        </>
    );
};

export default CustomCursor;
