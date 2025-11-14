// src/pages/DeliveryLocationPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, MapPin, Loader2, Home, Briefcase } from 'lucide-react'; // --- MODIFIED (Removed unused icons) ---
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useCartStore } from '../store/cartStore'; 
import { supabase } from '../lib/supabaseClient'; 
import { Session } from '@supabase/supabase-js'; 
import { Checkbox } from '@/components/ui/checkbox'; // --- NEW ---

// --- Configuration ---
const RESTAURANT_LAT = 41.72051;
const RESTAURANT_LNG = 44.72121;
const DELIVERY_RADIUS_METERS = 5000;
const TIER_1_BOUNDARY_METERS = 2500;
const TIER_1_FEE = 3;
const TIER_2_FEE = 5;
const MAP_CENTER = { lat: RESTAURANT_LAT, lng: RESTAURANT_LNG };
const MAP_ZOOM = 14;
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '350px',
  borderRadius: '0.375rem',
  border: '1px solid #4B5563',
};
const libraries: ('places' | 'geometry' | 'geocoding' | 'routes')[] = ['places', 'geometry', 'geocoding', 'routes'];
// --- End Configuration ---

interface DeliveryDetails {
  addressText: string;
  gmapsLink: string;
  lat: number;
  lng: number;
  building?: string;
  level?: string;
  unit?: string;
  notes?: string;
  deliveryFee: number;
  contactPhone: string;
}

// --- NEW: Define the structure of a saved address ---
// This now matches your database schema
interface SavedAddress {
  label: string;
  delivery_gmaps_link: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_building?: string | null;
  delivery_level?: string | null;
  delivery_unit?: string | null;
  delivery_notes: string | null;
  delivery_contact_phone: string
  delivery_address: string;
}

