// src/pages/DeliveryLocationPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

// --- Configuration ---
// !!! IMPORTANT: Replace with your ACTUAL restaurant coordinates !!!
const RESTAURANT_LAT = 41.72051; // Your coordinates
const RESTAURANT_LNG = 44.72121; // Your coordinates
// -------------------------------------------------------------
const DELIVERY_RADIUS_METERS = 5000; // 5km
const TIER_1_BOUNDARY_METERS = 2500; // 2.5km
const TIER_1_FEE = 3; // 3 GEL
const TIER_2_FEE = 5; // 5 GEL
// -------------------------------------------------------------
const MAP_CENTER = { lat: RESTAURANT_LAT, lng: RESTAURANT_LNG };
const MAP_ZOOM = 14;
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '350px',
  borderRadius: '0.375rem',
  border: '1px solid #4B5563', // gray-600
};
const libraries: ('places' | 'geometry' | 'geocoding' | 'routes')[] = ['places', 'geometry', 'geocoding', 'routes'];
// --- End Configuration ---

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const [userAddress, setUserAddress] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // --- CHANGE 1: Add state for deliveryFee ---
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Load Google Maps Script
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  // Initialize Geocoder once map script is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      setGeocoder(new google.maps.Geocoder());
      setIsMapLoading(false);
    }
  }, [isLoaded]);

  // --- Utility: Check Distance using Distance Matrix Service ---
  const checkDistanceWithService = useCallback((destination: { lat: number; lng: number }) => {
    if (!isLoaded || !window.google || !destination) {
      console.warn("Google Maps script not ready or destination missing.");
      setErrorMessage("Map service not ready. Please wait or try again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsWithinRadius(null);
    setDistanceText(null);
    setDeliveryFee(0); // Reset fee

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [MAP_CENTER],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        setIsLoading(false);
        if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];
          const distanceInMeters = element.distance.value;
          const distanceKm = (distanceInMeters / 1000).toFixed(1);

          setDistanceText(`${distanceKm} km`);
          const within = distanceInMeters <= DELIVERY_RADIUS_METERS;
          setIsWithinRadius(within);

          if (within) {
            // --- CHANGE 2: Tiered Fee Logic ---
            if (distanceInMeters <= TIER_1_BOUNDARY_METERS) {
              setDeliveryFee(TIER_1_FEE); // 0 - 2.5km
            } else {
              setDeliveryFee(TIER_2_FEE); // 2.5km - 5km
            }
          } else {
            // Outside radius
            setDeliveryFee(0);
            setErrorMessage(`Sorry, that location is approximately ${distanceKm}km driving distance away, outside our ${DELIVERY_RADIUS_METERS / 1000}km radius.`);
          }
        } else {
          setErrorMessage('Could not calculate driving distance. Please check the location or try again.');
          console.error('Distance Matrix failed:', status, response);
          setIsWithinRadius(null);
        }
      }
    );
  }, [isLoaded]); // Depend on isLoaded

  // --- Map Event Handlers (onLoad, onUnmount, onMapClick, onMarkerDragEnd) ---
  // (These functions are unchanged from your provided code)
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng && geocoder) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      setErrorMessage('');
      geocoder.geocode({ location: newPosition }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setUserAddress(results[0].formatted_address);
        } else {
          setUserAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          console.warn('Reverse geocode failed:', status);
        }
        checkDistanceWithService(newPosition);
      });
    }
  }, [geocoder, checkDistanceWithService]);

  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
     if (event.latLng && geocoder) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      setErrorMessage('');
       geocoder.geocode({ location: newPosition }, (results, status) => {
         if (status === 'OK' && results && results[0]) {
           setUserAddress(results[0].formatted_address);
         } else {
           setUserAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
           console.warn('Reverse geocode failed:', status);
         }
         checkDistanceWithService(newPosition);
       });
    }
  }, [geocoder, checkDistanceWithService]);
  // --- End Unchanged Map Handlers ---

  // --- Address Input Geocoding (handleCheckAddress) ---
  // (This function is unchanged from your provided code)
  const handleCheckAddress = useCallback(() => {
    if (!userAddress || !geocoder) return;
    setErrorMessage('');
    setIsLoading(true);
    geocoder.geocode({ address: userAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const newPosition = { lat, lng };
        setMarkerPosition(newPosition);
        mapRef.current?.panTo(newPosition);
        mapRef.current?.setZoom(16);
        checkDistanceWithService(newPosition);
      } else {
        setErrorMessage('Could not find location for the address entered. Please try again or place a pin on the map.');
        setIsLoading(false);
        setMarkerPosition(null);
        setIsWithinRadius(null);
        setDistanceText(null);
      }
    });
  }, [userAddress, geocoder, checkDistanceWithService]);
  // --- End Unchanged Function ---

  // --- Navigation ---
  const handleProceedToOrder = () => {
    if (isWithinRadius && (userAddress || markerPosition)) {
      const finalAddress = userAddress || `Location (${markerPosition?.lat.toFixed(4)}, ${markerPosition?.lng.toFixed(4)})`;
      // --- CHANGE 3: Pass deliveryFee in navigation state ---
      navigate('/order', {
        state: {
          isDelivery: true,
          deliveryAddress: finalAddress,
          deliveryFee: deliveryFee // <-- Pass the calculated fee
        }
      });
    }
  };

  // --- Loading/Error states (unchanged) ---
  if (loadError) {
    return <div className="text-red-500 text-center p-8">Error loading Google Maps script. Please check your API key setup and internet connection.</div>;
  }
  if (!isLoaded || isMapLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white"><Loader2 className="animate-spin h-8 w-8 mr-2" /> Loading Map...</div>;
  }

  // --- Main Render ---
  return (
    <div className="flex justify-center items-start py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
            <MapPin className="w-6 h-6" /> Delivery Location
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter your address or click/drag the pin on the map to check if you're within our 5km driving distance radius.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Map (unchanged) */}
          <div style={MAP_CONTAINER_STYLE} className="bg-gray-700 flex items-center justify-center">
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  zoomControl: true,
                }}
              >
                <MarkerF position={MAP_CENTER} title="Saucer Burger" />
                {markerPosition && (
                  <MarkerF
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                  />
                )}
              </GoogleMap>
          </div>

          {/* Address Input (unchanged) */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
              Enter Delivery Address or Place Pin
            </label>
            <div className="flex gap-2">
              <Input
                id="address"
                type="text"
                placeholder="e.g., 123 Petre Kavtaradze St, Tbilisi"
                value={userAddress}
                onChange={(e) => {
                  setUserAddress(e.target.value);
                  setIsWithinRadius(null);
                  setDistanceText(null);
                  setErrorMessage('');
                }}
                className="flex-grow bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCheckAddress(); }}
              />
              <Button
                onClick={handleCheckAddress}
                disabled={!userAddress || isLoading || !geocoder}
                className="bg-amber-600 hover:bg-amber-700 shrink-0 w-[80px]"
              >
                {isLoading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Check'}
              </Button>
            </div>
          </div>

          {/* --- Results Display Area --- */}
          {isLoading && !errorMessage && (
            <div className="text-center text-amber-400">
                <Loader2 className="animate-spin h-5 w-5 inline mr-2" />Calculating distance...
            </div>
          )}
          {/* --- CHANGE 4: Updated Button Text --- */}
          {!isLoading && isWithinRadius === true && distanceText !== null && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-md text-center space-y-3">
              <p className="font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Great! You're within the delivery radius.
              </p>
              <p className="text-sm">(Approximately {distanceText} driving distance)</p>
              <Button
                onClick={handleProceedToOrder}
                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
              >
                {/* Updated text to show the fee */}
                Confirm Address & Add ₾{deliveryFee.toFixed(2)} Delivery Fee
              </Button>
            </div>
          )}
          {/* --- End Change 4 --- */}
          
          {!isLoading && isWithinRadius === false && errorMessage && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">
              <p className="font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" /> Outside Delivery Zone
              </p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          )}
          {!isLoading && isWithinRadius === null && errorMessage && (
             <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">
                 <p className="font-semibold flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Error
                 </p>
                <p className="text-sm mt-1">{errorMessage}</p>
             </div>
          )}

          {/* Back Link (unchanged) */}
          <div className="text-center pt-4 border-t border-gray-700">
            <Link to="/account" className="text-sm text-gray-400 hover:text-amber-400 transition">
              &larr; Back to Account or Choose Pick-up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryLocationPage;