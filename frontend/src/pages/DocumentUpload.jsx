import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { UploadCloud, File, X, CheckCircle2, RotateCw } from 'lucide-react';

const DocumentUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState('Aadhaar');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [extracted, setExtracted] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSuccess(false);
            setExtracted(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', documentType);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setExtracted(res.data.document.extractedData);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Upload Documents</h1>
                    <p className="text-gray-500 mt-2">Securely store your documents and extract key details via OCR.</p>
                </div>

                {!success ? (
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Document Type</label>
                            <select
                                value={documentType}
                                onChange={e => setDocumentType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                            >
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="PAN">PAN Card</option>
                                <option value="Passport">Passport</option>
                                <option value="Marriage Certificate">Marriage Certificate</option>
                                <option value="Address Proof">Address Proof</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Upload File</label>

                            <div className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${file ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 bg-gray-50/50'}`}>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <File className="h-8 w-8 text-pink-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-white rounded-full shadow-sm mb-2">
                                            <UploadCloud className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Click to upload or drag and drop</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <RotateCw className="h-5 w-5 animate-spin" /> Analyzing Document...
                                </>
                            ) : (
                                <>Upload & Extract</>
                            )}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6 py-4"
                    >
                        <div className="inline-flex items-center justify-center p-4 bg-green-50 text-green-500 rounded-full border-4 border-green-100 mb-2">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Upload Successful!</h3>
                            <p className="text-gray-500 mt-1">We've extracted the following details.</p>
                        </div>

                        {extracted && (
                            <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                                {Object.entries(extracted).map(([k, v]) => {
                                    if (!v) return null;
                                    return (
                                        <div key={k} className="mb-3 last:mb-0">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{k === 'rawText' ? 'Extracted Text Snapshot' : k}</p>
                                            <p className={`text-sm text-gray-800 ${k === 'rawText' ? 'font-mono bg-white p-3 rounded-lg border text-xs h-24 overflow-y-auto' : 'font-medium'}`}>{v}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => { setFile(null); setSuccess(false); setExtracted(null); }}
                                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Upload Another
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition-colors shadow-md shadow-pink-200"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default DocumentUpload;
