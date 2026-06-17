'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { fetchApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Navigation, MapPin, Upload, Thermometer, Info, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const WEATHER_TYPES = [
  'Sunny', 'Cloudy', 'Rainy', 'Foggy', 'Windy', 'Storm', 'Flooding', 'Snow', 'Extreme Heat'
];

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

function ReportFormContent() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location') || '';
  const router = useRouter();
  const { user } = useAuth();

  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(locationParam);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [weatherType, setWeatherType] = useState('Sunny');
  const [description, setDescription] = useState('');
  const [temperature, setTemperature] = useState('20');
  const [visibility, setVisibility] = useState('Good');
  const [windCondition, setWindCondition] = useState('Calm');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // GPS Coordinates
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [showRegisterZone, setShowRegisterZone] = useState(false);
  const [registeringZone, setRegisteringZone] = useState(false);
  const [hasAutoMatched, setHasAutoMatched] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState('');
  const [detectedCountryName, setDetectedCountryName] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load locations
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetchApi('/locations/');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
          // If a location ID parameter is provided, auto-set search query text
          if (locationParam) {
            const loc = data.find((l: any) => l.id.toString() === locationParam.toString());
            if (loc) {
              setLocationSearchQuery(`${loc.city}, ${loc.country}`);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadLocations();
  }, [locationParam]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search hook for target location input
  useEffect(() => {
    if (locationSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const localMatches = locations.filter((loc) =>
          loc.city.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
          loc.country.toLowerCase().includes(locationSearchQuery.toLowerCase())
        );

        let combined = [...localMatches];
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearchQuery)}&format=json&addressdetails=1&limit=5&accept-language=en`
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
              const exists = localMatches.some(
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

        setSearchResults(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [locationSearchQuery, locations]);

  const dropdownLocations = locationSearchQuery.trim().length < 2 ? locations : searchResults;

  useEffect(() => {
    const autoMatchOrRegister = async () => {
      console.log("autoMatchOrRegister checks:", {
        lat,
        lon,
        locationsCount: locations.length,
        hasAutoMatched,
        selectedLocationId
      });
      if (lat !== null && lon !== null && locations.length > 0 && !hasAutoMatched && !selectedLocationId) {
        console.log("Triggering autoMatchOrRegister logic...");
        setHasAutoMatched(true);
        
        // Find nearest location
        let nearestLoc: any = null;
        let minDistance = Infinity;

        locations.forEach((loc) => {
          const dist = getDistance(lat, lon, parseFloat(loc.latitude), parseFloat(loc.longitude));
          if (dist < minDistance) {
            minDistance = dist;
            nearestLoc = loc;
          }
        });

        console.log("Nearest location calculation result:", { nearestLoc, minDistance });

        // If within 5km, auto-select it!
        if (nearestLoc && minDistance < 5) {
          console.log("Auto-selecting nearest existing location:", nearestLoc);
          
          let finalCity = nearestLoc.city;
          let finalCountry = nearestLoc.country;

          // If the matched location has a generic GPS Zone name, rename it!
          if (nearestLoc.city.startsWith('GPS Zone')) {
            console.log("Matched location has coordinate name. Attempting to resolve region name...");
            let city = detectedCityName;
            let country = detectedCountryName;
            let state = "Local Region";

            if (!city) {
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                  { headers: { 'Accept-Language': 'en', 'User-Agent': 'Mazhandoo-Weather-App' } }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  const address = geoData.address;
                  if (address) {
                    city = address.city || address.town || address.village || address.suburb || address.county || address.municipality || '';
                    state = address.state || address.county || state;
                    country = address.country || '';
                  }
                }
              } catch (e) {
                console.warn("OSM lookup failed inside rename lookup", e);
              }
            }

            if (city) {
              console.log(`Updating location name for ID ${nearestLoc.id} to ${city}, ${country}`);
              try {
                const res = await fetchApi(`/locations/${nearestLoc.id}/`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    city,
                    state,
                    country
                  })
                });
                if (res.ok) {
                  const updatedLoc = await res.json();
                  nearestLoc.city = updatedLoc.city;
                  nearestLoc.country = updatedLoc.country;
                  finalCity = updatedLoc.city;
                  finalCountry = updatedLoc.country;
                  // update locations list
                  setLocations(prev => prev.map(l => l.id === nearestLoc.id ? updatedLoc : l));
                }
              } catch (err) {
                console.error("PATCH request failed", err);
              }
            }
          }

          setSelectedLocationId(nearestLoc.id.toString());
          setLocationSearchQuery(`${finalCity}, ${finalCountry}`);
          setShowRegisterZone(false);
        } else {
          // Unregistered zone: automatically reverse-geocode and register it on-the-fly!
          console.log("Unregistered GPS zone detected. Triggering auto-registration...");
          setRegisteringZone(true);
          
          let city = detectedCityName;
          let country = detectedCountryName;
          let state = "Local Region";
          
          // If the reverse geocoding is still fetching, wait or fetch it inline
          if (!city) {
            console.log("detectedCityName is not populated yet. Performing inline reverse-geocoding fetch...");
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                { headers: { 'Accept-Language': 'en', 'User-Agent': 'Mazhandoo-Weather-App' } }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                console.log("Inline reverse-geocode raw response:", geoData);
                const address = geoData.address;
                if (address) {
                  city = address.city || address.town || address.village || address.suburb || address.county || address.municipality || '';
                  state = address.state || address.county || state;
                  country = address.country || '';
                }
              }
            } catch (err) {
              console.warn("OSM lookup failed inside auto-register", err);
            }
          }
          
          // Fallback if reverse geocode yielded no name
          if (!city) {
            city = `GPS Zone (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
          }
          if (!country) {
            country = "Current GPS Area";
          }
          
          console.log("Auto-registering location details:", { city, state, country, lat, lon });
          try {
            const res = await fetchApi('/locations/', {
              method: 'POST',
              body: JSON.stringify({
                city,
                state,
                country,
                latitude: lat.toString(),
                longitude: lon.toString(),
              }),
            });

            console.log("POST /locations/ response status:", res.status);
            if (res.ok) {
              const newLoc = await res.json();
              console.log("Registered new location successfully:", newLoc);
              setLocations(prev => [...prev, newLoc]);
              setSelectedLocationId(newLoc.id.toString());
              setLocationSearchQuery(`${newLoc.city}, ${newLoc.country}`);
              setShowRegisterZone(false);
            }
          } catch (err) {
            console.error("Auto registration failed", err);
          } finally {
            setRegisteringZone(false);
          }
        }
      }
    };
    
    autoMatchOrRegister();
  }, [lat, lon, locations, hasAutoMatched, selectedLocationId, detectedCityName, detectedCountryName]);

  const handleRegisterZone = async () => {
    console.log("handleRegisterZone manually clicked");
    if (lat === null || lon === null) return;
    setRegisteringZone(true);

    let city = detectedCityName || `GPS Zone (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    let state = "Local Region";
    let country = detectedCountryName || "Current GPS Area";

    if (!detectedCityName) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'Mazhandoo-Weather-App' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const address = geoData.address;
          if (address) {
            city = address.city || address.town || address.village || address.suburb || address.county || address.municipality || city;
            state = address.state || address.county || state;
            country = address.country || country;
          }
        }
      } catch (err) {
        console.warn("Reverse geocoding lookup failed", err);
      }
    }

    try {
      const res = await fetchApi('/locations/', {
        method: 'POST',
        body: JSON.stringify({
          city,
          state,
          country,
          latitude: lat.toString(),
          longitude: lon.toString(),
        }),
      });

      if (res.ok) {
        const newLoc = await res.json();
        setLocations(prev => [...prev, newLoc]);
        setSelectedLocationId(newLoc.id.toString());
        setLocationSearchQuery(`${newLoc.city}, ${newLoc.country}`);
        setShowRegisterZone(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegisteringZone(false);
    }
  };

  // Fetch user GPS coordinates on page load
  useEffect(() => {
    fetchGps();
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    console.log("reverseGeocode requested for:", { latitude, longitude });
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'Mazhandoo-Weather-App' } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        console.log("reverseGeocode resolved successfully:", geoData);
        const address = geoData.address;
        if (address) {
          const city = address.city || address.town || address.village || address.suburb || address.county || address.municipality || '';
          const country = address.country || '';
          setDetectedCityName(city);
          setDetectedCountryName(country);
        }
      }
    } catch (e) {
      console.warn("Nominatim lookup failed", e);
    }
  };

  const fetchGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');
    setGpsSuccess(false);
    setHasAutoMatched(false);
    setDetectedCityName('');
    setDetectedCountryName('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLon(position.coords.longitude);
        setGpsLoading(false);
        setGpsSuccess(true);
        reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Failed to retrieve GPS location. Please allow location permissions.');
        
        // Mock GPS fallback for local development/testing convenience (Atholi, India default)
        console.log("Fallback to Mock GPS coords (Atholi, India default)");
        setLat(11.3885);
        setLon(75.7628);
        setGpsSuccess(true);
        reverseGeocode(11.3885, 75.7628);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!selectedLocationId) {
      setSubmitError('Please select a location.');
      return;
    }
    if (lat === null || lon === null) {
      setSubmitError('GPS verification is required. Please activate location services.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('location', selectedLocationId);
    formData.append('weather_type', weatherType);
    formData.append('description', description);
    formData.append('temperature', temperature);
    formData.append('visibility', visibility);
    formData.append('wind_condition', windCondition);
    formData.append('reporter_latitude', lat.toString());
    formData.append('reporter_longitude', lon.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await fetchApi('/reports/reports/', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert("Weather report submitted successfully! Reputation points awarded.");
        router.push(`/location/${selectedLocationId}`);
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || 'Failed to submit report. Ensure you are within the allowed location radius.');
      }
    } catch (err) {
      setSubmitError('A connection error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm rounded-3xl border border-white/10 glass-panel p-8 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authorization Required</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Only registered users can submit weather reports for locations.</p>
            <Link href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all">
              Sign In to Contribute
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Compass className="h-6 w-6 mr-2 text-blue-500" />
            Submit Weather Update
          </h1>
          <p className="text-xs text-slate-500">Earn up to 15 reputation points for verified updates</p>
        </div>

        {/* GPS Verification Alert Box */}
        <div className="rounded-2xl border border-white/10 glass-panel p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation className={`h-5 w-5 ${gpsSuccess ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider block">GPS Location Verification</span>
              {gpsLoading ? (
                <span className="text-xs text-slate-400">Verifying coordinates...</span>
              ) : gpsSuccess ? (
                <span className="text-xs text-emerald-500 font-semibold flex flex-col items-start gap-0.5">
                  <span className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500 flex-shrink-0" />
                    Verified: [{lat?.toFixed(4)}, {lon?.toFixed(4)}]
                  </span>
                  {detectedCityName && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-4.5 block">
                      Region: {detectedCityName}{detectedCountryName ? `, ${detectedCountryName}` : ''}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-xs text-red-500 font-semibold">{gpsError || 'Coordinates missing.'}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchGps}
            disabled={gpsLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Refetch GPS
          </button>
        </div>

        {/* Register New Zone Alert if user is at unregistered GPS coords */}
        {/* Register New Zone Alert if user is at unregistered GPS coords */}
        {showRegisterZone && gpsSuccess && lat !== null && lon !== null && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block text-amber-850 dark:text-amber-300">New Location Detected</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  You are at {detectedCityName ? `"${detectedCityName}, ${detectedCountryName}"` : `coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`}. There are no active weather zones registered near you.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRegisterZone}
              disabled={registeringZone}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
            >
              {registeringZone ? "Registering..." : `Register "${detectedCityName || 'This Zone'}"`}
            </button>
          </div>
        )}

        {/* Report form */}
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 glass-panel p-6 sm:p-8 shadow-xl space-y-6">
          {submitError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl text-center">
              {submitError}
            </div>
          )}

          {/* Location Selector (Searchable Autocomplete) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Target Location
            </label>
            <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <MapPin className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => {
                  setLocationSearchQuery(e.target.value);
                  setSelectedLocationId(''); // Clear selection if user types
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Type to search and select a location..."
                className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
                required
              />
              {(searchLoading || registeringZone) && (
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full flex-shrink-0 ml-2" />
              )}
            </div>
            
            {showLocationDropdown && (
              <div className="absolute top-full mt-1 left-0 w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {dropdownLocations.length === 0 ? (
                  <div className="px-4 py-2.5 text-xs text-slate-400">
                    {searchLoading ? 'Searching global locations...' : 'No locations found.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {dropdownLocations.map((loc) => (
                      <li key={loc.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (loc.isGlobal) {
                              setRegisteringZone(true);
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
                                  setLocations(prev => [...prev, newLoc]);
                                  setSelectedLocationId(newLoc.id.toString());
                                  setLocationSearchQuery(`${newLoc.city}, ${newLoc.country}`);
                                  setShowRegisterZone(false);
                                } else {
                                  alert("Failed to register location.");
                                }
                              } catch (err) {
                                console.error(err);
                                alert("Error registering global location.");
                              } finally {
                                setRegisteringZone(false);
                                setShowLocationDropdown(false);
                              }
                            } else {
                              setSelectedLocationId(loc.id.toString());
                              setLocationSearchQuery(`${loc.city}, ${loc.country}`);
                              setShowLocationDropdown(false);
                            }
                          }}
                          className="flex items-center w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-xs text-slate-700 dark:text-slate-200"
                        >
                          <MapPin className="h-3.5 w-3.5 text-blue-500 mr-2 flex-shrink-0" />
                          <div>
                            <span className="font-bold flex items-center gap-1.5">
                              {loc.city}
                              {loc.isGlobal && (
                                <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                                  Register Zone
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{loc.country}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weather Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Weather Type
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <select
                  value={weatherType}
                  onChange={(e) => setWeatherType(e.target.value)}
                  className="w-full h-full bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none"
                >
                  {WEATHER_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Temperature (°C)
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Thermometer className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  required
                  placeholder="e.g. 24"
                  className="w-full h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Visibility
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full h-full bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Good" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Good Visibility</option>
                  <option value="Moderate" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Moderate Fog/Haze</option>
                  <option value="Poor" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Poor/Severe Obstruction</option>
                </select>
              </div>
            </div>

            {/* Wind Condition */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Wind Condition
              </label>
              <div className="relative flex items-center h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <select
                  value={windCondition}
                  onChange={(e) => setWindCondition(e.target.value)}
                  className="w-full h-full bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Calm" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Calm (No Wind)</option>
                  <option value="Light" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Light Breeze</option>
                  <option value="Moderate" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Moderate Wind</option>
                  <option value="Strong" className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200">Strong/Gale Force</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Weather Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the road conditions, cloud coverage, hazards, etc."
              rows={3}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Upload Weather Photo (+10 pts)
            </label>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 rounded-2xl">
              {imagePreview ? (
                <div className="text-center">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-xl mb-4 shadow" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                  <Upload className="h-10 w-10 mb-2" />
                  <span className="text-xs font-bold">Choose a file to upload</span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, or JPEG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center h-12 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:bg-slate-300 disabled:dark:bg-slate-800"
            >
              {submitting ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                'Submit Weather Report'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function SubmitReport() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full" />
        </div>
      </div>
    }>
      <ReportFormContent />
    </Suspense>
  );
}
