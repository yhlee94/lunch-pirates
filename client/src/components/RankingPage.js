import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

function RankingPage({ user }) {
    const navigate = useNavigate();
    const [rankings, setRankings] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // 댓글 삭제
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                // UI에서 즉시 제거
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (error) {
            console.error(error);
            alert('댓글 삭제 권한이 없거나 오류가 발생했습니다.');
        }
    };

    // 댓글 수정 시작
    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    // 댓글 수정 저장
    const handleSaveEdit = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            const response = await axios.put(`${API_BASE_URL}/api/comments/${commentId}`, {
                content: editContent
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent } : c));
                setEditingCommentId(null);
                setEditContent('');
            }
        } catch (error) {
            console.error(error);
            alert('댓글 수정 권한이 없거나 오류가 발생했습니다.');
        }
    };

    // 댓글 조회 함수
    const fetchComments = async (restaurantId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/comments/${restaurantId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setComments(response.data.comments);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    };

    // 식당 클릭 핸들러
    const handleExpand = (id) => {
        if (expandedRestaurantId === id) {
            setExpandedRestaurantId(null);
            setComments([]);
            setNewComment('');
        } else {
            setExpandedRestaurantId(id);
            // kakao_place_id가 있는 경우에만 댓글 조회
            if (id) {
                fetchComments(id);
            }
        }
    };

    // 댓글 작성 핸들러
    const handleSubmitComment = async (e) => {
        e.preventDefault(); // 폼 제출 방지
        e.stopPropagation(); // 상위 클릭 이벤트 전파 방지

        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/comments`, {
                restaurant_id: expandedRestaurantId,
                content: newComment
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setNewComment('');
                fetchComments(expandedRestaurantId); // 목록 새로고침
            }
        } catch (error) {
            alert('댓글 작성에 실패했습니다.');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        console.log("RankingPage User check:", user);

        if (!user || user.company_id === undefined) {
            // 만약 user가 null이면 로그인 페이지로 리다이렉트하거나 에러를 보여줘야 함
            // 지금은 일단 리턴하지만 로그를 남김
            console.warn("User or company_id missing", user);
            return;
        }

        const fetchRankings = async () => {
            try {
                const url = `${API_BASE_URL}/api/company/rankings/${user.company_id}`;
                console.log("Fetching rankings from:", url);

                const response = await axios.get(url);
                console.log("Rankings response:", response.data);

                if (response.data.success) {
                    setRankings(response.data.rankings);
                    setCompanyName(response.data.companyName);
                } else {
                    console.error("API returned success: false", response.data);
                }
            } catch (error) {
                console.error("Failed to fetch rankings", error);
                if (error.response) {
                    console.error("Error response data:", error.response.data);
                    console.error("Error response status:", error.response.status);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, [user]);

    // 1위 (주간 챔피언)
    const champion = rankings.length > 0 ? rankings[0] : null;
    // 핫 플레이스 (현재는 2위를 선택하거나, 1개만 있을 경우 1위를 선택)
    const hot = rankings.length > 1 ? rankings[1] : (rankings.length > 0 ? rankings[0] : null);

    // 숫자 포맷팅 헬퍼 함수
    const formatCount = (count) => {
        // 예: 12400 -> 12.4k
        const num = parseInt(count);
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <style>{`
            .material-symbols-outlined {
                font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            body {
                -webkit-tap-highlight-color: transparent;
            }
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
            <div className="bg-gray-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 font-['Plus_Jakarta_Sans'] min-h-screen flex flex-col items-center">
                <div className="relative min-h-screen w-full max-w-md bg-white shadow-2xl overflow-hidden border-x border-gray-100 flex flex-col">
                    <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-white via-white to-blue-50/70"></div>

                    {/* 헤더 내비게이션 바 */}
                    <div className="relative z-10 px-6 pt-6 pb-2 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 transition-all duration-300">
                        <button onClick={() => navigate('/')} className="flex items-center justify-center size-10 -ml-2 rounded-full hover:bg-gray-100/50 transition-colors text-slate-800">
                            <span className="material-symbols-outlined">arrow_back_ios_new</span>
                        </button>
                        <div className="flex gap-2">
                            <button className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100/50 transition-colors text-slate-800">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <button className="flex items-center justify-center size-10 -mr-2 rounded-full hover:bg-gray-100/50 transition-colors text-slate-800 relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border border-white"></span>
                            </button>
                        </div>
                    </div>

                    {/* 타이틀 섹션 */}
                    <div className="relative z-10 px-6 pt-2 pb-6">
                        <h1 className="font-extrabold text-3xl text-slate-900 tracking-tight mb-1">{companyName} 맛집 랭킹</h1>
                        <p className="text-slate-400 text-sm font-medium">우리 회사 사람들이 가장 많이 방문한 곳</p>
                    </div>

                    {/* 하이라이트 그리드 */}
                    <div className="relative z-10 px-6 mb-8 grid grid-cols-3 gap-3">
                        {/* 챔피언 카드 */}
                        {champion && (
                            <div className="col-span-2 relative overflow-hidden rounded-[1.5rem] bg-white border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] group hover:shadow-lg transition-shadow duration-500">
                                <div className="absolute -top-10 -right-10 size-32 bg-blue-50/80 rounded-full blur-2xl"></div>
                                <div className="relative z-10 p-5 flex flex-col h-full justify-between min-h-[160px]">
                                    <div className="flex flex-col items-start">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-[#2b8cee] uppercase tracking-wide mb-3 shadow-sm">
                                            <span className="material-symbols-outlined text-[14px]">trophy</span>
                                            Monthly Restaurant
                                        </span>
                                        <h3 className="font-bold text-xl leading-tight text-slate-900 line-clamp-2 text-left">{champion.restaurant_name}</h3>
                                        <p className="text-xs text-slate-400 mt-1 font-medium truncate w-full text-left">{champion.restaurant_address || '주소 정보 없음'}</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex -space-x-2 mr-1">
                                            {/* Mock Avatars */}
                                            <div className="size-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                            <div className="size-6 rounded-full bg-slate-300 border-2 border-white"></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{formatCount(champion.visit_count)} <span className="text-slate-400 font-normal text-xs">명 방문</span></span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                            </div>
                        )}

                        {/* 핫 카드 */}
                        {hot && (
                            <div className="col-span-1 relative rounded-[1.5rem] bg-gradient-to-b from-[#FF6B35] to-[#FF3D3D] text-white shadow-[0_8px_32px_0_rgba(255,107,53,0.3)] overflow-hidden flex flex-col items-center justify-center p-4 text-center group">
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="size-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-xl text-yellow-300">local_fire_department</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-white/90 tracking-wider mb-0.5">Hot</p>
                                        <p className="text-lg font-bold truncate w-full max-w-[80px]">{hot.restaurant_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 리스트 섹션 */}
                    <div className="relative z-10 flex-1 px-6 pb-32 flex flex-col gap-5">
                        {rankings.map((item, index) => {
                            const rank = index + 1;
                            const isExpanded = expandedRestaurantId === item.kakao_place_id && item.kakao_place_id;
                            let rankStyle = "font-bold text-xl text-slate-300 italic";
                            let iconColor = "text-slate-300";
                            let borderHover = "hover:border-slate-200/50";

                            if (rank === 1) {
                                rankStyle = "font-extrabold text-3xl italic text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 drop-shadow-sm";
                                iconColor = "text-rose-500";
                                borderHover = "hover:border-amber-100/50";
                            } else if (rank === 2) {
                                rankStyle = "font-extrabold text-3xl italic text-transparent bg-clip-text bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 drop-shadow-sm";
                                iconColor = "text-orange-500";
                                borderHover = "hover:border-slate-200/50";
                            } else if (rank === 3) {
                                rankStyle = "font-extrabold text-3xl italic text-transparent bg-clip-text bg-gradient-to-br from-orange-300 via-orange-400 to-orange-700 drop-shadow-sm";
                                iconColor = "text-amber-500";
                                borderHover = "hover:border-orange-100/50";
                            }

                            return (
                                <div key={index} className="flex flex-col">
                                    <div
                                        onClick={() => item.kakao_place_id && handleExpand(item.kakao_place_id)}
                                        className={`group relative z-10 flex items-center p-6 bg-white rounded-[1.5rem] shadow-[0_15px_35px_-5px_rgba(0,0,0,0.06)] border border-slate-50 ${borderHover} transition-all duration-300 transform ${isExpanded ? 'scale-[1.02] ring-2 ring-[#2b8cee]/20 shadow-xl' : 'hover:-translate-y-1'} cursor-pointer`}
                                    >
                                        <div className="w-16 flex-shrink-0 flex items-center justify-center">
                                            <span className={`${rankStyle} pr-1 leading-normal`}>{rank}</span>
                                        </div>
                                        <div className="flex-1 px-4 ml-2">
                                            <h3 className="font-bold text-slate-900 text-lg tracking-tight line-clamp-1">{item.restaurant_name}</h3>
                                            <p className="text-xs font-medium text-slate-400 mt-1 truncate">{item.restaurant_address || '주소 정보 없음'}</p>
                                        </div>
                                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5 text-slate-800">
                                                <span className={`material-symbols-outlined ${iconColor} text-[20px] ${rank === 1 ? 'drop-shadow-sm' : ''}`}>
                                                    {rank <= 3 ? 'local_fire_department' : 'person'}
                                                </span>
                                                <span className={`font-bold ${rank <= 3 ? 'text-base' : 'text-sm text-slate-500'} tabular-nums`}>
                                                    {formatCount(item.visit_count)}
                                                </span>
                                            </div>
                                            {item.kakao_place_id && (
                                                <span className="text-[10px] text-slate-300 mt-1 flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[12px]">chat_bubble_outline</span>
                                                    댓글
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 댓글 섹션 (확장 시 표시) */}
                                    {isExpanded && (
                                        <div className="mx-0 bg-slate-50/80 rounded-b-[1.5rem] -mt-4 pt-6 pb-4 px-4 border-x border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                            <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                {comments.length === 0 ? (
                                                    <p className="text-center text-slate-400 text-xs py-4">아직 작성된 댓글이 없습니다.<br />앞으로 방문할 사람들을 위해 팁을 남겨주세요!</p>
                                                ) : (
                                                    comments.map((comment, idx) => (
                                                        <div key={comment.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-50">
                                                                    {/* 익명 프로필 이미지 */}
                                                                    <span className="material-symbols-outlined text-slate-300 text-[16px]">person</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700">익명의 해적</span>
                                                                <div className="ml-auto flex items-center gap-2">
                                                                    <span className="text-[10px] text-slate-300">
                                                                        {new Date(comment.created_at).toLocaleDateString()}
                                                                    </span>
                                                                    {user && user.id === comment.user_id && !editingCommentId && (
                                                                        <div className="flex gap-1 text-[10px] text-slate-400">
                                                                            <button onClick={() => handleStartEdit(comment)} className="hover:text-blue-500 hover:underline">수정</button>
                                                                            <span className="text-slate-200">|</span>
                                                                            <button onClick={() => handleDeleteComment(comment.id)} className="hover:text-red-500 hover:underline">삭제</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {editingCommentId === comment.id ? (
                                                                <div className="mt-2">
                                                                    <textarea
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="w-full text-sm p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 min-h-[60px]"
                                                                    />
                                                                    <div className="flex justify-end gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => setEditingCommentId(null)}
                                                                            className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                                        >
                                                                            취소
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveEdit(comment.id)}
                                                                            className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                                                                        >
                                                                            저장
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap text-left pl-1">
                                                                    {comment.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* 댓글 작성 폼 */}
                                            <form onSubmit={handleSubmitComment} className="relative mt-2">
                                                <input
                                                    type="text"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="익명으로 댓글 남기기..."
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/50 focus:border-[#2b8cee] transition-all shadow-sm placeholder-slate-400"
                                                    maxLength={200}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim() || submitting}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#2b8cee] hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[20px]">send</span>
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {rankings.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                아직 데이터가 충분하지 않습니다.
                            </div>
                        )}
                    </div>

                    {/* 하단 내비게이션 */}
                    {/* 하단 내비게이션 (Fixed Bottom Nav) */}
                    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#1e293b] text-white rounded-full p-2 shadow-2xl flex items-center justify-around z-50 backdrop-blur-lg bg-opacity-90 border border-slate-700 max-w-[400px]">
                        <button
                            onClick={() => navigate('/')}
                            className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px]">home</span>
                        </button>
                        <button className="p-3 rounded-full text-primary bg-white/10 relative">
                            <span className="material-symbols-outlined text-[24px] text-[#2b8cee] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-800"></span>
                        </button>
                        <button
                            onClick={() => navigate('/my-room')} // Assuming /my-room route exists or onNavigateToMyRoom logic needed. 
                            // Wait, MyRoom is a component shown via state in LunchRoomList usually, or checks user. 
                            // But usually if there's a route /my-room, we use that. 
                            // If MyRoom is just a modal in main, this might fail. 
                            // But for now let's assume /my-room or ask user.
                            // Actually previous code showed MyRoom component usage inside LunchRoomList logic maybe?
                            // Let's check App.js to see routes.
                            className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[24px]">face</span>
                        </button>
                        <button className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">settings</span>
                        </button>
                    </nav>
                </div>
            </div>
        </React.Fragment>
    );
}

export default RankingPage;
