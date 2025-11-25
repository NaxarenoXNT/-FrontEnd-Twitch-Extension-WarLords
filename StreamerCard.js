import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, Users, Sword, Heart } from 'lucide-react';
import { cargarStreamersYPersonajes } from './api.js';

const StreamerCards = () => {
  const [streamersData, setStreamersData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await cargarStreamersYPersonajes();
        setStreamersData(data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    fetchData();
  }, []);

  const mejorarStat = async (tipo, personajeId) => {
    try {
      const personaje = streamersData.find(s => s.personaje?.id === personajeId)?.personaje;
      if (!personaje) return;

      const nuevaVida = tipo === 'vida' ? personaje.puntos_de_vida + 10 : personaje.puntos_de_vida;
      const nuevoAtaque = tipo === 'ataque' ? personaje.ataque + 5 : personaje.ataque;

      const response = await fetch(`${API_BASE_URL}/api/personajes/${personajeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          puntos_de_vida: nuevaVida,
          ataque: nuevoAtaque
        })
      });

      if (!response.ok) throw new Error('Error al actualizar personaje');
      
      const updatedData = await cargarStreamersYPersonajes();
      setStreamersData(updatedData);
    } catch (error) {
      console.error('Error al mejorar stat:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {streamersData.map((streamer) => (
        <Card key={streamer.to_id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
              <img
                src="/api/placeholder/64/64"
                alt={`${streamer.to_name}'s avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">{streamer.to_name}</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Seguido desde: {new Date(streamer.followed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Puntos del canal: 1000
                </span>
              </div>

              {streamer.personaje && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Personaje del Streamer</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Vida: {streamer.personaje.puntos_de_vida}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sword className="w-4 h-4 text-orange-500" />
                      <span>Ataque: {streamer.personaje.ataque}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => mejorarStat('vida', streamer.personaje.id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Mejorar Vida
                    </button>
                    <button
                      onClick={() => mejorarStat('ataque', streamer.personaje.id)}
                      className="flex-1 bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors text-sm"
                    >
                      Mejorar Ataque
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StreamerCards;