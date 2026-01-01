import React, { useState } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { FaDownload, FaRedo, FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const VPNSettingsPage = () => {
    const addNotification = useNotification();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadVpnConfig = async () => {
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.post('/vpn/generate-config', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'client.ovpn');
            document.body.appendChild(link);
            link.click();
            link.remove();
            addNotification('VPN config downloaded!', 'success');
        } catch (error) {
            console.error('Failed to download VPN config:', error);
            addNotification('Failed to download VPN config!', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleRegenerateVpnConfig = async () => {
        if (!window.confirm('Are you sure you want to regenerate your VPN configuration? This will invalidate your existing configuration.')) {
            return;
        }

        setIsRegenerating(true);
        try {
            const token = localStorage.getItem('access_token');
            await api.post('/vpn/regenerate', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('VPN configuration regenerated successfully. Please download the new config.', 'success');
        } catch (error) {
            console.error('Failed to regenerate VPN config:', error);
            addNotification('Failed to regenerate VPN config!', 'error');
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="min-h-screen p-8 flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <h2 className="text-3xl font-bold text-white neon-text mb-8">VPN Access</h2>

                {/* Connection Status (Mock for now) */}
                <div className="glass-panel p-8 rounded-2xl border-l-4 border-green-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                            <FaCheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">VPN Status</h3>
                            <p className="text-green-400">Ready to Connect</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                        <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300">
                            <FaShieldAlt size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Configuration</h3>
                            <p className="text-sm text-gray-400">Manage your OpenVPN access</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={handleDownloadVpnConfig}
                                disabled={isDownloading}
                                className="flex-1 glass-button px-6 py-4 rounded-xl text-white flex items-center justify-center gap-3 hover:bg-blue-600/20 transition-all border border-blue-500/30"
                            >
                                <FaDownload />
                                {isDownloading ? 'Downloading...' : 'Download Configuration'}
                            </button>

                            <button
                                onClick={handleRegenerateVpnConfig}
                                disabled={isRegenerating}
                                className="flex-1 glass-button px-6 py-4 rounded-xl text-white flex items-center justify-center gap-3 hover:bg-red-600/20 transition-all border border-red-500/30"
                            >
                                <FaRedo />
                                {isRegenerating ? 'Regenerating...' : 'Regenerate Keys'}
                            </button>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start">
                            <FaExclamationTriangle className="text-yellow-500 mt-1 shrink-0" />
                            <p className="text-sm text-yellow-200">
                                Regenerating your keys will revoke your previous certificate. You will need to download and import the new configuration file to connect.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="glass-panel p-8 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4">How to Connect</h3>
                    <ol className="list-decimal list-inside space-y-3 text-gray-300">
                        <li>Download and install an OpenVPN client (OpenVPN Connect, Tunnelblick, etc.).</li>
                        <li>Download your configuration file using the button above.</li>
                        <li>Import the <code>.ovpn</code> file into your OpenVPN client.</li>
                        <li>Connect to the VPN. You should now have access to the internal machine network.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default VPNSettingsPage;
