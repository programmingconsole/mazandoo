'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Navigation } from 'lucide-react';
import { fetchApi } from '@/utils/api';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // in km
}

export default function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        // Fetch local locations matching query
        let localData: any[] = [];
        const res = await fetchApi(`/locations/?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          localData = await res.json();
        }

        // Fetch global locations matching query from Nominatim
        let combined = [...localData];
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=en`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const parsedGlobal = geoData.map((item: any) => {
              const addr = item.address || {};
              const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || '';
              const state = addr.state || addr.county || '';
              const country = addr.country || '';
              return {
                id: `global-${item.place_id}`,
                city: city || item.display_name.split(',')[0],
                state: state,
                country: country,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                isGlobal: true,
                displayName: item.display_name
              };
            }).filter((loc: any) => loc.city && loc.country);

            // Merge local and global avoiding duplicates
            parsedGlobal.forEach((gLoc: any) => {
              const exists = localData.some(
                (lLoc: any) => lLoc.city.toLowerCase() === gLoc.city.toLowerCase() && lLoc.country.toLowerCase() === gLoc.country.toLowerCase()
              );
              if (!exists) {
                combined.push(gLoc);
              }
            });
          }
        } catch (e) {
          console.warn("Nominatim search failed", e);
        }

        setResults(combined);
        setShowDropdown(combined.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = async (loc: any) => {
    if (loc.isGlobal) {
      setLoading(true);
      try {
        const res = await fetchApi('/locations/', {
          method: 'POST',
          body: JSON.stringify({
            city: loc.city,
            state: loc.state || 'Local Region',
            country: loc.country,
            latitude: loc.latitude.toString(),
            longitude: loc.longitude.toString(),
          })
        });
        if (res.ok) {
          const newLoc = await res.json();
          setQuery(`${newLoc.city}, ${newLoc.country}`);
          setShowDropdown(false);
          router.push(`/location/${newLoc.id}`);
        } else {
          alert('Failed to register this location.');
        }
      } catch (err) {
        console.error(err);
        alert('Error registering location.');
      } finally {
        setLoading(false);
      }
    } else {
      setQuery(`${loc.city}, ${loc.country}`);
      setShowDropdown(false);
      router.push(`/location/${loc.id}`);
    }
  };

  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetchApi('/locations/');
          if (res.ok) {
            const data = await res.json();
            
            // Find nearest location
            let nearestLoc: any = null;
            let minDistance = Infinity;

            data.forEach((loc: any) => {
              const dist = getDistance(latitude, longitude, parseFloat(loc.latitude), parseFloat(loc.longitude));
              if (dist < minDistance) {
                minDistance = dist;
                nearestLoc = loc;
              }
            });

            // If a location is found within 10km, go to it!
            if (nearestLoc && minDistance < 10) {
              setQuery(`${nearestLoc.city}, ${nearestLoc.country}`);
              router.push(`/location/${nearestLoc.id}`);
            } else {
              // Try to reverse geocode name for user context
              let detectedName = '';
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                  { headers: { 'Accept-Language': 'en', 'User-Agent': 'Mazhandoo-Weather-App' } }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  const address = geoData.address;
                  if (address) {
                    detectedName = address.city || address.town || address.village || address.suburb || '';
                  }
                }
              } catch (e) {
                console.warn(e);
              }

              const registerNew = confirm(
                `No registered weather zone found near your GPS position${detectedName ? ` in "${detectedName}"` : ''} (closest registered is ${nearestLoc ? `${nearestLoc.city} - ${minDistance.toFixed(1)}km away` : 'none'}).\n\nWould you like to register a new weather zone for this region?`
              );
              if (registerNew) {
                router.push('/report');
              }
            }
          }
        } catch (err) {
          console.error(err);
          alert('Error finding nearest registered location.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        // Fallback for testing/dev environment using Atholi, India [11.3885, 75.7628]
        console.log("Could not retrieve GPS. Falling back to mock Atholi coords [11.3885, 75.7628]");
        
        const mockLat = 11.3885;
        const mockLon = 75.7628;
        
        const runLocate = async () => {
          try {
            const res = await fetchApi('/locations/');
            if (res.ok) {
              const data = await res.json();
              
              let nearestLoc: any = null;
              let minDistance = Infinity;

              data.forEach((loc: any) => {
                const dist = getDistance(mockLat, mockLon, parseFloat(loc.latitude), parseFloat(loc.longitude));
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestLoc = loc;
                }
              });

              if (nearestLoc && minDistance < 10) {
                setQuery(`${nearestLoc.city}, ${nearestLoc.country}`);
                router.push(`/location/${nearestLoc.id}`);
              } else {
                const registerNew = confirm(
                  `Could not retrieve GPS coordinates. Using Atholi, India fallback.\nNo registered weather zone found near Atholi (closest is ${nearestLoc ? `${nearestLoc.city} - ${minDistance.toFixed(1)}km away` : 'none'}).\n\nWould you like to register a new weather zone for this region?`
                );
                if (registerNew) {
                  router.push('/report');
                }
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setGpsLoading(false);
          }
        };
        runLocate();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto" ref={dropdownRef}>
      <div className="relative flex items-center w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-3.5 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all shadow-lg shadow-slate-100 dark:shadow-none">
        <Search className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(results.length > 0)}
          placeholder="Search locations (e.g. Cape Town, Tokyo)..."
          className="w-full h-full bg-transparent text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
        />
        {loading || gpsLoading ? (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full flex-shrink-0 ml-2" />
        ) : (
          <button
            type="button"
            onClick={handleGpsLocate}
            title="Locate nearest zone using GPS"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors ml-2 flex-shrink-0"
          >
            <Navigation className="h-4 w-4 transform rotate-45" />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-14 left-0 w-full rounded-2xl border border-white/10 glass-panel shadow-xl overflow-hidden z-50">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {results.map((loc) => (
              <li key={loc.id}>
                <button
                  onClick={() => handleSelect(loc)}
                  className="flex items-center w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-sm text-slate-700 dark:text-slate-200"
                >
                  <MapPin className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block flex items-center gap-1.5">
                      {loc.city}
                      {loc.isGlobal && (
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                          Register Zone
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">
                      {loc.state ? `${loc.state}, ` : ''}{loc.country}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
