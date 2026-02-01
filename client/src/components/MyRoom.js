import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function MyRoom({ user, onBack }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [equipping, setEquipping] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/users/items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setItems(response.data.items);
                // 현재 장착된 아이템을 초기 선택 상태로 설정
                const equipped = response.data.items.find(item => item.is_equipped);
                if (equipped) setSelectedItem(equipped);
                else if (response.data.items.length > 0) setSelectedItem(response.data.items[0]);
            }
        } catch (error) {
            console.error('아이템 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleEquip = async (itemId) => {
        if (equipping) return;
        try {
            setEquipping(true);
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/users/equip', { itemId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                // 목록 새로고침
                await fetchItems();
            }
        } catch (error) {
            alert(error.response?.data?.message || '장착 중 오류가 발생했습니다.');
        } finally {
            setEquipping(false);
        }
    };

    const rarityColors = {
        Common: 'bg-slate-200 border-slate-400 text-slate-700',
        Rare: 'bg-blue-100 border-blue-400 text-blue-700',
        Epic: 'bg-purple-100 border-purple-400 text-purple-700',
        Legendary: 'bg-orange-100 border-orange-400 text-orange-700',
        Legend: 'bg-orange-100 border-orange-400 text-orange-700',
        Mythic: 'bg-red-100 border-red-500 text-red-700'
    };

    return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="w-full max-w-6xl aspect-[16/10] bg-primary retro-border rounded-retro shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header Area */}
                <div className="p-6 flex items-center justify-between gap-4 border-b-4 border-blue-800 bg-blue-400/20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 rounded-xl bg-card-blue border-4 border-blue-800 shadow-btn-blue flex items-center justify-center text-white hover:brightness-110 active:translate-y-1 active:shadow-none transition-all"
                        >
                            <span className="material-symbols-rounded font-bold text-2xl">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white drop-shadow-md tracking-wider">마이 룸</h1>
                            <p className="text-blue-100 font-bold opacity-80 text-sm">해적단 장비 관리소</p>
                        </div>
                    </div>

                    {/* 보유 아이템 카운터 */}
                    <div className="bg-slate-900/40 backdrop-blur-sm border-2 border-white/30 rounded-retro px-6 py-2 flex items-center gap-3">
                        <span className="material-symbols-rounded text-retro-yellow text-2xl">inventory_2</span>
                        <div className="flex flex-col leading-none">
                            <span className="text-white text-[10px] opacity-80 font-bold uppercase">보유 아이템</span>
                            <span className="text-white text-xl font-bold tracking-wider">{items.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

                    {/* Left Column: Character Preview */}
                    <div className="lg:col-span-5 bg-blue-500/20 rounded-retro border-4 border-blue-700/50 flex flex-col items-center justify-center relative overflow-hidden group">

                        {/* Background Decoration */}
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                        {selectedItem ? (
                            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full px-8">
                                {/* Character Image */}
                                <div className="relative mb-6">
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 bg-black/20 blur-xl rounded-full"></div>
                                    <img
                                        src={selectedItem.image_url}
                                        alt="Preview"
                                        className="w-64 h-auto drop-shadow-xl transition-transform group-hover:scale-105 duration-500"
                                    />
                                </div>

                                <div className="text-center w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20">
                                    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 mb-2 ${rarityColors[selectedItem.rarity] || rarityColors.Common}`}>
                                        {selectedItem.rarity}
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-2 drop-shadow-sm">{selectedItem.name}</h2>

                                    <div className="mt-6 flex justify-center">
                                        {!selectedItem.is_equipped ? (
                                            <button
                                                onClick={() => handleEquip(selectedItem.id)}
                                                disabled={equipping}
                                                className="w-full bg-gradient-to-b from-retro-yellow to-retro-orange text-white py-3 rounded-xl font-black text-lg border-b-4 border-orange-700 shadow-lg hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-rounded">check_circle</span>
                                                {equipping ? '장착 중...' : '장착하기'}
                                            </button>
                                        ) : (
                                            <div className="w-full bg-blue-600/50 text-white py-3 rounded-xl font-black text-lg border-2 border-blue-400/50 flex items-center justify-center gap-2 cursor-default">
                                                <span className="material-symbols-rounded text-green-300">task_alt</span>
                                                장착 중
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-white/50 font-bold flex flex-col items-center gap-2">
                                <span className="material-symbols-rounded text-5xl">person_off</span>
                                <span>선택된 아이템이 없습니다</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Inventory */}
                    <div className="lg:col-span-7 bg-white/10 rounded-retro border-4 border-white/20 flex flex-col overflow-hidden backdrop-blur-sm">
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-white font-bold gap-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    불러오는 중...
                                </div>
                            ) : items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/50 gap-4">
                                    <span className="material-symbols-rounded text-6xl opacity-50">sentiment_dissatisfied</span>
                                    <div className="font-bold">보유한 아이템이 없습니다.</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`relative aspect-[3/4] rounded-xl border-4 cursor-pointer transition-all duration-200 overflow-hidden group ${selectedItem?.id === item.id
                                                ? 'border-retro-yellow bg-white/20 scale-105 shadow-xl z-10'
                                                : 'border-blue-900/30 bg-white/10 hover:bg-white/20 hover:border-white/50'
                                                }`}
                                        >
                                            {/* Rarity Stripe */}
                                            <div className="absolute top-2 left-2 right-2 flex justify-center">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${rarityColors[item.rarity] || rarityColors.Common}`}>
                                                    {item.rarity}
                                                </span>
                                            </div>

                                            {/* Image */}
                                            <div className="absolute inset-0 flex items-center justify-center p-4 pt-8 pb-8">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-auto drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>

                                            {/* Equipped Badge */}
                                            {item.is_equipped && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5 shadow-md z-10 border-2 border-white">
                                                    <span className="material-symbols-rounded text-sm block">check</span>
                                                </div>
                                            )}

                                            {/* Name Footer */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-blue-900/80 p-2 text-center backdrop-blur-sm">
                                                <div className="text-[10px] sm:text-xs font-bold text-white truncate">{item.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyRoom;
