const apiKey = '07215a898f56e101d48d7198283d5e30'; // Replace with your actual API key

document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('search-btn').addEventListener('click', getWeather);
    document.getElementById('city').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
    
    // Load weather for default city
    document.getElementById('city').value = 'London';
    getWeather();
});

async function getWeather() {
    const city = document.getElementById('city').value.trim();
    const weatherContainer = document.getElementById('weather-container');

    if (!city) {
        showError('Please enter a city');
        return;
    }

    weatherContainer.classList.add('loading');

    try {
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found');
        }

        const [currentData, forecastData] = await Promise.all([
            currentResponse.json(),
            forecastResponse.json()
        ]);

        displayWeather(currentData);
        displayHourlyForecast(forecastData.list);
        displayDailyForecast(forecastData.list);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('City not found. Please try again.');
    } finally {
        weatherContainer.classList.remove('loading');
    }
}

function displayWeather(data) {
    const tempDivInfo = document.getElementById('temp-div');
    const weatherInfoDiv = document.getElementById('weather-info');
    const weatherIcon = document.getElementById('weather-icon');
    const extraInfoDiv = document.getElementById('extra-info');

    // Clear previous content
    weatherInfoDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';
    extraInfoDiv.innerHTML = '';

    const cityName = data.name;
    const country = data.sys.country;
    const temperature = Math.round(data.main.temp - 273.15);
    const feelsLike = Math.round(data.main.feels_like - 273.15);
    const description = capitalizeFirstLetter(data.weather[0].description);
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    const humidity = data.main.humidity;
    const windSpeed = (data.wind.speed * 3.6).toFixed(1); // Convert m/s to km/h
    const pressure = data.main.pressure;
    const visibility = (data.visibility / 1000).toFixed(1); // Convert meters to km

    tempDivInfo.innerHTML = `<p>${temperature}°C</p>`;
    weatherInfoDiv.innerHTML = `
        <p>${cityName}, ${country}</p>
        <p>${description}</p>
    `;
    weatherIcon.src = iconUrl;
    weatherIcon.alt = description;
    weatherIcon.style.display = 'block';

    extraInfoDiv.innerHTML = `
        <div class="extra-info-item">
            <i class="fas fa-temperature-low"></i>
            <p>Feels Like</p>
            <p>${feelsLike}°C</p>
        </div>
        <div class="extra-info-item">
            <i class="fas fa-tint"></i>
            <p>Humidity</p>
            <p>${humidity}%</p>
        </div>
        <div class="extra-info-item">
            <i class="fas fa-wind"></i>
            <p>Wind</p>
            <p>${windSpeed} km/h</p>
        </div>
        <div class="extra-info-item">
            <i class="fas fa-tachometer-alt"></i>
            <p>Pressure</p>
            <p>${pressure} hPa</p>
        </div>
        <div class="extra-info-item">
            <i class="fas fa-eye"></i>
            <p>Visibility</p>
            <p>${visibility} km</p>
        </div>
    `;
}

function displayHourlyForecast(hourlyData) {
    const hourlyForecastDiv = document.getElementById('hourly-forecast');
    hourlyForecastDiv.innerHTML = '';

    const next24Hours = hourlyData.slice(0, 8);

    next24Hours.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        const hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp - 273.15);
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
        const description = capitalizeFirstLetter(item.weather[0].description);

        const hourlyItemHtml = `
            <div class="hourly-item">
                <span>${hour}:00</span>
                <img src="${iconUrl}" alt="${description}" title="${description}">
                <span>${temperature}°C</span>
            </div>
        `;

        hourlyForecastDiv.innerHTML += hourlyItemHtml;
    });
}

function displayDailyForecast(forecastData) {
    const dailyForecastDiv = document.getElementById('daily-forecast');
    dailyForecastDiv.innerHTML = '';

    // Group forecast data by day
    const dailyData = {};
    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dailyData[day]) {
            dailyData[day] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyData[day].temps.push(item.main.temp - 273.15);
        dailyData[day].icons.push(item.weather[0].icon);
        dailyData[day].descriptions.push(item.weather[0].description);
    });

    // Process each day's data
    Object.keys(dailyData).slice(0, 5).forEach(day => {
        const dayData = dailyData[day];
        const minTemp = Math.round(Math.min(...dayData.temps));
        const maxTemp = Math.round(Math.max(...dayData.temps));
        // Use the most frequent icon or the first one
        const iconCode = dayData.icons[Math.floor(dayData.icons.length / 2)];
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
        const description = capitalizeFirstLetter(dayData.descriptions[0]);

        const dailyItemHtml = `
            <div class="daily-item">
                <span>${day}</span>
                <img src="${iconUrl}" alt="${description}" title="${description}">
                <span>${minTemp}° / ${maxTemp}°</span>
            </div>
        `;

        dailyForecastDiv.innerHTML += dailyItemHtml;
    });
}

function showError(message) {
    const weatherInfoDiv = document.getElementById('weather-info');
    weatherInfoDiv.innerHTML = `<p class="error">${message}</p>`;
    
    // Clear other sections
    document.getElementById('temp-div').innerHTML = '';
    document.getElementById('extra-info').innerHTML = '';
    document.getElementById('hourly-forecast').innerHTML = '';
    document.getElementById('daily-forecast').innerHTML = '';
    document.getElementById('weather-icon').style.display = 'none';
}

function capitalizeFirstLetter(string) {
    return string.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}