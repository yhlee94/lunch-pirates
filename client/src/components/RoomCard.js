import React from 'react';


function RoomCard({ room, onJoin }) {
    return (
        <div
            className="bg-card-blue dark:bg-indigo-800 rounded-retro border-4 border-blue-900 shadow-retro p-4 flex gap-4 hover:scale-[1.02] transition-transform group cursor-pointer relative overflow-hidden"
            onClick={onJoin}
        >
            <div className="glossy absolute inset-0 pointer-events-none"></div>

            {/* Icon / Level Area */}
            <div className="w-24 h-24 bg-red-600 rounded-xl border-4 border-red-900 flex items-center justify-center relative shadow-inner">
                <span className="material-symbols-rounded text-white text-5xl drop-shadow-lg">restaurant</span>
                <div className="absolute -bottom-2 bg-black/60 px-2 rounded-full text-[10px] text-white font-bold">LUNCH</div>
            </div>

            {/* Info Area */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <h3 className="text-white font-bold text-xl drop-shadow-sm truncate pr-2">{room.title}</h3>
                    <div className="bg-retro-yellow px-2 py-0.5 rounded text-[10px] font-bold text-orange-900 uppercase shrink-0">Open</div>
                </div>

                <div className="flex items-end justify-between">
                    <span className="waiting-tag bg-white/20 border-2 border-white/40 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest italic">
                        WAITING
                    </span>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-black/30 rounded-full px-3 py-1 gap-2">
                            <span className="material-symbols-rounded text-white text-sm">group</span>
                            <span className="text-white font-bold text-sm">
                                {room.current_participants} / {room.max_participants}
                            </span>
                        </div>
                        <div className="bg-blue-400 p-1.5 rounded-lg border-2 border-blue-600">
                            <span className="material-symbols-rounded text-white text-sm">sailing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoomCard;