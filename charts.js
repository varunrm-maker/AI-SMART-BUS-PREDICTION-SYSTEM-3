/**
 * SmartBus AI Analytics & Chart.js Engine
 * 
 * Provides interactive, hardware-accelerated time-series and comparative
 * crowd density visualizations with built-in error boundary protections,
 * canvas memory lifecycle cleanup, and graceful fallback rendering.
 * 
 * @module ChartEngine
 * @author SmartBus AI Engineering Team
 * @version 2.0.0
 */

/**
 * References to active Chart.js instances to allow idempotent teardown
 * and prevent memory leaks on SPA view switches.
 * @type {Object|null}
 */
let hourlyChart = null;
let routeChart = null;

const ChartEngine = {
  /**
   * Renders the 24-hour crowd prediction trend curve for a selected regional route.
   * Encapsulated in a defensive try/catch boundary to isolate rendering failures.
   * 
   * @param {string} canvasId - DOM element ID for the target HTML5 canvas
   * @param {string} [datasetKey="salemOmalurTrend"] - Key in AI_PREDICTIONS map
   * @returns {void}
   */
  renderHourlyCrowdChart: function(canvasId, datasetKey = "salemOmalurTrend") {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn(`[ChartEngine] Canvas target '#${canvasId}' not found in DOM.`);
        return;
      }

      // Fallback if Chart.js CDN failed or was blocked by network/ad-blocker
      if (!window.Chart) {
        this.renderCanvasFallback(canvas, "AI Hourly Crowd Forecast", "Chart.js engine not loaded. Please verify CDN connectivity.");
        return;
      }

      // Safely destroy existing chart instance to prevent canvas recreation collisions
      if (hourlyChart) {
        hourlyChart.destroy();
        hourlyChart = null;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Unable to obtain 2D rendering context for hourly chart canvas.");
      }

      // Generate dynamic vertical gradient fill for dark glassmorphism
      const gradientIndigo = ctx.createLinearGradient(0, 0, 0, 300);
      gradientIndigo.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
      gradientIndigo.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      // Validate dataset availability with defensive fallback
      const dataValues = (typeof AI_PREDICTIONS !== 'undefined' && AI_PREDICTIONS[datasetKey]) 
        ? AI_PREDICTIONS[datasetKey] 
        : [25, 20, 18, 15, 22, 45, 78, 92, 88, 65, 52, 48, 55, 62, 70, 85, 95, 88, 72, 60, 48, 38, 30, 25];

      const hourLabels = (typeof AI_PREDICTIONS !== 'undefined' && AI_PREDICTIONS.hours)
        ? AI_PREDICTIONS.hours
        : ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

      hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: hourLabels,
          datasets: [{
            label: 'Predicted Crowd %',
            data: dataValues,
            borderColor: '#6366f1',
            borderWidth: 3,
            backgroundColor: gradientIndigo,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#818cf8',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#38bdf8',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return ` Predicted Occupancy: ${context.raw}%`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 11 }
              }
            },
            y: {
              min: 0,
              max: 100,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 11 },
                callback: function(value) { return value + '%'; }
              }
            }
          }
        }
      });
    } catch (err) {
      console.error("[ChartEngine] Error rendering hourly crowd chart:", err);
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        this.renderCanvasFallback(canvas, "Hourly Crowd Trend Unavailable", err.message);
      }
    }
  },

  /**
   * Renders a comparative bar chart illustrating instantaneous bus route occupancy.
   * Color-coded dynamically into Green (<45%), Amber (45-79%), and Red (>=80%).
   * 
   * @param {string} canvasId - DOM element ID of the target canvas
   * @param {Array<Object>} buses - List of bus model objects
   * @returns {void}
   */
  renderRouteComparisonChart: function(canvasId, buses = []) {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn(`[ChartEngine] Canvas target '#${canvasId}' not found.`);
        return;
      }

      if (!window.Chart) {
        this.renderCanvasFallback(canvas, "Route Comparison Chart", "Chart.js engine not loaded.");
        return;
      }

      if (!Array.isArray(buses) || buses.length === 0) {
        this.renderCanvasFallback(canvas, "No Fleet Data", "No active buses available for comparison.");
        return;
      }

      if (routeChart) {
        routeChart.destroy();
        routeChart = null;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Unable to obtain 2D rendering context for route comparison canvas.");
      }

      const labels = buses.map(b => b.busNumber || b.id || "Bus");
      const crowdPercents = buses.map(b => {
        if (typeof calculateCrowdStatus === 'function') {
          return calculateCrowdStatus(b.occupiedSeats, b.capacity).percent;
        }
        return Math.min(100, Math.round(((b.occupiedSeats || 0) / (b.capacity || 50)) * 100));
      });

      const barColors = crowdPercents.map(p => 
        p >= 80 ? 'rgba(239, 68, 68, 0.85)' : 
        p >= 45 ? 'rgba(245, 158, 11, 0.85)' : 
                  'rgba(16, 185, 129, 0.85)'
      );

      routeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Current Occupancy %',
            data: crowdPercents,
            backgroundColor: barColors,
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#e2e8f0',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: function(ctx) {
                  return ` Occupancy: ${ctx.raw}%`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans', size: 11 },
                callback: function(val) { return val + '%'; }
              }
            }
          }
        }
      });
    } catch (err) {
      console.error("[ChartEngine] Error rendering route comparison chart:", err);
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        this.renderCanvasFallback(canvas, "Comparison Visualization Unavailable", err.message);
      }
    }
  },

  /**
   * Defensive fallback renderer when canvas rendering fails or dependencies are offline.
   * 
   * @param {HTMLCanvasElement} canvas - Target canvas element to replace
   * @param {string} title - Fallback card header title
   * @param {string} message - User-friendly error or diagnostic detail
   * @returns {void}
   */
  renderCanvasFallback: function(canvas, title, message) {
    if (!canvas || !canvas.parentElement) return;
    canvas.style.display = 'none';

    // Remove any previously injected fallback
    const prevFallback = canvas.parentElement.querySelector('.chart-fallback-card');
    if (prevFallback) prevFallback.remove();

    const fallback = document.createElement('div');
    fallback.className = 'chart-fallback-card p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full min-h-[160px] bg-slate-900/50 rounded-xl border border-white/5';
    fallback.innerHTML = `
      <i class="fas fa-chart-line text-2xl text-indigo-400/60 mb-2"></i>
      <span class="font-semibold text-slate-300">${title}</span>
      <p class="text-[11px] text-slate-500 mt-1 max-w-xs">${message}</p>
    `;
    canvas.parentElement.appendChild(fallback);
  }
};

// Export to window global scope for browser runtime and Node/testing environments
if (typeof window !== 'undefined') {
  window.ChartEngine = ChartEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChartEngine };
}
