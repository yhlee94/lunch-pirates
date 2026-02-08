import React, { useState, useEffect } from 'react'; // Removed unused imports
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoomCard from './RoomCard';
import API_BASE_URL from '../apiConfig';

function AllRoomList() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const token = sessionStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setRooms(response.data.rooms);
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    return (
        <div className="h-screen bg-surface-light text-slate-800 font-sans antialiased selection:bg-primary selection:text-white overflow-y-auto relative custom-scrollbar">
            {/* Background Blobs (Same as Main) */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[10%] -right-[20%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] bg-accent-green/30 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-6 pt-8 pb-8">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <span className="material-symbols-rounded text-slate-800 text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 ml-2">모든 해적선</h1>
                </div>

                {/* Vertical Room List */}
                <div className="flex flex-col gap-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center text-slate-500 font-bold py-20">
                            현재 모집 중인 방이 없습니다.
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} className="w-full aspect-[16/10]">
                                <RoomCard
                                    room={room}
                                    onJoin={() => navigate(`/room/${room.id}`, { state: { room } })}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default AllRoomList;
