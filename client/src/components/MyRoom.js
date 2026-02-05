import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyRoom({ user, onBack }) {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [equipping, setEquipping] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = High to Low, 'asc' = Low to High

    const rarityWeights = {
        'Mythic': 5,
        'Legend': 4, 'Legendary': 4,
        'Epic': 3,
        'Rare': 2,
        'Common': 1
    };

    const sortedItems = [...items].sort((a, b) => {
        const weightA = rarityWeights[a.rarity] || 0;
        const weightB = rarityWeights[b.rarity] || 0;
        return sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
    });

    const fetchItems = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/users/items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const newItems = response.data.items;
                setItems(newItems);

                // If an item is already selected, update it with the new data (to reflect equipped status etc)
                // Otherwise, select the equipped item by default
                setSelectedItem(prev => {
                    if (prev) {
                        return newItems.find(i => i.id === prev.id) || prev;
                    }
                    const equipped = newItems.find(i => i.is_equipped);
                    if (equipped) return equipped;
                    return newItems.length > 0 ? newItems[0] : null;
                });
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

    // Rarity styles mapping based on user's new design
    const getRarityBadgeStyle = (rarity) => {
        switch (rarity) {
            case 'Common': return 'bg-slate-200 text-slate-600 border-slate-300';
            case 'Rare': return 'bg-blue-50/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800/30';
            case 'Epic': return 'bg-fuchsia-50/90 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-100 dark:border-fuchsia-800/30';
            case 'Legendary':
            case 'Legend': return 'bg-amber-50/90 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800/30';
            case 'Mythic': return 'bg-red-50/90 dark:bg-red-900/50 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800/30';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    // Main card rarity gradient
    const getMainRarityGradient = (rarity) => {
        switch (rarity) {
            case 'Rare': return 'from-blue-500 to-cyan-400 text-white';
            case 'Epic': return 'from-fuchsia-500 to-purple-600 text-white';
            case 'Legendary':
            case 'Legend': return 'from-amber-400 to-orange-500 text-white';
            case 'Mythic': return 'from-red-500 to-rose-600 text-white';
            default: return 'from-slate-400 to-slate-500 text-white';
        }
    };

    return (
        <div className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 font-sans min-h-screen flex flex-col transition-colors duration-300 relative pb-24 max-w-[400px] mx-auto shadow-2xl overflow-hidden">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                }
                .dark .glass-panel {
                    background: rgba(30, 41, 59, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .mask-image-gradient {
                    mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
                }
            `}</style>

            <header className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-icons-round text-slate-600 dark:text-slate-300">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">마이 룸</h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">해적단 장비 관리소</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                    <span className="material-icons-round text-amber-400 text-sm">inventory_2</span>
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">보유 아이템</span>
                        <span className="text-sm font-bold">{items.length}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 gap-8 overflow-y-auto">
                {/* Main Character Display */}
                <section className="relative w-full">
                    <div className="relative w-full min-h-[520px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100 dark:shadow-none bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center justify-between">
                        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 pointer-events-none"></div>

                        {selectedItem ? (
                            <>
                                <div className="relative z-10 w-full flex-1 flex items-center justify-center -mt-4 py-6">
                                    <div className="relative w-72 h-72">
                                        <img
                                            key={selectedItem.image_url} // Add key to force proper re-render without glitch if needed, or remove if causing it. Let's try removing smooth transition.
                                            alt={selectedItem.name}
                                            className="w-full h-full object-contain rounded-3xl drop-shadow-xl mask-image-gradient"
                                            src={selectedItem.image_url}
                                        />
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-400 rounded-full blur-[2px] opacity-60 animate-bounce"></div>
                                        <div className="absolute bottom-10 left-4 w-2 h-2 bg-purple-400 rounded-full blur-[1px] opacity-50 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="relative z-20 w-full glass-panel rounded-3xl p-5 flex flex-col items-center gap-3 shadow-soft">
                                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getMainRarityGradient(selectedItem.rarity)} text-[10px] font-bold tracking-widest uppercase shadow-md`}>
                                        {selectedItem.rarity}
                                    </span>
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                                        {selectedItem.name}
                                    </h2>
                                    {selectedItem.is_equipped ? (
                                        <button className="w-full mt-2 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-default">
                                            <span className="material-icons-round text-lg">check_circle</span>
                                            장착 중
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleEquip(selectedItem.id)}
                                            disabled={equipping}
                                            className="w-full mt-2 py-3.5 bg-primary hover:bg-blue-600 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
                                        >
                                            <span className="material-icons-round text-lg">check_circle</span>
                                            {equipping ? '장착 중...' : '장착하기'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <span className="material-icons-round text-4xl mb-2">sentiment_dissatisfied</span>
                                <p>선택된 아이템이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Collection Grid */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">컬렉션</h3>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="text-primary text-xs font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <span className="material-icons-round text-sm">sort</span>
                            {sortOrder === 'desc' ? '등급 높은순' : '등급 낮은순'}
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 pb-4">
                            {sortedItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className="group relative bg-white dark:bg-slate-800 rounded-2xl py-3 px-1 shadow-sm border-[0.5px] border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-300 cursor-pointer"
                                >
                                    {/* 1. Rarity Badge (Top) */}
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter border ${getRarityBadgeStyle(item.rarity)}`}>
                                        {item.rarity}
                                    </span>

                                    {/* 2. Image (Middle) */}
                                    <div className={`w-[85%] aspect-square rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden relative ${selectedItem?.id === item.id ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-800' : ''}`}>
                                        {item.rarity === 'Mythic' && (
                                            <div className="absolute inset-0 bg-red-500/5 rounded-xl animate-pulse"></div>
                                        )}
                                        <img
                                            alt={item.name}
                                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 z-10`}
                                            src={item.image_url}
                                        />
                                    </div>

                                    {/* 3. Name (Bottom) */}
                                    <div className="w-full text-center px-0.5">
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-[10px] tracking-tight truncate">{item.name}</p>
                                    </div>

                                    {item.is_equipped && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-white z-20">
                                            <span className="material-icons-round text-white text-[10px]">check</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#1e293b] dark:bg-slate-800 text-white rounded-full p-2 shadow-2xl flex items-center justify-around z-50 backdrop-blur-lg bg-opacity-90 border border-slate-700 max-w-[400px]">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-icons-round">home</span>
                </button>
                <button
                    onClick={() => navigate('/rankings')}
                    className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-icons-round">emoji_events</span>
                </button>
                <button className="p-3 rounded-full text-primary bg-white/10 relative">
                    <span className="material-icons-round">face</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-800"></span>
                </button>
                <button className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <span className="material-icons-round">settings</span>
                </button>
            </nav>
            <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-[#0f172a] to-transparent pointer-events-none z-40"></div>
        </div>
    );
}

export default MyRoom;
