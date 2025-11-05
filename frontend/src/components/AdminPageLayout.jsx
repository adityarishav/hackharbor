import React from 'react';

const AdminPageLayout = ({ title, children }) => {
    return (
        <div className="bg-gray-900 min-h-screen text-white p-8">
            <h1 className="text-3xl font-bold text-white mb-6 border-b-2 border-purple-500 pb-2">{title}</h1>
            {children}
        </div>
    );
};

export default AdminPageLayout;