import React from 'react';


function RoomCard({ room, onJoin }) {
    return (
        <div
            className="w-full h-full flex-shrink-0 relative group perspective cursor-pointer"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] shadow-card-float border border-white/60 transform transition-transform duration-500 group-hover:scale-[1.02]"></div>
            <div className="absolute top-0 left-0 w-full h-[35%] bg-gradient-to-b from-orange-100/50 to-transparent rounded-t-[2.5rem]"></div>
            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <span className="block text-2xl font-black text-slate-800">
                            {new Date(room.departure_time).getMonth() + 1}월 {new Date(room.departure_time).getDate()}일
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                            {new Date(room.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {room.max_participants - room.current_participants}명 남음
                        </span>
                    </div>
                    <span className="bg-orange-500/10 text-orange-600 text-sm font-extrabold px-5 py-2.5 rounded-full border border-orange-500/20 shadow-sm backdrop-blur-sm">
                        모집중
                    </span>
                </div>
                <div className="space-y-4 my-auto">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl shadow-inner">
                            🥘
                        </div>
                        <div>
                            <p className="font-bold text-lg text-slate-800 leading-tight line-clamp-1">{room.restaurant_name}</p>
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{room.restaurant_address}</p>
                        </div>
                    </div>
                    <div className="flex -space-x-3 pt-2">
                        {room.participants && room.participants.slice(0, 3).map((participant, index) => (
                            <img
                                key={index}
                                alt={participant.name}
                                className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                                src={participant.equipped_item_image_url || 'https://via.placeholder.com/40'}
                            />
                        ))}
                        {room.participants && room.participants.length > 3 && (
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shadow-md">
                                +{room.participants.length - 3}
                            </div>
                        )}
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