import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaBook, FaLayerGroup, FaCheckCircle, FaImages } from 'react-icons/fa';
import { useNotification } from '../components/Notification';

const InstructorDashboard = () => {
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [mediaSelectionMode, setMediaSelectionMode] = useState(null); // 'module' or 'lesson'
    const [selectedMedia, setSelectedMedia] = useState([]); // Array of URLs for multi-select
    const addNotification = useNotification();

    const lessonContentRef = useRef(null);

    // Form States
    const [moduleForm, setModuleForm] = useState({ title: '', description: '', cover_image: '', order: 0 });
    const [lessonForm, setLessonForm] = useState({ title: '', content: '', order: 0 });

    useEffect(() => {
        fetchModules();
        fetchUploadedImages();
    }, []);

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/academy/modules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModules(response.data);
        } catch (error) {
            console.error('Failed to fetch modules:', error);
            addNotification('Failed to fetch modules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUploadedImages = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/admin/academy/uploads', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUploadedImages(response.data);
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    };

    const fetchModuleDetails = async (moduleId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get(`/academy/modules/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedModule(response.data);
        } catch (error) {
            console.error('Failed to fetch module details:', error);
        }
    };

    const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.post('/admin/academy/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.url;
        } catch (error) {
            console.error('Upload failed:', error);
            addNotification('Image upload failed', 'error');
            return null;
        }
    };

    const handleSelectImage = (url) => {
        if (mediaSelectionMode === 'module') {
            // Single select for module cover
            setModuleForm({ ...moduleForm, cover_image: url });
            setShowMediaModal(false);
            setMediaSelectionMode(null);
        } else if (mediaSelectionMode === 'lesson') {
            // Multi-select for lesson content
            setSelectedMedia(prev => {
                if (prev.includes(url)) {
                    return prev.filter(item => item !== url);
                } else {
                    return [...prev, url];
                }
            });
        }
    };

    const insertSelectedImages = () => {
        if (selectedMedia.length === 0) return;

        const imageMarkdown = selectedMedia.map(url => `\n![Image](${url})\n`).join('');

        if (lessonContentRef.current) {
            const textarea = lessonContentRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = lessonForm.content;

            const newText = text.substring(0, start) + imageMarkdown + text.substring(end);

            setLessonForm(prev => ({
                ...prev,
                content: newText
            }));

            // Optional: Restore cursor position (complicated due to React state update, simple version puts it at end of insertion)
        } else {
            // Fallback if ref is missing
            setLessonForm(prev => ({
                ...prev,
                content: prev.content + imageMarkdown
            }));
        }

        addNotification(`${selectedMedia.length} image(s) inserted!`, 'success');
        setShowMediaModal(false);
        setMediaSelectionMode(null);
        setSelectedMedia([]);
    };

    const openMediaGallery = (mode) => {
        setMediaSelectionMode(mode);
        setSelectedMedia([]); // Clear selection on open
        fetchUploadedImages(); // Refresh list
        setShowMediaModal(true);
    };

    const handleDeleteImage = async (url) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const filename = url.split('/').pop();
            await api.delete('/admin/academy/uploads', {
                headers: { Authorization: `Bearer ${token}` },
                params: { filename: filename }
            });
            addNotification('Image deleted', 'success');
            // Remove from selection if deleted
            setSelectedMedia(prev => prev.filter(item => item !== url));
            fetchUploadedImages();
        } catch (error) {
            console.error('Failed to delete image:', error);
            addNotification('Failed to delete image', 'error');
        }
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            await api.post('/admin/academy/modules', moduleForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Module created successfully!', 'success');
            setShowModuleModal(false);
            setModuleForm({ title: '', description: '', cover_image: '', order: 0 });
            fetchModules();
        } catch (error) {
            console.error('Failed to create module:', error);
            addNotification('Failed to create module', 'error');
        }
    };

    const handleEditLesson = (lesson) => {
        setLessonForm({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            order: lesson.order
        });
        setShowLessonModal(true);
    };

    const handleCreateOrUpdateLesson = async (e) => {
        e.preventDefault();
        if (!selectedModule) return;
        try {
            const token = localStorage.getItem('access_token');
            if (lessonForm.id) {
                // Update existing lesson
                await api.put(`/admin/academy/lessons/${lessonForm.id}`, lessonForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                addNotification('Lesson updated successfully!', 'success');
            } else {
                // Create new lesson
                await api.post(`/admin/academy/modules/${selectedModule.id}/lessons`, lessonForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                addNotification('Lesson created successfully!', 'success');
            }
            setShowLessonModal(false);
            setLessonForm({ title: '', content: '', order: 0 });
            fetchModuleDetails(selectedModule.id);
        } catch (error) {
            console.error('Failed to save lesson:', error);
            addNotification('Failed to save lesson', 'error');
        }
    };

    const handleDeleteModule = async (moduleId) => {
        if (!window.confirm('Are you sure you want to delete this module? All lessons within it will be deleted.')) return;
        try {
            const token = localStorage.getItem('access_token');
            await api.delete(`/admin/academy/modules/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Module deleted successfully', 'success');
            if (selectedModule?.id === moduleId) setSelectedModule(null);
            fetchModules();
        } catch (error) {
            console.error('Failed to delete module:', error);
            addNotification('Failed to delete module', 'error');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await api.delete(`/admin/academy/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Lesson deleted successfully', 'success');
            fetchModuleDetails(selectedModule.id);
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            addNotification('Failed to delete lesson', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Instructor Dashboard</h1>
                    <p className="text-gray-400">Manage curriculum, modules, and lessons.</p>
                </div>
                <button
                    onClick={() => setShowModuleModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                    <FaPlus className="mr-2" /> New Module
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modules List */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                        <FaLayerGroup className="mr-2" /> Modules
                    </h2>
                    <div className="space-y-3">
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                className={`p-4 rounded-lg border transition-all relative group ${selectedModule?.id === module.id
                                    ? 'bg-cyan-900/30 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setSelectedModule(module);
                                        fetchModuleDetails(module.id);
                                    }}
                                >
                                    <h3 className="font-bold text-white pr-8">{module.title}</h3>
                                    <p className="text-sm text-gray-500 truncate">{module.description}</p>
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <span>Order: {module.order}</span>
                                        <span>{module.lessons?.length || 0} Lessons</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteModule(module.id);
                                    }}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete Module"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {modules.length === 0 && !loading && (
                            <div className="text-gray-500 text-center p-4 border border-dashed border-gray-700 rounded-lg">
                                No modules found. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Module Details / Lessons */}
                <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    {selectedModule ? (
                        <>
                            <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedModule.title}</h2>
                                    <p className="text-gray-400">{selectedModule.description}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setLessonForm({ title: '', content: '', order: 0 });
                                        setShowLessonModal(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
                                >
                                    <FaPlus className="mr-2" /> Add Lesson
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-300 flex items-center">
                                    <FaBook className="mr-2" /> Lessons
                                </h3>
                                {selectedModule.lessons && selectedModule.lessons.length > 0 ? (
                                    selectedModule.lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                                        <div key={lesson.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center group">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-cyan-400 font-bold">
                                                    {lesson.order}
                                                </div>
                                                <span className="text-gray-200 font-medium">{lesson.title}</span>
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditLesson(lesson)}
                                                    className="text-gray-500 hover:text-cyan-400 p-2"
                                                    title="Edit Lesson"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="text-gray-500 hover:text-red-500 p-2"
                                                    title="Delete Lesson"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 italic p-4 text-center bg-gray-800/30 rounded-lg">
                                        No lessons in this module yet.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <FaLayerGroup className="text-6xl mb-4 opacity-20" />
                            <p>Select a module to manage its content.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Module Modal */}
            {showModuleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Module</h2>
                        <form onSubmit={handleCreateModule} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    value={moduleForm.title}
                                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    rows="3"
                                    value={moduleForm.description}
                                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cover Image</label>
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => openMediaGallery('module')}
                                        className="bg-gray-800 hover:bg-gray-700 text-cyan-400 px-4 py-2 rounded-lg border border-gray-700 transition-colors text-sm"
                                    >
                                        Select / Upload Image
                                    </button>
                                    {moduleForm.cover_image && <FaCheckCircle className="text-green-500" />}
                                </div>
                                {moduleForm.cover_image && (
                                    <div className="mt-2">
                                        <img src={moduleForm.cover_image} alt="Cover" className="h-20 w-auto rounded border border-gray-700" />
                                        <p className="text-xs text-gray-500 mt-1 truncate">{moduleForm.cover_image}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Order</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    value={moduleForm.order}
                                    onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModuleModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                                >
                                    Create Module
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Lesson Modal */}
            {showLessonModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {lessonForm.id ? 'Edit Lesson' : `Add Lesson to ${selectedModule?.title}`}
                        </h2>
                        <form onSubmit={handleCreateOrUpdateLesson} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Lesson Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm text-gray-400">Content (Markdown supported)</label>
                                    <button
                                        type="button"
                                        onClick={() => openMediaGallery('lesson')}
                                        className="cursor-pointer text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 px-2 py-1 rounded border border-gray-700 transition-colors flex items-center"
                                    >
                                        <FaImages className="mr-1" /> Insert Images
                                    </button>
                                </div>
                                <textarea
                                    ref={lessonContentRef}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                                    rows="10"
                                    placeholder="# Lesson Header&#10;&#10;Write your lesson content here..."
                                    value={lessonForm.content}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Order</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                    value={lessonForm.order}
                                    onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLessonModal(false);
                                        setLessonForm({ title: '', content: '', order: 0 });
                                    }}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                                >
                                    {lessonForm.id ? 'Update Lesson' : 'Add Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Media Gallery Modal */}
            {showMediaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-4xl shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Media Library</h2>
                                <p className="text-xs text-gray-400">
                                    {mediaSelectionMode === 'lesson'
                                        ? 'Select multiple images to insert.'
                                        : 'Select an image.'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {mediaSelectionMode === 'lesson' && selectedMedia.length > 0 && (
                                    <button
                                        onClick={insertSelectedImages}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        Insert {selectedMedia.length} Image(s)
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowMediaModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Upload New Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
                                onChange={async (e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 0) {
                                        for (const file of files) {
                                            const url = await handleImageUpload(file);
                                            if (url) {
                                                // Auto-select uploaded images if in lesson mode
                                                if (mediaSelectionMode === 'lesson') {
                                                    setSelectedMedia(prev => [...prev, url]);
                                                }
                                            }
                                        }
                                        fetchUploadedImages();
                                    }
                                }}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border border-gray-800 rounded-lg p-4 bg-gray-800/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {uploadedImages.map((url, index) => {
                                    const isSelected = selectedMedia.includes(url) || (mediaSelectionMode === 'module' && moduleForm.cover_image === url);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => handleSelectImage(url)}
                                            className={`relative group border rounded-lg overflow-hidden cursor-pointer transition-all ${isSelected
                                                    ? 'border-green-500 ring-2 ring-green-500/50'
                                                    : 'border-gray-700 hover:border-cyan-500'
                                                }`}
                                        >
                                            <img src={url} alt={`Uploaded ${index}`} className="w-full h-32 object-cover" />
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                                                    <FaCheckCircle />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity space-x-3">
                                                {mediaSelectionMode === 'module' && (
                                                    <span className="text-white font-medium text-sm">Select</span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(url);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-sm font-medium transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {uploadedImages.length === 0 && (
                                    <div className="col-span-full text-center text-gray-500 py-10">
                                        No images found. Upload one to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;
