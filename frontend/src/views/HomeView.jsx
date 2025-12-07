import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Award, ArrowRight, User } from 'lucide-react';
import Card from '../components/ui/Card';
import HeroCarousel from '../components/common/HeroCarousel';
import { api } from '../services/api';

const HomeView = ({ navigate, user }) => {
    const [news, setNews] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const newsData = await api.content.getNews();
                setNews(newsData);
                const sponsorsData = await api.content.getSponsors();
                setSponsors(sponsorsData);
            } catch (err) {
                console.error("Error loading home content", err);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    return (
        <div className="space-y-16 animate-fadeIn pb-12">
            {/* Hero Section (Carousel) */}
            <HeroCarousel navigate={navigate} user={user} />

            {/* Key Dates Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="bg-green-100 p-4 rounded-full text-green-800 mb-4"><FileText size={32} /></div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Envío de Abstracts</h3>
                    <p className="text-gray-700">Hasta el 15 de Marzo</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="bg-orange-100 p-4 rounded-full text-orange-800 mb-4"><CheckCircle size={32} /></div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Resultados</h3>
                    <p className="text-gray-700">30 de Abril</p>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="bg-purple-100 p-4 rounded-full text-purple-800 mb-4"><Award size={32} /></div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Premiación</h3>
                    <p className="text-gray-700">27 de Junio</p>
                </div>
            </section>

            {/* Sponsors Section */}
            <section>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Auspiciadores y Patrocinadores</h2>
                    <p className="text-gray-600">Agradecemos el apoyo institucional y académico</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-wrap justify-center items-center gap-12 md:gap-20 grayscale hover:grayscale-0 transition-all duration-500">
                    {sponsors.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
                            <div className="h-16 w-16 md:h-20 md:w-20 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-xl">
                                {s.logo}
                            </div>
                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-800 transition-colors max-w-[120px] text-center">{s.name}</span>
                        </div>
                    ))}
                    {loading && sponsors.length === 0 && <span className="text-gray-400">Cargando...</span>}
                </div>
            </section>

            {/* News Section */}
            <section>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Noticias y Avisos</h2>
                        <p className="text-gray-600 mt-1">Mantente al día con las últimas novedades del evento.</p>
                    </div>
                    <button className="text-blue-700 font-bold hover:underline text-sm hidden md:block">Ver todas las noticias</button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    {news.map(item => (
                        <Card key={item.id} className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-blue-600">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{item.date}</span>
                                <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">{item.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{item.excerpt}</p>
                        </Card>
                    ))}
                    {loading && news.length === 0 && <div className="col-span-2 text-center text-gray-400">Cargando noticias...</div>}
                </div>
            </section>
        </div>
    );
};

export default HomeView;
