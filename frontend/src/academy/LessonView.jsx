import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaArrowLeft, FaCheckCircle, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/atom-one-dark.css';

const LessonView = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [module, setModule] = useState(null);
    const [nextLessonId, setNextLessonId] = useState(null);
    const [prevLessonId, setPrevLessonId] = useState(null);

    useEffect(() => {
        fetchLesson();
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await api.get(`/academy/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLesson(response.data);

            // Fetch module to determine nav
            if (response.data.module_id) {
                fetchModule(response.data.module_id, response.data.id);
            }
        } catch (error) {
            console.error('Failed to fetch lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchModule = async (moduleId, currentLessonId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get(`/academy/modules/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const mod = response.data;
            setModule(mod);

            if (mod.lessons && mod.lessons.length > 0) {
                // Sort lessons by order
                const sortedLessons = mod.lessons.sort((a, b) => a.order - b.order);
                const currentIndex = sortedLessons.findIndex(l => l.id === currentLessonId);

                if (currentIndex !== -1) {
                    if (currentIndex > 0) {
                        setPrevLessonId(sortedLessons[currentIndex - 1].id);
                    } else {
                        setPrevLessonId(null);
                    }

                    if (currentIndex < sortedLessons.length - 1) {
                        setNextLessonId(sortedLessons[currentIndex + 1].id);
                    } else {
                        setNextLessonId(null);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch module for nav:', error);
        }
    };

    const handleNext = () => {
        if (nextLessonId) {
            navigate(`/academy/lesson/${nextLessonId}`);
        } else {
            // End of module, go back to module or dashboard
            navigate(`/academy/module/${lesson.module_id}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!lesson) return <div className="text-white">Lesson not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <Link
                    to={`/academy/module/${lesson.module_id}`}
                    className="flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
                >
                    <FaArrowLeft className="mr-2" /> Back to Module
                </Link>

                <div className="text-sm text-gray-500 font-mono">
                    LESSON_ID: {lesson.id.toString().padStart(4, '0')}
                </div>
            </div>

            <article className="bg-gray-900/80 border border-cyan-500/20 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-gray-800 pb-6">
                    {lesson.title}
                </h1>

                <div className="prose prose-invert prose-cyan max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <div className="relative group my-4">
                                        <div className="absolute -top-3 right-2 text-xs text-gray-500 font-mono bg-gray-800 px-2 rounded border border-gray-700">
                                            {match[1]}
                                        </div>
                                        <code className={`${className} block bg-gray-950 p-4 rounded-lg border border-gray-800 overflow-x-auto`} {...props}>
                                            {children}
                                        </code>
                                    </div>
                                ) : (
                                    <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            table({ children }) {
                                return (
                                    <div className="overflow-x-auto my-6 border border-gray-700 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-700">
                                            {children}
                                        </table>
                                    </div>
                                )
                            },
                            thead({ children }) {
                                return <thead className="bg-gray-800">{children}</thead>
                            },
                            th({ children }) {
                                return <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{children}</th>
                            },
                            td({ children }) {
                                return <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-t border-gray-700">{children}</td>
                            },
                            blockquote({ children }) {
                                return <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-4 bg-gray-800/50 italic text-gray-400 rounded-r">{children}</blockquote>
                            },
                            a({ children, href }) {
                                return <a href={href} className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-500 transition-all" target="_blank" rel="noopener noreferrer">{children}</a>
                            },
                            h1({ children }) {
                                return <h1 className="text-3xl font-bold text-white mt-8 mb-4 border-b border-gray-800 pb-2">{children}</h1>
                            },
                            h2({ children }) {
                                return <h2 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>
                            },
                            h3({ children }) {
                                return <h3 className="text-xl font-bold text-cyan-100 mt-6 mb-3">{children}</h3>
                            },
                            ul({ children }) {
                                return <ul className="list-disc list-inside space-y-2 my-4 text-gray-300">{children}</ul>
                            },
                            ol({ children }) {
                                return <ol className="list-decimal list-inside space-y-2 my-4 text-gray-300">{children}</ol>
                            },
                            li({ children }) {
                                return <li className="ml-4">{children}</li>
                            },
                            p({ children }) {
                                // Helper to extract text from React children
                                const flattenText = (child) => {
                                    if (typeof child === 'string') return child;
                                    if (Array.isArray(child)) return child.map(flattenText).join('');
                                    if (React.isValidElement(child) && child.props.children) {
                                        return flattenText(child.props.children);
                                    }
                                    return '';
                                };

                                const textContent = flattenText(children);

                                // Regex to find custom syntax: @youtube url OR @[youtube](url)
                                // Only matches if the URL is "close" to the directive to avoid false positives
                                const customSyntaxRegex = /@(?:\[?youtube\]?)(?:[\s:(\[]+)?(https?:\/\/[^\s)\]]+)(?:[)\]])?/i;
                                const customSyntaxMatch = textContent.match(customSyntaxRegex);

                                let urlToCheck = textContent;
                                let isCustom = false;

                                if (customSyntaxMatch && customSyntaxMatch[1]) {
                                    urlToCheck = customSyntaxMatch[1];
                                    isCustom = true;
                                }

                                // Extract Video ID
                                const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
                                const match = urlToCheck.match(youtubeRegex);

                                // Check if it's a "Plain URL" (the whole paragraph is basically just the URL)
                                const isPlainUrl = !isCustom && urlToCheck.trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/);

                                if (match && match[1] && (isCustom || isPlainUrl)) {
                                    // If custom text mixed with video, we want to Keep the text but Remove the command
                                    let contentToShow = null;
                                    if (isCustom) {
                                        // Remove the command from text
                                        const cleanText = textContent.replace(customSyntaxRegex, '').trim();
                                        if (cleanText) {
                                            contentToShow = <p className="mb-4 text-gray-300 leading-relaxed">{cleanText}</p>;
                                        }
                                    }

                                    return (
                                        <div className="my-6">
                                            {contentToShow}
                                            <div className="aspect-video">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${match[1]}`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full rounded-xl border border-gray-700 shadow-lg"
                                                ></iframe>
                                            </div>
                                        </div>
                                    );
                                }

                                return <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>
                            },
                            img({ src, alt }) {
                                let finalSrc = src;
                                if (src && (src.startsWith('/static') || src.startsWith('/uploads'))) {
                                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
                                    finalSrc = `${baseUrl}${src}`;
                                }
                                return (
                                    <div className="my-6">
                                        <img src={finalSrc} alt={alt} className="rounded-lg border border-gray-700 shadow-lg max-w-full h-auto mx-auto" />
                                        {alt && <p className="text-center text-sm text-gray-500 mt-2">{alt}</p>}
                                    </div>
                                )
                            }
                        }}
                    >
                        {lesson.content}
                    </ReactMarkdown>
                </div>
            </article>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => prevLessonId && navigate(`/academy/lesson/${prevLessonId}`)}
                    disabled={!prevLessonId}
                    className={`px-6 py-3 rounded-lg border flex items-center ${prevLessonId
                        ? 'border-gray-600 text-gray-300 hover:border-cyan-500 hover:text-cyan-400'
                        : 'border-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                >
                    <FaChevronLeft className="mr-2" /> Previous
                </button>

                <button
                    onClick={handleNext}
                    className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center"
                >
                    {nextLessonId ? 'Complete & Continue' : 'Finish Module'} <FaChevronRight className="ml-2" />
                </button>
            </div>
        </div>
    );
};

export default LessonView;