const DeliveryLocationPage = () => {
  const navigate = useNavigate();
  const setDeliveryDetailsStore = useCartStore((state) => state.setDeliveryDetails); 
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
  const [gmapsLink, setGmapsLink] = useState('');
  const [building, setBuilding] = useState('');
  const [level, setLevel] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [contactPhone, setContactPhone] = useState('');

  // --- NEW: State for saved addresses ---
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState('');
  // --- End New State ---

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  // --- MODIFIED: This useEffect now also fetches user profile data ---
  useEffect(() => {
    if (isLoaded && window.google) {
      setGeocoder(new google.maps.Geocoder());
      setIsMapLoading(false);
    }

    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // User is logged in, fetch their profile
        const { data: profile, error } = await supabase
          .from('customer_profiles')
          .select('phone, saved_addresses')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
        } else if (profile) {
          // Auto-fill phone number
          if (profile.phone) {
            setContactPhone(profile.phone);
          }
          // Load saved addresses
          if (profile.saved_addresses) {
            setSavedAddresses(profile.saved_addresses as SavedAddress[]);
          }
        }
      }
    };
    fetchUserData();
  }, [isLoaded]);
  // --- End Modification ---

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
    setUserAddress('');
    setGmapsLink('');
    // --- NEW: Reset save fields on new check ---
    setSaveThisAddress(false);
    setSaveAddressLabel('');
    // --- End New ---

    // --- YOUR CORRECT LINK ---
    // Note: This link format looks unusual. A standard Google Maps link is:
    // `https://www.google.com/maps?q=${latLng.lat},${latLng.lng}`
    const link = `https://www.google.com/maps/?q=${latLng.lat},${latLng.lng}&z=18`;
    setGmapsLink(link);

    geocoder.geocode({ location: latLng }, (results, status) => {
      let formattedAddress = `Lat: ${latLng.lat.toFixed(4)}, Lng: ${latLng.lng.toFixed(4)}`;
      if (status === 'OK' && results?.[0]) {
        formattedAddress = results[0].formatted_address;
        setUserAddress(formattedAddress);
      } else {
        setUserAddress(formattedAddress);
        console.warn('Reverse geocode failed:', status);
      }

      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [MAP_CENTER],
          destinations: [latLng],
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, matrixStatus) => {
          setIsLoading(false);
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
            setIsWithinRadius(null);
          }
        }
      );
    });
  }, [isLoaded, geocoder]);

  // --- NEW: Function to handle clicking a saved address ---
  const handleSelectSavedAddress = (address: SavedAddress) => {
    // --- FIX: Handle potential null/undefined values from DB ---
    // State setters expect 'string', but DB fields can be 'string | null'
    const lat = address.delivery_lat || 0;
    const lng = address.delivery_lng || 0;
  
    // 1. Set all the states from the saved address object
    setUserAddress(address.delivery_address ?? '');
    setMarkerPosition({ lat, lng });
    setBuilding(address.delivery_building ?? '');
    setLevel(address.delivery_level ?? '');
    setUnit(address.delivery_unit ?? '');
    setNotes(address.delivery_notes ?? '');
    setContactPhone(address.delivery_contact_phone ?? '');
    setGmapsLink(address.delivery_gmaps_link ?? '');
    
    // 2. Pan the map to the location
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(16);

    // 3. Re-check the distance and fee (in case fees changed)
    // --- FIX: Completed the function call ---
    checkDistanceAndGetAddress({ lat, lng });
  };
  // --- End New Function ---


  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);
  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      setMarkerPosition(newPosition);
      checkDistanceAndGetAddress(newPosition);
    }
  }, [checkDistanceAndGetAddress]);

  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
     if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const newPosition = { lat, lng };
      checkDistanceAndGetAddress(newPosition);
    }
  }, [checkDistanceAndGetAddress]);


  const handleCheckAddress = useCallback(() => {
    if (!userAddress || !geocoder) return;
    setIsLoading(true);
    setErrorMessage('');
    geocoder.geocode({ address: userAddress }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const newPosition = { lat, lng };
        setMarkerPosition(newPosition);
        mapRef.current?.panTo(newPosition);
        mapRef.current?.setZoom(16);
        checkDistanceAndGetAddress(newPosition);
      } else {
        setErrorMessage('Could not find location for the address entered. Please try again or place a pin on the map.');
        setIsLoading(false);
        setMarkerPosition(null);
        setIsWithinRadius(null);
        setDistanceText(null);
        setGmapsLink('');
      }
    });
  }, [userAddress, geocoder, checkDistanceAndGetAddress]);


  // --- MODIFIED: This function now handles saving the address ---
  const handleProceedToOrder = async () => {
    if (isWithinRadius && markerPosition) {
      
      if (!contactPhone.trim() || !building.trim() || !level.trim() || !unit.trim()) {
        setErrorMessage("Please fill in all required fields: Contact Phone, Building, Level, and Unit.");
        return; 
      }
      setErrorMessage(''); 

      const finalAddress = userAddress || `Location (${markerPosition.lat.toFixed(4)}, ${markerPosition.lng.toFixed(4)})`;

      // This object is for the cart store (DeliveryDetails)
      const deliveryData: DeliveryDetails = {
        addressText: finalAddress,
        gmapsLink: gmapsLink,
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        building: building.trim(),
        level: level.trim(),
        unit: unit.trim(),
        notes: notes.trim(),
        deliveryFee: deliveryFee,
        contactPhone: contactPhone.trim()
      };

      // --- NEW: Save address logic ---
      if (session && saveThisAddress) {
        const label = saveAddressLabel.trim();
        if (!label) {
          setErrorMessage("Please provide a label (like 'Home') to save this address.");
          return; // Stop proceeding
        }
        
        // --- FIX: Manually map fields from DeliveryDetails to SavedAddress ---
        // The spread operator ({ ...deliveryData, label }) was incorrect
        // because the property names do not match.
        const newSavedAddress: SavedAddress = {
          label: label,
          delivery_address: deliveryData.addressText,
          delivery_gmaps_link: deliveryData.gmapsLink,
          delivery_lat: deliveryData.lat,
          delivery_lng: deliveryData.lng,
          delivery_building: deliveryData.building,
          delivery_level: deliveryData.level,
          delivery_unit: deliveryData.unit,
          delivery_notes: deliveryData.notes,
          delivery_contact_phone: deliveryData.contactPhone
        };
        // --- End Fix ---
        
        // Check if an address with this label already exists
        const existingIndex = savedAddresses.findIndex(addr => addr.label.toLowerCase() === label.toLowerCase());
        let updatedAddresses: SavedAddress[];

        if (existingIndex > -1) {
          // Replace existing address
          updatedAddresses = savedAddresses.map((addr, index) => 
            index === existingIndex ? newSavedAddress : addr
          );
        } else {
          // Add new address
          updatedAddresses = [...savedAddresses, newSavedAddress];
        }

        // Optimistic UI update
        setSavedAddresses(updatedAddresses);

        // Async update to DB (don't need to await, can happen in background)
        supabase
          .from('customer_profiles')
          .update({ saved_addresses: updatedAddresses })
          .eq('id', session.user.id)
          .then(({ error }) => {
            if (error) {
              console.error("Failed to save address:", error);
              // Optionally: show a non-blocking toast error
            }
          });
      }
      // --- End New Logic ---

      setDeliveryDetailsStore(deliveryData);
      navigate('/order'); 

    } else {
        alert("Please select a valid delivery location within the radius first.");
    }
  };
  // --- End Modification ---


  if (loadError) {
    return <div className="text-red-500 text-center p-8">Error loading Google Maps script. Please check your API key setup and internet connection.</div>;
  }
  if (!isLoaded || isMapLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white"><Loader2 className="animate-spin h-8 w-8 mr-2" /> Loading Map...</div>;
  }


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
        </CardHeader> {/* --- FIX: Removed stray 's' --- */}
        <CardContent className="space-y-6">
          
          {/* --- NEW: Saved Addresses Section --- */}
          {session && savedAddresses.length > 0 && (
            <div className="space-y-2 pb-4 border-b border-gray-700">
              <Label className="text-sm font-medium text-gray-300">Use a Saved Address</Label>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((addr) => (
                  <Button
                    key={addr.label}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                    onClick={() => handleSelectSavedAddress(addr)}
                  >
                    {addr.label === 'Home' && <Home className="w-4 h-4 mr-2" />}
                    {addr.label === 'Work' && <Briefcase className="w-4 h-4 mr-2" />}
                    {addr.label !== 'Home' && addr.label !== 'Work' && <MapPin className="w-4 h-4 mr-2" />}
                    {addr.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* --- End New Section --- */}

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
                  setIsWithinRadius(null);
                  setDistanceText(null);
                  setErrorMessage('');
                  setGmapsLink('');
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
          
          <div className="pt-4 border-t border-gray-700">
               <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-300">
                 Contact Phone Number <span className="text-red-500">*</span>
              </Label>
               <Input
                 id="contactPhone"
                 type="tel"
                 value={contactPhone}
                 onChange={(e) => {
                   setContactPhone(e.target.value);
                   if (errorMessage) setErrorMessage('');
                 }}
                 placeholder="e.g., +995 555 123 456"
                 className="mt-1 bg-gray-700 border-gray-600 text-white"
                 disabled={isLoading}
               />
             </div>

          {/* Detailed Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <Label htmlFor="building" className="text-sm font-medium text-gray-300">
                Building / Villa / Compound <span className="text-red-500">*</span>
              </Label>
              <Input
                id="building"
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g., Tower A, Villa 12"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="level" className="text-sm font-medium text-gray-300">
                Level / Floor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="level"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g., 3rd Floor"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="unit" className="text-sm font-medium text-gray-300">
                Unit / Apt / Office No. <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="e.g., Apt 305, Office 12B"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
            </div>
          </div>
          {/* Optional Notes Field */}
          <div className="pt-4 border-t border-gray-700">
             <Label htmlFor="notes" className="text-sm font-medium text-gray-300">Delivery Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Gate code is 1234, leave at reception"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                disabled={isLoading}
              />
          </div>


          {/* Results Display Area */}
          {isLoading && !errorMessage && (
            <div className="text-center text-amber-400">
                 <Loader2 className="animate-spin h-5 w-5 inline mr-2" />Calculating distance...
            </div>
          )}
          {/* This is the SUCCESS box */}
           {!isLoading && isWithinRadius === true && distanceText !== null && !errorMessage && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-md text-center space-y-4">
            <div>
               <p className="font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Great! You're within the delivery radius.
                </p>
                <p className="text-sm">(Approximately {distanceText} driving distance)</p>
                {gmapsLink && (
                   <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block">
                     View on Google Maps (Opens new tab)
                   </a>
                )}

            </div>

            {/* --- NEW: Save Address Section --- */}
            {session && (
              <div className="space-y-3 pt-4 border-t border-green-700/50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-address"
                    checked={saveThisAddress}
                    onCheckedChange={(checked) => setSaveThisAddress(!!checked)}
                    className="border-gray-400"
                  />
                  <Label htmlFor="save-address" className="text-gray-300">
                    Save this address for next time?
                  </Label>
                </div>
                {saveThisAddress && (
                  <div className="flex gap-2">
                    <Input
                      id="save-label"
                      value={saveAddressLabel}
                      onChange={(e) => setSaveAddressLabel(e.target.value)}
                      placeholder="Label (e.g., Home, Work)"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                     onClick={() => setSaveAddressLabel('Home')}                 
                    >
                      <Home className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 border-gray-600 hover:bg-gray-600"

                      onClick={() => setSaveAddressLabel('Work')}
                      >        
                      <Briefcase className="w-4 h-4" />
                   </Button>
                  </div>
                )}
              </div>
            )}
            {/* --- End New Section --- */}
            
              <Button
                onClick={handleProceedToOrder}

                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
              >
                Confirm Address & Add ₾{deliveryFee.toFixed(2)} Delivery Fee
              </Button>
            </div>
          )}
          {/* This is the OUT OF ZONE error box */}
          {!isLoading && isWithinRadius === false && errorMessage && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">
              <p className="font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" /> Outside Delivery Zone

              </p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          )}
          {!isLoading && errorMessage && isWithinRadius !== false && (
             <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">

               <p className="font-semibold flex items-center justify-center gap-2">
                 <AlertCircle className="w-5 h-5" /> Error
               </p>
               <p className="text-sm mt-1">{errorMessage}</p>
             </div> 
          )}

          {/* Back Link */}
          <div className="text-center pt-4 border-t border-gray-700">

            <Link to={session ? "/account" : "/"} className="text-sm text-gray-400 hover:text-amber-400 transition">
              ← Back to {session ? "Account" : "Home"} or Choose Pick-up
            </Link>
          </div>
        </CardContent>
      </Card>

 </div>
  );
};

export default DeliveryLocationPage;