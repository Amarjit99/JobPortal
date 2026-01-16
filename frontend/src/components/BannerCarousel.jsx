import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const BannerCarousel = ({ targetAudience = 'all' }) => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, [targetAudience]);

    useEffect(() => {
        if (banners.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // Auto-slide every 5 seconds

        return () => clearInterval(interval);
    }, [banners.length]);

    const fetchBanners = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/banners/active?targetAudience=${targetAudience}`);
            if (res.data.success && res.data.banners.length > 0) {
                setBanners(res.data.banners);
            }
        } catch (error) {
            console.error('Failed to fetch banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerClick = async (banner) => {
        if (banner.link) {
            // Record click
            try {
                await axios.post(`http://localhost:8000/api/v1/banners/${banner._id}/click`);
            } catch (error) {
                console.error('Failed to record click:', error);
            }
            
            // Open link
            window.open(banner.link, '_blank');
        }
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    if (loading || banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg mb-8">
            <div
                className="relative h-64 md:h-80 cursor-pointer"
                style={{
                    backgroundColor: currentBanner.backgroundColor,
                    color: currentBanner.textColor
                }}
                onClick={() => handleBannerClick(currentBanner)}
            >
                <img
                    src={currentBanner.image}
                    alt={currentBanner.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                    <h2 className="text-3xl font-bold text-white mb-2">{currentBanner.title}</h2>
                    {currentBanner.subtitle && (
                        <p className="text-lg text-white/90 mb-4">{currentBanner.subtitle}</p>
                    )}
                    {currentBanner.link && (
                        <Button variant="secondary" className="w-fit">
                            {currentBanner.linkText}
                        </Button>
                    )}
                </div>
            </div>

            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BannerCarousel;
