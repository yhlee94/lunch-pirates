import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; // Socket.io import
import RoomCard from './RoomCard';
import API_BASE_URL from '../apiConfig';


function LunchRoomList({ user, onNavigateToMyRoom }) {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    // const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [randomImageIndex] = useState(() => Math.floor(Math.random() * 5) + 1);
    const roomsPerPage = 6;

    const scrollRef = useRef(null);

    // 방 목록 불러오기
    const fetchRooms = useCallback(async () => {
        try {
            // 로딩 스피너는 최초 로딩 시에만 혹은 필요 시에만 보여주는게 UX상 좋을 수 있음
            // 실시간 갱신 때는 로딩 없이 조용히 갱신
            // setLoading(true); 
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const updatedRooms = response.data.rooms;
                setRooms(updatedRooms);
                setTotalCount(response.data.total_count);

                // 현재 열려있는 모달의 정보도 최신화
                if (selectedRoom) {
                    const freshRoom = updatedRooms.find(r => r.id === selectedRoom.id);
                    if (freshRoom) {
                        setSelectedRoom(freshRoom);
                    } else {
                        // 방이 사라졌다면 (삭제 등) 모달 닫기
                        setSelectedRoom(null);
                    }
                }
            }
        } catch (error) {
            console.error('방 목록 조회 실패:', error);
        }
    }, [selectedRoom]);

    // 초기 로딩
    useEffect(() => {
        setLoading(true);
        fetchRooms().finally(() => setLoading(false));
    }, []); // 최초 1회만 실행

    // 소켓 연결 및 실시간 갱신
    useEffect(() => {
        const socket = io(API_BASE_URL);

        socket.on('connect', () => {
            console.log('Socket connected for room list updates');
        });

        socket.on('refresh_room_list', () => {
            console.log('🔔 실시간 방 목록 갱신 감지!');
            fetchRooms();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchRooms]);



    // 페이징 관련 계산
    const totalPages = Math.ceil(rooms.length / roomsPerPage) || 1;
    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);

    // 빈 슬롯 생성 (현재 페이지 기준)
    const emptySlots = Math.max(0, roomsPerPage - currentRooms.length);

    return (
        <div className="h-full bg-surface-light text-slate-800 font-sans antialiased selection:bg-primary selection:text-white overflow-y-auto relative custom-scrollbar">
            {/* Background Blobs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[10%] -right-[20%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] bg-accent-green/30 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 max-w-md mx-auto min-h-[700px] h-full flex flex-col px-6 pt-6 pb-8">
                {/* Welcome Card Section */}
                <div className="grid grid-cols-6 grid-rows-2 gap-3 mb-8 h-auto shrink-0">
                    <div className="col-span-6 row-span-2 glass-morphism rounded-[2rem] p-6 relative overflow-hidden shadow-glass group">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full items-start text-left">
                            <div className="max-w-[45%]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary/20">Today's lunch</span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight text-left">
                                    {user ? user.name : '게스트'}님,<br />
                                    <span className="text-primary">맛있는 하루</span><br />되세요!
                                </h1>
                            </div>
                        </div>
                        <div className="absolute -right-2 top-[23%] -translate-y-1/2 w-56 h-56 animate-float z-0">
                            <img alt="3D Food" className="w-full h-full object-contain drop-shadow-2xl opacity-90" src={process.env.PUBLIC_URL + `/assets/RoomList/${randomImageIndex}.png`} style={{ transform: 'scale(1.2)' }} />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3 mb-8 shrink-0">
                    <button
                        onClick={() => navigate('/rankings')}
                        className="glass-morphism rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-2 shadow-sm relative active:scale-95 transition-transform duration-200 hover:bg-white/80"
                    >
                        <span className="material-symbols-rounded text-yellow-500 text-2xl">trophy</span>
                        <span className="text-xs font-bold text-slate-600">맛집 랭킹</span>
                    </button>
                    <button
                        onClick={() => navigate('/gacha')}
                        className="glass-morphism rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform duration-200 hover:bg-white/80"
                    >
                        <span className="material-symbols-rounded text-rose-400 text-2xl">local_activity</span>
                        <span className="text-xs font-bold text-slate-600">티켓</span>
                    </button>
                    <button
                        onClick={() => navigate('/my-room')}
                        className="glass-morphism rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform duration-200 hover:bg-white/80"
                    >
                        <span className="material-symbols-rounded text-primary text-2xl">account_circle</span>
                        <span className="text-xs font-bold text-slate-600">마이룸</span>
                    </button>
                </div>

                {/* Room List Section */}
                <div className="flex-1 flex flex-col min-h-[380px]">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-2xl font-bold text-slate-800 mt-8">출항 대기 해적선</h2>
                        <span
                            onClick={() => navigate('/all-rooms')}
                            className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer"
                        >
                            전체보기
                        </span>
                    </div>

                    <div
                        ref={scrollRef}
                        className="overflow-x-auto hide-scrollbar flex items-center space-x-5 pt-2 pb-12 -mx-6 px-6"
                    >
                        {loading ? (
                            <div className="w-full flex justify-center items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="w-full flex justify-center items-center text-slate-500 font-bold pt-24 pb-10">
                                현재 모집 중인 방이 없습니다.
                            </div>
                        ) : (
                            rooms.map(room => (
                                <div
                                    key={room.id}
                                    className="pointer-events-auto shrink-0 w-[90%] h-auto aspect-[4/3]"
                                    onClick={(e) => {
                                        e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                    }}
                                >
                                    <RoomCard
                                        room={room}
                                        onJoin={() => navigate(`/room/${room.id}`, { state: { room } })}
                                    />
                                </div>
                            ))
                        )}
                        <div className="w-2 shrink-0"></div>
                    </div>
                </div>

                {/* Create Room Button (Bottom) */}
                <div className="mt-4 shrink-0 relative">
                    <button
                        onClick={() => navigate('/create-room')}
                        className="w-full relative group overflow-hidden rounded-[2rem] p-0 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-primary/90 backdrop-blur-xl z-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-bright z-0 opacity-80"></div>
                        <div className="absolute inset-0 border border-white/30 rounded-[2rem] z-20"></div>
                        <div className="absolute -inset-[2px] rounded-[2.1rem] bg-gradient-to-r from-accent-green via-primary to-accent-orange opacity-50 blur-sm z-[-1] animate-pulse"></div>
                        <div className="relative z-10 flex items-center justify-between p-1 pl-8 pr-2 h-20">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-accent-green text-[10px] font-black uppercase tracking-widest mb-1">NEW SHIP</span>
                                <span className="text-white text-xl font-bold tracking-tight">해적선 생성</span>
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-[1.6rem] flex items-center justify-center border border-white/30 shadow-lg group-hover:bg-white/30 transition-colors backdrop-blur-md">
                                <span className="material-symbols-rounded text-white text-4xl group-hover:rotate-90 transition-transform duration-500">add</span>
                            </div>
                        </div>
                        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shine_1.5s_infinite]"></div>
                    </button>
                </div>
            </div>
        </div>
    );

}

export default LunchRoomList;