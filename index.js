const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
  
      const data = await response.json();
  
      if (!data.address) return "Unknown location";
  
      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        "Unknown City";
  
      const state = data.address.state || "Unknown State";
  
      return `${city}, ${state}`;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return "Location unavailable";
    }
  };
  
  (async () => {
    console.log(await reverseGeocode(20.9565, 77.7560));
  })();
  