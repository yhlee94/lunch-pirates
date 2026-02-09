import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        message: '',
        type: 'info',
        isConfirm: false,
        onConfirm: null,
    });

    const showAlert = useCallback((message, type = 'info') => {
        setAlertConfig({
            isOpen: true,
            message,
            type,
            isConfirm: false,
            onConfirm: null,
        });
    }, []);

    const showConfirm = useCallback((message, onConfirm) => {
        setAlertConfig({
            isOpen: true,
            message,
            type: 'info',
            isConfirm: true,
            onConfirm,
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (alertConfig.onConfirm) {
            alertConfig.onConfirm();
        }
        closeAlert();
    }, [alertConfig, closeAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <CustomAlert
                isOpen={alertConfig.isOpen}
                message={alertConfig.message}
                type={alertConfig.type}
                isConfirm={alertConfig.isConfirm}
                onConfirm={handleConfirm}
                onClose={closeAlert}
            />
        </AlertContext.Provider>
    );
};
