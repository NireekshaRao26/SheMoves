import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MapPin, Type, Home, FileCheck } from 'lucide-react';

const Questionnaire = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({
        changingCity: false,
        changingSurname: false,
        updatingAddress: false,
        documentsAvailable: [],
    });
    const [loading, setLoading] = useState(false);

    const documentOptions = ['Aadhaar', 'PAN', 'Passport', 'Bank Account'];

    const handleCheckbox = (field) => {
        setAnswers(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleDocumentToggle = (doc) => {
        setAnswers(prev => {
            const currentDocs = prev.documentsAvailable;
            if (currentDocs.includes(doc)) {
                return { ...prev, documentsAvailable: currentDocs.filter(d => d !== doc) };
            } else {
                return { ...prev, documentsAvailable: [...currentDocs, doc] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/roadmap/generate', answers);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert("Error generating roadmap");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Relocation Assessment</h1>
                    <p className="text-gray-500 mt-2">Help us understand your needs to generate a customized roadmap for your document updates.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">What changes are occurring?</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all ${answers.changingCity ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                                <input type="checkbox" className="hidden" checked={answers.changingCity} onChange={() => handleCheckbox('changingCity')} />
                                <div className={`h-6 w-6 rounded-full border flex items-center justify-center mr-4 ${answers.changingCity ? 'bg-pink-500 border-pink-500' : 'border-gray-300'}`}>
                                    {answers.changingCity && <Check className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className={`h-5 w-5 ${answers.changingCity ? 'text-pink-500' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${answers.changingCity ? 'text-pink-700' : 'text-gray-700'}`}>Relocating to a new city</span>
                                </div>
                            </label>

                            <label className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all ${answers.updatingAddress ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                                <input type="checkbox" className="hidden" checked={answers.updatingAddress} onChange={() => handleCheckbox('updatingAddress')} />
                                <div className={`h-6 w-6 rounded-full border flex items-center justify-center mr-4 ${answers.updatingAddress ? 'bg-pink-500 border-pink-500' : 'border-gray-300'}`}>
                                    {answers.updatingAddress && <Check className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Home className={`h-5 w-5 ${answers.updatingAddress ? 'text-pink-500' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${answers.updatingAddress ? 'text-pink-700' : 'text-gray-700'}`}>Updating my address</span>
                                </div>
                            </label>

                            <label className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all ${answers.changingSurname ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
                                <input type="checkbox" className="hidden" checked={answers.changingSurname} onChange={() => handleCheckbox('changingSurname')} />
                                <div className={`h-6 w-6 rounded-full border flex items-center justify-center mr-4 ${answers.changingSurname ? 'bg-pink-500 border-pink-500' : 'border-gray-300'}`}>
                                    {answers.changingSurname && <Check className="h-4 w-4 text-white" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Type className={`h-5 w-5 ${answers.changingSurname ? 'text-pink-500' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${answers.changingSurname ? 'text-pink-700' : 'text-gray-700'}`}>Changing my surname</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-gray-500" />
                            Which of these documents do you currently have?
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {documentOptions.map(doc => {
                                const isSelected = answers.documentsAvailable.includes(doc);
                                return (
                                    <label key={doc} className={`relative flex items-center justify-center p-3 cursor-pointer rounded-xl border-2 transition-all text-center ${isSelected ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold' : 'border-gray-100 hover:border-pink-200 text-gray-600'}`}>
                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleDocumentToggle(doc)} />
                                        <span>{doc}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-pink-500/30 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? 'Generating...' : 'Generate My Roadmap'}
                            {!loading && <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Questionnaire;
