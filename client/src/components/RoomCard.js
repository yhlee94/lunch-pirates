import React from 'react';


function RoomCard({ room, onJoin }) {
    return (
        <div
            className="w-full h-full flex-shrink-0 relative group perspective cursor-pointer"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] shadow-card-float border border-white/60 transform transition-transform duration-500 group-hover:scale-[1.02]"></div>
            <div className="absolute top-0 left-0 w-full h-[35%] bg-gradient-to-b from-orange-100/50 to-transparent rounded-t-[2.5rem]"></div>
            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-8">
                    <div className="text-left">
                        <span className="block text-2xl font-black text-slate-800">
                            {new Date(room.departure_time).getMonth() + 1}월 {new Date(room.departure_time).getDate()}일
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                            {new Date(room.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {room.max_participants - room.current_participants}명 남음
                        </span>
                    </div>
                    <span className="bg-orange-500/10 text-orange-600 text-sm font-extrabold px-5 py-2.5 rounded-full border border-orange-500/20 shadow-sm backdrop-blur-sm animate-badge-pulse">
                        모집중
                    </span>
                </div>
                <div className="space-y-4 my-auto mb-8">
                    <div className="flex items-center gap-3 text-left">
                        <div className="flex-shrink-0 flex items-center justify-center">
                            <span className="material-symbols-rounded text-[#2563EB] text-4xl animate-sail inline-block origin-bottom">sailing</span>
                        </div>
                        <div>
                            <p className="font-black text-lg text-slate-800 leading-tight line-clamp-1">{room.restaurant_name}</p>
                            <p className="text-sm font-medium text-slate-500 mt-0.5 line-clamp-1">{room.restaurant_address}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onJoin();
                    }}
                    className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors active:scale-95"
                >
                    탑승하기
                </button>
            </div>
        </div>
    );
}

export default RoomCard;