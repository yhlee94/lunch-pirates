import React from 'react';

const CustomAlert = ({ isOpen, message, onClose, onConfirm, isConfirm, type = 'info' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon based on type */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isConfirm ? 'bg-blue-100 text-blue-600' :
                        type === 'error' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'
                        }`}>
                        <span className="material-symbols-rounded text-3xl">
                            {isConfirm ? 'help' : type === 'error' ? 'priority_high' : 'info'}
                        </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                        {isConfirm ? '확인' : type === 'error' ? '앗!' : '알림'}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                <div className="p-4 pt-0 flex gap-3">
                    {isConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-black rounded-2xl transition-all active:scale-95"
                            >
                                취소
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-4 bg-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                확인
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            확인
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomAlert;
