// API Key proporcionada para el ejercicio académico.
const API_KEY = "NUFVETJV68ZJGD7M8JGAFLWVT";
const BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

const form = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");
const refreshBtn = document.getElementById("refreshBtn");
const statusText = document.getElementById("status");
const currentCard = document.getElementById("currentCard");
const hourlySection = document.getElementById("hourlySection");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(locationInput.value.trim());
});

refreshBtn.addEventListener("click", () => {
  loadWeather(locationInput.value.trim());
});

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weatherEmoji(icon) {
  const icons = {
    "clear-day": "☀️", "clear-night": "🌙",
    "partly-cloudy-day": "🌤️", "partly-cloudy-night": "☁️",
    "cloudy": "☁️", "rain": "🌧️", "showers-day": "🌦️",
    "showers-night": "🌧️", "thunder-rain": "⛈️",
    "thunder-showers-day": "⛈️", "thunder-showers-night": "⛈️",
    "snow": "❄️", "fog": "🌫️", "wind": "💨"
  };
  return icons[icon] || "🌡️";
}

function formatHour(datetime) {
  return datetime.slice(0, 5);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

async function loadWeather(location) {
  if (!location) {
    setStatus("Por favor, escribe una ciudad o ubicación.", true);
    return;
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);

  const url = `${BASE_URL}/${encodeURIComponent(location)}/${dateString(start)}/${dateString(end)}?unitGroup=metric&include=hours,current&key=${API_KEY}&contentType=json&lang=es`;

  setStatus("Consultando el pronóstico...");
  refreshBtn.disabled = true;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    showCurrentWeather(data);
    showHourlyWeather(data, now);
    setStatus("Pronóstico actualizado correctamente.");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo consultar el clima. Revisa la ubicación, tu conexión o la API Key. Detalle: " + error.message, true);
    currentCard.classList.add("hidden");
    hourlySection.classList.add("hidden");
  } finally {
    refreshBtn.disabled = false;
  }
}

function showCurrentWeather(data) {
  const current = data.currentConditions || {};
  const locationName = data.resolvedAddress || data.address || "Ubicación consultada";

  document.getElementById("placeName").textContent = locationName;
  document.getElementById("currentDate").textContent = new Date().toLocaleString("es-CO", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("temperature").textContent =
    Number.isFinite(current.temp) ? Math.round(current.temp) : "--";
  document.getElementById("condition").textContent = current.conditions || "Sin descripción";
  document.getElementById("weatherIcon").textContent = weatherEmoji(current.icon);
  document.getElementById("wind").textContent =
    Number.isFinite(current.windspeed) ? `${current.windspeed} km/h` : "Sin datos";
  document.getElementById("rain").textContent =
    Number.isFinite(current.precipprob) ? `${Math.round(current.precipprob)}%` : "Sin datos";
  document.getElementById("humidity").textContent =
    Number.isFinite(current.humidity) ? `${Math.round(current.humidity)}%` : "Sin datos";

  currentCard.classList.remove("hidden");
}

function showHourlyWeather(data, now) {
  const allHours = (data.days || []).flatMap(day =>
    (day.hours || []).map(hour => ({
      ...hour,
      timestamp: new Date(`${day.datetime}T${hour.datetime}:00`)
    }))
  );

  const pastLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const futureLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const past = allHours.filter(hour => hour.timestamp >= pastLimit && hour.timestamp < now)
    .sort((a, b) => b.timestamp - a.timestamp);
  const future = allHours.filter(hour => hour.timestamp >= now && hour.timestamp <= futureLimit)
    .sort((a, b) => a.timestamp - b.timestamp);

  renderHours("pastHours", past, true);
  renderHours("futureHours", future, false);
  hourlySection.classList.remove("hidden");
}

function renderHours(containerId, hours, reverse) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!hours.length) {
    container.textContent = "No hay datos horarios disponibles.";
    return;
  }

  // Se muestran hasta 12 registros por sección para mantener la vista sencilla.
  const selected = hours.filter((_, index) => index % 2 === 0).slice(0, 12);
  selected.forEach(hour => {
    const item = document.createElement("div");
    item.className = "hour";

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = `${hour.timestamp.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} ${formatHour(hour.datetime)}`;

    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = weatherEmoji(hour.icon);

    const description = document.createElement("span");
    description.className = "desc";
    description.textContent = hour.conditions || "Sin descripción";

    const temperature = document.createElement("strong");
    temperature.textContent = Number.isFinite(hour.temp) ? `${Math.round(hour.temp)}°C` : "--";

    item.append(time, icon, description, temperature);
    container.appendChild(item);
  });
}

// Consulta inicial al abrir la aplicación.
loadWeather(locationInput.value.trim());
