// DOM Elements
const searchForm = document.getElementById('search-form');
const locationInput = document.getElementById('location-input');
const locationBtn = document.getElementById('location-btn');
const loadingSpinner = document.getElementById('loading');
const weatherDisplay = document.getElementById('weather-display');
const outfitDisplay = document.getElementById('outfit-display');
const errorMessage = document.getElementById('error-message');
const bgGradient = document.getElementById('bg-gradient');

// WMO Weather interpretation codes
const WEATHER_CODES = {
    0: { label: 'Clear Sky', icon: 'ph-sun', theme: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)' }, // Warm sunny
    1: { label: 'Mainly Clear', icon: 'ph-cloud-sun', theme: 'linear-gradient(135deg, #74ebd5 0%, #9face6 100%)' },
    2: { label: 'Partly Cloudy', icon: 'ph-cloud-sun', theme: 'linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%)' },
    3: { label: 'Overcast', icon: 'ph-cloud', theme: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)' },
    45: { label: 'Fog', icon: 'ph-cloud-fog', theme: 'linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)' },
    48: { label: 'Depositing Rime Fog', icon: 'ph-cloud-fog', theme: 'linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)' },
    51: { label: 'Light Drizzle', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' },
    53: { label: 'Moderate Drizzle', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' },
    55: { label: 'Dense Drizzle', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' },
    61: { label: 'Slight Rain', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #005AA7 0%, #FFFDE4 100%)' },
    63: { label: 'Moderate Rain', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #1cb5e0 0%, #000046 100%)' },
    65: { label: 'Heavy Rain', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #1cb5e0 0%, #000046 100%)' },
    71: { label: 'Slight Snow', icon: 'ph-cloud-snow', theme: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)' },
    73: { label: 'Moderate Snow', icon: 'ph-cloud-snow', theme: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)' },
    75: { label: 'Heavy Snow', icon: 'ph-cloud-snow', theme: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)' },
    80: { label: 'Slight Rain Showers', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #1cb5e0 0%, #000046 100%)' },
    81: { label: 'Moderate Rain Showers', icon: 'ph-cloud-rain', theme: 'linear-gradient(135deg, #1cb5e0 0%, #000046 100%)' },
    82: { label: 'Violent Rain Showers', icon: 'ph-cloud-lightning', theme: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' },
    95: { label: 'Thunderstorm', icon: 'ph-cloud-lightning', theme: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    96: { label: 'Thunderstorm with Hail', icon: 'ph-cloud-lightning', theme: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    99: { label: 'Thunderstorm with Heavy Hail', icon: 'ph-cloud-lightning', theme: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }
};

// Outfit configuration
const CLOTHING_ITEMS = {
    tshirt: { icon: 'ph-t-shirt', label: 'T-Shirt' },
    shorts: { icon: 'ph-shorts', label: 'Shorts' },
    sunglasses: { icon: 'ph-sunglasses', label: 'Sunglasses' },
    cap: { icon: 'ph-baseball-cap', label: 'Cap' },
    jeans: { icon: 'ph-pants', label: 'Jeans' },
    hoodie: { icon: 'ph-hoodie', label: 'Hoodie' },
    jacket: { icon: 'ph-coat-hanger', label: 'Light Jacket' },
    winter_coat: { icon: 'ph-coat-hanger', label: 'Winter Coat' }, // Phosphor lacks a perfect winter coat, using hanger or shirt as proxy
    beanie: { icon: 'ph-baseball-cap', label: 'Beanie' },
    umbrella: { icon: 'ph-umbrella', label: 'Umbrella' },
    boots: { icon: 'ph-boot', label: 'Boots' },
    sneakers: { icon: 'ph-sneaker', label: 'Sneakers' }
};

// Handle Search
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = locationInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
});

// Handle Geolocation
locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        loadingSpinner.style.display = 'flex';
        weatherDisplay.style.display = 'none';
        outfitDisplay.style.display = 'none';
        errorMessage.style.display = 'none';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude, "Your Location");
            },
            (err) => {
                showError("Unable to access location. Please search manually.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        // Step 1: Geocoding via Open-Meteo API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }
        
        const loc = geoData.results[0];
        const cityName = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}`;
        
        // Step 2: Fetch Weather
        await fetchWeatherByCoords(loc.latitude, loc.longitude, cityName);
        
    } catch (error) {
        showError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon, cityName) {
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`);
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        updateUI(cityName, current.temperature_2m, current.weather_code, current.wind_speed_10m);
    } catch (error) {
        showError("Failed to fetch weather data.");
    }
}

function updateUI(cityName, temp, code, wind) {
    const weatherInfo = WEATHER_CODES[code] || { label: 'Unknown', icon: 'ph-cloud', theme: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' };
    
    // Hide Loading
    loadingSpinner.style.display = 'none';
    
    // Update Theme Background
    bgGradient.style.background = weatherInfo.theme;
    
    // Update Weather Data
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('weather-description').textContent = weatherInfo.label;
    document.getElementById('temperature').textContent = `${Math.round(temp)}°C`;
    document.getElementById('main-weather-icon').className = `ph ${weatherInfo.icon} weather-icon`;
    document.getElementById('wind-speed').textContent = `${wind} km/h`;
    
    // Generate and inject Outfit Logic
    generateOutfit(temp, code);
    
    // Show Sections
    weatherDisplay.style.display = 'block';
    outfitDisplay.style.display = 'block';
}

function generateOutfit(temp, weatherCode) {
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
    const isSnowing = [71, 73, 75].includes(weatherCode);
    
    let items = [];
    let message = "";
    
    if (temp >= 25) {
        // Hot
        items = ['tshirt', 'shorts', 'sunglasses', 'sneakers'];
        message = "It's hot outside! Keep it light and stay hydrated.";
    } else if (temp >= 15 && temp < 25) {
        // Mild / Warm
        items = ['tshirt', 'jeans', 'sneakers'];
        if (temp < 20) items.push('jacket'); // light jacket
        message = "Perfect, mild weather. A comfortable casual outfit holds up great.";
    } else if (temp >= 5 && temp < 15) {
        // Cool
        items = ['hoodie', 'jeans', 'sneakers'];
        message = "It's a bit chilly! Wear layers to stay comfortable.";
    } else {
        // Cold
        items = ['winter_coat', 'jeans', 'beanie', 'boots'];
        message = "Brrr! Bundle up warmly, it's freezing out there.";
    }
    
    // Add weather specific accessories
    if (isRaining) {
        items.push('umbrella');
        message += " Grab an umbrella, expect rain!";
    }
    if (isSnowing) {
        message += " Watch your step in the snow!";
    }
    
    const container = document.getElementById('outfit-items');
    container.innerHTML = ''; // Clear old items
    
    items.forEach(key => {
        const item = CLOTHING_ITEMS[key];
        if (item) {
            const div = document.createElement('div');
            div.className = 'outfit-card';
            div.innerHTML = `
                <i class="ph ${item.icon}"></i>
                <span>${item.label}</span>
            `;
            container.appendChild(div);
        }
    });
    
    document.getElementById('outfit-message').textContent = message;
}

function showLoading() {
    weatherDisplay.style.display = 'none';
    outfitDisplay.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSpinner.style.display = 'flex';
}

function showError(msg) {
    loadingSpinner.style.display = 'none';
    weatherDisplay.style.display = 'none';
    outfitDisplay.style.display = 'none';
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
}

// Initial default city on load
fetchWeatherByCity("New York");
