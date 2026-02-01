import React, { useState } from 'react';
import axios from 'axios';

function RoomDetailModal({ user, room, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isCreator = user?.id === room.creator.id;

    const handleJoin = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/rooms/${room.id}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                onSuccess(); // 목록 갱신 (모달은 유지됨)
            }
        } catch (error) {
            alert(error.response?.data?.message || '승선 신청 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeave = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/rooms/${room.id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                onSuccess(); // 목록 갱신 (모달은 유지됨)
            }
        } catch (error) {
            alert(error.response?.data?.message || '하선 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 이 항해를 취소하시겠습니까? (방이 삭제됩니다)')) return;
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:5000/api/rooms/${room.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert(response.data.message);
                onSuccess();
                onClose(); // 삭제 시에는 닫기
            }
        } catch (error) {
            alert(error.response?.data?.message || '항해 취소 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formattedTime = new Date(room.departure_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 font-sans animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl aspect-[16/10] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Background Image */}
                <img
                    src="/assets/room-pirate-ship.png"
                    alt="Pirate Ship"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* 캐릭터들 배치 (최대 6명) */}
                {(() => {
                    // 각 순서별 캐릭터 위치 및 사이즈 정의
                    const positions = [
                        { left: '27.4%', top: '70%', size: 'w-20', labelSize: 'text-[10px]' }, // 1. 방장 (선장)
                        { left: '42%', top: '77%', size: 'w-20', labelSize: 'text-[10px]' },   // 2. 선원 1 (갑판)
                        { left: '52%', top: '79%', size: 'w-20', labelSize: 'text-[10px]' },   // 3. 선원 2 (갑판)
                        { left: '62%', top: '81%', size: 'w-20', labelSize: 'text-[10px]' },   // 4. 선원 3 (갑판)
                        { left: '72%', top: '82%', size: 'w-20', labelSize: 'text-[10px]' },   // 5. 선원 4 (선실 앞)
                        { left: '82%', top: '52%', size: 'w-16', labelSize: 'text-[9px]' },    // 6. 선원 5 (선실 위)
                    ];

                    const creator = room.participants?.find(p => p.id === room.creator.id);
                    const others = room.participants?.filter(p => p.id !== room.creator.id) || [];
                    const displayPirates = creator ? [creator, ...others] : others;

                    return displayPirates.slice(0, 6).map((pirate, index) => (
                        <div
                            key={pirate.id}
                            style={{
                                left: positions[index].left,
                                top: positions[index].top,
                            }}
                            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5"
                        >
                            {/* 이름표: 상하좌우 완벽하게 중앙 정렬 */}
                            <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/20 mb-1 flex items-center justify-center min-h-[22px]">
                                <span className={`${positions[index].labelSize} font-bold text-white whitespace-nowrap leading-none`}>
                                    {pirate.name}
                                </span>
                            </div>
                            {/* 캐릭터 이미지: 사이즈를 명확하게 고정 */}
                            <div className={`${positions[index].size} flex items-end justify-center`}>
                                <img
                                    src={pirate.equipped_item_image_url || '/assets/Character/basicFoam.png'}
                                    alt={pirate.name}
                                    className="w-full h-auto drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] transition-transform hover:scale-110"
                                />
                            </div>
                        </div>
                    ));
                })()}

                {/* Subtle dark overlay for readability */}
                <div className="absolute inset-0 bg-black/10"></div>

                {/* Main Content Overlay */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">

                    {/* Top-Left: Room Info & Stats */}
                    <div className="flex flex-col gap-4 items-start">
                        {/* Title Card */}
                        <div className="bg-white/90 backdrop-blur-md px-8 py-6 rounded-[2rem] shadow-xl min-w-[320px]">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{room.title}</h2>
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                <span className="material-symbols-rounded text-orange-500 text-xl">location_on</span>
                                <span>{room.restaurant_name}</span>
                            </div>
                        </div>

                        {/* Stats Group */}
                        <div className="flex gap-3">
                            <div className="bg-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/30 shadow-lg min-w-[140px]">
                                <span className="block text-[10px] font-black text-blue-900/60 uppercase tracking-widest mb-1 text-center">Departure</span>
                                <span className="block text-xl font-black text-slate-900 text-center">{formattedTime}</span>
                            </div>
                            <div className="bg-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/30 shadow-lg min-w-[140px]">
                                <span className="block text-[10px] font-black text-blue-900/60 uppercase tracking-widest mb-1 text-center">Pirates</span>
                                <span className="block text-xl font-black text-slate-900 text-center">
                                    <span className="text-blue-600">{room.current_participants}</span> / {room.max_participants}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom-Right: Action Buttons */}
                    <div className="flex justify-end items-end gap-3">
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-slate-700 px-6 py-3.5 rounded-full font-black flex items-center gap-2 border border-white/30 transition-all hover:scale-105 active:scale-95 shadow-lg"
                        >
                            <span className="material-symbols-rounded text-xl">west</span>
                            떠나기
                        </button>

                        {isCreator ? (
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3.5 rounded-full font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30 border border-red-400/30"
                            >
                                <span className="material-symbols-rounded">delete_forever</span>
                                <span>항해 삭제</span>
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            </button>
                        ) : room.is_participant ? (
                            <button
                                onClick={handleLeave}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30 border border-blue-400/30"
                            >
                                <span className="material-symbols-rounded">logout</span>
                                <span>하선하기</span>
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={isSubmitting || room.current_participants >= room.max_participants}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30 border border-blue-400/30 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                            >
                                <span className="material-symbols-rounded">sailing</span>
                                <span>
                                    {room.current_participants >= room.max_participants ? '모집 완료' : '승선하기'}
                                </span>
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoomDetailModal;
