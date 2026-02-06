
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

function RoomLobby({ user }) {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [room, setRoom] = useState(location.state?.room || null);
    const [loading, setLoading] = useState(!room);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRoomData = async (silent = false) => {
        try {
            if (!silent && !room) setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const foundRoom = response.data.rooms.find(r => r.id === parseInt(roomId) || r.id === roomId);
                if (foundRoom) {
                    setRoom(foundRoom);
                } else {
                    alert('방을 찾을 수 없습니다.');
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('Failed to fetch room:', error);
            alert('방 정보를 불러오는데 실패했습니다.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch if room data is missing or to ensure freshness
    useEffect(() => {
        if (!room) {
            fetchRoomData();
        }
    }, [roomId, navigate]); // Removed 'room' dependency to prevent infinite loops if we fetch inside

    const handleJoin = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/rooms/${room.id}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                await fetchRoomData(true); // Re-fetch data silently to show updated participants and status
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error joining room');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeave = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/api/rooms/${room.id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                // Just refresh data to show 'Join' button again, stay in lobby
                await fetchRoomData(true);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error leaving room');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Really cancel this voyage?')) return;
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_BASE_URL}/api/rooms/${room.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                navigate('/');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting room');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lobby-primary"></div>
            </div>
        );
    }

    const isCreator = user?.id === room.creator?.id; // Check creator
    const isParticipant = room.is_participant; // Check if joined

    // Formatting
    const formattedTime = new Date(room.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center min-h-screen p-0 sm:p-4 font-nunito transition-colors duration-300">
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                }
                .dark .glass-card {
                    background: rgba(230, 240, 255, 0.85);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                .moon-glow {
                    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 60%, transparent 100%);
                }
                .dot-pattern {
                    background-image: radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px);
                    background-size: 6px 6px;
                }
                .wave-shape-1 {
                    border-radius: 45% 55% 25% 75% / 55% 45% 55% 45%;
                }
                .wave-shape-2 {
                    border-radius: 65% 35% 35% 65% / 45% 55% 45% 55%;
                }
                @keyframes sway {
                    0%, 100% { transform: rotate(-1deg) translateX(-5px); }
                    50% { transform: rotate(1deg) translateX(5px); }
                }

                @keyframes wave-move {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(-15%); }
                    100% { transform: translateX(0); }
                }
                .wave-bg {
                    background: url("${process.env.PUBLIC_URL}/assets/Common/wave.png");
                    background-position: 0 bottom;
                    background-repeat: repeat-x;
                    background-size: 50% 100%;
                }
                .cloud-anim {
                    animation: float 8s ease-in-out infinite;
                }
                body {
                    min-height: max(884px, 100dvh);
                }
            `}</style>

            <div className="relative w-full max-w-[400px] h-screen sm:h-[850px] overflow-hidden bg-gradient-to-b from-sky-top to-sky-bottom dark:from-sky-top-dark dark:to-sky-bottom-dark sm:rounded-[3rem] shadow-2xl transition-colors duration-500">
                {/* Background Decor */}
                <div className="absolute top-[8%] -right-[10%] w-64 h-64 rounded-full bg-white/20 blur-2xl dark:bg-white/10"></div>
                <div className="absolute top-[10%] -right-[5%] w-48 h-48 rounded-full bg-white/30 blur-xl dark:bg-white/15"></div>
                <div className="absolute top-[12%] right-[2%] w-32 h-32 rounded-full bg-[#D4E8F4] dark:bg-[#A4C8D4] shadow-lobby-glow opacity-90"></div>
                <div className="absolute top-[30%] -left-[10%] w-64 h-24 bg-white/10 blur-xl rounded-full transform -rotate-6 cloud-anim"></div>
                <div className="absolute top-[35%] right-[10%] w-48 h-20 bg-white/10 blur-xl rounded-full cloud-anim" style={{ animationDelay: '2s' }}></div>

                {/* Giant Ship Image (Absolute Positioned Center) */}
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-[40%] w-[180%] h-[70%] z-20 pointer-events-none flex items-center justify-center">
                    <div className="relative w-full h-full animate-[sway_6s_ease-in-out_infinite]">
                        <img
                            src={process.env.PUBLIC_URL + "/assets/Common/ship.png"}
                            alt="Pirate Ship"
                            className="w-full h-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)]"
                        />

                        {/* Avatars on Deck */}
                        {(() => {
                            // Positions adapted for the ship image
                            // Index 0 is Captain (Creator) - Center Top
                            const positions = [
                                { left: '50%', top: '20%', labelSize: 'text-[10px]' }, // 1. Captain (Steering Wheel)
                                { left: '41%', top: '44%', labelSize: 'text-[10px]' }, // 2. Left Mid
                                { left: '59%', top: '45%', labelSize: 'text-[10px]' }, // 3. Right Mid
                                { left: '40%', top: '63%', labelSize: 'text-[10px]' }, // 4. Left Bot
                                { left: '50%', top: '65%', labelSize: 'text-[10px]' }, // 5. Center Bot
                                { left: '60%', top: '64%', labelSize: 'text-[10px]' }, // 6. Right Bot
                            ];

                            // Using user's logic to sort: Creator first
                            const creatorId = room.creator?.id || room.creator; // Handle if creator is object or ID
                            const creator = room.participants?.find(p => p.id === creatorId || p.id === room.creator?.id);
                            const others = room.participants?.filter(p => p.id !== creatorId && p.id !== room.creator?.id) || [];

                            // Only show actual participants
                            const displayPirates = creator ? [creator, ...others] : others;

                            return displayPirates.slice(0, 6).map((pirate, index) => {
                                const pos = positions[index] || positions[0];
                                return (
                                    <div
                                        key={pirate.id}
                                        style={{ left: pos.left, top: pos.top }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                                    >
                                        {/* Name Label */}
                                        <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20 mb-[-5px] z-20 flex items-center justify-center whitespace-nowrap">
                                            <span className={`${pos.labelSize} font-bold text-white leading-none`}>
                                                {pirate.name}
                                            </span>
                                        </div>
                                        {/* Avatar Image (No Circle) */}
                                        <div className="w-24 aspect-square flex items-center justify-center filter drop-shadow-lg transition-transform hover:scale-110">
                                            <img
                                                src={pirate.equipped_item_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pirate.id}`}
                                                alt={pirate.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Bottom Moving Waves (Behind Buttons) */}
                <div className="absolute bottom-[10px] left-0 w-[200%] h-32 z-10 pointer-events-none">
                    <div className="absolute bottom-0 w-full h-full wave-bg animate-[wave-move_8s_ease-in-out_infinite] opacity-100 translate-y-4 hue-rotate-15"></div>
                    <div className="absolute bottom-0 w-full h-[80%] wave-bg animate-[wave-move_6s_ease-in-out_infinite_reverse] opacity-90 translate-x-[-100px] translate-y-2" style={{ backgroundSize: '70% 100%' }}></div>
                </div>

                {/* Bottom Gradient Overlay for readability */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-sky-bottom/40 via-sky-bottom/10 to-transparent z-10 pointer-events-none"></div>

                <div className="relative z-30 flex flex-col h-full px-5 py-6 pt-12">
                    <div className="glass-card w-full rounded-[2rem] p-5 shadow-soft mb-4 flex justify-between items-center transition-all duration-300">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-900 tracking-tight line-clamp-1">{room.title}</h1>
                            <div className="flex items-center mt-1 space-x-1">
                                <span className="material-symbols-rounded text-[#2563EB] text-lg">location_on</span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-600">{room.restaurant_name}</span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-[#2563EB]/10 rounded-full flex items-center justify-center border-2 border-[#2563EB]/20">
                                <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-rounded text-white text-xs font-bold">check</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                        <div className="glass-card rounded-[1.5rem] p-4 flex flex-col items-center justify-center shadow-sm transition-all duration-300 min-h-[5.5rem]">
                            <span className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">출발시간</span>
                            <span className="text-lg font-extrabold text-slate-700 dark:text-slate-800">{formattedTime}</span>
                        </div>
                        <div className="glass-card rounded-[1.5rem] p-4 flex flex-col items-center justify-center shadow-sm transition-all duration-300 min-h-[5.5rem]">
                            <span className="text-[0.65rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">탑승인원</span>
                            <div className="text-lg font-bold">
                                <span className="text-blue-600 dark:text-blue-700">{room.current_participants}</span>
                                <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                                <span className="text-slate-700 dark:text-slate-800">{room.max_participants}</span>
                            </div>
                        </div>
                    </div>

                    {/* Spacer to push content up if needed or just let flex handle it */}
                    <div className="flex-1"></div>

                    <div className="mt-auto grid grid-cols-2 gap-4 pb-6 relative z-50">
                        {/* Left Button: Always 'Leave View' (Back) */}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-200 hover:bg-white dark:hover:bg-slate-100 text-slate-700 dark:text-slate-800 font-bold py-4 rounded-2xl shadow-lg transition-colors duration-200 group border-b-4 border-slate-300 active:border-b-0 active:translate-y-1"
                        >
                            <span className="material-symbols-rounded text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            <span>돌아가기</span>
                        </button>

                        {/* Right Button: Action (Join/Leave/Cancel) */}
                        {isCreator ? (
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="flex items-center justify-center space-x-2 bg-lobby-primary hover:bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-colors duration-200 border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                            >
                                <span className="material-symbols-rounded text-lg bg-white/20 rounded-md p-0.5">delete_forever</span>
                                <span>항해 삭제</span>
                            </button>
                        ) : isParticipant ? (
                            <button
                                onClick={handleLeave}
                                disabled={isSubmitting}
                                className="flex items-center justify-center space-x-2 bg-lobby-primary hover:bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-colors duration-200 border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                            >
                                <span className="material-symbols-rounded text-lg bg-white/20 rounded-md p-0.5">logout</span>
                                <span>하선하기</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={isSubmitting || room.current_participants >= room.max_participants}
                                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-colors duration-200 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                            >
                                <span className="material-symbols-rounded text-lg bg-white/20 rounded-md p-0.5">sailing</span>
                                <span>탑승하기</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoomLobby;
