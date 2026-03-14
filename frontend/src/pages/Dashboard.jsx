import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink, Play, FileText, ChevronRight, MapPin } from 'lucide-react';

const Dashboard = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [roadmapRes, docsRes] = await Promise.all([
                api.get('/roadmap').catch(() => ({ data: null })),
                api.get('/upload').catch(() => ({ data: [] }))
            ]);
            setRoadmap(roadmapRes.data);
            setDocuments(docsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = async (itemId, currentStatus) => {
        if (!roadmap) return;
        try {
            const res = await api.put(`/roadmap/${roadmap._id}/item/${itemId}`, { completed: !currentStatus });
            setRoadmap(res.data);
        } catch (error) {
            console.error('Failed to update item status');
        }
    };

    const handleAutoFill = async (item) => {
        const serviceName = item?.serviceName;
        // Find the best document to use for autofill (preferring Aadhaar or PAN)
        const relevantDoc = documents.find(d => 
            d.documentType?.toLowerCase().includes('aadhaar') || 
            d.documentType?.toLowerCase().includes('pan')
        ) || documents[0];

        if (!relevantDoc) {
            alert('Upload at least one document before starting auto-fill.');
            return;
        }

        const userData = {
            name: relevantDoc.extractedData.name,
            dob: relevantDoc.extractedData.dob,
            address: relevantDoc.extractedData.address,
            aadhaarNumber: relevantDoc.extractedData.aadhaarNumber,
            panNumber: relevantDoc.extractedData.panNumber
        };

        alert(`Starting Auto-Fill for ${serviceName} using data from ${relevantDoc.documentType}...`);
        
        try {
            await api.post('/automation/run', {
                serviceName,
                userData,
                officialPortalLink: item?.officialPortalLink
            });
            alert('Automation request sent. Check the opened browser window.');
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || 'Failed to start automation. Ensure backend and automation server are running.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    const completedCount = roadmap?.checklist.filter(i => i.completed).length || 0;
    const totalCount = roadmap?.checklist.length || 0;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Your Action Plan</h1>
                    <p className="text-gray-500 mt-1">Complete these steps to update your documents.</p>
                </div>
                {roadmap && (
                    <div className="text-right">
                        <span className="text-2xl font-bold text-pink-500">{progress}%</span>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Completed</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Roadmap Column */}
                <div className="lg:col-span-2 space-y-4">
                    {roadmap?.checklist?.length > 0 ? roadmap.checklist.map((item, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={item._id}
                            className={`bg-white rounded-2xl p-6 border-l-4 shadow-sm hover:shadow-md transition-shadow ${item.completed ? 'border-l-green-500 opacity-70' : 'border-l-pink-500'}`}
                        >
                            <div className="flex items-start gap-4">
                                <button onClick={() => toggleItem(item._id, item.completed)} className="mt-1 flex-shrink-0">
                                    {item.completed ?
                                        <CheckCircle2 className="h-6 w-6 text-green-500 hover:text-green-600 transition-colors" /> :
                                        <Circle className="h-6 w-6 text-gray-300 hover:text-pink-500 transition-colors" />
                                    }
                                </button>

                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.step && (
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center">
                                                {item.step}
                                            </span>
                                        )}
                                        <h3 className={`text-lg font-bold ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                            {item.serviceName}
                                        </h3>
                                    </div>

                                    {item.description && (
                                        <p className={`text-sm leading-relaxed whitespace-pre-line mt-2 mb-3 ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {item.description}
                                        </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.requiredDocuments.map((doc, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                                                Needs: {doc}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 items-end">
                                    {item.officialPortalLink && item.officialPortalLink.startsWith('http') ? (
                                        <>
                                            <a
                                                href={item.officialPortalLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200"
                                            >
                                                Portal <ExternalLink className="h-3.5 w-3.5" />
                                            </a>

                                            <button
                                                onClick={() => handleAutoFill(item)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-semibold rounded-lg transition-colors border border-pink-200 shadow-sm"
                                                title="Demonstrate Auto-fill via Puppeteer"
                                                disabled={item.completed}
                                            >
                                                <Play className="h-3.5 w-3.5 fill-pink-600" /> Auto-Fill
                                            </button>
                                        </>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg border border-gray-200">
                                            <MapPin className="h-3.5 w-3.5 text-gray-500" /> Offline Step
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                            <h3 className="text-gray-800 font-medium mb-2">No Roadmap Generated</h3>
                            <p className="text-gray-500 mb-4 text-sm">Please answer the questionnaire to generate your relocation checklist.</p>
                            <a href="/questionnaire" className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium text-sm">
                                Go to Questionnaire <ChevronRight className="h-4 w-4" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Documents Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">My Documents</h3>
                            <a href="/upload" className="text-sm font-medium text-pink-600 hover:text-pink-700">Add New</a>
                        </div>
                        <div className="p-4 space-y-3">
                            {documents.length > 0 ? documents.map(doc => (
                                <div key={doc._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-semibold text-gray-800 text-sm">{doc.documentType}</h4>
                                        {Object.entries(doc.extractedData).map(([k, v]) => {
                                            if (!v || k === 'rawText') return null;
                                            return <p key={k} className="text-xs text-gray-500 truncate"><span className="capitalize font-medium">{k}</span>: {v}</p>
                                        })}
                                        {/* Display a snippet of raw text if others are empty for demo */}
                                        {doc.extractedData.rawText && !doc.extractedData.name && !doc.extractedData.dob && (
                                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{doc.extractedData.rawText}</p>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-gray-400 py-4">No documents uploaded yet.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
