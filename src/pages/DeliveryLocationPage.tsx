// src/pages/DeliveryLocationPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // ** Import Label **
import { Textarea } from '@/components/ui/textarea'; // ** Import Textarea **
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

// --- NEW: Define state structure for ALL address details ---
interface DeliveryDetails {
  addressText: string;
  gmapsLink: string;
  lat: number;
  lng: number;
  building?: string;
  level?: string;
  unit?: string;
  notes?: string;
  deliveryFee: number; // Added fee here
}

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
  const [deliveryFee, setDeliveryFee] = useState(0);

  // --- NEW: State for the Google Maps link ---
  const [gmapsLink, setGmapsLink] = useState('');
  // --- NEW: State for detailed address fields ---
  const [building, setBuilding] = useState('');
  const [level, setLevel] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');

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

  // --- UPDATED: Utility: Check Distance & Generate Link ---
  const checkDistanceAndGetAddress = useCallback((latLng: { lat: number; lng: number }) => {
    if (!isLoaded || !window.google || !geocoder || !latLng) {
      console.warn("Google Maps script or geocoder not ready or LatLng missing.");
      setErrorMessage("Map service not ready. Please wait or try again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsWithinRadius(null);
    setDistanceText(null);
    setDeliveryFee(0);
    setUserAddress(''); // Reset address text while checking
    setGmapsLink(''); // Reset link

    // --- Generate Google Maps Link ---
    const link = `https://www.google.com/maps?q=latitude,longitudez=18`;
    setGmapsLink(link); // Set the link state

    // --- Geocode to get address text ---
    geocoder.geocode({ location: latLng }, (results, status) => {
      let formattedAddress = `Lat: ${latLng.lat.toFixed(4)}, Lng: ${latLng.lng.toFixed(4)}`; // Fallback address
      if (status === 'OK' && results?.[0]) {
        formattedAddress = results[0].formatted_address;
        setUserAddress(formattedAddress); // Set the address text state
      } else {
        setUserAddress(formattedAddress); // Set fallback address
        console.warn('Reverse geocode failed:', status);
      }

      // --- Check Distance using Distance Matrix ---
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [MAP_CENTER],
          destinations: [latLng],
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, matrixStatus) => {
          setIsLoading(false); // Stop loading indicator here
          if (matrixStatus === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
            const element = response.rows[0].elements[0];
            const distanceInMeters = element.distance.value;
            const distanceKm = (distanceInMeters / 1000).toFixed(1);

            setDistanceText(`${distanceKm} km`);
            const within = distanceInMeters <= DELIVERY_RADIUS_METERS;
            setIsWithinRadius(within);

            if (within) {
              if (distanceInMeters <= TIER_1_BOUNDARY_METERS) {
                setDeliveryFee(TIER_1_FEE);
              } else {
                setDeliveryFee(TIER_2_FEE);
              }
            } else {
              setDeliveryFee(0);
              setErrorMessage(`Sorry, that location is approximately ${distanceKm}km driving distance away, outside our ${DELIVERY_RADIUS_METERS / 1000}km radius.`);
            }
          } else {
            setErrorMessage('Could not calculate driving distance. Please check the location or try again.');
            console.error('Distance Matrix failed:', matrixStatus, response);
            setIsWithinRadius(null); // Explicitly set to null on failure
          }
        }
      ); // End Distance Matrix call
    }); // End Geocoder call
  }, [isLoaded, geocoder]); // Depend on isLoaded and geocoder


  // --- Map Event Handlers ---
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition); // Update marker position state
      checkDistanceAndGetAddress(newPosition); // Trigger check
    }
  }, [checkDistanceAndGetAddress]); // Use the combined function

  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
     if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      // No need to setMarkerPosition here, it happens visually.
      // We just need to trigger the check based on the new final position.
      checkDistanceAndGetAddress(newPosition); // Trigger check
    }
  }, [checkDistanceAndGetAddress]); // Use the combined function


  // --- Address Input Geocoding ---
  const handleCheckAddress = useCallback(() => {
    if (!userAddress || !geocoder) return;
    setIsLoading(true); // Set loading for this action too
    setErrorMessage('');
    geocoder.geocode({ address: userAddress }, (results, status) => {
      // Keep setIsLoading(true) until Distance Matrix finishes
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const newPosition = { lat, lng };
        // Update marker FIRST
        setMarkerPosition(newPosition);
        // Pan map
        mapRef.current?.panTo(newPosition);
        mapRef.current?.setZoom(16);
        // THEN check distance and reverse geocode
        checkDistanceAndGetAddress(newPosition);
      } else {
        setErrorMessage('Could not find location for the address entered. Please try again or place a pin on the map.');
        setIsLoading(false); // Stop loading on error
        setMarkerPosition(null);
        setIsWithinRadius(null);
        setDistanceText(null);
        setGmapsLink(''); // Clear link on error
      }
    });
  }, [userAddress, geocoder, checkDistanceAndGetAddress]);


  // --- Navigation ---
  const handleProceedToOrder = () => {
    // Check using markerPosition as the source of truth for coordinates
    if (isWithinRadius && markerPosition) {
      // Ensure address text reflects the marker position if it was dragged/clicked last
      const finalAddress = userAddress || `Location (${markerPosition.lat.toFixed(4)}, ${markerPosition.lng.toFixed(4)})`;

      // --- UPDATED: Gather all details ---
      const deliveryDetails: DeliveryDetails = {
        addressText: finalAddress,
        gmapsLink: gmapsLink, // Pass the link
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        building: building.trim(), // Pass new fields
        level: level.trim(),
        unit: unit.trim(),
        notes: notes.trim(),
        deliveryFee: deliveryFee // Pass the fee
      };

      navigate('/order', {
        state: {
          isDelivery: true,
          deliveryDetails: deliveryDetails // Pass the complete object
        }
      });
    } else {
        alert("Please select a valid delivery location within the radius first.");
    }
  };


  // --- Loading/Error states ---
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

          {/* Map */}
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

          {/* Address Input */}
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
                  // Reset status when user types new address
                  setIsWithinRadius(null);
                  setDistanceText(null);
                  setErrorMessage('');
                  setGmapsLink(''); // Clear link too
                  // Optionally clear marker or keep it? Depends on desired UX
                  // setMarkerPosition(null);
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

          {/* --- NEW: Detailed Address Fields --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <Label htmlFor="building" className="text-sm font-medium text-gray-300">Building / Villa / Compound</Label>
              <Input
                id="building"
                value={building} // Link to state variable
                onChange={(e) => setBuilding(e.target.value)} // Link to state setter
                placeholder="e.g., Tower A, Villa 12"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading} // Optionally disable while loading distance
              />
            </div>
            <div>
              <Label htmlFor="level" className="text-sm font-medium text-gray-300">Level / Floor</Label>
              <Input
                id="level"
                value={level} // Link to state variable
                onChange={(e) => setLevel(e.target.value)} // Link to state setter
                placeholder="e.g., 3rd Floor"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="unit" className="text-sm font-medium text-gray-300">Unit / Apt / Office No.</Label>
              <Input
                id="unit"
                value={unit} // Link to state variable
                onChange={(e) => setUnit(e.target.value)} // Link to state setter
                placeholder="e.g., Apt 305, Office 12B"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
            </div>
          </div>
          {/* --- NEW: Optional Notes Field --- */}
          <div className="pt-4 border-t border-gray-700">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-300">Delivery Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes} // Link to state variable
                onChange={(e) => setNotes(e.target.value)} // Link to state setter
                placeholder="e.g., Gate code is 1234, leave at reception"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
          </div>
          {/* --- END: New Fields --- */}


          {/* --- Results Display Area --- */}
          {isLoading && !errorMessage && (
            <div className="text-center text-amber-400">
                 <Loader2 className="animate-spin h-5 w-5 inline mr-2" />Calculating distance...
            </div>
          )}
          {!isLoading && isWithinRadius === true && distanceText !== null && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-md text-center space-y-3">
              <p className="font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Great! You're within the delivery radius.
              </p>
              <p className="text-sm">(Approximately {distanceText} driving distance)</p>
              {/* Display the generated link for confirmation */}
              {gmapsLink && (
                 <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block">
                    View on Google Maps (Opens new tab)
                 </a>
              )}
              <Button
                onClick={handleProceedToOrder}
                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
              >
                Confirm Address & Add ₾{deliveryFee.toFixed(2)} Delivery Fee
              </Button>
            </div>
          )}
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

          {/* Back Link */}
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