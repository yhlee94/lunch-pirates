import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateRoomModal from './CreateRoomModal';
import RoomCard from './RoomCard';
import RoomDetailModal from './RoomDetailModal';


function LunchRoomList({ user }) {
    const [rooms, setRooms] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const roomsPerPage = 6;

    // 방 목록 불러오기
    const fetchRooms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/rooms', {
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
            alert('방 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleRoomCreated = () => {
        setShowCreateModal(false);
        fetchRooms();
    };

    // 페이징 관련 계산
    const totalPages = Math.ceil(rooms.length / roomsPerPage) || 1;
    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);

    // 빈 슬롯 생성 (현재 페이지 기준)
    const emptySlots = Math.max(0, roomsPerPage - currentRooms.length);

    return (
        <div className="h-full flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-5xl aspect-[4/3] bg-primary retro-border rounded-retro shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header Area */}
                <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex gap-3">
                        <button
                            className="bg-gradient-to-b from-retro-yellow to-retro-orange text-white px-6 py-3 rounded-retro border-4 border-orange-700 shadow-btn-orange hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 group"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <span className="material-symbols-rounded font-bold">add_circle</span>
                            <span className="text-xl font-bold tracking-wide drop-shadow-md">방 만들기</span>
                        </button>

                        <div className="bg-slate-900/40 backdrop-blur-sm border-2 border-white/30 rounded-retro px-6 py-3 flex items-center gap-4">
                            <span className="material-symbols-rounded text-retro-yellow text-3xl">restaurant</span>
                            <div className="flex flex-col leading-none">
                                <span className="text-white text-xs opacity-80 font-semibold uppercase">현재 방 개수</span>
                                <span className="text-white text-2xl font-bold tracking-wider">{totalCount} / 50</span>
                            </div>
                            <button className="bg-sky-500 p-1 rounded-lg text-white hover:bg-sky-400 transition-colors">
                                <span className="material-symbols-rounded">arrow_drop_down</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="bg-card-blue text-white px-6 py-3 rounded-retro border-4 border-blue-800 shadow-btn-blue hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
                            <span className="material-symbols-rounded">leaderboard</span>
                            <span className="font-bold">맛집 랭킹</span>
                        </button>
                        <button className="bg-card-blue text-white px-6 py-3 rounded-retro border-4 border-blue-800 shadow-btn-blue hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
                            <span className="material-symbols-rounded">person</span>
                            <span className="font-bold">마이룸</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 px-6 pb-6">
                    <div className="h-full bg-blue-500/30 rounded-retro p-4 border-4 border-blue-700/50">
                        <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
                            {loading ? (
                                <div className="col-span-2 row-span-3 flex flex-col items-center justify-center text-white">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                                    <span className="text-xl font-bold">로딩 중...</span>
                                </div>
                            ) : (
                                <>
                                    {currentRooms.map(room => (
                                        <RoomCard
                                            key={room.id}
                                            room={room}
                                            onJoin={() => setSelectedRoom(room)}
                                        />
                                    ))}

                                    {/* Empty Slots */}
                                    {[...Array(emptySlots)].map((_, index) => (
                                        <div key={`empty-${index}`} className="bg-card-blue/50 rounded-retro border-4 border-blue-900/30 border-dashed p-4 flex gap-4 items-center justify-center group hover:bg-card-blue transition-all cursor-pointer">
                                            <span className="text-blue-200 group-hover:text-white font-bold text-xl uppercase tracking-widest opacity-50 group-hover:opacity-100">Empty Slot</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Pagination */}
                <div className="bg-blue-900/40 p-4 flex justify-center items-center gap-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`bg-card-blue text-white p-2 rounded-xl border-4 border-blue-800 shadow-retro transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:brightness-110 active:scale-95 cursor-pointer'
                            }`}
                    >
                        <span className="material-symbols-rounded text-3xl">chevron_left</span>
                    </button>
                    <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentPage === i + 1 ? 'bg-retro-yellow scale-125' : 'bg-white/30'
                                    }`}
                            ></div>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`bg-card-blue text-white p-2 rounded-xl border-4 border-blue-800 shadow-retro transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:brightness-110 active:scale-95 cursor-pointer'
                            }`}
                    >
                        <span className="material-symbols-rounded text-3xl">chevron_right</span>
                    </button>
                </div>



                {/* Server Info (Fixed) */}
                <div
                    className="absolute bottom-6 right-6 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border-2 border-white/20 text-white shadow-2xl z-10">
                    <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">SERVER: running</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">SERVER: running</span>
                    </div>
                </div>

            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <CreateRoomModal
                    user={user}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleRoomCreated}
                />
            )}

            {/* Room Detail Modal */}
            {selectedRoom && (
                <RoomDetailModal
                    user={user}
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                    onSuccess={fetchRooms}
                />
            )}
        </div>
    );
}

export default LunchRoomList;