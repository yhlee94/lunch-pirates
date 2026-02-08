import React from 'react';

const CustomAlert = ({ isOpen, message, onClose, type = 'info' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="p-8 flex flex-col items-center text-center">
                    {/* Icon based on type */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${type === 'error' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'
                        }`}>
                        <span className="material-symbols-rounded text-3xl">
                            {type === 'error' ? 'priority_high' : 'info'}
                        </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                        {type === 'error' ? '앗!' : '알림'}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                <div className="p-4 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomAlert;
