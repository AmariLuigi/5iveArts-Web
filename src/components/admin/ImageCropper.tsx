import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, RotateCcw, Box } from 'lucide-react';

interface ImageCropperProps {
    file: File;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ file, onCropComplete, onCancel }: ImageCropperProps) {
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    useEffect(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
    }, [file]);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        // Default to a 1:1 aspect ratio crop in the center
        const initialCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                1,
                width,
                height
            ),
            width,
            height
        );
        setCrop(initialCrop);
    }

    async function handleConfirm() {
        if (!imgRef.current || !completedCrop) return;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob((blob) => {
            if (blob) onCropComplete(blob);
        }, 'image/jpeg', 0.95);
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
            <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden flex flex-col h-full max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center">
                            <Box className="w-4 h-4 text-brand-yellow" />
                        </div>
                        <div>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white">Precision Crop Engine</h3>
                            <p className="text-[8px] uppercase font-bold text-neutral-600 tracking-widest mt-0.5">Adjust framing to remove watermarks or optimize display</p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-600 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-[#050505] bg-dot-grid">
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={undefined} // Allow free cropping for watermarks
                            className="max-h-full"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop preview"
                                src={imgSrc}
                                onLoad={onImageLoad}
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>

                <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            type="button"
                            onClick={() => setCrop(undefined)}
                            className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-neutral-600 hover:text-white transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Protocol
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500 hover:text-white transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="hasbro-btn-primary px-10 py-4 flex items-center gap-3"
                        >
                            <Check className="w-4 h-4 text-black" />
                            <span className="text-black font-black text-[10px] uppercase tracking-widest">Commit Crop</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
